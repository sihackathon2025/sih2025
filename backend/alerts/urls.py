from django.urls import path
from .views import AlertViewSet

urlpatterns = [
    path('alerts', AlertViewSet.as_view({'get': 'list', 'post': 'create'}), name='alerts'),
    path('alerts/<int:pk>', AlertViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='alert-detail'),
]