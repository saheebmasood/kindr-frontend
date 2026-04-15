// src/pages/Friends.jsx — Friends + Requests + Notifications (Instagram style)
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Friends.css';

// ── Notification icon map ─────────────────────────────
const NOTIF_ICON = {
  message:         '💬',
  post_like:       '❤️',
  creation_like:   '🎨',
  friend_request:  '👫',
  friend_accepted: '🎉',
  system:          '📢',
};

// ── Time ago ──────────────────────────────────────────
const timeAgo = (d) => {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ══════════════════════════════════════════════════════
// TAB: MY FRIENDS
// ══════════════════════════════════════════════════════
function FriendsTab({ friends, loading, onRemove, onChat }) {
  const [search, setSearch] = useState('');
  const filtered = friends.filter(f =>
    f.display_name.toLowerCase().includes(search.toLowerCase()) ||
    f.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fr-tab-content">
      <div className="fr-search-wrap">
        <input
          className="fr-search"
          placeholder="🔍 Search friends..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="fr-loading"><span className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">👫</div>
          <h3>{search ? 'No results' : 'No friends yet!'}</h3>
          <p>{search ? 'Try a different name' : 'Send a friend request to get started'}</p>
        </div>
      ) : filtered.map(f => (
        <div key={f.id} className="fr-card">
          <div className="avatar avatar-md" style={{ background: f.avatar_color || '#FFE5E5' }}>
            {f.avatar_emoji || '🦊'}
          </div>
          <div className="fr-info">
            <div className="fr-name">{f.display_name}</div>
            <div className="fr-meta">@{f.username} · ⭐ {f.kindness_pts || 0} pts</div>
          </div>
          <div className="fr-actions">
            <button className="btn btn-primary btn-sm" onClick={() => onChat(f.id)}>
              💬 Chat
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => onRemove(f.id, f.display_name)}>
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// TAB: REQUESTS
// ══════════════════════════════════════════════════════
function RequestsTab({ incoming, outgoing, loading, onRespond, onSend }) {
  const [username, setUsername] = useState('');
  const [sending,  setSending]  = useState(false);

  const handleSend = async () => {
    if (!username.trim()) return;
    setSending(true);
    try {
      await onSend(username.trim());
      setUsername('');
    } finally { setSending(false); }
  };

  return (
    <div className="fr-tab-content">

      {/* Send request */}
      <div className="fr-send-card card">
        <div className="fr-send-title">➕ Add a Friend</div>
        <div className="fr-send-row">
          <input
            className="fr-search"
            placeholder="Enter username..."
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button className="btn btn-primary btn-sm" onClick={handleSend} disabled={sending || !username.trim()}>
            {sending ? <span className="spinner" /> : 'Send'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="fr-loading"><span className="spinner" /></div>
      ) : (
        <>
          {/* Incoming */}
          {incoming.length > 0 && (
            <div className="fr-section">
              <div className="fr-section-title">📥 Incoming ({incoming.length})</div>
              {incoming.map(r => (
                <div key={r.id} className="fr-card">
                  <div className="avatar avatar-md" style={{ background: '#FFE5E5' }}>
                    {r.avatar_emoji || '🦊'}
                  </div>
                  <div className="fr-info">
                    <div className="fr-name">{r.display_name}</div>
                    <div className="fr-meta">@{r.username} · {timeAgo(r.created_at)}</div>
                    {r.parent_status === 'pending' && (
                      <div className="fr-waiting">⏳ Waiting for parent approval</div>
                    )}
                    {r.message && <div className="fr-message">"{r.message}"</div>}
                  </div>
                  {r.parent_status !== 'pending' && (
                    <div className="fr-actions">
                      <button className="btn btn-primary btn-sm"
                              onClick={() => onRespond(r.id, 'accept')}>✅ Accept</button>
                      <button className="btn btn-ghost btn-sm"
                              onClick={() => onRespond(r.id, 'decline')}>❌ Decline</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Outgoing */}
          {outgoing.length > 0 && (
            <div className="fr-section">
              <div className="fr-section-title">📤 Sent ({outgoing.length})</div>
              {outgoing.map(r => (
                <div key={r.id} className="fr-card">
                  <div className="avatar avatar-md" style={{ background: '#E5F5FF' }}>
                    {r.avatar_emoji || '🦊'}
                  </div>
                  <div className="fr-info">
                    <div className="fr-name">{r.display_name}</div>
                    <div className="fr-meta">@{r.username} · {timeAgo(r.created_at)}</div>
                  </div>
                  <span className={`fr-status-badge ${r.status}`}>
                    {r.status === 'pending' ? '⏳ Pending'
                   : r.status === 'accepted' ? '✅ Accepted'
                   : '❌ Declined'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {incoming.length === 0 && outgoing.length === 0 && (
            <div className="empty-state">
              <div className="icon">📬</div>
              <h3>No requests</h3>
              <p>Add a friend using their username above!</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// TAB: NOTIFICATIONS
// ══════════════════════════════════════════════════════
function NotificationsTab({ notifications, unreadCount, loading, onRead, onReadAll, onDelete, onNavigate }) {
  return (
    <div className="fr-tab-content">
      {unreadCount > 0 && (
        <div className="fr-notif-header">
          <span className="fr-unread-label">{unreadCount} unread</span>
          <button className="fr-read-all-btn" onClick={onReadAll}>Mark all read</button>
        </div>
      )}

      {loading ? (
        <div className="fr-loading"><span className="spinner" /></div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🔔</div>
          <h3>All caught up!</h3>
          <p>No notifications yet.</p>
        </div>
      ) : notifications.map(n => (
        <div
          key={n.id}
          className={`fr-notif-row ${!n.is_read ? 'unread' : ''}`}
          onClick={() => {
            if (!n.is_read) onRead(n.id);
            if (n.link) onNavigate(n.link);
          }}
        >
          <div className="fr-notif-icon-wrap">
            <div className="avatar avatar-sm"
                 style={{ background: n.actor_color || '#FFE5E5' }}>
              {n.actor_emoji || NOTIF_ICON[n.type] || '🔔'}
            </div>
            <span className="fr-notif-type-icon">{NOTIF_ICON[n.type]}</span>
          </div>
          <div className="fr-notif-body">
            <div className="fr-notif-title">{n.title}</div>
            <div className="fr-notif-text">{n.body}</div>
            <div className="fr-notif-time">{timeAgo(n.created_at)}</div>
          </div>
          {!n.is_read && <div className="fr-notif-dot" />}
          <button
            className="fr-notif-del"
            onClick={e => { e.stopPropagation(); onDelete(n.id); }}
          >✕</button>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════
export default function Friends() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [tab,      setTab]      = useState('friends');
  const [friends,  setFriends]  = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [notifs,   setNotifs]   = useState([]);
  const [unread,   setUnread]   = useState(0);
  const [loading,  setLoading]  = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [frRes, reqRes, notifRes] = await Promise.allSettled([
        api.get('/friends'),
        api.get('/friends/requests'),
        api.get('/notifications'),
      ]);
      if (frRes.status    === 'fulfilled') setFriends(frRes.value.data.data.friends || []);
      if (reqRes.status   === 'fulfilled') {
        setIncoming(reqRes.value.data.data.incoming || []);
        setOutgoing(reqRes.value.data.data.outgoing || []);
      }
      if (notifRes.status === 'fulfilled') {
        setNotifs(notifRes.value.data.data.notifications || []);
        setUnread(notifRes.value.data.data.unread_count   || 0);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Poll notifications every 15s
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const { data } = await api.get('/notifications');
        setNotifs(data.data.notifications || []);
        setUnread(data.data.unread_count   || 0);
      } catch {}
    }, 15000);
    return () => clearInterval(t);
  }, []);

  const handleRemoveFriend = async (friendId, name) => {
    if (!window.confirm(`Remove ${name} as a friend?`)) return;
    try {
      await api.delete(`/friends/${friendId}`);
      setFriends(prev => prev.filter(f => f.id !== friendId));
      toast.success('Friend removed');
    } catch { toast.error('Could not remove friend'); }
  };

  const handleRespond = async (requestId, action) => {
    try {
      await api.post('/friends/respond', { request_id: requestId, action });
      toast.success(action === 'accept' ? '🎉 Friend accepted!' : 'Request declined');
      loadAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleSendRequest = async (username) => {
    try {
      await api.post('/friends/request', { to_username: username });
      toast.success('Friend request sent! 📬');
      loadAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not send request'); }
  };

  const handleReadNotif = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnread(u => Math.max(0, u - 1));
    } catch {}
  };

  const handleReadAll = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifs(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnread(0);
      toast.success('All notifications marked as read');
    } catch {}
  };

  const handleDeleteNotif = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifs(prev => prev.filter(n => n.id !== id));
    } catch {}
  };

  const pendingRequests  = incoming.filter(r => r.parent_status !== 'pending').length;
  const totalBadge = unread + pendingRequests;

  return (
    <div className="fr-page page-enter">
      <div className="fr-inner">

        {/* Header */}
        <div className="fr-header">
          <h1 className="fr-title">👫 Friends</h1>
          {totalBadge > 0 && <span className="fr-header-badge">{totalBadge}</span>}
        </div>

        {/* Tabs */}
        <div className="fr-tabs">
          <button
            className={`fr-tab ${tab === 'friends' ? 'active' : ''}`}
            onClick={() => setTab('friends')}
          >
            👫 Friends
            {friends.length > 0 && <span className="fr-tab-count">{friends.length}</span>}
          </button>
          <button
            className={`fr-tab ${tab === 'requests' ? 'active' : ''}`}
            onClick={() => setTab('requests')}
          >
            📬 Requests
            {pendingRequests > 0 && <span className="fr-tab-badge">{pendingRequests}</span>}
          </button>
          <button
            className={`fr-tab ${tab === 'notifications' ? 'active' : ''}`}
            onClick={() => setTab('notifications')}
          >
            🔔 Activity
            {unread > 0 && <span className="fr-tab-badge">{unread}</span>}
          </button>
        </div>

        {/* Tab content */}
        {tab === 'friends' && (
          <FriendsTab
            friends={friends}
            loading={loading}
            onRemove={handleRemoveFriend}
            onChat={id => navigate(`/chat/${id}`)}
          />
        )}
        {tab === 'requests' && (
          <RequestsTab
            incoming={incoming}
            outgoing={outgoing}
            loading={loading}
            onRespond={handleRespond}
            onSend={handleSendRequest}
          />
        )}
        {tab === 'notifications' && (
          <NotificationsTab
            notifications={notifs}
            unreadCount={unread}
            loading={loading}
            onRead={handleReadNotif}
            onReadAll={handleReadAll}
            onDelete={handleDeleteNotif}
            onNavigate={navigate}
          />
        )}
      </div>
    </div>
  );
}