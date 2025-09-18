#!/usr/bin/env python
"""
Test script for JWT-based parent authentication
"""
import os
import sys
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.append('.')
django.setup()

from users.models import ParentProfile

def test_parent_jwt_auth():
    """Test parent JWT authentication flow"""
    
    base_url = "http://localhost:8000/users"
    
    # Get first parent for testing
    parent = ParentProfile.objects.first()
    if not parent:
        print("No parents found in database")
        return
        
    print(f"Testing JWT auth with parent: {parent.full_name}")
    print(f"Parent email: {parent.email}")
    
    # Step 1: Request OTP
    print("\n1. Requesting OTP...")
    otp_response = requests.post(f"{base_url}/auth/parent/request-otp/", json={
        "email": parent.email
    })
    
    print(f"OTP Request Status: {otp_response.status_code}")
    if otp_response.status_code == 200:
        print("OTP sent successfully")
    else:
        print(f"OTP Request failed: {otp_response.text}")
        return
    
    # Step 2: Manually input OTP for verification
    print("\n2. Verify OTP (you need to check the parent's OTP)...")
    print("Note: In development, check the Django console for OTP output")
    print("For production testing, you would enter the OTP received via SMS")
    
    # Get OTP from user input for testing
    test_otp = input("Enter the OTP (or press Enter to skip): ").strip()
    
    if test_otp:
        print(f"\n3. Verifying OTP: {test_otp}")
        verify_response = requests.post(f"{base_url}/auth/parent/verify-otp/", json={
            "email": parent.email,
            "otp": test_otp
        })
        
        print(f"OTP Verification Status: {verify_response.status_code}")
        if verify_response.status_code == 200:
            data = verify_response.json()
            access_token = data.get('access')
            refresh_token = data.get('refresh')
            user_data = data.get('user')
            
            print("✅ JWT tokens received successfully!")
            print(f"Access token: {access_token[:50]}...")
            print(f"User role: {user_data.get('role')}")
            
            # Step 4: Test authenticated endpoint
            print("\n4. Testing authenticated /auth/me/ endpoint...")
            headers = {"Authorization": f"Bearer {access_token}"}
            me_response = requests.get(f"{base_url}/auth/me/", headers=headers)
            
            print(f"Auth Me Status: {me_response.status_code}")
            if me_response.status_code == 200:
                me_data = me_response.json()
                print("✅ Authentication successful!")
                print(f"User: {me_data.get('user', {}).get('full_name')}")
                print(f"Role: {me_data.get('user', {}).get('role')}")
                print(f"Profile: {me_data.get('profile', {}).get('full_name')}")
            else:
                print(f"❌ Auth Me failed: {me_response.text}")
        
        else:
            print(f"❌ OTP Verification failed: {verify_response.text}")
    else:
        print("Skipping OTP verification")

if __name__ == "__main__":
    print("=== Parent JWT Authentication Test ===")
    test_parent_jwt_auth()