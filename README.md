# 🏢 Advanced Rental & Income Management System

A modern, feature-rich property management system built with Django (Python) and React. Track buildings, units, tenants, payments, and automate rental operations with professional tools.

## ✨ Features Implemented

### 1. **Dashboard Analytics & Charts** ✅

- **Real-time Overview**: Financial metrics, occupancy rates, unit statistics
- **Interactive Charts**:
  - Pie chart for occupancy status (vacant vs occupied)
  - Pie chart for income breakdown (collected vs pending)
  - Bar chart showing units per building
- **Financial Cards**: Total charges, payments, pending amounts
- **Recent Transactions**: Quick view of latest payment activities
- **Built with**: Recharts library for responsive, beautiful visualizations

### 2. **Automated Rent Charging System** ✅

- **Bulk Charging**: Charge rent to all active tenants with one click
- **Month Selection**: Choose any month from dropdown (past/current/future)
- **Tenant Preview**: See list of all tenants before charging
- **Duplicate Prevention**: Automatically skips tenants already charged for the month
- **Detailed Summary**: Shows charged, skipped counts, and total amount
- **CLI Command**: `python manage.py charge_rent --month "January 2025" --dry-run`
- **Dashboard Button**: "⚡ Charge Monthly Rent" for easy access

### 3. **SMS/Email Notifications** ✅

- **Automated Notifications**:
  - Rent charged confirmation (SMS + Email)
  - Payment received acknowledgment
  - Late payment reminders with days overdue
- **Rich HTML Emails**: Professional templates with property details
- **SMS Integration**: Twilio-powered SMS for instant alerts
- **Smart Delivery**: Only sends to tenants with valid phone/email
- **Configuration**: `.env` file for secure credentials management
- **CLI Command**: `python manage.py send_late_reminders --days 5 --dry-run`

### 4. **PDF Statement & Invoice Generation** ✅

- **Professional PDFs**: Generate tenant statements with ReportLab
- **Complete Transaction History**: All charges and payments with running balance
- **Property Information**: Building, unit, tenant details
- **Summary Section**: Total charges, payments, current balance
- **Download Button**: "📄 Download Statement" on Tenants page
- **Custom Branding**: Company header, styled tables, color-coded sections
- **Filename Format**: `statement_Tenant_Name_2025-01-15.pdf`

### 5. **Late Fee Calculation & Auto-Apply** ✅

- **Configurable Settings**:
  - Grace period (default: 5 days)
  - Late fee percentage (default: 5%)
  - Minimum late fee amount (default: KES 500)
- **SystemSettings Model**: Manage late fee rules via Django admin
- **Automatic Calculation**: Applies fees based on days overdue
- **One Fee Per Month**: Prevents duplicate late fees for same period
- **Notifications**: Sends alert when late fee is applied
- **CLI Command**: `python manage.py apply_late_fees --grace-days 5 --late-fee-percent 5 --min-late-fee 500 --dry-run`
- **Dry Run Mode**: Test without actually applying fees

## 🏗️ Architecture

### Backend (Django + DRF)

```
backend/
├── properties/
│   ├── models.py              # Building, Unit, Tenant, Payment, SystemSettings
│   ├── serializers.py         # REST API serializers
│   ├── views.py               # ViewSets with custom actions
│   ├── notifications.py       # SMS/Email notification service
│   ├── pdf_generator.py       # PDF creation for statements
│   ├── management/commands/   # CLI automation tools
│   │   ├── charge_rent.py     # Bulk rent charging
│   │   ├── send_late_reminders.py  # Late payment alerts
│   │   └── apply_late_fees.py      # Automatic late fees
│   └── migrations/
├── rental_system/
│   ├── settings.py            # Django config + email/notification settings
│   └── urls.py
├── requirements.txt           # Python dependencies
└── manage.py
```

### Frontend (React)

```
frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.js                  # Navigation bar
│   │   ├── AddBuildingModal.js        # Building creation
│   │   ├── AddUnitModal.js            # Unit creation
│   │   ├── AddTenantModal.js          # Tenant onboarding
│   │   ├── AddPaymentModal.js         # Payment recording
│   │   └── ChargeRentModal.js         # Bulk rent charging UI
│   ├── pages/
│   │   ├── Dashboard.js               # Analytics dashboard with charts
│   │   ├── Buildings.js               # Building management + unit grid
│   │   ├── Units.js                   # Unit listing with filters
│   │   ├── Tenants.js                 # Tenant management + PDF download
│   │   └── Payments.js                # Transaction history
│   ├── services/
│   │   └── api.js                     # Axios API client
│   ├── App.js                         # Main app with routing
│   └── index.css                      # Complete styling system
├── package.json                       # Dependencies (recharts, axios, react-router)
└── public/
```

## 📊 Database Models

### Building

- `name`, `address`, `total_units`, `description`
- Calculated: `occupancy_rate`, `potential_income`

### Unit

- `building` (FK), `unit_number`, `monthly_rent`
- `bedrooms`, `bathrooms`, `square_feet`
- `status`: VACANT | OCCUPIED | MAINTENANCE

### Tenant

- `unit` (FK), `first_name`, `last_name`, `phone_number`, `email`
- `move_in_date`, `move_out_date`, `deposit_amount`
- Calculated: `total_balance`, `is_active`

### Payment

- `tenant` (FK), `payment_type`: CHARGE | PAYMENT
- `amount`, `transaction_date`, `description`
- `payment_method`: CASH | BANK_TRANSFER | MOBILE_MONEY | CHEQUE

### SystemSettings

- **Late Fees**: `late_fee_enabled`, `late_fee_grace_days`, `late_fee_percentage`, `late_fee_minimum`
- **Notifications**: `notifications_enabled`, `send_rent_reminders`, `reminder_days_before_due`

## 🚀 Getting Started

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8001
```

### Frontend Setup

```bash
cd frontend
npm install
npm start  # Runs on port 3001
```

### Configuration

1. **Create `.env` file** in `backend/` directory:

```env
# Email Settings (Gmail example)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=Rental Management <your-email@gmail.com>

# SMS Settings (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

2. **System Settings**: Access Django admin at `http://localhost:8001/admin/` to configure late fee settings

## 🔧 Management Commands

### Charge Monthly Rent

```bash
# Charge all active tenants for current month
python manage.py charge_rent

# Charge for specific month
python manage.py charge_rent --month "February 2025"

# Preview without charging (dry run)
python manage.py charge_rent --month "January 2025" --dry-run
```

### Send Late Payment Reminders

```bash
# Send reminders to tenants overdue by 5+ days
python manage.py send_late_reminders --days 5

# Preview reminders
python manage.py send_late_reminders --days 7 --dry-run
```

### Apply Late Fees

```bash
# Apply late fees with default settings
python manage.py apply_late_fees

# Custom late fee settings
python manage.py apply_late_fees --grace-days 7 --late-fee-percent 10 --min-late-fee 1000

# Preview late fees
python manage.py apply_late_fees --dry-run
```

## 📡 API Endpoints

### Buildings

- `GET /api/buildings/` - List all buildings
- `POST /api/buildings/` - Create building
- `GET /api/buildings/{id}/` - Get building details
- `GET /api/buildings/{id}/report/` - Building financial report

### Units

- `GET /api/units/` - List units (filter: `?building=1&status=VACANT`)
- `POST /api/units/` - Create unit
- `PUT /api/units/{id}/` - Update unit

### Tenants

- `GET /api/tenants/` - List tenants (filter: `?active=true`)
- `POST /api/tenants/` - Add tenant
- `GET /api/tenants/{id}/statement/` - JSON statement
- `GET /api/tenants/{id}/statement_pdf/` - Download PDF statement
- `POST /api/tenants/{id}/charge_rent/` - Charge individual tenant

### Payments

- `GET /api/payments/` - List transactions (filter: `?tenant=1&payment_type=CHARGE`)
- `POST /api/payments/` - Record payment/charge
- `POST /api/payments/charge_all_rent/` - Bulk rent charging
  ```json
  {
    "month": "January 2025",
    "send_notifications": true
  }
  ```

## 🎨 Frontend Features

### Visual Unit Grid

- Color-coded squares: 🟢 Green = Vacant, 🔴 Red = Occupied
- Click to view unit details
- Shows unit number and rent amount

### Filters & Search

- Active/Inactive tenant toggle
- Building filter dropdown
- Unit status filters (VACANT, OCCUPIED, MAINTENANCE)

### Modals

- Clean, professional forms for all CRUD operations
- Real-time validation
- Error handling with user-friendly messages

## 🔐 Security Notes

- **Production**: Change `SECRET_KEY` in `settings.py`
- **CORS**: Update `CORS_ALLOWED_ORIGINS` for production domain
- **Email**: Use app-specific passwords, never commit credentials
- **Database**: Switch to PostgreSQL for production (settings included)

## 📈 Performance

- **Pagination**: 20 items per page (configurable)
- **Database Indexing**: Optimized queries with `select_related`/`prefetch_related`
- **Caching**: Consider Redis for production deployments

## 🧪 Testing

```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests
cd frontend
npm test
```

## 🛠️ Technology Stack

**Backend:**

- Django 5.0
- Django REST Framework 3.14
- ReportLab (PDF generation)
- Twilio (SMS)
- python-decouple (environment variables)

**Frontend:**

- React 18.2
- React Router 6.20
- Axios 1.6
- Recharts 2.10 (charts)

**Database:**

- SQLite (development)
- PostgreSQL (production-ready)

## 📝 Roadmap (Pending Features)

6. **Expense Tracking Module** - Record property expenses (repairs, utilities, salaries)
7. **Maintenance Request System** - Tenant-submitted maintenance tickets
8. **Document Management** - Upload/store leases, IDs, contracts
9. **Tenant Self-Service Portal** - Tenants view statements, make requests
10. **M-Pesa Payment Integration** - Direct mobile money payments
11. **Advanced Reporting & Export** - Excel/CSV exports, custom reports
12. **Lease Management & Renewals** - Automated lease expiry alerts
13. **Multi-User & Permissions** - Role-based access (admin, manager, accountant)
14. **Enhanced Search & Filters** - Global search, advanced filtering
15. **Activity Logs & Audit Trail** - Track all system changes
16. **Utilities & Services Tracking** - Water, electricity, internet bills
17. **Tenant Vacate Process Wizard** - Structured move-out workflow
18. **Property Photos & Gallery** - Upload/manage property images
19. **Dark Mode & Theme System** - User preference themes
20. **Mobile Responsive & PWA** - Progressive Web App capabilities

## 👥 Contributors

Built with ❤️ by the development team

## 📄 License

MIT License - Free to use and modify

## 🆘 Support

For issues and questions:

- Check documentation above
- Review Django admin at `/admin/`
- Test with `--dry-run` flags before production use

---

**Happy Property Management! 🏠**
