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
    
    # Parent/Guardian Information - Enhanced to match ParentProfile structure
    father_name = models.CharField(max_length=100, blank=True)
    father_phone = models.CharField(max_length=15, blank=True)
    father_email = models.EmailField(blank=True)
    father_occupation = models.CharField(max_length=100, blank=True)
    father_address = models.TextField(blank=True, help_text="Father's residential address")
    father_emergency_contact = models.CharField(max_length=15, blank=True, help_text="Alternative contact number")
    father_aadhar_number = models.CharField(max_length=12, blank=True, help_text="Aadhar card number (optional)")
    father_qualification = models.CharField(max_length=100, blank=True, help_text="Educational qualification")
    father_company_name = models.CharField(max_length=100, blank=True, help_text="Company/Organization name")
    father_annual_income = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Annual income in INR")
    
    mother_name = models.CharField(max_length=100, blank=True)
    mother_phone = models.CharField(max_length=15, blank=True)
    mother_email = models.EmailField(blank=True)
    mother_occupation = models.CharField(max_length=100, blank=True)
    mother_address = models.TextField(blank=True, help_text="Mother's residential address")
    mother_emergency_contact = models.CharField(max_length=15, blank=True, help_text="Alternative contact number")
    mother_aadhar_number = models.CharField(max_length=12, blank=True, help_text="Aadhar card number (optional)")
    mother_qualification = models.CharField(max_length=100, blank=True, help_text="Educational qualification")
    mother_company_name = models.CharField(max_length=100, blank=True, help_text="Company/Organization name")
    mother_annual_income = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Annual income in INR")
    
    guardian_name = models.CharField(max_length=100, blank=True, help_text="If different from parents")
    guardian_phone = models.CharField(max_length=15, blank=True)
    guardian_email = models.EmailField(blank=True)
    guardian_relationship = models.CharField(max_length=50, blank=True, help_text="e.g., Uncle, Aunt, etc.")
    guardian_address = models.TextField(blank=True, help_text="Guardian's residential address")
    guardian_occupation = models.CharField(max_length=100, blank=True)
    guardian_emergency_contact = models.CharField(max_length=15, blank=True, help_text="Alternative contact number")
    guardian_aadhar_number = models.CharField(max_length=12, blank=True, help_text="Aadhar card number (optional)")
    guardian_qualification = models.CharField(max_length=100, blank=True, help_text="Educational qualification")
    guardian_company_name = models.CharField(max_length=100, blank=True, help_text="Company/Organization name")
    guardian_annual_income = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Annual income in INR")
    
    primary_contact = models.CharField(max_length=20, choices=[
        ('father', 'Father'),
        ('mother', 'Mother'),
        ('guardian', 'Guardian'),
    ], default='father', help_text="Primary contact for school communications")
    
    # Family Information
    family_type = models.CharField(max_length=20, choices=[
        ('nuclear', 'Nuclear Family'),
        ('joint', 'Joint Family'),
        ('single_parent', 'Single Parent'),
        ('other', 'Other'),
    ], blank=True, help_text="Type of family structure")
    total_family_members = models.PositiveIntegerField(null=True, blank=True, help_text="Total number of family members")
    number_of_children = models.PositiveIntegerField(null=True, blank=True, help_text="Total number of children")
    religion = models.CharField(max_length=50, blank=True, help_text="Religion (optional)")
    caste = models.CharField(max_length=50, blank=True, help_text="Caste (for reservation purposes if applicable)")
    mother_tongue = models.CharField(max_length=50, blank=True, help_text="Student's mother tongue")
    
    # Contact Preferences
    preferred_contact_method = models.CharField(max_length=20, choices=[
        ('phone', 'Phone Call'),
        ('sms', 'SMS'),
        ('email', 'Email'),
        ('whatsapp', 'WhatsApp'),
    ], default='phone', help_text="Preferred method of communication")
    emergency_contact_name = models.CharField(max_length=100, blank=True, help_text="Emergency contact person (if different from parents)")
    emergency_contact_phone = models.CharField(max_length=15, blank=True, help_text="Emergency contact number")
    emergency_contact_relationship = models.CharField(max_length=50, blank=True, help_text="Relationship to student")
    
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
    
    def get_primary_contact_info(self):
        """Get primary contact information based on primary_contact setting"""
        if self.primary_contact == 'father':
            return {
                'name': self.father_name,
                'email': self.father_email,
                'phone': self.father_phone,
                'occupation': self.father_occupation,
                'relationship': 'Father',
                'address': self.father_address,
                'emergency_contact': self.father_emergency_contact,
                'aadhar_number': self.father_aadhar_number,
                'qualification': self.father_qualification,
                'company_name': self.father_company_name,
                'annual_income': self.father_annual_income,
            }
        elif self.primary_contact == 'mother':
            return {
                'name': self.mother_name,
                'email': self.mother_email,
                'phone': self.mother_phone,
                'occupation': self.mother_occupation,
                'relationship': 'Mother',
                'address': self.mother_address,
                'emergency_contact': self.mother_emergency_contact,
                'aadhar_number': self.mother_aadhar_number,
                'qualification': self.mother_qualification,
                'company_name': self.mother_company_name,
                'annual_income': self.mother_annual_income,
            }
        elif self.primary_contact == 'guardian':
            return {
                'name': self.guardian_name,
                'email': self.guardian_email,
                'phone': self.guardian_phone,
                'occupation': self.guardian_occupation,
                'relationship': self.guardian_relationship or 'Guardian',
                'address': self.guardian_address,
                'emergency_contact': self.guardian_emergency_contact,
                'aadhar_number': self.guardian_aadhar_number,
                'qualification': self.guardian_qualification,
                'company_name': self.guardian_company_name,
                'annual_income': self.guardian_annual_income,
            }
        return None
    
    def get_all_parent_contacts(self):
        """Get all parent/guardian contact information"""
        contacts = []
        
        if self.father_name and self.father_phone:
            contacts.append({
                'name': self.father_name,
                'email': self.father_email,
                'phone': self.father_phone,
                'occupation': self.father_occupation,
                'relationship': 'Father',
                'is_primary': self.primary_contact == 'father',
                'address': self.father_address,
                'emergency_contact': self.father_emergency_contact,
                'aadhar_number': self.father_aadhar_number,
                'qualification': self.father_qualification,
                'company_name': self.father_company_name,
                'annual_income': self.father_annual_income,
            })
        
        if self.mother_name and self.mother_phone:
            contacts.append({
                'name': self.mother_name,
                'email': self.mother_email,
                'phone': self.mother_phone,
                'occupation': self.mother_occupation,
                'relationship': 'Mother',
                'is_primary': self.primary_contact == 'mother',
                'address': self.mother_address,
                'emergency_contact': self.mother_emergency_contact,
                'aadhar_number': self.mother_aadhar_number,
                'qualification': self.mother_qualification,
                'company_name': self.mother_company_name,
                'annual_income': self.mother_annual_income,
            })
        
        if self.guardian_name and self.guardian_phone:
            contacts.append({
                'name': self.guardian_name,
                'email': self.guardian_email,
                'phone': self.guardian_phone,
                'occupation': self.guardian_occupation,
                'relationship': self.guardian_relationship or 'Guardian',
                'is_primary': self.primary_contact == 'guardian',
                'address': self.guardian_address,
                'emergency_contact': self.guardian_emergency_contact,
                'aadhar_number': self.guardian_aadhar_number,
                'qualification': self.guardian_qualification,
                'company_name': self.guardian_company_name,
                'annual_income': self.guardian_annual_income,
            })
        
        return contacts
    
    def create_enhanced_parent_profiles(self, student_profile=None):
        """Create comprehensive parent profiles from admission application data"""
        from users.models import ParentProfile
        
        if not student_profile:
            return []
        
        created_profiles = []
        
        # Create father profile if data exists
        if self.father_name and (self.father_phone or self.father_email):
            father_profile, created = ParentProfile.objects.get_or_create(
                student=student_profile,
                relationship='father',
                defaults={
                    'first_name': self.father_name.split()[0] if self.father_name else '',
                    'last_name': ' '.join(self.father_name.split()[1:]) if self.father_name and len(self.father_name.split()) > 1 else '',
                    'email': self.father_email,
                    'phone_number': self.father_phone,
                    'occupation': self.father_occupation,
                    'address': self.father_address or self.address,  # Fall back to student address
                    'is_primary_contact': self.primary_contact == 'father',
                    'admission_application': self,
                }
            )
            
            # Update additional fields if the profile already existed
            if not created:
                father_profile.email = self.father_email or father_profile.email
                father_profile.phone_number = self.father_phone or father_profile.phone_number
                father_profile.occupation = self.father_occupation or father_profile.occupation
                father_profile.address = self.father_address or father_profile.address or self.address
                father_profile.is_primary_contact = self.primary_contact == 'father'
                father_profile.admission_application = self
                father_profile.save()
            
            created_profiles.append(father_profile)
        
        # Create mother profile if data exists  
        if self.mother_name and (self.mother_phone or self.mother_email):
            mother_profile, created = ParentProfile.objects.get_or_create(
                student=student_profile,
                relationship='mother',
                defaults={
                    'first_name': self.mother_name.split()[0] if self.mother_name else '',
                    'last_name': ' '.join(self.mother_name.split()[1:]) if self.mother_name and len(self.mother_name.split()) > 1 else '',
                    'email': self.mother_email,
                    'phone_number': self.mother_phone,
                    'occupation': self.mother_occupation,
                    'address': self.mother_address or self.address,  # Fall back to student address
                    'is_primary_contact': self.primary_contact == 'mother',
                    'admission_application': self,
                }
            )
            
            # Update additional fields if the profile already existed
            if not created:
                mother_profile.email = self.mother_email or mother_profile.email
                mother_profile.phone_number = self.mother_phone or mother_profile.phone_number
                mother_profile.occupation = self.mother_occupation or mother_profile.occupation
                mother_profile.address = self.mother_address or mother_profile.address or self.address
                mother_profile.is_primary_contact = self.primary_contact == 'mother'
                mother_profile.admission_application = self
                mother_profile.save()
            
            created_profiles.append(mother_profile)
        
        # Create guardian profile if data exists
        if self.guardian_name and (self.guardian_phone or self.guardian_email):
            guardian_profile, created = ParentProfile.objects.get_or_create(
                student=student_profile,
                relationship='guardian',
                defaults={
                    'first_name': self.guardian_name.split()[0] if self.guardian_name else '',
                    'last_name': ' '.join(self.guardian_name.split()[1:]) if self.guardian_name and len(self.guardian_name.split()) > 1 else '',
                    'email': self.guardian_email,
                    'phone_number': self.guardian_phone,
                    'occupation': self.guardian_occupation,
                    'address': self.guardian_address or self.address,  # Fall back to student address
                    'is_primary_contact': self.primary_contact == 'guardian',
                    'admission_application': self,
                }
            )
            
            # Update additional fields if the profile already existed
            if not created:
                guardian_profile.email = self.guardian_email or guardian_profile.email
                guardian_profile.phone_number = self.guardian_phone or guardian_profile.phone_number
                guardian_profile.occupation = self.guardian_occupation or guardian_profile.occupation
                guardian_profile.address = self.guardian_address or guardian_profile.address or self.address
                guardian_profile.is_primary_contact = self.primary_contact == 'guardian'
                guardian_profile.admission_application = self
                guardian_profile.save()
            
            created_profiles.append(guardian_profile)
        
        return created_profiles


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
    payment_completed_at = models.DateTimeField(null=True, blank=True)
    is_payment_finalized = models.BooleanField(default=False)  # Non-refundable after finalization
    
    # User ID allocation fields
    student_user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='admission_decision'
    )
    user_id_allocated = models.BooleanField(default=False)
    user_id_allocated_at = models.DateTimeField(null=True, blank=True)
    allocated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='allocated_student_accounts'
    )
    
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
    
    def enroll_student(self, payment_reference=None, finalize_payment=False):
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
            self.payment_completed_at = timezone.now()
            
            # Finalize payment if requested (makes it non-refundable)
            if finalize_payment:
                self.is_payment_finalized = True
        self.save()
    
    def finalize_payment(self):
        """Finalize payment - makes enrollment non-refundable"""
        if self.payment_status == 'completed' and self.enrollment_status == 'enrolled':
            self.is_payment_finalized = True
            self.save()
            return True
        return False
    
    def can_withdraw_after_payment(self):
        """Check if withdrawal is allowed after payment completion"""
        # Cannot withdraw if payment is finalized
        return not self.is_payment_finalized
    
    def allocate_student_user_id(self, allocated_by_user):
        """Allocate student user ID and create StudentProfile with User account"""
        if self.user_id_allocated or not self.enrollment_status == 'enrolled':
            return False
            
        from users.models import User, StudentProfile
        from django.db import transaction
        
        with transaction.atomic():
            # Generate admission number first
            admission_number = self.generate_admission_number()
            
            # Create student profile first (inactive to prevent signal triggering)
            student_profile = StudentProfile.objects.create(
                school=self.school,
                first_name=self.application.applicant_name.split()[0] if self.application.applicant_name else 'Student',
                last_name=' '.join(self.application.applicant_name.split()[1:]) if self.application.applicant_name and len(self.application.applicant_name.split()) > 1 else '',
                admission_number=admission_number,
                roll_number=admission_number,  # Use same as admission number initially
                course=self.application.course_applied or 'General',
                department=self.application.course_applied.split()[0] if self.application.course_applied else 'General',
                semester=1,
                date_of_birth=self.application.date_of_birth or timezone.now().date(),
                address=self.application.address or 'Not provided',
                emergency_contact=self.application.phone_number or 'Not provided',
                is_active=False  # Don't trigger signal yet
            )
            
            # Generate credentials manually so we can return them
            email, password = student_profile.generate_student_credentials()
            
            # Create user with known credentials
            student_user = User.objects.create_user(
                username=email,  # Use email as username
                email=email,
                password=password,
                first_name=student_profile.first_name or '',
                last_name=student_profile.last_name or '',
                school=self.school,
                role='student',
                is_staff=False,
                is_active=True
            )
            
            # Link user to profile and activate
            student_profile.user = student_user
            student_profile.is_active = True
            student_profile.save()
            
            # Link the user to this admission decision
            self.student_user = student_user
            self.user_id_allocated = True
            self.user_id_allocated_at = timezone.now()
            self.allocated_by = allocated_by_user
            self.save()
            
            # Create parent profiles from admission data
            self.create_parent_profiles(student_profile)
            
            # Return credentials for email notification
            return {
                'username': email,  # Email is used as username
                'password': password,
                'email': email,
                'admission_number': admission_number,
                'student_profile_id': student_profile.id
            }
    
    def generate_admission_number(self):
        """Generate a unique admission number for the student"""
        from django.db import transaction
        from users.models import StudentProfile
        
        with transaction.atomic():
            # Get school-specific admission numbers
            existing_numbers = StudentProfile.objects.select_for_update().filter(
                school=self.school,
                admission_number__regex=r'^\d{5}$'
            ).values_list('admission_number', flat=True)
            
            # Convert to integers and find the maximum
            if existing_numbers:
                numeric_numbers = [int(num) for num in existing_numbers if num.isdigit() and len(num) == 5]
                if numeric_numbers:
                    # Filter out numbers >= 90000 (manual entries) and focus on auto-generated ones
                    auto_numbers = [num for num in numeric_numbers if 10001 <= num < 90000]
                    if auto_numbers:
                        next_number = max(auto_numbers) + 1
                    else:
                        next_number = 10001
                else:
                    next_number = 10001
            else:
                next_number = 10001
            
            # Ensure we stay in the auto-generated range
            if next_number >= 90000:
                next_number = 10001  # Reset if we reach manual range
                
            return str(next_number).zfill(5)
    
    def withdraw_enrollment(self, reason="", force=False):
        """Withdraw enrollment from this school"""
        # Check if withdrawal is allowed
        if self.is_payment_finalized and not force:
            raise ValueError("Cannot withdraw: Payment has been finalized and is non-refundable")
            
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
    
    def create_parent_profiles(self, student_profile):
        """Create parent profiles from admission application data"""
        from users.models import ParentProfile
        
        # Create parent profiles for each relationship that has data
        for relationship in ['father', 'mother', 'guardian']:
            parent = ParentProfile.create_from_admission_application(
                self.application, relationship
            )
            if parent:
                # Link to student profile
                parent.student = student_profile
                parent.save()
    
    def __str__(self):
        status_display = f"{self.decision}"
        if self.enrollment_status == 'enrolled':
            status_display += " - ENROLLED"
        elif self.enrollment_status == 'withdrawn':
            status_display += " - WITHDRAWN"
        return f"{self.application.applicant_name} - {self.school.school_name} ({status_display})"


class AdmissionFeeStructure(models.Model):
    """Model to store admission fee structure based on class and category"""
    
    CLASS_CHOICES = [
        ('nursery', 'Nursery'),
        ('lkg', 'LKG/Lower Kindergarten'),
        ('ukg', 'UKG/Upper Kindergarten'),
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
        db_table = 'admissions_admissionfeestructure'
    
    def __str__(self):
        if self.annual_fee_max and self.annual_fee_max != self.annual_fee_min:
            return f"{self.class_range} - {self.category}: ₹{self.annual_fee_min} - ₹{self.annual_fee_max}"
        else:
            return f"{self.class_range} - {self.category}: ₹{self.annual_fee_min}"
    
    @classmethod
    def get_fee_for_student(cls, course_applied, category):
        """Calculate fee for a student based on their course and category"""
        import re
        
        # Handle special cases first
        course_lower = course_applied.lower()
        
        # Check for pre-primary classes first
        if 'nursery' in course_lower:
            class_range = 'nursery'
        elif 'lkg' in course_lower or 'lower kindergarten' in course_lower:
            class_range = 'lkg'
        elif 'ukg' in course_lower or 'upper kindergarten' in course_lower or 'kindergarten' in course_lower:
            class_range = 'ukg'
        # Handle 11th and 12th with streams (science, commerce, arts)
        elif '11th' in course_lower or '12th' in course_lower:
            class_range = '11-12'
        else:
            # Map course to class range
            class_mapping = {
                '1': '1-8', '2': '1-8', '3': '1-8', '4': '1-8', 
                '5': '1-8', '6': '1-8', '7': '1-8', '8': '1-8',
                '9': '9-10', '10': '9-10',
                '11': '11-12', '12': '11-12'
            }
            
            # Extract class number from course_applied using regex
            class_number = None
            
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
    
    @classmethod
    def get_default_fee_amount(cls, category='general'):
        """Get a reasonable default fee amount when no fee structure is found"""
        # Return a reasonable default based on category
        if category == 'general':
            return 15000.0  # Default for general category
        else:
            return 10000.0  # Reduced fee for SC/ST/OBC/SBC categories
    
    @classmethod
    def get_fee_amount_for_student(cls, course_applied, category):
        """Get the admission fee amount for a student, with fallback to default"""
        fee_structure = cls.get_fee_for_student(course_applied, category)
        if fee_structure:
            return float(fee_structure.annual_fee_min)
        else:
            return cls.get_default_fee_amount(category)
