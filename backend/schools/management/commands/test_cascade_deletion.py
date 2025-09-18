"""
Management command to test CASCADE deletion functionality.
Creates test data and verifies that deleting a school removes all related data.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from schools.models import School
from users.models import User, StudentProfile, StaffProfile
from attendance.models import ClassSession, AttendanceRecord
from fees.models import FeeStructure, FeeInvoice, Payment
from library.models import Book, BookBorrowRecord
from notifications.models import Notice, UserNotification
from exams.models import Exam, ExamResult
from admissions.models import AdmissionApplication
from hostel.models import HostelBlock, HostelRoom, HostelAllocation, HostelComplaint
from datetime import date, datetime


class Command(BaseCommand):
    help = 'Test CASCADE deletion functionality'

    def add_arguments(self, parser):
        parser.add_argument(
            '--cleanup',
            action='store_true',
            help='Clean up test data after running test',
        )

    def handle(self, *args, **options):
        self.stdout.write("🧪 Starting CASCADE deletion test...")
        
        try:
            with transaction.atomic():
                # Create test school
                test_school = School.objects.create(
                    district="TEST_DISTRICT",
                    block="TEST_BLOCK", 
                    village="TEST_VILLAGE",
                    school_name="Test CASCADE School",
                    school_code="9999999999",
                    is_active=True,
                    contact_email="test@cascade.school",
                    contact_phone="9999999999"
                )
                self.stdout.write(f"✅ Created test school: {test_school.school_name}")
                
                # Create test users
                admin_user = User.objects.create_user(
                    username="test_admin",
                    email="admin@cascade.school",
                    password="testpass123",
                    role="admin",
                    school=test_school
                )
                
                student_user = User.objects.create_user(
                    username="test_student",
                    email="student@cascade.school", 
                    password="testpass123",
                    role="student",
                    school=test_school
                )
                
                faculty_user = User.objects.create_user(
                    username="test_faculty",
                    email="faculty@cascade.school",
                    password="testpass123", 
                    role="faculty",
                    school=test_school
                )
                
                # Create profiles
                student_profile = StudentProfile.objects.create(
                    user=student_user,
                    admission_number="TEST001",
                    roll_number="R001",
                    course="Computer Science",
                    department="CS",
                    semester=1,
                    date_of_birth=date(2000, 1, 1),
                    address="Test Address",
                    emergency_contact="9999999999"
                )
                
                staff_profile = StaffProfile.objects.create(
                    user=faculty_user,
                    employee_id="EMP001",
                    department="CS",
                    designation="Professor",
                    date_of_joining=date(2020, 1, 1)
                )
                
                self.stdout.write("✅ Created test users and profiles")
                
                # Create test data in all related models
                
                # Attendance data
                class_session = ClassSession.objects.create(
                    school=test_school,
                    course="Computer Science",
                    subject="Python Programming",
                    batch="CS-2024",
                    date=date.today(),
                    start_time="09:00",
                    end_time="10:00",
                    faculty=staff_profile
                )
                
                attendance_record = AttendanceRecord.objects.create(
                    session=class_session,
                    student=student_profile,
                    status="present",
                    marked_by=staff_profile
                )
                
                # Fee data
                fee_structure = FeeStructure.objects.create(
                    school=test_school,
                    course="Computer Science",
                    semester=1,
                    tuition_fee=50000,
                    total_fee=55000
                )
                
                fee_invoice = FeeInvoice.objects.create(
                    invoice_number="INV001",
                    student=student_profile,
                    fee_structure=fee_structure,
                    amount=55000,
                    due_date=date.today()
                )
                
                payment = Payment.objects.create(
                    invoice=fee_invoice,
                    transaction_id="TXN001",
                    amount=55000,
                    payment_method="online"
                )
                
                # Library data
                book = Book.objects.create(
                    school=test_school,
                    isbn="1234567890123",
                    title="Test Book",
                    author="Test Author", 
                    publisher="Test Publisher",
                    publication_year=2023,
                    category="Technology",
                    total_copies=5,
                    available_copies=4,
                    shelf_location="A1"
                )
                
                borrow_record = BookBorrowRecord.objects.create(
                    book=book,
                    student=student_profile,
                    due_date=date.today(),
                    issued_by=staff_profile
                )
                
                # Notification data
                notice = Notice.objects.create(
                    school=test_school,
                    title="Test Notice",
                    content="This is a test notice",
                    publish_date=datetime.now(),
                    created_by=admin_user
                )
                
                user_notification = UserNotification.objects.create(
                    user=student_user,
                    notice=notice
                )
                
                # Exam data
                exam = Exam.objects.create(
                    school=test_school,
                    name="Test Exam",
                    exam_type="internal",
                    course="Computer Science",
                    subject="Python Programming",
                    semester=1,
                    date=date.today(),
                    max_marks=100,
                    duration_minutes=180,
                    created_by=staff_profile
                )
                
                exam_result = ExamResult.objects.create(
                    exam=exam,
                    student=student_profile,
                    marks_obtained=85.5,
                    grade="A",
                    entered_by=staff_profile
                )
                
                # Admission data
                admission_app = AdmissionApplication.objects.create(
                    school=test_school,
                    applicant_name="Test Applicant",
                    date_of_birth=date(2000, 6, 15),
                    email="applicant@test.com",
                    phone_number="9999999999",
                    address="Test Address",
                    course_applied="Computer Science"
                )
                
                # Hostel data
                hostel_block = HostelBlock.objects.create(
                    school=test_school,
                    name="Test Block A",
                    description="Test hostel block",
                    warden=staff_profile,
                    total_rooms=50
                )
                
                hostel_room = HostelRoom.objects.create(
                    block=hostel_block,
                    room_number="101",
                    room_type="double",
                    capacity=2
                )
                
                hostel_allocation = HostelAllocation.objects.create(
                    student=student_profile,
                    room=hostel_room,
                    allocation_date=date.today(),
                    allocated_by=staff_profile
                )
                
                hostel_complaint = HostelComplaint.objects.create(
                    student=student_profile,
                    room=hostel_room,
                    title="Test Complaint",
                    description="Test complaint description",
                    priority="medium"
                )
                
                self.stdout.write("✅ Created comprehensive test data across all models")
                
                # Count records before deletion
                counts_before = self.count_related_records(test_school)
                self.stdout.write(f"📊 Records before deletion: {counts_before}")
                
                # Now delete the school and verify CASCADE deletion
                self.stdout.write(f"🗑️  Deleting school: {test_school.school_name}")
                school_id = test_school.id
                test_school.delete()
                
                # Count records after deletion
                counts_after = self.count_related_records_by_school_id(school_id)
                self.stdout.write(f"📊 Records after deletion: {counts_after}")
                
                # Verify all records are deleted
                total_remaining = sum(counts_after.values())
                if total_remaining == 0:
                    self.stdout.write("🎉 CASCADE deletion test PASSED! All related records deleted successfully.")
                else:
                    self.stdout.write(f"❌ CASCADE deletion test FAILED! {total_remaining} records remain.")
                    
                # Don't commit transaction to avoid affecting real data
                if not options['cleanup']:
                    raise Exception("Test completed - rolling back transaction")
                    
        except Exception as e:
            if "Test completed" in str(e):
                self.stdout.write("✅ Test completed successfully (transaction rolled back)")
            else:
                self.stdout.write(f"❌ Error during test: {e}")
    
    def count_related_records(self, school):
        """Count all records related to a school"""
        return {
            'users': User.objects.filter(school=school).count(),
            'class_sessions': ClassSession.objects.filter(school=school).count(),
            'fee_structures': FeeStructure.objects.filter(school=school).count(), 
            'books': Book.objects.filter(school=school).count(),
            'notices': Notice.objects.filter(school=school).count(),
            'exams': Exam.objects.filter(school=school).count(),
            'admissions': AdmissionApplication.objects.filter(school=school).count(),
            'hostel_blocks': HostelBlock.objects.filter(school=school).count(),
        }
    
    def count_related_records_by_school_id(self, school_id):
        """Count records by school ID (should be 0 after CASCADE deletion)"""
        return {
            'users': User.objects.filter(school_id=school_id).count(),
            'class_sessions': ClassSession.objects.filter(school_id=school_id).count(),
            'fee_structures': FeeStructure.objects.filter(school_id=school_id).count(),
            'books': Book.objects.filter(school_id=school_id).count(),
            'notices': Notice.objects.filter(school_id=school_id).count(),
            'exams': Exam.objects.filter(school_id=school_id).count(),
            'admissions': AdmissionApplication.objects.filter(school_id=school_id).count(),
            'hostel_blocks': HostelBlock.objects.filter(school_id=school_id).count(),
        }