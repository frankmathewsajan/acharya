import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { parentAuthService } from "@/lib/api/auth";
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  UserCheck, 
  Building, 
  Shield,
  Settings,
  FileText,
  ArrowLeft,
  Eye,
  EyeOff,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showStaffOptions, setShowStaffOptions] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [currentRole, setCurrentRole] = useState<string>("");
  const [currentRoleName, setCurrentRoleName] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [now, setNow] = useState<Date>(new Date());

  // Parent OTP authentication states
  const [showParentOTP, setShowParentOTP] = useState(false);
  const [parentEmail, setParentEmail] = useState("");
  const [parentOTP, setParentOTP] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  // Update clock every second
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // OTP cooldown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCooldown > 0) {
      timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Format current time for IST display
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

  const roleOptions = [
    {
      id: "student",
      name: "Student",
      icon: GraduationCap,
      description: "Access your academic dashboard, attendance, grades, and more",
      demoCredentials: { email: "student@acharya.edu", password: "student123" }
    },
    {
      id: "parent",
      name: "Parent",
      icon: Users,
      description: "Monitor your child's progress, fees, and school activities",
      demoCredentials: { email: "parent@acharya.edu", password: "parent123" }
    },
    {
      id: "staff",
      name: "Staff",
      icon: Shield,
      description: "Faculty and administrative access",
      hasSubOptions: true
    }
  ];

  const staffSubOptions = [
    {
      id: "faculty",
      name: "Faculty",
      icon: BookOpen,
      description: "Manage classes, attendance, and student assessments",
      demoCredentials: { email: "faculty@acharya.edu", password: "faculty123" }
    },
    {
      id: "warden",
      name: "Warden",
      icon: Building,
      description: "Hostel management and student welfare",
      demoCredentials: { email: "warden@acharya.edu", password: "warden123" }
    },
    {
      id: "admin",
      name: "Management",
      icon: Settings,
      description: "Complete school administration and management oversight",
      demoCredentials: { email: "admin@02402.rj.gov.in", password: "admin#02402" }
    }
  ];

  const handleRoleSelect = (role: any) => {
    if (role?.hasSubOptions) {
      setShowStaffOptions(true);
      return;
    }

    setCurrentRole(role?.id || "");
    setCurrentRoleName(role?.name || "");
    
    // For parent role, show OTP authentication
    if (role?.id === 'parent') {
      setShowParentOTP(true);
      setShowLoginForm(false);
    } else {
      setShowLoginForm(true);
      setShowParentOTP(false);
      
      // Pre-fill demo credentials for non-parent roles
      if (role?.demoCredentials) {
        setFormData(role.demoCredentials);
      }
    }
    
    setShowStaffOptions(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      toast({
        title: "Success!",
        description: `Welcome to your ${currentRoleName} dashboard`,
      });
      // Navigation happens automatically via useEffect
    } catch (error) {
      console.error("Login error:", error);
      // Error toast is handled in the AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  // Parent OTP handlers
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingOTP(true);

    try {
      await parentAuthService.requestOTP(parentEmail);
      setOtpSent(true);
      setOtpCooldown(60); // 60 seconds cooldown
      toast({
        title: "OTP Sent!",
        description: "Please check your email for the verification code",
      });
    } catch (error: any) {
      console.error("OTP request error:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingOTP(true);

    try {
      const response = await parentAuthService.verifyOTP(parentEmail, parentOTP);
      
      toast({
        title: "Success!",
        description: `Welcome ${response.parent.name}!`,
      });
      
      // Navigate to parent dashboard
      navigate("/dashboard");
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Invalid OTP",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const resetToRoleSelection = () => {
    setShowLoginForm(false);
    setShowStaffOptions(false);
    setShowParentOTP(false);
    setCurrentRole("");
    setCurrentRoleName("");
    setFormData({ email: "", password: "" });
    
    // Reset parent OTP states
    setParentEmail("");
    setParentOTP("");
    setOtpSent(false);
    setOtpCooldown(0);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="mx-auto h-8 w-8 animate-spin text-amber-600 mb-4" />
          <p className="text-amber-800">Loading...</p>
        </div>
      </div>
    );
  }

  // Login Form View
  if (showLoginForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-rose-500">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl">{currentRoleName} Login</CardTitle>
              <CardDescription>Enter your credentials to access the portal</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Enter your email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Enter your password" 
                      value={formData.password} 
                      onChange={(e) => setFormData({...formData, password: e.target.value})} 
                      required 
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" 
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (<EyeOff className="h-4 w-4" />) : (<Eye className="h-4 w-4" />)}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                  <Button type="button" variant="outline" className="w-full" onClick={resetToRoleSelection}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Role Selection
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Parent OTP Authentication View
  if (showParentOTP) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-rose-500">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl">Parent Authentication</CardTitle>
              <CardDescription>
                {otpSent 
                  ? "Enter the OTP sent to your email" 
                  : "Enter your email address to receive an OTP"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!otpSent ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="parent-email">Email Address</Label>
                    <Input 
                      id="parent-email" 
                      type="email" 
                      placeholder="Enter the email used during admission" 
                      value={parentEmail} 
                      onChange={(e) => setParentEmail(e.target.value)} 
                      required 
                    />
                    <p className="text-xs text-amber-700">
                      Use the same email address that was provided during your child's admission process
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Button type="submit" className="w-full" disabled={isSendingOTP}>
                      {isSendingOTP ? "Sending OTP..." : "Send OTP"}
                    </Button>
                    <Button type="button" variant="outline" className="w-full" onClick={resetToRoleSelection}>
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back to Role Selection
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="parent-otp">Verification Code</Label>
                    <Input 
                      id="parent-otp" 
                      type="text" 
                      placeholder="Enter 6-digit OTP" 
                      value={parentOTP} 
                      onChange={(e) => setParentOTP(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                      maxLength={6}
                      className="text-center text-xl tracking-wider"
                      required 
                    />
                    <p className="text-xs text-amber-700">
                      OTP sent to: {parentEmail}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Button type="submit" className="w-full" disabled={isVerifyingOTP || parentOTP.length !== 6}>
                      {isVerifyingOTP ? "Verifying..." : "Verify & Login"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full" 
                      onClick={handleSendOTP}
                      disabled={otpCooldown > 0}
                    >
                      {otpCooldown > 0 ? `Resend OTP (${otpCooldown}s)` : "Resend OTP"}
                    </Button>
                    <Button type="button" variant="ghost" className="w-full" onClick={resetToRoleSelection}>
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back to Role Selection
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main Role Selection View
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-amber-200">
              <GraduationCap className="h-12 w-12 text-amber-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-amber-900 mb-2">Acharya Education Portal</h1>
          <p className="text-amber-800/80 text-lg">Government of Rajasthan</p>
          <p className="text-amber-800/70 text-sm mt-1">शिक्षा विभाग | Education Department</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-amber-100 rounded-full px-5 py-2 ring-1 ring-amber-200">
            <Clock className="h-4 w-4 text-amber-700" />
            <span className="text-amber-900 text-base font-mono">{istString}</span>
          </div>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-2 hover:border-amber-400 bg-white/90">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 text-amber-900">Student</h3>
              <p className="text-amber-800/80 text-sm mb-4">Access your academic records, attendance, and course materials</p>
              <Button 
                className="w-full" 
                onClick={() => handleRoleSelect(roleOptions.find(r => r.id === 'student'))} 
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Enter Portal"}
              </Button>
            </CardContent>
          </Card>

          <Card className="group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-2 hover:border-amber-400 bg-white/90">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 text-amber-900">Staff</h3>
              <p className="text-amber-800/80 text-sm mb-4">Faculty, Warden, and Management access</p>
              <Button 
                className="w-full" 
                onClick={() => setShowStaffOptions(true)} 
                disabled={isLoading}
              >
                Select Role
              </Button>
            </CardContent>
          </Card>

          <Card className="group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-2 hover:border-amber-400 bg-white/90">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserCheck className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 text-amber-900">Parent</h3>
              <p className="text-amber-800/80 text-sm mb-4">Monitor your child's academic progress and fees</p>
              <Button 
                className="w-full" 
                onClick={() => handleRoleSelect(roleOptions.find(r => r.id === 'parent'))} 
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Enter Portal"}
              </Button>
            </CardContent>
          </Card>

          <Card className="group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-2 hover:border-amber-400 bg-white/90">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 text-amber-900">Admission</h3>
              <p className="text-amber-800/80 text-sm mb-4">Apply for admission and track application status</p>
              <Button 
                className="w-full" 
                onClick={() => navigate('/admission')} 
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Apply or Track"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Staff Sub-roles Modal */}
        {showStaffOptions && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Select Staff Role</span>
                </CardTitle>
                <CardDescription>Choose your specific role to continue</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start h-16" variant="outline" onClick={() => handleRoleSelect(staffSubOptions.find(s => s.id === 'faculty'))}>
                  <BookOpen className="h-6 w-6 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Faculty</p>
                    <p className="text-sm text-muted-foreground">Teaching staff and subject experts</p>
                  </div>
                </Button>
                <Button className="w-full justify-start h-16" variant="outline" onClick={() => handleRoleSelect(staffSubOptions.find(s => s.id === 'warden'))}>
                  <Building className="h-6 w-6 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Warden</p>
                    <p className="text-sm text-muted-foreground">Hostel and residential management</p>
                  </div>
                </Button>
                <Button className="w-full justify-start h-16" variant="outline" onClick={() => handleRoleSelect(staffSubOptions.find(s => s.id === 'admin'))}>
                  <Settings className="h-6 w-6 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Manager</p>
                    <p className="text-sm text-muted-foreground">Administrative and management roles</p>
                  </div>
                </Button>
                <Button className="w-full mt-4" variant="ghost" onClick={() => setShowStaffOptions(false)}>Cancel</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Government Branding Footer */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-4 bg-amber-100 rounded-lg px-6 py-3 ring-1 ring-amber-200">
            <Shield className="h-6 w-6 text-amber-700" />
            <div className="text-amber-900 text-sm">
              <p className="font-medium">राजस्थान सरकार | Government of Rajasthan</p>
              <p className="text-amber-800/70">Secure Portal • आधिकारिक पोर्टल</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;