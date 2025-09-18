"""
Fix data inconsistency - student cannot be both enrolled and withdrawn simultaneously
"""

import os
import sys
import django

# Add the backend directory to the path
sys.path.append('/backend')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from admissions.models import SchoolAdmissionDecision
from django.utils import timezone

def fix_enrollment_inconsistency():
    """Fix decisions that have both enrollment and withdrawal dates"""
    
    print("=== Fixing Enrollment Data Inconsistency ===\n")
    
    # Find decisions with both enrollment and withdrawal dates
    inconsistent_decisions = SchoolAdmissionDecision.objects.filter(
        enrollment_date__isnull=False,
        withdrawal_date__isnull=False
    )
    
    print(f"Found {inconsistent_decisions.count()} decisions with both enrollment and withdrawal dates")
    
    for decision in inconsistent_decisions:
        print(f"\n🔧 Fixing: {decision.application.applicant_name} at {decision.school.school_name}")
        print(f"   Current Status: {decision.enrollment_status}")
        print(f"   Enrollment Date: {decision.enrollment_date}")
        print(f"   Withdrawal Date: {decision.withdrawal_date}")
        
        # If withdrawal date is after enrollment date, student should be withdrawn
        if decision.withdrawal_date and decision.enrollment_date:
            if decision.withdrawal_date > decision.enrollment_date:
                if decision.enrollment_status != 'withdrawn':
                    print(f"   ❌ Status should be 'withdrawn' but is '{decision.enrollment_status}'")
                    decision.enrollment_status = 'withdrawn'
                    decision.is_student_choice = False
                    decision.save()
                    print(f"   ✅ Fixed: Set status to 'withdrawn'")
                else:
                    print(f"   ✅ Status is correct: 'withdrawn'")
            else:
                # Enrollment date is after withdrawal date - this is weird, fix it
                print(f"   ⚠️  Enrollment date is after withdrawal date - clearing withdrawal")
                decision.withdrawal_date = None
                decision.withdrawal_reason = ""
                if decision.enrollment_status != 'enrolled':
                    decision.enrollment_status = 'enrolled'
                    decision.is_student_choice = True
                decision.save()
                print(f"   ✅ Fixed: Cleared withdrawal, set status to 'enrolled'")

if __name__ == "__main__":
    fix_enrollment_inconsistency()