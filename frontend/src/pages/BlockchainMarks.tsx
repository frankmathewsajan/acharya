import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Link, 
  FileText, 
  Shield, 
  Clock, 
  User, 
  BookOpen, 
  Award,
  CheckCircle,
  AlertCircle,
  Info,
  Activity,
  Database,
  Lock,
  Zap,
  Globe
} from "lucide-react";

// Mock data for demonstration
const mockStudents = [
  { id: "STU001", name: "Rahul Kumar", class: "10th A", rollNumber: "001", school: "G.SEC.SCHOOL KOTDA AJMERCITY" },
  { id: "STU002", name: "Priya Sharma", class: "10th A", rollNumber: "002", school: "G.SEC.SCHOOL KOTDA AJMERCITY" },
  { id: "STU003", name: "Amit Singh", class: "9th B", rollNumber: "003", school: "G.SEC.SCHOOL KOTDA AJMERCITY" },
];

const mockSubjects = [
  "Mathematics", "Physics", "Chemistry", "English", "Hindi", "Social Science", "Biology", "Computer Science"
];

const mockMarksRecords = [
  {
    studentId: "STU001",
    studentName: "Rahul Kumar",
    subject: "Mathematics",
    marks: 85,
    timestamp: "2025-09-18T10:30:00Z",
    blockHash: "0x1234...5678",
    transactionHash: "0xabcd...efgh",
    status: "verified",
    semester: "1st Sem"
  },
  {
    studentId: "STU002",
    studentName: "Priya Sharma",
    subject: "Physics",
    marks: 92,
    timestamp: "2025-09-18T11:15:00Z",
    blockHash: "0x2345...6789",
    transactionHash: "0xbcde...fghi",
    status: "verified",
    semester: "1st Sem"
  },
  {
    studentId: "STU001",
    studentName: "Rahul Kumar",
    subject: "Chemistry",
    marks: 78,
    timestamp: "2025-09-18T12:00:00Z",
    blockHash: "0x3456...7890",
    transactionHash: "0xcdef...ghij",
    status: "pending",
    semester: "1st Sem"
  },
  {
    studentId: "STU003",
    studentName: "Amit Singh",
    subject: "English",
    marks: 88,
    timestamp: "2025-09-18T14:30:00Z",
    blockHash: "0x4567...8901",
    transactionHash: "0xdef0...hijk",
    status: "verified",
    semester: "1st Sem"
  }
];

export default function BlockchainMarks() {
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [marks, setMarks] = useState("");
  const [semester, setSemester] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordStatus, setRecordStatus] = useState<"idle" | "success" | "error">("idle");
  const [contractStatus, setContractStatus] = useState<"connected" | "disconnected" | "error">("disconnected");
  const [blockchainStats, setBlockchainStats] = useState({
    totalRecords: 0,
    verifiedRecords: 0,
    pendingRecords: 0,
    lastBlock: "0x0000...0000",
    networkHashRate: "150 TH/s",
    blockTime: "13.2s"
  });
  const [marksRecords, setMarksRecords] = useState(mockMarksRecords);

  useEffect(() => {
    // Simulate blockchain connection
    setTimeout(() => {
      setContractStatus("connected");
      setBlockchainStats({
        totalRecords: marksRecords.length,
        verifiedRecords: marksRecords.filter(r => r.status === "verified").length,
        pendingRecords: marksRecords.filter(r => r.status === "pending").length,
        lastBlock: "0x1234...5678",
        networkHashRate: "150 TH/s",
        blockTime: "13.2s"
      });
    }, 2000);
  }, []);

  const handleRecordMarks = async () => {
    if (!selectedStudent || !selectedSubject || !marks || !semester) {
      alert("Please fill in all fields");
      return;
    }

    setIsRecording(true);
    setRecordStatus("idle");

    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // Add the new record to the list
      const selectedStudentData = mockStudents.find(s => s.id === selectedStudent);
      const newRecord = {
        studentId: selectedStudent,
        studentName: selectedStudentData?.name || "Unknown Student",
        subject: selectedSubject,
        marks: parseInt(marks),
        timestamp: new Date().toISOString(),
        blockHash: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
        transactionHash: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 8)}`,
        status: "verified",
        semester: semester
      };
      
      setMarksRecords(prev => [newRecord, ...prev]);
      
      // Update stats
      setBlockchainStats(prev => ({
        ...prev,
        totalRecords: prev.totalRecords + 1,
        verifiedRecords: prev.verifiedRecords + 1
      }));
      
      setRecordStatus("success");
      // Reset form
      setSelectedStudent("");
      setSelectedSubject("");
      setMarks("");
      setSemester("");
    } catch (error) {
      setRecordStatus("error");
    } finally {
      setIsRecording(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge variant="default" className="bg-green-500">Verified</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500">Pending</Badge>;
      default:
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Link className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blockchain Marks Management</h1>
          <p className="text-gray-600">Immutable and transparent student marks recording using blockchain technology</p>
          <p className="text-sm text-primary font-medium">Government of Rajasthan • Acharya Education Portal</p>
        </div>
      </div>

      {/* Blockchain Status */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary" />
            <span>Blockchain Network Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                contractStatus === "connected" ? "bg-green-500" : 
                contractStatus === "error" ? "bg-red-500" : "bg-gray-400"
              }`} />
              <span className="text-sm font-medium">
                Contract: {contractStatus === "connected" ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span className="text-sm">Records: {blockchainStats.totalRecords}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Verified: {blockchainStats.verifiedRecords}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Lock className="h-4 w-4" />
              <span className="text-sm">Block: {blockchainStats.lastBlock}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span className="text-sm">Hash Rate: {blockchainStats.networkHashRate}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Block Time: {blockchainStats.blockTime}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="record" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="record">Record Marks</TabsTrigger>
          <TabsTrigger value="view">View Records</TabsTrigger>
          <TabsTrigger value="verify">Verify Records</TabsTrigger>
        </TabsList>

        {/* Record Marks Tab */}
        <TabsContent value="record">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Record Student Marks on Blockchain</span>
              </CardTitle>
              <CardDescription>
                Add new marks to the blockchain. Once recorded, marks cannot be modified or deleted - ensuring data integrity and transparency.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {contractStatus !== "connected" && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Blockchain contract is not connected. Please ensure Hardhat local network is running on localhost:8545
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="student">Student</Label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockStudents.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} ({student.class} - Roll: {student.rollNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockSubjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <Select value={semester} onValueChange={setSemester}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st">1st Semester</SelectItem>
                      <SelectItem value="2nd">2nd Semester</SelectItem>
                      <SelectItem value="Annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marks">Marks</Label>
                  <Input
                    id="marks"
                    type="number"
                    placeholder="Enter marks"
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    max="100"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button 
                  onClick={handleRecordMarks}
                  disabled={isRecording || contractStatus !== "connected"}
                  className="min-w-[200px] bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isRecording ? (
                    <>
                      <Activity className="h-4 w-4 mr-2 animate-spin" />
                      Recording to Blockchain...
                    </>
                  ) : (
                    <>
                      <Link className="h-4 w-4 mr-2" />
                      Record to Blockchain
                    </>
                  )}
                </Button>

                {recordStatus === "success" && (
                  <Alert className="flex-1">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Marks successfully recorded to blockchain! Transaction hash: 0x1234...5678
                    </AlertDescription>
                  </Alert>
                )}

                {recordStatus === "error" && (
                  <Alert variant="destructive" className="flex-1">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Failed to record marks to blockchain. Please try again.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator />

              <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
                <h4 className="font-medium text-primary mb-3 flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  Blockchain Technology Benefits
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Lock className="h-4 w-4 text-primary" />
                      <span className="text-sm text-primary font-medium">Immutable Records</span>
                    </div>
                    <p className="text-sm text-gray-700">Once recorded, marks cannot be altered or deleted</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="text-sm text-primary font-medium">Transparent Verification</span>
                  </div>
                  <p className="text-sm text-gray-700">All transactions are publicly verifiable on the blockchain</p>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm text-primary font-medium">Cryptographic Security</span>
                  </div>
                  <p className="text-sm text-gray-700">Advanced encryption protects against tampering</p>
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-primary" />
                    <span className="text-sm text-primary font-medium">Decentralized Storage</span>
                  </div>
                  <p className="text-sm text-gray-700">No single point of failure, distributed across network</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* View Records Tab */}
        <TabsContent value="view">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Blockchain Records Viewer</span>
              </CardTitle>
              <CardDescription>
                Browse all marks records stored on the blockchain with complete transaction history and verification status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {marksRecords.map((record, index) => (
                    <Card key={index} className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-3">
                              <User className="h-4 w-4" />
                              <span className="font-medium text-lg">{record.studentName}</span>
                              <span className="text-sm text-gray-500">({record.studentId})</span>
                              {getStatusIcon(record.status)}
                              {getStatusBadge(record.status)}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div><strong>Subject:</strong> {record.subject}</div>
                              <div><strong>Semester:</strong> {record.semester}</div>
                              <div><strong>Block Hash:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-xs">{record.blockHash}</code></div>
                              <div><strong>Transaction Hash:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-xs">{record.transactionHash}</code></div>
                              <div><strong>Timestamp:</strong> {new Date(record.timestamp).toLocaleString()}</div>
                              <div><strong>School:</strong> G.SEC.SCHOOL KOTDA AJMERCITY</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Award className="h-6 w-6 text-yellow-500" />
                            <span className="text-3xl font-bold text-primary">{record.marks}</span>
                            <span className="text-sm text-gray-500">/100</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verify Records Tab */}
        <TabsContent value="verify">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Blockchain Verification Center</span>
              </CardTitle>
              <CardDescription>
                Verify the integrity and authenticity of marks records stored on the blockchain
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="text-center">
                    <CardContent className="p-6">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-green-600">{blockchainStats.verifiedRecords}</div>
                      <div className="text-sm text-gray-600">Verified Records</div>
                      <div className="text-xs text-gray-500 mt-1">Cryptographically secured</div>
                    </CardContent>
                  </Card>
                  <Card className="text-center">
                    <CardContent className="p-6">
                      <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-yellow-600">{blockchainStats.pendingRecords}</div>
                      <div className="text-sm text-gray-600">Pending Verification</div>
                      <div className="text-xs text-gray-500 mt-1">Awaiting confirmation</div>
                    </CardContent>
                  </Card>
                  <Card className="text-center">
                    <CardContent className="p-6">
                      <Database className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-blue-600">{blockchainStats.totalRecords}</div>
                      <div className="text-sm text-gray-600">Total Records</div>
                      <div className="text-xs text-gray-500 mt-1">On blockchain</div>
                    </CardContent>
                  </Card>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Blockchain Verification:</strong> All records are cryptographically verified on the blockchain. Each transaction is immutable and tamper-proof, ensuring complete data integrity for educational records.
                  </AlertDescription>
                </Alert>

                <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
                  <h4 className="font-medium text-primary mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Cryptographic Verification Process
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                        <div>
                          <div className="font-medium text-primary">Hash Generation</div>
                          <div className="text-sm text-gray-700">Each marks entry is hashed using SHA-256 algorithm</div>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                        <div>
                          <div className="font-medium text-primary">Block Formation</div>
                          <div className="text-sm text-gray-700">Hashes are grouped into blocks and linked cryptographically</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                        <div>
                          <div className="font-medium text-primary">Chain Validation</div>
                          <div className="text-sm text-gray-700">Any attempt to modify data breaks the blockchain chain</div>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">4</div>
                        <div>
                          <div className="font-medium text-primary">Network Consensus</div>
                          <div className="text-sm text-gray-700">Multiple nodes verify each transaction independently</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-secondary/5 p-6 rounded-lg border border-secondary/20">
                  <h4 className="font-medium text-secondary mb-3 flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    Government of Rajasthan - Blockchain Initiative
                  </h4>
                  <p className="text-sm text-gray-700 mb-3">
                    This blockchain implementation ensures transparent, tamper-proof record keeping for all educational institutions under the Government of Rajasthan.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-secondary" />
                      <span className="text-secondary">Transparency</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-secondary" />
                      <span className="text-secondary">Data Integrity</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Lock className="h-4 w-4 text-secondary" />
                      <span className="text-secondary">Tamper-Proof</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
