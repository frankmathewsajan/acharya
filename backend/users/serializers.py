from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, StudentProfile, ParentProfile, StaffProfile

class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    date_joined = serializers.DateTimeField(source='created_at', read_only=True)
    full_name = serializers.SerializerMethodField()
    school = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'role', 'phone_number', 'is_active', 'date_joined', 'school']
        read_only_fields = ['id', 'date_joined']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()
    
    def get_school(self, obj):
        if obj.school:
            return {
                'id': obj.school.id,
                'school_name': obj.school.school_name,
                'school_code': obj.school.school_code
            }
        return None


class LoginSerializer(serializers.Serializer):
    """Serializer for login"""
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        if email and password:
            user = authenticate(username=email, password=password)
            if user:
                if user.is_active:
                    data['user'] = user
                else:
                    raise serializers.ValidationError('User account is disabled.')
            else:
                raise serializers.ValidationError('Invalid credentials.')
        else:
            raise serializers.ValidationError('Must include email and password.')
        
        return data


class StudentProfileSerializer(serializers.ModelSerializer):
    """Serializer for StudentProfile"""
    user = UserSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentProfile
        fields = '__all__'
    
    def get_full_name(self, obj):
        """Get full name from first_name and last_name"""
        return f"{obj.first_name} {obj.last_name}".strip() if obj.first_name and obj.last_name else None


class ParentProfileSerializer(serializers.ModelSerializer):
    """Serializer for ParentProfile"""
    student = StudentProfileSerializer(read_only=True)
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = ParentProfile
        fields = '__all__'


class StudentDashboardSerializer(serializers.ModelSerializer):
    """Serializer for student data in parent dashboard - restricted fields"""
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = StudentProfile
        fields = [
            'id', 'admission_number', 'full_name', 'course', 'department', 
            'semester', 'is_hostelite', 'first_name', 'last_name'
        ]


class StaffProfileSerializer(serializers.ModelSerializer):
    """Serializer for StaffProfile"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = StaffProfile
        fields = '__all__'


class DashboardDataSerializer(serializers.Serializer):
    """Serializer for dashboard data"""
    user = UserSerializer()
    profile = serializers.JSONField()
    stats = serializers.JSONField()
    recent_activities = serializers.JSONField()