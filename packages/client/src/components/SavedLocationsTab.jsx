import { useAuth } from '../context/AuthContext.jsx';
import { MapPin, Star, Trash2, LogIn } from 'lucide-react';
import * as api from '../api.js';
import './SavedLocationsTab.css';

export default function SavedLocationsTab({ locations, setLocations, onSelectLocation, isGuest, onShowAuth }) {
  const { token, user, updateUser } = useAuth();

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await api.deleteLocation(token, id);
      setLocations((prev) => prev.filter((l) => l.id !== id));
      if (user?.defaultLocationId === id) {
        updateUser({ defaultLocationId: null });
      }
    } catch (err) {
      console.error('Failed to delete location', err);
    }
  };

  const handleSetDefault = async (e, id) => {
    e.stopPropagation();
    try {
      const newDefault = user?.defaultLocationId === id ? null : id;
      await api.updatePreferences(token, { defaultLocationId: newDefault });
      updateUser({ defaultLocationId: newDefault });
    } catch (err) {
      console.error('Failed to set default', err);
    }
  };

  if (isGuest) {
    return (
      <div className="saved-empty">
        <span className="saved-empty-icon">🔒</span>
        <h2>Sign in to save locations</h2>
        <p>Create an account to save your favorite locations and access them anytime.</p>
        <button className="saved-signin-btn" onClick={onShowAuth}>
          <LogIn size={18} />
          Sign in
        </button>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="saved-empty">
        <span className="saved-empty-icon">📍</span>
        <h2>No saved locations</h2>
        <p>Search for locations and save them to quickly access their weather.</p>
      </div>
    );
  }

  return (
    <div className="saved-tab">
      <h2 className="saved-title">Saved Locations</h2>
      <div className="saved-grid">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="saved-card"
            onClick={() => onSelectLocation(loc)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelectLocation(loc)}
          >
            <div className="saved-card-top">
              <MapPin size={18} className="saved-card-pin" />
              <div className="saved-card-actions">
                <button
                  className={`saved-card-action ${user?.defaultLocationId === loc.id ? 'is-default' : ''}`}
                  onClick={(e) => handleSetDefault(e, loc.id)}
                  title={user?.defaultLocationId === loc.id ? 'Remove default' : 'Set as default'}
                >
                  <Star size={14} fill={user?.defaultLocationId === loc.id ? 'currentColor' : 'none'} />
                </button>
                <button
                  className="saved-card-action delete"
                  onClick={(e) => handleDelete(e, loc.id)}
                  title="Remove"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <h3 className="saved-card-name">{loc.name}</h3>
            <p className="saved-card-region">
              {[loc.state, loc.country].filter(Boolean).join(', ')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
