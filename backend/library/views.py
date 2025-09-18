from django.shortcuts import render
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Book, BookBorrowRecord
from .serializers import BookSerializer, BookBorrowRecordSerializer


class BookViewSet(viewsets.ModelViewSet):
    """ViewSet for books"""
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'author', 'isbn', 'category', 'publisher']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(author__icontains=search) |
                Q(isbn__icontains=search)
            )
        
        return queryset.order_by('title')


class BookBorrowRecordViewSet(viewsets.ModelViewSet):
    """ViewSet for book borrow records"""
    queryset = BookBorrowRecord.objects.all()
    serializer_class = BookBorrowRecordSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['student__user__email', 'book__title', 'status']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by user role
        if self.request.user.role == 'student':
            # Students can only see their own borrow records
            student_profile = getattr(self.request.user, 'student_profile', None)
            if student_profile:
                queryset = queryset.filter(student=student_profile)
        elif self.request.user.role == 'parent':
            # Parents can see records for their children
            parent_profile = getattr(self.request.user, 'parent_profile', None)
            if parent_profile:
                children_ids = parent_profile.children.values_list('id', flat=True)
                queryset = queryset.filter(student__id__in=children_ids)
        
        return queryset.select_related('book', 'student__user', 'issued_by__user').order_by('-borrowed_date')

    @action(detail=False, methods=['get'])
    def borrow(self, request):
        """Get borrow records with filtering"""
        student_id = request.query_params.get('student')
        
        if student_id:
            # Filter by specific student
            queryset = self.get_queryset().filter(student__id=student_id)
        else:
            queryset = self.get_queryset()
        
        # Apply additional filters
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        if date_from:
            queryset = queryset.filter(borrowed_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(borrowed_date__lte=date_to)
        
        # Paginate results
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def issue_book(self, request):
        """Issue a book to a student"""
        book_id = request.data.get('book_id')
        student_id = request.data.get('student_id')
        
        try:
            book = Book.objects.get(id=book_id)
            student = request.user.student_profile if hasattr(request.user, 'student_profile') else None
            
            if not student and student_id:
                from users.models import StudentProfile
                student = StudentProfile.objects.get(id=student_id)
            
            if book.available_copies <= 0:
                return Response({'error': 'No copies available'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create borrow record
            borrow_record = BookBorrowRecord.objects.create(
                book=book,
                student=student,
                issued_by=request.user.staff_profile if hasattr(request.user, 'staff_profile') else None
            )
            
            # Update available copies
            book.available_copies -= 1
            book.save()
            
            serializer = self.get_serializer(borrow_record)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Book.DoesNotExist:
            return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def return_book(self, request, pk=None):
        """Return a borrowed book"""
        try:
            borrow_record = self.get_object()
            
            if borrow_record.status != 'borrowed':
                return Response({'error': 'Book is not currently borrowed'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Update record
            borrow_record.status = 'returned'
            borrow_record.returned_date = timezone.now().date()
            borrow_record.save()
            
            # Update available copies
            borrow_record.book.available_copies += 1
            borrow_record.book.save()
            
            serializer = self.get_serializer(borrow_record)
            return Response(serializer.data)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
