from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'list', views.SchoolViewSet)

urlpatterns = [
    path('public/', views.PublicSchoolListAPIView.as_view(), name='public-schools'),
    path('stats/', views.SchoolStatsAPIView.as_view(), name='school-stats'),
    path('dashboard/', views.SchoolDashboardAPIView.as_view(), name='school-dashboard'),
    path('', include(router.urls)),
]