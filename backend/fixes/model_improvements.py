# Backend Model Improvements
# These changes should be applied carefully with proper migrations

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings

# users/models.py updates
class User(AbstractUser):
    """Custom User model with role-based access and school association"""
    
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('parent', 'Parent'),
        ('faculty', 'Faculty'),
        ('warden', 'Warden'),
        ('admin', 'Admin'),  # Changed from 'management' to match frontend
        ('librarian', 'Librarian'),
    ]
    
    # Add consistent related names
    school = models.ForeignKey(
        'schools.School', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='users'  # Added related name
    )

# hostel/models.py improvements
class HostelAllocation(models.Model):
    student = models.ForeignKey(
        'users.StudentProfile', 
        on_delete=models.CASCADE,
        related_name='hostel_allocations'  # Add related name
    )
    bed = models.ForeignKey(
        'HostelBed', 
        on_delete=models.CASCADE,
        related_name='allocation'  # Changed from allocations to allocation (one-to-one)
    )
    allocated_by = models.ForeignKey(
        'users.StaffProfile', 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='allocated_beds'  # Add related name
    )

# library/models.py improvements
class BookRequest(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='book_requests'  # Add related name
    )
    school = models.ForeignKey(
        'schools.School', 
        on_delete=models.CASCADE,
        related_name='book_requests'  # Add related name
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='reviewed_book_requests'  # Add related name
    )