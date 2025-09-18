from django.urls import path
from . import views

urlpatterns = [
    path('stats/', views.DashboardStatsAPIView.as_view(), name='dashboard-stats'),
    path('admin/', views.AdminDashboardAPIView.as_view(), name='admin-dashboard'),
    path('student/<int:student_id>/', views.StudentDashboardAPIView.as_view(), name='student-dashboard'),
    path('parent/<int:parent_id>/', views.ParentDashboardAPIView.as_view(), name='parent-dashboard'),
    path('faculty/<int:faculty_id>/', views.FacultyDashboardAPIView.as_view(), name='faculty-dashboard'),
    path('warden/', views.WardenDashboardAPIView.as_view(), name='warden-dashboard'),
]