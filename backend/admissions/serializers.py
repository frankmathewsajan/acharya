from rest_framework import serializers
from .models import AdmissionApplication, EmailVerification, SchoolAdmissionDecision
from schools.serializers import SchoolSerializer


class EmailVerificationRequestSerializer(serializers.Serializer):
    """Serializer for requesting email verification OTP"""
    email = serializers.EmailField()
    applicant_name = serializers.CharField(max_length=100, required=False, allow_blank=True)


class EmailVerificationSerializer(serializers.Serializer):
    """Serializer for verifying email with OTP"""
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6, min_length=6)


class AdmissionApplicationSerializer(serializers.ModelSerializer):
    """Serializer for AdmissionApplication"""
    first_preference_school = SchoolSerializer(read_only=True)
    second_preference_school = SchoolSerializer(read_only=True)
    third_preference_school = SchoolSerializer(read_only=True)
    
    class Meta:
        model = AdmissionApplication
        fields = '__all__'
        read_only_fields = ['reference_id', 'application_date', 'reviewed_by', 'review_date']


class AdmissionApplicationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating admission applications"""
    email_verification_token = serializers.CharField(write_only=True, help_text="Email verification token from OTP verification")
    
    class Meta:
        model = AdmissionApplication
        fields = [
            'applicant_name', 'date_of_birth', 'email', 'phone_number',
            'address', 'category', 'course_applied', 'first_preference_school', 
            'second_preference_school', 'third_preference_school',
            'previous_school', 'last_percentage', 'documents',
            'email_verification_token'
        ]
    
    def validate(self, attrs):
        """Validate that email has been verified"""
        email = attrs.get('email')
        email_verification_token = attrs.pop('email_verification_token', None)
        
        if not email_verification_token:
            raise serializers.ValidationError("Email verification is required.")
        
        # Find the most recent verified EmailVerification for this email
        try:
            verification = EmailVerification.objects.filter(
                email=email,
                is_verified=True,
                otp=email_verification_token
            ).latest('verified_at')
            
            # Check if verification is still recent (within 1 hour)
            from django.utils import timezone
            from datetime import timedelta
            
            if verification.verified_at < timezone.now() - timedelta(hours=1):
                raise serializers.ValidationError("Email verification has expired. Please verify your email again.")
            
            # Store the verification instance to link it later
            attrs['_email_verification'] = verification
            
        except EmailVerification.DoesNotExist:
            raise serializers.ValidationError("Invalid email verification. Please verify your email first.")
        
        return attrs
    
    def create(self, validated_data):
        """Create admission application with email verification link"""
        email_verification = validated_data.pop('_email_verification')
        application = super().create(validated_data)
        application.email_verification = email_verification
        application.save()
        return application


class SchoolAdmissionDecisionSerializer(serializers.ModelSerializer):
    """Serializer for SchoolAdmissionDecision"""
    school = SchoolSerializer(read_only=True)
    application = serializers.StringRelatedField(read_only=True)
    school_name = serializers.CharField(source='school.school_name', read_only=True)
    can_enroll = serializers.SerializerMethodField()
    can_withdraw = serializers.SerializerMethodField()
    
    class Meta:
        model = SchoolAdmissionDecision
        fields = '__all__'
        read_only_fields = ['decision_date', 'student_choice_date', 'enrollment_date', 'withdrawal_date']
    
    def get_can_enroll(self, obj):
        """Check if student can enroll in this school"""
        return obj.can_enroll()
    
    def get_can_withdraw(self, obj):
        """Check if student can withdraw from this school"""
        return obj.can_withdraw()


class AdmissionTrackingSerializer(serializers.ModelSerializer):
    """Serializer for tracking admission applications with school decisions"""
    first_preference_school = SchoolSerializer(read_only=True)
    second_preference_school = SchoolSerializer(read_only=True)
    third_preference_school = SchoolSerializer(read_only=True)
    school_decisions = SchoolAdmissionDecisionSerializer(many=True, read_only=True)
    
    class Meta:
        model = AdmissionApplication
        fields = [
            'reference_id', 'applicant_name', 'course_applied', 'category', 'status',
            'first_preference_school', 'second_preference_school', 'third_preference_school',
            'application_date', 'review_comments', 'school_decisions'
        ]


class AdmissionReviewSerializer(serializers.Serializer):
    """Serializer for reviewing admission applications"""
    status = serializers.ChoiceField(choices=AdmissionApplication.STATUS_CHOICES)
    review_comments = serializers.CharField(required=False, allow_blank=True)


class SchoolDecisionUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating school admission decisions"""
    
    class Meta:
        model = SchoolAdmissionDecision
        fields = ['decision', 'review_comments']


class StudentChoiceSerializer(serializers.Serializer):
    """Serializer for student choosing among accepted schools"""
    school_decision_id = serializers.IntegerField()


class AdmissionApplicationWithDecisionsSerializer(serializers.ModelSerializer):
    """Enhanced serializer with school decisions"""
    first_preference_school = SchoolSerializer(read_only=True)
    second_preference_school = SchoolSerializer(read_only=True)
    third_preference_school = SchoolSerializer(read_only=True)
    school_decisions = SchoolAdmissionDecisionSerializer(many=True, read_only=True)
    
    class Meta:
        model = AdmissionApplication
        fields = '__all__'
        read_only_fields = ['reference_id', 'application_date', 'reviewed_by', 'review_date']