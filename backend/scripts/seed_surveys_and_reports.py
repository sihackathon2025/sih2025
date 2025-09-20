
import random
from datetime import date, timedelta, datetime
from django.utils import timezone
from django.db import transaction

from data_collection.models import Village, ClinicReport, NgoSurvey
from users.models import User

def run():
    """
    Generates fake ClinicReport and NgoSurvey data using existing villages and users.
    """
    print("Starting to seed fake Clinic Reports and NGO Surveys...")

    # --- 0. Clear existing data ---
    print("Deleting existing fake data from ClinicReport and NgoSurvey...")
    try:
        with transaction.atomic():
            deleted_clin, _ = ClinicReport.objects.all().delete()
            deleted_ngo, _ = NgoSurvey.objects.all().delete()
            print(f"Deleted {deleted_clin} ClinicReport objects.")
            print(f"Deleted {deleted_ngo} NgoSurvey objects.")
    except Exception as e:
        print(f"Error deleting old data: {e}")
        return

    # --- 1. Fetch existing Villages ---
    villages = Village.objects.all()
    if not villages.exists():
        print("Error: No villages found in the database. Please add some villages first.")
        return

    print(f"Found {villages.count()} existing villages.")

    # --- 2. Get or create a fake user for the NGO ---
    # This avoids creating a new user every time the script is run.
    try:
        with transaction.atomic():
            fake_ngo_user, created = User.objects.get_or_create(
                email='fake_ngo_seeder@example.com',
                defaults={
                    'name': 'Fake NGO Seeder',
                    # A default password is required for user creation
                    'password': 'a_default_password' 
                }
            )
            if created:
                print("Created a new fake NGO user: 'fake_ngo_for_seeding'")
    except Exception as e:
        print(f"Error creating or getting fake user: {e}")
        print("Please ensure you can create users, or create a user named 'fake_ngo_for_seeding' manually.")
        return

    today = date.today()

    # --- 3. Generate data for each village ---
    print("Generating reports and surveys for each village...")
    for village in villages:
        print(f"  -> Processing Village: {village.village_name}")

        # --- a. Generate ClinicReports ---
        num_clinic_reports = random.randint(2, 5)
        for i in range(num_clinic_reports):
            days_ago = random.randint(0, 365)
            report_date = today - timedelta(days=days_ago)
            try:
                ClinicReport.objects.create(
                    village=village,
                    typhoid_cases=random.randint(0, 5),
                    fever_cases=random.randint(0, 10),
                    diarrhea_cases=random.randint(0, 7),
                    cholera_cases=random.randint(0, 3),
                    hospitalized_cases=random.randint(0, 2),
                    deaths_reported=random.randint(0, 1),
                    date_of_reporting=report_date,
                )
            except Exception as e:
                print(f"      [!] Failed to create ClinicReport {i+1}/{num_clinic_reports} for {village.village_name}: {e}")
        print(f"      + Created {num_clinic_reports} fake Clinic Reports.")

        # --- b. Generate NgoSurveys ---
        num_ngo_surveys = random.randint(1, 3)
        for i in range(num_ngo_surveys):
            days_ago = random.randint(0, 365)
            survey_date = today - timedelta(days=days_ago)
            try:
                NgoSurvey.objects.create(
                    ngo=fake_ngo_user,
                    village=village,
                    clean_drinking_water=random.choice([True, False]),
                    toilet_coverage=random.randint(20, 100),
                    waste_disposal_system=random.choice([True, False]),
                    flooding_waterlogging=random.choice([True, False]),
                    awareness_campaigns=random.choice([True, False]),
                    typhoid_cases=random.randint(0, 3),
                    fever_cases=random.randint(0, 5),
                    diarrhea_cases=random.randint(0, 4),
                    created_at=timezone.make_aware(datetime.combine(survey_date, datetime.min.time())),
                )
            except Exception as e:
                print(f"      [!] Failed to create NgoSurvey {i+1}/{num_ngo_surveys} for {village.village_name}: {e}")
        print(f"      + Created {num_ngo_surveys} fake NGO Surveys.")

    print("\nFake data generation complete!")
