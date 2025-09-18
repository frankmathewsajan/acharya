from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'notices', views.NoticeViewSet, basename='notice')
router.register(r'user-notifications', views.UserNotificationViewSet, basename='user-notification')

urlpatterns = [
    path('', include(router.urls)),
]