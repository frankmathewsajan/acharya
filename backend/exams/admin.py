from django.contrib import admin
from .models import Exam, ExamResult


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    """Admin configuration for Exam model"""
    
    list_display = ['name', 'subject', 'course', 'semester', 'exam_type', 'date', 'max_marks', 'school']
    list_filter = ['exam_type', 'course', 'semester', 'school', 'date']
    search_fields = ['name', 'subject', 'course', 'school__school_name']
    date_hierarchy = 'date'
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'subject', 'course', 'semester', 'school')
        }),
        ('Exam Details', {
            'fields': ('exam_type', 'date', 'max_marks', 'duration_minutes')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Filter exams by user's school if not superuser"""
        qs = super().get_queryset(request)
        if not request.user.is_superuser and hasattr(request.user, 'school'):
            qs = qs.filter(school=request.user.school)
        return qs

    def save_model(self, request, obj, form, change):
        """Set created_by to current user if creating new exam"""
        if not change and hasattr(request.user, 'staffprofile'):
            obj.created_by = request.user.staffprofile
        super().save_model(request, obj, form, change)


@admin.register(ExamResult)
class ExamResultAdmin(admin.ModelAdmin):
    """Admin configuration for ExamResult model"""
    
    list_display = ['exam', 'student', 'marks_obtained', 'grade', 'entered_by', 'entered_at']
    list_filter = ['grade', 'exam__exam_type', 'exam__course', 'exam__school']
    search_fields = [
        'exam__name', 'exam__subject', 
        'student__user__first_name', 'student__user__last_name',
        'student__admission_number'
    ]
    readonly_fields = ['entered_at']
    
    fieldsets = (
        ('Result Information', {
            'fields': ('exam', 'student', 'marks_obtained', 'grade')
        }),
        ('Additional Info', {
            'fields': ('remarks',)
        }),
        ('Metadata', {
            'fields': ('entered_by', 'entered_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Filter results by user's school if not superuser"""
        qs = super().get_queryset(request)
        if not request.user.is_superuser and hasattr(request.user, 'school'):
            qs = qs.filter(exam__school=request.user.school)
        return qs

    def save_model(self, request, obj, form, change):
        """Set entered_by to current user if creating new result"""
        if not change and hasattr(request.user, 'staffprofile'):
            obj.entered_by = request.user.staffprofile
        super().save_model(request, obj, form, change)
