# 🎓 Acharya Multi-School Management System

A comprehensive multi-school management system designed for the Government of Rajasthan, built with Django REST Framework (Backend) and React + TypeScript (Frontend).

## 🌟 System Overview

The Acharya ERP system is a modern Educational Resource Planning platform that supports:

### Core Features
- **Multi-School Admission System**: Students apply to up to 3 schools with independent review and enrollment tracking
- **Category-Based Fee Management**: Dynamic fee calculation based on class levels and categories (General, SC/ST/OBC/SBC)  
- **Role-Based Access Control**: Separate interfaces for Students, Parents, Faculty, Admins, and Wardens
- **Document Management**: Secure file upload, validation, and serving with proper authentication
- **Real-Time Tracking**: Application status, enrollment updates, and notifications across the system

### Technology Stack
- **Backend**: Django 5.2+, Django REST Framework, JWT authentication, PostgreSQL/SQLite
- **Frontend**: React 18+, TypeScript, Vite, shadcn/ui components, Tailwind CSS, React Query
- **Development Tools**: UV package manager, npm, Git, VS Code
- **Production**: Ubuntu Linux, Nginx, Gunicorn, Let's Encrypt SSL, systemd services

## 📚 Documentation

**Complete technical documentation is available in the `docs/` folder:**

- **[📋 Architecture Guide](docs/ARCHITECTURE.md)** - System design, technical implementation, and feature details
- **[🔌 API Reference](docs/API_REFERENCE.md)** - Complete API documentation with examples and authentication
- **[🚀 Deployment Guide](docs/DEPLOYMENT.md)** - Development setup and production deployment instructions

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+** (recommended 3.13)
- **Node.js 18+** (recommended 20+)
- **UV package manager** for Python dependencies
- **PostgreSQL 15+** (production) or SQLite (development)

### Development Setup

#### 1. Clone Repository
```bash
git clone <repository-url>
cd Acharya
```

#### 2. Backend Setup (Django)
```bash
cd backend

# Install UV package manager
curl -LsSf https://astral.sh/uv/install.sh | sh  # macOS/Linux
# OR
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"  # Windows

# Install dependencies
uv sync

# Environment configuration
cp .env.example .env
# Edit .env with your settings

# Database setup
uv run python manage.py migrate
uv run python manage.py createsuperuser

# Start development server
uv run python manage.py runserver
```

#### 3. Frontend Setup (React)
```bash
cd frontend

# Install dependencies
npm install

# Environment configuration  
cp .env.example .env
# Edit .env with your settings

# Start development server
npm run dev
```

### Access Points
- **Frontend**: http://localhost:5173/
- **Backend API**: http://localhost:8000/api/v1/
- **Admin Panel**: http://localhost:8000/admin/

## 🏗️ Project Structure

```
Acharya/
├── backend/                    # Django Backend
│   ├── config/                # Django settings and URLs
│   ├── users/                 # User management and authentication
│   ├── admissions/            # Multi-school admission system
│   ├── students/              # Student profiles and academic records
│   ├── staff/                 # Faculty and staff management
│   ├── fees/                  # Category-based fee management
│   ├── attendance/            # Attendance tracking
│   ├── exams/                 # Examination management
│   ├── hostel/                # Hostel management
│   ├── library/               # Library management
│   ├── notifications/         # Notification system
│   ├── analytics/             # Analytics and reporting
│   ├── reports/               # Report generation
│   ├── parents/               # Parent portal features
│   ├── test/                  # Testing scripts and data
│   ├── manage.py              # Django management script
│   └── pyproject.toml         # Python dependencies (UV)
│
├── frontend/                  # React + TypeScript Frontend
│   ├── src/
│   │   ├── components/        # UI components (shadcn/ui)
│   │   ├── pages/            # Route components
│   │   ├── lib/              # Utilities and API clients
│   │   ├── hooks/            # Custom React hooks
│   │   ├── integrations/     # External service integrations
│   │   └── assets/           # Static assets
│   ├── public/               # Public static files
│   ├── package.json          # Node.js dependencies
│   └── vite.config.ts        # Vite configuration
│
└── docs/                     # Documentation
    ├── ARCHITECTURE.md       # System design and implementation
    ├── API_REFERENCE.md      # Complete API documentation
    ├── DEPLOYMENT.md         # Setup and deployment guide
    └── README.md             # Documentation overview
```

## 🎯 Key Features

### Multi-School Admission Workflow
1. **Email Verification**: OTP-based verification before application submission
2. **School Preferences**: Students apply to up to 3 schools in preference order
3. **Independent Review**: Each school reviews and decides on applications separately
4. **Student Choice**: Students choose from multiple accepted schools
5. **Enrollment Tracking**: Complete enrollment/withdrawal workflow with date tracking

### Role-Based Dashboards
- **Students**: Application status, enrollment details, fee information
- **Parents**: Child's academic progress and school communications
- **Faculty**: Student management, attendance, and academic records
- **Admins**: System oversight, application review, and analytics
- **Wardens**: Hostel management and student welfare

### Advanced Fee Management
- **Dynamic Calculation**: Based on class levels (1-8, 9-10, 11-12) and categories
- **Category Support**: General, SC/ST, OBC, SBC with different fee structures
- **Real-time Display**: Immediate fee calculation in the frontend
- **Payment Integration**: Secure payment workflow with tracking

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Role-Based Permissions**: Granular access control per endpoint and feature
- **Input Validation**: Comprehensive validation on all forms and API endpoints
- **File Upload Security**: Type and size restrictions with malware scanning
- **CORS Protection**: Secure cross-origin resource sharing configuration
- **Production Security**: SSL/TLS, security headers, and protection against common attacks

## 🧪 Testing

**Test files are organized in `backend/test/` folder:**

```bash
# Backend testing
cd backend
uv run python manage.py test

# Frontend testing  
cd frontend
npm run test

# End-to-end testing
npm run test:e2e
```

## 📈 Production Deployment

For complete deployment instructions, see the **[Deployment Guide](docs/DEPLOYMENT.md)**.

### Quick Production Overview
- **Server**: Ubuntu 22.04+ with PostgreSQL and Nginx
- **Security**: SSL certificates, firewall configuration, security headers
- **Process Management**: Systemd services with auto-restart
- **Performance**: Database optimization, static file caching, monitoring
- **Backup**: Automated database and media file backups

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/new-feature`)
3. **Review** the [Architecture Guide](docs/ARCHITECTURE.md) for implementation patterns
4. **Test** your changes thoroughly
5. **Update** documentation as needed
6. **Submit** a pull request with detailed description

## 📞 Support

### Getting Help
- **Development Issues**: Review [API Reference](docs/API_REFERENCE.md) and [Architecture Guide](docs/ARCHITECTURE.md)
- **Deployment Issues**: Check [Deployment Guide](docs/DEPLOYMENT.md) troubleshooting sections
- **System Questions**: Refer to specific documentation sections based on your role

### Issue Reporting
- Create detailed bug reports with reproduction steps
- Include system information and error logs
- Reference relevant documentation sections

## 🗺️ Roadmap

### Planned Features
- **Advanced Analytics**: Enhanced reporting and dashboard features
- **Mobile Application**: Native mobile app for students and parents
- **Payment Gateway**: Integration with multiple payment providers
- **Multi-Language Support**: Localization for Hindi and regional languages
- **SMS/Email Notifications**: Automated communication system
- **API Extensions**: Additional endpoints for third-party integrations

### Technical Improvements
- **Performance Optimization**: Caching strategies and database optimization
- **Monitoring**: Enhanced logging and application performance monitoring
- **Security Enhancements**: Additional security measures and compliance features
- **Testing**: Expanded test coverage and automated testing pipelines

## 📄 License

This project is developed for the Government of Rajasthan and follows government software development guidelines.

## 🏆 Acknowledgments

Built with modern web technologies:
- **Django & DRF** for robust backend architecture
- **React & TypeScript** for type-safe frontend development
- **shadcn/ui** for beautiful, accessible UI components
- **UV Package Manager** for efficient Python dependency management
- **Vite** for fast frontend development and building

---

**For detailed technical information, implementation guides, and deployment instructions, please refer to the [comprehensive documentation](docs/) in the `docs/` folder.**

*Last Updated: January 2025 | Version: 1.0.0*