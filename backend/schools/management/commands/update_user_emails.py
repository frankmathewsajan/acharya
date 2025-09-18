"""
Management command to update all existing users to the new email format
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from schools.models import School
from users.models import User


class Command(BaseCommand):
    help = 'Update all existing users to the new email format'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making changes',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Update emails even if users already have the new format',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        force = options['force']
        
        if dry_run:
            self.stdout.write("🔍 DRY RUN - No changes will be made")
        else:
            self.stdout.write("📧 Updating user email formats...")
        
        updated_count = 0
        skipped_count = 0
        error_count = 0
        
        # Process all users with schools
        users = User.objects.filter(school__isnull=False).select_related('school')
        
        for user in users:
            try:
                # Generate new email based on role
                new_email = user.generate_email_from_school()
                
                if not new_email:
                    self.stdout.write(f"⚠️  Could not generate email for {user.username} ({user.role})")
                    skipped_count += 1
                    continue
                
                # Check if update is needed
                if not force and user.email == new_email:
                    skipped_count += 1
                    continue
                
                old_email = user.email
                
                if dry_run:
                    self.stdout.write(f"Would update {user.username}: {old_email} → {new_email}")
                    updated_count += 1
                else:
                    user.email = new_email
                    user.save(update_fields=['email'])
                    self.stdout.write(f"✅ Updated {user.username}: {old_email} → {new_email}")
                    updated_count += 1
                    
            except Exception as e:
                self.stdout.write(f"❌ Error updating {user.username}: {e}")
                error_count += 1
        
        # Summary
        self.stdout.write(f"\n📊 Summary:")
        self.stdout.write(f"   Updated: {updated_count}")
        self.stdout.write(f"   Skipped: {skipped_count}")
        self.stdout.write(f"   Errors: {error_count}")
        
        if dry_run:
            self.stdout.write(f"\n💡 To apply changes, run: python manage.py update_user_emails")
        elif updated_count > 0:
            self.stdout.write(f"\n🎉 Successfully updated {updated_count} user emails!")
        
        # Show email format examples
        self.stdout.write(f"\n📧 Email Format Examples:")
        self.stdout.write(f"   Admin: admin@{12345}.rj")
        self.stdout.write(f"   Student: student.{12345}@{12345}.rj")  
        self.stdout.write(f"   Staff: professor.{12345}@{12345}.rj")
        self.stdout.write(f"   Parent: Login via student reg + phone + OTP")