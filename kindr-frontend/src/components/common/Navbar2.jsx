// src/components/common/Navbar.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out! See you soon 👋');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="nav-inner">
        {/* Logo */}
        <Link to={user ? (user.role === 'parent' ? '/parent' : '/feed') : '/'} className="logo">
          <span className="logo-k">K</span>indr
          <span className="logo-dot" />
        </Link>

        {/* Desktop nav links */}
        {user && (
          <ul className="nav-links">
            {user.role === 'child' && (
              <>
                <li><Link to="/feed"    className={isActive('/feed')    ? 'active' : ''}>🏠 Feed</Link></li>
                <li><Link to="/friends" className={isActive('/friends') ? 'active' : ''}>👥 Friends</Link></li>
                <li><Link to="/profile" className={isActive('/profile') ? 'active' : ''}>🦊 Profile</Link></li>
              </>
            )}
            {user.role === 'parent' && (
              <>
                <li><Link to="/parent"          className={isActive('/parent')          ? 'active' : ''}>📊 Dashboard</Link></li>
                <li><Link to="/parent/children" className={isActive('/parent/children') ? 'active' : ''}>👧 Children</Link></li>
              </>
            )}
          </ul>
        )}

        <div className="nav-right">
          {/* Theme toggle */}
          <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
            <span className="t-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
          </button>

          {user ? (
            <div className="user-menu" onClick={() => setDropOpen(o => !o)}>
              <div className="avatar avatar-sm nav-avatar" style={{ background: user.avatar_color || '#FFE5E5' }}>
                {user.avatar_emoji || '🦊'}
              </div>
              <span className="nav-username hide-mobile">{user.display_name}</span>
              <span className="chevron">▾</span>
              {dropOpen && (
                <div className="dropdown">
                  <div className="drop-user">
                    <div className="avatar avatar-md" style={{ background: user.avatar_color || '#FFE5E5' }}>
                      {user.avatar_emoji || '🦊'}
                    </div>
                    <div>
                      <div className="drop-name">{user.display_name}</div>
                      <div className="drop-role">{user.role} account</div>
                    </div>
                  </div>
                  <div className="drop-divider" />
                  {user.role === 'child' && (
                    <Link to="/profile" className="drop-item" onClick={() => setDropOpen(false)}>
                      🦊 My Profile
                    </Link>
                  )}
                  <button className="drop-item danger" onClick={handleLogout}>
                    🚪 Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="nav-auth">
              <Link to="/login"    className="btn btn-ghost btn-sm">Log In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Join Free</Link>
            </div>
          )}

          {/* Hamburger */}
          <button className={`hamburger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(o => !o)}>
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-menu">
          {user ? (
            <>
              {user.role === 'child' && (
                <>
                  <Link to="/feed"    onClick={() => setMenuOpen(false)}>🏠 Feed</Link>
                  <Link to="/friends" onClick={() => setMenuOpen(false)}>👥 Friends</Link>
                  <Link to="/profile" onClick={() => setMenuOpen(false)}>🦊 Profile</Link>
                </>
              )}
              {user.role === 'parent' && (
                <>
                  <Link to="/parent"          onClick={() => setMenuOpen(false)}>📊 Dashboard</Link>
                  <Link to="/parent/children" onClick={() => setMenuOpen(false)}>👧 Children</Link>
                </>
              )}
              <button className="mobile-logout" onClick={handleLogout}>🚪 Log Out</button>
            </>
          ) : (
            <>
              <Link to="/login"    onClick={() => setMenuOpen(false)}>Log In</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}>Join Free</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
