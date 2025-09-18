from django.db import models

from django.db import models
from django.conf import settings

class FeeStructure(models.Model):
    """Model for fee structure by course/semester"""
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, null=True, blank=True)
    course = models.CharField(max_length=100)
    semester = models.IntegerField()
    tuition_fee = models.DecimalField(max_digits=10, decimal_places=2)
    library_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    lab_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    exam_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_fee = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        unique_together = ['school', 'course', 'semester']
        indexes = [
            models.Index(fields=['school', 'course']),
        ]
    
    def __str__(self):
        return f"{self.course} - Semester {self.semester} [{self.school.school_name}]"


class FeeInvoice(models.Model):
    """Model for fee invoices"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]
    
    FEE_TYPE_CHOICES = [
        ('tuition', 'Tuition Fee'),
        ('hostel', 'Hostel Fee'),
        ('library', 'Library Fee'),
        ('lab', 'Lab Fee'),
        ('exam', 'Exam Fee'),
        ('admission', 'Admission Fee'),
        ('other', 'Other Fee'),
    ]
    
    invoice_number = models.CharField(max_length=20)
    student = models.ForeignKey('users.StudentProfile', on_delete=models.CASCADE)
    fee_structure = models.ForeignKey(FeeStructure, on_delete=models.CASCADE, null=True, blank=True)
    fee_type = models.CharField(max_length=20, choices=FEE_TYPE_CHOICES, default='tuition')
    description = models.CharField(max_length=200, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    academic_year = models.IntegerField(default=2024)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['due_date', 'status']),
            models.Index(fields=['fee_structure', 'student']),
            models.Index(fields=['fee_type', 'student']),
            models.Index(fields=['academic_year', 'student']),
        ]
    
    def __str__(self):
        if self.fee_structure:
            return f"Invoice {self.invoice_number} - {self.student.user.full_name} [{self.fee_structure.school.school_name}]"
        else:
            return f"Invoice {self.invoice_number} - {self.student.user.full_name} ({self.get_fee_type_display()})"


class Payment(models.Model):
    """Model for fee payments"""
    
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('online', 'Online'),
        ('bank_transfer', 'Bank Transfer'),
    ]
    
    invoice = models.ForeignKey(FeeInvoice, on_delete=models.CASCADE)
    transaction_id = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    payment_date = models.DateTimeField(auto_now_add=True)
    receipt_path = models.CharField(max_length=500, blank=True)  # S3 path for receipt
    
    def __str__(self):
        return f"Payment {self.transaction_id} - {self.amount}"
