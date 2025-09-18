from django.core.management.base import BaseCommand
from django.utils import timezone
from admissions.models import AdmissionApplication, SchoolAdmissionDecision
from schools.models import School
import random


class Command(BaseCommand):
    help = 'Create test admission applications'

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, help='Number of applications to create', default=5)

    def handle(self, *args, **options):
        count = options['count']
        
        # Get available schools
        schools = list(School.objects.filter(is_active=True))
        if not schools:
            self.stdout.write(self.style.ERROR('No active schools found. Please create schools first.'))
            return

        courses = [
            'Class 10 - Science',
            'Class 10 - Arts', 
            'Class 12 - Science',
            'Class 12 - Commerce',
            'Class 12 - Arts'
        ]

        for i in range(count):
            # Create application
            app = AdmissionApplication.objects.create(
                applicant_name=f'Test Student {i+1}',
                email=f'student{i+1}@test.com',
                phone_number=f'987654321{i}',
                date_of_birth='2005-06-15',
                address=f'Test Address {i+1}, Jaipur, Rajasthan',
                course_applied=random.choice(courses),
                first_preference_school=random.choice(schools),
                second_preference_school=random.choice(schools) if len(schools) > 1 else None,
                third_preference_school=random.choice(schools) if len(schools) > 2 else None,
                previous_school=f'Previous School {i+1}',
                last_percentage=random.randint(70, 95),
                status='pending'
            )
            
            self.stdout.write(f'Created application: {app.reference_id} - {app.applicant_name}')

        self.stdout.write(
            self.style.SUCCESS(f'\nCreated {count} test admission applications successfully!')
        )