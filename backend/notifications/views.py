from django.shortcuts import render
from django.db import models
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Notice, UserNotification
from .serializers import NoticeSerializer, UserNotificationSerializer, UserNotificationDetailSerializer


class NoticeViewSet(viewsets.ModelViewSet):
    """ViewSet for Notice model"""
    queryset = Notice.objects.all()
    serializer_class = NoticeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'content', 'priority', 'target_roles']
    ordering = ['-is_sticky', '-priority', '-publish_date']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter active notices that are currently published
        now = timezone.now()
        queryset = queryset.filter(
            is_active=True,
            publish_date__lte=now
        )
        # Optionally filter expired notices
        if self.request.query_params.get('include_expired') != 'true':
            queryset = queryset.filter(
                models.Q(expire_date__isnull=True) | models.Q(expire_date__gte=now)
            )
        return queryset
    
    @action(detail=False, methods=['get'])
    def notices(self, request):
        """Get notices for the current user based on their role"""
        user = request.user
        queryset = self.get_queryset()
        
        # Filter by user role
        if user.role != 'admin':
            queryset = queryset.filter(
                models.Q(target_roles__contains=[user.role]) | 
                models.Q(target_roles__contains=['all'])
            )
        
        # Apply pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class UserNotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for UserNotification model"""
    serializer_class = UserNotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['notice__title', 'notice__content']
    ordering = ['-notice__publish_date']
    
    def get_queryset(self):
        return UserNotification.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return UserNotificationDetailSerializer
        return UserNotificationSerializer
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read for the current user"""
        updated = UserNotification.objects.filter(
            user=request.user,
            is_read=False
        ).update(
            is_read=True,
            read_at=timezone.now()
        )
        
        return Response({
            'message': f'Marked {updated} notifications as read',
            'updated_count': updated
        })
