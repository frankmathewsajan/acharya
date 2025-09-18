from django.contrib import admin
from .models import Book, BookBorrowRecord


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    """Admin configuration for Book model"""
    
    list_display = ['title', 'author', 'isbn', 'category', 'total_copies', 'available_copies', 'school']
    list_filter = ['category', 'publication_year', 'school']
    search_fields = ['title', 'author', 'isbn', 'publisher']
    readonly_fields = ['available_copies']
    
    fieldsets = (
        ('Book Information', {
            'fields': ('title', 'author', 'isbn', 'publisher', 'publication_year')
        }),
        ('Classification', {
            'fields': ('category', 'shelf_location', 'school')
        }),
        ('Inventory', {
            'fields': ('total_copies', 'available_copies')
        }),
    )
    
    def get_queryset(self, request):
        """Filter books by user's school if not superuser"""
        qs = super().get_queryset(request)
        if not request.user.is_superuser and hasattr(request.user, 'school'):
            qs = qs.filter(school=request.user.school)
        return qs

    def save_model(self, request, obj, form, change):
        """Set available_copies equal to total_copies if creating new book"""
        if not change:
            obj.available_copies = obj.total_copies
        super().save_model(request, obj, form, change)


@admin.register(BookBorrowRecord)
class BookBorrowRecordAdmin(admin.ModelAdmin):
    """Admin configuration for BookBorrowRecord model"""
    
    list_display = ['book', 'student', 'borrowed_date', 'due_date', 'returned_date', 'status', 'fine_amount']
    list_filter = ['status', 'borrowed_date', 'due_date', 'book__school']
    search_fields = [
        'book__title', 'book__author', 'book__isbn',
        'student__user__first_name', 'student__user__last_name',
        'student__admission_number'
    ]
    readonly_fields = ['borrowed_date']
    date_hierarchy = 'borrowed_date'
    
    fieldsets = (
        ('Borrow Information', {
            'fields': ('book', 'student', 'issued_by')
        }),
        ('Dates', {
            'fields': ('borrowed_date', 'due_date', 'returned_date')
        }),
        ('Status & Fine', {
            'fields': ('status', 'fine_amount')
        }),
    )
    
    def get_queryset(self, request):
        """Filter borrow records by user's school if not superuser"""
        qs = super().get_queryset(request)
        if not request.user.is_superuser and hasattr(request.user, 'school'):
            qs = qs.filter(book__school=request.user.school)
        return qs

    def save_model(self, request, obj, form, change):
        """Set issued_by to current user if creating new record"""
        if not change and hasattr(request.user, 'staffprofile'):
            obj.issued_by = request.user.staffprofile
        super().save_model(request, obj, form, change)
