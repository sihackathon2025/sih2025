# alerts/urls.py (Corrected Version)

from django.urls import path
from .views import AlertViewSet

urlpatterns = [
    # CHANGED: 'alerts' is now an empty string '' to correctly form /api/alerts/
    path('', AlertViewSet.as_view({'get': 'list', 'post': 'create'}), name='alerts'),
    
    # CHANGED: 'alerts/<int:pk>' is now '<int:pk>/'
    path('<int:pk>/', AlertViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='alert-detail'),
]
