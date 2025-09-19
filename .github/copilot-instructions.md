# Copilot Instructions for Acharya ERP System

## Project Overview
**Acharya** is a multi-school Educational Resource Planning (ERP) system for the Government of Rajasthan, featuring a Django REST Framework backend and React TypeScript frontend. The system supports multi-school admissions, role-based access control, and comprehensive school management.

## Architecture & Stack
- **Backend**: Django 5.2+ + DRF, JWT auth, SQLite/PostgreSQL, UV package manager
- **Frontend**: React 18 + TypeScript, Vite, shadcn/ui, Tailwind CSS, Axios API client
- **Key Pattern**: Role-based multi-school system with `User.school` foreign key association

## Core Domain Models

### User System (`backend/users/models.py`)
```python
# Custom User model with school association
class User(AbstractUser):
    role = models.CharField(choices=['student', 'parent', 'faculty', 'warden', 'admin', 'librarian'])
    school = models.ForeignKey('schools.School', ...)
    email = models.EmailField(unique=True)  # USERNAME_FIELD
```

### Profile Pattern
- **StaffProfile**: Links to User with role='faculty'/'admin'/'librarian'
- **StudentProfile**: Links to User with role='student' 
- **ParentProfile**: Links to User with role='parent' (no separate account in admissions)

## Development Workflows

### Backend Commands (Use UV)
```bash
cd backend
uv run manage.py runserver          # Development server
uv run manage.py makemigrations     # Create migrations
uv run manage.py migrate            # Apply migrations
uv add <package>                    # Add new dependency
uv sync                             # Install dependencies
```

### Frontend Commands
```bash
cd frontend
npm run dev                         # Development server (Vite)
npm run build                       # Production build
npm run build:dev                   # Development build
```

## Key API Patterns

### Authentication Flow
- JWT tokens stored in localStorage (`access_token`, `refresh_token`)
- Auto-refresh handled in `apiClient` interceptors (`frontend/src/lib/api/client.ts`)
- AuthContext provides: `user`, `profile`, `isAuthenticated`, `login()`, `logout()`

### API Structure
```typescript
// Service pattern: frontend/src/services/adminAPI.ts
export const adminAPI = {
  getSchoolStats: () => apiClient.get('/dashboard/admin/'),
  createStaff: (data) => apiClient.post('/users/staff/', data),
  // Consistent response handling with error boundaries
}
```

### Role-Based Dashboard Pattern
```typescript
// AdminDashboard.tsx - multi-tab layout with reload functions
const reloadUsersData = async () => {
  // Each tab has dedicated reload function
  const [users, staff, teachers] = await Promise.all([...]);
}
```

## Component Patterns

### Multi-Step Forms
```typescript
// Staff creation uses 3-step modal with validation
const [staffCreationStep, setStaffCreationStep] = useState(1);
const [createStaffForm, setCreateStaffForm] = useState({
  role: 'faculty', // Auto-set based on activeUserTab
  // Email auto-generated: role.employee_id@school.code.rj.gov.in
});
```

### Consistent Loading States
```typescript
// Use loading states with disabled buttons and spinners
<Button disabled={loading}>
  {loading && <Loader2 className="animate-spin" />}
  Action
</Button>
```

## Email Generation Convention
**Pattern**: `{role}.{employee_id}@{school_code_last_5_chars}.rj.gov.in`
- Example: `faculty.EMP001@12345.rj.gov.in`
- Used in staff creation and automatic credential generation

## File Organization
```
backend/
├── config/settings.py     # All apps registered, DRF + JWT configured
├── users/                 # Custom User model + profiles
├── admissions/            # Multi-school admission system
├── schools/               # School management
└── dashboard/             # API endpoints for dashboard data

frontend/src/
├── services/              # API client services (adminAPI, hostelAPI)
├── contexts/AuthContext   # Authentication state management  
├── components/ui/         # shadcn/ui components
├── pages/dashboards/      # Role-based dashboard components
└── lib/api/client.ts      # Axios configuration with interceptors
```

## Debugging & Console Patterns
- Use structured debug messages: `console.log('🔧 DEBUG: Action name', data)`
- Form validation errors shown in UI with `setError()` state
- Toast notifications for success/error feedback

## Environment Variables
- Backend: Use `.env` files, load with `python-dotenv`
- Frontend: Vite env vars (`VITE_API_BASE_URL`), defaults to `http://localhost:8000/api/v1/`

---
*Key Architecture Reference: `docs/ARCHITECTURE.md` for comprehensive design patterns and planned features*