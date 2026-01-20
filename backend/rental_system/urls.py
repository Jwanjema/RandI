"""
URL configuration for rental_system project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from properties.auth_views import (
    csrf_token_view,
    login_view,
    signup_view,
    logout_view,
    current_user,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('properties.urls')),
    # Compatibility routes so frontend calls without /api work
    path('auth/csrf/', csrf_token_view, name='csrf-root'),
    path('auth/login/', login_view, name='login-root'),
    path('auth/signup/', signup_view, name='signup-root'),
    path('auth/logout/', logout_view, name='logout-root'),
    path('auth/me/', current_user, name='current-user-root'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,
                          document_root=settings.MEDIA_ROOT)
