from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import NgoSurvey, Village, HealthReport
from users.models import User

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
