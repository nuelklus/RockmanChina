# Add customer_code field without unique constraint first
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('logistics', '0005_alter_staff_options'),
    ]

    operations = [
        # Add customer_code field without unique constraint
        migrations.AddField(
            model_name='customer',
            name='customer_code',
            field=models.CharField(max_length=50, blank=True, null=True),
        ),
        # Update existing customers with proper codes
        migrations.RunSQL(
            """
            UPDATE logistics_customer 
            SET customer_code = 'CUST' || LPAD(id::text, 3, '0')
            WHERE customer_code IS NULL;
            """,
            reverse_sql="UPDATE logistics_customer SET customer_code = NULL"
        ),
        # Now add the unique constraint
        migrations.AlterField(
            model_name='customer',
            name='customer_code',
            field=models.CharField(max_length=50, unique=True, blank=True, null=True),
        ),
    ]
