# Staff Management API Documentation

## Overview
The Staff Management system has been updated to use role-based categorization with improved API endpoints and data structures.

## Updated User Roles
- `admin` - Administrative staff
- `faculty` - Teaching staff (previously 'teacher')
- `librarian` - Library staff
- `warden` - Hostel wardens
- `student` - Students
- `parent` - Parents/Guardians
- `management` - Management level users

**Note:** The old roles `'teacher'` and `'staff'` have been removed and replaced with more specific roles.

## API Endpoints

### Staff Management

#### 1. Get All Staff
```
GET /api/v1/users/staff/
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
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
    "date_of_joining": "2024-01-15",
    "qualification": "M.Sc Mathematics, B.Ed",
    "experience_years": 5
  }
]
```

#### 2. Create New Staff
```
POST /api/v1/users/staff/
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "phone_number": "+91-9876543210",
  "role": "faculty",
  "employee_id": "67890",
  "department": "Science",
  "designation": "Assistant Teacher",
  "date_of_joining": "2024-09-01",
  "qualification": "M.Sc Physics, B.Ed",
  "experience_years": 3
}
```

**Response:**
```json
{
  "message": "Staff created successfully",
  "staff": {
    "id": 2,
    "user": {
      "id": 16,
      "first_name": "Jane",
      "last_name": "Smith",
      "email": "faculty.67890@ABCDE.rj.gov.in",
      "role": "faculty"
    },
    "school": {
      "id": 1,
      "school_name": "Sample School",
      "school_code": "SAMPLE12345"
    },
    "employee_id": "67890",
    "department": "Science",
    "designation": "Assistant Teacher",
    "date_of_joining": "2024-09-01",
    "qualification": "M.Sc Physics, B.Ed",
    "experience_years": 3
  },
  "user_credentials": {
    "email": "faculty.67890@ABCDE.rj.gov.in",
    "default_password": "67890@ABCDE",
    "note": "Please ask the staff member to change their password on first login"
  }
}
```

### School Dashboard Data

#### 1. Get School Statistics
```
GET /api/v1/schools/stats/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalStudents": 150,
  "totalTeachers": 12,
  "totalStaff": 15,
  "totalWardens": 2,
  "activeParents": 145,
  "totalClasses": 8,
  "currentSemester": "Academic Session 2024-25",
  "school": {
    "name": "Sample School",
    "code": "SAMPLE12345",
    "email": "admin@sample.rj.gov.in",
    "phone": "+91-1234567890",
    "address": "123 School Street, Sample City"
  }
}
```

#### 2. Get Comprehensive Dashboard Data
```
GET /api/v1/schools/dashboard/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "students": [...],
  "teachers": [
    {
      "id": 15,
      "user": {
        "first_name": "John",
        "last_name": "Doe",
        "email": "faculty.12345@ABCDE.rj.gov.in"
      },
      "role": "faculty",
      "department": "Mathematics",
      "designation": "Senior Teacher",
      "experience_years": 5,
      "status": "active"
    }
  ],
  "staff": [
    {
      "id": 16,
      "user": {
        "first_name": "Jane",
        "last_name": "Smith",
        "email": "admin.56789@ABCDE.rj.gov.in"
      },
      "role": "admin",
      "department": "Administration",
      "designation": "Administrative Officer",
      "experience_years": 8,
      "status": "active"
    }
  ],
  "users": [...],
  "fees": [],
  "attendance": [],
  "exams": []
}
```

## Email Format

Staff emails are auto-generated in the format:
```
{role}.{employee_id}@{last5_digits_of_school_code}.rj.gov.in
```

Examples:
- `faculty.12345@ABCDE.rj.gov.in`
- `admin.67890@ABCDE.rj.gov.in`
- `librarian.11111@ABCDE.rj.gov.in`

## Default Password Format

Default passwords are generated in the format:
```
{employee_id}@{last5_digits_of_school_code}
```

Example: `12345@ABCDE`

## School Linking

- **User Model**: Each user has a `school` foreign key linking them to their school
- **StaffProfile Model**: Each staff profile has both:
  - `user.school` (inherited from user)
  - `school` (direct foreign key for easy querying and backtracking)

## Filtering and Permissions

- **Non-superusers**: Can only see staff from their own school
- **Superusers**: Can see all staff across all schools
- **Filtering**: Uses both `user.school` and `staff_profile.school` for comprehensive filtering

## Frontend Integration

The frontend automatically:
- Shows real-time email preview during staff creation
- Displays success toast notifications
- Refreshes staff lists after creation
- Filters staff by role in different tabs (Staff, Librarians, etc.)

## Migration Notes

- Migration `0011_staffprofile_school.py` adds the school field to StaffProfile
- Existing staff profiles are automatically linked to their user's school
- No data loss or breaking changes to existing functionality

## Error Handling

All endpoints include proper error handling with meaningful messages:
- Missing required fields
- Duplicate email/employee_id validation
- School assignment validation
- Permission checks

## Security Features

- JWT token authentication required
- School-based data isolation
- Auto-generated secure credentials
- Role-based access control