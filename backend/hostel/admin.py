from django.contrib import admin
from .models import HostelBlock, HostelRoom, HostelAllocation, HostelComplaint


@admin.register(HostelBlock)
class HostelBlockAdmin(admin.ModelAdmin):
    """Admin configuration for HostelBlock model"""
    
    list_display = ['name', 'school', 'warden', 'total_rooms']
    list_filter = ['school']
    search_fields = ['name', 'school__school_name', 'warden__user__first_name', 'warden__user__last_name']
    
    fieldsets = (
        ('Block Information', {
            'fields': ('name', 'description', 'school')
        }),
        ('Management', {
            'fields': ('warden', 'total_rooms')
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
    
    list_display = ['room_number', 'block', 'room_type', 'capacity', 'current_occupancy', 'is_available']
    list_filter = ['room_type', 'is_available', 'block__school']
    search_fields = ['room_number', 'block__name', 'block__school__school_name']
    
    fieldsets = (
        ('Room Information', {
            'fields': ('block', 'room_number', 'room_type')
        }),
        ('Capacity', {
            'fields': ('capacity', 'current_occupancy', 'is_available')
        }),
    )
    
    def get_queryset(self, request):
        """Filter rooms by user's school if not superuser"""
        qs = super().get_queryset(request)
        if not request.user.is_superuser and hasattr(request.user, 'school'):
            qs = qs.filter(block__school=request.user.school)
        return qs


@admin.register(HostelAllocation)
class HostelAllocationAdmin(admin.ModelAdmin):
    """Admin configuration for HostelAllocation model"""
    
    list_display = ['student', 'room', 'allocation_date', 'vacation_date', 'status', 'allocated_by']
    list_filter = ['status', 'allocation_date', 'room__block__school']
    search_fields = [
        'student__user__first_name', 'student__user__last_name',
        'student__admission_number', 'room__room_number', 'room__block__name'
    ]
    date_hierarchy = 'allocation_date'
    readonly_fields = ['allocation_date']
    
    fieldsets = (
        ('Allocation Information', {
            'fields': ('student', 'room', 'allocated_by')
        }),
        ('Dates', {
            'fields': ('allocation_date', 'vacation_date')
        }),
        ('Status', {
            'fields': ('status',)
        }),
    )
    
    def get_queryset(self, request):
        """Filter allocations by user's school if not superuser"""
        qs = super().get_queryset(request)
        if not request.user.is_superuser and hasattr(request.user, 'school'):
            qs = qs.filter(room__block__school=request.user.school)
        return qs

    def save_model(self, request, obj, form, change):
        """Set allocated_by to current user if creating new allocation"""
        if not change and hasattr(request.user, 'staffprofile'):
            obj.allocated_by = request.user.staffprofile
        super().save_model(request, obj, form, change)


@admin.register(HostelComplaint)
class HostelComplaintAdmin(admin.ModelAdmin):
    """Admin configuration for HostelComplaint model"""
    
    list_display = ['title', 'student', 'room', 'priority', 'status', 'submitted_date', 'resolved_by']
    list_filter = ['priority', 'status', 'submitted_date', 'room__block__school']
    search_fields = [
        'title', 'description',
        'student__user__first_name', 'student__user__last_name',
        'room__room_number', 'room__block__name'
    ]
    date_hierarchy = 'submitted_date'
    readonly_fields = ['submitted_date']
    
    fieldsets = (
        ('Complaint Information', {
            'fields': ('title', 'description', 'student', 'room')
        }),
        ('Priority & Status', {
            'fields': ('priority', 'status')
        }),
        ('Resolution', {
            'fields': ('resolved_date', 'resolved_by'),
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
