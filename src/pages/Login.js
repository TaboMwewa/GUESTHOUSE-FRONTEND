import { useState, useEffect } from 'react';
import api from '../api/api';
import Icon from '../components/common/Icon';
import './Login.css';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [coldStart, setColdStart] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Sparklers (background particles)
  useEffect(() => {
    const page = document.querySelector('.login-page');
    if (!page) return;

    for (let i = 0; i < 50; i++) {
      const sparkle = document.createElement('div');
      sparkle.classList.add('sparkle');
      sparkle.style.left = Math.random() * 100 + '%';
      sparkle.style.animationDelay = Math.random() * 8 + 's';
      sparkle.style.animationDuration = 4 + Math.random() * 6 + 's';
      sparkle.style.width = Math.random() * 6 + 2 + 'px';
      sparkle.style.height = sparkle.style.width;
      page.appendChild(sparkle);
    }

    return () => {
      const sparkles = document.querySelectorAll('.sparkle');
      sparkles.forEach(s => s.remove());
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setColdStart(false);

    const coldStartTimer = setTimeout(() => setColdStart(true), 5000);

    try {
      const tokenRes = await api.post('/token/', { username, password });
      localStorage.setItem('access_token', tokenRes.data.access);
      localStorage.setItem('refresh_token', tokenRes.data.refresh);

      const usersRes = await api.get('/users/');
      const users = usersRes.data.results || usersRes.data;
      const currentUser = users.find((u) => u.username === username);

      if (!currentUser) throw new Error('Could not find user profile.');

      const role = currentUser.userprofile.role;
      const fullName = currentUser.userprofile.full_name;

      localStorage.setItem('user_role', role);
      localStorage.setItem('user_full_name', fullName);
      localStorage.setItem('user_id', currentUser.id);

      if (onLoginSuccess) {
        onLoginSuccess({ role, fullName, username });
      }
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setError('Request timed out. The server may be waking up — please try again.');
      } else if (err.response?.status === 401) {
        setError('Incorrect username or password. Please try again.');
      } else if (err.message === 'Could not find user profile.') {
        setError('Login succeeded but user profile could not be loaded. Contact support.');
      } else {
        setError('Something went wrong. Please check your connection and try again.');
      }
    } finally {
      clearTimeout(coldStartTimer);
      setLoading(false);
      setColdStart(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left panel – guesthouse photo */}
        <div className="brand-panel">
          <div className="brand-overlay">
            <div className="brand-logo">
              <Icon name="logo" size={40} color="white" />
            </div>
            <h1 className="brand-title">GuestHouse</h1>
            <p className="brand-tagline">Luxury & Comfort</p>
          </div>
        </div>

        {/* Right panel – login form */}
        <div className="form-panel">
          <div className="form-header">
            <h2>Welcome back</h2>
            <p>Sign in to your account</p>
          </div>

          {error && (
            <div className="alert-error">
              <Icon name="alert-circle" size={16} />
              {error}
            </div>
          )}

          {coldStart && !error && (
            <div className="alert-warning">
              <Icon name="clock" size={16} />
              Server is waking up — this can take up to 60 seconds. Please wait…
            </div>
          )}

          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">
                <Icon name="user" size={12} />
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <Icon name="lock" size={12} />
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <button type="button" className="forgot-link" onClick={() => alert('Contact your administrator to reset password.')}>
                Forgot password?
              </button>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <span className="btn-inner">
                  <span className="spinner" />
                  Signing in…
                </span>
              ) : (
                <>
                  <Icon name="log-in" size={16} />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <Icon name="shield" size={12} />
            Authorised staff only
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;