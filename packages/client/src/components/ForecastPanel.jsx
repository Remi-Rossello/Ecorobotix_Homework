import { useState } from 'react';
import { getWeatherInfo, formatTemp, formatDay } from '../utils/weather.js';
import { ChevronDown, Sunrise, Sunset, Wind, Droplets, Sun } from 'lucide-react';
import './ForecastPanel.css';

export default function ForecastPanel({ forecast, tempUnit }) {
  const [expandedDay, setExpandedDay] = useState(null);

  if (!forecast?.daily) return null;

  const { daily } = forecast;

  const toggleDay = (date) => {
    setExpandedDay(expandedDay === date ? null : date);
  };

  return (
    <div className="forecast-panel">
      <h3 className="forecast-title">7-Day Forecast</h3>
      <div className="forecast-list">
        {daily.time.map((date, i) => {
          const info = getWeatherInfo(daily.weather_code[i]);
          const isExpanded = expandedDay === date;
          return (
            <div key={date} className={`forecast-item ${isExpanded ? 'expanded' : ''}`}>
              <button className="forecast-row" onClick={() => toggleDay(date)}>
                <span className="forecast-day">{formatDay(date)}</span>
                <span className="forecast-icon">{info.icon}</span>
                <span className="forecast-desc">{info.description}</span>
                <span className="forecast-temps">
                  <span className="temp-high"><span className="temp-label">max</span> {formatTemp(daily.temperature_2m_max[i], tempUnit)}</span>
                  <span className="temp-low"><span className="temp-label">min</span> {formatTemp(daily.temperature_2m_min[i], tempUnit)}</span>
                </span>
                <span className="forecast-rain">
                  {daily.precipitation_sum[i] > 0 ? `${daily.precipitation_sum[i]} mm` : '—'}
                </span>
                <ChevronDown size={14} className={`forecast-chevron ${isExpanded ? 'rotated' : ''}`} />
              </button>

              {isExpanded && (
                <div className="forecast-details">
                  <div className="forecast-detail-grid">
                    {daily.sunrise && (
                      <div className="forecast-detail">
                        <Sunrise size={15} />
                        <span className="detail-label">Sunrise</span>
                        <span className="detail-value">
                          {new Date(daily.sunrise[i]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                    {daily.sunset && (
                      <div className="forecast-detail">
                        <Sunset size={15} />
                        <span className="detail-label">Sunset</span>
                        <span className="detail-value">
                          {new Date(daily.sunset[i]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                    {daily.uv_index_max && (
                      <div className="forecast-detail">
                        <Sun size={15} />
                        <span className="detail-label">UV Index</span>
                        <span className="detail-value">{daily.uv_index_max[i]}</span>
                      </div>
                    )}
                    <div className="forecast-detail">
                      <Wind size={15} />
                      <span className="detail-label">Max Wind</span>
                      <span className="detail-value">{Math.round(daily.wind_speed_10m_max[i])} km/h</span>
                    </div>
                    {daily.precipitation_probability_max && (
                      <div className="forecast-detail">
                        <Droplets size={15} />
                        <span className="detail-label">Rain Chance</span>
                        <span className="detail-value">{daily.precipitation_probability_max[i]}%</span>
                      </div>
                    )}
                    <div className="forecast-detail">
                      <Droplets size={15} />
                      <span className="detail-label">Precipitation</span>
                      <span className="detail-value">{daily.precipitation_sum[i]} mm</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
