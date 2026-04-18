# Chakravyuh - Complete Setup & Troubleshooting Guide

## 🎯 System Overview

- **Frontend**: React + Vite (http://localhost:3001)
- **Backend**: FastAPI + Prisma (http://127.0.0.1:8000)
- **Database**: SQLite (dev.db)
- **Authentication**: JWT + bcrypt

## 🚀 Quick Start

### Terminal 1 - Start Backend
```bash
cd d:\chakravyu\backend
npm run server
```

Expected output:
```
✅ Node.js proxy server running on http://localhost:8000
📡 Proxying requests to Python FastAPI on port 8001
🚀 Starting Python FastAPI backend...
INFO:     Uvicorn running on http://0.0.0.0:8001
```

### Terminal 2 - Start Frontend
```bash
cd d:\chakravyu\frontend
npm run dev
```

Expected output:
```
VITE v4.5.14  ready in 212 ms

  ➜  Local:   http://localhost:3001/
```

## 📋 URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3001 | React UI |
| Backend Proxy | http://127.0.0.1:8000 | API Proxy |
| FastAPI Direct | http://0.0.0.0:8001 | Python Backend |
| Swagger Docs | http://127.0.0.1:8000/docs | API Documentation |

## 🔐 Test Credentials

```
Email: admin@school.com
Password: demo123
Role: principal
```

## 🐛 Troubleshooting "Failed to fetch" Error

### Checklist:

1. **Backend Running?**
   - [ ] Terminal shows "Node.js proxy server running"
   - [ ] Terminal shows "Uvicorn running on http://0.0.0.1:8001"
   - [ ] Visit http://127.0.0.1:8000 in browser

2. **Port 8000 Available?**
   ```bash
   netstat -ano | findstr :8000
   # If port is in use:
   taskkill /PID <PID_NUMBER> /F
   ```

3. **Port 3000/3001 Available?**
   ```bash
   netstat -ano | findstr :3001
   # If port is in use, it will use 3002, 3003, etc.
   ```

4. **API URL Correct?**
   - [ ] Check `d:\chakravyu\frontend\.env.local`
   - [ ] Should be: `VITE_API_URL=http://127.0.0.1:8000`

5. **CORS Enabled?**
   - [ ] Backend has `allow_origins=["*"]` (confirmed in main.py)

6. **Python Dependencies?**
   ```bash
   cd d:\chakravyu\backend
   pip install --upgrade -r requirements.txt
   ```

7. **Node Dependencies?**
   ```bash
   # Frontend
   cd d:\chakravyu\frontend
   npm install

   # Backend
   cd d:\chakravyu\backend
   npm install
   ```

## 🔧 Common Issues & Fixes

### Issue: "Cannot GET /"
**Solution**: Backend service isn't running. Start backend first.

### Issue: "Failed to fetch"
**Solution**: 
1. Check backend is running: `curl http://127.0.0.1:8000`
2. Check API URL in `.env.local`
3. Check browser console for detailed error

### Issue: "Module not found" in backend
**Solution**:
```bash
cd d:\chakravyu\backend
pip install --upgrade -r requirements.txt
```

### Issue: Port already in use
**Solution**:
```bash
# Find process using port
netstat -ano | findstr :8000
# Kill the process
taskkill /PID <PID> /F
```

### Issue: CORS errors
**Note**: CORS is already enabled for all origins. If still getting errors, check:
1. Backend is actually running
2. Request URL matches backend URL exactly
3. Network tab in DevTools for actual error

## 📊 API Endpoints

### Authentication
```
POST   /api/v1/auth/register     - Register new user
POST   /api/v1/auth/login        - Login (returns JWT token)
GET    /api/v1/auth/me           - Get current user (requires token)
POST   /api/v1/auth/refresh      - Refresh token
```

### Reports
```
POST   /api/v1/report/           - Submit report
GET    /api/v1/report/{id}       - Get reports
```

### More endpoints available at `/docs`

## 🔑 JWT Token Usage

After login, token is stored in `localStorage`:
```javascript
// Token is automatically included in subsequent requests
const token = localStorage.getItem('access_token');

// Use in requests:
fetch('http://127.0.0.1:8000/api/v1/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 📁 Project Structure

```
d:\chakravyu\
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py            # FastAPI app
│   │   ├── database.py        # Prisma setup
│   │   ├── routers/           # API routes
│   │   │   └── auth.py        # Auth endpoints
│   │   └── utils/             # Utilities
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   ├── dev.db             # SQLite database
│   │   └── migrations/        # Database migrations
│   ├── server.js              # Node proxy
│   └── requirements.txt        # Python dependencies
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── pages/             # Page components
│   │   ├── context/           # Auth context
│   │   ├── components/        # UI components
│   │   └── App.jsx            # Main app
│   └── .env.local             # Frontend config
│
└── start-all.sh               # Complete startup script
```

## ✅ Health Check

Visit these URLs to verify setup:

1. **Backend Proxy**: http://127.0.0.1:8000
   - Should return: `{"message": "Chakravyuh API is running"}`

2. **Frontend**: http://localhost:3001
   - Should show: Chakravyuh login page

3. **API Docs**: http://127.0.0.1:8000/docs
   - Should show: Swagger UI with all endpoints

4. **Database**: Located at `d:\chakravyu\backend\prisma\dev.db`
   - SQLite database with User, Report, WorkOrder, Repair tables

## 🚨 Still Having Issues?

1. **Clear browser cache**: Ctrl+Shift+Delete
2. **Check browser console**: F12 → Console tab for errors
3. **Check Network tab**: F12 → Network → Check request/response
4. **Restart both services**: Kill terminals and start fresh
5. **Check Python version**: `python --version` (should be 3.8+)
6. **Check Node version**: `node --version` (should be 16+)

## 📝 Environment Files

### Frontend (.env.local)
```
VITE_API_URL=http://127.0.0.1:8000
```

### Backend (.env)
```
DATABASE_URL=file:./dev.db
SECRET_KEY=your-secret-key-change-in-production
ENVIRONMENT=development
DEBUG=true
```

---

**For detailed API documentation, visit**: http://127.0.0.1:8000/docs
