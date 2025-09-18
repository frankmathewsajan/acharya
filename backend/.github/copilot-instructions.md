# Copilot Instructions for Acharya Backend

## Project Overview
- **Framework:** Django 5.2.x + Django REST Framework (DRF) - early development stage
- **Current State:** Fresh Django project with scaffolded apps, minimal implementation
- **Tech Stack:** DRF, SimpleJWT, django-cors-headers, drf-spectacular (all installed but not configured)
- **Database:** SQLite (dev) - PostgreSQL planned for production
- **Dependencies:** Managed via `pyproject.toml` and `requirements.txt`

## Directory Structure
```
config/           # Django project settings (settings.py, urls.py, wsgi.py)
users/            # User management app (empty scaffold)
students/         # Student data app (empty scaffold)  
admissions/       # Admissions process app (empty scaffold)
staff/            # Staff management app (empty scaffold)
fees/             # Fee management app (empty scaffold)
attendance/       # Attendance tracking app (empty scaffold)
exams/            # Exam management app (empty scaffold)
hostel/           # Hostel management app (empty scaffold)
library/          # Library management app (empty scaffold)
notifications/    # Notifications app (empty scaffold)
reports/          # Reports generation app (empty scaffold)
analytics/        # Analytics app (empty scaffold)
parents/          # Parent portal app (empty scaffold)
```

## Current Implementation Status
- **Settings:** Default Django configuration in `config/settings.py`
- **Apps:** Created but not registered in `INSTALLED_APPS`
- **Models:** Empty scaffolds (`# Create your models here.`)
- **Views:** Empty scaffolds (`# Create your views here.`)
- **URLs:** Only admin panel configured (`/admin/`)
- **Database:** Default SQLite with no custom migrations

## Next Development Steps
1. **Configure DRF:** Add `rest_framework` and apps to `INSTALLED_APPS`
2. **Set up JWT:** Configure `rest_framework_simplejwt` authentication
3. **Create models:** Start with `User`, `StudentProfile`, `StaffProfile` in respective apps
4. **API structure:** Plan `/api/v1/` versioned endpoints using DRF routers
5. **Database:** Switch to PostgreSQL for production

## Key Files to Modify
- `config/settings.py` - Add installed apps, DRF config, JWT settings
- `config/urls.py` - Include app URLs and API routes
- App `models.py` files - Define data models based on `ARCHITECTURE.md`
- App `views.py` files - Implement DRF ViewSets
- App `urls.py` files - Create for each app with URL patterns

## Development Commands
- **Run server:** `uv run manage.py runserver`
- **Create/apply migrations:** `uv run manage.py makemigrations && uv run manage.py migrate`
- **Create superuser:** `uv run manage.py createsuperuser`
- **Install dependencies:** `uv sync` or `pip install -r requirements.txt`
- **Install new package:** `uv add <package-name>`

## Architecture Reference
- See `ARCHITECTURE.md` for comprehensive design blueprints and planned features
- Current implementation is minimal - most patterns described there are aspirational
- Focus on foundational setup: models, authentication, basic CRUD APIs first

---
_This is an early-stage project. When implementing features, refer to ARCHITECTURE.md for design guidance while building incrementally._
