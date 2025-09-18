import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EnhancedDashboardLayout from "@/components/EnhancedDashboardLayout";
import { 
  Calendar, 
  BarChart3, 
  Upload, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Users,
  BookOpen,
  FileText,
  AlertCircle,
  Plus
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const FacultyDashboard = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

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
  
  // Mock user data
  const user = { email: "faculty@acharya.gov.in" };
  const profile = { 
    full_name: "Dr. Priya Singh", 
    role: "faculty",
    department: "Mathematics",
    employee_id: "EMP001"
  };

  // Mock data
  const classesData = [
    { class: "10th A", subject: "Mathematics", students: 35, attendance: 92 },
    { class: "10th B", subject: "Mathematics", students: 32, attendance: 88 },
    { class: "9th A", subject: "Mathematics", students: 38, attendance: 95 },
  ];

  const attendanceData = [
    { student: "Rahul Sharma", rollNo: "10A01", present: 45, total: 50, percentage: 90 },
    { student: "Priya Patel", rollNo: "10A02", present: 48, total: 50, percentage: 96 },
    { student: "Amit Kumar", rollNo: "10A03", present: 42, total: 50, percentage: 84 },
    { student: "Sneha Singh", rollNo: "10A04", present: 46, total: 50, percentage: 92 },
  ];

  const marksData = [
    { student: "Rahul Sharma", rollNo: "10A01", marks: 85, total: 100, grade: "A" },
    { student: "Priya Patel", rollNo: "10A02", marks: 92, total: 100, grade: "A+" },
    { student: "Amit Kumar", rollNo: "10A03", marks: 78, total: 100, grade: "B+" },
    { student: "Sneha Singh", rollNo: "10A04", marks: 88, total: 100, grade: "A" },
  ];

  const leaveRequests = [
    { id: 1, student: "Rahul Sharma", class: "10th A", reason: "Medical", dates: "Jan 10-12", status: "Pending" },
    { id: 2, student: "Priya Patel", class: "10th A", reason: "Family Function", dates: "Jan 25", status: "Approved" },
  ];

  const complaints = [
    { id: 1, student: "Amit Kumar", class: "10th A", issue: "Bullying", status: "Under Review", date: "2024-01-15" },
    { id: 2, student: "Sneha Singh", class: "10th A", issue: "Infrastructure", status: "Resolved", date: "2024-01-10" },
  ];

  const workloadTrend = [
    { week: 'W1', tasks: 12 },
    { week: 'W2', tasks: 15 },
    { week: 'W3', tasks: 10 },
    { week: 'W4', tasks: 14 },
  ];

  const sidebarContent = (
    <div className="p-6 space-y-4">
      <Accordion type="single" collapsible defaultValue="menu">
        <AccordionItem value="menu">
          <AccordionTrigger className="text-base">Dashboard Menu</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-2">
              <Button 
                variant={activeTab === "home" ? "default" : "ghost"} 
                className="w-full justify-start"
                onClick={() => setActiveTab("home")}
              >
                <Clock className="h-4 w-4 mr-2" />
                Home
              </Button>
              <Button 
                variant={activeTab === "overview" ? "default" : "ghost"} 
                className="w-full justify-start"
                onClick={() => setActiveTab("overview")}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Overview
              </Button>
              <Button 
                variant={activeTab === "attendance" ? "default" : "ghost"} 
                className="w-full justify-start"
                onClick={() => setActiveTab("attendance")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Mark Attendance
              </Button>
              <Button 
                variant={activeTab === "marks" ? "default" : "ghost"} 
                className="w-full justify-start"
                onClick={() => setActiveTab("marks")}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Enter Marks
              </Button>
              <Button 
                variant={activeTab === "materials" ? "default" : "ghost"} 
                className="w-full justify-start"
                onClick={() => setActiveTab("materials")}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Materials
              </Button>
              <Button 
                variant={activeTab === "leave" ? "default" : "ghost"} 
                className="w-full justify-start"
                onClick={() => setActiveTab("leave")}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Leave
              </Button>
              <Button 
                variant={activeTab === "complaints" ? "default" : "ghost"} 
                className="w-full justify-start"
                onClick={() => setActiveTab("complaints")}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Complaints
              </Button>
              <Button 
                variant={activeTab === "analytics" ? "default" : "ghost"} 
                className="w-full justify-start"
                onClick={() => setActiveTab("analytics")}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );

  return (
    <EnhancedDashboardLayout
      title="Faculty Dashboard"
      user={user}
      profile={profile}
      sidebarContent={sidebarContent}
    >
      <div className="space-y-6">
        {/* Home Tab */}
        {activeTab === "home" && (
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Welcome, {profile.full_name}!</h2>
                    <p className="text-purple-100 text-lg">{profile.department} Department • ID: {profile.employee_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-purple-100">Indian Standard Time</p>
                    <p className="text-2xl font-semibold font-mono tracking-tight">{istString}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="hover:shadow-lg transition"><CardHeader className="pb-2"><CardTitle className="text-sm">Today Classes</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">3</div><p className="text-xs text-muted-foreground">scheduled</p></CardContent></Card>
              <Card className="hover:shadow-lg transition"><CardHeader className="pb-2"><CardTitle className="text-sm">Pending Leaves</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">2</div><p className="text-xs text-muted-foreground">to review</p></CardContent></Card>
              <Card className="hover:shadow-lg transition"><CardHeader className="pb-2"><CardTitle className="text-sm">Assignments</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">4</div><p className="text-xs text-muted-foreground">awaiting check</p></CardContent></Card>
              <Card className="hover:shadow-lg transition"><CardHeader className="pb-2"><CardTitle className="text-sm">Announcements</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">1</div><p className="text-xs text-muted-foreground">planned</p></CardContent></Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="h-24 justify-start" variant="outline" onClick={() => setActiveTab('attendance')}>
                <Calendar className="h-5 w-5 mr-3" /> Mark Attendance
              </Button>
              <Button className="h-24 justify-start" variant="outline" onClick={() => setActiveTab('marks')}>
                <BarChart3 className="h-5 w-5 mr-3" /> Enter Marks
              </Button>
              <Button className="h-24 justify-start" variant="outline" onClick={() => setActiveTab('materials')}>
                <Upload className="h-5 w-5 mr-3" /> Upload Materials
              </Button>
            </div>
          </div>
        )}

        {/* Banner for other tabs */}
        {activeTab !== "home" && (
          <Card className="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Welcome, {profile.full_name}!</h2>
                  <p className="text-purple-100">{profile.department} Department | ID: {profile.employee_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-purple-100">Academic Year</p>
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
                  <CardTitle className="text-sm font-medium text-gray-600">Total Classes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">Active classes</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">105</div>
                  <p className="text-xs text-muted-foreground">Across all classes</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Pending Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5</div>
                  <p className="text-xs text-muted-foreground">Leave requests & complaints</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Classes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {classesData.map((cls, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{cls.class}</p>
                        <p className="text-sm text-gray-600">{cls.subject} • {cls.students} students</p>
                      </div>
                      <Badge variant="outline">{cls.attendance}% attendance</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-medium">Attendance Marked</p>
                      <p className="text-sm text-gray-600">Class 10th A - Today</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <BarChart3 className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium">Marks Entered</p>
                      <p className="text-sm text-gray-600">Unit Test - Yesterday</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === "attendance" && (
          <Card>
            <CardHeader>
              <CardTitle>Mark Attendance</CardTitle>
              <CardDescription>Mark attendance for your classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Select>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10a">10th A</SelectItem>
                      <SelectItem value="10b">10th B</SelectItem>
                      <SelectItem value="9a">9th A</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="date" className="w-48" />
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Mark Attendance
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Present</TableHead>
                      <TableHead>Absent</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData.map((student) => (
                      <TableRow key={student.rollNo}>
                        <TableCell className="font-medium">{student.student}</TableCell>
                        <TableCell>{student.rollNo}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">Present</Button>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">Absent</Button>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost">
                            <CheckCircle className="h-4 w-4" />
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

        {/* Marks Tab */}
        {activeTab === "marks" && (
          <Card>
            <CardHeader>
              <CardTitle>Enter Marks</CardTitle>
              <CardDescription>Enter and manage student marks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Select>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10a">10th A</SelectItem>
                      <SelectItem value="10b">10th B</SelectItem>
                      <SelectItem value="9a">9th A</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select Exam" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unit">Unit Test</SelectItem>
                      <SelectItem value="mid">Mid Term</SelectItem>
                      <SelectItem value="final">Final Exam</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Enter Marks
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Marks Obtained</TableHead>
                      <TableHead>Total Marks</TableHead>
                      <TableHead>Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marksData.map((student) => (
                      <TableRow key={student.rollNo}>
                        <TableCell className="font-medium">{student.student}</TableCell>
                        <TableCell>{student.rollNo}</TableCell>
                        <TableCell>
                          <Input type="number" defaultValue={student.marks} className="w-20" />
                        </TableCell>
                        <TableCell>{student.total}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{student.grade}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Materials Tab */}
        {activeTab === "materials" && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Course Materials</CardTitle>
              <CardDescription>Upload study materials and assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Material Title</Label>
                    <Input id="title" placeholder="Enter material title" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class">Class</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10a">10th A</SelectItem>
                        <SelectItem value="10b">10th B</SelectItem>
                        <SelectItem value="9a">9th A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Enter description" rows={3} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="file">Upload File</Label>
                  <Input id="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" />
                </div>
                
                <Button className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Material
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leave Approval Tab */}
        {activeTab === "leave" && (
          <Card>
            <CardHeader>
              <CardTitle>Approve Leave Requests</CardTitle>
              <CardDescription>Review and approve student leave applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaveRequests.map((request) => (
                  <div key={request.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{request.student}</h3>
                        <p className="text-sm text-gray-600">{request.class} • {request.dates}</p>
                      </div>
                      <Badge variant={request.status === "Approved" ? "default" : "secondary"}>
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-sm mb-3">Reason: {request.reason}</p>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Complaints Tab */}
        {activeTab === "complaints" && (
          <Card>
            <CardHeader>
              <CardTitle>Student Complaints</CardTitle>
              <CardDescription>Review and address student complaints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complaints.map((complaint) => (
                  <div key={complaint.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{complaint.student}</h3>
                        <p className="text-sm text-gray-600">{complaint.class} • {complaint.date}</p>
                      </div>
                      <Badge variant={complaint.status === "Resolved" ? "default" : "secondary"}>
                        {complaint.status}
                      </Badge>
                    </div>
                    <p className="text-sm mb-3">Issue: {complaint.issue}</p>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <FileText className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <Card>
            <CardHeader>
              <CardTitle>Workload & Pending Tasks (Weekly)</CardTitle>
              <CardDescription>Overview of weekly workload trends</CardDescription>
            </CardHeader>
            <CardContent style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={workloadTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="tasks" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </EnhancedDashboardLayout>
  );
};

export default FacultyDashboard;