import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EnhancedDashboardLayout from "@/components/EnhancedDashboardLayout";
import { 
  Building, 
  Users, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  TrendingUp,
  FileText,
  Calendar,
  Shield,
  Bell,
  RefreshCw,
  UserCheck,
  Bed
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { HostelAPI, HostelBlock, HostelRoom, HostelBed, HostelAllocation, HostelComplaint, HostelLeaveRequest } from "@/services/hostelAPI";

const WardenDashboard = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [now, setNow] = useState<Date>(new Date());
  const { user } = useAuth();
  
  // Hostel state
  const [wardenBlocks, setWardenBlocks] = useState<HostelBlock[]>([]);
  const [wardenRooms, setWardenRooms] = useState<HostelRoom[]>([]);
  const [wardenBeds, setWardenBeds] = useState<HostelBed[]>([]);
  const [wardenAllocations, setWardenAllocations] = useState<HostelAllocation[]>([]);
  const [wardenComplaints, setWardenComplaints] = useState<HostelComplaint[]>([]);
  const [wardenLeaveRequests, setWardenLeaveRequests] = useState<HostelLeaveRequest[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<HostelComplaint | null>(null);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<HostelLeaveRequest | null>(null);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Mock user data for now (in real app, this would come from auth context)
  const profile = { 
    full_name: user ? `${user.first_name} ${user.last_name}` : "Warden", 
    role: "warden",
    hostel: "Boys Hostel A",
    employee_id: "WARD001",
    id: user?.id || 1
  };

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    loadWardenData();
  }, []);

  // Load warden's hostel data
  const loadWardenData = async () => {
    try {
      // Get blocks where this warden is assigned
      const blocks = await HostelAPI.getBlocks({ warden: profile.id });
      setWardenBlocks(blocks);

      if (blocks.length > 0) {
        const blockIds = blocks.map(block => block.id);
        
        // Get rooms for warden's blocks
        const rooms = await HostelAPI.getRooms({ block__in: blockIds.join(',') });
        setWardenRooms(rooms);

        // Get beds for warden's rooms
        const roomIds = rooms.map(room => room.id);
        const beds = await HostelAPI.getBeds({ room__in: roomIds.join(',') });
        setWardenBeds(beds);

        // Get allocations for warden's beds
        const bedIds = beds.map(bed => bed.id);
        const allocations = await HostelAPI.getAllocations({ bed__in: bedIds.join(',') });
        setWardenAllocations(allocations);

        // Get complaints for warden's blocks
        const complaints = await HostelAPI.getComplaints({ block__in: blockIds.join(',') });
        setWardenComplaints(complaints);

        // Get leave requests for students in warden's blocks
        const leaveRequests = await HostelAPI.getLeaveRequests({ 
          student__allocation__bed__room__block__in: blockIds.join(',')
        });
        setWardenLeaveRequests(leaveRequests);
      }
    } catch (error) {
      console.error('Error loading warden data:', error);
    }
  };

  // Handle complaint status update
  const handleComplaintUpdate = async (complaintId: number, status: 'open' | 'in_progress' | 'resolved' | 'closed', notes?: string) => {
    try {
      await HostelAPI.updateComplaint(complaintId, { status, resolution_notes: notes });
      await loadWardenData();
      setShowComplaintModal(false);
      setSelectedComplaint(null);
    } catch (error) {
      console.error('Error updating complaint:', error);
    }
  };

  // Handle leave request approval/rejection
  const handleLeaveRequestUpdate = async (requestId: number, status: 'approved' | 'rejected', notes?: string) => {
    try {
      if (status === 'approved') {
        await HostelAPI.approveLeaveRequest(requestId, notes);
      } else {
        await HostelAPI.rejectLeaveRequest(requestId, notes);
      }
      await loadWardenData();
      setShowLeaveModal(false);
      setSelectedLeaveRequest(null);
    } catch (error) {
      console.error('Error updating leave request:', error);
    }
  };

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

  // Mock data
  const hostelData = [
    { room: "101", capacity: 4, occupied: 4, status: "Full" },
    { room: "102", capacity: 4, occupied: 3, status: "Available" },
    { room: "103", capacity: 4, occupied: 4, status: "Full" },
    { room: "104", capacity: 4, occupied: 2, status: "Available" },
  ];

  const studentsData = [
    { name: "Rahul Sharma", room: "101", class: "10th A", contact: "9876543210", status: "Present" },
    { name: "Amit Kumar", room: "101", class: "10th B", contact: "9876543211", status: "Present" },
    { name: "Priya Patel", room: "102", class: "9th A", contact: "9876543212", status: "Absent" },
    { name: "Sneha Singh", room: "103", class: "10th A", contact: "9876543213", status: "Present" },
  ];

  const leaveRequests = [
    { id: 1, student: "Rahul Sharma", room: "101", reason: "Medical", dates: "Jan 10-12", status: "Pending" },
    { id: 2, student: "Amit Kumar", room: "101", reason: "Family Function", dates: "Jan 25", status: "Approved" },
  ];

  const complaints = [
    { id: 1, student: "Priya Patel", room: "102", issue: "Room Maintenance", status: "Under Review", date: "2024-01-15" },
    { id: 2, student: "Sneha Singh", room: "103", issue: "Food Quality", status: "Resolved", date: "2024-01-10" },
  ];

  const sidebarContent = (
    <div className="p-6 space-y-4">
      <Accordion type="single" collapsible defaultValue="menu">
        <AccordionItem value="menu">
          <AccordionTrigger className="text-base">Dashboard Menu</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-2">
              <Button variant={activeTab === "home" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveTab("home")}><Clock className="h-4 w-4 mr-2"/> Home</Button>
              <Button variant={activeTab === "rooms" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveTab("rooms")}><Building className="h-4 w-4 mr-2"/> Room Management</Button>
              <Button variant={activeTab === "students" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveTab("students")}><Users className="h-4 w-4 mr-2"/> Student Records</Button>
              <Button variant={activeTab === "attendance" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveTab("attendance")}><Clock className="h-4 w-4 mr-2"/> Hostel Attendance</Button>
              <Button variant={activeTab === "leave" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveTab("leave")}><CheckCircle className="h-4 w-4 mr-2"/> Approve Leave</Button>
              <Button variant={activeTab === "complaints" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveTab("complaints")}><AlertCircle className="h-4 w-4 mr-2"/> Complaints</Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );

  return (
    <EnhancedDashboardLayout
      title="Warden Dashboard"
      user={user}
      profile={profile}
      sidebarContent={sidebarContent}
    >
      <div className="space-y-6">
        {activeTab === "home" && (
          <Card className="bg-gradient-to-r from-orange-600 to-orange-800 text-white">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Welcome, {profile.full_name}!</h2>
                  <p className="text-orange-100 text-lg">{profile.hostel} • ID: {profile.employee_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-orange-100">Indian Standard Time</p>
                  <p className="text-2xl font-semibold font-mono tracking-tight">{istString}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "home" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="hover:shadow-lg transition">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Vacant Beds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {wardenBeds.filter(bed => bed.is_available).length}
                </div>
                <p className="text-xs text-muted-foreground">available now</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Open Complaints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {wardenComplaints.filter(c => c.status === 'open' || c.status === 'in_progress').length}
                </div>
                <p className="text-xs text-muted-foreground">to resolve</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {wardenAllocations.filter(a => a.status === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">currently residing</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pending Leave</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {wardenLeaveRequests.filter(l => l.status === 'pending').length}
                </div>
                <p className="text-xs text-muted-foreground">requests</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Keep existing sections below */}
        {activeTab !== "home" && (
          <Card className="bg-gradient-to-r from-orange-600 to-orange-800 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Welcome, {profile.full_name}!</h2>
                  <p className="text-orange-100">{profile.hostel} | ID: {profile.employee_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-orange-100">Academic Year</p>
                  <p className="text-lg font-semibold">2024-25</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "rooms" && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Room Management</CardTitle>
                  <CardDescription>Manage hostel rooms and occupancy</CardDescription>
                </div>
                <Button onClick={loadWardenData} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room Number</TableHead>
                    <TableHead>Block</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Occupied</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wardenRooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium">{room.room_number}</TableCell>
                      <TableCell>{room.block_name}</TableCell>
                      <TableCell>{room.floor_number}</TableCell>
                      <TableCell>{room.capacity}</TableCell>
                      <TableCell>{room.current_occupancy}</TableCell>
                      <TableCell>{room.capacity - room.current_occupancy}</TableCell>
                      <TableCell>
                        <Badge variant={
                          room.availability_status === 'full' ? 'destructive' : 
                          room.availability_status === 'partial' ? 'default' : 'secondary'
                        }>
                          {room.availability_status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {wardenRooms.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No rooms found. You may not be assigned as a warden to any blocks yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {activeTab === "students" && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Student Records</CardTitle>
                  <CardDescription>View and manage student information</CardDescription>
                </div>
                <Button onClick={loadWardenData} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Bed</TableHead>
                    <TableHead>Allocation Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wardenAllocations.map((allocation) => (
                    <TableRow key={allocation.id}>
                      <TableCell className="font-medium">{allocation.student_name}</TableCell>
                      <TableCell>{allocation.student_email}</TableCell>
                      <TableCell>{allocation.room_number}</TableCell>
                      <TableCell>{allocation.bed_number}</TableCell>
                      <TableCell>{new Date(allocation.allocation_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={allocation.status === "active" ? "default" : "secondary"}>
                          {allocation.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {wardenAllocations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No student allocations found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {activeTab === "attendance" && (
          <Card>
            <CardHeader>
              <CardTitle>Hostel Attendance</CardTitle>
              <CardDescription>Mark and track hostel attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Input type="date" className="w-48" />
                  <Select>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning Roll Call</SelectItem>
                      <SelectItem value="evening">Evening Roll Call</SelectItem>
                      <SelectItem value="night">Night Check</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button>
                    <Clock className="h-4 w-4 mr-2" />
                    Mark Attendance
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Present</TableHead>
                      <TableHead>Absent</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentsData.map((student, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.room}</TableCell>
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

        {activeTab === "leave" && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Approve Leave Requests</CardTitle>
                  <CardDescription>Review and approve hostel leave applications</CardDescription>
                </div>
                <Button onClick={loadWardenData} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {wardenLeaveRequests.map((request) => (
                  <div key={request.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{request.student_name}</h3>
                        <p className="text-sm text-gray-600">
                          {request.leave_type} • {new Date(request.start_date).toLocaleDateString()} to {new Date(request.end_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Destination: {request.destination}
                        </p>
                      </div>
                      <Badge variant={
                        request.status === "approved" ? "default" : 
                        request.status === "rejected" ? "destructive" : "secondary"
                      }>
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-sm mb-3">Reason: {request.reason}</p>
                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => {
                            setSelectedLeaveRequest(request);
                            setShowLeaveModal(true);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    )}
                    {request.status !== 'pending' && request.approved_by_name && (
                      <p className="text-xs text-muted-foreground">
                        {request.status === 'approved' ? 'Approved' : 'Rejected'} by {request.approved_by_name}
                      </p>
                    )}
                  </div>
                ))}
                {wardenLeaveRequests.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No leave requests found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "complaints" && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Student Complaints</CardTitle>
                  <CardDescription>Review and address hostel complaints</CardDescription>
                </div>
                <Button onClick={loadWardenData} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {wardenComplaints.map((complaint) => (
                  <div key={complaint.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{complaint.student_name}</h3>
                        <p className="text-sm text-gray-600">
                          {complaint.room_number} • {complaint.category} • {new Date(complaint.submitted_date).toLocaleDateString()}
                        </p>
                      </div>
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
                    <p className="text-sm mb-2 font-medium">{complaint.title}</p>
                    <p className="text-sm mb-3 text-gray-600">{complaint.description}</p>
                    {complaint.status !== 'resolved' && complaint.status !== 'closed' && (
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setShowComplaintModal(true);
                          }}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                      </div>
                    )}
                    {complaint.resolved_by_name && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Resolved by {complaint.resolved_by_name} on {new Date(complaint.resolved_date!).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
                {wardenComplaints.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No complaints found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leave Request Management Modal */}
        <Dialog open={showLeaveModal} onOpenChange={setShowLeaveModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review Leave Request</DialogTitle>
              <DialogDescription>
                Review and approve/reject this hostel leave request.
              </DialogDescription>
            </DialogHeader>
            
            {selectedLeaveRequest && (
              <div className="space-y-4">
                <div>
                  <Label className="font-medium">Student:</Label>
                  <p className="text-sm">{selectedLeaveRequest.student_name}</p>
                </div>
                <div>
                  <Label className="font-medium">Leave Type:</Label>
                  <p className="text-sm">{selectedLeaveRequest.leave_type}</p>
                </div>
                <div>
                  <Label className="font-medium">Duration:</Label>
                  <p className="text-sm">
                    {new Date(selectedLeaveRequest.start_date).toLocaleDateString()} to {new Date(selectedLeaveRequest.end_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="font-medium">Reason:</Label>
                  <p className="text-sm">{selectedLeaveRequest.reason}</p>
                </div>
                <div>
                  <Label className="font-medium">Destination:</Label>
                  <p className="text-sm">{selectedLeaveRequest.destination}</p>
                </div>
                <div>
                  <Label className="font-medium">Emergency Contact:</Label>
                  <p className="text-sm">{selectedLeaveRequest.emergency_contact}</p>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => handleLeaveRequestUpdate(selectedLeaveRequest.id, 'approved')}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => handleLeaveRequestUpdate(selectedLeaveRequest.id, 'rejected')}
                    className="flex-1"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Complaint Management Modal */}
        <Dialog open={showComplaintModal} onOpenChange={setShowComplaintModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Complaint</DialogTitle>
              <DialogDescription>
                Update the status and manage this hostel complaint.
              </DialogDescription>
            </DialogHeader>
            
            {selectedComplaint && (
              <div className="space-y-4">
                <div>
                  <Label className="font-medium">Student:</Label>
                  <p className="text-sm">{selectedComplaint.student_name}</p>
                </div>
                <div>
                  <Label className="font-medium">Title:</Label>
                  <p className="text-sm">{selectedComplaint.title}</p>
                </div>
                <div>
                  <Label className="font-medium">Category:</Label>
                  <p className="text-sm">{selectedComplaint.category}</p>
                </div>
                <div>
                  <Label className="font-medium">Priority:</Label>
                  <p className="text-sm">{selectedComplaint.priority}</p>
                </div>
                <div>
                  <Label className="font-medium">Description:</Label>
                  <p className="text-sm">{selectedComplaint.description}</p>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => handleComplaintUpdate(selectedComplaint.id, 'in_progress')}
                    variant="outline"
                    className="flex-1"
                  >
                    Mark In Progress
                  </Button>
                  <Button 
                    onClick={() => handleComplaintUpdate(selectedComplaint.id, 'resolved')}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolve
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </EnhancedDashboardLayout>
  );
};

export default WardenDashboard;