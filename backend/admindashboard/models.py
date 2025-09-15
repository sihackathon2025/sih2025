# admindashboard/models.py
from django.db import models

class VillageDashboard(models.Model):
    # link to canonical village table (adjust app and model if different)
    village = models.ForeignKey("data_collection.Village", on_delete=models.CASCADE, related_name="dashboard_rows")

    # Basic aggregated numbers
    total_cases = models.IntegerField(default=0)         # sum of cases from multiple sources (see mapping)
    total_deaths = models.IntegerField(default=0)        # sum from clinic reports (deaths_reported)
    hospitalized_cases = models.IntegerField(default=0)  # sum from clinic reports

    # Risk metadata
    risk_level = models.CharField(max_length=20, default="Very Low")  # Very Low / Low / Moderate / High / Very High
    risk_percentage = models.FloatField(null=True, blank=True)       # 0-100

    # Free text (latest important alerts from rule-based system)
    latest_rb_alerts = models.TextField(null=True, blank=True)

    # Structures for charts (json)
    # symptom_distribution example: {"diarrhea": 25, "fever": 10, "cough": 5}
    symptom_distribution = models.JSONField(default=dict) 

    # severity_distribution example: {"Mild": 40, "Moderate": 30, "Severe": 30} (percent or counts)
    severity_distribution = models.JSONField(default=dict)

    # monthly trend example: {"2025-03": 12, "2025-04": 8, ...}
    monthly_trend = models.JSONField(default=dict)

    # meta
    last_aggregated_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-last_aggregated_at"]

    def __str__(self):
        return f"{self.village.village_name} — {self.risk_level} ({self.risk_percentage or 0:.1f}%)"

# Create your models here.
