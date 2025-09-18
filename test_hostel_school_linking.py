#!/usr/bin/env python3
"""
Test script to verify hostel school linking functionality
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_hostel_school_linking():
    """Test that hostel blocks are properly linked to schools"""
    
    # Test credentials (you may need to adjust these)
    test_user = {
        "username": "admin",  # Replace with your test admin username
        "password": "admin123"  # Replace with your test admin password
    }
    
    session = requests.Session()
    
    # 1. Login
    print("1. Logging in...")
    login_response = session.post(f"{BASE_URL}/api/v1/users/login/", json=test_user)
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        return
    
    print("✅ Login successful")
    
    # 2. Get current user profile to check school
    print("\n2. Getting user profile...")
    profile_response = session.get(f"{BASE_URL}/api/v1/users/profile/")
    
    if profile_response.status_code != 200:
        print(f"❌ Profile fetch failed: {profile_response.status_code}")
        return
    
    profile_data = profile_response.json()
    user_school_id = profile_data.get('school', {}).get('id') if profile_data.get('school') else None
    print(f"✅ User school ID: {user_school_id}")
    
    # 3. Test creating a hostel block
    print("\n3. Creating test hostel block...")
    test_block = {
        "name": "Test Block School Link",
        "description": "Testing school linking functionality",
        "total_floors": 2,
        "floor_config": [10, 10],
        "total_rooms": 20,
        "school": user_school_id  # This should be automatically set by the backend
    }
    
    create_response = session.post(f"{BASE_URL}/api/v1/hostel/blocks/", json=test_block)
    
    if create_response.status_code not in [200, 201]:
        print(f"❌ Block creation failed: {create_response.status_code}")
        print(create_response.text)
        return
    
    created_block = create_response.json()
    block_id = created_block['id']
    print(f"✅ Block created with ID: {block_id}")
    print(f"✅ Block school: {created_block.get('school')}")
    
    # 4. Verify the block appears in the list (filtered by school)
    print("\n4. Fetching hostel blocks...")
    blocks_response = session.get(f"{BASE_URL}/api/v1/hostel/blocks/")
    
    if blocks_response.status_code != 200:
        print(f"❌ Failed to fetch blocks: {blocks_response.status_code}")
        return
    
    blocks_data = blocks_response.json()
    print(f"✅ Found {len(blocks_data)} blocks for this school")
    
    # Check if our created block is in the list
    our_block = next((b for b in blocks_data if b['id'] == block_id), None)
    if our_block:
        print(f"✅ Created block found in school-filtered list")
        print(f"   Block: {our_block['name']}, School: {our_block.get('school')}")
    else:
        print(f"❌ Created block not found in school-filtered list")
    
    # 5. Test rooms filtering
    print("\n5. Fetching hostel rooms...")
    rooms_response = session.get(f"{BASE_URL}/api/v1/hostel/rooms/")
    
    if rooms_response.status_code != 200:
        print(f"❌ Failed to fetch rooms: {rooms_response.status_code}")
    else:
        rooms_data = rooms_response.json()
        print(f"✅ Found {len(rooms_data)} rooms for this school")
        
        # Check if rooms belong to blocks from the same school
        school_rooms = [r for r in rooms_data if r.get('block') == block_id]
        print(f"✅ Found {len(school_rooms)} rooms for our test block")
    
    # 6. Test allocations filtering
    print("\n6. Fetching hostel allocations...")
    allocations_response = session.get(f"{BASE_URL}/api/v1/hostel/allocations/")
    
    if allocations_response.status_code != 200:
        print(f"❌ Failed to fetch allocations: {allocations_response.status_code}")
    else:
        allocations_data = allocations_response.json()
        print(f"✅ Found {len(allocations_data)} allocations for this school")
    
    # 7. Cleanup: Delete the test block
    print(f"\n7. Cleaning up test block {block_id}...")
    delete_response = session.delete(f"{BASE_URL}/api/v1/hostel/blocks/{block_id}/")
    
    if delete_response.status_code in [200, 204]:
        print("✅ Test block deleted successfully")
    else:
        print(f"⚠️  Failed to delete test block: {delete_response.status_code}")
    
    print("\n🎉 School linking test completed!")

if __name__ == "__main__":
    test_hostel_school_linking()