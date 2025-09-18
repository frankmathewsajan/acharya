"""
Management command to test school deactivation and user access control
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from schools.models import School
from users.models import User, StudentProfile, StaffProfile, ParentProfile


class Command(BaseCommand):
    help = 'Test school deactivation and user access control'

    def handle(self, *args, **options):
        self.stdout.write("🧪 Testing school deactivation and user access control...")
        
        try:
            with transaction.atomic():
                # Create test school (active)
                test_school = School.objects.create(
                    district="TEST_DEACTIVATION",
                    block="TEST_BLOCK",
                    village="TEST_VILLAGE",
                    school_name="Test Deactivation School", 
                    school_code="3333333333",
                    is_active=True,
                    contact_email="test@deactivation.school",
                    contact_phone="3333333333"
                )
                
                self.stdout.write(f"✅ Created active school: {test_school.school_name}")
                
                # Check admin was created
                admin_username = test_school.get_admin_username()
                admin_user = User.objects.filter(username=admin_username).first()
                self.stdout.write(f"👤 Admin created: {admin_user.username} - {admin_user.email}")
                
                # Create additional test users
                student_user = User.objects.create_user(
                    username="test_student_deact",
                    email=test_school.get_student_email("12345"),
                    password="testpass123",
                    role="student",
                    school=test_school,
                    phone_number="9999999999"
                )
                
                student_profile = StudentProfile.objects.create(
                    user=student_user,
                    admission_number="12345",
                    roll_number="R12345",
                    course="Computer Science",
                    department="CS",
                    semester=1,
                    date_of_birth="2000-01-01",
                    address="Test Address",
                    emergency_contact="8888888888"
                )
                
                faculty_user = User.objects.create_user(
                    username="test_faculty_deact",
                    email=test_school.get_staff_email("Professor", "EMP12345"),
                    password="testpass123",
                    role="faculty",
                    school=test_school
                )
                
                staff_profile = StaffProfile.objects.create(
                    user=faculty_user,
                    employee_id="EMP12345",
                    department="CS",
                    designation="Professor",
                    date_of_joining="2020-01-01"
                )
                
                parent_user = User.objects.create_user(
                    username="test_parent_deact",
                    email="parent@test.com",
                    password="testpass123",
                    role="parent",
                    school=test_school,
                    phone_number="7777777777"
                )
                
                parent_profile = ParentProfile.objects.create(
                    user=parent_user,
                    occupation="Engineer",
                    address="Parent Address"
                )
                parent_profile.children.add(student_profile)
                
                self.stdout.write("✅ Created test users:")
                self.stdout.write(f"   Student: {student_user.email}")
                self.stdout.write(f"   Faculty: {faculty_user.email}")
                self.stdout.write(f"   Parent: {parent_user.email}")
                
                # Check all users are active
                active_users_before = User.objects.filter(school=test_school, is_active=True).count()
                self.stdout.write(f"👥 Active users before deactivation: {active_users_before}")
                
                # Test parent login functionality
                can_login = parent_profile.can_login_with_credentials("12345", "7777777777")
                self.stdout.write(f"🔑 Parent can login with student reg + phone: {can_login}")
                
                # Test email generation
                self.stdout.write("📧 Testing email formats:")
                self.stdout.write(f"   Admin: {test_school.get_admin_email()}")
                self.stdout.write(f"   Student: {test_school.get_student_email('12345')}")
                self.stdout.write(f"   Staff: {test_school.get_staff_email('Professor', 'EMP12345')}")
                
                # Now deactivate the school
                self.stdout.write("🔄 Deactivating school...")
                test_school.is_active = False
                test_school.save()
                
                # Check all users are now inactive
                active_users_after = User.objects.filter(school=test_school, is_active=True).count()
                inactive_users_after = User.objects.filter(school=test_school, is_active=False).count()
                
                self.stdout.write(f"👥 Active users after deactivation: {active_users_after}")
                self.stdout.write(f"🚫 Inactive users after deactivation: {inactive_users_after}")
                
                if active_users_after == 0:
                    self.stdout.write("✅ Deactivation test PASSED - All users disabled")
                else:
                    self.stdout.write("❌ Deactivation test FAILED - Some users still active")
                
                # Test reactivation
                self.stdout.write("🔄 Reactivating school...")
                test_school.is_active = True
                test_school.save()
                
                active_users_reactivated = User.objects.filter(school=test_school, is_active=True).count()
                self.stdout.write(f"👥 Active users after reactivation: {active_users_reactivated}")
                
                if active_users_reactivated == inactive_users_after:
                    self.stdout.write("✅ Reactivation test PASSED - All users re-enabled")
                else:
                    self.stdout.write("❌ Reactivation test FAILED - User count mismatch")
                
                # Final summary
                total_tests = 3  # deactivation, reactivation, parent login
                passed_tests = 0
                
                if active_users_after == 0:
                    passed_tests += 1
                if active_users_reactivated == inactive_users_after:
                    passed_tests += 1
                if can_login:
                    passed_tests += 1
                
                self.stdout.write(f"\n📊 Test Results: {passed_tests}/{total_tests} tests passed")
                
                if passed_tests == total_tests:
                    self.stdout.write("🎉 All tests PASSED!")
                else:
                    self.stdout.write("❌ Some tests FAILED!")
                
                # Rollback transaction
                raise Exception("Test completed - rolling back transaction")
                
        except Exception as e:
            if "Test completed" in str(e):
                self.stdout.write("✅ Test completed successfully (transaction rolled back)")
            else:
                self.stdout.write(f"❌ Error during test: {e}")