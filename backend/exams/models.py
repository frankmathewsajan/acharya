from django.db import models

from django.db import models

class Exam(models.Model):
    """Model for exams"""
    
    EXAM_TYPES = [
        ('internal', 'Internal'),
        ('external', 'External'),
        ('practical', 'Practical'),
        ('assignment', 'Assignment'),
    ]
    
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=100)
    exam_type = models.CharField(max_length=20, choices=EXAM_TYPES)
    course = models.CharField(max_length=100)
    subject = models.CharField(max_length=100)
    semester = models.IntegerField()
    date = models.DateField()
    max_marks = models.IntegerField()
    duration_minutes = models.IntegerField()
    created_by = models.ForeignKey('users.StaffProfile', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['school', 'course', 'semester']),
            models.Index(fields=['school', 'date']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.subject} ({self.course}) [{self.school.school_name}]"


class ExamResult(models.Model):
    """Model for exam results"""
    
    GRADE_CHOICES = [
        ('A+', 'A+'),
        ('A', 'A'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B', 'B'),
        ('B-', 'B-'),
        ('C+', 'C+'),
        ('C', 'C'),
        ('C-', 'C-'),
        ('D', 'D'),
        ('F', 'F'),
    ]
    
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    student = models.ForeignKey('users.StudentProfile', on_delete=models.CASCADE)
    marks_obtained = models.FloatField()
    grade = models.CharField(max_length=2, choices=GRADE_CHOICES)
    remarks = models.TextField(blank=True)
    entered_by = models.ForeignKey('users.StaffProfile', on_delete=models.CASCADE)
    entered_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['exam', 'student']
        indexes = [
            models.Index(fields=['exam', 'student']),
            models.Index(fields=['grade', 'entered_at']),
        ]
    
    def __str__(self):
        return f"{self.student.user.full_name} - {self.exam.name} ({self.marks_obtained}/{self.exam.max_marks}) [{self.exam.school.school_name}]"
