// src/pages/Profile.jsx — with parent link confirm UI
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { postsAPI, parentAPI } from '../services/api';
import api from '../services/api';
import PostCard from '../components/kid/PostCard';
import toast from 'react-hot-toast';
import './Profile.css';

const BASE_URL = process.env.REACT_APP_API_URL?.replace('/api','') || 'http://localhost:5000';

// ── Edit Profile Section ──────────────────────────────
function EditProfileSection({ user, onUpdated }) {
  const AVATARS = ['🦊','🐻','🦁','🐼','🐨','🐯','🦄','🐸','🐙','🦋','🐬','🦕','🐧','🦜','🐳','🦊'];
  const COLORS  = ['#FFE5E5','#E5F5FF','#E5FFE9','#FFF5E5','#F0E5FF','#E5FFFD','#FFF0E5','#FFE5F5','#FFFDE5','#E5E5FF'];

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio,         setBio]         = useState(user?.bio || '');
  const [avatarEmoji, setAvatarEmoji] = useState(user?.avatar_emoji || '🦊');
  const [avatarColor, setAvatarColor] = useState(user?.avatar_color || '#FFE5E5');
  const [saving,      setSaving]      = useState(false);

  // Profile pic
  const [picFile,    setPicFile]    = useState(null);
  const [picPreview, setPicPreview] = useState(user?.profile_pic ? `${BASE_URL}${user.profile_pic}` : null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const fileRef = useRef();

  const handlePicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setPicFile(file);
    setPicPreview(URL.createObjectURL(file));
  };

  const handleUploadPic = async () => {
    if (!picFile) return;
    setUploadingPic(true);
    try {
      const fd = new FormData();
      fd.append('avatar', picFile);
      const { data } = await api.post('/auth/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUpdated(data.data);
      setPicFile(null);
      toast.success('Profile picture updated! 📸');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not upload picture');
    } finally { setUploadingPic(false); }
  };

  const handleSave = async () => {
    if (!displayName.trim()) { toast.error('Name cannot be empty'); return; }
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', {
        display_name: displayName.trim(),
        bio:          bio.trim(),
        avatar_emoji: avatarEmoji,
        avatar_color: avatarColor,
      });
      onUpdated(data.data);
      toast.success('Profile updated! ✨');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update profile');
    } finally { setSaving(false); }
  };

  return (
    <div className="prof-edit-card card">
      <div className="prof-section-title">✏️ Edit Profile</div>

      {/* Profile picture */}
      <div className="prof-pic-section">
        <div className="prof-pic-wrap">
          {picPreview
            ? <img src={picPreview} alt="avatar" className="prof-pic-img" />
            : <div className="prof-pic-placeholder" style={{ background: avatarColor }}>{avatarEmoji}</div>
          }
          <button className="prof-pic-btn" onClick={() => fileRef.current.click()} title="Change photo">
            📷
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePicChange} />
        </div>
        <div className="prof-pic-info">
          <p className="prof-pic-hint">Upload a profile photo (max 5MB)</p>
          {picFile && (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleUploadPic}
              disabled={uploadingPic}
            >
              {uploadingPic ? <span className="spinner" /> : '📤 Upload Photo'}
            </button>
          )}
          {picPreview && !picFile && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setPicPreview(null); setPicFile(null); }}>
              Remove photo
            </button>
          )}
        </div>
      </div>

      {/* Display name */}
      <div className="prof-field">
        <label className="prof-label">Display Name</label>
        <input
          className="prof-input"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="Your name"
          maxLength={40}
        />
      </div>

      {/* Bio */}
      <div className="prof-field">
        <label className="prof-label">Bio</label>
        <textarea
          className="prof-input prof-textarea"
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder="Tell your friends about yourself... 😊"
          maxLength={160}
          rows={3}
        />
        <span className="prof-char-count">{bio.length}/160</span>
      </div>

      {/* Avatar emoji */}
      <div className="prof-field">
        <label className="prof-label">Avatar Emoji</label>
        <div className="prof-avatar-grid">
          {AVATARS.map(em => (
            <button
              key={em}
              className={`prof-avatar-opt ${avatarEmoji === em ? 'selected' : ''}`}
              onClick={() => setAvatarEmoji(em)}
            >
              {em}
            </button>
          ))}
        </div>
      </div>

      {/* Avatar color */}
      <div className="prof-field">
        <label className="prof-label">Avatar Color</label>
        <div className="prof-color-grid">
          {COLORS.map(c => (
            <button
              key={c}
              className={`prof-color-opt ${avatarColor === c ? 'selected' : ''}`}
              style={{ background: c }}
              onClick={() => setAvatarColor(c)}
            />
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="prof-preview">
        <div className="avatar avatar-md" style={{ background: avatarColor }}>{avatarEmoji}</div>
        <span className="prof-preview-name">{displayName || 'Your Name'}</span>
      </div>

      <button className="btn btn-primary btn-full" onClick={handleSave} disabled={saving}>
        {saving ? <span className="spinner" /> : '💾 Save Changes'}
      </button>
    </div>
  );
}

// ── Change Password Section ───────────────────────────
function ChangePasswordSection() {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [saving,    setSaving]    = useState(false);

  const strength = newPw.length === 0 ? null
    : newPw.length < 8  ? 'weak'
    : newPw.length < 12 ? 'medium'
    : 'strong';

  const handleChange = async () => {
    if (!currentPw || !newPw || !confirmPw) { toast.error('Fill in all fields'); return; }
    if (newPw.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await api.put('/auth/change-password', {
        current_password: currentPw,
        new_password:     newPw,
      });
      toast.success('Password changed! 🔒');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not change password');
    } finally { setSaving(false); }
  };

  return (
    <div className="prof-edit-card card">
      <div className="prof-section-title">🔒 Change Password</div>

      <div className="prof-field">
        <label className="prof-label">Current Password</label>
        <div className="prof-pw-wrap">
          <input
            className="prof-input"
            type={showPw ? 'text' : 'password'}
            value={currentPw}
            onChange={e => setCurrentPw(e.target.value)}
            placeholder="Enter current password"
          />
          <button className="prof-eye" onClick={() => setShowPw(s => !s)}>
            {showPw ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      <div className="prof-field">
        <label className="prof-label">New Password</label>
        <div className="prof-pw-wrap">
          <input
            className="prof-input"
            type={showPw ? 'text' : 'password'}
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
            placeholder="Min 8 characters"
          />
        </div>
        {strength && (
          <div className="prof-pw-strength">
            <div className={`prof-pw-bar ${strength}`} />
            <span className={`prof-pw-text ${strength}`}>
              {strength === 'weak' ? '⚠️ Too short' : strength === 'medium' ? '👍 Medium' : '💪 Strong'}
            </span>
          </div>
        )}
      </div>

      <div className="prof-field">
        <label className="prof-label">Confirm New Password</label>
        <div className="prof-pw-wrap">
          <input
            className="prof-input"
            type={showPw ? 'text' : 'password'}
            value={confirmPw}
            onChange={e => setConfirmPw(e.target.value)}
            placeholder="Repeat new password"
          />
        </div>
        {confirmPw && newPw !== confirmPw && <p className="prof-error">❌ Passwords don't match</p>}
        {confirmPw && newPw === confirmPw && newPw.length >= 8 && <p className="prof-ok">✅ Passwords match</p>}
      </div>

      <button className="btn btn-primary btn-full" onClick={handleChange} disabled={saving}>
        {saving ? <span className="spinner" /> : '🔑 Change Password'}
      </button>
    </div>
  );
}

// ── Parent Link Requests Banner ───────────────────────
function ParentLinkRequests() {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const loadRequests = async () => {
    try {
      const { data } = await api.get('/parent/pending-links');
      setRequests(data.data.requests || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { loadRequests(); }, []);

  const respond = async (parentId, action) => {
    try {
      await parentAPI.confirmLink(parentId);
      toast.success(action === 'accept'
        ? '✅ Parent linked successfully!'
        : '❌ Request declined');
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not respond');
    }
  };

  if (loading || requests.length === 0) return null;

  return (
    <div className="parent-requests-section">
      <div className="parent-requests-title">
        🔔 Parent Link Requests
      </div>
      {requests.map(r => (
        <div key={r.parent_id} className="parent-request-card">
          <div className="parent-request-left">
            <div className="avatar avatar-md" style={{ background: '#E5F0FF' }}>
              👨‍👩‍👧
            </div>
            <div>
              <div className="parent-request-name">{r.display_name}</div>
              <div className="parent-request-sub">@{r.username} wants to be your parent on Kindr</div>
            </div>
          </div>
          <div className="parent-request-actions">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => respond(r.parent_id, 'accept')}
            >
              ✅ Accept
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => respond(r.parent_id, 'decline')}
            >
              ❌ Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Profile Page ─────────────────────────────────
export default function Profile() {
  const { user, setUser } = useAuth();
  const [posts,    setPosts]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [parents,  setParents] = useState([]);
  const [activeTab, setActiveTab] = useState('posts'); // posts | edit | password

  useEffect(() => {
    postsAPI.getUserPosts(user.id)
      .then(({ data }) => setPosts(data.data.posts))
      .catch(() => toast.error('Could not load posts'))
      .finally(() => setLoading(false));
    loadLinkedParents();
  }, [user.id]);

  const loadLinkedParents = async () => {
    try {
      const { data } = await api.get('/parent/my-parents');
      setParents(data.data.parents || []);
    } catch {}
  };

  const handleDelete = async (id) => {
    try {
      await postsAPI.delete(id);
      setPosts(prev => prev.filter(p => p.id !== id));
      toast.success('Post deleted');
    } catch { toast.error('Could not delete'); }
  };

  const handleProfileUpdated = (updated) => {
    if (setUser) setUser(prev => ({ ...prev, ...updated }));
  };

  return (
    <div className="profile-page page-enter">
      <div className="profile-inner">

        {/* ── Parent link requests banner ── */}
        <ParentLinkRequests />

        {/* ── Profile hero card ── */}
        <div className="profile-card card">
          <div className="profile-banner" />
          <div className="profile-body">
            <div className="profile-avatar-wrap">
              {user.profile_pic
                ? <img src={`${BASE_URL}${user.profile_pic}`} alt="avatar" className="profile-pic-img" />
                : <div className="profile-avatar avatar avatar-xl" style={{ background: user.avatar_color || '#FFE5E5' }}>
                    {user.avatar_emoji || '🦊'}
                  </div>
              }
            </div>
            <div className="profile-info">
              <h1 className="profile-name">{user.display_name}</h1>
              <p className="profile-username">@{user.username}</p>
              {user.bio && <p className="profile-bio">{user.bio}</p>}
              <div className="profile-badges">
                <span className="badge badge-sky">🛡️ Kindr Member</span>
                <span className="badge badge-green">⭐ {user.kindness_pts || 0} Kindness Points</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Linked parents ── */}
        {parents.length > 0 && (
          <div className="linked-parents card">
            <div className="linked-parents-title">👨‍👩‍👧 Your Parents on Kindr</div>
            {parents.map(p => (
              <div key={p.id} className="linked-parent-row">
                <div className="avatar avatar-sm" style={{ background: '#E5F0FF' }}>👨‍👩‍👧</div>
                <div>
                  <div className="linked-parent-name">{p.display_name}</div>
                  <div className="linked-parent-sub">@{p.username}</div>
                </div>
                <span className="badge badge-green" style={{ marginLeft: 'auto' }}>✅ Linked</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="profile-tabs">
          {[
            { id: 'posts',    label: '✨ My Posts'       },
            { id: 'edit',     label: '✏️ Edit Profile'   },
            { id: 'password', label: '🔒 Password'       },
          ].map(t => (
            <button
              key={t.id}
              className={`profile-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        {activeTab === 'posts' && (
          <>
            {loading ? (
              <div style={{ textAlign:'center', padding: 48 }}>
                <span className="spinner spinner-lg" />
              </div>
            ) : posts.length === 0 ? (
              <div className="empty-state card">
                <div className="icon">✨</div>
                <h3>No posts yet!</h3>
                <p>Share your first moment from the Feed page.</p>
              </div>
            ) : (
              <div className="profile-posts">
                {posts.map(p => (
                  <PostCard key={p.id} post={p} onDelete={handleDelete} currentUserId={user.id} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'edit' && (
          <EditProfileSection user={user} onUpdated={handleProfileUpdated} />
        )}

        {activeTab === 'password' && (
          <ChangePasswordSection />
        )}

      </div>
    </div>
  );
}