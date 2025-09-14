from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import EarlyWarningAlert, AlertSummary
from .services import process_alert  # we'll define this in services.py


class GenerateSummaryView(APIView):
    """
    API endpoint to process EarlyWarningAlert rows,
    generate summary + risk, and save into AlertSummary.
    """

    def post(self, request, *args, **kwargs):
        try:
            # Fetch all alerts (you can filter if needed)
            alerts = EarlyWarningAlert.objects.all()

            summaries_created = []

            for alert in alerts:
                summary_obj = process_alert(alert)
                summaries_created.append({
                    "village": alert.village_name,
                    "district": alert.district_name,
                    "state": alert.state_name,
                    "risk_percentage": summary_obj.risk_percentage,
                    "risk_level": summary_obj.risk_level,
                    "summary": summary_obj.summary_text,
                })

            return Response(
                {"message": "Summaries generated successfully", "data": summaries_created},
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )




