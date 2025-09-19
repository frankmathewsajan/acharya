#!/usr/bin/env python
import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import ParentProfile, ParentOTP, User
from rest_framework_simplejwt.tokens import RefreshToken
import json

print("=== Testing Parent OTP Verification ===")

# Get a test parent
parent = ParentProfile.objects.first()
if not parent:
    print("No parent profiles found!")
    exit(1)

print(f"Testing with parent: {parent.full_name} ({parent.email})")

# Create a test OTP
test_otp = "123456"
parent_otp = ParentOTP.objects.create(
    parent=parent,
    email=parent.email,  # Include email field
    otp=test_otp,
    is_verified=False
)

print(f"Created test OTP: {test_otp} for email: {parent.email}")

# Test verification
from users.views import parent_verify_otp
from django.test import RequestFactory

factory = RequestFactory()
request_data = {'email': parent.email, 'otp': test_otp}
request = factory.post('/api/v1/users/auth/parent/verify-otp/', 
                      data=json.dumps(request_data),
                      content_type='application/json')

# Mock the request data attribute
request.data = request_data

try:
    response = parent_verify_otp(request)
    print(f"OTP Verification Response Status: {response.status_code}")
    print(f"Response Data: {response.data}")
    
    # Store the access token for later use
    access_token = None
    if response.status_code == 200:
        access_token = response.data.get('access_token')
        
        # Check if User was created
        parent_user = User.objects.filter(email=parent.email, role='parent').first()
        if parent_user:
            print(f"Parent User created: {parent_user.username} (ID: {parent_user.id})")
            
            # Test token decoding
            if access_token:
                from rest_framework_simplejwt.tokens import UntypedToken
                token = UntypedToken(access_token)
                parent_id = token.get('parent_id')
                is_parent = token.get('is_parent')
                print(f"Token contains parent_id: {parent_id}, is_parent: {is_parent}")
        
except Exception as e:
    print(f"OTP Verification Error: {e}")
    import traceback
    traceback.print_exc()
    access_token = None

print("\n=== Testing Parent Dashboard Access ===")

# Create a test user session for testing dashboard
try:
    parent_user = User.objects.filter(email=parent.email, role='parent').first()
    if parent_user and access_token:
        from django.test import RequestFactory
        from rest_framework.test import force_authenticate
        from users.views import parent_student_fees
        
        factory = RequestFactory()
        request = factory.get('/api/v1/users/parent/fees/')
        
        # Add the authorization header manually
        request.META['HTTP_AUTHORIZATION'] = f'Bearer {access_token}'
        
        # Also force authenticate for testing
        force_authenticate(request, user=parent_user)
        
        dashboard_response = parent_student_fees(request)
        print(f"Parent Fees API Response Status: {dashboard_response.status_code}")
        print(f"Response Data: {dashboard_response.data}")
    else:
        print("No valid access token or parent user available for testing")
        
except Exception as e:
    print(f"Dashboard Test Error: {e}")
    import traceback
    traceback.print_exc()