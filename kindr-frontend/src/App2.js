// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Navbar          from './components/common/Navbar';
import Login           from './pages/Login';
import Register        from './pages/Register';
import Feed            from './pages/Feed';
import Friends         from './pages/Friends';
import Profile         from './pages/Profile';
import ParentDashboard from './pages/ParentDashboard';

import './index.css';

// ── Route guards ──────────────────────────────────────
function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <span className="spinner spinner-lg" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'parent' ? '/parent' : '/feed'} replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={user.role === 'parent' ? '/parent' : '/feed'} replace />;
  return children;
}

// ── App shell ─────────────────────────────────────────
function AppShell() {
  const { user } = useAuth();
  return (
    <>
      {user && <Navbar />}
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<PublicRoute><Login    /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Child routes */}
        <Route path="/feed"    element={<PrivateRoute role="child"><Feed    /></PrivateRoute>} />
        <Route path="/friends" element={<PrivateRoute role="child"><Friends /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute role="child"><Profile /></PrivateRoute>} />

        {/* Parent routes */}
        <Route path="/parent"          element={<PrivateRoute role="parent"><ParentDashboard /></PrivateRoute>} />
        <Route path="/parent/children" element={<PrivateRoute role="parent"><ParentDashboard /></PrivateRoute>} />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppShell />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: "'Quicksand', sans-serif",
                fontWeight: 600,
                borderRadius: 14,
                fontSize: 14,
              },
              success: { iconTheme: { primary: '#6BCB77', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#FF6B6B', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
