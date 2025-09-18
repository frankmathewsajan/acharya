from rest_framework import serializers
from .models import Notice, UserNotification
from users.serializers import UserSerializer


class NoticeSerializer(serializers.ModelSerializer):
    """Serializer for Notice model"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Notice
        fields = '__all__'
        read_only_fields = ['created_at']


class UserNotificationSerializer(serializers.ModelSerializer):
    """Serializer for UserNotification model"""
    notice_title = serializers.CharField(source='notice.title', read_only=True)
    notice_content = serializers.CharField(source='notice.content', read_only=True)
    notice_priority = serializers.CharField(source='notice.priority', read_only=True)
    notice_publish_date = serializers.DateTimeField(source='notice.publish_date', read_only=True)
    
    class Meta:
        model = UserNotification
        fields = '__all__'
        read_only_fields = ['user', 'notice']


class UserNotificationDetailSerializer(UserNotificationSerializer):
    """Detailed serializer for UserNotification with nested relationships"""
    notice = NoticeSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    
    class Meta(UserNotificationSerializer.Meta):
        fields = '__all__'