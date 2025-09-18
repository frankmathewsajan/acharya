from rest_framework import serializers
from .models import FeeStructure, FeeInvoice, Payment
from users.serializers import StudentProfileSerializer


class FeeStructureSerializer(serializers.ModelSerializer):
    """Serializer for FeeStructure model"""
    
    class Meta:
        model = FeeStructure
        fields = '__all__'


class FeeInvoiceSerializer(serializers.ModelSerializer):
    """Serializer for FeeInvoice model"""
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    course_name = serializers.CharField(source='fee_structure.course', read_only=True)
    semester = serializers.IntegerField(source='fee_structure.semester', read_only=True)
    fee_type_display = serializers.CharField(source='get_fee_type_display', read_only=True)
    days_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = FeeInvoice
        fields = '__all__'
        read_only_fields = ['invoice_number', 'created_date']
    
    def get_days_overdue(self, obj):
        """Calculate days overdue if status is overdue or pending past due date"""
        if obj.status in ['overdue', 'pending']:
            from django.utils import timezone
            today = timezone.now().date()
            if obj.due_date < today:
                return (today - obj.due_date).days
        return 0


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model"""
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    student_name = serializers.CharField(source='invoice.student.user.get_full_name', read_only=True)
    
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['payment_date']


class FeeInvoiceDetailSerializer(FeeInvoiceSerializer):
    """Detailed serializer for FeeInvoice with nested relationships"""
    student = StudentProfileSerializer(read_only=True)
    fee_structure = FeeStructureSerializer(read_only=True)
    payments = PaymentSerializer(many=True, read_only=True, source='payment_set')
    
    class Meta(FeeInvoiceSerializer.Meta):
        fields = '__all__'


class PaymentCreateSerializer(serializers.Serializer):
    """Serializer for creating payments"""
    payment_method = serializers.ChoiceField(choices=Payment.PAYMENT_METHOD_CHOICES)
    transaction_id = serializers.CharField(max_length=100)