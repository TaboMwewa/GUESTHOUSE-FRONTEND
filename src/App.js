import { useState, useEffect } from 'react';
import Login from './pages/Login';

function App() {
  const [user, setUser] = useState(null);

  // On page load, check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    const fullName = localStorage.getItem('user_full_name');
    const username = localStorage.getItem('username');

    if (token && role) {
      setUser({ role, fullName, username });
    }
  }, []);

  const handleLoginSuccess = ({ role, fullName, username }) => {
    localStorage.setItem('username', username);
    setUser({ role, fullName, username });
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  // Not logged in — show Login page
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Logged in — show role-specific placeholder (replace with real dashboards later)
  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
      <h2>Welcome, {user.fullName}!</h2>
      <p style={{ color: '#8a7f72', marginTop: '0.5rem' }}>
        Role: <strong>{user.role}</strong>
      </p>
      <p style={{ marginTop: '1rem', color: '#444' }}>
        ✅ Login successful. Your dashboard will go here.
      </p>
      <button
        onClick={handleLogout}
        style={{
          marginTop: '1.5rem',
          padding: '0.6rem 1.4rem',
          background: '#1a1612',
          color: '#d4b483',
          border: 'none',
          borderRadius: 3,
          cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '0.9rem',
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default App;
