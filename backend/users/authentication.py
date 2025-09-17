"""
Custom authentication backends for the Acharya ERP system.
Supports both JWT authentication for regular users and session-based authentication for parents.
"""

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.core.cache import cache
from users.models import ParentProfile
import time


class ParentSessionAuthentication(BaseAuthentication):
    """
    Custom authentication for parent users using session tokens stored in cache.
    Parents authenticate via OTP and receive a session token that's stored in Redis cache.
    """
    
    def authenticate(self, request):
        """
        Authenticate parent using session token from Authorization header.
        Returns (parent, None) if successful, None if not applicable.
        """
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header.startswith('Bearer '):
            return None
            
        token = auth_header.replace('Bearer ', '')
        
        # Check if this token is a parent session token
        session_data = cache.get(f"parent_session_{token}")
        
        if not session_data:
            # This might be a JWT token, let other authenticators handle it
            return None
            
        # Check if session is still valid
        if session_data['expires_at'] < int(time.time()):
            cache.delete(f"parent_session_{token}")
            raise AuthenticationFailed('Session expired')
            
        # Get parent
        try:
            parent = ParentProfile.objects.select_related('student', 'student__school').get(
                id=session_data['parent_id']
            )
            # Return parent as user (DRF expects a user object)
            # We'll create a pseudo-user object for parent
            return (parent, None)
        except ParentProfile.DoesNotExist:
            raise AuthenticationFailed('Parent not found')


class CombinedAuthentication(JWTAuthentication):
    """
    Combined authentication that tries JWT first, then falls back to parent session auth.
    """
    
    def authenticate(self, request):
        """
        Try JWT authentication first, then parent session authentication.
        """
        # First try JWT authentication
        try:
            result = super().authenticate(request)
            if result is not None:
                return result
        except AuthenticationFailed:
            # JWT failed, try parent authentication
            pass
            
        # Try parent session authentication
        parent_auth = ParentSessionAuthentication()
        return parent_auth.authenticate(request)