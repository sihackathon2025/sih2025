
from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        # Table already moved manually in PostgreSQL
        migrations.RunPython(code=lambda apps, schema_editor: None),
    ]
