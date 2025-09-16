from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'books', views.BookViewSet, basename='book')
router.register(r'borrow-records', views.BookBorrowRecordViewSet, basename='borrow-record')

urlpatterns = [
    path('', include(router.urls)),
]