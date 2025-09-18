from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'blocks', views.HostelBlockViewSet, basename='block')
router.register(r'rooms', views.RoomViewSet, basename='room')
router.register(r'beds', views.HostelBedViewSet, basename='bed')
router.register(r'allocations', views.HostelAllocationViewSet, basename='allocation')
router.register(r'complaints', views.HostelComplaintViewSet, basename='complaint')
router.register(r'leave-requests', views.HostelLeaveRequestViewSet, basename='leave-request')

urlpatterns = [
    path('', include(router.urls)),
    path('allocate/', views.AllocateRoomAPIView.as_view(), name='allocate-bed'),
    path('bed-change-request/', views.RoomChangeRequestAPIView.as_view(), name='bed-change-request'),
]