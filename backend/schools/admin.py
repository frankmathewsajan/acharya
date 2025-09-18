from django.contrib import admin
from .models import School


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ['school_name', 'school_code', 'district', 'block', 'is_active', 'activated_at']
    list_filter = ['is_active', 'district', 'block']
    search_fields = ['school_name', 'school_code', 'district', 'village']
    readonly_fields = ['activated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('school_name', 'school_code', 'district', 'block', 'village')
        }),
        ('Status', {
            'fields': ('is_active', 'activated_at')
        }),
        ('Contact Information', {
            'fields': ('contact_email', 'contact_phone', 'address'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['activate_schools', 'deactivate_schools']
    
    def activate_schools(self, request, queryset):
        """Custom action to activate schools"""
        activated_count = 0
        for school in queryset.filter(is_active=False):
            school.is_active = True
            school.save()  # This will trigger the signal to create admin
            activated_count += 1
        
        self.message_user(
            request,
            f"Successfully activated {activated_count} schools and created admin accounts."
        )
    activate_schools.short_description = "Activate selected schools"
    
    def deactivate_schools(self, request, queryset):
        """Custom action to deactivate schools"""
        deactivated_count = queryset.filter(is_active=True).update(is_active=False)
        self.message_user(
            request,
            f"Successfully deactivated {deactivated_count} schools."
        )
    deactivate_schools.short_description = "Deactivate selected schools"
