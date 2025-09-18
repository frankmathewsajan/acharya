import { 
  LoginCredentials, 
  AuthResponse, 
  User, 
  StudentProfile, 
  ParentProfile, 
  StaffProfile,
  ApiResponse,
  ParentAuthResponse,
  ParentOTPRequest,
  ParentSessionResponse
} from './types';
import { api, BASE_URL } from './client';
import axios from 'axios';

export const authService = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('users/auth/login/', credentials);
    
    // Store tokens and user info
    localStorage.setItem('access_token', response.access);
    localStorage.setItem('refresh_token', response.refresh);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    return response;
  },

  // Logout user
  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await api.post('users/auth/logout/', { refresh: refreshToken });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    // Clear local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser: async (): Promise<{ user: User; profile: any }> => {
    return api.get('users/auth/me/');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token');
  },

  // Get user from localStorage
  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Refresh token
  refreshToken: async (): Promise<{ access: string }> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await api.post<{ access: string }>('users/auth/refresh/', {
      refresh: refreshToken,
    });
    
    localStorage.setItem('access_token', response.access);
    return response;
  },
};

export const parentAuthService = {
  // Request OTP for parent login
  requestOTP: async (email: string): Promise<ParentOTPRequest> => {
    return api.post('users/auth/parent/request-otp/', { email });
  },

  // Verify OTP and get access token
  verifyOTP: async (email: string, otp: string): Promise<ParentAuthResponse> => {
    const response = await api.post<ParentAuthResponse>('users/auth/parent/verify-otp/', { email, otp });
    
    // Store JWT tokens using the same keys as regular authentication
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    localStorage.setItem('parent_data', JSON.stringify(response.parent));
    localStorage.setItem('parent_student_data', JSON.stringify(response.student));
    localStorage.setItem('user_role', 'parent'); // Mark as parent user
    
    return response;
  },

  // Logout parent
  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await api.post('users/auth/parent/logout/', { refresh_token: refreshToken });
      } catch (error) {
        console.error('Parent logout error:', error);
      }
    }
    
    // Clear all session data (same as regular logout)
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('parent_data');
    localStorage.removeItem('parent_student_data');
    localStorage.removeItem('user_role');
  },

  // Verify session
  verifySession: async (): Promise<ParentSessionResponse> => {
    const accessToken = localStorage.getItem('access_token');
    const userRole = localStorage.getItem('user_role');
    
    if (!accessToken || userRole !== 'parent') {
      return { valid: false, error: 'No parent session found' };
    }

    try {
      // Use the same endpoint as regular authentication
      const response = await api.get<{ user: User; profile: any }>(`users/auth/me/`);
      
      if (response.user.role === 'parent' && response.profile) {
        return {
          valid: true,
          parent: {
            id: response.profile.id,
            name: response.profile.full_name,
            relationship: response.profile.relationship,
            email: response.profile.email,
            is_primary_contact: response.profile.is_primary_contact,
          },
          student: response.profile.student ? {
            id: response.profile.student.id,
            name: response.profile.student.full_name,
            admission_number: response.profile.student.admission_number,
            course: response.profile.student.course,
            school: response.profile.student.school?.school_name,
          } : null,
        };
      } else {
        return { valid: false, error: 'Not a parent user' };
      }
    } catch (error: any) {
      console.error("Session verification failed:", error.response?.data || error.message);
      // Clear invalid session
      parentAuthService.logout();
      return { valid: false, error: 'Session invalid' };
    }
  },

  // Check if parent is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('access_token');
    const userRole = localStorage.getItem('user_role');
    
    return !!(token && userRole === 'parent');
  },

  // Get stored parent data
  getStoredParentData: (): any => {
    const parentStr = localStorage.getItem('parent_data');
    return parentStr ? JSON.parse(parentStr) : null;
  },

  // Get stored student data
  getStoredStudentData: (): any => {
    const studentStr = localStorage.getItem('parent_student_data');
    return studentStr ? JSON.parse(studentStr) : null;
  },

  // Legacy methods for backward compatibility
  requestOTPLegacy: async (admission_number: string, phone_number: string): Promise<any> => {
    return api.post('users/auth/parent/request-otp-legacy/', { admission_number, phone_number });
  },

  verifyOTPLegacy: async (admission_number: string, phone_number: string, otp: string): Promise<any> => {
    return api.post('users/auth/parent/verify-otp-legacy/', { admission_number, phone_number, otp });
  },
};

export const parentDashboardService = {
  // Get parent dashboard overview
  getDashboardOverview: async (): Promise<any> => {
    const accessToken = localStorage.getItem('parent_access_token');
    return api.get('users/parent/dashboard/', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  },

  // Get student attendance details
  getAttendance: async (days: number = 30): Promise<any> => {
    const accessToken = localStorage.getItem('parent_access_token');
    return api.get(`users/parent/attendance/?days=${days}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  },

  // Get student exam results
  getResults: async (): Promise<any> => {
    const accessToken = localStorage.getItem('parent_access_token');
    return api.get('users/parent/results/', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  },

  // Get fee details and payment history
  getFees: async (): Promise<any> => {
    const accessToken = localStorage.getItem('parent_access_token');
    return api.get('users/parent/fees/', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  },

  // Get notices for parents and students
  getNotices: async (priority?: string): Promise<any> => {
    const accessToken = localStorage.getItem('parent_access_token');
    const url = priority ? `users/parent/notices/?priority=${priority}` : 'users/parent/notices/';
    return api.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  },
};

export const userService = {
  // Get all students
  getStudents: (params?: any): Promise<ApiResponse<StudentProfile[]>> =>
    api.get('users/students/', params),

  // Get student by ID
  getStudent: (id: number): Promise<StudentProfile> =>
    api.get(`users/students/${id}/`),

  // Create student
  createStudent: (data: Partial<StudentProfile>): Promise<StudentProfile> =>
    api.post('users/students/', data),

  // Update student
  updateStudent: (id: number, data: Partial<StudentProfile>): Promise<StudentProfile> =>
    api.patch(`users/students/${id}/`, data),

  // Get all parents
  getParents: (params?: any): Promise<ApiResponse<ParentProfile[]>> =>
    api.get('users/parents/', params),

  // Get parent by ID
  getParent: (id: number): Promise<ParentProfile> =>
    api.get(`users/parents/${id}/`),

  // Get all staff
  getStaff: (params?: any): Promise<ApiResponse<StaffProfile[]>> =>
    api.get('users/staff/', params),

  // Get staff by ID
  getStaffMember: (id: number): Promise<StaffProfile> =>
    api.get(`users/staff/${id}/`),
};