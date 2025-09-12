from django.db import models

class Village(models.Model):
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

class HealthReport(models.Model):
    village = models.ForeignKey(Village, on_delete=models.CASCADE, related_name='healthreports')
    date_of_reporting = models.DateField()
    cases = models.PositiveIntegerField(default=0)