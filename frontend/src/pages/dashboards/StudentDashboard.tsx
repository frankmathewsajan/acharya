import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EnhancedDashboardLayout from "@/components/EnhancedDashboardLayout";
import PaymentModal from "@/components/ui/PaymentModal";
import ReceiptModal from "@/components/ui/ReceiptModal";
import { extractPromiseData, extractApiData } from "@/lib/utils/apiHelpers";
import { 
  Calendar, 
  BarChart3, 
  BookOpen, 
  FileText, 
  Bell, 
  Clock,
  TrendingUp,
  Download,
  Eye,
  CheckCircle,
  AlertCircle,
  User,
  IdCard,
  LibraryBig,
  WalletCards,
  Home,
  RefreshCw,
  MessageSquare,
  Send,
  CreditCard
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  feeService, 
  attendanceService, 
  examService, 
  libraryService, 
  notificationService,
} from "@/lib/api/services";
import {
  FeeInvoice,
  AttendanceRecord,
  ExamResult,
  BookBorrowRecord,
  Notice
} from "@/lib/api/types";
import { HostelAPI, HostelAllocation, HostelComplaint, HostelLeaveRequest } from "@/services/hostelAPI";
import { useToast } from "@/hooks/use-toast";

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<Date>(new Date());
  const [data, setData] = useState({
    fees: [] as any[], // Changed to any[] to handle both fees and admission payments
    attendance: [] as AttendanceRecord[],
    results: [] as ExamResult[],
    borrowedBooks: [] as BookBorrowRecord[],
    notices: [] as Notice[],
  });

  // Hostel state
  const [studentAllocation, setStudentAllocation] = useState<HostelAllocation | null>(null);
  const [studentComplaints, setStudentComplaints] = useState<HostelComplaint[]>([]);
  const [studentLeaveRequests, setStudentLeaveRequests] = useState<HostelLeaveRequest[]>([]);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  
  // Room selection state
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // Booking confirmation modal state
  const [showBookingConfirmationModal, setShowBookingConfirmationModal] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState<any>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  // Receipt modal state
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  
  const [complaintForm, setComplaintForm] = useState({
    title: '',
    description: '',
    category: 'maintenance' as 'maintenance' | 'cleanliness' | 'food' | 'security' | 'other',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });
  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'home' as 'home' | 'medical' | 'emergency' | 'personal' | 'academic' | 'other',
    start_date: '',
    end_date: '',
    reason: '',
    destination: '',
    emergency_contact: ''
  });

  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Live clock update
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format IST time
  const istString = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    month: 'long',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(now);

  useEffect(() => {
    if (user && user.role === 'student') {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      console.log('💰 DEBUG: Loading dashboard data for user:', user?.id);
      
      // Load all dashboard data in parallel
      const [feesData, attendanceData, resultsData, libraryData, noticesData] = await Promise.allSettled([
        feeService.getAllPayments(),
        attendanceService.getAttendanceRecords({ student: user?.id }),
        examService.getExamResults({ student: user?.id }),
        libraryService.getBorrowRecords({ student: user?.id }),
        notificationService.getNotices({ target_roles: ['student', 'all'] }),
      ]);

      console.log('💰 DEBUG: Fees data received:', feesData);
      console.log('💰 DEBUG: Extracted fees data:', extractPromiseData(feesData));

      setData({
        fees: extractPromiseData(feesData),
        attendance: extractPromiseData(attendanceData),
        results: extractPromiseData(resultsData),
        borrowedBooks: extractPromiseData(libraryData),
        notices: extractPromiseData(noticesData),
      });

      // Load hostel data separately
      await loadHostelData();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load some dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load student's hostel data
  const loadHostelData = async () => {
    try {
      if (!user?.id) return;
      
      console.log('🏠 DEBUG: Loading hostel data for user:', user.email);
      console.log('🏠 DEBUG: User role:', user.role);
      
      // Get student's allocation - backend automatically filters by current user's student_profile
      const allocations = await HostelAPI.getAllocations();
      console.log('🏠 DEBUG: All allocations received:', allocations);
      
      const currentAllocation = allocations.find(a => a.status === 'active' || a.status === 'pending');
      console.log('🏠 DEBUG: Current allocation found:', currentAllocation);
      
      setStudentAllocation(currentAllocation || null);

      // Get student's complaints - backend automatically filters by current user
      const complaints = await HostelAPI.getComplaints();
      setStudentComplaints(complaints);

      // Get student's leave requests - backend automatically filters by current user
      const leaveRequests = await HostelAPI.getLeaveRequests();
      setStudentLeaveRequests(leaveRequests);
    } catch (error) {
      console.error('🏠 ERROR: Loading hostel data failed:', error);
    }
  };

  // Handle complaint submission
  const handleSubmitComplaint = async () => {
    try {
      if (!user?.id || !studentAllocation) {
        toast({
          title: "Error",
          description: "You must be allocated to a hostel room to submit complaints",
          variant: "destructive",
        });
        return;
      }

      await HostelAPI.createComplaint({
        student: user.id,
        room: studentAllocation.bed, // Bed ID, which complaint associates with room
        ...complaintForm
      });

      toast({
        title: "Success",
        description: "Complaint submitted successfully",
      });

      setShowComplaintModal(false);
      setComplaintForm({
        title: '',
        description: '',
        category: 'maintenance',
        priority: 'medium'
      });
      await loadHostelData();
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast({
        title: "Error",
        description: "Failed to submit complaint",
        variant: "destructive",
      });
    }
  };

  // Handle leave request submission
  const handleSubmitLeaveRequest = async () => {
    try {
      if (!user?.id) {
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive",
        });
        return;
      }

      await HostelAPI.createLeaveRequest({
        student: user.id,
        ...leaveForm
      });

      toast({
        title: "Success",
        description: "Leave request submitted successfully",
      });

      setShowLeaveModal(false);
      setLeaveForm({
        leave_type: 'home',
        start_date: '',
        end_date: '',
        reason: '',
        destination: '',
        emergency_contact: ''
      });
      await loadHostelData();
    } catch (error) {
      console.error('Error submitting leave request:', error);
      toast({
        title: "Error",
        description: "Failed to submit leave request",
        variant: "destructive",
      });
    }
  };

  // Load available rooms for booking
  const loadAvailableRooms = async () => {
    try {
      setLoadingRooms(true);
      const rooms = await HostelAPI.getAvailableRoomsForBooking();
      setAvailableRooms(rooms);
    } catch (error) {
      console.error('Error loading available rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load available rooms",
        variant: "destructive",
      });
    } finally {
      setLoadingRooms(false);
    }
  };

  // Handle room booking
  const handleBookRoom = async (roomId: number) => {
    try {
      setBookingLoading(true);
      console.log('🏠 DEBUG: Starting room booking for room ID:', roomId);
      
      const result = await HostelAPI.bookRoom(roomId);
      console.log('🏠 DEBUG: Booking response:', result);
      
      // Show booking success with payment details
      toast({
        title: "Room Booked Successfully! 🎉",
        description: `${result.room_details.block_name} Room ${result.room_details.room_number} (Bed ${result.room_details.bed_number}) - Fee: ₹${result.amount}`,
        duration: 5000,
      });
      
      setShowBookingModal(false);
      setSelectedRoom(null);
      
      // Store booking result and show confirmation modal
      setBookingResult(result);
      setShowBookingConfirmationModal(true);
      
      // Reload hostel data and fees data to show the new allocation and invoice
      // Add a small delay to ensure backend transaction is completed
      setTimeout(async () => {
        console.log('🔄 DEBUG: Reloading data after booking...');
        await Promise.all([
          loadHostelData(),
          loadDashboardData() // This will reload fees data
        ]);
        console.log('🔄 DEBUG: Data reload completed');
      }, 1500);
      
    } catch (error: any) {
      console.error('🏠 ERROR: Booking room failed:', error);
      console.error('🏠 ERROR: Response data:', error.response?.data);
      
      toast({
        title: "Booking Failed",
        description: error.response?.data?.error || error.message || "Failed to book room",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const handlePayFee = async (feeId: string) => {
    try {
      console.log('💳 DEBUG: Processing payment for fee ID:', feeId);
      
      // Check if it's a regular fee or admission fee
      if (feeId.startsWith('fee_')) {
        const invoiceId = parseInt(feeId.replace('fee_', ''));
        console.log('💳 DEBUG: Extracted invoice ID:', invoiceId);
        
        // Find the fee to get details for payment confirmation
        const fee = data.fees.find(f => f.id === feeId);
        if (fee) {
          // Open payment modal instead of using window.confirm
          setSelectedFeeForPayment(fee);
          setShowPaymentModal(true);
          return;
        }
        
      } else if (feeId.startsWith('admission_')) {
        // For admission fees, we might need a different endpoint or handle differently
        toast({
          title: "Info",
          description: "Admission fee payment is handled during the admission process",
        });
        return;
      }
      
    } catch (error: any) {
      console.error('💳 ERROR: Payment failed:', error);
      console.error('💳 ERROR: Response data:', error.response?.data);
      
      toast({
        title: "Payment Failed",
        description: error.response?.data?.error || error.error || "Failed to process payment",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  // Handle payment confirmation from modal
  const handlePaymentConfirm = async (paymentMethod: string) => {
    if (!selectedFeeForPayment) return;
    
    setPaymentLoading(true);
    try {
      const invoiceId = parseInt(selectedFeeForPayment.id.replace('fee_', ''));
      const transactionId = `TXN${Date.now()}`;
      
      const paymentData = {
        payment_method: paymentMethod,
        transaction_id: transactionId,
      };
      
      console.log('💳 DEBUG: Sending payment data:', paymentData);
      const paymentResult = await feeService.processPayment(invoiceId, paymentData);
      console.log('💳 DEBUG: Payment result:', paymentResult);
      
      // Close payment modal
      setShowPaymentModal(false);
      
      toast({
        title: "Payment Successful! 🎉",
        description: `Payment of ₹${selectedFeeForPayment.amount} processed successfully.`,
        duration: 5000,
      });

      // Prepare receipt data
      const receiptInfo = {
        transactionId,
        amount: selectedFeeForPayment.amount,
        paymentMethod,
        description: selectedFeeForPayment.description,
        invoiceNumber: selectedFeeForPayment.invoice_number,
        feeType: selectedFeeForPayment.fee_type,
        studentName: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
        admissionNumber: profile?.admission_number,
        school: user?.school || 'N/A',
        paymentDate: new Date().toLocaleString('en-IN', { 
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      
      setReceiptData(receiptInfo);
      setShowReceiptModal(true);
      
      // Reload fees data to reflect the payment
      console.log('💳 DEBUG: Reloading fees data after payment');
      const feesData = await feeService.getAllPayments();
      setData(prev => ({ ...prev, fees: extractApiData(feesData) }));
      
    } catch (error: any) {
      console.error('💳 ERROR: Payment failed:', error);
      console.error('💳 ERROR: Response data:', error.response?.data);
      
      toast({
        title: "Payment Failed",
        description: error.response?.data?.error || error.error || "Failed to process payment",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setPaymentLoading(false);
      setSelectedFeeForPayment(null);
    }
  };

  // Generate and download receipt
  const generateReceipt = (receiptInfo: any) => {
    console.log('🧾 DEBUG: Generating receipt for:', receiptInfo);
    
    const receiptContent = `
════════════════════════════════════════════════════════════════
                          OFFICIAL RECEIPT
                       Government of Rajasthan
                         ${receiptInfo.school}
════════════════════════════════════════════════════════════════

STUDENT INFORMATION:
────────────────────────────────────────────────────────────────
Name:                    ${receiptInfo.studentName}
Admission Number:        ${receiptInfo.admissionNumber || 'N/A'}
School:                  ${receiptInfo.school}

PAYMENT DETAILS:
────────────────────────────────────────────────────────────────
Description:             ${receiptInfo.description}
Invoice Number:          ${receiptInfo.invoiceNumber}
Fee Type:                ${receiptInfo.feeType || 'General'}
Amount Paid:             ₹${receiptInfo.amount.toLocaleString('en-IN')}

TRANSACTION INFORMATION:
────────────────────────────────────────────────────────────────
Transaction ID:          ${receiptInfo.transactionId}
Payment Method:          ${receiptInfo.paymentMethod.toUpperCase()}
Payment Date:            ${receiptInfo.paymentDate}
Status:                  COMPLETED

────────────────────────────────────────────────────────────────
IMPORTANT NOTES:
• This is a computer-generated receipt and is valid without signature
• Please retain this receipt for your records
• For any queries, contact your school administration
• This receipt serves as proof of payment

GENERATED BY: Educational ERP System - Government of Rajasthan
Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

════════════════════════════════════════════════════════════════
               Thank you for your payment!
════════════════════════════════════════════════════════════════
    `.trim();
    
    const blob = new Blob([receiptContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt_${receiptInfo.invoiceNumber}_${receiptInfo.transactionId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('🧾 DEBUG: Receipt downloaded successfully');
  };

  const calculateAttendancePercentage = () => {
    if (data.attendance.length === 0) return 0;
    const presentCount = data.attendance.filter(record => record.status === 'present').length;
    return Math.round((presentCount / data.attendance.length) * 100);
  };

  const getPendingFees = () => {
    return data.fees.filter(fee => fee.status === 'pending' || fee.status === 'overdue');
  };

  const getRecentResults = () => {
    return data.results.slice(0, 5);
  };

  const downloadReceipt = (feeId: string) => {
    console.log('🧾 DEBUG: Download receipt requested for fee ID:', feeId);
    const fee = data.fees.find(f => f.id === feeId);
    if (!fee) {
      console.error('🧾 ERROR: Fee not found for ID:', feeId);
      toast({
        title: "Error",
        description: "Fee record not found",
        variant: "destructive",
      });
      return;
    }
    
    if (!fee.transaction_id) {
      toast({
        title: "Error",
        description: "No transaction ID found for this payment",
        variant: "destructive",
      });
      return;
    }
    
    // Prepare receipt data for the new generateReceipt function
    const receiptInfo = {
      transactionId: fee.transaction_id,
      amount: fee.amount,
      paymentMethod: fee.payment_method || 'online',
      description: fee.description,
      invoiceNumber: fee.invoice_number,
      feeType: fee.fee_type,
      studentName: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
      admissionNumber: profile?.admission_number,
      school: user?.school || 'N/A',
      paymentDate: new Date(fee.payment_date || Date.now()).toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    
    generateReceipt(receiptInfo);
  };

  const sidebarButton = (key: string, label: string, Icon: any) => (
    <Button 
      variant={activeTab === key ? "default" : "ghost"} 
      className="w-full justify-start hover:translate-x-[2px] transition-transform"
      onClick={() => setActiveTab(key)}
    >
      <Icon className="h-4 w-4 mr-2" />
      <span className="sidebar-label">{label}</span>
    </Button>
  );

  const sidebarContent = (
    <div className="p-3 space-y-1">
      {sidebarButton("home", "Home", Clock)}
      {sidebarButton("overview", "Overview", TrendingUp)}
      {sidebarButton("profile", "Profile & Documents", User)}
      {sidebarButton("admission", "Admission Details", IdCard)}
      {sidebarButton("fees", "Fees & Payments", WalletCards)}
      {sidebarButton("attendance", "Attendance", Calendar)}
      {sidebarButton("marks", "Marks", BarChart3)}
      {sidebarButton("materials", "Course Materials", BookOpen)}
      {sidebarButton("hostel", "Hostel & Library", LibraryBig)}
      {sidebarButton("leave", "Leave Request", FileText)}
      {sidebarButton("announcements", "Announcements", Bell)}
      {sidebarButton("analytics", "Analytics", BarChart3)}
      {sidebarButton("alerts", "Smart Alerts", AlertCircle)}
    </div>
  );

  if (loading) {
    return (
      <EnhancedDashboardLayout title="Student Dashboard" user={user!} profile={profile} sidebarContent={sidebarContent}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </EnhancedDashboardLayout>
    );
  }

  const attendancePercentage = calculateAttendancePercentage();
  const pendingFees = getPendingFees();
  const recentResults = getRecentResults();

  return (
    <EnhancedDashboardLayout
      title="Student Dashboard"
      user={user!}
      profile={profile}
      sidebarContent={sidebarContent}
    >
      <div className="space-y-6">
        {/* Home Tab */}
        {activeTab === "home" && (
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Welcome, {user?.first_name} {user?.last_name}!</h2>
                    <p className="text-blue-100 text-lg">
                      {profile?.admission_number && `Admission No: ${profile.admission_number}`}
                      {profile?.course && ` • ${profile.course}`}
                      {profile?.semester && ` • Semester ${profile.semester}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-100">Indian Standard Time</p>
                    <p className="text-2xl font-semibold font-mono tracking-tight">{istString}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="h-28 justify-start hover:shadow-xl hover:-translate-y-0.5 transition-all bg-white" variant="outline" onClick={() => setActiveTab('attendance')}>
                <Calendar className="h-5 w-5 mr-3 text-blue-600" /> <span className="text-left">View Attendance</span>
              </Button>
              <Button className="h-28 justify-start hover:shadow-xl hover:-translate-y-0.5 transition-all bg-white" variant="outline" onClick={() => setActiveTab('marks')}>
                <BarChart3 className="h-5 w-5 mr-3 text-green-600" /> <span className="text-left">Check Results</span>
              </Button>
              <Button className="h-28 justify-start hover:shadow-xl hover:-translate-y-0.5 transition-all bg-white" variant="outline" onClick={() => setActiveTab('fees')}>
                <WalletCards className="h-5 w-5 mr-3 text-emerald-600" /> <span className="text-left">Pay Fees</span>
              </Button>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="hover:shadow-lg transition">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Attendance</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{attendancePercentage}%</div>
                  <p className="text-xs text-muted-foreground">Overall attendance</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Pending Fees</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">₹{pendingFees.reduce((sum, fee) => sum + Number(fee.amount), 0)}</div>
                  <p className="text-xs text-muted-foreground">{pendingFees.length} pending payments</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Borrowed Books</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{data.borrowedBooks.length}</div>
                  <p className="text-xs text-muted-foreground">books currently borrowed</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Exam Results</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{recentResults.length}</div>
                  <p className="text-xs text-muted-foreground">results available</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Welcome Banner for other tabs */}
        {activeTab !== "home" && (
          <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.first_name} {user?.last_name}!</h2>
                  <p className="text-blue-100">
                    {profile?.admission_number && `Admission No: ${profile.admission_number}`}
                    {profile?.course && ` | ${profile.course}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-100">Academic Year</p>
                  <p className="text-lg font-semibold">2024-25</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Overall Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{attendancePercentage}%</div>
                  <p className="text-xs text-muted-foreground">Based on {data.attendance.length} records</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Fees</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{data.fees.reduce((sum, fee) => sum + Number(fee.amount), 0)}</div>
                  <p className="text-xs text-muted-foreground">₹{pendingFees.reduce((sum, fee) => sum + Number(fee.amount), 0)} pending</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Exam Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.results.length}</div>
                  <p className="text-xs text-muted-foreground">results available</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Notices</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.notices.slice(0, 3).map((notice) => (
                    <div key={notice.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:shadow-sm">
                      <Bell className="h-4 w-4 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium">{notice.title}</p>
                        <p className="text-sm text-gray-600">{new Date(notice.publish_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                  {data.notices.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No notices available</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentResults.map((result) => (
                    <div key={result.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <BarChart3 className="h-4 w-4 text-green-600" />
                      <div className="flex-1">
                        <p className="font-medium">{result.exam}</p>
                        <p className="text-sm text-gray-600">Marks: {result.marks_obtained}/100</p>
                      </div>
                    </div>
                  ))}
                  {recentResults.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No results available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Fees Tab */}
        {activeTab === "fees" && (
          <Card>
            <CardHeader>
              <CardTitle>Fees & Payments</CardTitle>
              <CardDescription>View and pay your fees online</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.fees.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell>
                        <Badge variant={fee.type === "admission" ? "secondary" : "outline"}>
                          {fee.type === "admission" ? "Admission" : "Academic"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{fee.description}</TableCell>
                      <TableCell>₹{fee.amount}</TableCell>
                      <TableCell>
                        {fee.due_date ? new Date(fee.due_date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          fee.status === "paid" || fee.status === "completed" ? "default" : 
                          fee.status === "pending" ? "destructive" : "secondary"
                        }>
                          {fee.status === "completed" ? "paid" : fee.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(fee.status !== "paid" && fee.status !== "completed") ? (
                          fee.type === "fee" ? (
                            <Button size="sm" onClick={() => handlePayFee(fee.id)}>
                              Pay Now
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" disabled>
                              Paid at Admission
                            </Button>
                          )
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => downloadReceipt(fee.id)}>
                            <Download className="h-4 w-4 mr-1" /> Receipt
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.fees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                        No payment records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Attendance Tab */}
        {activeTab === "attendance" && (
          <Card>
            <CardHeader>
              <CardTitle>Attendance Record</CardTitle>
              <CardDescription>Your attendance for the current academic year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl font-bold">{attendancePercentage}%</div>
                  <Progress value={attendancePercentage} className="flex-1" />
                  <div className="text-sm text-gray-600">
                    {data.attendance.filter(a => a.status === 'present').length} present / {data.attendance.length} total
                  </div>
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.attendance.slice(0, 10).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{new Date(record.marked_at).toLocaleDateString()}</TableCell>
                      <TableCell>{'General'}</TableCell>
                      <TableCell>
                        <Badge variant={record.status === 'present' ? "default" : "destructive"}>
                          {record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.attendance.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                        No attendance records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Marks Tab */}
        {activeTab === "marks" && (
          <Card>
            <CardHeader>
              <CardTitle>Academic Results</CardTitle>
              <CardDescription>Your exam results and grades</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Marks Obtained</TableHead>
                    <TableHead>Total Marks</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.results.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">Exam {result.exam}</TableCell>
                      <TableCell>General Subject</TableCell>
                      <TableCell>{result.marks_obtained}</TableCell>
                      <TableCell>100</TableCell>
                      <TableCell>
                        {((result.marks_obtained / 100) * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{result.grade}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.results.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                        No exam results available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Announcements Tab */}
        {activeTab === "announcements" && (
          <Card>
            <CardHeader>
              <CardTitle>School Announcements</CardTitle>
              <CardDescription>Important notices and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.notices.map((notice) => (
                  <div key={notice.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{notice.title}</h3>
                        <p className="text-gray-600 mt-1">{notice.content}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Published: {new Date(notice.publish_date).toLocaleDateString()}</span>
                          <Badge variant="outline">{notice.priority}</Badge>
                        </div>
                      </div>
                      <Bell className="h-5 w-5 text-blue-600 mt-1" />
                    </div>
                  </div>
                ))}
                {data.notices.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No announcements available</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <Card>
            <CardHeader>
              <CardTitle>Profile & Documents</CardTitle>
              <CardDescription>View and update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input defaultValue={user?.first_name} disabled />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input defaultValue={user?.last_name} disabled />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input defaultValue={user?.email} disabled />
                </div>
                <div>
                  <Label>Admission Number</Label>
                  <Input defaultValue={profile?.admission_number} disabled />
                </div>
                <div>
                  <Label>Course</Label>
                  <Input defaultValue={profile?.course} disabled />
                </div>
                <div>
                  <Label>Semester</Label>
                  <Input defaultValue={profile?.semester?.toString()} disabled />
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  To update your profile information, please contact the administration office.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admission Details Tab */}
        {activeTab === "admission" && (
          <Card>
            <CardHeader>
              <CardTitle>Admission Details</CardTitle>
              <CardDescription>Your admission and enrollment information</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Admission Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="default">Confirmed</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Fee Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingFees.length > 0 ? (
                    <div>
                      <div className="text-lg font-semibold text-red-600">
                        ₹{pendingFees.reduce((sum, fee) => sum + Number(fee.amount), 0)} Pending
                      </div>
                      <p className="text-xs text-gray-600">{pendingFees.length} outstanding payments</p>
                    </div>
                  ) : (
                    <Badge variant="default">All Paid</Badge>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Academic Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="default">Active</Badge>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}

        {/* Hostel & Library Tab */}
        {activeTab === "hostel" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Hostel & Library</h2>
              <Button onClick={loadHostelData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {studentAllocation ? (
              // Student has hostel allocation - show current room details
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Home className="h-5 w-5 mr-2" />
                      My Hostel Room
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="font-semibold text-green-800 mb-3">Current Allocation</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Block:</span>
                          <p className="font-medium">{studentAllocation.block_name}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Room Number:</span>
                          <p className="font-medium">{studentAllocation.room_number}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Bed Number:</span>
                          <p className="font-medium">{studentAllocation.bed_number}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Allocation Date:</span>
                          <p className="font-medium">{new Date(studentAllocation.allocation_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <Badge variant={studentAllocation.status === 'active' ? 'default' : 'secondary'}>
                            {studentAllocation.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Show payment status if allocation is pending */}
                    {studentAllocation.status === 'pending' && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="font-semibold text-yellow-800 mb-2">Payment Required</h4>
                        <p className="text-yellow-700 text-sm mb-3">
                          Your room is reserved but payment is required to confirm your allocation.
                        </p>
                        <Button 
                          onClick={() => {
                            // Find the hostel invoice for this allocation
                            const hostelInvoice = data.fees.find(fee => 
                              fee.category === 'hostel' && fee.status === 'pending'
                            );
                            if (hostelInvoice) {
                              handlePayFee(hostelInvoice.id);
                            } else {
                              toast({
                                title: "Invoice Not Found",
                                description: "Please check your Fees & Payments tab for the hostel invoice.",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="bg-yellow-600 hover:bg-yellow-700"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay Hostel Fee
                        </Button>
                      </div>
                    )}

                    {/* Hostel Actions */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        onClick={() => setShowComplaintModal(true)}
                        variant="outline"
                        className="w-full"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Submit Complaint
                      </Button>
                      <Button 
                        onClick={() => setShowLeaveModal(true)}
                        variant="outline"
                        className="w-full"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Leave Request
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Library Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BookOpen className="h-5 w-5 mr-2" />
                      Library Account
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Books Borrowed:</span>
                      <span className="font-semibold">{data.borrowedBooks.length}</span>
                    </div>
                    <div className="space-y-2">
                      {data.borrowedBooks.map((book) => (
                        <div key={book.id} className="flex justify-between items-center p-2 border rounded">
                          <span className="text-sm">Book #{book.book}</span>
                          <span className="text-xs text-gray-600">
                            Due: {new Date(book.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                      {data.borrowedBooks.length === 0 && (
                        <p className="text-gray-500 text-center py-2">No books currently borrowed</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              // Student doesn't have hostel allocation - check for pending invoices or show room selection
              (() => {
                // Check if there's a pending hostel invoice
                const pendingHostelInvoice = data.fees.find(fee => 
                  fee.category === 'hostel' && fee.status === 'pending'
                );

                if (pendingHostelInvoice) {
                  // Show booking progress and payment status
                  return (
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center text-blue-600">
                            <Clock className="h-5 w-5 mr-2" />
                            Hostel Booking In Progress
                          </CardTitle>
                          <CardDescription>
                            Your room booking is pending payment completion.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h3 className="font-semibold text-blue-800 mb-3">Booking Status</h3>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-blue-700">Room Selection:</span>
                                <Badge variant="default" className="bg-green-500">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-blue-700">Invoice Generated:</span>
                                <Badge variant="default" className="bg-green-500">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-blue-700">Payment:</span>
                                <Badge variant="secondary" className="bg-yellow-500 text-white">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-blue-700">Room Allocation:</span>
                                <Badge variant="outline">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Waiting for Payment
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <h4 className="font-semibold text-yellow-800 mb-2">Payment Required</h4>
                            <div className="space-y-2 text-sm text-yellow-700">
                              <p><span className="font-medium">Invoice:</span> {pendingHostelInvoice.invoice_number}</p>
                              <p><span className="font-medium">Amount:</span> ₹{pendingHostelInvoice.amount}</p>
                              <p><span className="font-medium">Due Date:</span> {new Date(pendingHostelInvoice.due_date).toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-3 mt-4">
                              <Button 
                                onClick={() => handlePayFee(pendingHostelInvoice.id)}
                                className="bg-yellow-600 hover:bg-yellow-700"
                              >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Pay Now
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => setActiveTab("fees")}
                              >
                                View in Fees Tab
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                } else {
                  // Show room selection
                  return (
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Home className="h-5 w-5 mr-2" />
                            Select Your Hostel Room
                          </CardTitle>
                          <CardDescription>
                            Choose from available rooms and complete payment to secure your accommodation.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-8">
                            <Button 
                              onClick={loadAvailableRooms}
                              disabled={loadingRooms}
                              className="mb-4"
                            >
                              {loadingRooms ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Home className="h-4 w-4 mr-2" />
                              )}
                              {loadingRooms ? 'Loading...' : 'View Available Rooms'}
                            </Button>
                            
                            {availableRooms.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                                {availableRooms.map((roomType) => (
                                  <Card key={`${roomType.room_type}_${roomType.ac_type}`} 
                                  className={`border-2 transition-colors ${
                                    roomType.available_beds > 0 
                                      ? 'hover:border-blue-300 cursor-pointer' 
                                      : 'border-gray-300 opacity-75'
                                  }`}>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center justify-between">
                                  {roomType.room_type_display}
                                  {roomType.available_beds === 0 && (
                                    <Badge variant="destructive" className="text-xs">Full</Badge>
                                  )}
                                </CardTitle>
                                <CardDescription className="font-semibold text-lg text-green-600">
                                  ₹{Number(roomType.annual_fee).toLocaleString()} / year
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span>AC Type:</span>
                                    <Badge variant={roomType.ac_type === 'ac' ? 'default' : 'secondary'}>
                                      {roomType.ac_type_display}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Total Rooms:</span>
                                    <span className="font-medium">{roomType.total_rooms}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Available Rooms:</span>
                                    <span className={`font-medium ${roomType.rooms_with_availability > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {roomType.rooms_with_availability}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Free Beds:</span>
                                    <span className={`font-medium ${roomType.available_beds > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {roomType.available_beds} / {roomType.total_beds}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Occupancy:</span>
                                    <span className="font-medium">{Math.round(roomType.occupancy_rate)}%</span>
                                  </div>
                                </div>
                                
                                <Button 
                                  className="w-full mt-4" 
                                  variant={roomType.available_beds > 0 ? "default" : "outline"}
                                  disabled={roomType.available_beds === 0}
                                  onClick={() => {
                                    if (roomType.available_beds > 0) {
                                      setSelectedRoom(roomType);
                                      setShowBookingModal(true);
                                    }
                                  }}
                                >
                                  {roomType.available_beds > 0 ? 'Select Room' : 'Fully Occupied'}
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
                }
              })()
            )}
          </div>
        )}

        {/* Complaints Section */}
        {activeTab === "hostel" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Complaints</CardTitle>
                <CardDescription>Track your hostel complaints and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {studentComplaints.map((complaint) => (
                    <div key={complaint.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{complaint.title}</h4>
                        <div className="flex gap-2">
                          <Badge variant={
                            complaint.priority === 'urgent' ? 'destructive' :
                            complaint.priority === 'high' ? 'default' : 'secondary'
                          }>
                            {complaint.priority}
                          </Badge>
                          <Badge variant={
                            complaint.status === 'resolved' ? 'default' :
                            complaint.status === 'in_progress' ? 'secondary' : 'outline'
                          }>
                            {complaint.status}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{complaint.description}</p>
                      <p className="text-xs text-gray-500">
                        Submitted: {new Date(complaint.submitted_date).toLocaleDateString()} • Category: {complaint.category}
                      </p>
                      {complaint.resolution_notes && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                          <p className="text-sm text-green-800">
                            <strong>Resolution:</strong> {complaint.resolution_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  {studentComplaints.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No complaints submitted yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Leave Requests Section */}
            <Card>
              <CardHeader>
                <CardTitle>My Leave Requests</CardTitle>
                <CardDescription>Track your hostel leave requests and their approval status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {studentLeaveRequests.map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{request.leave_type} Leave</h4>
                        <Badge variant={
                          request.status === 'approved' ? 'default' :
                          request.status === 'rejected' ? 'destructive' : 'secondary'
                        }>
                          {request.status}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1 mb-2">
                        <p><strong>Duration:</strong> {new Date(request.start_date).toLocaleDateString()} to {new Date(request.end_date).toLocaleDateString()}</p>
                        <p><strong>Destination:</strong> {request.destination}</p>
                        <p><strong>Reason:</strong> {request.reason}</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        Submitted: {new Date(request.submitted_date).toLocaleDateString()}
                      </p>
                      {request.approved_by_name && (
                        <p className="text-xs text-gray-600 mt-1">
                          {request.status === 'approved' ? 'Approved' : 'Rejected'} by {request.approved_by_name}
                        </p>
                      )}
                      {request.approval_notes && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-sm text-blue-800">
                            <strong>Notes:</strong> {request.approval_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  {studentLeaveRequests.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No leave requests submitted yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Other placeholder tabs */}
        {["materials", "leave", "analytics", "alerts"].includes(activeTab) && (
          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
              <CardDescription>This feature is under development</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <div className="text-gray-400 mb-4">
                {activeTab === "materials" && <BookOpen className="h-12 w-12 mx-auto" />}
                {activeTab === "leave" && <FileText className="h-12 w-12 mx-auto" />}
                {activeTab === "analytics" && <BarChart3 className="h-12 w-12 mx-auto" />}
                {activeTab === "alerts" && <AlertCircle className="h-12 w-12 mx-auto" />}
              </div>
              <p className="text-gray-500">This feature will be available soon!</p>
            </CardContent>
          </Card>
        )}

        {/* Room Booking Modal */}
        <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Confirm Room Booking</DialogTitle>
              <DialogDescription>
                Review your room selection and complete the booking.
              </DialogDescription>
            </DialogHeader>
            
            {selectedRoom && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Room Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Room Type:</span>
                      <span className="font-medium">{selectedRoom.room_type_display}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AC Type:</span>
                      <Badge variant={selectedRoom.ac_type === 'ac' ? 'default' : 'secondary'}>
                        {selectedRoom.ac_type_display}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Annual Fee:</span>
                      <span className="font-semibold text-green-600">₹{Number(selectedRoom.annual_fee).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Available Rooms:</span>
                      <span className="font-medium">{selectedRoom.available_rooms.length}</span>
                    </div>
                  </div>
                </div>

                {selectedRoom.available_rooms.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Select Specific Room:</Label>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {selectedRoom.available_rooms.map((room: any) => (
                        <div 
                          key={room.id}
                          className="p-3 border rounded cursor-pointer hover:bg-gray-50"
                          onClick={() => handleBookRoom(room.id)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{room.block_name} - Room {room.room_number}</p>
                              <p className="text-sm text-gray-600">{room.floor_display}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm">{room.available_beds} bed(s) available</p>
                              <p className="text-xs text-gray-500">Capacity: {room.capacity}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowBookingModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Complaint Submission Modal */}
        <Dialog open={showComplaintModal} onOpenChange={setShowComplaintModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Hostel Complaint</DialogTitle>
              <DialogDescription>
                Report any issues or concerns about your hostel accommodation.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={complaintForm.title}
                  onChange={(e) => setComplaintForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of the issue"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={complaintForm.category} onValueChange={(value: any) => setComplaintForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
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
                <Label htmlFor="priority">Priority</Label>
                <Select value={complaintForm.priority} onValueChange={(value: any) => setComplaintForm(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={complaintForm.description}
                  onChange={(e) => setComplaintForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide detailed information about the issue"
                  rows={4}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSubmitComplaint}
                  disabled={!complaintForm.title || !complaintForm.description}
                  className="flex-1"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Complaint
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowComplaintModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Leave Request Modal */}
        <Dialog open={showLeaveModal} onOpenChange={setShowLeaveModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Submit Leave Request</DialogTitle>
              <DialogDescription>
                Request permission to leave the hostel temporarily.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="leave_type">Leave Type</Label>
                <Select value={leaveForm.leave_type} onValueChange={(value: any) => setLeaveForm(prev => ({ ...prev, leave_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
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
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={leaveForm.start_date}
                    onChange={(e) => setLeaveForm(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={leaveForm.end_date}
                    onChange={(e) => setLeaveForm(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  value={leaveForm.destination}
                  onChange={(e) => setLeaveForm(prev => ({ ...prev, destination: e.target.value }))}
                  placeholder="Where will you be going?"
                />
              </div>
              
              <div>
                <Label htmlFor="emergency_contact">Emergency Contact</Label>
                <Input
                  id="emergency_contact"
                  value={leaveForm.emergency_contact}
                  onChange={(e) => setLeaveForm(prev => ({ ...prev, emergency_contact: e.target.value }))}
                  placeholder="Phone number for emergencies"
                />
              </div>
              
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Explain the reason for your leave"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSubmitLeaveRequest}
                  disabled={!leaveForm.start_date || !leaveForm.end_date || !leaveForm.reason}
                  className="flex-1"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Request
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Booking Confirmation Modal */}
        <Dialog open={showBookingConfirmationModal} onOpenChange={setShowBookingConfirmationModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center text-green-600">
                <CheckCircle className="h-6 w-6 mr-2" />
                Room Booked Successfully!
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {bookingResult && (
                <>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">Booking Details</h4>
                    <div className="space-y-1 text-sm text-green-700">
                      <p><span className="font-medium">Block:</span> {bookingResult.room_details.block_name}</p>
                      <p><span className="font-medium">Room:</span> {bookingResult.room_details.room_number}</p>
                      <p><span className="font-medium">Bed:</span> {bookingResult.room_details.bed_number}</p>
                      <p><span className="font-medium">Type:</span> {bookingResult.room_details.room_type} ({bookingResult.room_details.ac_type})</p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">Payment Information</h4>
                    <div className="space-y-1 text-sm text-blue-700">
                      <p><span className="font-medium">Amount:</span> ₹{bookingResult.amount}</p>
                      <p><span className="font-medium">Invoice:</span> {bookingResult.invoice_number}</p>
                      <p className="text-xs text-blue-600 mt-2">
                        Your invoice has been added to the "Fees & Payments" tab
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => {
                        setShowBookingConfirmationModal(false);
                        handlePayFee(`fee_${bookingResult.invoice_id}`);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay Now
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setShowBookingConfirmationModal(false);
                        toast({
                          title: "Payment Pending",
                          description: `Invoice ${bookingResult.invoice_number} is in your Fees & Payments tab.`,
                          duration: 5000,
                        });
                      }}
                      className="flex-1"
                    >
                      Pay Later
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Payment Modal */}
        {selectedFeeForPayment && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedFeeForPayment(null);
            }}
            onConfirm={handlePaymentConfirm}
            fee={selectedFeeForPayment}
            loading={paymentLoading}
          />
        )}

        {/* Receipt Modal */}
        {receiptData && (
          <ReceiptModal
            isOpen={showReceiptModal}
            onClose={() => {
              setShowReceiptModal(false);
              setReceiptData(null);
            }}
            onDownload={() => generateReceipt(receiptData)}
            receiptData={receiptData}
          />
        )}
      </div>
    </EnhancedDashboardLayout>
  );
};

export default StudentDashboard;