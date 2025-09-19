import { useState, useEffect, useMemo } from "react";
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
  Building2,
  ArrowLeft,
  ArrowRight,
  Plus,
  X,
  Edit,
  Filter,
  Bed,
  ChevronLeft,
  ChevronRight,
  Key,
  Download,
  Copy
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { adminAPI, SchoolStats, Student, Teacher, Staff, UserData, AdmissionApplication } from "@/services/adminAPI";
import { HostelAPI, HostelBlock, HostelRoom, HostelBed, HostelAllocation, HostelComplaint, HostelLeaveRequest, StaffMember } from "@/services/hostelAPI";
import { libraryAPI, LibraryBook, UserBook, LibraryStats, LibraryTransaction, BookRequest } from "@/services/libraryAPI";
import { toast } from "@/hooks/use-toast";

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
        
        // Refresh students data to show the newly created student user
        const students = await adminAPI.getStudents();
        setStudentsData(students);
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
  const [allFeePayments, setAllFeePayments] = useState<any[]>([]);
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
  const [activeHostelTab, setActiveHostelTab] = useState("overview");

  // User management sub-tab state
  const [activeUserTab, setActiveUserTab] = useState("all");

  // Staff creation states
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [staffCreationStep, setStaffCreationStep] = useState(1);
  const [createStaffForm, setCreateStaffForm] = useState<{
    first_name: string;
    last_name: string;
    phone_number: string;
    role: 'admin' | 'faculty' | 'librarian';
    employee_id: string;
    department: string;
    designation: string;
    date_of_joining: string;
    qualification: string;
    experience_years: number;
  }>({
    first_name: '',
    last_name: '',
    phone_number: '',
    role: 'faculty',
    employee_id: '',
    department: '',
    designation: '',
    date_of_joining: '',
    qualification: '',
    experience_years: 0
  });
  const [createStaffLoading, setCreateStaffLoading] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [staffCredentials, setStaffCredentials] = useState<{
    email: string;
    password: string;
    staffName: string;
  } | null>(null);

  // Hostel management form states
  const [showCreateBlockModal, setShowCreateBlockModal] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [showCreateComplaintModal, setShowCreateComplaintModal] = useState(false);
  const [showCreateLeaveModal, setShowCreateLeaveModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<HostelRoom | null>(null);
  const [editingRoom, setEditingRoom] = useState<HostelRoom | null>(null);
  const [selectedAllocation, setSelectedAllocation] = useState<HostelAllocation | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<HostelComplaint | null>(null);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<HostelLeaveRequest | null>(null);
  
  // Form states for creating hostel entities
  const [blockForm, setBlockForm] = useState({
    name: '',
    description: '',
    total_rooms: 0,
    total_floors: 1,
    floor_config: [] as number[],
    warden: null as number | null
  });
  
  // State for block creation multi-step form
  const [blockCreationStep, setBlockCreationStep] = useState(1); // 1: basic info, 2: floor config, 3: confirmation
  const [tempFloorConfig, setTempFloorConfig] = useState<number[]>([]);
  
  const [roomForm, setRoomForm] = useState({
    room_number: '',
    room_type: '2_beds' as '1_bed' | '2_beds' | '3_beds' | '4_beds' | '5_beds' | '6_beds' | 'dormitory',
    ac_type: 'non_ac' as 'ac' | 'non_ac',
    capacity: 2,
    floor_number: 1,
    amenities: '',
    block: null as number | null
  });
  
  const [allocationForm, setAllocationForm] = useState({
    student_id: null as number | null,
    bed_id: null as number | null,
    allocation_date: new Date().toISOString().split('T')[0]
  });
  
  const [complaintForm, setComplaintForm] = useState({
    student: null as number | null,
    room: null as number | null,
    title: '',
    description: '',
    category: 'maintenance' as 'maintenance' | 'cleanliness' | 'food' | 'security' | 'other',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });
  
  const [leaveForm, setLeaveForm] = useState({
    student: null as number | null,
    leave_type: 'home' as 'home' | 'medical' | 'emergency' | 'personal' | 'academic' | 'other',
    start_date: '',
    end_date: '',
    expected_return_date: '',
    reason: '',
    emergency_contact: '',
    destination: ''
  });

  // Library management states
  const [libraryData, setLibraryData] = useState({
    books: [] as LibraryBook[],
    userBooks: [] as UserBook[],
    transactions: [] as LibraryTransaction[],
    stats: null as LibraryStats | null,
    analytics: null as any
  });
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryActiveTab, setLibraryActiveTab] = useState('books');
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [bookSearchResults, setBookSearchResults] = useState<LibraryBook[]>([]);
  const [searchingBooks, setSearchingBooks] = useState(false);
  
  const [addBookForm, setAddBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    publication_year: new Date().getFullYear(),
    description: '',
    category: '',
    total_copies: 1,
    shelf_location: '',
    price: ''
  });

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  // Room management states
  const [roomFilters, setRoomFilters] = useState({
    block: '',
    floor: '',
    room_type: '',
    ac_type: '',
    availability: '',
    search: ''
  });
  const [selectedRooms, setSelectedRooms] = useState<number[]>([]);
  const [showMassUpdateModal, setShowMassUpdateModal] = useState(false);
  const [showBedManagementModal, setShowBedManagementModal] = useState(false);
  const [selectedRoomForBeds, setSelectedRoomForBeds] = useState<HostelRoom | null>(null);
  const [massUpdateData, setMassUpdateData] = useState({
    room_type: '',
    ac_type: '',
    capacity: 0,
    amenities: '',
    is_available: true
  });
  const [bedManagementData, setBedManagementData] = useState({
    bed_count: 2,
    bed_type: 'single'
  });
  const [roomFilterOptions, setRoomFilterOptions] = useState<{
    blocks: Array<{id: number, name: string}>;
    floors: number[];
    room_types: Array<{value: string, label: string}>;
    ac_types: Array<{value: string, label: string}>;
  }>({
    blocks: [],
    floors: [],
    room_types: [],
    ac_types: []
  });
  
  // Pagination states for rooms
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // Show 12 rooms per page
  const [totalRooms, setTotalRooms] = useState(0); // Total count from backend
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // Server-side filtered and paginated rooms - no client-side filtering needed
  const [serverRoomsData, setServerRoomsData] = useState<{
    results: HostelRoom[];
    count: number;
    next: string | null;
    previous: string | null;
  }>({
    results: [],
    count: 0,
    next: null,
    previous: null
  });

  // Load rooms with server-side filtering and pagination (Django admin style)
  const loadRoomsWithFilters = async (page: number = 1) => {
    setIsLoadingRooms(true);
    try {
      const params: any = {
        page,
        page_size: itemsPerPage
      };

      // Add filters only if they have values (not empty strings)
      if (roomFilters.block && roomFilters.block !== 'all') {
        params.block = roomFilters.block;
      }
      if (roomFilters.floor && roomFilters.floor !== 'all') {
        params.floor = roomFilters.floor;
      }
      if (roomFilters.room_type && roomFilters.room_type !== 'all') {
        params.type = roomFilters.room_type;
      }
      if (roomFilters.ac_type && roomFilters.ac_type !== 'all') {
        params.ac_type = roomFilters.ac_type;
      }
      if (roomFilters.availability && roomFilters.availability !== 'all') {
        params.availability = roomFilters.availability;
      }
      if (roomFilters.search) {
        params.search = roomFilters.search;
      }

      const data = await HostelAPI.getRoomsPaginated(params);
      setServerRoomsData(data);
      setTotalRooms(data.count);
      
      // If current page is beyond available pages, reset to page 1
      const maxPages = Math.ceil(data.count / itemsPerPage);
      if (page > maxPages && maxPages > 0) {
        setCurrentPage(1);
        // Recursively call with page 1
        return loadRoomsWithFilters(1);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
      // Reset to default state on error
      setServerRoomsData({
        results: [],
        count: 0,
        next: null,
        previous: null
      });
      setTotalRooms(0);
      if (currentPage > 1) {
        setCurrentPage(1);
      }
    } finally {
      setIsLoadingRooms(false);
    }
  };

  // Load rooms when filters or page changes
  useEffect(() => {
    loadRoomsWithFilters(currentPage);
  }, [roomFilters, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [roomFilters]);

  // For backward compatibility, keep the old filteredRooms logic but use server data
  const filteredRooms = serverRoomsData.results;
  const paginatedRooms = serverRoomsData.results; // Already paginated from server

  // Calculate total pages from server data
  const totalPages = Math.ceil(serverRoomsData.count / itemsPerPage);

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

  // Staff creation handler
  const handleCreateStaff = async () => {
    console.log('🔧 DEBUG: handleCreateStaff called');
    console.log('🔧 DEBUG: Form data:', createStaffForm);
    
    try {
      setCreateStaffLoading(true);
      setError(null);
      
      console.log('🔧 DEBUG: About to call adminAPI.createStaff');

      const response = await adminAPI.createStaff(createStaffForm);
      
      console.log('🔧 DEBUG: API response received:', response);
      
      // Backend returns staff data on success (status 201)
      if (response) {
        console.log('🔧 DEBUG: Staff creation successful');
        
        // Reset form and close modal
        setCreateStaffForm({
          first_name: '',
          last_name: '',
          phone_number: '',
          role: 'faculty' as const,
          employee_id: '',
          department: '',
          designation: '',
          date_of_joining: '',
          qualification: '',
          experience_years: 0
        });
        setShowCreateStaffModal(false);
        setStaffCreationStep(1); // Reset step

        console.log('🔧 DEBUG: About to refresh data');
        
        // Refresh staff data
        const updatedStats = await adminAPI.getSchoolStats();
        setSchoolStats(updatedStats);
        const updatedStaff = await adminAPI.getStaff();
        setStaffData(updatedStaff);
        
        console.log('🔧 DEBUG: Data refreshed');
        
        // Show success toast with credentials info
        toast({
          title: "Staff Created Successfully!",
          description: `${createStaffForm.first_name} ${createStaffForm.last_name} has been added to your school staff.`,
          duration: 5000,
        });

        // Show credentials modal
        if (response.user_credentials) {
          console.log('🔧 DEBUG: Setting up credentials modal');
          setStaffCredentials({
            email: response.user_credentials.email,
            password: response.user_credentials.default_password,
            staffName: `${createStaffForm.first_name} ${createStaffForm.last_name}`
          });
          setShowCredentialsModal(true);
        }
      }
    } catch (error: any) {
      console.error('🔧 DEBUG: Error creating staff:', error);
      console.error('🔧 DEBUG: Error details:', error.response?.data);
      
      // Handle specific backend error messages
      if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError('Failed to create staff member. Please try again.');
      }
    } finally {
      setCreateStaffLoading(false);
      console.log('🔧 DEBUG: handleCreateStaff completed');
    }
  };

  // Hostel management handlers
  const handleCreateBlock = async () => {
    try {
      setLoading(true);
      setError(null);

      // Include school information from current user profile
      const blockData = {
        name: blockForm.name,
        description: blockForm.description,
        total_rooms: blockForm.total_rooms,
        total_floors: blockForm.total_floors,
        floor_config: blockForm.floor_config,
        warden: blockForm.warden,
        school: profile?.school?.id || null
      };

      console.log('Sending block data:', blockData);
      console.log('Profile data:', profile);

      const createdBlock = await HostelAPI.createBlock(blockData);
      
      // Reset form and close modal
      setBlockForm({
        name: '',
        description: '',
        total_rooms: 0,
        total_floors: 1,
        floor_config: [],
        warden: null
      });
      setBlockCreationStep(1);
      setTempFloorConfig([]);
      setShowCreateBlockModal(false);

      // Refresh hostel data
      await loadHostelData();
      
      toast({
        title: "Block Created Successfully!",
        description: `Hostel block "${blockForm.name}" has been created.`,
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error creating block:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create hostel block';
      setError(errorMessage);
      
      toast({
        title: "Error Creating Block",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Block creation step handlers
  const handleNextBlockStep = () => {
    if (blockCreationStep === 1) {
      // Moving from basic info to floor config
      if (!blockForm.name.trim()) {
        setError('Block name is required');
        return;
      }
      if (blockForm.total_floors < 1) {
        setError('Number of floors must be at least 1');
        return;
      }
      
      // Auto-generate floor config with 20 rooms per floor as default
      const defaultConfig = Array(blockForm.total_floors).fill(20);
      setTempFloorConfig(defaultConfig);
      setBlockCreationStep(2);
    } else if (blockCreationStep === 2) {
      // Moving from floor config to confirmation
      if (tempFloorConfig.some(rooms => rooms < 1)) {
        setError('Each floor must have at least 1 room');
        return;
      }
      
      const totalRooms = tempFloorConfig.reduce((sum, rooms) => sum + rooms, 0);
      setBlockForm(prev => ({ 
        ...prev, 
        total_rooms: totalRooms,
        floor_config: tempFloorConfig 
      }));
      setBlockCreationStep(3);
    }
    setError(null);
  };

  const handlePrevBlockStep = () => {
    if (blockCreationStep === 3) {
      setBlockCreationStep(2);
    } else if (blockCreationStep === 2) {
      setBlockCreationStep(1);
    }
    setError(null);
  };

  const handleFloorRoomsChange = (floorIndex: number, rooms: number) => {
    const newConfig = [...tempFloorConfig];
    newConfig[floorIndex] = Math.max(1, rooms);
    setTempFloorConfig(newConfig);
  };

  const getFloorName = (index: number) => {
    if (index === 0) return 'Ground Floor';
    const ordinals = ['', '1st', '2nd', '3rd'];
    return index <= 3 ? `${ordinals[index]} Floor` : `${index}th Floor`;
  };

  const handleCreateRoom = async () => {
    try {
      setLoading(true);
      setError(null);

      await HostelAPI.createRoom(roomForm);
      
      // Reset form and close modal
      setRoomForm({
        room_number: '',
        room_type: '2_beds',
        ac_type: 'non_ac',
        capacity: 2,
        floor_number: 1,
        amenities: '',
        block: null
      });
      setShowCreateRoomModal(false);

      // Refresh hostel data
      await loadHostelData();
      
      toast({
        title: "Room Created Successfully!",
        description: `Room ${roomForm.room_number} has been created.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error creating room:', error);
      setError('Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRoom = async () => {
    if (!editingRoom) return;
    
    try {
      setLoading(true);
      setError(null);

      await HostelAPI.updateRoom(editingRoom.id, roomForm);
      
      // Reset form and close modal
      setRoomForm({
        room_number: '',
        room_type: '2_beds',
        ac_type: 'non_ac',
        capacity: 2,
        floor_number: 1,
        amenities: '',
        block: null
      });
      setEditingRoom(null);
      setShowEditRoomModal(false);

      // Refresh hostel data
      await loadHostelData();
      
      toast({
        title: "Room Updated Successfully!",
        description: `Room ${roomForm.room_number} has been updated.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating room:', error);
      setError('Failed to update room');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAllocation = async () => {
    try {
      setLoading(true);
      setError(null);

      await HostelAPI.allocateBed(allocationForm);
      
      // Reset form and close modal
      setAllocationForm({
        student_id: null,
        bed_id: null,
        allocation_date: new Date().toISOString().split('T')[0]
      });
      setShowAllocationModal(false);

      // Refresh hostel data
      await loadHostelData();
      
      toast({
        title: "Bed Allocated Successfully!",
        description: "Student has been allocated a hostel bed.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error allocating bed:', error);
      setError('Failed to allocate bed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComplaint = async () => {
    try {
      setLoading(true);
      setError(null);

      await HostelAPI.createComplaint(complaintForm);
      
      // Reset form and close modal
      setComplaintForm({
        student: null,
        room: null,
        title: '',
        description: '',
        category: 'maintenance',
        priority: 'medium'
      });
      setShowCreateComplaintModal(false);

      // Refresh hostel data
      await loadHostelData();
      
      toast({
        title: "Complaint Submitted Successfully!",
        description: "The complaint has been logged and will be reviewed.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error creating complaint:', error);
      setError('Failed to create complaint');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLeaveRequest = async () => {
    try {
      setLoading(true);
      setError(null);

      await HostelAPI.createLeaveRequest(leaveForm);
      
      // Reset form and close modal
      setLeaveForm({
        student: null,
        leave_type: 'home',
        start_date: '',
        end_date: '',
        expected_return_date: '',
        reason: '',
        emergency_contact: '',
        destination: ''
      });
      setShowCreateLeaveModal(false);

      // Refresh hostel data
      await loadHostelData();
      
      toast({
        title: "Leave Request Submitted!",
        description: "The leave request has been submitted for approval.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error creating leave request:', error);
      setError('Failed to create leave request');
    } finally {
      setLoading(false);
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
          allPayments,
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
          adminAPI.getAllFeePayments(),
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
        setAllFeePayments(allPayments);
        setAttendanceData(attendance);
        setExamsData(exams);
        setHostelStats(hostelDashboardStats);

        // Debug logging to see what data we're getting
        console.log('Dashboard data loaded:', {
          stats,
          students: students?.length || 0,
          teachers: teachers?.length || 0,
          staff: staff?.length || 0,
          users: users?.length || 0
        });
        console.log('Teachers data:', teachers);
        console.log('Staff data:', staff);

      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard data loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Reload functions for each tab
  const reloadOverviewData = async () => {
    console.log('🔄 Reloading overview data...');
    setLoading(true);
    try {
      const [stats, unifiedData] = await Promise.all([
        adminAPI.getSchoolStats(),
        adminAPI.getAdminDashboardData()
      ]);
      setSchoolStats(stats);
      setUnifiedDashboardData(unifiedData);
      toast({
        title: "Data Refreshed",
        description: "Overview data has been updated.",
      });
    } catch (err) {
      setError('Failed to reload overview data');
      console.error('Overview reload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const reloadStudentsData = async () => {
    console.log('🔄 Reloading students data...');
    try {
      const students = await adminAPI.getStudents();
      setStudentsData(students);
      toast({
        title: "Data Refreshed",
        description: "Students data has been updated.",
      });
    } catch (err) {
      console.error('Students reload error:', err);
      toast({
        title: "Error",
        description: "Failed to reload students data.",
        variant: "destructive",
      });
    }
  };

  const reloadAdmissionsData = async () => {
    console.log('🔄 Reloading admissions data...');
    try {
      const admissions = await adminAPI.getSchoolAdmissions();
      setAdmissionsData(admissions);
      toast({
        title: "Data Refreshed",
        description: "Admissions data has been updated.",
      });
    } catch (err) {
      console.error('Admissions reload error:', err);
      toast({
        title: "Error",
        description: "Failed to reload admissions data.",
        variant: "destructive",
      });
    }
  };

  const reloadUsersData = async () => {
    console.log('🔄 Reloading users data...');
    try {
      const [students, teachers, staff, users] = await Promise.all([
        adminAPI.getStudents(),
        adminAPI.getTeachers(),
        adminAPI.getStaff(),
        adminAPI.getAllUsers()
      ]);
      setStudentsData(students);
      setTeachersData(teachers);
      setStaffData(staff);
      setAllUsers(users);
      toast({
        title: "Data Refreshed",
        description: "User management data has been updated.",
      });
    } catch (err) {
      console.error('Users reload error:', err);
      toast({
        title: "Error",
        description: "Failed to reload users data.",
        variant: "destructive",
      });
    }
  };

  const reloadHostelData = async () => {
    console.log('🔄 Reloading hostel data...');
    try {
      const [blocks, beds, allocations, complaints, leaveRequests, staff, hostelStats] = await Promise.all([
        HostelAPI.getBlocks({ is_active: true }),
        HostelAPI.getBeds(),
        HostelAPI.getAllocations(),
        HostelAPI.getComplaints(),
        HostelAPI.getLeaveRequests(),
        HostelAPI.getStaffMembers(),
        HostelAPI.getHostelDashboardStats()
      ]);
      setHostelBlocks(blocks);
      setHostelBeds(beds);
      setHostelAllocations(allocations);
      setHostelComplaints(complaints);
      setHostelLeaveRequests(leaveRequests);
      setAvailableStaff(staff);
      setHostelStats(hostelStats);
      // Also reload rooms with current filters
      await loadRoomsWithFilters(currentPage);
      toast({
        title: "Data Refreshed",
        description: "Hostel management data has been updated.",
      });
    } catch (err) {
      console.error('Hostel reload error:', err);
      toast({
        title: "Error",
        description: "Failed to reload hostel data.",
        variant: "destructive",
      });
    }
  };

  const reloadFeesData = async () => {
    console.log('🔄 Reloading fees data...');
    try {
      const [fees, allPayments] = await Promise.all([
        adminAPI.getFeesData(),
        adminAPI.getAllFeePayments()
      ]);
      setFeesData(fees);
      setAllFeePayments(allPayments);
      toast({
        title: "Data Refreshed",
        description: "Fees data has been updated.",
      });
    } catch (err) {
      console.error('Fees reload error:', err);
      toast({
        title: "Error",
        description: "Failed to reload fees data.",
        variant: "destructive",
      });
    }
  };

  const reloadAttendanceData = async () => {
    console.log('🔄 Reloading attendance data...');
    try {
      const attendance = await adminAPI.getAttendanceData();
      setAttendanceData(attendance);
      toast({
        title: "Data Refreshed",
        description: "Attendance data has been updated.",
      });
    } catch (err) {
      console.error('Attendance reload error:', err);
      toast({
        title: "Error",
        description: "Failed to reload attendance data.",
        variant: "destructive",
      });
    }
  };

  const reloadExamsData = async () => {
    console.log('🔄 Reloading exams data...');
    try {
      const exams = await adminAPI.getExamsData();
      setExamsData(exams);
      toast({
        title: "Data Refreshed",
        description: "Exams data has been updated.",
      });
    } catch (err) {
      console.error('Exams reload error:', err);
      toast({
        title: "Error",
        description: "Failed to reload exams data.",
        variant: "destructive",
      });
    }
  };

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

  // Load hostel data
  const loadHostelData = async () => {
    try {
      const [blocks, beds, allocations, complaints, leaveRequests, staff] = await Promise.all([
        HostelAPI.getBlocks({ is_active: true }),
        HostelAPI.getBeds(),
        HostelAPI.getAllocations(),
        HostelAPI.getComplaints(),
        HostelAPI.getLeaveRequests(),
        HostelAPI.getStaffMembers()
      ]);

      setHostelBlocks(blocks);
      // Remove setHostelRooms - now handled by server-side pagination
      setHostelBeds(beds);
      setHostelAllocations(allocations);
      setHostelComplaints(complaints);
      setHostelLeaveRequests(leaveRequests);
      setAvailableStaff(staff);
      
      // Load filter options separately to avoid function order issues
      try {
        const options = await HostelAPI.getRoomFilterOptions();
        
        // Deduplicate blocks by id
        const uniqueBlocks = options.blocks.reduce((acc: any[], block: any) => {
          if (!acc.find(existing => existing.id === block.id)) {
            acc.push(block);
          }
          return acc;
        }, []);
        
        // Process and deduplicate other options
        const processedOptions = {
          blocks: uniqueBlocks,
          floors: [...new Set(options.floors)].sort((a, b) => a - b),
          room_types: options.room_types,
          ac_types: options.ac_types
        };
        
        setRoomFilterOptions(processedOptions);
      } catch (filterError) {
        console.error('Error loading filter options:', filterError);
      }
    } catch (error) {
      console.error('Error loading hostel data:', error);
    }
  };

  // Library management functions
  const loadLibraryData = async () => {
    console.log('🔧 DEBUG: Loading library data...');
    setLibraryLoading(true);
    try {
      const [books, userBooks, transactions, stats, analytics] = await Promise.all([
        libraryAPI.getBooks(),
        libraryAPI.getUserBooks(),
        libraryAPI.getTransactions(),
        libraryAPI.getLibraryStats(),
        libraryAPI.getLibraryAnalytics()
      ]);

      console.log('🔧 DEBUG: Library data loaded:', { 
        booksCount: books.length, 
        userBooksCount: userBooks.length,
        transactionsCount: transactions.length,
        stats,
        analytics
      });

      setLibraryData({
        books,
        userBooks,
        transactions,
        stats: stats.stats,
        analytics
      });
    } catch (error) {
      console.error('Error loading library data:', error);
      toast({
        title: "Error",
        description: "Failed to load library data",
        variant: "destructive"
      });
    } finally {
      setLibraryLoading(false);
    }
  };

  const reloadLibraryData = async () => {
    console.log('🔧 DEBUG: Reloading library data...');
    await loadLibraryData();
    toast({
      title: "Library Data Refreshed",
      description: "Library management data has been updated.",
    });
  };

  const searchGoogleBooks = async () => {
    if (!bookSearchQuery.trim()) return;
    
    console.log('🔧 DEBUG: Searching Google Books:', bookSearchQuery);
    setSearchingBooks(true);
    try {
      const result = await libraryAPI.searchBooks({
        query: bookSearchQuery,
        max_results: 20
      });
      
      console.log('🔧 DEBUG: Book search results:', result);
      setBookSearchResults(result.books || []);
    } catch (error) {
      console.error('Error searching books:', error);
      toast({
        title: "Search Failed",
        description: "Failed to search for books",
        variant: "destructive"
      });
    } finally {
      setSearchingBooks(false);
    }
  };

  const addBookToLibrary = async (book: LibraryBook) => {
    console.log('🔧 DEBUG: Adding book to library:', book);
    try {
      await libraryAPI.addBookToLibrary({
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        publisher: book.publisher,
        publication_year: book.publication_year,
        description: book.description,
        category: book.category,
        total_copies: 1,
        google_books_id: book.google_books_id,
        image_links: book.image_links
      });
      
      await loadLibraryData();
      toast({
        title: "Book Added",
        description: `"${book.title}" has been added to the library`,
      });
    } catch (error) {
      console.error('Error adding book:', error);
      toast({
        title: "Failed to Add Book",
        description: "There was an error adding the book to the library",
        variant: "destructive"
      });
    }
  };

  const handleCreateBook = async () => {
    console.log('🔧 DEBUG: Creating custom book:', addBookForm);
    try {
      await libraryAPI.addBookToLibrary(addBookForm);
      await loadLibraryData();
      setShowAddBookModal(false);
      setAddBookForm({
        title: '',
        author: '',
        isbn: '',
        publisher: '',
        publication_year: new Date().getFullYear(),
        description: '',
        category: '',
        total_copies: 1,
        shelf_location: '',
        price: ''
      });
      toast({
        title: "Book Created",
        description: `"${addBookForm.title}" has been added to the library`,
      });
    } catch (error) {
      console.error('Error creating book:', error);
      toast({
        title: "Failed to Create Book",
        description: "There was an error creating the book",
        variant: "destructive"
      });
    }
  };

  // Load library data on component mount
  useEffect(() => {
    loadLibraryData();
  }, []);

  // Load hostel data on component mount
  useEffect(() => {
    loadHostelData();
  }, []);

  const sidebarItems = [
    { id: "overview", label: "School Overview", icon: Building },
    { id: "students", label: "Students", icon: GraduationCap },
    { id: "users", label: "User Management", icon: Users },
    { id: "hostel", label: "Hostel Management", icon: Building2 },
    { id: "library", label: "Library Management", icon: BookOpen },
    { id: "admissions", label: "Review Admissions", icon: UserPlus },
    { id: "fees", label: "Fees & Payments", icon: CreditCard },
    { id: "attendance", label: "Attendance", icon: Calendar },

    { id: "exams", label: "Examinations", icon: BookOpen },
    { id: "marks", label: "Blockchain Marks", icon: Shield },

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
      {/* Tab Header with Reload Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">School Overview</h2>
        <Button 
          onClick={reloadOverviewData} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Reload Data
        </Button>
      </div>

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
        <div className="flex gap-2">
          <Button onClick={reloadStudentsData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Data
          </Button>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add New Student
          </Button>
        </div>
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

  const renderStaffTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Staff Management</h2>
        <Button onClick={() => setShowCreateStaffModal(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add New Staff
        </Button>
      </div>
      
      {renderFilters()}
      
      <Card>
        <CardHeader>
          <CardTitle>All Staff ({staffData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {staffData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No staff found. Add staff members to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name & ID</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffData.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {staff.user?.first_name} {staff.user?.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ID: {staff.id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{staff.employee_id}</TableCell>
                    <TableCell>{staff.user?.email}</TableCell>
                    <TableCell>
                      <Badge variant={staff.role === 'admin' ? 'destructive' : 'default'}>
                        {staff.role?.charAt(0).toUpperCase() + staff.role?.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{staff.department || 'N/A'}</TableCell>
                    <TableCell>{staff.designation || 'N/A'}</TableCell>
                    <TableCell>{staff.experience_years} years</TableCell>
                    <TableCell>
                      <Badge variant={staff.status === 'active' ? 'default' : 'secondary'}>
                        {staff.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
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

      {/* Modal is now moved to end of component */}
    </div>
  );

  const renderLibrariansTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Librarian Management</h2>
      </div>
      
      {renderFilters()}
      
      <Card>
        <CardHeader>
          <CardTitle>All Librarians ({staffData.filter(staff => staff.user?.role === 'librarian').length})</CardTitle>
        </CardHeader>
        <CardContent>
          {staffData.filter(staff => staff.user?.role === 'librarian').length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No librarians found. Add librarian staff members to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name & ID</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffData.filter(staff => staff.user?.role === 'librarian').map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {staff.user?.first_name} {staff.user?.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ID: {staff.id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{staff.employee_id}</TableCell>
                    <TableCell>{staff.user?.email}</TableCell>
                    <TableCell>{staff.department || 'N/A'}</TableCell>
                    <TableCell>{staff.designation || 'N/A'}</TableCell>
                    <TableCell>{staff.experience_years} years</TableCell>
                    <TableCell>
                      <Badge variant={staff.status === 'active' ? 'default' : 'secondary'}>
                        {staff.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
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

  const renderUsersTab = () => {
    const userTabs = [
      { id: "all", label: "All Users", count: allUsers.length },
      { id: "staff", label: "Staff", count: staffData.length },
      { id: "teachers", label: "Teachers", count: teachersData.length },
      { id: "librarians", label: "Librarians", count: staffData.filter(staff => staff.user?.role === 'librarian').length },
      { id: "wardens", label: "Wardens", count: allUsers.filter(user => user.role === 'warden').length },
    ];

    const renderUserTabContent = () => {
      switch (activeUserTab) {
        case "all":
          return renderAllUsersSection();
        case "staff":
          return renderStaffSection();
        case "teachers":
          return renderTeachersSection();
        case "librarians":
          return renderLibrariansSection();
        case "wardens":
          return renderWardensSection();
        default:
          return renderAllUsersSection();
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">User Management</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={reloadUsersData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Reload
            </Button>
            {(activeUserTab === "staff" || activeUserTab === "teachers" || activeUserTab === "librarians" || activeUserTab === "wardens") && (
              <Button onClick={() => {
                console.log('🔧 DEBUG: Add Staff button clicked');
                console.log('🔧 DEBUG: Active user tab:', activeUserTab);
                
                // Set default role based on active tab
                let defaultRole: 'admin' | 'faculty' | 'librarian' = 'faculty';
                if (activeUserTab === 'librarians') defaultRole = 'librarian';
                else if (activeUserTab === 'staff') defaultRole = 'admin';
                else defaultRole = 'faculty'; // teachers and wardens are faculty
                
                console.log('🔧 DEBUG: Setting default role to:', defaultRole);
                console.log('🔧 DEBUG: Current form state before update:', createStaffForm);
                
                setCreateStaffForm({
                  ...createStaffForm,
                  role: defaultRole
                });
                
                console.log('🔧 DEBUG: About to show modal');
                setShowCreateStaffModal(true);
                console.log('🔧 DEBUG: Modal state should now be true');
              }}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Staff
              </Button>
            )}
          </div>
        </div>

        {/* User Type Navigation */}
        <div className="border-b">
          <nav className="-mb-px flex space-x-8">
            {userTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveUserTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeUserTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {renderFilters()}
        {renderUserTabContent()}
      </div>
    );
  };

  const renderAllUsersSection = () => (
    <Card>
      <CardHeader>
        <CardTitle>All Users ({filterData(allUsers, "users").length})</CardTitle>
      </CardHeader>
      <CardContent>
        {allUsers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No users found. Add users to get started.</p>
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
                  <TableCell>{user.email || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'destructive' : 'default'}>
                      {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        setSelectedUser(user);
                        setShowUserModal(true);
                      }}>
                        <Eye className="h-4 w-4" />
                      </Button>
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
  );

  const renderStaffSection = () => (
    <Card>
      <CardHeader>
        <CardTitle>All Staff ({staffData.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {staffData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No staff found. Add staff members to get started.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name & ID</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffData.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {staff.user?.first_name} {staff.user?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ID: {staff.id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{staff.employee_id}</TableCell>
                  <TableCell>{staff.user?.email}</TableCell>
                  <TableCell>
                    <Badge variant={staff.role === 'admin' ? 'destructive' : 'default'}>
                      {staff.role?.charAt(0).toUpperCase() + staff.role?.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{staff.department || 'N/A'}</TableCell>
                  <TableCell>{staff.designation || 'N/A'}</TableCell>
                  <TableCell>{staff.experience_years} years</TableCell>
                  <TableCell>
                    <Badge variant={staff.status === 'active' ? 'default' : 'secondary'}>
                      {staff.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
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
  );

  const renderTeachersSection = () => (
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
  );

  const renderLibrariansSection = () => (
    <Card>
      <CardHeader>
        <CardTitle>All Librarians ({staffData.filter(staff => staff.user?.role === 'librarian').length})</CardTitle>
      </CardHeader>
      <CardContent>
        {staffData.filter(staff => staff.user?.role === 'librarian').length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No librarians found. Add librarian staff members to get started.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name & ID</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffData.filter(staff => staff.user?.role === 'librarian').map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {staff.user?.first_name} {staff.user?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ID: {staff.id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{staff.employee_id}</TableCell>
                  <TableCell>{staff.user?.email}</TableCell>
                  <TableCell>{staff.department || 'N/A'}</TableCell>
                  <TableCell>{staff.designation || 'N/A'}</TableCell>
                  <TableCell>{staff.experience_years} years</TableCell>
                  <TableCell>
                    <Badge variant={staff.status === 'active' ? 'default' : 'secondary'}>
                      {staff.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
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
  );

  const renderWardensSection = () => {
    const wardens = allUsers.filter(user => user.role === 'warden');
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Wardens ({wardens.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {wardens.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No wardens found. Add warden users to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wardens.map((warden) => (
                  <TableRow key={warden.id}>
                    <TableCell className="font-medium">
                      {`${warden.first_name || ''} ${warden.last_name || ''}`.trim() || 'N/A'}
                    </TableCell>
                    <TableCell>{warden.email || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={warden.is_active ? 'default' : 'secondary'}>
                        {warden.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {warden.created_at ? new Date(warden.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          setSelectedUser(warden);
                          setShowUserModal(true);
                        }}>
                          <Eye className="h-4 w-4" />
                        </Button>
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
    );
  };

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
    const admissionStatistics = feesDataFromAPI?.statistics || {
      total_expected: 0,
      total_collected: 0,
      pending_amount: 0,
      collection_rate: 0,
      total_students: 0,
      paid_students: 0
    };

    // Calculate comprehensive statistics from all fee payments
    const allFees = allFeePayments || [];
    const paidFees = allFees.filter(fee => fee.status === 'paid' || fee.status === 'completed');
    const pendingFees = allFees.filter(fee => fee.status === 'pending' || fee.status === 'unpaid');
    const overdueFees = allFees.filter(fee => fee.status === 'overdue');
    
    const totalExpected = allFees.reduce((sum, fee) => sum + (fee.amount || 0), 0) + admissionStatistics.total_expected;
    const totalCollected = paidFees.reduce((sum, fee) => sum + (fee.amount || 0), 0) + admissionStatistics.total_collected;
    const pendingAmount = pendingFees.reduce((sum, fee) => sum + (fee.amount || 0), 0) + admissionStatistics.pending_amount;
    const overdueAmount = overdueFees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
    
    const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected * 100) : 0;
    
    // Fee breakdown by type
    const admissionFees = allFees.filter(fee => fee.type === 'admission' || fee.category === 'admission_fee');
    const hostelFees = allFees.filter(fee => fee.fee_type === 'hostel' || fee.category === 'hostel');
    const academicFees = allFees.filter(fee => fee.fee_type === 'academic' || fee.category === 'academic');
    const otherFees = allFees.filter(fee => !['admission', 'hostel', 'academic'].includes(fee.fee_type || fee.category));

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Fees & Payments</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={reloadFeesData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Reload
          </Button>
        </div>

        {/* Comprehensive Fee Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Total Expected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalExpected)}</div>
              <p className="text-xs text-muted-foreground">from all students</p>
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
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalCollected)}</div>
              <p className="text-xs text-muted-foreground">
                {paidFees.length + admissionStatistics.paid_students} payments completed
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
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(pendingAmount)}</div>
              <p className="text-xs text-muted-foreground">
                {pendingFees.length + (admissionStatistics.total_students - admissionStatistics.paid_students)} pending
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
                {Math.round(collectionRate)}%
              </div>
              <p className="text-xs text-muted-foreground">of expected fees</p>
            </CardContent>
          </Card>
        </div>

        {/* Fee Breakdown by Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Admission Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-lg font-bold">{formatCurrency(admissionStatistics.total_expected)}</p>
                <p className="text-sm text-muted-foreground">{admissionStatistics.total_students} students</p>
                <div className="flex justify-between text-xs">
                  <span>Paid: {admissionStatistics.paid_students}</span>
                  <span>Pending: {admissionStatistics.total_students - admissionStatistics.paid_students}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Hostel Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-lg font-bold">{formatCurrency(hostelFees.reduce((sum, fee) => sum + (fee.amount || 0), 0))}</p>
                <p className="text-sm text-muted-foreground">{hostelFees.length} students</p>
                <div className="flex justify-between text-xs">
                  <span>Paid: {hostelFees.filter(f => f.status === 'paid' || f.status === 'completed').length}</span>
                  <span>Pending: {hostelFees.filter(f => f.status === 'pending' || f.status === 'unpaid').length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Academic Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-lg font-bold">{formatCurrency(academicFees.reduce((sum, fee) => sum + (fee.amount || 0), 0))}</p>
                <p className="text-sm text-muted-foreground">{academicFees.length} students</p>
                <div className="flex justify-between text-xs">
                  <span>Paid: {academicFees.filter(f => f.status === 'paid' || f.status === 'completed').length}</span>
                  <span>Pending: {academicFees.filter(f => f.status === 'pending' || f.status === 'unpaid').length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Other Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-lg font-bold">{formatCurrency(otherFees.reduce((sum, fee) => sum + (fee.amount || 0), 0))}</p>
                <p className="text-sm text-muted-foreground">{otherFees.length} students</p>
                <div className="flex justify-between text-xs">
                  <span>Paid: {otherFees.filter(f => f.status === 'paid' || f.status === 'completed').length}</span>
                  <span>Pending: {otherFees.filter(f => f.status === 'pending' || f.status === 'unpaid').length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Fee Payments Table */}
        {allFees.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>All Student Fee Payments</CardTitle>
              <CardDescription>Complete overview of all fees - paid and unpaid (excluding admission fees)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allFees.map((fee, index) => (
                      <TableRow key={fee.id || index}>
                        <TableCell className="font-medium">
                          {fee.student_name || 'N/A'}
                        </TableCell>
                        <TableCell>{fee.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {fee.category || fee.fee_type || fee.type || 'General'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(fee.amount || 0)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              fee.status === 'paid' || fee.status === 'completed' ? 'default' :
                              fee.status === 'overdue' ? 'destructive' : 'secondary'
                            }
                          >
                            {fee.status || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {fee.due_date ? new Date(fee.due_date).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {fee.payment_date ? new Date(fee.payment_date).toLocaleDateString() : 
                           fee.payment_completed_at ? new Date(fee.payment_completed_at).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(fee.status === 'paid' || fee.status === 'completed') && (
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enrollment Fee Details Table */}
        <Card>
          <CardHeader>
            <CardTitle>Admission Fee Details</CardTitle>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Blocks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {hostelStats?.total_blocks ?? hostelBlocks.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Beds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {hostelStats?.total_beds ?? hostelBeds.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {hostelStats?.occupied_beds ?? hostelAllocations.filter(a => a.status === 'active').length} occupied, {(hostelStats?.total_beds ?? hostelBeds.length) - (hostelStats?.occupied_beds ?? hostelAllocations.filter(a => a.status === 'active').length)} available
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Occupancy Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(() => {
                  const totalBeds = hostelStats?.total_beds ?? hostelBeds.length;
                  const occupiedBeds = hostelStats?.occupied_beds ?? hostelAllocations.filter(a => a.status === 'active').length;
                  return totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : '0.0';
                })()}%
              </div>
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
                  <span className="font-bold">
                    {hostelStats?.pending_complaints ?? hostelComplaints.filter(c => c.status === 'in_progress').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Leave Requests:</span>
                  <span className="font-bold">
                    {hostelStats?.pending_leave_requests ?? hostelLeaveRequests.filter(r => r.status === 'pending').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hostel Tab Navigation */}
        <div className="border-b">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "overview", label: "Overview" },
              { id: "blocks", label: "Blocks" },
              { id: "rooms", label: "Rooms" },
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
        {activeHostelTab === "rooms" && renderHostelRooms()}
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
            {(hostelStats?.recent_allocations?.length > 0 ? hostelStats.recent_allocations : 
              hostelAllocations.slice().sort((a, b) => 
                new Date(b.allocation_date || b.created_at || '').getTime() - 
                new Date(a.allocation_date || a.created_at || '').getTime()
              ).slice(0, 5)
            ).map((allocation: HostelAllocation) => (
              <div key={allocation.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{allocation.student_name || 'N/A'}</div>
                  <div className="text-sm text-gray-600">
                    {allocation.block_name || 'N/A'} - Room {allocation.room_number || 'N/A'} - Bed {allocation.bed_number || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {allocation.allocation_date ? new Date(allocation.allocation_date).toLocaleDateString() : 
                     allocation.created_at ? new Date(allocation.created_at).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <Badge variant={allocation.status === 'active' ? 'default' : 'secondary'}>
                  {allocation.status}
                </Badge>
              </div>
            ))}
            {(!hostelStats?.recent_allocations || hostelStats.recent_allocations.length === 0) && 
             hostelAllocations.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No allocations yet
              </div>
            )}
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
        <Button onClick={() => setShowCreateBlockModal(true)}>
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
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveHostelTab("rooms")}
                  >
                    Manage Rooms
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedBlock(block);
                      setShowBlockModal(true);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Block Modal */}
      <Dialog open={showCreateBlockModal} onOpenChange={setShowCreateBlockModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Create New Hostel Block - Step {blockCreationStep} of 3
            </DialogTitle>
            <DialogDescription>
              {blockCreationStep === 1 && "Enter basic information about the hostel block"}
              {blockCreationStep === 2 && "Configure rooms for each floor"}
              {blockCreationStep === 3 && "Review and confirm block creation"}
            </DialogDescription>
          </DialogHeader>
          
          {/* Step 1: Basic Information */}
          {blockCreationStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="blockName">Block Name *</Label>
                <Input
                  id="blockName"
                  placeholder="e.g., Block A, East Wing, etc."
                  value={blockForm.name}
                  onChange={(e) => setBlockForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="blockDescription">Description</Label>
                <textarea
                  id="blockDescription"
                  className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description about the hostel block"
                  value={blockForm.description}
                  onChange={(e) => setBlockForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="totalFloors">Number of Floors *</Label>
                <Input
                  id="totalFloors"
                  type="number"
                  min="1"
                  max="20"
                  placeholder="Enter number of floors"
                  value={blockForm.total_floors}
                  onChange={(e) => setBlockForm(prev => ({ ...prev, total_floors: parseInt(e.target.value) || 1 }))}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Including ground floor. Each floor will default to 20 rooms.
                </p>
              </div>
              
              <div>
                <Label htmlFor="warden">Assign Warden (Optional)</Label>
                <Select 
                  value={blockForm.warden?.toString() || ""} 
                  onValueChange={(value) => setBlockForm(prev => ({ ...prev, warden: value === "no-warden" ? null : parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a warden" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-warden">No Warden</SelectItem>
                    {availableStaff.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id.toString()}>
                        {staff.user.full_name} - {staff.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Floor Configuration */}
          {blockCreationStep === 2 && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Floor Configuration</h4>
                <p className="text-sm text-blue-700">
                  Configure the number of rooms for each floor. Default is 20 rooms per floor.
                </p>
              </div>
              
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {tempFloorConfig.map((rooms, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-1">
                      <Label className="font-medium">
                        {getFloorName(index)}
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        value={rooms}
                        onChange={(e) => handleFloorRoomsChange(index, parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-500">rooms</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">
                  <strong>Total Floors:</strong> {tempFloorConfig.length}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Total Rooms:</strong> {tempFloorConfig.reduce((sum, rooms) => sum + rooms, 0)}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {blockCreationStep === 3 && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Review Block Details</h4>
                <p className="text-sm text-green-700">
                  Please review the information before creating the hostel block.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Block Name</Label>
                    <p className="font-medium">{blockForm.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Total Floors</Label>
                    <p className="font-medium">{blockForm.total_floors}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Total Rooms</Label>
                    <p className="font-medium">{blockForm.total_rooms}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Warden</Label>
                    <p className="font-medium">
                      {blockForm.warden ? 
                        availableStaff.find(s => s.id === blockForm.warden)?.user.full_name : 
                        'Not Assigned'
                      }
                    </p>
                  </div>
                </div>
                
                {blockForm.description && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Description</Label>
                    <p className="text-sm">{blockForm.description}</p>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-medium text-gray-500">Floor Configuration</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {blockForm.floor_config.map((rooms, index) => (
                      <div key={index} className="text-sm bg-gray-100 p-2 rounded">
                        {getFloorName(index)}: {rooms} rooms
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm p-3 bg-red-50 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          
          <div className="flex justify-between mt-6">
            <div>
              {blockCreationStep > 1 && (
                <Button variant="outline" onClick={handlePrevBlockStep}>
                  Previous
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateBlockModal(false);
                  setBlockCreationStep(1);
                  setTempFloorConfig([]);
                  setBlockForm({
                    name: '',
                    description: '',
                    total_rooms: 0,
                    total_floors: 1,
                    floor_config: [],
                    warden: null
                  });
                  setError(null);
                }}
              >
                Cancel
              </Button>
              {blockCreationStep < 3 ? (
                <Button onClick={handleNextBlockStep}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleCreateBlock} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {loading ? 'Creating...' : 'Create Block'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Warden Assignment Modal */}
      <Dialog open={showBlockModal} onOpenChange={setShowBlockModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedBlock ? `Assign Warden to ${selectedBlock.name}` : 'Manage Block'}
            </DialogTitle>
            <DialogDescription>
              Select a staff member to assign as warden for this block.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBlock && (
            <div className="space-y-4">
              <Label>Select Staff Member</Label>
              <Select onValueChange={(value) => handleAssignWarden(selectedBlock.id, parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a staff member" />
                </SelectTrigger>
                <SelectContent>
                  {availableStaff.filter(staff => staff.id).map((staff) => (
                    <SelectItem key={staff.id} value={staff.id.toString()}>
                      {staff.user.full_name} - {staff.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  // Load room filter options
  const loadRoomFilterOptions = async () => {
    try {
      const options = await HostelAPI.getRoomFilterOptions();
      
      // Deduplicate blocks by id
      const uniqueBlocks = options.blocks.reduce((acc: any[], block: any) => {
        if (!acc.find(existing => existing.id === block.id)) {
          acc.push(block);
        }
        return acc;
      }, []);
      
      // Process and deduplicate other options
      const processedOptions = {
        blocks: uniqueBlocks,
        floors: [...new Set(options.floors)].sort((a, b) => a - b),
        room_types: options.room_types,
        ac_types: options.ac_types
      };
      
      setRoomFilterOptions(processedOptions);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  // Mass update rooms
  const handleMassUpdateRooms = async () => {
    if (selectedRooms.length === 0) {
      setError('Please select rooms to update');
      return;
    }

    try {
      setLoading(true);
      const result = await HostelAPI.massUpdateRooms({
        room_ids: selectedRooms,
        update_data: massUpdateData
      });

      await loadHostelData();
      setShowMassUpdateModal(false);
      setSelectedRooms([]);
      setMassUpdateData({
        room_type: '',
        ac_type: '',
        capacity: 0,
        amenities: '',
        is_available: true
      });
      
      alert(`Updated ${result.updated_count} rooms successfully`);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to update rooms');
    } finally {
      setLoading(false);
    }
  };

  // Mass update by criteria (floors, blocks)
  const handleMassUpdateByCriteria = async (criteria: {
    block_ids?: number[];
    floor_numbers?: number[];
    room_type?: string;
    ac_type?: string;
  }) => {
    try {
      setLoading(true);
      const result = await HostelAPI.massUpdateRoomsByCriteria({
        filters: criteria,
        update_data: massUpdateData
      });

      await loadHostelData();
      alert(`Updated ${result.updated_count} out of ${result.total_matched} matching rooms`);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to update rooms');
    } finally {
      setLoading(false);
    }
  };

  // Manage beds for a room
  const handleBedManagement = async () => {
    if (!selectedRoomForBeds) return;

    try {
      setLoading(true);
      await HostelAPI.generateBeds({
        room_id: selectedRoomForBeds.id,
        bed_count: bedManagementData.bed_count,
        bed_type: bedManagementData.bed_type
      });

      await loadHostelData();
      setShowBedManagementModal(false);
      setSelectedRoomForBeds(null);
      setBedManagementData({ bed_count: 2, bed_type: 'single' });
      alert('Beds updated successfully');
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to update beds');
    } finally {
      setLoading(false);
    }
  };

  // Toggle room selection
  const toggleRoomSelection = (roomId: number) => {
    setSelectedRooms(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };

  // Select all visible rooms
  const selectAllRooms = () => {
    setSelectedRooms(filteredRooms.map(room => room.id));
  };

  // Clear room selection
  const clearRoomSelection = () => {
    setSelectedRooms([]);
  };
  // Render hostel rooms management
  const renderHostelRooms = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Hostel Rooms Management</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadRoomFilterOptions}
            disabled={loading}
          >
            <Filter className="h-4 w-4 mr-2" />
            Refresh Filters
          </Button>
          <Button onClick={() => setShowCreateRoomModal(true)}>
            <Home className="h-4 w-4 mr-2" />
            Add Room
          </Button>
        </div>
      </div>

      {/* Advanced Filters - Django Admin Style */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Advanced Filters & Search
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Showing {filteredRooms.length} of {hostelRooms.length} rooms
          </p>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-4">
            <Label>Search Rooms</Label>
            <Input
              placeholder="Search by room number, block name, amenities..."
              value={roomFilters.search || ""}
              onChange={(e) => setRoomFilters({...roomFilters, search: e.target.value})}
              className="max-w-md"
            />
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <Label className="text-sm font-medium">
                Block ({roomFilterOptions.blocks.length} options)
              </Label>
              <Select
                value={roomFilters.block || "all"}
                onValueChange={(value) => setRoomFilters({...roomFilters, block: value === "all" ? "" : value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Blocks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Blocks ({serverRoomsData.count})</SelectItem>
                  {roomFilterOptions.blocks.map((block) => {
                      // Note: Individual block counts would require separate API calls
                      // For now, just show the block name
                      return (
                        <SelectItem key={`block-${block.id}`} value={block.id.toString()}>
                          {block.name}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">
                Floor ({[...new Set(roomFilterOptions.floors)].length} options)
              </Label>
              <Select
                value={roomFilters.floor || "all"}
                onValueChange={(value) => setRoomFilters({...roomFilters, floor: value === "all" ? "" : value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Floors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Floors ({serverRoomsData.count})</SelectItem>
                  {[...new Set(roomFilterOptions.floors)].sort((a, b) => a - b).map((floor, index) => (
                      <SelectItem key={`floor-${floor}-${index}`} value={floor.toString()}>
                        Floor {floor}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">
                Room Type ({roomFilterOptions.room_types.length} options)
              </Label>
              <Select
                value={roomFilters.room_type || "all"}
                onValueChange={(value) => setRoomFilters({...roomFilters, room_type: value === "all" ? "" : value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types ({serverRoomsData.count})</SelectItem>
                  {roomFilterOptions.room_types
                    .filter((type, index, self) => 
                      index === self.findIndex(t => t.value === type.value)
                    )
                    .map((type, index) => {
                      const typeRoomCount = hostelRooms.filter(r => r.room_type === type.value).length;
                      return (
                        <SelectItem key={`room-type-${type.value}-${index}`} value={type.value}>
                          {type.label} ({typeRoomCount})
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">
                AC Type ({roomFilterOptions.ac_types.length} options)
              </Label>
              <Select
                value={roomFilters.ac_type || "all"}
                onValueChange={(value) => setRoomFilters({...roomFilters, ac_type: value === "all" ? "" : value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All AC Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All AC Types ({serverRoomsData.count})</SelectItem>
                  {roomFilterOptions.ac_types
                    .filter((type, index, self) => 
                      index === self.findIndex(t => t.value === type.value)
                    )
                    .map((type, index) => {
                      const acTypeRoomCount = hostelRooms.filter(r => r.ac_type === type.value).length;
                      return (
                        <SelectItem key={`ac-type-${type.value}-${index}`} value={type.value}>
                          {type.label} ({acTypeRoomCount})
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Availability Status</Label>
              <Select
                value={roomFilters.availability || "all"}
                onValueChange={(value) => setRoomFilters({...roomFilters, availability: value === "all" ? "" : value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status ({serverRoomsData.count})</SelectItem>
                  <SelectItem value="available">
                    Available ({hostelRooms.filter(r => r.is_available && r.current_occupancy < r.capacity).length})
                  </SelectItem>
                  <SelectItem value="occupied">
                    Occupied ({hostelRooms.filter(r => r.current_occupancy > 0).length})
                  </SelectItem>
                  <SelectItem value="full">
                    Full ({hostelRooms.filter(r => r.current_occupancy >= r.capacity).length})
                  </SelectItem>
                  <SelectItem value="empty">
                    Empty ({hostelRooms.filter(r => r.current_occupancy === 0).length})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRoomFilters({
                  block: '',
                  floor: '',
                  room_type: '',
                  ac_type: '',
                  availability: '',
                  search: ''
                })}
              >
                <X className="h-4 w-4 mr-1" />
                Clear All Filters
              </Button>
            </div>
            <div className="flex gap-2 items-center">
              <div className="text-sm text-muted-foreground">
                Showing {filteredRooms.length} of {serverRoomsData.count} rooms
                {isLoadingRooms && (
                  <span className="ml-2">
                    <Loader2 className="h-4 w-4 animate-spin inline" />
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mass Management Tools */}
      {selectedRooms.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="font-medium">
                  {selectedRooms.length} room{selectedRooms.length > 1 ? 's' : ''} selected
                </span>
                <Button variant="outline" size="sm" onClick={clearRoomSelection}>
                  Clear Selection
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMassUpdateModal(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Mass Update
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Selection */}
      <div className="flex gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={selectAllRooms}>
          Select All Visible ({filteredRooms.length})
        </Button>
        <Button variant="outline" size="sm" onClick={clearRoomSelection}>
          Clear All
        </Button>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoadingRooms ? (
          // Loading state
          Array.from({ length: itemsPerPage }, (_, i) => (
            <Card key={`loading-${i}`} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          paginatedRooms.map((room) => (
            <Card 
              key={room.id} 
              className={`cursor-pointer transition-all ${
                selectedRooms.includes(room.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => toggleRoomSelection(room.id)}
            >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedRooms.includes(room.id)}
                    onChange={() => toggleRoomSelection(room.id)}
                    className="w-4 h-4"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select room ${room.room_number}`}
                    title={`Select room ${room.room_number}`}
                  />
                  <CardTitle className="text-lg">Room {room.room_number}</CardTitle>
                </div>
                <Badge variant={room.availability_status === 'empty' ? 'secondary' : 
                              room.availability_status === 'partial' ? 'default' : 'destructive'}>
                  {room.availability_status}
                </Badge>
              </div>
              <CardDescription>{room.block_name} - {room.floor_display}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-medium">{room.room_type_display}</span>
                </div>
                <div className="flex justify-between">
                  <span>AC Type:</span>
                  <Badge variant={room.ac_type === 'ac' ? 'default' : 'secondary'}>
                    {room.ac_type_display}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Capacity:</span>
                  <span className="font-medium">{room.capacity} beds</span>
                </div>
                <div className="flex justify-between">
                  <span>Occupancy:</span>
                  <span className="font-medium">{room.current_occupancy}/{room.capacity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual Fee:</span>
                  <span className="font-medium">₹{room.current_annual_fee?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amenities:</span>
                  <span className="font-medium text-sm">{room.amenities || 'Basic'}</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRoomForm({
                        room_number: room.room_number,
                        room_type: room.room_type,
                        ac_type: room.ac_type,
                        block: room.block,
                        capacity: room.capacity,
                        floor_number: room.floor_number,
                        amenities: room.amenities
                      });
                      setEditingRoom(room);
                      setShowEditRoomModal(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRoomForBeds(room);
                      setBedManagementData({
                        bed_count: room.capacity,
                        bed_type: 'single'
                      });
                      setShowBedManagementModal(true);
                    }}
                  >
                    <Bed className="h-4 w-4" />
                    Beds
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
        )}
      </div>

      {/* Pagination Controls */}
      {serverRoomsData.count > itemsPerPage && (
        <div className="flex justify-between items-center mt-6 px-2">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, serverRoomsData.count)} of {serverRoomsData.count} rooms
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || isLoadingRooms}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                
                // Ensure pageNumber is within valid bounds
                if (pageNumber < 1 || pageNumber > totalPages) {
                  return null;
                }
                
                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (pageNumber >= 1 && pageNumber <= totalPages) {
                        setCurrentPage(pageNumber);
                      }
                    }}
                    className="w-8 h-8 p-0"
                    disabled={isLoadingRooms}
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || isLoadingRooms}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {filteredRooms.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Home className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Rooms Found</h3>
            <p className="text-gray-500 mb-4">
              {hostelRooms.length === 0 
                ? "No rooms have been created yet." 
                : "No rooms match your current filters."}
            </p>
            {hostelRooms.length === 0 && (
              <Button onClick={() => setShowCreateRoomModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Room
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mass Update Modal */}
      <Dialog open={showMassUpdateModal} onOpenChange={setShowMassUpdateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Mass Update Rooms</DialogTitle>
            <DialogDescription>
              Update {selectedRooms.length} selected room{selectedRooms.length > 1 ? 's' : ''} at once.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Room Type</Label>
                <Select 
                  value={massUpdateData.room_type || "keep_current"} 
                  onValueChange={(value) => setMassUpdateData({...massUpdateData, room_type: value === "keep_current" ? "" : value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Keep current" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep_current">Keep current</SelectItem>
                    <SelectItem value="1_bed">Single Bed</SelectItem>
                    <SelectItem value="2_beds">Double Bed</SelectItem>
                    <SelectItem value="3_beds">Triple Bed</SelectItem>
                    <SelectItem value="4_beds">Quad Bed</SelectItem>
                    <SelectItem value="5_beds">Five Beds</SelectItem>
                    <SelectItem value="6_beds">Six Beds</SelectItem>
                    <SelectItem value="dormitory">Dormitory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>AC Type</Label>
                <Select 
                  value={massUpdateData.ac_type || "keep_current"} 
                  onValueChange={(value) => setMassUpdateData({...massUpdateData, ac_type: value === "keep_current" ? "" : value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Keep current" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep_current">Keep current</SelectItem>
                    <SelectItem value="ac">AC</SelectItem>
                    <SelectItem value="non_ac">Non-AC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Capacity</Label>
              <Input
                type="number"
                min="1"
                max="12"
                value={massUpdateData.capacity || ''}
                onChange={(e) => setMassUpdateData({...massUpdateData, capacity: parseInt(e.target.value) || 0})}
                placeholder="Keep current capacity"
              />
            </div>
            
            <div>
              <Label>Amenities</Label>
              <Input
                value={massUpdateData.amenities}
                onChange={(e) => setMassUpdateData({...massUpdateData, amenities: e.target.value})}
                placeholder="Keep current amenities"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm p-3 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowMassUpdateModal(false);
                setMassUpdateData({
                  room_type: '', ac_type: '', capacity: 0, amenities: '', is_available: true
                });
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleMassUpdateRooms}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update {selectedRooms.length} Room{selectedRooms.length > 1 ? 's' : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bed Management Modal */}
      <Dialog open={showBedManagementModal} onOpenChange={setShowBedManagementModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Beds</DialogTitle>
            <DialogDescription>
              Configure beds for Room {selectedRoomForBeds?.room_number} in {selectedRoomForBeds?.block_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Current Capacity:</span>
                <span className="font-medium">{selectedRoomForBeds?.capacity} beds</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Current Occupancy:</span>
                <span className="font-medium">{selectedRoomForBeds?.current_occupancy} occupied</span>
              </div>
            </div>

            <div>
              <Label>Number of Beds</Label>
              <Input
                type="number"
                min="1"
                max="12"
                value={bedManagementData.bed_count}
                onChange={(e) => setBedManagementData({
                  ...bedManagementData, 
                  bed_count: parseInt(e.target.value) || 1
                })}
              />
              <p className="text-sm text-muted-foreground mt-1">
                This will replace all existing beds in the room
              </p>
            </div>
            
            <div>
              <Label>Bed Type</Label>
              <Select 
                value={bedManagementData.bed_type} 
                onValueChange={(value) => setBedManagementData({...bedManagementData, bed_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Bed</SelectItem>
                  <SelectItem value="bunk_top">Bunk Bed (Top)</SelectItem>
                  <SelectItem value="bunk_bottom">Bunk Bed (Bottom)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm p-3 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowBedManagementModal(false);
                setSelectedRoomForBeds(null);
                setBedManagementData({ bed_count: 2, bed_type: 'single' });
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBedManagement}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Beds
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Room Modal */}
      <Dialog open={showCreateRoomModal} onOpenChange={setShowCreateRoomModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Room</DialogTitle>
            <DialogDescription>
              Add a new room to a hostel block.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="room_number">Room Number *</Label>
                <Input
                  id="room_number"
                  value={roomForm.room_number}
                  onChange={(e) => setRoomForm({...roomForm, room_number: e.target.value})}
                  placeholder="e.g., 101, A-205"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="floor_number">Floor Number *</Label>
                <Input
                  id="floor_number"
                  type="number"
                  min="1"
                  value={roomForm.floor_number}
                  onChange={(e) => setRoomForm({...roomForm, floor_number: parseInt(e.target.value) || 1})}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="room_block">Hostel Block *</Label>
              <Select 
                value={roomForm.block?.toString() || ''} 
                onValueChange={(value) => setRoomForm({...roomForm, block: parseInt(value)})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a hostel block" />
                </SelectTrigger>
                <SelectContent>
                  {hostelBlocks.filter(block => block.is_active && block.id).map((block) => (
                    <SelectItem key={block.id} value={block.id.toString()}>
                      {block.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="room_type">Room Type *</Label>
                <Select 
                  value={roomForm.room_type} 
                  onValueChange={(value: '1_bed' | '2_beds' | '3_beds' | '4_beds' | '5_beds' | '6_beds' | 'dormitory') => {
                    const capacityMap = { 
                      '1_bed': 1, '2_beds': 2, '3_beds': 3, 
                      '4_beds': 4, '5_beds': 5, '6_beds': 6, 
                      'dormitory': 8 
                    };
                    setRoomForm({...roomForm, room_type: value, capacity: capacityMap[value]});
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1_bed">Single Bed</SelectItem>
                    <SelectItem value="2_beds">Double Bed</SelectItem>
                    <SelectItem value="3_beds">Triple Bed</SelectItem>
                    <SelectItem value="4_beds">Quad Bed</SelectItem>
                    <SelectItem value="5_beds">Five Beds</SelectItem>
                    <SelectItem value="6_beds">Six Beds</SelectItem>
                    <SelectItem value="dormitory">Dormitory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="ac_type">AC Type *</Label>
                <Select 
                  value={roomForm.ac_type} 
                  onValueChange={(value: 'ac' | 'non_ac') => {
                    setRoomForm({...roomForm, ac_type: value});
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select AC type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ac">AC</SelectItem>
                    <SelectItem value="non_ac">Non-AC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                max="6"
                value={roomForm.capacity}
                onChange={(e) => setRoomForm({...roomForm, capacity: parseInt(e.target.value) || 1})}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="amenities">Amenities</Label>
              <Input
                id="amenities"
                value={roomForm.amenities}
                onChange={(e) => setRoomForm({...roomForm, amenities: e.target.value})}
                placeholder="e.g., AC, Attached Bathroom, Study Table"
                className="mt-1"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm p-3 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateRoomModal(false);
                setRoomForm({
                  room_number: '', room_type: '2_beds', ac_type: 'non_ac', capacity: 2, 
                  floor_number: 1, amenities: '', block: null
                });
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateRoom}
              disabled={!roomForm.room_number.trim() || !roomForm.block || loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Room
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Room Modal */}
      <Dialog open={showEditRoomModal} onOpenChange={setShowEditRoomModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
            <DialogDescription>
              Update room details and settings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_room_number">Room Number *</Label>
                <Input
                  id="edit_room_number"
                  value={roomForm.room_number}
                  onChange={(e) => setRoomForm({...roomForm, room_number: e.target.value})}
                  placeholder="e.g., 101, A-205"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="edit_floor_number">Floor Number *</Label>
                <Input
                  id="edit_floor_number"
                  type="number"
                  min="1"
                  value={roomForm.floor_number}
                  onChange={(e) => setRoomForm({...roomForm, floor_number: parseInt(e.target.value) || 1})}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit_room_block">Hostel Block *</Label>
              <Select 
                value={roomForm.block?.toString() || ''} 
                onValueChange={(value) => setRoomForm({...roomForm, block: parseInt(value)})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a hostel block" />
                </SelectTrigger>
                <SelectContent>
                  {hostelBlocks.filter(block => block.is_active && block.id).map((block) => (
                    <SelectItem key={block.id} value={block.id.toString()}>
                      {block.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_room_type">Room Type *</Label>
                <Select 
                  value={roomForm.room_type} 
                  onValueChange={(value: '1_bed' | '2_beds' | '3_beds' | '4_beds' | '5_beds' | '6_beds' | 'dormitory') => {
                    const capacityMap = { 
                      '1_bed': 1, '2_beds': 2, '3_beds': 3, 
                      '4_beds': 4, '5_beds': 5, '6_beds': 6, 
                      'dormitory': 8 
                    };
                    setRoomForm({...roomForm, room_type: value, capacity: capacityMap[value]});
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1_bed">Single Bed</SelectItem>
                    <SelectItem value="2_beds">Double Bed</SelectItem>
                    <SelectItem value="3_beds">Triple Bed</SelectItem>
                    <SelectItem value="4_beds">Quad Bed</SelectItem>
                    <SelectItem value="5_beds">Five Beds</SelectItem>
                    <SelectItem value="6_beds">Six Beds</SelectItem>
                    <SelectItem value="dormitory">Dormitory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit_ac_type">AC Type *</Label>
                <Select 
                  value={roomForm.ac_type} 
                  onValueChange={(value: 'ac' | 'non_ac') => {
                    setRoomForm({...roomForm, ac_type: value});
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select AC type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ac">AC</SelectItem>
                    <SelectItem value="non_ac">Non-AC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit_capacity">Capacity</Label>
              <Input
                id="edit_capacity"
                type="number"
                min="1"
                max="6"
                value={roomForm.capacity}
                onChange={(e) => setRoomForm({...roomForm, capacity: parseInt(e.target.value) || 1})}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="edit_amenities">Amenities</Label>
              <Input
                id="edit_amenities"
                value={roomForm.amenities}
                onChange={(e) => setRoomForm({...roomForm, amenities: e.target.value})}
                placeholder="e.g., AC, Attached Bathroom, Study Table"
                className="mt-1"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm p-3 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditRoomModal(false);
                setEditingRoom(null);
                setRoomForm({
                  room_number: '', room_type: '2_beds', ac_type: 'non_ac', capacity: 2, 
                  floor_number: 1, amenities: '', block: null
                });
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateRoom}
              disabled={!roomForm.room_number.trim() || !roomForm.block || loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Room
            </Button>
          </div>
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
                <TableHead>Email</TableHead>
                <TableHead>Block</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Bed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Allocation Date</TableHead>
                <TableHead>Fee Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hostelAllocations.map((allocation) => (
                <TableRow key={allocation.id}>
                  <TableCell className="font-medium">{allocation.student_name}</TableCell>
                  <TableCell>{allocation.student_email}</TableCell>
                  <TableCell>{allocation.block_name}</TableCell>
                  <TableCell>{allocation.room_number}</TableCell>
                  <TableCell>{allocation.bed_number}</TableCell>
                  <TableCell>
                    <Badge variant={allocation.status === 'active' ? 'default' : 
                                  allocation.status === 'pending' ? 'secondary' : 'outline'}>
                      {allocation.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(allocation.allocation_date).toLocaleDateString()}</TableCell>
                  <TableCell>₹{allocation.hostel_fee_amount}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {allocation.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => HostelAPI.endAllocation(allocation.id)}
                        >
                          End Allocation
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAllocation(allocation);
                          // Could open details modal here
                        }}
                      >
                        View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Allocation Modal */}
      <Dialog open={showAllocationModal} onOpenChange={setShowAllocationModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Allocate Hostel Bed</DialogTitle>
            <DialogDescription>
              Assign a student to an available hostel bed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="allocation_student">Student *</Label>
              <Select 
                value={allocationForm.student_id?.toString() || ''} 
                onValueChange={(value) => setAllocationForm({...allocationForm, student_id: parseInt(value)})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {studentsData.filter(student => student.id).map((student) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.user.first_name} {student.user.last_name} - {student.admission_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="allocation_bed">Available Bed *</Label>
              <Select 
                value={allocationForm.bed_id?.toString() || ''} 
                onValueChange={(value) => setAllocationForm({...allocationForm, bed_id: parseInt(value)})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select an available bed" />
                </SelectTrigger>
                <SelectContent>
                  {hostelBeds.filter(bed => bed.is_available && bed.id).map((bed) => (
                    <SelectItem key={bed.id} value={bed.id.toString()}>
                      {bed.block_name} - Room {bed.room_number} - Bed {bed.bed_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="allocation_date">Allocation Date *</Label>
              <Input
                id="allocation_date"
                type="date"
                value={allocationForm.allocation_date}
                onChange={(e) => setAllocationForm({...allocationForm, allocation_date: e.target.value})}
                className="mt-1"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm p-3 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAllocationModal(false);
                setAllocationForm({ student_id: null, bed_id: null, allocation_date: new Date().toISOString().split('T')[0] });
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAllocation}
              disabled={!allocationForm.student_id || !allocationForm.bed_id || loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Allocate Bed
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Render hostel complaints
  const renderHostelComplaints = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Hostel Complaints</h3>
        <Button onClick={() => setShowCreateComplaintModal(true)}>
          <AlertTriangle className="h-4 w-4 mr-2" />
          New Complaint
        </Button>
      </div>
      
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hostelComplaints.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell className="font-medium">{complaint.title}</TableCell>
                  <TableCell>{complaint.student_name}</TableCell>
                  <TableCell>{complaint.block_name} - {complaint.room_number}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {complaint.category}
                    </Badge>
                  </TableCell>
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
                      {complaint.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{complaint.assigned_to_name || 'Unassigned'}</TableCell>
                  <TableCell>{new Date(complaint.submitted_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {complaint.status === 'open' && (
                        <Select onValueChange={(value) => handleAssignComplaint(complaint.id, parseInt(value))}>
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="Assign" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableStaff.filter(staff => staff.id).map((staff) => (
                              <SelectItem key={staff.id} value={staff.id.toString()}>
                                {staff.user.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {complaint.status === 'in_progress' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => HostelAPI.resolveComplaint(complaint.id, 'Resolved by admin')}
                        >
                          Resolve
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedComplaint(complaint);
                          // Could open details modal here
                        }}
                      >
                        View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Complaint Modal */}
      <Dialog open={showCreateComplaintModal} onOpenChange={setShowCreateComplaintModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit New Complaint</DialogTitle>
            <DialogDescription>
              Report a hostel-related issue or complaint.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="complaint_student">Student *</Label>
              <Select 
                value={complaintForm.student?.toString() || ''} 
                onValueChange={(value) => setComplaintForm({...complaintForm, student: parseInt(value)})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select the student making complaint" />
                </SelectTrigger>
                <SelectContent>
                  {studentsData.filter(student => student.id).map((student) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.user.first_name} {student.user.last_name} - {student.admission_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="complaint_room">Room *</Label>
              <Select 
                value={complaintForm.room?.toString() || ''} 
                onValueChange={(value) => setComplaintForm({...complaintForm, room: parseInt(value)})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select the room" />
                </SelectTrigger>
                <SelectContent>
                  {hostelRooms.filter(room => room.id).map((room) => (
                    <SelectItem key={room.id} value={room.id.toString()}>
                      {room.block_name} - Room {room.room_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="complaint_title">Complaint Title *</Label>
              <Input
                id="complaint_title"
                value={complaintForm.title}
                onChange={(e) => setComplaintForm({...complaintForm, title: e.target.value})}
                placeholder="Brief title for the complaint"
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="complaint_category">Category *</Label>
                <Select 
                  value={complaintForm.category} 
                  onValueChange={(value: 'maintenance' | 'cleanliness' | 'food' | 'security' | 'other') => 
                    setComplaintForm({...complaintForm, category: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="cleanliness">Cleanliness</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="complaint_priority">Priority *</Label>
                <Select 
                  value={complaintForm.priority} 
                  onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                    setComplaintForm({...complaintForm, priority: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="complaint_description">Description *</Label>
              <textarea
                id="complaint_description"
                value={complaintForm.description}
                onChange={(e) => setComplaintForm({...complaintForm, description: e.target.value})}
                placeholder="Detailed description of the complaint"
                className="mt-1 w-full min-h-[80px] px-3 py-2 border border-input rounded-md text-sm resize-none"
                rows={3}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm p-3 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateComplaintModal(false);
                setComplaintForm({
                  student: null, room: null, title: '', description: '', 
                  category: 'maintenance', priority: 'medium'
                });
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateComplaint}
              disabled={!complaintForm.student || !complaintForm.room || !complaintForm.title.trim() || 
                       !complaintForm.description.trim() || loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Complaint
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Render hostel leave requests
  const renderHostelLeaves = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Leave Requests</h3>
        <Button onClick={() => setShowCreateLeaveModal(true)}>
          <Calendar className="h-4 w-4 mr-2" />
          New Leave Request
        </Button>
      </div>
      
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hostelLeaveRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.student_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {request.leave_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(request.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(request.end_date).toLocaleDateString()}</TableCell>
                  <TableCell>{request.destination}</TableCell>
                  <TableCell>
                    <Badge variant={
                      request.status === 'approved' ? 'default' :
                      request.status === 'rejected' ? 'destructive' : 'secondary'
                    }>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(request.submitted_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {request.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApproveLeaveRequest(request.id, 'Approved by admin')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectLeaveRequest(request.id, 'Rejected by admin')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedLeaveRequest(request);
                          // Could open details modal here
                        }}
                      >
                        View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Leave Request Modal */}
      <Dialog open={showCreateLeaveModal} onOpenChange={setShowCreateLeaveModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit Leave Request</DialogTitle>
            <DialogDescription>
              Submit a new leave request for a hostel student.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="leave_student">Student *</Label>
              <Select 
                value={leaveForm.student?.toString() || ''} 
                onValueChange={(value) => setLeaveForm({...leaveForm, student: parseInt(value)})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select student requesting leave" />
                </SelectTrigger>
                <SelectContent>
                  {studentsData.filter(student => student.id).map((student) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.user.first_name} {student.user.last_name} - {student.admission_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="leave_type">Leave Type *</Label>
              <Select 
                value={leaveForm.leave_type} 
                onValueChange={(value: 'home' | 'medical' | 'emergency' | 'personal' | 'academic' | 'other') => 
                  setLeaveForm({...leaveForm, leave_type: value})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home Visit</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={leaveForm.start_date}
                  onChange={(e) => setLeaveForm({...leaveForm, start_date: e.target.value})}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={leaveForm.end_date}
                  onChange={(e) => setLeaveForm({...leaveForm, end_date: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="expected_return_date">Expected Return Date *</Label>
              <Input
                id="expected_return_date"
                type="date"
                value={leaveForm.expected_return_date}
                onChange={(e) => setLeaveForm({...leaveForm, expected_return_date: e.target.value})}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="destination">Destination *</Label>
              <Input
                id="destination"
                value={leaveForm.destination}
                onChange={(e) => setLeaveForm({...leaveForm, destination: e.target.value})}
                placeholder="Where is the student going?"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="emergency_contact">Emergency Contact</Label>
              <Input
                id="emergency_contact"
                value={leaveForm.emergency_contact}
                onChange={(e) => setLeaveForm({...leaveForm, emergency_contact: e.target.value})}
                placeholder="Contact number during leave"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="leave_reason">Reason for Leave *</Label>
              <textarea
                id="leave_reason"
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                placeholder="Detailed reason for the leave request"
                className="mt-1 w-full min-h-[80px] px-3 py-2 border border-input rounded-md text-sm resize-none"
                rows={3}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm p-3 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateLeaveModal(false);
                setLeaveForm({
                  student: null, leave_type: 'home', start_date: '', end_date: '',
                  expected_return_date: '', reason: '', emergency_contact: '', destination: ''
                });
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateLeaveRequest}
              disabled={!leaveForm.student || !leaveForm.start_date || !leaveForm.end_date || 
                       !leaveForm.expected_return_date || !leaveForm.destination.trim() || 
                       !leaveForm.reason.trim() || loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Enhanced empty tab with reload button
  const renderEmptyTabWithReload = (title: string, description: string, reloadFunction: () => void) => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={reloadFunction}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Reload
        </Button>
      </div>
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

  // Blockchain Marks Tab
  const renderMarksTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Blockchain Marks Management</h2>
          <p className="text-gray-600 mt-1">Immutable and transparent student marks recording using blockchain technology</p>
        </div>
        <Button 
          onClick={() => window.open('/blockchain-marks', '_blank')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Shield className="h-4 w-4 mr-2" />
          Open Blockchain Marks Portal
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Blockchain Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">247</div>
            <p className="text-xs text-muted-foreground">Total records</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Verified Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">243</div>
            <p className="text-xs text-muted-foreground">Cryptographically secured</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Pending Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">4</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Network Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Active</div>
            <p className="text-xs text-muted-foreground">Hardhat local network</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Blockchain Activity
          </CardTitle>
          <CardDescription>
            Latest marks records added to the blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { student: "Rahul Kumar", subject: "Mathematics", marks: 85, time: "2 minutes ago", hash: "0x1234...5678" },
              { student: "Priya Sharma", subject: "Physics", marks: 92, time: "15 minutes ago", hash: "0x2345...6789" },
              { student: "Amit Singh", subject: "Chemistry", marks: 78, time: "1 hour ago", hash: "0x3456...7890" },
              { student: "Sneha Patel", subject: "English", marks: 88, time: "2 hours ago", hash: "0x4567...8901" },
            ].map((record, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{record.student}</p>
                    <p className="text-sm text-gray-600">{record.subject} • {record.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-primary">{record.marks}/100</p>
                  <p className="text-xs text-gray-500 font-mono">{record.hash}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Blockchain Benefits */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Shield className="h-5 w-5" />
            Blockchain Technology Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Immutable Records</h4>
                  <p className="text-sm text-gray-600">Once recorded, marks cannot be altered or deleted</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Database className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">Transparent Verification</h4>
                  <p className="text-sm text-gray-600">All transactions are publicly verifiable on the blockchain</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Shield className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium">Cryptographic Security</h4>
                  <p className="text-sm text-gray-600">Advanced encryption protects against tampering</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Activity className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium">Decentralized Storage</h4>
                  <p className="text-sm text-gray-600">No single point of failure, distributed across network</p>
                </div>
              </div>
            </div>
          </div>
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

  // Render library management tab
  const renderLibraryTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Library Management</h2>
          <Button onClick={reloadLibraryData} disabled={libraryLoading}>
            {libraryLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        {/* Library Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Books</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {libraryData.analytics?.total_books ?? libraryData.books.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Available: {libraryData.books.filter(book => book.available_copies > 0).length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Active Borrowings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {libraryData.analytics?.total_borrowed ?? libraryData.userBooks.filter(ub => ub.type === 'BORROWED' && ub.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Limit: {libraryData.stats?.checkout_limit ?? 5} per student
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Overdue Books</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {libraryData.analytics?.total_overdue ?? libraryData.userBooks.filter(ub => ub.is_overdue).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Fines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{libraryData.analytics?.total_fines ?? libraryData.transactions
                  .filter(t => t.transaction_type === 'fine_payment')
                  .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                  .toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Outstanding fines
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Library Management Tabs */}
        <div className="space-y-4">
          <div className="flex space-x-4 border-b">
            <button
              className={`pb-2 px-4 text-sm font-medium ${
                libraryActiveTab === 'books' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setLibraryActiveTab('books')}
            >
              Book Catalog
            </button>
            <button
              className={`pb-2 px-4 text-sm font-medium ${
                libraryActiveTab === 'borrowings' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setLibraryActiveTab('borrowings')}
            >
              Active Borrowings
            </button>
            <button
              className={`pb-2 px-4 text-sm font-medium ${
                libraryActiveTab === 'overdue' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setLibraryActiveTab('overdue')}
            >
              Overdue Books
            </button>
            <button
              className={`pb-2 px-4 text-sm font-medium ${
                libraryActiveTab === 'transactions' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setLibraryActiveTab('transactions')}
            >
              Transactions
            </button>
          </div>

          {libraryActiveTab === 'books' && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Book Catalog</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowAddBookModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Book
                    </Button>
                  </div>
                </div>
                <div className="flex gap-4 mt-4">
                  <div className="flex gap-2 flex-1">
                    <Input
                      placeholder="Search Google Books..."
                      value={bookSearchQuery}
                      onChange={(e) => setBookSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchGoogleBooks()}
                    />
                    <Button onClick={searchGoogleBooks} disabled={searchingBooks}>
                      {searchingBooks && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Search
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search Results */}
                  {bookSearchResults.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Search Results</h4>
                      <div className="grid gap-4 max-h-60 overflow-y-auto">
                        {bookSearchResults.map((book, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex gap-3">
                              {book.image_links && (
                                <img 
                                  src={book.image_links} 
                                  alt={book.title}
                                  className="w-12 h-16 object-cover rounded"
                                />
                              )}
                              <div>
                                <h5 className="font-medium">{book.title}</h5>
                                <p className="text-sm text-gray-600">{book.author}</p>
                                <p className="text-xs text-gray-500">{book.publisher} • {book.publication_year}</p>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => addBookToLibrary(book)}
                              variant="outline"
                            >
                              Add to Library
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Current Library Books */}
                  <div>
                    <h4 className="font-medium mb-3">Current Library ({libraryData.books.length} books)</h4>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Book Details</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Copies</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {libraryData.books.slice(0, 10).map((book) => (
                            <TableRow key={book.id}>
                              <TableCell>
                                <div className="flex gap-3">
                                  {book.image_links && (
                                    <img 
                                      src={book.image_links} 
                                      alt={book.title}
                                      className="w-8 h-10 object-cover rounded"
                                    />
                                  )}
                                  <div>
                                    <div className="font-medium">{book.title}</div>
                                    <div className="text-sm text-gray-600">{book.author}</div>
                                    {book.isbn && (
                                      <div className="text-xs text-gray-500">ISBN: {book.isbn}</div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{book.category || 'General'}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div>Total: {book.total_copies}</div>
                                  <div className="text-green-600">Available: {book.available_copies}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={book.available_copies > 0 ? "default" : "destructive"}>
                                  {book.available_copies > 0 ? "Available" : "All Borrowed"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setSelectedBook(book)}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {libraryActiveTab === 'borrowings' && (
            <Card>
              <CardHeader>
                <CardTitle>Active Borrowings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Book</TableHead>
                        <TableHead>Borrowed Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {libraryData.userBooks
                        .filter(ub => ub.type === 'BORROWED' && ub.status === 'active')
                        .slice(0, 10)
                        .map((userBook) => (
                        <TableRow key={userBook.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{userBook.user_name}</div>
                              <div className="text-sm text-gray-600">{userBook.user_email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{userBook.book_title}</div>
                              <div className="text-sm text-gray-600">{userBook.book_author}</div>
                            </div>
                          </TableCell>
                          <TableCell>{new Date(userBook.borrowed_date!).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(userBook.due_date!).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={userBook.is_overdue ? "destructive" : "default"}>
                              {userBook.is_overdue ? "Overdue" : "Active"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              Mark Returned
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {libraryActiveTab === 'overdue' && (
            <Card>
              <CardHeader>
                <CardTitle>Overdue Books</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Book</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Days Overdue</TableHead>
                        <TableHead>Fine</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {libraryData.userBooks
                        .filter(ub => ub.is_overdue)
                        .map((userBook) => (
                        <TableRow key={userBook.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{userBook.user_name}</div>
                              <div className="text-sm text-gray-600">{userBook.user_email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{userBook.book_title}</div>
                              <div className="text-sm text-gray-600">{userBook.book_author}</div>
                            </div>
                          </TableCell>
                          <TableCell>{new Date(userBook.due_date!).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">{userBook.days_overdue} days</Badge>
                          </TableCell>
                          <TableCell>₹{userBook.current_fine}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline">
                                Send Reminder
                              </Button>
                              <Button size="sm" variant="outline">
                                Mark Returned
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {libraryActiveTab === 'transactions' && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {libraryData.transactions.slice(0, 10).map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{transaction.user_name}</div>
                              <div className="text-sm text-gray-600">{transaction.user_email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {transaction.transaction_type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>₹{transaction.amount}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverviewTab();
      case "students":
        return renderStudentsTab();
      case "users":
        return renderUsersTab();
      case "admissions":
        return renderAdmissionsTab();
      case "hostel":
        return renderHostelTab();
      case "library":
        return renderLibraryTab();
      case "fees":
        return renderFeesTab();
      case "attendance":
        return renderEmptyTabWithReload("Attendance Management", "Attendance data will be displayed here when available.", reloadAttendanceData);
      case "exams":
        return renderEmptyTabWithReload("Examination Management", "Exam data will be displayed here when available.", reloadExamsData);
      case "marks":
        return renderMarksTab();
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

              {/* Student Profile Card - Show only when User ID is allocated */}
              {(() => {
                const schoolDecision = selectedApplication.school_decisions?.find(
                  decision => {
                    const decisionSchoolId = typeof decision.school === 'object' 
                      ? decision.school.id 
                      : decision.school;
                    return decisionSchoolId === user?.school?.id;
                  }
                );
                
                if (schoolDecision?.user_id_allocated) {
                  return (
                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                          <UserCheck className="h-5 w-5" />
                          Student Portal Access
                        </CardTitle>
                        <CardDescription className="text-blue-600">
                          User account has been created and is active
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="font-medium text-blue-700">Login Credentials</Label>
                            <div className="space-y-1 text-sm">
                              <div>
                                <Label className="text-gray-600 font-medium">Username/Email:</Label>
                                <p className="font-mono text-blue-800 bg-white px-2 py-1 rounded border break-all">
                                  {schoolDecision.student_username || 'Not available'}
                                </p>
                              </div>
                              <div>
                                <Label className="text-gray-600 font-medium">Portal Access:</Label>
                                <div className="flex items-center gap-2">
                                  <Badge variant="default" className="bg-green-100 text-green-800">
                                    Active
                                  </Badge>
                                  <span className="text-xs text-gray-600">Ready to login</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="font-medium text-blue-700">Student Profile</Label>
                            <div className="space-y-1 text-sm">
                              <div>
                                <Label className="text-gray-600 font-medium">Full Name:</Label>
                                <p className="text-gray-800">
                                  {selectedApplication.applicant_name}
                                </p>
                              </div>
                              <div>
                                <Label className="text-gray-600 font-medium">Role:</Label>
                                <p className="text-gray-800 capitalize">Student</p>
                              </div>
                              <div>
                                <Label className="text-gray-600 font-medium">Status:</Label>
                                <Badge variant="default">
                                  Active
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="font-medium text-blue-700">Account Details</Label>
                            <div className="space-y-1 text-sm">
                              <div>
                                <Label className="text-gray-600 font-medium">User ID Allocated:</Label>
                                <p className="text-gray-800">
                                  {schoolDecision.user_id_allocated_at ? 
                                    new Date(schoolDecision.user_id_allocated_at).toLocaleDateString() : 
                                    'Recently'
                                  }
                                </p>
                              </div>
                              <div>
                                <Label className="text-gray-600 font-medium">Course:</Label>
                                <p className="text-gray-800">
                                  {selectedApplication.course_applied}
                                </p>
                              </div>
                              <div>
                                <Label className="text-gray-600 font-medium">School:</Label>
                                <p className="text-gray-800">
                                  {typeof schoolDecision.school === 'object' ? 
                                    schoolDecision.school.school_name : 
                                    user?.school?.school_name || 'Current School'
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                            <div className="text-sm">
                              <p className="text-green-800 font-medium mb-1">Portal Access Ready</p>
                              <p className="text-green-700">
                                The student can now access the student portal using their username and the password 
                                that was sent to their email address during account creation.
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                return null;
              })()}

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

      {/* Create Staff Modal - Multi-step Form */}
      <Dialog open={showCreateStaffModal} onOpenChange={setShowCreateStaffModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New Staff Member - Step {staffCreationStep} of 3
            </DialogTitle>
            <DialogDescription>
              Create a new staff account and profile for your school
            </DialogDescription>
          </DialogHeader>
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${stepNum <= staffCreationStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {stepNum < staffCreationStep ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    stepNum
                  )}
                </div>
                {stepNum < 3 && (
                  <div className={`
                    h-1 w-16 mx-2
                    ${stepNum < staffCreationStep ? 'bg-primary' : 'bg-muted'}
                  `} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Information */}
          {staffCreationStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <p className="text-muted-foreground">Enter the staff member's personal details</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={createStaffForm.first_name}
                    onChange={(e) => setCreateStaffForm({...createStaffForm, first_name: e.target.value})}
                    placeholder="Enter first name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={createStaffForm.last_name}
                    onChange={(e) => setCreateStaffForm({...createStaffForm, last_name: e.target.value})}
                    placeholder="Enter last name"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="phone_number">Phone Number *</Label>
                  <Input
                    id="phone_number"
                    value={createStaffForm.phone_number}
                    onChange={(e) => setCreateStaffForm({...createStaffForm, phone_number: e.target.value})}
                    placeholder="Enter phone number"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="employee_id_preview">Employee ID *</Label>
                  <Input
                    id="employee_id_preview"
                    value={createStaffForm.employee_id}
                    onChange={(e) => setCreateStaffForm({...createStaffForm, employee_id: e.target.value})}
                    placeholder="Enter employee ID"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email will be auto-generated as: {createStaffForm.role}.{createStaffForm.employee_id}@{schoolStats.school.code ? schoolStats.school.code.slice(-5) : '[school]'}.rj.gov.in
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="role">Role *</Label>
                <Select 
                  value={createStaffForm.role} 
                  onValueChange={(value: string) => {
                    if (['admin', 'faculty', 'librarian'].includes(value)) {
                      setCreateStaffForm({...createStaffForm, role: value as 'admin' | 'faculty' | 'librarian'});
                    }
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="faculty">Faculty {activeUserTab === 'wardens' ? '(Warden)' : '(Teacher/Warden)'}</SelectItem>
                    <SelectItem value="librarian">Librarian</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground mt-1 space-y-1">
                  {activeUserTab === 'teachers' && (
                    <p>Creating a faculty member for teaching responsibilities</p>
                  )}
                  {activeUserTab === 'wardens' && (
                    <p>Creating a faculty member who will be assigned warden duties for hostel management</p>
                  )}
                  {activeUserTab === 'librarians' && (
                    <p>Creating a librarian for library management</p>
                  )}
                  {activeUserTab === 'staff' && (
                    <p>Create admin for full administrative access, or faculty for teaching/warden duties</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Employment Details */}
          {staffCreationStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold">Employment Details</h3>
                <p className="text-muted-foreground">Enter employment and job-related information</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="employee_id">Employee ID *</Label>
                  <Input
                    id="employee_id"
                    value={createStaffForm.employee_id}
                    onChange={(e) => setCreateStaffForm({...createStaffForm, employee_id: e.target.value})}
                    placeholder="Enter employee ID"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="date_of_joining">Date of Joining *</Label>
                  <Input
                    id="date_of_joining"
                    type="date"
                    value={createStaffForm.date_of_joining}
                    onChange={(e) => setCreateStaffForm({...createStaffForm, date_of_joining: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Input
                    id="department"
                    value={createStaffForm.department}
                    onChange={(e) => setCreateStaffForm({...createStaffForm, department: e.target.value})}
                    placeholder="e.g., Computer Science, Administration"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="designation">Designation *</Label>
                  <Input
                    id="designation"
                    value={createStaffForm.designation}
                    onChange={(e) => setCreateStaffForm({...createStaffForm, designation: e.target.value})}
                    placeholder="e.g., Professor, Assistant, Coordinator"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Additional Information */}
          {staffCreationStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold">Additional Information</h3>
                <p className="text-muted-foreground">Optional details to complete the profile</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="qualification">Qualification</Label>
                  <Input
                    id="qualification"
                    value={createStaffForm.qualification}
                    onChange={(e) => setCreateStaffForm({...createStaffForm, qualification: e.target.value})}
                    placeholder="e.g., M.Tech, Ph.D, B.Ed"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="experience_years">Experience (Years)</Label>
                  <Input
                    id="experience_years"
                    type="number"
                    min="0"
                    value={createStaffForm.experience_years}
                    onChange={(e) => setCreateStaffForm({...createStaffForm, experience_years: parseInt(e.target.value) || 0})}
                    placeholder="Years of experience"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="mt-8 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3">Review Staff Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Name:</strong> {createStaffForm.first_name} {createStaffForm.last_name}
                  </div>
                  <div>
                    <strong>Auto-generated Email:</strong> {createStaffForm.role}.{createStaffForm.employee_id}@{schoolStats.school.code ? schoolStats.school.code.slice(-5) : 'DEFLT'}.rj.gov.in
                  </div>
                  <div>
                    <strong>Phone:</strong> {createStaffForm.phone_number}
                  </div>
                  <div>
                    <strong>Role:</strong> {createStaffForm.role.charAt(0).toUpperCase() + createStaffForm.role.slice(1)}
                  </div>
                  <div>
                    <strong>Employee ID:</strong> {createStaffForm.employee_id}
                  </div>
                  <div>
                    <strong>Department:</strong> {createStaffForm.department}
                  </div>
                  <div>
                    <strong>Designation:</strong> {createStaffForm.designation}
                  </div>
                  <div>
                    <strong>Date of Joining:</strong> {createStaffForm.date_of_joining}
                  </div>
                  {createStaffForm.qualification && (
                    <div>
                      <strong>Qualification:</strong> {createStaffForm.qualification}
                    </div>
                  )}
                  {createStaffForm.experience_years > 0 && (
                    <div>
                      <strong>Experience:</strong> {createStaffForm.experience_years} years
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm p-3 bg-red-50 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <div>
              {staffCreationStep > 1 && (
                <Button 
                  variant="outline" 
                  onClick={() => setStaffCreationStep(staffCreationStep - 1)}
                  disabled={createStaffLoading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateStaffModal(false);
                  setStaffCreationStep(1);
                  setError(null);
                }}
                disabled={createStaffLoading}
              >
                Cancel
              </Button>
              
              {staffCreationStep < 3 ? (
                <Button 
                  onClick={() => {
                    // Validate current step before proceeding
                    if (staffCreationStep === 1) {
                      const basicRequired = ['first_name', 'last_name', 'phone_number'];
                      const missingFields = basicRequired.filter(field => !createStaffForm[field as keyof typeof createStaffForm]);
                      if (missingFields.length > 0) {
                        setError(`Please fill in: ${missingFields.join(', ')}`);
                        return;
                      }
                    } else if (staffCreationStep === 2) {
                      const employmentRequired = ['employee_id', 'department', 'designation', 'date_of_joining'];
                      const missingFields = employmentRequired.filter(field => !createStaffForm[field as keyof typeof createStaffForm]);
                      if (missingFields.length > 0) {
                        setError(`Please fill in: ${missingFields.join(', ')}`);
                        return;
                      }
                    }
                    setError(null);
                    setStaffCreationStep(staffCreationStep + 1);
                  }}
                  disabled={createStaffLoading}
                >
                  Next
                  <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                </Button>
              ) : (
                <Button 
                  onClick={handleCreateStaff} 
                  disabled={createStaffLoading}
                >
                  {createStaffLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Staff Member
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Staff Credentials Modal */}
      <Dialog open={showCredentialsModal} onOpenChange={setShowCredentialsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Staff Login Credentials
            </DialogTitle>
            <DialogDescription>
              Please share these credentials with {staffCredentials?.staffName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <div className="flex items-center justify-between mt-1 p-2 bg-background rounded border">
                  <span className="text-sm font-mono">{staffCredentials?.email}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigator.clipboard.writeText(staffCredentials?.email || '')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Temporary Password</Label>
                <div className="flex items-center justify-between mt-1 p-2 bg-background rounded border">
                  <span className="text-sm font-mono">{staffCredentials?.password}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigator.clipboard.writeText(staffCredentials?.password || '')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground p-3 bg-yellow-50 border border-yellow-200 rounded">
              <strong>Important:</strong> Please ask the staff member to change their password on first login for security.
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button 
              onClick={() => {
                setShowCredentialsModal(false);
                setStaffCredentials(null);
              }}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Book Modal */}
      <Dialog open={showAddBookModal} onOpenChange={setShowAddBookModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Book</DialogTitle>
            <DialogDescription>
              Add a new book to the library catalog manually.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="book-title">Title *</Label>
                <Input
                  id="book-title"
                  value={addBookForm.title}
                  onChange={(e) => setAddBookForm(prev => ({...prev, title: e.target.value}))}
                  placeholder="Enter book title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="book-author">Author *</Label>
                <Input
                  id="book-author"
                  value={addBookForm.author}
                  onChange={(e) => setAddBookForm(prev => ({...prev, author: e.target.value}))}
                  placeholder="Enter author name"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="book-isbn">ISBN</Label>
                <Input
                  id="book-isbn"
                  value={addBookForm.isbn}
                  onChange={(e) => setAddBookForm(prev => ({...prev, isbn: e.target.value}))}
                  placeholder="Enter ISBN"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="book-publisher">Publisher</Label>
                <Input
                  id="book-publisher"
                  value={addBookForm.publisher}
                  onChange={(e) => setAddBookForm(prev => ({...prev, publisher: e.target.value}))}
                  placeholder="Enter publisher"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="book-year">Publication Year</Label>
                <Input
                  id="book-year"
                  type="number"
                  value={addBookForm.publication_year}
                  onChange={(e) => setAddBookForm(prev => ({...prev, publication_year: parseInt(e.target.value) || new Date().getFullYear()}))}
                  placeholder="Year"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="book-copies">Total Copies</Label>
                <Input
                  id="book-copies"
                  type="number"
                  value={addBookForm.total_copies}
                  onChange={(e) => setAddBookForm(prev => ({...prev, total_copies: parseInt(e.target.value) || 1}))}
                  placeholder="Number of copies"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="book-price">Price (₹)</Label>
                <Input
                  id="book-price"
                  value={addBookForm.price}
                  onChange={(e) => setAddBookForm(prev => ({...prev, price: e.target.value}))}
                  placeholder="Book price"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="book-category">Category</Label>
                <Input
                  id="book-category"
                  value={addBookForm.category}
                  onChange={(e) => setAddBookForm(prev => ({...prev, category: e.target.value}))}
                  placeholder="e.g., Fiction, Science, History"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="book-shelf">Shelf Location</Label>
                <Input
                  id="book-shelf"
                  value={addBookForm.shelf_location}
                  onChange={(e) => setAddBookForm(prev => ({...prev, shelf_location: e.target.value}))}
                  placeholder="e.g., A1, B2-Top"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="book-description">Description</Label>
              <textarea
                id="book-description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={addBookForm.description}
                onChange={(e) => setAddBookForm(prev => ({...prev, description: e.target.value}))}
                placeholder="Brief description of the book"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowAddBookModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateBook}
              disabled={!addBookForm.title || !addBookForm.author}
            >
              Add Book
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </EnhancedDashboardLayout>
  );
}