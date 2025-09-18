# Acharya School Management System - Context Documentation

## Project Overview

**Acharya** is a comprehensive, modern school management system built with Django REST Framework (backend) and React TypeScript (frontend). It provides complete academic, financial, and administrative management capabilities for educational institutions with role-based access control and real-time features.

### Key Characteristics
- **Full-Stack Application**: Django REST API + React TypeScript frontend
- **Production-Ready**: Comprehensive security, testing, and deployment configuration
- **Role-Based**: Student, Parent, Teacher, Admin, and Warden dashboards
- **Modern Architecture**: JWT authentication, RESTful APIs, responsive UI
- **Well-Documented**: Extensive documentation in `/docs/` directory

## Technology Stack

### Backend (Django REST Framework)
- **Framework**: Django 5.x with Django REST Framework
- **Language**: Python 3.11+
- **Package Manager**: [UV](https://docs.astral.sh/uv/) - Modern Python package manager (10-100x faster than pip)
- **Database**: PostgreSQL (production), SQLite (development)
- **Authentication**: JWT with SimpleJWT
- **API Documentation**: drf-spectacular (Swagger/OpenAPI)
- **Cache**: Redis (production)
- **Task Queue**: Celery for background jobs
- **File Storage**: S3-compatible storage

### Frontend (React TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (Development server on port 8080)
- **Styling**: Tailwind CSS with shadcn/ui components
- **HTTP Client**: Axios with interceptors
- **Routing**: React Router v6
- **State Management**: React Context + hooks
- **Package Manager**: npm
- **Form Management**: React Hook Form with Zod validation

## Architecture Overview

```
Frontend (React/TS - Port 8080) ↔ Backend (Django - Port 8000) ↔ Database (PostgreSQL/SQLite)
```

### Authentication Flow
1. JWT-based authentication with automatic token refresh
2. Role-based access control (RBAC)
3. Protected routes and API endpoints
4. Session management with secure logout

### Data Flow
1. Frontend makes API calls to Django REST endpoints
2. Backend validates JWT tokens and permissions
3. Database operations through Django ORM
4. Response data formatted through DRF serializers

## Project Structure

```
Acharya/
├── backend/                    # Django REST API Backend
│   ├── config/                # Django project configuration
│   ├── users/                 # Authentication and user management
│   ├── students/              # Student management
│   ├── admissions/            # Admission process
│   ├── fees/                  # Fee collection and management
│   ├── attendance/            # Attendance tracking
│   ├── exams/                 # Examination management
│   ├── hostel/                # Hostel accommodation
│   ├── library/               # Library management
│   ├── notifications/         # Notification system
│   ├── reports/               # Report generation
│   ├── analytics/             # Analytics and reporting
│   ├── parents/               # Parent-specific functionality
│   ├── staff/                 # Staff management
│   ├── manage.py              # Django management commands
│   ├── pyproject.toml         # UV package configuration
│   └── uv.lock                # UV lockfile
│
├── frontend/                   # React TypeScript Frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── contexts/          # React contexts (AuthContext)
│   │   ├── lib/api/           # API integration layer
│   │   ├── pages/dashboards/  # Role-specific dashboards
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Utility functions
│   ├── package.json           # Node.js dependencies
│   ├── vite.config.ts         # Vite build configuration
│   └── tailwind.config.ts     # Tailwind CSS configuration
│
├── docs/                       # Comprehensive Documentation
│   ├── api-reference.md       # Complete API documentation
│   ├── backend-implementation.md
│   ├── deployment-guide.md
│   ├── frontend-backend-integration.md
│   ├── integration-summary.md
│   ├── issue-resolution-summary.md
│   ├── migration-troubleshooting-guide.md
│   └── quick-start-integration.md
│
└── README.md                   # Main project documentation
```

## Core Features

### User Roles & Dashboards
1. **Student Dashboard**: Academic progress, attendance, fees, assignments
2. **Parent Dashboard**: Multi-child monitoring, academic progress, communication
3. **Teacher Dashboard**: Class management, attendance marking, grade entry
4. **Admin Dashboard**: Complete system administration, user management
5. **Warden Dashboard**: Hostel management, room allocation

### Core Modules
1. **Academic Management**: Student admissions, class management, progression
2. **Financial Management**: Fee structure, payment processing, invoicing
3. **Attendance System**: Real-time marking, reports, analytics
4. **Examination System**: Exam scheduling, grade entry, report cards
5. **Hostel Management**: Room allocation, fee tracking, maintenance
6. **Library Management**: Book catalog, issue/return tracking
7. **Notification System**: Real-time notifications, announcements

## Development Environment Setup

### Backend Setup
```bash
cd backend/
uv venv
uv sync
uv run manage.py migrate
uv run manage.py createsuperuser
uv run manage.py runserver
```

### Frontend Setup
```bash
cd frontend/
npm install
npm run dev
```

### Access Points
- Frontend: http://localhost:8080/
- Backend API: http://127.0.0.1:8000/
- API Documentation: http://127.0.0.1:8000/api/docs/
- Django Admin: http://127.0.0.1:8000/admin/

## Package Management

### UV (Backend)
UV is a modern Python package manager that's 10-100x faster than pip:
- `uv sync` - Install dependencies
- `uv add package` - Add new dependency
- `uv run command` - Run Python commands
- `uv lock --upgrade` - Update dependencies

### npm (Frontend)
- `npm install` - Install dependencies
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm test` - Run tests

## API Architecture

### Authentication Endpoints
```
POST /api/v1/users/auth/login/      # Login with username/password
POST /api/v1/users/auth/logout/     # Logout and blacklist token
POST /api/v1/users/auth/refresh/    # Refresh JWT token
GET  /api/v1/users/me/              # Get current user profile
```

### Core Module Endpoints
- **Students**: `/api/v1/students/` - CRUD operations, dashboard data
- **Admissions**: `/api/v1/admissions/` - Application management
- **Fees**: `/api/v1/fees/` - Invoice and payment management
- **Attendance**: `/api/v1/attendance/` - Session and marking operations
- **Exams**: `/api/v1/exams/` - Exam and result management
- **Hostel**: `/api/v1/hostel/` - Room allocation and management
- **Library**: `/api/v1/library/` - Book and borrowing operations

### API Features
- Comprehensive filtering and pagination
- Field selection for optimized responses
- Bulk operations support
- File upload capabilities
- Rate limiting and security
- OpenAPI/Swagger documentation

## Security Implementation

### Backend Security
- JWT-based authentication with automatic refresh
- Role-based access control (RBAC)
- Input validation and sanitization
- CORS protection
- Rate limiting
- Audit logging
- File upload security

### Frontend Security
- Secure token storage
- Protected routes
- Input validation
- XSS protection
- CSRF protection

## Database Design

### Key Models
- **User**: Custom user model with role-based fields
- **Student**: Student profiles and academic records
- **Admission**: Application management
- **Fee**: Invoice and payment tracking
- **Attendance**: Session and record management
- **Exam**: Examination and result management
- **HostelRoom**: Room allocation and management
- **Book**: Library catalog and borrowing

### Relationships
- User → StudentProfile/ParentProfile/StaffProfile (OneToOne)
- Student → AdmissionApplication/FeeInvoice/AttendanceRecord (ForeignKey)
- Class → AttendanceSession → AttendanceRecord (ForeignKey)

## Deployment

### Development
- SQLite database
- Local file storage
- Debug mode enabled
- Hot reloading

### Production
- PostgreSQL database
- Redis caching
- S3 file storage
- Security headers
- SSL/HTTPS
- Docker containerization

### Deployment Options
1. **Docker Deployment** (Recommended)
2. **Traditional VPS Deployment**
3. **Cloud Deployment** (AWS, GCP, Digital Ocean)

## Testing Strategy

### Backend Testing
- Unit tests for models and services
- Integration tests for API endpoints
- Performance tests with load testing
- Security tests for authentication

### Frontend Testing
- Unit tests with Vitest and React Testing Library
- E2E tests with Playwright
- Component tests with Storybook
- Visual regression tests

## Performance Optimization

### Backend Performance
- Database query optimization
- Redis caching for frequently accessed data
- API response optimization with pagination
- Background processing with Celery
- Connection pooling

### Frontend Performance
- Code splitting and lazy loading
- API response caching
- Bundle optimization
- Performance monitoring

## Migration Status

### Completed Migration
- ✅ Removed Supabase dependencies
- ✅ Implemented JWT authentication
- ✅ Created API service layer
- ✅ Integrated all dashboard components
- ✅ Fixed TypeScript errors
- ✅ Created comprehensive documentation

### Current State
- Production-ready authentication system
- Complete API integration
- Role-based access control implemented
- All major workflows functional
- Comprehensive error handling

## Known Issues & Solutions

### Common Development Issues
1. **Migration Errors**: Use `uv run manage.py migrate --fake-initial`
2. **Package Installation**: Clear UV cache with `uv cache clean`
3. **TypeScript Errors**: Ensure proper type definitions
4. **CORS Issues**: Configure CORS_ALLOWED_ORIGINS properly

### Troubleshooting Resources
- `/docs/migration-troubleshooting-guide.md`
- `/docs/issue-resolution-summary.md`
- GitHub Issues tracker

## Development Workflow

### Code Style
- **Backend**: PEP 8, Black formatting, isort imports
- **Frontend**: Prettier, ESLint, TypeScript strict mode

### Git Workflow
- Feature branches from main
- Pull requests with code review
- Conventional commit messages
- Automated testing in CI/CD

### Testing Requirements
- Backend: >80% test coverage
- Frontend: Unit tests for critical components
- E2E tests for user workflows

## Documentation

### Available Documentation
1. **API Reference** (`/docs/api-reference.md`) - Complete API documentation
2. **Backend Implementation** (`/docs/backend-implementation.md`) - Technical details
3. **Deployment Guide** (`/docs/deployment-guide.md`) - Production deployment
4. **Integration Guide** (`/docs/frontend-backend-integration.md`) - Integration details
5. **Migration Guide** (`/docs/migration-troubleshooting-guide.md`) - Database migrations
6. **Quick Start** (`/docs/quick-start-integration.md`) - Fast setup guide

### API Documentation
- Interactive Swagger UI at `/api/docs/`
- ReDoc documentation at `/api/redoc/`
- OpenAPI schema at `/api/schema/`

## Environment Configuration

### Backend Environment Variables
```bash
DEBUG=True/False
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3 or postgresql://...
REDIS_URL=redis://localhost:6379
CORS_ALLOWED_ORIGINS=http://localhost:8080
JWT_SECRET_KEY=your-jwt-secret
EMAIL_HOST=smtp.gmail.com
AWS_STORAGE_BUCKET_NAME=your-bucket
```

### Frontend Environment Variables
```bash
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1/
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_NOTIFICATIONS=true
```

## Port Configuration

- **Frontend Development Server**: 8080 (Vite)
- **Backend Development Server**: 8000 (Django)
- **Production**: 80/443 (HTTP/HTTPS)

## Future Roadmap

### v1.1 Features
- Mobile application (React Native)
- Advanced analytics and reporting
- Real-time notifications (WebSocket)
- Bulk operations and data import
- Multi-language support (i18n)

### v2.0 Features
- Machine learning for predictive analytics
- Advanced security features (SSO, SAML)
- Microservices architecture
- Blockchain for certificate verification
- AI-powered chatbot support

## Community & Support

### Resources
- **GitHub Repository**: https://github.com/frankmathewsajan/acharya
- **Issue Tracker**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Documentation**: `/docs/` directory

### Contributing
- Follow conventional commit format
- Add tests for new functionality
- Update documentation as needed
- Submit pull requests with clear descriptions

## License

MIT License - See LICENSE file for details

---

## Quick Reference for LLM Context

### Key Files to Understand
1. `README.md` - Main project documentation
2. `TODO.md` - Development roadmap and requirements
3. `/docs/*.md` - Comprehensive technical documentation
4. `backend/config/settings.py` - Django configuration
5. `frontend/src/contexts/AuthContext.tsx` - Authentication logic
6. `backend/users/models.py` - User model and authentication
7. `frontend/package.json` - Frontend dependencies
8. `backend/pyproject.toml` - Backend dependencies (UV)

### Important Commands
```bash
# Backend
cd backend && uv sync && uv run manage.py runserver

# Frontend  
cd frontend && npm install && npm run dev

# Testing
uv run pytest  # Backend
npm test       # Frontend

# Database
uv run manage.py migrate
uv run manage.py createsuperuser
```

### Current Status
- **Authentication**: Fully migrated from Supabase to JWT
- **API Integration**: Complete with all dashboards
- **Documentation**: Comprehensive and up-to-date
- **Testing**: Basic test coverage implemented
- **Deployment**: Production-ready with multiple options

This context provides a complete understanding of the Acharya School Management System for any future LLM interactions or development work.