# API URL Configuration Best Practices - Prevention Guide

## 🚨 Issue Resolution: Duplicate /api/v1/ URL Problem

### Problem Identified
The frontend was making requests to `/api/v1/api/v1/hostel/...` instead of `/api/v1/hostel/...` because:

1. **API Client Base URL**: Set to `http://localhost:8000/api/v1/` (with trailing slash)
2. **Service BASE_URL**: Set to `/api/v1/hostel` (with absolute path)
3. **Result**: URLs were concatenated as `baseURL + serviceURL` = `/api/v1/` + `/api/v1/hostel` = `/api/v1/api/v1/hostel`

### ✅ Solution Applied
- Changed `HostelAPI.BASE_URL` from `/api/v1/hostel` to `hostel`
- Changed staff endpoint from `staff/` to `users/staff/` (correct backend route)
- URLs now correctly resolve to: `http://localhost:8000/api/v1/hostel/...`

## 🛡️ Prevention Guidelines

### 1. API Service URL Configuration Rules

**✅ DO:**
```typescript
export class HostelAPI {
  private static BASE_URL = 'hostel';  // Relative to API client base
  
  static async getBlocks() {
    return await apiClient.get(`${this.BASE_URL}/blocks/`);  // Results in: /api/v1/hostel/blocks/
  }
}
```

**❌ DON'T:**
```typescript
export class HostelAPI {
  private static BASE_URL = '/api/v1/hostel';  // Absolute path - causes duplication
  
  static async getBlocks() {
    return await apiClient.get(`${this.BASE_URL}/blocks/`);  // Results in: /api/v1/api/v1/hostel/blocks/
  }
}
```

### 2. Backend Route Verification Checklist

Before creating frontend API services:

1. **Check Django URLs**: Review `backend/config/urls.py` for correct paths
2. **Verify App URLs**: Check individual app `urls.py` files
3. **Test with curl/Postman**: Verify endpoints work with correct URLs
4. **Document API routes**: Maintain a list of all available endpoints

### 3. API Client Configuration Standards

**Current Configuration** (`frontend/src/lib/api/client.ts`):
```typescript
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1/';
```

**Service Configuration Pattern**:
```typescript
// ✅ Correct: Relative paths only
export class SomeAPI {
  private static BASE_URL = 'app-name';  // maps to /api/v1/app-name/
}

// ✅ For cross-app references
export class SomeAPI {
  static async getUsers() {
    return await apiClient.get('users/staff/');  // maps to /api/v1/users/staff/
  }
}
```

### 4. Testing & Validation Process

1. **Build Check**: Always run `npm run build` after API changes
2. **Network Tab Inspection**: Check browser network tab for actual URLs
3. **Backend Logs**: Monitor Django logs for 404 errors
4. **TypeScript Compilation**: Use strict type checking

### 5. URL Debugging Commands

**Check actual API calls in development:**
```bash
# In browser console, monitor network requests
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);

# Check Django URL routing
python manage.py show_urls  # If django-extensions installed
```

## 📋 Backend URL Reference

**Available Endpoints** (from `backend/config/urls.py`):
- `api/v1/users/` → Users, Staff, Students, Parents
- `api/v1/schools/` → School management
- `api/v1/admissions/` → Admission applications
- `api/v1/fees/` → Fee management
- `api/v1/attendance/` → Attendance tracking
- `api/v1/exams/` → Examination system
- `api/v1/hostel/` → Hostel management ✅
- `api/v1/library/` → Library system
- `api/v1/notifications/` → Notifications
- `api/v1/dashboard/` → Dashboard data

## 🔍 Quick Debugging Script

Create this temporary file for URL validation:
```typescript
// debug-urls.ts
const apiBase = 'http://localhost:8000/api/v1/';
const services = {
  hostel: 'hostel',
  staff: 'users/staff',
  blocks: 'hostel/blocks',
};

Object.entries(services).forEach(([name, path]) => {
  console.log(`${name}: ${apiBase}${path}/`);
});
```

## 🎯 Result

**Before Fix**: ❌ `GET /api/v1/api/v1/hostel/blocks/ → 404`
**After Fix**: ✅ `GET /api/v1/hostel/blocks/ → 200`

This configuration ensures all future API services follow the correct URL pattern and prevents similar issues.