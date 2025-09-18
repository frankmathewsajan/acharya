from django.contrib import admin
from .models import HostelBlock, HostelRoom, HostelBed, HostelAllocation, HostelComplaint, HostelLeaveRequest


@admin.register(HostelBlock)
class HostelBlockAdmin(admin.ModelAdmin):
    """Admin configuration for HostelBlock model"""
    
    list_display = ['name', 'school', 'warden', 'total_rooms', 'total_beds', 'is_active']
    list_filter = ['school', 'is_active']
    search_fields = ['name', 'school__school_name', 'warden__user__first_name', 'warden__user__last_name']
    
    fieldsets = (
        ('Block Information', {
            'fields': ('name', 'description', 'school')
        }),
        ('Management', {
            'fields': ('warden', 'total_rooms', 'total_beds', 'is_active')
        }),
    )
    
    def get_queryset(self, request):
        """Filter blocks by user's school if not superuser"""
        qs = super().get_queryset(request)
        if not request.user.is_superuser and hasattr(request.user, 'school'):
            qs = qs.filter(school=request.user.school)
        return qs


@admin.register(HostelRoom)
class HostelRoomAdmin(admin.ModelAdmin):
    """Admin configuration for HostelRoom model"""
    
    list_display = ['room_number', 'block', 'room_type', 'capacity', 'current_occupancy', 'is_available', 'floor_number']
    list_filter = ['room_type', 'is_available', 'block__school', 'floor_number']
    search_fields = ['room_number', 'block__name', 'block__school__school_name']
    
    fieldsets = (
        ('Room Information', {
            'fields': ('block', 'room_number', 'room_type', 'floor_number')
        }),
        ('Capacity', {
            'fields': ('capacity', 'current_occupancy', 'is_available')
        }),
        ('Details', {
            'fields': ('amenities',),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Filter rooms by user's school if not superuser"""
        qs = super().get_queryset(request)
        if not request.user.is_superuser and hasattr(request.user, 'school'):
            qs = qs.filter(block__school=request.user.school)
        return qs


@admin.register(HostelBed)
class HostelBedAdmin(admin.ModelAdmin):
    """Admin configuration for HostelBed model"""
    
    list_display = ['bed_number', 'room', 'bed_type', 'is_available', 'is_occupied', 'maintenance_status']
    list_filter = ['bed_type', 'is_available', 'room__block__school']
    search_fields = ['bed_number', 'room__room_number', 'room__block__name']
    
    fieldsets = (
        ('Bed Information', {
            'fields': ('room', 'bed_number', 'bed_type')
        }),
        ('Status', {
            'fields': ('is_available', 'maintenance_status')
        }),
    )
    
    def get_queryset(self, request):
        """Filter beds by user's school if not superuser"""
        qs = super().get_queryset(request)
        if not request.user.is_superuser and hasattr(request.user, 'school'):
            qs = qs.filter(room__block__school=request.user.school)
        return qs


@admin.register(HostelAllocation)
class HostelAllocationAdmin(admin.ModelAdmin):
    """Admin configuration for HostelAllocation model"""
    
    list_display = ['student', 'bed', 'allocation_date', 'vacation_date', 'status', 'allocated_by']
    list_filter = ['status', 'allocation_date', 'bed__room__block__school']
    search_fields = ['student__user__first_name', 'student__user__last_name', 'student__admission_number', 'bed__bed_number']
    date_hierarchy = 'allocation_date'
    
    fieldsets = (
        ('Allocation Information', {
            'fields': ('student', 'bed', 'allocated_by')
        }),
        ('Dates', {
            'fields': ('allocation_date', 'vacation_date', 'status')
        }),
        ('Payment', {
            'fields': ('payment', 'hostel_fee_amount'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Filter allocations by user's school if not superuser"""
        qs = super().get_queryset(request)
        if not request.user.is_superuser and hasattr(request.user, 'school'):
            qs = qs.filter(bed__room__block__school=request.user.school)
        return qs


@admin.register(HostelComplaint)
class HostelComplaintAdmin(admin.ModelAdmin):
    """Admin configuration for HostelComplaint model"""
    
    list_display = ['title', 'student', 'room', 'category', 'priority', 'status', 'submitted_date', 'resolved_by']
    list_filter = ['category', 'priority', 'status', 'submitted_date', 'room__block__school']
    search_fields = [
        'title', 'description',
        'student__user__first_name', 'student__user__last_name',
        'student__admission_number', 'room__room_number'
    ]
    date_hierarchy = 'submitted_date'
    readonly_fields = ['submitted_date']
    
    fieldsets = (
        ('Complaint Information', {
            'fields': ('title', 'description', 'student', 'room', 'category')
        }),
        ('Priority & Status', {
            'fields': ('priority', 'status')
        }),
        ('Assignment & Resolution', {
            'fields': ('assigned_to', 'resolved_by', 'resolved_date', 'resolution_notes'),
            'classes': ('collapse',)
        }),
        ('Attachments', {
            'fields': ('attachment_url',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('submitted_date',),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Filter complaints by user's school if not superuser"""
        qs = super().get_queryset(request)
        if not request.user.is_superuser and hasattr(request.user, 'school'):
            qs = qs.filter(room__block__school=request.user.school)
        return qs


@admin.register(HostelLeaveRequest)
class HostelLeaveRequestAdmin(admin.ModelAdmin):
    """Admin configuration for HostelLeaveRequest model"""
    
    list_display = ['student', 'leave_type', 'start_date', 'end_date', 'status', 'submitted_date']
    list_filter = ['leave_type', 'status', 'start_date', 'student__school']
    search_fields = [
        'student__user__first_name', 'student__user__last_name',
        'student__admission_number', 'reason', 'destination'
    ]
    date_hierarchy = 'start_date'
    readonly_fields = ['submitted_date']
    
    fieldsets = (
        ('Leave Information', {
            'fields': ('student', 'leave_type', 'reason', 'destination')
        }),
        ('Dates', {
            'fields': ('start_date', 'end_date', 'expected_return_date', 'actual_return_date')
        }),
        ('Status & Approval', {
            'fields': ('status', 'approved_by', 'rejected_by', 'approval_notes', 'decision_date'),
            'classes': ('collapse',)
        }),
        ('Contact & Emergency', {
            'fields': ('emergency_contact',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('submitted_date',),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Filter leave requests by user's school if not superuser"""
        qs = super().get_queryset(request)
        if not request.user.is_superuser and hasattr(request.user, 'school'):
            qs = qs.filter(student__school=request.user.school)
        return qs
