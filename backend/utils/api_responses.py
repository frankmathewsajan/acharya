"""
Standardized API response utilities for consistent responses across all endpoints
"""
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone


class StandardPagination(PageNumberPagination):
    """Standard pagination class for all list endpoints"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


def success_response(data=None, message="Success", status_code=status.HTTP_200_OK, extra_data=None):
    """
    Standardized success response format
    
    Args:
        data: The main response data
        message: Success message
        status_code: HTTP status code
        extra_data: Additional metadata
    
    Returns:
        Response object with standardized format
    """
    response_data = {
        "success": True,
        "message": message,
        "timestamp": timezone.now().isoformat(),
        "data": data
    }
    
    if extra_data:
        response_data.update(extra_data)
    
    return Response(response_data, status=status_code)


def error_response(message="An error occurred", errors=None, status_code=status.HTTP_400_BAD_REQUEST, extra_data=None):
    """
    Standardized error response format
    
    Args:
        message: Error message
        errors: Detailed error information (dict or list)
        status_code: HTTP status code
        extra_data: Additional metadata
    
    Returns:
        Response object with standardized error format
    """
    response_data = {
        "success": False,
        "message": message,
        "timestamp": timezone.now().isoformat(),
        "errors": errors or {}
    }
    
    if extra_data:
        response_data.update(extra_data)
    
    return Response(response_data, status=status_code)


def paginated_response(queryset, serializer_class, request, message="Data retrieved successfully", extra_data=None):
    """
    Standardized paginated response format
    
    Args:
        queryset: Django queryset to paginate
        serializer_class: Serializer class for the data
        request: HTTP request object
        message: Success message
        extra_data: Additional metadata
    
    Returns:
        Response object with standardized paginated format
    """
    paginator = StandardPagination()
    page = paginator.paginate_queryset(queryset, request)
    
    if page is not None:
        serializer = serializer_class(page, many=True)
        
        response_data = {
            "success": True,
            "message": message,
            "timestamp": timezone.now().isoformat(),
            "data": {
                "results": serializer.data,
                "pagination": {
                    "count": paginator.page.paginator.count,
                    "next": paginator.get_next_link(),
                    "previous": paginator.get_previous_link(),
                    "page_size": paginator.page_size,
                    "total_pages": paginator.page.paginator.num_pages,
                    "current_page": paginator.page.number
                }
            }
        }
        
        if extra_data:
            response_data.update(extra_data)
        
        return Response(response_data)
    
    # Fallback if pagination fails
    serializer = serializer_class(queryset, many=True)
    return success_response(
        data={"results": serializer.data},
        message=message,
        extra_data=extra_data
    )


def validation_error_response(serializer_errors, message="Validation failed"):
    """
    Standardized validation error response format
    
    Args:
        serializer_errors: Django REST Framework serializer errors
        message: Error message
    
    Returns:
        Response object with standardized validation error format
    """
    return error_response(
        message=message,
        errors=serializer_errors,
        status_code=status.HTTP_400_BAD_REQUEST
    )


def not_found_response(message="Resource not found"):
    """
    Standardized 404 response format
    
    Args:
        message: Error message
    
    Returns:
        Response object with standardized 404 format
    """
    return error_response(
        message=message,
        status_code=status.HTTP_404_NOT_FOUND
    )


def permission_denied_response(message="Permission denied"):
    """
    Standardized 403 response format
    
    Args:
        message: Error message
    
    Returns:
        Response object with standardized 403 format
    """
    return error_response(
        message=message,
        status_code=status.HTTP_403_FORBIDDEN
    )


def unauthorized_response(message="Authentication required"):
    """
    Standardized 401 response format
    
    Args:
        message: Error message
    
    Returns:
        Response object with standardized 401 format
    """
    return error_response(
        message=message,
        status_code=status.HTTP_401_UNAUTHORIZED
    )