"""
Management command to send late payment reminders to tenants
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
from properties.models import Tenant, Payment
from properties.notifications import NotificationService


class Command(BaseCommand):
    help = 'Send late payment reminders to tenants with overdue rent'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=5,
            help='Send reminders for payments overdue by this many days'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview reminders without sending'
        )

    def handle(self, *args, **options):
        days_late = options['days']
        dry_run = options['dry_run']

        self.stdout.write(self.style.SUCCESS(f'\n{"="*60}'))
        self.stdout.write(self.style.SUCCESS(f'LATE PAYMENT REMINDER SYSTEM'))
        self.stdout.write(self.style.SUCCESS(f'{"="*60}\n'))

        if dry_run:
            self.stdout.write(self.style.WARNING(
                '🔍 DRY RUN MODE - No notifications will be sent\n'))

        # Get all active tenants
        active_tenants = Tenant.objects.filter(move_out_date__isnull=True)

        if not active_tenants.exists():
            self.stdout.write(self.style.WARNING('No active tenants found'))
            return

        self.stdout.write(
            f'Checking {active_tenants.count()} active tenants...\n')

        reminders_sent = 0
        tenants_checked = 0

        for tenant in active_tenants:
            tenants_checked += 1

            # Calculate tenant balance
            balance = tenant.total_balance

            # Only send reminders to tenants with positive balance (owing money)
            if balance <= 0:
                continue

            # Check for the most recent charge
            latest_charge = Payment.objects.filter(
                tenant=tenant,
                payment_type='CHARGE'
            ).order_by('-transaction_date').first()

            if not latest_charge:
                continue

            # Calculate days since last charge
            days_since_charge = (timezone.now().date() -
                                 latest_charge.transaction_date).days

            # Send reminder if overdue by specified days
            if days_since_charge >= days_late:
                self.stdout.write(
                    f'📧 {tenant.full_name} - Overdue: {days_since_charge} days | '
                    f'Balance: KES {balance:,.2f}'
                )

                if not dry_run:
                    NotificationService.notify_late_payment(
                        tenant=tenant,
                        days_late=days_since_charge,
                        amount_due=balance
                    )
                    reminders_sent += 1
                else:
                    self.stdout.write(
                        self.style.WARNING(f'   [DRY RUN] Would send reminder')
                    )

        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS(f'Summary:'))
        self.stdout.write(f'  Tenants Checked: {tenants_checked}')
        if dry_run:
            self.stdout.write(self.style.WARNING(
                f'  Would Send: {reminders_sent} reminders'))
        else:
            self.stdout.write(self.style.SUCCESS(
                f'  Reminders Sent: {reminders_sent}'))
        self.stdout.write('='*60 + '\n')
