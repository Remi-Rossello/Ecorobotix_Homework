import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { MapPin, Trash2, Star, Settings, X } from 'lucide-react';
import * as api from '../api.js';
import './Sidebar.css';

export default function Sidebar({ open, onClose, onSelectLocation, locations, setLocations }) {
  const { token, user, updateUser } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [tempUnit, setTempUnit] = useState(user?.tempUnit || 'celsius');

  useEffect(() => {
    setTempUnit(user?.tempUnit || 'celsius');
  }, [user?.tempUnit]);

  const handleDelete = async (id) => {
    try {
      await api.deleteLocation(token, id);
      setLocations((prev) => prev.filter((l) => l.id !== id));
      // If deleted location was default, clear it
      if (user?.defaultLocationId === id) {
        updateUser({ defaultLocationId: null });
      }
    } catch (err) {
      console.error('Failed to delete location', err);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const newDefault = user?.defaultLocationId === id ? null : id;
      await api.updatePreferences(token, { defaultLocationId: newDefault });
      updateUser({ defaultLocationId: newDefault });
    } catch (err) {
      console.error('Failed to set default', err);
    }
  };

  const handleTempUnitChange = async (unit) => {
    try {
      await api.updatePreferences(token, { tempUnit: unit });
      setTempUnit(unit);
      updateUser({ tempUnit: unit });
    } catch (err) {
      console.error('Failed to update preferences', err);
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h2>Saved Locations</h2>
          <button className="sidebar-close" onClick={onClose} aria-label="Close sidebar">
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-locations">
          {locations.length === 0 ? (
            <p className="sidebar-empty">No saved locations yet. Search and save locations from the dashboard.</p>
          ) : (
            locations.map((loc) => (
              <div key={loc.id} className="location-item">
                <button
                  className="location-info"
                  onClick={() => {
                    onSelectLocation(loc);
                    onClose();
                  }}
                >
                  <MapPin size={16} className="location-pin" />
                  <div>
                    <span className="location-name">{loc.name}</span>
                    {loc.country && <span className="location-country">{loc.state ? `${loc.state}, ` : ''}{loc.country}</span>}
                  </div>
                </button>
                <div className="location-actions">
                  <button
                    className={`action-btn ${user?.defaultLocationId === loc.id ? 'is-default' : ''}`}
                    onClick={() => handleSetDefault(loc.id)}
                    title={user?.defaultLocationId === loc.id ? 'Remove as default' : 'Set as default'}
                  >
                    <Star size={14} fill={user?.defaultLocationId === loc.id ? '#f59e0b' : 'none'} />
                  </button>
                  <button className="action-btn delete" onClick={() => handleDelete(loc.id)} title="Remove">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="sidebar-footer">
          <button className="settings-toggle" onClick={() => setShowSettings(!showSettings)}>
            <Settings size={16} />
            Settings
          </button>

          {showSettings && (
            <div className="settings-panel">
              <label className="setting-label">Temperature Unit</label>
              <div className="unit-toggle">
                <button
                  className={`unit-btn ${tempUnit === 'celsius' ? 'active' : ''}`}
                  onClick={() => handleTempUnitChange('celsius')}
                >
                  °C
                </button>
                <button
                  className={`unit-btn ${tempUnit === 'fahrenheit' ? 'active' : ''}`}
                  onClick={() => handleTempUnitChange('fahrenheit')}
                >
                  °F
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
