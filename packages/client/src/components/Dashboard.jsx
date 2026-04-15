import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import * as api from '../api.js';
import Header from './Header.jsx';
import SearchBar from './SearchBar.jsx';
import WeatherCard from './WeatherCard.jsx';
import ForecastPanel from './ForecastPanel.jsx';
import SavedLocationsTab from './SavedLocationsTab.jsx';
import SettingsTab from './SettingsTab.jsx';
import AuthPage from './AuthPage.jsx';
import Toast from './Toast.jsx';
import './Dashboard.css';

export default function Dashboard() {
  const { token, user, deleteAccount } = useAuth();
  const [activeTab, setActiveTab] = useState('search');
  const [showAuth, setShowAuth] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [toast, setToast] = useState(null);

  // Preferences (work for both guest and logged-in users)
  const [tempUnit, setTempUnit] = useState(() => {
    return localStorage.getItem('tempUnit') || 'celsius';
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Sync tempUnit to localStorage
  useEffect(() => {
    localStorage.setItem('tempUnit', tempUnit);
  }, [tempUnit]);

  // Reset tab when user logs out or deletes account
  useEffect(() => {
    if (!user && (activeTab === 'settings' || activeTab === 'saved')) {
      setActiveTab('search');
    }
  }, [user, activeTab]);

  // When user logs in, sync preferences from server
  useEffect(() => {
    if (user?.tempUnit) {
      setTempUnit(user.tempUnit);
    }
    if (user?.theme) {
      setTheme(user.theme);
    }
  }, [user?.tempUnit, user?.theme]);

  // Reset weather state when user changes (login/logout/switch accounts)
  const userId = user?.id ?? null;
  useEffect(() => {
    setSelectedLocation(null);
    setWeather(null);
    setForecast(null);
  }, [userId]);

  // Load saved locations when logged in
  useEffect(() => {
    if (token) {
      api.getLocations(token).then(setLocations).catch(console.error);
    } else {
      setLocations([]);
    }
  }, [token]);

  // Load default location weather when user/locations change
  useEffect(() => {
    if (user?.defaultLocationId && locations.length > 0 && !selectedLocation) {
      const defaultLoc = locations.find((l) => l.id === user.defaultLocationId);
      if (defaultLoc) {
        handleSelectLocation(defaultLoc);
      }
    }
  }, [user?.defaultLocationId, locations]);

  const handleSelectLocation = useCallback(async (location) => {
    setSelectedLocation(location);
    setLoadingWeather(true);
    setActiveTab('search');
    try {
      const [weatherData, forecastData] = await Promise.all([
        api.getCurrentWeather(location.lat, location.lon),
        api.getForecast(location.lat, location.lon),
      ]);
      setWeather(weatherData);
      setForecast(forecastData);
    } catch (err) {
      console.error('Failed to fetch weather:', err);
    } finally {
      setLoadingWeather(false);
    }
  }, []);

  const handleSaveLocation = async () => {
    if (!token) {
      setShowAuth(true);
      return;
    }
    if (!selectedLocation) return;
    try {
      const saved = await api.saveLocation(token, {
        name: selectedLocation.name,
        lat: selectedLocation.lat,
        lon: selectedLocation.lon,
        country: selectedLocation.country,
        state: selectedLocation.state,
      });
      setLocations((prev) => [saved, ...prev]);
    } catch (err) {
      console.error('Save failed:', err.message);
    }
  };

  const handleUpdateTempUnit = async (unit) => {
    setTempUnit(unit);
    if (token) {
      try {
        await api.updatePreferences(token, { tempUnit: unit });
      } catch (err) {
        console.error('Failed to sync temp unit:', err);
      }
    }
  };

  const handleUpdateTheme = async (newTheme) => {
    setTheme(newTheme);
    if (token) {
      try {
        await api.updatePreferences(token, { theme: newTheme });
      } catch (err) {
        console.error('Failed to sync theme:', err);
      }
    }
  };

  const isSaved = selectedLocation && locations.some(
    (l) => Math.abs(l.lat - selectedLocation.lat) < 0.001 && Math.abs(l.lon - selectedLocation.lon) < 0.001
  );

  return (
    <div className="dashboard-layout">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onShowAuth={() => setShowAuth(true)}
      />

      <main className="dashboard-main">
        {activeTab === 'search' && (
          <>
            <div className="dashboard-search-section">
              <SearchBar onSelect={handleSelectLocation} />
            </div>

            {loadingWeather && (
              <div className="dashboard-loading">
                <div className="spinner" />
                <span>Loading weather data...</span>
              </div>
            )}

            {!loadingWeather && !selectedLocation && (
              <div className="dashboard-empty">
                <span className="empty-icon">🌍</span>
                <h2>Search for a location</h2>
                <p>Find any location to view current weather and forecasts.</p>
              </div>
            )}

            {!loadingWeather && selectedLocation && weather && (
              <div className="dashboard-weather">
                <WeatherCard
                  location={selectedLocation}
                  weather={weather}
                  isSaved={isSaved}
                  onSave={handleSaveLocation}
                  tempUnit={tempUnit}
                  isGuest={!user}
                />
                <ForecastPanel forecast={forecast} tempUnit={tempUnit} />
              </div>
            )}
          </>
        )}

        {activeTab === 'saved' && (
          <SavedLocationsTab
            locations={locations}
            setLocations={setLocations}
            onSelectLocation={handleSelectLocation}
            isGuest={!user}
            onShowAuth={() => setShowAuth(true)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            tempUnit={tempUnit}
            onTempUnitChange={handleUpdateTempUnit}
            theme={theme}
            onThemeChange={handleUpdateTheme}
            onDeleteAccount={async () => {
              await deleteAccount();
              setToast('Account deleted successfully');
            }}
          />
        )}
      </main>

      {showAuth && <AuthPage onClose={() => setShowAuth(false)} showToast={setToast} />}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
