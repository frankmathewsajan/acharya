from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
# New comprehensive library endpoints
router.register(r'books', views.LibraryBookViewSet, basename='library-book')
router.register(r'user-books', views.UserBookViewSet, basename='user-book')
router.register(r'transactions', views.LibraryTransactionViewSet, basename='library-transaction')
router.register(r'searches', views.SearchViewSet, basename='library-search')
router.register(r'book-requests', views.BookRequestViewSet, basename='book-request')

# Backward compatibility endpoints
router.register(r'legacy-books', views.BookViewSet, basename='book')
router.register(r'borrow-records', views.BookBorrowRecordViewSet, basename='borrow-record')

urlpatterns = [
    path('', include(router.urls)),
    
    # Additional convenience endpoints
    path('search/', views.LibraryBookViewSet.as_view({'get': 'search', 'post': 'search'}), name='book-search'),
    path('suggestions/', views.LibraryBookViewSet.as_view({'get': 'suggestions'}), name='book-suggestions'),
    path('borrowed/', views.UserBookViewSet.as_view({'get': 'borrowed'}), name='borrowed-books'),
    path('purchased/', views.UserBookViewSet.as_view({'get': 'purchased'}), name='purchased-books'),
    path('overdue/', views.UserBookViewSet.as_view({'get': 'overdue'}), name='overdue-books'),
    path('dashboard-stats/', views.UserBookViewSet.as_view({'get': 'dashboard_stats'}), name='library-dashboard-stats'),
    path('borrow/', views.UserBookViewSet.as_view({'post': 'borrow'}), name='borrow-book'),
    path('return/', views.UserBookViewSet.as_view({'post': 'return_book'}), name='return-book'),
    path('purchase/', views.UserBookViewSet.as_view({'post': 'purchase'}), name='purchase-book'),
    
    # Legacy alias routes for backward compatibility
    path('borrow-record/', views.BookBorrowRecordViewSet.as_view({'get': 'list', 'post': 'create'}), name='borrow-list'),
    path('borrow-record/<int:pk>/', views.BookBorrowRecordViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update'}), name='borrow-detail'),
]