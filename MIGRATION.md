# Migration Guide: PySimpleGUI + SQLite to React (Vite) + Django REST Framework

This document explains, end-to-end, how to migrate the current desktop-like PySimpleGUI app into a modern web stack:
- Frontend: React (Vite)
- Backend: Django + Django REST Framework (DRF)
- Database: SQLite for development (PostgreSQL recommended for production)
- Auth: JWT (djangorestframework-simplejwt)

The guide is exhaustive and tailored to this codebase’s actual flows, tables, and business rules.

## 1) Current System: What it does (from code)

Key files and responsibilities:
- `project.py`: Orchestrates UI and flows. Google Books API search (`api_call`), handles authentication screens, main window events, checkout/purchase/return, add money, image preview.
- `classes/Database.py`: SQLite schema and helpers. Tables:
  - `users(username TEXT UNIQUE, password BLOB, auth BOOLEAN, checked_out INT, purchased INT, balance INT)`
  - `searches(username TEXT, search TEXT UNIQUE)`
  - `books(uid TEXT, type TEXT, username TEXT, date TEXT)`  // type ∈ {BORROWED, PURCHASED}
  - `config(id TEXT UNIQUE, value TEXT)`                    // stores `resume`
  - `library(title TEXT, image_data BLOB, author TEXT, publisher TEXT, description TEXT, imageLinks TEXT, price NUMERIC, uid TEXT, pgno INTEGER, type TEXT, saleability BOOLEAN, search TEXT)`
- `classes/Accounts.py`: Auth, register, login, logout, password reset, add money, delete account, block/unblock, fine calculation and checking in/out.
- `classes/Library.py`: Saves search results into `library`, returns records, updates cover image bytes, stores/retrieves searches.
- `classes/Layouts.py`: PySimpleGUI layouts for Authentication, Main, and Search/Available.
- `classes/__init__.py`: Constants: `CHECKOUT_LIMIT=3`, `DUE_DAYS=10`, `FINE=10`, UI theme/title, regexes for usernames/passwords.

Important flows to preserve:
- Authentication (register/login/logout/reset password). Demo auth stored in `users` table using bcrypt in the current code.
- “Search NEW Books” calls Google Books API; otherwise “See Available Books” shows local `library` table.
- Check Out: Enforces `CHECKOUT_LIMIT`. Adds `books` row with type BORROWED, updates user `checked_out` count.
- Return Book: Computes due date and late fine; deducts fine from `balance`; if negative balance, block further actions.
- Purchase Book: Deducts price from balance; records `books` row of type PURCHASED; updates `purchased` count.
- Add Money: Increases `balance`.
- Members: Lists other users with checked_out and purchased counts.
- Suggestions: Recent searches from `searches` (user or `SYSTEM`).


## 2) Target Web Architecture

- React (Vite) SPA consuming a REST API.
- Django REST Framework provides all endpoints.
- JWT auth: access + refresh tokens. Use `djangorestframework-simplejwt`.
- CORS enabled for local dev.
- Optional: Store covers either as binary (BinaryField) or as files (ImageField + media storage). The current app stores PNG bytes in `image_data` and a `imageLinks` URL. We’ll keep URL as primary and optionally cache binary.

Recommended repo layout (monorepo example):
```
root/
  backend/
    manage.py
    lms/              # Django project settings
    accounts/         # Custom user + auth endpoints
    library/          # Books, searches, user-books relations
    transactions/     # Optional: balance ledger & fines (optional but useful)
  frontend/
    index.html
    src/
      main.tsx
      App.tsx
      api/           # axios client & API hooks
      features/      # auth, library, account, members
      pages/         # Login, Register, Reset, Dashboard, Search, Available
      components/    # tables, cards, forms
```


## 3) Django Backend Design (DRF)

### 3.1 Create project and apps (Windows PowerShell)
```powershell
# From repo root
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers Pillow

django-admin startproject lms backend
cd backend
python manage.py startapp accounts
python manage.py startapp library
python manage.py startapp transactions  # optional but recommended
```

### 3.2 Settings (backend/lms/settings.py)
- Add installed apps: `rest_framework`, `corsheaders`, `accounts`, `library`, `transactions` (if used).
- Auth model: use a custom user to track balance/counters, or a Profile. Custom user is simpler for parity.
- REST framework + JWT config.
- CORS origins: allow Vite dev server.
- Media files if using ImageField.

Example snippets:
```python
# settings.py
INSTALLED_APPS = [
    # ...
    'rest_framework',
    'corsheaders',
    'accounts', 'library', 'transactions',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ...
]

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',  # Vite default
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

AUTH_USER_MODEL = 'accounts.User'

# Constants from classes/__init__.py
CHECKOUT_LIMIT = 3
DUE_DAYS = 10
FINE = 10

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

### 3.3 Models
Map existing tables (see Database.py) to Django models. Suggested:

```python
# accounts/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    # Django handles password hashing; use username or email login as you prefer
    checked_out = models.PositiveIntegerField(default=0)
    purchased = models.PositiveIntegerField(default=0)
    balance = models.IntegerField(default=0)  # mirrors int behavior in current app
    is_blocked = models.BooleanField(default=False)  # equivalent to Accounts.block()
```

```python
# library/models.py
from django.conf import settings
from django.db import models

class LibraryBook(models.Model):
    # Cached books from Google Books API
    uid = models.CharField(max_length=64, unique=True)  # google id
    title = models.TextField()
    author = models.TextField(null=True, blank=True)  # stored base64 in old code
    publisher = models.TextField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    image_links = models.URLField(null=True, blank=True)
    image_data = models.BinaryField(null=True, blank=True)  # optional cache
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    pgno = models.IntegerField(null=True, blank=True)
    audience_type = models.CharField(max_length=50, null=True, blank=True)  # old `type`
    saleability = models.BooleanField(default=False)
    last_search = models.CharField(max_length=255, null=True, blank=True)   # old `search`

class UserBook(models.Model):
    BORROWED = 'BORROWED'
    PURCHASED = 'PURCHASED'
    KIND_CHOICES = [(BORROWED, 'Borrowed'), (PURCHASED, 'Purchased')]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    book = models.ForeignKey(LibraryBook, on_delete=models.CASCADE)
    kind = models.CharField(max_length=10, choices=KIND_CHOICES)
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'book', 'kind')

class Search(models.Model):
    # `SYSTEM` searches will have user = None
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    query = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

Optional ledger for transactions/fines (helps auditing):
```python
# transactions/models.py
from django.conf import settings
from django.db import models

class Transaction(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    amount = models.IntegerField()
    reason = models.CharField(max_length=100)  # e.g., ADD_MONEY, LATE_FINE
    created_at = models.DateTimeField(auto_now_add=True)
```

### 3.4 Serializers & Permissions
```python
# accounts/serializers.py
from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'checked_out', 'purchased', 'balance', 'is_blocked']
```

```python
# library/serializers.py
from rest_framework import serializers
from .models import LibraryBook, UserBook, Search

class LibraryBookSerializer(serializers.ModelSerializer):
    class Meta:
        model = LibraryBook
        fields = '__all__'

class UserBookSerializer(serializers.ModelSerializer):
    book = LibraryBookSerializer(read_only=True)
    book_id = serializers.PrimaryKeyRelatedField(source='book', queryset=LibraryBook.objects.all(), write_only=True)

    class Meta:
        model = UserBook
        fields = ['id', 'kind', 'date', 'book', 'book_id']

class SearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Search
        fields = ['id', 'query', 'created_at']
```

### 3.5 Views / Endpoints
Auth (JWT):
- POST `/api/auth/register/`  → create user
- POST `/api/auth/token/`     → obtain JWT (username+password)
- POST `/api/auth/token/refresh/` → refresh JWT
- POST `/api/auth/reset-password/` → request reset (simple: change with old password or admin)  
  Note: The desktop app allowed direct reset if account exists. On the web, require authentication or email flow; adjust policy as needed.

Accounts:
- GET `/api/me/` → current user snapshot (checked_out, purchased, balance, is_blocked)
- POST `/api/me/add-money/` {amount} → returns new balance
- POST `/api/me/delete/` → delete account (soft or hard delete)

Library/Search:
- GET `/api/library/search/?q=term&offline=true|false` →
  - offline=true: query local cache (`LibraryBook` and `Search`)
  - offline=false: call Google Books API, save books to cache (`LibraryBook` + `Search`), return list
- GET `/api/library/books/` → list cached books (filters: by `last_search`, `uid`)
- GET `/api/library/books/:uid/` → details
- GET `/api/library/suggestions/` → recent queries (user + SYSTEM)

UserBooks (checkouts/purchases/returns):
- POST `/api/userbooks/checkout/` {uid}
  - Validate not blocked, under `CHECKOUT_LIMIT`, not already borrowed.
- POST `/api/userbooks/purchase/` {uid}
  - Validate balance ≥ price, not already purchased.
- POST `/api/userbooks/return/` {uid}
  - Compute fine: days late × `FINE`. Deduct; block if balance < 0. Remove BORROWED row.
- GET `/api/userbooks/borrowed/`
- GET `/api/userbooks/purchased/`

Members:
- GET `/api/members/` → list other users’ `username`, `checked_out`, `purchased` (no balances).

Implementation notes mapping to current code:
- Fine calculation matches `Accounts.fine()` and constants in settings.
- “Block” mirrors `Accounts.block()` by setting `user.is_blocked = True` if balance < 0.
- Counts (`checked_out`, `purchased`) should be updated transactionally alongside `UserBook` changes.
- When saving Google Books, set `saleability`, `price`, `image_links`, cache `image_data` optionally via a background task or on-demand fetch.

### 3.6 URL routing
```python
# backend/lms/urls.py
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('api/auth/token/', TokenObtainPairView.as_view()),
    path('api/auth/token/refresh/', TokenRefreshView.as_view()),
    path('api/accounts/', include('accounts.urls')),
    path('api/library/', include('library.urls')),
    path('api/userbooks/', include('library.userbooks_urls')),
]
```

### 3.7 Google Books service (parity with `api_call`)
- Timeout ~3s. Translate exceptions to 5xx/4xx with useful messages.
- Save `LibraryBook` records and a `Search` row. Reuse if search exists.

### 3.8 Validation & rules mapping
- Username regex and password regex from `classes/__init__.py` can be enforced server-side with DRF serializer validation if required.
- Checkout limit: enforce in view before creating a new `UserBook` of kind BORROWED.
- Negative balance blocking: enforce in actions and expose `is_blocked` in `/api/me/`.
- Image handling: prefer `image_links` for display; load `image_data` only when previewing if you decide to cache.

### 3.9 Errors & response codes
- Use 400 for validation errors, 401/403 for auth/permission, 404 for missing resources, 409 for conflicts (e.g., already borrowed/purchased), 422 for semantic validation if desired.
- Include machine-readable `code` in error payloads when possible.


## 4) Data Migration from current SQLite

Source DB: `databases/sqlite.db`

Caveats:
- Passwords are bcrypt-hashed in the old DB in a custom format. You cannot import these into Django’s PBKDF2 without knowing the plaintext. Strategy:
  - Create users with `set_unusable_password()` and force a password reset (web UI) OR
  - Generate temp random passwords and communicate out-of-band.
- The `author`, `publisher`, `description` are base64-encoded strings in old DB. Decode to plain text for Django.
- `image_data` is PNG bytes in BLOB; you can store in BinaryField or write to `ImageField` with filenames like `{uid}.png`.
- `searches.username == 'SYSTEM'` → store `user = None`.

Steps (PowerShell):
```powershell
# Ensure backend venv is active
cd backend
python manage.py makemigrations
python manage.py migrate
```

Create a management command `python manage.py import_legacy_sqlite --path ..\databases\sqlite.db` that:
1) Opens legacy sqlite via `sqlite3.connect(path)`.
2) Migrate users:
   - For each row in `users`: create `accounts.User(username=..., checked_out=..., purchased=..., balance=...)` and `set_unusable_password()`.
3) Migrate library books:
   - Decode base64 text fields where needed (if encoded in legacy; author/publisher/description were base64). Save `uid`, `title`, `price`, `pgno`, `image_links`, `saleability`, `audience_type`.
   - If `image_data` present, store to BinaryField or write a File to `media/covers/{uid}.png` and keep path in an ImageField (if you switch to ImageField).
4) Migrate searches:
   - For each `searches` row: if `username == 'SYSTEM'` → `user=None`, else FK to the corresponding `User`.
5) Migrate user-books:
   - For each row in `books`: join to `LibraryBook` by `uid` and the `User` by username. Create `UserBook(kind=type, date=parsed)`.
6) Recompute and sync user counters (`checked_out`, `purchased`) from `UserBook` table just to be safe.
7) Optionally create `transactions.Transaction` entries:
   - Positive for “Add Money” is not tracked historically in legacy, only current balance; you may add an initial transaction of type INIT_BALANCE with the user’s current balance.

Skeleton command (key points):
```python
# backend/library/management/commands/import_legacy_sqlite.py
import base64, sqlite3
from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import User
from library.models import LibraryBook, UserBook, Search

class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('--path', required=True)

    def handle(self, *args, **opts):
        conn = sqlite3.connect(opts['path'])
        c = conn.cursor()
        # users
        for (username, password, auth, checked_out, purchased, balance) in c.execute('SELECT username,password,auth,checked_out,purchased,balance FROM users'):
            u, _ = User.objects.get_or_create(username=username, defaults={
                'checked_out': checked_out or 0,
                'purchased': purchased or 0,
                'balance': balance or 0,
            })
            u.set_unusable_password(); u.save()
        # library
        for row in c.execute('SELECT title,image_data,author,publisher,description,imageLinks,price,uid,pgno,type,saleability,search FROM library'):
            (title, image_data, author, publisher, description, imageLinks, price, uid, pgno, type_, saleability, search) = row
            def dec(x):
                if x is None: return None
                try: return base64.b64decode(x).decode()
                except Exception: return x
            book, _ = LibraryBook.objects.update_or_create(uid=uid, defaults={
                'title': title,
                'author': dec(author),
                'publisher': dec(publisher),
                'description': dec(description),
                'image_links': imageLinks,
                'image_data': image_data,
                'price': price or 0,
                'pgno': pgno,
                'audience_type': type_,
                'saleability': bool(saleability),
                'last_search': search,
            })
        # searches
        for (username, query) in c.execute('SELECT username, search FROM searches'):
            user = None if username == 'SYSTEM' else User.objects.filter(username=username).first()
            Search.objects.get_or_create(query=query, defaults={'user': user})
        # userbooks
        for (uid, kind, username, date) in c.execute('SELECT uid, type, username, date FROM books'):
            user = User.objects.get(username=username)
            book = LibraryBook.objects.get(uid=uid)
            UserBook.objects.get_or_create(user=user, book=book, kind=kind)
        # sync counts
        for u in User.objects.all():
            u.checked_out = UserBook.objects.filter(user=u, kind='BORROWED').count()
            u.purchased = UserBook.objects.filter(user=u, kind='PURCHASED').count()
            u.save()
```


## 5) React (Vite) Frontend Design

### 5.1 Create app
```powershell
# From repo root
npm create vite@latest frontend -- --template react-ts
cd frontend
npm i axios react-router-dom
npm i -D @types/node
```

### 5.2 Env and API client
Create `.env`:
```
VITE_API_BASE_URL=http://localhost:8000
```

`src/api/client.ts`:
```ts
import axios from 'axios'

const client = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL + '/api' })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default client
```

### 5.3 Routing and pages
- `/login`, `/register`, `/reset-password`
- `/` (Dashboard):
  - Balance and actions: Add Money; Logout; Delete Account; Refresh; Full Screen (browser full screen optional)
  - Library: buttons for “Search NEW Books” and “See Available Books”
  - Tables: Checked Out, Purchased, Members
  - Grid of book cover buttons for currently checked out (click to Return)
- `/search` (online) and `/available` (offline)

Example API interactions:
```ts
// login
await client.post('/auth/token/', { username, password })

// me snapshot
const { data: me } = await client.get('/accounts/me/')

// add money
await client.post('/accounts/add-money/', { amount })

// search online
const { data: books } = await client.get('/library/search/', { params: { q: term, offline: false } })

// checkout
await client.post('/userbooks/checkout/', { uid })

// return
await client.post('/userbooks/return/', { uid })
```

### 5.4 Dev proxy (optional)
Instead of CORS, you can proxy in `vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
```

### 5.5 UI considerations mapped from PySimpleGUI
- Suggestions list below search input (GET `/library/suggestions/`).
- Details pane shows title, author, description, pages, audience/type, publisher, price and Buy/Checkout buttons. Load cover from `image_links` and fallback to placeholder if missing.
- Disable actions if `me.is_blocked` or `balance < 0` (parity with Accounts.block())
- Respect `CHECKOUT_LIMIT` on client by disabling Checkout when borrowed count ≥ limit (still enforce on server).


## 6) Running locally (two processes)

Backend:
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver 0.0.0.0:8000
```

Frontend:
```powershell
cd frontend
npm run dev
```

Login for testing:
- Legacy demo creds won’t be migrated as-is (passwords). Create a new user via `/api/auth/register/` or `createsuperuser`:
```powershell
cd backend
python manage.py createsuperuser
```


## 7) Parity Checklist (functional)
- Authentication: register, login, logout, reset
- Search NEW Books (online via Google Books API)
- See Available Books (offline from cached `LibraryBook`)
- Suggestions: user + SYSTEM
- Checkout: limit of `CHECKOUT_LIMIT`
- Purchased and Checked Out tables
- Return: compute fine `days_late * FINE`, deduct from balance, block if negative
- Add Money: update balance
- Members table: other users’ username, checked_out, purchased
- Delete Account: deletes account and related data
- Images for checked out items: show cover thumbnails


## 8) Testing

Backend:
- Unit test fine calculation, checkout limit, purchase insufficient balance, return applies fine and blocks when negative.
- Test search glue code: offline returns cache; online calls external API (mock requests).

Frontend:
- Component tests for forms and API error handling.
- Integration test for login flow and protected route.


## 9) Deployment Notes (outline)
- Backend: Use PostgreSQL; set `ALLOWED_HOSTS`, `SECRET_KEY`, `DEBUG=False`. Static via WhiteNoise or S3. Run with Gunicorn/Uvicorn + Nginx.
- Frontend: `npm run build`; host on Netlify/Vercel/S3+CloudFront. Set `VITE_API_BASE_URL` to backend URL.
- CORS: Lock down origins to your domain.


## 10) Appendix: Endpoint Reference (example contracts)

- POST `/api/auth/register/`
  - in: { username, password }
  - out: 201 { id, username }
- POST `/api/auth/token/`
  - in: { username, password }
  - out: { access, refresh }
- GET `/api/me/`
  - out: { id, username, checked_out, purchased, balance, is_blocked }
- POST `/api/me/add-money/`
  - in: { amount: number }
  - out: { balance }
- POST `/api/me/delete/`
  - out: 204
- GET `/api/library/search/?q=foo&offline=false`
  - out: [{ uid, title, author, price, pgno, audience_type, saleability, image_links }]
- GET `/api/library/books/?uid=...`
  - out: same fields as above + description, publisher
- GET `/api/library/suggestions/`
  - out: [query]
- POST `/api/userbooks/checkout/`
  - in: { uid }
  - out: 201 { id }
- POST `/api/userbooks/purchase/`
  - in: { uid }
  - out: 201 { id, balance }
- POST `/api/userbooks/return/`
  - in: { uid }
  - out: 200 { fine, balance, blocked }
- GET `/api/userbooks/borrowed/`
  - out: [{ id, date, book: {...} }]
- GET `/api/userbooks/purchased/`
  - out: [{ id, date, book: {...} }]
- GET `/api/members/`
  - out: [{ username, checked_out, purchased }]


---
If you want, I can scaffold the Django project, basic models, serializers, and a Vite starter in a branch to kickstart the migration.
