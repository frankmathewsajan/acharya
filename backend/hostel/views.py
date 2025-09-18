from django.shortcuts import render
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q, F
from .models import HostelBlock, HostelRoom, HostelBed, HostelAllocation, HostelComplaint, HostelLeaveRequest
from .serializers import (
    HostelBlockSerializer, RoomSerializer, HostelBedSerializer, 
    HostelAllocationSerializer, HostelComplaintSerializer, HostelLeaveRequestSerializer
)


class HostelBlockViewSet(viewsets.ModelViewSet):
    """ViewSet for hostel blocks"""
    queryset = HostelBlock.objects.all()
    serializer_class = HostelBlockSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by school for non-superusers
        if not self.request.user.is_superuser and hasattr(self.request.user, 'school'):
            queryset = queryset.filter(school=self.request.user.school)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
            
        return queryset.order_by('name')


class RoomViewSet(viewsets.ModelViewSet):
    """ViewSet for hostel rooms"""
    queryset = HostelRoom.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by room type
        room_type = self.request.query_params.get('type')
        if room_type:
            queryset = queryset.filter(room_type=room_type)
        
        # Filter by availability
        available = self.request.query_params.get('available')
        if available:
            if available.lower() == 'true':
                queryset = queryset.filter(current_occupancy__lt=F('capacity'))
        
        # Filter by block
        block_id = self.request.query_params.get('block')
        if block_id:
            queryset = queryset.filter(block_id=block_id)
            
        # Filter by floor
        floor = self.request.query_params.get('floor')
        if floor:
            queryset = queryset.filter(floor_number=floor)
        
        return queryset.order_by('room_number')


class HostelBedViewSet(viewsets.ModelViewSet):
    """ViewSet for hostel beds"""
    queryset = HostelBed.objects.all()
    serializer_class = HostelBedSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by room
        room_id = self.request.query_params.get('room')
        if room_id:
            queryset = queryset.filter(room_id=room_id)
        
        # Filter by availability
        available = self.request.query_params.get('available')
        if available:
            if available.lower() == 'true':
                queryset = queryset.filter(is_available=True, allocation__isnull=True)
        
        # Filter by bed type
        bed_type = self.request.query_params.get('bed_type')
        if bed_type:
            queryset = queryset.filter(bed_type=bed_type)
        
        return queryset.order_by('room__room_number', 'bed_number')


class HostelAllocationViewSet(viewsets.ModelViewSet):
    """ViewSet for hostel allocations"""
    queryset = HostelAllocation.objects.all()
    serializer_class = HostelAllocationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by student role
        if self.request.user.role == 'student':
            student_profile = getattr(self.request.user, 'student_profile', None)
            if student_profile:
                queryset = queryset.filter(student=student_profile)
        elif self.request.user.role == 'parent':
            parent_profile = getattr(self.request.user, 'parent_profile', None)
            if parent_profile:
                children_ids = parent_profile.children.values_list('id', flat=True)
                queryset = queryset.filter(student__id__in=children_ids)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.select_related('student__user', 'bed__room__block').order_by('-allocation_date')
    
    @action(detail=True, methods=['post'])
    def end_allocation(self, request, pk=None):
        """End an allocation"""
        allocation = self.get_object()
        vacation_date = request.data.get('vacation_date', timezone.now().date())
        
        if hasattr(request.user, 'staff_profile'):
            allocation.end_allocation(request.user.staff_profile, vacation_date)
            return Response({'message': 'Allocation ended successfully'})
        else:
            return Response({'error': 'Only staff can end allocations'}, status=status.HTTP_403_FORBIDDEN)


class HostelComplaintViewSet(viewsets.ModelViewSet):
    """ViewSet for hostel complaints"""
    queryset = HostelComplaint.objects.all()
    serializer_class = HostelComplaintSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by student role
        if self.request.user.role == 'student':
            student_profile = getattr(self.request.user, 'student_profile', None)
            if student_profile:
                queryset = queryset.filter(student=student_profile)
        elif self.request.user.role == 'parent':
            parent_profile = getattr(self.request.user, 'parent_profile', None)
            if parent_profile:
                children_ids = parent_profile.children.values_list('id', flat=True)
                queryset = queryset.filter(student__id__in=children_ids)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by priority
        priority = self.request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        
        return queryset.select_related('student__user', 'room__block').order_by('-submitted_date')
    
    def perform_create(self, serializer):
        """Set the student to current user's student profile"""
        if hasattr(self.request.user, 'student_profile'):
            serializer.save(student=self.request.user.student_profile)
        else:
            raise serializers.ValidationError("Only students can create complaints")
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign complaint to staff member"""
        complaint = self.get_object()
        staff_id = request.data.get('staff_id')
        
        if hasattr(request.user, 'staff_profile'):
            from users.models import StaffProfile
            staff = StaffProfile.objects.get(id=staff_id)
            complaint.assigned_to = staff
            complaint.status = 'in_progress'
            complaint.save()
            return Response({'message': 'Complaint assigned successfully'})
        else:
            return Response({'error': 'Only staff can assign complaints'}, status=status.HTTP_403_FORBIDDEN)
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Resolve a complaint"""
        complaint = self.get_object()
        resolution_notes = request.data.get('resolution_notes', '')
        
        if hasattr(request.user, 'staff_profile'):
            complaint.status = 'resolved'
            complaint.resolved_by = request.user.staff_profile
            complaint.resolved_date = timezone.now()
            complaint.resolution_notes = resolution_notes
            complaint.save()
            return Response({'message': 'Complaint resolved successfully'})
        else:
            return Response({'error': 'Only staff can resolve complaints'}, status=status.HTTP_403_FORBIDDEN)


class HostelLeaveRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for hostel leave requests"""
    queryset = HostelLeaveRequest.objects.all()
    serializer_class = HostelLeaveRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by student role
        if self.request.user.role == 'student':
            student_profile = getattr(self.request.user, 'student_profile', None)
            if student_profile:
                queryset = queryset.filter(student=student_profile)
        elif self.request.user.role == 'parent':
            parent_profile = getattr(self.request.user, 'parent_profile', None)
            if parent_profile:
                children_ids = parent_profile.children.values_list('id', flat=True)
                queryset = queryset.filter(student__id__in=children_ids)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by leave type
        leave_type = self.request.query_params.get('leave_type')
        if leave_type:
            queryset = queryset.filter(leave_type=leave_type)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(
                start_date__gte=start_date,
                end_date__lte=end_date
            )
        
        return queryset.select_related('student__user').order_by('-submitted_date')
    
    def perform_create(self, serializer):
        """Set the student to current user's student profile"""
        if hasattr(self.request.user, 'student_profile'):
            serializer.save(student=self.request.user.student_profile)
        else:
            raise serializers.ValidationError("Only students can create leave requests")
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a leave request"""
        leave_request = self.get_object()
        approval_notes = request.data.get('approval_notes', '')
        
        if hasattr(request.user, 'staff_profile'):
            leave_request.status = 'approved'
            leave_request.approved_by = request.user.staff_profile
            leave_request.decision_date = timezone.now()
            leave_request.approval_notes = approval_notes
            leave_request.save()
            return Response({'message': 'Leave request approved successfully'})
        else:
            return Response({'error': 'Only staff can approve leave requests'}, status=status.HTTP_403_FORBIDDEN)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a leave request"""
        leave_request = self.get_object()
        approval_notes = request.data.get('approval_notes', '')
        
        if hasattr(request.user, 'staff_profile'):
            leave_request.status = 'rejected'
            leave_request.rejected_by = request.user.staff_profile
            leave_request.decision_date = timezone.now()
            leave_request.approval_notes = approval_notes
            leave_request.save()
            return Response({'message': 'Leave request rejected'})
        else:
            return Response({'error': 'Only staff can reject leave requests'}, status=status.HTTP_403_FORBIDDEN)
    
    @action(detail=True, methods=['post'])
    def mark_returned(self, request, pk=None):
        """Mark student as returned from leave"""
        leave_request = self.get_object()
        actual_return_date = request.data.get('actual_return_date', timezone.now().date())
        
        if hasattr(request.user, 'staff_profile'):
            leave_request.actual_return_date = actual_return_date
            leave_request.save()
            return Response({'message': 'Return marked successfully'})
        else:
            return Response({'error': 'Only staff can mark returns'}, status=status.HTTP_403_FORBIDDEN)


class AllocateRoomAPIView(APIView):
    """Allocate a bed to a student"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            student_id = request.data.get('student_id')
            bed_id = request.data.get('bed_id')
            allocation_date = request.data.get('allocation_date', timezone.now().date())

            from users.models import StudentProfile
            student = StudentProfile.objects.get(id=student_id)
            bed = HostelBed.objects.get(id=bed_id)

            # Check if bed is available
            if not bed.is_available or hasattr(bed, 'allocation'):
                return Response({'error': 'Bed is not available'}, status=status.HTTP_400_BAD_REQUEST)

            # Check if student already has allocation
            existing_allocation = HostelAllocation.objects.filter(
                student=student, 
                status='active'
            ).first()
            
            if existing_allocation:
                return Response({'error': 'Student already has an active bed allocation'}, status=status.HTTP_400_BAD_REQUEST)

            # Create allocation
            allocation = HostelAllocation.objects.create(
                student=student,
                bed=bed,
                allocation_date=allocation_date,
                allocated_by=request.user.staff_profile if hasattr(request.user, 'staff_profile') else None
            )

            # Update room occupancy
            bed.room.update_occupancy()

            serializer = HostelAllocationSerializer(allocation)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class RoomChangeRequestAPIView(APIView):
    """Handle bed change requests"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            current_bed_id = request.data.get('current_bed_id')
            requested_bed_id = request.data.get('requested_bed_id')
            reason = request.data.get('reason', '')

            current_bed = HostelBed.objects.get(id=current_bed_id)
            requested_bed = HostelBed.objects.get(id=requested_bed_id)

            # Check if requested bed is available
            if not requested_bed.is_available or hasattr(requested_bed, 'allocation'):
                return Response({'error': 'Requested bed is not available'}, status=status.HTTP_400_BAD_REQUEST)

            # Create bed change request logic here
            # For now, return success message
            return Response({
                'message': f'Bed change request submitted from {current_bed.room.room_number}-{current_bed.bed_number} to {requested_bed.room.room_number}-{requested_bed.bed_number}',
                'status': 'pending',
                'reason': reason
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
