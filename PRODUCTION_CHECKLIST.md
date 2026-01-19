# Production Checklist

## ✅ Pre-Launch Checklist

### Security
- [ ] `DEBUG = False` in settings.py
- [ ] Strong `SECRET_KEY` (50+ random characters)
- [ ] `ALLOWED_HOSTS` configured correctly
- [ ] `CSRF_TRUSTED_ORIGINS` set
- [ ] `CORS_ALLOWED_ORIGINS` restricted to your domain
- [ ] Remove all demo/test accounts except admin
- [ ] Change admin password to strong password
- [ ] Enable HTTPS/SSL certificates
- [ ] `SECURE_SSL_REDIRECT = True`
- [ ] `SESSION_COOKIE_SECURE = True`
- [ ] `CSRF_COOKIE_SECURE = True`
- [ ] Remove all debug print statements
- [ ] Review `.gitignore` (no secrets in repo)

### Database
- [ ] Migrate from SQLite to PostgreSQL
- [ ] Run all migrations successfully
- [ ] Create database backup system
- [ ] Test database restore procedure
- [ ] Set up automated daily backups
- [ ] Configure database connection pooling
- [ ] Add database indexes for performance

### Backend
- [ ] Install production WSGI server (Gunicorn)
- [ ] Configure gunicorn workers (CPU cores * 2 + 1)
- [ ] Set up supervisor/systemd for process management
- [ ] Collect static files (`collectstatic`)
- [ ] Configure WhiteNoise for static file serving
- [ ] Set up media file storage (local or cloud)
- [ ] Test all API endpoints
- [ ] Configure proper logging (not to console)
- [ ] Set up error monitoring (Sentry)
- [ ] Review and optimize slow queries

### Frontend
- [ ] Build production bundle (`npm run build`)
- [ ] Update API_BASE_URL to production domain
- [ ] Remove console.log statements
- [ ] Test all pages for errors
- [ ] Optimize images and assets
- [ ] Enable gzip compression
- [ ] Configure browser caching headers
- [ ] Test on multiple browsers
- [ ] Test responsive design on mobile

### Server Infrastructure
- [ ] Set up nginx as reverse proxy
- [ ] Configure nginx for SSL/TLS
- [ ] Set up firewall rules (UFW/iptables)
- [ ] Configure fail2ban for SSH protection
- [ ] Set up monitoring (htop, netdata, or similar)
- [ ] Configure log rotation
- [ ] Set up disk space alerts
- [ ] Configure automatic security updates

### Performance
- [ ] Enable Django caching (Redis/Memcached)
- [ ] Configure static file CDN (optional)
- [ ] Optimize database queries (no N+1)
- [ ] Add pagination to large lists
- [ ] Compress static files
- [ ] Lazy load images
- [ ] Test page load times (< 3 seconds)
- [ ] Run Lighthouse audit

### Email & Notifications
- [ ] Configure SMTP server
- [ ] Test email sending
- [ ] Set up email templates
- [ ] Configure error email notifications
- [ ] Set FROM email address
- [ ] Test forgot password flow (if implemented)

### Documentation
- [ ] Update README with production URL
- [ ] Document environment variables
- [ ] Create admin user guide
- [ ] Create tenant user guide
- [ ] Document backup procedure
- [ ] Document deployment procedure
- [ ] Create troubleshooting guide

### Testing
- [ ] Run full test suite
- [ ] Test all user roles (admin, manager, tenant)
- [ ] Test login/logout flows
- [ ] Test CRUD operations
- [ ] Test PDF generation
- [ ] Test CSV exports
- [ ] Test file uploads
- [ ] Test error pages (404, 500)
- [ ] Load testing (optional)
- [ ] Security audit/penetration testing

### Legal & Compliance
- [ ] Add Terms of Service
- [ ] Add Privacy Policy
- [ ] Add GDPR compliance (if applicable)
- [ ] Add cookie consent (if needed)
- [ ] Review data retention policies
- [ ] Add license information

### Monitoring & Analytics
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure error tracking (Sentry)
- [ ] Set up performance monitoring (New Relic, optional)
- [ ] Add Google Analytics (optional)
- [ ] Set up server metrics dashboard
- [ ] Configure alert notifications

### Backup & Recovery
- [ ] Test database backup
- [ ] Test database restore
- [ ] Backup static files
- [ ] Backup media files
- [ ] Document recovery procedure
- [ ] Schedule automated backups
- [ ] Store backups off-site

---

## 🚀 Launch Day

### Pre-Launch (T-1 hour)
- [ ] Final database backup
- [ ] Review all environment variables
- [ ] Check disk space availability
- [ ] Verify SSL certificate valid
- [ ] Test all critical paths one more time

### Launch (T-0)
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Run database migrations
- [ ] Clear caches
- [ ] Test login
- [ ] Monitor error logs
- [ ] Check server resources (CPU, RAM)

### Post-Launch (T+1 hour)
- [ ] Monitor error rates
- [ ] Check response times
- [ ] Verify email delivery
- [ ] Test from different devices
- [ ] Monitor database connections
- [ ] Check backup ran successfully

---

## 📋 Post-Launch Tasks

### Day 1
- [ ] Monitor error logs continuously
- [ ] Check user feedback
- [ ] Verify all features working
- [ ] Document any issues
- [ ] Create support tickets for bugs

### Week 1
- [ ] Review performance metrics
- [ ] Check backup integrity
- [ ] Gather user feedback
- [ ] Prioritize bug fixes
- [ ] Plan improvements

### Month 1
- [ ] Performance optimization review
- [ ] Security audit
- [ ] User satisfaction survey
- [ ] Feature prioritization meeting
- [ ] Review and update documentation

---

## 🔧 Common Issues & Quick Fixes

### Static Files Not Loading
```bash
python manage.py collectstatic --noinput
sudo systemctl restart nginx
```

### 502 Bad Gateway
```bash
sudo systemctl status gunicorn
sudo supervisorctl restart rental-system
```

### Database Connection Errors
```bash
sudo systemctl status postgresql
# Check connection settings in .env
```

### High Memory Usage
```bash
# Restart services
sudo supervisorctl restart rental-system
# Check for memory leaks
ps aux --sort=-%mem | head
```

---

## 📞 Emergency Contacts

- **System Admin:** [Your Name] - [Phone]
- **Database Admin:** [Name] - [Phone]
- **Hosting Support:** [Provider] - [Support URL]
- **SSL Certificate:** [Provider] - [Renewal Date]

---

## 🎯 Success Criteria

Launch is successful when:
- [ ] All 3 user types can login
- [ ] No critical errors in logs
- [ ] All pages load in < 3 seconds
- [ ] PDF generation works
- [ ] CSV exports work
- [ ] Mobile responsive works
- [ ] SSL certificate valid
- [ ] Backups running automatically
- [ ] Monitoring alerts configured
- [ ] Users can perform core tasks

---

## 📝 Notes

- Keep this checklist updated with any new requirements
- Document any deviations or exceptions
- Track completion dates for audit trail
- Share with all team members

**Good luck with your launch! 🚀**
