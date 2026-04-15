import { getWeatherInfo, formatTemp } from '../utils/weather.js';
import { Droplets, Wind, Thermometer, Eye, BookmarkPlus, BookmarkCheck, Lock } from 'lucide-react';
import './WeatherCard.css';

export default function WeatherCard({ location, weather, isSaved, onSave, tempUnit, isGuest }) {
  if (!weather?.current) return null;

  const { current } = weather;
  const info = getWeatherInfo(current.weather_code);

  return (
    <div className="weather-card">
      <div className="weather-card-header">
        <div>
          <h2 className="weather-location">{location.name}</h2>
          <p className="weather-region">
            {[location.state, location.country].filter(Boolean).join(', ')}
          </p>
        </div>
        {isGuest ? (
          <button className="save-btn guest" onClick={onSave} title="Sign in to save locations">
            <Lock size={16} />
            Sign in to save
          </button>
        ) : (
          <button
            className={`save-btn ${isSaved ? 'saved' : ''}`}
            onClick={onSave}
            title={isSaved ? 'Already saved' : 'Save location'}
            disabled={isSaved}
          >
            {isSaved ? <BookmarkCheck size={20} /> : <BookmarkPlus size={20} />}
            {isSaved ? 'Saved' : 'Save'}
          </button>
        )}
      </div>

      <div className="weather-main">
        <span className="weather-emoji">{info.icon}</span>
        <div className="weather-temp-block">
          <span className="weather-temp">{formatTemp(current.temperature_2m, tempUnit)}</span>
          <span className="weather-desc">{info.description}</span>
        </div>
      </div>

      <div className="weather-details">
        <div className="detail">
          <Thermometer size={16} />
          <span>Feels like {formatTemp(current.apparent_temperature, tempUnit)}</span>
        </div>
        <div className="detail">
          <Droplets size={16} />
          <span>{current.relative_humidity_2m}% humidity</span>
        </div>
        <div className="detail">
          <Wind size={16} />
          <span>{Math.round(current.wind_speed_10m)} km/h wind</span>
        </div>
        <div className="detail">
          <Eye size={16} />
          <span>{current.precipitation} mm precip.</span>
        </div>
      </div>
    </div>
  );
}
