import { useState } from 'react';
import { Sun, Moon, Thermometer, Trash2 } from 'lucide-react';
import './SettingsTab.css';

export default function SettingsTab({ tempUnit, onTempUnitChange, theme, onThemeChange, onDeleteAccount }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDeleteAccount();
    } catch {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="settings-tab">
      <h2 className="settings-title">Settings</h2>

      <div className="settings-card">
        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-icon">
              <Thermometer size={20} />
            </div>
            <div>
              <span className="setting-name">Temperature Unit</span>
              <span className="setting-desc">Choose how temperatures are displayed</span>
            </div>
          </div>
          <div className="setting-toggle">
            <button
              className={`toggle-btn ${tempUnit === 'celsius' ? 'active' : ''}`}
              onClick={() => onTempUnitChange('celsius')}
            >
              °C
            </button>
            <button
              className={`toggle-btn ${tempUnit === 'fahrenheit' ? 'active' : ''}`}
              onClick={() => onTempUnitChange('fahrenheit')}
            >
              °F
            </button>
          </div>
        </div>

        <div className="setting-divider" />

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-icon">
              {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
            </div>
            <div>
              <span className="setting-name">Appearance</span>
              <span className="setting-desc">Switch between light and dark mode</span>
            </div>
          </div>
          <div className="setting-toggle">
            <button
              className={`toggle-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => onThemeChange('light')}
            >
              <Sun size={14} />
              Light
            </button>
            <button
              className={`toggle-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => onThemeChange('dark')}
            >
              <Moon size={14} />
              Dark
            </button>
          </div>
        </div>
      </div>

      <div className="settings-card danger-card">
        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-icon danger-icon">
              <Trash2 size={20} />
            </div>
            <div>
              <span className="setting-name">Delete Account</span>
              <span className="setting-desc">Permanently delete your account and all saved data</span>
            </div>
          </div>
          {!showConfirm ? (
            <button className="delete-account-btn" onClick={() => setShowConfirm(true)}>
              Delete
            </button>
          ) : (
            <div className="confirm-actions">
              <button className="confirm-cancel-btn" onClick={() => setShowConfirm(false)} disabled={deleting}>
                Cancel
              </button>
              <button className="confirm-delete-btn" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Confirm'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
