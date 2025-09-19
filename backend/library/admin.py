from django.contrib import admin
from .models import LibraryBook, UserBook, Search, LibraryTransaction


@admin.register(LibraryBook)
class LibraryBookAdmin(admin.ModelAdmin):
    """Admin configuration for LibraryBook model"""
    
    list_display = ['title', 'author', 'isbn', 'category', 'total_copies', 'available_copies', 'school', 'saleability', 'price']
    list_filter = ['category', 'publication_year', 'school', 'saleability', 'audience_type']
    search_fields = ['title', 'author', 'isbn', 'publisher', 'google_books_id']
    readonly_fields = ['google_books_id', 'created_at', 'updated_at', 'last_search']
    
    fieldsets = (
        ('Book Information', {
            'fields': ('title', 'author', 'isbn', 'publisher', 'publication_year', 'description')
        }),
        ('Classification', {
            'fields': ('category', 'audience_type', 'shelf_location', 'school')
        }),
        ('Physical Inventory', {
            'fields': ('total_copies', 'available_copies')
        }),
        ('Digital/Purchase Info', {
            'fields': ('google_books_id', 'image_links', 'saleability', 'price', 'page_count'),
            'classes': ('collapse',)
        }),
        ('Search & Metadata', {
            'fields': ('last_search', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Filter books by user's school if not superuser"""
        qs = super().get_queryset(request)
        if not request.user.is_superuser and hasattr(request.user, 'school'):
            qs = qs.filter(school=request.user.school)
        return qs


@admin.register(UserBook)
class UserBookAdmin(admin.ModelAdmin):
    """Admin configuration for UserBook model"""
    
    list_display = ['book_title', 'user_name', 'type', 'status', 'borrowed_date', 'due_date', 'fine_amount']
    list_filter = ['type', 'status', 'borrowed_date', 'due_date']
    search_fields = ['book__title', 'user__username', 'user__email', 'book__isbn']
    readonly_fields = ['created_at', 'updated_at', 'fine_amount']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'book', 'type', 'status')
        }),
        ('Borrowing Details', {
            'fields': ('borrowed_date', 'due_date', 'returned_date', 'issued_by'),
            'classes': ('collapse',)
        }),
        ('Purchase Details', {
            'fields': ('purchased_date', 'purchase_price'),
            'classes': ('collapse',)
        }),
        ('Financial', {
            'fields': ('fine_amount', 'fine_paid'),
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def book_title(self, obj):
        return obj.book.title
    book_title.short_description = 'Book Title'
    book_title.admin_order_field = 'book__title'
    
    def user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    user_name.short_description = 'User'
    user_name.admin_order_field = 'user__username'
    
    def get_queryset(self, request):
        """Filter by user's school if not superuser"""
        qs = super().get_queryset(request)
        if not request.user.is_superuser and hasattr(request.user, 'school'):
            qs = qs.filter(book__school=request.user.school)
        return qs


@admin.register(Search)
class SearchAdmin(admin.ModelAdmin):
    """Admin configuration for Search model"""
    
    list_display = ['query', 'user_display', 'school', 'source', 'result_count', 'created_at']
    list_filter = ['source', 'school', 'created_at']
    search_fields = ['query', 'user__username']
    readonly_fields = ['created_at']
    
    def user_display(self, obj):
        return obj.user.username if obj.user else 'SYSTEM'
    user_display.short_description = 'User'
    user_display.admin_order_field = 'user__username'


@admin.register(LibraryTransaction)
class LibraryTransactionAdmin(admin.ModelAdmin):
    """Admin configuration for LibraryTransaction model"""
    
    list_display = ['user_name', 'transaction_type', 'amount', 'description', 'created_at']
    list_filter = ['transaction_type', 'created_at']
    search_fields = ['user__username', 'user__email', 'description']
    readonly_fields = ['created_at']
    
    def user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    user_name.short_description = 'User'
    user_name.admin_order_field = 'user__username'