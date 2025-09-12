from django.urls import path
from .views import NgoSurveyView, NgoDashboardSummaryView, AdminMapDataView, VillageCreateView

urlpatterns = [
    path('villages', VillageCreateView.as_view(), name='create-village'),
    path('ngo-surveys', NgoSurveyView.as_view(), name='ngo-surveys'),
    path('ngo-dashboard/summary', NgoDashboardSummaryView.as_view(), name='ngo-dashboard-summary'),
    path('admin-dashboard/map-data', AdminMapDataView.as_view(), name='admin-map-data'),
]
