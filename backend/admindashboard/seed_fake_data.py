
import random
from datetime import date, timedelta, datetime
from django.utils import timezone
from data_collection.models import Village, HealthReport, ClinicReport, NgoSurvey
from users.models import User


def run():
    print("Creating fake users...")
    fake_ngo_user, _ = User.objects.get_or_create(
        username='fake_ngo',
        defaults={
            'email': 'ngo@example.com',
            'password': 'pbkdf2_sha256$600000$y0urh4shh3r3$y0urh4shh3r3'
        }
    )
    fake_asha_user, _ = User.objects.get_or_create(
        username='fake_asha',
        defaults={
            'email': 'asha@example.com',
            'password': 'pbkdf2_sha256$600000$y0urh4shh3r3$y0urh4shh3r3'
        }
    )

    print("Creating fake villages...")
    villages = []
    states = ["Uttar Pradesh", "Bihar", "Rajasthan", "Madhya Pradesh", "Maharashtra"]
    districts = ["Lucknow", "Patna", "Jaipur", "Kanpur", "Gaya", "Udaipur", "Indore", "Bhopal", "Pune", "Nagpur"]

    for i in range(1, 21):
        village_name = f"Village_{i}"
        state = random.choice(states)
        district = random.choice(districts)
        latitude = round(random.uniform(20.0, 30.0), 6)
        longitude = round(random.uniform(75.0, 85.0), 6)

        village, _ = Village.objects.get_or_create(
            village_name=village_name,
            defaults={
                'state_name': state,
                'district_name': district,
                'latitude': latitude,
                'longitude': longitude
            }
        )
        villages.append(village)

    print(f"Created {len(villages)} villages.")

    print("Generating health reports, clinic reports, and NGO surveys...")

    symptoms_list = ["Fever", "Diarrhea", "Vomiting", "Cough", "Headache", "Typhoid", "Cholera", "Malaria", "Dengue"]
    severity_choices = ["Mild", "Moderate", "Severe"]
    water_sources = ["Well", "Tap", "Handpump", "River", "Borewell"]

    today = date.today()

    for village in villages:
        # HealthReports
        for _ in range(random.randint(5, 15)):
            days_ago = random.randint(0, 365)
            report_date = today - timedelta(days=days_ago)
            symptoms = random.sample(symptoms_list, k=random.randint(1, 3))
            HealthReport.objects.create(
                patient_name=f"Patient_{random.randint(100, 999)}",
                age=random.randint(1, 80),
                gender=random.choice(["Male", "Female", "Other"]),
                village_id=village.village_id,
                symptoms=", ".join(symptoms),
                severity=random.choice(severity_choices),
                date_of_reporting=report_date,
                water_source=random.choice(water_sources),
                treatment_given=random.choice(["Paracetamol", "ORS", "Antibiotics", "Rest"]),
                asha_worker_id=fake_asha_user.id,
                state=village.state_name,
                district=village.district_name,
                village=village.village_name,
            )

        # ClinicReports
        for _ in range(random.randint(2, 8)):
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

        # NgoSurveys
        for _ in range(random.randint(1, 5)):
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
                created_at=timezone.make_aware(datetime.combine(survey_date, datetime.min.time())),
            )

    print("Fake data generation complete!")
