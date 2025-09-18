from django.shortcuts import render
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import ClassSession, AttendanceRecord
from .serializers import ClassSessionSerializer, AttendanceRecordSerializer


class ClassSessionViewSet(viewsets.ModelViewSet):
    """ViewSet for class sessions"""
    queryset = ClassSession.objects.all()
    serializer_class = ClassSessionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['course', 'subject', 'batch', 'date', 'faculty']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by user role
        if self.request.user.role == 'student':
            # Students can only see sessions for their course/batch
            student_profile = getattr(self.request.user, 'student_profile', None)
            if student_profile:
                queryset = queryset.filter(
                    course=student_profile.course,
                    batch=student_profile.batch
                )
        elif self.request.user.role == 'teacher':
            # Teachers can only see their own sessions
            staff_profile = getattr(self.request.user, 'staff_profile', None)
            if staff_profile:
                queryset = queryset.filter(faculty=staff_profile)
        
        return queryset.order_by('-date', '-start_time')


class AttendanceRecordViewSet(viewsets.ModelViewSet):
    """ViewSet for attendance records"""
    queryset = AttendanceRecord.objects.all()
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['student', 'session', 'status']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by user role
        if self.request.user.role == 'student':
            # Students can only see their own attendance records
            student_profile = getattr(self.request.user, 'student_profile', None)
            if student_profile:
                queryset = queryset.filter(student=student_profile)
        elif self.request.user.role == 'teacher':
            # Teachers can see records for sessions they conduct
            staff_profile = getattr(self.request.user, 'staff_profile', None)
            if staff_profile:
                queryset = queryset.filter(session__faculty=staff_profile)
        elif self.request.user.role == 'parent':
            # Parents can see records for their children
            parent_profile = getattr(self.request.user, 'parent_profile', None)
            if parent_profile:
                children_ids = parent_profile.children.values_list('id', flat=True)
                queryset = queryset.filter(student__id__in=children_ids)
        
        return queryset.select_related('student__user', 'session').order_by('-session__date', '-session__start_time')

    @action(detail=False, methods=['get'])
    def records(self, request):
        """Get attendance records with filtering"""
        student_id = request.query_params.get('student')
        
        if student_id:
            # Filter by specific student
            queryset = self.get_queryset().filter(student__id=student_id)
        else:
            queryset = self.get_queryset()
        
        # Apply additional filters
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        if date_from:
            queryset = queryset.filter(session__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(session__date__lte=date_to)
        
        # Paginate results
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
