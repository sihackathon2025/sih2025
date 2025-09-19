from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import NgoSurvey, Village, HealthReport,ClinicReport

User = get_user_model()   # ✅ User model le liya

# ---------------- Village Serializer ----------------
class VillageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Village
        fields = '__all__'


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
        source="ngo"   # model me ngo naam ka FK hoga
    )

    # village_id field → maps to Village FK
    village_id = serializers.PrimaryKeyRelatedField(
        queryset=Village.objects.all(),
        source="village"
    )

    class Meta:
        model = NgoSurvey
        fields = (
            'ngo_id',
            'village_id',   # ✅ village -> village_id
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

# ---------------- ClinicReport Serializer ----------------
class ClinicReportSerializer(serializers.ModelSerializer):
    village_id = serializers.PrimaryKeyRelatedField(
        queryset=Village.objects.all(),
        source="village"
    )
    clinic_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source="clinic",
        required=False,
        allow_null=True
    )

    class Meta:
        model = ClinicReport
        fields = (
            "report_id",
            "village_id",
            "clinic_id",
            "typhoid_cases",
            "fever_cases",
            "diarrhea_cases",
            "cholera_cases",
            "hospitalized_cases",
            "deaths_reported",
            "date_of_reporting",
            "created_at",
        )
        read_only_fields = ("report_id", "created_at")

