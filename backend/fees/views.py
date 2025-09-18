from django.shortcuts import render

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
# from django_filters.rest_framework import DjangoFilterBackend
from .models import FeeStructure, FeeInvoice, Payment
from .serializers import (
    FeeStructureSerializer, FeeInvoiceSerializer, 
    PaymentSerializer, FeeInvoiceDetailSerializer
)
from admissions.models import SchoolAdmissionDecision

class FeeStructureViewSet(viewsets.ModelViewSet):
    """ViewSet for FeeStructure"""
    queryset = FeeStructure.objects.all()
    serializer_class = FeeStructureSerializer
    permission_classes = [IsAuthenticated]


class FeeInvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for FeeInvoice"""
    queryset = FeeInvoice.objects.all()
    serializer_class = FeeInvoiceSerializer
    permission_classes = [IsAuthenticated]
    # filter_backends = [DjangoFilterBackend]
    # filterset_fields = ['student', 'status']
    ordering = ['-created_date']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return FeeInvoiceDetailSerializer
        return FeeInvoiceSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filter based on user role
        if user.role == 'student':
            # Students can only see their own invoices
            try:
                student_profile = user.studentprofile
                queryset = queryset.filter(student=student_profile)
            except:
                queryset = queryset.none()
        elif user.role == 'parent':
            # Parents can see their children's invoices
            try:
                parent_profile = user.parentprofile
                children = parent_profile.children.all()
                queryset = queryset.filter(student__in=children)
            except:
                queryset = queryset.none()
        # Staff and admin can see all invoices
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def all_payments(self, request):
        """Get all payments for the current user including admission fees"""
        user = request.user
        all_payments = []
        
        # Get regular fee invoices
        queryset = self.get_queryset()
        fee_invoices = queryset.select_related('fee_structure', 'student__user')
        
        for invoice in fee_invoices:
            # Set description based on fee type
            if invoice.fee_type == 'hostel':
                description = invoice.description or f"Hostel Fee - Academic Year {invoice.academic_year}"
            elif invoice.fee_structure:
                description = f"Academic Fee - {invoice.fee_structure.course} Semester {invoice.fee_structure.semester}"
            else:
                description = invoice.description or f"{invoice.get_fee_type_display()} - Academic Year {invoice.academic_year}"
            
            payment_data = {
                'id': f"fee_{invoice.id}",
                'type': 'fee',
                'description': description,
                'amount': float(invoice.amount),
                'status': invoice.status,
                'due_date': invoice.due_date.isoformat() if invoice.due_date else None,
                'created_date': invoice.created_date.isoformat(),
                'invoice_number': invoice.invoice_number,
                'student_name': f"{invoice.student.first_name} {invoice.student.last_name}",
                'category': invoice.fee_type
            }
            
            # Add payment details if paid
            if invoice.status == 'paid':
                try:
                    payment = Payment.objects.filter(invoice=invoice).first()
                    if payment:
                        payment_data.update({
                            'payment_method': payment.payment_method,
                            'payment_date': payment.payment_date.isoformat(),
                            'transaction_id': payment.transaction_id
                        })
                except:
                    pass
            
            all_payments.append(payment_data)
        
        # Get admission fees if user is a student
        if user.role == 'student':
            try:
                # Find admission decisions for this student
                decisions = SchoolAdmissionDecision.objects.filter(
                    student_user=user,
                    enrollment_status='enrolled'
                ).select_related('application', 'school')
                
                for decision in decisions:
                    payment_data = {
                        'id': f"admission_{decision.id}",
                        'type': 'admission',
                        'description': f"Admission Fee - {decision.school.school_name}",
                        'amount': 50000,  # Default admission fee amount
                        'status': decision.payment_status,
                        'due_date': None,
                        'created_date': decision.enrollment_date.isoformat() if decision.enrollment_date else decision.decision_date.isoformat() if decision.decision_date else None,
                        'invoice_number': f"ADM-{decision.application.reference_id}",
                        'student_name': decision.application.applicant_name,
                        'category': 'admission_fee'
                    }
                    
                    if decision.payment_status == 'completed':
                        payment_data.update({
                            'payment_method': 'online',  # Default since we don't track method for admission
                            'payment_date': decision.payment_completed_at.isoformat() if decision.payment_completed_at else None,
                            'transaction_id': decision.payment_reference
                        })
                    
                    all_payments.append(payment_data)
            except Exception as e:
                # Log the error but continue
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error fetching admission payments for user {user.id}: {e}")
                pass
        
        # Sort by created_date (newest first)
        all_payments.sort(key=lambda x: x.get('created_date', ''), reverse=True)
        
        return Response({
            'success': True,
            'message': 'Payments retrieved successfully',
            'timestamp': timezone.now().isoformat(),
            'data': all_payments
        })

    @action(detail=False, methods=['get'])
    def invoices(self, request):
        """Get fee invoices for the current user"""
        queryset = self.get_queryset()
        
        # Apply filters
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
            
        # Apply pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def pay(self, request, pk=None):
        """Process payment for an invoice"""
        invoice = self.get_object()
        
        if invoice.status == 'paid':
            return Response(
                {'error': 'Invoice already paid'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Simple payment processing - in production, integrate with payment gateway
        transaction_id = request.data.get('transaction_id')
        payment_method = request.data.get('payment_method', 'online')
        
        if not transaction_id:
            return Response(
                {'error': 'Transaction ID is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create payment record
        payment = Payment.objects.create(
            invoice=invoice,
            transaction_id=transaction_id,
            amount=invoice.amount,
            payment_method=payment_method
        )
        
        # Update invoice status
        invoice.status = 'paid'
        invoice.save()
        
        return Response({
            'message': 'Payment successful',
            'payment': PaymentSerializer(payment).data,
            'invoice': FeeInvoiceSerializer(invoice).data
        })


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Payment (read-only)"""
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
