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
