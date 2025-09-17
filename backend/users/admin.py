from django.contrib import admin

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, StudentProfile, ParentProfile, StaffProfile

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for User model"""
    
    list_display = ['email', 'username', 'first_name', 'last_name', 'role', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'created_at']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': ('role', 'phone_number')
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Info', {
            'fields': ('email', 'role', 'phone_number')
        }),
    )


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    """Admin configuration for StudentProfile"""
    
    list_display = ['admission_number', 'full_name', 'school', 'user', 'course', 'semester', 'is_active', 'is_hostelite']
    list_filter = ['school', 'course', 'semester', 'is_active', 'is_hostelite']
    search_fields = ['admission_number', 'first_name', 'last_name', 'user__email']
    readonly_fields = ['admission_number', 'user']
    actions = ['activate_students', 'deactivate_students']
    
    fieldsets = (
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'admission_number', 'date_of_birth')
        }),
        ('Academic Information', {
            'fields': ('school', 'course', 'department', 'semester', 'roll_number')
        }),
        ('Contact Information', {
            'fields': ('address', 'emergency_contact')
        }),
        ('Status', {
            'fields': ('is_active', 'is_hostelite', 'user')
        }),
    )
    
    def full_name(self, obj):
        return obj.full_name
    full_name.short_description = 'Full Name'
    
    def activate_students(self, request, queryset):
        """Admin action to activate selected students"""
        count = 0
        for student in queryset.filter(is_active=False):
            if not student.school:
                self.message_user(request, f'Cannot activate student {student.admission_number}: No school assigned.', level='ERROR')
                continue
            student.is_active = True
            student.save()
            count += 1
        self.message_user(request, f'{count} students activated successfully.')
    activate_students.short_description = 'Activate selected students'
    
    def deactivate_students(self, request, queryset):
        """Admin action to deactivate selected students"""
        count = 0
        for student in queryset.filter(is_active=True):
            student.is_active = False
            student.save()
            count += 1
        self.message_user(request, f'{count} students deactivated successfully.')
    deactivate_students.short_description = 'Deactivate selected students'


@admin.register(ParentProfile)
class ParentProfileAdmin(admin.ModelAdmin):
    """Admin configuration for ParentProfile"""
    
    list_display = ['full_name', 'relationship', 'student', 'phone_number', 'is_primary_contact', 'email']
    list_filter = ['relationship', 'is_primary_contact', 'student__school']
    search_fields = [
        'first_name', 'last_name', 'phone_number', 'email',
        'student__admission_number', 'student__first_name', 'student__last_name'
    ]
    
    fieldsets = (
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'phone_number', 'email', 'occupation')
        }),
        ('Relationship', {
            'fields': ('student', 'relationship', 'is_primary_contact')
        }),
        ('Contact & Address', {
            'fields': ('address',)
        }),
        ('System Information', {
            'fields': ('admission_application', 'last_otp_sent', 'otp_attempts'),
            'classes': ('collapse',)
        }),
    )
    
    def full_name(self, obj):
        return obj.full_name
    full_name.short_description = 'Full Name'


@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    """Admin configuration for StaffProfile"""
    
    list_display = ['employee_id', 'user', 'department', 'designation', 'experience_years']
    list_filter = ['department', 'designation']
    search_fields = ['employee_id', 'user__first_name', 'user__last_name', 'user__email']
    readonly_fields = ['employee_id']
