import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarIcon, ArrowLeft, Upload, CheckCircle, Loader2, Search } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/datepicker.css";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { admissionService, schoolService } from "@/lib/api/services";
import { extractApiData, extractErrorMessage } from "@/lib/utils/apiHelpers";
import { School, AdmissionTrackingResponse, SchoolAdmissionDecision } from "@/lib/api/types";

interface AdmissionFormData {
  applicant_name: string;
  date_of_birth: string;
  email: string;
  phone_number: string;
  address: string;
  category: string;
  course_applied: string;
  first_preference_school: number | "";
  second_preference_school: number | "";
  third_preference_school: number | "";
  previous_school: string;
  last_percentage: number | "";
  documents: File[];
  
  // Parent/Guardian Information
  father_name: string;
  father_phone: string;
  father_email: string;
  father_occupation: string;
  mother_name: string;
  mother_phone: string;
  mother_email: string;
  mother_occupation: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  guardian_relationship: string;
  primary_contact: 'father' | 'mother' | 'guardian' | '';
  
  acceptedTerms: boolean;
}

const Admission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedApplication, setSubmittedApplication] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [date, setDate] = useState<Date | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [trackingResult, setTrackingResult] = useState<AdmissionTrackingResponse | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [acceptedSchools, setAcceptedSchools] = useState<SchoolAdmissionDecision[]>([]);
  const [isSubmittingChoice, setIsSubmittingChoice] = useState(false);
  
  // Email verification states
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Helper function to safely get school name from school object or string
  const getSchoolName = (school: any, schoolName?: string): string => {
    if (schoolName) return schoolName;
    if (typeof school === 'string') return school;
    if (typeof school === 'object' && school) {
      return school.school_name || school.name || 'Unknown School';
    }
    return 'Unknown School';
  };
  
  const [formData, setFormData] = useState<AdmissionFormData>({
    applicant_name: "",
    date_of_birth: "",
    email: "",
    phone_number: "",
    address: "",
    category: "general",
    course_applied: "",
    first_preference_school: "",
    second_preference_school: "",
    third_preference_school: "",
    previous_school: "",
    last_percentage: "",
    documents: [],
    
    // Parent/Guardian Information
    father_name: "",
    father_phone: "",
    father_email: "",
    father_occupation: "",
    mother_name: "",
    mother_phone: "",
    mother_email: "",
    mother_occupation: "",
    guardian_name: "",
    guardian_phone: "",
    guardian_email: "",
    guardian_relationship: "",
    primary_contact: "",
    
    acceptedTerms: false,
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Fetch schools on component mount
  useEffect(() => {
    const fetchSchools = async () => {
      setIsLoadingSchools(true);
      try {
        const response = await schoolService.getActiveSchools();
        setSchools(response.data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load schools. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingSchools(false);
      }
    };
    
    fetchSchools();
  }, [toast]);

  const handleTrackApplication = async () => {
    if (!trackingId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reference ID",
        variant: "destructive",
      });
      return;
    }

    setIsTracking(true);
    try {
      const result = await admissionService.trackApplication(trackingId.trim());
      setTrackingResult(result);
      
      if (result.success && result.data) {
        // Also fetch accepted schools for student choice
        try {
          const acceptedResult = await admissionService.getAcceptedSchools(trackingId.trim());
          if (acceptedResult.success) {
            // Handle both array and paginated response
            const acceptedData = Array.isArray(acceptedResult.data) 
              ? acceptedResult.data 
              : acceptedResult.data.results || [];
            setAcceptedSchools(acceptedData);
          }
        } catch (error) {
          console.error('Error fetching accepted schools:', error);
        }
      } else {
        toast({
          title: "Not Found",
          description: result.message || "No application found with this reference ID",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to track application. Please try again.",
        variant: "destructive",
      });
      setTrackingResult(null);
    } finally {
      setIsTracking(false);
    }
  };

  const handleStudentChoice = async (chosenSchool: string) => {
    if (!trackingResult?.data?.reference_id) return;

    setIsSubmittingChoice(true);
    try {
      const result = await admissionService.submitStudentChoice({
        reference_id: trackingResult.data.reference_id,
        chosen_school: chosenSchool
      });

      if (result.success) {
        toast({
          title: "Choice Submitted",
          description: "Your school choice has been submitted successfully!",
        });
        
        // Refresh tracking data
        await handleTrackApplication();
      } else {
        throw new Error(result.message || 'Failed to submit choice');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit your choice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingChoice(false);
    }
  };

  // Handle tracking URL parameter
  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam) {
      setTrackingId(refParam);
      setShowTrackingModal(true);
      // Auto-track the application when component mounts with ref parameter
      const autoTrack = async () => {
        setIsTracking(true);
        try {
          const result = await admissionService.trackApplication(refParam.trim());
          setTrackingResult(result);
          
          if (!result.success) {
            toast({
              title: "Not Found",
              description: result.message || "No application found with this reference ID",
              variant: "destructive",
            });
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to track application. Please try again.",
            variant: "destructive",
          });
          setTrackingResult(null);
        } finally {
          setIsTracking(false);
        }
      };
      autoTrack();
    }
  }, [searchParams, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'under_review': return 'text-blue-600 bg-blue-50';
      case 'approved': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleInputChange = (field: keyof AdmissionFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({ ...prev, documents: [...prev.documents, ...files] }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  // Email verification functions
  const handleSendOtp = async () => {
    if (!formData.email || !formData.applicant_name) {
      toast({
        title: "Error",
        description: "Please enter your name and email address first",
        variant: "destructive",
      });
      return;
    }

    if (otpCooldown > 0) {
      toast({
        title: "Please wait",
        description: `You can request a new OTP in ${otpCooldown} seconds`,
        variant: "destructive",
      });
      return;
    }

    setIsSendingOtp(true);
    try {
      const result = await admissionService.requestEmailVerification({
        email: formData.email,
        applicant_name: formData.applicant_name
      });

      if (result.success) {
        setOtpSent(true);
        setOtpCooldown(120); // 2 minutes cooldown
        toast({
          title: "OTP Sent",
          description: "Please check your email for the verification code",
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to send OTP",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setIsVerifyingEmail(true);
    try {
      const result = await admissionService.verifyEmail({
        email: formData.email,
        otp: otp
      });

      if (result.success && result.verification_token) {
        setIsEmailVerified(true);
        setVerificationToken(result.verification_token);
        toast({
          title: "Email Verified",
          description: "Your email has been successfully verified!",
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Invalid OTP",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  // Cooldown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCooldown > 0) {
      timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  // Reset email verification when email changes
  useEffect(() => {
    setIsEmailVerified(false);
    setVerificationToken("");
    setOtpSent(false);
    setOtp("");
  }, [formData.email]);

  const isStepValid = useMemo(() => {
    if (step === 1) {
      return (
        formData.applicant_name.trim().length > 1 &&
        formData.date_of_birth &&
        formData.course_applied &&
        formData.first_preference_school &&
        formData.phone_number &&
        formData.email &&
        formData.address &&
        formData.category &&
        isEmailVerified  // Email must be verified
      );
    }
    if (step === 2) {
      return formData.documents.length > 0;
    }
    if (step === 3) {
      // At least one parent's name should be provided, and a primary contact should be selected
      const hasParentInfo = formData.father_name.trim() || formData.mother_name.trim() || formData.guardian_name.trim();
      const hasPrimaryContact = formData.primary_contact !== "";
      return hasParentInfo && hasPrimaryContact;
    }
    if (step === 4) {
      return formData.acceptedTerms;
    }
    return false;
  }, [step, formData, isEmailVerified]);

  const uploadDocuments = async (applicationId: number, documents: File[]): Promise<void> => {
    if (documents.length === 0) return;
    
    try {
      const result = await admissionService.uploadDocuments(applicationId, documents);
      console.log('Documents uploaded successfully:', result);
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast({
        title: "Document Upload Warning",
        description: "Some documents failed to upload, but your application was submitted successfully.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step < 4) {
      if (isStepValid) setStep(prev => prev + 1);
      return;
    }

    if (!isStepValid) return;

    setIsSubmitting(true);

    try {
      // Prepare the application data
      const applicationData = {
        applicant_name: formData.applicant_name,
        date_of_birth: formData.date_of_birth,
        email: formData.email,
        phone_number: formData.phone_number,
        address: formData.address,
        category: formData.category,
        course_applied: formData.course_applied,
        first_preference_school: formData.first_preference_school === "" ? null : Number(formData.first_preference_school),
        second_preference_school: formData.second_preference_school === "" ? null : Number(formData.second_preference_school),
        third_preference_school: formData.third_preference_school === "" ? null : Number(formData.third_preference_school),
        previous_school: formData.previous_school || "",
        last_percentage: formData.last_percentage === "" ? null : Number(formData.last_percentage),
        
        // Parent/Guardian Information
        father_name: formData.father_name || "",
        father_phone: formData.father_phone || "",
        father_email: formData.father_email || "",
        father_occupation: formData.father_occupation || "",
        mother_name: formData.mother_name || "",
        mother_phone: formData.mother_phone || "",
        mother_email: formData.mother_email || "",
        mother_occupation: formData.mother_occupation || "",
        guardian_name: formData.guardian_name || "",
        guardian_phone: formData.guardian_phone || "",
        guardian_email: formData.guardian_email || "",
        guardian_relationship: formData.guardian_relationship || "",
        primary_contact: formData.primary_contact || "father",
        
        email_verification_token: verificationToken,  // Include verification token
      };

      // Submit the application
      const application = await admissionService.submitApplication(applicationData);

      // Upload documents if any
      if (formData.documents.length > 0) {
        await uploadDocuments((application as any).id, formData.documents);
      }

      setSubmittedApplication(application);
      setIsSubmitted(true);
      
      toast({
        title: "Application Submitted Successfully!",
        description: `Your admission application has been received. Reference ID: ${(application as any).id}`,
      });
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission Failed",
        description: extractErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl text-center border-0">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-green-600">Application Submitted!</CardTitle>
              <CardDescription>
                Your admission application has been successfully submitted.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {submittedApplication && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium">Application Reference ID:</p>
                  <p className="text-lg font-bold text-blue-600">{(submittedApplication as any).reference_id || `#${(submittedApplication as any).id}`}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Please save this reference ID for future correspondence.
                  </p>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                We will review your application and contact you within 3-5 business days.
              </p>

              <div className="space-y-2">
                <Button 
                  className="w-full bg-gradient-primary text-white" 
                  onClick={() => navigate('/auth')}
                >
                  Back to Portal
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setIsSubmitted(false);
                    setSubmittedApplication(null);
                    setFormData({
                      applicant_name: "",
                      date_of_birth: "",
                      email: "",
                      phone_number: "",
                      address: "",
                      category: "general",
                      course_applied: "",
                      first_preference_school: "",
                      second_preference_school: "",
                      third_preference_school: "",
                      previous_school: "",
                      last_percentage: "",
                      documents: [],
                      father_name: "",
                      father_phone: "",
                      father_email: "",
                      father_occupation: "",
                      mother_name: "",
                      mother_phone: "",
                      mother_email: "",
                      mother_occupation: "",
                      guardian_name: "",
                      guardian_phone: "",
                      guardian_email: "",
                      guardian_relationship: "",
                      primary_contact: "",
                      acceptedTerms: false,
                    });
                    setDate(undefined);
                    setStep(1);
                  }}
                >
                  Submit Another Application
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <Card className="shadow-2xl border-0 overflow-hidden">
          <CardHeader className="text-center bg-gradient-primary text-white py-4 relative">
            <CardTitle className="text-xl mb-1">Admission Application</CardTitle>
            <CardDescription className="text-white/90 text-sm">
              Fill out the form below to apply for admission
            </CardDescription>
            
            {/* Track Application Button */}
            <Link to="/track">
              <Button 
                variant="outline" 
                size="sm"
                className="absolute top-4 right-4 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Search className="h-4 w-4 mr-2" />
                Track Application
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-6">
            {/* Step Progress */}
            <div className="mb-6">
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[1,2,3,4].map((s) => (
                  <div key={s} className={`h-2 rounded-full ${step >= s ? 'bg-gradient-primary' : 'bg-muted'}`}></div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Details</span>
                <span>Documents</span>
                <span>Additional</span>
                <span>Terms</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 && (
                <div className="space-y-4 max-h-[75vh] overflow-y-auto">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Step 1: Personal & Contact Details</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="applicant_name" className="text-gray-700">Full Name *</Label>
                      <Input 
                        id="applicant_name" 
                        placeholder="Enter full name" 
                        value={formData.applicant_name} 
                        onChange={(e) => handleInputChange('applicant_name', e.target.value)} 
                        required 
                        className="border-gray-300 focus:border-primary focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-700">Date of Birth *</Label>
                      <div className="relative">
                        <DatePicker
                          selected={date}
                          onChange={(selectedDate: Date | null) => {
                            setDate(selectedDate);
                            if (selectedDate) {
                              const formattedDate = selectedDate.toISOString().split('T')[0];
                              handleInputChange('date_of_birth', formattedDate);
                            } else {
                              handleInputChange('date_of_birth', '');
                            }
                          }}
                          dateFormat="yyyy-MM-dd"
                          placeholderText="Select date of birth"
                          maxDate={new Date()}
                          showYearDropdown
                          showMonthDropdown
                          dropdownMode="select"
                          yearDropdownItemNumber={50}
                          scrollableYearDropdown
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                          calendarClassName="shadow-lg border-gray-200"
                          required
                        />
                        <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="course_applied" className="text-gray-700">Class/Course Applying For *</Label>
                      <Select onValueChange={(value) => handleInputChange('course_applied', value)} required>
                        <SelectTrigger className="border-gray-300 focus:border-primary focus:ring-primary">
                          <SelectValue placeholder="Select class or course" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nursery">Nursery</SelectItem>
                          <SelectItem value="lkg">LKG</SelectItem>
                          <SelectItem value="ukg">UKG</SelectItem>
                          {Array.from({length: 12}, (_, i) => i + 1).map((grade) => (
                            <SelectItem key={grade} value={`class-${grade}`}>Class {grade}</SelectItem>
                          ))}
                          <SelectItem value="11th-science">11th Science</SelectItem>
                          <SelectItem value="11th-commerce">11th Commerce</SelectItem>
                          <SelectItem value="11th-arts">11th Arts</SelectItem>
                          <SelectItem value="12th-science">12th Science</SelectItem>
                          <SelectItem value="12th-commerce">12th Commerce</SelectItem>
                          <SelectItem value="12th-arts">12th Arts</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800">School Preferences</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_preference" className="text-gray-700">1st Preference *</Label>
                        <Select onValueChange={(value) => handleInputChange('first_preference_school', parseInt(value))} required>
                          <SelectTrigger className="border-gray-300 focus:border-primary focus:ring-primary">
                            <SelectValue placeholder={isLoadingSchools ? "Loading..." : "Select 1st choice"} />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingSchools ? (
                              <SelectItem value="loading" disabled>
                                <div className="flex items-center">
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Loading schools...
                                </div>
                              </SelectItem>
                            ) : schools.length > 0 ? (
                              schools.map((school) => (
                                <SelectItem key={school.id} value={school.id.toString()}>
                                  {school.school_name} - {school.district}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-schools" disabled>
                                No schools available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="second_preference" className="text-gray-700">2nd Preference</Label>
                        <Select onValueChange={(value) => handleInputChange('second_preference_school', parseInt(value))}>
                          <SelectTrigger className="border-gray-300 focus:border-primary focus:ring-primary">
                            <SelectValue placeholder={isLoadingSchools ? "Loading..." : "Select 2nd choice"} />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingSchools ? (
                              <SelectItem value="loading" disabled>
                                <div className="flex items-center">
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Loading schools...
                                </div>
                              </SelectItem>
                            ) : schools.length > 0 ? (
                              schools.filter(s => s.id !== formData.first_preference_school).map((school) => (
                                <SelectItem key={school.id} value={school.id.toString()}>
                                  {school.school_name} - {school.district}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-schools" disabled>
                                No schools available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="third_preference" className="text-gray-700">3rd Preference</Label>
                        <Select onValueChange={(value) => handleInputChange('third_preference_school', parseInt(value))}>
                          <SelectTrigger className="border-gray-300 focus:border-primary focus:ring-primary">
                            <SelectValue placeholder={isLoadingSchools ? "Loading..." : "Select 3rd choice"} />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingSchools ? (
                              <SelectItem value="loading" disabled>
                                <div className="flex items-center">
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Loading schools...
                                </div>
                              </SelectItem>
                            ) : schools.length > 0 ? (
                              schools.filter(s => 
                                s.id !== formData.first_preference_school && 
                                s.id !== formData.second_preference_school
                              ).map((school) => (
                                <SelectItem key={school.id} value={school.id.toString()}>
                                  {school.school_name} - {school.district}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-schools" disabled>
                                No schools available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone_number" className="text-gray-700">Contact Number *</Label>
                      <Input 
                        id="phone_number" 
                        type="tel" 
                        placeholder="Enter contact number" 
                        value={formData.phone_number} 
                        onChange={(e) => handleInputChange('phone_number', e.target.value)} 
                        required 
                        className="border-gray-300 focus:border-primary focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700">Email Address *</Label>
                      <div className="space-y-3">
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="Enter email address" 
                          value={formData.email} 
                          onChange={(e) => handleInputChange('email', e.target.value)} 
                          required 
                          className="border-gray-300 focus:border-primary focus:ring-primary"
                          disabled={isEmailVerified}
                        />
                        
                        {/* Email verification section */}
                        {formData.email && formData.applicant_name && !isEmailVerified && (
                          <div className="space-y-2">
                            {!otpSent ? (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleSendOtp}
                                disabled={isSendingOtp || otpCooldown > 0}
                                className="w-full"
                              >
                                {isSendingOtp ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending OTP...
                                  </>
                                ) : otpCooldown > 0 ? (
                                  `Resend OTP in ${otpCooldown}s`
                                ) : (
                                  "Send Verification OTP"
                                )}
                              </Button>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex space-x-2">
                                  <Input
                                    type="text"
                                    placeholder="Enter 6-digit OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    maxLength={6}
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    onClick={handleVerifyOtp}
                                    disabled={isVerifyingEmail || otp.length !== 6}
                                  >
                                    {isVerifyingEmail ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      "Verify"
                                    )}
                                  </Button>
                                </div>
                                <div className="flex justify-between">
                                  <p className="text-sm text-gray-600">
                                    Check your email for the verification code
                                  </p>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSendOtp}
                                    disabled={isSendingOtp || otpCooldown > 0}
                                    className="text-primary"
                                  >
                                    {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : "Resend OTP"}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Email verified indicator */}
                        {isEmailVerified && (
                          <div className="flex items-center space-x-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Email verified successfully</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-gray-700">Complete Address *</Label>
                      <Input 
                        id="address" 
                        placeholder="Enter complete address with pin code" 
                        value={formData.address} 
                        onChange={(e) => handleInputChange('address', e.target.value)} 
                        required 
                        className="border-gray-300 focus:border-primary focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-gray-700">Category *</Label>
                      <Select onValueChange={(value) => handleInputChange('category', value)} value={formData.category} required>
                        <SelectTrigger className="border-gray-300 focus:border-primary focus:ring-primary">
                          <SelectValue placeholder="Select your category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="sc">SC (Scheduled Caste)</SelectItem>
                          <SelectItem value="st">ST (Scheduled Tribe)</SelectItem>
                          <SelectItem value="obc">OBC (Other Backward Class)</SelectItem>
                          <SelectItem value="sbc">SBC (Special Backward Class)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 max-h-[75vh] overflow-y-auto">
                  <h3 className="text-lg font-semibold text-gray-800">Step 2: Upload Required Documents</h3>
                  <div className="p-4 bg-muted/30 rounded-lg border">
                    <h4 className="font-medium mb-2">Required Documents:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Birth Certificate</li>
                      <li>• Previous School Report Card/Transfer Certificate</li>
                      <li>• Passport Size Photograph</li>
                      <li>• Address Proof (Aadhar/Utility Bill)</li>
                      <li>• Caste Certificate (if applicable)</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="documents" className="text-gray-700">Upload Documents *</Label>
                    <Input 
                      id="documents" 
                      type="file" 
                      multiple 
                      accept=".pdf,.jpg,.jpeg,.png" 
                      onChange={handleFileUpload} 
                      className="cursor-pointer border-gray-300 focus:border-primary focus:ring-primary" 
                    />
                    <p className="text-sm text-muted-foreground">
                      Upload: Birth Certificate, Previous Report Card, ID Proof (PDF, JPG, PNG - Max 5MB each)
                    </p>
                  </div>
                  {formData.documents.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-gray-700">Uploaded Files:</Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {formData.documents.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                            <div>
                              <span className="text-sm font-medium">{file.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeFile(index)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 max-h-[75vh] overflow-y-auto">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Step 3: Additional Information (Optional)</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="previous_school" className="text-gray-700">Previous School</Label>
                      <Input 
                        id="previous_school" 
                        placeholder="Enter previous school name" 
                        value={formData.previous_school} 
                        onChange={(e) => handleInputChange('previous_school', e.target.value)} 
                        className="border-gray-300 focus:border-primary focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_percentage" className="text-gray-700">Last Exam Percentage</Label>
                      <Input 
                        id="last_percentage" 
                        type="number" 
                        placeholder="e.g. 86.5" 
                        min="0" 
                        max="100" 
                        step="0.1"
                        value={formData.last_percentage} 
                        onChange={(e) => handleInputChange('last_percentage', e.target.value ? parseFloat(e.target.value) : "")} 
                        className="border-gray-300 focus:border-primary focus:ring-primary"
                      />
                    </div>
                  </div>
                  
                  {/* Parent/Guardian Information Section */}
                  <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                    <h4 className="text-lg font-medium text-gray-800">Parent/Guardian Information</h4>
                    
                    {/* Father Information */}
                    <div className="space-y-3">
                      <h5 className="text-md font-medium text-gray-700">Father's Information</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="father_name" className="text-gray-700">Father's Name</Label>
                          <Input 
                            id="father_name" 
                            placeholder="Enter father's full name" 
                            value={formData.father_name} 
                            onChange={(e) => handleInputChange('father_name', e.target.value)} 
                            className="border-gray-300 focus:border-primary focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="father_phone" className="text-gray-700">Father's Phone</Label>
                          <Input 
                            id="father_phone" 
                            placeholder="Enter father's phone number" 
                            value={formData.father_phone} 
                            onChange={(e) => handleInputChange('father_phone', e.target.value)} 
                            className="border-gray-300 focus:border-primary focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="father_email" className="text-gray-700">Father's Email</Label>
                          <Input 
                            id="father_email" 
                            type="email"
                            placeholder="Enter father's email address" 
                            value={formData.father_email} 
                            onChange={(e) => handleInputChange('father_email', e.target.value)} 
                            className="border-gray-300 focus:border-primary focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="father_occupation" className="text-gray-700">Father's Occupation</Label>
                          <Input 
                            id="father_occupation" 
                            placeholder="Enter father's occupation" 
                            value={formData.father_occupation} 
                            onChange={(e) => handleInputChange('father_occupation', e.target.value)} 
                            className="border-gray-300 focus:border-primary focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Mother Information */}
                    <div className="space-y-3">
                      <h5 className="text-md font-medium text-gray-700">Mother's Information</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="mother_name" className="text-gray-700">Mother's Name</Label>
                          <Input 
                            id="mother_name" 
                            placeholder="Enter mother's full name" 
                            value={formData.mother_name} 
                            onChange={(e) => handleInputChange('mother_name', e.target.value)} 
                            className="border-gray-300 focus:border-primary focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mother_phone" className="text-gray-700">Mother's Phone</Label>
                          <Input 
                            id="mother_phone" 
                            placeholder="Enter mother's phone number" 
                            value={formData.mother_phone} 
                            onChange={(e) => handleInputChange('mother_phone', e.target.value)} 
                            className="border-gray-300 focus:border-primary focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mother_email" className="text-gray-700">Mother's Email</Label>
                          <Input 
                            id="mother_email" 
                            type="email"
                            placeholder="Enter mother's email address" 
                            value={formData.mother_email} 
                            onChange={(e) => handleInputChange('mother_email', e.target.value)} 
                            className="border-gray-300 focus:border-primary focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mother_occupation" className="text-gray-700">Mother's Occupation</Label>
                          <Input 
                            id="mother_occupation" 
                            placeholder="Enter mother's occupation" 
                            value={formData.mother_occupation} 
                            onChange={(e) => handleInputChange('mother_occupation', e.target.value)} 
                            className="border-gray-300 focus:border-primary focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Guardian Information (if different from parents) */}
                    <div className="space-y-3">
                      <h5 className="text-md font-medium text-gray-700">Guardian Information (if different from parents)</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="guardian_name" className="text-gray-700">Guardian's Name</Label>
                          <Input 
                            id="guardian_name" 
                            placeholder="Enter guardian's full name" 
                            value={formData.guardian_name} 
                            onChange={(e) => handleInputChange('guardian_name', e.target.value)} 
                            className="border-gray-300 focus:border-primary focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="guardian_phone" className="text-gray-700">Guardian's Phone</Label>
                          <Input 
                            id="guardian_phone" 
                            placeholder="Enter guardian's phone number" 
                            value={formData.guardian_phone} 
                            onChange={(e) => handleInputChange('guardian_phone', e.target.value)} 
                            className="border-gray-300 focus:border-primary focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="guardian_email" className="text-gray-700">Guardian's Email</Label>
                          <Input 
                            id="guardian_email" 
                            type="email"
                            placeholder="Enter guardian's email address" 
                            value={formData.guardian_email} 
                            onChange={(e) => handleInputChange('guardian_email', e.target.value)} 
                            className="border-gray-300 focus:border-primary focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="guardian_relationship" className="text-gray-700">Relationship to Student</Label>
                          <Input 
                            id="guardian_relationship" 
                            placeholder="e.g., Uncle, Aunt, Grandparent" 
                            value={formData.guardian_relationship} 
                            onChange={(e) => handleInputChange('guardian_relationship', e.target.value)} 
                            className="border-gray-300 focus:border-primary focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Primary Contact Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="primary_contact" className="text-gray-700">Primary Contact for School Communications</Label>
                      <Select 
                        value={formData.primary_contact} 
                        onValueChange={(value) => handleInputChange('primary_contact', value)}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-primary focus:ring-primary">
                          <SelectValue placeholder="Select primary contact" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="father">Father</SelectItem>
                          <SelectItem value="mother">Mother</SelectItem>
                          <SelectItem value="guardian">Guardian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg border">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> Parent/Guardian information is important for school communications and emergency contacts. 
                      Please ensure at least one parent's information is provided completely.
                    </p>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4 max-h-[75vh] overflow-y-auto">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Step 4: Review & Submit</h3>
                  
                  {/* Application Summary */}
                  <div className="p-4 bg-muted/20 rounded-lg border space-y-3">
                    <h4 className="font-medium">Application Summary:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Name:</span> 
                        <span className="text-muted-foreground ml-1">{formData.applicant_name}</span>
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> 
                        <span className="text-muted-foreground ml-1">{formData.email}</span>
                      </div>
                      <div>
                        <span className="font-medium">Course:</span> 
                        <span className="text-muted-foreground ml-1">{formData.course_applied}</span>
                      </div>
                      <div>
                        <span className="font-medium">School Preferences:</span> 
                        <div className="text-muted-foreground ml-1">
                          {formData.first_preference_school && (
                            <div>1st: {schools.find(s => s.id === formData.first_preference_school)?.school_name}</div>
                          )}
                          {formData.second_preference_school && (
                            <div>2nd: {schools.find(s => s.id === formData.second_preference_school)?.school_name}</div>
                          )}
                          {formData.third_preference_school && (
                            <div>3rd: {schools.find(s => s.id === formData.third_preference_school)?.school_name}</div>
                          )}
                          {!formData.first_preference_school && <span>Not selected</span>}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Documents:</span> 
                        <span className="text-muted-foreground ml-1">{formData.documents.length} files uploaded</span>
                      </div>
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                    <h4 className="font-medium">Terms & Conditions</h4>
                    <div className="text-sm space-y-2 text-muted-foreground">
                      <p>By submitting this application, I hereby declare that:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>All information provided is true and correct to the best of my knowledge</li>
                        <li>I understand that providing false information may result in rejection of the application</li>
                        <li>I consent to the processing of my personal data for admission purposes</li>
                        <li>I agree to abide by the institution's rules and regulations</li>
                        <li>The documents submitted are authentic and verifiable</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-background border rounded-lg">
                    <input 
                      id="terms" 
                      type="checkbox" 
                      className="h-4 w-4 text-primary border-border rounded focus:ring-primary" 
                      checked={formData.acceptedTerms} 
                      onChange={(e) => handleInputChange('acceptedTerms', e.target.checked)}
                      aria-label="Accept terms and conditions"
                    />
                    <Label htmlFor="terms" className="text-sm cursor-pointer">
                      I agree to the terms and conditions mentioned above *
                    </Label>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => (step > 1 ? setStep(step - 1) : navigate('/auth'))}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {step > 1 ? 'Back' : 'Back to Portal'}
                </Button>
                {step < 4 ? (
                  <Button 
                    type="submit" 
                    disabled={!isStepValid}
                    className="bg-gradient-primary text-white disabled:opacity-50"
                  >
                    Next
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !isStepValid}
                    className="bg-gradient-primary text-white disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admission;