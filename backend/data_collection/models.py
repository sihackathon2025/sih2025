from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator


# ---------------- Village ----------------
class Village(models.Model):
    village_id = models.AutoField(primary_key=True)
    village_name = models.CharField(max_length=255, db_column="village_name")
    state = models.CharField(max_length=100, db_column="state_name")
    district = models.CharField(max_length=100, db_column="district_name")
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    population = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = "data_collection_village"  # force Django to use existing table





class Village(models.Model):
    state_name = models.CharField(max_length=100)
    district_name = models.CharField(max_length=100)
    village_id = models.AutoField(primary_key=True)
    village_name = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    population = models.IntegerField(null=True, blank=True)
    def __str__(self):
        return self.village_name
# ---------------- Village ----------------
    class Meta:
        db_table = "data_collection_village"  # force Django to use existing table

# ---------------- HealthReport ----------------
class HealthReport(models.Model):  
    SEVERITY_CHOICES = [
        ("Mild", "Mild"),
        ("Moderate", "Moderate"),
        ("Severe", "Severe"),
    ]

    WATER_QUALITY_CHOICES = [
        ("Good", "Good"),
        ("Moderate", "Moderate"),
        ("Poor", "Poor"),
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
    water_quality = models.CharField(
        max_length=10, 
        choices=WATER_QUALITY_CHOICES, 
        null=True, 
        blank=True, 
        default=None
    )

    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.patient_name} - {self.report_id}"

# ---------------- NgoSurvey ----------------
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


# ---------------- Ngo_HealthReport ----------------
class Ngo_HealthReport(models.Model):
    village = models.ForeignKey(Village, on_delete=models.CASCADE, related_name='healthreports')
    date_of_reporting = models.DateField()
    cases = models.PositiveIntegerField(default=0)


# ---------------- ClinicReport ----------------
class ClinicReport(models.Model):

    report_id = models.AutoField(primary_key=True)
    village = models.ForeignKey(Village, on_delete=models.CASCADE)
    typhoid_cases = models.PositiveIntegerField(default=0)
    fever_cases = models.PositiveIntegerField(default=0)
    diarrhea_cases = models.PositiveIntegerField(default=0)
    cholera_cases = models.PositiveIntegerField(default=0)
    hospitalized_cases = models.PositiveIntegerField(default=0)
    deaths_reported = models.PositiveIntegerField(default=0)


    village = models.ForeignKey(
        'Village',
        on_delete=models.CASCADE,
        db_column="village_id",
        related_name="clinic_reports"
    )

    clinic = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="clinic_id",
        related_name="clinic_reports"
    )

  
    date_of_reporting = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "data_collection_clinicreport"  # match existing table
        indexes = [
            models.Index(fields=["village"]),  # matches SQL index
        ]

    def __str__(self):
        return f"Clinic Report (Village: {self.village.village_name}, Date: {self.date_of_reporting})"
