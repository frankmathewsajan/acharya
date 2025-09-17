#!/usr/bin/env python
"""
Test script for parent dashboard endpoints
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
from django.contrib.auth.models import User
from users.models import ParentProfile, ParentOTP
from admissions.models import AdmissionApplication
import json

def test_parent_endpoints():
    """Test parent authentication and dashboard endpoints"""
    client = Client()
    
    print("=" * 50)
    print("TESTING PARENT DASHBOARD ENDPOINTS")
    print("=" * 50)
    
    # First, let's check if we have any parent profiles
    parents = ParentProfile.objects.all()
    print(f"\nFound {parents.count()} parent profiles in database")
    
    if parents.exists():
        # Use testmother for testing as it has a fresh OTP
        parent = parents.filter(email='testmother@example.com').first() or parents.first()
        full_name = f"{parent.first_name or ''} {parent.last_name or ''}".strip() or "Unknown"
        print(f"Testing with parent: {full_name} (Email: {parent.email})")
        
        # Test OTP request endpoint
        print("\n1. Testing OTP request endpoint...")
        
        # First check if there's an existing unused OTP
        existing_otp = ParentOTP.objects.filter(parent=parent, is_verified=False).order_by('-created_at').first()
        
        if existing_otp:
            print(f"Using existing OTP: {existing_otp.otp}")
            otp_response_success = True
            otp_record = existing_otp
        else:
            otp_response = client.post('/api/v1/users/auth/parent/request-otp/', {
                'email': parent.email
            }, content_type='application/json')
            
            print(f"OTP Request Status: {otp_response.status_code}")
            if otp_response.status_code == 200:
                print(f"OTP Response: {otp_response.json()}")
                otp_response_success = True
                
                # Get the OTP from database
                otp_record = ParentOTP.objects.filter(parent=parent).order_by('-created_at').first()
                if otp_record:
                    print(f"OTP generated: {otp_record.otp}")
                else:
                    print("No OTP record found")
                    otp_response_success = False
            else:
                try:
                    print(f"OTP Request Error: {otp_response.json()}")
                except:
                    print(f"OTP Request Error: {otp_response.content}")
                otp_response_success = False
        
        if otp_response_success and otp_record:
            # Test OTP verification
            print("\n2. Testing OTP verification endpoint...")
            verify_response = client.post('/api/v1/users/auth/parent/verify-otp/', {
                'email': parent.email,
                'otp': otp_record.otp
            }, content_type='application/json')
            
            print(f"Verify Status: {verify_response.status_code}")
            if verify_response.status_code == 200:
                auth_data = verify_response.json()
                print(f"Authentication successful!")
                print(f"Access token received: {auth_data.get('access_token', 'N/A')[:20]}...")
                
                # Test dashboard endpoints with token
                token = auth_data.get('access_token')
                headers = {'Authorization': f'Bearer {token}'}
                
                print("\n3. Testing dashboard overview endpoint...")
                overview_response = client.get('/api/v1/users/parent/dashboard/', headers=headers)
                print(f"Overview Status: {overview_response.status_code}")
                if overview_response.status_code == 200:
                    print("Overview data retrieved successfully!")
                    overview_data = overview_response.json()
                    print(f"Student: {overview_data.get('student', {}).get('name', 'N/A')}")
                
                print("\n4. Testing attendance endpoint...")
                attendance_response = client.get('/api/v1/users/parent/attendance/?days=30', headers=headers)
                print(f"Attendance Status: {attendance_response.status_code}")
                
                print("\n5. Testing results endpoint...")
                results_response = client.get('/api/v1/users/parent/results/', headers=headers)
                print(f"Results Status: {results_response.status_code}")
                
                print("\n6. Testing fees endpoint...")
                fees_response = client.get('/api/v1/users/parent/fees/', headers=headers)
                print(f"Fees Status: {fees_response.status_code}")
                
                print("\n7. Testing notices endpoint...")
                notices_response = client.get('/api/v1/users/parent/notices/', headers=headers)
                print(f"Notices Status: {notices_response.status_code}")
                
            else:
                try:
                    print(f"Verify Error: {verify_response.json()}")
                except:
                    print(f"Verify Error: {verify_response.content}")
        else:
            print("Skipping OTP verification due to request failure")
    else:
        print("No parent profiles found. Creating test data...")
        
        # Create test user and admission
        user = User.objects.create_user(
            username='test_student',
            email='test.student@example.com',
            first_name='Test',
            last_name='Student'
        )
        
        # Create admission application
        admission = AdmissionApplication.objects.create(
            full_name='Test Student',
            email='test.student@example.com',
            phone_number='9999999999',
            course='LKG',
            father_name='Test Father',
            father_phone='9999999998',
            father_email='test.father@example.com',
            mother_name='Test Mother',
            mother_phone='9999999997',
            mother_email='test.mother@example.com',
            status='enrolled'
        )
        
        # Create parent profiles
        admission.create_parent_profiles()
        
        print("Test data created successfully!")
        print("Run the script again to test with the new data.")

if __name__ == '__main__':
    test_parent_endpoints()