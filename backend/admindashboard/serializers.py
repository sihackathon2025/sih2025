# admindashboard/serializers.py
from rest_framework import serializers
from .models import VillageDashboard
from data_collection.models import Village as VillageModel

class VillageDashboardSerializer(serializers.ModelSerializer):
    village_name = serializers.CharField(source="village.village_name", read_only=True)
    district = serializers.CharField(source="village.district_name", read_only=True)
    state = serializers.CharField(source="village.state_name", read_only=True)

    class Meta:
        model = VillageDashboard
        fields = [
            "id", "village", "village_name", "district", "state",
            "total_cases", "total_deaths", "hospitalized_cases",
            "risk_level", "risk_percentage", "latest_rb_alerts",
            "symptom_distribution", "severity_distribution", "monthly_trend",
            "last_aggregated_at",
        ]

