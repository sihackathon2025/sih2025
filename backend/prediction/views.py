
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .models import EarlyWarningAlert, AlertSummary
from .services import process_alert
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import EarlyWarningAlert
from .serializers import EarlyWarningAlertSerializer
import pandas as pd
from datetime import timedelta
from django.utils.timezone import now
from rest_framework.decorators import api_view
from rest_framework.response import Response

from data_collection.models import HealthReport   # 👈 import from datacollect
from prediction.models import EarlyWarningAlert
from utils.rule_based_model import generate_health_alerts


class GenerateSummaryView(APIView):
    """
    API endpoint to process EarlyWarningAlert rows,
    generate summary + risk, and save into AlertSummary.
    Can process all alerts or a single alert if alert_id is provided.
    """
    permission_classes = [AllowAny]

    def post(self, request, alert_id=None, *args, **kwargs):
        try:
            if alert_id:
                alerts = EarlyWarningAlert.objects.filter(id=alert_id)
            else:
                alerts = EarlyWarningAlert.objects.all()

            if not alerts.exists():
                return Response(
                    {"error": "No alerts found to process."},
                    status=status.HTTP_404_NOT_FOUND
                )

            summaries_created = []

            for alert in alerts:
                summary_obj = process_alert(alert)
                summaries_created.append({
                    "village": alert.village_name,
                    "district": alert.district_name,
                    "state": alert.state_name,
                    "risk_percentage": summary_obj["risk_percentage"],
                    "risk_level": summary_obj["risk_level"],
                    "summary": summary_obj["summary"],
                })

            return Response(
                {"message": "Summaries generated successfully", "data": summaries_created},
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# GET endpoint for a single summary
class AlertSummaryDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, alert_id, *args, **kwargs):
        summary = AlertSummary.objects.filter(alert__id=alert_id).first()
        if not summary:
            return Response({"error": "No summary found for this alert"}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "village": summary.alert.village_name,
            "district": summary.alert.district_name,
            "state": summary.alert.state_name,
            "risk_percentage": summary.risk_percentage,
            "risk_level": summary.risk_level,
            "summary": summary.summary_text,
        }, status=status.HTTP_200_OK)


# GET endpoint for all summaries
class AlertSummaryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        summaries = AlertSummary.objects.all()
        data = [
            {
                "id": summary.alert.id,
                "village": summary.alert.village_name,
                "district": summary.alert.district_name,
                "state": summary.alert.state_name,
                "risk_percentage": summary.risk_percentage,
                "risk_level": summary.risk_level,
            }
            for summary in summaries
        ]
        return Response({"data": data}, status=status.HTTP_200_OK)




@api_view(['GET'])
def get_early_warning_alerts(request, id):
    try:
        # given id ke corresponding last record
        alert = EarlyWarningAlert.objects.filter(id=id).last()
        if not alert:
            return Response({"message": "No record found"}, status=404)

        serializer = EarlyWarningAlertSerializer(alert)
        return Response(serializer.data)

    except Exception as e:
        return Response({"error": str(e)}, status=500)




from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

@api_view(["POST"])
def generate_early_warning_alert(request):
    """
    Analyze HealthReports, generate alerts,
    save them in EarlyWarningAlert, and return response.
    """
    clinic_id = request.data.get("clinic_id")
    asha_worker_id = request.data.get("asha_worker_id")
    ngo_id = request.data.get("ngo_id")

    village_name = request.data.get("village")
    district_name = request.data.get("district_name")
    state_name = request.data.get("state_name")
    time_period = request.data.get("time_period", "week")

    today = now().date()

    if time_period == "week":
        start_date = today - timedelta(days=7)
    elif time_period == "month":
        start_date = today - timedelta(days=30)
    else:
        return Response(
            {"status": "error", "message": "Invalid time_period. Use 'week' or 'month'"},
            status=400,
        )

    queryset = HealthReport.objects.filter(date_of_reporting__gte=start_date)

    if not queryset.exists():
        return Response(
            {"status": "success", "message": "No records found in this period."}
        )

    df = pd.DataFrame.from_records(
        queryset.values(
            "age",
            "symptoms",
            "severity",
            "water_source",
            "treatment_given",
            "water_quality",
        )
    )

    df.rename(
        columns={
            "age": "Age",
            "symptoms": "Symptoms",
            "severity": "Severity",
            "water_source": "Water Source",
            "treatment_given": "Treatment Given",
            "water_quality": "Water Quality",
        },
        inplace=True,
    )

    result_string = generate_health_alerts(df)

    # save in EarlyWarningAlert
    alert = EarlyWarningAlert.objects.create(
        clinic_id=clinic_id if clinic_id else None,
        asha_worker_id=asha_worker_id if asha_worker_id else None,
        ngo_id=ngo_id if ngo_id else None,
        village_name=village_name,
        district_name=district_name,
        state_name=state_name,
        rbalert=result_string,
    )

    return Response(
        {
            "status": "success",
            "alerts": result_string,
            "saved_id": alert.id,
        }
    )
