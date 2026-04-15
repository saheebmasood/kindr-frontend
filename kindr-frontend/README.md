# 🎨 Kindr — Frontend (React)
> Complete React frontend for the Kindr children's social network

---

## 📁 Project Structure

```
kindr-frontend/
├── public/
│   └── index.html
├── src/
│   ├── index.js               # React entry point
│   ├── index.css              # Global styles + theme variables
│   ├── App.js                 # Routing + route guards
│   │
│   ├── context/
│   │   ├── AuthContext.js     # User auth state + login/logout
│   │   └── ThemeContext.js    # Dark/light theme toggle
│   │
│   ├── services/
│   │   └── api.js             # All API calls (axios) + auto token refresh
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.jsx     # Top nav with user menu + mobile hamburger
│   │   │   └── Navbar.css
│   │   └── kid/
│   │       ├── PostCard.jsx   # Post with emoji reactions
│   │       └── PostCard.css
│   │
│   └── pages/
│       ├── Login.jsx          # Login page
│       ├── Register.jsx       # 3-step registration (role → details → avatar)
│       ├── Auth.css           # Shared auth styles
│       ├── Feed.jsx           # Kid's post feed + compose box
│       ├── Feed.css
│       ├── Friends.jsx        # Friends list + requests + add friend
│       ├── Friends.css
│       ├── Profile.jsx        # Kid's own profile + posts
│       ├── Profile.css
│       ├── ParentDashboard.jsx  # Parent dashboard with controls
│       └── ParentDashboard.css
│
├── .env                       # API URL config
└── package.json
```

---

## ⚡ Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Make sure the backend is running
```bash
# In your kindr-backend folder:
npm run dev
# Backend should be at http://localhost:5000
```

### 3. Start the frontend
```bash
npm start
# Opens at http://localhost:3000
```

---

## 🗺️ Pages & Routes

| Route              | Role     | Description                        |
|--------------------|----------|------------------------------------|
| `/login`           | Public   | Login page                         |
| `/register`        | Public   | 3-step registration flow           |
| `/feed`            | Child    | Post feed + compose box            |
| `/friends`         | Child    | Friends list + send/respond to requests |
| `/profile`         | Child    | Own profile + all posts            |
| `/parent`          | Parent   | Full dashboard with child controls |

---

## 🎨 Features

**Auth Flow**
- 3-step registration: choose role → fill details → pick avatar
- JWT access + refresh tokens (auto-refresh on expiry)
- Protected routes for child/parent roles

**Kid Features**
- Feed with posts from friends
- Compose post with text + image upload
- Emoji reaction system (toggle reactions)
- Friends management (send/accept/decline requests)
- Profile page with all posts

**Parent Features**
- Link children by username
- Full dashboard per child (stats, activity, pending requests)
- Toggle-based parental controls (approve friends, voice messages, etc.)
- Screen time limit setting
- One-click approve/decline friend requests

**UI/UX**
- Dark / Light theme toggle (persisted to localStorage)
- Responsive — works on mobile, tablet, desktop
- Toast notifications for all actions
- Loading spinners + empty states
- Smooth page enter animations

---

## 🔗 Backend Connection

The frontend connects to the backend via the `REACT_APP_API_URL` env variable.

Default: `http://localhost:5000/api`

The `package.json` also has a `"proxy": "http://localhost:5000"` entry so relative API calls work during development.

---

## 🧩 Key Dependencies

| Package            | Purpose                          |
|--------------------|----------------------------------|
| react-router-dom   | Client-side routing              |
| axios              | HTTP requests + interceptors     |
| react-hot-toast    | Beautiful toast notifications    |
