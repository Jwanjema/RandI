"""
Late fee calculation and application system
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from properties.models import Tenant, Payment
from properties.notifications import NotificationService


class Command(BaseCommand):
    help = 'Automatically calculate and apply late fees to overdue tenants'

    def add_arguments(self, parser):
        parser.add_argument(
            '--grace-days',
            type=int,
            default=5,
            help='Number of grace days after rent is due before late fees apply'
        )
        parser.add_argument(
            '--late-fee-percent',
            type=float,
            default=5.0,
            help='Percentage of rent to charge as late fee (e.g., 5 for 5%%)'
        )
        parser.add_argument(
            '--min-late-fee',
            type=float,
            default=500.0,
            help='Minimum late fee amount in KES'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview late fees without applying them'
        )

    def handle(self, *args, **options):
        grace_days = options['grace_days']
        late_fee_percent = options['late_fee_percent']
        min_late_fee = options['min_late_fee']
        dry_run = options['dry_run']

        self.stdout.write(self.style.SUCCESS(f'\n{"="*60}'))
        self.stdout.write(self.style.SUCCESS(f'LATE FEE CALCULATION SYSTEM'))
        self.stdout.write(self.style.SUCCESS(f'{"="*60}\n'))

        if dry_run:
            self.stdout.write(self.style.WARNING(
                '🔍 DRY RUN MODE - No fees will be applied\n'))

        self.stdout.write(f'Settings:')
        self.stdout.write(f'  Grace Period: {grace_days} days')
        self.stdout.write(
            f'  Late Fee: {late_fee_percent}% (min KES {min_late_fee:,.2f})')
        self.stdout.write('')

        # Get all active tenants with outstanding balances
        active_tenants = Tenant.objects.filter(move_out_date__isnull=True)

        if not active_tenants.exists():
            self.stdout.write(self.style.WARNING('No active tenants found'))
            return

        fees_applied = 0
        total_fees = 0
        tenants_with_late_fees = []

        for tenant in active_tenants:
            # Get outstanding balance
            balance = tenant.total_balance

            # Only process tenants with positive balance
            if balance <= 0:
                continue

            # Get the oldest unpaid charge
            oldest_charge = Payment.objects.filter(
                tenant=tenant,
                payment_type='CHARGE'
            ).order_by('transaction_date').first()

            if not oldest_charge:
                continue

            # Calculate days overdue
            days_overdue = (timezone.now().date() -
                            oldest_charge.transaction_date).days

            # Only apply late fee if past grace period
            if days_overdue <= grace_days:
                continue

            # Check if late fee already applied this month
            current_month = timezone.now().strftime('%B %Y')
            existing_late_fee = Payment.objects.filter(
                tenant=tenant,
                payment_type='CHARGE',
                description__icontains='Late Fee',
                description__icontains=current_month
            ).exists()

            if existing_late_fee:
                self.stdout.write(
                    self.style.WARNING(
                        f'⏭ {tenant.full_name} - Late fee already applied for {current_month}'
                    )
                )
                continue

            # Calculate late fee
            rent_amount = tenant.unit.monthly_rent
            late_fee = max(
                (rent_amount * late_fee_percent / 100),
                min_late_fee
            )

            self.stdout.write(
                f'⚠ {tenant.full_name} - {days_overdue} days overdue | '
                f'Balance: KES {balance:,.2f} | '
                f'Late Fee: KES {late_fee:,.2f}'
            )

            if not dry_run:
                # Apply late fee
                Payment.objects.create(
                    tenant=tenant,
                    payment_type='CHARGE',
                    amount=late_fee,
                    transaction_date=timezone.now().date(),
                    description=f'Late Fee for {current_month} ({days_overdue} days overdue)',
                    notes=f'Auto-generated late fee: {late_fee_percent}% of rent'
                )

                # Send notification
                NotificationService.notify_late_payment(
                    tenant=tenant,
                    days_late=days_overdue,
                    amount_due=balance + late_fee
                )

                fees_applied += 1
                total_fees += late_fee
                tenants_with_late_fees.append({
                    'name': tenant.full_name,
                    'days': days_overdue,
                    'fee': late_fee
                })
            else:
                self.stdout.write(
                    self.style.WARNING(f'   [DRY RUN] Would apply late fee')
                )

        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS(f'Summary:'))
        if dry_run:
            self.stdout.write(self.style.WARNING(
                f'  Would Apply: {fees_applied} late fees'))
            self.stdout.write(self.style.WARNING(
                f'  Total Amount: KES {total_fees:,.2f}'))
        else:
            self.stdout.write(self.style.SUCCESS(
                f'  Late Fees Applied: {fees_applied}'))
            self.stdout.write(self.style.SUCCESS(
                f'  Total Amount: KES {total_fees:,.2f}'))

            if tenants_with_late_fees:
                self.stdout.write('\n  Tenants Charged:')
                for item in tenants_with_late_fees:
                    self.stdout.write(
                        f'    • {item["name"]}: KES {item["fee"]:,.2f} ({item["days"]} days)'
                    )

        self.stdout.write('='*60 + '\n')

        if not dry_run and fees_applied > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    '✓ Late fees applied successfully and notifications sent!'
                )
            )
