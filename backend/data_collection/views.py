from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from users.permissions import IsNgoUser, IsAdminUser
from .serializers import NgoSurveySerializer, VillageSerializer, HealthReportSerializer,ClinicReportSerializer
from .models import ClinicReport
from data_collection.models import NgoSurvey, Village, HealthReport
from django.utils import timezone
from datetime import timedelta, date
from django.db.models import Count, Q, Case, When, CharField, Value
from rest_framework import generics
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods


# ------------------- Health Report APIs -------------------

@csrf_exempt
@require_http_methods(["POST"])
def health_report_from_aasha(request):
    """ASHA worker creates health report"""
    try:
        data = json.loads(request.body.decode("utf-8"))

        required_fields = [
            "patient_name", "age", "gender", "village_id", "symptoms",
            "severity", "date_of_reporting", "water_source",
            "treatment_given", "asha_worker_id", "state", "district", "village"
        ]

        for field in required_fields:
            if field not in data:
                return JsonResponse({"error": f"Missing field: {field}"}, status=400)

        report = HealthReport.objects.create(
            patient_name=data["patient_name"],
            age=int(data["age"]),
            gender=data["gender"],
            village_id=int(data["village_id"]),
            symptoms=data["symptoms"],
            severity=data["severity"],
            date_of_reporting=data["date_of_reporting"],
            water_source=data["water_source"],
            treatment_given=data["treatment_given"],
            asha_worker_id=int(data["asha_worker_id"]),
            state=data["state"],
            district=data["district"],
            village=data["village"],
        )

        return JsonResponse({
            "message": "Health report created successfully",
            "report_id": report.report_id
        }, status=201)

    except Exception as e:
        print("Error details:", e)
        return JsonResponse({"error": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
def aasha_worker_reports(request):
    """Fetch ASHA worker health reports with filter"""
    asha_worker_id = request.query_params.get("asha_worker_id")
    report_period = request.query_params.get("reportPeriod", "weekly")

    if not asha_worker_id:
        return Response({"error": "asha_worker_id is required"}, status=400)

    reports = HealthReport.objects.filter(asha_worker_id=asha_worker_id)

    today = timezone.now().date()
    if report_period == "weekly":
        start_date = today - timedelta(days=7)
        reports = reports.filter(date_of_reporting__gte=start_date)
    elif report_period == "monthly":
        start_date = today - timedelta(days=30)
        reports = reports.filter(date_of_reporting__gte=start_date)

    serializer = HealthReportSerializer(reports, many=True)

    return Response({
        "reports": serializer.data,
        "total_disease_count": reports.count(),
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def disease_stats(request):
    """Symptom wise disease stats for ASHA worker"""
    asha_worker_id = request.query_params.get("asha_worker_id")
    filter_period = request.query_params.get("filter", "weekly")

    if not asha_worker_id:
        return Response({"error": "asha_worker_id is required"}, status=400)

    reports = HealthReport.objects.filter(asha_worker_id=asha_worker_id)

    today = date.today()
    if filter_period == "weekly":
        start_date = today - timedelta(days=7)
        reports = reports.filter(date_of_reporting__gte=start_date)
    elif filter_period == "monthly":
        start_date = today - timedelta(days=30)
        reports = reports.filter(date_of_reporting__gte=start_date)
    elif filter_period == "6months":
        start_date = today - timedelta(days=180)
        reports = reports.filter(date_of_reporting__gte=start_date)
    # else: no filter

    FIXED_SYMPTOMS = [
        "Fever", "Diarrhea", "Vomiting", "Headache", "Stomach Pain",
        "Cough", "Cold", "Fatigue", "Nausea", "Skin Rash", "Other"
    ]
    symptom_counts = {symptom: 0 for symptom in FIXED_SYMPTOMS}

    for report in reports:
        for symptom in report.symptoms.split(", "):
            if symptom in symptom_counts:
                symptom_counts[symptom] += 1
            else:
                symptom_counts["Other"] += 1

    return Response({
        "disease_counts": symptom_counts,
        "total_disease_count": reports.count()
    })


# ------------------- NGO Dashboard APIs -------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def surveyed_villages_status(request):
    """Survey status for NGO villages"""
    ngo_user = request.user
    surveys = NgoSurvey.objects.filter(ngo=ngo_user)

    data = []
    for s in surveys:
        data.append({
            "village": s.village.village_name if s.village else None,
            "clean_water": s.clean_drinking_water,
            "toilet_coverage": s.toilet_coverage,
            "waste_disposal": "Advanced" if s.waste_disposal_system else "Basic",
            "flooding": s.flooding_waterlogging,
            "awareness": s.awareness_campaigns,
            "typhoid_cases": s.typhoid_cases,
            "fever_cases": s.fever_cases,
            "diarrhea_cases": s.diarrhea_cases,
        })

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def summary_statistics(request):
    """NGO wise survey summary"""
    ngo_user = request.user
    surveys = NgoSurvey.objects.filter(ngo=ngo_user)

    total_villages = surveys.values('village').distinct().count()
    high_alert_villages = surveys.filter(clean_drinking_water=False).values('village').distinct().count()
    total_disease_cases = sum(s.typhoid_cases + s.fever_cases + s.diarrhea_cases for s in surveys)
    no_clean_water = surveys.filter(clean_drinking_water=False).values('village').distinct().count()

    return Response({
        "total_villages": total_villages,
        "high_alert_villages": high_alert_villages,
        "total_disease_cases": total_disease_cases,
        "villages_without_clean_water": no_clean_water,
    })



@api_view(["GET"])
@permission_classes([AllowAny])
def disease_stats(request):
    """Symptom wise disease stats for ASHA worker"""
    asha_worker_id = request.query_params.get("asha_worker_id")
    filter_period = request.query_params.get("filter", "weekly")

    if not asha_worker_id:
        return Response({"error": "asha_worker_id is required"}, status=400)

    reports = HealthReport.objects.filter(asha_worker_id=asha_worker_id)

    today = date.today()
    if filter_period == "weekly":
        start_date = today - timedelta(days=7)
        reports = reports.filter(date_of_reporting__gte=start_date)
    elif filter_period == "monthly":
        start_date = today - timedelta(days=30)
        reports = reports.filter(date_of_reporting__gte=start_date)
    elif filter_period == "6months":
        start_date = today - timedelta(days=180)
        reports = reports.filter(date_of_reporting__gte=start_date)
    # else: no filter

    FIXED_SYMPTOMS = [
        "Fever", "Diarrhea", "Vomiting", "Headache", "Stomach Pain",
        "Cough", "Cold", "Fatigue", "Nausea", "Skin Rash", "Other"
    ]
    symptom_counts = {symptom: 0 for symptom in FIXED_SYMPTOMS}

    for report in reports:
        for symptom in report.symptoms.split(", "):
            if symptom in symptom_counts:
                symptom_counts[symptom] += 1
            else:
                symptom_counts["Other"] += 1

    return Response({
        "disease_counts": symptom_counts,
        "total_disease_count": reports.count()
    })


# ------------------- NGO Dashboard APIs -------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def surveyed_villages_status(request):
    """Survey status for NGO villages"""
    ngo_user = request.user
    surveys = NgoSurvey.objects.filter(ngo=ngo_user)

    data = []
    for s in surveys:
        data.append({
            "village": s.village.village_name if s.village else None,
            "clean_water": s.clean_drinking_water,
            "toilet_coverage": s.toilet_coverage,
            "waste_disposal": "Advanced" if s.waste_disposal_system else "Basic",
            "flooding": s.flooding_waterlogging,
            "awareness": s.awareness_campaigns,
            "typhoid_cases": s.typhoid_cases,
            "fever_cases": s.fever_cases,
            "diarrhea_cases": s.diarrhea_cases,
        })

    return Response(data)


@api_view(['GET'])
def get_villages_dropdown(request):
    villages = Village.objects.all().values('village_id', 'village_name')
    return Response(list(villages))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def summary_statistics(request):
    """NGO wise survey summary"""
    ngo_user = request.user
    surveys = NgoSurvey.objects.filter(ngo=ngo_user)

    total_villages = surveys.values('village').distinct().count()
    high_alert_villages = surveys.filter(clean_drinking_water=False).values('village').distinct().count()
    total_disease_cases = sum(s.typhoid_cases + s.fever_cases + s.diarrhea_cases for s in surveys)
    no_clean_water = surveys.filter(clean_drinking_water=False).values('village').distinct().count()

    return Response({
        "total_villages": total_villages,
        "high_alert_villages": high_alert_villages,
        "total_disease_cases": total_disease_cases,
        "villages_without_clean_water": no_clean_water,
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def aasha_worker_reports(request):
    asha_worker_id = request.query_params.get("asha_worker_id")
    report_period = request.query_params.get("reportPeriod", "weekly")
    
    if not asha_worker_id:
        return Response({"error": "asha_worker_id is required"}, status=400)

    reports = HealthReport.objects.filter(asha_worker_id=asha_worker_id)

    # Filter by report period
    today = now().date()
    if report_period == "weekly":
        start_date = today - timedelta(days=7)
        reports = reports.filter(date_of_reporting__gte=start_date)
    elif report_period == "monthly":
        start_date = today - timedelta(days=30)
        reports = reports.filter(date_of_reporting__gte=start_date)

    serializer = HealthReportSerializer(reports, many=True)
    
    # Prepare response with total disease count
    response_data = {
        "reports": serializer.data,                # same array your table uses
        "total_disease_count": reports.count(),    # new parameter
    }

    return Response(response_data)



FIXED_SYMPTOMS = [
    "Fever", "Diarrhea", "Vomiting", "Headache", "Stomach Pain",
    "Cough", "Cold", "Fatigue", "Nausea", "Skin Rash", "Other"
]

@api_view(["GET"])
@permission_classes([AllowAny])
def disease_stats(request):
    asha_worker_id = request.query_params.get("asha_worker_id")
    filter_period = request.query_params.get("filter", "weekly")

    if not asha_worker_id:
        return Response({"error": "asha_worker_id is required"}, status=400)

    reports = HealthReport.objects.filter(asha_worker_id=asha_worker_id)

    today = date.today()
    if filter_period == "weekly":
        start_date = today - timedelta(days=7)
        reports = reports.filter(date_of_reporting__gte=start_date)
    elif filter_period == "monthly":
        start_date = today - timedelta(days=30)
        reports = reports.filter(date_of_reporting__gte=start_date)
    elif filter_period == "6months":
        start_date = today - timedelta(days=180)
        reports = reports.filter(date_of_reporting__gte=start_date)
    # total = no date filter

    symptom_counts = {symptom: 0 for symptom in FIXED_SYMPTOMS}

    for report in reports:
        for symptom in report.symptoms.split(", "):
            if symptom in symptom_counts:
                symptom_counts[symptom] += 1
            else:
                symptom_counts["Other"] += 1

    return Response({
        "disease_counts": symptom_counts,
        "total_disease_count": reports.count()
    })

class VillageCreateView(generics.CreateAPIView):
    queryset = Village.objects.all()
    serializer_class = VillageSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

class NgoSurveyView(APIView):
    permission_classes = [IsAuthenticated, IsNgoUser]
    serializer_class = NgoSurveySerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        survey = serializer.save(ngo=request.user)  # ngo auto-assign
        return Response(self.serializer_class(survey).data, status=201)

    def get(self, request):
        surveys = NgoSurvey.objects.filter(ngo=request.user)
        serializer = self.serializer_class(surveys, many=True)
        return Response(serializer.data)


class NgoDashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsNgoUser]

    def get(self, request):
        ngo_user = request.user
        total_villages = Village.objects.count()
        surveyed_count = NgoSurvey.objects.filter(ngo=ngo_user).values('village').distinct().count()
        pending_count = total_villages - surveyed_count
        return Response({
            "total_villages": total_villages,
            "surveyed_count": surveyed_count,
            "pending_count": pending_count
        })


class AdminMapDataView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        thirty_days_ago = timezone.now() - timedelta(days=30)
        map_data = Village.objects.annotate(
            case_count=Count('healthreports', filter=Q(healthreports__date_of_reporting__gte=thirty_days_ago)),
            risk_level=Case(
                When(case_count__gt=20, then=Value('High')),
                When(case_count__gt=10, then=Value('Moderate')),
                default=Value('Low'),
                output_field=CharField()
            )
        ).values('village_id', 'village_name', 'latitude', 'longitude', 'case_count', 'risk_level')
        return Response(map_data)

#clinc report api 
class ClinicReportView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Create new clinic report"""
        serializer = ClinicReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = serializer.save(clinic=request.user)  # clinic auto-assign
        return Response(ClinicReportSerializer(report).data, status=201)

    def get(self, request):
        """Fetch all clinic reports of logged-in clinic"""
        reports = ClinicReport.objects.filter(clinic=request.user)
        serializer = ClinicReportSerializer(reports, many=True)
        return Response(serializer.data)
# class ClinicReportView(generics.ListCreateAPIView):
#     queryset = ClinicReport.objects.all().order_by("-date_of_reporting")
#     serializer_class = ClinicReportSerializer

#     def get_queryset(self):
#         clinic_id = self.request.query_params.get("clinic_id")
#         if clinic_id:
#             return self.queryset.filter(clinic_id=clinic_id).order_by("-date_of_reporting")
#         return self.queryset