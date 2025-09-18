from django.contrib import admin

from django.contrib import admin
from .models import FeeStructure, FeeInvoice, Payment

@admin.register(FeeStructure)
class FeeStructureAdmin(admin.ModelAdmin):
    """Admin configuration for FeeStructure"""
    
    list_display = ['course', 'semester', 'total_fee']
    list_filter = ['course', 'semester']
    search_fields = ['course']


@admin.register(FeeInvoice)
class FeeInvoiceAdmin(admin.ModelAdmin):
    """Admin configuration for FeeInvoice"""
    
    list_display = [
        'invoice_number', 'student', 'amount', 'due_date', 
        'status', 'created_date'
    ]
    list_filter = ['status', 'created_date', 'due_date']
    search_fields = [
        'invoice_number', 'student__user__first_name', 
        'student__user__last_name', 'student__admission_number'
    ]
    readonly_fields = ['invoice_number', 'created_date']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Admin configuration for Payment"""
    
    list_display = [
        'transaction_id', 'invoice', 'amount', 'payment_method', 
        'payment_date'
    ]
    list_filter = ['payment_method', 'payment_date']
    search_fields = ['transaction_id', 'invoice__invoice_number']
    readonly_fields = ['transaction_id', 'payment_date']
