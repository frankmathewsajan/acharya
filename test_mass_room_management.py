#!/usr/bin/env python3
"""
Test script for mass room management functionality
"""

import requests
import json
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

BASE_URL = "http://localhost:8000/api"

def test_mass_room_management():
    """Test the mass room management endpoints"""
    
    # Test credentials (replace with actual test user)
    login_data = {
        "email": "admin@test.com",
        "password": "admin123"
    }
    
    session = requests.Session()
    
    try:
        # Login
        print("🔐 Logging in...")
        login_response = session.post(f"{BASE_URL}/auth/login/", json=login_data)
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.text}")
            return False
        
        login_result = login_response.json()
        print(f"✅ Login successful for user: {login_result.get('user', {}).get('email')}")
        
        # Set authorization header
        if 'access_token' in login_result:
            session.headers.update({'Authorization': f'Bearer {login_result["access_token"]}'})
        
        # Test room filter options endpoint
        print("\n📋 Testing room filter options...")
        filter_response = session.get(f"{BASE_URL}/hostel/rooms/filter_options/")
        if filter_response.status_code == 200:
            filter_data = filter_response.json()
            print(f"✅ Filter options retrieved:")
            print(f"   - Blocks: {len(filter_data.get('blocks', []))}")
            print(f"   - Floors: {filter_data.get('floors', [])}")
            print(f"   - Room Types: {len(filter_data.get('room_types', []))}")
            print(f"   - AC Types: {len(filter_data.get('ac_types', []))}")
        else:
            print(f"❌ Failed to get filter options: {filter_response.text}")
            return False
        
        # Get existing rooms for testing
        print("\n🏠 Getting existing rooms...")
        rooms_response = session.get(f"{BASE_URL}/hostel/rooms/")
        if rooms_response.status_code != 200:
            print(f"❌ Failed to get rooms: {rooms_response.text}")
            return False
        
        rooms_data = rooms_response.json()
        rooms = rooms_data.get('results', rooms_data) if isinstance(rooms_data, dict) else rooms_data
        print(f"✅ Found {len(rooms)} rooms")
        
        if len(rooms) == 0:
            print("⚠️  No rooms found to test mass management")
            return True
        
        # Test mass update with selected room IDs
        print("\n🔄 Testing mass update with selected rooms...")
        if len(rooms) >= 2:
            test_room_ids = [rooms[0]['id'], rooms[1]['id']]
            mass_update_data = {
                "room_ids": test_room_ids,
                "update_data": {
                    "amenities": "Test Mass Update - Updated Amenities"
                }
            }
            
            mass_update_response = session.post(
                f"{BASE_URL}/hostel/rooms/mass_update/", 
                json=mass_update_data
            )
            
            if mass_update_response.status_code == 200:
                result = mass_update_response.json()
                print(f"✅ Mass update successful: {result.get('updated_count', 0)} rooms updated")
                if result.get('errors'):
                    print(f"⚠️  Errors: {result['errors']}")
            else:
                print(f"❌ Mass update failed: {mass_update_response.text}")
                return False
        
        # Test mass update by criteria
        print("\n🎯 Testing mass update by criteria...")
        if filter_data.get('blocks') and len(filter_data['blocks']) > 0:
            criteria_data = {
                "filters": {
                    "block_ids": [filter_data['blocks'][0]['id']]
                },
                "update_data": {
                    "amenities": "Test Criteria Update - Block Wide Update"
                }
            }
            
            criteria_response = session.post(
                f"{BASE_URL}/hostel/rooms/mass_update_by_criteria/", 
                json=criteria_data
            )
            
            if criteria_response.status_code == 200:
                result = criteria_response.json()
                print(f"✅ Criteria update successful: {result.get('updated_count', 0)} out of {result.get('total_matched', 0)} rooms updated")
                if result.get('errors'):
                    print(f"⚠️  Errors: {result['errors']}")
            else:
                print(f"❌ Criteria update failed: {criteria_response.text}")
                return False
        
        # Test bed management
        print("\n🛏️  Testing bed management...")
        if len(rooms) > 0:
            test_room = rooms[0]
            bed_data = {
                "room_id": test_room['id'],
                "bed_count": 3,
                "bed_type": "single"
            }
            
            bed_response = session.post(
                f"{BASE_URL}/hostel/beds/generate_beds/", 
                json=bed_data
            )
            
            if bed_response.status_code == 200:
                result = bed_response.json()
                print(f"✅ Bed generation successful: {result.get('beds_created', 0)} beds created")
            else:
                print(f"❌ Bed generation failed: {bed_response.text}")
                return False
        
        # Test mass bed update
        print("\n🛏️  Testing mass bed update...")
        if len(rooms) >= 2:
            mass_bed_data = {
                "room_ids": [rooms[0]['id'], rooms[1]['id']],
                "bed_count": 2,
                "bed_type": "single"
            }
            
            mass_bed_response = session.post(
                f"{BASE_URL}/hostel/beds/mass_update_beds/", 
                json=mass_bed_data
            )
            
            if mass_bed_response.status_code == 200:
                result = mass_bed_response.json()
                print(f"✅ Mass bed update successful: {result.get('updated_rooms', 0)} rooms updated, {result.get('total_beds_created', 0)} total beds created")
            else:
                print(f"❌ Mass bed update failed: {mass_bed_response.text}")
                return False
        
        print("\n🎉 All mass room management tests passed!")
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection error. Make sure the Django server is running on localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Mass Room Management Functionality\n")
    success = test_mass_room_management()
    
    if success:
        print("\n✅ All tests completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed!")
        sys.exit(1)