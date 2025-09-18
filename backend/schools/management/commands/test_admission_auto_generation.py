from django.core.management.base import BaseCommand
from schools.models import School
from users.models import StudentProfile
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Test auto-generation of admission numbers'

    def handle(self, *args, **options):
        self.stdout.write("Testing auto-generation of admission numbers...")
        
        # Get a test school
        try:
            school = School.objects.first()
            if not school:
                self.stdout.write("No school found. Please create a school first.")
                return
                
            self.stdout.write(f"Using school: {school.school_name}")
            
        except Exception as e:
            self.stdout.write(f"Error getting school: {str(e)}")
            return
        
        # Create students without admission numbers
        try:
            # Don't delete existing test students this time - let's see what happens
            self.stdout.write("\\nExisting students with 5-digit admission numbers:")
            existing = StudentProfile.objects.filter(
                school=school,
                admission_number__regex=r'^\d{5}$'
            ).values_list('admission_number', 'first_name', 'last_name')
            for adm_num, fname, lname in existing:
                self.stdout.write(f"  {adm_num}: {fname} {lname}")
            
            for i in range(3):
                student = StudentProfile.objects.create(
                    school=school,
                    first_name="AutoTest",
                    last_name=f"Student{i+1}",
                    # admission_number is intentionally left blank
                    roll_number=f"R{i+1:03d}",
                    course="Test Course",
                    department="Test Department",
                    semester=1,
                    date_of_birth="2000-01-01",
                    address="Test Address",
                    emergency_contact="9876543210",
                    is_hostelite=False,
                    is_active=False
                )
                
                self.stdout.write(f"Created student {i+1}: {student.full_name}")
                self.stdout.write(f"  Auto-generated admission number: {student.admission_number}")
                
        except Exception as e:
            self.stdout.write(f"Error creating students: {str(e)}")
            return
        
        # Test creating a student with manual admission number
        try:
            manual_student = StudentProfile.objects.create(
                school=school,
                first_name="Manual",
                last_name="Student",
                admission_number="99999",  # Manual admission number
                roll_number="M001",
                course="Test Course",
                department="Test Department",
                semester=1,
                date_of_birth="2000-01-01",
                address="Test Address",
                emergency_contact="9876543210",
                is_hostelite=False,
                is_active=False
            )
            
            self.stdout.write(f"\\nCreated manual student: {manual_student.full_name}")
            self.stdout.write(f"  Manual admission number: {manual_student.admission_number}")
            
        except Exception as e:
            self.stdout.write(f"Error creating manual student: {str(e)}")
        
        # Create another auto student to see if it continues from the highest
        try:
            auto_student = StudentProfile.objects.create(
                school=school,
                first_name="AutoAfter",
                last_name="Manual",
                # admission_number is intentionally left blank
                roll_number="A001",
                course="Test Course",
                department="Test Department",
                semester=1,
                date_of_birth="2000-01-01",
                address="Test Address",
                emergency_contact="9876543210",
                is_hostelite=False,
                is_active=False
            )
            
            self.stdout.write(f"\\nCreated auto student after manual: {auto_student.full_name}")
            self.stdout.write(f"  Auto-generated admission number: {auto_student.admission_number}")
            
        except Exception as e:
            self.stdout.write(f"Error creating auto student: {str(e)}")
            
        self.stdout.write("\\nAuto-generation test completed!")