from rest_framework import serializers
from .models import HostelBlock, HostelRoom, HostelBed, HostelAllocation, HostelComplaint, HostelLeaveRequest


class HostelBlockSerializer(serializers.ModelSerializer):
    """Serializer for hostel blocks"""
    warden_name = serializers.CharField(source='warden.user.full_name', read_only=True)
    school_name = serializers.CharField(source='school.school_name', read_only=True)
    
    class Meta:
        model = HostelBlock
        fields = [
            'id', 'name', 'description', 'warden', 'warden_name', 'total_rooms', 
            'total_beds', 'total_floors', 'floor_config', 'is_active', 'school', 'school_name'
        ]
    
    def create(self, validated_data):
        """Create block and generate rooms if floor_config is provided"""
        instance = super().create(validated_data)
        if instance.floor_config:
            instance.generate_rooms()
        return instance


class RoomSerializer(serializers.ModelSerializer):
    """Serializer for hostel rooms"""
    block_name = serializers.CharField(source='block.name', read_only=True)
    school_name = serializers.CharField(source='block.school.school_name', read_only=True)
    availability_status = serializers.SerializerMethodField()
    floor_display = serializers.CharField(read_only=True)
    room_type_display = serializers.CharField(read_only=True)
    ac_type_display = serializers.CharField(read_only=True)
    current_annual_fee = serializers.CharField(read_only=True)
    
    class Meta:
        model = HostelRoom
        fields = [
            'id', 'room_number', 'room_type', 'room_type_display', 'ac_type', 'ac_type_display',
            'capacity', 'current_occupancy', 'is_available', 'floor_number', 'floor_display',
            'amenities', 'block', 'block_name', 'school_name', 'availability_status',
            'annual_fee_non_ac', 'annual_fee_ac', 'current_annual_fee'
        ]
    
    def get_availability_status(self, obj):
        if obj.current_occupancy >= obj.capacity:
            return 'full'
        elif obj.current_occupancy > 0:
            return 'partial'
        else:
            return 'empty'


class HostelBedSerializer(serializers.ModelSerializer):
    """Serializer for hostel beds"""
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    block_name = serializers.CharField(source='room.block.name', read_only=True)
    is_occupied = serializers.SerializerMethodField()
    
    class Meta:
        model = HostelBed
        fields = [
            'id', 'bed_number', 'bed_type', 'is_available', 'maintenance_status',
            'room', 'room_number', 'block_name', 'is_occupied'
        ]
    
    def get_is_occupied(self, obj):
        return obj.is_occupied()


class HostelAllocationSerializer(serializers.ModelSerializer):
    """Serializer for hostel allocations"""
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)
    student_email = serializers.CharField(source='student.user.email', read_only=True)
    bed_number = serializers.CharField(source='bed.bed_number', read_only=True)
    room_number = serializers.CharField(source='bed.room.room_number', read_only=True)
    block_name = serializers.CharField(source='bed.room.block.name', read_only=True)
    allocated_by_name = serializers.CharField(source='allocated_by.user.full_name', read_only=True)
    
    class Meta:
        model = HostelAllocation
        fields = [
            'id', 'student', 'student_name', 'student_email',
            'bed', 'bed_number', 'room_number', 'block_name',
            'allocation_date', 'vacation_date', 'status',
            'allocated_by', 'allocated_by_name', 'payment', 'hostel_fee_amount'
        ]


class HostelComplaintSerializer(serializers.ModelSerializer):
    """Serializer for hostel complaints"""
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    block_name = serializers.CharField(source='room.block.name', read_only=True)
    resolved_by_name = serializers.CharField(source='resolved_by.user.full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.user.full_name', read_only=True)
    student = serializers.IntegerField(required=False, write_only=True)  # Optional since view handles it
    room = serializers.IntegerField(required=False, write_only=True)  # Optional since view handles it
    
    class Meta:
        model = HostelComplaint
        fields = [
            'id', 'student', 'student_name', 'room', 'room_number', 'block_name',
            'title', 'description', 'category', 'priority', 'status',
            'submitted_date', 'resolved_date', 'resolved_by', 'resolved_by_name',
            'assigned_to', 'assigned_to_name', 'resolution_notes', 'attachment_url'
        ]


class HostelLeaveRequestSerializer(serializers.ModelSerializer):
    """Serializer for hostel leave requests"""
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.user.full_name', read_only=True)
    rejected_by_name = serializers.CharField(source='rejected_by.user.full_name', read_only=True)
    student = serializers.IntegerField(required=False, write_only=True)  # Optional since view handles it
    
    class Meta:
        model = HostelLeaveRequest
        fields = [
            'id', 'student', 'student_name', 'leave_type',
            'start_date', 'end_date', 'expected_return_date', 'actual_return_date',
            'reason', 'emergency_contact', 'destination', 'status',
            'approved_by', 'approved_by_name', 'rejected_by', 'rejected_by_name',
            'approval_notes', 'submitted_date', 'decision_date'
        ]