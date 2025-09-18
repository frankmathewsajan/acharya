"""
Data cleanup script to ensure enrollment status consistency
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
from django.utils import timezone

def cleanup_enrollment_data():
    """Clean up any inconsistent enrollment data"""
    
    print("=== Enrollment Data Cleanup ===\n")
    
    # Find decisions with enrollment_date but enrollment_status != 'enrolled'
    inconsistent_enrolled = SchoolAdmissionDecision.objects.filter(
        enrollment_date__isnull=False,
        enrollment_status__in=['not_enrolled', 'withdrawn']
    )
    
    print(f"Found {inconsistent_enrolled.count()} decisions with enrollment_date but wrong status")
    
    # Find decisions with withdrawal_date but enrollment_status != 'withdrawn'
    inconsistent_withdrawn = SchoolAdmissionDecision.objects.filter(
        withdrawal_date__isnull=False
    ).exclude(enrollment_status='withdrawn')
    
    print(f"Found {inconsistent_withdrawn.count()} decisions with withdrawal_date but wrong status")
    
    # Find decisions marked as enrolled but no enrollment_date
    no_enrollment_date = SchoolAdmissionDecision.objects.filter(
        enrollment_status='enrolled',
        enrollment_date__isnull=True
    )
    
    print(f"Found {no_enrollment_date.count()} enrolled decisions without enrollment_date")
    
    if no_enrollment_date.exists():
        print("Setting enrollment_date for enrolled decisions without date...")
        for decision in no_enrollment_date:
            decision.enrollment_date = decision.decision_date or timezone.now()
            decision.save()
            print(f"  ✅ Set enrollment_date for {decision.application.applicant_name} at {decision.school.school_name}")
    
    # Find decisions marked as withdrawn but no withdrawal_date
    no_withdrawal_date = SchoolAdmissionDecision.objects.filter(
        enrollment_status='withdrawn',
        withdrawal_date__isnull=True
    )
    
    print(f"Found {no_withdrawal_date.count()} withdrawn decisions without withdrawal_date")
    
    if no_withdrawal_date.exists():
        print("Setting withdrawal_date for withdrawn decisions without date...")
        for decision in no_withdrawal_date:
            decision.withdrawal_date = timezone.now()
            decision.save()
            print(f"  ✅ Set withdrawal_date for {decision.application.applicant_name} at {decision.school.school_name}")
    
    print("\n=== Summary ===")
    
    # Summary of current enrollment statuses
    total_decisions = SchoolAdmissionDecision.objects.count()
    enrolled_count = SchoolAdmissionDecision.objects.filter(enrollment_status='enrolled').count()
    withdrawn_count = SchoolAdmissionDecision.objects.filter(enrollment_status='withdrawn').count()
    not_enrolled_count = SchoolAdmissionDecision.objects.filter(enrollment_status='not_enrolled').count()
    
    print(f"Total Decisions: {total_decisions}")
    print(f"  ✅ Enrolled: {enrolled_count}")
    print(f"  ❌ Withdrawn: {withdrawn_count}")
    print(f"  ⏳ Not Enrolled: {not_enrolled_count}")
    
    # Check for multiple enrollments
    applications_with_multiple_enrollments = []
    for app in AdmissionApplication.objects.all():
        enrolled_count = app.school_decisions.filter(enrollment_status='enrolled').count()
        if enrolled_count > 1:
            applications_with_multiple_enrollments.append(app)
    
    if applications_with_multiple_enrollments:
        print(f"\n⚠️  WARNING: Found {len(applications_with_multiple_enrollments)} applications with multiple enrollments:")
        for app in applications_with_multiple_enrollments:
            enrolled_schools = app.school_decisions.filter(enrollment_status='enrolled')
            school_names = [d.school.school_name for d in enrolled_schools]
            print(f"  - {app.applicant_name} ({app.reference_id}): {', '.join(school_names)}")
    else:
        print(f"\n✅ No multiple enrollments found - data is consistent!")

if __name__ == "__main__":
    cleanup_enrollment_data()