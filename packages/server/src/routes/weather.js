import { Router } from 'express';

const router = Router();

// Proxy search to photon.komoot.io to avoid CORS issues
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' });
  }

  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lang=en`;
    const response = await fetch(url);
    const data = await response.json();

    // Transform to a simpler format
    const results = data.features.map((f) => ({
      name: f.properties.name,
      country: f.properties.country,
      state: f.properties.state,
      city: f.properties.city,
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      type: f.properties.type,
    }));

    res.json(results);
  } catch (err) {
    console.error('Photon search error:', err.message);
    res.status(502).json({ error: 'Failed to fetch search results' });
  }
});

// Current weather from Open-Meteo
router.get('/current', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'lat and lon are required' });
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Open-Meteo current error:', err.message);
    res.status(502).json({ error: 'Failed to fetch current weather' });
  }
});

// 7-day forecast from Open-Meteo
router.get('/forecast', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'lat and lon are required' });
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Open-Meteo forecast error:', err.message);
    res.status(502).json({ error: 'Failed to fetch forecast' });
  }
});

export default router;
