from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'applications', views.AdmissionApplicationViewSet)

urlpatterns = [
    path('track/', views.AdmissionTrackingAPIView.as_view(), name='track-application'),
    path('verify-email/request/', views.EmailVerificationRequestAPIView.as_view(), name='request-email-verification'),
    path('verify-email/verify/', views.EmailVerificationAPIView.as_view(), name='verify-email'),
    path('school-review/', views.SchoolAdmissionReviewAPIView.as_view(), name='school-admission-review'),
    path('school-decision/', views.SchoolDecisionCreateAPIView.as_view(), name='create-school-decision'),
    path('school-decision/<int:decision_id>/', views.SchoolDecisionUpdateAPIView.as_view(), name='update-school-decision'),
    path('student-choice/', views.StudentChoiceAPIView.as_view(), name='student-choice'),
    path('accepted-schools/', views.AcceptedSchoolsAPIView.as_view(), name='accepted-schools'),
    path('fee-payment/init/', views.FeePaymentInitAPIView.as_view(), name='init-fee-payment'),
    path('fee-calculation/', views.FeeCalculationAPIView.as_view(), name='fee-calculation'),
    path('documents/<int:application_id>/', views.DocumentUploadAPIView.as_view(), name='upload-documents'),
    path('enroll/', views.EnrollmentAPIView.as_view(), name='enroll-student'),
    path('withdraw/', views.WithdrawalAPIView.as_view(), name='withdraw-student'),
    
    # New endpoints for payment finalization and user allocation
    path('finalize-payment/', views.PaymentFinalizationAPIView.as_view(), name='finalize-payment'),
    path('allocate-user-id/', views.StudentUserAllocationAPIView.as_view(), name='allocate-user-id'),
    path('enrollment-status/', views.EnrollmentStatusAPIView.as_view(), name='enrollment-status'),
    
    path('', include(router.urls)),
]

app_name = 'admissions'