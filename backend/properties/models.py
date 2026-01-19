from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth.models import User
from decimal import Decimal


class UserProfile(models.Model):
    """
    Extended user profile with role-based permissions
    """
    ROLE_CHOICES = [
        ('ADMIN', 'Administrator'),
        ('MANAGER', 'Property Manager'),
        ('ACCOUNTANT', 'Accountant'),
        ('MAINTENANCE', 'Maintenance Staff'),
        ('TENANT', 'Tenant'),
    ]

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(
        max_length=20, choices=ROLE_CHOICES, default='TENANT')
    phone_number = models.CharField(max_length=15, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['user__username']

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"


class Building(models.Model):
    """
    Represents a building/property in the rental system.
    """
    name = models.CharField(max_length=200)
    address = models.TextField()
    total_units = models.IntegerField(validators=[MinValueValidator(1)])
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.address}"

    class Meta:
        ordering = ['name']

    @property
    def occupied_units_count(self):
        """Returns the number of occupied units in this building."""
        return self.units.filter(status='OCCUPIED').count()

    @property
    def vacant_units_count(self):
        """Returns the number of vacant units in this building."""
        return self.units.filter(status='VACANT').count()

    @property
    def occupancy_rate(self):
        """Returns the occupancy rate as a percentage."""
        if self.total_units == 0:
            return 0
        return (self.occupied_units_count / self.total_units) * 100

    @property
    def total_potential_income(self):
        """Returns the total potential monthly income if all units were occupied."""
        return sum(unit.monthly_rent for unit in self.units.all())

    @property
    def actual_monthly_income(self):
        """Returns the actual monthly income from occupied units."""
        return sum(
            unit.monthly_rent
            for unit in self.units.filter(status='OCCUPIED')
        )


class Unit(models.Model):
    """
    Represents a rental unit within a building.
    """
    STATUS_CHOICES = [
        ('VACANT', 'Vacant'),
        ('OCCUPIED', 'Occupied'),
        ('MAINTENANCE', 'Under Maintenance'),
    ]

    building = models.ForeignKey(
        Building,
        on_delete=models.CASCADE,
        related_name='units'
    )
    unit_number = models.CharField(max_length=50)
    monthly_rent = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    bedrooms = models.IntegerField(default=1)
    bathrooms = models.IntegerField(default=1)
    square_feet = models.IntegerField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='VACANT'
    )
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.building.name} - Unit {self.unit_number}"

    class Meta:
        ordering = ['building', 'unit_number']
        unique_together = ['building', 'unit_number']

    @property
    def current_tenant(self):
        """Returns the current tenant if unit is occupied."""
        if self.status == 'OCCUPIED':
            return self.tenants.filter(move_out_date__isnull=True).first()
        return None


class Tenant(models.Model):
    """
    Represents a tenant renting a unit.
    """
    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        related_name='tenants'
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    id_number = models.CharField(max_length=50, unique=True)
    emergency_contact_name = models.CharField(
        max_length=200, blank=True, null=True)
    emergency_contact_phone = models.CharField(
        max_length=20, blank=True, null=True)
    move_in_date = models.DateField()
    move_out_date = models.DateField(blank=True, null=True)
    deposit_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.unit}"

    class Meta:
        ordering = ['-move_in_date']

    @property
    def full_name(self):
        """Returns the tenant's full name."""
        return f"{self.first_name} {self.last_name}"

    @property
    def is_active(self):
        """Returns True if tenant is currently occupying the unit."""
        return self.move_out_date is None

    @property
    def total_balance(self):
        """Returns the tenant's current balance (positive = owes money)."""
        total_charges = sum(
            payment.amount
            for payment in self.payments.filter(payment_type='CHARGE')
        )
        total_payments = sum(
            payment.amount
            for payment in self.payments.filter(payment_type='PAYMENT')
        )
        return total_charges - total_payments

    def save(self, *args, **kwargs):
        """Override save to update unit status."""
        is_new = self.pk is None
        super().save(*args, **kwargs)

        # Update unit status
        if self.is_active:
            self.unit.status = 'OCCUPIED'
        else:
            # Check if there are any other active tenants
            active_tenants = self.unit.tenants.filter(
                move_out_date__isnull=True
            ).exclude(pk=self.pk)
            if not active_tenants.exists():
                self.unit.status = 'VACANT'

        self.unit.save()


class Payment(models.Model):
    """
    Represents a payment transaction (both charges and payments).
    This maintains a complete audit trail of all financial transactions.
    """
    PAYMENT_TYPE_CHOICES = [
        ('CHARGE', 'Charge'),  # Rent due, late fees, etc.
        ('PAYMENT', 'Payment'),  # Money received from tenant
    ]

    PAYMENT_METHOD_CHOICES = [
        ('CASH', 'Cash'),
        ('MPESA', 'M-Pesa'),
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('CHEQUE', 'Cheque'),
        ('OTHER', 'Other'),
    ]

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    payment_type = models.CharField(
        max_length=20,
        choices=PAYMENT_TYPE_CHOICES
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        blank=True,
        null=True
    )
    transaction_date = models.DateField()
    description = models.CharField(max_length=200)
    reference_number = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.payment_type} - {self.tenant.full_name} - {self.amount}"

    class Meta:
        ordering = ['-transaction_date', '-created_at']


class SystemSettings(models.Model):
    """
    System-wide settings for rental management
    """
    # Late fee settings
    late_fee_enabled = models.BooleanField(default=True)
    late_fee_grace_days = models.IntegerField(
        default=5, validators=[MinValueValidator(0)])
    late_fee_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('5.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    late_fee_minimum = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('500.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )

    # Notification settings
    notifications_enabled = models.BooleanField(default=True)
    send_rent_reminders = models.BooleanField(default=True)
    reminder_days_before_due = models.IntegerField(
        default=3, validators=[MinValueValidator(0)])

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"System Settings (Updated: {self.updated_at.strftime('%Y-%m-%d')})"

    class Meta:
        verbose_name_plural = "System Settings"

    @classmethod
    def get_settings(cls):
        """Get or create system settings singleton"""
        settings, created = cls.objects.get_or_create(id=1)
        return settings


class Expense(models.Model):
    """
    Track property-related expenses
    """
    EXPENSE_CATEGORY_CHOICES = [
        ('MAINTENANCE', 'Maintenance & Repairs'),
        ('UTILITIES', 'Utilities'),
        ('SALARIES', 'Salaries & Wages'),
        ('TAXES', 'Taxes & Fees'),
        ('INSURANCE', 'Insurance'),
        ('MARKETING', 'Marketing & Advertising'),
        ('SUPPLIES', 'Supplies'),
        ('PROFESSIONAL', 'Professional Services'),
        ('OTHER', 'Other'),
    ]

    building = models.ForeignKey(
        Building,
        on_delete=models.CASCADE,
        related_name='expenses',
        null=True,
        blank=True,
        help_text="Leave blank for general expenses"
    )
    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        related_name='expenses',
        null=True,
        blank=True,
        help_text="Specific unit if applicable"
    )
    category = models.CharField(
        max_length=20, choices=EXPENSE_CATEGORY_CHOICES)
    description = models.CharField(max_length=200)
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    expense_date = models.DateField()
    vendor = models.CharField(max_length=100, blank=True, null=True)
    receipt_number = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    paid = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.category} - KES {self.amount} - {self.expense_date}"

    class Meta:
        ordering = ['-expense_date', '-created_at']


class MaintenanceRequest(models.Model):
    """
    Tenant maintenance requests and tracking
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]

    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name='maintenance_requests')
    unit = models.ForeignKey(
        Unit, on_delete=models.CASCADE, related_name='maintenance_requests')
    title = models.CharField(max_length=200)
    description = models.TextField()
    priority = models.CharField(
        max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='PENDING')
    category = models.CharField(
        max_length=20,
        choices=[
            ('PLUMBING', 'Plumbing'),
            ('ELECTRICAL', 'Electrical'),
            ('HVAC', 'HVAC'),
            ('APPLIANCE', 'Appliance'),
            ('STRUCTURAL', 'Structural'),
            ('PEST', 'Pest Control'),
            ('OTHER', 'Other'),
        ],
        default='OTHER'
    )
    reported_date = models.DateTimeField(auto_now_add=True)
    scheduled_date = models.DateField(null=True, blank=True)
    completed_date = models.DateTimeField(null=True, blank=True)
    assigned_to = models.CharField(max_length=100, blank=True, null=True)
    estimated_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    actual_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    resolution_notes = models.TextField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.unit.unit_number} - {self.status}"

    class Meta:
        ordering = ['-reported_date']


class Document(models.Model):
    """
    Document management for leases, IDs, contracts
    """
    DOCUMENT_TYPE_CHOICES = [
        ('LEASE', 'Lease Agreement'),
        ('ID', 'ID Document'),
        ('CONTRACT', 'Contract'),
        ('RECEIPT', 'Receipt'),
        ('CERTIFICATE', 'Certificate'),
        ('OTHER', 'Other'),
    ]

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='documents',
        null=True,
        blank=True
    )
    building = models.ForeignKey(
        Building,
        on_delete=models.CASCADE,
        related_name='documents',
        null=True,
        blank=True
    )
    document_type = models.CharField(
        max_length=20, choices=DOCUMENT_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    file = models.FileField(upload_to='documents/%Y/%m/')
    uploaded_by = models.CharField(max_length=100, blank=True, null=True)
    upload_date = models.DateTimeField(auto_now_add=True)
    expiry_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.document_type} - {self.title}"

    class Meta:
        ordering = ['-upload_date']


class Lease(models.Model):
    """
    Lease management and tracking
    """
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('ACTIVE', 'Active'),
        ('EXPIRED', 'Expired'),
        ('TERMINATED', 'Terminated'),
    ]

    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name='leases')
    unit = models.ForeignKey(
        Unit, on_delete=models.CASCADE, related_name='leases')
    start_date = models.DateField()
    end_date = models.DateField()
    monthly_rent = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    security_deposit = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    terms = models.TextField(blank=True, null=True)
    renewal_reminder_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.tenant.full_name} - {self.unit.unit_number} ({self.start_date} to {self.end_date})"

    class Meta:
        ordering = ['-start_date']

    @property
    def is_expiring_soon(self):
        """Check if lease expires within 60 days"""
        from django.utils import timezone
        from datetime import timedelta
        today = timezone.now().date()
        return self.end_date <= today + timedelta(days=60) and self.end_date >= today


class ActivityLog(models.Model):
    """
    Audit trail for all system activities
    """
    ACTION_CHOICES = [
        ('CREATE', 'Created'),
        ('UPDATE', 'Updated'),
        ('DELETE', 'Deleted'),
        ('CHARGE', 'Charged Rent'),
        ('PAYMENT', 'Payment Received'),
        ('LOGIN', 'User Login'),
        ('EXPORT', 'Data Exported'),
    ]

    user = models.CharField(max_length=100, default='System')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=50)
    object_id = models.IntegerField(null=True, blank=True)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.action} - {self.model_name} - {self.timestamp}"

    class Meta:
        ordering = ['-timestamp']


class Utility(models.Model):
    """
    Track utility bills for properties (Water, Electricity, Internet, etc.)
    """
    UTILITY_TYPES = [
        ('WATER', 'Water'),
        ('ELECTRICITY', 'Electricity'),
        ('INTERNET', 'Internet'),
        ('GAS', 'Gas'),
        ('GARBAGE', 'Garbage Collection'),
        ('SECURITY', 'Security'),
        ('OTHER', 'Other'),
    ]

    utility_type = models.CharField(max_length=20, choices=UTILITY_TYPES)
    building = models.ForeignKey(
        Building, on_delete=models.CASCADE, related_name='utilities', null=True, blank=True)
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE,
                             related_name='utilities', null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[
                                 MinValueValidator(Decimal('0.01'))])
    billing_period_start = models.DateField()
    billing_period_end = models.DateField()
    due_date = models.DateField()
    paid = models.BooleanField(default=False)
    payment_date = models.DateField(null=True, blank=True)
    provider = models.CharField(max_length=200, blank=True)
    account_number = models.CharField(max_length=100, blank=True)
    meter_reading_start = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True)
    meter_reading_end = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        location = self.unit.unit_number if self.unit else (
            self.building.name if self.building else 'General')
        return f"{self.get_utility_type_display()} - {location} - {self.billing_period_start}"

    class Meta:
        ordering = ['-billing_period_start']
        verbose_name_plural = 'Utilities'

    @property
    def is_overdue(self):
        """Check if payment is overdue"""
        from django.utils import timezone
        return not self.paid and self.due_date < timezone.now().date()

    @property
    def consumption(self):
        """Calculate consumption if meter readings are available"""
        if self.meter_reading_start is not None and self.meter_reading_end is not None:
            return self.meter_reading_end - self.meter_reading_start
        return None


class PropertyPhoto(models.Model):
    """
    Photos/images for buildings and units
    """
    PHOTO_TYPE_CHOICES = [
        ('EXTERIOR', 'Exterior'),
        ('INTERIOR', 'Interior'),
        ('AMENITY', 'Amenity'),
        ('UNIT', 'Unit'),
        ('COMMON_AREA', 'Common Area'),
        ('OTHER', 'Other'),
    ]

    building = models.ForeignKey(
        Building,
        on_delete=models.CASCADE,
        related_name='photos',
        null=True,
        blank=True
    )
    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        related_name='photos',
        null=True,
        blank=True
    )
    photo = models.ImageField(upload_to='property_photos/')
    photo_type = models.CharField(
        max_length=20, choices=PHOTO_TYPE_CHOICES, default='OTHER')
    caption = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    display_order = models.IntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        location = self.unit.unit_number if self.unit else (
            self.building.name if self.building else 'General')
        return f"{self.get_photo_type_display()} - {location}"

    class Meta:
        ordering = ['display_order', '-uploaded_at']
        verbose_name_plural = 'Property Photos'
