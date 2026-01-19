from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import (
    Building, Unit, Tenant, Payment, SystemSettings,
    Expense, MaintenanceRequest, Document, Lease, ActivityLog, UserProfile,
    Utility, PropertyPhoto
)


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    fields = ['role', 'phone_number']


class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = ['username', 'email', 'first_name',
                    'last_name', 'get_role', 'is_active', 'is_staff']
    list_filter = ['is_active', 'is_staff', 'profile__role']

    def get_role(self, obj):
        try:
            return obj.profile.get_role_display()
        except UserProfile.DoesNotExist:
            return '-'
    get_role.short_description = 'Role'


# Unregister the default User admin and register our custom one
admin.site.unregister(User)
admin.site.register(User, UserAdmin)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'phone_number', 'created_at']
    list_filter = ['role', 'created_at']
    search_fields = ['user__username', 'user__email', 'phone_number']


@admin.register(Building)
class BuildingAdmin(admin.ModelAdmin):
    list_display = ['name', 'address', 'total_units',
                    'occupied_units_count', 'occupancy_rate']
    search_fields = ['name', 'address']
    list_filter = ['created_at']

    def occupied_units_count(self, obj):
        return obj.occupied_units_count
    occupied_units_count.short_description = 'Occupied Units'

    def occupancy_rate(self, obj):
        return f"{obj.occupancy_rate:.1f}%"
    occupancy_rate.short_description = 'Occupancy Rate'


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ['unit_number', 'building', 'monthly_rent',
                    'bedrooms', 'bathrooms', 'status', 'current_tenant']
    list_filter = ['status', 'building', 'bedrooms']
    search_fields = ['unit_number', 'building__name']
    ordering = ['building', 'unit_number']

    def current_tenant(self, obj):
        tenant = obj.current_tenant
        return tenant.full_name if tenant else '-'
    current_tenant.short_description = 'Current Tenant'


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'unit', 'phone', 'email',
                    'move_in_date', 'is_active', 'total_balance']
    list_filter = ['move_in_date', 'unit__building']
    search_fields = ['first_name', 'last_name', 'email', 'phone', 'id_number']
    date_hierarchy = 'move_in_date'

    def total_balance(self, obj):
        balance = obj.total_balance
        return f"KES {balance:,.2f}"
    total_balance.short_description = 'Balance'


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'payment_type', 'amount',
                    'payment_method', 'transaction_date', 'description']
    list_filter = ['payment_type', 'payment_method', 'transaction_date']
    search_fields = ['tenant__first_name',
                     'tenant__last_name', 'reference_number', 'description']
    date_hierarchy = 'transaction_date'

    def amount(self, obj):
        return f"KES {obj.amount:,.2f}"
    amount.short_description = 'Amount'


@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    fieldsets = (
        ('Late Fee Settings', {
            'fields': ('late_fee_enabled', 'late_fee_grace_days',
                       'late_fee_percentage', 'late_fee_minimum')
        }),
        ('Notification Settings', {
            'fields': ('notifications_enabled', 'send_rent_reminders',
                       'reminder_days_before_due')
        }),
    )

    def has_add_permission(self, request):
        # Only allow one settings instance
        return not SystemSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        # Don't allow deletion of settings
        return False


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['expense_date', 'category',
                    'description', 'amount', 'building', 'vendor', 'paid']
    list_filter = ['category', 'paid', 'expense_date', 'building']
    search_fields = ['description', 'vendor', 'receipt_number']
    date_hierarchy = 'expense_date'
    ordering = ['-expense_date']


@admin.register(MaintenanceRequest)
class MaintenanceRequestAdmin(admin.ModelAdmin):
    list_display = ['title', 'unit', 'tenant',
                    'priority', 'status', 'category', 'reported_date']
    list_filter = ['status', 'priority', 'category', 'reported_date']
    search_fields = ['title', 'description',
                     'tenant__first_name', 'tenant__last_name']
    date_hierarchy = 'reported_date'
    ordering = ['-reported_date']


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'document_type', 'tenant',
                    'building', 'upload_date', 'expiry_date']
    list_filter = ['document_type', 'upload_date']
    search_fields = ['title', 'description']
    date_hierarchy = 'upload_date'


@admin.register(Lease)
class LeaseAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'unit', 'start_date', 'end_date',
                    'monthly_rent', 'status', 'is_expiring_soon']
    list_filter = ['status', 'start_date', 'end_date']
    search_fields = ['tenant__first_name',
                     'tenant__last_name', 'unit__unit_number']
    date_hierarchy = 'start_date'

    def is_expiring_soon(self, obj):
        return obj.is_expiring_soon
    is_expiring_soon.boolean = True
    is_expiring_soon.short_description = 'Expiring Soon'


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'user', 'action', 'model_name', 'description']
    list_filter = ['action', 'model_name', 'timestamp']
    search_fields = ['user', 'description']
    date_hierarchy = 'timestamp'
    ordering = ['-timestamp']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(PropertyPhoto)
class PropertyPhotoAdmin(admin.ModelAdmin):
    list_display = ['photo_type', 'building', 'unit',
                    'caption', 'is_primary', 'display_order', 'uploaded_at']
    list_filter = ['photo_type', 'is_primary']
    search_fields = ['building__name', 'unit__unit_number', 'caption']
    date_hierarchy = 'uploaded_at'
