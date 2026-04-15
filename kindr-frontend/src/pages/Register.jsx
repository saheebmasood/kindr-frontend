// src/pages/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const AVATARS = [
  { emoji: '🦊', color: '#FFE5E5', label: 'Fox' },
  { emoji: '🐬', color: '#E5F5FF', label: 'Dolphin' },
  { emoji: '🦋', color: '#F5E5FF', label: 'Butterfly' },
  { emoji: '🦁', color: '#FFF5E5', label: 'Lion' },
  { emoji: '🐸', color: '#E5FFE9', label: 'Frog' },
  { emoji: '🦄', color: '#FFE5F5', label: 'Unicorn' },
  { emoji: '🐙', color: '#E5E5FF', label: 'Octopus' },
  { emoji: '🦖', color: '#F5FFE5', label: 'Dino' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [step, setStep]   = useState(1);
  const [role, setRole]   = useState('');
  const [form, setForm]   = useState({
    username: '', email: '', password: '', display_name: '',
    date_of_birth: '', avatar_emoji: '🦊', avatar_color: '#FFE5E5',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateDetails = () => {
    const e = {};
    if (!form.username || form.username.length < 3) e.username = 'Username: min 3 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(form.username))    e.username = 'Letters, numbers and _ only';
    if (!form.email)     e.email    = 'Email required';
    if (!form.password || form.password.length < 8) e.password = 'Min 8 characters';
    if (!/[A-Z]/.test(form.password)) e.password = 'Must contain uppercase letter';
    if (!/[0-9]/.test(form.password)) e.password = 'Must contain a number';
    if (!form.display_name) e.display_name = 'Display name required';
    if (role === 'child' && !form.date_of_birth) e.date_of_birth = 'Date of birth required';
    return e;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Build payload — only include date_of_birth for children
      const payload = {
        username:     form.username,
        email:        form.email,
        password:     form.password,
        display_name: form.display_name,
        avatar_emoji: form.avatar_emoji,
        avatar_color: form.avatar_color,
        role,
      };
      // Only add date_of_birth if role is child and value exists
      if (role === 'child' && form.date_of_birth) {
        payload.date_of_birth = form.date_of_birth;
      }

      const user = await register(payload);
      toast.success(`Welcome to Kindr, ${user.display_name}! 🎉`);
      navigate(role === 'parent' ? '/parent' : '/feed');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      const errs = err.response?.data?.errors;
      if (errs && errs.length) {
        toast.error(errs[0].msg || msg);
      } else {
        toast.error(msg);
      }
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page page-enter">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo"><span className="logo-k">K</span>indr<span className="logo-dot" /></div>
          <p>Join 50,000+ families on the safest social network for kids.</p>
          <div className="auth-floaters">
            <span className="af">🌟</span><span className="af">🎮</span>
            <span className="af">🎨</span><span className="af">🏆</span>
          </div>
          <div className="auth-steps">
            {[1,2,3].map(n => (
              <div key={n} className={`auth-step-dot ${step >= n ? 'active' : ''}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">

          {/* ── STEP 1: Choose role ── */}
          {step === 1 && (
            <>
              <div className="auth-header">
                <h1>Who's joining? 🌟</h1>
                <p>Tell us about your account type</p>
              </div>
              <div className="role-grid">
                <button className={`role-card ${role === 'child' ? 'selected' : ''}`} onClick={() => setRole('child')}>
                  <span className="role-icon">🧒</span>
                  <span className="role-title">I'm a Kid</span>
                  <span className="role-desc">Ages 6–13 · Join your crew, share adventures</span>
                </button>
                <button className={`role-card ${role === 'parent' ? 'selected' : ''}`} onClick={() => setRole('parent')}>
                  <span className="role-icon">👨‍👧</span>
                  <span className="role-title">I'm a Parent</span>
                  <span className="role-desc">Set up family account, manage your child's safety</span>
                </button>
              </div>
              <button className="btn btn-primary btn-full btn-lg" disabled={!role} onClick={() => setStep(2)}>
                Continue →
              </button>
            </>
          )}

          {/* ── STEP 2: Account details ── */}
          {step === 2 && (
            <>
              <div className="auth-header">
                <h1>Create your account ✨</h1>
                <p>{role === 'child' ? 'Your kid details' : 'Parent account details'}</p>
              </div>
              <form className="auth-form" onSubmit={e => {
                e.preventDefault();
                const errs = validateDetails();
                if (Object.keys(errs).length) { setErrors(errs); return; }
                setErrors({});
                setStep(3);
              }}>
                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">Username</label>
                    <input className={`input ${errors.username ? 'input-error' : ''}`}
                      placeholder="FoxyAlex123" value={form.username}
                      onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
                    {errors.username && <span className="error-msg">{errors.username}</span>}
                  </div>
                  <div className="input-group">
                    <label className="input-label">Display Name</label>
                    <input className={`input ${errors.display_name ? 'input-error' : ''}`}
                      placeholder="Alex" value={form.display_name}
                      onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} />
                    {errors.display_name && <span className="error-msg">{errors.display_name}</span>}
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">
                    Email address{' '}
                    {role === 'child' && <span style={{color:'var(--text3)', fontWeight:500}}>(parent's email for kids)</span>}
                  </label>
                  <input className={`input ${errors.email ? 'input-error' : ''}`}
                    type="email" placeholder="your@email.com" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  {errors.email && <span className="error-msg">{errors.email}</span>}
                </div>
                <div className="input-group">
                  <label className="input-label">Password</label>
                  <input className={`input ${errors.password ? 'input-error' : ''}`}
                    type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                  {errors.password && <span className="error-msg">{errors.password}</span>}
                </div>
                {role === 'child' && (
                  <div className="input-group">
                    <label className="input-label">Date of Birth</label>
                    <input className={`input ${errors.date_of_birth ? 'input-error' : ''}`}
                      type="date" value={form.date_of_birth}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} />
                    {errors.date_of_birth && <span className="error-msg">{errors.date_of_birth}</span>}
                  </div>
                )}
                <div className="auth-form-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                  <button type="submit" className="btn btn-primary btn-lg">Pick Avatar →</button>
                </div>
              </form>
            </>
          )}

          {/* ── STEP 3: Avatar ── */}
          {step === 3 && (
            <>
              <div className="auth-header">
                <h1>Choose your avatar! 🎨</h1>
                <p>This is how your friends will see you</p>
              </div>
              <div className="avatar-grid">
                {AVATARS.map(a => (
                  <button
                    key={a.emoji}
                    className={`avatar-choice ${form.avatar_emoji === a.emoji ? 'selected' : ''}`}
                    style={{ background: a.color }}
                    onClick={() => setForm(f => ({ ...f, avatar_emoji: a.emoji, avatar_color: a.color }))}
                  >
                    <span className="avatar-choice-emoji">{a.emoji}</span>
                    <span className="avatar-choice-label">{a.label}</span>
                  </button>
                ))}
              </div>
              <div className="auth-form-actions" style={{marginTop: 24}}>
                <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
                <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={loading}>
                  {loading ? <><span className="spinner" />Creating...</> : '🚀 Create Account!'}
                </button>
              </div>
            </>
          )}

          <div className="auth-footer">
            Already have an account? <Link to="/login">Log in →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
