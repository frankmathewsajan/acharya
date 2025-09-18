"""
Test script to verify single enrollment logic
"""

import os
import sys
import django

# Add the backend directory to the path
sys.path.append('/backend')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from admissions.models import AdmissionApplication, SchoolAdmissionDecision
from schools.models import School

def test_single_enrollment_logic():
    """Test that single enrollment logic works correctly"""
    
    print("=== Testing Single Enrollment Logic ===\n")
    
    # Get a sample application (assuming there are applications in the database)
    applications = AdmissionApplication.objects.all()[:1]
    
    if not applications:
        print("ERROR: No applications found in database. Please create test data first.")
        return
    
    app = applications[0]
    print(f"Testing with application: {app.applicant_name} ({app.reference_id})")
    
    # Get all decisions for this application
    decisions = app.school_decisions.all()
    
    if not decisions:
        print("ERROR: No school decisions found for this application.")
        return
    
    print(f"\nFound {decisions.count()} school decisions:")
    
    for decision in decisions:
        print(f"\nSCHOOL: {decision.school.school_name} ({decision.preference_order} preference)")
        print(f"   Decision: {decision.decision}")
        print(f"   Enrollment Status: {decision.enrollment_status}")
        print(f"   Can Enroll: {decision.can_enroll()}")
        print(f"   Can Withdraw: {decision.can_withdraw()}")
        
        if decision.enrollment_status == 'enrolled':
            print(f"   Enrolled on: {decision.enrollment_date}")
    
    # Test application-level methods
    print(f"\nApplication-level checks:")
    print(f"   Has Active Enrollment: {app.has_active_enrollment()}")
    
    active_enrollment = app.get_active_enrollment()
    if active_enrollment:
        print(f"   Active Enrollment: {active_enrollment.school.school_name}")
    else:
        print(f"   Active Enrollment: None")
    
    # Count enrollable decisions
    enrollable_count = sum(1 for decision in decisions if decision.can_enroll())
    print(f"   Enrollable Decisions: {enrollable_count}")
    
    if app.has_active_enrollment() and enrollable_count > 0:
        print("   ERROR: Student has active enrollment but still has enrollable decisions!")
    elif not app.has_active_enrollment() and enrollable_count == 0:
        accepted_decisions = decisions.filter(decision='accepted', enrollment_status='not_enrolled')
        if accepted_decisions.exists():
            print("   ERROR: Student has accepted decisions but cannot enroll!")
    else:
        print("   SUCCESS: Enrollment logic is working correctly!")

if __name__ == "__main__":
    test_single_enrollment_logic()