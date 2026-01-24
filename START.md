# ⚡ Quick Start Guide

## 🚀 Start Backend

```bash
cd server
npm install
node server.js
```

**Expected Output:**

```
🎮 GamerHelpers API running on http://localhost:3000
```

## 🚀 Start Frontend

```bash
npm install
npm run dev
```

**Expected Output:**

```
  VITE v7.2.4  ready in XXX ms
  ➜  Local:   http://localhost:5173/
```

## ✅ Verify Everything Works

### 1. Backend Health Check

Open browser and visit:

```
http://localhost:3000/api/health
```

Should see: `{"status":"OK","message":"GamerHelpers API is running"}`

### 2. Frontend Loads

Open browser and visit:

```
http://localhost:5173
```

Should see: GamerHelpers landing page with login option

## 🧪 Test the Connection

### Test 1: Register & Login

1. Go to http://localhost:5173/signup
2. Fill in form:
   - Full Name: Test User
   - Email: test@example.com
   - Password: test123456
   - Confirm: test123456
   - Accept terms: ✓
3. Click "Create Account"
4. Should redirect to home page
5. See "Loading services..." message

### Test 2: Browse Services

1. Should see services from database
2. Try filtering by game category
3. Services should update in real-time

### Test 3: Apply as Coach

1. Go to "Apply" page
2. Fill in application:
   - Select a game from dropdown
   - Enter title and description
   - Set price
   - Accept terms
3. Submit
4. See "Application submitted!" message

### Test 4: Chat

1. Click "Chat Now" on any service
2. Should show existing conversations
3. Try sending a message

## 🔧 Configuration

### If Backend on Different Port

Edit `.env.local`:

```
VITE_API_BASE_URL=http://localhost:3001/api
```

Then restart frontend (Vite auto-refreshes).

### If Database Credentials Different

Edit `server/.env`:

```
DB_HOST=your-host
DB_USER=your-user
DB_PASSWORD=your-password
DB_NAME=gamer_helpers
```

Then restart backend.

### If Using Different Frontend Port

Just use whatever port Vite assigns. No config needed.

## 📊 Database Setup (If Needed)

1. Create MySQL database:

```sql
CREATE DATABASE gamer_helpers;
USE gamer_helpers;
```

2. Import schema (from INTEGRATION.md or DATABASE.md)

3. Update `server/.env` with your credentials

## 🆘 Troubleshooting

### "Cannot find module 'express'"

```bash
cd server
npm install express cors mysql2 bcrypt jsonwebtoken dotenv
```

### "Connection refused" (backend)

- Check if MySQL is running
- Check DB credentials in `server/.env`
- Check database exists

### "Connection refused" (frontend → backend)

- Check backend is running on port 3000
- Check `.env.local` has correct API URL
- Check CORS is enabled (it is by default)

### "SyntaxError: Unexpected token" on login

- Clear browser cache: Ctrl+Shift+Delete
- Clear localStorage: Open DevTools → Application → localStorage → Clear All
- Refresh page

### Services not loading

- Check browser console for errors (F12)
- Check server logs for errors
- Verify database has games data

## 📱 API Examples

### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "password":"password123",
    "full_name":"John Doe",
    "accept_terms":true
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Get Services

```bash
curl http://localhost:3000/api/services
```

### Get Games

```bash
curl http://localhost:3000/api/games
```

## 📂 Project Structure

```
GamerHelpers/
├── src/
│   ├── pages/
│   ├── components/
│   ├── services/
│   │   └── api.js (← All API calls)
│   ├── context/
│   │   └── AuthContext.jsx (← Auth state)
│   └── ...
├── server/
│   ├── server.js (← Backend API)
│   └── .env (← DB config)
├── .env.local (← Frontend config)
└── package.json
```

## 🎯 Next Steps

1. ✅ Start backend
2. ✅ Start frontend
3. ✅ Register account
4. ✅ Browse services
5. ✅ Test features
6. 🔲 Add games to database
7. 🔲 Add sample services
8. 🔲 Create admin user
9. 🔲 Test admin features
10. 🔲 Deploy to production

## 💡 Useful Commands

```bash
# Frontend
npm run dev       # Start dev server
npm run build     # Build for production
npm run preview   # Preview production build

# Backend
node server/server.js    # Start server
npm install              # Install dependencies

# Database
mysql -u root            # Connect to MySQL
USE gamer_helpers;       # Select database
SHOW TABLES;             # List tables
```

## 🌐 API Documentation

See `INTEGRATION.md` for:

- Complete API endpoint list
- Request/response examples
- Error handling
- Authentication flow

## ✨ Features Ready

✅ User registration & login  
✅ Browse gaming services  
✅ Filter by game  
✅ Real-time chat  
✅ Apply as coach  
✅ Admin dashboard  
✅ Service management

## 🐛 Report Issues

Check console logs:

- Frontend: F12 → Console
- Backend: Terminal where you ran `node server/server.js`

Look for error messages and stack traces.

---

**You're all set!** 🎉

Start with these commands:

```bash
# Terminal 1 - Backend
cd server
npm install
node server.js

# Terminal 2 - Frontend
npm install
npm run dev
```

Visit http://localhost:5173 and start testing!
