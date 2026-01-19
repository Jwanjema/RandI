from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BuildingViewSet, UnitViewSet, TenantViewSet, PaymentViewSet,
    ExpenseViewSet, MaintenanceRequestViewSet, DocumentViewSet,
    LeaseViewSet, ActivityLogViewSet, UserViewSet, UserProfileViewSet,
    UtilityViewSet, PropertyPhotoViewSet
)
from .auth_views import login_view, logout_view, current_user, signup_view, csrf_token_view

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'user-profiles', UserProfileViewSet)
router.register(r'buildings', BuildingViewSet)
router.register(r'units', UnitViewSet)
router.register(r'tenants', TenantViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'maintenance', MaintenanceRequestViewSet)
router.register(r'documents', DocumentViewSet)
router.register(r'leases', LeaseViewSet)
router.register(r'activity-logs', ActivityLogViewSet)
router.register(r'utilities', UtilityViewSet)
router.register(r'photos', PropertyPhotoViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/csrf/', csrf_token_view, name='csrf'),
    path('auth/login/', login_view, name='login'),
    path('auth/signup/', signup_view, name='signup'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/me/', current_user, name='current-user'),
]
