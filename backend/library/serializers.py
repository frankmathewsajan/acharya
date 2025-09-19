from rest_framework import serializers
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import LibraryBook, UserBook, Search, LibraryTransaction, BookRequest
from users.serializers import UserSerializer
import base64

User = get_user_model()

class LibraryBookSerializer(serializers.ModelSerializer):
    """Serializer for LibraryBook model"""
    
    # Computed fields
    is_available_for_borrowing = serializers.ReadOnlyField()
    is_purchasable = serializers.ReadOnlyField()
    current_user_borrowed = serializers.SerializerMethodField()
    current_user_purchased = serializers.SerializerMethodField()
    image_data_base64 = serializers.SerializerMethodField()
    
    class Meta:
        model = LibraryBook
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_current_user_borrowed(self, obj):
        """Check if current user has borrowed this book"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return UserBook.objects.filter(
                user=request.user,
                book=obj,
                type='BORROWED',
                status='active'
            ).exists()
        return False
    
    def get_current_user_purchased(self, obj):
        """Check if current user has purchased this book"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return UserBook.objects.filter(
                user=request.user,
                book=obj,
                type='PURCHASED'
            ).exists()
        return False
    
    def get_image_data_base64(self, obj):
        """Convert binary image data to base64 for frontend display"""
        if obj.image_data:
            try:
                return base64.b64encode(obj.image_data).decode('utf-8')
            except:
                return None
        return None

class UserBookSerializer(serializers.ModelSerializer):
    """Serializer for UserBook model"""
    
    # Related fields
    book_title = serializers.CharField(source='book.title', read_only=True)
    book_author = serializers.CharField(source='book.author', read_only=True)
    book_isbn = serializers.CharField(source='book.isbn', read_only=True)
    book_image_links = serializers.URLField(source='book.image_links', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    issued_by_name = serializers.CharField(source='issued_by.get_full_name', read_only=True)
    
    # Computed fields
    is_overdue = serializers.SerializerMethodField()
    days_overdue = serializers.SerializerMethodField()
    current_fine = serializers.SerializerMethodField()
    
    class Meta:
        model = UserBook
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'fine_amount']
    
    def get_is_overdue(self, obj):
        """Check if the book is overdue"""
        if obj.type == 'BORROWED' and obj.status == 'active' and obj.due_date:
            return timezone.now() > obj.due_date
        return False
    
    def get_days_overdue(self, obj):
        """Get number of days overdue"""
        if obj.type == 'BORROWED' and obj.status == 'active' and obj.due_date:
            if timezone.now() > obj.due_date:
                return (timezone.now() - obj.due_date).days
        return 0
    
    def get_current_fine(self, obj):
        """Get current calculated fine amount"""
        return obj.calculate_fine()

class UserBookDetailSerializer(UserBookSerializer):
    """Detailed serializer with nested book and user information"""
    book = LibraryBookSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    issued_by = UserSerializer(read_only=True)
    
    class Meta(UserBookSerializer.Meta):
        fields = '__all__'

class SearchSerializer(serializers.ModelSerializer):
    """Serializer for Search model"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    school_name = serializers.CharField(source='school.school_name', read_only=True)
    
    class Meta:
        model = Search
        fields = '__all__'
        read_only_fields = ['created_at']

class LibraryTransactionSerializer(serializers.ModelSerializer):
    """Serializer for LibraryTransaction model"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    processed_by_name = serializers.CharField(source='processed_by.get_full_name', read_only=True)
    book_title = serializers.CharField(source='user_book.book.title', read_only=True)
    
    class Meta:
        model = LibraryTransaction
        fields = '__all__'
        read_only_fields = ['created_at']

# Action serializers for specific operations
class BorrowBookSerializer(serializers.Serializer):
    """Serializer for borrowing a book"""
    book_id = serializers.IntegerField()
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True)

class ReturnBookSerializer(serializers.Serializer):
    """Serializer for returning a book"""
    user_book_id = serializers.IntegerField()
    condition = serializers.ChoiceField(
        choices=[('good', 'Good'), ('damaged', 'Damaged'), ('lost', 'Lost')],
        default='good'
    )
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True)

class PurchaseBookSerializer(serializers.Serializer):
    """Serializer for purchasing a book"""
    book_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(
        choices=[('balance', 'Account Balance'), ('card', 'Credit Card'), ('cash', 'Cash')],
        default='balance'
    )

class GoogleBooksSearchSerializer(serializers.Serializer):
    """Serializer for Google Books API search"""
    query = serializers.CharField(max_length=255)
    max_results = serializers.IntegerField(default=20, min_value=1, max_value=40)
    start_index = serializers.IntegerField(default=0, min_value=0)

# Keep backward compatibility serializers
class BookSerializer(LibraryBookSerializer):
    """Backward compatibility for Book model"""
    class Meta(LibraryBookSerializer.Meta):
        pass

class BookBorrowRecordSerializer(UserBookSerializer):
    """Backward compatibility for BookBorrowRecord model"""
    student_name = serializers.CharField(source='user.get_full_name', read_only=True)
    student_admission_number = serializers.SerializerMethodField()
    
    class Meta(UserBookSerializer.Meta):
        pass
    
    def get_student_admission_number(self, obj):
        """Get student admission number if user has student profile"""
        if hasattr(obj.user, 'student_profile'):
            return obj.user.student_profile.admission_number
        return None

class BookBorrowRecordDetailSerializer(UserBookDetailSerializer):
    """Backward compatibility for detailed BookBorrowRecord"""
    student = UserSerializer(source='user', read_only=True)
    
    class Meta(UserBookDetailSerializer.Meta):
        pass


class BookRequestSerializer(serializers.ModelSerializer):
    """Serializer for BookRequest model"""
    
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)
    library_book_title = serializers.CharField(source='library_book.title', read_only=True)
    
    class Meta:
        model = BookRequest
        fields = [
            'id', 'title', 'author', 'isbn', 'publisher', 'publication_year',
            'reason', 'urgency', 'status', 'admin_notes', 'library_book',
            'created_at', 'updated_at', 'reviewed_at',
            'user_name', 'user_email', 'school_name', 'reviewed_by_name', 'library_book_title'
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'reviewed_at', 'reviewed_by',
            'user_name', 'user_email', 'school_name', 'reviewed_by_name', 'library_book_title'
        ]
    
    def validate(self, data):
        """Validate book request data"""
        if not data.get('title') or not data.get('author'):
            raise serializers.ValidationError("Title and author are required")
        return data


class BookRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating book requests"""
    
    class Meta:
        model = BookRequest
        fields = ['title', 'author', 'isbn', 'publisher', 'publication_year', 'reason', 'urgency']
    
    def validate(self, data):
        """Validate book request creation data"""
        if not data.get('title') or not data.get('author'):
            raise serializers.ValidationError("Title and author are required")
        return data