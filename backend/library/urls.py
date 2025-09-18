from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'books', views.BookViewSet, basename='book')
router.register(r'borrow-records', views.BookBorrowRecordViewSet, basename='borrow-record')

urlpatterns = [
    path('', include(router.urls)),
    # Add alias routes for frontend compatibility
    path('borrow/', views.BookBorrowRecordViewSet.as_view({'get': 'list', 'post': 'create'}), name='borrow-list'),
    path('borrow/<int:pk>/', views.BookBorrowRecordViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update'}), name='borrow-detail'),
    path('borrow/<int:pk>/return/', views.BookBorrowRecordViewSet.as_view({'post': 'return_book'}), name='borrow-return'),
]