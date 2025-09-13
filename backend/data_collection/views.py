from rest_framework.views import APIView
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

