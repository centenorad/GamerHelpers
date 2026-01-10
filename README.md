# Backend Wiring Notes (Frontend Integration Guide)

This README is a detailed handoff for the backend team. It explains how to connect our React (Vite) SPA to real APIs, what data shapes we expect, and exactly where to plug calls in. Everything lives in `src/` unless noted.

Contents
- 1) Quick start and structure
- 2) App state and simple routing
- 3) Authentication (Sign Up / Login)
- 4) Feeds (Home/Dashboard and Game)
- 5) Explore (Games + People)
- 6) Profile (self vs other)
- 7) Chat (conversations + messages)
- 8) Images & Lightbox overlay
- 9) Config, env and example API client
- 10) Data contracts (examples)
- 11) Integration checklist (TL;DR)

---

## 1) Quick start and structure

- Dev: `npm install && npm run dev`
- Build: `npm run build`
- Static assets: `src/assets/`

Important files:
- `App.jsx` – root; owns global UI state (auth, page switching, lightbox) and passes props to pages.
- `RegLogin.jsx` – Sign Up / Login overlays.
- Pages
  - `Dashboard.jsx` – Home feed.
  - `Explore.jsx` – Explore (games + pilots/coaches).
  - `Game.jsx` – Feed filtered by selected game.
  - `Profile.jsx` – Profile page (self or other user).
  - `Chat.jsx` – Conversation UI.
- UI helper: `Lightbox.jsx` – image overlay viewer.
- Styles: `App.css`, `Dashboard.css`.

---

## 2) App state and simple routing

We’re not using `react-router` yet. `App.jsx` toggles the page using:
```js
const [authedPage, setAuthedPage] = useState(
  'home' | 'explore' | 'game' | 'profile' | 'user' | 'chat'
);
```
Other important state:
- `isAuthed` – set true on successful login.
- `selectedGame` – game key for Game page (e.g., `'valorant'`, `'genshin'`).
- `selectedUser` – used when opening another person’s profile or chat.
- `recentVisits` – small array of game keys stored in `localStorage`.
- `lightbox` – `{ open, images, index, title }` controlled by `App` and used by `Lightbox.jsx`.

If you introduce a router later, each page already exists as a component; the change should be mechanical.

---

## 3) Authentication (Sign Up / Login)

File: `src/RegLogin.jsx`

Replace the `onSubmit` no‑ops with real API calls:

Endpoints (suggested):
- `POST /auth/register`
  - body: `{ name, email, password, acceptTerms }`
  - response: `{ user: { id, name, ... }, token }`
- `POST /auth/login`
  - body: `{ email, password }`
  - response: `{ user, token }`

On success:
1) Store token (memory/cookie/localStorage as agreed).
2) Notify `App` by setting `isAuthed` true.
3) Optionally fetch current user: `GET /users/me` and hold in context.

Logout: clear token and set `isAuthed=false`.

---

## 4) Feeds (Home/Dashboard and Game)

Post object (expected):
```json
{
  "id": "post-id",
  "author": { "id": "user-id", "name": "Jane", "handle": "@jane", "avatarUrl": "https://..." },
  "title": "string",
  "body": "string",
  "media": ["https://cdn/img1.jpg", "https://cdn/img2.jpg"],
  "game": "valorant",
  "metrics": { "likes": 0, "comments": 0 },
  "createdAt": "2025-01-01T12:00:00.000Z"
}
```

Endpoints (suggested):
- Home feed: `GET /feed?cursor=...`
- Game feed: `GET /games/:gameKey/feed?cursor=...`
- Actions:
  - Like: `POST /posts/:id/like`
  - Comment: `POST /posts/:id/comments` `{ "text": "..." }`

Where to wire:
- `src/Dashboard.jsx`: fetch `GET /feed`; render posts; pass `post.media` into the lightbox when a tile is clicked.
- `src/Game.jsx`: fetch `GET /games/:gameKey/feed`; same rendering and lightbox behavior.

Temporary media: until backend provides real `media` URLs, we use a placeholder `strongman.png` from assets.

---

## 5) Explore (Games + People)

Games:
- See `src/games.js` for the `GAMES` mapping used across the app.
- If you have a source, `GET /games` can replace that mapping and be consumed by `Explore.jsx`.

People:
- Replace demo users with:
  - `GET /users?role=pilot`
  - `GET /users?role=coach`
```json
{ "id": "user-id", "name": "string", "handle": "@string", "avatarUrl": "https://..." }
```
Clicking a person calls `onOpenUser(user)` in `Explore.jsx`, which sets `selectedUser` in `App.jsx` and routes to `profile` (other variant).

---

## 6) Profile (self vs other)

File: `src/Profile.jsx`

Variants:
- Self (`variant="self"`) – shows Edit Profile.
- Other (`variant="other"`) – shows Message button.

Endpoints:
- `GET /users/me` (self profile)
- `GET /users/:id` (other user)
- `GET /users/:id/posts?cursor=...` → list of posts (same shape as feed)
- `PATCH /users/me` `{ name, bio, avatarUrl }` (optional for edit)

Wire posts and click images to open lightbox with the array `post.media`.
“Message” should either create or open a conversation, then route to Chat.

---

## 7) Chat (conversations + messages)

File: `src/Chat.jsx`

Suggested contract:
- Conversations: `GET /conversations`
```json
[ { "id": "c1", "user": { "id": "u2", "name": "Jane", "avatarUrl": "..." }, "lastMessage": "..." } ]
```
- Messages: `GET /conversations/:id/messages?cursor=...`
```json
[ { "id": "m1", "from": "me" | "them", "text": "string", "createdAt": "ISO" } ]
```
- Send: `POST /conversations/:id/messages` `{ "text": "..." }`

Open from other profile:
- `Profile.jsx` → “Message” triggers `onOpenChat(user)` in `App` or creates/fetches a conversation, then `authedPage='chat'`.

---

## 8) Images & Lightbox overlay

File: `src/Lightbox.jsx`
- Controlled by `App.jsx` via `openLightbox(images, index, title)` and `closeLightbox()`.
- On-screen arrows for prev/next (wrap-around), and keyboard shortcuts:
  - `←` previous, `→` next, `Esc` close.
- Pass real CDN URLs in `post.media` once backend provides them.

Where the lightbox is called:
- `Dashboard.jsx`, `Game.jsx`, `Profile.jsx` – post image tiles are `button` elements that call `openLightbox([...], startIndex, title)`.

---

## 9) Config, env and example API client

Environment:
- Add `.env` → `VITE_API_BASE_URL=https://api.example.com`
- Access via `import.meta.env.VITE_API_BASE_URL`

Suggested client (`src/api.js`):
```js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function api(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(API_BASE_URL + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include', // if you need cookies
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  try { return await res.json(); } catch { return null; }
}

export const AuthAPI = {
  register: (payload) => api('/auth/register', { method: 'POST', body: payload }),
  login: (email, password) => api('/auth/login', { method: 'POST', body: { email, password } }),
  me: (token) => api('/users/me', { token }),
};

export const FeedAPI = {
  home: (cursor, token) => api(`/feed${cursor ? `?cursor=${cursor}` : ''}`, { token }),
  game: (gameKey, cursor, token) => api(`/games/${gameKey}/feed${cursor ? `?cursor=${cursor}` : ''}`, { token }),
  like: (postId, token) => api(`/posts/${postId}/like`, { method: 'POST', token }),
  comment: (postId, text, token) => api(`/posts/${postId}/comments`, { method: 'POST', body: { text }, token }),
};

export const UsersAPI = {
  list: (role, token) => api(`/users?role=${role}`, { token }),
  get: (id, token) => api(`/users/${id}`, { token }),
  posts: (id, cursor, token) => api(`/users/${id}/posts${cursor ? `?cursor=${cursor}` : ''}`, { token }),
};

export const ChatAPI = {
  conversations: (token) => api('/conversations', { token }),
  messages: (id, cursor, token) => api(`/conversations/${id}/messages${cursor ? `?cursor=${cursor}` : ''}`, { token }),
  send: (id, text, token) => api(`/conversations/${id}/messages`, { method: 'POST', body: { text }, token }),
};
```

---

## 10) Data contracts (examples)

User
```json
{ "id": "user-id", "name": "string", "handle": "@string", "avatarUrl": "https://...", "bio": "string?" }
```

Post
```json
{
  "id": "post-id",
  "author": { "id": "user-id", "name": "string", "handle": "@string", "avatarUrl": "https://..." },
  "title": "string",
  "body": "string",
  "media": ["https://..."],
  "game": "valorant",
  "metrics": { "likes": 0, "comments": 0 },
  "createdAt": "ISO"
}
```

Conversation
```json
{ "id": "conversation-id", "user": { "id": "peer-id", "name": "string", "avatarUrl": "https://..." }, "lastMessage": "string", "updatedAt": "ISO" }
```

Message
```json
{ "id": "message-id", "from": "me" | "them", "text": "string", "createdAt": "ISO" }
```

---

## 11) Integration checklist (TL;DR)

1) Auth
   - `RegLogin.jsx` → hook `POST /auth/register`, `POST /auth/login` and store token
2) Feeds
   - `Dashboard.jsx` → `GET /feed`
   - `Game.jsx` → `GET /games/:gameKey/feed`
3) Explore
   - `GET /users?role=pilot` and `GET /users?role=coach`
4) Profile
   - `GET /users/:id` and `GET /users/:id/posts`
   - “Message” → ensure conversation exists, route to Chat
5) Chat
   - `GET /conversations`, `GET /conversations/:id/messages`, `POST /conversations/:id/messages`
6) Media
   - Replace placeholder `strongman.png` with `post.media` URLs
7) Lightbox
   - Already wired; pass `media` arrays into click handlers

If anything in your backend differs (endpoint names, auth method, pagination), share the contract and I’ll align the calls and types to match exactly.***


////////////////////////////////////////////////
Admin Flow & Recent Changes

Date: 2026‑01‑09

## How to reach the Admin page

- There is no separate “Admin” button in the UI anymore.  
- Log in from the standard Login modal using:
  - **Email:** `admin@gmail.com`  
  - **Password:** `Admin123`
- On successful admin login we set `adminAuthed=true` in `localStorage` and route to `#/admin`.
- “Sign out” on the Admin page clears `adminAuthed` and returns to Home.
- Direct links:
  - `#/admin` (opens Admin if `adminAuthed` is true, otherwise shows Admin Login)
  - `#/admin-login` (Admin login screen)

## Files changed/added

- `src/RegLogin.jsx`  
  - Added email/password state and admin credential check.  
  - New prop: `onAdminLogin()` called when creds match `admin@gmail.com` / `Admin123`.

- `src/App.jsx`  
  - Removed public “Admin” header button.  
  - Wires `onAdminLogin` to set `adminAuthed` and route to `#/admin`.  
  - Adds simple hash routing for `#/admin` and `#/admin-login`.  
  - Prioritizes rendering of Admin/AdminLogin even when not user‑authed.  
  - Keeps normal user login flow unchanged.

- `src/Dashboard.jsx`  
  - Removed “Admin” item from the left sidebar (Home/Explore only).

- `src/Admin.jsx` & `src/Admin.css` (new)  
  - Admin tables: Users (ban/unban), Posts (delete), Games (add/delete).  
  - Data persisted in `localStorage` under key `adminData`.  
  - Includes “Back” and “Sign out” controls.

- `src/AdminLogin.jsx` (new)  
  - Minimal Admin login screen used when navigating to `#/admin-login`.

- `src/ImageOverlay.jsx` & `src/ImageOverlay.css` (new)  
  - Reusable image lightbox overlay (Esc/click outside to close).

- `src/Dashboard.css`  
  - Media `<img>` fit/rounding improvements for post tiles.

- `src/Dashboard.jsx`, `src/Profile.jsx`, `src/Game.jsx`  
  - Post images open the shared lightbox.

## Test steps

1. Open the site, click “Login” and use admin credentials above.  
2. You should be routed to `#/admin` automatically.  
3. Try banning/unbanning a user, deleting a post, adding a game. Refresh to confirm persistence.  
4. Click “Sign out” on Admin header → returns to Home and clears admin session.