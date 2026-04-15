import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  if (!user) return null;

  const childLinks = [
    { to: '/feed',    icon: '🏠', label: 'Home'    },
    { to: '/friends', icon: '👫', label: 'Friends' },
    { to: '/chat',    icon: '💬', label: 'Chat'    },
    { to: '/studio',  icon: '🎨', label: 'Studio'  },
    { to: '/profile', icon: '🦊', label: 'Profile' },
  ];

  const parentLinks = [
    { to: '/parent',         icon: '🏠', label: 'Dashboard' },
    { to: '/parent/profile', icon: '👤', label: 'My Profile' },
  ];

  const adminLinks = [
    { to: '/admin',   icon: '🛡️', label: 'Admin'   },
    { to: '/profile', icon: '👤', label: 'Profile'  },
  ];

  const links = user.role === 'parent' ? parentLinks
              : user.role === 'admin'  ? adminLinks
              : childLinks;

  return (
    <>
      {/* Top navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-logo">Kindr 🌈</div>

          <div className="navbar-links">
            {links.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{l.icon}</span>
                <span>{l.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="navbar-right">
            <div
              className="navbar-avatar"
              style={{ background: user.avatar_color || '#E5F5FF' }}
              title={user.display_name}
            >
              {user.avatar_emoji || (user.role === 'parent' ? '👨' : '🦊')}
            </div>
            <button className="logout-btn" onClick={handleLogout}>Sign out</button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `mobile-nav-btn ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{l.icon}</span>
              <span>{l.label}</span>
            </NavLink>
          ))}
          {user.role === 'parent' && (
            <button className="mobile-nav-btn" onClick={handleLogout}>
              <span className="nav-icon">🚪</span>
              <span>Sign out</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}