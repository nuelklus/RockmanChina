#!/usr/bin/env python
import os
import django
from django.conf import settings
from django.db import connection

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rockman_logistics.settings')
django.setup()

def test_database_connection():
    """Test the database connection and show connection details"""
    try:
        # Test database connection
        with connection.cursor() as cursor:
            db_config = settings.DATABASES['default']
            if 'postgresql' not in db_config['ENGINE']:
                raise ValueError("This project is configured to use Supabase PostgreSQL only")
            
            cursor.execute("SELECT version();")
            db_version = cursor.fetchone()[0]
            print("✅ Supabase PostgreSQL connection successful!")
            print(f"📊 Database version: {db_version}")
            
        # Show database configuration
        print(f"🔧 Database engine: {db_config['ENGINE']}")
        print(f"🏷️  Database name: {db_config.get('NAME', 'N/A')}")
        print(f"🌐 Host: {db_config['HOST']}")
        print(f"🔌 Port: {db_config.get('PORT', 'N/A')}")
        print(f"👤 User: {db_config.get('USER', 'N/A')}")
        
        # Test if our models exist
        from logistics.models import Customer, Shipment, Receipt, ReceiptItem
        print("✅ All logistics models imported successfully!")
        
        # Count existing records
        customer_count = Customer.objects.count()
        shipment_count = Shipment.objects.count()
        receipt_count = Receipt.objects.count()
        
        print(f"📈 Current database state:")
        print(f"   Customers: {customer_count}")
        print(f"   Shipments: {shipment_count}")
        print(f"   Receipts: {receipt_count}")
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    test_database_connection()
