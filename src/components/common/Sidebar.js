import Icon from './Icon';

function Sidebar({ navItems, active, setActive, fullName, role, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Icon name="logo" size={24} />
        </div>
        <div className="sidebar-title">GuestHouse</div>
        <div className="sidebar-role">{role}</div>
      </div>
      <div className="sidebar-user">
        <strong>{fullName}</strong>
        {role === 'Owner' ? 'Owner Portal' : 'Staff Portal'}
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => setActive(item.id)}
          >
            <span className="nav-icon">
              <Icon name={item.icon} size={20} />
            </span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}>
          <Icon name="logout" size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;