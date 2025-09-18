from django.shortcuts import render

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
# from django_filters.rest_framework import DjangoFilterBackend
from .models import FeeStructure, FeeInvoice, Payment
from .serializers import (
    FeeStructureSerializer, FeeInvoiceSerializer, 
    PaymentSerializer, FeeInvoiceDetailSerializer
)

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
