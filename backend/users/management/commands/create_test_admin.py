from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from schools.models import School

User = get_user_model()


class Command(BaseCommand):
    help = 'Create a test admin user with school assignment'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Admin email', default='admin@acharya.edu')
        parser.add_argument('--password', type=str, help='Admin password', default='admin123')
        parser.add_argument('--school-name', type=str, help='School name', default='Acharya Test School')

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        school_name = options['school_name']

        # Create or get school
        school, created = School.objects.get_or_create(
            school_name=school_name,
            defaults={
                'school_code': 'ATS001',
                'district': 'Jaipur',
                'block': 'Central',
                'village': 'Jaipur City',
                'is_active': True,
                'contact_email': email,
                'contact_phone': '9876543210',
                'address': '123 Test Street, Jaipur, Rajasthan'
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f'Created school: {school.school_name}'))
        else:
            self.stdout.write(f'Using existing school: {school.school_name}')

        # Create or update admin user
        try:
            user = User.objects.get(email=email)
            # Update existing user
            user.role = 'admin'
            user.school = school
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Updated existing admin user: {user.email}'))
        except User.DoesNotExist:
            # Create new user with unique username
            base_username = email.split('@')[0]
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            
            user = User.objects.create(
                email=email,
                username=username,
                first_name='Admin',
                last_name='User',
                role='admin',
                school=school,
                is_staff=True,
                is_superuser=True,
                is_active=True
            )
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Created new admin user: {user.email}'))

        self.stdout.write(
            self.style.SUCCESS(
                f'\nTest admin user created successfully!\n'
                f'Email: {email}\n'
                f'Password: {password}\n'
                f'School: {school.school_name}\n'
                f'You can now login to the dashboard.'
            )
        )