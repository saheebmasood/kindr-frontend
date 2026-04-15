// src/components/kid/PostCard.jsx — with like, comment, repost, share
import React, { useState } from 'react';
import { postsAPI } from '../../services/api';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './PostCard.css';

const BASE_URL = process.env.REACT_APP_API_URL?.replace('/api','') || 'http://localhost:5000';

// ── Comment Section ───────────────────────────────────
function CommentSection({ postId, currentUserId, onCountChange }) {
  const [comments,  setComments]  = useState([]);
  const [loaded,    setLoaded]    = useState(false);
  const [input,     setInput]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadComments = async () => {
    if (loaded) return;
    try {
      const { data } = await api.get(`/posts/${postId}/comments`);
      setComments(data.data.comments);
      setLoaded(true);
    } catch { toast.error('Could not load comments'); }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/posts/${postId}/comment`, { content: input.trim() });
      setComments(prev => [...prev, data.data.comment]);
      setInput('');
      onCountChange(1);
    } catch (err) { toast.error(err.response?.data?.message || 'Could not comment'); }
    finally { setSubmitting(false); }
  };

  const deleteComment = async (commentId) => {
    try {
      await api.delete(`/posts/${postId}/comment/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId));
      onCountChange(-1);
    } catch { toast.error('Could not delete'); }
  };

  const timeAgo = (d) => {
    const m = Math.floor((Date.now() - new Date(d)) / 60000);
    if (m < 1) return 'now';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h/24)}d`;
  };

  return (
    <div className="comment-section" onLoad={loadComments} ref={el => el && !loaded && loadComments()}>
      {/* Comment input */}
      <form className="comment-form" onSubmit={submitComment}>
        <input
          className="comment-input"
          placeholder="Write a comment... 💬"
          value={input}
          onChange={e => setInput(e.target.value)}
          maxLength={500}
        />
        <button className="comment-submit" type="submit" disabled={submitting || !input.trim()}>
          {submitting ? '...' : '➤'}
        </button>
      </form>

      {/* Comments list */}
      {comments.length > 0 && (
        <div className="comments-list">
          {comments.map(c => (
            <div key={c.id} className="comment-row">
              <div className="avatar avatar-xs" style={{background: c.avatar_color||'#FFE5E5', flexShrink:0}}>
                {c.avatar_emoji||'🦊'}
              </div>
              <div className="comment-body">
                <div className="comment-header">
                  <span className="comment-author">{c.display_name}</span>
                  <span className="comment-time">{timeAgo(c.created_at)}</span>
                  {c.user_id === currentUserId && (
                    <button className="comment-delete" onClick={() => deleteComment(c.id)}>✕</button>
                  )}
                </div>
                <div className="comment-content">{c.content}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Share Modal ───────────────────────────────────────
function ShareModal({ post, onClose }) {
  const shareUrl = `${window.location.origin}/post/${post.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success('Link copied! 🔗');
      onClose();
    });
  };

  const shareVia = (platform) => {
    const text = `Check out this post by ${post.display_name} on Kindr!`;
    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`,
      twitter:  `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
    };
    if (urls[platform]) window.open(urls[platform], '_blank');
    onClose();
  };

  return (
    <div className="share-overlay" onClick={onClose}>
      <div className="share-modal" onClick={e => e.stopPropagation()}>
        <div className="share-title">Share Post 🔗</div>
        <div className="share-url">{shareUrl}</div>
        <div className="share-options">
          <button className="share-btn" onClick={copyLink}>📋 Copy Link</button>
          <button className="share-btn" onClick={() => shareVia('whatsapp')}>💚 WhatsApp</button>
          <button className="share-btn" onClick={() => shareVia('twitter')}>🐦 Twitter</button>
        </div>
        <button className="btn btn-ghost btn-sm" style={{width:'100%',marginTop:8}} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

// ── Main PostCard ─────────────────────────────────────
export default function PostCard({ post: initialPost, onDelete, currentUserId }) {
  const [post,         setPost]         = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [showShare,    setShowShare]    = useState(false);
  const [liking,       setLiking]       = useState(false);
  const [reposting,    setReposting]    = useState(false);

  const isOwn = post.user_id === currentUserId;

  const timeAgo = (d) => {
    const m = Math.floor((Date.now() - new Date(d)) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h/24)}d ago`;
  };

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    const wasLiked = !!post.liked_by_me;
    // Optimistic update
    setPost(p => ({
      ...p,
      liked_by_me: !wasLiked,
      like_count: wasLiked
        ? Math.max(0, Number(p.like_count) - 1)
        : Number(p.like_count) + 1,
    }));
    try {
      const { data } = await api.post(`/posts/${post.id}/like`);
      // Use server count as source of truth
      setPost(p => ({
        ...p,
        liked_by_me: data.data.liked,
        like_count:  Number(data.data.like_count),
      }));
    } catch {
      // Revert on error
      setPost(p => ({
        ...p,
        liked_by_me: wasLiked,
        like_count: wasLiked
          ? Number(p.like_count) + 1
          : Math.max(0, Number(p.like_count) - 1),
      }));
    } finally { setLiking(false); }
  };

  const handleRepost = async () => {
    if (reposting || isOwn) return;
    setReposting(true);
    try {
      const { data } = await api.post(`/posts/${post.id}/repost`);
      setPost(p => ({
        ...p,
        reposted_by_me: data.data.reposted,
        repost_count: data.data.repost_count,
      }));
      toast.success(data.data.reposted ? 'Reposted! 🔁' : 'Repost removed');
    } catch (err) { toast.error(err.response?.data?.message || 'Could not repost'); }
    finally { setReposting(false); }
  };

  const handleCommentCountChange = (delta) => {
    setPost(p => ({ ...p, comment_count: (p.comment_count || 0) + delta }));
  };

  return (
    <>
      <div className={`post-card card ${post.is_repost ? 'is-repost' : ''}`}>

        {/* Repost banner */}
        {post.is_repost && (
          <div className="repost-banner">
            <div className="avatar avatar-xs" style={{background: post.avatar_color||'#FFE5E5'}}>
              {post.avatar_emoji||'🦊'}
            </div>
            <span>🔁 <strong>{post.display_name}</strong> reposted</span>
          </div>
        )}

        {/* Original post content if repost */}
        {post.is_repost && post.original_post ? (
          <div className="repost-original">
            <div className="post-header">
              <div className="avatar avatar-md" style={{background: post.original_post.orig_avatar_color||'#FFE5E5'}}>
                {post.original_post.orig_avatar_emoji||'🦊'}
              </div>
              <div className="post-meta">
                <span className="post-author">{post.original_post.orig_display_name}</span>
                <span className="post-time">{timeAgo(post.original_post.created_at)}</span>
              </div>
            </div>
            {post.original_post.content && <p className="post-content">{post.original_post.content}</p>}
            {post.original_post.image_url && (
              <img src={`${BASE_URL}${post.original_post.image_url}`} alt="" className="post-image" />
            )}
          </div>
        ) : (
          <>
            {/* Normal post header */}
            <div className="post-header">
              <div className="avatar avatar-md" style={{background: post.avatar_color||'#FFE5E5'}}>
                {post.avatar_emoji||'🦊'}
              </div>
              <div className="post-meta">
                <span className="post-author">{post.display_name}</span>
                <span className="post-time">{timeAgo(post.created_at)}</span>
              </div>
              {isOwn && (
                <button className="post-delete" onClick={() => onDelete(post.id)} title="Delete">🗑</button>
              )}
            </div>

            {/* Content */}
            {post.content && <p className="post-content">{post.content}</p>}
            {post.image_url && (
              <img src={`${BASE_URL}${post.image_url}`} alt="post" className="post-image" />
            )}
          </>
        )}

        {/* ── Action bar ── */}
        <div className="post-actions">

          {/* Like */}
          <button
            className={`post-action-btn ${post.liked_by_me ? 'action-liked' : ''}`}
            onClick={handleLike}
            disabled={liking}
          >
            <span className="action-icon">{post.liked_by_me ? '❤️' : '🤍'}</span>
            <span className="action-count">{post.like_count || 0}</span>
          </button>

          {/* Comment */}
          <button
            className={`post-action-btn ${showComments ? 'action-active' : ''}`}
            onClick={() => setShowComments(s => !s)}
          >
            <span className="action-icon">💬</span>
            <span className="action-count">{post.comment_count || 0}</span>
          </button>

          {/* Repost */}
          <button
            className={`post-action-btn ${post.reposted_by_me ? 'action-reposted' : ''} ${isOwn ? 'action-disabled' : ''}`}
            onClick={handleRepost}
            disabled={reposting || isOwn}
            title={isOwn ? "Can't repost your own post" : post.reposted_by_me ? 'Undo repost' : 'Repost'}
          >
            <span className="action-icon">🔁</span>
            <span className="action-count">{post.repost_count || 0}</span>
          </button>

          {/* Share */}
          <button className="post-action-btn" onClick={() => setShowShare(true)}>
            <span className="action-icon">📤</span>
            <span className="action-label">Share</span>
          </button>

        </div>

        {/* Comments */}
        {showComments && (
          <CommentSection
            postId={post.id}
            currentUserId={currentUserId}
            onCountChange={handleCommentCountChange}
          />
        )}
      </div>

      {showShare && <ShareModal post={post} onClose={() => setShowShare(false)} />}
    </>
  );
}