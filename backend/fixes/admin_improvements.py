# Enhanced Admin Interface
# admin_improvements.py - Comprehensive admin interface fixes

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe

# Import all models (these would need to be adjusted based on actual model locations)
User = get_user_model()

# Import other models - adjust these imports based on your actual app structure
# from users.models import StudentProfile, ParentProfile, StaffProfile
# from hostel.models import HostelBlock, HostelComplaint
# from library.models import LibraryBook, BookRequest

# For the fixes file, we'll use placeholder classes
class StudentProfile:
    pass

class ParentProfile:
    pass

class StaffProfile:
    pass

class HostelBlock:
    pass

class HostelComplaint:
    pass

class LibraryBook:
    pass

class BookRequest:
    pass

# Base Admin Classes with Consistent Patterns
class BaseModelAdmin(admin.ModelAdmin):
    """Base admin class with common functionality"""
    
    # Common settings
    save_on_top = True
    list_per_page = 50
    
    def get_queryset(self, request):
        """Optimize querysets with select_related and prefetch_related"""
        qs = super().get_queryset(request)
        
        # Add school filtering for non-superusers
        if not request.user.is_superuser and hasattr(request.user, 'school'):
            if hasattr(qs.model, 'school'):
                qs = qs.filter(school=request.user.school)
            elif hasattr(qs.model, 'student') and hasattr(qs.model.student.field.related_model, 'school'):
                qs = qs.filter(student__school=request.user.school)
                
        return qs

# Enhanced User Admin
@admin.register(User)
class EnhancedUserAdmin(BaseUserAdmin):
    """Enhanced User admin with better organization"""
    
    list_display = [
        'email', 'username', 'full_name_display', 'role_badge', 
        'school_link', 'is_active_display', 'created_at'
    ]
    list_filter = ['role', 'is_active', 'school', 'created_at']
    search_fields = ['email', 'username', 'first_name', 'last_name', 'school__school_name']
    ordering = ['-created_at']
    list_select_related = ['school']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('School Information', {
            'fields': ('role', 'school', 'phone_number'),
            'classes': ('wide',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def full_name_display(self, obj):
        return obj.get_full_name() or obj.username
    full_name_display.short_description = 'Full Name'
    
    def role_badge(self, obj):
        colors = {
            'admin': 'red',
            'faculty': 'blue', 
            'student': 'green',
            'parent': 'orange',
            'warden': 'purple',
            'librarian': 'teal'
        }
        color = colors.get(obj.role, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.get_role_display()
        )
    role_badge.short_description = 'Role'
    
    def school_link(self, obj):
        if obj.school:
            url = reverse('admin:schools_school_change', args=[obj.school.pk])
            return format_html('<a href="{}">{}</a>', url, obj.school.school_name)
        return '-'
    school_link.short_description = 'School'
    
    def is_active_display(self, obj):
        if obj.is_active:
            return format_html('<span style="color: green;">✓ Active</span>')
        return format_html('<span style="color: red;">✗ Inactive</span>')
    is_active_display.short_description = 'Status'

# Enhanced Student Profile Admin
@admin.register(StudentProfile)
class EnhancedStudentProfileAdmin(BaseModelAdmin):
    """Enhanced StudentProfile admin"""
    
    list_display = [
        'admission_number', 'full_name_display', 'school_link', 
        'course_semester_display', 'hostel_status', 'status_display'
    ]
    list_filter = [
        'school', 'course', 'semester', 'is_active', 'is_hostelite'
    ]
    search_fields = [
        'admission_number', 'first_name', 'last_name', 
        'user__email', 'user__username'
    ]
    list_select_related = ['user', 'school']
    readonly_fields = ['admission_number', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'date_of_birth', 'address')
        }),
        ('Academic Information', {
            'fields': ('school', 'admission_number', 'course', 'department', 'semester', 'roll_number')
        }),
        ('Contact & Emergency', {
            'fields': ('emergency_contact',)
        }),
        ('Status & Settings', {
            'fields': ('is_active', 'is_hostelite', 'user')
        }),
        ('System Information', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['activate_students', 'deactivate_students', 'mark_as_hostelite']
    
    def full_name_display(self, obj):
        return obj.full_name
    full_name_display.short_description = 'Full Name'
    
    def school_link(self, obj):
        if obj.school:
            url = reverse('admin:schools_school_change', args=[obj.school.pk])
            return format_html('<a href="{}">{}</a>', url, obj.school.school_name)
        return '-'
    school_link.short_description = 'School'
    
    def course_semester_display(self, obj):
        return f"{obj.course} - Sem {obj.semester}"
    course_semester_display.short_description = 'Course/Semester'
    
    def hostel_status(self, obj):
        if obj.is_hostelite:
            return format_html('<span style="color: blue;">🏠 Hostelite</span>')
        return format_html('<span style="color: gray;">🏠 Day Scholar</span>')
    hostel_status.short_description = 'Hostel'
    
    def status_display(self, obj):
        if obj.is_active:
            return format_html('<span style="color: green;">✓ Active</span>')
        return format_html('<span style="color: red;">✗ Inactive</span>')
    status_display.short_description = 'Status'
    
    def activate_students(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} students activated successfully.')
    activate_students.short_description = 'Activate selected students'
    
    def deactivate_students(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} students deactivated successfully.')
    deactivate_students.short_description = 'Deactivate selected students'
    
    def mark_as_hostelite(self, request, queryset):
        updated = queryset.update(is_hostelite=True)
        self.message_user(request, f'{updated} students marked as hostelites.')
    mark_as_hostelite.short_description = 'Mark as hostelite'

# Enhanced Hostel Admin Classes
@admin.register(HostelBlock)
class EnhancedHostelBlockAdmin(BaseModelAdmin):
    """Enhanced HostelBlock admin"""
    
    list_display = [
        'name', 'school_link', 'warden_link', 'rooms_beds_display', 
        'occupancy_display', 'is_active_display'
    ]
    list_filter = ['school', 'is_active', 'warden']
    search_fields = ['name', 'school__school_name', 'warden__user__first_name']
    list_select_related = ['school', 'warden__user']
    
    def school_link(self, obj):
        if obj.school:
            url = reverse('admin:schools_school_change', args=[obj.school.pk])
            return format_html('<a href="{}">{}</a>', url, obj.school.school_name)
        return '-'
    school_link.short_description = 'School'
    
    def warden_link(self, obj):
        if obj.warden:
            url = reverse('admin:users_staffprofile_change', args=[obj.warden.pk])
            return format_html('<a href="{}">{}</a>', url, obj.warden.user.get_full_name())
        return '-'
    warden_link.short_description = 'Warden'
    
    def rooms_beds_display(self, obj):
        return f"{obj.total_rooms} rooms / {obj.total_beds} beds"
    rooms_beds_display.short_description = 'Capacity'
    
    def occupancy_display(self, obj):
        rate = obj.get_occupancy_rate()
        if rate < 50:
            color = 'green'
        elif rate < 80:
            color = 'orange'
        else:
            color = 'red'
        return format_html(
            '<span style="color: {};">{:.1f}%</span>', 
            color, rate
        )
    occupancy_display.short_description = 'Occupancy'
    
    def is_active_display(self, obj):
        if obj.is_active:
            return format_html('<span style="color: green;">✓</span>')
        return format_html('<span style="color: red;">✗</span>')
    is_active_display.short_description = 'Active'

@admin.register(HostelComplaint)
class EnhancedHostelComplaintAdmin(BaseModelAdmin):
    """Enhanced HostelComplaint admin"""
    
    list_display = [
        'title', 'student_link', 'category_badge', 'priority_badge', 
        'status_badge', 'submitted_date', 'days_open'
    ]
    list_filter = ['category', 'priority', 'status', 'submitted_date']
    search_fields = [
        'title', 'description', 'student__first_name', 'student__last_name'
    ]
    list_select_related = ['student', 'room__block']
    date_hierarchy = 'submitted_date'
    
    fieldsets = (
        ('Complaint Details', {
            'fields': ('student', 'room', 'title', 'description')
        }),
        ('Classification', {
            'fields': ('category', 'priority', 'status')
        }),
        ('Resolution', {
            'fields': ('assigned_to', 'resolved_by', 'resolution_notes', 'resolved_date')
        }),
        ('Timestamps', {
            'fields': ('submitted_date',),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['submitted_date']
    
    def student_link(self, obj):
        url = reverse('admin:users_studentprofile_change', args=[obj.student.pk])
        return format_html('<a href="{}">{}</a>', url, obj.student.full_name)
    student_link.short_description = 'Student'
    
    def category_badge(self, obj):
        colors = {
            'maintenance': 'blue',
            'cleanliness': 'green',
            'food': 'orange',
            'noise': 'purple',
            'security': 'red',
            'other': 'gray'
        }
        color = colors.get(obj.category, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">{}</span>',
            color, obj.get_category_display()
        )
    category_badge.short_description = 'Category'
    
    def priority_badge(self, obj):
        colors = {
            'low': 'green',
            'medium': 'orange',
            'high': 'red',
            'urgent': 'darkred'
        }
        color = colors.get(obj.priority, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">{}</span>',
            color, obj.get_priority_display()
        )
    priority_badge.short_description = 'Priority'
    
    def status_badge(self, obj):
        colors = {
            'open': 'red',
            'in_progress': 'orange',
            'resolved': 'green',
            'closed': 'gray'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def days_open(self, obj):
        from django.utils import timezone
        if obj.status in ['resolved', 'closed']:
            return '-'
        days = (timezone.now().date() - obj.submitted_date.date()).days
        if days > 7:
            return format_html('<span style="color: red; font-weight: bold;">{} days</span>', days)
        elif days > 3:
            return format_html('<span style="color: orange;">{} days</span>', days)
        return f"{days} days"
    days_open.short_description = 'Days Open'

# Enhanced Library Admin Classes
@admin.register(LibraryBook)
class EnhancedLibraryBookAdmin(BaseModelAdmin):
    """Enhanced LibraryBook admin"""
    
    list_display = [
        'title', 'author', 'isbn', 'category', 'availability_display',
        'copies_display', 'school_link'
    ]
    list_filter = ['category', 'school', 'saleability', 'total_copies']
    search_fields = ['title', 'author', 'isbn', 'google_books_id']
    list_select_related = ['school']
    
    fieldsets = (
        ('Book Information', {
            'fields': ('title', 'author', 'isbn', 'publisher', 'publication_year')
        }),
        ('Classification', {
            'fields': ('category', 'description', 'school')
        }),
        ('Physical Library', {
            'fields': ('total_copies', 'available_copies', 'shelf_location')
        }),
        ('Digital Information', {
            'fields': ('google_books_id', 'image_links', 'price', 'page_count', 'saleability')
        }),
    )
    
    def availability_display(self, obj):
        if obj.is_available_for_borrowing:
            return format_html('<span style="color: green;">✓ Available</span>')
        elif obj.total_copies > 0:
            return format_html('<span style="color: orange;">All Borrowed</span>')
        else:
            return format_html('<span style="color: gray;">Digital Only</span>')
    availability_display.short_description = 'Availability'
    
    def copies_display(self, obj):
        if obj.total_copies > 0:
            return f"{obj.available_copies}/{obj.total_copies}"
        return "Digital"
    copies_display.short_description = 'Copies'
    
    def school_link(self, obj):
        if obj.school:
            url = reverse('admin:schools_school_change', args=[obj.school.pk])
            return format_html('<a href="{}">{}</a>', url, obj.school.school_name)
        return 'Global'
    school_link.short_description = 'School'

# Enhanced Book Request Admin
@admin.register(BookRequest)
class EnhancedBookRequestAdmin(BaseModelAdmin):
    """Enhanced BookRequest admin"""
    
    list_display = [
        'title', 'author', 'user_link', 'urgency_badge', 
        'status_badge', 'created_at', 'days_pending'
    ]
    list_filter = ['urgency', 'status', 'created_at', 'school']
    search_fields = ['title', 'author', 'user__first_name', 'user__last_name']
    list_select_related = ['user', 'school', 'reviewed_by']
    date_hierarchy = 'created_at'
    
    def user_link(self, obj):
        url = reverse('admin:users_user_change', args=[obj.user.pk])
        return format_html('<a href="{}">{}</a>', url, obj.user.get_full_name())
    user_link.short_description = 'Requested By'
    
    def urgency_badge(self, obj):
        colors = {'low': 'green', 'medium': 'orange', 'high': 'red'}
        color = colors.get(obj.urgency, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">{}</span>',
            color, obj.get_urgency_display()
        )
    urgency_badge.short_description = 'Urgency'
    
    def status_badge(self, obj):
        colors = {
            'pending': 'orange',
            'approved': 'green', 
            'rejected': 'red',
            'available': 'blue'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def days_pending(self, obj):
        if obj.status != 'pending':
            return '-'
        from django.utils import timezone
        days = (timezone.now().date() - obj.created_at.date()).days
        if days > 14:
            return format_html('<span style="color: red; font-weight: bold;">{} days</span>', days)
        elif days > 7:
            return format_html('<span style="color: orange;">{} days</span>', days)
        return f"{days} days"
    days_pending.short_description = 'Days Pending'

# Custom Admin Site Configuration
admin.site.site_header = "Acharya ERP Administration"
admin.site.site_title = "Acharya ERP Admin"
admin.site.index_title = "Welcome to Acharya ERP Administration"