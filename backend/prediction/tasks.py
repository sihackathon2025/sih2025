
# prediction/tasks.py
from celery import shared_task
from .models import EarlyWarningAlert
from .services import process_alert

@shared_task
def generate_summaries_task():
    alerts = EarlyWarningAlert.objects.all()
    for alert in alerts:
        process_alert(alert)
    return f"Processed {alerts.count()} alerts"
