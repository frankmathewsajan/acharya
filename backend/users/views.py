from django.shortcuts import render

from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db import models
from .models import StudentProfile, ParentProfile, StaffProfile
from .serializers import (
    UserSerializer, LoginSerializer, StudentProfileSerializer,
    ParentProfileSerializer, StaffProfileSerializer, DashboardDataSerializer
)

User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Login endpoint"""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Logout endpoint"""
    try:
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({"message": "Logout successful"})
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def parent_request_otp(request):
    """Request OTP for parent login using email (parent's own email or student's email)"""
    email = request.data.get('email')
    
    if not email:
        return Response({
            'error': 'Email is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        from .models import ParentProfile, ParentOTP
        from admissions.email_service import send_parent_otp_email
        
        # Find parent by their own email first
        parent = ParentProfile.objects.filter(email__iexact=email).first()
        
        # If no parent found with their own email, try to find by student's email (from admission)
        if not parent:
            from admissions.models import AdmissionApplication
            
            # Look for admission applications with this email that have allocated user IDs
            admission_apps = AdmissionApplication.objects.filter(
                email__iexact=email,
                school_decisions__user_id_allocated=True
            ).prefetch_related('parent_profiles')
            
            # Get the first parent profile from these applications
            for app in admission_apps:
                parent = app.parent_profiles.filter(is_primary_contact=True).first()
                if parent:
                    break
            
            # If still no primary contact found, get any parent from these applications
            if not parent:
                for app in admission_apps:
                    parent = app.parent_profiles.first()
                    if parent:
                        break
        
        if not parent:
            return Response({
                'error': 'No parent found associated with this email address'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check rate limiting
        can_request, error_message = parent.can_request_otp()
        if not can_request:
            return Response({
                'error': error_message
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        # Generate OTP
        otp = ParentOTP.generate_otp()
        
        # Create OTP record
        parent_otp = ParentOTP.objects.create(
            parent=parent,
            email=email,
            otp=otp
        )
        
        # Send OTP email
        student_name = parent.student.full_name if parent.student else "your child"
        email_sent = send_parent_otp_email(email, otp, parent.full_name, student_name)
        
        if email_sent:
            # Record OTP sent
            parent.record_otp_sent()
            
            return Response({
                'message': 'OTP sent successfully to your email',
                'email': email,
                'expires_in_minutes': 10
            })
        else:
            return Response({
                'error': 'Failed to send OTP email. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        return Response({
            'error': f'Error sending OTP: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def parent_verify_otp(request):
    """Verify OTP and provide parent access token"""
    email = request.data.get('email')
    otp = request.data.get('otp')
    
    if not all([email, otp]):
        return Response({
            'error': 'Email and OTP are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        from .models import ParentProfile, ParentOTP
        from django.utils import timezone
        
        # Find parent by their own email first
        parent = ParentProfile.objects.filter(email__iexact=email).first()
        
        # If no parent found with their own email, try to find by student's email (from admission)
        if not parent:
            from admissions.models import AdmissionApplication
            
            # Look for admission applications with this email that have allocated user IDs
            admission_apps = AdmissionApplication.objects.filter(
                email__iexact=email,
                school_decisions__user_id_allocated=True
            ).prefetch_related('parent_profiles')
            
            # Get the first parent profile from these applications
            for app in admission_apps:
                parent = app.parent_profiles.filter(is_primary_contact=True).first()
                if parent:
                    break
            
            # If still no primary contact found, get any parent from these applications
            if not parent:
                for app in admission_apps:
                    parent = app.parent_profiles.first()
                    if parent:
                        break
        
        if not parent:
            return Response({
                'error': 'Invalid email or OTP'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find the latest unverified OTP for this parent
        parent_otp = ParentOTP.objects.filter(
            parent=parent,
            email__iexact=email,
            is_verified=False
        ).order_by('-created_at').first()
        
        if not parent_otp:
            return Response({
                'error': 'No valid OTP found. Please request a new OTP.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify OTP
        if parent_otp.verify(otp):
            # Record login attempt
            parent.record_login_attempt()
            
            # Create session token (store in cache for limited time)
            from django.core.cache import cache
            import time
            import uuid
            
            session_token = str(uuid.uuid4())
            session_data = {
                'parent_id': parent.id,
                'student_id': parent.student.id if parent.student else None,
                'email': parent.email,
                'timestamp': int(time.time()),
                'expires_at': int(time.time()) + (4 * 60 * 60),  # 4 hours
            }
            
            # Store in cache with expiry
            cache.set(f"parent_session_{session_token}", session_data, timeout=4*60*60)
            
            return Response({
                'message': 'OTP verified successfully',
                'access_token': session_token,
                'parent': {
                    'id': parent.id,
                    'name': parent.full_name,
                    'relationship': parent.get_relationship_display(),
                    'email': parent.email,
                    'is_primary_contact': parent.is_primary_contact,
                },
                'student': {
                    'id': parent.student.id if parent.student else None,
                    'name': parent.student.full_name if parent.student else None,
                    'admission_number': parent.student.admission_number if parent.student else None,
                    'course': parent.student.course if parent.student else None,
                    'school': parent.student.school.school_name if parent.student and parent.student.school else None,
                } if parent.student else None,
                'expires_at': session_data['expires_at'],
            })
        else:
            return Response({
                'error': 'Invalid or expired OTP'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({
            'error': f'Error verifying OTP: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def parent_logout(request):
    """Logout parent by invalidating session token"""
    try:
        access_token = request.data.get('access_token') or request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not access_token:
            return Response({
                'error': 'Access token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        from django.core.cache import cache
        
        # Remove session from cache
        cache.delete(f"parent_session_{access_token}")
        
        return Response({
            'message': 'Logged out successfully'
        })
        
    except Exception as e:
        return Response({
            'error': f'Error during logout: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def parent_verify_session(request):
    """Verify if parent session is still valid"""
    try:
        access_token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not access_token:
            return Response({
                'valid': False,
                'error': 'Access token is required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        from django.core.cache import cache
        import time
        
        # Check session in cache
        session_data = cache.get(f"parent_session_{access_token}")
        
        if not session_data:
            return Response({
                'valid': False,
                'error': 'Session expired or invalid'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if session is still valid
        if session_data['expires_at'] < int(time.time()):
            cache.delete(f"parent_session_{access_token}")
            return Response({
                'valid': False,
                'error': 'Session expired'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get fresh parent data
        from .models import ParentProfile
        parent = ParentProfile.objects.select_related('student', 'student__school').get(
            id=session_data['parent_id']
        )
        
        return Response({
            'valid': True,
            'parent': {
                'id': parent.id,
                'name': parent.full_name,
                'relationship': parent.get_relationship_display(),
                'email': parent.email,
                'is_primary_contact': parent.is_primary_contact,
            },
            'student': {
                'id': parent.student.id if parent.student else None,
                'name': parent.student.full_name if parent.student else None,
                'admission_number': parent.student.admission_number if parent.student else None,
                'course': parent.student.course if parent.student else None,
                'school': parent.student.school.school_name if parent.student and parent.student.school else None,
            } if parent.student else None,
            'expires_at': session_data['expires_at'],
        })
        
    except Exception as e:
        return Response({
            'valid': False,
            'error': f'Error verifying session: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def parent_request_otp_legacy(request):
    """Legacy endpoint - Request OTP for parent login using student admission number and parent phone"""
    admission_number = request.data.get('admission_number')
    phone_number = request.data.get('phone_number')
    
    if not admission_number or not phone_number:
        return Response({
            'error': 'Both admission number and phone number are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Find student by admission number
        student = StudentProfile.objects.get(admission_number=admission_number)
        
        # Find parent with matching phone number
        parent = ParentProfile.objects.filter(
            student=student,
            phone_number=phone_number
        ).first()
        
        if not parent:
            return Response({
                'error': 'No parent found with this phone number for the given student'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Generate and store OTP (in production, send via SMS)
        otp = parent.generate_otp_for_login()
        
        # In production, you would send the OTP via SMS service
        # For now, we'll store it temporarily (use Redis/cache in production)
        from django.core.cache import cache
        cache_key = f"parent_otp_{admission_number}_{phone_number}"
        cache.set(cache_key, otp, timeout=300)  # 5 minutes
        
        return Response({
            'message': 'OTP sent successfully',
            'admission_number': admission_number,
            'phone_number': phone_number,
            'otp': otp,  # Remove this in production!
        })
        
    except StudentProfile.DoesNotExist:
        return Response({
            'error': 'Student not found with this admission number'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])
def parent_verify_otp_legacy(request):
    """Verify OTP and provide parent access to student data"""
    admission_number = request.data.get('admission_number')
    phone_number = request.data.get('phone_number')
    otp = request.data.get('otp')
    
    if not all([admission_number, phone_number, otp]):
        return Response({
            'error': 'Admission number, phone number, and OTP are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify OTP from cache
    from django.core.cache import cache
    cache_key = f"parent_otp_{admission_number}_{phone_number}"
    stored_otp = cache.get(cache_key)
    
    if not stored_otp or stored_otp != otp:
        return Response({
            'error': 'Invalid or expired OTP'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Find student and parent
        student = StudentProfile.objects.get(admission_number=admission_number)
        parent = ParentProfile.objects.get(
            student=student,
            phone_number=phone_number
        )
        
        # Clear OTP from cache
        cache.delete(cache_key)
        
        # Create a temporary session token for parent (valid for limited time)
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode
        import json
        import time
        
        # Create parent session data
        parent_session_data = {
            'parent_id': parent.id,
            'student_id': student.id,
            'phone_number': phone_number,
            'timestamp': int(time.time()),
            'expires_at': int(time.time()) + (4 * 60 * 60),  # 4 hours
        }
        
        # Store in cache with expiry
        session_key = f"parent_session_{parent.id}_{student.id}"
        cache.set(session_key, parent_session_data, timeout=4*60*60)  # 4 hours
        
        return Response({
            'message': 'OTP verified successfully',
            'parent_session_token': session_key,
            'parent': {
                'id': parent.id,
                'name': parent.full_name,
                'relationship': parent.get_relationship_display(),
                'phone_number': parent.phone_number,
            },
            'student': {
                'id': student.id,
                'name': student.full_name,
                'admission_number': student.admission_number,
                'course': student.course,
                'semester': student.semester,
            },
            'expires_at': parent_session_data['expires_at'],
        })
        
    except (StudentProfile.DoesNotExist, ParentProfile.DoesNotExist):
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_view(request):
    """Get current user profile"""
    user = request.user
    profile_data = None
    
    if user.role == 'student' and hasattr(user, 'student_profile'):
        profile_data = StudentProfileSerializer(user.student_profile).data
    elif user.role in ['faculty', 'warden', 'admin'] and hasattr(user, 'staff_profile'):
        profile_data = StaffProfileSerializer(user.staff_profile).data
    
    return Response({
        'user': UserSerializer(user).data,
        'profile': profile_data
    })


class StudentProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for StudentProfile"""
    queryset = StudentProfile.objects.all()
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAuthenticated]


class ParentProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for ParentProfile"""
    queryset = ParentProfile.objects.all()
    serializer_class = ParentProfileSerializer
    permission_classes = [IsAuthenticated]


class StaffProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for StaffProfile"""
    queryset = StaffProfile.objects.all()
    serializer_class = StaffProfileSerializer
    permission_classes = [IsAuthenticated]


def get_parent_from_token(request):
    """Helper function to get parent from session token"""
    # Try X-Parent-Token header first, then Authorization header
    access_token = request.headers.get('X-Parent-Token') or request.headers.get('Authorization', '').replace('Bearer ', '')
    
    if not access_token:
        return None, Response({
            'error': 'Access token is required'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    from django.core.cache import cache
    import time
    
    # Check session in cache
    session_data = cache.get(f"parent_session_{access_token}")
    
    if not session_data:
        return None, Response({
            'error': 'Session expired or invalid'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    # Check if session is still valid
    if session_data['expires_at'] < int(time.time()):
        cache.delete(f"parent_session_{access_token}")
        return None, Response({
            'error': 'Session expired'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    # Get parent
    try:
        parent = ParentProfile.objects.select_related('student', 'student__school').get(
            id=session_data['parent_id']
        )
        return parent, None
    except ParentProfile.DoesNotExist:
        return None, Response({
            'error': 'Parent not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([AllowAny])
def parent_dashboard_overview(request):
    """Get parent dashboard overview data"""
    parent, error_response = get_parent_from_token(request)
    if error_response:
        return error_response
    
    if not parent.student:
        return Response({
            'error': 'No student linked to this parent'
        }, status=status.HTTP_404_NOT_FOUND)
    
    try:
        from django.db.models import Q, Avg, Count
        from datetime import date, timedelta
        from attendance.models import AttendanceRecord
        from exams.models import ExamResult
        from fees.models import FeeInvoice, Payment
        from notifications.models import Notice, UserNotification
        
        student = parent.student
        
        # Get attendance overview (last 30 days)
        thirty_days_ago = date.today() - timedelta(days=30)
        attendance_records = AttendanceRecord.objects.filter(
            student=student,
            session__date__gte=thirty_days_ago
        )
        
        total_classes = attendance_records.count()
        present_classes = attendance_records.filter(status='present').count()
        attendance_percentage = (present_classes / total_classes * 100) if total_classes > 0 else 0
        
        # Get recent exam results
        recent_exam_results = ExamResult.objects.filter(
            student=student
        ).select_related('exam').order_by('-exam__date')[:5]
        
        # Get fee status
        pending_fees = FeeInvoice.objects.filter(
            student=student,
            status='pending'
        ).aggregate(total=models.Sum('amount'))['total'] or 0
        
        # Get recent notices
        recent_notices = Notice.objects.filter(
            Q(target_roles__contains='all') | 
            Q(target_roles__contains='student') |
            Q(target_roles__contains='parent')
        ).filter(
            is_active=True,
            school=student.school
        ).order_by('-created_at')[:5]
        
        return Response({
            'student': {
                'id': student.id,
                'name': student.full_name,
                'admission_number': student.admission_number,
                'course': student.course,
                'semester': student.semester,
                'school': student.school.school_name if student.school else None,
            },
            'attendance': {
                'percentage': round(attendance_percentage, 2),
                'present_days': present_classes,
                'total_days': total_classes,
                'period': '30 days'
            },
            'academic': {
                'recent_results': [
                    {
                        'exam_name': result.exam.name,
                        'subject': result.subject,
                        'marks_obtained': result.marks_obtained,
                        'total_marks': result.total_marks,
                        'percentage': result.percentage,
                        'grade': result.grade,
                        'date': result.exam.date
                    } for result in recent_exam_results
                ]
            },
            'fees': {
                'pending_amount': pending_fees,
                'status': 'pending' if pending_fees > 0 else 'paid'
            },
            'notices': [
                {
                    'id': notice.id,
                    'title': notice.title,
                    'content': notice.content[:200] + '...' if len(notice.content) > 200 else notice.content,
                    'priority': notice.priority,
                    'created_at': notice.created_at,
                    'expiry_date': notice.expiry_date
                } for notice in recent_notices
            ]
        })
        
    except Exception as e:
        return Response({
            'error': f'Error fetching dashboard data: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def parent_student_attendance(request):
    """Get detailed student attendance data"""
    parent, error_response = get_parent_from_token(request)
    if error_response:
        return error_response
    
    if not parent.student:
        return Response({
            'error': 'No student linked to this parent'
        }, status=status.HTTP_404_NOT_FOUND)
    
    try:
        from datetime import date, timedelta
        from attendance.models import AttendanceRecord, ClassSession
        from django.db.models import Count, Q
        
        student = parent.student
        
        # Get query parameters
        days = int(request.GET.get('days', 30))
        start_date = date.today() - timedelta(days=days)
        
        # Get attendance records
        attendance_records = AttendanceRecord.objects.filter(
            student=student,
            session__date__gte=start_date
        ).select_related('session').order_by('-session__date')
        
        # Calculate statistics
        total_classes = attendance_records.count()
        present_count = attendance_records.filter(status='present').count()
        absent_count = attendance_records.filter(status='absent').count()
        late_count = attendance_records.filter(status='late').count()
        
        attendance_percentage = (present_count / total_classes * 100) if total_classes > 0 else 0
        
        # Group by subject for subject-wise attendance
        subject_attendance = {}
        for record in attendance_records:
            subject = record.class_session.subject if record.class_session else 'Unknown'
            if subject not in subject_attendance:
                subject_attendance[subject] = {'total': 0, 'present': 0}
            subject_attendance[subject]['total'] += 1
            if record.status == 'present':
                subject_attendance[subject]['present'] += 1
        
        # Calculate subject-wise percentages
        for subject in subject_attendance:
            data = subject_attendance[subject]
            data['percentage'] = (data['present'] / data['total'] * 100) if data['total'] > 0 else 0
        
        return Response({
            'summary': {
                'total_classes': total_classes,
                'present': present_count,
                'absent': absent_count,
                'late': late_count,
                'attendance_percentage': round(attendance_percentage, 2),
                'period_days': days
            },
            'subject_wise': [
                {
                    'subject': subject,
                    'total_classes': data['total'],
                    'present_classes': data['present'],
                    'percentage': round(data['percentage'], 2)
                } for subject, data in subject_attendance.items()
            ],
            'records': [
                {
                    'date': record.date,
                    'subject': record.class_session.subject if record.class_session else 'Unknown',
                    'status': record.status,
                    'time_in': record.time_in,
                    'time_out': record.time_out,
                    'remarks': record.remarks
                } for record in attendance_records
            ]
        })
        
    except Exception as e:
        return Response({
            'error': f'Error fetching attendance data: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def parent_student_results(request):
    """Get student exam results and academic performance"""
    parent, error_response = get_parent_from_token(request)
    if error_response:
        return error_response
    
    if not parent.student:
        return Response({
            'error': 'No student linked to this parent'
        }, status=status.HTTP_404_NOT_FOUND)
    
    try:
        from exams.models import ExamResult, Exam
        from django.db.models import Avg
        
        student = parent.student
        
        # Get exam results
        exam_results = ExamResult.objects.filter(
            student=student
        ).select_related('exam').order_by('-exam__date')
        
        # Group by exam
        exams_data = {}
        for result in exam_results:
            exam_name = result.exam.name
            if exam_name not in exams_data:
                exams_data[exam_name] = {
                    'exam_name': exam_name,
                    'exam_date': result.exam.date,
                    'total_marks': 0,
                    'obtained_marks': 0,
                    'subjects': [],
                    'overall_percentage': 0,
                    'overall_grade': 'N/A'
                }
            
            exams_data[exam_name]['subjects'].append({
                'subject': result.subject,
                'marks_obtained': result.marks_obtained,
                'total_marks': result.total_marks,
                'percentage': result.percentage,
                'grade': result.grade
            })
            
            exams_data[exam_name]['total_marks'] += result.total_marks
            exams_data[exam_name]['obtained_marks'] += result.marks_obtained
        
        # Calculate overall percentages
        for exam_name in exams_data:
            exam_data = exams_data[exam_name]
            if exam_data['total_marks'] > 0:
                exam_data['overall_percentage'] = round(
                    (exam_data['obtained_marks'] / exam_data['total_marks']) * 100, 2
                )
                # Simple grading logic
                percentage = exam_data['overall_percentage']
                if percentage >= 90:
                    exam_data['overall_grade'] = 'A+'
                elif percentage >= 80:
                    exam_data['overall_grade'] = 'A'
                elif percentage >= 70:
                    exam_data['overall_grade'] = 'B+'
                elif percentage >= 60:
                    exam_data['overall_grade'] = 'B'
                elif percentage >= 50:
                    exam_data['overall_grade'] = 'C'
                elif percentage >= 40:
                    exam_data['overall_grade'] = 'D'
                else:
                    exam_data['overall_grade'] = 'F'
        
        # Calculate semester/overall performance
        all_results = list(exam_results)
        if all_results:
            avg_percentage = sum(result.percentage for result in all_results) / len(all_results)
        else:
            avg_percentage = 0
        
        return Response({
            'student': {
                'name': student.full_name,
                'course': student.course,
                'semester': student.semester
            },
            'performance_summary': {
                'average_percentage': round(avg_percentage, 2),
                'total_exams': len(exams_data),
                'total_subjects_attempted': len(all_results)
            },
            'exams': list(exams_data.values())
        })
        
    except Exception as e:
        return Response({
            'error': f'Error fetching exam results: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def parent_student_fees(request):
    """Get student fee details and payment history"""
    parent, error_response = get_parent_from_token(request)
    if error_response:
        return error_response
    
    if not parent.student:
        return Response({
            'error': 'No student linked to this parent'
        }, status=status.HTTP_404_NOT_FOUND)
    
    try:
        from fees.models import FeeInvoice, Payment, FeeStructure
        from django.db.models import Sum
        
        student = parent.student
        
        # Get fee invoices
        fee_invoices = FeeInvoice.objects.filter(student=student).order_by('-created_at')
        
        # Get payments
        payments = Payment.objects.filter(student=student).order_by('-payment_date')
        
        # Calculate totals
        total_fees = fee_invoices.aggregate(Sum('amount'))['amount__sum'] or 0
        total_paid = payments.filter(status='completed').aggregate(Sum('amount'))['amount__sum'] or 0
        pending_amount = total_fees - total_paid
        
        return Response({
            'summary': {
                'total_fees': total_fees,
                'total_paid': total_paid,
                'pending_amount': pending_amount,
                'status': 'pending' if pending_amount > 0 else 'paid'
            },
            'invoices': [
                {
                    'id': invoice.id,
                    'amount': invoice.amount,
                    'description': invoice.description,
                    'due_date': invoice.due_date,
                    'status': invoice.status,
                    'created_at': invoice.created_at
                } for invoice in fee_invoices
            ],
            'payments': [
                {
                    'id': payment.id,
                    'amount': payment.amount,
                    'payment_method': payment.payment_method,
                    'transaction_id': payment.transaction_id,
                    'status': payment.status,
                    'payment_date': payment.payment_date,
                    'remarks': payment.remarks
                } for payment in payments
            ]
        })
        
    except Exception as e:
        return Response({
            'error': f'Error fetching fee details: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def parent_notices(request):
    """Get notices relevant to the student and parents"""
    parent, error_response = get_parent_from_token(request)
    if error_response:
        return error_response
    
    if not parent.student:
        return Response({
            'error': 'No student linked to this parent'
        }, status=status.HTTP_404_NOT_FOUND)
    
    try:
        from notifications.models import Notice
        from django.db.models import Q
        
        student = parent.student
        
        # Get notices for students, parents, or all
        notices = Notice.objects.filter(
            Q(target_roles__contains='all') | 
            Q(target_roles__contains='student') |
            Q(target_roles__contains='parent')
        ).filter(
            is_active=True,
            school=student.school
        ).order_by('-created_at')
        
        # Filter by priority if requested
        priority = request.GET.get('priority')
        if priority and priority in ['low', 'medium', 'high', 'urgent']:
            notices = notices.filter(priority=priority)
        
        return Response({
            'notices': [
                {
                    'id': notice.id,
                    'title': notice.title,
                    'content': notice.content,
                    'priority': notice.priority,
                    'target_roles': notice.target_roles,
                    'created_at': notice.created_at,
                    'expire_date': notice.expire_date,
                    'is_important': notice.priority in ['high', 'urgent']
                } for notice in notices
            ]
        })
        
    except Exception as e:
        return Response({
            'error': f'Error fetching notices: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
