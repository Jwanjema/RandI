"""
Create demo user accounts for testing
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from properties.models import UserProfile, Tenant


class Command(BaseCommand):
    help = 'Create demo user accounts with different roles'

    def handle(self, *args, **kwargs):
        self.stdout.write('Creating demo users...')

        # Create Admin
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@rental.com',
                'first_name': 'Admin',
                'last_name': 'User',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            UserProfile.objects.create(
                user=admin_user,
                role='ADMIN',
                phone_number='+254700000001'
            )
            self.stdout.write(self.style.SUCCESS(
                '✓ Admin user created (username: admin, password: admin123)'))
        else:
            self.stdout.write('Admin user already exists')

        # Create Manager/Caretaker
        manager_user, created = User.objects.get_or_create(
            username='manager',
            defaults={
                'email': 'manager@rental.com',
                'first_name': 'Property',
                'last_name': 'Manager'
            }
        )
        if created:
            manager_user.set_password('manager123')
            manager_user.save()
            UserProfile.objects.create(
                user=manager_user,
                role='MANAGER',
                phone_number='+254700000002'
            )
            self.stdout.write(self.style.SUCCESS(
                '✓ Manager user created (username: manager, password: manager123)'))
        else:
            self.stdout.write('Manager user already exists')

        # Create Tenant user - link to first tenant in database
        tenant_record = Tenant.objects.filter(
            move_out_date__isnull=True).first()
        if tenant_record:
            tenant_user, created = User.objects.get_or_create(
                username='tenant',
                defaults={
                    'email': tenant_record.email,
                    'first_name': tenant_record.first_name,
                    'last_name': tenant_record.last_name
                }
            )
            if created:
                tenant_user.set_password('tenant123')
                tenant_user.save()
                UserProfile.objects.create(
                    user=tenant_user,
                    role='TENANT',
                    phone_number=tenant_record.phone
                )
                self.stdout.write(self.style.SUCCESS(
                    f'✓ Tenant user created (username: tenant, password: tenant123) - Linked to {tenant_record.full_name}'))
            else:
                self.stdout.write(
                    f'Tenant user already exists - Linked to {tenant_record.full_name}')
        else:
            self.stdout.write(self.style.WARNING(
                'No active tenant found to link tenant user'))

        self.stdout.write(self.style.SUCCESS(
            '\n✅ Demo users created successfully!'))
        self.stdout.write('\nLogin Credentials:')
        self.stdout.write('  Admin:    username: admin    password: admin123')
        self.stdout.write(
            '  Manager:  username: manager  password: manager123')
        self.stdout.write('  Tenant:   username: tenant   password: tenant123')
