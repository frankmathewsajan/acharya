from django.contrib import admin
from .models import Notice, UserNotification


@admin.register(Notice)
class NoticeAdmin(admin.ModelAdmin):
    """Admin configuration for Notice model"""
    
    list_display = ['title', 'school', 'priority', 'target_roles_display', 'is_sticky', 'publish_date', 'is_active', 'created_by']
    list_filter = ['priority', 'is_sticky', 'is_active', 'school', 'publish_date']
    search_fields = ['title', 'content', 'school__school_name']
    date_hierarchy = 'publish_date'
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'content', 'school')
        }),
        ('Targeting & Priority', {
            'fields': ('target_roles', 'priority', 'is_sticky')
        }),
        ('Publishing', {
            'fields': ('publish_date', 'expire_date', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at'),
            'classes': ('collapse',)
        }),
    )
    
    def target_roles_display(self, obj):
        """Display target roles as a formatted string"""
        if obj.target_roles:
            return ', '.join(obj.target_roles)
        return 'None'
    target_roles_display.short_description = 'Target Roles'
    
    def get_queryset(self, request):
        """Filter notices by user's school if not superuser"""
        qs = super().get_queryset(request)
        if not request.user.is_superuser and hasattr(request.user, 'school'):
            qs = qs.filter(school=request.user.school)
        return qs

    def save_model(self, request, obj, form, change):
        """Set created_by to current user if creating new notice"""
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(UserNotification)
class UserNotificationAdmin(admin.ModelAdmin):
    """Admin configuration for UserNotification model"""
    
    list_display = ['user', 'notice', 'is_read', 'read_at']
    list_filter = ['is_read', 'notice__priority', 'notice__school']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'notice__title']
    readonly_fields = ['read_at']
    
    def get_queryset(self, request):
        """Filter notifications by user's school if not superuser"""
        qs = super().get_queryset(request)
        if not request.user.is_superuser and hasattr(request.user, 'school'):
            qs = qs.filter(notice__school=request.user.school)
        return qs
