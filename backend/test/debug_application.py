"""
Debug script to check the actual database status for a specific application
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

def debug_application_status():
    """Check the actual database status for the Frank Mathew Sajan application"""
    
    print("=== Debug Application Status ===\n")
    
    try:
        app = AdmissionApplication.objects.get(reference_id='ADM-2025-QFYS29')
        print(f"Application: {app.applicant_name} ({app.reference_id})")
        print(f"Overall Status: {app.status}")
        print(f"Application Date: {app.application_date}")
        print(f"Reviewed By: {app.reviewed_by}")
        print(f"Review Date: {app.review_date}")
        
        print(f"\n📋 School Decisions:")
        decisions = app.school_decisions.all().order_by('preference_order')
        
        for decision in decisions:
            print(f"\n🏫 {decision.school.school_name}")
            print(f"   Preference: {decision.preference_order}")
            print(f"   Decision: {decision.decision}")
            print(f"   Decision Date: {decision.decision_date}")
            print(f"   Reviewed By: {decision.reviewed_by}")
            print(f"   Enrollment Status: {decision.enrollment_status}")
            print(f"   Enrollment Date: {decision.enrollment_date}")
            print(f"   Withdrawal Date: {decision.withdrawal_date}")
            print(f"   Is Student Choice: {decision.is_student_choice}")
            print(f"   Student Choice Date: {decision.student_choice_date}")
            print(f"   Can Enroll: {decision.can_enroll()}")
            print(f"   Can Withdraw: {decision.can_withdraw()}")
            
        print(f"\n🔍 Application Level:")
        print(f"   Has Active Enrollment: {app.has_active_enrollment()}")
        active_enrollment = app.get_active_enrollment()
        if active_enrollment:
            print(f"   Active Enrollment: {active_enrollment.school.school_name}")
        else:
            print(f"   Active Enrollment: None")
            
    except AdmissionApplication.DoesNotExist:
        print("❌ Application ADM-2025-QFYS29 not found!")
        
        # Show all applications
        print("\nAvailable applications:")
        for app in AdmissionApplication.objects.all():
            print(f"  - {app.applicant_name} ({app.reference_id})")

if __name__ == "__main__":
    debug_application_status()