const API_BASE = '/api';

// 401 interceptor — registered by AuthContext to trigger logout on expired tokens
let _onUnauthorized = null;
export function onUnauthorized(cb) { _onUnauthorized = cb; }

function getHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function handleResponse(res) {
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  if (!res.ok) {
    if (res.status === 401) _onUnauthorized?.();
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

// Auth
export const register = (email, password) =>
  fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password }),
  }).then(handleResponse);

export const login = (email, password) =>
  fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password }),
  }).then(handleResponse);

export const refreshToken = (token) =>
  fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: getHeaders(token),
  }).then(handleResponse);

// User preferences
export const getPreferences = (token) =>
  fetch(`${API_BASE}/user/preferences`, { headers: getHeaders(token) }).then(handleResponse);

export const updatePreferences = (token, prefs) =>
  fetch(`${API_BASE}/user/preferences`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(prefs),
  }).then(handleResponse);

export const deleteAccount = (token) =>
  fetch(`${API_BASE}/user/account`, {
    method: 'DELETE',
    headers: getHeaders(token),
  }).then(handleResponse);

// Saved locations
export const getLocations = (token) =>
  fetch(`${API_BASE}/locations`, { headers: getHeaders(token) }).then(handleResponse);

export const saveLocation = (token, location) =>
  fetch(`${API_BASE}/locations`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(location),
  }).then(handleResponse);

export const deleteLocation = (token, id) =>
  fetch(`${API_BASE}/locations/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  }).then(handleResponse);

// Weather
export const searchLocations = (query) =>
  fetch(`${API_BASE}/weather/search?q=${encodeURIComponent(query)}`).then(handleResponse);

export const getCurrentWeather = (lat, lon) =>
  fetch(`${API_BASE}/weather/current?lat=${lat}&lon=${lon}`).then(handleResponse);

export const getForecast = (lat, lon) =>
  fetch(`${API_BASE}/weather/forecast?lat=${lat}&lon=${lon}`).then(handleResponse);
