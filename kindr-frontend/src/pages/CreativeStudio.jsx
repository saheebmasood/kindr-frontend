// src/pages/CreativeStudio.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './CreativeStudio.css';

// ═══════════════════════════════════════════════════
// 🎨 DRAWING CANVAS
// ═══════════════════════════════════════════════════
function DrawingCanvas({ onSave }) {
  const canvasRef   = useRef();
  const [drawing,   setDrawing]   = useState(false);
  const [tool,      setTool]      = useState('pen');
  const [color,     setColor]     = useState('#FF6B6B');
  const [size,      setSize]      = useState(5);
  const [history,   setHistory]   = useState([]);
  const lastPos     = useRef(null);

  const COLORS = ['#FF6B6B','#FFB347','#FFE66D','#6BCB77','#4ECDC4','#4A90D9','#C084FC','#FF8FAB','#fff','#1a1a2e'];
  const TOOLS  = [
    { id:'pen',    icon:'✏️', label:'Pen' },
    { id:'brush',  icon:'🖌️', label:'Brush' },
    { id:'eraser', icon:'🧹', label:'Eraser' },
    { id:'fill',   icon:'🪣', label:'Fill' },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistory();
  }, []);

  const saveHistory = () => {
    const canvas = canvasRef.current;
    setHistory(h => [...h.slice(-20), canvas.toDataURL()]);
  };

  const undo = () => {
    if (history.length < 2) return;
    const newH  = history.slice(0, -1);
    const img   = new Image();
    img.src     = newH[newH.length - 1];
    img.onload  = () => {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(img, 0, 0);
    };
    setHistory(newH);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistory();
  };

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const floodFill = (x, y, fillColor) => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data   = imgData.data;
    const idx    = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
    const target = [data[idx], data[idx+1], data[idx+2], data[idx+3]];
    const fill   = hexToRgb(fillColor);
    if (!fill) return;
    if (target[0]===fill[0] && target[1]===fill[1] && target[2]===fill[2]) return;

    const stack = [[Math.floor(x), Math.floor(y)]];
    while (stack.length) {
      const [cx, cy] = stack.pop();
      const ci = (cy * canvas.width + cx) * 4;
      if (cx < 0 || cx >= canvas.width || cy < 0 || cy >= canvas.height) continue;
      if (data[ci]!==target[0] || data[ci+1]!==target[1] || data[ci+2]!==target[2]) continue;
      data[ci]=fill[0]; data[ci+1]=fill[1]; data[ci+2]=fill[2]; data[ci+3]=255;
      stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
    }
    ctx.putImageData(imgData, 0, 0);
  };

  const hexToRgb = (hex) => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? [parseInt(r[1],16), parseInt(r[2],16), parseInt(r[3],16)] : null;
  };

  const startDraw = (e) => {
    e.preventDefault();
    const pos = getPos(e);
    if (tool === 'fill') { floodFill(pos.x, pos.y, color); saveHistory(); return; }
    setDrawing(true);
    lastPos.current = pos;
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing) return;
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === 'eraser' ? '#fff' : color;
    ctx.lineWidth   = tool === 'eraser' ? size * 3 : tool === 'brush' ? size * 2 : size;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.globalAlpha = tool === 'brush' ? 0.7 : 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
    lastPos.current = pos;
  };

  const endDraw = () => { if (drawing) { setDrawing(false); saveHistory(); } };

  const handleSave = () => {
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onSave({ type: 'drawing', dataUrl, title: 'My Drawing' });
  };

  return (
    <div className="studio-tool">
      {/* Toolbar */}
      <div className="draw-toolbar">
        <div className="draw-tools">
          {TOOLS.map(t => (
            <button key={t.id} className={`draw-tool-btn ${tool===t.id?'active':''}`}
              onClick={() => setTool(t.id)} title={t.label}>
              {t.icon}
            </button>
          ))}
        </div>

        <div className="draw-colors">
          {COLORS.map(c => (
            <button key={c} className={`draw-color ${color===c?'selected':''}`}
              style={{background:c, border: c==='#fff'?'2px solid #ddd':'2px solid transparent'}}
              onClick={() => setColor(c)} />
          ))}
          <input type="color" value={color} onChange={e=>setColor(e.target.value)}
            className="draw-color-picker" title="Custom color" />
        </div>

        <div className="draw-size">
          <span>Size</span>
          <input type="range" min="1" max="30" value={size}
            onChange={e=>setSize(+e.target.value)} className="draw-slider" />
          <span>{size}px</span>
        </div>

        <div className="draw-actions">
          <button className="btn btn-ghost btn-sm" onClick={undo}>↩ Undo</button>
          <button className="btn btn-ghost btn-sm" onClick={clearCanvas}>🗑 Clear</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>💾 Save</button>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="draw-canvas"
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 📖 STORY WRITER
// ═══════════════════════════════════════════════════
const STORY_TEMPLATES = [
  { id:'blank',    label:'✨ Blank',      prompt:'' },
  { id:'adventure',label:'🗺️ Adventure',  prompt:'Once upon a time, in a land far away, there was a brave hero who...' },
  { id:'mystery',  label:'🔍 Mystery',    prompt:'It was a dark and stormy night when Detective Sam discovered...' },
  { id:'scifi',    label:'🚀 Sci-Fi',     prompt:'In the year 2150, aboard the spaceship Aurora, Captain Zara noticed...' },
  { id:'funny',    label:'😂 Funny',      prompt:'Nobody expected the talking dog to run for class president, but...' },
];

function StoryWriter({ onSave }) {
  const [title,    setTitle]    = useState('');
  const [content,  setContent]  = useState('');
  const [template, setTemplate] = useState('blank');
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    setWordCount(content.trim() ? content.trim().split(/\s+/).length : 0);
  }, [content]);

  const applyTemplate = (t) => {
    setTemplate(t.id);
    if (t.prompt && !content) setContent(t.prompt);
  };

  const handleSave = () => {
    if (!title.trim()) { toast.error('Give your story a title!'); return; }
    if (!content.trim()) { toast.error('Write something first!'); return; }
    onSave({ type: 'story', title, content });
  };

  return (
    <div className="studio-tool story-tool">
      <div className="story-templates">
        {STORY_TEMPLATES.map(t => (
          <button key={t.id}
            className={`story-template-btn ${template===t.id?'active':''}`}
            onClick={() => applyTemplate(t)}>
            {t.label}
          </button>
        ))}
      </div>

      <input
        className="story-title-input"
        placeholder="Story title..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        maxLength={100}
      />

      <textarea
        className="story-textarea"
        placeholder="Once upon a time..."
        value={content}
        onChange={e => setContent(e.target.value)}
      />

      <div className="story-footer">
        <span className="word-count">{wordCount} words</span>
        <button className="btn btn-primary" onClick={handleSave}>💾 Save Story</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 🗒️ COMIC MAKER
// ═══════════════════════════════════════════════════
const PANEL_LAYOUTS = [
  { id:'2col',   label:'2 Panels', grid:'1fr 1fr',       panels:2 },
  { id:'3col',   label:'3 Panels', grid:'1fr 1fr 1fr',   panels:3 },
  { id:'2row',   label:'2 Rows',   grid:'1fr',            panels:2, rows:2 },
  { id:'large-small', label:'Big + 2', grid:'2fr 1fr',   panels:3 },
];

const PANEL_BGSCOLORS = ['#FFF9C4','#E8F5E9','#E3F2FD','#FCE4EC','#F3E5F5','#FFF3E0','#fff','#1a1a2e'];
const BUBBLE_TYPES = ['💬 Speech','💭 Thought','💥 Action'];

function ComicMaker({ onSave }) {
  const [layout,  setLayout]  = useState(PANEL_LAYOUTS[0]);
  const [panels,  setPanels]  = useState(Array(2).fill(null).map((_,i) => ({
    id: i, bg: '#FFF9C4', text: '', character: '🦊', bubbleType: 0, caption: '',
  })));
  const [title, setTitle] = useState('');

  const updatePanel = (idx, key, val) => {
    setPanels(prev => prev.map((p, i) => i===idx ? {...p, [key]:val} : p));
  };

  const changeLayout = (l) => {
    setLayout(l);
    setPanels(Array(l.panels).fill(null).map((_,i) => panels[i] || {
      id:i, bg:'#FFF9C4', text:'', character:'🦊', bubbleType:0, caption:'',
    }));
  };

  const CHARS = ['🦊','🐻','🐼','🐯','🦁','🐸','🐧','🦋','🦄','🐲','🤖','👽'];

  const handleSave = () => {
    if (!title.trim()) { toast.error('Give your comic a title!'); return; }
    onSave({ type: 'comic', title, panels, layout: layout.id });
  };

  return (
    <div className="studio-tool comic-tool">
      {/* Controls */}
      <div className="comic-controls">
        <input className="story-title-input" placeholder="Comic title..."
          value={title} onChange={e=>setTitle(e.target.value)} maxLength={60} />
        <div className="comic-layouts">
          {PANEL_LAYOUTS.map(l => (
            <button key={l.id} className={`comic-layout-btn ${layout.id===l.id?'active':''}`}
              onClick={() => changeLayout(l)}>{l.label}</button>
          ))}
        </div>
      </div>

      {/* Comic Preview */}
      <div className="comic-preview" style={{gridTemplateColumns: layout.grid}}>
        {panels.map((p, idx) => (
          <div key={p.id} className="comic-panel" style={{background: p.bg}}>
            {/* Panel controls */}
            <div className="panel-controls">
              <select className="panel-select" value={p.character}
                onChange={e => updatePanel(idx,'character',e.target.value)}>
                {CHARS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="panel-colors">
                {PANEL_BGSCOLORS.map(c => (
                  <button key={c} className="panel-color-dot"
                    style={{background:c, outline: p.bg===c?'2px solid #333':'none'}}
                    onClick={() => updatePanel(idx,'bg',c)} />
                ))}
              </div>
            </div>

            {/* Character display */}
            <div className="panel-character">{p.character}</div>

            {/* Speech bubble */}
            {p.text && (
              <div className={`comic-bubble bubble-${p.bubbleType}`}>{p.text}</div>
            )}

            {/* Panel caption */}
            {p.caption && <div className="panel-caption">{p.caption}</div>}

            {/* Edit overlays */}
            <input className="panel-text-input" placeholder="Dialogue..."
              value={p.text} onChange={e => updatePanel(idx,'text',e.target.value)} maxLength={80} />
            <input className="panel-caption-input" placeholder="Caption..."
              value={p.caption} onChange={e => updatePanel(idx,'caption',e.target.value)} maxLength={60} />
          </div>
        ))}
      </div>

      <div className="comic-footer">
        <button className="btn btn-primary" onClick={handleSave}>💾 Save Comic</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 🖼️ CREATION GALLERY CARD
// ═══════════════════════════════════════════════════
function CreationCard({ creation, onLike, currentUserId }) {
  const [expanded, setExpanded] = useState(false);
  const isOwn    = creation.user_id === currentUserId;
  const typeIcon = { drawing:'🎨', story:'📖', comic:'🗒️', animation:'🎬' };
  const isLong   = (creation.content?.length || 0) > 180;

  return (
    <div className="creation-card">
      <div className="creation-header">
        <div className="avatar avatar-sm" style={{background: creation.avatar_color||'#FFE5E5'}}>
          {creation.avatar_emoji||'🦊'}
        </div>
        <div className="creation-meta">
          <span className="creation-author">{creation.display_name}</span>
          <span className="creation-type">{typeIcon[creation.type]||'✨'} {creation.type}</span>
        </div>
        {isOwn && <span className="badge badge-sky">You</span>}
      </div>

      <div className="creation-title">{creation.title}</div>

      {/* Drawing preview */}
      {creation.type === 'drawing' && creation.data_url && (
        <img src={creation.data_url} alt={creation.title} className="creation-img" />
      )}

      {/* Story — expandable */}
      {creation.type === 'story' && (
        <div className="creation-story-wrap">
          <p className={`creation-excerpt ${expanded ? 'expanded' : ''}`}>
            {expanded
              ? creation.content
              : creation.content?.slice(0, 180) + (isLong ? '...' : '')
            }
          </p>
          {isLong && (
            <button
              className="creation-read-more"
              onClick={() => setExpanded(e => !e)}
            >
              {expanded ? '▲ Show less' : '▼ Read more'}
            </button>
          )}
        </div>
      )}

      {/* Comic preview */}
      {creation.type === 'comic' && creation.panels && (
        <div className="creation-comic-preview">
          {(creation.panels||[]).slice(0,3).map((p,i) => (
            <div key={i} className="comic-mini-panel" style={{background: p.bg||'#FFF9C4'}}>
              <div style={{fontSize:24}}>{p.character}</div>
              {p.text && <div className="comic-mini-text">{p.text.slice(0,20)}{p.text.length>20?'...':''}</div>}
            </div>
          ))}
        </div>
      )}

      <div className="creation-footer">
        <button className={`creation-like ${creation.liked_by_me?'liked':''}`} onClick={() => onLike(creation.id)}>
          {creation.liked_by_me ? '❤️' : '🤍'} {creation.like_count||0}
        </button>
        <span className="creation-date">
          {new Date(creation.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 🏠 MAIN CREATIVE STUDIO PAGE
// ═══════════════════════════════════════════════════
const MODES = [
  { id:'gallery',  icon:'🖼️', label:'Gallery'  },
  { id:'draw',     icon:'🎨', label:'Draw'     },
  { id:'story',    icon:'📖', label:'Story'    },
  { id:'comic',    icon:'🗒️', label:'Comic'    },
];

export default function CreativeStudio() {
  const { user }  = useAuth();
  const [mode,    setMode]    = useState('gallery');
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [filter,  setFilter]  = useState('all');

  useEffect(() => { loadCreations(); }, []);

  const loadCreations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/creations');
      setCreations(data.data.creations || []);
    } catch { setCreations([]); }
    finally { setLoading(false); }
  };

  const handleSave = async (creation) => {
    setSaving(true);
    try {
      await api.post('/creations', creation);
      toast.success('Creation shared! 🎉');
      setMode('gallery');
      loadCreations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save');
    } finally { setSaving(false); }
  };

  const handleLike = async (id) => {
    try {
      await api.post(`/creations/${id}/like`);
      setCreations(prev => prev.map(c =>
        c.id === id
          ? { ...c, liked_by_me: !c.liked_by_me, like_count: c.liked_by_me ? c.like_count-1 : c.like_count+1 }
          : c
      ));
    } catch {}
  };

  const filtered = filter === 'all' ? creations : creations.filter(c => c.type === filter);

  return (
    <div className="studio-page page-enter">
      {/* Hero header */}
      <div className="studio-hero">
        <div className="studio-hero-content">
          <div className="studio-eyebrow">✨ Express Yourself</div>
          <h1 className="studio-title">Creative Studio</h1>
          <p className="studio-subtitle">Draw, write stories, make comics — share your imagination!</p>
        </div>
        <div className="studio-hero-emoji">🎨</div>
      </div>

      {/* Mode tabs */}
      <div className="studio-tabs-wrap">
        <div className="studio-tabs">
          {MODES.map(m => (
            <button
              key={m.id}
              className={`studio-tab ${mode===m.id?'active':''}`}
              onClick={() => setMode(m.id)}
            >
              <span className="studio-tab-icon">{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="studio-body">

        {/* Gallery */}
        {mode === 'gallery' && (
          <div className="studio-gallery-section">
            {/* Filter */}
            <div className="gallery-filters">
              {['all','drawing','story','comic'].map(f => (
                <button key={f}
                  className={`gallery-filter ${filter===f?'active':''}`}
                  onClick={() => setFilter(f)}>
                  {f==='all'?'🌟 All':f==='drawing'?'🎨 Drawings':f==='story'?'📖 Stories':'🗒️ Comics'}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="studio-loading">
                <span className="spinner spinner-lg" />
                <p>Loading creations...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="studio-empty">
                <div style={{fontSize:64}}>🎨</div>
                <h3>No creations yet!</h3>
                <p>Be the first to share something amazing.</p>
                <button className="btn btn-primary" onClick={() => setMode('draw')}>
                  Start Creating ✨
                </button>
              </div>
            ) : (
              <div className="creations-grid">
                {filtered.map(c => (
                  <CreationCard
                    key={c.id}
                    creation={c}
                    onLike={handleLike}
                    currentUserId={user?.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Drawing canvas */}
        {mode === 'draw' && (
          <div className="studio-tool-wrap">
            <div className="tool-header">
              <h2>🎨 Draw Something</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setMode('gallery')}>← Back</button>
            </div>
            <DrawingCanvas onSave={handleSave} />
          </div>
        )}

        {/* Story writer */}
        {mode === 'story' && (
          <div className="studio-tool-wrap">
            <div className="tool-header">
              <h2>📖 Write a Story</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setMode('gallery')}>← Back</button>
            </div>
            <StoryWriter onSave={handleSave} />
          </div>
        )}

        {/* Comic maker */}
        {mode === 'comic' && (
          <div className="studio-tool-wrap">
            <div className="tool-header">
              <h2>🗒️ Make a Comic</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setMode('gallery')}>← Back</button>
            </div>
            <ComicMaker onSave={handleSave} />
          </div>
        )}
      </div>

      {saving && (
        <div className="studio-saving-overlay">
          <span className="spinner spinner-lg" />
          <p>Sharing your creation... 🚀</p>
        </div>
      )}
    </div>
  );
}