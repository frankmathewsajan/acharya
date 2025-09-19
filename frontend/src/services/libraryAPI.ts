import { apiClient } from '@/lib/api/client';

// Types for Library System
export interface LibraryBook {
  id: number;
  school: number | null;
  isbn: string | null;
  title: string;
  author: string;
  publisher: string | null;
  publication_year: number | null;
  description: string | null;
  category: string | null;
  total_copies: number;
  available_copies: number;
  shelf_location: string | null;
  google_books_id: string | null;
  image_links: string | null;
  image_data: string | null;
  price: string | null;
  page_count: number | null;
  audience_type: string | null;
  saleability: boolean;
  last_search: string | null;
  created_at: string;
  updated_at: string;
  is_available_for_borrowing: boolean;
  is_purchasable: boolean;
  current_user_borrowed: boolean;
  current_user_purchased: boolean;
  image_data_base64: string | null;
}

export interface UserBook {
  id: number;
  user: number;
  book: number;
  type: 'BORROWED' | 'PURCHASED';
  status: 'active' | 'returned' | 'lost' | 'damaged';
  borrowed_date: string | null;
  due_date: string | null;
  returned_date: string | null;
  issued_by: number | null;
  purchased_date: string | null;
  purchase_price: string | null;
  fine_amount: string;
  fine_paid: boolean;
  created_at: string;
  updated_at: string;
  
  // Related fields
  book_title: string;
  book_author: string;
  book_isbn: string | null;
  book_image_links: string | null;
  user_name: string;
  user_email: string;
  issued_by_name: string | null;
  
  // Computed fields
  is_overdue: boolean;
  days_overdue: number;
  current_fine: string;
}

export interface UserBookDetail {
  id: number;
  user: any;
  book: LibraryBook;
  type: 'BORROWED' | 'PURCHASED';
  status: 'active' | 'returned' | 'lost' | 'damaged';
  borrowed_date: string | null;
  due_date: string | null;
  returned_date: string | null;
  issued_by: any;
  purchased_date: string | null;
  purchase_price: string | null;
  fine_amount: string;
  fine_paid: boolean;
  created_at: string;
  updated_at: string;
  
  // Related fields
  book_title: string;
  book_author: string;
  book_isbn: string | null;
  book_image_links: string | null;
  user_name: string;
  user_email: string;
  issued_by_name: string | null;
  
  // Computed fields
  is_overdue: boolean;
  days_overdue: number;
  current_fine: string;
}

export interface LibrarySearch {
  id: number;
  user: number | null;
  school: number | null;
  query: string;
  result_count: number;
  source: 'google' | 'local';
  created_at: string;
  user_name: string | null;
  school_name: string | null;
}

export interface LibraryTransaction {
  id: number;
  user: number;
  user_book: number | null;
  transaction_type: 'fine_payment' | 'book_purchase' | 'damage_fee' | 'deposit' | 'refund';
  amount: string;
  description: string | null;
  created_at: string;
  processed_by: number | null;
  user_name: string;
  user_email: string;
  processed_by_name: string | null;
  book_title: string | null;
}

export interface LibraryStats {
  borrowed_active: number;
  borrowed_total: number;
  purchased_total: number;
  overdue_count: number;
  total_fines: number;
  checkout_limit: number;
  can_borrow_more: boolean;
}

export interface BookSearchParams {
  q?: string;
  offline?: boolean;
  max_results?: number;
  start_index?: number;
  category?: string;
  available_only?: boolean;
  purchasable_only?: boolean;
}

export interface BorrowBookRequest {
  book_id: number;
  notes?: string;
}

export interface ReturnBookRequest {
  user_book_id: number;
  condition?: 'good' | 'damaged' | 'lost';
  notes?: string;
}

export interface PurchaseBookRequest {
  book_id: number;
  payment_method?: 'balance' | 'card' | 'cash';
}

export interface GoogleBooksSearchRequest {
  query: string;
  max_results?: number;
  start_index?: number;
}

export interface BookRequest {
  id: number;
  title: string;
  author: string;
  isbn: string | null;
  publisher: string | null;
  publication_year: number | null;
  reason: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'ordered' | 'available' | 'rejected' | 'cancelled';
  admin_notes: string | null;
  library_book: number | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  user_name: string;
  user_email: string;
  school_name: string | null;
  reviewed_by_name: string | null;
  library_book_title: string | null;
}

export interface BookRequestCreate {
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  publication_year?: number;
  reason: string;
  urgency: 'low' | 'medium' | 'high';
}

// Library API Service
export const libraryAPI = {
  // Book Management
  getBooks: async (params?: BookSearchParams): Promise<LibraryBook[]> => {
    try {
      const response = await apiClient.get('/library/books/', { params });
      return response.data?.results || response.data || [];
    } catch (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
  },

  getBook: async (bookId: number): Promise<LibraryBook> => {
    try {
      const response = await apiClient.get(`/library/books/${bookId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching book:', error);
      throw error;
    }
  },

  searchBooks: async (searchRequest: GoogleBooksSearchRequest | BookSearchParams): Promise<{
    success: boolean;
    source: 'google' | 'local';
    query: string;
    total_results: number;
    books: LibraryBook[];
  }> => {
    try {
      const response = await apiClient.post('/library/search/', searchRequest);
      return response.data;
    } catch (error) {
      console.error('Error searching books:', error);
      throw error;
    }
  },

  getSearchSuggestions: async (): Promise<{
    success: boolean;
    suggestions: LibrarySearch[];
  }> => {
    try {
      const response = await apiClient.get('/library/suggestions/');
      return response.data;
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      throw error;
    }
  },

  // User Book Management
  getUserBooks: async (params?: { type?: string; status?: string }): Promise<UserBook[]> => {
    try {
      const response = await apiClient.get('/library/user-books/', { params });
      return response.data?.results || response.data || [];
    } catch (error) {
      console.error('Error fetching user books:', error);
      throw error;
    }
  },

  getBorrowedBooks: async (): Promise<{
    success: boolean;
    borrowed_books: UserBookDetail[];
  }> => {
    try {
      const response = await apiClient.get('/library/borrowed/');
      return response.data;
    } catch (error) {
      console.error('Error fetching borrowed books:', error);
      throw error;
    }
  },

  getPurchasedBooks: async (): Promise<{
    success: boolean;
    purchased_books: UserBookDetail[];
  }> => {
    try {
      const response = await apiClient.get('/library/purchased/');
      return response.data;
    } catch (error) {
      console.error('Error fetching purchased books:', error);
      throw error;
    }
  },

  getOverdueBooks: async (): Promise<{
    success: boolean;
    overdue_books: UserBookDetail[];
  }> => {
    try {
      const response = await apiClient.get('/library/overdue/');
      return response.data;
    } catch (error) {
      console.error('Error fetching overdue books:', error);
      throw error;
    }
  },

  // Book Actions
  borrowBook: async (borrowRequest: BorrowBookRequest): Promise<{
    success: boolean;
    message: string;
    user_book: UserBookDetail;
  }> => {
    try {
      const response = await apiClient.post('/library/borrow/', borrowRequest);
      return response.data;
    } catch (error) {
      console.error('Error borrowing book:', error);
      throw error;
    }
  },

  returnBook: async (returnRequest: ReturnBookRequest): Promise<{
    success: boolean;
    message: string;
    fine_amount: number;
    user_book: UserBookDetail;
  }> => {
    try {
      const response = await apiClient.post('/library/return/', returnRequest);
      return response.data;
    } catch (error) {
      console.error('Error returning book:', error);
      throw error;
    }
  },

  purchaseBook: async (purchaseRequest: PurchaseBookRequest): Promise<{
    success: boolean;
    message: string;
    user_book: UserBookDetail;
  }> => {
    try {
      const response = await apiClient.post('/library/purchase/', purchaseRequest);
      return response.data;
    } catch (error) {
      console.error('Error purchasing book:', error);
      throw error;
    }
  },

  // Dashboard & Stats
  getLibraryStats: async (): Promise<{
    success: boolean;
    stats: LibraryStats;
  }> => {
    try {
      const response = await apiClient.get('/library/dashboard-stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching library stats:', error);
      throw error;
    }
  },

  // Transactions
  getTransactions: async (): Promise<LibraryTransaction[]> => {
    try {
      const response = await apiClient.get('/library/transactions/');
      return response.data?.results || response.data || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },

  // Search History
  getSearchHistory: async (): Promise<LibrarySearch[]> => {
    try {
      const response = await apiClient.get('/library/searches/');
      return response.data?.results || response.data || [];
    } catch (error) {
      console.error('Error fetching search history:', error);
      throw error;
    }
  },

  // Admin functions
  addBookToLibrary: async (bookData: Partial<LibraryBook>): Promise<LibraryBook> => {
    try {
      const response = await apiClient.post('/library/books/', bookData);
      return response.data;
    } catch (error: any) {
      console.error('Error adding book to library:', error);
      console.error('Error response:', error?.response?.data);
      throw error;
    }
  },

  updateBook: async (bookId: number, bookData: Partial<LibraryBook>): Promise<LibraryBook> => {
    try {
      const response = await apiClient.patch(`/library/books/${bookId}/`, bookData);
      return response.data;
    } catch (error) {
      console.error('Error updating book:', error);
      throw error;
    }
  },

  deleteBook: async (bookId: number): Promise<void> => {
    try {
      await apiClient.delete(`/library/books/${bookId}/`);
    } catch (error) {
      console.error('Error deleting book:', error);
      throw error;
    }
  },

  // Book Requests
  getBookRequests: async (): Promise<BookRequest[]> => {
    try {
      const response = await apiClient.get('/library/book-requests/');
      return response.data?.results || response.data || [];
    } catch (error) {
      console.error('📚 ERROR: Failed to fetch book requests:', error);
      throw error;
    }
  },

  createBookRequest: async (requestData: BookRequestCreate): Promise<{
    success: boolean;
    message: string;
    request: BookRequest;
  }> => {
    try {
      console.log('📚 DEBUG: Creating book request with data:', requestData);
      
      const response = await apiClient.post('/library/book-requests/', requestData);
      console.log('📚 DEBUG: Book request response:', response.data);
      
      return {
        success: true,
        message: 'Book request submitted successfully',
        request: response.data
      };
    } catch (error) {
      console.error('📚 ERROR: Failed to create book request:', error);
      throw error;
    }
  },

  approveBookRequest: async (requestId: number, adminNotes?: string): Promise<{
    success: boolean;
    message: string;
    request: BookRequest;
  }> => {
    try {
      const response = await apiClient.post(`/library/book-requests/${requestId}/approve/`, {
        admin_notes: adminNotes
      });
      return response.data;
    } catch (error) {
      console.error('📚 ERROR: Failed to approve book request:', error);
      throw error;
    }
  },

  rejectBookRequest: async (requestId: number, adminNotes?: string): Promise<{
    success: boolean;
    message: string;
    request: BookRequest;
  }> => {
    try {
      const response = await apiClient.post(`/library/book-requests/${requestId}/reject/`, {
        admin_notes: adminNotes
      });
      return response.data;
    } catch (error) {
      console.error('📚 ERROR: Failed to reject book request:', error);
      throw error;
    }
  },

  markBookRequestAvailable: async (requestId: number, libraryBookId?: number, adminNotes?: string): Promise<{
    success: boolean;
    message: string;
    request: BookRequest;
  }> => {
    try {
      const response = await apiClient.post(`/library/book-requests/${requestId}/mark_available/`, {
        library_book_id: libraryBookId,
        admin_notes: adminNotes
      });
      return response.data;
    } catch (error) {
      console.error('📚 ERROR: Failed to mark book request as available:', error);
      throw error;
    }
  },

  // Analytics for Admin
  getLibraryAnalytics: async (): Promise<{
    total_books: number;
    total_borrowed: number;
    total_overdue: number;
    total_fines: number;
    popular_books: LibraryBook[];
    recent_activities: UserBook[];
  }> => {
    try {
      const [books, userBooks, transactions] = await Promise.all([
        libraryAPI.getBooks(),
        libraryAPI.getUserBooks(),
        libraryAPI.getTransactions()
      ]);

      const totalBooks = books.length;
      const totalBorrowed = userBooks.filter(ub => ub.type === 'BORROWED' && ub.status === 'active').length;
      const totalOverdue = userBooks.filter(ub => ub.type === 'BORROWED' && ub.status === 'active' && ub.is_overdue).length;
      const totalFines = transactions
        .filter(t => t.transaction_type === 'fine_payment')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      // Get popular books (most borrowed)
      const bookBorrowCounts = userBooks
        .filter(ub => ub.type === 'BORROWED')
        .reduce((acc, ub) => {
          acc[ub.book] = (acc[ub.book] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);

      const popularBooks = books
        .map(book => ({
          ...book,
          borrow_count: bookBorrowCounts[book.id] || 0
        }))
        .sort((a, b) => b.borrow_count - a.borrow_count)
        .slice(0, 10);

      // Recent activities
      const recentActivities = userBooks
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20);

      return {
        total_books: totalBooks,
        total_borrowed: totalBorrowed,
        total_overdue: totalOverdue,
        total_fines: totalFines,
        popular_books: popularBooks,
        recent_activities: recentActivities
      };
    } catch (error) {
      console.error('Error fetching library analytics:', error);
      throw error;
    }
  }
};

export default libraryAPI;