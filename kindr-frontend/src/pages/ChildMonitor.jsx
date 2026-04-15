// src/pages/ChildMonitor.jsx
// Full child monitoring page for parents
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import './ChildMonitor.css';

const BASE_URL = process.env.REACT_APP_API_URL?.replace('/api','') || 'http://localhost:5000';

// ── Password Reset Modal ──────────────────────────────
function ResetPasswordModal({ child, onClose, onReset }) {
  const [newPw,    setNewPw]    = useState('');
  const [confirmPw,setConfirmPw]= useState('');
  const [saving,   setSaving]   = useState(false);
  const [showPw,   setShowPw]   = useState(false);

  const strength = newPw.length === 0 ? null
    : newPw.length < 8  ? 'weak'
    : newPw.length < 12 ? 'medium' : 'strong';

  const handleReset = async () => {
    if (newPw.length < 8)    { toast.error('Min 8 characters'); return; }
    if (newPw !== confirmPw)  { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await api.post(`/parent/child/${child.id}/reset-password`, { new_password: newPw });
      toast.success(`${child.display_name}'s password reset! 🔑`);
      onReset();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reset password');
    } finally { setSaving(false); }
  };

  return (
    <div className="cm-overlay" onClick={onClose}>
      <div className="cm-modal" onClick={e => e.stopPropagation()}>
        <div className="cm-modal-title">🔑 Reset {child.display_name}'s Password</div>
        <p className="cm-modal-sub">The child will need to use this new password to log in.</p>

        <div className="cm-field">
          <label className="cm-label">New Password</label>
          <div className="cm-pw-wrap">
            <input
              className="cm-input"
              type={showPw ? 'text' : 'password'}
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder="Min 8 characters"
            />
            <button className="cm-eye" onClick={() => setShowPw(s => !s)}>
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
          {strength && (
            <div className="cm-pw-strength">
              <div className={`cm-pw-bar ${strength}`} />
              <span className={`cm-pw-text ${strength}`}>
                {strength === 'weak' ? '⚠️ Too short' : strength === 'medium' ? '👍 Medium' : '💪 Strong'}
              </span>
            </div>
          )}
        </div>

        <div className="cm-field">
          <label className="cm-label">Confirm Password</label>
          <input
            className="cm-input"
            type={showPw ? 'text' : 'password'}
            value={confirmPw}
            onChange={e => setConfirmPw(e.target.value)}
            placeholder="Repeat new password"
          />
          {confirmPw && newPw !== confirmPw && <p className="cm-error">❌ Passwords don't match</p>}
          {confirmPw && newPw === confirmPw && newPw.length >= 8 && <p className="cm-ok">✅ Passwords match</p>}
        </div>

        <div className="cm-modal-actions">
          <button className="btn btn-primary btn-full" onClick={handleReset} disabled={saving}>
            {saving ? <span className="spinner" /> : '🔑 Reset Password'}
          </button>
          <button className="btn btn-ghost btn-full" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Chat Viewer ───────────────────────────────────────
function ChatViewer({ child, room, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const bottomRef = useRef();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/parent/child/${child.id}/chat/${room.room_id}`);
        setMessages(data.data.messages);
        setRoom(data.data.other_user);
      } catch { toast.error('Could not load messages'); }
      finally { setLoading(false); }
    };
    load();
  }, [child.id, room.room_id]);

  const [otherUser, setRoom] = useState(room);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (d) => new Date(d).toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="cm-chat-viewer">
      <div className="cm-chat-header">
        <button className="cm-back-btn" onClick={onBack}>← Back</button>
        <div className="avatar avatar-sm" style={{ background: otherUser?.avatar_color || '#FFE5E5' }}>
          {otherUser?.avatar_emoji || '🦊'}
        </div>
        <div className="cm-chat-header-info">
          <div className="cm-chat-with">Chat with {otherUser?.display_name}</div>
          <div className="cm-chat-sub">@{otherUser?.username} · {messages.length} messages</div>
        </div>
      </div>

      <div className="cm-messages">
        {loading && <div className="cm-loading"><span className="spinner" /></div>}
        {!loading && messages.length === 0 && (
          <div className="cm-empty">No messages yet</div>
        )}
        {messages.map(msg => {
          const isChild = msg.sender_id === child.id;
          return (
            <div key={msg.id} className={`cm-msg-row ${isChild ? 'child' : 'other'}`}>
              <div className="avatar avatar-xs"
                   style={{ background: isChild ? (child.avatar_color || '#FFE5E5') : (otherUser?.avatar_color || '#E5F5FF') }}>
                {isChild ? (child.avatar_emoji || '🧒') : (otherUser?.avatar_emoji || '🦊')}
              </div>
              <div className="cm-msg-wrap">
                <div className="cm-msg-sender">
                  {isChild ? child.display_name : otherUser?.display_name}
                  {isChild && <span className="cm-child-tag">your child</span>}
                </div>

                {(!msg.message_type || msg.message_type === 'text') && (
                  <div className={`cm-bubble ${isChild ? 'child' : 'other'}`}>
                    {msg.content}
                  </div>
                )}

                {msg.message_type === 'image' && (
                  <a href={`${BASE_URL}${msg.file_url}`} target="_blank" rel="noreferrer" className="cm-file-card">
                    <img src={`${BASE_URL}${msg.file_url}`} alt="sent" className="cm-msg-img" />
                    {msg.content && <p className="cm-caption">{msg.content}</p>}
                  </a>
                )}

                {(msg.message_type === 'pdf' || msg.message_type === 'note' || msg.message_type === 'file') && (
                  <a href={`${BASE_URL}${msg.file_url}`} target="_blank" rel="noreferrer"
                     className={`cm-file-card ${isChild ? 'child' : 'other'}`}>
                    <span className="cm-file-icon">
                      {msg.message_type === 'pdf' ? '📄' : msg.message_type === 'note' ? '📝' : '📎'}
                    </span>
                    <div className="cm-file-info">
                      <div className="cm-file-name">{msg.file_name}</div>
                      <div className="cm-file-size">
                        {msg.file_size ? `${(msg.file_size/1024).toFixed(1)} KB` : 'File'} · tap to open
                      </div>
                    </div>
                  </a>
                )}

                <div className="cm-msg-time">{formatTime(msg.created_at)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ── Main ChildMonitor Page ────────────────────────────
export default function ChildMonitor() {
  const { childId }  = useParams();
  const navigate     = useNavigate();
  const [child,      setChild]      = useState(null);
  const [posts,      setPosts]      = useState([]);
  const [chats,      setChats]      = useState([]);
  const [activeTab,  setActiveTab]  = useState('posts');
  const [loading,    setLoading]    = useState(true);
  const [showReset,  setShowReset]  = useState(false);
  const [openChat,   setOpenChat]   = useState(null);
  const [monitoring, setMonitoring] = useState(false);
  const [savingMon,  setSavingMon]  = useState(false);

  useEffect(() => { loadAll(); }, [childId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      // Load children list to find this child's info
      const childRes = await api.get('/parent/children');
      const kids     = childRes.data.data.children || [];
      const found    = kids.find(c => String(c.id) === String(childId));
      setChild(found || null);

      if (!found) { setLoading(false); return; }

      // Load posts and chats separately so one failure doesn't block the other
      const [postsRes, chatsRes] = await Promise.allSettled([
        api.get(`/parent/child/${childId}/posts`),
        api.get(`/parent/child/${childId}/chats`),
      ]);

      if (postsRes.status === 'fulfilled') {
        setPosts(postsRes.value.data.data.posts || []);
      } else {
        console.error('Posts load failed:', postsRes.reason?.message);
      }

      if (chatsRes.status === 'fulfilled') {
        setChats(chatsRes.value.data.data.rooms || []);
      } else {
        console.error('Chats load failed:', chatsRes.reason?.message);
      }

    } catch (err) {
      toast.error('Could not load child data');
      console.error(err);
    } finally { setLoading(false); }
  };

  const handleToggleMonitoring = async (val) => {
    setSavingMon(true);
    try {
      await api.put(`/parent/child/${childId}/monitoring`, { show_monitoring_badge: val });
      setMonitoring(val);
      toast.success(val ? '👁️ Child can see monitoring badge' : '🔕 Silent monitoring enabled');
    } catch { toast.error('Could not update setting'); }
    finally { setSavingMon(false); }
  };

  const timeAgo = (d) => {
    const m = Math.floor((Date.now() - new Date(d)) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h/24)}d ago`;
  };

  if (loading) return (
    <div className="cm-page">
      <div className="cm-loading-full"><span className="spinner spinner-lg" /></div>
    </div>
  );

  if (!child) return (
    <div className="cm-page">
      <div className="cm-not-found">
        <p>Child not found or not linked to your account.</p>
        <button className="btn btn-primary" onClick={() => navigate('/parent')}>← Back to Dashboard</button>
      </div>
    </div>
  );

  return (
    <div className="cm-page page-enter">
      <div className="cm-inner">

        {/* ── Header ── */}
        <div className="cm-hero card">
          <div className="cm-hero-left">
            <button className="cm-back-top" onClick={() => navigate('/parent')}>← Dashboard</button>
            <div className="avatar avatar-lg" style={{ background: child.avatar_color || '#FFE5E5' }}>
              {child.avatar_emoji || '🧒'}
            </div>
            <div>
              <h1 className="cm-hero-name">{child.display_name}</h1>
              <p className="cm-hero-sub">@{child.username}</p>
              <div className="cm-hero-stats">
                <span>📝 {posts.length} posts</span>
                <span>💬 {chats.length} chats</span>
                <span>⭐ {child.kindness_pts || 0} pts</span>
              </div>
            </div>
          </div>
          <div className="cm-hero-actions">
            <button className="btn btn-primary btn-sm" onClick={() => setShowReset(true)}>
              🔑 Reset Password
            </button>
            <div className="cm-monitor-toggle">
              <label className="sw">
                <input
                  type="checkbox"
                  checked={monitoring}
                  onChange={e => handleToggleMonitoring(e.target.checked)}
                  disabled={savingMon}
                />
                <span className="sw-slider" />
              </label>
              <span className="cm-monitor-label">
                {monitoring ? '👁️ Child sees badge' : '🔕 Silent mode'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="cm-tabs">
          <button className={`cm-tab ${activeTab === 'posts' ? 'active' : ''}`}
                  onClick={() => setActiveTab('posts')}>
            📝 Posts ({posts.length})
          </button>
          <button className={`cm-tab ${activeTab === 'chats' ? 'active' : ''}`}
                  onClick={() => setActiveTab('chats')}>
            💬 Chats ({chats.length})
          </button>
        </div>

        {/* ── Posts tab ── */}
        {activeTab === 'posts' && (
          <div className="cm-posts">
            {posts.length === 0 ? (
              <div className="cm-empty-state card">
                <p>📝 No posts yet</p>
              </div>
            ) : posts.map(post => (
              <div key={post.id} className={`cm-post card ${post.is_flagged ? 'flagged' : ''}`}>
                {post.is_flagged && (
                  <div className="cm-flag-banner">🚩 Flagged: {post.flag_reason || 'Content flagged for review'}</div>
                )}
                <div className="cm-post-header">
                  <div className="avatar avatar-sm" style={{ background: child.avatar_color || '#FFE5E5' }}>
                    {child.avatar_emoji || '🧒'}
                  </div>
                  <div className="cm-post-meta">
                    <span className="cm-post-author">{child.display_name}</span>
                    <span className="cm-post-time">{timeAgo(post.created_at)}</span>
                  </div>
                  <span className={`cm-visibility-badge ${post.visibility}`}>{post.visibility}</span>
                </div>
                {post.content && <p className="cm-post-content">{post.content}</p>}
                {post.image_url && (
                  <img src={`${BASE_URL}${post.image_url}`} alt="post" className="cm-post-img" />
                )}
                <div className="cm-post-footer">
                  <span>❤️ {post.like_count} likes</span>
                  <span>💬 {post.comment_count} comments</span>
                  <span className={post.is_approved ? 'cm-approved' : 'cm-pending'}>
                    {post.is_approved ? '✅ Approved' : '⏳ Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Chats tab ── */}
        {activeTab === 'chats' && !openChat && (
          <div className="cm-chats">
            {chats.length === 0 ? (
              <div className="cm-empty-state card">
                <p>💬 No chats yet</p>
              </div>
            ) : chats.map(room => (
              <div key={room.room_id} className="cm-chat-row card"
                   onClick={() => setOpenChat(room)}>
                <div className="avatar avatar-md" style={{ background: room.avatar_color || '#E5F5FF' }}>
                  {room.avatar_emoji || '🦊'}
                </div>
                <div className="cm-chat-info">
                  <div className="cm-chat-name">{room.display_name}</div>
                  <div className="cm-chat-preview">
                    {room.last_message_type === 'image' ? '📷 Photo'
                   : room.last_message_type === 'pdf'   ? '📄 PDF'
                   : room.last_message_type === 'note'  ? '📝 Note'
                   : room.last_message || 'No messages yet'}
                  </div>
                </div>
                <div className="cm-chat-right">
                  <div className="cm-chat-time">{room.last_message_time ? timeAgo(room.last_message_time) : ''}</div>
                  <div className="cm-chat-count">{room.message_count} msgs</div>
                  <span className="cm-view-btn">View →</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Chat viewer ── */}
        {activeTab === 'chats' && openChat && (
          <ChatViewer
            child={child}
            room={openChat}
            onBack={() => setOpenChat(null)}
          />
        )}

      </div>

      {/* ── Reset password modal ── */}
      {showReset && (
        <ResetPasswordModal
          child={child}
          onClose={() => setShowReset(false)}
          onReset={loadAll}
        />
      )}
    </div>
  );
}