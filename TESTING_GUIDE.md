# Testing Guide for Rental Management System

## Demo Accounts

### Admin Account
- **Username:** admin
- **Password:** admin123
- **Access:** Full system access (all features)

### Manager Account
- **Username:** manager
- **Password:** manager123
- **Access:** Most features except admin-only actions

### Tenant Account
- **Username:** tenant
- **Password:** tenant123
- **Access:** Tenant portal only (view statements, balance, payments)

---

## Authentication Testing

### 1. Login Flow
- [ ] Navigate to http://localhost:3001/login
- [ ] Test admin login with admin/admin123
- [ ] Verify redirect to /dashboard
- [ ] Check user info in sidebar (name + role)
- [ ] Test logout - should redirect to /login
- [ ] Clear localStorage and verify

### 2. Manager Login
- [ ] Login with manager/manager123
- [ ] Verify access to dashboard
- [ ] Check sidebar navigation
- [ ] Test logout functionality

### 3. Tenant Login
- [ ] Login with tenant/tenant123
- [ ] Verify redirect to /tenant-portal
- [ ] Check tenant portal displays correctly
- [ ] Verify balance and unit information
- [ ] Test logout

### 4. Signup Flow
- [ ] Click "Don't have an account? Sign up"
- [ ] Fill in: username, email, password, first_name, last_name
- [ ] Submit and verify auto-login
- [ ] Check new user gets TENANT role
- [ ] Logout and login again with new credentials

---

## Feature Testing

### Admin/Manager Features

#### Dashboard
- [ ] View statistics cards (buildings, units, tenants, income)
- [ ] Check occupancy rate calculation
- [ ] View recent payments list
- [ ] Test "Charge Rent" modal
- [ ] Export dashboard data to CSV

#### Buildings
- [ ] View buildings list
- [ ] Add new building
- [ ] Edit building details
- [ ] Delete building
- [ ] View building details
- [ ] Upload building photos

#### Units
- [ ] View units list
- [ ] Filter by building
- [ ] Filter by status (VACANT/OCCUPIED)
- [ ] Add new unit
- [ ] Edit unit details
- [ ] Delete unit

#### Tenants
- [ ] View active tenants list
- [ ] View tenant details (building, unit, phone, move-in date)
- [ ] View balance column
- [ ] Download tenant statement (PDF)
- [ ] Move out tenant (changes status to inactive)
- [ ] Verify moved-out tenant disappears from list

#### Payments
- [ ] View payments list
- [ ] Filter by tenant
- [ ] Add payment (reduces tenant balance)
- [ ] View payment history
- [ ] Export payments to CSV

#### Expenses
- [ ] View expenses list
- [ ] Add expense (categories: MAINTENANCE, UTILITIES, SALARY, etc.)
- [ ] Edit expense
- [ ] Delete expense
- [ ] View expense summary

#### Maintenance Requests
- [ ] View maintenance list
- [ ] Add new request
- [ ] Change status (PENDING → IN_PROGRESS → COMPLETED)
- [ ] Add resolution notes
- [ ] Assign to maintenance staff

---

### Tenant Portal Features

#### View Account Info
- [ ] See unit number and building
- [ ] View current balance
- [ ] Check balance color (red if due, green if paid)
- [ ] See status message

#### Download Statement
- [ ] Click "Download Statement" button
- [ ] Verify PDF generates
- [ ] Check PDF contains:
  - Tenant name and unit
  - Current balance
  - Transaction history table
  - Building information

#### View Transactions
- [ ] See recent transactions table
- [ ] Verify charges show as positive (red)
- [ ] Verify payments show as negative (green)
- [ ] Check date formatting
- [ ] View descriptions

---

## UI/UX Testing

### Responsive Design
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] Check sidebar collapses on mobile
- [ ] Verify modals work on all sizes

### Visual Elements
- [ ] Gradient headers display correctly
- [ ] Card hover effects work
- [ ] Stats cards show icons and colors
- [ ] Loading states appear during data fetch
- [ ] Error messages display properly

### Navigation
- [ ] Sidebar links work
- [ ] Active route highlighting
- [ ] Mobile sidebar toggle
- [ ] Logo and branding visible
- [ ] Logout button accessible

---

## Edge Cases & Error Handling

### Authentication Errors
- [ ] Wrong password - shows "Invalid credentials"
- [ ] Non-existent user - shows error
- [ ] Empty fields - validation prevents submit
- [ ] Session timeout handling
- [ ] Logout clears all data

### Data Errors
- [ ] Empty lists show empty state message
- [ ] Missing tenant info in portal
- [ ] Failed API calls show error toast
- [ ] Network errors handled gracefully

### Business Logic
- [ ] Can't delete building with units
- [ ] Can't delete tenant with active lease
- [ ] Balance updates after payment
- [ ] Occupancy rate recalculates
- [ ] PDF generation works with special characters

---

## Performance Testing

### Load Times
- [ ] Dashboard loads in < 2 seconds
- [ ] Tenant portal loads in < 1 second
- [ ] Tables with 100+ records perform well
- [ ] PDF generation < 3 seconds

### Data Integrity
- [ ] Balance calculations are accurate
- [ ] Date formatting is consistent
- [ ] Currency formatting (KES) correct
- [ ] No duplicate records
- [ ] Cascade deletes work properly

---

## Browser Compatibility

### Chrome
- [ ] All features work
- [ ] CSS renders correctly
- [ ] No console errors

### Firefox
- [ ] Authentication works
- [ ] PDFs download
- [ ] Gradients display

### Safari
- [ ] Login/logout functional
- [ ] Tables responsive
- [ ] Hover effects work

---

## Security Testing

### Authentication
- [ ] Protected routes redirect to /login
- [ ] Token/session persists across refresh
- [ ] Logout clears localStorage
- [ ] CSRF protection active
- [ ] Passwords not visible in network tab

### Authorization
- [ ] Tenants can't access /buildings
- [ ] Tenants can't access /tenants
- [ ] API returns 403 for unauthorized requests
- [ ] Role-based routing works

---

## API Testing

### Backend Endpoints
```bash
# Health Check
curl http://127.0.0.1:8000/api/

# Login
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get Buildings
curl http://127.0.0.1:8000/api/buildings/ \
  -H "Cookie: sessionid=<session_id>"

# Get Tenant Statement
curl http://127.0.0.1:8000/api/tenants/1/statement_pdf/ \
  -H "Cookie: sessionid=<session_id>"
```

---

## Test Results Checklist

- [ ] All 3 user roles can login
- [ ] All CRUD operations work
- [ ] PDF generation successful
- [ ] CSV exports download
- [ ] Tenant portal displays correctly
- [ ] Logout works for all roles
- [ ] No console errors
- [ ] Responsive on mobile
- [ ] Balance calculations accurate
- [ ] Data persists after refresh

---

## Known Issues

1. **Node.js v22 OpenSSL Error**
   - Solution: `export NODE_OPTIONS=--openssl-legacy-provider`

2. **CSRF Token**
   - Frontend fetches token on mount
   - Included in all POST requests

3. **Session Timeout**
   - Backend session expires after inactivity
   - Frontend redirects to login

---

## Next Steps After Testing

1. Fix any bugs found
2. Add loading spinners
3. Improve error messages
4. Add confirmation dialogs
5. Optimize database queries
6. Add pagination for large lists
7. Implement search functionality
8. Add email notifications
9. Create backup system
10. Document API endpoints
