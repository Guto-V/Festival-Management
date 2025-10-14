# Festival Management System - Deployment Guide v1.8.4

## 🚀 Production Deployment Ready

This guide will walk you through deploying the Festival Management System to Supabase (database) + Vercel (hosting).

---

## Prerequisites

1. **GitHub Account** with repository access
2. **Supabase Account** (free tier available)
3. **Vercel Account** (free tier available)

---

## Step 1: Push to GitHub

First, push the v1.8.4 code to GitHub:

```bash
cd "/Users/guto/Documents/Festival Management"
git push origin main
```

If authentication fails, you may need to:
- Use GitHub CLI: `gh auth login`
- Or set up a Personal Access Token

---

## Step 2: Set Up Supabase Database

### 2.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create new project:
   - **Name**: `festival-management`
   - **Database Password**: Choose a secure password
   - **Region**: Choose closest to your users

### 2.2 Set Up Database Schema
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the entire contents of `supabase/config.sql`
3. Paste and run the SQL script
4. This will create all tables, triggers, and default data

### 2.3 Get Database URL
1. Go to **Settings > Database**
2. Copy the **Connection String** (URI format)
3. Replace `[YOUR-PASSWORD]` with your database password
4. Save this URL - you'll need it for Vercel

---

## Step 3: Deploy to Vercel

### 3.1 Connect GitHub Repository
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository: `Festival-Management`
4. Framework: **Other** (we have custom config)
5. Root Directory: **Leave empty** (uses root)

### 3.2 Configure Environment Variables
In Vercel project settings > Environment Variables, add:

**Required Variables:**
```
NODE_ENV=production
DATABASE_URL=[Your Supabase database URL from Step 2.3]
JWT_SECRET=[Generate a secure random string - 32+ characters]
```

**Recommended Variables:**
```
DB_MAX_CONNECTIONS=20
CORS_ORIGIN=https://[your-vercel-domain].vercel.app
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW=900000
BCRYPT_ROUNDS=12
```

**Optional Variables:**
```
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=[Your SendGrid API key]
EMAIL_FROM=noreply@your-domain.com
STORAGE_TYPE=supabase
SUPABASE_URL=[Your Supabase project URL]
SUPABASE_ANON_KEY=[Your Supabase anon key]
```

### 3.3 Deploy
1. Click **Deploy**
2. Vercel will automatically:
   - Build the frontend (`npm run build` in frontend/)
   - Deploy the backend API
   - Set up routes per `vercel.json` config

---

## Step 4: Test Deployment

### 4.1 Basic Health Check
- Visit: `https://[your-vercel-domain].vercel.app/api/health`
- Should return: `{"status":"OK","timestamp":"..."}`

### 4.2 Database Connection Test
- Visit: `https://[your-vercel-domain].vercel.app/api/auth/login`
- Should show login form (not error)

### 4.3 Full Application Test
1. Go to: `https://[your-vercel-domain].vercel.app`
2. Login with: `admin@festival.com` / `admin123`
3. Test key features:
   - Dashboard loads
   - Artists page shows data
   - Schedule builder works
   - Contracts page functions

---

## Troubleshooting

### Common Issues:

**1. Database Connection Errors**
- Check DATABASE_URL is correct in Vercel environment variables
- Ensure Supabase project is running
- Verify database schema was applied correctly

**2. Authentication Errors**
- Check JWT_SECRET is set in Vercel environment variables
- Verify it's a secure random string (32+ characters)

**3. CORS Errors**
- Set CORS_ORIGIN to your Vercel domain
- Check it matches exactly: `https://your-app.vercel.app`

**4. Build Errors**
- Check Vercel build logs
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

### Database Reset (if needed):
If you need to reset the database:
1. Go to Supabase SQL Editor
2. Run: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`
3. Re-run the `supabase/config.sql` script

---

## Production URLs

After deployment, you'll have:
- **Frontend**: `https://[your-vercel-domain].vercel.app`
- **API**: `https://[your-vercel-domain].vercel.app/api/*`
- **Database**: Supabase managed PostgreSQL
- **Health Check**: `https://[your-vercel-domain].vercel.app/api/health`

---

## Security Notes

1. **Change Default Password**: Login and change admin password immediately
2. **JWT Secret**: Use a cryptographically secure random string
3. **Database**: Supabase handles security, backups, and SSL
4. **HTTPS**: Vercel provides automatic HTTPS certificates

---

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Vercel CDN    │    │  Vercel Runtime  │    │   Supabase DB   │
│   (Frontend)    │────│   (Backend)      │────│  (PostgreSQL)   │
│   React/MUI     │    │  Node.js/Express │    │   Auto-scaling  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

**Features:**
- **Auto-scaling**: Both Vercel and Supabase scale automatically
- **Global CDN**: Fast frontend delivery worldwide
- **Managed Database**: Automatic backups, SSL, monitoring
- **Zero-downtime**: Vercel handles rolling deployments

---

**Status**: ✅ v1.8.4 Production Ready
**Next**: Follow steps above to deploy!