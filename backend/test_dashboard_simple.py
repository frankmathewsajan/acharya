#!/usr/bin/env python
"""Test parent dashboard with existing OTP"""

import os
import django

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.test.client import Client
import json

def test_dashboard():
    """Test dashboard with existing OTP"""
    
    client = Client()
    
    # Use existing OTP
    email = "john.doe@example.com"
    otp = "948734"
    
    print(f"Testing dashboard access for {email}")
    
    # Step 1: Verify OTP
    print("\n1. Verifying OTP...")
    response = client.post('/api/v1/users/auth/parent/verify-otp/', {
        'email': email,
        'otp': otp
    }, content_type='application/json')
    
    print(f"Verify status: {response.status_code}")
    if response.status_code != 200:
        print(f"Error: {response.content}")
        return
        
    auth_data = json.loads(response.content)
    access_token = auth_data.get('access_token')
    print(f"Access token: {access_token}")
    
    # Step 2: Test dashboard with X-Parent-Token
    print("\n2. Testing dashboard with X-Parent-Token...")
    response = client.get('/api/v1/users/parent/dashboard/', 
                         HTTP_X_PARENT_TOKEN=access_token)
    
    print(f"Dashboard status: {response.status_code}")
    if response.status_code == 200:
        dashboard_data = json.loads(response.content)
        print(f"✓ Dashboard successful!")
        print(f"Student: {dashboard_data.get('student', {}).get('name', 'N/A')}")
        print(f"Attendance: {dashboard_data.get('attendance', {}).get('percentage', 'N/A')}%")
    else:
        print(f"Error: {response.content}")

if __name__ == "__main__":
    test_dashboard()