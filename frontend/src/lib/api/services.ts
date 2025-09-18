import { 
  AdmissionApplication,
  AdmissionTrackingResponse,
  SchoolAdmissionDecision,
  EmailVerificationRequest,
  EmailVerificationResponse,
  EmailVerification,
  EmailVerificationResult,
  School,
  SchoolsResponse,
  FeeInvoice,
  Payment,
  AttendanceRecord,
  ClassSession,
  Exam,
  ExamResult,
  HostelRoom,
  HostelAllocation,
  Book,
  BookBorrowRecord,
  Notice,
  UserNotification,
  DashboardStats,
  ApiResponse
} from './types';
import { api, apiClient } from './client';

export const schoolService = {
  // Get list of active schools for admission forms (public)
  getActiveSchools: (): Promise<SchoolsResponse> =>
    api.get('schools/public/'),
};

export const admissionService = {
  // Email verification for admission
  requestEmailVerification: (data: EmailVerificationRequest): Promise<EmailVerificationResponse> =>
    api.post('admissions/verify-email/request/', data),

  // Verify email with OTP
  verifyEmail: (data: EmailVerification): Promise<EmailVerificationResult> =>
    api.post('admissions/verify-email/verify/', data),

  // Submit admission application (requires email verification)
  submitApplication: (data: Partial<AdmissionApplication>): Promise<AdmissionApplication> =>
    api.post('admissions/applications/', data),

  // Upload documents for an admission application
  uploadDocuments: async (applicationId: number, files: File[]): Promise<any> => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`document_${index + 1}`, file);
    });
    
    const response = await apiClient.post(`admissions/documents/${applicationId}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Get documents for an admission application
  getDocuments: (applicationId: number): Promise<any> =>
    api.get(`admissions/documents/${applicationId}/`),

  // Get all applications (admin)
  getApplications: (params?: any): Promise<ApiResponse<AdmissionApplication[]>> =>
    api.get('admissions/applications/', params),

  // Get application by ID
  getApplication: (id: number): Promise<AdmissionApplication> =>
    api.get(`admissions/applications/${id}/`),

  // Review application (admin)
  reviewApplication: (id: number, data: { status: string; review_comments?: string }): Promise<AdmissionApplication> =>
    api.patch(`admissions/applications/${id}/review/`, data),

  // Track application by reference ID
  trackApplication: (reference_id: string): Promise<AdmissionTrackingResponse> =>
    api.get(`admissions/track/?reference_id=${reference_id}`),

  // Get accepted schools for student choice
  getAcceptedSchools: (reference_id: string): Promise<ApiResponse<SchoolAdmissionDecision[]>> =>
    api.get(`admissions/accepted-schools/?reference_id=${reference_id}`),

  // Submit student's school choice
  submitStudentChoice: (data: { reference_id: string; chosen_school: string }): Promise<ApiResponse<any>> =>
    api.post('admissions/student-choice/', data),

  // Initialize fee payment process
  initializeFeePayment: (data: { reference_id: string; school_decision_id?: number }): Promise<ApiResponse<any>> =>
    api.post('admissions/fee-payment/init/', data),

  // Calculate fee based on student's course and category
  calculateFee: (data: { reference_id: string }): Promise<ApiResponse<any>> =>
    api.post('admissions/fee-calculation/', data),

  // Enroll student in a school
  enrollStudent: (data: { decision_id: number; payment_reference?: string }): Promise<ApiResponse<any>> =>
    api.post('admissions/enroll/', data),

  // Withdraw student enrollment
  withdrawEnrollment: (data: { decision_id: number; withdrawal_reason?: string }): Promise<ApiResponse<any>> =>
    api.post('admissions/withdraw/', data),
};

export const feeService = {
  // Get fee invoices
  getInvoices: (params?: any): Promise<ApiResponse<FeeInvoice[]>> =>
    api.get('fees/invoices/', params),

  // Get all payments including admission fees
  getAllPayments: (): Promise<ApiResponse<any[]>> =>
    api.get('fees/invoices/all_payments/'),

  // Get invoice by ID
  getInvoice: (id: number): Promise<FeeInvoice> =>
    api.get(`fees/invoices/${id}/`),

  // Process payment
  processPayment: (id: number, data: { payment_method: string; transaction_id?: string }): Promise<{ message: string; payment: Payment; invoice: FeeInvoice }> =>
    api.post(`fees/invoices/${id}/pay/`, data),

  // Get payments
  getPayments: (params?: any): Promise<ApiResponse<Payment[]>> =>
    api.get('fees/payments/', params),

  // Get fee structures
  getFeeStructures: (params?: any): Promise<ApiResponse<any[]>> =>
    api.get('fees/structures/', params),
};

export const attendanceService = {
  // Mark attendance (faculty)
  markAttendance: (data: { session_id: number; attendance_data: Array<{ student_id: number; status: string }> }): Promise<{ message: string }> =>
    api.post('attendance/mark/', data),

  // Get attendance records
  getAttendanceRecords: (params?: any): Promise<ApiResponse<AttendanceRecord[]>> =>
    api.get('attendance/records/', params),

  // Create class session
  createSession: (data: Partial<ClassSession>): Promise<ClassSession> =>
    api.post('attendance/sessions/', data),

  // Get class sessions
  getSessions: (params?: any): Promise<ApiResponse<ClassSession[]>> =>
    api.get('attendance/sessions/', params),
};

export const examService = {
  // Get exams
  getExams: (params?: any): Promise<ApiResponse<Exam[]>> =>
    api.get('exams/', params),

  // Get exam by ID
  getExam: (id: number): Promise<Exam> =>
    api.get(`exams/${id}/`),

  // Get exam results
  getExamResults: (params?: any): Promise<ApiResponse<ExamResult[]>> =>
    api.get('exams/results/', params),

  // Upload marks (faculty)
  uploadMarks: (examId: number, data: { results: Array<{ student_id: number; marks_obtained: number; grade?: string }> }): Promise<{ message: string }> =>
    api.post(`exams/${examId}/marks/`, data),
};

export const hostelService = {
  // Get hostel rooms
  getRooms: (params?: any): Promise<ApiResponse<HostelRoom[]>> =>
    api.get('hostel/rooms/', params),

  // Allocate room
  allocateRoom: (data: { student_id: number; room_id: number; allocation_date: string }): Promise<HostelAllocation> =>
    api.post('hostel/allocate/', data),

  // Get allocations
  getAllocations: (params?: any): Promise<ApiResponse<HostelAllocation[]>> =>
    api.get('hostel/allocations/', params),

  // Room change request
  requestRoomChange: (data: { current_room_id: number; requested_room_id: number; reason: string }): Promise<{ message: string }> =>
    api.post('hostel/room-change-request/', data),
};

export const libraryService = {
  // Get books
  getBooks: (params?: any): Promise<ApiResponse<Book[]>> =>
    api.get('library/books/', params),

  // Borrow book
  borrowBook: (data: { book_id: number; due_date: string }): Promise<BookBorrowRecord> =>
    api.post('library/borrow/', data),

  // Return book
  returnBook: (recordId: number, data: { return_date: string; condition?: string }): Promise<BookBorrowRecord> =>
    api.patch(`library/borrow/${recordId}/return/`, data),

  // Get borrow records
  getBorrowRecords: (params?: any): Promise<ApiResponse<BookBorrowRecord[]>> =>
    api.get('library/borrow/', params),
};

export const notificationService = {
  // Get notices
  getNotices: (params?: any): Promise<ApiResponse<Notice[]>> =>
    api.get('notifications/notices/', params),

  // Create notice (admin)
  createNotice: (data: Partial<Notice>): Promise<Notice> =>
    api.post('notifications/notices/', data),

  // Get user notifications
  getUserNotifications: (params?: any): Promise<ApiResponse<UserNotification[]>> =>
    api.get('notifications/user-notifications/', params),

  // Mark notification as read
  markAsRead: (id: number): Promise<UserNotification> =>
    api.patch(`notifications/user-notifications/${id}/`, { is_read: true }),
};

export const dashboardService = {
  // Get dashboard stats
  getStats: (): Promise<DashboardStats> =>
    api.get('dashboard/stats/'),

  // Get student dashboard data
  getStudentDashboard: (studentId: number): Promise<any> =>
    api.get(`dashboard/student/${studentId}/`),

  // Get parent dashboard data
  getParentDashboard: (parentId: number): Promise<any> =>
    api.get(`dashboard/parent/${parentId}/`),

  // Get faculty dashboard data
  getFacultyDashboard: (facultyId: number): Promise<any> =>
    api.get(`dashboard/faculty/${facultyId}/`),

  // Get admin dashboard data
  getAdminDashboard: (): Promise<any> =>
    api.get('dashboard/admin/'),

  // Get warden dashboard data
  getWardenDashboard: (): Promise<any> =>
    api.get('dashboard/warden/'),
};