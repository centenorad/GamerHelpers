# GamerHelpers - Full Stack Integration

## Overview

Complete connection of frontend and backend with all temporary mock data removed. The application now uses a real API backend.

## Architecture

### Frontend (React + Vite)

- **Location**: `src/`
- **State Management**: React Context (AuthContext)
- **API Client**: `src/services/api.js`
- **Pages**: Home, Chat, Apply, Login, AdminDashboard

### Backend (Express + MySQL)

- **Location**: `server/server.js`
- **Database**: MySQL with connection pooling
- **Authentication**: JWT tokens
- **Security**: bcrypt password hashing

## Setup Instructions

### 1. Backend Setup

```bash
# Install dependencies
cd server
npm install express cors mysql2 bcrypt jsonwebtoken dotenv

# Configure environment
# Edit server/.env with your database credentials
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=gamer_helpers
JWT_SECRET=your-secret-key
PORT=3000

# Start the server
node server.js
```

**Server runs on**: `http://localhost:3000`

### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Configure environment
# Create .env.local in project root
VITE_API_BASE_URL=http://localhost:3000/api

# Start Vite dev server
npm run dev
```

**Frontend runs on**: `http://localhost:5173` (or your configured port)

## API Integration

### API Client Structure

All API calls go through `src/services/api.js`:

```javascript
import { AuthAPI, ServicesAPI, ChatAPI, AdminAPI } from "../services/api";

// Authentication
await AuthAPI.login(email, password);
await AuthAPI.register(email, password, fullName);

// Services
const services = await ServicesAPI.listServices(gameId);
const service = await ServicesAPI.getService(serviceId);

// Chat
const chats = await ChatAPI.listChats();
await ChatAPI.sendMessage(chatId, message);

// Admin
const dashboard = await AdminAPI.getDashboard();
```

### Available Endpoints

#### Authentication (4)

- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user

#### Games (6)

- `GET /api/games` - List all games
- `GET /api/games/:id` - Game details
- `GET /api/games/:id/stats` - Game statistics
- `POST /api/games` - Create game (admin)
- `PUT /api/games/:id` - Update game (admin)
- `DELETE /api/games/:id` - Delete game (admin)

#### Coaches (3)

- `GET /api/coaches` - List verified coaches
- `GET /api/coaches/:id` - Coach profile
- `POST /api/coaches/:id/specializations` - Add specialization

#### Applications (5)

- `POST /api/applications` - Submit application
- `GET /api/applications/pending` - Pending apps (admin)
- `POST /api/applications/:id/approve` - Approve app (admin)
- `POST /api/applications/:id/reject` - Reject app (admin)

#### Services (2)

- `GET /api/services` - Browse services
- `GET /api/services/:id` - Service details

#### Requests (5)

- `POST /api/requests` - Request service
- `GET /api/requests/:id` - Request details
- `POST /api/requests/:id/accept` - Accept request
- `POST /api/requests/:id/reject` - Reject request
- `POST /api/requests/:id/complete` - Complete request

#### Chat (3)

- `GET /api/chats` - List chats
- `GET /api/chats/:id/messages` - Get messages
- `POST /api/chats/:id/messages` - Send message

#### Reviews (2)

- `POST /api/reviews` - Submit review
- `GET /api/reviews/:coach_id` - Get reviews

#### Admin (3)

- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - List users
- `PUT /api/admin/users/:id/status` - Update user status

## Frontend Pages

### 1. **Home** (`src/pages/Home.jsx`)

- ✅ Fetches games from backend
- ✅ Lists services with filtering
- ✅ Real-time data loading

### 2. **Chat** (`src/pages/Chat.jsx`)

- ✅ Loads user conversations
- ✅ Fetches message history
- ✅ Sends messages in real-time

### 3. **Apply** (`src/pages/Apply.jsx`)

- ✅ Dynamic game selection
- ✅ Service application submission
- ✅ Form validation

### 4. **Admin Dashboard** (`src/pages/AdminDashboard.jsx`)

- ✅ Real-time statistics
- ✅ Pending applications list
- ✅ Approve/reject applications

### 5. **Authentication** (`src/pages/login/`)

- ✅ Login with JWT
- ✅ Registration with validation
- ✅ Error handling

## Data Flow

### User Registration & Login

1. User fills registration form
2. Frontend sends to `POST /api/auth/register`
3. Backend hashes password (bcrypt) and creates user
4. JWT token returned and stored in localStorage
5. User redirected to home page

### Service Browsing

1. Home page loads
2. Fetches games via `GET /api/games`
3. Fetches services via `GET /api/services`
4. Services filtered by game category
5. Real-time updates on category change

### Applying as Coach

1. User submits application on Apply page
2. Sends to `POST /api/applications`
3. Admin reviews in AdminDashboard
4. Admin approves → service published
5. Coach can now accept requests

### Chat & Messaging

1. User requests service
2. Coach accepts → chat created
3. Users fetch chat list via `GET /api/chats`
4. Messages fetched via `GET /api/chats/:id/messages`
5. New messages sent via `POST /api/chats/:id/messages`

## Removed Mock Data

- ✅ `POSTS` array from `src/constants/posts.js` (replaced with API calls)
- ✅ `initialChats` in `src/pages/Chat.jsx` (replaced with real chat fetching)
- ✅ Mock pending applications in `AdminDashboard.jsx`
- ✅ Mock service requests
- ✅ Hardcoded user data in `AuthContext.jsx`

## Authentication & Security

### Token Storage

```javascript
// Token stored in localStorage
localStorage.setItem("token", response.token);

// Sent in all API requests
headers.Authorization = `Bearer ${token}`;
```

### Password Security

- Passwords hashed with bcrypt (cost factor 10)
- Never stored in plain text
- Verified on login

### Role-Based Access

- `user`: Regular user
- `employee`: Verified coach
- `admin`: Platform admin

## Environment Variables

### Frontend (.env.local)

```
VITE_API_BASE_URL=http://localhost:3000/api
```

### Backend (server/.env)

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=gamer_helpers
JWT_SECRET=your-secret-key
PORT=3000
NODE_ENV=development
```

## Testing the Integration

### 1. Test Backend

```bash
cd server
node server.js
# Check: http://localhost:3000/api/health
```

### 2. Test Frontend

```bash
npm run dev
# Visit: http://localhost:5173
```

### 3. Test API Calls

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","full_name":"Test User","accept_terms":true}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get games
curl http://localhost:3000/api/games
```

## Next Steps

1. **Database Setup**: Import database schema into MySQL
2. **Production Build**: `npm run build`
3. **Deployment**: Deploy backend to server, frontend to CDN
4. **Environment**: Update API_BASE_URL for production
5. **Security**: Change JWT_SECRET to strong random string
6. **HTTPS**: Enable SSL/TLS in production
7. **Rate Limiting**: Add rate limiting middleware
8. **Logging**: Implement request logging
9. **Monitoring**: Set up error tracking
10. **Testing**: Add unit and integration tests

## Troubleshooting

### API Connection Failed

- Check backend is running: `http://localhost:3000/api/health`
- Verify CORS is enabled
- Check `.env.local` has correct API URL

### Database Connection Error

- Verify MySQL is running
- Check credentials in `server/.env`
- Ensure database `gamer_helpers` exists
- Check database tables are created

### Authentication Issues

- Clear localStorage: `localStorage.clear()`
- Refresh page
- Check JWT_SECRET matches
- Verify token expiration

### CORS Issues

- Backend has CORS enabled by default
- If issues persist, add to `server/server.js`:

```javascript
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
```

## File Structure

```
GamerHelpers/
├── src/
│   ├── pages/
│   │   ├── Home.jsx (✅ Real data)
│   │   ├── Chat.jsx (✅ Real data)
│   │   ├── Apply.jsx (✅ Real data)
│   │   ├── AdminDashboard.jsx (✅ Real data)
│   │   └── login/
│   │       ├── Login.jsx (✅ Backend auth)
│   │       └── CreateAccount.jsx (✅ Backend auth)
│   ├── context/
│   │   └── AuthContext.jsx (✅ Backend integration)
│   ├── services/
│   │   └── api.js (✅ All endpoints)
│   ├── components/
│   │   └── ServicePost.jsx (✅ Real data)
│   └── constants/
│       └── posts.js (✅ Empty, deprecated)
├── server/
│   ├── server.js (Express API)
│   └── .env (Database config)
├── .env.local (Frontend API URL)
└── package.json
```

## Support

For issues or questions:

1. Check the Troubleshooting section
2. Review API documentation
3. Check browser console for errors
4. Check server logs for backend errors

---

**Status**: ✅ All integration complete. Ready for production setup.
