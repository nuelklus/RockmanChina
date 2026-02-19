import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rockman_logistics.settings')
django.setup()

from django.contrib.auth.models import User
from logistics.models import Staff

def create_staff_users():
    """Create sample staff users"""
    
    # Create superuser
    if not User.objects.filter(username='admin').exists():
        admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@rockmanlogistics.com',
            password='admin123',
            first_name='Super',
            last_name='Admin'
        )
        # Create staff profile
        Staff.objects.create(
            user=admin_user,
            role='admin',
            department='IT',
            employee_id='ADMIN001',
            is_active_staff=True
        )
        print(f"Created superuser: {admin_user.username}")
    
    # Create manager
    if not User.objects.filter(username='manager').exists():
        manager_user = User.objects.create_user(
            username='manager',
            email='manager@rockmanlogistics.com',
            password='manager123',
            first_name='John',
            last_name='Manager'
        )
        # Create staff profile
        Staff.objects.create(
            user=manager_user,
            role='manager',
            department='Operations',
            employee_id='MGR001',
            is_active_staff=True
        )
        print(f"Created manager: {manager_user.username}")
    
    # Create operator
    if not User.objects.filter(username='operator').exists():
        operator_user = User.objects.create_user(
            username='operator',
            email='operator@rockmanlogistics.com',
            password='operator123',
            first_name='Jane',
            last_name='Operator'
        )
        # Create staff profile
        Staff.objects.create(
            user=operator_user,
            role='operator',
            department='Logistics',
            employee_id='OP001',
            is_active_staff=True
        )
        print(f"Created operator: {operator_user.username}")

if __name__ == '__main__':
    create_staff_users()
    print("Staff users created successfully!")
    print("\nLogin credentials:")
    print("Admin: admin / admin123")
    print("Manager: manager / manager123") 
    print("Operator: operator / operator123")
