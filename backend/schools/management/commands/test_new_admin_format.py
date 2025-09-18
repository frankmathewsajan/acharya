"""
Management command to test new admin credential format
"""
from django.core.management.base import BaseCommand
from schools.models import School


class Command(BaseCommand):
    help = 'Test new admin credential format'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--school-code', 
            type=str, 
            default='RAJGOV02402',
            help='School code to test with (default: RAJGOV02402)'
        )
    
    def handle(self, *args, **options):
        school_code = options['school_code']
        
        # Create or get test school
        school, created = School.objects.get_or_create(
            school_code=school_code,
            defaults={
                'district': 'Test District',
                'block': 'Test Block', 
                'village': 'Test Village',
                'school_name': f'Test School {school_code[-5:]}',
                'is_active': False,  # Start inactive
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'Created test school: {school.school_name}')
            )
        
        self.stdout.write(f'School Code: {school.school_code}')
        self.stdout.write(f'Last 5 digits: {school.school_code[-5:]}')
        
        # Show new credential format
        self.stdout.write('\n' + '='*50)
        self.stdout.write('NEW ADMIN CREDENTIAL FORMAT:')
        self.stdout.write('='*50)
        self.stdout.write(f'Username: {school.get_admin_username()}')
        self.stdout.write(f'Email: {school.get_admin_email()}')
        self.stdout.write(f'Password: {school.get_admin_password()}')
        
        # Test activation
        self.stdout.write('\n' + '='*50)
        self.stdout.write('TESTING SCHOOL ACTIVATION:')
        self.stdout.write('='*50)
        
        school.is_active = True
        school.save()
        
        self.stdout.write(
            self.style.SUCCESS('✓ School activated - Admin user should be created')
        )
        
        # Verify admin was created
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        admin_user = User.objects.filter(
            email=school.get_admin_email(),
            role='admin',
            school=school
        ).first()
        
        if admin_user:
            self.stdout.write(
                self.style.SUCCESS(f'✓ Admin user created successfully!')
            )
            self.stdout.write(f'  - Username: {admin_user.username}')
            self.stdout.write(f'  - Email: {admin_user.email}')
            self.stdout.write(f'  - Role: {admin_user.role}')
            self.stdout.write(f'  - School: {admin_user.school.school_name}')
            self.stdout.write(f'  - Active: {admin_user.is_active}')
            
            # Test login credentials
            from django.contrib.auth import authenticate
            auth_user = authenticate(
                username=admin_user.email,  # Use email as username
                password=school.get_admin_password()
            )
            
            if auth_user:
                self.stdout.write(
                    self.style.SUCCESS('✓ Admin can authenticate with new credentials!')
                )
            else:
                self.stdout.write(
                    self.style.ERROR('✗ Admin authentication failed!')
                )
        else:
            self.stdout.write(
                self.style.ERROR('✗ Admin user was not created!')
            )