# Parent Authentication System

## Overview

The Acharya ERP system now includes a comprehensive parent authentication system that allows parents/guardians to access their child's academic information using email-based OTP authentication. This system is automatically integrated with the student admission and user allocation workflow.

## Features

- **Email-based OTP authentication** - Parents log in using their email and receive OTP via email
- **Automatic parent profile creation** - Parent profiles are created during student user allocation
- **Multiple parent support** - Supports father, mother, and guardian profiles per student
- **Primary contact management** - Designates primary contact for school communications
- **Session management** - Secure session tokens with expiration
- **Rate limiting** - Built-in OTP request rate limiting for security

## Architecture

### Models

#### 1. AdmissionApplication (Enhanced)
New parent-related fields added:
```python
# Father Information
father_name = CharField(max_length=100, blank=True)
father_phone = CharField(max_length=15, blank=True)
father_email = EmailField(blank=True)
father_occupation = CharField(max_length=100, blank=True)

# Mother Information
mother_name = CharField(max_length=100, blank=True)
mother_phone = CharField(max_length=15, blank=True)
mother_email = EmailField(blank=True)
mother_occupation = CharField(max_length=100, blank=True)

# Guardian Information
guardian_name = CharField(max_length=100, blank=True)
guardian_phone = CharField(max_length=15, blank=True)
guardian_email = EmailField(blank=True)
guardian_relationship = CharField(max_length=50, blank=True)

# Primary Contact
primary_contact = CharField(max_length=20, choices=[
    ('father', 'Father'),
    ('mother', 'Mother'),
    ('guardian', 'Guardian'),
], default='father')
```

Helper methods:
- `get_primary_contact_info()` - Returns primary contact details
- `get_all_parent_contacts()` - Returns all parent/guardian contacts

#### 2. ParentProfile (Enhanced)
```python
class ParentProfile(models.Model):
    # Basic Information
    first_name = CharField(max_length=30)
    last_name = CharField(max_length=30)
    phone_number = CharField(max_length=15)
    email = EmailField(db_index=True)
    occupation = CharField(max_length=100)
    address = TextField()
    relationship = CharField(choices=[('father', 'Father'), ('mother', 'Mother'), ('guardian', 'Guardian')])
    
    # Relationships
    student = ForeignKey(StudentProfile)
    admission_application = ForeignKey(AdmissionApplication)
    
    # Authentication Fields
    last_otp_sent = DateTimeField()
    otp_attempts = PositiveIntegerField(default=0)
    last_login_attempt = DateTimeField()
    
    # Status
    is_primary_contact = BooleanField(default=False)
```

Methods:
- `can_request_otp()` - Rate limiting check
- `record_otp_sent()` - Record OTP request
- `create_from_admission_application()` - Factory method

#### 3. ParentOTP (New)
```python
class ParentOTP(models.Model):
    parent = ForeignKey(ParentProfile)
    email = EmailField(db_index=True)
    otp = CharField(max_length=6)
    is_verified = BooleanField(default=False)
    created_at = DateTimeField(auto_now_add=True)
    verified_at = DateTimeField()
    expires_at = DateTimeField()
    attempts = PositiveIntegerField(default=0)
```

Methods:
- `is_expired()` - Check expiration
- `is_valid()` - Validate OTP
- `verify()` - Verify and mark as used
- `generate_otp()` - Class method to generate 6-digit OTP

## API Endpoints

### Parent Authentication

#### 1. Request OTP
```
POST /api/v1/users/auth/parent/request-otp/
Content-Type: application/json

{
    "email": "parent@example.com"
}
```

Response:
```json
{
    "message": "OTP sent successfully",
    "email": "parent@example.com",
    "expires_in_minutes": 10
}
```

#### 2. Verify OTP
```
POST /api/v1/users/auth/parent/verify-otp/
Content-Type: application/json

{
    "email": "parent@example.com",
    "otp": "123456"
}
```

Response:
```json
{
    "message": "OTP verified successfully",
    "access_token": "parent_session_abc123",
    "parent": {
        "id": 1,
        "name": "John Doe",
        "relationship": "Father",
        "email": "parent@example.com",
        "is_primary_contact": true
    },
    "student": {
        "id": 1,
        "name": "Jane Doe",
        "admission_number": "12345",
        "course": "Class 10",
        "school": "ABC School"
    },
    "expires_at": 1640995200
}
```

#### 3. Verify Session
```
GET /api/v1/users/auth/parent/verify-session/
Authorization: Bearer parent_session_abc123
```

Response:
```json
{
    "valid": true,
    "parent": { /* parent details */ },
    "student": { /* student details */ },
    "expires_at": 1640995200
}
```

#### 4. Logout
```
POST /api/v1/users/auth/parent/logout/
Content-Type: application/json

{
    "access_token": "parent_session_abc123"
}
```

### Legacy Endpoints (Backward Compatibility)

#### Request OTP (Legacy)
```
POST /api/v1/users/auth/parent/request-otp-legacy/
Content-Type: application/json

{
    "admission_number": "12345",
    "phone_number": "+1234567890"
}
```

#### Verify OTP (Legacy)
```
POST /api/v1/users/auth/parent/verify-otp-legacy/
Content-Type: application/json

{
    "admission_number": "12345",
    "phone_number": "+1234567890",
    "otp": "123456"
}
```

## Frontend Integration

### TypeScript Types
```typescript
interface ParentAuthResponse {
    message: string;
    access_token: string;
    parent: {
        id: number;
        name: string;
        relationship: string;
        email: string;
        is_primary_contact: boolean;
    };
    student: {
        id: number;
        name: string;
        admission_number: string;
        course: string;
        school: string;
    } | null;
    expires_at: number;
}

interface ParentOTPRequest {
    message: string;
    email: string;
    expires_in_minutes: number;
}
```

### API Service Usage
```typescript
import { parentAuthService } from '@/lib/api';

// Request OTP
const otpResponse = await parentAuthService.requestOTP('parent@example.com');

// Verify OTP
const authResponse = await parentAuthService.verifyOTP('parent@example.com', '123456');

// Check authentication status
const isAuthenticated = parentAuthService.isAuthenticated();

// Get stored data
const parentData = parentAuthService.getStoredParentData();
const studentData = parentAuthService.getStoredStudentData();

// Logout
await parentAuthService.logout();
```

## Security Features

### Rate Limiting
- Maximum 5 OTP requests per 30 minutes per parent
- 2-minute cooldown between OTP requests
- Maximum 3 attempts per OTP

### Session Security
- Session tokens expire after 4 hours
- Automatic cleanup of expired sessions
- Secure token generation

### Data Protection
- Parent emails are indexed for fast lookup
- OTP attempts are tracked and limited
- Failed authentication attempts are logged

## Email Templates

### OTP Email
Professional HTML email template with:
- Clear OTP display (6-digit code)
- 10-minute expiration notice
- Security warnings
- School branding

Plain text fallback included for email clients that don't support HTML.

## Integration Workflow

### Student User Allocation Process
1. Admin clicks "Allot User ID" in dashboard
2. System creates StudentProfile and User account
3. **NEW**: System automatically creates ParentProfile records from admission data
4. System sends credentials email to student
5. **NEW**: Parent authentication is now available using emails from admission

### Parent Profile Creation Logic
```python
def create_parent_profiles(self, student_profile):
    """Create parent profiles from admission application data"""
    from users.models import ParentProfile
    
    # Create parent profiles for each relationship that has data
    for relationship in ['father', 'mother', 'guardian']:
        parent = ParentProfile.create_from_admission_application(
            self.application, relationship
        )
        if parent:
            # Link to student profile
            parent.student = student_profile
            parent.save()
```

## Database Schema Changes

### Migrations Applied
- `admissions.0011_admissionapplication_father_email_and_more` - Adds parent fields to AdmissionApplication
- `users.0006_parentotp_parentprofile_admission_application_and_more` - Enhances ParentProfile and adds ParentOTP

### Indexes Added
- `ParentProfile.email` - Fast email lookup for authentication
- `ParentOTP.email` - Fast OTP lookup
- `ParentProfile.admission_application` - Link tracking

## Error Handling

### Common Error Responses

#### Invalid Email
```json
{
    "error": "No parent found with this email address"
}
```

#### Rate Limited
```json
{
    "error": "Too many OTP requests. Please try again later."
}
```

#### Invalid OTP
```json
{
    "error": "Invalid or expired OTP"
}
```

#### Session Expired
```json
{
    "valid": false,
    "error": "Session expired"
}
```

## Testing

### Manual Testing Commands
```bash
# Test model imports
python manage.py shell -c "from users.models import ParentProfile, ParentOTP; print('Models work!')"

# Test OTP generation
python manage.py shell -c "from users.models import ParentOTP; print('OTP:', ParentOTP.generate_otp())"

# Test parent fields
python manage.py shell -c "from admissions.models import AdmissionApplication; app = AdmissionApplication.objects.first(); print('Has parent fields:', hasattr(app, 'father_name'))"
```

### API Testing
Use the frontend parent authentication components or test directly with curl/Postman using the endpoint examples above.

## Future Enhancements

1. **SMS OTP Support** - Add SMS-based OTP as alternative to email
2. **Multi-language Support** - Localize email templates
3. **Push Notifications** - Mobile app integration
4. **Biometric Authentication** - For enhanced security
5. **Parent Dashboard** - Dedicated parent portal interface
6. **Communication Hub** - Direct messaging with teachers

## Troubleshooting

### Common Issues

1. **Migration Errors**: Ensure migrations are applied in correct order
2. **Email Delivery**: Check SMTP configuration in settings
3. **Session Expiry**: Frontend should handle expired sessions gracefully
4. **Rate Limiting**: Implement proper error messaging for rate limits

### Debug Commands
```bash
# Check migration status
python manage.py showmigrations

# Test email backend
python manage.py shell -c "from django.core.mail import send_mail; send_mail('Test', 'Body', 'from@example.com', ['to@example.com'])"

# Check parent profile creation
python manage.py shell -c "from users.models import ParentProfile; print('Parent count:', ParentProfile.objects.count())"
```