#!/usr/bin/env python
"""Simple debug script for parent authentication"""

import os
import django

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from users.models import ParentProfile, ParentOTP
from django.core.cache import cache
from django.test.client import Client
from django.urls import reverse
import json

def debug_auth():
    """Debug authentication step by step"""
    
    # Get a test parent
    parent = ParentProfile.objects.select_related('student').first()
    if not parent:
        print("No parent profiles found")
        return
        
    print(f"Testing with parent: {parent.full_name} ({parent.email})")
    
    # Create Django test client
    client = Client()
    
    # Step 1: Request OTP
    print("\n1. Requesting OTP...")
    response = client.post('/api/v1/users/auth/parent/request-otp/', {
        'email': parent.email
    }, content_type='application/json')
    
    print(f"OTP request status: {response.status_code}")
    if response.status_code != 200:
        print(f"Error: {response.content}")
        return
        
    # Get OTP from database
    otp_record = ParentOTP.objects.filter(email=parent.email).order_by('-created_at').first()
    if not otp_record:
        print("No OTP found")
        return
        
    print(f"Generated OTP: {otp_record.otp}")
    
    # Step 2: Verify OTP
    print("\n2. Verifying OTP...")
    response = client.post('/api/v1/users/auth/parent/verify-otp/', {
        'email': parent.email,
        'otp': otp_record.otp
    }, content_type='application/json')
    
    print(f"Verify status: {response.status_code}")
    if response.status_code != 200:
        print(f"Error: {response.content}")
        return
        
    auth_data = json.loads(response.content)
    access_token = auth_data.get('access_token')
    print(f"Access token: {access_token}")
    
    # Step 3: Check cache
    print("\n3. Checking cache...")
    session_data = cache.get(f"parent_session_{access_token}")
    print(f"Session data: {session_data}")
    
    # Step 4: Test dashboard
    print("\n4. Testing dashboard...")
    
    # Try with X-Parent-Token header first
    response = client.get('/api/v1/users/parent/dashboard/', 
                         HTTP_X_PARENT_TOKEN=access_token)
    
    print(f"Dashboard status (X-Parent-Token): {response.status_code}")
    if response.status_code == 200:
        dashboard_data = json.loads(response.content)
        print(f"✓ Dashboard successful! Student: {dashboard_data.get('student', {}).get('name')}")
    else:
        print(f"Error: {response.content}")
        
        # Try with Authorization header as fallback
        print("\n4b. Trying Authorization header...")
        response = client.get('/api/v1/users/parent/dashboard/', 
                             HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        print(f"Dashboard status (Authorization): {response.status_code}")
        if response.status_code == 200:
            dashboard_data = json.loads(response.content)
            print(f"✓ Dashboard successful! Student: {dashboard_data.get('student', {}).get('name')}")
        else:
            print(f"Error: {response.content}")

if __name__ == "__main__":
    debug_auth()