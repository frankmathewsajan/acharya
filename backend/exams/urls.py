from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'exams', views.ExamViewSet, basename='exam')
router.register(r'results', views.ExamResultViewSet, basename='exam-result')

urlpatterns = [
    path('', include(router.urls)),
]