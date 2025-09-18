from django.core.management.base import BaseCommand
from schools.models import School
from users.models import User


class Command(BaseCommand):
    help = 'Create a test school and verify the system works'

    def handle(self, *args, **options):
        # Create a test school
        school, created = School.objects.get_or_create(
            school_code='8211500106',
            defaults={
                'district': 'AJMER',
                'block': 'AJMER(U)',
                'village': 'NP_AJMERCITY_WARD NO. 1',
                'school_name': 'G.SEC.SCHOOL KOTDA AJMERCITY',
                'is_active': True,
                'contact_email': 'admin@gseckotda.edu.in'
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'Created test school: {school.school_name}')
            )
            self.stdout.write(
                self.style.SUCCESS(f'Admin username: {school.get_admin_username()}')
            )
            self.stdout.write(
                self.style.SUCCESS(f'Admin password: {school.get_admin_password()}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'School already exists: {school.school_name}')
            )
        
        # Check if admin user was created
        admin_username = school.get_admin_username()
        try:
            admin_user = User.objects.get(username=admin_username)
            self.stdout.write(
                self.style.SUCCESS(f'Admin user exists: {admin_user.email}')
            )
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Admin user not found: {admin_username}')
            )
        
        self.stdout.write(
            self.style.SUCCESS('Test school setup completed!')
        )