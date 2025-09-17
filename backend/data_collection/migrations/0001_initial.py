import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Village',
            fields=[
                ('state_name', models.CharField(max_length=100)),
                ('district_name', models.CharField(max_length=100)),
                ('village_id', models.AutoField(primary_key=True, serialize=False)),
                ('village_name', models.CharField(max_length=255)),
                ('latitude', models.DecimalField(decimal_places=6, max_digits=9)),
                ('longitude', models.DecimalField(decimal_places=6, max_digits=9)),
            ],
        ),
        migrations.CreateModel(
            name='HealthReport',
            fields=[
                ('report_id', models.AutoField(primary_key=True, serialize=False)),
                ('patient_name', models.CharField(max_length=255)),
                ('age', models.IntegerField()),
                ('gender', models.CharField(max_length=10)),
                ('symptoms', models.TextField()),
                ('severity', models.CharField(choices=[('Mild', 'Mild'), ('Moderate', 'Moderate'), ('Severe', 'Severe')], max_length=10)),
                ('date_of_reporting', models.DateField()),
                ('water_source', models.CharField(max_length=100)),
                ('treatment_given', models.TextField()),
                ('asha_worker_id', models.IntegerField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('village', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='health_reports_set', to='data_collection.village')),
            ],
        ),
        migrations.CreateModel(
            name='NgoSurvey',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('clean_drinking_water', models.BooleanField(default=False)),
                ('toilet_coverage', models.PositiveIntegerField(default=0)),
                ('waste_disposal_system', models.BooleanField(default=False)),
                ('flooding_waterlogging', models.BooleanField(default=False)),
                ('awareness_campaigns', models.BooleanField(default=False)),
                ('typhoid_cases', models.PositiveIntegerField(default=0)),
                ('fever_cases', models.PositiveIntegerField(default=0)),
                ('diarrhea_cases', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('ngo', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('village', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='data_collection.village')),
            ],
        ),
        migrations.CreateModel(
            name='Ngo_HealthReport',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date_of_reporting', models.DateField()),
                ('cases', models.PositiveIntegerField(default=0)),
                ('village', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='healthreports', to='data_collection.village')),
            ],
        ),
        migrations.CreateModel(
            name='ClinicReport',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('typhoid_cases', models.PositiveIntegerField(default=0)),
                ('fever_cases', models.PositiveIntegerField(default=0)),
                ('diarrhea_cases', models.PositiveIntegerField(default=0)),
                ('cholera_cases', models.PositiveIntegerField(default=0)),
                ('hospitalized_cases', models.PositiveIntegerField(default=0)),
                ('deaths_reported', models.PositiveIntegerField(default=0)),
                ('date_of_reporting', models.DateField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('village', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='data_collection.village')),
            ],
        ),
    ]