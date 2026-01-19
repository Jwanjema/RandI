from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.renderers import BaseRenderer
from django.db.models import Sum, Q
from django.contrib.auth.models import User
from django.http import HttpResponse
from datetime import datetime
from .models import Building, Unit, Tenant, Payment, Expense, MaintenanceRequest, Document, Lease, ActivityLog, UserProfile, Utility, PropertyPhoto
from .serializers import (
    BuildingSerializer, UnitSerializer, TenantSerializer,
    PaymentSerializer, TenantStatementSerializer, BuildingReportSerializer,
    ExpenseSerializer, MaintenanceRequestSerializer, DocumentSerializer,
    LeaseSerializer, ActivityLogSerializer, UserSerializer, UserProfileSerializer,
    UtilitySerializer, PropertyPhotoSerializer
)


class PassthroughRenderer(BaseRenderer):
    """
    Return data as-is. Used for binary responses like PDFs.
    """
    media_type = '*/*'
    format = None

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing users and profiles.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current user profile"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class UserProfileViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing user profiles.
    """
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['role']


class BuildingViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing buildings.
    """
    queryset = Building.objects.all()
    serializer_class = BuildingSerializer

    @action(detail=True, methods=['get'])
    def report(self, request, pk=None):
        """
        Generate a comprehensive financial report for a building.
        """
        building = self.get_object()
        units = building.units.all()

        # Calculate actual income collected (payments received)
        actual_income = Payment.objects.filter(
            tenant__unit__building=building,
            payment_type='PAYMENT'
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Calculate outstanding balance
        total_charges = Payment.objects.filter(
            tenant__unit__building=building,
            payment_type='CHARGE'
        ).aggregate(total=Sum('amount'))['total'] or 0

        total_payments = Payment.objects.filter(
            tenant__unit__building=building,
            payment_type='PAYMENT'
        ).aggregate(total=Sum('amount'))['total'] or 0

        outstanding_balance = total_charges - total_payments

        report_data = {
            'building': building,
            'total_units': building.total_units,
            'occupied_units': building.occupied_units_count,
            'vacant_units': building.vacant_units_count,
            'occupancy_rate': building.occupancy_rate,
            'total_potential_income': building.total_potential_income,
            'actual_income_collected': actual_income,
            'outstanding_balance': outstanding_balance,
            'units': units
        }

        serializer = BuildingReportSerializer(report_data)
        return Response(serializer.data)


class UnitViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing units.
    """
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer

    def get_queryset(self):
        queryset = Unit.objects.all()

        # Filter by building if provided
        building_id = self.request.query_params.get('building', None)
        if building_id:
            queryset = queryset.filter(building_id=building_id)

        # Filter by status if provided
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)

        return queryset


class TenantViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing tenants.
    """
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer

    def get_queryset(self):
        queryset = Tenant.objects.all()

        # Filter active tenants only if requested
        active_only = self.request.query_params.get('active', None)
        if active_only == 'true':
            queryset = queryset.filter(move_out_date__isnull=True)

        # Filter by building if provided
        building_id = self.request.query_params.get('building', None)
        if building_id:
            queryset = queryset.filter(unit__building_id=building_id)

        return queryset

    @action(detail=True, methods=['get'])
    def statement(self, request, pk=None):
        """
        Generate a statement for a tenant showing all charges and payments.
        """
        tenant = self.get_object()
        transactions = tenant.payments.all().order_by('transaction_date', 'created_at')

        total_charges = tenant.payments.filter(
            payment_type='CHARGE'
        ).aggregate(total=Sum('amount'))['total'] or 0

        total_payments = tenant.payments.filter(
            payment_type='PAYMENT'
        ).aggregate(total=Sum('amount'))['total'] or 0

        statement_data = {
            'tenant': tenant,
            'transactions': transactions,
            'total_charges': total_charges,
            'total_payments': total_payments,
            'current_balance': total_charges - total_payments
        }

        serializer = TenantStatementSerializer(statement_data)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], renderer_classes=[PassthroughRenderer])
    def statement_pdf(self, request, pk=None):
        """
        Generate and download a PDF statement for a tenant
        """
        from .pdf_generator import PDFGenerator

        tenant = self.get_object()
        transactions = tenant.payments.all().order_by('transaction_date', 'created_at')

        # Generate PDF
        pdf = PDFGenerator.generate_tenant_statement(tenant, transactions)

        # Create response
        response = HttpResponse(pdf, content_type='application/pdf')
        response[
            'Content-Disposition'] = f'attachment; filename="statement_{tenant.full_name.replace(" ", "_")}_{datetime.now().strftime("%Y%m%d")}.pdf"'

        return response

    @action(detail=True, methods=['post'])
    def charge_rent(self, request, pk=None):
        """
        Create a rent charge for this tenant.
        """
        tenant = self.get_object()

        # Get the amount (default to unit's monthly rent)
        amount = request.data.get('amount', tenant.unit.monthly_rent)
        description = request.data.get(
            'description', f'Rent for {datetime.now().strftime("%B %Y")}')
        transaction_date = request.data.get(
            'transaction_date', datetime.now().date())

        payment = Payment.objects.create(
            tenant=tenant,
            payment_type='CHARGE',
            amount=amount,
            transaction_date=transaction_date,
            description=description
        )

        # Send notification
        from .notifications import NotificationService
        month_str = datetime.now().strftime("%B %Y")
        NotificationService.notify_rent_charged(tenant, amount, month_str)

        serializer = PaymentSerializer(payment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def move_out(self, request, pk=None):
        """
        Mark tenant as moved out and optionally create a new tenant.
        This preserves all historical records.
        """
        tenant = self.get_object()

        if tenant.move_out_date:
            return Response(
                {'error': 'Tenant has already moved out'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set move out date
        move_out_date = request.data.get(
            'move_out_date', datetime.now().date())
        tenant.move_out_date = move_out_date
        tenant.save()

        # Close any active leases
        active_leases = tenant.leases.filter(status='ACTIVE')
        for lease in active_leases:
            lease.status = 'TERMINATED'
            lease.end_date = move_out_date
            lease.save()

        # Log the activity
        ActivityLog.objects.create(
            action='Tenant moved out',
            description=f'{tenant.full_name} moved out from {tenant.unit}'
        )

        serializer = self.get_serializer(tenant)
        return Response({
            'message': 'Tenant successfully moved out. Historical records preserved.',
            'tenant': serializer.data
        })


class PaymentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing payments and charges.
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer

    def perform_create(self, serializer):
        """Override to send notifications when payments are created"""
        payment = serializer.save()

        # Send notification for payment receipts
        if payment.payment_type == 'PAYMENT':
            from .notifications import NotificationService
            NotificationService.notify_payment_received(
                tenant=payment.tenant,
                amount=payment.amount,
                payment_date=payment.transaction_date
            )

    def get_queryset(self):
        queryset = Payment.objects.all()

        # Filter by tenant if provided
        tenant_id = self.request.query_params.get('tenant', None)
        if tenant_id:
            queryset = queryset.filter(tenant_id=tenant_id)

        # Filter by payment type if provided
        payment_type = self.request.query_params.get('payment_type', None)
        if payment_type:
            queryset = queryset.filter(payment_type=payment_type)

        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)

        if start_date:
            queryset = queryset.filter(transaction_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(transaction_date__lte=end_date)

        return queryset

    @action(detail=False, methods=['post'])
    def charge_all_rent(self, request):
        """
        Charge rent to all active tenants for the current month.
        """
        from django.utils import timezone
        from .notifications import NotificationService

        month_str = request.data.get('month', timezone.now().strftime('%B %Y'))
        send_notifications = request.data.get('send_notifications', True)

        # Get all active tenants
        active_tenants = Tenant.objects.filter(move_out_date__isnull=True)

        if not active_tenants.exists():
            return Response(
                {'message': 'No active tenants found'},
                status=status.HTTP_404_NOT_FOUND
            )

        charged_count = 0
        skipped_count = 0
        total_amount = 0
        errors = []

        for tenant in active_tenants:
            # Check if already charged for this month
            existing_charge = Payment.objects.filter(
                tenant=tenant,
                payment_type='CHARGE',
                description__icontains=month_str
            ).exists()

            if existing_charge:
                skipped_count += 1
                continue

            try:
                rent_amount = tenant.unit.monthly_rent
                Payment.objects.create(
                    tenant=tenant,
                    payment_type='CHARGE',
                    amount=rent_amount,
                    transaction_date=timezone.now().date(),
                    description=f'Rent for {month_str}',
                    notes=f'Auto-generated rent charge'
                )
                charged_count += 1
                total_amount += rent_amount

                # Send notification
                if send_notifications:
                    NotificationService.notify_rent_charged(
                        tenant, rent_amount, month_str)

            except Exception as e:
                errors.append(f'{tenant.full_name}: {str(e)}')

        return Response({
            'success': True,
            'month': month_str,
            'charged': charged_count,
            'skipped': skipped_count,
            'total_amount': float(total_amount),
            'notifications_sent': send_notifications,
            'errors': errors
        }, status=status.HTTP_201_CREATED)


class ExpenseViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing expenses
    """
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer

    def get_queryset(self):
        queryset = Expense.objects.all()

        # Filter by building
        building_id = self.request.query_params.get('building', None)
        if building_id:
            queryset = queryset.filter(building_id=building_id)

        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)

        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        if start_date:
            queryset = queryset.filter(expense_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(expense_date__lte=end_date)

        return queryset

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get expense summary by category"""
        from django.db.models import Sum

        queryset = self.get_queryset()

        summary = queryset.values('category').annotate(
            total=Sum('amount')
        ).order_by('-total')

        total_expenses = queryset.aggregate(total=Sum('amount'))['total'] or 0

        return Response({
            'by_category': summary,
            'total_expenses': total_expenses
        })


class MaintenanceRequestViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing maintenance requests
    """
    queryset = MaintenanceRequest.objects.all()
    serializer_class = MaintenanceRequestSerializer

    def get_queryset(self):
        queryset = MaintenanceRequest.objects.all()

        # Filter by status
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)

        # Filter by priority
        priority = self.request.query_params.get('priority', None)
        if priority:
            queryset = queryset.filter(priority=priority)

        # Filter by tenant
        tenant_id = self.request.query_params.get('tenant', None)
        if tenant_id:
            queryset = queryset.filter(tenant_id=tenant_id)

        return queryset

    def perform_create(self, serializer):
        """Send notification when maintenance request is created"""
        request = serializer.save()
        # TODO: Send notification to admin/manager

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update maintenance request status"""
        maintenance_request = self.get_object()
        new_status = request.data.get('status')
        notes = request.data.get('notes', '')

        if new_status:
            maintenance_request.status = new_status
            if new_status == 'COMPLETED':
                from django.utils import timezone
                maintenance_request.completed_date = timezone.now()
                if notes:
                    maintenance_request.resolution_notes = notes
            maintenance_request.save()

            serializer = self.get_serializer(maintenance_request)
            return Response(serializer.data)

        return Response({'error': 'Status is required'}, status=status.HTTP_400_BAD_REQUEST)


class DocumentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing documents
    """
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer

    def get_queryset(self):
        queryset = Document.objects.all()

        # Filter by tenant
        tenant_id = self.request.query_params.get('tenant', None)
        if tenant_id:
            queryset = queryset.filter(tenant_id=tenant_id)

        # Filter by building
        building_id = self.request.query_params.get('building', None)
        if building_id:
            queryset = queryset.filter(building_id=building_id)

        # Filter by document type
        doc_type = self.request.query_params.get('type', None)
        if doc_type:
            queryset = queryset.filter(document_type=doc_type)

        return queryset


class LeaseViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing leases
    """
    queryset = Lease.objects.all()
    serializer_class = LeaseSerializer

    def get_queryset(self):
        queryset = Lease.objects.all()

        # Filter by status
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)

        # Filter by tenant
        tenant_id = self.request.query_params.get('tenant', None)
        if tenant_id:
            queryset = queryset.filter(tenant_id=tenant_id)

        return queryset

    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Get leases expiring within 60 days"""
        from django.utils import timezone
        from datetime import timedelta

        today = timezone.now().date()
        sixty_days = today + timedelta(days=60)

        expiring_leases = Lease.objects.filter(
            end_date__gte=today,
            end_date__lte=sixty_days,
            status='ACTIVE'
        )

        serializer = self.get_serializer(expiring_leases, many=True)
        return Response(serializer.data)


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing activity logs (read-only)
    """
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer

    def get_queryset(self):
        queryset = ActivityLog.objects.all()

        # Filter by action
        action = self.request.query_params.get('action', None)
        if action:
            queryset = queryset.filter(action=action)

        # Filter by user
        user = self.request.query_params.get('user', None)
        if user:
            queryset = queryset.filter(user=user)

        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)

        return queryset


class UtilityViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing utility bills
    """
    queryset = Utility.objects.all()
    serializer_class = UtilitySerializer
    filterset_fields = ['building', 'unit', 'utility_type', 'status']

    def get_queryset(self):
        queryset = Utility.objects.all()

        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        if start_date:
            queryset = queryset.filter(billing_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(billing_date__lte=end_date)

        return queryset

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get utility bills summary by type"""
        from django.db.models import Sum, Count

        summary = Utility.objects.values('utility_type').annotate(
            total_amount=Sum('amount'),
            paid_amount=Sum('amount', filter=Q(status='PAID')),
            pending_amount=Sum('amount', filter=Q(status='PENDING')),
            count=Count('id')
        )

        return Response(summary)


class PropertyPhotoViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing property photos
    """
    queryset = PropertyPhoto.objects.all()
    serializer_class = PropertyPhotoSerializer
    filterset_fields = ['building', 'unit', 'photo_type', 'is_primary']

    def get_queryset(self):
        queryset = PropertyPhoto.objects.all()

        # Filter by building
        building = self.request.query_params.get('building', None)
        if building:
            queryset = queryset.filter(building=building)

        # Filter by unit
        unit = self.request.query_params.get('unit', None)
        if unit:
            queryset = queryset.filter(unit=unit)

        return queryset
