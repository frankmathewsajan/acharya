"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # API v1 endpoints
    path('api/v1/users/', include('users.urls')),
    path('api/v1/schools/', include('schools.urls')),
    path('api/v1/admissions/', include('admissions.urls')),
    path('api/v1/fees/', include('fees.urls')),
    path('api/v1/attendance/', include('attendance.urls')),
    path('api/v1/exams/', include('exams.urls')),
    path('api/v1/hostel/', include('hostel.urls')),
    path('api/v1/library/', include('library.urls')),
    path('api/v1/notifications/', include('notifications.urls')),
    path('api/v1/dashboard/', include('dashboard.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
