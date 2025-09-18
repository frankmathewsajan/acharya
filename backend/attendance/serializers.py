from rest_framework import serializers
from .models import ClassSession, AttendanceRecord
from users.serializers import StudentProfileSerializer, StaffProfileSerializer


class ClassSessionSerializer(serializers.ModelSerializer):
    """Serializer for ClassSession model"""
    faculty_name = serializers.CharField(source='faculty.user.get_full_name', read_only=True)
    
    class Meta:
        model = ClassSession
        fields = '__all__'
        read_only_fields = ['created_at']


class AttendanceRecordSerializer(serializers.ModelSerializer):
    """Serializer for AttendanceRecord model"""
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    session_subject = serializers.CharField(source='session.subject', read_only=True)
    session_date = serializers.DateField(source='session.date', read_only=True)
    session_time = serializers.TimeField(source='session.start_time', read_only=True)
    marked_by_name = serializers.CharField(source='marked_by.user.get_full_name', read_only=True)
    
    class Meta:
        model = AttendanceRecord
        fields = '__all__'
        read_only_fields = ['marked_at']


class AttendanceRecordDetailSerializer(AttendanceRecordSerializer):
    """Detailed serializer for AttendanceRecord with nested relationships"""
    student = StudentProfileSerializer(read_only=True)
    session = ClassSessionSerializer(read_only=True)
    marked_by = StaffProfileSerializer(read_only=True)
    
    class Meta(AttendanceRecordSerializer.Meta):
        fields = '__all__'


class AttendanceMarkSerializer(serializers.Serializer):
    """Serializer for marking attendance"""
    session_id = serializers.IntegerField()
    attendance_data = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )