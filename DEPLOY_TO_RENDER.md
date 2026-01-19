# 🚀 Quick Deploy to Render

Deploy your Rental Management System to Render in 3 simple steps!

## Prerequisites
- [Render account](https://render.com) (free)
- Code pushed to GitHub

## Step 1: Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

## Step 2: Deploy on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repository
4. Click **"Apply"**

Render will automatically create:
- ✅ PostgreSQL Database (free)
- ✅ Django Backend API
- ✅ React Frontend

## Step 3: Configure URLs

### Update Backend Environment Variables
In your backend service settings, add:

```bash
ALLOWED_HOSTS=your-backend-name.onrender.com
CORS_ALLOWED_ORIGINS=https://your-frontend-name.onrender.com
CSRF_TRUSTED_ORIGINS=https://your-frontend-name.onrender.com,https://your-backend-name.onrender.com
```

### Update Frontend Environment Variable
In your frontend service settings, update:

```bash
REACT_APP_API_URL=https://your-backend-name.onrender.com/api
```

## Step 4: Create Admin User

1. Open your backend service shell on Render
2. Run:
```bash
cd backend
python manage.py createsuperuser
```

## 🎉 Done!

Visit your frontend URL and login!

---

## 📚 Need More Details?

- [Full Deployment Guide](RENDER_DEPLOYMENT.md)
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)
- [Environment Variables Example](.env.example)

## ⚡ Quick Links

After deployment, you'll have:
- **Frontend**: `https://rental-frontend.onrender.com`
- **Backend API**: `https://rental-backend.onrender.com/api`
- **Admin Panel**: `https://rental-backend.onrender.com/admin`

## 💡 Tips

- **First load is slow**: Free tier services spin down after 15 min
- **Use environment variables**: Never commit sensitive data
- **Check logs**: If something fails, check Render logs
- **Auto-deploy**: Push to main branch triggers automatic deployment

## 🐛 Troubleshooting

### Backend won't start?
- Check logs in Render dashboard
- Verify all environment variables are set
- Ensure DATABASE_URL is configured

### Frontend shows errors?
- Verify REACT_APP_API_URL points to your backend
- Check CORS settings in backend
- Ensure backend is running

### Need help?
- Review [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)
- Check Render docs: https://render.com/docs
- Visit community: https://community.render.com

---

**Made with ❤️ | Free to deploy on Render!**
