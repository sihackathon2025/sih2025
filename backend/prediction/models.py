from django.db import models

class EarlyWarningAlert(models.Model):
    clinic_id = models.IntegerField(null=True, blank=True)
    asha_worker_id = models.IntegerField(null=True, blank=True)
    ngo_id = models.IntegerField(null=True, blank=True)
    village_name = models.CharField(max_length=255)
    district_name = models.CharField(max_length=255)
    state_name = models.CharField(max_length=255)
    rbalert = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)   # record create hone ka time
    updated_at = models.DateTimeField(auto_now=True)       # record update hone ka time

    def __str__(self):
        return f"{self.village_name}, {self.district_name}, {self.state_name}"


class AlertSummary(models.Model):
    alert = models.ForeignKey(
        EarlyWarningAlert,
        on_delete=models.CASCADE,
        related_name="summaries"
    )
    summary_text = models.TextField()
    risk_percentage = models.FloatField()   # e.g., 85.3
    risk_level = models.CharField(max_length=20)  # e.g., "High", "Moderate"
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return (
            f"Summary for {self.alert.village_name} - "
            f"{self.risk_level} ({self.risk_percentage:.1f}%)"
        )



