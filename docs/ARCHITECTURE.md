# Acharya ERP System Architecture

## Overview

Acharya is a comprehensive Educational Resource Planning (ERP) system designed for multi-school management in Rajasthan. The system supports administrative functions across multiple educational institutions with role-based access control, dynamic admissions management, and comprehensive fee structures.

## System Architecture

### Technology Stack

**Backend Architecture (Django + DRF)**
- **Framework**: Django 5.2+ with Django REST Framework
- **Database**: SQLite (development) / PostgreSQL (production)
- **Authentication**: JWT with token blacklisting
- **API Design**: RESTful APIs with consistent response patterns
- **Package Management**: UV package manager
- **API Documentation**: drf-spectacular with OpenAPI/Swagger

**Frontend Architecture (React + TypeScript)**
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context + useState/useEffect
- **API Client**: Axios with custom error handling
- **Package Management**: npm

## Core Modules

### 1. User Management (`users/`)
- **Custom User Model**: Extended AbstractUser with role-based authentication
- **User Roles**: Student, Parent, Faculty, Warden, Admin
- **Profile Systems**:
  - `StudentProfile`: Extended student information with school association
  - `ParentProfile`: Parent information linked to students (no separate user account)
  - `StaffProfile`: Faculty, warden, and admin profiles
- **JWT Authentication**: Token-based authentication with refresh token rotation
- **API Endpoints**: Login, logout, profile management, role-based access

### 2. School Management (`schools/`)
- **Multi-School Support**: Centralized management of multiple schools
- **School Model**: School information, codes, contact details
- **User-School Association**: Users linked to specific schools
- **School Statistics**: Dashboard data for each school
- **API Endpoints**: School listing, statistics, dashboard data

### 3. Admissions (`admissions/`)

**Comprehensive Admission System**

#### Email Verification System
- **OTP-based Verification**: Secure 6-digit OTP with 10-minute expiry
- **Rate Limiting**: 2-minute cooldown between OTP requests
- **Attempt Limiting**: Maximum 3 verification attempts per OTP
- **Models**: `EmailVerification` with security controls

#### Multi-School Application Process
- **School Preferences**: Students can apply to up to 3 schools in preference order
- **Application Model**: `AdmissionApplication` with comprehensive fields
- **Document Support**: JSON-based document storage with upload capability
- **Reference ID System**: Unique tracking IDs (format: ADM-YYYY-XXXXXX)

#### School Decision System
- **Independent Review**: Each school reviews applications independently
- **Decision Tracking**: `SchoolAdmissionDecision` model per school per application
- **Decision States**: pending, under_review, accepted, rejected, waitlisted
- **Enrollment Management**: Track enrollment status and dates

#### Student Choice Workflow
- **Multiple Acceptances**: Students can be accepted by multiple schools
- **Student Choice**: Students choose their preferred school from acceptances
- **Enrollment Control**: Single enrollment enforcement
- **Withdrawal Support**: Students can withdraw and re-enroll elsewhere

#### Fee Integration System
- **Category-based Fees**: Different fee structures by category (general, OBC, SC/ST)
- **Class-wise Fees**: Fee calculation based on course and category
- **Fee Models**: `FeeStructure` with regex-based course matching
- **Payment Integration**: Linked to fee management system

#### Payment Finalization & User ID Allocation Workflow
- **Automatic Payment Finalization**: Upon enrollment, payment is automatically finalized
- **Non-Refundable Policy**: Once payment is finalized, enrollment becomes non-refundable
- **Withdrawal Restriction**: Students cannot withdraw after payment finalization
- **Email Notifications**: Automated receipt emails sent upon payment finalization
- **User ID Allocation Process**:
  - Admin reviews students with finalized payments
  - Manual allocation of unique student user IDs
  - Automated student account creation
  - Credential email delivery to students
  - Timestamp tracking for audit purposes
- **Security Features**:
  - Immutable payment status once finalized
  - Audit trail for all user ID allocations
  - Role-based access control for allocation actions
- **Workflow States**:
  1. **Enrollment**: Student enrolls and payment is finalized automatically
  2. **Payment Finalized**: Non-refundable state, receipt email sent
  3. **Admin Review**: Admin sees student in allocation pending list
  4. **User ID Allocation**: Admin allocates user ID, student account created
  5. **Credentials Delivered**: Student receives login credentials via email

**Enhanced API Endpoints:**
- Email verification: `/verify-email/request/`, `/verify-email/verify/`
- Applications: CRUD operations with school preferences
- Tracking: Public tracking by reference ID with payment/user ID status
- School review: School-specific application lists
- Decision management: Accept/reject applications
- Student choice: Choose from accepted schools
- Enrollment: Enroll/withdraw from schools (with payment finalization)
- Payment finalization: `/finalize-payment/` (automatic on enrollment)
- User ID allocation: `/allocate-user-id/` (admin-triggered)
- Enrollment status: `/enrollment-status/` (detailed status with payment/user ID info)
- Fee calculation: Calculate fees by course and category

### 4. Fee Management (`fees/`)
- **Fee Structures**: Course and category-based fee calculation
- **Invoice System**: Automated invoice generation
- **Payment Processing**: Payment tracking and receipt generation
- **Models**: `FeeStructure`, `FeeInvoice`, `Payment`
- **API Endpoints**: Fee structures, invoices, payment processing

### 5. Attendance Management (`attendance/`)
- **Class Sessions**: Session-based attendance tracking
- **Attendance Records**: Individual student attendance records
- **Bulk Operations**: Mark attendance for entire classes
- **Models**: `ClassSession`, `AttendanceRecord`
- **API Endpoints**: Session management, attendance marking, reporting

### 6. Examination System (`exams/`)
- **Exam Management**: Create and manage examinations
- **Result Processing**: Grade entry and result calculation
- **Grade System**: Comprehensive grading with A+ to F scale
- **Models**: `Exam`, `ExamResult`
- **API Endpoints**: Exam CRUD, result entry, grade reporting

### 7. Hostel Management (`hostel/`)
- **Room Management**: Hostel room allocation and tracking
- **Student Allocation**: Room assignment and change requests
- **Occupancy Tracking**: Room capacity and availability
- **Models**: `HostelRoom`, `HostelAllocation`
- **API Endpoints**: Room management, allocation, change requests

### 8. Library Management (`library/`)
- **Book Catalog**: Complete book inventory management
- **Borrowing System**: Book issue and return tracking
- **Fine Management**: Overdue fine calculation
- **Models**: `Book`, `BookBorrowRecord`
- **API Endpoints**: Book management, borrowing operations

### 9. Notification System (`notifications/`)
- **Notice Management**: School-wide announcements
- **User Notifications**: Personalized notifications
- **Read Status**: Track notification read status
- **Models**: `Notice`, `UserNotification`
- **API Endpoints**: Notice CRUD, notification management

### 10. Dashboard System (`dashboard/`)
- **Role-based Dashboards**: Different dashboards per user role
- **Statistics API**: Comprehensive statistics for each role
- **Real-time Data**: Live dashboard updates
- **API Endpoints**: Role-specific dashboard data, statistics

#### Enhanced Admin Dashboard for Admission Management
- **Comprehensive Statistics**: Total applications, enrollments, pending reviews, withdrawals
- **Recent Applications Table**: Real-time view with payment and user ID status columns
- **Pending Reviews Section**: Applications awaiting school decision
- **User ID Allocation Queue**: Students with finalized payments ready for ID allocation
- **Action-Oriented Interface**: One-click "Allot User ID" buttons for eligible students
- **Status Indicators**: Visual badges for payment finalization and user ID allocation states
- **Auto-Refresh**: Dashboard updates after user ID allocation actions
- **Audit Trail**: Tracks who allocated user IDs and when for compliance

**Enhanced Dashboard Features:**
- Payment status tracking (pending, finalized, not_applicable)
- User ID allocation status (pending, allocated, not_applicable)
- Non-refundable enrollment indicators
- Integrated workflow management for admin tasks
- Real-time student credential delivery status

## Database Schema

### Core Models

**User System**
- `User` (Custom AbstractUser): Email-based authentication with roles
- `StudentProfile`: Student-specific information
- `ParentProfile`: Parent information (no separate user account)
- `StaffProfile`: Staff member information

**School System**
- `School`: School master data
- User-School relationships through foreign keys

**Admission System**
- `EmailVerification`: OTP management for email verification
- `AdmissionApplication`: Main application with school preferences
- `SchoolAdmissionDecision`: School-specific decisions and enrollment tracking
- `FeeStructure`: Class and category-based fee structures

**Academic System**
- `ClassSession`: Class session management
- `AttendanceRecord`: Student attendance tracking
- `Exam`: Examination management
- `ExamResult`: Student exam results

**Infrastructure**
- `HostelRoom`: Hostel room management
- `HostelAllocation`: Room allocation tracking
- `Book`: Library book catalog
- `BookBorrowRecord`: Book borrowing tracking

**Financial System**
- `FeeInvoice`: Student fee invoices
- `Payment`: Payment tracking

**Communication**
- `Notice`: School notices
- `UserNotification`: User-specific notifications

## API Design

### RESTful Architecture
- **Consistent Endpoints**: Standard REST patterns across all modules
- **Standardized Responses**: Consistent JSON response format
- **Error Handling**: Comprehensive error responses with proper HTTP status codes
- **Pagination**: Standard pagination for list endpoints

### Authentication & Authorization
- **JWT Authentication**: Access and refresh token system
- **Token Blacklisting**: Secure logout with token invalidation
- **Role-based Permissions**: Different access levels per user role
- **School-based Filtering**: Data filtered by user's associated school

### Response Format
```json
{
  "success": true|false,
  "data": {...},
  "message": "Success/error message",
  "timestamp": "ISO timestamp",
  "errors": [...] // Only on validation errors
}
```

## Frontend Architecture

### Component Structure
- **Page Components**: Role-based dashboard pages
- **UI Components**: Reusable shadcn/ui components
- **Layout Components**: Dashboard layouts and navigation
- **Form Components**: React Hook Form with Zod validation

### State Management
- **React Context**: Authentication and global state
- **React Query**: Server state management and caching
- **Local State**: Component-level state with hooks

### API Integration
- **Axios Client**: Configured HTTP client with interceptors
- **Service Layer**: Domain-specific API services
- **Error Handling**: Global error handling and user feedback
- **Authentication**: Automatic token management and refresh

### Routing
- **React Router**: Client-side routing with role-based guards
- **Protected Routes**: Authentication and authorization checks
- **Dynamic Routing**: Role-based dashboard routing

## Security Implementation

### Backend Security
- **Input Validation**: Comprehensive form and API validation
- **SQL Injection Protection**: Django ORM protection
- **XSS Protection**: Input sanitization and output encoding
- **CSRF Protection**: Django CSRF middleware
- **Rate Limiting**: API rate limiting for sensitive endpoints

### Authentication Security
- **JWT Security**: Secure token generation and validation
- **Password Security**: Django's built-in password validation
- **Session Management**: Secure session handling
- **Token Rotation**: Automatic refresh token rotation

### Data Protection
- **Role-based Access**: Strict permission controls
- **School Data Isolation**: Users can only access their school's data
- **Audit Logging**: Track important user actions
- **File Upload Security**: Secure file handling and validation

## System Fixes & Improvements

### Enrollment System Fixes

#### Admin Panel Status Display
- **Issue**: Admin panel showing "Pending" instead of actual database status
- **Solution**: Enhanced `SchoolAdmissionDecisionAdmin` with proper status display methods
- **Implementation**:
  - Added `get_decision_status()` with emoji indicators
  - Improved `get_enrollment_display()` with clear status messages
  - Added custom `save_model()` with validation and error handling

#### Enrollment Logic Improvements
- **Single Enrollment Enforcement**: Students can only be enrolled in one school at a time
- **Withdrawal Support**: Students can withdraw and re-enroll elsewhere
- **Re-enrollment Logic**: Enhanced `can_enroll()` logic to allow re-enrollment after withdrawal
- **Admin Validation**: Prevents invalid state changes (e.g., rejecting enrolled students)

#### Admin Detail View Fixes
- **Issue**: Static "School Decisions" section showing incorrect status
- **Solution**: Removed static display methods, kept dynamic inline display
- **Result**: Admin shows real-time database status via `SchoolAdmissionDecisionInline`

### Data Consistency & Validation
- **Enrollment Status Tracking**: Proper date tracking for enrollment and withdrawal
- **Multiple Enrollment Prevention**: Backend validation ensures single active enrollment
- **Status Synchronization**: Real-time updates between frontend and backend
- **Error Handling**: Clear validation messages for invalid operations

### Test Infrastructure
- **Test Organization**: All test files moved to `backend/test/` folder
- **Test Coverage**: Enrollment logic, data consistency, application status validation
- **Debug Tools**: Scripts for data cleanup and status verification

## Deployment Architecture

### Development Environment
- **Backend**: Django development server on port 8000
- **Frontend**: Vite development server on port 5173
- **Database**: SQLite for rapid development
- **Authentication**: JWT tokens with development settings

### Production Considerations
- **Database**: PostgreSQL for production reliability
- **Static Files**: CDN distribution for static assets
- **Security**: Production security settings and HTTPS
- **Monitoring**: Application and database monitoring
- **Scalability**: Load balancing and horizontal scaling

## Performance Optimization

### Database Optimization
- **Indexes**: Strategic database indexing for performance
- **Query Optimization**: Efficient ORM queries with select_related and prefetch_related
- **Pagination**: Consistent pagination across all list endpoints

### Frontend Optimization
- **Code Splitting**: Route-based code splitting for optimal loading
- **Caching**: React Query caching for server state
- **Bundle Optimization**: Vite optimization for production builds

### API Optimization
- **Response Compression**: Gzip compression for API responses
- **Caching Headers**: Appropriate cache headers for static content
- **Connection Pooling**: Database connection optimization

## Future Enhancements

### Planned Features
- **Real-time Notifications**: WebSocket integration for live updates
- **Advanced Analytics**: Comprehensive reporting and analytics
- **Mobile Application**: React Native mobile app
- **Payment Gateway**: Integrated payment processing
- **Multi-language Support**: Internationalization support

### Technical Improvements
- **Microservices**: Potential migration to microservices architecture
- **Container Deployment**: Docker containerization
- **CI/CD Pipeline**: Automated testing and deployment
- **API Versioning**: Version management for API evolution

   

5. **Staff/Faculty Apps** (`staff/`, `parents/`)3. **Multi-School Acceptance**

   - Role-specific profile management   - Students can be accepted by multiple schools

   - Extended user information and relationships   - Choice interface for final school selection

   - Automatic notification system

6. **Academic Management** (`fees/`, `attendance/`, `exams/`, `library/`, `hostel/`)

   - Comprehensive academic and administrative modules### 4. Student Management (`students/`)

   - Each with REST APIs and admin interfaces- Student profiles and academic records

- Course and batch management

7. **System Apps** (`notifications/`, `reports/`, `analytics/`, `dashboard/`)- Academic progress tracking

   - System-wide utilities and reporting

   - Dashboard endpoints for role-specific views### 5. Staff Management (`staff/`)

- Faculty profiles and qualifications

#### Database Schema- Department management

- Teaching assignments

**Core Tables:**

- `users_user`: Custom user model with role field### 6. Fee Management (`fees/`)

- `schools_school`: School information and configuration- Fee structure configuration

- `admissions_emailverification`: Email OTP verification- Payment processing

- `admissions_admissionapplication`: Student applications- Invoice generation and tracking

- `admissions_schooladmissiondecision`: School-specific decisions and enrollment

- `admissions_feestructure`: Class and category-based fees### 7. Attendance System (`attendance/`)

- `students_student`: Student profiles and academic data- Daily attendance tracking

- Attendance reports

**Key Relationships:**- Integration with academic calendar

- User → Profile (Student/Staff/Parent) - One-to-One

- School → Applications - One-to-Many (via preferences)### 8. Examination System (`exams/`)

- Application → School Decisions - One-to-Many- Exam scheduling

- Application → Email Verification - Foreign Key- Result management

- Grade calculation

#### API Architecture

### 9. Hostel Management (`hostel/`)

**Authentication:**- Room allocation

- JWT tokens with access/refresh pattern- Hostel fee management

- Token blacklisting for secure logout- Warden oversight

- Role-based permissions per endpoint

### 10. Library Management (`library/`)

**Admission API Endpoints:**- Book catalog

```- Issue/return tracking

POST /api/admissions/verify-email/request/    # Request OTP- Fine management

POST /api/admissions/verify-email/verify/     # Verify OTP

POST /api/admissions/submit/                  # Submit application### 11. Notifications (`notifications/`)

GET /api/admissions/track/{ref_id}/           # Track application- System-wide notification system

POST /api/admissions/student-choice/          # Submit school choice- Email and in-app notifications

POST /api/admissions/enroll/                  # Enroll student- Role-based message targeting

POST /api/admissions/withdraw/                # Withdraw enrollment

POST /api/admissions/fee-calculation/         # Calculate fees### 12. Analytics & Reports (`analytics/`, `reports/`)

```- Dashboard analytics

- Custom report generation

**Admin API Endpoints:**- Data visualization

```

GET /api/dashboard/admin/                     # Admin dashboard data## Database Schema

GET /api/admissions/school-admissions/        # School's applications

POST /api/admissions/decisions/               # Create admission decision### Key Models

PUT /api/admissions/decisions/{id}/           # Update admission decision

```#### User & Authentication

- `User` (Django's built-in user model extended)

### Frontend Architecture- `StudentProfile`, `ParentProfile`, `StaffProfile`, etc.



#### Component Structure#### Admissions

```- `AdmissionApplication` - Main application data

src/- `SchoolAdmissionDecision` - School-specific admission decisions

├── components/          # Reusable UI components- Relationship: One application can have multiple school decisions

│   ├── ui/             # shadcn/ui components

│   └── ...             # Custom components#### Academic Management

├── pages/              # Route components- `School` - Multi-school support

│   ├── dashboards/     # Role-specific dashboards- `Course`, `Department`, `Batch`

│   ├── Admission.tsx   # Admission form- `FeeStructure`, `FeeInvoice`, `Payment`

│   └── TrackingPage.tsx # Application tracking

├── services/           # API service layers## API Endpoints

├── contexts/           # React contexts (Auth)

├── lib/               # Utilities and helpers### Authentication

└── styles/            # Global styles- `POST /api/auth/login/` - User login

```- `POST /api/auth/logout/` - User logout

- `GET /api/auth/user/` - Get current user

#### Key Features

### Admissions

1. **Multi-Role Dashboard System**- `POST /api/v1/admissions/verify-email/request/` - Request email OTP

   - `AdminDashboard.tsx`: Comprehensive school management- `POST /api/v1/admissions/verify-email/verify/` - Verify email OTP

   - `StudentDashboard.tsx`: Student portal- `POST /api/v1/admissions/applications/` - Submit application

   - `ParentDashboard.tsx`: Parent portal- `GET /api/v1/admissions/track/` - Track application status

   - Role-based sidebar and content- `GET /api/v1/admissions/school-review/` - Get applications for school review

- `PATCH /api/v1/admissions/school-decision/<id>/` - Update school decision

2. **Admission System**- `GET /api/v1/admissions/accepted-schools/` - Get accepted schools for student

   - `Admission.tsx`: Multi-step application form with email verification- `POST /api/v1/admissions/student-choice/` - Submit student's final choice

   - `TrackingPage.tsx`: Real-time application status tracking

   - Document upload and validation### School Management

   - Dynamic fee calculation display- `GET /api/schools/public/` - Get active schools (public)

- `GET /api/schools/stats/` - Get school statistics

3. **Admin Management**- `GET /api/schools/dashboard/` - Get dashboard data

   - Application review and decision making

   - Bulk operations for admissions## Security Features

   - Real-time status updates

   - Enrollment management### Authentication & Authorization

- Token-based authentication

#### State Management- Role-based access control (RBAC)

- React Context for authentication state- Permission-based endpoint protection

- Local state with hooks for component data

- API service layer for backend communication### Data Protection

- Email verification for admissions

### Key Features Implementation- Secure file upload handling

- SQL injection prevention

#### 1. Multi-School Admission Workflow- XSS protection



**Phase 1: Application Submission**### API Security

1. Email verification with OTP (10-minute expiry)- CORS configuration

2. Multi-step form with document upload- Rate limiting (configurable)

3. School preference selection (1st, 2nd, 3rd choice)- Input validation and sanitization

4. Automatic reference ID generation (ADM-YYYY-XXXXXX)

## Deployment Architecture

**Phase 2: School Review**

1. Each school independently reviews applications### Development Environment

2. School-specific admission decisions (Pending/Accepted/Rejected)- Django development server

3. Admin dashboard for bulk review operations- Vite development server

4. Notification system for decision updates- SQLite database

- Local file storage

**Phase 3: Student Choice & Enrollment**

1. Students track application status in real-time### Production Environment (Recommended)

2. Choice submission for accepted schools- **Backend**: Gunicorn + Nginx

3. Fee calculation based on class and category- **Frontend**: Static files served by Nginx

4. Enrollment confirmation with payment integration- **Database**: PostgreSQL

5. Withdrawal system with date tracking- **File Storage**: AWS S3 or local with backup

- **Monitoring**: Django logging + error tracking

#### 2. Category-Based Fee System

## Configuration Management

**Fee Structure:**

- Class ranges: 1-8, 9-10, 11-12### Environment Variables

- Categories: General, SC/ST/OBC/SBC```bash

- Flexible fee ranges (min-max) or fixed amounts# Database

- Dynamic calculation based on course and categoryDATABASE_URL=postgresql://user:pass@localhost/dbname



**Implementation:**# Email Configuration

- `FeeStructure.get_fee_for_student()` method with regex-based course parsingEMAIL_HOST=smtp.gmail.com

- API endpoint for real-time fee calculationEMAIL_PORT=587

- Frontend integration with enrollment workflowEMAIL_HOST_USER=your-email@gmail.com

EMAIL_HOST_PASSWORD=your-app-password

#### 3. Real-Time Status DisplayEMAIL_USE_TLS=True

DEFAULT_FROM_EMAIL=noreply@acharya-erp.com

**Status Types:**

- Application status: Pending, Under Review, Approved, Rejected# Django Settings

- Decision status per school: Pending, Accepted, RejectedSECRET_KEY=your-secret-key

- Enrollment status: Not Enrolled, Enrolled, WithdrawnDEBUG=False

- Overall status: Dynamically calculated from all school decisionsALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

```

**Frontend Implementation:**

- Dynamic badge components with color coding### Settings Structure

- Status aggregation logic for multiple school decisions- `settings.py` - Base settings

- Real-time updates without page refresh- Environment-specific overrides via `.env`

- Separate settings for development/production

### Security Model

## Development Guidelines

1. **Authentication**: JWT tokens with short-lived access tokens

2. **Authorization**: Role-based permissions at API level### Code Organization

3. **Data Protection**: Input validation and sanitization- Model-View-Serializer pattern for API endpoints

4. **File Upload Security**: Restricted file types and size limits- Service layer for complex business logic

5. **CORS Configuration**: Frontend-backend communication security- Consistent error handling and response formats



### Performance Considerations### API Design Principles

- RESTful resource naming

1. **Database Optimization**: Proper indexing on reference IDs and foreign keys- Consistent response structure

2. **API Pagination**: Default 20 items per page for large datasets- Proper HTTP status codes

3. **File Management**: Efficient document storage and retrieval- Comprehensive error messages

4. **Frontend Optimization**: Code splitting and lazy loading

5. **Caching Strategy**: Token caching and API response optimization### Frontend Architecture

- Component-based architecture

### Deployment Architecture- Custom hooks for API integration

- Centralized error handling

**Development:**- TypeScript for type safety

- SQLite database for local development

- Django development server## Testing Strategy

- Vite dev server for frontend

### Backend Testing

**Production:**- Unit tests for models and business logic

- PostgreSQL database with proper indexing- API endpoint testing

- Nginx reverse proxy with SSL- Integration tests for complex workflows

- Static file serving

- Environment-based configuration### Frontend Testing

- Component unit tests

### Monitoring & Maintenance- Integration tests for user workflows

- E2E testing for critical paths

1. **Logging**: Comprehensive logging for admissions and user actions

2. **Error Handling**: Consistent error response format## Performance Considerations

3. **Backup Strategy**: Database and document backup procedures

4. **Health Checks**: API endpoint monitoring### Database Optimization

5. **Performance Monitoring**: Database query optimization- Proper indexing on frequently queried fields

- Query optimization for dashboard views

### Recent Enhancements- Connection pooling for production



1. **Fixed Fee Calculation**: Improved regex-based course parsing for accurate fee mapping### Frontend Optimization

2. **Enhanced Status Display**: Comprehensive status aggregation across multiple schools- Code splitting for large applications

3. **Enrollment Management**: Complete enrollment/withdrawal workflow- Lazy loading of non-critical components

4. **Admin Dashboard**: Dynamic admissions management with real-time updates- Efficient state management

5. **Document Handling**: Secure file upload and viewing system

6. **Email Integration**: OTP verification and notification system### Caching Strategy

- Redis for session and API caching (production)

This architecture supports the complete lifecycle of multi-school admissions with robust state management, security, and scalability considerations.- Browser caching for static assets
- Database query caching

## Monitoring & Maintenance

### Logging
- Structured logging for API requests
- Error tracking and reporting
- User activity logging for security

### Backup Strategy
- Regular database backups
- File storage backups
- Configuration backup

### Maintenance Tasks
- Regular dependency updates
- Security patch management
- Performance monitoring and optimization

## Future Enhancements

### Planned Features
- Mobile application support
- Advanced analytics dashboard
- Integration with external systems
- Multi-language support

### Scalability Considerations
- Microservices architecture migration
- Database sharding for large datasets
- CDN integration for global access
- Load balancing for high availability

## Support & Documentation

### Developer Resources
- API documentation (auto-generated)
- Component library documentation
- Development setup guides
- Deployment instructions

### User Documentation
- User manuals by role
- Feature guides
- FAQ and troubleshooting
- Video tutorials

## System Fixes & Improvements

### Enrollment System Fixes

#### Admin Panel Status Display
- **Issue**: Admin panel showing "Pending" instead of actual database status
- **Solution**: Enhanced `SchoolAdmissionDecisionAdmin` with proper status display methods
- **Implementation**:
  - Added `get_decision_status()` with emoji indicators
  - Improved `get_enrollment_display()` with clear status messages
  - Added custom `save_model()` with validation and error handling

#### Enrollment Logic Improvements
- **Single Enrollment Enforcement**: Students can only be enrolled in one school at a time
- **Withdrawal Support**: Students can withdraw and re-enroll elsewhere
- **Re-enrollment Logic**: Enhanced `can_enroll()` logic to allow re-enrollment after withdrawal
- **Admin Validation**: Prevents invalid state changes (e.g., rejecting enrolled students)

#### Admin Detail View Fixes
- **Issue**: Static "School Decisions" section showing incorrect status
- **Solution**: Removed static display methods, kept dynamic inline display
- **Result**: Admin shows real-time database status via `SchoolAdmissionDecisionInline`

### Data Consistency & Validation
- **Enrollment Status Tracking**: Proper date tracking for enrollment and withdrawal
- **Multiple Enrollment Prevention**: Backend validation ensures single active enrollment
- **Status Synchronization**: Real-time updates between frontend and backend
- **Error Handling**: Clear validation messages for invalid operations

### Test Infrastructure
- **Test Organization**: All test files moved to `backend/test/` folder
- **Test Coverage**: Enrollment logic, data consistency, application status validation
- **Debug Tools**: Scripts for data cleanup and status verification