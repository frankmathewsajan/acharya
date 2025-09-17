#!/usr/bin/env python
"""
Test script for complete parent authentication and dashboard flow
"""
import os
import django
import sys

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.core.cache import cache
from users.models import ParentProfile, ParentOTP
import json

def test_complete_parent_flow():
    """Test complete parent authentication and dashboard flow"""
    client = Client()
    
    print("=" * 60)
    print("TESTING COMPLETE PARENT AUTHENTICATION & DASHBOARD FLOW")
    print("=" * 60)
    
    # Get a parent with fresh OTP
    parent = ParentProfile.objects.filter(email='testmother@example.com').first()
    
    if not parent:
        print("No parent found with email testmother@example.com")
        return
    
    print(f"Testing with parent: {parent.first_name} {parent.last_name} ({parent.email})")
    
    # Step 1: Request OTP
    print("\n1. Requesting OTP...")
    otp_response = client.post('/api/v1/users/auth/parent/request-otp/', {
        'email': parent.email
    }, content_type='application/json')
    
    print(f"OTP Request Status: {otp_response.status_code}")
    if otp_response.status_code != 200:
        print(f"OTP Request failed: {otp_response.json()}")
        return
    
    print(f"OTP Response: {otp_response.json()}")
    
    # Get the OTP from database
    otp_record = ParentOTP.objects.filter(parent=parent).order_by('-created_at').first()
    if not otp_record:
        print("No OTP record found in database")
        return
    
    print(f"Generated OTP: {otp_record.otp}")
    
    # Step 2: Verify OTP and get access token
    print("\n2. Verifying OTP...")
    verify_response = client.post('/api/v1/users/auth/parent/verify-otp/', {
        'email': parent.email,
        'otp': otp_record.otp
    }, content_type='application/json')
    
    print(f"Verify Status: {verify_response.status_code}")
    if verify_response.status_code != 200:
        print(f"OTP Verification failed: {verify_response.json()}")
        return
    
    auth_data = verify_response.json()
    access_token = auth_data.get('access_token')
    print(f"Authentication successful! Token: {access_token[:20]}...")
    print(f"Parent: {auth_data.get('parent', {}).get('name', 'N/A')}")
    print(f"Student: {auth_data.get('student', {}).get('name', 'N/A')}")
    
    # Step 3: Test session verification
    print("\n3. Verifying session...")
    session_response = client.get('/api/v1/users/auth/parent/verify-session/', 
                                  headers={'X-Parent-Token': access_token})
    print(f"Session Status: {session_response.status_code}")
    if session_response.status_code == 200:
        session_data = session_response.json()
        print(f"Session valid: {session_data.get('valid', False)}")
    
    # Step 4: Test dashboard endpoints
    print("\n4. Testing dashboard endpoints...")
    
    headers = {'X-Parent-Token': access_token}
    
    # Dashboard overview
    print("\n4a. Dashboard Overview...")
    overview_response = client.get('/api/v1/users/parent/dashboard/', headers=headers)
    print(f"Overview Status: {overview_response.status_code}")
    if overview_response.status_code == 200:
        overview_data = overview_response.json()
        print(f"✓ Student: {overview_data.get('student', {}).get('name', 'N/A')}")
        print(f"✓ Attendance: {overview_data.get('attendance', {}).get('percentage', 'N/A')}%")
        print(f"✓ Pending Fees: ₹{overview_data.get('fees', {}).get('pending_amount', 'N/A')}")
    else:
        print(f"✗ Overview failed: {overview_response.status_code}")
        try:
            print(f"Error: {overview_response.json()}")
        except:
            print(f"Error content: {overview_response.content}")
    
    # Attendance
    print("\n4b. Attendance Data...")
    attendance_response = client.get('/api/v1/users/parent/attendance/?days=30', headers=headers)
    print(f"Attendance Status: {attendance_response.status_code}")
    if attendance_response.status_code == 200:
        attendance_data = attendance_response.json()
        print(f"✓ Attendance summary: {attendance_data.get('summary', {})}")
    else:
        print(f"✗ Attendance failed: {attendance_response.status_code}")
    
    # Results
    print("\n4c. Results Data...")
    results_response = client.get('/api/v1/users/parent/results/', headers=headers)
    print(f"Results Status: {results_response.status_code}")
    if results_response.status_code == 200:
        results_data = results_response.json()
        print(f"✓ Performance summary: {results_data.get('performance_summary', {})}")
    else:
        print(f"✗ Results failed: {results_response.status_code}")
    
    # Fees
    print("\n4d. Fees Data...")
    fees_response = client.get('/api/v1/users/parent/fees/', headers=headers)
    print(f"Fees Status: {fees_response.status_code}")
    if fees_response.status_code == 200:
        fees_data = fees_response.json()
        print(f"✓ Fee summary: {fees_data.get('summary', {})}")
    else:
        print(f"✗ Fees failed: {fees_response.status_code}")
    
    # Notices
    print("\n4e. Notices Data...")
    notices_response = client.get('/api/v1/users/parent/notices/', headers=headers)
    print(f"Notices Status: {notices_response.status_code}")
    if notices_response.status_code == 200:
        notices_data = notices_response.json()
        print(f"✓ Found {len(notices_data.get('notices', []))} notices")
    else:
        print(f"✗ Notices failed: {notices_response.status_code}")
    
    print("\n" + "=" * 60)
    print("TESTING COMPLETE")
    print("=" * 60)

if __name__ == '__main__':
    test_complete_parent_flow()