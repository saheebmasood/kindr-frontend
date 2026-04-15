// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ChildMonitor from './pages/ChildMonitor';

import ParentProfile from './pages/ParentProfile';
import Navbar          from './components/common/Navbar';
import Login           from './pages/Login';
import Register        from './pages/Register';
import Feed            from './pages/Feed';
import Friends         from './pages/Friends';
import Profile         from './pages/Profile';
import Chat            from './pages/Chat';
import CreativeStudio  from './pages/CreativeStudio';
import ParentDashboard from './pages/ParentDashboard';
import AdminDashboard  from './pages/AdminDashboard';

import './index.css';

function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <span className="spinner spinner-lg" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    if (user.role === 'admin')  return <Navigate to="/admin"  replace />;
    if (user.role === 'parent') return <Navigate to="/parent" replace />;
    return <Navigate to="/feed" replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    if (user.role === 'admin')  return <Navigate to="/admin"  replace />;
    if (user.role === 'parent') return <Navigate to="/parent" replace />;
    return <Navigate to="/feed" replace />;
  }
  return children;
}

function AppShell() {
  const { user } = useAuth();
  const showNav  = user && user.role !== 'admin';

  return (
    <>
      {showNav && <Navbar />}
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<PublicRoute><Login    /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Child */}
        <Route path="/feed"           element={<PrivateRoute role="child"><Feed           /></PrivateRoute>} />
        <Route path="/friends"        element={<PrivateRoute role="child"><Friends        /></PrivateRoute>} />
        <Route path="/profile"        element={<PrivateRoute role="child"><Profile        /></PrivateRoute>} />
        <Route path="/chat"           element={<PrivateRoute role="child"><Chat           /></PrivateRoute>} />
        <Route path="/chat/:friendId" element={<PrivateRoute role="child"><Chat           /></PrivateRoute>} />
        <Route path="/studio"         element={<PrivateRoute role="child"><CreativeStudio /></PrivateRoute>} />

        {/* Parent */}
        <Route path="/parent"          element={<PrivateRoute role="parent"><ParentDashboard /></PrivateRoute>} />
        <Route path="/parent/children" element={<PrivateRoute role="parent"><ParentDashboard /></PrivateRoute>} />
        <Route path="/parent/profile" element={<PrivateRoute role="parent"><ParentProfile /></PrivateRoute>} />
        <Route path="/parent/monitor/:childId" element={<PrivateRoute role="parent"><ChildMonitor /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />

        {/* Root */}
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