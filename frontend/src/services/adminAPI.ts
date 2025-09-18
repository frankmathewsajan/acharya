import { apiClient } from '@/lib/api/client';

export interface SchoolStats {
  totalStudents: number;
  totalTeachers: number;
  totalStaff: number;
  totalWardens: number;
  activeParents: number;
  totalClasses: number;
  currentSemester: string;
  school: {
    name: string;
    code: string;
    email: string;
    phone: string;
    address: string;
  };
}

export interface Student {
  id: number;
  admission_number: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
  course: string;
  batch: string;
  status: string;
  // Add other student fields as needed
}

export interface Teacher {
  id: number;
  user: {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
  department: string;
  designation: string;
  experience_years: number;
  status: string;
  // Add other teacher fields as needed
}

export interface Staff {
  id: number;
  user: {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
  role: string;
  employee_id: string;
  department: string;
  designation: string;
  date_of_joining: string;
  qualification: string;
  experience_years: number;
  status: string;
}

export interface UserData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface AdmissionApplication {
  id: number;
  reference_id: string;
  applicant_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  course_applied: string;
  first_preference_school?: any;
  second_preference_school?: any;
  third_preference_school?: any;
  address: string;
  category: string;
  previous_school?: string;
  last_percentage?: number;
  status: 'pending' | 'under_review' | 'accepted' | 'rejected';
  is_verified: boolean;
  application_date: string;
  school_decisions?: SchoolAdmissionDecision[];
  // Parent information
  father_name?: string;
  father_phone?: string;
  father_email?: string;
  father_occupation?: string;
  mother_name?: string;
  mother_phone?: string;
  mother_email?: string;
  mother_occupation?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_relationship?: string;
  guardian_occupation?: string;
  primary_contact?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  documents?: any;
}

export interface SchoolAdmissionDecision {
  id: number;
  school: any;
  preference_order: string;
  decision: 'pending' | 'accepted' | 'rejected' | 'waitlisted';
  decision_date?: string;
  review_comments?: string;
  enrollment_status: 'not_enrolled' | 'enrolled' | 'withdrawn';
  enrollment_date?: string;
  withdrawal_date?: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'waived';
  payment_reference?: string;
  payment_completed_at?: string;
  is_payment_finalized: boolean;
  user_id_allocated: boolean;
}

export interface CreateStaffData {
  first_name: string;
  last_name: string;
  phone_number: string;
  role: 'admin' | 'faculty' | 'librarian';
  employee_id: string;
  department: string;
  designation: string;
  date_of_joining: string;
  qualification?: string;
  experience_years?: number;
}

export const adminAPI = {
  // Get school-specific statistics for the logged-in admin
  getSchoolStats: async (): Promise<SchoolStats> => {
    try {
      const response = await apiClient.get('/schools/stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching school stats:', error);
      // Return default values if API fails
      return {
        totalStudents: 0,
        totalTeachers: 0,
        totalStaff: 0,
        totalWardens: 0,
        activeParents: 0,
        totalClasses: 0,
        currentSemester: "Academic Session 2024-25",
        school: {
          name: "Default School",
          code: "DEFAULT",
          email: "admin@school.edu",
          phone: "Not available",
          address: "Address not available"
        }
      };
    }
  },

  // Get comprehensive dashboard data for the school
  getDashboardData: async () => {
    try {
      const response = await apiClient.get('/schools/dashboard/');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return {
        students: [],
        teachers: [],
        staff: [],
        users: [],
        fees: [],
        attendance: [],
        exams: []
      };
    }
  },

  // Get unified admin dashboard data (new endpoint)
  getAdminDashboardData: async () => {
    try {
      const response = await apiClient.get('/dashboard/admin/');
      return response.data;
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      throw error;
    }
  },

  // Get all students
  getStudents: async (): Promise<Student[]> => {
    try {
      const response = await apiClient.get('/schools/dashboard/');
      return response.data.students || [];
    } catch (error) {
      console.error('Error fetching students:', error);
      return [];
    }
  },

  // Get all teachers/faculty
  getTeachers: async (): Promise<Teacher[]> => {
    try {
      // Try the direct staff endpoint first and filter for faculty
      try {
        const staffResponse = await apiClient.get('/users/staff/');
        if (staffResponse.data && staffResponse.data.length > 0) {
          return staffResponse.data
            .filter((staff: any) => staff.user?.role === 'faculty')
            .map((staff: any) => ({
              id: staff.id,
              user: staff.user,
              department: staff.department,
              designation: staff.designation,
              experience_years: staff.experience_years,
              status: staff.user?.is_active ? 'active' : 'inactive'
            }));
        }
      } catch (staffError) {
        console.log('Staff endpoint not available, using fallback');
      }
      
      // Fallback to dashboard endpoint
      const response = await apiClient.get('/schools/dashboard/');
      const dashboardData = response.data;
      
      console.log('Dashboard response for teachers:', dashboardData);
      
      // If we have teachers data from dashboard, use it
      if (dashboardData.teachers && dashboardData.teachers.length > 0) {
        return dashboardData.teachers.map((teacher: any) => ({
          id: teacher.id,
          user: teacher.user || {
            first_name: '',
            last_name: '',
            email: '',
            role: teacher.role
          },
          department: teacher.department || 'Not specified',
          designation: teacher.designation || 'Faculty',
          experience_years: teacher.experience_years || 0,
          status: teacher.status || 'active'
        }));
      }
      
      // If no teachers data but we have users, filter users by faculty role
      if (dashboardData.users && dashboardData.users.length > 0) {
        return dashboardData.users
          .filter((user: any) => user.role === 'faculty')
          .map((user: any) => ({
            id: user.id,
            user: {
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              role: user.role
            },
            department: 'Not specified',
            designation: 'Faculty',
            experience_years: 0,
            status: user.is_active ? 'active' : 'inactive'
          }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching teachers:', error);
      return [];
    }
  },

  // Get all staff
  getStaff: async (): Promise<Staff[]> => {
    try {
      // Try the direct staff endpoint first
      try {
        const staffResponse = await apiClient.get('/users/staff/');
        if (staffResponse.data && staffResponse.data.length > 0) {
          return staffResponse.data.map((staff: any) => ({
            id: staff.id,
            user: staff.user,
            role: staff.user?.role || 'staff',
            employee_id: staff.employee_id || '',
            department: staff.department || 'Not specified',
            designation: staff.designation || 'Staff',
            date_of_joining: staff.date_of_joining || '',
            qualification: staff.qualification || '',
            experience_years: staff.experience_years || 0,
            status: staff.user?.is_active ? 'active' : 'inactive'
          }));
        }
      } catch (staffError) {
        console.log('Staff endpoint not available, using fallback');
      }
      
      // Fallback to dashboard endpoint - get staff data and users data
      const response = await apiClient.get('/schools/dashboard/');
      const dashboardData = response.data;
      
      console.log('Dashboard response for staff:', dashboardData);
      
      // If we have staff data from dashboard, use it
      if (dashboardData.staff && dashboardData.staff.length > 0) {
        return dashboardData.staff.map((staff: any) => ({
          id: staff.id,
          user: staff.user || {
            first_name: '',
            last_name: '',
            email: '',
            role: staff.role
          },
          role: staff.role || staff.user?.role || 'staff',
          employee_id: '',
          department: staff.department || 'Not specified',
          designation: staff.designation || 'Staff',
          date_of_joining: '',
          qualification: '',
          experience_years: staff.experience_years || 0,
          status: staff.status || 'active'
        }));
      }
      
      // If no staff data but we have users, filter users by role
      if (dashboardData.users && dashboardData.users.length > 0) {
        return dashboardData.users
          .filter((user: any) => ['admin', 'faculty', 'librarian'].includes(user.role))
          .map((user: any) => ({
            id: user.id,
            user: {
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              role: user.role
            },
            role: user.role,
            employee_id: '',
            department: 'Not specified',
            designation: user.role.charAt(0).toUpperCase() + user.role.slice(1),
            date_of_joining: '',
            qualification: '',
            experience_years: 0,
            status: user.is_active ? 'active' : 'inactive'
          }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching staff:', error);
      return [];
    }
  },

  // Get all users for user management
  getAllUsers: async (): Promise<UserData[]> => {
    try {
      const response = await apiClient.get('/schools/dashboard/');
      return response.data.users || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  // Get fees data
  getFeesData: async () => {
    try {
      const response = await apiClient.get('/admissions/fees/');
      return response.data.data || {};
    } catch (error) {
      console.error('Error fetching fees data:', error);
      return {
        fee_structures: [],
        enrollment_fees: [],
        statistics: {
          total_expected: 0,
          total_collected: 0,
          pending_amount: 0,
          collection_rate: 0,
          total_students: 0,
          paid_students: 0
        }
      };
    }
  },

  // Get attendance data
  getAttendanceData: async () => {
    try {
      const response = await apiClient.get('/schools/dashboard/');
      return response.data.attendance || [];
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      return [];
    }
  },

  // Get exams data
  getExamsData: async () => {
    try {
      const response = await apiClient.get('/schools/dashboard/');
      return response.data.exams || [];
    } catch (error) {
      console.error('Error fetching exams data:', error);
      return [];
    }
  },

  // Get admissions for school review
  getSchoolAdmissions: async (): Promise<AdmissionApplication[]> => {
    try {
      const response = await apiClient.get('/admissions/school-review/');
      // Handle both direct array and wrapped response
      return Array.isArray(response.data) ? response.data : response.data.results || response.data.data || [];
    } catch (error) {
      console.error('Error fetching school admissions:', error);
      return [];
    }
  },

  // Update admission decision
  updateAdmissionDecision: async (decisionId: number, decision: string, notes?: string) => {
    try {
      const response = await apiClient.patch(`/admissions/school-decision/${decisionId}/`, {
        decision,  // Use 'decision' field to match backend model
        review_comments: notes
      });
      return response.data;
    } catch (error) {
      console.error('Error updating admission decision:', error);
      throw error;
    }
  },

  // Create new admission decision
  createAdmissionDecision: async (applicationId: number, schoolId: number, decision: string, notes?: string) => {
    try {
      const response = await apiClient.post('/admissions/school-decision/', {
        application_id: applicationId,
        school_id: schoolId,
        decision,  // Use 'decision' field to match backend model
        notes
      });
      return response.data;
    } catch (error) {
      console.error('Error creating admission decision:', error);
      throw error;
    }
  },

  // Allocate student user ID
  allocateStudentUserId: async (decisionId: number) => {
    try {
      const response = await apiClient.post('/admissions/allocate-user-id/', {
        decision_id: decisionId
      });
      return response.data;
    } catch (error) {
      console.error('Error allocating student user ID:', error);
      throw error;
    }
  },

  // Create new staff member
  createStaff: async (staffData: CreateStaffData) => {
    try {
      const response = await apiClient.post('/users/staff/', staffData);
      return response.data;
    } catch (error) {
      console.error('Error creating staff:', error);
      throw error;
    }
  }
};