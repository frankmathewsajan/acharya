from django.db import models
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
import base64

# Constants from the migration guide
CHECKOUT_LIMIT = 3
DUE_DAYS = 14  # 2 weeks for library books
FINE_PER_DAY = 10  # Fine amount per day for overdue books

class LibraryBook(models.Model):
    """Model for books in the library system - both local collection and Google Books API cached results"""
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, null=True, blank=True)
    
    # Core book information
    isbn = models.CharField(max_length=13, null=True, blank=True)
    title = models.CharField(max_length=300)
    author = models.CharField(max_length=200)
    publisher = models.CharField(max_length=200, null=True, blank=True)
    publication_year = models.IntegerField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    category = models.CharField(max_length=100, null=True, blank=True)
    
    # Physical library management
    total_copies = models.IntegerField(default=0)  # 0 for Google Books only
    available_copies = models.IntegerField(default=0)
    shelf_location = models.CharField(max_length=50, null=True, blank=True)
    
    # Google Books API integration
    google_books_id = models.CharField(max_length=100, unique=True, null=True, blank=True)  # uid from Google Books
    image_links = models.URLField(null=True, blank=True)  # Cover image URL
    image_data = models.BinaryField(null=True, blank=True)  # Cached cover image
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    page_count = models.IntegerField(null=True, blank=True)  # pgno from migration
    audience_type = models.CharField(max_length=50, null=True, blank=True)  # type from migration
    saleability = models.BooleanField(default=False)
    last_search = models.CharField(max_length=255, null=True, blank=True)  # What search term found this book
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['school', 'category']),
            models.Index(fields=['school', 'title']),
            models.Index(fields=['google_books_id']),
            models.Index(fields=['last_search']),
        ]
    
    def __str__(self):
        school_name = self.school.school_name if self.school else "Global"
        return f"{self.title} by {self.author} [{school_name}]"
    
    @property
    def is_available_for_borrowing(self):
        """Check if book is available for borrowing (has physical copies)"""
        return self.available_copies > 0
    
    @property
    def is_purchasable(self):
        """Check if book can be purchased (has price and is saleable)"""
        return self.saleability and self.price and self.price > 0

class UserBook(models.Model):
    """Model for tracking user's relationship with books - borrowed, purchased, etc."""
    
    TYPE_CHOICES = [
        ('BORROWED', 'Borrowed'),
        ('PURCHASED', 'Purchased'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('returned', 'Returned'),
        ('lost', 'Lost'),
        ('damaged', 'Damaged'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    book = models.ForeignKey(LibraryBook, on_delete=models.CASCADE)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Borrowing specific fields
    borrowed_date = models.DateTimeField(null=True, blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    returned_date = models.DateTimeField(null=True, blank=True)
    issued_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='issued_books')
    
    # Purchase specific fields  
    purchased_date = models.DateTimeField(null=True, blank=True)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Fine management
    fine_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    fine_paid = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user', 'type', 'status']),
            models.Index(fields=['book', 'type']),
            models.Index(fields=['due_date', 'status']),
        ]
        unique_together = [
            ['user', 'book', 'type']  # Prevent duplicate borrowing/purchasing
        ]
    
    def save(self, *args, **kwargs):
        # Set due date for borrowed books
        if self.type == 'BORROWED' and not self.due_date and self.borrowed_date:
            self.due_date = self.borrowed_date + timedelta(days=DUE_DAYS)
        
        # Set purchased date if purchasing
        if self.type == 'PURCHASED' and not self.purchased_date:
            self.purchased_date = timezone.now()
            
        super().save(*args, **kwargs)
    
    def calculate_fine(self):
        """Calculate fine for overdue books"""
        if self.type != 'BORROWED' or self.status != 'active' or not self.due_date:
            return 0
            
        if timezone.now() > self.due_date:
            days_overdue = (timezone.now() - self.due_date).days
            return max(0, days_overdue * FINE_PER_DAY)
        return 0
    
    def __str__(self):
        return f"{self.book.title} - {self.user.username} ({self.type})"

class Search(models.Model):
    """Model for tracking search queries and suggestions"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)  # None for SYSTEM searches
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, null=True, blank=True)
    query = models.CharField(max_length=255)
    result_count = models.IntegerField(default=0)
    source = models.CharField(max_length=20, choices=[('google', 'Google Books'), ('local', 'Local Library')], default='google')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['school', 'created_at']),
            models.Index(fields=['query', 'source']),
        ]
    
    def __str__(self):
        user_name = self.user.username if self.user else 'SYSTEM'
        return f"'{self.query}' by {user_name}"

class LibraryTransaction(models.Model):
    """Model for tracking library-related financial transactions"""
    
    TRANSACTION_TYPES = [
        ('fine_payment', 'Fine Payment'),
        ('book_purchase', 'Book Purchase'),
        ('damage_fee', 'Damage Fee'),
        ('deposit', 'Security Deposit'),
        ('refund', 'Refund'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    user_book = models.ForeignKey(UserBook, on_delete=models.CASCADE, null=True, blank=True)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_library_transactions')
    
    class Meta:
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['transaction_type', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.get_transaction_type_display()}: ${self.amount}"


class BookRequest(models.Model):
    """Model for student book requests to librarian"""
    URGENCY_CHOICES = [
        ('low', 'Low - No rush'),
        ('medium', 'Medium - Within a month'),
        ('high', 'High - Needed soon'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('ordered', 'Ordered'),
        ('available', 'Available'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Request details
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='book_requests')
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, null=True, blank=True)
    
    # Book information
    title = models.CharField(max_length=300)
    author = models.CharField(max_length=200)
    isbn = models.CharField(max_length=13, null=True, blank=True)
    publisher = models.CharField(max_length=200, null=True, blank=True)
    publication_year = models.IntegerField(null=True, blank=True)
    
    # Request metadata
    reason = models.TextField(help_text="Why do you need this book?")
    urgency = models.CharField(max_length=10, choices=URGENCY_CHOICES, default='medium')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    
    # Admin response
    admin_notes = models.TextField(null=True, blank=True, help_text="Internal notes from librarian")
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='reviewed_book_requests'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    # Associated book (if approved and added to library)
    library_book = models.ForeignKey(LibraryBook, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['school', 'status']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} requested '{self.title}' by {self.author} - {self.status}"


# Keep the original models for backward compatibility but mark as deprecated
class Book(LibraryBook):
    """Deprecated: Use LibraryBook instead"""
    class Meta:
        proxy = True

class BookBorrowRecord(UserBook):
    """Deprecated: Use UserBook instead"""
    class Meta:
        proxy = True
