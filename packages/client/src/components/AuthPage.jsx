import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { X } from 'lucide-react';
import './AuthPage.css';

export default function AuthPage({ onClose, showToast }) {
  const { loginUser, registerUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await loginUser(email, password);
        showToast?.('Welcome back!');
      } else {
        await registerUser(email, password);
        showToast?.('Account created successfully!');
      }
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="auth-card">
        {onClose && (
          <button className="auth-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        )}
        <div className="auth-brand">
          <span className="auth-logo">🌾</span>
          <h1>AgriWatch</h1>
          <p>Weather monitoring for field agents</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>{isLogin ? 'Sign in' : 'Create account'}</h2>

          {error && <div className="auth-error">{error}</div>}

          <label className="auth-label">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent@farm.co"
              required
            />
          </label>

          <label className="auth-label">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
          </label>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Loading...' : isLogin ? 'Sign in' : 'Create account'}
          </button>

          <p className="auth-switch">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
