# Acharya ERP API Reference

## Overview
Comprehensive API documentation for the Acharya Educational Resource Planning system. All APIs follow RESTful conventions with consistent JSON responses and JWT-based authentication.

## Base Configuration

### Base URLs
- **Development**: `http://localhost:8000/api/v1/`
- **Production**: `https://your-domain.com/api/v1/`

### Authentication
All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_access_token>
```

### Standard Response Format
```json
{
  "success": true|false,
  "data": {...},
  "message": "Success/error message",
  "timestamp": "2025-09-17T12:00:00Z",
  "errors": [...] // Only on validation errors
}
```

### Pagination Format
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/v1/endpoint/?page=3",
  "previous": "http://localhost:8000/api/v1/endpoint/?page=1",
  "results": [...]
}
```

## Authentication APIs

### User Authentication
**Base URL:** `/api/v1/users/`

#### Login
```http
POST /api/v1/users/auth/login/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "student",
    "first_name": "John",
    "last_name": "Doe",
    "school": {
      "id": 1,
      "school_name": "Acharya Primary School"
    }
  }
}
```

#### Logout
```http
POST /api/v1/users/auth/logout/
Authorization: Bearer <token>
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

#### Get Current User
```http
GET /api/v1/users/auth/me/
Authorization: Bearer <token>
```

## Schools API

### Public School List
Get list of active schools for admission forms (no authentication required).

```http
GET /api/v1/schools/public/
```

**Response:**
```json
[
  {
    "id": 1,
    "school_name": "Acharya Primary School",
    "school_code": "APS001",
    "address": "123 Education Street, Jaipur",
    "phone_number": "+91-1234567890",
    "email": "info@aps001.edu.in"
  }
]
```

### School Statistics
Get comprehensive statistics for the logged-in admin's school.

```http
GET /api/v1/schools/stats/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalStudents": 150,
  "totalTeachers": 25,
  "totalStaff": 8,
  "totalWardens": 2,
  "activeParents": 120,
  "totalClasses": 12,
  "currentSemester": "Academic Session 2024-25",
  "school": {
    "name": "Acharya Primary School",
    "code": "APS001",
    "email": "info@aps001.edu.in",
    "phone": "+91-1234567890",
    "address": "123 Education Street, Jaipur"
  }
}
```

### School Dashboard Data
Get all dashboard data for the logged-in admin's school.

```http
GET /api/v1/schools/dashboard/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "students": [...],
  "teachers": [...],
  "staff": [...],
  "users": [...],
  "fees": [],
  "attendance": [],
  "exams": []
}
```

## Admissions API

### Email Verification

#### Request OTP
```http
POST /api/v1/admissions/verify-email/request/
Content-Type: application/json

{
  "email": "student@example.com",
  "applicant_name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully to your email address.",
  "expires_at": "2025-09-17T12:10:00Z"
}
```

#### Verify OTP
```http
POST /api/v1/admissions/verify-email/verify/
Content-Type: application/json

{
  "email": "student@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully.",
  "verification_token": "unique_token_for_application"
}
```

### Application Management

#### Submit Application
```http
POST /api/v1/admissions/applications/
Content-Type: application/json

{
  "applicant_name": "John Doe",
  "date_of_birth": "2005-06-15",
  "email": "student@example.com",
  "phone_number": "1234567890",
  "address": "123 Main St, City, State 12345",
  "course_applied": "Grade 10 - Science",
  "category": "general",
  "first_preference_school": 1,
  "second_preference_school": 2,
  "third_preference_school": null,
  "previous_school": "Previous School Name",
  "last_percentage": 85.5,
  "email_verification_token": "unique_token"
}
```

**Response:**
```json
{
  "id": 1,
  "reference_id": "ADM-2025-A1B2C3",
  "applicant_name": "John Doe",
  "status": "pending",
  "application_date": "2025-09-17T10:30:00Z",
  "course_applied": "Grade 10 - Science",
  "category": "general",
  "school_preferences": [
    {
      "preference": 1,
      "school": "Acharya Primary School"
    }
  ]
}
```

#### Track Application
```http
GET /api/v1/admissions/track/?reference_id=ADM-2025-A1B2C3
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reference_id": "ADM-2025-A1B2C3",
    "applicant_name": "John Doe",
    "course_applied": "Grade 10 - Science",
    "category": "general",
    "status": "under_review",
    "application_date": "2025-09-17T10:30:00Z",
    "school_decisions": [
      {
        "id": 1,
        "school": {
          "id": 1,
          "school_name": "Acharya Primary School"
        },
        "preference_order": 1,
        "decision": "accepted",
        "enrollment_status": "enrolled",
        "decision_date": "2025-09-18T14:30:00Z",
        "enrollment_date": "2025-09-19T09:00:00Z",
        "can_enroll": false,
        "can_withdraw": true
      }
    ]
  }
}
```

### School Review System

#### Get Applications for Review
```http
GET /api/v1/admissions/school-review/
Authorization: Bearer <token>
```

#### Update School Decision
```http
PATCH /api/v1/admissions/school-decision/<decision_id>/
Authorization: Bearer <token>
Content-Type: application/json

{
  "decision": "accepted",
  "notes": "Excellent academic record and good interview performance"
}
```

### Student Choice & Enrollment

#### Get Accepted Schools
```http
GET /api/v1/admissions/accepted-schools/?reference_id=ADM-2025-A1B2C3
```

#### Submit Student Choice
```http
POST /api/v1/admissions/student-choice/
Content-Type: application/json

{
  "reference_id": "ADM-2025-A1B2C3",
  "chosen_school": "Acharya Primary School"
}
```

#### Enroll Student
```http
POST /api/v1/admissions/enroll/
Content-Type: application/json

{
  "reference_id": "ADM-2025-A1B2C3",
  "school_name": "Acharya Primary School"
}
```

#### Withdraw Enrollment
```http
POST /api/v1/admissions/withdraw/
Content-Type: application/json

{
  "reference_id": "ADM-2025-A1B2C3",
  "school_name": "Acharya Primary School",
  "reason": "Changed preference"
}
```

#### Finalize Payment
Finalizes payment after enrollment, making it non-refundable and sending a receipt email.

```http
POST /api/v1/admissions/finalize-payment/
Content-Type: application/json

{
  "decision_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment finalized successfully. Enrollment is now non-refundable.",
  "data": {
    "id": 1,
    "is_payment_finalized": true,
    "payment_completed_at": "2025-09-19T10:30:00Z",
    "enrollment_status": "enrolled",
    "can_withdraw": false
  }
}
```

#### Allocate User ID
Allocates a student user ID and creates credentials for enrolled students with finalized payments.

```http
POST /api/v1/admissions/allocate-user-id/
Authorization: Bearer <token>
Content-Type: application/json

{
  "decision_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "User ID allocated successfully and credentials email sent.",
  "data": {
    "id": 1,
    "user_id_allocated": true,
    "user_id_allocated_at": "2025-09-19T11:00:00Z",
    "student_user": {
      "id": 15,
      "email": "student15@school.edu",
      "username": "student15"
    }
  }
}
```

#### Get Enrollment Status
Gets detailed enrollment status including payment and user ID allocation information.

```http
GET /api/v1/admissions/enrollment-status/?reference_id=ADM-2025-A1B2C3
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reference_id": "ADM-2025-A1B2C3",
    "applicant_name": "John Doe",
    "enrollment_status": "enrolled",
    "enrolled_school": "Acharya Primary School",
    "enrollment_date": "2025-09-19T09:00:00Z",
    "is_payment_finalized": true,
    "payment_completed_at": "2025-09-19T10:30:00Z",
    "user_id_allocated": true,
    "user_id_allocated_at": "2025-09-19T11:00:00Z",
    "can_withdraw": false,
    "student_credentials": {
      "email": "student15@school.edu",
      "username": "student15"
    }
  }
}
```

### Fee Calculation
```http
POST /api/v1/admissions/fee-calculation/
Content-Type: application/json

{
  "course": "Grade 10 - Science",
  "category": "general"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "course": "Grade 10 - Science",
    "category": "general",
    "fee_amount": 25000.00,
    "fee_structure": {
      "id": 1,
      "course": "class-10",
      "category": "general",
      "amount": 25000.00
    }
  }
}
```

## User Management API

### Students
```http
GET /api/v1/users/students/
POST /api/v1/users/students/
GET /api/v1/users/students/<id>/
PATCH /api/v1/users/students/<id>/
```

### Parents
```http
GET /api/v1/users/parents/
POST /api/v1/users/parents/
GET /api/v1/users/parents/<id>/
PATCH /api/v1/users/parents/<id>/
```

### Staff
```http
GET /api/v1/users/staff/
POST /api/v1/users/staff/
GET /api/v1/users/staff/<id>/
PATCH /api/v1/users/staff/<id>/
```

## Fee Management API

### Fee Structures
```http
GET /api/v1/fees/structures/
POST /api/v1/fees/structures/
```

### Fee Invoices
```http
GET /api/v1/fees/invoices/
GET /api/v1/fees/invoices/<id>/
POST /api/v1/fees/invoices/<id>/pay/
```

**Pay Invoice Request:**
```json
{
  "payment_method": "cash",
  "transaction_id": "TXN123456"
}
```

### Payments
```http
GET /api/v1/fees/payments/
```

## Attendance API

### Class Sessions
```http
GET /api/v1/attendance/sessions/
POST /api/v1/attendance/sessions/
```

### Attendance Records
```http
GET /api/v1/attendance/records/
POST /api/v1/attendance/records/
```

## Examination API

### Exams
```http
GET /api/v1/exams/exams/
POST /api/v1/exams/exams/
GET /api/v1/exams/exams/<id>/
```

### Exam Results
```http
GET /api/v1/exams/results/
POST /api/v1/exams/results/
GET /api/v1/exams/results/<id>/
```

## Hostel Management API

### Rooms
```http
GET /api/v1/hostel/rooms/
POST /api/v1/hostel/rooms/
```

### Allocations
```http
GET /api/v1/hostel/allocations/
POST /api/v1/hostel/allocate/
```

**Allocate Room Request:**
```json
{
  "student_id": 1,
  "room_id": 1,
  "allocation_date": "2025-09-17"
}
```

## Library API

### Books
```http
GET /api/v1/library/books/
POST /api/v1/library/books/
```

### Borrow Records
```http
GET /api/v1/library/borrow-records/
POST /api/v1/library/borrow-records/issue_book/
POST /api/v1/library/borrow-records/<id>/return_book/
```

**Issue Book Request:**
```json
{
  "book_id": 1,
  "student_id": 1,
  "due_date": "2025-10-17"
}
```

## Notifications API

### Notices
```http
GET /api/v1/notifications/notices/
POST /api/v1/notifications/notices/
```

### User Notifications
```http
GET /api/v1/notifications/user-notifications/
PATCH /api/v1/notifications/user-notifications/<id>/
```

**Mark as Read:**
```json
{
  "is_read": true
}
```

## Dashboard API

### Statistics
```http
GET /api/v1/dashboard/stats/
```

### Role-specific Dashboards
```http
GET /api/v1/dashboard/student/<student_id>/
GET /api/v1/dashboard/parent/<parent_id>/
GET /api/v1/dashboard/faculty/<faculty_id>/
GET /api/v1/dashboard/warden/
GET /api/v1/dashboard/admin/
```

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "message": "Error description",
  "timestamp": "2025-09-17T12:00:00Z",
  "errors": [
    "Detailed error message 1",
    "Detailed error message 2"
  ]
}
```

### Common HTTP Status Codes
- **200 OK**: Successful request
- **201 Created**: Resource created successfully
- **400 Bad Request**: Validation error or malformed request
- **401 Unauthorized**: Authentication required or invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

## Pagination Parameters
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

**Example:**
```http
GET /api/v1/users/students/?page=2&page_size=50
```

## Authentication Fixes

### JWT Token Blacklisting
- **Issue**: RefreshToken blacklist error on logout
- **Solution**: Added `rest_framework_simplejwt.token_blacklist` to INSTALLED_APPS
- **Result**: Proper token blacklisting for security

## File Upload Guidelines
- **Supported formats**: PDF, JPG, PNG
- **Maximum file size**: 5MB per file
- **Documents are virus-scanned** before storage
- **Files are served with proper security headers**

## Rate Limiting
- **Email OTP requests**: 2-minute cooldown between requests
- **Login attempts**: Standard rate limiting to prevent brute force attacks
- **API requests**: General rate limiting for API protection
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "admin",
      "school": {
        "id": 1,
        "school_name": "Sample School"
      }
    }
  }
}
```

#### Logout
```http
POST /api/v1/users/auth/logout/
Authorization: Bearer <token>

{
  "refresh": "jwt_refresh_token"
}
```

#### Current User
```http
GET /api/v1/users/auth/me/
Authorization: Bearer <token>
```

## Admission APIs

### Base URL: `/api/v1/admissions/`

#### Email Verification

##### Request OTP
```http
POST /api/v1/admissions/verify-email/request/
Content-Type: application/json

{
  "email": "student@example.com",
  "applicant_name": "Jane Doe"
}
```

##### Verify OTP
```http
POST /api/v1/admissions/verify-email/verify/
Content-Type: application/json

{
  "email": "student@example.com",
  "otp": "123456"
}
```

#### Application Management

##### Submit Application
```http
POST /api/v1/admissions/submit/
Content-Type: application/json
Authorization: Bearer <token>

{
  "email_verification_id": 1,
  "applicant_name": "Jane Doe",
  "date_of_birth": "2005-01-15",
  "email": "student@example.com",
  "phone_number": "+91-9876543210",
  "address": "123 Main St, City",
  "category": "general",
  "course_applied": "class-12",
  "previous_school": "Previous School Name",
  "last_percentage": 85.5,
  "first_preference_school": 1,
  "second_preference_school": 2,
  "third_preference_school": 3,
  "documents": {
    "tenth_certificate": "path/to/file.pdf",
    "character_certificate": "path/to/file.pdf"
  }
}
```

##### Track Application
```http
GET /api/v1/admissions/track/?reference_id=ADM-2025-ABC123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reference_id": "ADM-2025-ABC123",
    "applicant_name": "Jane Doe",
    "status": "under_review",
    "application_date": "2025-01-15T10:30:00Z",
    "school_decisions": [
      {
        "id": 1,
        "school": {
          "id": 1,
          "school_name": "Sample School"
        },
        "preference_order": "1st",
        "decision": "accepted",
        "enrollment_status": "enrolled",
        "enrollment_date": "2025-01-20T14:30:00Z"
      }
    ]
  }
}
```

#### Student Choice & Enrollment

##### Submit School Choice
```http
POST /api/v1/admissions/student-choice/
Content-Type: application/json

{
  "reference_id": "ADM-2025-ABC123",
  "chosen_school": "Sample School"
}
```

##### Enroll Student
```http
POST /api/v1/admissions/enroll/
Content-Type: application/json
Authorization: Bearer <token>

{
  "reference_id": "ADM-2025-ABC123",
  "decision_id": 1
}
```

##### Withdraw Enrollment
```http
POST /api/v1/admissions/withdraw/
Content-Type: application/json
Authorization: Bearer <token>

{
  "decision_id": 1,
  "withdrawal_reason": "Student relocated"
}
```

#### Fee Management

##### Calculate Fee
```http
POST /api/v1/admissions/fee-calculation/
Content-Type: application/json

{
  "reference_id": "ADM-2025-ABC123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reference_id": "ADM-2025-ABC123",
    "applicant_name": "Jane Doe",
    "course_applied": "class-12",
    "category": "general",
    "fee_structure": {
      "class_range": "11-12",
      "category": "general",
      "annual_fee_min": 300.00,
      "annual_fee_max": 1200.00,
      "total_fee": 300.00
    }
  }
}
```

##### Initialize Payment
```http
POST /api/v1/admissions/fee-payment/init/
Content-Type: application/json

{
  "reference_id": "ADM-2025-ABC123",
  "school_decision_id": 1
}
```

#### Document Management

##### Upload Documents
```http
POST /api/v1/admissions/documents/<application_id>/
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form fields:
- tenth_certificate: file
- character_certificate: file
- income_certificate: file
```

## Admin APIs

### Dashboard Data
```http
GET /api/v1/dashboard/admin/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "total_applications": 150,
      "pending_applications": 25,
      "approved_applications": 100,
      "rejected_applications": 25,
      "total_decisions": 200,
      "enrolled_students": 85,
      "withdrawn_students": 5,
      "accepted_decisions": 120,
      "pending_decisions": 30
    },
    "recent_applications": [
      {
        "reference_id": "ADM-2025-A1B2C3",
        "applicant_name": "John Doe",
        "email": "john@example.com",
        "course_applied": "Grade 10 - Science",
        "application_date": "2025-09-17T10:30:00Z",
        "status": "approved",
        "first_preference_school": "Acharya Primary School",
        "enrollment_status": "ENROLLED",
        "enrolled_school": "Acharya Primary School",
        "accepted_schools_count": 2,
        "payment_status": "finalized",
        "user_id_status": "allocated"
      }
    ],
    "pending_reviews": [
      {
        "id": 1,
        "reference_id": "ADM-2025-B2C3D4",
        "applicant_name": "Jane Smith",
        "school_name": "Acharya Secondary School",
        "preference_order": "1st",
        "application_date": "2025-09-18T14:30:00Z",
        "course_applied": "Grade 11 - Commerce",
        "action_needed": "Review Application",
        "action_type": "review"
      }
    ],
    "allocation_pending": [
      {
        "id": 2,
        "reference_id": "ADM-2025-C3D4E5",
        "applicant_name": "Bob Johnson",
        "school_name": "Acharya Primary School",
        "enrollment_date": "2025-09-19T09:00:00Z",
        "payment_completed_at": "2025-09-19T10:30:00Z",
        "course_applied": "Grade 10 - Science",
        "action_needed": "Allot User ID",
        "action_type": "allocate_user_id"
      }
    ]
  }
}
```

### School Management

#### Get School Applications
```http
GET /api/v1/admissions/school-admissions/
Authorization: Bearer <token>
```

#### Create Admission Decision
```http
POST /api/v1/admissions/school-decision/
Content-Type: application/json
Authorization: Bearer <token>

{
  "application_id": 1,
  "school_id": 1,
  "decision": "accepted",
  "review_comments": "Good academic record"
}
```

#### Update Admission Decision
```http
PUT /api/v1/admissions/school-decision/<decision_id>/
Content-Type: application/json
Authorization: Bearer <token>

{
  "decision": "rejected",
  "review_comments": "Does not meet requirements"
}
```

## School APIs

### Base URL: `/api/v1/schools/`

#### Public School List
```http
GET /api/v1/schools/public/
```

#### School Statistics
```http
GET /api/v1/schools/stats/
Authorization: Bearer <token>
```

#### School Dashboard
```http
GET /api/v1/schools/dashboard/
Authorization: Bearer <token>
```

## Student Management APIs

### Base URL: `/api/v1/students/` (ViewSets)

#### List Students
```http
GET /api/v1/students/
Authorization: Bearer <token>
```

#### Get Student Detail
```http
GET /api/v1/students/<student_id>/
Authorization: Bearer <token>
```

#### Create Student
```http
POST /api/v1/students/
Content-Type: application/json
Authorization: Bearer <token>

{
  "user": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  },
  "admission_number": "2025001",
  "course": "class-12",
  "batch": "2024-25"
}
```

## Fee Management APIs

### Base URL: `/api/v1/fees/`

#### Fee Structures
```http
GET /api/v1/fees/fee-structures/
Authorization: Bearer <token>
```

#### Student Invoices
```http
GET /api/v1/fees/invoices/
Authorization: Bearer <token>
```

#### Payment Records
```http
GET /api/v1/fees/payments/
Authorization: Bearer <token>
```

## Attendance APIs

### Base URL: `/api/v1/attendance/`

#### Mark Attendance
```http
POST /api/v1/attendance/records/
Content-Type: application/json
Authorization: Bearer <token>

{
  "student": 1,
  "date": "2025-01-15",
  "status": "present",
  "period": "morning"
}
```

#### Get Attendance Records
```http
GET /api/v1/attendance/records/?student=1&date=2025-01-15
Authorization: Bearer <token>
```

## Exam APIs

### Base URL: `/api/v1/exams/`

#### Exam Schedules
```http
GET /api/v1/exams/schedules/
Authorization: Bearer <token>
```

#### Student Results
```http
GET /api/v1/exams/results/?student=1
Authorization: Bearer <token>
```

#### Grade Reports
```http
GET /api/v1/exams/grade-reports/
Authorization: Bearer <token>
```

## Hostel Management APIs

### Base URL: `/api/v1/hostel/`

#### Room Allocation
```http
POST /api/v1/hostel/allocate/
Content-Type: application/json
Authorization: Bearer <token>

{
  "student": 1,
  "room": 101,
  "allocation_date": "2025-01-15"
}
```

#### Room Change Request
```http
POST /api/v1/hostel/room-change-request/
Content-Type: application/json
Authorization: Bearer <token>

{
  "current_room": 101,
  "requested_room": 102,
  "reason": "Medical reasons"
}
```

## Library APIs

### Base URL: `/api/v1/library/`

#### Book Catalog
```http
GET /api/v1/library/books/
Authorization: Bearer <token>
```

#### Borrow Book
```http
POST /api/v1/library/borrow/
Content-Type: application/json
Authorization: Bearer <token>

{
  "book": 1,
  "student": 1,
  "due_date": "2025-02-15"
}
```

#### Return Book
```http
POST /api/v1/library/borrow/<record_id>/return/
Authorization: Bearer <token>
```

## Notification APIs

### Base URL: `/api/v1/notifications/`

#### User Notifications
```http
GET /api/v1/notifications/
Authorization: Bearer <token>
```

#### Mark as Read
```http
PATCH /api/v1/notifications/<notification_id>/
Content-Type: application/json
Authorization: Bearer <token>

{
  "is_read": true
}
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 422 | Unprocessable Entity - Validation errors |
| 500 | Internal Server Error - Server error |

## Rate Limiting
- General endpoints: 100 requests per minute
- Authentication endpoints: 10 requests per minute
- File upload endpoints: 5 requests per minute

## Pagination
List endpoints support pagination with query parameters:
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

**Example:**
```http
GET /api/v1/students/?page=2&page_size=50
```

## Schools API

### School Statistics
Get comprehensive statistics for the logged-in admin's school.

```http
GET /api/v1/schools/stats/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalStudents": 5,
  "totalTeachers": 3,
  "totalStaff": 2,
  "totalWardens": 0,
  "activeParents": 0,
  "totalClasses": 3,
  "currentSemester": "Academic Session 2024-25",
  "school": {
    "name": "Test School 02402",
    "code": "RJ02402",
    "email": "admin@02402.rj.gov.in",
    "phone": "+91-9876543210",
    "address": "Test School Address, Test Village"
  }
}
```

### School Dashboard Data
Get all dashboard data for the logged-in admin's school.

```http
GET /api/v1/schools/dashboard/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "students": [...],
  "teachers": [...],
  "staff": [...],
  "users": [...],
  "fees": [],
  "attendance": [],
  "exams": []
}
```

## Authentication Fixes

### JWT Token Blacklisting
- **Issue**: RefreshToken blacklist error on logout
- **Solution**: Added `rest_framework_simplejwt.token_blacklist` to INSTALLED_APPS
- **Result**: Proper token blacklisting for security

## File Upload Guidelines
- Supported formats: PDF, JPG, PNG
- Maximum file size: 5MB per file
- Documents are virus-scanned before storage
- Files are served with proper security headers