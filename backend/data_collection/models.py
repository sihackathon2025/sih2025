from django.db import models
from django.contrib.auth.models import User



class HealthReport(models.Model):
    SEVERITY_CHOICES = [
        ("Mild", "Mild"),
        ("Moderate", "Moderate"),
        ("Severe", "Severe"),
    ]

    report_id = models.AutoField(primary_key=True)
    patient_name = models.CharField(max_length=255)
    age = models.IntegerField()
    gender = models.CharField(max_length=10)
    village_id = models.IntegerField()
    symptoms = models.TextField()
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
    date_of_reporting = models.DateField()
    water_source = models.CharField(max_length=100)
    treatment_given = models.TextField()
    asha_worker_id = models.IntegerField()
    state = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    village = models.CharField(max_length=100)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient_name} - {self.report_id}"

class Village(models.Model):
    state = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    village_id = models.AutoField(primary_key=True)
    village_name = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)

    def __str__(self):
        return self.village_name

class NgoSurvey(models.Model):
    ngo = models.ForeignKey('users.User', on_delete=models.CASCADE, null=True, blank=True)
    village = models.ForeignKey(Village, on_delete=models.CASCADE)
    clean_drinking_water = models.BooleanField(default=False)
    toilet_coverage = models.PositiveIntegerField(default=0)
    waste_disposal_system = models.BooleanField(default=False)
    flooding_waterlogging = models.BooleanField(default=False)
    awareness_campaigns = models.BooleanField(default=False)
    typhoid_cases = models.PositiveIntegerField(default=0)
    fever_cases = models.PositiveIntegerField(default=0)
    diarrhea_cases = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

class Ngo_HealthReport(models.Model):
    village = models.ForeignKey(Village, on_delete=models.CASCADE, related_name='healthreports')
    date_of_reporting = models.DateField()
    cases = models.PositiveIntegerField(default=0)

