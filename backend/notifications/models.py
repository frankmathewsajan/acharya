from django.db import models

from django.db import models
from django.conf import settings

class Notice(models.Model):
    """Model for notices and announcements"""
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    TARGET_ROLES = [
        ('all', 'All'),
        ('student', 'Students'),
        ('parent', 'Parents'),
        ('faculty', 'Faculty'),
        ('staff', 'Staff'),
    ]
    
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=200)
    content = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    target_roles = models.JSONField(default=list)  # Store list of target roles
    is_sticky = models.BooleanField(default=False)  # Pin to top
    publish_date = models.DateTimeField()
    expire_date = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['school', 'priority']),
            models.Index(fields=['school', 'publish_date']),
            models.Index(fields=['school', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.title} [{self.school.school_name}]"


class UserNotification(models.Model):
    """Model for individual user notifications"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    notice = models.ForeignKey(Notice, on_delete=models.CASCADE)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['user', 'notice']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['notice', 'is_read']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.notice.title} [{self.notice.school.school_name}]"
