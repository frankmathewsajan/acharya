from django.db import models

from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """Custom User model with role-based access and school association"""
    
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('parent', 'Parent'),
        ('faculty', 'Faculty'),
        ('warden', 'Warden'),
        ('admin', 'Admin'),
        ('librarian', 'Librarian'),
        ('management', 'Management'),
    ]
    
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    is_active = models.BooleanField(default=True)
    phone_number = models.CharField(max_length=15, blank=True)
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'role']
    
    class Meta:
        indexes = [
            models.Index(fields=['school', 'role']),
            models.Index(fields=['email', 'school']),
        ]
    
    def __str__(self):
        school_name = self.school.school_name if self.school else "No School"
        return f"{self.email} ({self.get_role_display()}) - {school_name}"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    def generate_email_from_school(self):
        """Generate email based on role and school"""
        if not self.school:
            return None
            
        if self.role == 'admin':
            return self.school.get_admin_email()
        elif self.role == 'student' and hasattr(self, 'student_profile'):
            return self.school.get_student_email(self.student_profile.admission_number)
        elif self.role in ['faculty', 'warden'] and hasattr(self, 'staff_profile'):
            return self.school.get_staff_email(self.staff_profile.designation, self.staff_profile.employee_id)
        
        # Fallback for other roles
        return f"{self.role}@{self.school.school_code[-5:]}.rj"
    
    def update_email_format(self):
        """Update user email to new format"""
        new_email = self.generate_email_from_school()
        if new_email and new_email != self.email:
            self.email = new_email
            self.save(update_fields=['email'])
            return True
        return False


class StudentProfile(models.Model):
    """Extended profile for students"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile', null=True, blank=True)
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='students', null=True, blank=True)
    first_name = models.CharField(max_length=30, null=True, blank=True)
    last_name = models.CharField(max_length=30, null=True, blank=True)
    admission_number = models.CharField(max_length=20, blank=True)
    roll_number = models.CharField(max_length=20)
    course = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    semester = models.IntegerField()
    date_of_birth = models.DateField()
    address = models.TextField()
    emergency_contact = models.CharField(max_length=15)
    is_hostelite = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False, help_text="When activated, a user account will be created")
    
    class Meta:
        indexes = [
            models.Index(fields=['school', 'admission_number']),
            models.Index(fields=['school', 'is_active']),
        ]
    
    def save(self, *args, **kwargs):
        """Auto-generate admission number if not provided"""
        if not self.admission_number:
            from django.db import transaction
            with transaction.atomic():
                self.admission_number = self.generate_admission_number()
                super().save(*args, **kwargs)
        else:
            super().save(*args, **kwargs)
    
    def generate_admission_number(self):
        """Generate a 5-digit admission number starting from 10001"""
        from django.db import transaction
        
        with transaction.atomic():
            # Get all existing 5-digit numeric admission numbers
            if self.school:
                existing_numbers = StudentProfile.objects.select_for_update().filter(
                    school=self.school,
                    admission_number__regex=r'^\d{5}$'
                ).values_list('admission_number', flat=True)
            else:
                existing_numbers = StudentProfile.objects.select_for_update().filter(
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
    
    def __str__(self):
        name = f"{self.first_name or ''} {self.last_name or ''}".strip() or f"Student {self.admission_number}"
        school_name = self.school.school_name if self.school else "No School"
        return f"{name} - {self.admission_number} ({school_name})"
    
    @property
    def full_name(self):
        """Get student's full name"""
        return f"{self.first_name or ''} {self.last_name or ''}".strip() or f"Student {self.admission_number}"
    
    def generate_student_credentials(self):
        """Generate email and password for student activation"""
        if not self.school:
            raise ValueError("Student must be linked to a school before activation")
        
        # Get last 5 digits of school code
        school_code_last5 = self.school.school_code[-5:] if len(self.school.school_code) >= 5 else self.school.school_code
        
        # Generate email using format: student.admission_number@last5digits.rj.gov.in
        email = f"student.{self.admission_number}@{school_code_last5}.rj.gov.in"
        
        # Generate password using format: admission_number#last5digits
        password = f"{self.admission_number}#{school_code_last5}"
        
        return email, password


class ParentProfile(models.Model):
    """Parent profile linked to students - no separate user account needed"""
    first_name = models.CharField(max_length=30, null=True, blank=True)
    last_name = models.CharField(max_length=30, null=True, blank=True)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    email = models.EmailField(blank=True, db_index=True)
    occupation = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    relationship = models.CharField(max_length=20, choices=[
        ('father', 'Father'),
        ('mother', 'Mother'),
        ('guardian', 'Guardian'),
    ], null=True, blank=True)
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='parents', null=True, blank=True)
    is_primary_contact = models.BooleanField(default=False, help_text="Primary contact for school communications")
    
    # OTP authentication fields
    last_otp_sent = models.DateTimeField(null=True, blank=True)
    otp_attempts = models.PositiveIntegerField(default=0)
    last_login_attempt = models.DateTimeField(null=True, blank=True)
    
    # Linking to admission application for better tracking
    admission_application = models.ForeignKey(
        'admissions.AdmissionApplication', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='parent_profiles'
    )
    
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['student', 'is_primary_contact']),
            models.Index(fields=['phone_number']),
            models.Index(fields=['email']),
            models.Index(fields=['admission_application']),
        ]
        unique_together = [
            ['student', 'relationship'],  # Only one father/mother/guardian per student
        ]
    
    def __str__(self):
        name = f"{self.first_name or ''} {self.last_name or ''}".strip() or "Unknown Parent"
        student_name = self.student.full_name if self.student else "No Student"
        relationship = self.get_relationship_display() if self.relationship else "Unknown Relation"
        return f"{name} ({relationship}) - {student_name}"
    
    @property
    def full_name(self):
        return f"{self.first_name or ''} {self.last_name or ''}".strip() or "Unknown Parent"
    
    def can_access_student_data(self, student_profile):
        """Check if this parent can access data for the given student"""
        return self.student == student_profile
    
    def can_request_otp(self):
        """Check if parent can request OTP (rate limiting)"""
        from django.utils import timezone
        from datetime import timedelta
        from django.conf import settings
        
        # Skip rate limiting when SEND_OTP is disabled (development mode)
        if not getattr(settings, 'SEND_OTP', True):
            return True, None
        
        if not self.last_otp_sent:
            return True, None
        
        # Allow new OTP after 2 minutes
        time_since_last = timezone.now() - self.last_otp_sent
        if time_since_last < timedelta(minutes=2):
            wait_time = 120 - time_since_last.total_seconds()
            return False, f"Please wait {int(wait_time)} seconds before requesting another OTP"
        
        # Reset attempts if it's been more than 30 minutes
        if time_since_last > timedelta(minutes=30):
            self.otp_attempts = 0
            self.save(update_fields=['otp_attempts'])
        
        # Max 5 OTP requests per 30 minutes
        if self.otp_attempts >= 5:
            return False, "Too many OTP requests. Please try again later."
        
        return True, None
    
    def record_otp_sent(self):
        """Record that an OTP was sent"""
        from django.utils import timezone
        self.last_otp_sent = timezone.now()
        self.otp_attempts += 1
        self.save(update_fields=['last_otp_sent', 'otp_attempts'])
    
    def record_login_attempt(self):
        """Record login attempt"""
        from django.utils import timezone
        self.last_login_attempt = timezone.now()
        self.save(update_fields=['last_login_attempt'])
    
    @classmethod
    def create_from_admission_application(cls, application, relationship):
        """Create parent profile from admission application data"""
        contact_info = application.get_primary_contact_info() if relationship == application.primary_contact else None
        
        if relationship == 'father':
            parent_data = {
                'first_name': application.father_name.split()[0] if application.father_name else '',
                'last_name': ' '.join(application.father_name.split()[1:]) if application.father_name and len(application.father_name.split()) > 1 else '',
                'email': application.father_email,
                'phone_number': application.father_phone,
                'occupation': application.father_occupation,
            }
        elif relationship == 'mother':
            parent_data = {
                'first_name': application.mother_name.split()[0] if application.mother_name else '',
                'last_name': ' '.join(application.mother_name.split()[1:]) if application.mother_name and len(application.mother_name.split()) > 1 else '',
                'email': application.mother_email,
                'phone_number': application.mother_phone,
                'occupation': application.mother_occupation,
            }
        elif relationship == 'guardian':
            parent_data = {
                'first_name': application.guardian_name.split()[0] if application.guardian_name else '',
                'last_name': ' '.join(application.guardian_name.split()[1:]) if application.guardian_name and len(application.guardian_name.split()) > 1 else '',
                'email': application.guardian_email,
                'phone_number': application.guardian_phone,
                'occupation': '',
            }
        else:
            return None
        
        # Only create if email is provided
        if not parent_data.get('email'):
            return None
        
        parent = cls.objects.create(
            relationship=relationship,
            admission_application=application,
            address=application.address,
            is_primary_contact=(relationship == application.primary_contact),
            **parent_data
        )
        
        return parent


class ParentOTP(models.Model):
    """Model for parent OTP authentication"""
    parent = models.ForeignKey(ParentProfile, on_delete=models.CASCADE, related_name='otp_records')
    email = models.EmailField(db_index=True)
    otp = models.CharField(max_length=6)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()
    attempts = models.PositiveIntegerField(default=0)
    
    class Meta:
        indexes = [
            models.Index(fields=['email', 'is_verified']),
            models.Index(fields=['email', 'expires_at']),
            models.Index(fields=['parent', 'created_at']),
        ]
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        """Set expiration time if not set"""
        if not self.expires_at:
            from django.utils import timezone
            from datetime import timedelta
            self.expires_at = timezone.now() + timedelta(minutes=10)  # OTP expires in 10 minutes
        super().save(*args, **kwargs)
    
    def is_expired(self):
        """Check if OTP has expired"""
        from django.utils import timezone
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
            from django.utils import timezone
            self.is_verified = True
            self.verified_at = timezone.now()
            self.save()
            return True
        else:
            self.save()  # Save the incremented attempts
            return False
    
    def __str__(self):
        status = "Verified" if self.is_verified else "Pending"
        return f"Parent OTP for {self.email} - {status} ({self.otp})"
    
    @classmethod
    def generate_otp(cls):
        """Generate a 6-digit OTP"""
        import random
        return ''.join([str(random.randint(0, 9)) for _ in range(6)])


class StaffProfile(models.Model):
    """Extended profile for staff (Faculty, Warden, Admin)"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, null=True, blank=True)
    employee_id = models.CharField(max_length=20, unique=True)
    department = models.CharField(max_length=100)
    designation = models.CharField(max_length=100)
    date_of_joining = models.DateField()
    qualification = models.TextField(blank=True)
    experience_years = models.IntegerField(default=0)
    
    def __str__(self):
        return f"{self.user.full_name} - {self.employee_id}"
