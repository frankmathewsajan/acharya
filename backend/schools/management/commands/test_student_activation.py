from django.core.management.base import BaseCommand
from schools.models import School
from users.models import User, StudentProfile
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Test student activation workflow'

    def handle(self, *args, **options):
        self.stdout.write("Testing student activation workflow...")
        
        # First, get or create a test school
        try:
            school = School.objects.first()
            if not school:
                school = School.objects.create(
                    school_name="Test Government School",
                    school_code="TGS001",
                    address="Test Address, Rajasthan",
                    phone_number="9876543210",
                    email="admin@tgs001.rj.gov.in",
                    is_active=True
                )
                self.stdout.write(f"Created test school: {school.school_name}")
            else:
                self.stdout.write(f"Using existing school: {school.school_name}")
                
        except Exception as e:
            self.stdout.write(f"Error getting/creating school: {str(e)}")
            return
        
        # Create a test student profile without a user
        try:
            # Delete existing test student if exists
            StudentProfile.objects.filter(admission_number="TEST001").delete()
            
            student = StudentProfile.objects.create(
                school=school,
                first_name="Test",
                last_name="Student", 
                admission_number="TEST001",
                roll_number="R001",
                course="Computer Science",
                department="Engineering",
                semester=1,
                date_of_birth="2000-01-01",
                address="Test Address",
                emergency_contact="9876543210",
                is_hostelite=False,
                is_active=False  # Student starts inactive
            )
            self.stdout.write(f"Created inactive student: {student.full_name}")
            self.stdout.write(f"Student has user: {student.user is not None}")
            
        except Exception as e:
            self.stdout.write(f"Error creating student: {str(e)}")
            return
        
        # Now activate the student - this should trigger user creation
        try:
            self.stdout.write("\\nActivating student...")
            student.is_active = True
            student.save()
            
            # Refresh from database
            student.refresh_from_db()
            
            self.stdout.write(f"Student is now active: {student.is_active}")
            self.stdout.write(f"Student now has user: {student.user is not None}")
            
            if student.user:
                self.stdout.write(f"User email: {student.user.email}")
                self.stdout.write(f"User role: {student.user.role}")
                self.stdout.write(f"User school: {student.user.school}")
                self.stdout.write(f"User is active: {student.user.is_active}")
                
                # Test student credentials generation
                email, password = student.generate_student_credentials()
                self.stdout.write(f"Generated credentials - Email: {email}, Password: {password}")
                
        except Exception as e:
            self.stdout.write(f"Error activating student: {str(e)}")
            return
        
        # Test deactivation
        try:
            self.stdout.write("\\nDeactivating student...")
            student.is_active = False
            student.save()
            
            student.refresh_from_db()
            self.stdout.write(f"Student is now inactive: {not student.is_active}")
            self.stdout.write(f"Student still has user: {student.user is not None}")
            
            if student.user:
                self.stdout.write(f"User is still active: {student.user.is_active}")
                
        except Exception as e:
            self.stdout.write(f"Error deactivating student: {str(e)}")
        
        self.stdout.write("\\nStudent activation workflow test completed!")