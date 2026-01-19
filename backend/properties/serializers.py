from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Building, Unit, Tenant, Payment, Expense, MaintenanceRequest, Document, Lease, ActivityLog, UserProfile, Utility, PropertyPhoto


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role', read_only=True)
    phone_number = serializers.CharField(
        source='profile.phone_number', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'role', 'phone_number', 'is_active', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(
        source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'username', 'email', 'first_name',
                  'last_name', 'role', 'phone_number', 'created_at']
        read_only_fields = ['id', 'created_at']


class BuildingSerializer(serializers.ModelSerializer):
    occupied_units_count = serializers.IntegerField(read_only=True)
    vacant_units_count = serializers.IntegerField(read_only=True)
    occupancy_rate = serializers.FloatField(read_only=True)
    total_potential_income = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    actual_monthly_income = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = Building
        fields = [
            'id', 'name', 'address', 'total_units', 'description',
            'occupied_units_count', 'vacant_units_count', 'occupancy_rate',
            'total_potential_income', 'actual_monthly_income',
            'created_at', 'updated_at'
        ]


class UnitSerializer(serializers.ModelSerializer):
    building_name = serializers.CharField(
        source='building.name', read_only=True)
    current_tenant = serializers.SerializerMethodField()

    class Meta:
        model = Unit
        fields = [
            'id', 'building', 'building_name', 'unit_number', 'monthly_rent',
            'bedrooms', 'bathrooms', 'square_feet', 'status', 'description',
            'current_tenant', 'created_at', 'updated_at'
        ]

    def get_current_tenant(self, obj):
        tenant = obj.current_tenant
        if tenant:
            return {
                'id': tenant.id,
                'full_name': tenant.full_name,
                'phone': tenant.phone,
                'email': tenant.email
            }
        return None


class TenantSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    total_balance = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    unit_number = serializers.CharField(
        source='unit.unit_number', read_only=True)
    building_name = serializers.CharField(
        source='unit.building.name', read_only=True)
    monthly_rent = serializers.DecimalField(
        source='unit.monthly_rent',
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = Tenant
        fields = [
            'id', 'unit', 'unit_number', 'building_name', 'first_name',
            'last_name', 'full_name', 'email', 'phone', 'id_number',
            'emergency_contact_name', 'emergency_contact_phone',
            'move_in_date', 'move_out_date', 'deposit_amount',
            'is_active', 'total_balance', 'monthly_rent', 'notes',
            'created_at', 'updated_at'
        ]


class PaymentSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(
        source='tenant.full_name', read_only=True)
    unit_number = serializers.CharField(
        source='tenant.unit.unit_number', read_only=True)
    building_name = serializers.CharField(
        source='tenant.unit.building.name', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'tenant', 'tenant_name', 'unit_number', 'building_name',
            'payment_type', 'amount', 'payment_method', 'transaction_date',
            'description', 'reference_number', 'notes',
            'created_at', 'updated_at'
        ]


class TenantStatementSerializer(serializers.Serializer):
    """
    Serializer for tenant statement/report.
    """
    tenant = TenantSerializer()
    transactions = PaymentSerializer(many=True)
    total_charges = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_payments = serializers.DecimalField(max_digits=10, decimal_places=2)
    current_balance = serializers.DecimalField(max_digits=10, decimal_places=2)


class BuildingReportSerializer(serializers.Serializer):
    """
    Serializer for building financial report.
    """
    building = BuildingSerializer()
    total_units = serializers.IntegerField()
    occupied_units = serializers.IntegerField()
    vacant_units = serializers.IntegerField()
    occupancy_rate = serializers.FloatField()
    total_potential_income = serializers.DecimalField(
        max_digits=10, decimal_places=2)
    actual_income_collected = serializers.DecimalField(
        max_digits=10, decimal_places=2)
    outstanding_balance = serializers.DecimalField(
        max_digits=10, decimal_places=2)
    units = UnitSerializer(many=True)


class ExpenseSerializer(serializers.ModelSerializer):
    building_name = serializers.CharField(
        source='building.name', read_only=True)
    unit_number = serializers.CharField(
        source='unit.unit_number', read_only=True)

    class Meta:
        model = Expense
        fields = [
            'id', 'building', 'building_name', 'unit', 'unit_number',
            'category', 'description', 'amount', 'expense_date',
            'vendor', 'receipt_number', 'notes', 'paid',
            'created_at', 'updated_at'
        ]


class MaintenanceRequestSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(
        source='tenant.full_name', read_only=True)
    unit_number = serializers.CharField(
        source='unit.unit_number', read_only=True)
    building_name = serializers.CharField(
        source='unit.building.name', read_only=True)

    class Meta:
        model = MaintenanceRequest
        fields = [
            'id', 'tenant', 'tenant_name', 'unit', 'unit_number', 'building_name',
            'title', 'description', 'priority', 'status', 'category',
            'reported_date', 'scheduled_date', 'completed_date',
            'assigned_to', 'estimated_cost', 'actual_cost',
            'resolution_notes', 'updated_at'
        ]


class DocumentSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(
        source='tenant.full_name', read_only=True)
    building_name = serializers.CharField(
        source='building.name', read_only=True)

    class Meta:
        model = Document
        fields = [
            'id', 'tenant', 'tenant_name', 'building', 'building_name',
            'document_type', 'title', 'description', 'file',
            'uploaded_by', 'upload_date', 'expiry_date'
        ]


class LeaseSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(
        source='tenant.full_name', read_only=True)
    unit_number = serializers.CharField(
        source='unit.unit_number', read_only=True)
    building_name = serializers.CharField(
        source='unit.building.name', read_only=True)
    is_expiring_soon = serializers.BooleanField(read_only=True)

    class Meta:
        model = Lease
        fields = [
            'id', 'tenant', 'tenant_name', 'unit', 'unit_number', 'building_name',
            'start_date', 'end_date', 'monthly_rent', 'security_deposit',
            'status', 'terms', 'renewal_reminder_sent', 'is_expiring_soon',
            'created_at', 'updated_at'
        ]


class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = [
            'id', 'user', 'action', 'model_name', 'object_id',
            'description', 'ip_address', 'timestamp'
        ]


class UtilitySerializer(serializers.ModelSerializer):
    building_name = serializers.CharField(
        source='building.name', read_only=True)
    unit_number = serializers.CharField(
        source='unit.unit_number', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    consumption = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Utility
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class PropertyPhotoSerializer(serializers.ModelSerializer):
    building_name = serializers.CharField(
        source='building.name', read_only=True)
    unit_number = serializers.CharField(
        source='unit.unit_number', read_only=True)

    class Meta:
        model = PropertyPhoto
        fields = ['id', 'building', 'building_name', 'unit', 'unit_number',
                  'photo', 'photo_type', 'caption', 'is_primary', 'display_order', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']
