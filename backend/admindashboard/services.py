# admindashboard/services.py
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from django.db.models import Count, Q, Sum
from django.utils.timezone import now
from django.db import transaction

# Import your real models (adjust import paths if your apps/models differ)
from data_collection.models import HealthReport, ClinicReport, NgoSurvey, Village
from prediction.models import EarlyWarningAlert  # rbalert source
from .models import VillageDashboard

# ---------- Helper utilities ----------
def normalize_symptom(s: str) -> str:
    s = s.strip().lower()
    # map common synonyms
    mappings = {
        "vomiting": "vomiting",
        "diarrhea": "diarrhea",
        "diarrhoea": "diarrhea",
        "fever": "fever",
        "cough": "cough",
        "typhoid": "typhoid",
        "cholera": "cholera",
        "headache": "headache",
    }
    return mappings.get(s, s)

def parse_symptoms_text(txt: str):
    """
    Accepts a free-text field from HealthReport.symptoms and returns list of normalized tokens.
    Splits by comma, semicolon, newline, or 'and'
    """
    if not txt:
        return []
    separators = [",", ";", "\n", " and "]
    tmp = txt
    for sep in separators:
        tmp = tmp.replace(sep, ",")
    parts = [p.strip() for p in tmp.split(",") if p.strip()]
    return [normalize_symptom(p) for p in parts]

# ---------- Core aggregator ----------
def aggregate_for_village(village_obj: Village, months_back: int = 6):
    """
    Aggregate data for one village and upsert into VillageDashboard.
    months_back: how far back to pull for monthly trend and counts.
    """
    end_dt = now()
    start_dt = end_dt - timedelta(days=30 * months_back)

    # 1) HealthReports for this village
    hq = HealthReport.objects.filter(village_id=village_obj.village_id, created_at__gte=start_dt, created_at__lte=end_dt)
    health_count = hq.count()

    # Parse symptoms and severity
    symptom_counter = Counter()
    severity_counter = Counter()
    monthly_counter = Counter()

    for hr in hq.iterator():
        # Symptoms
        for tok in parse_symptoms_text(hr.symptoms):
            symptom_counter[tok] += 1

        # Severity
        sev = getattr(hr, "severity", None)
        if sev:
            severity_counter[sev] += 1

        # Monthly trend key
        dt = hr.date_of_reporting if getattr(hr, "date_of_reporting", None) else hr.created_at
        if dt:
            key = dt.strftime("%Y-%m")
            monthly_counter[key] += 1

    # 2) Clinic reports aggregates (they have numeric fields)
    cq = ClinicReport.objects.filter(village=village_obj, created_at__gte=start_dt, created_at__lte=end_dt)
    clinic_agg = cq.aggregate(
        typhoid_sum=Sum("typhoid_cases"),
        fever_sum=Sum("fever_cases"),
        diarrhea_sum=Sum("diarrhea_cases"),
        cholera_sum=Sum("cholera_cases"),
        hospitalized_sum=Sum("hospitalized_cases"),
        deaths_sum=Sum("deaths_reported"),
    )
    # safely convert None -> 0
    clinic_counts = {k: (clinic_agg.get(k) or 0) for k in clinic_agg}

    # add clinic counts into symptom_counter (map field names -> symptom keys)
    symptom_counter["typhoid"] += clinic_counts["typhoid_sum"]
    symptom_counter["fever"] += clinic_counts["fever_sum"]
    symptom_counter["diarrhea"] += clinic_counts["diarrhea_sum"]
    symptom_counter["cholera"] += clinic_counts["cholera_sum"]

    # Add clinic monthly cases too (if clinic has created_at)
    for cr in cq.iterator():
        # sum the numeric cases to monthly trend
        total_cases_this_clinic = (cr.typhoid_cases or 0) + (cr.fever_cases or 0) + (cr.diarrhea_cases or 0) + (cr.cholera_cases or 0)
        if cr.created_at:
            monthly_counter[cr.created_at.strftime("%Y-%m")] += total_cases_this_clinic

    # 3) NGO surveys aggregates
    nq = NgoSurvey.objects.filter(village=village_obj, created_at__gte=start_dt, created_at__lte=end_dt)
    ngo_agg = nq.aggregate(
        typhoid_sum=Sum("typhoid_cases"),
        fever_sum=Sum("fever_cases"),
        diarrhea_sum=Sum("diarrhea_cases"),
        awareness_any=Count("id", filter=Q(awareness_campaigns=True))
    )
    ngo_counts = {k: (ngo_agg.get(k) or 0) for k in ngo_agg}
    symptom_counter["typhoid"] += ngo_counts["typhoid_sum"]
    symptom_counter["fever"] += ngo_counts["fever_sum"]
    symptom_counter["diarrhea"] += ngo_counts["diarrhea_sum"]

    # 4) Rule-based alerts (raw text) - get latest for village
    latest_rb = EarlyWarningAlert.objects.filter(
        village_name__iexact=village_obj.village_name
    ).order_by("-created_at").first()
    latest_rb_text = latest_rb.rbalert if latest_rb else ""

    # 5) Compose final numbers
    # Total cases: healthreport rows + clinic sums + ngo sums (you can tune to avoid double counting)
    clinic_sum_cases = sum([clinic_counts["typhoid_sum"], clinic_counts["fever_sum"], clinic_counts["diarrhea_sum"], clinic_counts["cholera_sum"]])
    ngo_sum_cases = sum([ngo_counts["typhoid_sum"], ngo_counts["fever_sum"], ngo_counts["diarrhea_sum"]])
    total_cases = health_count + clinic_sum_cases + ngo_sum_cases

    total_deaths = clinic_counts["deaths_sum"] or 0
    hospitalized_cases = clinic_counts["hospitalized_sum"] or 0

    # 6) severity distribution -> convert counts to percentages (if desired)
    total_severity_reports = sum(severity_counter.values()) or 1
    severity_pct = {
        k: round((v / total_severity_reports) * 100, 1)
        for k, v in severity_counter.items()
    }

    # 7) monthly trend -> sort last months_back months
    # ensure keys for each month exist for continuity
    months = []
    for i in range(months_back - 1, -1, -1):
        dt = end_dt - timedelta(days=30 * i)
        months.append(dt.strftime("%Y-%m"))
    monthly_trend = {m: monthly_counter.get(m, 0) for m in months}

    # 8) risk score calculation (tweakable)
    # Simple formula: base from severity + scale from case counts + environment flags
    severe_count = severity_counter.get("Severe", 0)
    moderate_count = severity_counter.get("Moderate", 0)
    mild_count = severity_counter.get("Mild", 0)
    # severity_score (0-100)
    severity_score = min(100, (severe_count * 3 + moderate_count * 2 + mild_count * 1) / max(1, (severe_count + moderate_count + mild_count) * 3) * 100)

    # case_score: normalized by a threshold (assume 20 cases => 100%)
    case_score = min(100, (total_cases / 20) * 100)

    # water risk: if any NGO reports clean_drinking_water == False -> add penalty
    water_risk_flag = nq.filter(clean_drinking_water=False).exists()
    water_penalty = 20 if water_risk_flag else 0

    # untreated risk: if rb text contains 'untreated' or 'no treatment' -> penalty
    untreated_flag = "no treatment" in (latest_rb_text or "").lower() or "untreated" in (latest_rb_text or "").lower()
    untreated_penalty = 15 if untreated_flag else 0

    # final risk percentage aggregate
    risk_percentage = min(100.0, (0.6 * severity_score) + (0.3 * case_score) + water_penalty + untreated_penalty)
    # normalize to 0-100
    if risk_percentage > 90:
        risk_level = "Very High"
    elif risk_percentage > 60:
        risk_level = "High"
    elif risk_percentage > 40:
        risk_level = "Moderate"
    elif risk_percentage > 20:
        risk_level = "Low"
    else:
        risk_level = "Very Low"

    # 9) Save/update VillageDashboard (atomic)
    with transaction.atomic():
        obj, created = VillageDashboard.objects.update_or_create(
            village=village_obj,
            defaults={
                "total_cases": total_cases,
                "total_deaths": total_deaths,
                "hospitalized_cases": hospitalized_cases,
                "risk_level": risk_level,
                "risk_percentage": round(risk_percentage, 1),
                "latest_rb_alerts": latest_rb_text,
                "symptom_distribution": dict(symptom_counter),
                "severity_distribution": severity_pct,
                "monthly_trend": monthly_trend,
                "last_aggregated_at": now(),
            }
        )

    return obj

def aggregate_all_villages(months_back: int = 6, filter_village_ids: list | None = None):
    """
    Aggregate for all villages (or filtered list) and return list of updated objects.
    This is what Celery task or management command will call.
    """
    q = Village.objects.all()
    if filter_village_ids:
        q = q.filter(village_id__in=filter_village_ids)

    results = []
    for v in q.iterator():
        results.append(aggregate_for_village(v, months_back=months_back))
    return results