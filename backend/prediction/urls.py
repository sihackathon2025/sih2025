from django.urls import path
from . import views
from .views import GenerateSummaryView, AlertSummaryDetailView, AlertSummaryListView

app_name = "prediction"

urlpatterns = [
    path("generate-summary/", GenerateSummaryView.as_view(), name="generate-summary-all"),
    path("generate-summary/<int:alert_id>/", GenerateSummaryView.as_view(), name="generate-summary"),
    path("summary/<int:alert_id>/", AlertSummaryDetailView.as_view(), name="summary-detail"),
    path("summaries/", AlertSummaryListView.as_view(), name="summary-list"),
]
