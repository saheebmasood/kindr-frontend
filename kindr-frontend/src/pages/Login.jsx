// src/pages/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.display_name}! 🎉`);
      navigate(user.role === 'parent' ? '/parent' : '/feed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page page-enter">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo"><span className="logo-k">K</span>indr<span className="logo-dot" /></div>
          <p>The safe social space for kids — loved by families everywhere.</p>
          <div className="auth-floaters">
            <span className="af">🦊</span><span className="af">🎨</span>
            <span className="af">🚀</span><span className="af">🌈</span>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Welcome back! 👋</h1>
            <p>Log in to your Kindr account</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label className="input-label">Email address</label>
              <input
                className={`input ${errors.email ? 'input-error' : ''}`}
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
              {errors.email && <span className="error-msg">{errors.email}</span>}
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                className={`input ${errors.password ? 'input-error' : ''}`}
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
              {errors.password && <span className="error-msg">{errors.password}</span>}
            </div>

            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" />Logging in...</> : '🚀 Log In'}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account? <Link to="/register">Sign up free →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
