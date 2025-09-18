from django.shortcuts import render
from django.db import models
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Exam, ExamResult
from .serializers import ExamSerializer, ExamResultSerializer, ExamResultDetailSerializer


class ExamViewSet(viewsets.ModelViewSet):
    """ViewSet for Exam model"""
    queryset = Exam.objects.all()
    serializer_class = ExamSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['exam_type', 'course', 'subject', 'semester']
    ordering = ['-date', '-created_at']


class ExamResultViewSet(viewsets.ModelViewSet):
    """ViewSet for ExamResult model"""
    serializer_class = ExamResultSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['exam__course', 'exam__subject', 'exam__semester', 'grade']
    ordering = ['-exam__date', '-entered_at']
    
    def get_queryset(self):
        queryset = ExamResult.objects.all()
        user = self.request.user
        
        # Filter based on user role
        if user.role == 'student':
            # Students can only see their own results
            try:
                student_profile = user.studentprofile
                queryset = queryset.filter(student=student_profile)
            except:
                queryset = queryset.none()
        elif user.role == 'parent':
            # Parents can see their children's results
            try:
                parent_profile = user.parentprofile
                children = parent_profile.children.all()
                queryset = queryset.filter(student__in=children)
            except:
                queryset = queryset.none()
        # Staff and admin can see all results
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ExamResultDetailSerializer
        return ExamResultSerializer
    
    @action(detail=False, methods=['get'])
    def results(self, request):
        """Get exam results for the current user"""
        queryset = self.get_queryset()
        
        # Apply additional filters
        exam_id = request.query_params.get('exam')
        if exam_id:
            queryset = queryset.filter(exam_id=exam_id)
            
        semester = request.query_params.get('semester')
        if semester:
            queryset = queryset.filter(exam__semester=semester)
            
        course = request.query_params.get('course')
        if course:
            queryset = queryset.filter(exam__course=course)
        
        # Apply pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get exam results summary for the current user"""
        queryset = self.get_queryset()
        
        # Calculate summary statistics
        total_exams = queryset.count()
        if total_exams == 0:
            return Response({
                'total_exams': 0,
                'average_percentage': 0,
                'grade_distribution': {},
                'recent_results': []
            })
        
        # Calculate average percentage
        avg_percentage = queryset.aggregate(
            avg_marks=models.Avg('marks_obtained'),
            avg_max_marks=models.Avg('exam__max_marks')
        )
        
        if avg_percentage['avg_max_marks'] and avg_percentage['avg_max_marks'] > 0:
            average_percentage = round(
                (avg_percentage['avg_marks'] / avg_percentage['avg_max_marks']) * 100, 2
            )
        else:
            average_percentage = 0
        
        # Grade distribution
        grade_distribution = {}
        for choice in ExamResult.GRADE_CHOICES:
            grade = choice[0]
            count = queryset.filter(grade=grade).count()
            if count > 0:
                grade_distribution[grade] = count
        
        # Recent results (last 5)
        recent_results = queryset[:5]
        recent_serializer = self.get_serializer(recent_results, many=True)
        
        return Response({
            'total_exams': total_exams,
            'average_percentage': average_percentage,
            'grade_distribution': grade_distribution,
            'recent_results': recent_serializer.data
        })
