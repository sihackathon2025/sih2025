from django.urls import path
from .views import (
    NgoSurveyView,
    NgoDashboardSummaryView,
    AdminMapDataView,
    VillageCreateView,
    health_report_from_aasha,
    aasha_worker_reports,
    disease_stats,
    surveyed_villages_status,
    summary_statistics,
    get_villages_dropdown,
    ClinicReportView

)


urlpatterns = [
    path("disease_stats/", disease_stats, name="disease_stats"),
    path("aasha_worker_reports/", aasha_worker_reports, name="aasha_worker_reports"),
    path("health-reports/", health_report_from_aasha, name="health_report_from_aasha"),

    # Village and NGO survey related
    path("villages/", VillageCreateView.as_view(), name="create-village"),
    path("ngo-surveys/", NgoSurveyView.as_view(), name="ngo-surveys"),
    path("villages/dropdown/", get_villages_dropdown, name="villages-dropdown"),

    # NGO dashboard related
    path("ngo-dashboard/summary/", NgoDashboardSummaryView.as_view(), name="ngo-dashboard-summary"),
    path("surveyed-villages/", surveyed_villages_status, name="surveyed-villages"),
    path("summary-statistics/", summary_statistics, name="summary-statistics"),

    # Admin dashboard related
    path("admin-dashboard/map-data/", AdminMapDataView.as_view(), name="admin-map-data"),


    # Clinic related
    path("clinic-reports/", ClinicReportView.as_view(), name="clinic-reports"),
]



