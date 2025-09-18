from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'students', views.StudentProfileViewSet)
router.register(r'parents', views.ParentProfileViewSet)
router.register(r'staff', views.StaffProfileViewSet)

urlpatterns = [
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/me/', views.current_user_view, name='current_user'),
    
    # Parent authentication endpoints
    path('auth/parent/request-otp/', views.parent_request_otp, name='parent_request_otp'),
    path('auth/parent/verify-otp/', views.parent_verify_otp, name='parent_verify_otp'),
    path('auth/parent/logout/', views.parent_logout, name='parent_logout'),
    
    # Parent dashboard endpoints
    path('parent/dashboard/', views.parent_dashboard_overview, name='parent_dashboard_overview'),
    path('parent/attendance/', views.parent_student_attendance, name='parent_student_attendance'),
    path('parent/results/', views.parent_student_results, name='parent_student_results'),
    path('parent/fees/', views.parent_student_fees, name='parent_student_fees'),
    path('parent/notices/', views.parent_notices, name='parent_notices'),
    
    # Legacy parent endpoints (for backward compatibility)
    path('auth/parent/request-otp-legacy/', views.parent_request_otp_legacy, name='parent_request_otp_legacy'),
    path('auth/parent/verify-otp-legacy/', views.parent_verify_otp_legacy, name='parent_verify_otp_legacy'),
    
    path('', include(router.urls)),
]