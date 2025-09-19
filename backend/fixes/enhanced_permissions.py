# Enhanced Permission System
# utils/permissions.py - Comprehensive role-based permissions

from rest_framework.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied

class IsAuthenticatedUser(BasePermission):
    """Base permission - user must be authenticated"""
    
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

class IsStudentUser(BasePermission):
    """Permission for student-only access"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'student'
        )

class IsParentUser(BasePermission):
    """Permission for parent-only access"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'parent'
        )

class IsStaffUser(BasePermission):
    """Permission for staff members (faculty, admin, warden, librarian)"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['faculty', 'admin', 'warden', 'librarian']
        )

class IsAdminUser(BasePermission):
    """Permission for admin users only"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'admin'
        )

class IsFacultyUser(BasePermission):
    """Permission for faculty users"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'faculty'
        )

class IsWardenUser(BasePermission):
    """Permission for warden users"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'warden'
        )

class IsSameSchoolUser(BasePermission):
    """Permission that checks if user belongs to the same school as the resource"""
    
    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
            
        # Get school from object (handle different object types)
        obj_school = None
        if hasattr(obj, 'school'):
            obj_school = obj.school
        elif hasattr(obj, 'student') and hasattr(obj.student, 'school'):
            obj_school = obj.student.school
        elif hasattr(obj, 'user') and hasattr(obj.user, 'school'):
            obj_school = obj.user.school
            
        return obj_school == request.user.school

class CanAccessStudentData(BasePermission):
    """Permission for accessing student-specific data"""
    
    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
            
        # Admin and staff can access all student data in their school
        if request.user.role in ['admin', 'faculty', 'warden', 'librarian']:
            return request.user.school == obj.school
            
        # Students can only access their own data
        if request.user.role == 'student':
            return hasattr(request.user, 'student_profile') and request.user.student_profile == obj
            
        # Parents can access their children's data
        if request.user.role == 'parent':
            # This would need to be implemented based on parent-student relationship
            pass
            
        return False

# ViewSet Mixins for consistent permission handling
class SchoolFilterMixin:
    """Mixin to filter querysets by user's school"""
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        if self.request.user.is_superuser:
            return queryset
            
        # Filter by user's school
        if hasattr(self.request.user, 'school') and self.request.user.school:
            # Handle different model structures
            if hasattr(queryset.model, 'school'):
                return queryset.filter(school=self.request.user.school)
            elif hasattr(queryset.model, 'student') and hasattr(queryset.model.student.field.related_model, 'school'):
                return queryset.filter(student__school=self.request.user.school)
                
        return queryset.none()

class RoleBasedFilterMixin:
    """Mixin to filter querysets based on user role"""
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.is_superuser:
            return queryset
            
        if user.role == 'student':
            return self.filter_for_student(queryset, user)
        elif user.role == 'parent':
            return self.filter_for_parent(queryset, user)
        elif user.role in ['faculty', 'admin', 'warden', 'librarian']:
            return self.filter_for_staff(queryset, user)
            
        return queryset.none()
    
    def filter_for_student(self, queryset, user):
        """Filter queryset for student users"""
        if hasattr(user, 'student_profile'):
            return queryset.filter(student=user.student_profile)
        return queryset.none()
    
    def filter_for_parent(self, queryset, user):
        """Filter queryset for parent users"""
        # Implementation depends on parent-student relationship model
        return queryset.none()
    
    def filter_for_staff(self, queryset, user):
        """Filter queryset for staff users"""
        # Staff can see all data in their school
        if user.school:
            return queryset.filter(school=user.school)
        return queryset.none()

# Decorator for role-based access
def require_roles(*roles):
    """Decorator to require specific roles for view access"""
    def decorator(view_func):
        def wrapper(request, *args, **kwargs):
            if not (request.user and request.user.is_authenticated):
                raise PermissionDenied("Authentication required")
                
            if request.user.role not in roles:
                raise PermissionDenied(f"Access denied. Required roles: {', '.join(roles)}")
                
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator