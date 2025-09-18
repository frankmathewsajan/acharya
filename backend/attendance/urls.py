from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'sessions', views.ClassSessionViewSet)
router.register(r'records', views.AttendanceRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
]