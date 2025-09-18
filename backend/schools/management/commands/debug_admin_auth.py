"""
Management command to debug admin authentication
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import authenticate, get_user_model
from schools.models import School


class Command(BaseCommand):
    help = 'Debug admin authentication'
    
    def handle(self, *args, **options):
        school_code = 'RAJGOV02402'
        
        # Get the school
        school = School.objects.get(school_code=school_code)
        
        self.stdout.write(f'Testing authentication for school: {school.school_name}')
        self.stdout.write(f'School code: {school.school_code}')
        
        # Get admin user
        User = get_user_model()
        admin_user = User.objects.filter(
            email=school.get_admin_email(),
            role='admin',
            school=school
        ).first()
        
        if not admin_user:
            self.stdout.write(self.style.ERROR('No admin user found!'))
            return
        
        self.stdout.write(f'Admin user found: {admin_user.email}')
        self.stdout.write(f'Admin username: {admin_user.username}')
        self.stdout.write(f'Admin is_active: {admin_user.is_active}')
        
        # Test different authentication methods
        email = school.get_admin_email()
        password = school.get_admin_password()
        username = school.get_admin_username()
        
        self.stdout.write('\n' + '='*50)
        self.stdout.write('TESTING AUTHENTICATION METHODS:')
        self.stdout.write('='*50)
        
        # Method 1: Authenticate with email
        self.stdout.write(f'Testing with email: {email} / {password}')
        auth_user1 = authenticate(username=email, password=password)
        self.stdout.write(f'Result: {"SUCCESS" if auth_user1 else "FAILED"}')
        
        # Method 2: Authenticate with username  
        self.stdout.write(f'Testing with username: {username} / {password}')
        auth_user2 = authenticate(username=username, password=password)
        self.stdout.write(f'Result: {"SUCCESS" if auth_user2 else "FAILED"}')
        
        # Method 3: Check password directly
        self.stdout.write(f'Testing password check directly...')
        password_valid = admin_user.check_password(password)
        self.stdout.write(f'Password valid: {"YES" if password_valid else "NO"}')
        
        # Method 4: Try to login manually by setting a new password
        self.stdout.write('\nSetting password manually...')
        admin_user.set_password(password)
        admin_user.save()
        
        # Test again
        auth_user3 = authenticate(username=email, password=password)
        self.stdout.write(f'After manual password set: {"SUCCESS" if auth_user3 else "FAILED"}')
        
        if auth_user3:
            self.stdout.write(
                self.style.SUCCESS(f'✓ Authentication successful with {email} / {password}')
            )
        else:
            self.stdout.write(
                self.style.ERROR('✗ Authentication still failing')
            )