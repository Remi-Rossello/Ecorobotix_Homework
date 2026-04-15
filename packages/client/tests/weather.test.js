import { describe, it, expect } from 'vitest';
import { getWeatherInfo, formatTemp, toFahrenheit, formatDay } from '../src/utils/weather.js';

describe('getWeatherInfo', () => {
  it('returns correct info for clear sky', () => {
    const info = getWeatherInfo(0);
    expect(info.description).toBe('Clear sky');
    expect(info.icon).toBe('☀️');
  });

  it('returns unknown for invalid code', () => {
    const info = getWeatherInfo(999);
    expect(info.description).toBe('Unknown');
  });

  it('handles thunderstorm code', () => {
    const info = getWeatherInfo(95);
    expect(info.description).toBe('Thunderstorm');
  });
});

describe('formatTemp', () => {
  it('formats celsius', () => {
    expect(formatTemp(20.3, 'celsius')).toBe('20°C');
  });

  it('formats fahrenheit', () => {
    expect(formatTemp(0, 'fahrenheit')).toBe('32°F');
  });

  it('rounds correctly', () => {
    expect(formatTemp(20.6, 'celsius')).toBe('21°C');
  });
});

describe('toFahrenheit', () => {
  it('converts 0°C to 32°F', () => {
    expect(toFahrenheit(0)).toBe(32);
  });

  it('converts 100°C to 212°F', () => {
    expect(toFahrenheit(100)).toBe(212);
  });
});

describe('formatDay', () => {
  it('returns "Today" for today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(formatDay(today)).toBe('Today');
  });

  it('returns "Tomorrow" for tomorrow', () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const tomorrow = d.toISOString().split('T')[0];
    expect(formatDay(tomorrow)).toBe('Tomorrow');
  });

  it('returns formatted date for other days', () => {
    // A date far in the future
    const result = formatDay('2099-06-15');
    expect(result).toContain('Jun');
    expect(result).toContain('15');
  });
});
