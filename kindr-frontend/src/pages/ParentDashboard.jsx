// src/pages/ParentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { parentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './ParentDashboard.css';

function Toggle({ checked, onChange }) {
  return (
    <label className="sw">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="sw-slider" />
    </label>
  );
}

export default function ParentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [selected, setSelected] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [controls, setControls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [linkName, setLinkName] = useState('');
  const [linking, setLinking] = useState(false);

  const loadChildren = async () => {
    try {
      const { data } = await parentAPI.getChildren();
      setChildren(data.data.children);
      if (data.data.children.length && !selected) {
        setSelected(data.data.children[0]);
      }
    } catch { toast.error('Could not load children'); }
    finally { setLoading(false); }
  };

  const loadDashboard = async (childId) => {
    try {
      const { data } = await parentAPI.getDashboard(childId);
      setDashboard(data.data);
      setControls(data.data.parental_controls);
    } catch { toast.error('Could not load dashboard'); }
  };

  useEffect(() => { loadChildren(); }, []);
  useEffect(() => { if (selected?.id) loadDashboard(selected.id); }, [selected]);

  const handleLink = async (e) => {
    e.preventDefault();
    if (!linkName.trim()) return;
    setLinking(true);
    try {
      await parentAPI.linkChild(linkName.trim());
      toast.success('Link request sent! Ask your child to confirm.');
      setLinkName('');
      loadChildren();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not link'); }
    finally { setLinking(false); }
  };

  const updateControl = async (key, value) => {
    const updated = { ...controls, [key]: value };
    setControls(updated);
    try {
      await parentAPI.updateControls(selected.id, { [key]: value });
      toast.success('Setting updated ✓');
    } catch { toast.error('Could not update setting'); }
  };

  const approveFriend = async (requestId, action) => {
    try {
      await parentAPI.approveFriend(requestId, action);
      toast.success(action === 'approve' ? 'Friend approved! 🎉' : 'Request declined');
      loadDashboard(selected.id);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <span className="spinner spinner-lg" />
    </div>
  );

  return (
    <div className="parent-page page-enter">
      <div className="parent-inner">

        {/* Sidebar */}
        <aside className="parent-sidebar">
          <div className="sidebar-header">
            <div className="avatar avatar-md" style={{ background: user?.avatar_color || '#E5F5FF' }}>
              {user?.avatar_emoji || '👨'}
            </div>
            <div>
              <div className="sidebar-name">{user?.display_name}</div>
              <div className="sidebar-role">Parent Account</div>
            </div>
          </div>

          <div className="sidebar-section-title">Your Children</div>

          {children.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '0 4px' }}>No children linked yet</p>
          ) : (
            children.map(c => (
              <div key={c.id} className="child-btn-wrap">
                <button
                  className={`child-btn ${selected?.id === c.id ? 'active' : ''}`}
                  onClick={() => setSelected(c)}
                >
                  <div className="avatar avatar-sm" style={{ background: c.avatar_color || '#FFE5E5' }}>
                    {c.avatar_emoji || '🧒'}
                  </div>
                  <div>
                    <div className="child-btn-name">{c.display_name}</div>
                    <span className={`badge badge-${c.link_status === 'active' ? 'green' : 'amber'}`}
                      style={{ fontSize: 10 }}>
                      {c.link_status}
                    </span>
                  </div>
                </button>
                <button
                  className="btn btn-primary btn-sm monitor-btn"
                  onClick={() => navigate(`/parent/monitor/${c.id}`)}
                >
                  👁️ Monitor
                </button>
              </div>
            ))
          )}

          <div className="sidebar-divider" />
          <div className="sidebar-section-title">Link a Child</div>
          <form className="link-form" onSubmit={handleLink}>
            <input
              className="input"
              placeholder="Child's username"
              value={linkName}
              onChange={e => setLinkName(e.target.value)}
            />
            <button className="btn btn-primary btn-sm btn-full" type="submit" disabled={linking}>
              {linking ? <span className="spinner" /> : '+ Link Child'}
            </button>
          </form>
        </aside>

        {/* Main dashboard */}
        <main className="parent-main">
          {!selected ? (
            <div className="empty-state">
              <div className="icon">👨‍👧</div>
              <h3>Link a child to get started</h3>
              <p>Enter your child's username in the sidebar to link their account.</p>
            </div>
          ) : (
            <>
              <div className="dash-header">
                <div className="avatar avatar-lg" style={{ background: selected.avatar_color || '#FFE5E5' }}>
                  {selected.avatar_emoji || '🧒'}
                </div>
                <div>
                  <h2 className="dash-name">{selected.display_name}'s Dashboard</h2>
                  <p className="dash-sub">
                    @{selected.username} · Last login: {selected.last_login
                      ? new Date(selected.last_login).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => navigate(`/parent/monitor/${selected.id}`)}
                >
                  👁️ Monitor {selected.display_name}
                </button>
              </div>

              {/* Stats */}
              {dashboard && (
                <div className="stats-grid">
                  {[
                    { label: 'Posts This Week', val: dashboard.stats.posts_this_week, icon: '📝', color: 'var(--secondary)' },
                    { label: 'Total Friends', val: dashboard.stats.friend_count, icon: '👥', color: 'var(--green)' },
                    { label: 'Flagged Content', val: dashboard.stats.flagged_content, icon: '🚩',
                      color: dashboard.stats.flagged_content > 0 ? 'var(--primary)' : 'var(--green)' },
                    { label: 'Kindness Points', val: selected.kindness_pts || 0, icon: '⭐', color: 'var(--accent-dark)' },
                  ].map(s => (
                    <div key={s.label} className="stat-card card">
                      <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
                      <div className="stat-val">{s.val}</div>
                      <div className="stat-lbl">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="dash-grid">
                {/* REPLACED: Pending friend requests logic updated for incoming/outgoing */}
                {dashboard?.pending_friend_requests?.length > 0 && (
                  <div className="card dash-panel full-width">
                    <div className="panel-title">⏳ Pending Friend Requests</div>
                    {dashboard.pending_friend_requests.map(r => (
                      <div key={r.id} className="request-row">
                        <div className="avatar avatar-sm" style={{ background: '#FFE5E5' }}>
                          {r.direction === 'incoming' ? r.sender_emoji || '🦊' : r.receiver_emoji || '🦊'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="friend-name">
                            {r.direction === 'incoming'
                              ? `${r.sender_name} → ${selected.display_name}`
                              : `${selected.display_name} → ${r.receiver_name}`}
                          </div>
                          <div className="friend-meta">
                            {r.direction === 'incoming'
                              ? `${r.sender_username} wants to be friends with your child`
                              : `Your child wants to be friends with ${r.receiver_username}`}
                          </div>
                          {r.child_accepted === 1 && (
                            <div style={{ fontSize: 11, color: '#38A169', fontWeight: 700 }}>
                              ✅ Child already accepted — approve to complete friendship
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-primary btn-sm"
                            onClick={() => approveFriend(r.id, 'approve')}>✓ Approve</button>
                          <button className="btn btn-ghost btn-sm"
                            onClick={() => approveFriend(r.id, 'decline')}>✕ Decline</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Activity log */}
                <div className="card dash-panel">
                  <div className="panel-title">📋 Recent Activity</div>
                  {!dashboard?.recent_activity?.length ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, padding: 'var(--space-md)' }}>No activity yet</p>
                  ) : (
                    dashboard.recent_activity.map((a, i) => (
                      <div key={i} className="activity-row">
                        <div className="act-dot" />
                        <div>
                          <div className="act-action">{a.action.replace(/_/g, ' ')}</div>
                          <div className="act-desc">{a.description}</div>
                          <div className="act-time">{new Date(a.created_at).toLocaleString()}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Controls */}
                {controls && (
                  <div className="card dash-panel">
                    <div className="panel-title">🔧 Parental Controls</div>
                    {[
                      { key: 'approve_friends', label: 'Approve new friends', sub: 'You review every new connection' },
                      { key: 'allow_voice_messages', label: 'Allow voice messages', sub: 'Short clips to approved friends' },
                      { key: 'allow_public_clubs', label: 'Allow public clubs', sub: 'Moderated interest groups' },
                      { key: 'can_post_images', label: 'Allow image posts', sub: 'Photos and images in posts' },
                      { key: 'weekly_digest_email', label: 'Weekly digest email', sub: 'Summary sent to your email' },
                      { key: 'read_messages', label: 'Preview messages', sub: 'See outgoing messages (younger kids)' },
                    ].map(c => (
                      <div key={c.key} className="ctrl-row">
                        <div>
                          <div className="ctrl-label">{c.label}</div>
                          <div className="ctrl-sub">{c.sub}</div>
                        </div>
                        <Toggle checked={!!controls[c.key]} onChange={v => updateControl(c.key, v)} />
                      </div>
                    ))}

                    <div className="ctrl-row" style={{ marginTop: 8 }}>
                      <div>
                        <div className="ctrl-label">Daily screen time limit</div>
                        <div className="ctrl-sub">0 = unlimited</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="number"
                          className="input"
                          style={{ width: 80, textAlign: 'center' }}
                          value={controls.screen_time_limit_mins}
                          min={0} max={480}
                          onChange={e => updateControl('screen_time_limit_mins', parseInt(e.target.value))}
                        />
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>min</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}