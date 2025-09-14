# prediction/models.py
from django.db import models

class EarlyWarningAlert(models.Model):
    village_name = models.CharField(max_length=100)
    district_name = models.CharField(max_length=100)
    state_name = models.CharField(max_length=100)
    rbalert = models.TextField(help_text="Raw rule-based alerts as a text string")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']  # newest first

    def __str__(self):
        return f"Alert in {self.village_name}, {self.district_name}, {self.state_name} at {self.created_at}"

