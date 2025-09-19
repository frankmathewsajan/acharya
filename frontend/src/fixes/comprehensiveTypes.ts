// Comprehensive Type Definitions
// types/api.ts - Standardized type definitions

// Base API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  timestamp: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next?: string;
  previous?: string;
  page_size: number;
  total_pages?: number;
  current_page?: number;
}

export interface ApiError {
  success: false;
  message: string;
  timestamp: string;
  errors: ValidationError[];
  status?: number;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// User and Authentication Types
export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  phone_number?: string;
  is_active: boolean;
  created_at: string;
  school_info?: SchoolInfo;
}

export type UserRole = 'student' | 'parent' | 'faculty' | 'warden' | 'admin' | 'librarian';

export interface SchoolInfo {
  id: number;
  name: string;
  code: string;
}

export interface School {
  id: number;
  school_name: string;
  school_code: string;
  district: string;
  block: string;
  village: string;
  is_active: boolean;
  created_at: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
}

// Profile Types
export interface StudentProfile {
  id: number;
  user?: User;
  school?: School;
  first_name: string;
  last_name: string;
  full_name: string;
  admission_number: string;
  roll_number: string;
  course: string;
  department: string;
  semester: number;
  date_of_birth: string;
  address: string;
  emergency_contact: string;
  is_hostelite: boolean;
  is_active: boolean;
}

export interface ParentProfile {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string;
  email: string;
  occupation?: string;
  address: string;
  relationship: 'father' | 'mother' | 'guardian';
  student?: StudentProfile;
  is_primary_contact: boolean;
  admission_application?: number;
}

export interface StaffProfile {
  id: number;
  user: User;
  school?: School;
  employee_id: string;
  department: string;
  designation: string;
  date_of_joining: string;
  qualification?: string;
  experience_years: number;
}

// Hostel Types
export interface HostelBlock {
  id: number;
  school?: School;
  name: string;
  description?: string;
  warden?: StaffProfile;
  total_rooms: number;
  total_beds: number;
  total_floors: number;
  floor_config: number[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HostelRoom {
  id: number;
  block: HostelBlock;
  room_number: string;
  room_type: RoomType;
  room_type_display: string;
  ac_type: 'ac' | 'non_ac';
  ac_type_display: string;
  capacity: number;
  current_occupancy: number;
  is_available: boolean;
  floor_number: number;
  floor_display: string;
  amenities?: string;
  annual_fee_non_ac: string;
  annual_fee_ac: string;
  current_annual_fee: string;
  availability_status: 'empty' | 'partial' | 'full';
  created_at: string;
  updated_at: string;
}

export type RoomType = '1_bed' | '2_beds' | '3_beds' | '4_beds' | '5_beds' | '6_beds' | 'dormitory';

export interface HostelBed {
  id: number;
  room: HostelRoom;
  bed_number: string;
  bed_type: 'single' | 'bunk_top' | 'bunk_bottom';
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface HostelAllocation {
  id: number;
  student: StudentProfile;
  student_name: string;
  student_email: string;
  bed: HostelBed;
  bed_number: string;
  room_number: string;
  block_name: string;
  allocation_date: string;
  vacation_date?: string;
  status: 'active' | 'vacated' | 'transferred';
  allocated_by?: StaffProfile;
  allocated_by_name?: string;
  payment?: number;
  hostel_fee_amount: string;
}

export interface HostelComplaint {
  id: number;
  student: StudentProfile;
  student_name: string;
  room?: HostelRoom;
  room_number?: string;
  block_name?: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  submitted_date: string;
  resolved_date?: string;
  resolved_by?: StaffProfile;
  resolved_by_name?: string;
  assigned_to?: StaffProfile;
  assigned_to_name?: string;
  resolution_notes?: string;
  attachment_url?: string;
}

export type ComplaintCategory = 'maintenance' | 'cleanliness' | 'food' | 'noise' | 'security' | 'other';
export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ComplaintStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface HostelLeaveRequest {
  id: number;
  student: StudentProfile;
  student_name: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  expected_return_date: string;
  actual_return_date?: string;
  reason: string;
  emergency_contact: string;
  destination: string;
  status: LeaveStatus;
  approved_by?: StaffProfile;
  approved_by_name?: string;
  rejected_by?: StaffProfile;
  rejected_by_name?: string;
  approval_notes?: string;
  submitted_date: string;
  decision_date?: string;
}

export type LeaveType = 'home_visit' | 'emergency' | 'medical' | 'personal' | 'festival' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'returned';

// Library Types
export interface LibraryBook {
  id: number;
  school?: School;
  isbn?: string;
  title: string;
  author: string;
  publisher?: string;
  publication_year?: number;
  description?: string;
  category?: string;
  total_copies: number;
  available_copies: number;
  shelf_location?: string;
  google_books_id?: string;
  image_links?: string;
  price?: string;
  page_count?: number;
  audience_type?: string;
  saleability: boolean;
  last_search?: string;
  created_at: string;
  updated_at: string;
  is_available_for_borrowing: boolean;
  is_purchasable: boolean;
}

export interface UserBook {
  id: number;
  user: User;
  book: LibraryBook;
  book_title: string;
  book_author: string;
  book_isbn?: string;
  book_image_links?: string;
  user_name: string;
  user_email: string;
  issued_by?: User;
  issued_by_name?: string;
  type: 'BORROWED' | 'PURCHASED';
  status: 'active' | 'returned' | 'lost' | 'damaged';
  borrowed_date?: string;
  due_date?: string;
  returned_date?: string;
  purchased_date?: string;
  purchase_price?: string;
  fine_amount: string;
  fine_paid: boolean;
  created_at: string;
  is_overdue: boolean;
  days_overdue: number;
  current_fine: string;
}

export interface BookRequest {
  id: number;
  user: User;
  user_name: string;
  user_email: string;
  school?: School;
  school_name?: string;
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  publication_year?: number;
  reason: string;
  urgency: RequestUrgency;
  status: RequestStatus;
  admin_notes?: string;
  library_book?: LibraryBook;
  library_book_title?: string;
  reviewed_by?: User;
  reviewed_by_name?: string;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
}

export type RequestUrgency = 'low' | 'medium' | 'high';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'available';

export interface BookRequestCreate {
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  publication_year?: number;
  reason: string;
  urgency: RequestUrgency;
}

// Form Types
export interface ComplaintForm {
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
}

export interface LeaveRequestForm {
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  expected_return_date: string;
  reason: string;
  emergency_contact: string;
  destination: string;
}

export interface BookRequestForm {
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  publication_year: number | null;
  reason: string;
  urgency: RequestUrgency;
}

// Dashboard Stats Types
export interface DashboardStats {
  total_students?: number;
  total_parents?: number;
  total_staff?: number;
  applications_this_month?: number;
  pending_fees?: number;
  recent_notices?: number;
}

export interface LibraryStats {
  total_books: number;
  total_borrowed: number;
  total_overdue: number;
  total_fines: number;
  popular_books: LibraryBook[];
  recent_activities: UserBook[];
}

// Search Types
export interface BookSearchParams {
  q: string;
  offline?: boolean;
  max_results?: number;
}

export interface BookSearchResponse {
  books: LibraryBook[];
  total_found: number;
  search_time: number;
  from_cache: boolean;
}

// Login Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
  profile?: StudentProfile | ParentProfile | StaffProfile;
}

// Utility Types
export type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface RequestConfig {
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

// All types are exported above - file complete