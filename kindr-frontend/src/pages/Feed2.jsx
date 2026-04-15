// src/pages/Feed.jsx
import React, { useState, useEffect, useRef } from 'react';
import { postsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/kid/PostCard';
import toast from 'react-hot-toast';
import './Feed.css';

export default function Feed() {
  const { user } = useAuth();
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [content, setContent] = useState('');
  const [image,   setImage]   = useState(null);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef();

  const loadFeed = async () => {
    try {
      const { data } = await postsAPI.getFeed();
      setPosts(data.data.feed);
    } catch {
      toast.error('Could not load feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFeed(); }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image) { toast.error('Write something or add a photo!'); return; }
    setPosting(true);
    try {
      const fd = new FormData();
      if (content) fd.append('content', content);
      if (image)   fd.append('image', image);
      fd.append('visibility', 'friends');
      const { data } = await postsAPI.create(fd);
      setPosts(prev => [data.data.post, ...prev]);
      setContent(''); setImage(null); setPreview(null);
      toast.success('Posted! ⭐');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not post');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await postsAPI.delete(id);
      setPosts(prev => prev.filter(p => p.id !== id));
      toast.success('Post deleted');
    } catch {
      toast.error('Could not delete');
    }
  };

  return (
    <div className="feed-page page-enter">
      <div className="feed-inner">

        {/* Compose box */}
        <div className="compose-card card">
          <div className="compose-head">
            <div className="avatar avatar-md" style={{ background: user?.avatar_color || '#FFE5E5' }}>
              {user?.avatar_emoji || '🦊'}
            </div>
            <textarea
              className="compose-input"
              placeholder={`What's on your mind, ${user?.display_name}? 😊`}
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={2}
              maxLength={500}
            />
          </div>
          {preview && (
            <div className="compose-preview">
              <img src={preview} alt="preview" />
              <button className="remove-preview" onClick={() => { setImage(null); setPreview(null); }}>✕</button>
            </div>
          )}
          <div className="compose-footer">
            <div className="compose-actions">
              <button className="compose-action" onClick={() => fileRef.current.click()} title="Add photo">
                📷 Photo
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImageChange} />
              <span className="char-count">{content.length}/500</span>
            </div>
            <button
              className="btn btn-primary"
              onClick={handlePost}
              disabled={posting || (!content.trim() && !image)}
            >
              {posting ? <span className="spinner" /> : '✨ Share'}
            </button>
          </div>
        </div>

        {/* Feed */}
        {loading ? (
          <div className="feed-loading">
            <span className="spinner spinner-lg" />
            <p>Loading your feed...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🌟</div>
            <h3>Nothing here yet!</h3>
            <p>Add some friends and they'll show up here. Or be the first to post!</p>
          </div>
        ) : (
          <div className="posts-list">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={handleDelete}
                currentUserId={user?.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
