from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from properties.models import (
    Building, Unit, Tenant, Lease, Payment, Expense,
    MaintenanceRequest, Document, ActivityLog, SystemSettings,
    UserProfile, Utility, PropertyPhoto
)
from decimal import Decimal
from datetime import datetime, timedelta
import random


class Command(BaseCommand):
    help = 'Seeds the database with comprehensive sample data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting data seeding...')

        # Clear existing data
        self.stdout.write('Clearing existing data...')
        PropertyPhoto.objects.all().delete()
        Utility.objects.all().delete()
        Document.objects.all().delete()
        MaintenanceRequest.objects.all().delete()
        Payment.objects.all().delete()
        Expense.objects.all().delete()
        Lease.objects.all().delete()
        Tenant.objects.all().delete()
        Unit.objects.all().delete()
        Building.objects.all().delete()
        ActivityLog.objects.all().delete()

        # Create system settings if not exists
        SystemSettings.objects.get_or_create(
            id=1,
            defaults={
                'late_fee_percentage': Decimal('5.00'),
                'late_fee_grace_days': 5,
                'late_fee_enabled': True,
                'late_fee_minimum': Decimal('500.00'),
                'notifications_enabled': True
            }
        )

        # Create Buildings
        self.stdout.write('Creating buildings...')
        buildings_data = [
            {
                'name': 'Sunset Apartments',
                'address': '123 Main Street, Nairobi, Kenya',
                'description': 'Modern apartments in the heart of Nairobi with excellent amenities',
                'total_units': 12
            },
            {
                'name': 'Palm View Residences',
                'address': '456 Mombasa Road, Nairobi, Kenya',
                'description': 'Luxury residences with panoramic city views',
                'total_units': 8
            },
            {
                'name': 'Garden Court Complex',
                'address': '789 Ngong Road, Karen, Nairobi, Kenya',
                'description': 'Family-friendly apartments with spacious gardens',
                'total_units': 15
            },
            {
                'name': 'Executive Towers',
                'address': '321 Kilimani Road, Kilimani, Nairobi, Kenya',
                'description': 'High-end executive apartments with premium facilities',
                'total_units': 10
            }
        ]

        buildings = []
        for data in buildings_data:
            building = Building.objects.create(**data)
            buildings.append(building)
            self.stdout.write(f'  Created building: {building.name}')

        # Create Units for each building
        self.stdout.write('Creating units...')
        unit_types = [
            {'bedrooms': 1, 'bathrooms': 1, 'rent_base': 25000},
            {'bedrooms': 2, 'bathrooms': 1, 'rent_base': 35000},
            {'bedrooms': 2, 'bathrooms': 2, 'rent_base': 45000},
            {'bedrooms': 3, 'bathrooms': 2, 'rent_base': 55000},
            {'bedrooms': 3, 'bathrooms': 3, 'rent_base': 70000},
        ]

        units = []
        unit_counter = 1
        for building in buildings:
            for i in range(building.total_units):
                unit_type = random.choice(unit_types)
                floor = (i // 4) + 1
                unit_number = f"{building.name[:3].upper()}-{floor}{chr(65 + (i % 4))}"

                # Vary rent slightly
                rent_variation = random.randint(-2000, 5000)
                monthly_rent = unit_type['rent_base'] + rent_variation

                # 70% occupied, 20% vacant, 10% maintenance
                status_choice = random.choices(
                    ['OCCUPIED', 'VACANT', 'MAINTENANCE'],
                    weights=[70, 20, 10]
                )[0]

                unit = Unit.objects.create(
                    building=building,
                    unit_number=unit_number,
                    bedrooms=unit_type['bedrooms'],
                    bathrooms=unit_type['bathrooms'],
                    square_feet=random.randint(600, 1500),
                    monthly_rent=monthly_rent,
                    status=status_choice,
                    description=f"{unit_type['bedrooms']} bedroom, {unit_type['bathrooms']} bathroom unit on floor {floor}"
                )
                units.append(unit)
                unit_counter += 1

        self.stdout.write(f'  Created {len(units)} units')

        # Create Tenants
        self.stdout.write('Creating tenants...')
        first_names = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
                       'William', 'Elizabeth', 'David', 'Susan', 'Richard', 'Jessica', 'Joseph', 'Sarah',
                       'Thomas', 'Karen', 'Charles', 'Nancy', 'Peter', 'Grace', 'Daniel', 'Faith']
        last_names = ['Kamau', 'Wanjiru', 'Otieno', 'Achieng', 'Kimani', 'Njeri', 'Omondi', 'Mutua',
                      'Mwangi', 'Njoroge', 'Kipchoge', 'Waweru', 'Ochieng', 'Chebet', 'Karanja', 'Maina']

        tenants = []
        occupied_units = [u for u in units if u.status == 'OCCUPIED']

        for i, unit in enumerate(occupied_units):
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            email = f"{first_name.lower()}.{last_name.lower()}{i}@email.com"

            tenant = Tenant.objects.create(
                unit=unit,
                first_name=first_name,
                last_name=last_name,
                email=email,
                phone=f"+2547{random.randint(10000000, 99999999)}",
                id_number=f"{random.randint(10000000, 39999999)}",
                emergency_contact_name=f"{random.choice(first_names)} {random.choice(last_names)}",
                emergency_contact_phone=f"+2547{random.randint(10000000, 99999999)}",
                move_in_date=datetime.now().date() - timedelta(days=random.randint(30, 730)),
                deposit_amount=unit.monthly_rent,
                notes=random.choice(
                    ['Excellent tenant', 'Always pays on time', 'No issues', ''])
            )
            tenants.append(tenant)

        self.stdout.write(f'  Created {len(tenants)} tenants')

        # Create Leases
        self.stdout.write('Creating leases...')
        leases = []
        for tenant in tenants:
            lease_start = tenant.move_in_date
            lease_end = lease_start + timedelta(days=365)

            lease = Lease.objects.create(
                tenant=tenant,
                unit=tenant.unit,
                start_date=lease_start,
                end_date=lease_end,
                monthly_rent=tenant.unit.monthly_rent,
                security_deposit=tenant.deposit_amount,
                status='ACTIVE'
            )
            leases.append(lease)

        self.stdout.write(f'  Created {len(leases)} leases')

        # Create Payments (charges and payments)
        self.stdout.write('Creating payments and charges...')
        payments_count = 0

        for tenant in tenants:
            # Calculate months since move-in
            months_since_move_in = (
                datetime.now().date() - tenant.move_in_date).days // 30

            for month in range(max(1, months_since_move_in)):
                charge_date = tenant.move_in_date + timedelta(days=30 * month)

                if charge_date > datetime.now().date():
                    break

                # Create rent charge
                Payment.objects.create(
                    tenant=tenant,
                    amount=tenant.unit.monthly_rent,
                    transaction_date=charge_date,
                    payment_type='CHARGE',
                    description='Monthly Rent',
                    reference_number=f"CHRG-{tenant.id}-{month:03d}"
                )
                payments_count += 1

                # 90% chance tenant paid
                if random.random() < 0.9:
                    payment_date = charge_date + \
                        timedelta(days=random.randint(0, 10))
                    payment_methods = [
                        'M-PESA', 'Bank Transfer', 'Cash', 'Cheque']

                    # Sometimes partial payments
                    if random.random() < 0.1:
                        payment_amount = tenant.unit.monthly_rent * \
                            Decimal('0.5')
                    else:
                        payment_amount = tenant.unit.monthly_rent

                    Payment.objects.create(
                        tenant=tenant,
                        amount=payment_amount,
                        transaction_date=payment_date,
                        payment_type='PAYMENT',
                        payment_method=random.choice(payment_methods),
                        description='Rent Payment',
                        reference_number=f"PAY-{payment_date.strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
                    )
                    payments_count += 1

        self.stdout.write(f'  Created {payments_count} payment transactions')

        # Create Expenses
        self.stdout.write('Creating expenses...')
        expense_categories = [
            ('MAINTENANCE', 'Repairs', [5000, 15000]),
            ('MAINTENANCE', 'Plumbing', [3000, 12000]),
            ('MAINTENANCE', 'Electrical', [4000, 10000]),
            ('UTILITIES', 'Water', [8000, 25000]),
            ('UTILITIES', 'Electricity', [15000, 45000]),
            ('UTILITIES', 'Internet', [3000, 8000]),
            ('PROFESSIONAL', 'Property Management Fee', [20000, 50000]),
            ('PROFESSIONAL', 'Security Services', [15000, 30000]),
            ('PROFESSIONAL', 'Cleaning Services', [8000, 20000]),
            ('INSURANCE', 'Property Insurance', [25000, 60000]),
            ('TAXES', 'Property Tax', [30000, 80000]),
        ]

        expenses_count = 0
        for building in buildings:
            # Create expenses for the last 6 months
            for month in range(6):
                expense_date = datetime.now().date() - timedelta(days=30 * month)

                # Random number of expenses per month (3-6)
                for _ in range(random.randint(3, 6)):
                    category, description, amount_range = random.choice(
                        expense_categories)
                    amount = random.randint(amount_range[0], amount_range[1])

                    Expense.objects.create(
                        building=building,
                        category=category,
                        description=description,
                        amount=amount,
                        expense_date=expense_date,
                        vendor=random.choice(['ABC Services Ltd', 'XYZ Contractors', 'Professional Services',
                                              'City Utilities', 'National Insurance Corp', 'KRA']),
                        receipt_number=f"RCP-{random.randint(10000, 99999)}",
                        paid=True
                    )
                    expenses_count += 1

        self.stdout.write(f'  Created {expenses_count} expenses')

        # Create Maintenance Requests
        self.stdout.write('Creating maintenance requests...')
        maintenance_issues = [
            ('PLUMBING', 'Leaking faucet in kitchen'),
            ('PLUMBING', 'Blocked sink in bathroom'),
            ('PLUMBING', 'Water heater not working'),
            ('ELECTRICAL', 'Light bulb replacement needed'),
            ('ELECTRICAL', 'Power socket not working'),
            ('ELECTRICAL', 'Circuit breaker tripping'),
            ('APPLIANCE', 'Refrigerator making noise'),
            ('APPLIANCE', 'Stove burner not heating'),
            ('STRUCTURAL', 'Door lock needs fixing'),
            ('STRUCTURAL', 'Window latch broken'),
            ('STRUCTURAL', 'Cabinet door loose'),
            ('OTHER', 'Wall paint chipping'),
            ('OTHER', 'Ceiling needs touch-up'),
            ('HVAC', 'AC not cooling properly'),
            ('PEST', 'Pest control needed'),
        ]

        maintenance_count = 0
        statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED']
        priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

        for tenant in random.sample(tenants, min(len(tenants), 25)):
            num_requests = random.randint(1, 3)

            for _ in range(num_requests):
                category, description = random.choice(maintenance_issues)
                status = random.choice(statuses)
                priority = random.choice(priorities)

                # If completed, add completed date
                completed_date = None
                actual_cost = None
                if status == 'COMPLETED':
                    completed_date = datetime.now() - timedelta(days=random.randint(1, 14))
                    actual_cost = random.randint(500, 15000)

                MaintenanceRequest.objects.create(
                    tenant=tenant,
                    unit=tenant.unit,
                    title=category,
                    description=description,
                    category=category,
                    priority=priority,
                    status=status,
                    completed_date=completed_date,
                    actual_cost=actual_cost,
                    resolution_notes='Work completed satisfactorily' if status == 'COMPLETED' else ''
                )
                maintenance_count += 1

        self.stdout.write(
            f'  Created {maintenance_count} maintenance requests')

        # Skip utilities and documents (optional features)
        self.stdout.write(
            'Skipping utility records and documents (optional features)')

        # Create Activity Logs
        self.stdout.write('Creating activity logs...')
        activities = [
            'Tenant registered',
            'Lease created',
            'Payment received',
            'Maintenance request created',
            'Maintenance request completed',
            'Utility reading recorded',
            'Document uploaded',
            'Building created',
            'Unit created',
            'Expense recorded'
        ]

        for _ in range(100):
            ActivityLog.objects.create(
                action=random.choice(activities),
                description=f"System activity: {random.choice(activities).lower()}",
                timestamp=datetime.now() - timedelta(days=random.randint(0, 90),
                                                     hours=random.randint(0, 23))
            )

        self.stdout.write(f'  Created 100 activity logs')

        # Summary
        self.stdout.write(self.style.SUCCESS('\n' + '='*50))
        self.stdout.write(self.style.SUCCESS(
            'DATA SEEDING COMPLETED SUCCESSFULLY!'))
        self.stdout.write(self.style.SUCCESS('='*50))
        self.stdout.write(f'Buildings: {Building.objects.count()}')
        self.stdout.write(f'Units: {Unit.objects.count()}')
        self.stdout.write(
            f'  - Occupied: {Unit.objects.filter(status="OCCUPIED").count()}')
        self.stdout.write(
            f'  - Vacant: {Unit.objects.filter(status="VACANT").count()}')
        self.stdout.write(
            f'  - Maintenance: {Unit.objects.filter(status="MAINTENANCE").count()}')
        self.stdout.write(f'Tenants: {Tenant.objects.count()}')
        self.stdout.write(f'Leases: {Lease.objects.count()}')
        self.stdout.write(f'Payments: {Payment.objects.count()}')
        self.stdout.write(f'Expenses: {Expense.objects.count()}')
        self.stdout.write(
            f'Maintenance Requests: {MaintenanceRequest.objects.count()}')
        self.stdout.write(f'Utilities: {Utility.objects.count()}')
        self.stdout.write(f'Documents: {Document.objects.count()}')
        self.stdout.write(f'Activity Logs: {ActivityLog.objects.count()}')
        self.stdout.write(self.style.SUCCESS('='*50))
