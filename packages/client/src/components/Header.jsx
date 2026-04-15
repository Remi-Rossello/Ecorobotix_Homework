import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Search, Bookmark, Settings, User, LogOut, ChevronDown, LogIn } from 'lucide-react';
import './Header.css';

const TABS = [
  { id: 'search', label: 'Search', icon: Search },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Header({ activeTab, onTabChange, onShowAuth }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-brand">
          <span className="brand-icon">🌾</span>
          <h1 className="brand-name">AgriWatch</h1>
        </div>
      </div>

      <nav className="header-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`header-tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => onTabChange(id)}
          >
            <Icon size={16} />
            <span className="tab-label">{label}</span>
          </button>
        ))}
      </nav>

      <div className="header-right">
        {user ? (
          <div className="account-menu" ref={menuRef}>
            <button className="account-btn" onClick={() => setMenuOpen(!menuOpen)}>
              <User size={18} />
              <span className="account-email">{user.email}</span>
              <ChevronDown size={14} />
            </button>
            {menuOpen && (
              <div className="account-dropdown">
                <div className="dropdown-email">{user.email}</div>
                <button
                  className="dropdown-item logout"
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="sign-in-btn" onClick={onShowAuth}>
            <LogIn size={16} />
            <span>Sign in</span>
          </button>
        )}
      </div>
    </header>
  );
}
