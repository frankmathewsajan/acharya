from rest_framework import serializers
from .models import School


class SchoolSerializer(serializers.ModelSerializer):
    """Serializer for School model"""
    
    class Meta:
        model = School
        fields = [
            'id', 'district', 'block', 'village', 'school_name', 
            'school_code', 'is_active', 'created_at', 'activated_at',
            'contact_email', 'contact_phone', 'address'
        ]
        read_only_fields = ['id', 'created_at', 'activated_at']


class SchoolStatsSerializer(serializers.Serializer):
    """Serializer for school statistics"""
    totalStudents = serializers.IntegerField()
    totalTeachers = serializers.IntegerField()
    totalStaff = serializers.IntegerField()
    totalWardens = serializers.IntegerField()
    activeParents = serializers.IntegerField()
    totalClasses = serializers.IntegerField()
    currentSemester = serializers.CharField()
    school = serializers.DictField()