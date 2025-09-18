from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import StudentProfile, User
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=StudentProfile)
def handle_student_activation(sender, instance, created, **kwargs):
    """
    Auto-create a User account when a StudentProfile is activated.
    This mirrors the school/admin activation pattern.
    """
    if instance.is_active and not instance.user:
        try:
            # Generate student credentials
            email, password = instance.generate_student_credentials()
            
            # Create the user account
            user = User.objects.create_user(
                username=email,  # Use email as username
                email=email,
                password=password,
                first_name=instance.first_name or '',
                last_name=instance.last_name or '',
                school=instance.school,
                role='student',
                is_staff=False,
                is_active=True
            )
            
            # Link the user to the student profile
            instance.user = user
            instance.save(update_fields=['user'])
            
            logger.info(f"Auto-created user account for student: {instance.full_name} (Email: {email})")
            
        except Exception as e:
            logger.error(f"Failed to create user for student {instance.full_name}: {str(e)}")
            # Optionally deactivate the student if user creation fails
            instance.is_active = False
            instance.save(update_fields=['is_active'])
            instance.is_active = False
            instance.save(update_fields=['is_active'])