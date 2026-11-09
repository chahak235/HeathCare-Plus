import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../layout/GlassCard';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { 
  Thermometer, 
  Wind, 
  Cloud, 
  AlertTriangle, 
  Droplets,
  Sun,
  CloudRain,
  CloudSnow,
  MapPin,
  RefreshCw,
  Shield,
  Activity,
  Heart,
  Search,
  Navigation
} from 'lucide-react';

interface WeatherData {
  city: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  aqi: number;
  feelsLike: number;
  advisory: string;
  icon: React.ReactNode;
  color: string;
  healthRisks: string[];
}

export const WeatherNotifications: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Quick-switch shortcuts — real coordinates, fetched live from the API below.
  const presetCities = [
    { name: 'Mumbai, MH', lat: 19.0760, lon: 72.8777 },
    { name: 'Delhi', lat: 28.7041, lon: 77.1025 },
    { name: 'Bengaluru, KA', lat: 12.9716, lon: 77.5946 },
    { name: 'Chennai, TN', lat: 13.0827, lon: 80.2707 },
    { name: 'Kolkata, WB', lat: 22.5726, lon: 88.3639 },
    { name: 'Hyderabad, TG', lat: 17.3850, lon: 78.4867 }
  ];

  // Get weather icon based on condition
  const getWeatherIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) {
      return <Sun className="w-6 h-6 text-yellow-500" />;
    } else if (lowerCondition.includes('cloud')) {
      return <Cloud className="w-6 h-6 text-neutral-400" />;
    } else if (lowerCondition.includes('rain')) {
      return <CloudRain className="w-6 h-6 text-blue-500" />;
    } else if (lowerCondition.includes('snow')) {
      return <CloudSnow className="w-6 h-6 text-blue-300" />;
    }
    return <Thermometer className="w-6 h-6 text-orange-500" />;
  };

  // Get AQI color and label
  const getAQIInfo = (aqi: number) => {
    if (aqi <= 50) return { color: 'bg-green-500 text-white', iconColor: 'text-green-500', label: 'Good', risk: 'Low' };
    if (aqi <= 100) return { color: 'bg-yellow-500 text-white', iconColor: 'text-yellow-500', label: 'Moderate', risk: 'Low' };
    if (aqi <= 150) return { color: 'bg-orange-500 text-white', iconColor: 'text-orange-500', label: 'Sensitive', risk: 'Medium' };
    if (aqi <= 200) return { color: 'bg-red-500 text-white', iconColor: 'text-red-500', label: 'Unhealthy', risk: 'High' };
    return { color: 'bg-purple-600 text-white', iconColor: 'text-purple-600', label: 'Very Unhealthy', risk: 'Critical' };
  };

  // Get health advisory based on weather conditions
  const getHealthAdvisory = (temp: number, aqi: number, humidity: number, condition: string): string => {
    const advisories = [];

    if (temp > 35) {
      advisories.push('High temperature - Stay hydrated and avoid prolonged sun exposure');
    } else if (temp < 10) {
      advisories.push('Low temperature - Dress warmly and watch for cold symptoms');
    }

    if (aqi > 100) {
      advisories.push('Poor air quality - Limit outdoor activities, especially if you have respiratory conditions');
    }

    if (humidity > 70) {
      advisories.push('High humidity - May affect respiratory comfort, stay in well-ventilated areas');
    }

    if (humidity < 30) {
      advisories.push('Low humidity - May cause dry skin and respiratory irritation');
    }

    if (condition.toLowerCase().includes('rain')) {
      advisories.push('Rainy conditions - Be cautious of slippery surfaces and reduced visibility');
    }

    if (advisories.length === 0) {
      return 'Conditions are favorable for outdoor activities. Continue with your normal routine.';
    }

    return advisories.join('. ') + '.';
  };

  // Get health risks based on conditions
  const getHealthRisks = (temp: number, aqi: number, humidity: number): string[] => {
    const risks = [];

    if (aqi > 150) {
      risks.push('Respiratory distress');
      risks.push('Increased asthma risk');
    }

    if (temp > 35) {
      risks.push('Heat exhaustion');
      risks.push('Dehydration');
    }

    if (temp < 5) {
      risks.push('Cold stress');
      risks.push('Hypothermia risk');
    }

    if (humidity > 80) {
      risks.push('Mold sensitivity');
      risks.push('Respiratory discomfort');
    }

    if (aqi > 100 && temp > 30) {
      risks.push('Compounded respiratory stress');
    }

    return risks.length > 0 ? risks : ['Minimal health risks'];
  };

  // Get color based on conditions
  const getConditionColor = (temp: number, aqi: number): string => {
    if (aqi > 150 || temp > 38 || temp < 0) return 'from-red-50 to-orange-50 border-red-200 dark:from-red-900/20 dark:to-orange-900/20 dark:border-red-800/30';
    if (aqi > 100 || temp > 32 || temp < 10) return 'from-yellow-50 to-amber-50 border-yellow-200 dark:from-yellow-900/20 dark:to-amber-900/20 dark:border-yellow-800/30';
    return 'from-blue-50 to-cyan-50 border-blue-200 dark:from-blue-900/20 dark:to-cyan-900/20 dark:border-blue-800/30';
  };

  // WMO weather codes (used by Open-Meteo) -> a human condition label.
  // https://open-meteo.com/en/docs#weathervariables
  const wmoToCondition = (code: number): string => {
    if (code === 0) return 'Clear';
    if (code <= 2) return 'Partly Cloudy';
    if (code === 3) return 'Cloudy';
    if (code >= 45 && code <= 48) return 'Foggy';
    if (code >= 51 && code <= 67) return 'Light Rain';
    if (code >= 71 && code <= 77) return 'Snow';
    if (code >= 80 && code <= 82) return 'Rain';
    if (code >= 95) return 'Thunderstorm';
    return 'Clear';
  };

  // Reverse-geocode coordinates to a human-readable city name (free, keyless).
  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );
      if (!res.ok) throw new Error('reverse geocode failed');
      const data = await res.json();
      const city = data.city || data.locality || data.principalSubdivision;
      const region = data.principalSubdivision;
      return city ? (region && region !== city ? `${city}, ${region}` : city) : 'Your Location';
    } catch {
      return 'Your Location';
    }
  };

  // Fetch real current weather + air quality from Open-Meteo (free, no API key).
  const fetchWeatherData = async (lat: number, lon: number, cityNameHint?: string) => {
    setLoading(true);

    try {
      const [weatherRes, aqiRes, cityName] = await Promise.all([
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code`
        ).then((r) => r.json()),
        fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`
        ).then((r) => r.json()),
        cityNameHint ? Promise.resolve(cityNameHint) : reverseGeocode(lat, lon),
      ]);

      const current = weatherRes.current;
      const temperature = Math.round(current.temperature_2m);
      const feelsLike = Math.round(current.apparent_temperature);
      const humidity = Math.round(current.relative_humidity_2m);
      const windSpeed = Math.round(current.wind_speed_10m);
      const condition = wmoToCondition(current.weather_code);
      const aqi = Math.round(aqiRes?.current?.us_aqi ?? 50);

      const weatherIcon = getWeatherIcon(condition);
      const advisory = getHealthAdvisory(temperature, aqi, humidity, condition);
      const healthRisks = getHealthRisks(temperature, aqi, humidity);
      const color = getConditionColor(temperature, aqi);

      setWeatherData({
        city: cityName,
        temperature,
        condition,
        humidity,
        windSpeed,
        aqi,
        feelsLike,
        advisory,
        icon: weatherIcon,
        color,
        healthRisks,
      });
    } catch (err) {
      console.error('Failed to fetch live weather/air quality data:', err);
      setLocationError('Weather service is unavailable right now. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  // Get the user's real location, falling back to Delhi if denied/unsupported.
  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lon: longitude });
            fetchWeatherData(latitude, longitude);
          },
          (error) => {
            console.warn('Location permission denied, using default city:', error.message);
            setLocationError('Enable location access for weather at your exact location.');
            const defaultCity = presetCities[0];
            setUserLocation({ lat: defaultCity.lat, lon: defaultCity.lon });
            fetchWeatherData(defaultCity.lat, defaultCity.lon, defaultCity.name);
          }
        );
      } else {
        setLocationError('Geolocation not supported by this browser.');
        const defaultCity = presetCities[0];
        setUserLocation({ lat: defaultCity.lat, lon: defaultCity.lon });
        fetchWeatherData(defaultCity.lat, defaultCity.lon, defaultCity.name);
      }
    };

    getUserLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle city selection
  const handleCitySelect = (city: typeof presetCities[0]) => {
    setUserLocation({ lat: city.lat, lon: city.lon });
    fetchWeatherData(city.lat, city.lon, city.name);
  };

  // Refresh weather data for whatever location is currently shown
  const handleRefresh = () => {
    if (userLocation) {
      fetchWeatherData(userLocation.lat, userLocation.lon, weatherData?.city);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setLocationError(null);
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=1`);
      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        setUserLocation({ lat: result.latitude, lon: result.longitude });
        const nameHint = result.admin1 && result.admin1 !== result.name ? `${result.name}, ${result.admin1}` : result.name;
        fetchWeatherData(result.latitude, result.longitude, nameHint);
        setSearchQuery('');
      } else {
        setLocationError(`Could not find city: ${searchQuery}`);
      }
    } catch (err) {
      console.error('Geocoding failed:', err);
      setLocationError('Failed to search for city. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCurrentLocation = () => {
    setLocationError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lon: longitude });
          fetchWeatherData(latitude, longitude);
        },
        (error) => {
          setLocationError('Enable location access for weather at your exact location.');
        }
      );
    } else {
      setLocationError('Geolocation not supported by this browser.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <GlassCard className="p-8">
          <div className="flex items-center justify-center space-x-4">
            <RefreshCw className="w-6 h-6 text-primary-600 animate-spin" />
            <p className="text-neutral-600 dark:text-neutral-400">
              Loading weather data and health insights...
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (!weatherData) return null;

  const aqiInfo = getAQIInfo(weatherData.aqi);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Weather & Health Advisory
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Real-time conditions with personalized health guidance
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={handleRefresh}
          className="text-primary-600 dark:text-primary-400"
        >
          Refresh
        </Button>
      </div>

      {locationError && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">{locationError}</p>
        </div>
      )}

      {/* Main Weather Card */}
      <GlassCard className={`p-8 bg-gradient-to-br ${weatherData.color} border shadow-xl mb-8 rounded-3xl overflow-hidden`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Conditions */}
          <div className="lg:col-span-2 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-white/60 dark:bg-neutral-800/60 shadow-sm backdrop-blur-md border border-white/40 dark:border-neutral-700/40">
                  {weatherData.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-5 h-5 text-primary-600" />
                    <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                      {weatherData.city}
                    </h3>
                  </div>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
                    Updated just now
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-6xl font-black text-neutral-900 dark:text-white tracking-tighter drop-shadow-sm">
                  {weatherData.temperature}°
                </div>
                <p className="text-neutral-600 dark:text-neutral-300 font-medium mt-1">
                  Feels like {weatherData.feelsLike}°
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-5 rounded-2xl bg-white/60 dark:bg-neutral-900/40 border border-white/50 dark:border-neutral-700/50 shadow-sm hover:scale-105 transition-transform duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <Wind className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">Wind</span>
                </div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {weatherData.windSpeed} <span className="text-sm font-medium text-neutral-500">km/h</span>
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/60 dark:bg-neutral-900/40 border border-white/50 dark:border-neutral-700/50 shadow-sm hover:scale-105 transition-transform duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <Droplets className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">Humidity</span>
                </div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {weatherData.humidity}%
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/60 dark:bg-neutral-900/40 border border-white/50 dark:border-neutral-700/50 shadow-sm hover:scale-105 transition-transform duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <Cloud className="w-5 h-5 text-neutral-500" />
                  <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">Condition</span>
                </div>
                <p className="text-lg font-bold text-neutral-900 dark:text-white leading-tight">
                  {weatherData.condition}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/60 dark:bg-neutral-900/40 border border-white/50 dark:border-neutral-700/50 shadow-sm hover:scale-105 transition-transform duration-300 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className={`w-5 h-5 ${aqiInfo.iconColor}`} />
                  <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">Air Quality</span>
                </div>
                <div className="flex flex-col gap-1 items-start mt-1">
                  <Badge className={`${aqiInfo.color} font-bold shadow-sm`}>
                    {weatherData.aqi} AQI
                  </Badge>
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">{aqiInfo.label}</span>
                </div>
              </div>
            </div>

            {/* Health Advisory */}
            <div className="p-5 rounded-2xl bg-white/80 dark:bg-neutral-800/80 border border-white/50 dark:border-neutral-700/50 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <h4 className="font-bold text-neutral-900 dark:text-white text-lg">Health Advisory</h4>
              </div>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                {weatherData.advisory}
              </p>
            </div>
          </div>

          {/* Health Risks & Quick Actions */}
          <div className="space-y-6">
            {/* Health Risks */}
            <div className="p-5 rounded-2xl bg-white/80 dark:bg-neutral-800/80 border border-white/50 dark:border-neutral-700/50 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Heart className="w-5 h-5 text-red-600" />
                </div>
                <h4 className="font-bold text-neutral-900 dark:text-white text-lg">Potential Risks</h4>
              </div>
              <ul className="space-y-3">
                {weatherData.healthRisks.map((risk, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm font-medium">
                    <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${
                      risk.includes('Critical') || risk.includes('High') || risk.includes('exhaustion') || risk.includes('distress') ? 'bg-red-500' :
                      risk.includes('Medium') || risk.includes('stress') || risk.includes('discomfort') ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <span className="text-neutral-700 dark:text-neutral-300">{risk}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Actions */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border border-primary-100/50 dark:border-primary-800/30 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <Shield className="w-5 h-5 text-primary-600" />
                </div>
                <h4 className="font-bold text-neutral-900 dark:text-white text-lg">Actions</h4>
              </div>
              <div className="space-y-3 font-medium">
                {weatherData.aqi > 100 && (
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 flex items-start gap-2">
                    <span className="text-primary-500">•</span> Limit outdoor activities
                  </p>
                )}
                {weatherData.temperature > 30 && (
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 flex items-start gap-2">
                    <span className="text-primary-500">•</span> Stay hydrated
                  </p>
                )}
                {weatherData.humidity > 70 && (
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 flex items-start gap-2">
                    <span className="text-primary-500">•</span> Use dehumidifier if needed
                  </p>
                )}
                <p className="text-sm text-neutral-700 dark:text-neutral-300 flex items-start gap-2">
                  <span className="text-primary-500">•</span> Check in with at-risk family
                </p>
              </div>
            </div>

            {/* City Selector */}
            <div className="p-5 rounded-2xl bg-white/80 dark:bg-neutral-800/80 border border-white/50 dark:border-neutral-700/50 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-neutral-900 dark:text-white">Location</h4>
                <button 
                  onClick={handleCurrentLocation}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  title="Use My Location"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  My Location
                </button>
              </div>

              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all dark:text-white"
                />
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button type="submit" className="hidden" disabled={isSearching}>Search</button>
              </form>

              <div className="grid grid-cols-2 gap-3 mt-1">
                {presetCities.map((city) => (
                  <button
                    key={city.name}
                    onClick={() => handleCitySelect(city)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      weatherData.city === city.name
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30 scale-[1.02]'
                        : 'bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:scale-[1.02] border border-transparent hover:border-neutral-200 dark:hover:border-neutral-600'
                    }`}
                  >
                    {city.name.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Weather Health Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <div className="flex items-center gap-2 mb-2">
            <Sun className="w-4 h-4 text-green-600" />
            <h5 className="font-medium text-neutral-900 dark:text-white">Sun Safety</h5>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            UV index may be high. Use SPF 30+ sunscreen if outdoors.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-4 h-4 text-blue-600" />
            <h5 className="font-medium text-neutral-900 dark:text-white">Hydration</h5>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Drink at least 8 glasses of water daily in current conditions.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-purple-600" />
            <h5 className="font-medium text-neutral-900 dark:text-white">Activity Level</h5>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {weatherData.aqi < 100 ? 'Good for outdoor exercise' : 'Consider indoor activities'}
          </p>
        </div>
      </div>
    </div>
  );
};