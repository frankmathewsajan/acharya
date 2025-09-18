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
  Send
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
    fees: [] as FeeInvoice[],
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
      
      // Load all dashboard data in parallel
      const [feesData, attendanceData, resultsData, libraryData, noticesData] = await Promise.allSettled([
        feeService.getInvoices({ student: user?.id }),
        attendanceService.getAttendanceRecords({ student: user?.id }),
        examService.getExamResults({ student: user?.id }),
        libraryService.getBorrowRecords({ student: user?.id }),
        notificationService.getNotices({ target_roles: ['student', 'all'] }),
      ]);

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
      
      // Get student's allocation
      const allocations = await HostelAPI.getAllocations({ student: user.id });
      const activeAllocation = allocations.find(a => a.status === 'active');
      setStudentAllocation(activeAllocation || null);

      // Get student's complaints
      const complaints = await HostelAPI.getComplaints({ student: user.id });
      setStudentComplaints(complaints);

      // Get student's leave requests
      const leaveRequests = await HostelAPI.getLeaveRequests({ student: user.id });
      setStudentLeaveRequests(leaveRequests);
    } catch (error) {
      console.error('Error loading hostel data:', error);
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

  const handlePayFee = async (invoiceId: number) => {
    try {
      await feeService.processPayment(invoiceId, {
        payment_method: 'online',
        transaction_id: `TXN${Date.now()}`,
      });
      
      toast({
        title: "Payment Successful",
        description: "Your fee payment has been processed successfully",
      });
      
      // Reload fees data
      const feesData = await feeService.getInvoices({ student: user?.id });
      setData(prev => ({ ...prev, fees: extractApiData(feesData) }));
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.error || "Failed to process payment",
        variant: "destructive",
      });
    }
  };

  const calculateAttendancePercentage = () => {
    if (data.attendance.length === 0) return 0;
    const presentCount = data.attendance.filter(record => record.status === 'present').length;
    return Math.round((presentCount / data.attendance.length) * 100);
  };

  const getPendingFees = () => {
    return data.fees.filter(fee => fee.status === 'pending');
  };

  const getRecentResults = () => {
    return data.results.slice(0, 5);
  };

  const downloadReceipt = (feeId: number) => {
    const fee = data.fees.find(f => f.id === feeId);
    if (!fee) return;
    const content = `Receipt\n\nStudent: ${user?.first_name} ${user?.last_name}\nAdmission No: ${profile?.admission_number}\nItem: Fee Payment\nAmount: ₹${fee.amount}\nInvoice: ${fee.invoice_number}\nDate: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${fee.id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
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
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.fees.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell className="font-medium">{fee.invoice_number}</TableCell>
                      <TableCell>₹{fee.amount}</TableCell>
                      <TableCell>{new Date(fee.due_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={fee.status === "paid" ? "default" : "destructive"}>
                          {fee.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {fee.status !== "paid" ? (
                          <Button size="sm" onClick={() => handlePayFee(fee.id)}>
                            Pay Now
                          </Button>
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
                      <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                        No fee records found
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Hostel Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Hostel Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {studentAllocation ? (
                    <div className="space-y-3">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h3 className="font-semibold text-green-800 mb-2">Current Allocation</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Block:</span>
                            <span className="font-medium">{studentAllocation.block_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Room:</span>
                            <span className="font-medium">{studentAllocation.room_number}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Bed:</span>
                            <span className="font-medium">{studentAllocation.bed_number}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Allocated Date:</span>
                            <span className="font-medium">{new Date(studentAllocation.allocation_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <Badge variant={studentAllocation.status === 'active' ? 'default' : 'secondary'}>
                              {studentAllocation.status}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Hostel Actions */}
                      <div className="grid grid-cols-2 gap-2">
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
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Home className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No hostel allocation found</p>
                      <p className="text-sm text-gray-400">Contact the admin for room allocation</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Library Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Library Account</CardTitle>
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

            {/* Complaints Section */}
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
      </div>
    </EnhancedDashboardLayout>
  );
};

export default StudentDashboard;