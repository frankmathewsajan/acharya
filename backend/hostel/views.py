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
        if not self.request.user.is_superuser:
            user_school = None
            if hasattr(self.request.user, 'staff_profile') and self.request.user.staff_profile.school:
                user_school = self.request.user.staff_profile.school
            elif hasattr(self.request.user, 'teacher_profile') and self.request.user.teacher_profile.school:
                user_school = self.request.user.teacher_profile.school
            elif hasattr(self.request.user, 'school'):
                user_school = self.request.user.school
                
            if user_school:
                queryset = queryset.filter(school=user_school)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
            
        return queryset.order_by('name')
    
    def perform_create(self, serializer):
        """Ensure block is created for the correct school"""
        school = None
        
        # Get school from user's profile
        if hasattr(self.request.user, 'staff_profile') and self.request.user.staff_profile.school:
            school = self.request.user.staff_profile.school
        elif hasattr(self.request.user, 'teacher_profile') and self.request.user.teacher_profile.school:
            school = self.request.user.teacher_profile.school
        elif hasattr(self.request.user, 'school'):
            school = self.request.user.school
        
        if not school and not self.request.user.is_superuser:
            raise serializers.ValidationError("Cannot determine school for this user")
            
        serializer.save(school=school)
    
    @action(detail=True, methods=['post'])
    def generate_rooms(self, request, pk=None):
        """Generate rooms for a block based on floor configuration"""
        block = self.get_object()
        floor_config = request.data.get('floor_config', [])
        
        if not floor_config:
            return Response(
                {'error': 'floor_config is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate floor_config
        if not isinstance(floor_config, list) or not all(isinstance(x, int) and x >= 0 for x in floor_config):
            return Response(
                {'error': 'floor_config must be a list of non-negative integers'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update block configuration
        block.floor_config = floor_config
        block.total_floors = len(floor_config)
        block.total_rooms = sum(floor_config)
        block.save()
        
        # Generate rooms
        block.generate_rooms()
        
        serializer = self.get_serializer(block)
        return Response(serializer.data)


class RoomViewSet(viewsets.ModelViewSet):
    """ViewSet for hostel rooms"""
    queryset = HostelRoom.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by school for non-superusers (through block relationship)
        if not self.request.user.is_superuser:
            user_school = None
            if hasattr(self.request.user, 'staff_profile') and self.request.user.staff_profile.school:
                user_school = self.request.user.staff_profile.school
            elif hasattr(self.request.user, 'teacher_profile') and self.request.user.teacher_profile.school:
                user_school = self.request.user.teacher_profile.school
            elif hasattr(self.request.user, 'school'):
                user_school = self.request.user.school
                
            if user_school:
                queryset = queryset.filter(block__school=user_school)
        
        # Filter by room type
        room_type = self.request.query_params.get('type')
        if room_type:
            queryset = queryset.filter(room_type=room_type)
        
        # Filter by AC type
        ac_type = self.request.query_params.get('ac_type')
        if ac_type:
            queryset = queryset.filter(ac_type=ac_type)
        
        # Filter by floor
        floor_number = self.request.query_params.get('floor')
        if floor_number is not None:
            queryset = queryset.filter(floor_number=floor_number)
        
        # Filter by block
        block_id = self.request.query_params.get('block')
        if block_id:
            queryset = queryset.filter(block_id=block_id)
        
        # Search functionality (Django admin style)
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(room_number__icontains=search) |
                Q(block__name__icontains=search) |
                Q(amenities__icontains=search) |
                Q(room_type__icontains=search) |
                Q(ac_type__icontains=search)
            )
        
        # Filter by availability status
        availability = self.request.query_params.get('availability')
        if availability == 'available':
            queryset = queryset.filter(is_available=True, current_occupancy__lt=F('capacity'))
        elif availability == 'occupied':
            queryset = queryset.filter(current_occupancy__gt=0)
        elif availability == 'full':
            queryset = queryset.filter(current_occupancy__gte=F('capacity'))
        elif availability == 'empty':
            queryset = queryset.filter(current_occupancy=0)
            
        return queryset.select_related('block').order_by('floor_number', 'room_number')
    
    @action(detail=False, methods=['get'])
    def room_type_choices(self, request):
        """Get available room type choices"""
        return Response({
            'room_types': [{'value': choice[0], 'label': choice[1]} for choice in HostelRoom.ROOM_TYPES],
            'ac_types': [{'value': choice[0], 'label': choice[1]} for choice in HostelRoom.AC_TYPES]
        })
    
    @action(detail=False, methods=['get'])
    def available_for_booking(self, request):
        """Get rooms available for student booking"""
        available_rooms = self.get_queryset().filter(
            current_occupancy__lt=F('capacity'),
            is_available=True
        ).select_related('block')
        
        # Group by room type and AC type for better display
        room_data = {}
        for room in available_rooms:
            key = f"{room.room_type}_{room.ac_type}"
            if key not in room_data:
                room_data[key] = {
                    'room_type': room.room_type,
                    'room_type_display': room.room_type_display,
                    'ac_type': room.ac_type,
                    'ac_type_display': room.ac_type_display,
                    'annual_fee': room.current_annual_fee,
                    'available_rooms': []
                }
            
            available_beds = room.capacity - room.current_occupancy
            room_data[key]['available_rooms'].append({
                'id': room.id,
                'room_number': room.room_number,
                'block_name': room.block_name,
                'floor_display': room.floor_display,
                'available_beds': available_beds,
                'capacity': room.capacity,
                'amenities': room.amenities
            })
        
        return Response(list(room_data.values()))
    
    @action(detail=False, methods=['get'])
    def filter_options(self, request):
        """Get available filter options for rooms"""
        queryset = self.get_queryset()
        
        blocks = queryset.values_list('block__id', 'block__name').distinct()
        floors = queryset.values_list('floor_number', flat=True).distinct().order_by('floor_number')
        
        return Response({
            'blocks': [{'id': block[0], 'name': block[1]} for block in blocks],
            'floors': list(floors),
            'room_types': [{'value': choice[0], 'label': choice[1]} for choice in HostelRoom.ROOM_TYPES],
            'ac_types': [{'value': choice[0], 'label': choice[1]} for choice in HostelRoom.AC_TYPES]
        })
    
    @action(detail=False, methods=['post'])
    def mass_update(self, request):
        """Mass update rooms based on filters"""
        room_ids = request.data.get('room_ids', [])
        update_data = request.data.get('update_data', {})
        
        if not room_ids:
            return Response({'error': 'No rooms selected for update'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not update_data:
            return Response({'error': 'No update data provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Filter rooms by user's school access
        queryset = self.get_queryset().filter(id__in=room_ids)
        
        if not queryset.exists():
            return Response({'error': 'No accessible rooms found'}, status=status.HTTP_404_NOT_FOUND)
        
        updated_count = 0
        errors = []
        
        for room in queryset:
            try:
                # Update allowed fields
                for field, value in update_data.items():
                    if field in ['room_type', 'ac_type', 'capacity', 'amenities', 'is_available']:
                        setattr(room, field, value)
                
                room.save()
                updated_count += 1
            except Exception as e:
                errors.append(f"Room {room.room_number}: {str(e)}")
        
        response_data = {'updated_count': updated_count}
        if errors:
            response_data['errors'] = errors
        
        return Response(response_data)
    
    @action(detail=False, methods=['post'])
    def mass_update_by_criteria(self, request):
        """Mass update rooms by filter criteria (e.g., floors, blocks)"""
        filters = request.data.get('filters', {})
        update_data = request.data.get('update_data', {})
        
        if not update_data:
            return Response({'error': 'No update data provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Start with user's accessible rooms
        queryset = self.get_queryset()
        
        # Apply filters
        if 'block_ids' in filters:
            queryset = queryset.filter(block__id__in=filters['block_ids'])
        
        if 'floor_numbers' in filters:
            queryset = queryset.filter(floor_number__in=filters['floor_numbers'])
        
        if 'room_type' in filters:
            queryset = queryset.filter(room_type=filters['room_type'])
        
        if 'ac_type' in filters:
            queryset = queryset.filter(ac_type=filters['ac_type'])
        
        if not queryset.exists():
            return Response({'error': 'No rooms match the criteria'}, status=status.HTTP_404_NOT_FOUND)
        
        updated_count = 0
        errors = []
        
        for room in queryset:
            try:
                # Update allowed fields
                for field, value in update_data.items():
                    if field in ['room_type', 'ac_type', 'capacity', 'amenities', 'is_available']:
                        setattr(room, field, value)
                
                room.save()
                updated_count += 1
            except Exception as e:
                errors.append(f"Room {room.room_number}: {str(e)}")
        
        response_data = {
            'updated_count': updated_count,
            'total_matched': queryset.count()
        }
        if errors:
            response_data['errors'] = errors
        
        return Response(response_data)


class HostelBedViewSet(viewsets.ModelViewSet):
    """ViewSet for hostel beds"""
    queryset = HostelBed.objects.all()
    serializer_class = HostelBedSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by school for non-superusers (through room->block relationship)
        if not self.request.user.is_superuser:
            user_school = None
            if hasattr(self.request.user, 'staff_profile') and self.request.user.staff_profile.school:
                user_school = self.request.user.staff_profile.school
            elif hasattr(self.request.user, 'teacher_profile') and self.request.user.teacher_profile.school:
                user_school = self.request.user.teacher_profile.school
            elif hasattr(self.request.user, 'school'):
                user_school = self.request.user.school
                
            if user_school:
                queryset = queryset.filter(room__block__school=user_school)
        
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
    
    @action(detail=False, methods=['post'])
    def generate_beds(self, request):
        """Generate beds for a room"""
        room_id = request.data.get('room_id')
        bed_count = request.data.get('bed_count')
        bed_type = request.data.get('bed_type', 'single')
        
        if not room_id or not bed_count:
            return Response({'error': 'Room ID and bed count are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            room = HostelRoom.objects.get(id=room_id)
            
            # Check school access
            if not self.request.user.is_superuser:
                user_school = None
                if hasattr(self.request.user, 'staff_profile') and self.request.user.staff_profile.school:
                    user_school = self.request.user.staff_profile.school
                elif hasattr(self.request.user, 'teacher_profile') and self.request.user.teacher_profile.school:
                    user_school = self.request.user.teacher_profile.school
                elif hasattr(self.request.user, 'school'):
                    user_school = self.request.user.school
                    
                if user_school and room.block.school != user_school:
                    return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            
        except HostelRoom.DoesNotExist:
            return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Clear existing beds
        room.hostelbed_set.all().delete()
        
        # Generate new beds
        beds_created = 0
        for i in range(1, int(bed_count) + 1):
            HostelBed.objects.create(
                room=room,
                bed_number=f"B{i:02d}",
                bed_type=bed_type,
                is_available=True
            )
            beds_created += 1
        
        # Update room capacity
        room.capacity = beds_created
        room.save()
        
        return Response({
            'message': f'{beds_created} beds generated successfully',
            'beds_created': beds_created
        })
    
    @action(detail=False, methods=['post'])
    def mass_update_beds(self, request):
        """Mass update beds for multiple rooms"""
        room_ids = request.data.get('room_ids', [])
        bed_count = request.data.get('bed_count')
        bed_type = request.data.get('bed_type', 'single')
        
        if not room_ids or not bed_count:
            return Response({'error': 'Room IDs and bed count are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Filter rooms by user's school access
        rooms_queryset = HostelRoom.objects.filter(id__in=room_ids)
        
        if not self.request.user.is_superuser:
            user_school = None
            if hasattr(self.request.user, 'staff_profile') and self.request.user.staff_profile.school:
                user_school = self.request.user.staff_profile.school
            elif hasattr(self.request.user, 'teacher_profile') and self.request.user.teacher_profile.school:
                user_school = self.request.user.teacher_profile.school
            elif hasattr(self.request.user, 'school'):
                user_school = self.request.user.school
                
            if user_school:
                rooms_queryset = rooms_queryset.filter(block__school=user_school)
        
        if not rooms_queryset.exists():
            return Response({'error': 'No accessible rooms found'}, status=status.HTTP_404_NOT_FOUND)
        
        updated_rooms = 0
        total_beds_created = 0
        
        for room in rooms_queryset:
            # Clear existing beds
            room.hostelbed_set.all().delete()
            
            # Generate new beds
            beds_created = 0
            for i in range(1, int(bed_count) + 1):
                HostelBed.objects.create(
                    room=room,
                    bed_number=f"B{i:02d}",
                    bed_type=bed_type,
                    is_available=True
                )
                beds_created += 1
            
            # Update room capacity
            room.capacity = beds_created
            room.save()
            
            updated_rooms += 1
            total_beds_created += beds_created
        
        return Response({
            'message': f'Updated {updated_rooms} rooms with {total_beds_created} total beds',
            'updated_rooms': updated_rooms,
            'total_beds_created': total_beds_created
        })


class HostelAllocationViewSet(viewsets.ModelViewSet):
    """ViewSet for hostel allocations"""
    queryset = HostelAllocation.objects.all()
    serializer_class = HostelAllocationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by school for non-superusers (through bed->room->block relationship)
        if not self.request.user.is_superuser:
            user_school = None
            if hasattr(self.request.user, 'staff_profile') and self.request.user.staff_profile.school:
                user_school = self.request.user.staff_profile.school
            elif hasattr(self.request.user, 'teacher_profile') and self.request.user.teacher_profile.school:
                user_school = self.request.user.teacher_profile.school
            elif hasattr(self.request.user, 'student_profile') and self.request.user.student_profile.school:
                user_school = self.request.user.student_profile.school
            elif hasattr(self.request.user, 'school'):
                user_school = self.request.user.school
                
            if user_school:
                queryset = queryset.filter(bed__room__block__school=user_school)
        
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
    
    @action(detail=False, methods=['post'])
    def book_room(self, request):
        """Student booking for hostel room"""
        from fees.models import FeeInvoice, FeeType
        
        # Only students can book rooms
        if request.user.role != 'student':
            return Response({'error': 'Only students can book hostel rooms'}, status=status.HTTP_403_FORBIDDEN)
        
        student_profile = getattr(request.user, 'student_profile', None)
        if not student_profile:
            return Response({'error': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if student already has an active allocation
        existing_allocation = HostelAllocation.objects.filter(
            student=student_profile, 
            status='active'
        ).first()
        
        if existing_allocation:
            return Response({'error': 'You already have an active hostel allocation'}, status=status.HTTP_400_BAD_REQUEST)
        
        room_id = request.data.get('room_id')
        if not room_id:
            return Response({'error': 'Room ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            room = HostelRoom.objects.get(id=room_id)
        except HostelRoom.DoesNotExist:
            return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if room has available beds
        available_beds = room.hostelbed_set.filter(allocation__isnull=True, is_available=True)
        if not available_beds.exists():
            return Response({'error': 'No available beds in this room'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get the first available bed
        bed = available_beds.first()
        
        # Create the allocation
        allocation = HostelAllocation.objects.create(
            student=student_profile,
            bed=bed,
            allocation_date=timezone.now().date(),
            status='pending',  # Pending until payment is confirmed
            fee_amount=room.current_annual_fee
        )
        
        # Create a fee invoice for hostel payment
        fee_type, _ = FeeType.objects.get_or_create(
            name='Hostel Fee',
            defaults={'description': 'Annual hostel accommodation fee'}
        )
        
        fee_invoice = FeeInvoice.objects.create(
            student=student_profile,
            fee_type=fee_type,
            amount=room.current_annual_fee,
            due_date=timezone.now().date() + timezone.timedelta(days=30),
            academic_year=timezone.now().year,
            description=f'Hostel Fee - {room.block_name} Room {room.room_number} ({room.ac_type_display})',
            status='pending'
        )
        
        return Response({
            'message': 'Room booked successfully. Please complete payment to confirm allocation.',
            'allocation_id': allocation.id,
            'invoice_id': fee_invoice.id,
            'amount': room.current_annual_fee,
            'room_details': {
                'room_number': room.room_number,
                'block_name': room.block_name,
                'room_type': room.room_type_display,
                'ac_type': room.ac_type_display,
                'bed_number': bed.bed_number
            }
        })
    
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
