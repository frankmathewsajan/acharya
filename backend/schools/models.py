from django.db import models
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver


class School(models.Model):
    """Model for schools with administrative boundaries"""
    
    district = models.CharField(max_length=100, db_index=True)
    block = models.CharField(max_length=100, db_index=True)
    village = models.CharField(max_length=200, db_index=True)
    school_name = models.CharField(max_length=300)
    school_code = models.CharField(max_length=20, unique=True, db_index=True)
    is_active = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    activated_at = models.DateTimeField(null=True, blank=True)
    
    # Contact and additional information
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    
    class Meta:
        ordering = ['district', 'block', 'school_name']
        indexes = [
            models.Index(fields=['district', 'block']),
            models.Index(fields=['school_code', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.school_name} ({self.school_code})"
    
    def get_admin_username(self):
        """Generate admin username from last 5 digits of school code"""
        return f"admin{self.school_code[-5:]}"
    
    def get_admin_password(self):
        """Generate admin password in format: admin#{last5digits}"""
        return f"admin#{self.school_code[-5:]}"
    
    def get_admin_email(self):
        """Generate admin email in format: admin@{last5digits}.rj.gov.in"""
        return f"admin@{self.school_code[-5:]}.rj.gov.in"
    
    def get_student_email(self, admission_number):
        """Generate student email in format: student.{admission_number}@{school_code_last5}.rj"""
        # Ensure admission number is 5 digits
        adm_num = str(admission_number).zfill(5)
        return f"student.{adm_num}@{self.school_code[-5:]}.rj"
    
    def get_staff_email(self, designation, employee_id):
        """Generate staff email in format: {designation}.{employee_id_last5}@{school_code_last5}.rj"""
        # Clean designation (lowercase, replace spaces with underscore)
        clean_designation = designation.lower().replace(' ', '_')
        # Get last 5 digits of employee ID
        emp_id = str(employee_id).zfill(5)[-5:]
        return f"{clean_designation}.{emp_id}@{self.school_code[-5:]}.rj"
    
    @property
    def full_location(self):
        """Get full location string"""
        return f"{self.village}, {self.block}, {self.district}"


@receiver(post_save, sender=School)
def handle_school_activation_deactivation(sender, instance, created, **kwargs):
    """
    Signal handler to manage school activation/deactivation
    - Creates admin user when school is activated
    - Disables all users when school is deactivated
    """
    if instance.is_active:
        # School is active - create admin and enable users
        create_admin_for_school(instance)
        enable_school_users(instance)
    else:
        # School is inactive - disable all users
        disable_school_users(instance)


def create_admin_for_school(school):
    """Create admin user for a school (idempotent - safe to call multiple times)"""
    from django.utils import timezone
    User = get_user_model()
    
    username = school.get_admin_username()
    password = school.get_admin_password()
    admin_email = school.get_admin_email()
    
    # Check if admin already exists
    existing_admin = User.objects.filter(username=username).first()
    if existing_admin:
        # Ensure existing admin is properly linked to school and active
        if existing_admin.school != school:
            existing_admin.school = school
        if not existing_admin.is_active:
            existing_admin.is_active = True
        # Update email to new format
        if existing_admin.email != admin_email:
            existing_admin.email = admin_email
        # Update password to new format
        existing_admin.set_password(password)
        existing_admin.save()  # Save all changes including password
        print(f"Admin user updated for {school.school_name}: {username}/{password} - {admin_email}")
        return existing_admin
    
    # Create new admin user with new email format
    admin_user = User.objects.create_user(
        username=username,
        password=password,
        email=admin_email,
        first_name="School",
        last_name="Administrator", 
        role="admin",
        school=school
    )
    
    # Update school activation timestamp if not set
    if not school.activated_at:
        school.activated_at = timezone.now()
        school.save(update_fields=['activated_at'])
    
    print(f"Created admin user for {school.school_name}: {username}/{password} - {admin_email}")
    return admin_user


def enable_school_users(school):
    """Enable all users belonging to a school"""
    User = get_user_model()
    
    # Enable all users for this school
    users_updated = User.objects.filter(school=school, is_active=False).update(is_active=True)
    if users_updated > 0:
        print(f"Enabled {users_updated} users for school: {school.school_name}")


def disable_school_users(school):
    """Disable all users belonging to a school (without deleting)"""
    User = get_user_model()
    
    # Disable all users for this school
    users_updated = User.objects.filter(school=school, is_active=True).update(is_active=False)
    if users_updated > 0:
        print(f"Disabled {users_updated} users for school: {school.school_name}")
        print(f"Users will regain access when school is reactivated")
