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
    
    // Store parent session data
    localStorage.setItem('parent_access_token', response.access_token);
    localStorage.setItem('parent_data', JSON.stringify(response.parent));
    localStorage.setItem('parent_student_data', JSON.stringify(response.student));
    localStorage.setItem('parent_session_expires', response.expires_at.toString());
    
    return response;
  },

  // Logout parent
  logout: async (): Promise<void> => {
    const accessToken = localStorage.getItem('parent_access_token');
    if (accessToken) {
      try {
        await api.post('users/auth/parent/logout/', { access_token: accessToken });
      } catch (error) {
        console.error('Parent logout error:', error);
      }
    }
    
    // Clear parent session data
    localStorage.removeItem('parent_access_token');
    localStorage.removeItem('parent_data');
    localStorage.removeItem('parent_student_data');
    localStorage.removeItem('parent_session_expires');
  },

  // Verify session
  verifySession: async (): Promise<ParentSessionResponse> => {
    const accessToken = localStorage.getItem('parent_access_token');
    console.log("Verifying session with token:", accessToken);
    
    if (!accessToken) {
      return { valid: false, error: 'No access token' };
    }

    try {
      // Use axios directly to avoid interference from the regular auth interceptor
      const response = await axios.get(`${BASE_URL}users/auth/parent/verify-session/`, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log("Session verification successful:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Session verification failed:", error.response?.data || error.message);
      // Clear invalid session
      parentAuthService.logout();
      return { valid: false, error: 'Session invalid' };
    }
  },

  // Check if parent is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('parent_access_token');
    const expires = localStorage.getItem('parent_session_expires');
    
    console.log("Parent auth check - token:", token ? "present" : "missing");
    console.log("Parent auth check - expires:", expires);
    
    if (!token || !expires) {
      console.log("Missing token or expires");
      return false;
    }
    
    // Check if session has expired
    const expiresAt = parseInt(expires);
    const now = Math.floor(Date.now() / 1000);
    
    console.log("Expires at:", expiresAt, "Now:", now, "Expired:", now >= expiresAt);
    
    if (now >= expiresAt) {
      // Clear expired session
      console.log("Session expired, clearing");
      parentAuthService.logout();
      return false;
    }
    
    console.log("Parent is authenticated");
    return true;
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