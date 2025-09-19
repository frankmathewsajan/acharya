from django.shortcuts import render

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from django.db.models import Q, Prefetch
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
import logging
from schools.models import School
from .models import AdmissionApplication, EmailVerification, SchoolAdmissionDecision
from .serializers import (
    AdmissionApplicationSerializer, 
    AdmissionApplicationCreateSerializer,
    AdmissionReviewSerializer,
    AdmissionTrackingSerializer,
    EmailVerificationRequestSerializer,
    EmailVerificationSerializer,
    SchoolAdmissionDecisionSerializer,
    SchoolDecisionUpdateSerializer,
    StudentChoiceSerializer,
    AdmissionApplicationWithDecisionsSerializer
)
from .email_service import send_otp_email, send_admission_confirmation_email

logger = logging.getLogger(__name__)


class EmailVerificationRequestAPIView(APIView):
    """API view for requesting email verification OTP"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = EmailVerificationRequestSerializer(data=request.data)
        
        if serializer.is_valid():
            email = serializer.validated_data['email']
            applicant_name = serializer.validated_data.get('applicant_name', '')
            
            # Check if there's already a recent verification for this email
            recent_verification = EmailVerification.objects.filter(
                email=email,
                created_at__gte=timezone.now() - timezone.timedelta(minutes=2)
            ).first()
            
            if recent_verification:
                return Response({
                    'success': False,
                    'message': 'OTP already sent recently. Please wait 2 minutes before requesting again.'
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)
            
            # Create new verification
            verification = EmailVerification.objects.create(email=email)
            
            # Send OTP email
            if send_otp_email(email, verification.otp, applicant_name):
                return Response({
                    'success': True,
                    'message': 'OTP sent successfully to your email address.'
                })
            else:
                return Response({
                    'success': False,
                    'message': 'Failed to send OTP. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class EmailVerificationAPIView(APIView):
    """API view for verifying email with OTP"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        
        if serializer.is_valid():
            email = serializer.validated_data['email']
            otp = serializer.validated_data['otp']
            
            # Find the most recent unverified OTP for this email
            try:
                verification = EmailVerification.objects.filter(
                    email=email,
                    is_verified=False
                ).latest('created_at')
                
                if verification.verify(otp):
                    return Response({
                        'success': True,
                        'message': 'Email verified successfully.',
                        'verification_token': verification.otp  # Send OTP as token for application creation
                    })
                else:
                    error_message = 'Invalid OTP.'
                    if verification.is_expired():
                        error_message = 'OTP has expired. Please request a new one.'
                    elif verification.attempts >= 3:
                        error_message = 'Too many failed attempts. Please request a new OTP.'
                    
                    return Response({
                        'success': False,
                        'message': error_message
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
            except EmailVerification.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'No verification request found for this email.'
                }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class DocumentProcessingAPIView(APIView):
    """API view for extracting text from documents and generating auto-fill data"""
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        # Get documents from request
        documents = request.FILES.getlist('documents')
        if not documents:
            return Response({
                'success': False,
                'message': 'No documents provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get student context from request
        student_context = {
            'applicant_name': request.data.get('applicant_name', ''),
            'email': request.data.get('email', ''),
            'phone_number': request.data.get('phone_number', ''),
            'date_of_birth': request.data.get('date_of_birth', ''),
            'course_applied': request.data.get('course_applied', ''),
        }
        
        try:
            # Enable real document processing
            from .document_processor import document_processor
            
            # Extract text from documents
            extracted_text = document_processor.extract_from_documents(documents)
            
            if not extracted_text.strip():
                return Response({
                    'success': False,
                    'message': 'No text could be extracted from the provided documents'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate auto-fill data using AI
            autofill_data = document_processor.generate_autofill_data(extracted_text, student_context)
            
            return Response({
                'success': True,
                'message': 'Documents processed successfully',
                'extracted_text': extracted_text[:500] + '...' if len(extracted_text) > 500 else extracted_text,
                'autofill_data': autofill_data
            })
            
            # Fallback to mock data if AI processing fails
            # mock_autofill_data = {
            #     'previous_school': 'ABC High School',
            #     'last_percentage': '85',
            #     'father_name': 'John Doe',
            #     'father_phone': '+91-9876543210',
            #     'father_email': 'john.doe@example.com',
            #     'father_occupation': 'Software Engineer',
            #     'father_address': '123 Main Street, Delhi',
            #     'mother_name': 'Jane Doe',
            #     'mother_phone': '+91-9876543211',
            #     'mother_email': 'jane.doe@example.com',
            #     'mother_occupation': 'Teacher',
            #     'mother_address': '123 Main Street, Delhi',
            #     'address': '123 Main Street, Delhi 110001',
            #     'emergency_contact_name': 'Uncle Doe',
            #     'emergency_contact_phone': '+91-9876543212',
            #     'emergency_contact_relationship': 'Uncle'
            # }
            # 
            # return Response({
            #     'success': True,
            #     'message': 'Documents processed successfully (test mode)',
            #     'extracted_text': f'Mock extracted text from {len(documents)} documents for student: {student_context["applicant_name"]}',
            #     'autofill_data': mock_autofill_data
            # })
            
        except Exception as e:
            logger.error(f"Document processing error: {str(e)}")
            # Fallback to mock data if processing fails
            mock_autofill_data = {
                'previous_school': 'Sample High School',
                'last_percentage': '80',
                'father_name': 'Sample Father',
                'father_phone': '+91-9876543210',
                'father_occupation': 'Engineer',
                'mother_name': 'Sample Mother',
                'mother_phone': '+91-9876543211',
                'mother_occupation': 'Teacher',
                'address': '123 Sample Street, Sample City'
            }
            
            return Response({
                'success': True,
                'message': f'Documents processed with fallback data (Error: {str(e)})',
                'extracted_text': f'Fallback processing for {len(documents)} documents',
                'autofill_data': mock_autofill_data
            })


class AdmissionTrackingAPIView(APIView):
    """Public API view for tracking admission applications by reference ID"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        reference_id = request.query_params.get('reference_id')
        
        if not reference_id:
            return Response({
                'success': False,
                'message': 'Reference ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            application = AdmissionApplication.objects.get(reference_id=reference_id)
            serializer = AdmissionTrackingSerializer(application)
            
            return Response({
                'success': True,
                'data': serializer.data
            })
        except AdmissionApplication.DoesNotExist:
            return Response({
                'success': False,
                'message': 'No application found with this reference ID'
            }, status=status.HTTP_404_NOT_FOUND)


class AdmissionApplicationViewSet(viewsets.ModelViewSet):
    """ViewSet for AdmissionApplication"""
    queryset = AdmissionApplication.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AdmissionApplicationCreateSerializer
        return AdmissionApplicationSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [AllowAny]  # Anyone can apply
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def create(self, request, *args, **kwargs):
        """Create application and send confirmation email"""
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"Admission application create request received")
        logger.info(f"Request data keys: {list(request.data.keys())}")
        
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            logger.error(f"Serializer validation errors: {serializer.errors}")
            
            # Format error messages for better user experience
            formatted_errors = {}
            for field, errors in serializer.errors.items():
                field_name = field.replace('_', ' ').title()
                if field.startswith('father_'):
                    field_name = f"Father's {field.replace('father_', '').replace('_', ' ').title()}"
                elif field.startswith('mother_'):
                    field_name = f"Mother's {field.replace('mother_', '').replace('_', ' ').title()}"
                elif field.startswith('guardian_'):
                    field_name = f"Guardian's {field.replace('guardian_', '').replace('_', ' ').title()}"
                
                if isinstance(errors, list):
                    formatted_errors[field_name] = errors[0] if errors else "This field is required"
                else:
                    formatted_errors[field_name] = str(errors)
            
            return Response({
                'message': 'Please check the following fields and try again',
                'errors': formatted_errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            application = serializer.save()
            
            # Send confirmation email with reference ID and tracking link
            send_admission_confirmation_email(application)
            
            return Response(
                AdmissionApplicationSerializer(application).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            logger.error(f"Error saving application: {e}")
            return Response({
                'message': 'An error occurred while processing your application. Please try again or contact support.',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def review(self, request, pk=None):
        """Review an admission application"""
        application = self.get_object()
        serializer = AdmissionReviewSerializer(data=request.data)
        
        if serializer.is_valid():
            application.status = serializer.validated_data['status']
            application.review_comments = serializer.validated_data.get('review_comments', '')
            application.reviewed_by = request.user
            application.review_date = timezone.now()
            application.save()
            
            return Response(AdmissionApplicationSerializer(application).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SchoolAdmissionReviewAPIView(APIView):
    """API view for school-specific admission reviews"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get applications for the current user's school"""
        try:
            # Get the user's school directly from the user model
            if not request.user.school:
                return Response({
                    'success': False,
                    'message': 'Unable to determine school for user. Please contact administrator.',
                    'timestamp': timezone.now().isoformat(),
                    'errors': ['User has no school assigned']
                }, status=status.HTTP_400_BAD_REQUEST)
                
            school_id = request.user.school.id
            
            # Get all applications where this school is a preference
            applications = AdmissionApplication.objects.filter(
                Q(first_preference_school_id=school_id) |
                Q(second_preference_school_id=school_id) |
                Q(third_preference_school_id=school_id)
            ).prefetch_related(
                Prefetch('school_decisions', 
                        queryset=SchoolAdmissionDecision.objects.select_related('school', 'student_user'))
            )
            
            serializer = AdmissionApplicationWithDecisionsSerializer(applications, many=True)
            
            return Response({
                'success': True,
                'count': len(applications),
                'results': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error fetching applications: {str(e)}',
                'timestamp': timezone.now().isoformat(),
                'errors': [str(e)]
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SchoolDecisionUpdateAPIView(APIView):
    """API view for updating school admission decisions"""
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, decision_id):
        """Update a school admission decision"""
        try:
            decision = SchoolAdmissionDecision.objects.get(id=decision_id)
        except SchoolAdmissionDecision.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Decision not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = SchoolDecisionUpdateSerializer(decision, data=request.data, partial=True)
        
        if serializer.is_valid():
            decision = serializer.save(reviewed_by=request.user)
            
            return Response({
                'success': True,
                'data': SchoolAdmissionDecisionSerializer(decision).data
            })
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class SchoolDecisionCreateAPIView(APIView):
    """API view for creating new school admission decisions"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Create a new school admission decision"""
        application_id = request.data.get('application_id')
        school_id = request.data.get('school_id')
        decision_value = request.data.get('decision')
        notes = request.data.get('notes', '')
        
        if not application_id or not school_id or not decision_value:
            return Response({
                'success': False,
                'message': 'application_id, school_id, and decision are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            application = AdmissionApplication.objects.get(id=application_id)
            school = School.objects.get(id=school_id)
        except AdmissionApplication.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Admission application not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except School.DoesNotExist:
            return Response({
                'success': False,
                'message': 'School not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if decision already exists
        existing_decision = SchoolAdmissionDecision.objects.filter(
            application=application,
            school=school
        ).first()
        
        if existing_decision:
            return Response({
                'success': False,
                'message': 'Decision already exists for this application and school'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create new decision
        # Determine preference order
        preference_order = '1st'
        if application.first_preference_school == school:
            preference_order = '1st'
        elif application.second_preference_school == school:
            preference_order = '2nd'
        elif application.third_preference_school == school:
            preference_order = '3rd'
        
        decision = SchoolAdmissionDecision.objects.create(
            application=application,
            school=school,
            preference_order=preference_order,
            decision=decision_value,
            review_comments=notes,
            reviewed_by=request.user
        )
        
        return Response({
            'success': True,
            'data': SchoolAdmissionDecisionSerializer(decision).data
        }, status=status.HTTP_201_CREATED)


class StudentChoiceAPIView(APIView):
    """API view for students to choose among accepted schools"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Student selects their preferred school among accepted ones"""
        reference_id = request.data.get('reference_id')
        school_decision_id = request.data.get('school_decision_id')
        
        if not reference_id or not school_decision_id:
            return Response({
                'success': False,
                'message': 'Reference ID and school decision ID are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            application = AdmissionApplication.objects.get(reference_id=reference_id)
            decision = SchoolAdmissionDecision.objects.get(
                id=school_decision_id, 
                application=application,
                decision='accepted'
            )
        except (AdmissionApplication.DoesNotExist, SchoolAdmissionDecision.DoesNotExist):
            return Response({
                'success': False,
                'message': 'Invalid reference ID or school decision'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Reset all choices for this application
        SchoolAdmissionDecision.objects.filter(
            application=application,
            is_student_choice=True
        ).update(is_student_choice=False, student_choice_date=None)
        
        # Set the selected choice
        decision.is_student_choice = True
        decision.student_choice_date = timezone.now()
        decision.save()
        
        return Response({
            'success': True,
            'message': f'Successfully selected {decision.school.school_name}',
            'data': SchoolAdmissionDecisionSerializer(decision).data
        })


class AcceptedSchoolsAPIView(APIView):
    """API view to get accepted schools for an application"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get all accepted schools for an application"""
        reference_id = request.query_params.get('reference_id')
        
        if not reference_id:
            return Response({
                'success': False,
                'message': 'Reference ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            application = AdmissionApplication.objects.get(reference_id=reference_id)
            accepted_decisions = SchoolAdmissionDecision.objects.filter(
                application=application,
                decision='accepted'
            ).select_related('school')
            
            if not accepted_decisions.exists():
                return Response({
                    'success': False,
                    'message': 'No schools have accepted this application yet'
                })
            
            serializer = SchoolAdmissionDecisionSerializer(accepted_decisions, many=True)
            
            return Response({
                'success': True,
                'data': serializer.data,
                'has_student_choice': any(d.is_student_choice for d in accepted_decisions)
            })
            
        except AdmissionApplication.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Application not found'
            }, status=status.HTTP_404_NOT_FOUND)


class FeePaymentInitAPIView(APIView):
    """API view to initialize fee payment for accepted students"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Initialize fee payment process for a student"""
        reference_id = request.data.get('reference_id')
        school_decision_id = request.data.get('school_decision_id')
        
        if not reference_id:
            return Response({
                'success': False,
                'message': 'Reference ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from fees.models import FeeStructure
            from decimal import Decimal
            
            application = AdmissionApplication.objects.get(reference_id=reference_id)
            
            # Get the selected school decision
            if school_decision_id:
                school_decision = SchoolAdmissionDecision.objects.get(
                    id=school_decision_id,
                    application=application,
                    decision='accepted'
                )
            else:
                # If no specific school decision ID, get the student's choice
                school_decision = SchoolAdmissionDecision.objects.filter(
                    application=application,
                    decision='accepted',
                    is_student_choice=True
                ).first()
                
                if not school_decision:
                    # If no student choice yet, get any accepted school
                    school_decision = SchoolAdmissionDecision.objects.filter(
                        application=application,
                        decision='accepted'
                    ).first()
            
            if not school_decision:
                return Response({
                    'success': False,
                    'message': 'No accepted school found for this application'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get fee structure for the school and course
            try:
                fee_structure = FeeStructure.objects.get(
                    school=school_decision.school,
                    course=application.course_applied,
                    semester=1  # Default to first semester for admission
                )
            except FeeStructure.DoesNotExist:
                # Create a default fee structure if none exists
                fee_structure = FeeStructure.objects.create(
                    school=school_decision.school,
                    course=application.course_applied,
                    semester=1,
                    tuition_fee=Decimal('5000.00'),  # Default admission fee
                    library_fee=Decimal('500.00'),
                    lab_fee=Decimal('1000.00'),
                    exam_fee=Decimal('500.00'),
                    total_fee=Decimal('7000.00')
                )
            
            # Calculate any additional fees (admission fee, etc.)
            # Get admission fee based on student's course and category
            from .models import AdmissionFeeStructure
            
            admission_fee = Decimal(str(AdmissionFeeStructure.get_fee_amount_for_student(
                application.course_applied,
                application.category
            )))
            
            total_amount = fee_structure.total_fee + admission_fee
            
            return Response({
                'success': True,
                'data': {
                    'reference_id': reference_id,
                    'school_name': school_decision.school.school_name,
                    'course': application.course_applied,
                    'fee_structure': {
                        'tuition_fee': str(fee_structure.tuition_fee),
                        'library_fee': str(fee_structure.library_fee),
                        'lab_fee': str(fee_structure.lab_fee),
                        'exam_fee': str(fee_structure.exam_fee),
                        'admission_fee': str(admission_fee),
                        'total_fee': str(total_amount)
                    },
                    'payment_methods': ['online', 'card', 'bank_transfer'],
                    'due_date': (timezone.now() + timezone.timedelta(days=30)).strftime('%Y-%m-%d')
                }
            })
            
        except AdmissionApplication.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Application not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error initializing payment: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DocumentUploadAPIView(APIView):
    """API view for uploading documents to admission applications"""
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [AllowAny]  # Allow anyone to upload documents during application
    
    def post(self, request, application_id=None):
        """Upload documents for an admission application"""
        try:
            application = AdmissionApplication.objects.get(id=application_id)
        except AdmissionApplication.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Application not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        uploaded_documents = {}
        
        # Process each uploaded file
        for key, file in request.FILES.items():
            if file:
                # Create a unique filename
                filename = f"admission_{application_id}_{key}_{file.name}"
                
                # Save the file
                file_path = default_storage.save(
                    f"admissions/{application_id}/{filename}",
                    ContentFile(file.read())
                )
                
                # Store the path in the documents dict
                uploaded_documents[key] = file_path
        
        # Update the application's documents field
        if uploaded_documents:
            if not application.documents:
                application.documents = {}
            application.documents.update(uploaded_documents)
            application.save()
        
        return Response({
            'success': True,
            'message': f'Successfully uploaded {len(uploaded_documents)} documents',
            'documents': uploaded_documents
        })
        
    def get(self, request, application_id=None):
        """Get documents for an admission application"""
        try:
            application = AdmissionApplication.objects.get(id=application_id)
            return Response({
                'success': True,
                'documents': application.documents or {}
            })
        except AdmissionApplication.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Application not found'
            }, status=status.HTTP_404_NOT_FOUND)


class FeeCalculationAPIView(APIView):
    """API view for calculating fee based on student's course and category"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        reference_id = request.data.get('reference_id')
        
        if not reference_id:
            return Response({
                'success': False,
                'message': 'Reference ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get the admission application
            application = AdmissionApplication.objects.get(reference_id=reference_id)
            
            # Import AdmissionFeeStructure here to avoid circular imports
            from .models import AdmissionFeeStructure
            
            # Get fee structure for the student
            fee_structure = AdmissionFeeStructure.get_fee_for_student(
                application.course_applied, 
                application.category
            )
            
            if not fee_structure:
                return Response({
                    'success': False,
                    'message': 'Admission fee structure not found for this course and category'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Calculate total fee (use minimum fee for display)
            total_fee = fee_structure.annual_fee_min
            
            # Get school decisions for this application
            school_decisions = SchoolAdmissionDecision.objects.filter(
                application=application,
                decision='accepted'
            ).select_related('school')
            
            response_data = {
                'success': True,
                'data': {
                    'reference_id': reference_id,
                    'applicant_name': application.applicant_name,
                    'course_applied': application.course_applied,
                    'category': application.category,
                    'fee_structure': {
                        'class_range': fee_structure.class_range,
                        'category': fee_structure.category,
                        'annual_fee_min': float(fee_structure.annual_fee_min),
                        'annual_fee_max': float(fee_structure.annual_fee_max) if fee_structure.annual_fee_max else float(fee_structure.annual_fee_min),
                        'total_fee': float(total_fee)
                    },
                    'accepted_schools': [{
                        'id': decision.id,
                        'school_name': decision.school.school_name,
                        'preference_order': decision.preference_order
                    } for decision in school_decisions]
                }
            }
            
            return Response(response_data)
            
        except AdmissionApplication.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Application not found with this reference ID'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error calculating fee: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EnrollmentAPIView(APIView):
    """API view for enrolling students in schools"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Enroll student in a specific school"""
        try:
            decision_id = request.data.get('decision_id')
            payment_reference = request.data.get('payment_reference', '')
            
            if not decision_id:
                return Response({
                    'success': False,
                    'message': 'Decision ID is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get the school decision
            try:
                decision = SchoolAdmissionDecision.objects.get(id=decision_id)
            except SchoolAdmissionDecision.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'School decision not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Check if student can enroll
            if not decision.can_enroll():
                # Check specific reasons for inability to enroll
                if decision.decision not in ['accepted', 'pending']:
                    return Response({
                        'success': False,
                        'message': f'Cannot enroll: Application {decision.decision}'
                    }, status=status.HTTP_400_BAD_REQUEST)
                elif decision.enrollment_status != 'not_enrolled':
                    return Response({
                        'success': False,
                        'message': 'Cannot enroll: Already enrolled or withdrawn'
                    }, status=status.HTTP_400_BAD_REQUEST)
                elif decision.application.has_active_enrollment():
                    active_enrollment = decision.application.get_active_enrollment()
                    return Response({
                        'success': False,
                        'message': f'Cannot enroll: Already enrolled at {active_enrollment.school.school_name}. Withdraw first to enroll elsewhere.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response({
                        'success': False,
                        'message': 'Cannot enroll: Unknown restriction'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Enroll the student with payment finalization
            decision.enroll_student(payment_reference=payment_reference, finalize_payment=True)
            
            return Response({
                'success': True,
                'message': f'Successfully enrolled at {decision.school.school_name}',
                'data': {
                    'enrollment_date': decision.enrollment_date,
                    'school_name': decision.school.school_name,
                    'enrollment_status': decision.enrollment_status,
                    'payment_reference': decision.payment_reference
                }
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error during enrollment: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class WithdrawalAPIView(APIView):
    """API view for withdrawing student enrollment"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Withdraw student enrollment from a school"""
        try:
            decision_id = request.data.get('decision_id')
            withdrawal_reason = request.data.get('withdrawal_reason', '')
            
            if not decision_id:
                return Response({
                    'success': False,
                    'message': 'Decision ID is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get the school decision
            try:
                decision = SchoolAdmissionDecision.objects.get(id=decision_id)
            except SchoolAdmissionDecision.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'School decision not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Check if student can withdraw
            if not decision.can_withdraw():
                return Response({
                    'success': False,
                    'message': 'Cannot withdraw: Not currently enrolled'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Withdraw the enrollment
            decision.withdraw_enrollment(reason=withdrawal_reason)
            
            return Response({
                'success': True,
                'message': f'Successfully withdrawn from {decision.school.school_name}',
                'data': {
                    'withdrawal_date': decision.withdrawal_date,
                    'school_name': decision.school.school_name,
                    'enrollment_status': decision.enrollment_status,
                    'withdrawal_reason': decision.withdrawal_reason
                }
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error during withdrawal: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminDashboardAPIView(APIView):
    """API view for admin dashboard admissions data"""
    permission_classes = [AllowAny]  # Change to IsAuthenticated in production
    
    def get(self, request):
        """Get admission statistics and recent applications for admin dashboard"""
        try:
            # Get admission statistics
            total_applications = AdmissionApplication.objects.count()
            pending_applications = AdmissionApplication.objects.filter(status='pending').count()
            approved_applications = AdmissionApplication.objects.filter(status='approved').count()
            rejected_applications = AdmissionApplication.objects.filter(status='rejected').count()
            
            # Get enrollment statistics
            total_decisions = SchoolAdmissionDecision.objects.count()
            enrolled_students = SchoolAdmissionDecision.objects.filter(enrollment_status='enrolled').count()
            withdrawn_students = SchoolAdmissionDecision.objects.filter(enrollment_status='withdrawn').count()
            accepted_decisions = SchoolAdmissionDecision.objects.filter(decision='accepted').count()
            pending_decisions = SchoolAdmissionDecision.objects.filter(decision='pending').count()
            
            # Get recent applications (last 10)
            recent_applications = AdmissionApplication.objects.select_related(
                'first_preference_school', 'second_preference_school', 'third_preference_school'
            ).prefetch_related('school_decisions__school').order_by('-application_date')[:10]
            
            recent_applications_data = []
            for app in recent_applications:
                # Get enrollment status
                enrollment_status = "NOT_ENROLLED"
                enrolled_school = None
                payment_status = "not_applicable"
                user_id_status = "not_applicable"
                
                enrolled_decision = app.school_decisions.filter(enrollment_status='enrolled').first()
                if enrolled_decision:
                    enrollment_status = "ENROLLED"
                    enrolled_school = enrolled_decision.school.school_name
                    payment_status = 'finalized' if enrolled_decision.is_payment_finalized else 'pending'
                    user_id_status = 'allocated' if enrolled_decision.user_id_allocated else 'pending'
                elif app.school_decisions.filter(enrollment_status='withdrawn').exists():
                    enrollment_status = "WITHDRAWN"
                
                # Get accepted schools count
                accepted_count = app.school_decisions.filter(decision='accepted').count()
                
                recent_applications_data.append({
                    'reference_id': app.reference_id,
                    'applicant_name': app.applicant_name,
                    'email': app.email,
                    'course_applied': app.course_applied,
                    'application_date': app.application_date,
                    'status': app.status,
                    'first_preference_school': app.first_preference_school.school_name if app.first_preference_school else None,
                    'enrollment_status': enrollment_status,
                    'enrolled_school': enrolled_school,
                    'accepted_schools_count': accepted_count,
                    'payment_status': payment_status,
                    'user_id_status': user_id_status,
                })
            
            # Get pending reviews (applications needing attention) 
            # Include both pending decisions and enrolled students needing user ID allocation
            pending_reviews = SchoolAdmissionDecision.objects.filter(
                Q(decision='pending') |  # Regular pending reviews
                Q(decision='accepted', enrollment_status='enrolled', user_id_allocated=False)  # Enrolled but no user ID
            ).select_related('application', 'school').order_by('-application__application_date')[:10]
            
            # Get enrolled students with payment status for user ID allocation
            enrolled_students_for_allocation = SchoolAdmissionDecision.objects.filter(
                enrollment_status='enrolled',
                is_payment_finalized=True,
                user_id_allocated=False
            ).select_related('application', 'school').order_by('-enrollment_date')[:10]
            
            pending_reviews_data = []
            for decision in pending_reviews:
                # Determine the action needed based on the decision status and enrollment
                if decision.decision == 'pending':
                    action_needed = 'Review Application'
                    action_type = 'review'
                elif decision.decision == 'accepted' and decision.enrollment_status == 'enrolled' and not decision.user_id_allocated:
                    action_needed = 'Allot User ID'
                    action_type = 'allocate_user_id'
                else:
                    action_needed = 'Review Application'
                    action_type = 'review'
                
                pending_reviews_data.append({
                    'id': decision.id,
                    'reference_id': decision.application.reference_id,
                    'applicant_name': decision.application.applicant_name,
                    'school_name': decision.school.school_name,
                    'preference_order': decision.preference_order,
                    'application_date': decision.application.application_date,
                    'course_applied': decision.application.course_applied,
                    'action_needed': action_needed,
                    'action_type': action_type,
                    'enrollment_status': decision.enrollment_status,
                    'decision_status': decision.decision,
                    'user_id_allocated': decision.user_id_allocated
                })
            
            # Since enrolled students needing user ID allocation are now in pending_reviews,
            # we can remove the separate allocation_pending section or keep it for additional clarity
            # For now, let's keep the separate section for students who might not appear in pending_reviews
            allocation_pending_data = []
            for decision in enrolled_students_for_allocation:
                # Only include if not already in pending_reviews
                if not any(pr['id'] == decision.id for pr in pending_reviews_data):
                    allocation_pending_data.append({
                        'id': decision.id,
                        'reference_id': decision.application.reference_id,
                        'applicant_name': decision.application.applicant_name,
                        'school_name': decision.school.school_name,
                        'enrollment_date': decision.enrollment_date,
                        'payment_completed_at': decision.payment_completed_at,
                        'course_applied': decision.application.course_applied,
                        'action_needed': 'Allot User ID',
                        'action_type': 'allocate_user_id'
                    })
            
            return Response({
                'success': True,
                'data': {
                    'statistics': {
                        'total_applications': total_applications,
                        'pending_applications': pending_applications,
                        'approved_applications': approved_applications,
                        'rejected_applications': rejected_applications,
                        'total_decisions': total_decisions,
                        'enrolled_students': enrolled_students,
                        'withdrawn_students': withdrawn_students,
                        'accepted_decisions': accepted_decisions,
                        'pending_decisions': pending_decisions,
                    },
                    'recent_applications': recent_applications_data,
                    'pending_reviews': pending_reviews_data,
                    'allocation_pending': allocation_pending_data,
                }
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error fetching dashboard data: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PaymentFinalizationAPIView(APIView):
    """API view for finalizing payments after enrollment"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Finalize payment - makes enrollment non-refundable and sends receipt email"""
        try:
            decision_id = request.data.get('decision_id')
            
            if not decision_id:
                return Response({
                    'success': False,
                    'message': 'Decision ID is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get the school decision
            try:
                decision = SchoolAdmissionDecision.objects.get(id=decision_id)
            except SchoolAdmissionDecision.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'School decision not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Check if payment can be finalized
            if decision.enrollment_status != 'enrolled':
                return Response({
                    'success': False,
                    'message': 'Cannot finalize payment: Student not enrolled'
                }, status=status.HTTP_400_BAD_REQUEST)
                
            if decision.payment_status != 'completed':
                return Response({
                    'success': False,
                    'message': 'Cannot finalize payment: Payment not completed'
                }, status=status.HTTP_400_BAD_REQUEST)
                
            if decision.is_payment_finalized:
                return Response({
                    'success': False,
                    'message': 'Payment already finalized'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Finalize payment
            if decision.finalize_payment():
                # Send payment receipt email
                self.send_payment_receipt_email(decision)
                
                return Response({
                    'success': True,
                    'message': 'Payment finalized successfully. Receipt sent via email.',
                    'data': {
                        'finalized_at': decision.payment_completed_at,
                        'is_finalized': decision.is_payment_finalized,
                        'school_name': decision.school.school_name,
                        'payment_reference': decision.payment_reference
                    }
                })
            else:
                return Response({
                    'success': False,
                    'message': 'Failed to finalize payment'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error finalizing payment: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def send_payment_receipt_email(self, decision):
        """Send payment receipt email to student"""
        from .email_service import send_payment_receipt_email
        
        try:
            success = send_payment_receipt_email(decision)
            if not success:
                print(f"Failed to send payment receipt email for decision {decision.id}")
        except Exception as e:
            print(f"Failed to send payment receipt email: {str(e)}")


class StudentUserAllocationAPIView(APIView):
    """API view for allocating student user IDs (Admin only)"""
    permission_classes = [AllowAny]  # TODO: Change to IsAuthenticated + IsAdminUser in production
    
    def post(self, request):
        """Allocate student user ID and create account"""
        try:
            decision_id = request.data.get('decision_id')
            
            if not decision_id:
                return Response({
                    'success': False,
                    'message': 'Decision ID is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get the school decision
            try:
                decision = SchoolAdmissionDecision.objects.get(id=decision_id)
            except SchoolAdmissionDecision.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'School decision not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Check prerequisites
            if decision.enrollment_status != 'enrolled':
                return Response({
                    'success': False,
                    'message': 'Cannot allocate user ID: Student not enrolled'
                }, status=status.HTTP_400_BAD_REQUEST)
                
            if not decision.is_payment_finalized:
                return Response({
                    'success': False,
                    'message': 'Cannot allocate user ID: Payment not finalized'
                }, status=status.HTTP_400_BAD_REQUEST)
                
            if decision.user_id_allocated:
                return Response({
                    'success': False,
                    'message': 'User ID already allocated'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Allocate user ID - use authenticated user if available, otherwise None for now
            admin_user = request.user if request.user.is_authenticated else None
            
            credentials = decision.allocate_student_user_id(admin_user)
            
            if credentials:
                # Send credentials email
                email_sent = self.send_credentials_email(decision, credentials)
                
                return Response({
                    'success': True,
                    'message': f'Student user ID allocated successfully. Login credentials {"sent via email" if email_sent else "generated (email sending failed)"}.', 
                    'data': {
                        'allocated_at': decision.user_id_allocated_at.isoformat() if decision.user_id_allocated_at else None,
                        'username': credentials['username'],
                        'email': credentials['email'],
                        'admission_number': credentials['admission_number'],
                        'school_name': decision.school.school_name,
                        'email_sent': email_sent
                    }
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'message': 'Failed to allocate user ID'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error allocating user ID: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def send_credentials_email(self, decision, credentials):
        """Send login credentials email to student - returns True if successful, False otherwise"""
        from .email_service import send_student_credentials_email
        
        try:
            success = send_student_credentials_email(decision, credentials)
            if success:
                print(f"Successfully sent credentials email to {decision.application.email}")
                return True
            else:
                print(f"Failed to send credentials email to {decision.application.email}")
                return False
        except Exception as e:
            print(f"Failed to send credentials email: {str(e)}")
            return False


class EnrollmentStatusAPIView(APIView):
    """API view to get detailed enrollment status for tracking"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get enrollment status with payment and user allocation info"""
        reference_id = request.query_params.get('reference_id')
        
        if not reference_id:
            return Response({
                'success': False,
                'message': 'Reference ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            application = AdmissionApplication.objects.get(reference_id=reference_id)
            
            # Get all school decisions with related data
            decisions = SchoolAdmissionDecision.objects.filter(
                application=application
            ).select_related('school', 'student_user')
            
            decisions_data = []
            for decision in decisions:
                decision_data = {
                    'id': decision.id,
                    'school_name': decision.school.school_name,
                    'preference_order': decision.preference_order,
                    'decision': decision.decision,
                    'enrollment_status': decision.enrollment_status,
                    'payment_status': decision.payment_status,
                    'payment_reference': decision.payment_reference,
                    'is_payment_finalized': decision.is_payment_finalized,
                    'user_id_allocated': decision.user_id_allocated,
                    'student_username': decision.student_user.username if decision.student_user else None,
                    'can_withdraw': decision.can_withdraw_after_payment(),
                    'enrollment_date': decision.enrollment_date,
                    'payment_completed_at': decision.payment_completed_at,
                    'user_id_allocated_at': decision.user_id_allocated_at,
                }
                decisions_data.append(decision_data)
            
            return Response({
                'success': True,
                'data': {
                    'reference_id': reference_id,
                    'applicant_name': application.applicant_name,
                    'course_applied': application.course_applied,
                    'school_decisions': decisions_data
                }
            })
            
        except AdmissionApplication.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Application not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error fetching enrollment status: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdmissionFeeAPIView(APIView):
    """API view for getting admission fee information"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get fee structure and enrollment fees data"""
        try:
            from .models import AdmissionFeeStructure
            
            # Get all fee structures
            fee_structures = AdmissionFeeStructure.objects.all()
            fee_structure_data = []
            
            for fee in fee_structures:
                fee_structure_data.append({
                    'class_range': fee.class_range,
                    'category': fee.category,
                    'annual_fee_min': float(fee.annual_fee_min),
                    'annual_fee_max': float(fee.annual_fee_max) if fee.annual_fee_max else None,
                    'display_name': str(fee)
                })
            
            # Get enrolled students with their fee information
            enrolled_applications = AdmissionApplication.objects.filter(
                school_decisions__enrollment_status='enrolled'
            ).select_related('first_preference_school', 'second_preference_school', 'third_preference_school').prefetch_related('school_decisions')
            
            enrollment_fees = []
            total_expected = 0
            total_collected = 0
            
            for application in enrolled_applications:
                # Find the enrolled decision
                enrolled_decision = application.school_decisions.filter(enrollment_status='enrolled').first()
                
                if enrolled_decision:
                    # Calculate fee for this student based on their course and category
                    fee_structure = AdmissionFeeStructure.get_fee_for_student(
                        application.course_applied, 
                        application.category
                    )
                    
                    fee_amount = float(fee_structure.annual_fee_min) if fee_structure else 0
                    total_expected += fee_amount
                    
                    if enrolled_decision.payment_status == 'completed':
                        total_collected += fee_amount
                    
                    enrollment_fees.append({
                        'application_id': application.id,
                        'reference_id': application.reference_id,
                        'student_name': application.applicant_name,
                        'course': application.course_applied,
                        'category': application.category,
                        'school_name': enrolled_decision.school.school_name if enrolled_decision.school else 'Unknown',
                        'fee_amount': fee_amount,
                        'payment_status': enrolled_decision.payment_status,
                        'payment_completed_at': enrolled_decision.payment_completed_at,
                        'payment_reference': enrolled_decision.payment_reference,
                        'is_payment_finalized': enrolled_decision.is_payment_finalized,
                        'enrollment_date': enrolled_decision.enrollment_date
                    })
            
            return Response({
                'success': True,
                'data': {
                    'fee_structures': fee_structure_data,
                    'enrollment_fees': enrollment_fees,
                    'statistics': {
                        'total_expected': total_expected,
                        'total_collected': total_collected,
                        'pending_amount': total_expected - total_collected,
                        'collection_rate': (total_collected / total_expected * 100) if total_expected > 0 else 0,
                        'total_students': len(enrollment_fees),
                        'paid_students': len([f for f in enrollment_fees if f['payment_status'] == 'completed'])
                    }
                }
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error fetching fee data: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Calculate fee for a specific student"""
        try:
            course_applied = request.data.get('course_applied')
            category = request.data.get('category')
            
            if not course_applied or not category:
                return Response({
                    'success': False,
                    'message': 'Course and category are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            from .models import AdmissionFeeStructure
            fee_structure = AdmissionFeeStructure.get_fee_for_student(course_applied, category)
            
            if fee_structure:
                return Response({
                    'success': True,
                    'data': {
                        'class_range': fee_structure.class_range,
                        'category': fee_structure.category,
                        'annual_fee_min': float(fee_structure.annual_fee_min),
                        'annual_fee_max': float(fee_structure.annual_fee_max) if fee_structure.annual_fee_max else None,
                        'applicable_fee': float(fee_structure.annual_fee_min)
                    }
                })
            else:
                return Response({
                    'success': False,
                    'message': 'No fee structure found for the given course and category'
                }, status=status.HTTP_404_NOT_FOUND)
                
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error calculating fee: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
