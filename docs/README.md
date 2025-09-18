# Acharya ERP Documentation

Welcome to the comprehensive documentation for the Acharya Multi-School Management System. This documentation provides detailed information about the system's architecture, APIs, and deployment procedures.

## 📚 Documentation Structure

This documentation is organized into three main sections for easy navigation:

### 🏗️ [System Architecture](ARCHITECTURE.md)
**Complete system design and technical implementation**

- **Overview**: Multi-school admission system with Django REST Framework backend and React TypeScript frontend
- **Backend Architecture**: 15+ Django apps with JWT authentication, role-based access, and comprehensive API design
- **Frontend Architecture**: Modern React with shadcn/ui components, TypeScript, and React Query for state management
- **Database Design**: Optimized PostgreSQL schema supporting multi-school operations, admissions workflow, and academic management
- **Key Features**: Email verification workflow, school preference system, category-based fee calculation, role-based dashboards
- **Security**: JWT tokens, input validation, file upload security, CORS configuration, and production security headers

### 🔌 [API Reference](API_REFERENCE.md)
**Comprehensive API documentation with examples**

- **Authentication**: JWT login/logout, user management, role-based permissions
- **Admissions**: Email verification, application submission, school decisions, enrollment tracking
- **Academic Management**: Students, staff, fees, attendance, exams, hostel, library
- **Administration**: Dashboard APIs, statistics, notifications, reporting
- **File Management**: Secure document upload, validation, and serving
- **Error Handling**: Standardized error responses, status codes, and validation messages

### 🚀 [Deployment Guide](DEPLOYMENT.md)
**Complete setup instructions for development and production**

- **Development Setup**: Python 3.11+, Node.js 18+, UV package manager, local database configuration
- **Production Deployment**: Ubuntu 22.04+, PostgreSQL, Nginx, SSL certificates, systemd services
- **Environment Configuration**: Development and production environment variables, database settings
- **Security Configuration**: SSL setup, firewall configuration, security headers, backup strategies
- **Performance Optimization**: Database indexing, static file caching, monitoring and maintenance

## 🎯 System Overview

The Acharya ERP system is designed for the Government of Rajasthan as a comprehensive multi-school management platform featuring:

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

## 🚀 Quick Start

### For Developers
1. **Read**: [Architecture Guide](ARCHITECTURE.md) - Understand system design and components
2. **Setup**: [Deployment Guide](DEPLOYMENT.md) - Follow development environment setup
3. **Build**: [API Reference](API_REFERENCE.md) - Integrate with backend APIs

### For System Administrators
1. **Plan**: [Deployment Guide](DEPLOYMENT.md) - Review system requirements and security considerations
2. **Deploy**: Follow production deployment instructions with proper security configuration
3. **Monitor**: Implement backup strategies and performance monitoring as outlined

### For Project Managers
1. **Overview**: [Architecture Guide](ARCHITECTURE.md) - Understand system capabilities and limitations
2. **Features**: Review core features and technical implementation details
3. **Planning**: [Deployment Guide](DEPLOYMENT.md) - Understand infrastructure and maintenance requirements

## 📋 Development Guidelines

### Code Organization
- **Backend**: Django apps organized by domain (users, admissions, schools, academic modules)
- **Frontend**: Component-based architecture with services, hooks, and type definitions
- **Testing**: All test files located in `backend/test/` folder with organized test data and scripts
- **Documentation**: All documentation consolidated in `docs/` folder with three main documents

### Best Practices
- **Backend**: Use Django REST Framework serializers, ViewSets, and proper permission classes
- **Frontend**: TypeScript for type safety, React Query for API state management, shadcn/ui for components
- **Database**: Proper indexing, migration management, and data validation
- **Security**: Input validation, file upload restrictions, JWT token management, and CORS configuration

### Development Workflow
1. **Local Setup**: Follow development environment setup in Deployment Guide
2. **Feature Development**: Use proper Git branching and testing procedures
3. **Testing**: Use management commands and test scripts for validation
4. **Documentation**: Update relevant documentation sections for new features

## 🔄 Version Information

- **Current Version**: 1.0.0
- **Last Updated**: January 2025
- **Status**: Production Ready ✅
- **Python**: 3.11+ required
- **Node.js**: 18+ required
- **Database**: PostgreSQL 15+ (production), SQLite (development)

## 📞 Support

### Getting Help
- **Development Issues**: Review API Reference and Architecture documentation
- **Deployment Issues**: Check Deployment Guide troubleshooting sections
- **System Questions**: Refer to specific documentation sections based on your role

### Contributing
- **Documentation**: Follow the same review process as code changes
- **Code Examples**: All examples are tested and validated
- **Updates**: Documentation is updated with each major feature release

---

**For detailed technical information, implementation guides, and deployment instructions, please refer to the specific documentation sections above.**

*This documentation is maintained by the Acharya ERP development team and reflects the current state of the system as of January 2025.*