// Django API client for Acharya Education Management System
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post('/auth/login/', credentials),
  logout: () => apiClient.post('/auth/logout/'),
  me: () => apiClient.get('/auth/me/'),
};

export const schoolsAPI = {
  list: () => apiClient.get('/schools/'),
  get: (id: string) => apiClient.get(`/schools/${id}/`),
  create: (data: any) => apiClient.post('/schools/', data),
  update: (id: string, data: any) => apiClient.put(`/schools/${id}/`, data),
  delete: (id: string) => apiClient.delete(`/schools/${id}/`),
};

export const usersAPI = {
  list: () => apiClient.get('/users/'),
  get: (id: string) => apiClient.get(`/users/${id}/`),
  create: (data: any) => apiClient.post('/users/', data),
  update: (id: string, data: any) => apiClient.put(`/users/${id}/`, data),
  delete: (id: string) => apiClient.delete(`/users/${id}/`),
};

export const studentsAPI = {
  list: () => apiClient.get('/students/'),
  get: (id: string) => apiClient.get(`/students/${id}/`),
  attendance: (id: string) => apiClient.get(`/students/${id}/attendance/`),
  grades: (id: string) => apiClient.get(`/students/${id}/grades/`),
  fees: (id: string) => apiClient.get(`/students/${id}/fees/`),
};

export const attendanceAPI = {
  list: () => apiClient.get('/attendance/'),
  create: (data: any) => apiClient.post('/attendance/', data),
  update: (id: string, data: any) => apiClient.put(`/attendance/${id}/`, data),
  markAttendance: (sessionId: string, data: any) => 
    apiClient.post(`/attendance/sessions/${sessionId}/mark/`, data),
};

export const feesAPI = {
  list: () => apiClient.get('/fees/'),
  structures: () => apiClient.get('/fees/structures/'),
  invoices: () => apiClient.get('/fees/invoices/'),
  payments: () => apiClient.get('/fees/payments/'),
  pay: (invoiceId: string, data: any) => 
    apiClient.post(`/fees/invoices/${invoiceId}/pay/`, data),
};

export const libraryAPI = {
  books: () => apiClient.get('/library/books/'),
  borrow: (data: any) => apiClient.post('/library/borrow/', data),
  return: (recordId: string) => apiClient.post(`/library/return/${recordId}/`),
  history: (studentId: string) => apiClient.get(`/library/history/${studentId}/`),
};

export const examsAPI = {
  list: () => apiClient.get('/exams/'),
  results: (examId: string) => apiClient.get(`/exams/${examId}/results/`),
  create: (data: any) => apiClient.post('/exams/', data),
  updateResult: (resultId: string, data: any) => 
    apiClient.put(`/exams/results/${resultId}/`, data),
};

export const notificationsAPI = {
  list: () => apiClient.get('/notifications/'),
  create: (data: any) => apiClient.post('/notifications/', data),
  markRead: (id: string) => apiClient.post(`/notifications/${id}/read/`),
  markAllRead: () => apiClient.post('/notifications/mark-all-read/'),
};

export const hostelAPI = {
  blocks: () => apiClient.get('/hostel/blocks/'),
  rooms: () => apiClient.get('/hostel/rooms/'),
  allocations: () => apiClient.get('/hostel/allocations/'),
  complaints: () => apiClient.get('/hostel/complaints/'),
  createComplaint: (data: any) => apiClient.post('/hostel/complaints/', data),
};

export const admissionsAPI = {
  list: () => apiClient.get('/admissions/'),
  create: (data: any) => apiClient.post('/admissions/', data),
  update: (id: string, data: any) => apiClient.put(`/admissions/${id}/`, data),
  review: (id: string, data: any) => apiClient.post(`/admissions/${id}/review/`, data),
};

export const reportsAPI = {
  attendance: (params: any) => apiClient.get('/reports/attendance/', { params }),
  academic: (params: any) => apiClient.get('/reports/academic/', { params }),
  financial: (params: any) => apiClient.get('/reports/financial/', { params }),
  export: (type: string, params: any) => 
    apiClient.get(`/reports/export/${type}/`, { params, responseType: 'blob' }),
};

export default apiClient;