#!/usr/bin/env python
import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import ParentProfile, User
from admissions.models import AdmissionApplication

print("=== Parent Profile Analysis ===")
print(f"Total Parent Profiles: {ParentProfile.objects.count()}")

if ParentProfile.objects.exists():
    print("\nParent Profiles:")
    for parent in ParentProfile.objects.all()[:5]:  # Show first 5
        print(f"- ID: {parent.id}, Name: {parent.full_name}, Email: {parent.email}")
        print(f"  Relationship: {parent.relationship}, Primary: {parent.is_primary_contact}")
        if parent.student:
            print(f"  Student: {parent.student.full_name} ({parent.student.admission_number})")
        print()

print(f"\nTotal Parent Users: {User.objects.filter(role='parent').count()}")

# Check if there are any admission applications with parents
print(f"Total Admission Applications: {AdmissionApplication.objects.count()}")
apps_with_parents = AdmissionApplication.objects.filter(parent_profiles__isnull=False).distinct().count()
print(f"Applications with Parent Profiles: {apps_with_parents}")

# Test OTP request
print("\n=== Testing OTP Request with SEND_OTP=True ===")
if ParentProfile.objects.exists():
    test_parent = ParentProfile.objects.first()
    print(f"Testing with parent: {test_parent.email}")
    
    from users.views import parent_request_otp
    from django.test import RequestFactory
    import json
    
    factory = RequestFactory()
    request_data = {'email': test_parent.email}
    request = factory.post('/api/v1/users/auth/parent/request-otp/', 
                          data=json.dumps(request_data),
                          content_type='application/json')
    
    # Mock the request data attribute
    request.data = request_data
    
    try:
        response = parent_request_otp(request)
        print(f"OTP Request Response Status: {response.status_code}")
        print(f"Response Data: {response.data}")
        
        # Check if OTP was created in database
        from users.models import ParentOTP
        recent_otp = ParentOTP.objects.filter(parent=test_parent).order_by('-created_at').first()
        if recent_otp:
            print(f"OTP created in database: {recent_otp.otp} (expires: {recent_otp.expires_at})")
        
    except Exception as e:
        print(f"OTP Request Error: {e}")
        import traceback
        traceback.print_exc()
else:
    print("No parent profiles found to test with")