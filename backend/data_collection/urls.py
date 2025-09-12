from django.urls import path
from .views import health_report_from_aasha

urlpatterns = [
    path("health-reports/", health_report_from_aasha, name="health_report_from_aasha"),
]
