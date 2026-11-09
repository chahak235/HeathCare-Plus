import { Router } from 'express';
import axios from 'axios';

const router = Router();

// Proxy for OpenStreetMap Nominatim (avoid CORS)
router.get('/geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'HealthcareAI/1.0'
        }
      }
    );
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Proxy for weather data
router.get('/weather', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const response = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&hourly=uv_index`
    );
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const geoRoutes = router;