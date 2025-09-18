import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../hooks/use-toast';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  Clock, TrendingUp, CreditCard, FileText, Bell, Award, 
  BookOpen, DollarSign, CalendarDays, Download, Star,
  CheckCircle, XCircle, AlertCircle, Mail, Home, RefreshCw
} from 'lucide-react';
import { parentAuthService, parentDashboardService } from '../../lib/api/auth';
import { 
  ParentDashboardOverview, 
  ParentAttendanceData, 
  ParentExamResultsData, 
  ParentFeesData, 
  ParentNotice 
} from '../../lib/api/types';
import { HostelAPI, HostelAllocation, HostelComplaint, HostelLeaveRequest } from '../../services/hostelAPI';

// Helper interfaces for display data
interface Fee {
  month: string;
  amount: number;
  status: 'Paid' | 'Pending';
  date: string;
  receipt?: string;
}

interface ReportCard {
  term: string;
  percentage: number;
  grade: string;
  date: string;
}

const EnhancedParentDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<ParentDashboardOverview | null>(null);
  const [attendanceData, setAttendanceData] = useState<ParentAttendanceData | null>(null);
  const [examResults, setExamResults] = useState<ParentExamResultsData | null>(null);
  const [feesData, setFeesData] = useState<ParentFeesData | null>(null);
  const [notices, setNotices] = useState<ParentNotice[]>([]);
  
  // Hostel state for child
  const [childAllocation, setChildAllocation] = useState<HostelAllocation | null>(null);
  const [childComplaints, setChildComplaints] = useState<HostelComplaint[]>([]);
  const [childLeaveRequests, setChildLeaveRequests] = useState<HostelLeaveRequest[]>([]);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("home");
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Check if parent is authenticated
  useEffect(() => {
    const checkAuthentication = async () => {
      if (!parentAuthService.isAuthenticated()) {
        toast({
          title: "Session Expired",
          description: "Please login again to continue",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      try {
        const sessionResponse = await parentAuthService.verifySession();
        if (!sessionResponse.valid) {
          toast({
            title: "Session Expired", 
            description: "Please login again to continue",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        setUser(sessionResponse.parent);
        setProfile(sessionResponse.student);
      } catch (error) {
        console.error("Session verification failed:", error);
        navigate("/auth");
      }
    };

    checkAuthentication();
  }, [navigate, toast]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all dashboard data in parallel
        const [overview, attendance, results, fees, noticesData] = await Promise.all([
          parentDashboardService.getDashboardOverview(),
          parentDashboardService.getAttendance(30),
          parentDashboardService.getResults(),
          parentDashboardService.getFees(),
          parentDashboardService.getNotices()
        ]);

        setDashboardData(overview);
        setAttendanceData(attendance);
        setExamResults(results);
        setFeesData(fees);
        setNotices(noticesData.notices || []);

        // Load hostel data for child
        await loadChildHostelData();

      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        toast({
          title: "Error",
          description: error?.message || "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user && profile) {
      fetchDashboardData();
    }
  }, [user, profile, toast]);

  // Load child's hostel data
  const loadChildHostelData = async () => {
    try {
      if (!dashboardData?.student?.id) return;
      
      // Get child's allocation
      const allocations = await HostelAPI.getAllocations({ student: dashboardData.student.id });
      const activeAllocation = allocations.find(a => a.status === 'active');
      setChildAllocation(activeAllocation || null);

      // Get child's complaints
      const complaints = await HostelAPI.getComplaints({ student: dashboardData.student.id });
      setChildComplaints(complaints);

      // Get child's leave requests
      const leaveRequests = await HostelAPI.getLeaveRequests({ student: dashboardData.student.id });
      setChildLeaveRequests(leaveRequests);
    } catch (error) {
      console.error('Error loading child hostel data:', error);
    }
  };

  // Get formatted date
  const istDate = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  const istString = istDate.toLocaleTimeString('en-IN', { 
    hour12: true, 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });

  // Calculate derived data from API responses
  const studentData = profile ? {
    name: profile.name || 'N/A',
    studentId: profile.admission_number || 'N/A',
    class: profile.course || 'N/A',
    rollNumber: profile.admission_number || 'N/A',
    parentName: user?.name || 'N/A',
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
  } : null;

  const dashboardStats = [
    { 
      title: "Attendance Rate", 
      value: `${attendanceData?.summary?.attendance_percentage || 0}%`, 
      icon: Clock, 
      description: "This month", 
      color: "success", 
      trend: { value: 3.2, isPositive: true } 
    },
    { 
      title: "Academic Average", 
      value: examResults?.performance_summary?.average_percentage ? `${examResults.performance_summary.average_percentage}%` : "N/A", 
      icon: Award, 
      description: "Current semester", 
      color: "primary", 
      trend: { value: 2.1, isPositive: true } 
    },
    { 
      title: "Pending Fees", 
      value: `₹${feesData?.summary?.pending_amount?.toLocaleString() || 0}`, 
      icon: CreditCard, 
      description: feesData?.summary?.status || "Status unknown", 
      color: "warning" 
    },
    { 
      title: "Notices", 
      value: notices.length, 
      icon: Bell, 
      description: "Active notices", 
      color: "primary" 
    },
  ];

  const recentMarks = examResults?.exams?.slice(0, 6)?.flatMap(exam => 
    exam.subjects.map(subject => ({
      subject: subject.subject,
      marks: subject.marks_obtained,
      totalMarks: subject.total_marks,
      exam: exam.exam_name,
      grade: subject.grade,
      date: exam.exam_date
    }))
  ) || [];

  const feeHistory = feesData?.payments?.map(payment => ({
    month: new Date(payment.payment_date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    amount: payment.amount,
    status: "Paid" as const,
    date: payment.payment_date,
    receipt: payment.transaction_id
  })) || [];

  // Add pending fees from invoices
  const pendingFees = feesData?.invoices?.filter(invoice => invoice.status === 'pending')?.map(invoice => ({
    month: new Date(invoice.due_date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    amount: invoice.amount,
    status: "Pending" as const,
    date: invoice.due_date
  })) || [];

  const allFeeHistory = [...feeHistory, ...pendingFees];

  const reportCards = examResults?.exams?.map(exam => ({
    term: exam.exam_name,
    percentage: exam.overall_percentage,
    grade: exam.overall_grade,
    date: exam.exam_date
  })) || [];

  const notificationsList = notices.map(notice => ({
    id: notice.id,
    type: notice.priority === 'urgent' ? 'exam' : 'announcement',
    title: notice.title,
    message: notice.content,
    date: notice.created_at,
    read: false // We'll assume unread for now since API doesn't provide read status
  }));

  const upcomingEvents = notices.slice(0, 4).map(notice => ({
    title: notice.title,
    date: notice.expiry_date || notice.created_at,
    type: notice.priority === 'urgent' ? 'exam' : 'event'
  }));

  const downloadReportCard = (report: ReportCard) => { 
    toast({ title: "Download Started", description: `Downloading report card for ${report.term}` }); 
  };
  
  const downloadReceipt = (fee: Fee) => { 
    toast({ title: "Download Started", description: `Downloading receipt ${fee.receipt}` }); 
  };
  
  const markNotificationRead = (notificationId: number) => { 
    toast({ title: "Notification marked as read" }); 
  };

  const logout = async () => {
    try {
      await parentAuthService.logout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
      navigate("/auth");
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/auth");
    }
  };

  const sidebarContent = (
    <div className="p-3 space-y-1">
      <Button variant={activeTab === "home" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveTab("home")}>
        <Clock className="h-4 w-4 mr-2" />
        <span className="sidebar-label">Home</span>
      </Button>
      <Button variant={activeTab === "overview" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveTab("overview")}>
        <TrendingUp className="h-4 w-4 mr-2" />
        <span className="sidebar-label">Overview</span>
      </Button>
      <Button variant={activeTab === "attendance" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveTab("attendance")}>
        <CheckCircle className="h-4 w-4 mr-2" />
        <span className="sidebar-label">Attendance</span>
      </Button>
      <Button variant={activeTab === "results" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveTab("results")}>
        <BookOpen className="h-4 w-4 mr-2" />
        <span className="sidebar-label">Results</span>
      </Button>
      <Button variant={activeTab === "fees" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveTab("fees")}>
        <CreditCard className="h-4 w-4 mr-2" />
        <span className="sidebar-label">Fee Payment</span>
      </Button>
      <Button variant={activeTab === "hostel" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveTab("hostel")}>
        <Home className="h-4 w-4 mr-2" />
        <span className="sidebar-label">Hostel</span>
      </Button>
      <Button variant={activeTab === "notices" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveTab("notices")}>
        <Bell className="h-4 w-4 mr-2" />
        <span className="sidebar-label">Notices</span>
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout title="Parent Portal" user={user} profile={profile} sidebarContent={sidebarContent}>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        {activeTab === "home" && (
          <>
            <Card className="mb-8 bg-gradient-to-r from-emerald-600 to-emerald-800 text-white">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Welcome, {user?.name?.split(' ')[0] || 'Parent'}!</h2>
                    <p className="text-emerald-100 text-lg">Monitor your child's academic journey</p>
                    {studentData && (
                      <p className="text-emerald-200 mt-2">Student: {studentData.name} ({studentData.studentId})</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-emerald-100">Indian Standard Time</p>
                    <p className="text-2xl font-semibold font-mono tracking-tight">{istString}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {dashboardStats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <Card key={index} className="hover:shadow-lg transition">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center">
                        <IconComponent className="h-4 w-4 mr-2" />
                        {stat.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">{stat.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Quick Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Recent Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Recent Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentMarks.slice(0, 4).map((mark, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{mark.subject}</p>
                          <p className="text-sm text-gray-600">{mark.exam}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{mark.marks}/{mark.totalMarks}</p>
                          <Badge variant={mark.grade === 'A+' ? 'default' : 'secondary'}>{mark.grade}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CalendarDays className="h-5 w-5 mr-2" />
                    Recent Notices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingEvents.map((event, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-gray-600">{event.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{new Date(event.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && dashboardData && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Student Information</h3>
                    <p><strong>Name:</strong> {dashboardData.student.name}</p>
                    <p><strong>Admission Number:</strong> {dashboardData.student.admission_number}</p>
                    <p><strong>Course:</strong> {dashboardData.student.course}</p>
                    <p><strong>Semester:</strong> {dashboardData.student.semester}</p>
                    <p><strong>School:</strong> {dashboardData.student.school}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Current Status</h3>
                    <p><strong>Attendance:</strong> {dashboardData.attendance.percentage}% ({dashboardData.attendance.present_days}/{dashboardData.attendance.total_days})</p>
                    <p><strong>Fee Status:</strong> {dashboardData.fees.status}</p>
                    <p><strong>Pending Amount:</strong> ₹{dashboardData.fees.pending_amount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === "attendance" && attendanceData && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{attendanceData.summary.present}</p>
                    <p className="text-sm text-gray-600">Present</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{attendanceData.summary.absent}</p>
                    <p className="text-sm text-gray-600">Absent</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{attendanceData.summary.late}</p>
                    <p className="text-sm text-gray-600">Late</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{attendanceData.summary.attendance_percentage}%</p>
                    <p className="text-sm text-gray-600">Overall</p>
                  </div>
                </div>

                <h3 className="font-semibold mb-3">Subject-wise Attendance</h3>
                <div className="space-y-2">
                  {attendanceData.subject_wise.map((subject, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{subject.subject}</span>
                      <div className="text-right">
                        <span className="font-bold">{subject.percentage}%</span>
                        <span className="text-sm text-gray-600 ml-2">({subject.present_classes}/{subject.total_classes})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === "results" && examResults && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Academic Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{examResults.performance_summary.average_percentage}%</p>
                    <p className="text-sm text-gray-600">Average</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{examResults.performance_summary.total_exams}</p>
                    <p className="text-sm text-gray-600">Total Exams</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{examResults.performance_summary.total_subjects_attempted}</p>
                    <p className="text-sm text-gray-600">Subjects</p>
                  </div>
                </div>

                <h3 className="font-semibold mb-3">Exam Results</h3>
                <div className="space-y-4">
                  {examResults.exams.map((exam, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-lg">{exam.exam_name}</CardTitle>
                        <p className="text-sm text-gray-600">Date: {new Date(exam.exam_date).toLocaleDateString()}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <p><strong>Overall:</strong> {exam.obtained_marks}/{exam.total_marks} ({exam.overall_percentage}%) - Grade: {exam.overall_grade}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {exam.subjects.map((subject, subIndex) => (
                            <div key={subIndex} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span>{subject.subject}</span>
                              <div>
                                <span className="font-bold">{subject.marks_obtained}/{subject.total_marks}</span>
                                <Badge variant="outline" className="ml-2">{subject.grade}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Fees Tab */}
        {activeTab === "fees" && feesData && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fee Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">₹{feesData.summary.total_fees}</p>
                    <p className="text-sm text-gray-600">Total Fees</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">₹{feesData.summary.total_paid}</p>
                    <p className="text-sm text-gray-600">Paid</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">₹{feesData.summary.pending_amount}</p>
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Payment History */}
                  <div>
                    <h3 className="font-semibold mb-3">Payment History</h3>
                    <div className="space-y-2">
                      {feesData.payments.map((payment, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <div>
                            <p className="font-medium">₹{payment.amount}</p>
                            <p className="text-sm text-gray-600">{new Date(payment.payment_date).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">{payment.status}</Badge>
                            <p className="text-xs text-gray-600">{payment.transaction_id}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pending Invoices */}
                  <div>
                    <h3 className="font-semibold mb-3">Pending Invoices</h3>
                    <div className="space-y-2">
                      {feesData.invoices.filter(invoice => invoice.status === 'pending').map((invoice, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                          <div>
                            <p className="font-medium">₹{invoice.amount}</p>
                            <p className="text-sm text-gray-600">{invoice.description}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="destructive">{invoice.status}</Badge>
                            <p className="text-xs text-gray-600">Due: {new Date(invoice.due_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Notices Tab */}
        {activeTab === "notices" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>School Notices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notices.map((notice, index) => (
                    <Card key={index} className="border-l-4 border-l-primary">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{notice.title}</CardTitle>
                          <Badge variant={notice.priority === 'urgent' ? 'destructive' : 'outline'}>
                            {notice.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(notice.created_at).toLocaleDateString()} • {notice.target_audience}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700">{notice.content}</p>
                        {notice.expiry_date && (
                          <p className="text-sm text-red-600 mt-2">
                            Expires: {new Date(notice.expiry_date).toLocaleDateString()}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Hostel Tab */}
        {activeTab === "hostel" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Child's Hostel Information</h2>
              <Button onClick={loadChildHostelData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Hostel Allocation Info */}
            <Card>
              <CardHeader>
                <CardTitle>Current Accommodation</CardTitle>
              </CardHeader>
              <CardContent>
                {childAllocation ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="font-semibold text-green-800 mb-3">Allocated Room Details</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Student:</span>
                          <p>{childAllocation.student_name}</p>
                        </div>
                        <div>
                          <span className="font-medium">Hostel Block:</span>
                          <p>{childAllocation.block_name}</p>
                        </div>
                        <div>
                          <span className="font-medium">Room Number:</span>
                          <p>{childAllocation.room_number}</p>
                        </div>
                        <div>
                          <span className="font-medium">Bed Number:</span>
                          <p>{childAllocation.bed_number}</p>
                        </div>
                        <div>
                          <span className="font-medium">Allocation Date:</span>
                          <p>{new Date(childAllocation.allocation_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="font-medium">Status:</span>
                          <Badge variant={childAllocation.status === 'active' ? 'default' : 'secondary'}>
                            {childAllocation.status}
                          </Badge>
                        </div>
                      </div>
                      {childAllocation.hostel_fee_amount && (
                        <div className="mt-3 pt-3 border-t border-green-300">
                          <span className="font-medium">Monthly Fee:</span>
                          <p className="text-lg font-bold text-green-800">₹{childAllocation.hostel_fee_amount}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Home className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No hostel allocation found for your child</p>
                    <p className="text-sm text-gray-400">Contact the school administration for room allocation</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Complaints and Issues */}
            <Card>
              <CardHeader>
                <CardTitle>Complaints & Issues</CardTitle>
                <CardDescription>Track hostel complaints submitted by your child</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {childComplaints.map((complaint) => (
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
                          {complaint.resolved_by_name && (
                            <p className="text-xs text-green-600 mt-1">
                              Resolved by {complaint.resolved_by_name} on {new Date(complaint.resolved_date!).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {childComplaints.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No complaints submitted
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Leave Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Leave Requests</CardTitle>
                <CardDescription>Monitor your child's hostel leave requests and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {childLeaveRequests.map((request) => (
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
                        {request.emergency_contact && (
                          <p><strong>Emergency Contact:</strong> {request.emergency_contact}</p>
                        )}
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
                            <strong>Warden's Notes:</strong> {request.approval_notes}
                          </p>
                        </div>
                      )}
                      {request.status === 'approved' && request.actual_return_date && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                          <p className="text-sm text-green-800">
                            <strong>Returned:</strong> {new Date(request.actual_return_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  {childLeaveRequests.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No leave requests submitted
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EnhancedParentDashboard;