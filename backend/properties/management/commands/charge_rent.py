from django.core.management.base import BaseCommand
from django.utils import timezone
from properties.models import Tenant, Payment
from datetime import datetime


class Command(BaseCommand):
    help = 'Automatically charge rent to all active tenants'

    def add_arguments(self, parser):
        parser.add_argument(
            '--month',
            type=str,
            help='Month to charge (e.g., "January 2026"). Defaults to current month.',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be charged without actually creating charges',
        )

    def handle(self, *args, **options):
        # Get active tenants
        active_tenants = Tenant.objects.filter(move_out_date__isnull=True)

        if not active_tenants.exists():
            self.stdout.write(self.style.WARNING('No active tenants found.'))
            return

        # Determine the month to charge
        if options['month']:
            month_str = options['month']
        else:
            month_str = datetime.now().strftime('%B %Y')

        dry_run = options['dry_run']

        if dry_run:
            self.stdout.write(self.style.WARNING(f'\n--- DRY RUN MODE ---'))
            self.stdout.write(self.style.WARNING(
                f'No charges will be created\n'))

        self.stdout.write(self.style.SUCCESS(
            f'Charging rent for: {month_str}'))
        self.stdout.write(f'Found {active_tenants.count()} active tenant(s)\n')

        total_charged = 0
        successful_charges = 0
        skipped_charges = 0

        for tenant in active_tenants:
            rent_amount = tenant.unit.monthly_rent
            description = f'Rent for {month_str}'

            # Check if already charged for this month
            existing_charge = Payment.objects.filter(
                tenant=tenant,
                payment_type='CHARGE',
                description__icontains=month_str
            ).exists()

            if existing_charge:
                self.stdout.write(
                    self.style.WARNING(
                        f'⚠ Skipped: {tenant.full_name} ({tenant.unit}) - Already charged for {month_str}'
                    )
                )
                skipped_charges += 1
                continue

            if not dry_run:
                # Create the charge
                Payment.objects.create(
                    tenant=tenant,
                    payment_type='CHARGE',
                    amount=rent_amount,
                    transaction_date=timezone.now().date(),
                    description=description,
                    notes=f'Auto-generated rent charge for {month_str}'
                )

            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Charged: {tenant.full_name} ({tenant.unit}) - KES {rent_amount:,.2f}'
                )
            )

            total_charged += rent_amount
            successful_charges += 1

        # Summary
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS(f'\nSummary for {month_str}:'))
        self.stdout.write(
            f'  ✓ Successfully charged: {successful_charges} tenant(s)')
        self.stdout.write(
            f'  ⚠ Skipped (already charged): {skipped_charges} tenant(s)')
        self.stdout.write(
            f'  💰 Total amount charged: KES {total_charged:,.2f}')

        if dry_run:
            self.stdout.write(self.style.WARNING(
                '\n⚠ DRY RUN - No actual charges were created'))
        else:
            self.stdout.write(self.style.SUCCESS(
                '\n✓ All rent charges have been successfully created!'))
