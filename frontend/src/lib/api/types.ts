// Django API configuration and types

export interface User {
  id: number;
  email: string;
  role: 'student' | 'parent' | 'faculty' | 'warden' | 'admin';
  first_name: string;
  last_name: string;
  phone_number?: string;
  is_active: boolean;
  date_joined: string;
  school?: School;
}

export interface School {
  id: number;
  school_name: string;
  school_code: string;
  district: string;
  block: string;
  village: string;
}

export interface SchoolsResponse {
  success: boolean;
  data: School[];
}

export interface StudentProfile {
  id: number;
  user: number;
  admission_number: string;
  roll_number?: string;
  course: string;
  department: string;
  semester: number;
  date_of_birth?: string;
  parent_phone?: string;
  is_hostelite: boolean;
  documents?: Record<string, string>;
}

export interface ParentProfile {
  id: number;
  user: number;
  occupation?: string;
  annual_income?: string;
  children: number[];
}

export interface StaffProfile {
  id: number;
  user: number;
  staff_id: string;
  role: 'faculty' | 'admin' | 'warden';
  department?: string;
  designation?: string;
  experience_years?: number;
  specialization?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface EmailVerificationRequest {
  email: string;
  applicant_name?: string;
}

export interface EmailVerificationResponse {
  success: boolean;
  message: string;
}

export interface EmailVerification {
  email: string;
  otp: string;
}

export interface EmailVerificationResult {
  success: boolean;
  message: string;
  verification_token?: string;
}

export interface AdmissionApplication {
  id?: number;
  reference_id?: string;
  applicant_name: string;
  date_of_birth: string;
  email: string;
  phone_number: string;
  address: string;
  category?: string;
  course_applied: string;
  first_preference_school?: number | School; // Can accept both for flexibility
  second_preference_school?: number | School;
  third_preference_school?: number | School;
  previous_school?: string;
  last_percentage?: number;
  documents?: Record<string, string>;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  application_date?: string;
  review_comments?: string;
  email_verification_token?: string;  // Required for submission
  school_decisions?: SchoolAdmissionDecision[];
}

export interface SchoolAdmissionDecision {
  id: number;
  school: School | string | null; // Can be either a School object, school ID string, or null
  school_name?: string;
  application?: string;
  preference_order?: string;
  decision: 'pending' | 'accepted' | 'rejected';
  decision_date?: string | null;
  review_comments?: string;
  is_student_choice?: boolean;
  student_choice_date?: string | null;
  reviewed_by?: number | null;
  status?: 'pending' | 'accepted' | 'rejected'; // Alias for decision
  review_date?: string;
  notes?: string;
  // New enrollment tracking fields
  enrollment_status?: 'not_enrolled' | 'enrolled' | 'withdrawn';
  enrollment_date?: string | null;
  withdrawal_date?: string | null;
  withdrawal_reason?: string;
  payment_status?: 'pending' | 'completed' | 'failed' | 'waived';
  payment_reference?: string;
  can_enroll?: boolean;
  can_withdraw?: boolean;
  // New payment finalization and user ID fields
  is_payment_finalized?: boolean;
  payment_completed_at?: string | null;
  user_id_allocated?: boolean;
  user_id_allocated_at?: string | null;
  student_user?: number | null;
}

export interface AdmissionTrackingResponse {
  success: boolean;
  data?: {
    reference_id: string;
    applicant_name: string;
    course_applied: string;
    category?: string;
    status: string;
    first_preference_school?: School;
    second_preference_school?: School;
    third_preference_school?: School;
    application_date: string;
    review_comments?: string;
    school_decisions?: SchoolAdmissionDecision[];
    accepted_schools?: SchoolAdmissionDecision[];
  };
  message?: string;
}

export interface FeeInvoice {
  id: number;
  invoice_number: string;
  student: number;
  student_name?: string;
  amount: string;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  created_date: string;
  items?: any;
}

export interface Payment {
  id: number;
  invoice: number;
  amount: string;
  transaction_id?: string;
  payment_method: 'cash' | 'online' | 'cheque';
  payment_date: string;
  receipt_url?: string;
}

export interface AttendanceRecord {
  id: number;
  session: number;
  student: number;
  status: 'present' | 'absent' | 'late' | 'excused';
  marked_by: number;
  marked_at: string;
  remarks?: string;
}

export interface ClassSession {
  id: number;
  school?: number;
  course: string;
  subject: string;
  batch: string;
  date: string;
  start_time: string;
  end_time: string;
  faculty: number;
  faculty_name?: string;
  created_at?: string;
}

export interface Exam {
  id: number;
  name: string;
  exam_type: 'internal' | 'external' | 'assignment';
  course: string;
  subject: string;
  date: string;
  max_marks: number;
  duration_hours: number;
}

export interface ExamResult {
  id: number;
  exam: number;
  student: number;
  marks_obtained: number;
  grade?: string;
  remarks?: string;
}

export interface HostelRoom {
  id: number;
  room_number: string;
  block: number;
  block_name?: string;
  school_name?: string;
  room_type: 'single' | 'double' | 'triple';
  capacity: number;
  current_occupancy: number;
  is_available: boolean;
  availability_status?: 'full' | 'partial' | 'empty';
}

export interface HostelAllocation {
  id: number;
  student: number;
  student_name?: string;
  student_email?: string;
  room: number;
  room_number?: string;
  block_name?: string;
  allocation_date: string;
  vacation_date?: string;
  status: 'active' | 'vacated' | 'suspended';
  allocated_by?: number;
  allocated_by_name?: string;
}

export interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  category: string;
  total_copies: number;
  available_copies: number;
}

export interface BookBorrowRecord {
  id: number;
  book: number;
  student: number;
  borrowed_date: string;
  due_date: string;
  returned_date?: string;
  fine_amount?: string;
  status: 'borrowed' | 'returned' | 'overdue';
}

export interface Notice {
  id: number;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  target_roles: string[];
  is_sticky: boolean;
  publish_date: string;
  expire_date?: string;
  created_by: number;
  created_by_name?: string;
}

export interface UserNotification {
  id: number;
  user: number;
  notice: number;
  is_read: boolean;
  read_date?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    results: T;
    pagination?: {
      count: number;
      next?: string;
      previous?: string;
      page_size: number;
      total_pages: number;
      current_page: number;
    };
  } | T;
}

export interface ApiError {
  success: false;
  message: string;
  timestamp: string;
  errors: Record<string, string[]> | string[];
  status?: number;
}

export interface DashboardStats {
  total_students?: number;
  total_parents?: number;
  total_staff?: number;
  applications_this_month?: number;
  pending_fees?: number;
  recent_notices?: number;
  timestamp?: string;
}