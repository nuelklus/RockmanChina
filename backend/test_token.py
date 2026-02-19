#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rockman_logistics.settings')
django.setup()

from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from logistics.models import Staff

# Check the specific token
try:
    token = Token.objects.get(key='6f7215c87a2c04ff744ecc6890fc1f2b34a06e98')
    print(f"✅ Token exists for user: {token.user.username}")
    print(f"✅ User is active: {token.user.is_active}")
    
    # Check staff profile
    try:
        staff = token.user.staff_profile
        print(f"✅ Staff profile found")
        print(f"✅ Staff is active: {staff.is_active_staff}")
        print(f"✅ Staff role: {staff.role}")
    except Staff.DoesNotExist:
        print("❌ No staff profile found for this user")
        
except Token.DoesNotExist:
    print("❌ Token not found in database")

# List all tokens
print("\n📋 All tokens in database:")
for t in Token.objects.all():
    print(f"  - {t.user.username}: {t.key[:20]}...")
