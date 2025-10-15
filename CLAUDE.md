# Festival Management System - Claude Context

## Current Project State (v1.8.4)
- **Status**: Deployed on Vercel with Supabase database
- **Login Credentials**: admin@festival.com / admin123
- **Deployment**: https://festival-management.vercel.app

## Recent Major Changes
- **v1.8.4**: Deployed to Vercel with Supabase PostgreSQL database
- **Function Limit**: Reduced API endpoints to stay under Vercel's 12 function limit
- **Database Migration**: Converted from SQLite to PostgreSQL for cloud deployment
- **CORS & Authentication**: Fixed for serverless environment

## CRITICAL: Vercel Deployment Constraints
**⚠️ 12 Function Limit**: Vercel Hobby plan allows maximum 12 serverless functions
- **Essential Functions Only**: Keep only critical API endpoints
- **Current Functions**: `/api/auth/login.js`, `/api/system-stats.js`, `/api/init-db.js`
- **Remove Debug Files**: Always remove test/debug functions before deployment

## Database Configuration  
- **Provider**: Supabase PostgreSQL
- **Connection**: Transaction pooler URI (port 6543) - IPv6 compatibility required
- **Password**: dahtUj-sofdiq-9rokpy
- **Initialization**: POST to `/api/init-db` after deployment

## Current Architecture
- **Backend**: Serverless functions on Vercel
- **Frontend**: React/TypeScript with Material-UI  
- **Database**: Supabase PostgreSQL
- **Deployment**: Automatic from GitHub main branch

## Important Commands
```bash
# Start backend
cd backend && npm start

# Start frontend  
cd frontend && npm start

# Build for production
npm run build

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@festival.com","password":"admin123"}'
```

## Known Issues to Watch
- Winston logging temporarily disabled (using console.log)
- Schedule builder: User mentioned issue with time display (partially fixed)

## Next Session Priorities
- Monitor for any remaining schedule display issues
- Consider re-enabling Winston logging once stable
- Test production deployment pipeline

## Development Notes
- Always commit both frontend and backend changes together now
- Use `npm run build` before production deployment
- Health check endpoint: http://localhost:3001/api/health