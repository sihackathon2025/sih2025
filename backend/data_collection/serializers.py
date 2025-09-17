from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import NgoSurvey, Village, HealthReport

User = get_user_model()

# ---------------- Village Serializer ----------------
class VillageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Village
        fields = '__all__'


class VillageDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model = Village
        fields = ['village_id', 'village_name']


# ---------------- HealthReport Serializer ----------------
class HealthReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthReport
        fields = [
            "date_of_reporting",
            "patient_name",
            "age",
            "symptoms",
            "severity",
            "water_source",
        ]


# ---------------- NgoSurvey Serializer ----------------
class NgoSurveySerializer(serializers.ModelSerializer):
    # ngo_id field → maps to Ngo model FK
    ngo_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source="ngo"
    )

    # village_id field → maps to Village FK
    village_id = serializers.PrimaryKeyRelatedField(
        queryset=Village.objects.all(),
        source="village"
    )

    # district_name and state_name come from related Village
    district_name = serializers.CharField(source="village.district_name", read_only=True)
    state_name = serializers.CharField(source="village.state_name", read_only=True)

    class Meta:
        model = NgoSurvey
        fields = (
            'ngo_id',
            'village_id',          # ✅ village FK
            'district_name',       # from Village table
            'state_name',          # from Village table
            'clean_drinking_water',
            'toilet_coverage',
            'waste_disposal_system',
            'flooding_waterlogging',
            'awareness_campaigns',
            'typhoid_cases',
            'fever_cases',
            'diarrhea_cases',
            'created_at',
        )
