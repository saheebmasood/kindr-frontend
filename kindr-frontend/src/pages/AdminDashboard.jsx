// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

// ── Stat Card ─────────────────────────────────────────
function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="adm-stat" style={{ '--accent': color }}>
      <div className="adm-stat-icon">{icon}</div>
      <div className="adm-stat-val">{value ?? <span className="adm-loading">...</span>}</div>
      <div className="adm-stat-label">{label}</div>
      {sub && <div className="adm-stat-sub">{sub}</div>}
    </div>
  );
}

// ── Role Badge ────────────────────────────────────────
function RoleBadge({ role }) {
  const map = {
    admin:  { cls: 'adm-badge-admin',  label: '🛡️ Admin'  },
    parent: { cls: 'adm-badge-parent', label: '👨 Parent' },
    child:  { cls: 'adm-badge-child',  label: '🧒 Child'  },
  };
  const r = map[role] || { cls: '', label: role };
  return <span className={`adm-badge ${r.cls}`}>{r.label}</span>;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [tab,     setTab]     = useState('overview');
  const [users,   setUsers]   = useState([]);
  const [posts,   setPosts]   = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // ── Load all data ──────────────────────────────────
  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [uRes, pRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/posts'),
      ]);
      setUsers(uRes.data.data.users);
      setPosts(pRes.data.data.posts);

      // Compute stats from data
      const u = uRes.data.data.users;
      const p = pRes.data.data.posts;
      setStats({
        totalUsers:    u.length,
        children:      u.filter(x => x.role === 'child').length,
        parents:       u.filter(x => x.role === 'parent').length,
        totalPosts:    p.length,
        flagged:       p.filter(x => !x.is_approved).length,
        activeToday:   u.filter(x => x.last_login && new Date(x.last_login) > new Date(Date.now() - 86400000)).length,
      });
    } catch (err) {
      toast.error('Could not load admin data');
    } finally {
      setLoading(false);
    }
  };

  // ── Actions ────────────────────────────────────────
  const toggleUserActive = async (userId, isActive) => {
    try {
      await api.patch(`/admin/users/${userId}`, { is_active: !isActive });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !isActive } : u));
      toast.success(isActive ? '🔒 User deactivated' : '✅ User activated');
    } catch { toast.error('Could not update user'); }
  };

  const deleteUser = async (userId, username) => {
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('User deleted');
    } catch { toast.error('Could not delete user'); }
  };

  const approvePost = async (postId) => {
    try {
      await api.patch(`/admin/posts/${postId}`, { is_approved: true });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_approved: true } : p));
      toast.success('Post approved ✅');
    } catch { toast.error('Could not approve post'); }
  };

  const deletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success('Post deleted');
    } catch { toast.error('Could not delete post'); }
  };

  // ── Filters ────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    const matchSearch = u.username.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase()) ||
                        u.display_name?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const flaggedPosts = posts.filter(p => !p.is_approved);
  const recentPosts  = [...posts].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 20);

  const timeAgo = (d) => {
    const m = Math.floor((Date.now() - new Date(d)) / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h/24)}d ago`;
  };

  // ── Render ─────────────────────────────────────────
  return (
    <div className="adm-page page-enter">

      {/* ── Sidebar ── */}
      <aside className="adm-sidebar">
        <div className="adm-logo">
          <span className="adm-logo-k">K</span>indr
          <span className="adm-logo-tag">Admin</span>
        </div>

        <nav className="adm-nav">
          {[
            { id: 'overview', icon: '📊', label: 'Overview'   },
            { id: 'users',    icon: '👥', label: 'Users'      },
            { id: 'posts',    icon: '📝', label: 'Posts'      },
            { id: 'flagged',  icon: '🚩', label: 'Flagged', badge: flaggedPosts.length },
          ].map(item => (
            <button
              key={item.id}
              className={`adm-nav-btn ${tab === item.id ? 'active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              <span className="adm-nav-icon">{item.icon}</span>
              <span className="adm-nav-label">{item.label}</span>
              {item.badge > 0 && <span className="adm-nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="adm-sidebar-footer">
          <div className="adm-admin-user">
            <div className="adm-avatar">🛡️</div>
            <div>
              <div className="adm-admin-name">{user?.display_name}</div>
              <div className="adm-admin-role">Administrator</div>
            </div>
          </div>
          <button className="adm-logout" onClick={logout}>🚪 Logout</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="adm-main">

        {/* Header */}
        <div className="adm-header">
          <div>
            <h1 className="adm-title">
              {tab === 'overview' && '📊 Overview'}
              {tab === 'users'    && '👥 All Users'}
              {tab === 'posts'    && '📝 All Posts'}
              {tab === 'flagged'  && '🚩 Flagged Content'}
            </h1>
            <p className="adm-subtitle">
              {new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </p>
          </div>
          <button className="adm-refresh" onClick={loadAll}>🔄 Refresh</button>
        </div>

        {loading ? (
          <div className="adm-loading-full">
            <span className="spinner spinner-lg" />
            <p>Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* ── OVERVIEW TAB ── */}
            {tab === 'overview' && (
              <div className="adm-overview">
                <div className="adm-stats-grid">
                  <StatCard icon="👥" label="Total Users"    value={stats?.totalUsers}  color="#4ECDC4" />
                  <StatCard icon="🧒" label="Children"       value={stats?.children}    color="#FFB347" />
                  <StatCard icon="👨" label="Parents"        value={stats?.parents}     color="#6BCB77" />
                  <StatCard icon="📝" label="Total Posts"    value={stats?.totalPosts}  color="#C084FC" />
                  <StatCard icon="🚩" label="Flagged Posts"  value={stats?.flagged}     color="#FF6B6B" />
                  <StatCard icon="⚡" label="Active Today"   value={stats?.activeToday} color="#FFE66D" />
                </div>

                {/* Recent users */}
                <div className="adm-card">
                  <div className="adm-card-title">👤 Recent Registrations</div>
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>User</th><th>Role</th><th>Email</th><th>Joined</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...users].sort((a,b) => new Date(b.created_at)-new Date(a.created_at)).slice(0,5).map(u => (
                        <tr key={u.id}>
                          <td>
                            <div className="adm-user-cell">
                              <div className="adm-avatar-sm" style={{background: u.avatar_color||'#FFE5E5'}}>
                                {u.avatar_emoji||'🦊'}
                              </div>
                              <div>
                                <div className="adm-uname">{u.display_name}</div>
                                <div className="adm-umeta">@{u.username}</div>
                              </div>
                            </div>
                          </td>
                          <td><RoleBadge role={u.role} /></td>
                          <td className="adm-email">{u.email}</td>
                          <td className="adm-time">{timeAgo(u.created_at)}</td>
                          <td>
                            <span className={`adm-badge ${u.is_active ? 'adm-badge-green' : 'adm-badge-red'}`}>
                              {u.is_active ? '✅ Active' : '🔒 Banned'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Recent posts */}
                <div className="adm-card">
                  <div className="adm-card-title">📝 Recent Posts</div>
                  <table className="adm-table">
                    <thead>
                      <tr><th>Author</th><th>Content</th><th>Posted</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {recentPosts.slice(0,5).map(p => (
                        <tr key={p.id}>
                          <td className="adm-uname">{p.display_name || p.username}</td>
                          <td className="adm-content-cell">{p.content?.slice(0,60) || '📷 Image post'}{p.content?.length > 60 ? '...' : ''}</td>
                          <td className="adm-time">{timeAgo(p.created_at)}</td>
                          <td>
                            <span className={`adm-badge ${p.is_approved ? 'adm-badge-green' : 'adm-badge-red'}`}>
                              {p.is_approved ? '✅ Approved' : '⏳ Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── USERS TAB ── */}
            {tab === 'users' && (
              <div className="adm-users">
                <div className="adm-toolbar">
                  <input
                    className="input adm-search"
                    placeholder="🔍 Search by name, username, email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  <div className="adm-role-filter">
                    {['all','child','parent','admin'].map(r => (
                      <button
                        key={r}
                        className={`adm-filter-btn ${roleFilter === r ? 'active' : ''}`}
                        onClick={() => setRoleFilter(r)}
                      >
                        {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="adm-card">
                  <table className="adm-table">
                    <thead>
                      <tr><th>User</th><th>Role</th><th>Email</th><th>Joined</th><th>Last Login</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u.id}>
                          <td>
                            <div className="adm-user-cell">
                              <div className="adm-avatar-sm" style={{background: u.avatar_color||'#FFE5E5'}}>
                                {u.avatar_emoji||'🦊'}
                              </div>
                              <div>
                                <div className="adm-uname">{u.display_name}</div>
                                <div className="adm-umeta">@{u.username} · #{u.id}</div>
                              </div>
                            </div>
                          </td>
                          <td><RoleBadge role={u.role} /></td>
                          <td className="adm-email">{u.email}</td>
                          <td className="adm-time">{timeAgo(u.created_at)}</td>
                          <td className="adm-time">{u.last_login ? timeAgo(u.last_login) : 'Never'}</td>
                          <td>
                            <span className={`adm-badge ${u.is_active ? 'adm-badge-green' : 'adm-badge-red'}`}>
                              {u.is_active ? '✅ Active' : '🔒 Banned'}
                            </span>
                          </td>
                          <td>
                            <div className="adm-actions">
                              {u.role !== 'admin' && (
                                <>
                                  <button
                                    className={`adm-action-btn ${u.is_active ? 'warn' : 'success'}`}
                                    onClick={() => toggleUserActive(u.id, u.is_active)}
                                    title={u.is_active ? 'Deactivate' : 'Activate'}
                                  >
                                    {u.is_active ? '🔒' : '✅'}
                                  </button>
                                  <button
                                    className="adm-action-btn danger"
                                    onClick={() => deleteUser(u.id, u.username)}
                                    title="Delete user"
                                  >
                                    🗑️
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <div className="empty-state" style={{padding:40}}>
                      <div className="icon">🔍</div>
                      <h3>No users found</h3>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── POSTS TAB ── */}
            {tab === 'posts' && (
              <div className="adm-card">
                <table className="adm-table">
                  <thead>
                    <tr><th>Author</th><th>Content</th><th>Image</th><th>Posted</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {recentPosts.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div className="adm-uname">{p.display_name}</div>
                          <div className="adm-umeta">@{p.username}</div>
                        </td>
                        <td className="adm-content-cell">
                          {p.content?.slice(0,80) || '—'}{p.content?.length > 80 ? '...' : ''}
                        </td>
                        <td>{p.image_url ? '📷' : '—'}</td>
                        <td className="adm-time">{timeAgo(p.created_at)}</td>
                        <td>
                          <span className={`adm-badge ${p.is_approved ? 'adm-badge-green' : 'adm-badge-red'}`}>
                            {p.is_approved ? '✅ Approved' : '⏳ Pending'}
                          </span>
                        </td>
                        <td>
                          <div className="adm-actions">
                            {!p.is_approved && (
                              <button className="adm-action-btn success" onClick={() => approvePost(p.id)} title="Approve">✅</button>
                            )}
                            <button className="adm-action-btn danger" onClick={() => deletePost(p.id)} title="Delete">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── FLAGGED TAB ── */}
            {tab === 'flagged' && (
              flaggedPosts.length === 0 ? (
                <div className="empty-state">
                  <div className="icon">✅</div>
                  <h3>No flagged content!</h3>
                  <p>All posts are approved. Great moderation!</p>
                </div>
              ) : (
                <div className="adm-flagged-list">
                  {flaggedPosts.map(p => (
                    <div key={p.id} className="adm-flagged-card adm-card">
                      <div className="adm-flagged-head">
                        <div className="adm-user-cell">
                          <div className="adm-avatar-sm" style={{background:'#FFE5E5'}}>🦊</div>
                          <div>
                            <div className="adm-uname">{p.display_name}</div>
                            <div className="adm-umeta">@{p.username} · {timeAgo(p.created_at)}</div>
                          </div>
                        </div>
                        <span className="adm-badge adm-badge-red">⏳ Pending Review</span>
                      </div>
                      {p.content && <p className="adm-flagged-content">{p.content}</p>}
                      {p.image_url && (
                        <div className="adm-flagged-img">
                          <img
                            src={`${process.env.REACT_APP_API_URL?.replace('/api','')||'http://localhost:5000'}${p.image_url}`}
                            alt="flagged"
                          />
                        </div>
                      )}
                      <div className="adm-flagged-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => approvePost(p.id)}>✅ Approve</button>
                        <button className="btn btn-ghost btn-sm"   onClick={() => deletePost(p.id)}>🗑️ Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </main>
    </div>
  );
}
