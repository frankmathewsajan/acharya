import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Loader2, Search, CheckCircle, AlertCircle, Clock, FileText } from "lucide-react";
import { admissionService } from "@/lib/api/services";
import { AdmissionTrackingResponse, SchoolAdmissionDecision } from "@/lib/api/types";

export default function TrackingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [trackingId, setTrackingId] = useState("");
  const [trackingResult, setTrackingResult] = useState<AdmissionTrackingResponse | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [acceptedSchools, setAcceptedSchools] = useState<SchoolAdmissionDecision[]>([]);
  const [isSubmittingChoice, setIsSubmittingChoice] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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
        // Check for accepted schools
        const accepted = result.data.school_decisions?.filter(decision => 
          decision.decision === 'accepted'
        ) || [];
        setAcceptedSchools(accepted);

        // Update URL with reference ID
        setSearchParams({ ref: trackingId.trim() });

        toast({
          title: "Application Found",
          description: `Found application for ${result.data.applicant_name}`,
        });
      } else {
        toast({
          title: "Not Found",
          description: "No application found with this reference ID",
          variant: "destructive",
        });
        setTrackingResult(null);
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
          title: "School Selected",
          description: `You have successfully selected ${chosenSchool}. Proceeding to fee payment...`,
        });
        
        // Refresh tracking data
        await handleTrackApplication();
        
        // Proceed to fee payment after a short delay
        setTimeout(() => {
          handleProceedToPayment(acceptedSchools.find(school => 
            getSchoolName(school.school, school.school_name) === chosenSchool
          ));
        }, 1500);
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

  const handleProceedToPayment = async (selectedSchool?: SchoolAdmissionDecision) => {
    if (!trackingResult?.data?.reference_id) return;
    
    try {
      const result = await admissionService.initializeFeePayment({
        reference_id: trackingResult.data.reference_id,
        school_decision_id: selectedSchool?.id
      });
      
      if (result.success) {
        setPaymentInfo(result.data);
        setShowPaymentModal(true);
        
        toast({
          title: "Payment Information Ready",
          description: `Fee details loaded for ${result.data.school_name}`,
        });
      } else {
        throw new Error(result.message || 'Failed to initialize payment');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
      
      console.error('Payment initialization error:', error);
    }
  };

  const handleAcceptAndProceed = async (selectedSchool: SchoolAdmissionDecision) => {
    if (!trackingResult?.data?.reference_id) return;
    
    try {
      // First calculate the fee for this student
      const feeResult = await admissionService.calculateFee({
        reference_id: trackingResult.data.reference_id
      });
      
      if (feeResult.success) {
        // Set payment info with fee calculation
        setPaymentInfo({
          ...feeResult.data,
          school_name: getSchoolName(selectedSchool.school, selectedSchool.school_name),
          selected_school: selectedSchool
        });
        setShowPaymentModal(true);
        
        toast({
          title: "Ready for Payment",
          description: `Fee calculated for ${getSchoolName(selectedSchool.school, selectedSchool.school_name)}`,
        });
      } else {
        throw new Error(feeResult.message || 'Failed to calculate fee');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to calculate fee. Please try again.",
        variant: "destructive",
      });
      
      console.error('Fee calculation error:', error);
    }
  };

  const handleWithdrawEnrollment = async (schoolDecision: SchoolAdmissionDecision) => {
    if (!schoolDecision.id) return;
    
    // Check if payment is finalized (non-refundable)
    if (schoolDecision.is_payment_finalized) {
      toast({
        title: "Withdrawal Not Allowed",
        description: "Cannot withdraw after payment finalization. Enrollment is non-refundable.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const result = await admissionService.withdrawEnrollment({
        decision_id: schoolDecision.id,
        withdrawal_reason: 'Student requested withdrawal'
      });
      
      if (result.success) {
        toast({
          title: "Enrollment Withdrawn",
          description: `Successfully withdrawn from ${getSchoolName(schoolDecision.school, schoolDecision.school_name)}`,
        });
        
        // Refresh tracking data to show updated status
        await handleTrackApplication();
      } else {
        throw new Error(result.message || 'Failed to withdraw enrollment');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to withdraw enrollment. Please try again.",
        variant: "destructive",
      });
      
      console.error('Withdrawal error:', error);
    }
  };

  const handlePaymentMethod = async (method: string) => {
    if (!paymentInfo?.selected_school?.id) {
      toast({
        title: "Error",
        description: "No school selected for enrollment",
        variant: "destructive",
      });
      return;
    }

    try {
      if (method === 'free_enrollment') {
        // Enroll student directly for free enrollment
        const enrollResult = await admissionService.enrollStudent({
          decision_id: paymentInfo.selected_school.id,
          payment_reference: 'FREE_ENROLLMENT'
        });

        if (enrollResult.success) {
          toast({
            title: "Enrollment Confirmed!",
            description: "Your free enrollment has been confirmed. Check your email for details.",
          });
          
          // Refresh tracking data to show updated status
          await handleTrackApplication();
        } else {
          throw new Error(enrollResult.message || 'Failed to confirm enrollment');
        }
      } else {
        // For paid enrollments, simulate payment and then enroll
        toast({
          title: "Payment Gateway",
          description: `Redirecting to ${method} payment portal...`,
        });
        
        // Simulate payment success after 2 seconds
        setTimeout(async () => {
          try {
            const enrollResult = await admissionService.enrollStudent({
              decision_id: paymentInfo.selected_school.id,
              payment_reference: `PAYMENT_${method.toUpperCase()}_${Date.now()}`
            });

            if (enrollResult.success) {
              toast({
                title: "Payment Successful!",
                description: "Your enrollment has been confirmed. Check your email for details.",
              });
              
              // Refresh tracking data to show updated status
              await handleTrackApplication();
            } else {
              throw new Error(enrollResult.message || 'Failed to confirm enrollment');
            }
          } catch (error) {
            toast({
              title: "Enrollment Error",
              description: "Payment successful but enrollment failed. Please contact support.",
              variant: "destructive",
            });
          }
        }, 2000);
      }
      
      setShowPaymentModal(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process enrollment. Please try again.",
        variant: "destructive",
      });
      
      console.error('Enrollment error:', error);
    }
  };

  const getSchoolName = (school: any, schoolName?: string): string => {
    if (typeof school === 'string') return school;
    if (typeof school === 'object' && school?.school_name) return school.school_name;
    if (schoolName) return schoolName;
    return 'Unknown School';
  };

  const getStatusBadge = (decision: string) => {
    switch (decision) {
      case 'accepted':
        return <Badge className="bg-green-500 text-white text-xs px-2 py-0.5"><CheckCircle className="w-2 h-2 mr-1" />ACCEPTED</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="text-xs px-2 py-0.5"><AlertCircle className="w-2 h-2 mr-1" />REJECTED</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs px-2 py-0.5"><Clock className="w-2 h-2 mr-1" />PENDING</Badge>;
    }
  };

  const getOverallStatus = () => {
    if (!trackingResult?.data?.school_decisions) return "PENDING";
    
    const decisions = trackingResult.data.school_decisions;
    const hasEnrolled = decisions.some(d => d.enrollment_status === 'enrolled');
    const hasAccepted = decisions.some(d => d.decision === 'accepted');
    const allDecided = decisions.every(d => d.decision && d.decision !== 'pending');
    
    if (hasEnrolled) return "ENROLLED";
    if (hasAccepted) return "ACCEPTED";
    if (allDecided) return "REJECTED";
    return "PENDING";
  };

  const hasEnrollment = () => {
    return trackingResult?.data?.school_decisions?.some(d => 
      d.enrollment_status === 'enrolled'
    ) || false;
  };

  const getEnrolledSchoolName = () => {
    const enrolledDecision = trackingResult?.data?.school_decisions?.find(d => 
      d.enrollment_status === 'enrolled'
    );
    return enrolledDecision ? getSchoolName(enrolledDecision.school, enrolledDecision.school_name) : '';
  };

  // Handle URL parameter on page load
  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam && refParam !== trackingId) {
      setTrackingId(refParam);
      // Auto-track if we have a reference ID in URL
      setTimeout(() => {
        const trackRef = refParam;
        setIsTracking(true);
        admissionService.trackApplication(trackRef.trim())
          .then(result => {
            setTrackingResult(result);
            if (result.success && result.data) {
              const accepted = result.data.school_decisions?.filter(decision => 
                decision.decision === 'accepted'
              ) || [];
              setAcceptedSchools(accepted);
            }
          })
          .catch(() => {
            setTrackingResult(null);
          })
          .finally(() => {
            setIsTracking(false);
          });
      }, 100);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Conditional Header - Large initially, compact after search */}
        {!trackingResult ? (
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white mb-2">Track Your Application</h1>
            <p className="text-white/80">Enter your reference ID to check your application status</p>
          </div>
        ) : (
          <div className="text-center mb-3">
            <h1 className="text-2xl font-bold text-white mb-1">Application Tracking</h1>
          </div>
        )}

        {/* Compact Search Form */}
        <Card className="mb-4 shadow-2xl border-0">
          <CardHeader className="bg-gradient-primary text-white py-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="w-4 h-4" />
              {!trackingResult ? 'Application Tracking' : 'Track Another Application'}
            </CardTitle>
            {!trackingResult && (
              <CardDescription className="text-white/90 text-xs">
                Enter your application reference ID (e.g., ADM-2025-QFYS29)
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Input
                placeholder="Reference ID"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTrackApplication()}
                className="flex-1"
              />
              <Button 
                onClick={handleTrackApplication}
                disabled={isTracking}
                className="min-w-[100px] bg-gradient-primary hover:opacity-90 text-sm px-4 py-2"
              >
                {isTracking ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Tracking...
                  </>
                ) : (
                  <>
                    <Search className="mr-1 h-3 w-3" />
                    {!trackingResult ? 'Track' : 'Track New'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tracking Results - Ultra Compact Single Card */}
        {trackingResult?.success && trackingResult.data && (
          <Card className="shadow-lg border-0 max-w-7xl mx-auto">
            <CardHeader className="bg-gradient-primary text-white py-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">Application Status</CardTitle>
                  <CardDescription className="text-white/90 text-xs">
                    {trackingResult.data.reference_id}
                  </CardDescription>
                </div>
                <Badge className={`${getOverallStatus() === 'ACCEPTED' ? 'bg-green-500' : getOverallStatus() === 'REJECTED' ? 'bg-red-500' : 'bg-yellow-500'} text-white px-2 py-1 text-xs`}>
                  {getOverallStatus()}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="p-4">
              {/* Student Info - Ultra Compact Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4 p-3 bg-gray-50 rounded-md">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Name</label>
                  <p className="text-sm font-semibold truncate">{trackingResult.data.applicant_name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Course</label>
                  <p className="text-sm font-semibold truncate">{trackingResult.data.course_applied}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Category</label>
                  <p className="text-sm font-semibold">{trackingResult.data.category?.toUpperCase() || 'General'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Applied</label>
                  <p className="text-sm font-semibold">{new Date(trackingResult.data.application_date).toLocaleDateString()}</p>
                </div>
              </div>

              {/* School Decisions - Compact List */}
              <div className="space-y-3">
                <h3 className="font-semibold text-base">School Decisions</h3>
                <div className="space-y-2">
                  {trackingResult.data.school_decisions?.map((decision, index) => {
                    const isEnrolled = decision.enrollment_status === 'enrolled';
                    const isWithdrawn = decision.enrollment_status === 'withdrawn';
                    const canEnroll = decision.can_enroll;
                    const canWithdraw = decision.can_withdraw;
                    const hasAnyEnrollment = trackingResult.data.school_decisions?.some(d => d.enrollment_status === 'enrolled');
                    
                    // Override canEnroll if student has any active enrollment elsewhere
                    // Also ensure decision is accepted before allowing enrollment
                    const finalCanEnroll = canEnroll && !hasAnyEnrollment && decision.decision === 'accepted';
                    
                    return (
                      <div key={index} className={`p-3 border rounded-md ${
                        isEnrolled ? 'border-green-500 bg-green-50' : 
                        isWithdrawn ? 'border-gray-300 bg-gray-50' : 
                        'border-gray-200'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm truncate">{getSchoolName(decision.school, decision.school_name)}</h4>
                              <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded shrink-0">{decision.preference_order} pref</span>
                              {getStatusBadge(decision.decision || 'pending')}
                            </div>
                            <div className="flex items-center gap-4">
                              {decision.decision_date && (
                                <p className="text-xs text-gray-500">
                                  Reviewed: {new Date(decision.decision_date).toLocaleDateString()}
                                </p>
                              )}
                              {isEnrolled && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                  <span className="text-xs font-medium text-green-700">ENROLLED</span>
                                  <span className="text-xs text-gray-500">
                                    ({new Date(decision.enrollment_date || '').toLocaleDateString()})
                                  </span>
                                  {/* Payment finalization status */}
                                  {decision.is_payment_finalized && (
                                    <div className="flex items-center gap-1 ml-2 px-2 py-1 bg-blue-50 border border-blue-200 rounded">
                                      <span className="text-xs font-medium text-blue-700">PAYMENT FINALIZED</span>
                                      <span className="text-xs text-blue-600">• NON-REFUNDABLE</span>
                                    </div>
                                  )}
                                  {/* User ID status */}
                                  {decision.user_id_allocated && (
                                    <div className="flex items-center gap-1 ml-2 px-2 py-1 bg-green-50 border border-green-200 rounded">
                                      <span className="text-xs font-medium text-green-700">USER ID ALLOCATED</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              {isWithdrawn && (
                                <div className="flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-gray-600" />
                                  <span className="text-xs font-medium text-gray-700">WITHDRAWN</span>
                                  <span className="text-xs text-gray-500">
                                    ({new Date(decision.withdrawal_date || '').toLocaleDateString()})
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Enroll Button - Only allow if no active enrollment anywhere */}
                            {finalCanEnroll && (
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs px-3 py-1 h-8"
                                onClick={() => handleAcceptAndProceed(decision)}
                              >
                                Accept & Proceed
                              </Button>
                            )}
                            
                            {/* Withdraw Button - Disabled if payment is finalized */}
                            {canWithdraw && !decision.is_payment_finalized && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-300 hover:bg-red-50 text-xs px-3 py-1 h-8"
                                onClick={() => handleWithdrawEnrollment(decision)}
                              >
                                Withdraw
                              </Button>
                            )}
                            
                            {/* Payment finalized - withdrawal not allowed */}
                            {canWithdraw && decision.is_payment_finalized && (
                              <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 border border-gray-300 rounded">
                                Non-refundable
                              </span>
                            )}
                            
                            {/* Status Messages */}
                            {!finalCanEnroll && !canWithdraw && decision.decision === 'accepted' && !isEnrolled && !isWithdrawn && (
                              <span className="text-xs text-amber-600 px-2 py-1 bg-amber-50 border border-amber-200 rounded">
                                {hasAnyEnrollment ? 'Already enrolled elsewhere' : 'Cannot enroll'}
                              </span>
                            )}
                            
                            {!finalCanEnroll && !canWithdraw && decision.decision === 'pending' && (
                              <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                                Pending Review
                              </span>
                            )}
                            
                            {!finalCanEnroll && !canWithdraw && decision.decision === 'rejected' && (
                              <span className="text-xs text-red-600 px-2 py-1 bg-red-50 border border-red-200 rounded">
                                Rejected
                              </span>
                            )}
                            
                            {isWithdrawn && !finalCanEnroll && (
                              <span className="text-xs text-blue-600 px-2 py-1 bg-blue-50 border border-blue-200 rounded">
                                Withdrawn - Can Re-enroll
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Alerts - Compact */}
              {hasEnrollment() && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-green-800 text-sm">Enrollment Confirmed!</h4>
                      <p className="text-xs text-green-700">
                        You have active enrollments. Check email for instructions.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {acceptedSchools.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-blue-800 text-sm">
                        {acceptedSchools.length} Acceptance{acceptedSchools.length > 1 ? 's' : ''}!
                      </h4>
                      <p className="text-xs text-blue-700">
                        Click "Accept & Proceed" to enroll in any school that has accepted your application.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {trackingResult.data.review_comments && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h4 className="font-semibold text-yellow-800 text-sm mb-1">Comments</h4>
                  <p className="text-xs text-yellow-700">{trackingResult.data.review_comments}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* No Results - Compact */}
        {trackingResult && !trackingResult.success && (
          <Card className="shadow-xl border-0">
            <CardContent className="text-center py-8">
              <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-medium text-gray-900 mb-1">Application Not Found</h3>
              <p className="text-sm text-gray-600">
                No application found with reference ID: {trackingId}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Please check your reference ID and try again.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Compact Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Fee Payment Details
            </DialogTitle>
            <DialogDescription className="text-sm">
              Review your fee structure and proceed with payment
            </DialogDescription>
          </DialogHeader>
          
          {paymentInfo && (
            <div className="space-y-4">
              {/* School and Course Info - Compact */}
              <div className="p-3 bg-blue-50 rounded-md">
                <h4 className="font-medium text-blue-700 mb-2 text-sm">Enrollment Details</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-600">School:</span>
                    <p className="font-medium truncate">{paymentInfo.school_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Course:</span>
                    <p className="font-medium truncate">{paymentInfo.course_applied || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Reference:</span>
                    <p className="font-mono font-medium text-xs">{paymentInfo.reference_id}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Category:</span>
                    <p className="font-medium">{paymentInfo.category?.toUpperCase() || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Fee Breakdown - Compact */}
              <div className="p-3 border rounded-md">
                <h4 className="font-medium mb-3 text-sm">Fee Structure</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Class Range:</span>
                    <span className="font-medium">{paymentInfo.fee_structure?.class_range}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <span className="font-medium">{paymentInfo.fee_structure?.category?.replace('_', '/').toUpperCase()}</span>
                  </div>
                  {paymentInfo.fee_structure?.annual_fee_min !== paymentInfo.fee_structure?.annual_fee_max ? (
                    <div className="flex justify-between">
                      <span>Fee Range:</span>
                      <span>₹{paymentInfo.fee_structure?.annual_fee_min} - ₹{paymentInfo.fee_structure?.annual_fee_max}</span>
                    </div>
                  ) : null}
                  <hr />
                  <div className="flex justify-between font-bold">
                    <span>Annual Fee:</span>
                    <span className="text-green-600">₹{paymentInfo.fee_structure?.total_fee || 0}</span>
                  </div>
                  {paymentInfo.fee_structure?.total_fee === 0 && (
                    <div className="text-center p-2 bg-green-50 rounded-md">
                      <p className="text-green-700 font-medium text-sm">Free Education!</p>
                      <p className="text-xs text-green-600">No fee required for this class and category</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Methods - Compact */}
              {paymentInfo.fee_structure?.total_fee > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Select Payment Method</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      className="justify-start h-auto p-3 text-left"
                      onClick={() => handlePaymentMethod('online')}
                    >
                      <div>
                        <p className="font-medium text-sm">Online Payment</p>
                        <p className="text-xs text-gray-500">Pay securely using UPI, Net Banking, or Cards</p>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start h-auto p-3 text-left"
                      onClick={() => handlePaymentMethod('bank_transfer')}
                    >
                      <div>
                        <p className="font-medium text-sm">🏦 Bank Transfer</p>
                        <p className="text-xs text-gray-500">Transfer directly to school account</p>
                      </div>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Enrollment Confirmation</h4>
                  <Button
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    onClick={() => handlePaymentMethod('free_enrollment')}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirm Free Enrollment
                  </Button>
                </div>
              )}

              {/* Terms - Compact */}
              <div className="p-2 bg-gray-50 rounded-md text-xs text-gray-600">
                <p><strong>Note:</strong> {paymentInfo.fee_structure?.total_fee > 0 
                  ? 'Payment is required to confirm enrollment. You will receive confirmation and instructions via email.'
                  : 'Click "Confirm Free Enrollment" to complete your admission. You will receive confirmation via email.'
                }</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}