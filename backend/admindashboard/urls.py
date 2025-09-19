# admindashboard/urls.py
from django.urls import path
from . import views

app_name = "admindashboard"
urlpatterns = [
    path("villages/", views.VillageDashboardList.as_view(), name="village-list"),
    path("villages/<int:pk>/", views.VillageDashboardDetail.as_view(), name="village-detail"),
]

