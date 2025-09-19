# admindashboard/views.py
from rest_framework import generics
from .models import VillageDashboard
from .serializers import VillageDashboardSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly

class VillageDashboardList(generics.ListAPIView):
    queryset = VillageDashboard.objects.select_related("village").all()
    serializer_class = VillageDashboardSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class VillageDashboardDetail(generics.RetrieveAPIView):
    queryset = VillageDashboard.objects.select_related("village")
    serializer_class = VillageDashboardSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

