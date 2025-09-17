from django.contrib import admin
from .models import AdmissionApplication, EmailVerification, SchoolAdmissionDecision, AdmissionFeeStructure


class SchoolAdmissionDecisionInline(admin.TabularInline):
    """Inline for displaying school decisions in the application detail view"""
    model = SchoolAdmissionDecision
    extra = 0
    readonly_fields = ['decision_date', 'student_choice_date', 'enrollment_date', 'withdrawal_date', 'get_status_display']
    fields = ['school', 'preference_order', 'decision', 'get_status_display', 'enrollment_status', 'reviewed_by', 'review_comments']
    
    def get_status_display(self, obj):
        """Display comprehensive status for inline"""
        if obj.enrollment_status == 'enrolled':
            date_str = obj.enrollment_date.strftime('%m/%d/%y') if obj.enrollment_date else 'Unknown'
            return f"ENROLLED ({date_str})"
        elif obj.enrollment_status == 'withdrawn':
            date_str = obj.withdrawal_date.strftime('%m/%d/%y') if obj.withdrawal_date else 'Unknown'
            return f"WITHDRAWN ({date_str})"
        elif obj.decision == 'accepted':
            return "ACCEPTED - NOT ENROLLED"
        elif obj.decision == 'rejected':
            return "REJECTED"
        elif obj.decision == 'waitlisted':
            return "WAITLISTED"
        else:
            return "PENDING REVIEW"
    
    get_status_display.short_description = 'Current Status'
    
    def has_add_permission(self, request, obj=None):
        """Prevent adding new decisions via inline - they're auto-created"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deleting decisions via inline"""
        return False

@admin.register(EmailVerification)
class EmailVerificationAdmin(admin.ModelAdmin):
    """Admin configuration for EmailVerification"""
    
    list_display = [
        'email', 'otp', 'is_verified', 'created_at', 'verified_at', 'expires_at', 'attempts'
    ]
    list_filter = ['is_verified', 'created_at', 'expires_at']
    search_fields = ['email']
    readonly_fields = ['created_at', 'verified_at', 'otp', 'attempts']
    
    fieldsets = (
        ('Email Verification', {
            'fields': ('email', 'otp', 'is_verified')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'verified_at', 'expires_at')
        }),
        ('Security', {
            'fields': ('attempts',)
        }),
    )


@admin.register(AdmissionApplication)
class AdmissionApplicationAdmin(admin.ModelAdmin):
    """Admin configuration for AdmissionApplication"""
    
    list_display = [
        'reference_id', 'applicant_name', 'course_applied', 'first_preference_school', 
        'email', 'status', 'get_enrollment_status', 'application_date', 'reviewed_by'
    ]
    list_filter = ['status', 'course_applied', 'first_preference_school', 'application_date']
    search_fields = [
        'reference_id', 'applicant_name', 'email', 'phone_number', 
        'first_preference_school__school_name', 'second_preference_school__school_name', 
        'third_preference_school__school_name', 'father_name', 'mother_name', 'guardian_name',
        'father_phone', 'mother_phone', 'guardian_phone', 'father_email', 'mother_email', 'guardian_email'
    ]
    readonly_fields = ['application_date', 'email_verification']
    inlines = [SchoolAdmissionDecisionInline]
    
    def get_enrollment_status(self, obj):
        """Display enrollment status summary with color coding"""
        enrolled_decisions = obj.school_decisions.filter(enrollment_status='enrolled')
        if enrolled_decisions.exists():
            schools = [decision.school.school_name for decision in enrolled_decisions]
            return f"ENROLLED at {', '.join(schools)}"
        
        withdrawn_decisions = obj.school_decisions.filter(enrollment_status='withdrawn')
        if withdrawn_decisions.exists():
            schools = [decision.school.school_name for decision in withdrawn_decisions]
            return f"WITHDRAWN from {', '.join(schools)}"
        
        accepted_decisions = obj.school_decisions.filter(decision='accepted')
        if accepted_decisions.exists():
            return f"{accepted_decisions.count()} SCHOOL(S) ACCEPTED - NOT ENROLLED YET"
        
        return "NO ACCEPTANCES YET"
    
    get_enrollment_status.short_description = 'Enrollment Status'
    
    fieldsets = (
        ('Application Reference', {
            'fields': ('reference_id',)
        }),
        ('Email Verification', {
            'fields': ('email_verification',)
        }),
        ('Personal Information', {
            'fields': ('applicant_name', 'date_of_birth', 'email', 'phone_number', 'address', 'category')
        }),
        ('Academic Information', {
            'fields': ('course_applied', 'previous_school', 'last_percentage')
        }),
        ('School Preferences', {
            'fields': ('first_preference_school', 'second_preference_school', 'third_preference_school')
        }),
        ('Father Information', {
            'fields': (
                'father_name', 'father_phone', 'father_email', 'father_occupation',
                'father_address', 'father_aadhar', 'father_qualification', 'father_company',
                'father_annual_income', 'father_emergency_contact'
            ),
            'classes': ('collapse',)
        }),
        ('Mother Information', {
            'fields': (
                'mother_name', 'mother_phone', 'mother_email', 'mother_occupation',
                'mother_address', 'mother_aadhar', 'mother_qualification', 'mother_company',
                'mother_annual_income', 'mother_emergency_contact'
            ),
            'classes': ('collapse',)
        }),
        ('Guardian Information', {
            'fields': (
                'guardian_name', 'guardian_phone', 'guardian_email', 'guardian_relationship',
                'guardian_address', 'guardian_aadhar', 'guardian_qualification', 'guardian_company',
                'guardian_annual_income', 'guardian_emergency_contact'
            ),
            'classes': ('collapse',)
        }),
        ('Family & Emergency Information', {
            'fields': (
                'primary_contact', 'family_annual_income', 'number_of_siblings',
                'siblings_in_school', 'family_address', 'emergency_contact_name',
                'emergency_contact_phone', 'emergency_contact_relationship'
            ),
            'classes': ('collapse',)
        }),
        ('Application Status', {
            'fields': ('status', 'review_comments', 'reviewed_by', 'review_date')
        }),
        ('Documents', {
            'fields': ('documents',)
        }),
    )


@admin.register(SchoolAdmissionDecision)
class SchoolAdmissionDecisionAdmin(admin.ModelAdmin):
    """Admin configuration for SchoolAdmissionDecision"""
    
    list_display = [
        'get_application_info', 'school', 'preference_order', 'get_decision_status', 
        'get_enrollment_display', 'decision_date', 'enrollment_date', 'reviewed_by'
    ]
    list_filter = [
        'decision', 'enrollment_status', 'preference_order', 'school', 
        'decision_date', 'enrollment_date', 'is_student_choice'
    ]
    search_fields = [
        'application__applicant_name', 'application__reference_id', 
        'school__school_name', 'application__email'
    ]
    readonly_fields = ['decision_date', 'student_choice_date', 'enrollment_date', 'withdrawal_date']
    
    def get_application_info(self, obj):
        """Show application info with reference ID"""
        return f"{obj.application.applicant_name} ({obj.application.reference_id})"
    
    get_application_info.short_description = 'Student (Ref ID)'
    
    def get_decision_status(self, obj):
        """Enhanced decision status display"""
        return f"{obj.decision.upper()}"
    
    get_decision_status.short_description = 'Decision Status'
    
    def get_enrollment_display(self, obj):
        """Enhanced enrollment status display"""
        if obj.enrollment_status == 'enrolled':
            date_str = obj.enrollment_date.strftime('%m/%d/%y') if obj.enrollment_date else 'Unknown'
            return f"ENROLLED ({date_str})"
        elif obj.enrollment_status == 'withdrawn':
            date_str = obj.withdrawal_date.strftime('%m/%d/%y') if obj.withdrawal_date else 'Unknown'
            return f"WITHDRAWN ({date_str})"
        elif obj.decision == 'accepted':
            return "ACCEPTED - NOT ENROLLED"
        else:
            return f"{obj.enrollment_status.upper().replace('_', ' ')}"
    
    get_enrollment_display.short_description = 'Enrollment Status'
    
    def save_model(self, request, obj, form, change):
        """Custom save with validation and auto-setting reviewed_by"""
        if not obj.reviewed_by:
            obj.reviewed_by = request.user
        
        try:
            super().save_model(request, obj, form, change)
        except Exception as e:
            from django.contrib import messages
            messages.error(request, f"Error saving: {str(e)}")
            raise
    
    fieldsets = (
        ('Application Info', {
            'fields': ('application', 'school', 'preference_order')
        }),
        ('Decision', {
            'fields': ('decision', 'decision_date', 'reviewed_by', 'review_comments')
        }),
        ('Student Choice', {
            'fields': ('is_student_choice', 'student_choice_date')
        }),
        ('Enrollment Management', {
            'fields': (
                'enrollment_status', 'enrollment_date', 'withdrawal_date', 
                'withdrawal_reason'
            ),
            'description': 'Enrollment status changes automatically based on student actions. Manual changes should be made carefully.'
        }),
        ('Payment Information', {
            'fields': ('payment_status', 'payment_reference'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        """Optimize queryset with related objects"""
        return super().get_queryset(request).select_related('application', 'school', 'reviewed_by')


@admin.register(AdmissionFeeStructure)
class AdmissionFeeStructureAdmin(admin.ModelAdmin):
    """Admin configuration for AdmissionFeeStructure model"""
    
    list_display = ['class_range', 'category', 'annual_fee_min', 'annual_fee_max']
    list_filter = ['class_range', 'category']
    search_fields = ['class_range', 'category']
    
    fieldsets = (
        ('Fee Information', {
            'fields': ('class_range', 'category', 'annual_fee_min', 'annual_fee_max')
        }),
    )
    
    def save_model(self, request, obj, form, change):
        """Ensure annual_fee_max is not less than annual_fee_min"""
        if obj.annual_fee_max and obj.annual_fee_max < obj.annual_fee_min:
            obj.annual_fee_max = obj.annual_fee_min
        super().save_model(request, obj, form, change)
