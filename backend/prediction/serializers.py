from rest_framework import serializers
from .models import EarlyWarningAlert

class EarlyWarningAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = EarlyWarningAlert
        fields = '__all__'
