from django.db import models
from django.utils import timezone
import uuid
import random
import string
from datetime import timedelta

from django.db import models
from django.conf import settings

def generate_reference_id():
    """Generate a unique reference ID for admission applications"""
    # Format: ADM-YYYY-XXXXXX (e.g., ADM-2025-A1B2C3)
    year = str(timezone.now().year)
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"ADM-{year}-{random_part}"

def generate_otp():
    """Generate a 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))

class EmailVerification(models.Model):
    """Model for email OTP verification before admission submission"""
    
    email = models.EmailField(db_index=True)
    otp = models.CharField(max_length=6, default=generate_otp)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()
    attempts = models.PositiveIntegerField(default=0)
    
    class Meta:
        indexes = [
            models.Index(fields=['email', 'is_verified']),
            models.Index(fields=['email', 'expires_at']),
        ]
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        """Set expiration time if not set"""
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=10)  # OTP expires in 10 minutes
        super().save(*args, **kwargs)
    
    def is_expired(self):
        """Check if OTP has expired"""
        return timezone.now() > self.expires_at
    
    def is_valid(self, otp_input):
        """Check if provided OTP is valid"""
        return (
            self.otp == otp_input and 
            not self.is_expired() and 
            not self.is_verified and
            self.attempts < 3  # Max 3 attempts
        )
    
    def verify(self, otp_input):
        """Verify the OTP and mark as verified if correct"""
        self.attempts += 1
        
        if self.is_valid(otp_input):
            self.is_verified = True
            self.verified_at = timezone.now()
            self.save()
            return True
        else:
            self.save()  # Save the incremented attempts
            return False
    
    def __str__(self):
        status = "Verified" if self.is_verified else "Pending"
        return f"OTP for {self.email} - {status} ({self.otp})"

class AdmissionApplication(models.Model):
    """Model for admission applications"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    CATEGORY_CHOICES = [
        ('general', 'General'),
        ('sc', 'SC (Scheduled Caste)'),
        ('st', 'ST (Scheduled Tribe)'),
        ('obc', 'OBC (Other Backward Class)'),
        ('sbc', 'SBC (Special Backward Class)'),
    ]
    
    # Reference ID for tracking
    reference_id = models.CharField(max_length=20, unique=True, blank=True, db_index=True)
    
    # Email verification (required before submission)
    email_verification = models.ForeignKey(EmailVerification, on_delete=models.SET_NULL, null=True, blank=True, related_name='applications')
    
    # School Preferences (First, Second, Third choice)
    first_preference_school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='first_preference_applications', null=True, blank=True)
    second_preference_school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='second_preference_applications', null=True, blank=True)
    third_preference_school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='third_preference_applications', null=True, blank=True)
    
    # Personal Information
    applicant_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    email = models.EmailField()
    phone_number = models.CharField(max_length=15)
    address = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general')
    
    # Academic Information
    course_applied = models.CharField(max_length=100)
    previous_school = models.CharField(max_length=200, blank=True)
    last_percentage = models.FloatField(blank=True, null=True)
    
    # Application Details
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    application_date = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='reviewed_applications'
    )
    review_date = models.DateTimeField(null=True, blank=True)
    review_comments = models.TextField(blank=True)
    
    # Documents (JSON field to store document paths)
    documents = models.JSONField(default=dict, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['reference_id']),
            models.Index(fields=['first_preference_school', 'status']),
            models.Index(fields=['first_preference_school', 'application_date']),
            models.Index(fields=['course_applied', 'status']),
        ]
    
    def save(self, *args, **kwargs):
        """Override save to generate reference ID if not present"""
        if not self.reference_id:
            self.reference_id = generate_reference_id()
            # Ensure uniqueness
            while AdmissionApplication.objects.filter(reference_id=self.reference_id).exists():
                self.reference_id = generate_reference_id()
        
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # Create school decisions for new applications
        if is_new:
            self.create_school_decisions()
    
    def create_school_decisions(self):
        """Create SchoolAdmissionDecision entries for each school preference"""
        decisions_to_create = []
        
        if self.first_preference_school:
            decisions_to_create.append(
                SchoolAdmissionDecision(
                    application=self,
                    school=self.first_preference_school,
                    preference_order='1st'
                )
            )
        
        if self.second_preference_school:
            decisions_to_create.append(
                SchoolAdmissionDecision(
                    application=self,
                    school=self.second_preference_school,
                    preference_order='2nd'
                )
            )
        
        if self.third_preference_school:
            decisions_to_create.append(
                SchoolAdmissionDecision(
                    application=self,
                    school=self.third_preference_school,
                    preference_order='3rd'
                )
            )
        
        SchoolAdmissionDecision.objects.bulk_create(decisions_to_create, ignore_conflicts=True)
    
    def __str__(self):
        first_school = self.first_preference_school.school_name if self.first_preference_school else "No School"
        return f"{self.applicant_name} - {self.course_applied} ({self.status}) [{first_school}] - {self.reference_id}"
    
    def get_school_preferences(self):
        """Get list of school preferences in order"""
        preferences = []
        if self.first_preference_school:
            preferences.append(('1st', self.first_preference_school))
        if self.second_preference_school:
            preferences.append(('2nd', self.second_preference_school))
        if self.third_preference_school:
            preferences.append(('3rd', self.third_preference_school))
        return preferences
    
    def has_active_enrollment(self):
        """Check if student has active enrollment in any school"""
        return self.school_decisions.filter(enrollment_status='enrolled').exists()
    
    def get_active_enrollment(self):
        """Get the active enrollment if any"""
        return self.school_decisions.filter(enrollment_status='enrolled').first()


class SchoolAdmissionDecision(models.Model):
    """Model to track individual school decisions for each application"""
    
    DECISION_CHOICES = [
        ('pending', 'Pending Review'),
        ('under_review', 'Under Review'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('waitlisted', 'Waitlisted'),
    ]
    
    ENROLLMENT_STATUS_CHOICES = [
        ('not_enrolled', 'Not Enrolled'),
        ('enrolled', 'Enrolled'),
        ('withdrawn', 'Withdrawn'),
    ]
    
    application = models.ForeignKey(AdmissionApplication, on_delete=models.CASCADE, related_name='school_decisions')
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='admission_decisions')
    preference_order = models.CharField(max_length=10, choices=[('1st', 'First'), ('2nd', 'Second'), ('3rd', 'Third')])
    decision = models.CharField(max_length=20, choices=DECISION_CHOICES, default='pending')
    decision_date = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='school_admission_decisions'
    )
    review_comments = models.TextField(blank=True)
    is_student_choice = models.BooleanField(default=False)  # True if student chose this school among accepted ones
    student_choice_date = models.DateTimeField(null=True, blank=True)
    
    # New enrollment tracking fields
    enrollment_status = models.CharField(max_length=20, choices=ENROLLMENT_STATUS_CHOICES, default='not_enrolled')
    enrollment_date = models.DateTimeField(null=True, blank=True)
    withdrawal_date = models.DateTimeField(null=True, blank=True)
    withdrawal_reason = models.TextField(blank=True)
    payment_status = models.CharField(max_length=20, default='pending', choices=[
        ('pending', 'Payment Pending'),
        ('completed', 'Payment Completed'),
        ('failed', 'Payment Failed'),
        ('waived', 'Payment Waived'),
    ])
    payment_reference = models.CharField(max_length=100, blank=True)
    
    class Meta:
        unique_together = ['application', 'school']
        indexes = [
            models.Index(fields=['school', 'decision']),
            models.Index(fields=['application', 'decision']),
            models.Index(fields=['decision', 'decision_date']),
            models.Index(fields=['enrollment_status', 'enrollment_date']),
            models.Index(fields=['application', 'enrollment_status']),
        ]
        ordering = ['preference_order', '-decision_date']
    
    def save(self, *args, **kwargs):
        """Set decision date when decision is made and validate admin changes"""
        from django.core.exceptions import ValidationError
        
        # Prevent rejecting enrolled students
        if self.pk:  # Only for updates, not new records
            old_instance = SchoolAdmissionDecision.objects.get(pk=self.pk)
            if old_instance.enrollment_status == 'enrolled' and self.decision == 'rejected':
                raise ValidationError("Cannot reject a student who is already enrolled. Withdraw enrollment first.")
        
        if self.decision != 'pending' and not self.decision_date:
            self.decision_date = timezone.now()
        
        # Set enrollment date when enrolling
        if self.enrollment_status == 'enrolled' and not self.enrollment_date:
            self.enrollment_date = timezone.now()
            self.is_student_choice = True
            self.student_choice_date = timezone.now()
        
        # Set withdrawal date when withdrawing
        if self.enrollment_status == 'withdrawn' and not self.withdrawal_date:
            self.withdrawal_date = timezone.now()
            
        super().save(*args, **kwargs)
    
    def enroll_student(self, payment_reference=None):
        """Enroll student in this school"""
        self.enrollment_status = 'enrolled'
        self.enrollment_date = timezone.now()
        self.is_student_choice = True
        self.student_choice_date = timezone.now()
        
        # If decision is not already accepted, set it to accepted when enrolling
        if self.decision != 'accepted':
            self.decision = 'accepted'
            self.decision_date = timezone.now()
        
        if payment_reference:
            self.payment_reference = payment_reference
            self.payment_status = 'completed'
        self.save()
    
    def withdraw_enrollment(self, reason=""):
        """Withdraw enrollment from this school"""
        self.enrollment_status = 'withdrawn'
        self.withdrawal_date = timezone.now()
        self.withdrawal_reason = reason
        self.is_student_choice = False
        self.save()
    
    def can_enroll(self):
        """Check if student can enroll (decision is accepted or pending, and not already enrolled)"""
        # Allow enrollment if decision is accepted OR pending (auto-accept on enrollment)
        if self.decision not in ['accepted', 'pending']:
            return False
        
        if self.enrollment_status == 'enrolled':
            return False
        
        # Allow enrollment after withdrawal
        if self.enrollment_status == 'withdrawn':
            # Check if student has any OTHER active enrollment
            return not self.application.school_decisions.filter(
                enrollment_status='enrolled'
            ).exclude(id=self.id).exists()
        
        # For not_enrolled status, check if student has any active enrollment elsewhere
        if self.enrollment_status == 'not_enrolled':
            return not self.application.has_active_enrollment()
        
        return False
    
    def has_active_enrollment_elsewhere(self):
        """Check if student has active enrollment in any other school"""
        return self.application.school_decisions.filter(
            enrollment_status='enrolled'
        ).exclude(id=self.id).exists()
    
    def can_withdraw(self):
        """Check if student can withdraw (must be currently enrolled)"""
        return self.enrollment_status == 'enrolled'
    
    def __str__(self):
        status_display = f"{self.decision}"
        if self.enrollment_status == 'enrolled':
            status_display += " - ENROLLED"
        elif self.enrollment_status == 'withdrawn':
            status_display += " - WITHDRAWN"
        return f"{self.application.applicant_name} - {self.school.school_name} ({status_display})"


class FeeStructure(models.Model):
    """Model to store fee structure based on class and category"""
    
    CLASS_CHOICES = [
        ('1-8', 'Class 1-8'),
        ('9-10', 'Class 9-10'),
        ('11-12', 'Class 11-12'),
    ]
    
    CATEGORY_CHOICES = [
        ('general', 'General'),
        ('sc_st_obc_sbc', 'SC/ST/OBC/SBC'),
    ]
    
    class_range = models.CharField(max_length=10, choices=CLASS_CHOICES)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    annual_fee_min = models.DecimalField(max_digits=10, decimal_places=2)
    annual_fee_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    class Meta:
        unique_together = ['class_range', 'category']
        ordering = ['class_range', 'category']
    
    def __str__(self):
        if self.annual_fee_max and self.annual_fee_max != self.annual_fee_min:
            return f"{self.class_range} - {self.category}: ₹{self.annual_fee_min} - ₹{self.annual_fee_max}"
        else:
            return f"{self.class_range} - {self.category}: ₹{self.annual_fee_min}"
    
    @classmethod
    def get_fee_for_student(cls, course_applied, category):
        """Calculate fee for a student based on their course and category"""
        import re
        
        # Map course to class range
        class_mapping = {
            '1': '1-8', '2': '1-8', '3': '1-8', '4': '1-8', 
            '5': '1-8', '6': '1-8', '7': '1-8', '8': '1-8',
            '9': '9-10', '10': '9-10',
            '11': '11-12', '12': '11-12'
        }
        
        # Extract class number from course_applied using regex
        class_number = None
        course_lower = course_applied.lower()
        
        # Look for patterns like "class-12", "class 12", "12", "12th", etc.
        # Try to match 2-digit numbers first (11, 12), then single digits
        patterns = [
            r'(?:class[-\s]?)?(\d{2})(?:th|st|nd|rd)?',  # Matches "class-12", "12th", etc.
            r'(?:class[-\s]?)?(\d{1})(?:th|st|nd|rd)?'   # Matches "class-9", "9th", etc.
        ]
        
        for pattern in patterns:
            match = re.search(pattern, course_lower)
            if match:
                potential_class = match.group(1)
                if potential_class in class_mapping:
                    class_number = potential_class
                    break
        
        if not class_number:
            return None
        
        class_range = class_mapping[class_number]
        
        # Map student category to fee category
        fee_category = 'general' if category == 'general' else 'sc_st_obc_sbc'
        
        try:
            fee_structure = cls.objects.get(class_range=class_range, category=fee_category)
            return fee_structure
        except cls.DoesNotExist:
            return None
