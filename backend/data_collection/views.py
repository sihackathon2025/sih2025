from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.permissions import IsNgoUser, IsAdminUser
from .serializers import NgoSurveySerializer, VillageSerializer
from data_collection.models import NgoSurvey, Village, HealthReport
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Q, Case, When, CharField, Value
from rest_framework import generics
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import HealthReport
from .serializers import HealthReportSerializer
from django.utils.timezone import now
from datetime import timedelta



@csrf_exempt
@require_http_methods(["POST"])
def health_report_from_aasha(request):
    try:
        data = json.loads(request.body.decode("utf-8"))

        # Required fields check
        required_fields = [
            "patient_name", "age", "gender", "village_id", "symptoms",
            "severity", "date_of_reporting", "water_source",
            "treatment_given", "asha_worker_id", "state", "district", "village"
        ]

        for field in required_fields:
            if field not in data:
                return JsonResponse(
                    {"error": f"Missing field: {field}"}, status=400
                )

        # Save to DB
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
    "Fever",
    "Diarrhea",
    "Vomiting",
    "Headache",
    "Stomach Pain",
    "Cough",
    "Cold",
    "Fatigue",
    "Nausea",
    "Skin Rash",
    "Other",
]

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from datetime import date, timedelta
from .models import HealthReport

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
        serializer.save(ngo=request.user)
        return Response(serializer.data, status=201)

    def get(self, request):
        surveys = NgoSurvey.objects.filter(ngo=request.user)
        serializer = self.serializer_class(surveys, many=True)
        return Response(serializer.data)

class NgoDashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsNgoUser]

    def get(self, request):
        ngo_user = request.user
        total_villages = Village.objects.count()
        surveyed_count = NgoSurvey.objects.filter(ngo=ngo_user).values('village_id').distinct().count()
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

