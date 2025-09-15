from rest_framework import serializers
from .models import NgoSurvey, Village
from .models import HealthReport

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


class VillageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Village
        fields = '__all__'

class NgoSurveySerializer(serializers.ModelSerializer):
    village = serializers.PrimaryKeyRelatedField(queryset=Village.objects.all())

    class Meta:
        model = NgoSurvey
        # ngo_id will be added from the request user, not sent in the payload
        fields = ('village', 'clean_drinking_water', 'toilet_coverage', 
                  'waste_disposal_system', 'flooding_waterlogging', 
                  'awareness_campaigns', 'typhoid_cases', 'fever_cases', 'diarrhea_cases')
