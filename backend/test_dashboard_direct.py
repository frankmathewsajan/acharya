#!/usr/bin/env python
"""Test parent dashboard by directly creating session token"""

import os
import django

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.test.client import Client
from django.core.cache import cache
from users.models import ParentProfile
import json
import uuid
import time

def test_dashboard_direct():
    """Test dashboard by directly creating session token"""
    
    # Get a parent
    parent = ParentProfile.objects.select_related('student').first()
    if not parent:
        print("No parent profiles found")
        return
        
    print(f"Testing dashboard for: {parent.full_name} ({parent.email})")
    print(f"Student: {parent.student.full_name if parent.student else 'No student'}")
    
    # Create session token directly
    session_token = str(uuid.uuid4())
    session_data = {
        'parent_id': parent.id,
        'student_id': parent.student.id if parent.student else None,
        'email': parent.email,
        'timestamp': int(time.time()),
        'expires_at': int(time.time()) + (4 * 60 * 60)  # 4 hours
    }
    
    # Store in cache
    cache.set(f"parent_session_{session_token}", session_data, timeout=4*60*60)
    print(f"Created session token: {session_token}")
    
    # Test dashboard
    client = Client()
    response = client.get('/api/v1/users/parent/dashboard/', 
                         HTTP_X_PARENT_TOKEN=session_token)
    
    print(f"\nDashboard status: {response.status_code}")
    if response.status_code == 200:
        dashboard_data = json.loads(response.content)
        print(f"✓ Dashboard successful!")
        print(f"Student Name: {dashboard_data.get('student', {}).get('name', 'N/A')}")
        print(f"Attendance: {dashboard_data.get('attendance', {}).get('percentage', 'N/A')}%")
        print(f"Pending Fees: ₹{dashboard_data.get('fees', {}).get('pending_amount', 'N/A')}")
        print(f"Recent Exams: {len(dashboard_data.get('exams', {}).get('recent_results', []))}")
        print(f"Notices: {len(dashboard_data.get('notices', []))}")
    else:
        print(f"Error: {response.content}")

if __name__ == "__main__":
    test_dashboard_direct()