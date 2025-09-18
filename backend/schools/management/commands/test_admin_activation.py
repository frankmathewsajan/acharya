"""
Management command to test admin creation when school is activated via admin panel
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from schools.models import School
from users.models import User


class Command(BaseCommand):
    help = 'Test admin creation when school is activated via admin panel'

    def handle(self, *args, **options):
        self.stdout.write("🧪 Testing admin creation on school activation...")
        
        try:
            with transaction.atomic():
                # Create an inactive school first
                test_school = School.objects.create(
                    district="TEST_ACTIVATION",
                    block="TEST_BLOCK",
                    village="TEST_VILLAGE", 
                    school_name="Test Activation School",
                    school_code="7777777777",
                    is_active=False,  # Create as inactive
                    contact_email="test@activation.school",
                    contact_phone="7777777777"
                )
                
                self.stdout.write(f"✅ Created inactive school: {test_school.school_name}")
                
                # Check that no admin exists yet
                admin_username = test_school.get_admin_username()
                admin_exists_before = User.objects.filter(username=admin_username).exists()
                self.stdout.write(f"👤 Admin exists before activation: {admin_exists_before}")
                
                # Now activate the school (simulating admin panel activation)
                test_school.is_active = True
                test_school.save()
                
                self.stdout.write("🔄 School activated via save() - simulating admin panel")
                
                # Check if admin was created
                admin_exists_after = User.objects.filter(username=admin_username).exists()
                admin_user = User.objects.filter(username=admin_username).first()
                
                self.stdout.write(f"👤 Admin exists after activation: {admin_exists_after}")
                
                if admin_user:
                    self.stdout.write(f"✅ Admin created successfully!")
                    self.stdout.write(f"   Username: {admin_user.username}")
                    self.stdout.write(f"   Email: {admin_user.email}")
                    self.stdout.write(f"   Role: {admin_user.role}")
                    self.stdout.write(f"   School: {admin_user.school}")
                    self.stdout.write(f"   Password: {test_school.get_admin_password()}")
                else:
                    self.stdout.write("❌ Admin was NOT created!")
                
                # Test activating an already active school (should not create duplicate)
                self.stdout.write("\n🔄 Testing duplicate activation...")
                test_school.save()  # Save again to test idempotency
                
                admin_count = User.objects.filter(username=admin_username).count()
                self.stdout.write(f"👤 Admin count after duplicate save: {admin_count}")
                
                if admin_count == 1:
                    self.stdout.write("✅ Idempotency test PASSED - No duplicate admin created")
                else:
                    self.stdout.write("❌ Idempotency test FAILED - Duplicate admin created")
                
                # Final verification
                total_test_admins = User.objects.filter(username__startswith="admin77777").count()
                self.stdout.write(f"\n📊 Total test admins created: {total_test_admins}")
                
                if admin_exists_after and admin_count == 1:
                    self.stdout.write("🎉 All tests PASSED!")
                else:
                    self.stdout.write("❌ Some tests FAILED!")
                
                # Rollback transaction to avoid affecting real data
                raise Exception("Test completed - rolling back transaction")
                
        except Exception as e:
            if "Test completed" in str(e):
                self.stdout.write("✅ Test completed successfully (transaction rolled back)")
            else:
                self.stdout.write(f"❌ Error during test: {e}")