// src/pages/Chat.jsx — with image, PDF, note sharing
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Chat.css';

const BASE_URL = process.env.REACT_APP_API_URL?.replace('/api','') || 'http://localhost:5000';

// ── File Preview bubble ───────────────────────────────
function FileBubble({ msg, isMe }) {
  const url = `${BASE_URL}${msg.file_url}`;

  if (msg.message_type === 'image') return (
    <div className={`msg-bubble msg-file ${isMe ? 'msg-me' : 'msg-them'}`}>
      <a href={url} target="_blank" rel="noreferrer">
        <img src={url} alt={msg.file_name} className="msg-image" />
      </a>
      {msg.content && <div className="msg-caption">{msg.content}</div>}
    </div>
  );

  if (msg.message_type === 'pdf') return (
    <a href={url} target="_blank" rel="noreferrer"
       className={`msg-file-card ${isMe ? 'msg-me' : 'msg-them'}`}>
      <div className="file-card-icon">📄</div>
      <div className="file-card-info">
        <div className="file-card-name">{msg.file_name}</div>
        <div className="file-card-size">
          {msg.file_size ? `${(msg.file_size/1024).toFixed(1)} KB` : 'PDF'} · tap to open
        </div>
      </div>
    </a>
  );

  if (msg.message_type === 'note') return (
    <a href={url} target="_blank" rel="noreferrer"
       className={`msg-file-card ${isMe ? 'msg-me' : 'msg-them'}`}>
      <div className="file-card-icon">📝</div>
      <div className="file-card-info">
        <div className="file-card-name">{msg.file_name}</div>
        <div className="file-card-size">Text file · tap to open</div>
      </div>
    </a>
  );

  return (
    <a href={url} target="_blank" rel="noreferrer"
       className={`msg-file-card ${isMe ? 'msg-me' : 'msg-them'}`}>
      <div className="file-card-icon">📎</div>
      <div className="file-card-info">
        <div className="file-card-name">{msg.file_name}</div>
        <div className="file-card-size">
          {msg.file_size ? `${(msg.file_size/1024).toFixed(1)} KB` : 'File'} · tap to download
        </div>
      </div>
    </a>
  );
}

// ── Chat List ─────────────────────────────────────────
function ChatList({ rooms, onSelect, selectedId }) {
  const timeAgo = (d) => {
    if (!d) return '';
    const m = Math.floor((Date.now() - new Date(d)) / 60000);
    if (m < 1) return 'now';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h/24)}d`;
  };

  const lastMsgPreview = (r) => {
    if (!r.last_message && !r.last_message_type) return 'Say hi! 👋';
    if (r.last_message_type === 'image') return '📷 Photo';
    if (r.last_message_type === 'pdf')   return '📄 PDF';
    if (r.last_message_type === 'note')  return '📝 Note';
    if (r.last_message_type === 'file')  return '📎 File';
    return r.last_message?.slice(0, 32) + (r.last_message?.length > 32 ? '...' : '');
  };

  return (
    <div className="chat-list">
      <div className="chat-list-header"><h2>💬 Messages</h2></div>
      {rooms.length === 0 ? (
        <div className="chat-empty-list">
          <div style={{fontSize:40}}>💬</div>
          <p>No chats yet!</p>
          <p style={{fontSize:12, marginTop:4}}>Go to Friends and tap 💬 Chat</p>
        </div>
      ) : rooms.map(r => (
        <button
          key={r.room_id}
          className={`chat-room-btn ${selectedId === r.room_id ? 'active' : ''}`}
          onClick={() => onSelect(r)}
        >
          <div className="avatar avatar-md" style={{background: r.avatar_color||'#FFE5E5'}}>
            {r.avatar_emoji||'🦊'}
          </div>
          <div className="chat-room-info">
            <div className="chat-room-name">{r.display_name}</div>
            <div className="chat-room-last">{lastMsgPreview(r)}</div>
          </div>
          <div className="chat-room-meta">
            <div className="chat-room-time">{timeAgo(r.last_message_time)}</div>
            {r.unread_count > 0 && (
              <div className="chat-unread">{r.unread_count}</div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

// ── Chat Window ───────────────────────────────────────
function ChatWindow({ friend, roomId, currentUser, onBack }) {
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [sending,     setSending]     = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [showAttach,  setShowAttach]  = useState(false);
  const bottomRef = useRef();
  const inputRef  = useRef();
  const imageRef  = useRef();
  const pdfRef    = useRef();
  const noteRef   = useRef();

  useEffect(() => {
    loadMessages();
    const p = setInterval(loadMessages, 3000);
    return () => clearInterval(p);
  }, [friend.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const { data } = await api.get(`/chat/${friend.id}`);
      setMessages(data.data.messages);
    } catch {}
  };

  const sendText = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    const tempMsg = {
      id: Date.now(), content: text, sender_id: currentUser.id,
      created_at: new Date().toISOString(), message_type: 'text', temp: true,
    };
    setMessages(prev => [...prev, tempMsg]);
    try {
      const { data } = await api.post(`/chat/${friend.id}`, { content: text });
      setMessages(prev => prev.map(m => m.temp ? data.data.message : m));
    } catch {
      toast.error('Could not send');
      setMessages(prev => prev.filter(m => !m.temp));
      setInput(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setFilePreview({
      file, type,
      url:  type === 'image' ? URL.createObjectURL(file) : null,
      name: file.name,
      size: file.size,
    });
    setShowAttach(false);
    e.target.value = '';
  };

  const sendFile = async () => {
    if (!filePreview) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('file', filePreview.file);
      if (input.trim()) fd.append('caption', input.trim());
      const { data } = await api.post(`/chat/${friend.id}/file`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessages(prev => [...prev, data.data.message]);
      setFilePreview(null);
      setInput('');
      toast.success('File sent! 📎');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send file');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});

  const grouped = messages.reduce((acc, msg, i) => {
    const prev = messages[i - 1];
    acc.push({ ...msg, showAvatar: !prev || prev.sender_id !== msg.sender_id });
    return acc;
  }, []);

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-win-header">
        <button className="chat-back" onClick={onBack}>←</button>
        <div className="avatar avatar-md" style={{background: friend.avatar_color||'#FFE5E5'}}>
          {friend.avatar_emoji||'🦊'}
        </div>
        <div className="chat-win-info">
          <div className="chat-win-name">{friend.display_name}</div>
          <div className="chat-win-status">@{friend.username}</div>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-start">
            <div className="avatar avatar-xl"
                 style={{background: friend.avatar_color||'#FFE5E5', margin:'0 auto 12px'}}>
              {friend.avatar_emoji||'🦊'}
            </div>
            <p>Say hi to <strong>{friend.display_name}</strong>! 👋</p>
          </div>
        )}
        {grouped.map(msg => {
          const isMe = msg.sender_id === currentUser.id;
          return (
            <div key={msg.id} className={`msg-row ${isMe ? 'me' : 'them'}`}>
              {!isMe && msg.showAvatar && (
                <div className="avatar avatar-sm msg-avatar"
                     style={{background: friend.avatar_color||'#FFE5E5'}}>
                  {friend.avatar_emoji||'🦊'}
                </div>
              )}
              {!isMe && !msg.showAvatar && <div style={{width:36, flexShrink:0}} />}
              <div className="msg-bubble-wrap">
                {(!msg.message_type || msg.message_type === 'text') ? (
                  <div className={`msg-bubble ${isMe ? 'msg-me' : 'msg-them'} ${msg.temp ? 'msg-sending' : ''}`}>
                    {msg.content}
                  </div>
                ) : (
                  <FileBubble msg={msg} isMe={isMe} />
                )}
                {msg.showAvatar && (
                  <div className={`msg-time ${isMe ? 'msg-time-right' : ''}`}>
                    {formatTime(msg.created_at)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* File preview bar */}
      {filePreview && (
        <div className="file-preview-bar">
          {filePreview.type === 'image'
            ? <img src={filePreview.url} alt="preview" className="file-preview-img" />
            : <div className="file-preview-icon">
                {filePreview.type === 'pdf' ? '📄' : filePreview.type === 'note' ? '📝' : '📎'}
              </div>
          }
          <div className="file-preview-info">
            <div className="file-preview-name">{filePreview.name}</div>
            <div className="file-preview-size">{(filePreview.size/1024).toFixed(1)} KB</div>
          </div>
          <button className="file-preview-remove" onClick={() => setFilePreview(null)}>✕</button>
        </div>
      )}

      {/* Input bar */}
      <div className="chat-input-bar">
        <div className="attach-wrapper">
          <button className="chat-attach" onClick={() => setShowAttach(o => !o)}
                  title="Send file" type="button">📎</button>
          {showAttach && (
            <div className="attach-menu">
              <button onClick={() => imageRef.current.click()}>📷 Image</button>
              <button onClick={() => pdfRef.current.click()}>📄 PDF</button>
              <button onClick={() => noteRef.current.click()}>📝 Note (.txt)</button>
            </div>
          )}
          <input ref={imageRef} type="file" accept="image/*"       hidden onChange={e => handleFileSelect(e,'image')} />
          <input ref={pdfRef}   type="file" accept=".pdf"           hidden onChange={e => handleFileSelect(e,'pdf')}   />
          <input ref={noteRef}  type="file" accept=".txt,.md,.text" hidden onChange={e => handleFileSelect(e,'note')}  />
        </div>

        <form className="chat-input-form"
              onSubmit={filePreview ? (e)=>{ e.preventDefault(); sendFile(); } : sendText}>
          <input
            ref={inputRef}
            className="chat-input"
            placeholder={filePreview ? 'Add a caption...' : `Message ${friend.display_name}...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            maxLength={1000}
            autoComplete="off"
          />
          <button className="chat-send" type="submit"
                  disabled={sending || (!input.trim() && !filePreview)}>
            {sending
              ? <span className="spinner" style={{width:18,height:18,borderWidth:2}} />
              : filePreview ? '📤' : '➤'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Chat Page ────────────────────────────────────
export default function Chat() {
  const { user }     = useAuth();
  const { friendId } = useParams();
  const navigate     = useNavigate();
  const [rooms,    setRooms]    = useState([]);
  const [selected, setSelected] = useState(null);
  const [friend,   setFriend]   = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => { loadRooms(); }, []);

  useEffect(() => {
    if (friendId) openChat(parseInt(friendId));
  }, [friendId]);

  const loadRooms = async () => {
    try {
      const { data } = await api.get('/chat');
      setRooms(data.data.rooms);
    } catch { toast.error('Could not load chats'); }
    finally  { setLoading(false); }
  };

  const openChat = async (fId) => {
    try {
      const { data } = await api.get(`/chat/${fId}`);
      setFriend(data.data.friend);
      setSelected({ room_id: data.data.room_id, other_id: fId });
      navigate(`/chat/${fId}`, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot open chat');
    }
  };

  const handleBack = () => {
    setSelected(null);
    setFriend(null);
    navigate('/chat');
    loadRooms();
  };

  return (
    <div className="chat-page page-enter">
      {/* chat-open class drives mobile slide animation */}
      <div className={`chat-layout ${friend ? 'chat-open' : ''}`}>
        <ChatList
          rooms={rooms}
          onSelect={r => openChat(r.other_id)}
          selectedId={selected?.room_id}
        />
        {friend && selected ? (
          <ChatWindow
            friend={friend}
            roomId={selected.room_id}
            currentUser={user}
            onBack={handleBack}
          />
        ) : (
          <div className="chat-placeholder">
            <div style={{fontSize:64}}>💬</div>
            <h3>Select a chat</h3>
            <p>Choose a friend from the list to start chatting!</p>
          </div>
        )}
      </div>
    </div>
  );
}