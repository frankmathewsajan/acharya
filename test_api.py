#!/usr/bin/env python3
"""
Quick test script to check the staff API endpoint
"""

import requests
import json
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_staff_api():
    base_url = "http://localhost:8000"
    
    # Test login first to get token
    login_data = {
        "email": "admin@test.com",  # Replace with actual admin email
        "password": "testpass123"   # Replace with actual password
    }
    
    print("Testing Staff API endpoints...")
    
    try:
        # Login
        login_response = requests.post(f"{base_url}/api/v1/auth/login/", json=login_data)
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.status_code} - {login_response.text}")
            return
        
        token_data = login_response.json()
        access_token = token_data.get('access')
        
        if not access_token:
            print("No access token received")
            return
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        # Test staff endpoint
        staff_response = requests.get(f"{base_url}/api/v1/users/staff/", headers=headers)
        
        if staff_response.status_code == 200:
            staff_data = staff_response.json()
            print(f"Staff endpoint returned {len(staff_data)} records")
            
            if staff_data:
                print("Sample staff record structure:")
                print(json.dumps(staff_data[0], indent=2))
                
                # Check role distribution
                roles = {}
                for staff in staff_data:
                    user_role = staff.get('user', {}).get('role', 'Unknown')
                    roles[user_role] = roles.get(user_role, 0) + 1
                
                print(f"\nRole distribution: {roles}")
            else:
                print("No staff records found")
        else:
            print(f"Staff endpoint failed: {staff_response.status_code} - {staff_response.text}")
    
    except requests.exceptions.ConnectionError:
        print("Backend server is not running on localhost:8000")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_staff_api()