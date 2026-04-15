// src/components/kid/StoriesBar.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import './StoriesBar.css';

const BG_COLORS = ['#FF6B6B','#4ECDC4','#FFE66D','#6BCB77','#C084FC','#FFB347','#4A90D9','#FF8FAB'];

// ── Story Viewer Modal ────────────────────────────────
function StoryViewer({ group, onClose, onView }) {
  const [idx, setIdx]         = useState(0);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const story = group.stories[idx];

  useEffect(() => {
    setProgress(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          if (idx < group.stories.length - 1) { setIdx(i => i + 1); return 0; }
          else { clearInterval(intervalRef.current); onClose(); return 100; }
        }
        return p + 2;
      });
    }, 100);
    onView && onView(story.id);
    return () => clearInterval(intervalRef.current);
  }, [idx]);

  const prev = () => { if (idx > 0) { setIdx(i => i - 1); setProgress(0); } };
  const next = () => {
    if (idx < group.stories.length - 1) { setIdx(i => i + 1); setProgress(0); }
    else onClose();
  };

  return (
    <div className="sv-overlay" onClick={onClose}>
      <div className="sv-modal" onClick={e => e.stopPropagation()}>
        {/* Progress bars */}
        <div className="sv-progress">
          {group.stories.map((s, i) => (
            <div key={s.id} className="sv-prog-track">
              <div className="sv-prog-fill" style={{
                width: i < idx ? '100%' : i === idx ? `${progress}%` : '0%'
              }} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="sv-header">
          <div className="sv-user">
            <div className="avatar avatar-sm" style={{background: group.avatar_color||'#FFE5E5'}}>
              {group.avatar_emoji||'🦊'}
            </div>
            <span className="sv-name">{group.display_name}</span>
            <span className="sv-time">{new Date(story.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
          </div>
          <button className="sv-close" onClick={onClose}>✕</button>
        </div>

        {/* Story content */}
        <div className="sv-content" style={{background: story.image_url ? '#000' : story.bg_color}}>
          {story.image_url ? (
            <img src={`${process.env.REACT_APP_API_URL?.replace('/api','')||'http://localhost:5000'}${story.image_url}`} alt="story" className="sv-img" />
          ) : (
            <p className="sv-text">{story.content}</p>
          )}
          {story.image_url && story.content && (
            <div className="sv-caption">{story.content}</div>
          )}
        </div>

        {/* Nav areas */}
        <div className="sv-nav-left"  onClick={prev} />
        <div className="sv-nav-right" onClick={next} />
      </div>
    </div>
  );
}

// ── Add Story Modal ───────────────────────────────────
function AddStoryModal({ onClose, onAdd }) {
  const [content,  setContent]  = useState('');
  const [bgColor,  setBgColor]  = useState('#FF6B6B');
  const [image,    setImage]    = useState(null);
  const [preview,  setPreview]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const fileRef = useRef();

  const handleImage = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImage(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!content.trim() && !image) { toast.error('Add text or image!'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      if (content) fd.append('content', content);
      if (image)   fd.append('image', image);
      fd.append('bg_color', bgColor);
      const { data } = await api.post('/stories', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Story posted! ✨');
      onAdd(data.data.story);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not post story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sv-overlay" onClick={onClose}>
      <div className="add-story-modal" onClick={e => e.stopPropagation()}>
        <div className="add-story-header">
          <h3>Add Story ✨</h3>
          <button className="sv-close" onClick={onClose}>✕</button>
        </div>

        {/* Preview */}
        <div className="add-story-preview" style={{background: preview ? '#000' : bgColor}}>
          {preview
            ? <img src={preview} alt="preview" style={{width:'100%',height:'100%',objectFit:'cover'}} />
            : <p className="sv-text" style={{fontSize: content ? '22px' : '16px', opacity: content ? 1 : 0.4}}>
                {content || 'Your story text here...'}
              </p>
          }
        </div>

        {/* Controls */}
        {!preview && (
          <>
            <textarea
              className="input add-story-input"
              placeholder="What's your story? 🌟"
              value={content}
              onChange={e => setContent(e.target.value)}
              maxLength={200}
              rows={3}
            />
            <div className="color-picker">
              {BG_COLORS.map(c => (
                <button
                  key={c}
                  className={`color-dot ${bgColor === c ? 'selected' : ''}`}
                  style={{background: c}}
                  onClick={() => setBgColor(c)}
                />
              ))}
            </div>
          </>
        )}

        <div className="add-story-actions">
          <button className="btn btn-ghost" onClick={() => fileRef.current.click()}>📷 Photo</button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImage} />
          {preview && <button className="btn btn-ghost btn-sm" onClick={() => { setImage(null); setPreview(null); }}>✕ Remove</button>}
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="spinner" /> : '🚀 Post Story'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stories Bar ───────────────────────────────────────
export default function StoriesBar() {
  const { user } = useAuth();
  const [groups,    setGroups]    = useState([]);
  const [viewing,   setViewing]   = useState(null);
  const [addOpen,   setAddOpen]   = useState(false);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (user?.role === 'child') loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const { data } = await api.get('/stories');
      setGroups(data.data.stories);
    } catch {}
    finally { setLoading(false); }
  };

  const handleView = async (storyId) => {
    try { await api.post(`/stories/${storyId}/view`); } catch {}
  };

  const handleAdd = (story) => {
    loadStories();
  };

  if (user?.role !== 'child') return null;

  return (
    <>
      <div className="stories-bar">
        {/* Add story button */}
        <button className="story-add-btn" onClick={() => setAddOpen(true)}>
          <div className="story-add-circle">
            <span className="story-add-plus">＋</span>
          </div>
          <span className="story-username">Your Story</span>
        </button>

        {/* Stories */}
        {!loading && groups.map(g => (
          <button key={g.user_id} className="story-btn" onClick={() => setViewing(g)}>
            <div className={`story-ring ${g.has_unseen ? 'unseen' : 'seen'}`}>
              <div className="avatar avatar-md story-avatar" style={{background: g.avatar_color||'#FFE5E5'}}>
                {g.avatar_emoji||'🦊'}
              </div>
            </div>
            <span className="story-username">
              {g.user_id === user.id ? 'You' : g.display_name.split(' ')[0]}
            </span>
          </button>
        ))}

        {loading && [1,2,3].map(i => (
          <div key={i} className="story-skeleton">
            <div className="story-skeleton-circle" />
            <div className="story-skeleton-text" />
          </div>
        ))}
      </div>

      {viewing  && <StoryViewer group={viewing} onClose={() => setViewing(null)} onView={handleView} />}
      {addOpen  && <AddStoryModal onClose={() => setAddOpen(false)} onAdd={handleAdd} />}
    </>
  );
}
