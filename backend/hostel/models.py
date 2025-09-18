from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError

class HostelBlock(models.Model):
    """Model for hostel blocks (equivalent to Buildings in spec)"""
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    warden = models.ForeignKey('users.StaffProfile', on_delete=models.SET_NULL, null=True)
    total_rooms = models.IntegerField()
    total_beds = models.IntegerField(default=0)  # Auto-calculated from rooms
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    class Meta:
        unique_together = ['school', 'name']
        indexes = [
            models.Index(fields=['school', 'name']),
            models.Index(fields=['school', 'is_active']),
        ]
    
    def __str__(self):
        school_name = self.school.school_name if self.school else "No School"
        return f"{self.name} [{school_name}]"
    
    def get_occupancy_rate(self):
        """Calculate occupancy percentage"""
        if self.total_beds == 0:
            return 0
        occupied_beds = self.hostelbed_set.filter(allocation__status='active').count()
        return (occupied_beds / self.total_beds) * 100


class HostelRoom(models.Model):
    """Model for hostel rooms"""
    
    ROOM_TYPES = [
        ('single', 'Single'),
        ('double', 'Double'),
        ('triple', 'Triple'),
        ('quad', 'Quad'),
    ]
    
    block = models.ForeignKey(HostelBlock, on_delete=models.CASCADE)
    room_number = models.CharField(max_length=10)
    room_type = models.CharField(max_length=10, choices=ROOM_TYPES)
    capacity = models.IntegerField()  # Number of beds in this room
    current_occupancy = models.IntegerField(default=0)  # Auto-calculated
    is_available = models.BooleanField(default=True)
    floor_number = models.IntegerField(default=1)
    amenities = models.TextField(blank=True)  # JSON or comma-separated amenities
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    class Meta:
        unique_together = ['block', 'room_number']
        indexes = [
            models.Index(fields=['block', 'room_number']),
            models.Index(fields=['block', 'is_available']),
            models.Index(fields=['room_type', 'is_available']),
        ]
    
    def __str__(self):
        return f"{self.block.name} - {self.room_number} [{self.block.school.school_name if self.block.school else 'No School'}]"
    
    def clean(self):
        """Validate that beds don't exceed room capacity"""
        if self.pk:  # Only check for existing rooms
            bed_count = self.hostelbed_set.count()
            if bed_count > self.capacity:
                raise ValidationError(f"Room has {bed_count} beds but capacity is {self.capacity}")
    
    def get_available_beds(self):
        """Get count of available beds in this room"""
        return self.hostelbed_set.filter(allocation__isnull=True).count()
    
    def update_occupancy(self):
        """Update current occupancy based on active allocations"""
        self.current_occupancy = self.hostelbed_set.filter(
            allocation__status='active'
        ).count()
        self.save(update_fields=['current_occupancy'])


class HostelBed(models.Model):
    """Model for individual beds within rooms"""
    
    BED_TYPES = [
        ('single', 'Single Bed'),
        ('bunk_top', 'Bunk Bed (Top)'),
        ('bunk_bottom', 'Bunk Bed (Bottom)'),
    ]
    
    room = models.ForeignKey(HostelRoom, on_delete=models.CASCADE)
    bed_number = models.CharField(max_length=10)  # e.g., "A", "B", "1", "2"
    bed_type = models.CharField(max_length=15, choices=BED_TYPES, default='single')
    is_available = models.BooleanField(default=True)
    maintenance_status = models.CharField(max_length=50, blank=True)  # "Good", "Needs Repair", etc.
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    class Meta:
        unique_together = ['room', 'bed_number']
        indexes = [
            models.Index(fields=['room', 'bed_number']),
            models.Index(fields=['room', 'is_available']),
        ]
    
    def __str__(self):
        return f"{self.room} - Bed {self.bed_number}"
    
    def is_occupied(self):
        """Check if bed is currently occupied"""
        return hasattr(self, 'allocation') and self.allocation.status == 'active'


class HostelAllocation(models.Model):
    """Model for hostel bed allocations - Links StudentProfile to Bed"""
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('vacated', 'Vacated'),
        ('suspended', 'Suspended'),
        ('pending', 'Pending'),  # For payment processing
    ]
    
    student = models.OneToOneField('users.StudentProfile', on_delete=models.CASCADE, related_name='hostel_allocation')
    bed = models.OneToOneField(HostelBed, on_delete=models.CASCADE, related_name='allocation', null=True, blank=True)
    allocation_date = models.DateField()
    vacation_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    allocated_by = models.ForeignKey('users.StaffProfile', on_delete=models.CASCADE)
    
    # Payment integration
    payment = models.ForeignKey('fees.Payment', on_delete=models.SET_NULL, null=True, blank=True)
    hostel_fee_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['bed', 'status']),
            models.Index(fields=['allocation_date', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.student.user.full_name} - {self.bed} (Status: {self.status})"
    
    def clean(self):
        """Validate allocation constraints"""
        # Check if student already has an active allocation
        if self.status == 'active':
            existing = HostelAllocation.objects.filter(
                student=self.student, 
                status='active'
            ).exclude(pk=self.pk)
            if existing.exists():
                raise ValidationError("Student already has an active hostel allocation")
        
        # Check if bed is already allocated
        if self.status == 'active':
            existing = HostelAllocation.objects.filter(
                bed=self.bed, 
                status='active'
            ).exclude(pk=self.pk)
            if existing.exists():
                raise ValidationError("Bed is already allocated to another student")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
        # Update room occupancy
        if self.bed and self.bed.room:
            self.bed.room.update_occupancy()
    
    def end_allocation(self, staff_member, vacation_date=None):
        """End the allocation"""
        self.status = 'vacated'
        self.vacation_date = vacation_date or timezone.now().date()
        self.save()
        return True


class HostelComplaint(models.Model):
    """Model for hostel complaints"""
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    CATEGORY_CHOICES = [
        ('maintenance', 'Maintenance'),
        ('cleanliness', 'Cleanliness'),
        ('electrical', 'Electrical'),
        ('plumbing', 'Plumbing'),
        ('internet', 'Internet/WiFi'),
        ('security', 'Security'),
        ('noise', 'Noise'),
        ('other', 'Other'),
    ]
    
    student = models.ForeignKey('users.StudentProfile', on_delete=models.CASCADE)
    room = models.ForeignKey(HostelRoom, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    
    # Timestamps
    submitted_date = models.DateTimeField(auto_now_add=True)
    resolved_date = models.DateTimeField(null=True, blank=True)
    
    # Staff handling
    assigned_to = models.ForeignKey('users.StaffProfile', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_complaints')
    resolved_by = models.ForeignKey('users.StaffProfile', on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_complaints')
    resolution_notes = models.TextField(blank=True)
    
    # Attachments (optional)
    attachment_url = models.URLField(blank=True)  # For image/document uploads
    
    class Meta:
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['room', 'priority']),
            models.Index(fields=['submitted_date', 'status']),
            models.Index(fields=['category', 'status']),
            models.Index(fields=['assigned_to', 'status']),
        ]
        ordering = ['-submitted_date']
    
    def __str__(self):
        return f"{self.title} - {self.student.user.full_name} [{self.room}]"
    
    def resolve(self, staff_member, resolution_notes=""):
        """Mark complaint as resolved"""
        self.status = 'resolved'
        self.resolved_by = staff_member
        self.resolved_date = timezone.now()
        if resolution_notes:
            self.resolution_notes = resolution_notes
        self.save()


class HostelLeaveRequest(models.Model):
    """Model for hostel leave requests"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]
    
    LEAVE_TYPES = [
        ('home', 'Home Visit'),
        ('medical', 'Medical'),
        ('emergency', 'Emergency'),
        ('personal', 'Personal'),
        ('academic', 'Academic'),
        ('other', 'Other'),
    ]
    
    student = models.ForeignKey('users.StudentProfile', on_delete=models.CASCADE)
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPES, default='home')
    
    # Leave dates
    start_date = models.DateField()
    end_date = models.DateField()
    expected_return_date = models.DateField()
    actual_return_date = models.DateField(null=True, blank=True)
    
    # Details
    reason = models.TextField()
    emergency_contact = models.CharField(max_length=15, blank=True)  # Phone number
    destination = models.CharField(max_length=200, blank=True)
    
    # Status and approval
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey('users.StaffProfile', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_leaves')
    rejected_by = models.ForeignKey('users.StaffProfile', on_delete=models.SET_NULL, null=True, blank=True, related_name='rejected_leaves')
    approval_notes = models.TextField(blank=True)
    
    # Timestamps
    submitted_date = models.DateTimeField(auto_now_add=True)
    decision_date = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['submitted_date', 'status']),
            models.Index(fields=['leave_type', 'status']),
        ]
        ordering = ['-submitted_date']
    
    def __str__(self):
        return f"{self.student.user.full_name} - {self.leave_type} ({self.start_date} to {self.end_date})"
    
    def clean(self):
        """Validate leave request dates"""
        if self.start_date and self.end_date:
            if self.start_date > self.end_date:
                raise ValidationError("Start date cannot be after end date")
        
        if self.expected_return_date and self.end_date:
            if self.expected_return_date < self.end_date:
                raise ValidationError("Expected return date cannot be before end date")
    
    def approve(self, staff_member, notes=""):
        """Approve leave request"""
        self.status = 'approved'
        self.approved_by = staff_member
        self.decision_date = timezone.now()
        if notes:
            self.approval_notes = notes
        self.save()
    
    def reject(self, staff_member, notes=""):
        """Reject leave request"""
        self.status = 'rejected'
        self.rejected_by = staff_member
        self.decision_date = timezone.now()
        if notes:
            self.approval_notes = notes
        self.save()
    
    def mark_returned(self, return_date=None):
        """Mark student as returned from leave"""
        self.actual_return_date = return_date or timezone.now().date()
        self.save()
    
    @property
    def duration_days(self):
        """Calculate leave duration in days"""
        if self.start_date and self.end_date:
            return (self.end_date - self.start_date).days + 1
        return 0
