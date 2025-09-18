from rest_framework import serializers
from .models import Book, BookBorrowRecord
from users.serializers import StudentProfileSerializer, StaffProfileSerializer


class BookSerializer(serializers.ModelSerializer):
    """Serializer for Book model"""
    
    class Meta:
        model = Book
        fields = '__all__'


class BookBorrowRecordSerializer(serializers.ModelSerializer):
    """Serializer for BookBorrowRecord model"""
    book_title = serializers.CharField(source='book.title', read_only=True)
    book_author = serializers.CharField(source='book.author', read_only=True)
    book_isbn = serializers.CharField(source='book.isbn', read_only=True)
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    issued_by_name = serializers.CharField(source='issued_by.user.get_full_name', read_only=True)
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = BookBorrowRecord
        fields = '__all__'
        read_only_fields = ['borrowed_date']
    
    def get_is_overdue(self, obj):
        """Check if the book is overdue"""
        if obj.status == 'borrowed' and obj.due_date:
            from django.utils import timezone
            return obj.due_date < timezone.now().date()
        return False


class BookBorrowRecordDetailSerializer(BookBorrowRecordSerializer):
    """Detailed serializer for BookBorrowRecord with nested relationships"""
    book = BookSerializer(read_only=True)
    student = StudentProfileSerializer(read_only=True)
    issued_by = StaffProfileSerializer(read_only=True)
    
    class Meta(BookBorrowRecordSerializer.Meta):
        fields = '__all__'