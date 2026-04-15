// src/pages/ParentProfile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './ParentProfile.css';



const AVATARS = ['👨','👩','🧑','👨‍💼','👩‍💼','👨‍🏫','👩‍🏫','🦸','🦸‍♀️','🧙','🧙‍♀️','🦊','🐻','🦁','🐼','🐨'];
const COLORS  = ['#FFE5E5','#E5F5FF','#E5FFE9','#FFF5E5','#F0E5FF','#E5FFFD','#FFF0E5','#FFE5F5','#E5E5FF','#FFFDE5'];

export default function ParentProfile() {
  const { user, setUser } = useAuth();

  // Profile state
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [avatarEmoji, setAvatarEmoji] = useState(user?.avatar_emoji || '👨');
  const [avatarColor, setAvatarColor] = useState(user?.avatar_color || '#E5F5FF');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [currentPw,  setCurrentPw]  = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [savingPw,   setSavingPw]   = useState(false);

  // Children state
  const [children,   setChildren]   = useState([]);
  const [loadingKids, setLoadingKids] = useState(true);

  // Notifications state
  const [notifs,     setNotifs]     = useState({
    email_new_friend:    true,
    email_flagged_post:  true,
    email_weekly_digest: true,
    email_login_alert:   false,
  });
  const [savingNotifs, setSavingNotifs] = useState(false);

  useEffect(() => { loadChildren(); }, []);

  const loadChildren = async () => {
    try {
      const { data } = await api.get('/parent/children');
      setChildren(data.data.children || []);
    } catch {}
    finally { setLoadingKids(false); }
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) { toast.error('Name cannot be empty'); return; }
    setSavingProfile(true);
    try {
      const { data } = await api.put('/auth/profile', {
        display_name: displayName.trim(),
        avatar_emoji: avatarEmoji,
        avatar_color: avatarColor,
      });
      if (setUser) setUser(prev => ({ ...prev, ...data.data }));
      toast.success('Profile updated! ✨');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update profile');
    } finally { setSavingProfile(false); }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) { toast.error('Fill in all password fields'); return; }
    if (newPw.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (newPw !== confirmPw) { toast.error('New passwords do not match'); return; }
    setSavingPw(true);
    try {
      await api.put('/auth/change-password', { current_password: currentPw, new_password: newPw });
      toast.success('Password changed! 🔒');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not change password');
    } finally { setSavingPw(false); }
  };

  const handleUnlinkChild = async (childId, childName) => {
    if (!window.confirm(`Unlink ${childName}? You can re-link them later.`)) return;
    try {
      await api.delete(`/parent/unlink/${childId}`);
      toast.success(`${childName} unlinked`);
      loadChildren();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not unlink');
    }
  };

  const handleSaveNotifs = async () => {
    setSavingNotifs(true);
    try {
      await api.put('/parent/notifications', notifs);
      toast.success('Notification preferences saved! 🔔');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save');
    } finally { setSavingNotifs(false); }
  };

  return (
    <div className="pp-page page-enter">
      <div className="pp-inner">

        {/* ── Page header ── */}
        <div className="pp-hero">
          <div className="pp-hero-left">
            <div className="pp-avatar-big" style={{ background: avatarColor }}>
              {avatarEmoji}
            </div>
            <div>
              <h1 className="pp-hero-name">{user?.display_name}</h1>
              <p className="pp-hero-sub">@{user?.username} · Parent Account</p>
            </div>
          </div>
          <div className="pp-hero-badge">👨‍👩‍👧 Parent</div>
        </div>

        <div className="pp-grid">

          {/* ── 1. Edit Profile ── */}
          <div className="pp-card card">
            <div className="pp-card-title">✏️ Edit Profile</div>

            <div className="pp-field">
              <label className="pp-label">Display Name</label>
              <input
                className="pp-input"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
                maxLength={40}
              />
            </div>

            <div className="pp-field">
              <label className="pp-label">Avatar Emoji</label>
              <div className="avatar-grid">
                {AVATARS.map(em => (
                  <button
                    key={em}
                    className={`avatar-opt ${avatarEmoji === em ? 'selected' : ''}`}
                    onClick={() => setAvatarEmoji(em)}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <div className="pp-field">
              <label className="pp-label">Avatar Color</label>
              <div className="color-grid">
                {COLORS.map(c => (
                  <button
                    key={c}
                    className={`color-opt ${avatarColor === c ? 'selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setAvatarColor(c)}
                  />
                ))}
              </div>
            </div>

            <div className="pp-preview">
              <span>Preview: </span>
              <div className="avatar avatar-md" style={{ background: avatarColor }}>
                {avatarEmoji}
              </div>
              <span className="pp-preview-name">{displayName || 'Your Name'}</span>
            </div>

            <button
              className="btn btn-primary btn-full"
              onClick={handleSaveProfile}
              disabled={savingProfile}
            >
              {savingProfile ? <span className="spinner" /> : '💾 Save Profile'}
            </button>
          </div>

          {/* ── 2. Change Password ── */}
          <div className="pp-card card">
            <div className="pp-card-title">🔒 Change Password</div>

            <div className="pp-field">
              <label className="pp-label">Current Password</label>
              <div className="pp-pw-wrap">
                <input
                  className="pp-input"
                  type={showPw ? 'text' : 'password'}
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  placeholder="Enter current password"
                />
                <button className="pp-eye" onClick={() => setShowPw(s => !s)}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="pp-field">
              <label className="pp-label">New Password</label>
              <div className="pp-pw-wrap">
                <input
                  className="pp-input"
                  type={showPw ? 'text' : 'password'}
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder="Min 8 characters"
                />
              </div>
              {newPw && (
                <div className="pw-strength">
                  <div className={`pw-bar ${newPw.length >= 12 ? 'strong' : newPw.length >= 8 ? 'medium' : 'weak'}`} />
                  <span>{newPw.length >= 12 ? '💪 Strong' : newPw.length >= 8 ? '👍 Medium' : '⚠️ Too short'}</span>
                </div>
              )}
            </div>

            <div className="pp-field">
              <label className="pp-label">Confirm New Password</label>
              <div className="pp-pw-wrap">
                <input
                  className="pp-input"
                  type={showPw ? 'text' : 'password'}
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="Repeat new password"
                />
              </div>
              {confirmPw && newPw !== confirmPw && (
                <p className="pp-error">Passwords don't match</p>
              )}
              {confirmPw && newPw === confirmPw && confirmPw.length >= 8 && (
                <p className="pp-ok">✓ Passwords match</p>
              )}
            </div>

            <button
              className="btn btn-primary btn-full"
              onClick={handleChangePassword}
              disabled={savingPw}
            >
              {savingPw ? <span className="spinner" /> : '🔑 Change Password'}
            </button>
          </div>

          {/* ── 3. Linked Children ── */}
          <div className="pp-card card">
            <div className="pp-card-title">👨‍👩‍👧 Linked Children</div>

            {loadingKids ? (
              <div className="pp-loading"><span className="spinner" /></div>
            ) : children.length === 0 ? (
              <div className="pp-empty">
                <p>🧒 No children linked yet.</p>
                <p>Go to the Dashboard to link a child.</p>
              </div>
            ) : (
              children.map(c => (
                <div key={c.id} className="pp-child-row">
                  <div className="avatar avatar-md" style={{ background: c.avatar_color || '#FFE5E5' }}>
                    {c.avatar_emoji || '🧒'}
                  </div>
                  <div className="pp-child-info">
                    <div className="pp-child-name">{c.display_name}</div>
                    <div className="pp-child-meta">@{c.username}</div>
                    <span className={`badge badge-${c.link_status === 'active' ? 'green' : 'amber'}`}
                          style={{ fontSize: '0.65rem' }}>
                      {c.link_status}
                    </span>
                  </div>
                  <div className="pp-child-actions">
                    <div className="pp-child-pts">⭐ {c.kindness_pts || 0} pts</div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleUnlinkChild(c.id, c.display_name)}
                    >
                      Unlink
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── 4. Notification Preferences ── */}
          <div className="pp-card card">
            <div className="pp-card-title">🔔 Notification Preferences</div>
            <p className="pp-notif-sub">Choose what emails you receive from Kindr.</p>

            {[
              { key: 'email_new_friend',    label: 'New friend requests',    sub: 'When your child gets a new friend request' },
              { key: 'email_flagged_post',  label: 'Flagged content alerts',  sub: 'When your child\'s post is flagged' },
              { key: 'email_weekly_digest', label: 'Weekly activity digest',  sub: 'Summary of your child\'s week every Monday' },
              { key: 'email_login_alert',   label: 'Login alerts',            sub: 'When your child logs in from a new device' },
            ].map(n => (
              <div key={n.key} className="pp-notif-row">
                <div className="pp-notif-info">
                  <div className="pp-notif-label">{n.label}</div>
                  <div className="pp-notif-sub-text">{n.sub}</div>
                </div>
                <label className="sw">
                  <input
                    type="checkbox"
                    checked={!!notifs[n.key]}
                    onChange={e => setNotifs(prev => ({ ...prev, [n.key]: e.target.checked }))}
                  />
                  <span className="sw-slider" />
                </label>
              </div>
            ))}

            <button
              className="btn btn-primary btn-full"
              style={{ marginTop: 'var(--space-md)' }}
              onClick={handleSaveNotifs}
              disabled={savingNotifs}
            >
              {savingNotifs ? <span className="spinner" /> : '🔔 Save Preferences'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}