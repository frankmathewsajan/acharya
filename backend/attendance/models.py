from django.db import models

from django.db import models
from django.conf import settings

class ClassSession(models.Model):
    """Model for class sessions"""
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, null=True, blank=True)
    course = models.CharField(max_length=100)
    subject = models.CharField(max_length=100)
    batch = models.CharField(max_length=50)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    faculty = models.ForeignKey('users.StaffProfile', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['school', 'course', 'subject', 'batch', 'date', 'start_time']
        indexes = [
            models.Index(fields=['school', 'date']),
            models.Index(fields=['school', 'course', 'subject']),
        ]
    
    def __str__(self):
        return f"{self.subject} - {self.course} ({self.date}) [{self.school.school_name}]"


class AttendanceRecord(models.Model):
    """Model for individual attendance records"""
    
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('excused', 'Excused'),
    ]
    
    session = models.ForeignKey(ClassSession, on_delete=models.CASCADE)
    student = models.ForeignKey('users.StudentProfile', on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    marked_by = models.ForeignKey('users.StaffProfile', on_delete=models.CASCADE)
    marked_at = models.DateTimeField(auto_now_add=True)
    remarks = models.TextField(blank=True)
    
    class Meta:
        unique_together = ['session', 'student']
        indexes = [
            models.Index(fields=['session', 'student']),
            models.Index(fields=['status', 'marked_at']),
        ]
    
    def __str__(self):
        return f"{self.student.user.full_name} - {self.session.subject} ({self.status}) [{self.session.school.school_name}]"
