from django.contrib import admin
from .models import ClassSession, AttendanceRecord


@admin.register(ClassSession)
class ClassSessionAdmin(admin.ModelAdmin):
    """Admin configuration for ClassSession model"""
    
    list_display = ['subject', 'course', 'batch', 'date', 'start_time', 'end_time', 'faculty', 'school']
    list_filter = ['course', 'subject', 'date', 'school']
    search_fields = ['subject', 'course', 'batch', 'faculty__user__first_name', 'faculty__user__last_name']
    date_hierarchy = 'date'
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Class Information', {
            'fields': ('school', 'course', 'subject', 'batch')
        }),
        ('Schedule', {
            'fields': ('date', 'start_time', 'end_time')
        }),
        ('Faculty', {
            'fields': ('faculty',)
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Filter sessions by user's school if not superuser"""
        qs = super().get_queryset(request)
        if not request.user.is_superuser and hasattr(request.user, 'school'):
            qs = qs.filter(school=request.user.school)
        return qs


class AttendanceRecordInline(admin.TabularInline):
    """Inline for displaying attendance records in session view"""
    model = AttendanceRecord
    extra = 0
    readonly_fields = ['marked_at']
    fields = ['student', 'status', 'marked_by', 'remarks', 'marked_at']


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    """Admin configuration for AttendanceRecord model"""
    
    list_display = ['student', 'session', 'status', 'marked_by', 'marked_at']
    list_filter = ['status', 'session__date', 'session__course', 'session__school']
    search_fields = [
        'student__user__first_name', 'student__user__last_name',
        'student__admission_number', 'session__subject'
    ]
    readonly_fields = ['marked_at']
    
    fieldsets = (
        ('Attendance Information', {
            'fields': ('session', 'student', 'status')
        }),
        ('Additional Info', {
            'fields': ('remarks',)
        }),
        ('Metadata', {
            'fields': ('marked_by', 'marked_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Filter attendance by user's school if not superuser"""
        qs = super().get_queryset(request)
        if not request.user.is_superuser and hasattr(request.user, 'school'):
            qs = qs.filter(session__school=request.user.school)
        return qs

    def save_model(self, request, obj, form, change):
        """Set marked_by to current user if creating new record"""
        if not change and hasattr(request.user, 'staffprofile'):
            obj.marked_by = request.user.staffprofile
        super().save_model(request, obj, form, change)


# Add the inline to ClassSessionAdmin
ClassSessionAdmin.inlines = [AttendanceRecordInline]
