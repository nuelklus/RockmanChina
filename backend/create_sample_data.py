import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rockman_logistics.settings')
django.setup()

from logistics.models import GoodsCategory, Customer

# Create sample goods categories
categories = [
    {"name": "Freight Charges", "unit_price": 100.00, "description": "Standard freight shipping charges"},
    {"name": "Packaging Materials", "unit_price": 25.50, "description": "Boxes, tape, and packaging supplies"},
    {"name": "Insurance", "unit_price": 15.00, "description": "Cargo insurance per shipment"},
    {"name": "Customs Clearance", "unit_price": 75.00, "description": "Customs documentation and processing"},
    {"name": "Storage Fees", "unit_price": 10.00, "description": "Daily storage charges"},
    {"name": "Handling Fees", "unit_price": 30.00, "description": "Loading and unloading services"},
]

print("Creating goods categories...")
for cat_data in categories:
    category, created = GoodsCategory.objects.get_or_create(
        name=cat_data["name"],
        defaults={
            "unit_price": cat_data["unit_price"],
            "description": cat_data["description"]
        }
    )
    if created:
        print(f"Created category: {category.name}")
    else:
        print(f"Category already exists: {category.name}")

# Create sample customers
customers = [
    {"name": "Global Trading Co.", "contact_person": "John Smith", "phone": "+1-555-0101", "email": "john@globaltrading.com"},
    {"name": "Asia Imports Ltd", "contact_person": "Maria Chen", "phone": "+1-555-0102", "email": "maria@asiaimports.com"},
    {"name": "European Logistics", "contact_person": "Hans Mueller", "phone": "+1-555-0103", "email": "hans@eulogistics.com"},
]

print("\nCreating customers...")
for cust_data in customers:
    customer, created = Customer.objects.get_or_create(
        name=cust_data["name"],
        defaults={
            "contact_person": cust_data["contact_person"],
            "phone": cust_data["phone"],
            "email": cust_data["email"]
        }
    )
    if created:
        print(f"Created customer: {customer.name}")
    else:
        print(f"Customer already exists: {customer.name}")

print("\nSample data creation completed!")
