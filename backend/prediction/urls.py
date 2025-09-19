from django.urls import path
from . import views
from .views import GenerateSummaryView, AlertSummaryDetailView, AlertSummaryListView, get_early_warning_alerts,generate_early_warning_alert

app_name = "prediction"

urlpatterns = [
    path("generate_early_warning_alert/" ,views.generate_early_warning_alert , name = "generate_early_warning_alert"),
    path("get_early_warning_alerts", get_early_warning_alerts, name="get_early_warning_alerts"),
    path("generate-summary/", GenerateSummaryView.as_view(), name="generate-summary-all"),
    path("generate-summary/<int:alert_id>/", GenerateSummaryView.as_view(), name="generate-summary"),
    path("summary/<int:alert_id>/", AlertSummaryDetailView.as_view(), name="summary-detail"),
    path("summaries/", AlertSummaryListView.as_view(), name="summary-list"),
]
