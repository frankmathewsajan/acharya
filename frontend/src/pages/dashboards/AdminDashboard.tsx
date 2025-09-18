import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import EnhancedDashboardLayout from "@/components/EnhancedDashboardLayout";
import { 
  Settings, 
  Users, 
  BarChart3, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  TrendingUp,
  Building,
  Calendar,
  Bell,
  Shield,
  Database,
  Clock,
  GraduationCap,
  BookOpen,
  CreditCard,
  UserCheck,
  School,
  Home,
  DollarSign,
  Activity,
  UserPlus,
  FileX,
  AlertTriangle,
  Loader2,
  Eye,
  UserX,
  RefreshCw,
  Building2
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { adminAPI, SchoolStats, Student, Teacher, Staff, UserData, AdmissionApplication } from "@/services/adminAPI";
import { HostelAPI, HostelBlock, HostelRoom, HostelBed, HostelAllocation, HostelComplaint, HostelLeaveRequest, StaffMember } from "@/services/hostelAPI";

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [allocationSuccess, setAllocationSuccess] = useState<{
    show: boolean;
    username: string;
    email: string;
    admissionNumber: string;
  }>({ show: false, username: '', email: '', admissionNumber: '' });
  
  // User management states
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  // Handle user ID allocation - moved outside renderAdmissionsTab for global access
  const handleAllocateUserId = async (decisionId: number) => {
    try {
      setLoading(true);
      const response = await adminAPI.allocateStudentUserId(decisionId);
      
      if (response.success) {
        // Show success message with user details
        setAllocationSuccess({
          show: true,
          username: response.data.username,
          email: response.data.email,
          admissionNumber: response.data.admission_number
        });
        
        // Refresh admissions data to show updated status
        const updatedAdmissions = await adminAPI.getSchoolAdmissions();
        setAdmissionsData(updatedAdmissions);
        
        // Also refresh unified dashboard data
        const unifiedData = await adminAPI.getAdminDashboardData();
        setUnifiedDashboardData(unifiedData);
      } else {
        setError(response.message || 'Failed to allocate user ID');
      }
    } catch (error) {
      console.error('Error allocating user ID:', error);
      setError('Failed to allocate user ID');
    } finally {
      setLoading(false);
    }
  };

  // Real data states
  const [schoolStats, setSchoolStats] = useState<SchoolStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalStaff: 0,
    totalWardens: 0,
    activeParents: 0,
    totalClasses: 0,
    currentSemester: "N/A",
    school: {
      name: "Loading...",
      code: "N/A",
      email: "N/A",
      phone: "N/A",
      address: "N/A"
    }
  });
  
  const [studentsData, setStudentsData] = useState<Student[]>([]);
  const [teachersData, setTeachersData] = useState<Teacher[]>([]);
  const [staffData, setStaffData] = useState<Staff[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [admissionsData, setAdmissionsData] = useState<AdmissionApplication[]>([]);
  const [feesData, setFeesData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [examsData, setExamsData] = useState<any[]>([]);
  
  // Unified dashboard data from /dashboard/admin/ endpoint
  const [unifiedDashboardData, setUnifiedDashboardData] = useState<any>(null);

  // Hostel management states
  const [hostelBlocks, setHostelBlocks] = useState<HostelBlock[]>([]);
  const [hostelRooms, setHostelRooms] = useState<HostelRoom[]>([]);
  const [hostelBeds, setHostelBeds] = useState<HostelBed[]>([]);
  const [hostelAllocations, setHostelAllocations] = useState<HostelAllocation[]>([]);
  const [hostelComplaints, setHostelComplaints] = useState<HostelComplaint[]>([]);
  const [hostelLeaveRequests, setHostelLeaveRequests] = useState<HostelLeaveRequest[]>([]);
  const [hostelStats, setHostelStats] = useState<any>(null);
  const [availableStaff, setAvailableStaff] = useState<StaffMember[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<HostelBlock | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  // Document viewing handler
  const handleViewDocument = async (documentPath: string, documentName: string) => {
    try {
      // Create a download URL for the document
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const documentUrl = `${baseUrl}/media/${documentPath}`;
      
      // Open in new tab or download
      window.open(documentUrl, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      // You might want to show a toast notification here
    }
  };

  // Decision update handler
  const handleDecisionUpdate = async (
    applicationId: number, 
    schoolId: number, 
    decisionId: number | null, 
    status: string, 
    notes?: string
  ) => {
    try {
      if (decisionId === null || decisionId === 0) {
        // Need to create a new decision
        await adminAPI.createAdmissionDecision(applicationId, schoolId, status, notes);
      } else {
        // Update existing decision
        await adminAPI.updateAdmissionDecision(decisionId, status, notes);
      }
      
      // Reload admissions data
      const updatedAdmissions = await adminAPI.getSchoolAdmissions();
      setAdmissionsData(updatedAdmissions);
    } catch (error) {
      console.error('Error updating admission decision:', error);
      // You might want to show a toast notification here
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load all data concurrently
        const [
          stats,
          students,
          teachers,
          staff,
          users,
          admissions,
          fees,
          attendance,
          exams,
          hostelDashboardStats
        ] = await Promise.all([
          adminAPI.getSchoolStats(),
          adminAPI.getStudents(),
          adminAPI.getTeachers(),
          adminAPI.getStaff(),
          adminAPI.getAllUsers(),
          adminAPI.getSchoolAdmissions(),
          adminAPI.getFeesData(),
          adminAPI.getAttendanceData(),
          adminAPI.getExamsData(),
          HostelAPI.getHostelDashboardStats()
        ]);

        setSchoolStats(stats);
        setStudentsData(students);
        setTeachersData(teachers);
        setStaffData(staff);
        setAllUsers(users);
        setAdmissionsData(admissions);
        setFeesData(fees);
        setAttendanceData(attendance);
        setExamsData(exams);
        setHostelStats(hostelDashboardStats);

      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard data loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Load unified dashboard data specifically for admissions management
  useEffect(() => {
    const loadUnifiedDashboard = async () => {
      try {
        const unifiedData = await adminAPI.getAdminDashboardData();
        setUnifiedDashboardData(unifiedData);
        console.log('Unified dashboard data loaded:', unifiedData);
      } catch (err) {
        console.error('Failed to load unified dashboard data:', err);
      }
    };

    loadUnifiedDashboard();
  }, []);

  const sidebarItems = [
    { id: "overview", label: "School Overview", icon: Building },
    { id: "students", label: "Students", icon: GraduationCap },
    { id: "teachers", label: "Teachers", icon: Users },
    { id: "staff", label: "Staff", icon: UserCheck },
    { id: "wardens", label: "Wardens", icon: Home },
    { id: "hostel", label: "Hostel Management", icon: Building2 },
    { id: "admissions", label: "Review Admissions", icon: UserPlus },
    { id: "fees", label: "Fees & Payments", icon: CreditCard },
    { id: "attendance", label: "Attendance", icon: Calendar },
    { id: "exams", label: "Examinations", icon: BookOpen },
    { id: "users", label: "User Management", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  const sidebarContent = (
    <div className="space-y-2">
      {sidebarItems.map((item) => (
        <Button
          key={item.id}
          variant={activeTab === item.id ? "default" : "ghost"}
          className="w-full justify-start gap-2"
          onClick={() => setActiveTab(item.id)}
        >
          <item.icon className="h-4 w-4" />
          <span className="sidebar-label">{item.label}</span>
        </Button>
      ))}
    </div>
  );

  const filterData = (data: any[], type: string) => {
    let filtered = data;
    
    if (searchTerm) {
      if (type === "admissions") {
        // Custom search for admissions data
        filtered = filtered.filter(item => 
          item.applicant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.reference_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.course_applied?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.first_preference_school?.school_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.second_preference_school?.school_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.third_preference_school?.school_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      } else {
        // Generic search for other data types
        filtered = filtered.filter(item => 
          Object.values(item).some(value => 
            value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      }
    }
    
    if (filterClass !== "all" && type === "students") {
      filtered = filtered.filter(item => item.course === filterClass);
    }
    
    if (filterStatus !== "all") {
      if (type === "admissions") {
        // Custom status filtering for admissions
        filtered = filtered.filter(item => {
          // Check if student is enrolled anywhere
          const enrolledDecision = item.school_decisions?.find(
            (decision: any) => decision.enrollment_status === 'enrolled'
          );
          
          if (filterStatus === "enrolled" && enrolledDecision) {
            return true;
          }
          
          // Check for accepted status
          const acceptedDecisions = item.school_decisions?.filter(
            (decision: any) => decision.decision === 'accepted'
          ) || [];
          
          if (filterStatus === "approved" && acceptedDecisions.length > 0) {
            return true;
          }
          
          // Check for rejected status
          const rejectedDecisions = item.school_decisions?.filter(
            (decision: any) => decision.decision === 'rejected'
          ) || [];
          
          if (filterStatus === "rejected" && rejectedDecisions.length > 0 && rejectedDecisions.length === item.school_decisions?.length) {
            return true;
          }
          
          // Check for pending status
          if (filterStatus === "pending" && (!item.school_decisions || item.school_decisions.length === 0 || 
              item.school_decisions.some((decision: any) => !decision.decision || decision.decision === 'pending'))) {
            return true;
          }
          
          return false;
        });
      } else {
        // Generic status filtering for other data types
        filtered = filtered.filter(item => 
          item.status?.toLowerCase() === filterStatus.toLowerCase() ||
          item.is_active?.toString() === filterStatus
        );
      }
    }
    
    return filtered;
  };

  const renderFilters = (showClassFilter = false) => (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="flex-1 min-w-[200px]">
        <Label htmlFor="search">Search</Label>
        <Input
          id="search"
          placeholder="Search by name, email, or any field..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {showClassFilter && (
        <div className="min-w-[150px]">
          <Label htmlFor="class">Course/Class</Label>
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {/* Dynamically populate based on available courses */}
              <SelectItem value="10th">10th Standard</SelectItem>
              <SelectItem value="11th">11th Standard</SelectItem>
              <SelectItem value="12th">12th Standard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="min-w-[150px]">
        <Label htmlFor="status">Status</Label>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Enhanced overall status for modal
  const getOverallApplicationStatus = (application: any) => {
    // Check if student is enrolled anywhere
    const enrolledDecision = application.school_decisions?.find(
      (decision: any) => decision.enrollment_status === 'enrolled'
    );
    
    if (enrolledDecision) {
      const schoolName = typeof enrolledDecision.school === 'object' 
        ? enrolledDecision.school.school_name 
        : 'Unknown School';
      return {
        status: 'Enrolled',
        variant: 'default' as const,
        className: 'bg-blue-600 text-white',
        details: `Enrolled at ${schoolName}`
      };
    }
    
    // Check if student has any acceptances
    const acceptedDecisions = application.school_decisions?.filter(
      (decision: any) => decision.decision === 'accepted'
    ) || [];
    
    if (acceptedDecisions.length > 0) {
      return {
        status: 'Accepted',
        variant: 'default' as const,
        className: 'bg-green-500 text-white',
        details: `Accepted by ${acceptedDecisions.length} school(s)`
      };
    }
    
    // Check if all decisions are rejected
    const rejectedDecisions = application.school_decisions?.filter(
      (decision: any) => decision.decision === 'rejected'
    ) || [];
    
    if (rejectedDecisions.length > 0 && rejectedDecisions.length === application.school_decisions?.length) {
      return {
        status: 'Rejected',
        variant: 'destructive' as const,
        className: '',
        details: 'Rejected by all schools'
      };
    }
    
    return {
      status: 'Pending',
      variant: 'secondary' as const,
      className: '',
      details: 'Under review'
    };
  };

  // Loading state
  if (loading) {
    return (
      <EnhancedDashboardLayout
        title="Management Dashboard - Loading..."
        user={user}
        profile={profile}
        sidebarContent={sidebarContent}
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-lg">Loading dashboard data...</span>
        </div>
      </EnhancedDashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <EnhancedDashboardLayout
        title="Management Dashboard - Error"
        user={user}
        profile={profile}
        sidebarContent={sidebarContent}
      >
        <div className="flex items-center justify-center h-64">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <span className="ml-2 text-lg text-red-500">{error}</span>
        </div>
      </EnhancedDashboardLayout>
    );
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* School Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            School Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-lg">{schoolStats.school.name}</h3>
              <p className="text-muted-foreground">School Code: {schoolStats.school.code}</p>
              <p className="text-muted-foreground">Email: {schoolStats.school.email}</p>
              <p className="text-muted-foreground">Phone: {schoolStats.school.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Address:</p>
              <p className="text-sm">{schoolStats.school.address}</p>
              <p className="text-sm font-medium mt-2">Current Semester: {schoolStats.currentSemester}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{schoolStats.totalStudents}</p>
                <p className="text-sm text-muted-foreground">Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{schoolStats.totalTeachers}</p>
                <p className="text-sm text-muted-foreground">Teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{schoolStats.totalStaff}</p>
                <p className="text-sm text-muted-foreground">Staff</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{schoolStats.totalWardens}</p>
                <p className="text-sm text-muted-foreground">Wardens</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{schoolStats.totalClasses}</p>
                <p className="text-sm text-muted-foreground">Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-2xl font-bold">{allUsers.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="w-2 h-2 rounded-full mt-2 bg-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">System running normally</p>
                <p className="text-xs text-muted-foreground">All services operational</p>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
            
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="w-2 h-2 rounded-full mt-2 bg-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Dashboard loaded successfully</p>
                <p className="text-xs text-muted-foreground">Connected to backend API</p>
              </div>
              <Badge variant="secondary">Connected</Badge>
            </div>
            
            {studentsData.length === 0 && (
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="w-2 h-2 rounded-full mt-2 bg-yellow-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">No student data found</p>
                  <p className="text-xs text-muted-foreground">Add students to see data</p>
                </div>
                <Badge variant="secondary">Empty</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStudentsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Student Management</h2>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add New Student
        </Button>
      </div>
      
      {renderFilters(true)}
      
      <Card>
        <CardHeader>
          <CardTitle>All Students ({filterData(studentsData, "students").length})</CardTitle>
        </CardHeader>
        <CardContent>
          {studentsData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No students found. Add students to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admission No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filterData(studentsData, "students").map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.admission_number || 'N/A'}</TableCell>
                    <TableCell>{`${student.user?.first_name || ''} ${student.user?.last_name || ''}`.trim() || 'N/A'}</TableCell>
                    <TableCell>{student.user?.email || 'N/A'}</TableCell>
                    <TableCell>{student.course || 'N/A'}</TableCell>
                    <TableCell>{student.batch || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                        {student.status || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowStudentModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowStudentModal(true);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderTeachersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Teacher Management</h2>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add New Teacher
        </Button>
      </div>
      
      {renderFilters()}
      
      <Card>
        <CardHeader>
          <CardTitle>All Teachers ({filterData(teachersData, "teachers").length})</CardTitle>
        </CardHeader>
        <CardContent>
          {teachersData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No teachers found. Add teachers to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filterData(teachersData, "teachers").map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">
                      {`${teacher.user?.first_name || ''} ${teacher.user?.last_name || ''}`.trim() || 'N/A'}
                    </TableCell>
                    <TableCell>{teacher.user?.email || 'N/A'}</TableCell>
                    <TableCell>{teacher.department || 'N/A'}</TableCell>
                    <TableCell>{teacher.designation || 'N/A'}</TableCell>
                    <TableCell>{teacher.experience_years ? `${teacher.experience_years} years` : 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={teacher.status === 'active' ? 'default' : 'secondary'}>
                        {teacher.status || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">View</Button>
                        <Button size="sm" variant="outline">Edit</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderUsersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add New User
        </Button>
      </div>
      
      {renderFilters()}
      
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filterData(allUsers, "users").length})</CardTitle>
        </CardHeader>
        <CardContent>
          {allUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No users found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filterData(allUsers, "users").map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A'}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderAdmissionsTab = () => {
    // Use unified dashboard data if available, fallback to old data
    const dashboardData = unifiedDashboardData;
    const filteredAdmissions = filterData(admissionsData, "admissions");

    const getEnrollmentBadge = (enrollmentStatus: string) => {
      if (!enrollmentStatus) {
        return <Badge variant="secondary">Not Enrolled</Badge>;
      }
      
      switch (enrollmentStatus.toUpperCase()) {
        case 'ENROLLED':
          return <Badge variant="default" className="bg-green-500 text-white">Enrolled</Badge>;
        case 'WITHDRAWN':
          return <Badge variant="destructive">Withdrawn</Badge>;
        case 'NOT_ENROLLED':
          return <Badge variant="secondary">Not Enrolled</Badge>;
        default:
          return <Badge variant="outline">{enrollmentStatus}</Badge>;
      }
    };

    const getStatusBadge = (status: string) => {
      if (!status) {
        return <Badge variant="secondary">Pending</Badge>;
      }
      
      const statusLower = status.toLowerCase();
      switch (statusLower) {
        case 'pending':
          return <Badge variant="secondary">Pending</Badge>;
        case 'approved':
        case 'accepted':
          return <Badge variant="default" className="bg-green-500 text-white">Accepted</Badge>;
        case 'rejected':
          return <Badge variant="destructive">Rejected</Badge>;
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    };

    // Enhanced status badge that considers enrollment status
    const getEnhancedStatusBadge = (application: any, currentUserSchoolId?: number) => {
      // Check if student is enrolled in any school
      const enrolledDecision = application.school_decisions?.find(
        (decision: any) => decision.enrollment_status === 'enrolled'
      );
      
      if (enrolledDecision) {
        const enrolledSchoolId = typeof enrolledDecision.school === 'object' 
          ? enrolledDecision.school.id 
          : enrolledDecision.school;
          
        if (enrolledSchoolId === currentUserSchoolId) {
          // Student is enrolled in current user's school
          return <Badge variant="default" className="bg-blue-600 text-white">Enrolled</Badge>;
        } else {
          // Student is enrolled in a different school - make it look disabled
          const schoolName = typeof enrolledDecision.school === 'object' 
            ? enrolledDecision.school.school_name 
            : 'Another School';
          return <Badge variant="secondary" className="bg-gray-100 text-gray-500 border-gray-300 opacity-75">Enrolled Elsewhere</Badge>;
        }
      }
      
      // No enrollment - check decision for current school
      const schoolDecision = application.school_decisions?.find(
        (decision: any) => {
          const decisionSchoolId = typeof decision.school === 'object' 
            ? decision.school.id 
            : decision.school;
          return decisionSchoolId === currentUserSchoolId;
        }
      );
      
      if (schoolDecision) {
        return getStatusBadge(schoolDecision.decision || 'pending');
      }
      
      return <Badge variant="secondary">Pending</Badge>;
    };

    // Payment status badge
    const getPaymentStatusBadge = (paymentStatus: string) => {
      switch (paymentStatus) {
        case 'finalized':
          return <Badge variant="default" className="bg-green-500 text-white">Finalized</Badge>;
        case 'pending':
          return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
        case 'not_applicable':
          return <Badge variant="outline" className="text-gray-500">N/A</Badge>;
        default:
          return <Badge variant="outline">{paymentStatus}</Badge>;
      }
    };

    // User ID status badge
    const getUserIdStatusBadge = (userIdStatus: string) => {
      switch (userIdStatus) {
        case 'allocated':
          return <Badge variant="default" className="bg-blue-500 text-white">Allocated</Badge>;
        case 'pending':
          return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Pending</Badge>;
        case 'not_applicable':
          return <Badge variant="outline" className="text-gray-500">N/A</Badge>;
        default:
          return <Badge variant="outline">{userIdStatus}</Badge>;
      }
    };

    return (
      <div className="space-y-6">
        {/* Statistics Cards */}
        {dashboardData?.data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Total Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.data.statistics?.total_applications || 0}</div>
                <p className="text-xs text-muted-foreground">all time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Pending Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{dashboardData.data.statistics?.pending_applications || 0}</div>
                <p className="text-xs text-muted-foreground">need attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Enrolled Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{dashboardData.data.statistics?.enrolled_students || 0}</div>
                <p className="text-xs text-muted-foreground">currently enrolled</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <UserX className="h-4 w-4 mr-2" />
                  Withdrawn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{dashboardData.data.statistics?.withdrawn_students || 0}</div>
                <p className="text-xs text-muted-foreground">withdrew enrollment</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Admissions Management</h2>
          <div className="flex gap-3">
            <Button 
              onClick={async () => {
                setLoading(true);
                try {
                  const updatedAdmissions = await adminAPI.getSchoolAdmissions();
                  setAdmissionsData(updatedAdmissions);
                  const unifiedData = await adminAPI.getAdminDashboardData();
                  setUnifiedDashboardData(unifiedData);
                } catch (error) {
                  console.error('Error reloading data:', error);
                  setError('Failed to reload application data');
                } finally {
                  setLoading(false);
                }
              }}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload
            </Button>
            <Input
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="enrolled">Enrolled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Recent Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Latest admission applications with current status</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading applications...</span>
              </div>
            ) : dashboardData?.data?.recent_applications?.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference ID</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>First Preference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enrollment</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.data.recent_applications.map((app: any) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.reference_id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{app.applicant_name}</div>
                          <div className="text-sm text-gray-500">{app.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{app.course_applied}</TableCell>
                      <TableCell className="text-sm">{app.first_preference_school}</TableCell>
                      <TableCell>
                        {app.school_decisions ? 
                          getEnhancedStatusBadge(app, user?.school?.id) : 
                          getStatusBadge(app.status)
                        }
                      </TableCell>
                      <TableCell>
                        {getEnrollmentBadge(app.enrollment_status)}
                        {app.enrolled_school && (
                          <div className="text-xs text-gray-500 mt-1">
                            at {app.enrolled_school}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getPaymentStatusBadge(app.payment_status)}
                      </TableCell>
                      <TableCell>
                        {getUserIdStatusBadge(app.user_id_status)}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : filteredAdmissions.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex flex-col items-center gap-4">
                  <UserPlus className="h-12 w-12 text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-semibold">No Applications Found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || filterStatus !== "all" 
                        ? "No applications match your current filters." 
                        : "No admission applications have been submitted yet."}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Fallback to old admissions data structure
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference ID</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>DOB</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmissions.map((application) => {
                    // Find the school decision for this school
                    const schoolDecision = application.school_decisions?.find(
                      decision => {
                        // Handle both object and ID comparisons
                        const decisionSchoolId = typeof decision.school === 'object' 
                          ? decision.school.id 
                          : decision.school;
                        const userSchoolId = user?.school?.id;
                        
                        console.log('Debug application:', {
                          appId: application.id,
                          appRef: application.reference_id,
                          schoolDecisions: application.school_decisions,
                          currentUserSchoolId: userSchoolId,
                          decision,
                          decisionSchoolId,
                          matches: decisionSchoolId === userSchoolId
                        });
                        
                        return decisionSchoolId === userSchoolId;
                      }
                    );
                    
                    console.log('Final schoolDecision for', application.reference_id, ':', schoolDecision);
                    
                    return (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">{application.reference_id}</TableCell>
                        <TableCell>{application.applicant_name}</TableCell>
                        <TableCell>{application.email}</TableCell>
                        <TableCell>{application.phone_number}</TableCell>
                        <TableCell>
                          {application.date_of_birth 
                            ? new Date(application.date_of_birth).toLocaleDateString() 
                            : 'Not provided'
                          }
                        </TableCell>
                        <TableCell>
                          {getEnhancedStatusBadge(application, user?.school?.id)}
                        </TableCell>
                        <TableCell>
                          {application.application_date 
                            ? new Date(application.application_date).toLocaleDateString() 
                            : 'Not submitted'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedApplication(application);
                                setShowDetailsModal(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                            
                            {/* Show buttons based on current decision status */}
                            {!schoolDecision ? (
                              // No decision yet - show both Accept and Reject
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-green-500 hover:bg-green-600"
                                  onClick={() => {
                                    handleDecisionUpdate(
                                      application.id,
                                      user?.school?.id || 0,
                                      null,
                                      'accepted'
                                    );
                                  }}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    handleDecisionUpdate(
                                      application.id,
                                      user?.school?.id || 0,
                                      null,
                                      'rejected'
                                    );
                                  }}
                                >
                                  Reject
                                </Button>
                              </>
                            ) : schoolDecision.decision === 'pending' ? (
                              // Pending decision - show both Accept and Reject
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-green-500 hover:bg-green-600"
                                  onClick={() => {
                                    handleDecisionUpdate(
                                      application.id,
                                      user?.school?.id || 0,
                                      schoolDecision.id,
                                      'accepted'
                                    );
                                  }}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    handleDecisionUpdate(
                                      application.id,
                                      user?.school?.id || 0,
                                      schoolDecision.id,
                                      'rejected'
                                    );
                                  }}
                                >
                                  Reject
                                </Button>
                              </>
                            ) : schoolDecision.decision === 'accepted' ? (
                              // Already accepted - check if enrolled
                              (() => {
                                // Check if student is enrolled anywhere
                                const enrolledDecision = application.school_decisions?.find(
                                  (decision: any) => decision.enrollment_status === 'enrolled'
                                );
                                
                                if (enrolledDecision) {
                                  // Student is enrolled - show user ID allocation button if needed
                                  return schoolDecision.user_id_allocated ? (
                                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                                      User ID Allocated
                                    </Badge>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="bg-blue-600 hover:bg-blue-700"
                                      onClick={() => handleAllocateUserId(schoolDecision.id)}
                                    >
                                      <UserPlus className="h-4 w-4 mr-1" />
                                      Allot User ID
                                    </Button>
                                  );
                                } else {
                                  // Not enrolled yet - show reject option
                                  return (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => {
                                        handleDecisionUpdate(
                                          application.id,
                                          user?.school?.id || 0,
                                          schoolDecision.id,
                                          'rejected'
                                        );
                                      }}
                                    >
                                      Change to Reject
                                    </Button>
                                  );
                                }
                              })()
                            
                            ) : schoolDecision.decision === 'rejected' ? (
                              // Already rejected - show only Accept option
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-500 hover:bg-green-600"
                                onClick={() => {
                                  handleDecisionUpdate(
                                    application.id,
                                    user?.school?.id || 0,
                                    schoolDecision.id,
                                    'accepted'
                                  );
                                }}
                              >
                                Change to Accept
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pending Reviews and Actions Table */}
        {dashboardData?.data?.pending_reviews?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Reviews & Actions</CardTitle>
              <CardDescription>Applications awaiting review and enrolled students needing user ID allocation</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference ID</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Preference</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Applied Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.data.pending_reviews.map((review: any) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">{review.reference_id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{review.applicant_name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{review.school_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{review.preference_order}</Badge>
                      </TableCell>
                      <TableCell>{review.course_applied}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(review.application_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {review.action_type === 'allocate_user_id' ? (
                          <Badge variant="default" className="bg-blue-100 text-blue-800">
                            Needs User ID
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Pending Review
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {review.action_type === 'allocate_user_id' ? (
                            /* Student is enrolled and needs user ID allocation */
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleAllocateUserId(review.id)}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Allot User ID
                            </Button>
                          ) : (
                            /* Normal pending review - show Accept/Reject */
                            <>
                              <Button size="sm" variant="default">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Accept
                              </Button>
                              <Button size="sm" variant="destructive">
                                <UserX className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* User ID Allocation Pending Table */}
        {dashboardData?.data?.allocation_pending?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                User ID Allocation Required
              </CardTitle>
              <CardDescription>Students with finalized payments ready for user ID allocation</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference ID</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Enrollment Date</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.data.allocation_pending.map((student: any) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.reference_id}</TableCell>
                      <TableCell>
                        <div className="font-medium">{student.applicant_name}</div>
                      </TableCell>
                      <TableCell className="text-sm">{student.school_name}</TableCell>
                      <TableCell>{student.course_applied}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(student.enrollment_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {student.payment_completed_at ? new Date(student.payment_completed_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="default" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleAllocateUserId(student.id)}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Allot User ID
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderFeesTab = () => {
    // Use real fees data from the backend
    const feesDataFromAPI = feesData as any;
    const enrollmentFees = feesDataFromAPI?.enrollment_fees || [];
    const statistics = feesDataFromAPI?.statistics || {
      total_expected: 0,
      total_collected: 0,
      pending_amount: 0,
      collection_rate: 0,
      total_students: 0,
      paid_students: 0
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Fees & Payments</h2>
        </div>

        {/* Fee Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Total Expected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(statistics.total_expected)}</div>
              <p className="text-xs text-muted-foreground">from {statistics.total_students} students</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Fees Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(statistics.total_collected)}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.paid_students} payments completed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Pending Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(statistics.pending_amount)}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.total_students - statistics.paid_students} pending
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Collection Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(statistics.collection_rate)}%
              </div>
              <p className="text-xs text-muted-foreground">of expected fees</p>
            </CardContent>
          </Card>
        </div>

        {/* Fee Details Table */}
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Fee Details</CardTitle>
            <CardDescription>Fee status for all enrolled students</CardDescription>
          </CardHeader>
          <CardContent>
            {enrollmentFees.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex flex-col items-center gap-4">
                  <CreditCard className="h-12 w-12 text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-semibold">No Enrolled Students</h3>
                    <p className="text-muted-foreground">
                      Fee information will appear here when students are enrolled
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference ID</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Fee Amount</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollmentFees.map((fee: any) => (
                    <TableRow key={fee.application_id}>
                      <TableCell className="font-medium">{fee.reference_id}</TableCell>
                      <TableCell>{fee.student_name}</TableCell>
                      <TableCell>{fee.school_name}</TableCell>
                      <TableCell>{fee.course}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {fee.category === 'general' ? 'General' : 'SC/ST/OBC/SBC'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(fee.fee_amount)}
                      </TableCell>
                      <TableCell>
                        {fee.payment_status === 'completed' ? (
                          <Badge variant="default" className="bg-green-500 text-white">
                            Paid
                          </Badge>
                        ) : fee.payment_status === 'pending' ? (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            Pending
                          </Badge>
                        ) : fee.payment_status === 'failed' ? (
                          <Badge variant="destructive">
                            Failed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            Not Initiated
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {fee.payment_completed_at 
                          ? new Date(fee.payment_completed_at).toLocaleDateString()
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        {fee.payment_reference || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Fee Structure Reference */}
        {feesDataFromAPI?.fee_structures && feesDataFromAPI.fee_structures.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Fee Structure Reference</CardTitle>
              <CardDescription>Current admission fee structure by class and category</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class Range</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Minimum Fee</TableHead>
                    <TableHead>Maximum Fee</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feesDataFromAPI.fee_structures.map((structure: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{structure.class_range}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {structure.category === 'general' ? 'General' : 'SC/ST/OBC/SBC'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(structure.annual_fee_min)}</TableCell>
                      <TableCell>
                        {structure.annual_fee_max 
                          ? formatCurrency(structure.annual_fee_max) 
                          : formatCurrency(structure.annual_fee_min)
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Load hostel data
  const loadHostelData = async () => {
    try {
      const [blocks, rooms, beds, allocations, complaints, leaveRequests, staff] = await Promise.all([
        HostelAPI.getBlocks({ is_active: true }),
        HostelAPI.getRooms(),
        HostelAPI.getBeds(),
        HostelAPI.getAllocations(),
        HostelAPI.getComplaints(),
        HostelAPI.getLeaveRequests(),
        HostelAPI.getStaffMembers()
      ]);

      setHostelBlocks(blocks);
      setHostelRooms(rooms);
      setHostelBeds(beds);
      setHostelAllocations(allocations);
      setHostelComplaints(complaints);
      setHostelLeaveRequests(leaveRequests);
      setAvailableStaff(staff);
    } catch (error) {
      console.error('Error loading hostel data:', error);
    }
  };

  // Handle warden assignment
  const handleAssignWarden = async (blockId: number, staffId: number) => {
    try {
      await HostelAPI.updateBlock(blockId, { warden: staffId });
      await loadHostelData();
      setSelectedBlock(null);
      setShowBlockModal(false);
    } catch (error) {
      console.error('Error assigning warden:', error);
    }
  };

  // Handle bed allocation
  const handleAllocateBed = async (studentId: number, bedId: number) => {
    try {
      await HostelAPI.allocateBed({ student_id: studentId, bed_id: bedId });
      await loadHostelData();
      setShowAllocationModal(false);
    } catch (error) {
      console.error('Error allocating bed:', error);
    }
  };

  // Handle complaint assignment
  const handleAssignComplaint = async (complaintId: number, staffId: number) => {
    try {
      await HostelAPI.assignComplaint(complaintId, staffId);
      await loadHostelData();
    } catch (error) {
      console.error('Error assigning complaint:', error);
    }
  };

  // Handle leave request approval
  const handleApproveLeaveRequest = async (requestId: number, notes?: string) => {
    try {
      await HostelAPI.approveLeaveRequest(requestId, notes);
      await loadHostelData();
    } catch (error) {
      console.error('Error approving leave request:', error);
    }
  };

  // Handle leave request rejection
  const handleRejectLeaveRequest = async (requestId: number, notes?: string) => {
    try {
      await HostelAPI.rejectLeaveRequest(requestId, notes);
      await loadHostelData();
    } catch (error) {
      console.error('Error rejecting leave request:', error);
    }
  };

  // Render hostel management tab
  const renderHostelTab = () => {
    const [activeHostelTab, setActiveHostelTab] = useState("overview");

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Hostel Management</h2>
          <Button onClick={loadHostelData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        {/* Hostel Stats Overview */}
        {hostelStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Blocks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hostelStats.total_blocks}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Beds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hostelStats.total_beds}</div>
                <p className="text-xs text-muted-foreground">
                  {hostelStats.occupied_beds} occupied, {hostelStats.available_beds} available
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Occupancy Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hostelStats.occupancy_rate.toFixed(1)}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pending Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span>Complaints:</span>
                    <span className="font-bold">{hostelStats.pending_complaints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Leave Requests:</span>
                    <span className="font-bold">{hostelStats.pending_leave_requests}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Hostel Tab Navigation */}
        <div className="border-b">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "overview", label: "Overview" },
              { id: "blocks", label: "Blocks & Rooms" },
              { id: "allocations", label: "Allocations" },
              { id: "complaints", label: "Complaints" },
              { id: "leaves", label: "Leave Requests" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveHostelTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeHostelTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Hostel Tab Content */}
        {activeHostelTab === "overview" && renderHostelOverview()}
        {activeHostelTab === "blocks" && renderHostelBlocks()}
        {activeHostelTab === "allocations" && renderHostelAllocations()}
        {activeHostelTab === "complaints" && renderHostelComplaints()}
        {activeHostelTab === "leaves" && renderHostelLeaves()}
      </div>
    );
  };

  // Render hostel overview
  const renderHostelOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Recent Allocations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {hostelStats?.recent_allocations?.map((allocation: HostelAllocation) => (
              <div key={allocation.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{allocation.student_name}</div>
                  <div className="text-sm text-gray-600">
                    {allocation.block_name} - Room {allocation.room_number} - Bed {allocation.bed_number}
                  </div>
                </div>
                <Badge variant={allocation.status === 'active' ? 'default' : 'secondary'}>
                  {allocation.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Complaints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {hostelStats?.recent_complaints?.map((complaint: HostelComplaint) => (
              <div key={complaint.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{complaint.title}</div>
                  <div className="text-sm text-gray-600">
                    {complaint.student_name} - {complaint.category}
                  </div>
                </div>
                <Badge variant={
                  complaint.priority === 'urgent' ? 'destructive' :
                  complaint.priority === 'high' ? 'default' : 'secondary'
                }>
                  {complaint.priority}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render hostel blocks management
  const renderHostelBlocks = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Hostel Blocks</h3>
        <Button onClick={() => setShowBlockModal(true)}>
          <Building2 className="h-4 w-4 mr-2" />
          Add Block
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hostelBlocks.map((block) => (
          <Card key={block.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{block.name}</CardTitle>
                <Badge variant={block.is_active ? 'default' : 'secondary'}>
                  {block.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <CardDescription>{block.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Warden:</span>
                  <span className="font-medium">
                    {block.warden_name || (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedBlock(block);
                          setShowBlockModal(true);
                        }}
                      >
                        Assign Warden
                      </Button>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Rooms:</span>
                  <span className="font-medium">{block.total_rooms}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Beds:</span>
                  <span className="font-medium">{block.total_beds}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Warden Assignment Modal */}
      <Dialog open={showBlockModal} onOpenChange={setShowBlockModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedBlock ? `Assign Warden to ${selectedBlock.name}` : 'Create New Block'}
            </DialogTitle>
            <DialogDescription>
              {selectedBlock ? 'Select a staff member to assign as warden for this block.' : 'Create a new hostel block.'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBlock ? (
            <div className="space-y-4">
              <Label>Select Staff Member</Label>
              <Select onValueChange={(value) => handleAssignWarden(selectedBlock.id, parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a staff member" />
                </SelectTrigger>
                <SelectContent>
                  {availableStaff.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id.toString()}>
                      {staff.user.full_name} - {staff.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="text-center p-4">
              <p>Block creation form would go here</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  // Render hostel allocations
  const renderHostelAllocations = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Hostel Allocations</h3>
        <Button onClick={() => setShowAllocationModal(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          New Allocation
        </Button>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Block</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Bed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Allocation Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hostelAllocations.map((allocation) => (
                <TableRow key={allocation.id}>
                  <TableCell>{allocation.student_name}</TableCell>
                  <TableCell>{allocation.block_name}</TableCell>
                  <TableCell>{allocation.room_number}</TableCell>
                  <TableCell>{allocation.bed_number}</TableCell>
                  <TableCell>
                    <Badge variant={allocation.status === 'active' ? 'default' : 'secondary'}>
                      {allocation.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(allocation.allocation_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {allocation.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => HostelAPI.endAllocation(allocation.id)}
                      >
                        End Allocation
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  // Render hostel complaints
  const renderHostelComplaints = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Hostel Complaints</h3>
      
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hostelComplaints.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell>{complaint.title}</TableCell>
                  <TableCell>{complaint.student_name}</TableCell>
                  <TableCell>{complaint.category}</TableCell>
                  <TableCell>
                    <Badge variant={
                      complaint.priority === 'urgent' ? 'destructive' :
                      complaint.priority === 'high' ? 'default' : 'secondary'
                    }>
                      {complaint.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      complaint.status === 'resolved' ? 'default' :
                      complaint.status === 'in_progress' ? 'secondary' : 'outline'
                    }>
                      {complaint.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{complaint.assigned_to_name || 'Unassigned'}</TableCell>
                  <TableCell>
                    {complaint.status === 'open' && (
                      <Select onValueChange={(value) => handleAssignComplaint(complaint.id, parseInt(value))}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Assign" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStaff.map((staff) => (
                            <SelectItem key={staff.id} value={staff.id.toString()}>
                              {staff.user.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  // Render hostel leave requests
  const renderHostelLeaves = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Leave Requests</h3>
      
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hostelLeaveRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.student_name}</TableCell>
                  <TableCell>{request.leave_type}</TableCell>
                  <TableCell>{new Date(request.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(request.end_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={
                      request.status === 'approved' ? 'default' :
                      request.status === 'rejected' ? 'destructive' : 'secondary'
                    }>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveLeaveRequest(request.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectLeaveRequest(request.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  // Other tabs with empty data states
  const renderEmptyTab = (title: string, description: string) => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{title}</h2>
      <Card>
        <CardContent className="text-center py-16">
          <div className="flex flex-col items-center gap-4">
            <Database className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No Data Available</h3>
              <p className="text-muted-foreground">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverviewTab();
      case "students":
        return renderStudentsTab();
      case "teachers":
        return renderTeachersTab();
      case "users":
        return renderUsersTab();
      case "admissions":
        return renderAdmissionsTab();
      case "staff":
        return renderEmptyTab("Staff Management", "Staff data will be displayed here when available.");
      case "wardens":
        return renderEmptyTab("Warden Management", "Warden data will be displayed here when available.");
      case "hostel":
        return renderHostelTab();
      case "fees":
        return renderFeesTab();
      case "attendance":
        return renderEmptyTab("Attendance Management", "Attendance data will be displayed here when available.");
      case "exams":
        return renderEmptyTab("Examination Management", "Exam data will be displayed here when available.");
      case "analytics":
        return renderEmptyTab("Analytics", "Analytics data will be displayed here when available.");
      case "reports":
        return renderEmptyTab("Reports", "Reports will be displayed here when available.");
      case "settings":
        return renderEmptyTab("Settings", "System settings will be displayed here when available.");
      default:
        return renderOverviewTab();
    }
  };

  return (
    <EnhancedDashboardLayout
      title={`Management Dashboard - ${schoolStats.school.name}`}
      user={user}
      profile={profile}
      sidebarContent={sidebarContent}
    >
      {renderTabContent()}
      
      {/* Application Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Complete application information for review
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-2">
              {/* Quick Actions Bar */}
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-lg">{selectedApplication.applicant_name}</h3>
                  <p className="text-sm text-gray-600">Reference: {selectedApplication.reference_id}</p>
                </div>
                <div className="flex gap-2">
                  {(() => {
                    const schoolDecision = selectedApplication.school_decisions?.find(
                      decision => {
                        const decisionSchoolId = typeof decision.school === 'object' 
                          ? decision.school.id 
                          : decision.school;
                        return decisionSchoolId === user?.school?.id;
                      }
                    );
                    
                    if (!schoolDecision || schoolDecision.decision === 'pending') {
                      // No decision or pending - show Accept and Reject
                      return (
                        <>
                          <Button
                            variant="default"
                            size="lg"
                            className="bg-green-500 hover:bg-green-600 text-white"
                            onClick={() => {
                              handleDecisionUpdate(
                                selectedApplication.id,
                                user?.school?.id || 0,
                                schoolDecision?.id || null,
                                'accepted'
                              );
                              setShowDetailsModal(false);
                            }}
                          >
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Accept Application
                          </Button>
                          <Button
                            variant="destructive"
                            size="lg"
                            onClick={() => {
                              handleDecisionUpdate(
                                selectedApplication.id,
                                user?.school?.id || 0,
                                schoolDecision?.id || null,
                                'rejected'
                              );
                              setShowDetailsModal(false);
                            }}
                          >
                            <AlertCircle className="h-5 w-5 mr-2" />
                            Reject Application
                          </Button>
                        </>
                      );
                    } else if (schoolDecision.decision === 'accepted') {
                      // Already accepted - check if enrolled before allowing rejection
                      const enrolledDecision = selectedApplication.school_decisions?.find(
                        (decision: any) => decision.enrollment_status === 'enrolled'
                      );
                      
                      if (enrolledDecision) {
                        // Student is enrolled - show status and user ID allocation
                        return (
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-green-500 text-white text-base px-3 py-1">
                              ✅ ENROLLED
                            </Badge>
                            {schoolDecision.user_id_allocated ? (
                              <Badge variant="default" className="bg-blue-100 text-blue-800 text-base px-3 py-1">
                                User ID Allocated
                              </Badge>
                            ) : (
                              <Button
                                variant="default"
                                size="lg"
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => {
                                  handleAllocateUserId(schoolDecision.id);
                                  setShowDetailsModal(false);
                                }}
                              >
                                <UserPlus className="h-5 w-5 mr-2" />
                                Allot User ID
                              </Button>
                            )}
                          </div>
                        );
                      } else {
                        // Not enrolled yet - show accept status and reject option
                        return (
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-green-500 text-white text-base px-3 py-1">
                              ✅ ACCEPTED
                            </Badge>
                            <Button
                              variant="destructive"
                              size="lg"
                              onClick={() => {
                                handleDecisionUpdate(
                                  selectedApplication.id,
                                  user?.school?.id || 0,
                                  schoolDecision.id,
                                  'rejected'
                                );
                                setShowDetailsModal(false);
                              }}
                            >
                              <AlertCircle className="h-5 w-5 mr-2" />
                              Change to Reject
                            </Button>
                          </div>
                        );
                      }
                    } else if (schoolDecision.decision === 'rejected') {
                      // Already rejected - show status and option to accept
                      return (
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-base px-3 py-1">
                            ❌ REJECTED
                          </Badge>
                          <Button
                            variant="default"
                            size="lg"
                            className="bg-green-500 hover:bg-green-600 text-white"
                            onClick={() => {
                              handleDecisionUpdate(
                                selectedApplication.id,
                                user?.school?.id || 0,
                                schoolDecision.id,
                                'accepted'
                              );
                              setShowDetailsModal(false);
                            }}
                          >
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Change to Accept
                          </Button>
                        </div>
                      );
                    } else {
                      // Unknown status
                      return (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            Status: {schoolDecision.decision || 'Unknown'}
                          </Badge>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Compact Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Personal Information */}
                <Card>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-sm">Personal Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs">
                    <div>
                      <Label className="font-medium text-gray-500">Email</Label>
                      <p>{selectedApplication.email}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">Phone</Label>
                      <p>{selectedApplication.phone_number}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">DOB</Label>
                      <p>{selectedApplication.date_of_birth ? new Date(selectedApplication.date_of_birth).toLocaleDateString() : 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">Category</Label>
                      <p>{selectedApplication.category}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Academic Information */}
                <Card>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-sm">Academic Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs">
                    <div>
                      <Label className="font-medium text-gray-500">Course</Label>
                      <p>{selectedApplication.course_applied}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">Previous School</Label>
                      <p>{selectedApplication.previous_school || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">Last %</Label>
                      <p>{selectedApplication.last_percentage || 'Not provided'}%</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Father Information */}
                <Card>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-sm">Father Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs">
                    <div>
                      <Label className="font-medium text-gray-500">Name</Label>
                      <p>{selectedApplication.father_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">Phone</Label>
                      <p>{selectedApplication.father_phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">Occupation</Label>
                      <p>{selectedApplication.father_occupation || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">Email</Label>
                      <p>{selectedApplication.father_email || 'Not provided'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Mother Information */}
                <Card>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-sm">Mother Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs">
                    <div>
                      <Label className="font-medium text-gray-500">Name</Label>
                      <p>{selectedApplication.mother_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">Phone</Label>
                      <p>{selectedApplication.mother_phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">Occupation</Label>
                      <p>{selectedApplication.mother_occupation || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">Email</Label>
                      <p>{selectedApplication.mother_email || 'Not provided'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Guardian and Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Guardian Information */}
                {(selectedApplication.guardian_name || selectedApplication.guardian_phone) && (
                  <Card>
                    <CardHeader className="pb-1">
                      <CardTitle className="text-sm">Guardian Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-xs">
                      <div>
                        <Label className="font-medium text-gray-500">Name</Label>
                        <p>{selectedApplication.guardian_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="font-medium text-gray-500">Relationship</Label>
                        <p>{selectedApplication.guardian_relationship || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="font-medium text-gray-500">Phone</Label>
                        <p>{selectedApplication.guardian_phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="font-medium text-gray-500">Occupation</Label>
                        <p>{selectedApplication.guardian_occupation || 'Not provided'}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* School Preferences */}
                <Card>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-sm">School Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs">
                    <div>
                      <Label className="font-medium text-gray-500">1st Choice</Label>
                      <p>{selectedApplication.first_preference_school?.school_name || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">2nd Choice</Label>
                      <p>{selectedApplication.second_preference_school?.school_name || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">3rd Choice</Label>
                      <p>{selectedApplication.third_preference_school?.school_name || 'Not specified'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact & Emergency Info */}
                <Card>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-sm">Contact Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs">
                    <div>
                      <Label className="font-medium text-gray-500">Primary Contact</Label>
                      <p>{selectedApplication.primary_contact || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">Emergency Contact</Label>
                      <p>{selectedApplication.emergency_contact_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">Emergency Phone</Label>
                      <p>{selectedApplication.emergency_contact_phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">Address</Label>
                      <p className="truncate">{selectedApplication.address}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Documents Section */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Uploaded Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedApplication.documents && Object.keys(selectedApplication.documents).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(selectedApplication.documents).map(([key, value]) => {
                        // Extract filename from path
                        const fullPath = value as string;
                        const filename = fullPath.split('/').pop() || fullPath;
                        const documentNumber = key.replace(/_/g, ' ').toUpperCase();
                        
                        return (
                          <div key={key} className="flex items-center justify-between p-2 border rounded text-sm">
                            <div>
                              <Label className="font-medium text-xs">{documentNumber}</Label>
                              <p className="text-xs text-gray-600 truncate">{filename}</p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewDocument(fullPath, key)}
                              className="h-8 px-2"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No documents uploaded</p>
                  )}
                </CardContent>
              </Card>

              {/* Application Status and School Decisions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Application Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <Label className="font-medium text-xs text-gray-500">Application Date</Label>
                      <p>{selectedApplication.application_date ? new Date(selectedApplication.application_date).toLocaleDateString() : 'Not available'}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-xs text-gray-500">Overall Status</Label>
                      {(() => {
                        const overallStatus = getOverallApplicationStatus(selectedApplication);
                        return (
                          <div className="flex flex-col gap-1">
                            <Badge variant={overallStatus.variant} className={overallStatus.className}>
                              {overallStatus.status}
                            </Badge>
                            <p className="text-xs text-gray-600">{overallStatus.details}</p>
                          </div>
                        );
                      })()}
                    </div>
                    <div>
                      <Label className="font-medium text-xs text-gray-500">Review Comments</Label>
                      <p className="text-xs">{selectedApplication.review_comments || 'No comments yet'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* School Decisions */}
                {selectedApplication.school_decisions && selectedApplication.school_decisions.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">School Decisions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedApplication.school_decisions.map((decision, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                            <div>
                              <Label className="font-medium text-xs">
                                {typeof decision.school === 'object' && decision.school ? (decision.school as any).school_name : decision.school}
                              </Label>
                              <p className="text-xs text-gray-600">Preference: {decision.preference_order}</p>
                              {decision.review_comments && (
                                <p className="text-xs text-gray-600">Comments: {decision.review_comments}</p>
                              )}
                            </div>
                            <Badge variant={decision.decision === 'accepted' ? 'default' : decision.decision === 'rejected' ? 'destructive' : 'secondary'}>
                              {(decision.decision || 'pending')?.charAt(0).toUpperCase() + (decision.decision || 'pending')?.slice(1)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* User Details Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              User information and account details
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <Label className="font-medium text-gray-500">Full Name</Label>
                      <p>{`${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">Email</Label>
                      <p>{selectedUser.email}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">Role</Label>
                      <p>{selectedUser.role}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">Status</Label>
                      <Badge variant={selectedUser.is_active ? 'default' : 'secondary'}>
                        {selectedUser.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Account Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <Label className="font-medium text-gray-500">User ID</Label>
                      <p>{selectedUser.id}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">Username</Label>
                      <p>{selectedUser.username || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">Created</Label>
                      <p>{new Date(selectedUser.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">Last Updated</Label>
                      <p>{new Date(selectedUser.updated_at || selectedUser.created_at).toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowUserModal(false)}>
                  Close
                </Button>
                <Button onClick={() => setShowUserModal(false)}>
                  Edit User
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Student Details Modal */}
      <Dialog open={showStudentModal} onOpenChange={setShowStudentModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              Student information and academic details
            </DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <Label className="font-medium text-gray-500">Full Name</Label>
                      <p>{`${selectedStudent.user?.first_name || ''} ${selectedStudent.user?.last_name || ''}`.trim() || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">Email</Label>
                      <p>{selectedStudent.user?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">Admission Number</Label>
                      <p>{selectedStudent.admission_number || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">Status</Label>
                      <Badge variant={selectedStudent.status === 'active' ? 'default' : 'secondary'}>
                        {selectedStudent.status || 'Unknown'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Academic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <Label className="font-medium text-gray-500">Course</Label>
                      <p>{selectedStudent.course || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">Batch</Label>
                      <p>{selectedStudent.batch || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">Enrollment Date</Label>
                      <p>{selectedStudent.enrollment_date ? new Date(selectedStudent.enrollment_date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-500">Student ID</Label>
                      <p>{selectedStudent.id}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowStudentModal(false)}>
                  Close
                </Button>
                <Button onClick={() => setShowStudentModal(false)}>
                  Edit Student
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* User ID Allocation Success Modal */}
      <Dialog open={allocationSuccess.show} onOpenChange={(open) => setAllocationSuccess(prev => ({ ...prev, show: open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              User ID Allocated Successfully!
            </DialogTitle>
            <DialogDescription>
              Student account has been created and credentials have been sent
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">Student Portal Access Created</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <Label className="text-green-700 font-medium">Admission Number:</Label>
                  <p className="text-green-800 font-mono">{allocationSuccess.admissionNumber}</p>
                </div>
                <div>
                  <Label className="text-green-700 font-medium">Username:</Label>
                  <p className="text-green-800 font-mono break-all">{allocationSuccess.username}</p>
                </div>
                <div>
                  <Label className="text-green-700 font-medium">Email:</Label>
                  <p className="text-green-800 font-mono break-all">{allocationSuccess.email}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="text-blue-800 font-medium mb-1">Password Information</p>
                  <p className="text-blue-700">
                    The student's login password has been sent to their email address. 
                    Please advise them to check their inbox and change the password 
                    after their first login for security.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="text-amber-800 font-medium mb-1">Next Steps</p>
                  <p className="text-amber-700">
                    The student can now use the student portal with their username and 
                    the password sent to their email. Remind them to change their 
                    password on first login.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button 
              onClick={() => setAllocationSuccess({ show: false, username: '', email: '', admissionNumber: '' })}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </EnhancedDashboardLayout>
  );
}