import { useState, useEffect } from 'react';
import Login from './pages/Login';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import OwnerDashboard from './pages/OwnerDashboard';

function App() {
  const [user, setUser] = useState(null);

  // On page load, restore session if tokens exist
  useEffect(() => {
    const token    = localStorage.getItem('access_token');
    const role     = localStorage.getItem('user_role');
    const fullName = localStorage.getItem('user_full_name');
    const username = localStorage.getItem('username');
    if (token && role) setUser({ role, fullName, username });
  }, []);

  const handleLoginSuccess = ({ role, fullName, username }) => {
    localStorage.setItem('username', username);
    setUser({ role, fullName, username });
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  // Not logged in
  if (!user) return <Login onLoginSuccess={handleLoginSuccess} />;

  // Route to correct dashboard by role
  const role = user.role?.toUpperCase();

  if (role === 'RECEPTIONIST') return <ReceptionistDashboard user={user} onLogout={handleLogout} />;
  if (role === 'MANAGER')      return <ManagerDashboard      user={user} onLogout={handleLogout} />;
  if (role === 'OWNER')        return <OwnerDashboard        user={user} onLogout={handleLogout} />;

  // Unknown role fallback
  return (
    <div style={{ padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
      <p>Unknown role: <strong>{user.role}</strong></p>
      <button onClick={handleLogout} style={{ marginTop: '1rem', cursor: 'pointer' }}>Logout</button>
    </div>
  );
}

export default App;