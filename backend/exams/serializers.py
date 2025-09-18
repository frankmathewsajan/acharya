from rest_framework import serializers
from .models import Exam, ExamResult
from users.serializers import StudentProfileSerializer, StaffProfileSerializer


class ExamSerializer(serializers.ModelSerializer):
    """Serializer for Exam model"""
    created_by_name = serializers.CharField(source='created_by.user.get_full_name', read_only=True)
    
    class Meta:
        model = Exam
        fields = '__all__'
        read_only_fields = ['created_at']


class ExamResultSerializer(serializers.ModelSerializer):
    """Serializer for ExamResult model"""
    exam_name = serializers.CharField(source='exam.name', read_only=True)
    exam_subject = serializers.CharField(source='exam.subject', read_only=True)
    exam_course = serializers.CharField(source='exam.course', read_only=True)
    exam_max_marks = serializers.IntegerField(source='exam.max_marks', read_only=True)
    exam_date = serializers.DateField(source='exam.date', read_only=True)
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    entered_by_name = serializers.CharField(source='entered_by.user.get_full_name', read_only=True)
    percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = ExamResult
        fields = '__all__'
        read_only_fields = ['entered_at']
    
    def get_percentage(self, obj):
        """Calculate percentage score"""
        if obj.exam.max_marks > 0:
            return round((obj.marks_obtained / obj.exam.max_marks) * 100, 2)
        return 0


class ExamResultDetailSerializer(ExamResultSerializer):
    """Detailed serializer for ExamResult with nested relationships"""
    exam = ExamSerializer(read_only=True)
    student = StudentProfileSerializer(read_only=True)
    entered_by = StaffProfileSerializer(read_only=True)
    
    class Meta(ExamResultSerializer.Meta):
        fields = '__all__'