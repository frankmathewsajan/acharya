import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarIcon, ArrowLeft, Upload, CheckCircle, Loader2, Search, FileText, X } from "lucide-react";
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
  
  // Enhanced Parent/Guardian Information
  father_name: string;
  father_phone: string;
  father_email: string;
  father_occupation: string;
  father_address: string;
  father_aadhar: string;
  father_qualification: string;
  father_company: string;
  father_annual_income: number | "";
  father_emergency_contact: string;
  
  mother_name: string;
  mother_phone: string;
  mother_email: string;
  mother_occupation: string;
  mother_address: string;
  mother_aadhar: string;
  mother_qualification: string;
  mother_company: string;
  mother_annual_income: number | "";
  mother_emergency_contact: string;
  
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  guardian_relationship: string;
  guardian_address: string;
  guardian_occupation: string;
  guardian_aadhar: string;
  guardian_qualification: string;
  guardian_company: string;
  guardian_annual_income: number | "";
  guardian_emergency_contact: string;
  
  // Primary contact and family information
  primary_contact: 'father' | 'mother' | 'guardian' | '';
  family_type: 'nuclear' | 'joint' | 'single_parent' | '';
  total_family_members: number | "";
  number_of_children: number | "";
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  
  acceptedTerms: boolean;
}

const Admission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedApplication, setSubmittedApplication] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [subStep, setSubStep] = useState(1); // For parent information sub-steps
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
  const [previousEmail, setPreviousEmail] = useState("");

  // Document processing states
  const [isProcessingDocuments, setIsProcessingDocuments] = useState(false);
  const [documentsProcessed, setDocumentsProcessed] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [autofillData, setAutofillData] = useState<Record<string, any>>({});
  const [processingStep, setProcessingStep] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);

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
    
    // Enhanced Parent/Guardian Information
    father_name: "",
    father_phone: "",
    father_email: "",
    father_occupation: "",
    father_address: "",
    father_aadhar: "",
    father_qualification: "",
    father_company: "",
    father_annual_income: "",
    father_emergency_contact: "",
    
    mother_name: "",
    mother_phone: "",
    mother_email: "",
    mother_occupation: "",
    mother_address: "",
    mother_aadhar: "",
    mother_qualification: "",
    mother_company: "",
    mother_annual_income: "",
    mother_emergency_contact: "",
    
    guardian_name: "",
    guardian_phone: "",
    guardian_email: "",
    guardian_relationship: "",
    guardian_address: "",
    guardian_occupation: "",
    guardian_aadhar: "",
    guardian_qualification: "",
    guardian_company: "",
    guardian_annual_income: "",
    guardian_emergency_contact: "",
    
    // Primary contact and family information
    primary_contact: "",
    family_type: "",
    total_family_members: "",
    number_of_children: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    
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
    
    // Initialize previous email tracking
    setPreviousEmail(formData.email);
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
    let validatedValue = value;
    
    // Apply field-specific validation and formatting
    if (typeof value === 'string') {
      // Aadhar number validation (exactly 12 digits)
      if (field.includes('aadhar') && value.length > 12) {
        toast({
          title: "Validation Error",
          description: "Aadhar number must be exactly 12 digits",
          variant: "destructive",
        });
        return; // Don't update if invalid
      }
      
      // Phone number validation (max 15 characters, digits only)
      if (field.includes('phone') || field.includes('contact')) {
        const phoneValue = value.replace(/[^\d]/g, ''); // Remove non-digits
        if (phoneValue.length > 15) {
          toast({
            title: "Validation Error", 
            description: "Phone number cannot exceed 15 digits",
            variant: "destructive",
          });
          return;
        }
        validatedValue = phoneValue;
      }
      
      // Name field validation (max 100 characters)
      if (field.includes('name') && value.length > 100) {
        toast({
          title: "Validation Error",
          description: "Name cannot exceed 100 characters",
          variant: "destructive",
        });
        return;
      }
      
      // Occupation field validation (max 100 characters)
      if (field.includes('occupation') && value.length > 100) {
        toast({
          title: "Validation Error",
          description: "Occupation cannot exceed 100 characters", 
          variant: "destructive",
        });
        return;
      }
      
      // Qualification field validation (max 100 characters)
      if (field.includes('qualification') && value.length > 100) {
        toast({
          title: "Validation Error",
          description: "Qualification cannot exceed 100 characters",
          variant: "destructive",
        });
        return;
      }
      
      // Company name validation (max 100 characters)
      if (field.includes('company') && value.length > 100) {
        toast({
          title: "Validation Error",
          description: "Company name cannot exceed 100 characters",
          variant: "destructive",
        });
        return;
      }
      
      // Email validation (basic format check)
      if (field.includes('email') && value.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          toast({
            title: "Validation Error",
            description: "Please enter a valid email address",
            variant: "destructive",
          });
          return;
        }
      }
    }
    
    setFormData(prev => ({ ...prev, [field]: validatedValue }));
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

  // Document processing function
  const handleProcessDocuments = async () => {
    if (formData.documents.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one document first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingDocuments(true);
    setProcessingProgress(0);
    
    try {
      // Step 1: Preparing documents
      setProcessingStep("Preparing documents for processing...");
      setProcessingProgress(20);
      await new Promise(resolve => setTimeout(resolve, 500));

      const studentContext = {
        applicant_name: formData.applicant_name,
        email: formData.email,
        phone_number: formData.phone_number,
        date_of_birth: formData.date_of_birth,
        course_applied: formData.course_applied,
      };

      // Step 2: Uploading and extracting text
      setProcessingStep("Extracting text from documents...");
      setProcessingProgress(40);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 3: AI processing
      setProcessingStep("Analyzing content with AI...");
      setProcessingProgress(70);

      const result = await admissionService.processDocuments(formData.documents, studentContext);

      // Step 4: Finalizing
      setProcessingStep("Finalizing auto-fill data...");
      setProcessingProgress(90);
      await new Promise(resolve => setTimeout(resolve, 500));

      if (result.success) {
        setExtractedText(result.extracted_text || "");
        setAutofillData(result.autofill_data || {});
        setDocumentsProcessed(true);
        setProcessingProgress(100);
        setProcessingStep("Processing complete!");

        // Auto-fill form with extracted data
        const newFormData = { ...formData };
        Object.entries(result.autofill_data || {}).forEach(([key, value]) => {
          if (value && value !== "" && key in newFormData) {
            (newFormData as any)[key] = value;
          }
        });
        setFormData(newFormData);

        await new Promise(resolve => setTimeout(resolve, 500));

        toast({
          title: "Documents Processed",
          description: "Form has been auto-filled with extracted information. Please review and proceed.",
        });

        // Automatically move to next step after a brief delay
        setTimeout(() => {
          setStep(3);
        }, 1000);
      } else {
        throw new Error(result.message || "Processing failed");
      }
    } catch (error: any) {
      console.error("Document processing error:", error);
      setProcessingStep("Processing failed");
      toast({
        title: "Processing Error",
        description: "An error occurred while processing documents. Please proceed manually.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsProcessingDocuments(false);
        setProcessingStep("");
        setProcessingProgress(0);
      }, 2000);
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

  // Reset email verification when email actually changes
  useEffect(() => {
    if (formData.email !== previousEmail) {
      setIsEmailVerified(false);
      setVerificationToken("");
      setOtpSent(false);
      setOtp("");
      setPreviousEmail(formData.email);
    }
  }, [formData.email, previousEmail]);

  const isStepValid = useMemo(() => {
    if (step === 1) {
      // Personal Information - all required
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
      // Documents - required
      return formData.documents.length > 0;
    }
    if (step === 3) {
      // Parent Information - Father and Mother info mandatory
      const hasFatherInfo = formData.father_name.trim() && 
                           formData.father_phone.trim() && 
                           formData.father_occupation.trim() &&
                           formData.father_address.trim();
      const hasMotherInfo = formData.mother_name.trim() && 
                           formData.mother_phone.trim() && 
                           formData.mother_occupation.trim() &&
                           formData.mother_address.trim();
      const hasPrimaryContact = formData.primary_contact !== "";
      return hasFatherInfo && hasMotherInfo && hasPrimaryContact;
    }
    if (step === 4) {
      // Guardian Information - Optional step, always valid
      return true;
    }
    if (step === 5) {
      // Additional Details - Optional, always valid
      return true;
    }
    if (step === 6) {
      // Review & Submit - Comprehensive final validation
      const isBasicInfoValid = (
        formData.applicant_name.trim().length > 1 &&
        formData.date_of_birth &&
        formData.course_applied &&
        formData.phone_number &&
        formData.email &&
        formData.address &&
        formData.category &&
        isEmailVerified
      );
      
      const isParentInfoValid = (
        formData.father_name.trim().length > 1 &&
        formData.father_phone &&
        formData.father_occupation &&
        formData.father_address &&
        formData.mother_name.trim().length > 1 &&
        formData.mother_phone &&
        formData.mother_occupation &&
        formData.mother_address
      );
      
      return formData.acceptedTerms && isBasicInfoValid && isParentInfoValid;
    }
    return false;
  }, [step, formData, isEmailVerified]);

  // Function to get missing required fields for current step
  const getMissingFields = () => {
    const missing: string[] = [];
    
    if (step === 1) {
      if (!formData.applicant_name.trim()) missing.push("Full Name");
      if (!formData.date_of_birth) missing.push("Date of Birth");
      if (!formData.course_applied) missing.push("Class/Course");
      if (!formData.first_preference_school) missing.push("First Preference School");
      if (!formData.phone_number) missing.push("Contact Number");
      if (!formData.email) missing.push("Email Address");
      if (!formData.address) missing.push("Address");
      if (!formData.category) missing.push("Category");
      if (!isEmailVerified) missing.push("Email Verification");
    } else if (step === 2) {
      if (formData.documents.length === 0) missing.push("Documents");
    } else if (step === 3) {
      if (!formData.father_name.trim()) missing.push("Father's Name");
      if (!formData.father_phone.trim()) missing.push("Father's Phone");
      if (!formData.father_occupation.trim()) missing.push("Father's Occupation");
      if (!formData.father_address.trim()) missing.push("Father's Address");
      if (!formData.mother_name.trim()) missing.push("Mother's Name");
      if (!formData.mother_phone.trim()) missing.push("Mother's Phone");
      if (!formData.mother_occupation.trim()) missing.push("Mother's Occupation");
      if (!formData.mother_address.trim()) missing.push("Mother's Address");
      if (!formData.primary_contact) missing.push("Primary Contact Selection");
    }
    
    return missing;
  };

  // Validation status function for step 6 to show missing fields
  const getValidationStatus = () => {
    if (step !== 6) return { isValid: isStepValid, missingFields: [] };
    
    const missingFields: string[] = [];
    
    // Check basic info
    if (formData.applicant_name.trim().length <= 1) missingFields.push("Full Name");
    if (!formData.date_of_birth) missingFields.push("Date of Birth");
    if (!formData.course_applied) missingFields.push("Class/Course Applying For");
    if (!formData.phone_number) missingFields.push("Contact Number");
    if (!formData.email) missingFields.push("Email Address");
    if (!formData.address) missingFields.push("Address");
    if (!formData.category) missingFields.push("Category");
    if (!isEmailVerified) missingFields.push("Email Verification");
    
    // Check parent info
    if (formData.father_name.trim().length <= 1) missingFields.push("Father's Name");
    if (!formData.father_phone) missingFields.push("Father's Phone");
    if (!formData.father_occupation) missingFields.push("Father's Occupation");
    if (formData.mother_name.trim().length <= 1) missingFields.push("Mother's Name");
    if (!formData.mother_phone) missingFields.push("Mother's Phone");
    if (!formData.mother_occupation) missingFields.push("Mother's Occupation");
    
    // Check terms acceptance
    if (!formData.acceptedTerms) missingFields.push("Accept Terms and Conditions");
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  };

  const validationStatus = getValidationStatus();

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

    if (step < 6) {
      // For step 2 (documents), don't auto-advance - use the Extract and Autofill button instead
      if (step === 2) {
        return;
      }
      if (isStepValid) setStep(prev => prev + 1);
      return;
    }

    if (!isStepValid) return;

    setIsSubmitting(true);

    try {
      // Final validation check before submission
      if (!formData.course_applied || formData.course_applied.trim() === '') {
        toast({
          title: "Validation Error",
          description: "Please select a class/course you are applying for.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (!formData.father_name || formData.father_name.trim() === '') {
        toast({
          title: "Validation Error", 
          description: "Father's name is required.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (!formData.father_phone || formData.father_phone.trim() === '') {
        toast({
          title: "Validation Error", 
          description: "Father's phone number is required.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (!formData.father_occupation || formData.father_occupation.trim() === '') {
        toast({
          title: "Validation Error", 
          description: "Father's occupation is required.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (!formData.father_address || formData.father_address.trim() === '') {
        toast({
          title: "Validation Error", 
          description: "Father's address is required.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (!formData.mother_name || formData.mother_name.trim() === '') {
        toast({
          title: "Validation Error",
          description: "Mother's name is required.", 
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (!formData.mother_phone || formData.mother_phone.trim() === '') {
        toast({
          title: "Validation Error", 
          description: "Mother's phone number is required.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (!formData.mother_occupation || formData.mother_occupation.trim() === '') {
        toast({
          title: "Validation Error", 
          description: "Mother's occupation is required.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (!formData.mother_address || formData.mother_address.trim() === '') {
        toast({
          title: "Validation Error", 
          description: "Mother's address is required.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (!verificationToken) {
        toast({
          title: "Validation Error",
          description: "Email verification is required. Please verify your email.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Validate Aadhar numbers if provided (must be exactly 12 digits)
      const aadharFields = [
        { field: 'father_aadhar', label: "Father's Aadhar" },
        { field: 'mother_aadhar', label: "Mother's Aadhar" },
        { field: 'guardian_aadhar', label: "Guardian's Aadhar" }
      ];
      
      for (const { field, label } of aadharFields) {
        const aadharValue = (formData as any)[field];
        if (aadharValue && aadharValue.trim() !== '') {
          const cleanAadhar = aadharValue.replace(/[^\d]/g, '');
          if (cleanAadhar.length !== 12) {
            toast({
              title: "Validation Error",
              description: `${label} number must be exactly 12 digits`,
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Prepare the application data - only include non-empty fields
      const applicationData: any = {
        applicant_name: formData.applicant_name,
        date_of_birth: formData.date_of_birth,
        email: formData.email,
        phone_number: formData.phone_number,
        address: formData.address,
        category: formData.category,
        course_applied: formData.course_applied,
        email_verification_token: verificationToken,
      };

      // Add school preferences only if selected
      if (formData.first_preference_school !== "") {
        applicationData.first_preference_school = Number(formData.first_preference_school);
      }
      if (formData.second_preference_school !== "") {
        applicationData.second_preference_school = Number(formData.second_preference_school);
      }
      if (formData.third_preference_school !== "") {
        applicationData.third_preference_school = Number(formData.third_preference_school);
      }

      // Add optional fields only if provided
      if (formData.previous_school) {
        applicationData.previous_school = formData.previous_school;
      }
      if (formData.last_percentage !== "") {
        applicationData.last_percentage = Number(formData.last_percentage);
      }

      // Father information (required)
      applicationData.father_name = formData.father_name;
      applicationData.father_phone = formData.father_phone;
      applicationData.father_occupation = formData.father_occupation;
      applicationData.father_address = formData.father_address;
      
      // Optional father fields
      if (formData.father_email) applicationData.father_email = formData.father_email;
      if (formData.father_aadhar) applicationData.father_aadhar_number = formData.father_aadhar.replace(/[^\d]/g, '');
      if (formData.father_qualification) applicationData.father_qualification = formData.father_qualification;
      if (formData.father_company) applicationData.father_company_name = formData.father_company;
      if (formData.father_annual_income !== "") applicationData.father_annual_income = Number(formData.father_annual_income);
      if (formData.father_emergency_contact) applicationData.father_emergency_contact = formData.father_emergency_contact;

      // Mother information (required)
      applicationData.mother_name = formData.mother_name;
      applicationData.mother_phone = formData.mother_phone;
      applicationData.mother_occupation = formData.mother_occupation;
      applicationData.mother_address = formData.mother_address;
      
      // Optional mother fields
      if (formData.mother_email) applicationData.mother_email = formData.mother_email;
      if (formData.mother_aadhar) applicationData.mother_aadhar_number = formData.mother_aadhar.replace(/[^\d]/g, '');
      if (formData.mother_qualification) applicationData.mother_qualification = formData.mother_qualification;
      if (formData.mother_company) applicationData.mother_company_name = formData.mother_company;
      if (formData.mother_annual_income !== "") applicationData.mother_annual_income = Number(formData.mother_annual_income);
      if (formData.mother_emergency_contact) applicationData.mother_emergency_contact = formData.mother_emergency_contact;

      // Guardian information (only if provided)
      if (formData.guardian_name || formData.guardian_phone || formData.guardian_relationship || formData.guardian_occupation) {
        applicationData.guardian_name = formData.guardian_name;
        applicationData.guardian_phone = formData.guardian_phone;
        applicationData.guardian_relationship = formData.guardian_relationship;
        applicationData.guardian_occupation = formData.guardian_occupation;
        
        // Optional guardian fields
        if (formData.guardian_email) applicationData.guardian_email = formData.guardian_email;
        if (formData.guardian_address) applicationData.guardian_address = formData.guardian_address;
        if (formData.guardian_aadhar) applicationData.guardian_aadhar_number = formData.guardian_aadhar.replace(/[^\d]/g, '');
        if (formData.guardian_qualification) applicationData.guardian_qualification = formData.guardian_qualification;
        if (formData.guardian_company) applicationData.guardian_company_name = formData.guardian_company;
        if (formData.guardian_annual_income !== "") applicationData.guardian_annual_income = Number(formData.guardian_annual_income);
        if (formData.guardian_emergency_contact) applicationData.guardian_emergency_contact = formData.guardian_emergency_contact;
      }

      // Primary contact and family information
      if (formData.primary_contact) applicationData.primary_contact = formData.primary_contact;
      if (formData.family_type) applicationData.family_type = formData.family_type;
      if (formData.total_family_members !== "") applicationData.total_family_members = Number(formData.total_family_members);
      if (formData.number_of_children !== "") applicationData.number_of_children = Number(formData.number_of_children);
      if (formData.emergency_contact_name) applicationData.emergency_contact_name = formData.emergency_contact_name;
      if (formData.emergency_contact_phone) applicationData.emergency_contact_phone = formData.emergency_contact_phone;
      if (formData.emergency_contact_relationship) applicationData.emergency_contact_relationship = formData.emergency_contact_relationship;

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
      console.error('Error response data:', error?.response?.data);
      console.error('Error response status:', error?.response?.status);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      // Extract more detailed error message from Django validation errors
      let errorMessage = "An error occurred while submitting your application.";
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        
        // Handle new structured error format from backend
        if (errorData.message && errorData.errors) {
          const fieldErrors: string[] = [];
          
          for (const [field, errorMsg] of Object.entries(errorData.errors)) {
            fieldErrors.push(`${field}: ${errorMsg}`);
          }
          
          if (fieldErrors.length > 0) {
            errorMessage = `${errorData.message}\n\n${fieldErrors.join('\n')}`;
          } else {
            errorMessage = errorData.message;
          }
        }
        // Handle old field-specific validation errors format
        else if (typeof errorData === 'object' && !errorData.message) {
          const fieldErrors: string[] = [];
          
          for (const [field, errors] of Object.entries(errorData)) {
            if (Array.isArray(errors)) {
              const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              fieldErrors.push(`${fieldName}: ${errors.join(', ')}`);
            }
          }
          
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join('\n');
          }
        } 
        // Handle single message errors
        else if (errorData.message) {
          errorMessage = errorData.message;
        } else {
          // Fallback to extractErrorMessage function
          errorMessage = extractErrorMessage(error);
        }
      }
      
      toast({
        title: "Submission Failed",
        description: errorMessage,
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
                      
                      // Enhanced Parent/Guardian Information
                      father_name: "",
                      father_phone: "",
                      father_email: "",
                      father_occupation: "",
                      father_address: "",
                      father_aadhar: "",
                      father_qualification: "",
                      father_company: "",
                      father_annual_income: "",
                      father_emergency_contact: "",
                      
                      mother_name: "",
                      mother_phone: "",
                      mother_email: "",
                      mother_occupation: "",
                      mother_address: "",
                      mother_aadhar: "",
                      mother_qualification: "",
                      mother_company: "",
                      mother_annual_income: "",
                      mother_emergency_contact: "",
                      
                      guardian_name: "",
                      guardian_phone: "",
                      guardian_email: "",
                      guardian_relationship: "",
                      guardian_address: "",
                      guardian_occupation: "",
                      guardian_aadhar: "",
                      guardian_qualification: "",
                      guardian_company: "",
                      guardian_annual_income: "",
                      guardian_emergency_contact: "",
                      
                      // Primary contact and family information
                      primary_contact: "",
                      family_type: "",
                      total_family_members: "",
                      number_of_children: "",
                      emergency_contact_name: "",
                      emergency_contact_phone: "",
                      emergency_contact_relationship: "",
                      
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
              <div className="grid grid-cols-6 gap-2 mb-2">
                {[1,2,3,4,5,6].map((s) => (
                  <div key={s} className={`h-2 rounded-full ${step >= s ? 'bg-gradient-primary' : 'bg-muted'}`}></div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Details</span>
                <span>Documents</span>
                <span>Parents</span>
                <span>Guardian</span>
                <span>Additional</span>
                <span>Submit</span>
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
                      disabled={isProcessingDocuments}
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
                              disabled={isProcessingDocuments}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Processing Features Info */}
                  {formData.documents.length > 0 && !documentsProcessed && (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800 mb-1">AI-Powered Auto-Fill Available</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            Our AI can extract information from your documents and automatically fill the form for you!
                          </p>
                          <ul className="text-xs text-gray-500 space-y-1">
                            <li>• Extracts personal and family information</li>
                            <li>• Recognizes dates, addresses, and contact details</li>
                            <li>• Saves time and reduces errors</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Processing Overlay */}
                  {isProcessingDocuments && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
                        <div className="text-center space-y-6">
                          <div className="flex justify-center">
                            <div className="relative">
                              {/* Animated AI Brain Icon */}
                              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
                                <FileText className="w-8 h-8 text-white" />
                              </div>
                              {/* Floating particles effect */}
                              <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                              <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-purple-400 rounded-full animate-bounce delay-300"></div>
                              <div className="absolute top-0 -left-4 w-2 h-2 bg-green-400 rounded-full animate-bounce delay-500"></div>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">AI Processing Documents</h3>
                            <p className="text-gray-600 text-sm mb-4">
                              {processingStep || "Initializing AI extraction..."}
                            </p>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out relative ${
                                  processingProgress === 0 ? 'w-0' :
                                  processingProgress <= 20 ? 'w-1/5' :
                                  processingProgress <= 40 ? 'w-2/5' :
                                  processingProgress <= 70 ? 'w-3/5' :
                                  processingProgress < 100 ? 'w-4/5' : 'w-full'
                                }`}
                              >
                                {/* Animated shine effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500">{processingProgress}% Complete</p>
                          </div>

                          {/* Processing Steps */}
                          <div className="space-y-2 text-left">
                            <div className={`flex items-center space-x-2 text-sm ${processingProgress >= 20 ? 'text-green-600' : 'text-gray-400'}`}>
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${processingProgress >= 20 ? 'bg-green-100' : 'bg-gray-100'}`}>
                                {processingProgress >= 20 ? (
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                ) : (
                                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                )}
                              </div>
                              <span>Preparing documents</span>
                            </div>
                            <div className={`flex items-center space-x-2 text-sm ${processingProgress >= 40 ? 'text-green-600' : 'text-gray-400'}`}>
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${processingProgress >= 40 ? 'bg-green-100' : 'bg-gray-100'}`}>
                                {processingProgress >= 40 ? (
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                ) : processingProgress >= 20 ? (
                                  <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                                ) : (
                                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                )}
                              </div>
                              <span>Extracting text content</span>
                            </div>
                            <div className={`flex items-center space-x-2 text-sm ${processingProgress >= 70 ? 'text-green-600' : 'text-gray-400'}`}>
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${processingProgress >= 70 ? 'bg-green-100' : 'bg-gray-100'}`}>
                                {processingProgress >= 70 ? (
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                ) : processingProgress >= 40 ? (
                                  <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                                ) : (
                                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                )}
                              </div>
                              <span>AI analysis & extraction</span>
                            </div>
                            <div className={`flex items-center space-x-2 text-sm ${processingProgress >= 100 ? 'text-green-600' : 'text-gray-400'}`}>
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${processingProgress >= 100 ? 'bg-green-100' : 'bg-gray-100'}`}>
                                {processingProgress >= 100 ? (
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                ) : processingProgress >= 70 ? (
                                  <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                                ) : (
                                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                )}
                              </div>
                              <span>Auto-filling form</span>
                            </div>
                          </div>

                          <p className="text-xs text-gray-500 mt-4">
                            This may take 10-30 seconds depending on document complexity
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 max-h-[75vh] overflow-y-auto">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Step 3: Parent Information (Required)</h3>
                  
                  {/* Father Information */}
                  <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                    <h4 className="text-lg font-medium text-gray-800">Father's Information *</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="father_name" className="text-gray-700">Father's Name *</Label>
                        <Input 
                          id="father_name" 
                          placeholder="Enter father's full name" 
                          value={formData.father_name} 
                          onChange={(e) => handleInputChange('father_name', e.target.value)} 
                          className="border-gray-300 focus:border-primary focus:ring-primary"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="father_phone" className="text-gray-700">Father's Phone *</Label>
                        <Input 
                          id="father_phone" 
                          placeholder="Enter phone number (max 15 digits)" 
                          value={formData.father_phone} 
                          onChange={(e) => handleInputChange('father_phone', e.target.value)} 
                          className="border-gray-300 focus:border-primary focus:ring-primary"
                          maxLength={15}
                          pattern="[0-9]*"
                          inputMode="numeric"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="father_email" className="text-gray-700">Father's Email *</Label>
                        <Input 
                          id="father_email" 
                          type="email"
                          placeholder="Enter father's email address" 
                          value={formData.father_email} 
                          onChange={(e) => handleInputChange('father_email', e.target.value)} 
                          className="border-gray-300 focus:border-primary focus:ring-primary"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="father_occupation" className="text-gray-700">Father's Occupation *</Label>
                        <Input 
                          id="father_occupation" 
                          placeholder="Enter father's occupation" 
                          value={formData.father_occupation} 
                          onChange={(e) => handleInputChange('father_occupation', e.target.value)} 
                          className="border-gray-300 focus:border-primary focus:ring-primary"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="father_address" className="text-gray-700">Father's Address</Label>
                        <Input 
                          id="father_address" 
                          placeholder="Enter father's address" 
                          value={formData.father_address} 
                          onChange={(e) => handleInputChange('father_address', e.target.value)} 
                          className="border-gray-300 focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="father_aadhar" className="text-gray-700">Father's Aadhar Number</Label>
                        <Input 
                          id="father_aadhar" 
                          placeholder="Enter 12-digit Aadhar number" 
                          value={formData.father_aadhar} 
                          onChange={(e) => handleInputChange('father_aadhar', e.target.value)} 
                          className="border-gray-300 focus:border-primary focus:ring-primary"
                          maxLength={12}
                          pattern="[0-9]*"
                          inputMode="numeric"
                        />
                        <p className="text-xs text-gray-500">Enter exactly 12 digits</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="father_qualification" className="text-gray-700">Father's Qualification</Label>
                        <Input 
                          id="father_qualification" 
                          placeholder="Enter father's educational qualification" 
                          value={formData.father_qualification} 
                          onChange={(e) => handleInputChange('father_qualification', e.target.value)} 
                          className="border-gray-300 focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="father_company" className="text-gray-700">Father's Company</Label>
                        <Input 
                          id="father_company" 
                          placeholder="Enter father's company/organization" 
                          value={formData.father_company} 
                          onChange={(e) => handleInputChange('father_company', e.target.value)} 
                          className="border-gray-300 focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="father_annual_income" className="text-gray-700">Father's Annual Income</Label>
                        <Input 
                          id="father_annual_income" 
                          type="number"
                          placeholder="Enter father's annual income" 
                          value={formData.father_annual_income} 
                          onChange={(e) => handleInputChange('father_annual_income', e.target.value ? parseFloat(e.target.value) : "")} 
                          className="border-gray-300 focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="father_emergency_contact" className="text-gray-700">Father's Emergency Contact</Label>
                        <Input 
                          id="father_emergency_contact" 
                          placeholder="Enter father's emergency contact number" 
                          value={formData.father_emergency_contact} 
                          onChange={(e) => handleInputChange('father_emergency_contact', e.target.value)} 
                          className="border-gray-300 focus:border-primary focus:ring-primary"
                        />
                      </div>
                    </div>

                    {/* Mother Information */}
                    <div className="pt-6 border-t">
                      <h4 className="text-lg font-medium text-gray-800 mb-4">Mother's Information *</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="mother_name" className="text-gray-700">Mother's Name *</Label>
                          <Input 
                            id="mother_name" 
                            placeholder="Enter mother's full name" 
                            value={formData.mother_name} 
                            onChange={(e) => handleInputChange('mother_name', e.target.value)} 
                            className="border-gray-300 focus:border-primary focus:ring-primary"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mother_phone" className="text-gray-700">Mother's Phone *</Label>
                          <Input 
                            id="mother_phone" 
                            placeholder="Enter mother's phone number" 
                            value={formData.mother_phone} 
                            onChange={(e) => handleInputChange('mother_phone', e.target.value)} 
                            className="border-gray-300 focus:border-primary focus:ring-primary"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mother_email" className="text-gray-700">Mother's Email *</Label>
                          <Input 
                            id="mother_email" 
                            type="email"
                            placeholder="Enter mother's email address" 
                            value={formData.mother_email} 
                            onChange={(e) => handleInputChange('mother_email', e.target.value)} 
                            className="border-gray-300 focus:border-primary focus:ring-primary"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mother_occupation" className="text-gray-700">Mother's Occupation *</Label>
                          <Input 
                            id="mother_occupation" 
                            placeholder="Enter mother's occupation" 
                            value={formData.mother_occupation} 
                            onChange={(e) => handleInputChange('mother_occupation', e.target.value)} 
                            className="border-gray-300 focus:border-primary focus:ring-primary"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mother_address" className="text-gray-700">Mother's Address</Label>
                          <Input 
                            id="mother_address" 
                            placeholder="Enter mother's address" 
                            value={formData.mother_address} 
                            onChange={(e) => handleInputChange('mother_address', e.target.value)} 
                            className="border-gray-300 focus:border-primary focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mother_aadhar" className="text-gray-700">Mother's Aadhar Number</Label>
                          <Input 
                            id="mother_aadhar" 
                            placeholder="Enter 12-digit Aadhar number" 
                            value={formData.mother_aadhar} 
                            onChange={(e) => handleInputChange('mother_aadhar', e.target.value)} 
                            className="border-gray-300 focus:border-primary focus:ring-primary"
                            maxLength={12}
                            pattern="[0-9]*"
                            inputMode="numeric"
                          />
                          <p className="text-xs text-gray-500">Enter exactly 12 digits</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mother_qualification" className="text-gray-700">Mother's Qualification</Label>
                          <Input 
                            id="mother_qualification" 
                            placeholder="Enter mother's educational qualification" 
                            value={formData.mother_qualification} 
                            onChange={(e) => handleInputChange('mother_qualification', e.target.value)} 
                            className="border-gray-300 focus:border-primary focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mother_company" className="text-gray-700">Mother's Company</Label>
                          <Input 
                            id="mother_company" 
                            placeholder="Enter mother's company/organization" 
                            value={formData.mother_company} 
                            onChange={(e) => handleInputChange('mother_company', e.target.value)} 
                            className="border-gray-300 focus:border-primary focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mother_annual_income" className="text-gray-700">Mother's Annual Income</Label>
                          <Input 
                            id="mother_annual_income" 
                            type="number"
                            placeholder="Enter mother's annual income" 
                            value={formData.mother_annual_income} 
                            onChange={(e) => handleInputChange('mother_annual_income', e.target.value ? parseFloat(e.target.value) : "")} 
                            className="border-gray-300 focus:border-primary focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mother_emergency_contact" className="text-gray-700">Mother's Emergency Contact</Label>
                          <Input 
                            id="mother_emergency_contact" 
                            placeholder="Enter mother's emergency contact number" 
                            value={formData.mother_emergency_contact} 
                            onChange={(e) => handleInputChange('mother_emergency_contact', e.target.value)} 
                            className="border-gray-300 focus:border-primary focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Primary Contact Selection */}
                    <div className="pt-6 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="primary_contact" className="text-gray-700">Primary Contact for School Communications *</Label>
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

                    {/* Family Information */}
                    <div className="pt-6 border-t">
                      <h4 className="text-lg font-medium text-gray-800 mb-4">Family Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="family_type" className="text-gray-700">Family Type</Label>
                          <Select 
                            value={formData.family_type} 
                            onValueChange={(value) => handleInputChange('family_type', value)}
                          >
                            <SelectTrigger className="border-gray-300 focus:border-primary focus:ring-primary">
                              <SelectValue placeholder="Select family type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="nuclear">Nuclear Family</SelectItem>
                              <SelectItem value="joint">Joint Family</SelectItem>
                              <SelectItem value="single_parent">Single Parent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="total_family_members" className="text-gray-700">Total Family Members</Label>
                          <Input 
                            id="total_family_members" 
                            type="number"
                            min="1"
                            placeholder="Enter total family members" 
                            value={formData.total_family_members} 
                            onChange={(e) => handleInputChange('total_family_members', e.target.value)} 
                            className="border-gray-300 focus:border-primary focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="number_of_children" className="text-gray-700">Number of Children</Label>
                          <Input 
                            id="number_of_children" 
                            type="number"
                            min="1"
                            placeholder="Enter number of children" 
                            value={formData.number_of_children} 
                            onChange={(e) => handleInputChange('number_of_children', e.target.value)} 
                            className="border-gray-300 focus:border-primary focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg border">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> Father's and Mother's information marked with (*) are mandatory. 
                      Please ensure all required fields are completed accurately.
                    </p>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4 max-h-[75vh] overflow-y-auto">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Step 4: Guardian Information (Optional)</h3>
                  
                  <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                    <h4 className="text-lg font-medium text-gray-800">Guardian Information (if different from parents)</h4>
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
                      <div className="space-y-2">
                        <Label htmlFor="guardian_occupation" className="text-gray-700">Guardian's Occupation</Label>
                        <Input 
                          id="guardian_occupation" 
                          placeholder="Enter guardian's occupation" 
                          value={formData.guardian_occupation} 
                          onChange={(e) => handleInputChange('guardian_occupation', e.target.value)} 
                          className="border-gray-300 focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guardian_address" className="text-gray-700">Guardian's Address</Label>
                        <Input 
                          id="guardian_address" 
                          placeholder="Enter guardian's address" 
                          value={formData.guardian_address} 
                          onChange={(e) => handleInputChange('guardian_address', e.target.value)} 
                          className="border-gray-300 focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guardian_aadhar" className="text-gray-700">Guardian's Aadhar Number</Label>
                        <Input 
                          id="guardian_aadhar" 
                          placeholder="Enter 12-digit Aadhar number" 
                          value={formData.guardian_aadhar} 
                          onChange={(e) => handleInputChange('guardian_aadhar', e.target.value)} 
                          className="border-gray-300 focus:border-primary focus:ring-primary"
                          maxLength={12}
                          pattern="[0-9]*"
                          inputMode="numeric"
                        />
                        <p className="text-xs text-gray-500">Enter exactly 12 digits</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guardian_qualification" className="text-gray-700">Guardian's Qualification</Label>
                        <Input 
                          id="guardian_qualification" 
                          placeholder="Enter guardian's educational qualification" 
                          value={formData.guardian_qualification} 
                          onChange={(e) => handleInputChange('guardian_qualification', e.target.value)} 
                          className="border-gray-300 focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guardian_company" className="text-gray-700">Guardian's Company</Label>
                        <Input 
                          id="guardian_company" 
                          placeholder="Enter guardian's company/organization" 
                          value={formData.guardian_company} 
                          onChange={(e) => handleInputChange('guardian_company', e.target.value)} 
                          className="border-gray-300 focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guardian_annual_income" className="text-gray-700">Guardian's Annual Income</Label>
                        <Input 
                          id="guardian_annual_income" 
                          type="number"
                          placeholder="Enter guardian's annual income" 
                          value={formData.guardian_annual_income} 
                          onChange={(e) => handleInputChange('guardian_annual_income', e.target.value ? parseFloat(e.target.value) : "")} 
                          className="border-gray-300 focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guardian_emergency_contact" className="text-gray-700">Guardian's Emergency Contact</Label>
                        <Input 
                          id="guardian_emergency_contact" 
                          placeholder="Enter guardian's emergency contact number" 
                          value={formData.guardian_emergency_contact} 
                          onChange={(e) => handleInputChange('guardian_emergency_contact', e.target.value)} 
                          className="border-gray-300 focus:border-primary focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg border">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> Guardian information is optional and should be filled only if the guardian is different from the parents. 
                      You can skip this step if not applicable.
                    </p>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4 max-h-[75vh] overflow-y-auto">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Step 5: Additional Information</h3>
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
                  
                  {/* Family Information */}
                  <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                    <h4 className="text-lg font-medium text-gray-800">Family Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_name" className="text-gray-700">Emergency Contact Name</Label>
                        <Input 
                          id="emergency_contact_name" 
                          placeholder="Enter emergency contact person's name" 
                          value={formData.emergency_contact_name} 
                          onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)} 
                          className="border-gray-300 focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_phone" className="text-gray-700">Emergency Contact Phone</Label>
                        <Input 
                          id="emergency_contact_phone" 
                          placeholder="Enter emergency contact phone number" 
                          value={formData.emergency_contact_phone} 
                          onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)} 
                          className="border-gray-300 focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_relationship" className="text-gray-700">Emergency Contact Relationship</Label>
                        <Input 
                          id="emergency_contact_relationship" 
                          placeholder="Relationship to student" 
                          value={formData.emergency_contact_relationship} 
                          onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)} 
                          className="border-gray-300 focus:border-primary focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg border">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> Additional information helps us better understand your academic background and family situation. 
                      All fields in this step are optional.
                    </p>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-4 max-h-[75vh] overflow-y-auto">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Step 6: Review & Submit</h3>
                  
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

                  {/* Validation Status Display */}
                  {!validationStatus.isValid && validationStatus.missingFields.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-red-800 mb-2">
                            Please complete the following required fields:
                          </h4>
                          <ul className="text-sm text-red-700 space-y-1">
                            {validationStatus.missingFields.map((field, index) => (
                              <li key={index} className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0"></span>
                                <span>{field}</span>
                              </li>
                            ))}
                          </ul>
                          <p className="text-xs text-red-600 mt-2">
                            The submit button will be enabled once all required fields are completed.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Success Status Display */}
                  {validationStatus.isValid && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-800">
                            All required fields are complete! You can now submit your application.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
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
                {step < 6 ? (
                  step === 2 ? (
                    // Special button for document processing step
                    <Button 
                      type="button" 
                      onClick={handleProcessDocuments}
                      disabled={!isStepValid || isProcessingDocuments}
                      className={`text-white disabled:opacity-50 relative transition-all duration-300 ${
                        isProcessingDocuments 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse' 
                          : documentsProcessed 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' 
                            : 'bg-gradient-primary hover:opacity-90'
                      }`}
                    >
                      {isProcessingDocuments ? (
                        <div className="flex items-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span className="animate-pulse">AI Processing...</span>
                        </div>
                      ) : documentsProcessed ? (
                        <div className="flex items-center animate-bounce">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          <span>Ready to Continue</span>
                        </div>
                      ) : (
                        <div className="flex items-center group">
                          <div className="mr-2 w-4 h-4 relative">
                            <FileText className="w-4 h-4 transform group-hover:scale-110 transition-transform" />
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-ping"></div>
                          </div>
                          <span>Extract & Auto-fill</span>
                        </div>
                      )}
                    </Button>
                  ) : (
                    // Regular Next button for other steps with tooltip for missing fields
                    <div className="relative group">
                      <Button 
                        type="submit" 
                        disabled={!isStepValid}
                        className="bg-gradient-primary text-white disabled:opacity-50"
                      >
                        Next
                      </Button>
                      
                      {/* Tooltip showing missing fields when button is disabled */}
                      {!isStepValid && (
                        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                          <div className="bg-red-600 text-white text-xs rounded py-2 px-3 max-w-64">
                            <div className="font-medium mb-1">Required fields missing:</div>
                            <ul className="list-disc list-inside">
                              {getMissingFields().map((field, index) => (
                                <li key={index}>{field}</li>
                              ))}
                            </ul>
                            <div className="absolute top-full right-4 border-4 border-transparent border-t-red-600"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
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