import os
import sys

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sentinel.settings')
django.setup()

import random
from datetime import date, timedelta, datetime
from django.utils import timezone

from data_collection.models import Village, HealthReport, ClinicReport, NgoSurvey
from users.models import User # Assuming your custom User model is in users.models

def generate_fake_data():
    # --- 1. Clear existing data (optional, for a fresh start) ---
    # Uncomment the lines below if you want to delete all existing fake data before generating new ones.
    # print("Clearing existing data...")
    # HealthReport.objects.all().delete()
    # ClinicReport.objects.all().delete()
    # NgoSurvey.objects.all().delete()
    # Village.objects.all().delete()
    # User.objects.filter(username__startswith='fake_').delete() # Only delete users created by this script

    # --- 2. Create some fake users (NGOs and ASHA workers) ---
    print("Creating fake users...")
    # Ensure users exist or create them. Adjust password as needed.
    fake_ngo_user, _ = User.objects.get_or_create(name='fake_ngo', defaults={'email': 'ngo@example.com', 'password': 'pbkdf2_sha256$600000$y0urh4shh3r3$y0urh4shh3r3'})
    fake_asha_user, _ = User.objects.get_or_create(name='fake_asha', defaults={'email': 'asha@example.com', 'password': 'pbkdf2_sha256$600000$y0urh4shh3r3$y0urh4shh3r3'})
    # Note: You might need to set is_staff=True or other permissions depending on your User model setup
    # For example:
    # fake_ngo_user.is_staff = True
    # fake_ngo_user.save()

    # --- 3. Create 15-20 fake villages ---
    print("Creating fake villages...")
    villages = []
    states = ["Uttar Pradesh", "Bihar", "Rajasthan", "Madhya Pradesh", "Maharashtra"]
    districts = ["Lucknow", "Patna", "Jaipur", "Kanpur", "Gaya", "Udaipur", "Indore", "Bhopal", "Pune", "Nagpur"]
    for i in range(1, 21): # Generate 20 villages
        village_name = f"Village_{i}"
        state = random.choice(states)
        district = random.choice(districts)
        latitude = round(random.uniform(20.0, 30.0), 6)
        longitude = round(random.uniform(75.0, 85.0), 6)
        village, created = Village.objects.get_or_create(
            village_name=village_name,
            defaults={
                'state': state,
                'district': district,
                'latitude': latitude,
                'longitude': longitude
            }
        )
        villages.append(village)
    print(f"Created {len(villages)} villages.")

    # --- 4. Generate data for each village ---
    print("Generating health reports, clinic reports, and NGO surveys...")
    symptoms_list = ["Fever", "Diarrhea", "Vomiting", "Cough", "Headache", "Typhoid", "Cholera", "Malaria", "Dengue"]
    severity_choices = ["Mild", "Moderate", "Severe"]
    water_sources = ["Well", "Tap", "Handpump", "River", "Borewell"]

    today = date.today()

    for village in villages:
        # Generate HealthReports (some old, some recent)
        for _ in range(random.randint(5, 15)): # 5 to 15 reports per village
            days_ago = random.randint(0, 365) # Up to 1 year old
            report_date = today - timedelta(days=days_ago)
            symptoms = random.sample(symptoms_list, k=random.randint(1, 3)) # 1 to 3 random symptoms
            HealthReport.objects.create(
                patient_name=f"Patient_{random.randint(100, 999)}",
                age=random.randint(1, 80),
                gender=random.choice(["Male", "Female", "Other"]),
                village_id=village.village_id, # Use integer village_id for HealthReport
                symptoms=", ".join(symptoms),
                severity=random.choice(severity_choices),
                date_of_reporting=report_date,
                water_source=random.choice(water_sources),
                treatment_given=random.choice(["Paracetamol", "ORS", "Antibiotics", "Rest"]),
                asha_worker_id=fake_asha_user.user_id, # Assuming ASHA worker ID is user ID
                state=village.state,
                district=village.district,
                village=village.village_name, # Use village name for HealthReport
            )

        # Generate ClinicReports (some old, some recent)
        for _ in range(random.randint(2, 8)): # 2 to 8 reports per village
            days_ago = random.randint(0, 365)
            report_date = today - timedelta(days=days_ago)
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

        # Generate NgoSurveys (some old, some recent)
        for _ in range(random.randint(1, 5)): # 1 to 5 surveys per village
            days_ago = random.randint(0, 365)
            survey_date = today - timedelta(days=days_ago)
            NgoSurvey.objects.create(
                ngo=fake_ngo_user,
                village=village,
                clean_drinking_water=random.choice([True, False]),
                toilet_coverage=random.randint(0, 100),
                waste_disposal_system=random.choice([True, False]),
                flooding_waterlogging=random.choice([True, False]),
                awareness_campaigns=random.choice([True, False]),
                typhoid_cases=random.randint(0, 3),
                fever_cases=random.randint(0, 5),
                diarrhea_cases=random.randint(0, 4),
                # Ensure created_at is a timezone-aware datetime object
                created_at=timezone.make_aware(datetime.combine(survey_date, datetime.min.time())),
            )

    print("Fake data generation complete!")

if __name__ == '__main__':
    import os
    import django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sentinel.settings')
    django.setup()
    generate_fake_data()
