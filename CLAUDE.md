# Festival Management System - Claude Context

## Current Project State (v1.8.2)
- **Status**: Production-ready system with contracts functionality restored
- **Login Credentials**: admin@festival.com / admin123
- **Port**: Backend runs on 3001, Frontend on 3000

## Recent Major Changes
- **v1.8.2**: Integrated frontend into main repository (no more submodule issues)
- **Contracts API**: Fully restored and functional
- **Schedule fixes**: Timeline display issues resolved
- **Production infrastructure**: Docker, CI/CD, health checks added

## Key Issues Resolved
1. **Missing signed contracts**: Restored complete contracts API
2. **Schedule display problems**: Fixed extra empty space after end time
3. **Data loss prevention**: Converted frontend from submodule to regular files
4. **Authentication**: Server startup issues resolved

## Current Architecture
- **Backend**: Node.js/Express with SQLite database
- **Frontend**: React/TypeScript with Material-UI
- **Infrastructure**: Docker, GitHub Actions CI/CD
- **Deployment**: Automated scripts for dev/staging/production

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