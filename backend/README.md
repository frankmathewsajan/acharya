# Acharya School Management System - Backend

A comprehensive school management system built with Django and Django REST Framework, supporting multi-school operations, student admissions, attendance tracking, fee management, and more.

## Features

### Core Modules
- **Multi-School Support**: Manage multiple schools from a single platform
- **User Management**: Role-based access control (Admin, Faculty, Staff, Students, Parents)
- **Staff Management**: Complete staff onboarding with auto-generated emails and credentials
- **Student Admissions**: Complete admission workflow with email verification
- **Parent Authentication**: Email-based OTP authentication for parents to access student data
- **Attendance Management**: Track student attendance across classes
- **Fee Management**: Handle fee invoices, payments, and financial records
- **Examination System**: Manage exams, results, and grading
- **Hostel Management**: Room allocation and hostel administration
- **Library Management**: Book inventory and borrowing system
- **Notification System**: Real-time notifications and announcements

## Admission System

### Features
- **Multi-Step Application Form**: User-friendly form with progress tracking
  - Step 1: Basic Information
  - Step 2: Academic Information  
  - Step 3: Parent Information (Father & Mother required, Guardian optional)
  - Step 4: Additional Details
- **Email Verification**: Secure OTP-based email verification before submission
- **School Preferences**: Support for up to 3 school choices (first, second, third preference)
- **Reference ID System**: Unique tracking IDs for all applications (format: ADM-YYYY-XXXXXX)
- **Document Upload**: Support for application documents
- **Application Tracking**: Public tracking system using reference IDs
- **Admin Review System**: Admin interface for reviewing and managing applications
- **Email Notifications**: Automatic confirmation emails with tracking links

### Email Verification Workflow

#### 1. Request Email Verification
**Endpoint**: `POST /api/v1/admissions/verify-email/request/`

```json
{
  "email": "student@example.com",
  "applicant_name": "John Doe"
}
```

**Response**:
```json
{
  "success": true,
  "message": "OTP sent successfully to your email address."
}
```

#### 2. Verify Email with OTP
**Endpoint**: `POST /api/v1/admissions/verify-email/verify/`

```json
{
  "email": "student@example.com",
  "otp": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Email verified successfully.",
  "verification_token": "123456"
}
```

#### 3. Submit Application
**Endpoint**: `POST /api/v1/admissions/applications/`

```json
{
  "applicant_name": "John Doe",
  "date_of_birth": "2005-06-15",
  "email": "student@example.com",
  "phone_number": "1234567890",
  "address": "123 Main St, City, State 12345",
  "category": "general",
  "course_applied": "Grade 10 - Science",
  "first_preference_school": 1,
  "second_preference_school": 2,
  "third_preference_school": null,
  "previous_school": "Previous School Name",
  "last_percentage": 85.5,
  
  // Enhanced Parent Information
  "father_name": "Robert Doe",
  "father_phone": "9876543210",
  "father_email": "robert.doe@example.com",
  "father_occupation": "Software Engineer",
  "father_address": "123 Main St, City, State 12345",
  "father_aadhar": "123456789012",
  "father_qualification": "B.Tech Computer Science",
  "father_company": "Tech Solutions Inc.",
  "father_annual_income": 1200000,
  "father_emergency_contact": "9876543211",
  
  "mother_name": "Mary Doe",
  "mother_phone": "9876543212",
  "mother_email": "mary.doe@example.com",
  "mother_occupation": "Teacher",
  "mother_address": "123 Main St, City, State 12345",
  "mother_aadhar": "123456789013",
  "mother_qualification": "M.A. English Literature",
  "mother_company": "City Public School",
  "mother_annual_income": 800000,
  "mother_emergency_contact": "9876543213",
  
  // Guardian Information (optional, if different from parents)
  "guardian_name": "",
  "guardian_phone": "",
  "guardian_email": "",
  "guardian_relationship": "",
  "guardian_address": "",
  "guardian_aadhar": "",
  "guardian_qualification": "",
  "guardian_company": "",
  "guardian_annual_income": null,
  "guardian_emergency_contact": "",
  
  // Family and Emergency Information
  "primary_contact": "father",
  "family_annual_income": 2000000,
  "number_of_siblings": 2,
  "siblings_in_school": 1,
  "family_address": "123 Main St, City, State 12345",
  "emergency_contact_name": "Uncle John",
  "emergency_contact_phone": "9876543214",
  "emergency_contact_relationship": "Uncle",
  
  "email_verification_token": "123456"
}
```

#### Parent Information Fields Guide

The admission system collects comprehensive parent/guardian information in a structured 3-step process to ensure better communication and emergency preparedness:

**Step 3: Parent Information (Mandatory)**
- **Step 3a: Father & Mother Information (Required)**
- **Step 3b: Guardian Information (Optional)**

##### Father Information (Required Fields marked with *)
- **father_name***: Full name of the father
- **father_phone***: Primary phone number for father
- **father_email**: Email address for father
- **father_occupation***: Father's profession/job title
- **father_address***: Father's residential address
- **father_aadhar**: Father's Aadhar card number (for identity verification)
- **father_qualification**: Father's educational qualification
- **father_company**: Father's workplace/organization
- **father_annual_income**: Father's annual income (in INR)
- **father_emergency_contact**: Alternative contact number for father

##### Mother Information (Required Fields marked with *)
- **mother_name***: Full name of the mother
- **mother_phone***: Primary phone number for mother
- **mother_email**: Email address for mother
- **mother_occupation***: Mother's profession/job title
- **mother_address***: Mother's residential address
- **mother_aadhar**: Mother's Aadhar card number (for identity verification)
- **mother_qualification**: Mother's educational qualification
- **mother_company**: Mother's workplace/organization
- **mother_annual_income**: Mother's annual income (in INR)
- **mother_emergency_contact**: Alternative contact number for mother

##### Guardian Information (Optional - only if different from parents)
- **guardian_name**: Full name of guardian (if different from parents)
- **guardian_phone**: Primary phone number for guardian
- **guardian_email**: Email address for guardian
- **guardian_relationship**: Guardian's relationship to student (e.g., "Uncle", "Aunt", "Grandparent")
- **guardian_address**: Guardian's residential address
- **guardian_aadhar**: Guardian's Aadhar card number
- **guardian_qualification**: Guardian's educational qualification
- **guardian_company**: Guardian's workplace/organization
- **guardian_annual_income**: Guardian's annual income (in INR)
- **guardian_emergency_contact**: Alternative contact number for guardian

##### Family & Emergency Information
- **primary_contact**: Primary contact for school communications ("father", "mother", or "guardian")
- **family_annual_income**: Total family annual income (in INR)
- **number_of_siblings**: Total number of siblings (including the applicant)
- **siblings_in_school**: Number of siblings currently enrolled in school
- **family_address**: Primary family residence address
- **emergency_contact_name**: Name of emergency contact person
- **emergency_contact_phone**: Phone number of emergency contact
- **emergency_contact_relationship**: Relationship of emergency contact to student

**Response**:
```json
{
  "id": 1,
  "reference_id": "ADM-2025-A1B2C3",
  "applicant_name": "John Doe",
  "status": "pending",
  "application_date": "2025-01-17T10:30:00Z",
  // ... other fields
}
```

### Application Tracking
**Endpoint**: `GET /api/v1/admissions/track/?reference_id=ADM-2025-A1B2C3`

**Response**:
```json
{
  "success": true,
  "data": {
    "reference_id": "ADM-2025-A1B2C3",
    "applicant_name": "John Doe",
    "course_applied": "Grade 10 - Science",
    "status": "under_review",
    "first_preference_school": {
      "id": 1,
      "school_name": "Acharya Primary School",
      "school_code": "APS001"
    },
    "application_date": "2025-01-17T10:30:00Z",
    "review_comments": "",
    "school_decisions": [
      {
        "id": 1,
        "school": "Acharya Primary School",
        "status": "accepted",
        "review_date": "2025-01-18T14:30:00Z",
        "notes": "Excellent academic record"
      },
      {
        "id": 2,
        "school": "Acharya Secondary School",
        "status": "pending",
        "review_date": null,
        "notes": null
      }
    ]
  }
}
```

## Multi-School Review and Choice Workflow

### School-Specific Review System

The admission system supports independent review by each school in the student's preference list. Each school can accept or reject applications independently.

#### For School Managers/Admins

##### 1. Get Applications for Review
**Endpoint**: `GET /api/v1/admissions/school-review/`
- Returns applications where the current user's school is in the preference list
- Each application includes current decision status for the school

**Response**:
```json
[
  {
    "id": 1,
    "reference_id": "ADM-2025-A1B2C3",
    "full_name": "John Doe",
    "email": "student@example.com",
    "phone": "1234567890",
    "date_of_birth": "2005-06-15",
    "preferred_school_1": "Acharya Primary School",
    "preferred_school_2": "Acharya Secondary School",
    "status": "pending",
    "submitted_at": "2025-01-17T10:30:00Z",
    "school_decisions": [
      {
        "id": 1,
        "school": "Acharya Primary School",
        "status": "pending"
      }
    ]
  }
]
```

##### 2. Update School Decision
**Endpoint**: `PATCH /api/v1/admissions/school-decision/{decision_id}/`

```json
{
  "status": "accepted",  // "accepted", "rejected", or "pending"
  "notes": "Excellent academic record and good interview performance"
}
```

**Response**:
```json
{
  "id": 1,
  "school": "Acharya Primary School",
  "status": "accepted",
  "review_date": "2025-01-18T14:30:00Z",
  "notes": "Excellent academic record and good interview performance"
}
```

### Student Choice System

When a student is accepted by multiple schools, they must choose which school to attend.

#### 1. Get Accepted Schools
**Endpoint**: `GET /api/v1/admissions/accepted-schools/?reference_id=ADM-2025-A1B2C3`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "school": "Acharya Primary School",
      "school_name": "Acharya Primary School",
      "status": "accepted",
      "review_date": "2025-01-18T14:30:00Z",
      "notes": "Excellent academic record"
    },
    {
      "id": 3,
      "school": "Acharya Higher Secondary",
      "school_name": "Acharya Higher Secondary",
      "status": "accepted",
      "review_date": "2025-01-19T10:15:00Z",
      "notes": "Good performance in entrance test"
    }
  ]
}
```

#### 2. Submit Student Choice
**Endpoint**: `POST /api/v1/admissions/student-choice/`

```json
{
  "reference_id": "ADM-2025-A1B2C3",
  "chosen_school": "Acharya Primary School"
}
```

**Response**:
```json
{
  "success": true,
  "message": "School choice submitted successfully",
  "data": {
    "reference_id": "ADM-2025-A1B2C3",
    "chosen_school": "Acharya Primary School",
    "choice_date": "2025-01-20T09:30:00Z"
  }
}
```

### Workflow States

#### Application Status Flow
1. **pending** - Initial state after submission
2. **under_review** - At least one school is reviewing
3. **accepted** - Student has been accepted and made final choice
4. **rejected** - No schools accepted the application

#### School Decision Status
1. **pending** - School hasn't reviewed yet
2. **accepted** - School approved the application
3. **rejected** - School declined the application

### Frontend Integration

#### Manager Dashboard
- **Review Admissions Tab**: New tab in admin dashboard
- **School-Specific View**: Only shows applications relevant to manager's school
- **Quick Actions**: Accept/Reject buttons with notes
- **Status Tracking**: Visual indicators for decision status

#### Student Tracking Interface
- **Enhanced Tracking**: Shows decision from each school
- **Choice Interface**: Appears when multiple acceptances exist
- **Visual Feedback**: Clear status indicators and progress tracking
- **Responsive Design**: Works on mobile and desktop


## Email Configuration

### Development Setup
For development, emails are printed to the console:

```python
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

### Production Setup
Update the following settings in `config/settings.py`:

```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'  # Your SMTP server
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-app-password'
DEFAULT_FROM_EMAIL = 'admissions@yourschool.edu'
FRONTEND_URL = 'https://yourschool.edu'  # For email links
```

### Email Templates

#### OTP Verification Email
- **Subject**: "Verify Your Email - Acharya School Admission"
- **Content**: HTML email with OTP code and instructions
- **Expiry**: 10 minutes
- **Security**: 6-digit numeric OTP with attempt limits

#### Application Confirmation Email
- **Subject**: "Application Submitted Successfully - Reference #ADM-YYYY-XXXXXX"
- **Content**: Application details, reference ID, and tracking link
- **Features**: Direct link to tracking page, formatted school preferences

## Staff Management System

### Features
- **Multi-Step Staff Creation**: User-friendly 3-step form for creating staff accounts
- **Auto-Generated Credentials**: Automatic email and password generation based on school code
- **Role-Based Management**: Support for Faculty, Admin, Librarian, and Warden roles
- **School Linking**: Automatic linking of staff to their respective schools
- **Real-Time Preview**: Shows generated email during the creation process

### Staff Creation Workflow

#### 1. Create New Staff Member
**Endpoint**: `POST /api/v1/users/staff/`

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+91-9876543210",
  "role": "faculty",
  "employee_id": "12345",
  "department": "Mathematics",
  "designation": "Senior Teacher",
  "date_of_joining": "2024-09-01",
  "qualification": "M.Sc Mathematics, B.Ed",
  "experience_years": 5
}
```

**Response**:
```json
{
  "message": "Staff created successfully",
  "staff": {
    "id": 1,
    "user": {
      "id": 15,
      "first_name": "John",
      "last_name": "Doe",
      "email": "faculty.12345@ABCDE.rj.gov.in",
      "role": "faculty"
    },
    "school": {
      "id": 1,
      "school_name": "Sample School", 
      "school_code": "SAMPLE12345"
    },
    "employee_id": "12345",
    "department": "Mathematics",
    "designation": "Senior Teacher",
    "date_of_joining": "2024-09-01",
    "qualification": "M.Sc Mathematics, B.Ed",
    "experience_years": 5
  },
  "user_credentials": {
    "email": "faculty.12345@ABCDE.rj.gov.in",
    "default_password": "12345@ABCDE",
    "note": "Please ask the staff member to change their password on first login"
  }
}
```

### Email and Password Generation

#### Email Format
Staff emails are auto-generated using the pattern:
```
{role}.{employee_id}@{last5_digits_of_school_code}.rj.gov.in
```

Examples:
- Faculty: `faculty.12345@ABCDE.rj.gov.in`
- Admin: `admin.67890@ABCDE.rj.gov.in`
- Librarian: `librarian.11111@ABCDE.rj.gov.in`

#### Default Password Format
Default passwords follow the pattern:
```
{employee_id}@{last5_digits_of_school_code}
```

Example: `12345@ABCDE`

### Staff Roles
- **admin**: Administrative staff with full school management access
- **faculty**: Teaching staff (replaces old 'teacher' role)
- **librarian**: Library management staff
- **warden**: Hostel management staff

### School Association
- Each staff member is automatically linked to the school of the creating admin
- Staff can only view and manage data from their associated school
- Dual linking: both `user.school` and `staff_profile.school` for comprehensive filtering

## API Documentation

### Base URL
- Development: `http://localhost:8000/api/v1/`
- Production: Update according to your deployment

### Authentication
- **Admin endpoints**: Require JWT token authentication
- **Public endpoints**: No authentication required (admissions, tracking, school list)
- **Parent endpoints**: Email-based OTP authentication for parent access

#### Parent Authentication Flow
Parents can access their child's information using email-based OTP authentication:

1. **Request OTP**: `POST /users/auth/parent/request-otp/` with parent email
2. **Verify OTP**: `POST /users/auth/parent/verify-otp/` with email and OTP
3. **Access Data**: Use session token to access student information
4. **Session Management**: Automatic 4-hour session expiry with refresh capability

For detailed parent authentication documentation, see [PARENT_AUTHENTICATION.md](./docs/PARENT_AUTHENTICATION.md)

### Key Endpoints

#### Schools
- `GET /schools/public/` - Get list of active schools (public)

#### Admissions
- `POST /admissions/verify-email/request/` - Request email verification OTP
- `POST /admissions/verify-email/verify/` - Verify email with OTP
- `POST /admissions/applications/` - Submit admission application
- `GET /admissions/track/` - Track application by reference ID
- `GET /admissions/applications/` - List applications (admin)
- `PATCH /admissions/applications/{id}/review/` - Review application (admin)

#### Parent Authentication
- `POST /users/auth/parent/request-otp/` - Request OTP for parent login
- `POST /users/auth/parent/verify-otp/` - Verify OTP and get session token
- `GET /users/auth/parent/verify-session/` - Verify active session
- `POST /users/auth/parent/logout/` - End parent session

## Database Models

### EmailVerification
- Email OTP verification for admissions
- Fields: email, otp, is_verified, created_at, expires_at, attempts
- Security: 10-minute expiry, 3-attempt limit

### AdmissionApplication
- Core admission application data
- Fields: reference_id, personal info, school preferences, academic details
- Relationships: Linked to EmailVerification, School models
- Features: Auto-generated reference IDs, preference ranking

## Security Features

### Email Verification
- **OTP Generation**: Secure 6-digit random codes
- **Rate Limiting**: 2-minute cooldown between OTP requests
- **Attempt Limiting**: Maximum 3 verification attempts per OTP
- **Time-based Expiry**: 10-minute OTP validity
- **Token Validation**: Verification tokens expire after 1 hour

### Data Protection
- **Input Validation**: Comprehensive form validation
- **SQL Injection Prevention**: Django ORM protection
- **XSS Protection**: Input sanitization
- **CSRF Protection**: Django middleware enabled

## Installation & Setup

### Prerequisites
- Python 3.8+
- Django 5.2+
- SQLite (development) / PostgreSQL (production)

### Installation
1. Clone the repository
2. Create virtual environment: `python -m venv venv`
3. Activate virtual environment: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Unix)
4. Install dependencies: `pip install -r requirements.txt`
5. Run migrations: `python manage.py migrate`
6. Create superuser: `python manage.py createsuperuser`
7. Run server: `python manage.py runserver`

### Environment Variables
Create a `.env` file for production:

```env
DEBUG=False
SECRET_KEY=your-secret-key
DATABASE_URL=your-database-url
EMAIL_HOST_USER=your-email
EMAIL_HOST_PASSWORD=your-password
FRONTEND_URL=https://yourschool.edu
```

## Admin Interface

Access the Django admin at `/admin/` to:
- Review admission applications
- Manage schools and users
- Monitor email verifications
- Update application statuses
- Generate reports

### Admin Features
- **Admission Applications**: List view with filters, search, and bulk actions
- **Email Verifications**: Monitor OTP status and attempts
- **School Management**: Add/edit school information
- **User Management**: Role-based user administration

## Testing

### Running Tests
```bash
python manage.py test
```

### Test Coverage
- Model validation and constraints
- API endpoint responses
- Email verification workflow
- Application submission process
- Admin interface functionality

## Deployment

### Production Checklist
- [ ] Update `DEBUG = False`
- [ ] Configure production database
- [ ] Set up proper email backend
- [ ] Configure static file serving
- [ ] Set up SSL/HTTPS
- [ ] Configure environment variables
- [ ] Set up monitoring and logging

### Recommended Deployment
- **Platform**: Railway, Heroku, or DigitalOcean
- **Database**: PostgreSQL
- **Static Files**: AWS S3 or similar
- **Email Service**: SendGrid, AWS SES, or Google Workspace

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation wiki

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Framework**: Django 5.2 + Django REST Framework