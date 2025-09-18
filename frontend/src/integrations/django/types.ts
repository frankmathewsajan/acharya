// Type definitions for Acharya Education Management System

export interface School {
  id: string;
  district: string;
  block: string;
  village: string;
  school_name: string;
  school_code: string;
  is_active: boolean;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  created_at: string;
  activated_at?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'parent' | 'faculty' | 'warden' | 'admin';
  is_active: boolean;
  phone_number?: string;
  school?: string; // School ID
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: string;
  user: string; // User ID
  admission_number: string;
  roll_number: string;
  course: string;
  department: string;
  semester: number;
  date_of_birth: string;
  address: string;
  emergency_contact: string;
  is_hostelite: boolean;
}

export interface StaffProfile {
  id: string;
  user: string; // User ID
  employee_id: string;
  department: string;
  designation: string;
  date_of_joining: string;
  qualification?: string;
  experience_years: number;
}

export interface ParentProfile {
  id: string;
  user: string; // User ID
  children: string[]; // StudentProfile IDs
  occupation?: string;
  address: string;
}

export interface ClassSession {
  id: string;
  school: string; // School ID
  course: string;
  subject: string;
  batch: string;
  date: string;
  start_time: string;
  end_time: string;
  faculty: string; // StaffProfile ID
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  session: string; // ClassSession ID
  student: string; // StudentProfile ID
  status: 'present' | 'absent' | 'late' | 'excused';
  marked_by: string; // StaffProfile ID
  marked_at: string;
  remarks?: string;
}

export interface FeeStructure {
  id: string;
  school: string; // School ID
  course: string;
  semester: number;
  tuition_fee: number;
  library_fee: number;
  lab_fee: number;
  exam_fee: number;
  total_fee: number;
}

export interface FeeInvoice {
  id: string;
  invoice_number: string;
  student: string; // StudentProfile ID
  fee_structure: string; // FeeStructure ID
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  created_date: string;
}

export interface Payment {
  id: string;
  invoice: string; // FeeInvoice ID
  transaction_id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'online' | 'bank_transfer';
  payment_date: string;
  receipt_path?: string;
}

export interface Book {
  id: string;
  school: string; // School ID
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  publication_year: number;
  category: string;
  total_copies: number;
  available_copies: number;
  shelf_location: string;
}

export interface BookBorrowRecord {
  id: string;
  book: string; // Book ID
  student: string; // StudentProfile ID
  borrowed_date: string;
  due_date: string;
  returned_date?: string;
  status: 'borrowed' | 'returned' | 'lost' | 'damaged';
  fine_amount: number;
  issued_by: string; // StaffProfile ID
}

export interface Exam {
  id: string;
  school: string; // School ID
  name: string;
  exam_type: 'internal' | 'external' | 'practical' | 'assignment';
  course: string;
  subject: string;
  semester: number;
  date: string;
  max_marks: number;
  duration_minutes: number;
  created_by: string; // StaffProfile ID
  created_at: string;
}

export interface ExamResult {
  id: string;
  exam: string; // Exam ID
  student: string; // StudentProfile ID
  marks_obtained: number;
  grade: string;
  remarks?: string;
  entered_by: string; // StaffProfile ID
  entered_at: string;
}

export interface Notice {
  id: string;
  school: string; // School ID
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  target_roles: string[]; // Array of role names
  is_sticky: boolean;
  publish_date: string;
  expire_date?: string;
  created_by: string; // User ID
  created_at: string;
  is_active: boolean;
}

export interface UserNotification {
  id: string;
  user: string; // User ID
  notice: string; // Notice ID
  is_read: boolean;
  read_at?: string;
}

export interface AdmissionApplication {
  id: string;
  school: string; // School ID
  applicant_name: string;
  date_of_birth: string;
  email: string;
  phone_number: string;
  address: string;
  course_applied: string;
  previous_school?: string;
  last_percentage?: number;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  application_date: string;
  reviewed_by?: string; // User ID
  review_date?: string;
  review_comments?: string;
  documents: Record<string, any>;
}

export interface HostelBlock {
  id: string;
  school: string; // School ID
  name: string;
  description?: string;
  warden?: string; // StaffProfile ID
  total_rooms: number;
}

export interface HostelRoom {
  id: string;
  block: string; // HostelBlock ID
  room_number: string;
  room_type: 'single' | 'double' | 'triple';
  capacity: number;
  current_occupancy: number;
  is_available: boolean;
}

export interface HostelAllocation {
  id: string;
  student: string; // StudentProfile ID
  room: string; // HostelRoom ID
  allocation_date: string;
  vacation_date?: string;
  status: 'active' | 'vacated' | 'suspended';
  allocated_by: string; // StaffProfile ID
}

export interface HostelComplaint {
  id: string;
  student: string; // StudentProfile ID
  room: string; // HostelRoom ID
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  submitted_date: string;
  resolved_date?: string;
  resolved_by?: string; // StaffProfile ID
}

// API Response types
export interface APIResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next?: string;
  previous?: string;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  profile?: StudentProfile | StaffProfile | ParentProfile;
}

// Dashboard data types
export interface DashboardStats {
  totalStudents?: number;
  totalStaff?: number;
  attendanceToday?: number;
  pendingFees?: number;
  upcomingExams?: number;
  libraryBooks?: number;
  hostelOccupancy?: number;
  recentNotices?: number;
}

export interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
}

export interface AcademicStats {
  averageGrade: string;
  totalExams: number;
  passPercentage: number;
  subjectWiseMarks: Record<string, number>;
}

export interface FinancialStats {
  totalFees: number;
  paidFees: number;
  pendingFees: number;
  overdueInvoices: number;
}

// Parent login types (for OTP system)
export interface ParentLoginRequest {
  student_registration: string;
  phone_number: string;
}

export interface OTPResponse {
  otp_id: string;
  message: string;
}

export interface OTPVerifyRequest {
  otp_id: string;
  otp_code: string;
}

export type Database = {
  // This can be expanded if we need to maintain compatibility with Supabase types
  schools: School;
  users: User;
  students: StudentProfile;
  staff: StaffProfile;
  parents: ParentProfile;
};