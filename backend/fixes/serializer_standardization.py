# Standardized API Response Format
# utils/serializers.py - Create consistent serializer patterns

from rest_framework import serializers
from rest_framework.response import Response
from rest_framework import status

class StandardResponseSerializer(serializers.Serializer):
    """Standard response format for all API endpoints"""
    success = serializers.BooleanField()
    message = serializers.CharField()
    timestamp = serializers.DateTimeField()
    data = serializers.JSONField(required=False)
    errors = serializers.JSONField(required=False)

def standardize_response(data=None, message="Success", success=True, status_code=status.HTTP_200_OK, errors=None):
    """Create standardized API response"""
    from django.utils import timezone
    
    response_data = {
        "success": success,
        "message": message,
        "timestamp": timezone.now().isoformat(),
    }
    
    if data is not None:
        response_data["data"] = data
        
    if errors:
        response_data["errors"] = errors
        
    return Response(response_data, status=status_code)

# Improved Serializer Base Classes
class BaseModelSerializer(serializers.ModelSerializer):
    """Base serializer with consistent patterns"""
    
    def validate(self, attrs):
        """Common validation patterns"""
        attrs = super().validate(attrs)
        
        # Add common validation logic here
        return attrs
    
    def to_representation(self, instance):
        """Standardize representation format"""
        data = super().to_representation(instance)
        
        # Convert datetime fields to consistent format
        for field_name, field in self.fields.items():
            if isinstance(field, serializers.DateTimeField) and field_name in data:
                if data[field_name]:
                    data[field_name] = field.to_representation(getattr(instance, field_name))
        
        return data

# User Serializer Improvements
class UserSerializer(BaseModelSerializer):
    """Improved User serializer with consistent fields"""
    full_name = serializers.SerializerMethodField()
    school_info = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'role', 'phone_number', 'is_active', 'created_at', 'school_info'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()
    
    def get_school_info(self, obj):
        if obj.school:
            return {
                'id': obj.school.id,
                'name': obj.school.school_name,
                'code': obj.school.school_code
            }
        return None

# Consistent Error Handling
class ValidationErrorSerializer(serializers.Serializer):
    """Serializer for validation errors"""
    field = serializers.CharField()
    message = serializers.CharField()
    code = serializers.CharField(required=False)

def format_validation_errors(serializer_errors):
    """Convert DRF validation errors to consistent format"""
    formatted_errors = []
    
    for field, messages in serializer_errors.items():
        if isinstance(messages, list):
            for message in messages:
                formatted_errors.append({
                    'field': field,
                    'message': str(message),
                    'code': getattr(message, 'code', 'invalid')
                })
        else:
            formatted_errors.append({
                'field': field,
                'message': str(messages),
                'code': 'invalid'
            })
    
    return formatted_errors