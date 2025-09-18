// Hostel management API service
import { apiClient } from '@/lib/api/client';

export interface HostelBlock {
  id: number;
  name: string;
  description: string;
  school: number;
  school_name: string;
  warden: number | null;
  warden_name: string | null;
  total_rooms: number;
  total_beds: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HostelRoom {
  id: number;
  room_number: string;
  room_type: 'single' | 'double' | 'triple' | 'quad';
  capacity: number;
  current_occupancy: number;
  is_available: boolean;
  floor_number: number;
  amenities: string;
  block: number;
  block_name: string;
  school_name: string;
  availability_status: 'full' | 'partial' | 'empty';
}

export interface HostelBed {
  id: number;
  bed_number: string;
  bed_type: 'single' | 'bunk_top' | 'bunk_bottom';
  is_available: boolean;
  maintenance_status: string;
  room: number;
  room_number: string;
  block_name: string;
  is_occupied: boolean;
}

export interface HostelAllocation {
  id: number;
  student: number;
  student_name: string;
  student_email: string;
  bed: number;
  bed_number: string;
  room_number: string;
  block_name: string;
  allocation_date: string;
  vacation_date: string | null;
  status: 'active' | 'vacated' | 'suspended' | 'pending';
  allocated_by: number;
  allocated_by_name: string;
  payment: number | null;
  hostel_fee_amount: string;
}

export interface HostelComplaint {
  id: number;
  student: number;
  student_name: string;
  room: number;
  room_number: string;
  block_name: string;
  title: string;
  description: string;
  category: 'maintenance' | 'cleanliness' | 'food' | 'security' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  submitted_date: string;
  resolved_date: string | null;
  resolved_by: number | null;
  resolved_by_name: string | null;
  assigned_to: number | null;
  assigned_to_name: string | null;
  resolution_notes: string;
  attachment_url: string;
}

export interface HostelLeaveRequest {
  id: number;
  student: number;
  student_name: string;
  leave_type: 'home' | 'medical' | 'emergency' | 'personal' | 'academic' | 'other';
  start_date: string;
  end_date: string;
  expected_return_date: string;
  actual_return_date: string | null;
  reason: string;
  emergency_contact: string;
  destination: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by: number | null;
  approved_by_name: string | null;
  rejected_by: number | null;
  rejected_by_name: string | null;
  approval_notes: string;
  submitted_date: string;
  decision_date: string | null;
}

export interface StaffMember {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    full_name: string;
  };
  employee_id: string;
  department: string;
  position: string;
  phone_number: string;
  date_of_joining: string;
  is_active: boolean;
}

export class HostelAPI {
  private static BASE_URL = '/api/hostel';

  // Hostel Blocks
  static async getBlocks(params?: { 
    is_active?: boolean; 
    warden?: number;
  }): Promise<HostelBlock[]> {
    const response = await apiClient.get(`${this.BASE_URL}/blocks/`, { params });
    return response.data.results || response.data;
  }

  static async createBlock(data: Partial<HostelBlock>): Promise<HostelBlock> {
    const response = await apiClient.post(`${this.BASE_URL}/blocks/`, data);
    return response.data;
  }

  static async updateBlock(id: number, data: Partial<HostelBlock>): Promise<HostelBlock> {
    const response = await apiClient.patch(`${this.BASE_URL}/blocks/${id}/`, data);
    return response.data;
  }

  static async deleteBlock(id: number): Promise<void> {
    await apiClient.delete(`${this.BASE_URL}/blocks/${id}/`);
  }

  // Hostel Rooms
  static async getRooms(params?: { 
    type?: string; 
    available?: boolean; 
    block?: number; 
    block__in?: string;
    floor?: number; 
  }): Promise<HostelRoom[]> {
    const response = await apiClient.get(`${this.BASE_URL}/rooms/`, { params });
    return response.data.results || response.data;
  }

  static async createRoom(data: Partial<HostelRoom>): Promise<HostelRoom> {
    const response = await apiClient.post(`${this.BASE_URL}/rooms/`, data);
    return response.data;
  }

  static async updateRoom(id: number, data: Partial<HostelRoom>): Promise<HostelRoom> {
    const response = await apiClient.patch(`${this.BASE_URL}/rooms/${id}/`, data);
    return response.data;
  }

  static async deleteRoom(id: number): Promise<void> {
    await apiClient.delete(`${this.BASE_URL}/rooms/${id}/`);
  }

  // Hostel Beds
  static async getBeds(params?: { 
    room?: number; 
    room__in?: string;
    available?: boolean; 
    bed_type?: string; 
  }): Promise<HostelBed[]> {
    const response = await apiClient.get(`${this.BASE_URL}/beds/`, { params });
    return response.data.results || response.data;
  }

  static async createBed(data: Partial<HostelBed>): Promise<HostelBed> {
    const response = await apiClient.post(`${this.BASE_URL}/beds/`, data);
    return response.data;
  }

  static async updateBed(id: number, data: Partial<HostelBed>): Promise<HostelBed> {
    const response = await apiClient.patch(`${this.BASE_URL}/beds/${id}/`, data);
    return response.data;
  }

  static async deleteBed(id: number): Promise<void> {
    await apiClient.delete(`${this.BASE_URL}/beds/${id}/`);
  }

  // Hostel Allocations
  static async getAllocations(params?: { 
    status?: string;
    bed__in?: string;
    student?: number;
    block?: number;
  }): Promise<HostelAllocation[]> {
    const response = await apiClient.get(`${this.BASE_URL}/allocations/`, { params });
    return response.data.results || response.data;
  }

  static async createAllocation(data: Partial<HostelAllocation>): Promise<HostelAllocation> {
    const response = await apiClient.post(`${this.BASE_URL}/allocations/`, data);
    return response.data;
  }

  static async updateAllocation(id: number, data: Partial<HostelAllocation>): Promise<HostelAllocation> {
    const response = await apiClient.patch(`${this.BASE_URL}/allocations/${id}/`, data);
    return response.data;
  }

  static async endAllocation(id: number, vacation_date?: string): Promise<void> {
    await apiClient.post(`${this.BASE_URL}/allocations/${id}/end_allocation/`, { vacation_date });
  }

  static async allocateBed(data: { student_id: number; bed_id: number; allocation_date?: string }): Promise<HostelAllocation> {
    const response = await apiClient.post(`${this.BASE_URL}/allocate/`, data);
    return response.data;
  }

  // Hostel Complaints
  static async getComplaints(params?: { 
    status?: string; 
    category?: string; 
    priority?: string;
    block__in?: string;
    student?: number;
  }): Promise<HostelComplaint[]> {
    const response = await apiClient.get(`${this.BASE_URL}/complaints/`, { params });
    return response.data.results || response.data;
  }

  static async createComplaint(data: Partial<HostelComplaint>): Promise<HostelComplaint> {
    const response = await apiClient.post(`${this.BASE_URL}/complaints/`, data);
    return response.data;
  }

  static async updateComplaint(id: number, data: Partial<HostelComplaint>): Promise<HostelComplaint> {
    const response = await apiClient.patch(`${this.BASE_URL}/complaints/${id}/`, data);
    return response.data;
  }

  static async assignComplaint(id: number, staff_id: number): Promise<void> {
    await apiClient.post(`${this.BASE_URL}/complaints/${id}/assign/`, { staff_id });
  }

  static async resolveComplaint(id: number, resolution_notes: string): Promise<void> {
    await apiClient.post(`${this.BASE_URL}/complaints/${id}/resolve/`, { resolution_notes });
  }

  // Hostel Leave Requests
  static async getLeaveRequests(params?: { 
    status?: string; 
    leave_type?: string; 
    start_date?: string;
    end_date?: string;
    student__allocation__bed__room__block__in?: string;
    student?: number;
  }): Promise<HostelLeaveRequest[]> {
    const response = await apiClient.get(`${this.BASE_URL}/leave-requests/`, { params });
    return response.data.results || response.data;
  }

  static async createLeaveRequest(data: Partial<HostelLeaveRequest>): Promise<HostelLeaveRequest> {
    const response = await apiClient.post(`${this.BASE_URL}/leave-requests/`, data);
    return response.data;
  }

  static async approveLeaveRequest(id: number, approval_notes?: string): Promise<void> {
    await apiClient.post(`${this.BASE_URL}/leave-requests/${id}/approve/`, { approval_notes });
  }

  static async rejectLeaveRequest(id: number, approval_notes?: string): Promise<void> {
    await apiClient.post(`${this.BASE_URL}/leave-requests/${id}/reject/`, { approval_notes });
  }

  static async markReturned(id: number, actual_return_date?: string): Promise<void> {
    await apiClient.post(`${this.BASE_URL}/leave-requests/${id}/mark_returned/`, { actual_return_date });
  }

  // Staff management for warden assignment
  static async getStaffMembers(): Promise<StaffMember[]> {
    const response = await apiClient.get('/api/staff/');
    return response.data.results || response.data;
  }

  // Dashboard analytics
  static async getHostelDashboardStats(): Promise<{
    total_blocks: number;
    total_rooms: number;
    total_beds: number;
    occupied_beds: number;
    available_beds: number;
    occupancy_rate: number;
    pending_complaints: number;
    pending_leave_requests: number;
    recent_allocations: HostelAllocation[];
    recent_complaints: HostelComplaint[];
    recent_leave_requests: HostelLeaveRequest[];
  }> {
    const [blocks, rooms, beds, allocations, complaints, leaveRequests] = await Promise.all([
      this.getBlocks({ is_active: true }),
      this.getRooms(),
      this.getBeds(),
      this.getAllocations({ status: 'active' }),
      this.getComplaints({ status: 'open' }),
      this.getLeaveRequests({ status: 'pending' })
    ]);

    const total_blocks = blocks.length;
    const total_rooms = rooms.length;
    const total_beds = beds.length;
    const occupied_beds = allocations.length;
    const available_beds = total_beds - occupied_beds;
    const occupancy_rate = total_beds > 0 ? (occupied_beds / total_beds) * 100 : 0;

    return {
      total_blocks,
      total_rooms,
      total_beds,
      occupied_beds,
      available_beds,
      occupancy_rate,
      pending_complaints: complaints.length,
      pending_leave_requests: leaveRequests.length,
      recent_allocations: allocations.slice(0, 5),
      recent_complaints: complaints.slice(0, 5),
      recent_leave_requests: leaveRequests.slice(0, 5)
    };
  }
}