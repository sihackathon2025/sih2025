
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .models import EarlyWarningAlert, AlertSummary
from .services import process_alert


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
        summaries = AlertSummary.objects.all().order_by("-created_at")
        data = [
            {
                "id": summary.id,
                "village": summary.alert.village_name,
                "district": summary.alert.district_name,
                "state": summary.alert.state_name,
                "risk_percentage": summary.risk_percentage,
                "risk_level": summary.risk_level,
                "summary": summary.summary_text,
                "created_at": summary.created_at,
            }
            for summary in summaries
        ]
        return Response({"data": data}, status=status.HTTP_200_OK)
