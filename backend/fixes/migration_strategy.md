# Migration Strategy for System Consistency
# migrations/migration_strategy.md

## Phase 1: Backend Model Fixes (CRITICAL - Do First)

### 1.1 Role Consistency Fix
```python
# Create migration to update User.role choices
# users/migrations/XXXX_fix_role_choices.py

from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('users', '0011_staffprofile_school'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('student', 'Student'),
                    ('parent', 'Parent'), 
                    ('faculty', 'Faculty'),
                    ('warden', 'Warden'),
                    ('admin', 'Admin'),  # Changed from 'management'
                    ('librarian', 'Librarian'),
                ],
                max_length=20
            ),
        ),
        # Data migration to update existing 'management' role to 'admin'
        migrations.RunSQL(
            "UPDATE users_user SET role = 'admin' WHERE role = 'management';",
            reverse_sql="UPDATE users_user SET role = 'management' WHERE role = 'admin';"
        ),
    ]
```

### 1.2 Add Missing Related Names
```python
# Create migrations for each app to add related_name

# hostel/migrations/XXXX_add_related_names.py
operations = [
    migrations.AlterField(
        model_name='hostelallocation',
        name='student',
        field=models.ForeignKey(
            'users.StudentProfile',
            on_delete=models.CASCADE,
            related_name='hostel_allocations'
        ),
    ),
    migrations.AlterField(
        model_name='hostelallocation', 
        name='bed',
        field=models.ForeignKey(
            'HostelBed',
            on_delete=models.CASCADE,
            related_name='allocation'
        ),
    ),
    # ... similar for other fields
]
```

## Phase 2: Serializer Standardization

### 2.1 Implement Standard Response Format
1. Create `utils/api_responses.py` (already exists - enhance)
2. Update all ViewSets to use standard response format
3. Add consistent error handling

### 2.2 Field Name Consistency
```python
# Update serializers to match frontend expectations
class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    school_info = serializers.SerializerMethodField()
    
    def get_school_info(self, obj):
        if obj.school:
            return {
                'id': obj.school.id,
                'name': obj.school.school_name,  # Note: frontend expects 'name'
                'code': obj.school.school_code
            }
        return None
```

## Phase 3: Frontend Updates

### 3.1 Update Type Definitions
1. Replace existing types with comprehensive types
2. Ensure all API calls use new types
3. Update interfaces to match backend response format

### 3.2 Enhanced API Client
1. Replace existing API client with enhanced version
2. Add proper error handling
3. Implement response normalization

### 3.3 Role Mapping Fix
```typescript
// Update role mapping in frontend
const ROLE_MAPPING = {
  'admin': 'admin',      // No longer 'management'
  'faculty': 'faculty',
  'student': 'student',
  'parent': 'parent',
  'warden': 'warden',
  'librarian': 'librarian'
};
```

## Phase 4: Permission System Enhancement

### 4.1 Backend Permissions
1. Add comprehensive permission classes
2. Update all ViewSets to use proper permissions
3. Implement role-based filtering

### 4.2 Frontend Route Protection
```typescript
// Add role-based route protection
<ProtectedRoute requiredRole="admin">
  <AdminDashboard />
</ProtectedRoute>
```

## Phase 5: Admin Interface Improvements

### 5.1 Enhanced Admin Classes
1. Update all admin classes with better displays
2. Add proper filtering and search
3. Implement admin actions

### 5.2 Custom Admin Views
1. Add dashboard views in admin
2. Implement bulk operations
3. Add export functionality

## Deployment Checklist

### Pre-deployment
- [ ] Run all migrations in staging
- [ ] Test all API endpoints
- [ ] Verify frontend-backend integration
- [ ] Check admin interface functionality

### Post-deployment
- [ ] Monitor error logs
- [ ] Verify user authentication works
- [ ] Test all dashboard functionalities
- [ ] Confirm data integrity

### Rollback Plan
- [ ] Keep database backup before migration
- [ ] Document reversal steps for each change
- [ ] Test rollback procedure in staging

## Testing Strategy

### Backend Tests
```python
# Add comprehensive tests for:
- Model relationships
- Serializer validation
- Permission classes
- API endpoint responses
```

### Frontend Tests
```typescript
// Add tests for:
- API client error handling
- Type safety
- Component integration
- Role-based rendering
```

## Performance Considerations

### Database Optimization
1. Add missing database indexes
2. Optimize querysets with select_related/prefetch_related
3. Monitor slow queries

### Frontend Optimization
1. Implement proper error boundaries
2. Add loading states
3. Optimize API call patterns

## Monitoring & Alerts

### Backend Monitoring
- API response times
- Error rates by endpoint
- Database query performance

### Frontend Monitoring
- Client-side errors
- API call failures
- User experience metrics