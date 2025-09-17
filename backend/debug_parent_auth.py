#!/usr/bin/env python
"""Debug script for parent authentication"""

import os
import django
import sys

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

import requests
from users.models import ParentProfile

def debug_parent_auth():
    """Debug parent authentication flow"""
    
    # Base URL
    base_url = "http://127.0.0.1:8000"
    
    # Get a test parent
    try:
        parent = ParentProfile.objects.select_related('student').first()
        if not parent:
            print("No parent profiles found in database")
            return
            
        print(f"Testing with parent: {parent.full_name} ({parent.email})")
        
        # Step 1: Request OTP
        print("\n1. Requesting OTP...")
        client = requests.Session()
        otp_response = client.post(f'{base_url}/api/v1/users/auth/parent/request-otp/', {
            'email': parent.email
        })
        
        print(f"OTP Request Status: {otp_response.status_code}")
        if otp_response.status_code != 200:
            print(f"Error: {otp_response.text}")
            return
            
        # Get the OTP from the database (in real scenario this would be from email)
        from users.models import ParentOTP
        otp_record = ParentOTP.objects.filter(email=parent.email).order_by('-created_at').first()
        if not otp_record:
            print("No OTP found in database")
            return
            
        otp_code = otp_record.otp
        print(f"OTP Code: {otp_code}")
        
        # Step 2: Verify OTP
        print("\n2. Verifying OTP...")
        verify_response = client.post(f'{base_url}/api/v1/users/auth/parent/verify-otp/', {
            'email': parent.email,
            'otp': otp_code
        })
        
        print(f"Verify Status: {verify_response.status_code}")
        print(f"Response: {verify_response.text}")
        
        if verify_response.status_code != 200:
            return
            
        auth_data = verify_response.json()
        access_token = auth_data.get('access_token')
        print(f"Full Token: {access_token}")
        
        # Step 3: Test dashboard with token
        print("\n3. Testing dashboard with token...")
        
        # Try different authorization header formats
        auth_headers = [
            {'Authorization': f'Bearer {access_token}'},
            {'Authorization': access_token},
        ]
        
        for i, headers in enumerate(auth_headers):
            print(f"\n3.{i+1}. Trying auth format: {list(headers.values())[0][:50]}...")
            dashboard_response = client.get(f'{base_url}/api/v1/users/parent/dashboard/', 
                                           headers=headers)
            print(f"Dashboard Status: {dashboard_response.status_code}")
            if dashboard_response.status_code != 200:
                print(f"Response: {dashboard_response.text}")
            else:
                print("✓ Dashboard access successful!")
                break
        
        # Step 4: Check cache directly
        print("\n4. Checking cache directly...")
        from django.core.cache import cache
        session_data = cache.get(f"parent_session_{access_token}")
        print(f"Cache data: {session_data}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_parent_auth()