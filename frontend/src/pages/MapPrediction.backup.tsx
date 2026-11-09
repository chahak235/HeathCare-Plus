import React, { useState, useEffect, useCallback } from 'react';
import { 
  MapPin, 
  Navigation, 
  Thermometer, 
  Wind, 
  Droplets, 
  AlertTriangle,
  Heart,
  Building,
  Activity,
  Shield,
  Clock,
  Users,
  Phone,
  CheckCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { GlassCard } from '../components/layout/GlassCard';

// Google Maps API types
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface Location {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  country?: string;
}

interface Hospital {
  id: string;
  name: string;
  address: string;
  location: Location;
  distance: number;
  rating: number;
  specialties: string[];
  emergency: boolean;
  phone: string;
  bedsAvailable?: number;
  waitTime?: string;
}

interface HealthRisk {
  level: 'low' | 'medium' | 'high' | 'critical';
  type: 'air_quality' | 'temperature' | 'humidity' | 'pollen' | 'disease_outbreak';
  description: string;
  advice: string;
  icon: React.ReactNode;
}

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  aqi: number;
  uvIndex: number;
  feelsLike: number;
}

export const MapPrediction: React.FC = () => {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [healthRisks, setHealthRisks] = useState<HealthRisk[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Get user's current location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Get address from coordinates
          const address = await reverseGeocode(latitude, longitude);
          
          const location: Location = {
            lat: latitude,
            lng: longitude,
            address: address.formatted,
            city: address.city,
            country: address.country
          };
          
          setUserLocation(location);
          
          // Fetch nearby data
          await fetchNearbyData(latitude, longitude);
          setError(null);
        } catch (err) {
          setError('Failed to get location details');
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError(`Location access denied: ${error.message}`);
        setLoading(false);
        
        // Fallback to demo location (San Francisco)
        const demoLocation: Location = {
          lat: 37.7749,
          lng: -122.4194,
          address: 'San Francisco, CA, USA',
          city: 'San Francisco',
          country: 'USA'
        };
        setUserLocation(demoLocation);
        fetchNearbyData(demoLocation.lat, demoLocation.lng);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);

  // Reverse geocoding to get address from coordinates
  const reverseGeocode = async (_lat: number, _lng: number) => {
    // In production, use Google Maps Geocoding API
    // For demo, return mock data
    return {
      formatted: 'San Francisco, CA, USA',
      city: 'San Francisco',
      country: 'USA'
    };
  };

  // Fetch all nearby data (hospitals, weather, risks)
  const fetchNearbyData = async (lat: number, lng: number) => {
    try {
      // Fetch hospitals
      const hospitalsData = await fetchNearbyHospitals(lat, lng);
      setHospitals(hospitalsData);
      
      if (hospitalsData.length > 0) {
        setSelectedHospital(hospitalsData[0]);
      }

      // Fetch weather data
      const weather = await fetchWeatherData(lat, lng);
      setWeatherData(weather);

      // Calculate health risks
      const risks = calculateHealthRisks(weather, lat, lng);
      setHealthRisks(risks);

    } catch (error) {
      console.error('Error fetching nearby data:', error);
      // Use mock data for demo
      setHospitals(getMockHospitals(lat, lng));
      setWeatherData(getMockWeatherData());
      setHealthRisks(getMockHealthRisks());
    }
  };

  // Fetch nearby hospitals
  const fetchNearbyHospitals = async (_lat: number, _lng: number): Promise<Hospital[]> => {
    // In production, use Google Places API or your backend
    // For demo, return mock data
    return getMockHospitals(_lat, _lng);
  };

  // Fetch weather data
  const fetchWeatherData = async (_lat: number, _lng: number): Promise<WeatherData> => {
    // In production, use OpenWeatherMap API or similar
    // For demo, return mock data
    return getMockWeatherData();
  };

  // Calculate health risks based on location and weather
  const calculateHealthRisks = (weather: WeatherData, _lat: number, _lng: number): HealthRisk[] => {
    const risks: HealthRisk[] = [];

    // Air quality risk
    if (weather.aqi > 150) {
      risks.push({
        level: 'high',
        type: 'air_quality',
        description: 'Poor air quality detected',
        advice: 'Limit outdoor activities, especially if you have respiratory conditions',
        icon: <Wind className="w-4 h-4" />
      });
    } else if (weather.aqi > 100) {
      risks.push({
        level: 'medium',
        type: 'air_quality',
        description: 'Moderate air quality',
        advice: 'Consider reducing strenuous outdoor activities',
        icon: <Wind className="w-4 h-4" />
      });
    }

    // Temperature risk
    if (weather.temperature > 35) {
      risks.push({
        level: 'high',
        type: 'temperature',
        description: 'High temperature warning',
        advice: 'Stay hydrated, avoid direct sun exposure, watch for heat exhaustion symptoms',
        icon: <Thermometer className="w-4 h-4" />
      });
    } else if (weather.temperature < 0) {
      risks.push({
        level: 'high',
        type: 'temperature',
        description: 'Freezing temperatures',
        advice: 'Dress warmly, limit outdoor exposure, watch for hypothermia symptoms',
        icon: <Thermometer className="w-4 h-4" />
      });
    }

    // Humidity risk
    if (weather.humidity > 80) {
      risks.push({
        level: 'medium',
        type: 'humidity',
        description: 'High humidity',
        advice: 'May affect respiratory comfort, stay in well-ventilated areas',
        icon: <Droplets className="w-4 h-4" />
      });
    }

    // UV risk
    if (weather.uvIndex > 8) {
      risks.push({
        level: 'high',
        type: 'temperature',
        description: 'Very high UV index',
        advice: 'Use SPF 50+ sunscreen, wear protective clothing, limit sun exposure',
        icon: <Activity className="w-4 h-4" />
      });
    }

    return risks;
  };

  // Mock data for demo
  const getMockHospitals = (lat: number, lng: number): Hospital[] => [
    {
      id: '1',
      name: 'City General Hospital',
      address: '123 Medical Center Dr, San Francisco, CA 94107',
      location: { lat: lat + 0.001, lng: lng + 0.001 },
      distance: 0.5,
      rating: 4.8,
      specialties: ['Emergency', 'Cardiology', 'General Surgery'],
      emergency: true,
      phone: '(555) 123-4567',
      bedsAvailable: 12,
      waitTime: '15-30 min'
    },
    {
      id: '2',
      name: 'Westside Medical Center',
      address: '456 Health Ave, San Francisco, CA 94103',
      location: { lat: lat + 0.002, lng: lng - 0.001 },
      distance: 1.2,
      rating: 4.6,
      specialties: ['Pediatrics', 'Dermatology', 'Orthopedics'],
      emergency: true,
      phone: '(555) 234-5678',
      bedsAvailable: 8,
      waitTime: '30-45 min'
    },
    {
      id: '3',
      name: 'University Hospital',
      address: '789 Campus Rd, San Francisco, CA 94117',
      location: { lat: lat - 0.002, lng: lng + 0.002 },
      distance: 2.3,
      rating: 4.9,
      specialties: ['Neurology', 'Oncology', 'Research'],
      emergency: true,
      phone: '(555) 345-6789',
      bedsAvailable: 24,
      waitTime: '10-20 min'
    },
    {
      id: '4',
      name: 'Community Health Clinic',
      address: '101 Wellness St, San Francisco, CA 94110',
      location: { lat: lat + 0.0015, lng: lng - 0.0015 },
      distance: 0.8,
      rating: 4.5,
      specialties: ['Family Medicine', 'Mental Health', 'Preventive Care'],
      emergency: false,
      phone: '(555) 456-7890',
      waitTime: '20-40 min'
    }
  ];

  const getMockWeatherData = (): WeatherData => ({
    temperature: 22,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 12,
    aqi: 85,
    uvIndex: 6,
    feelsLike: 24
  });

  const getMockHealthRisks = (): HealthRisk[] => [
    {
      level: 'medium',
      type: 'air_quality',
      description: 'Moderate air quality',
      advice: 'Consider reducing strenuous outdoor activities',
      icon: <Wind className="w-4 h-4" />
    },
    {
      level: 'low',
      type: 'temperature',
      description: 'Comfortable temperature',
      advice: 'Ideal conditions for outdoor activities',
      icon: <Thermometer className="w-4 h-4" />
    }
  ];

  // Initialize Google Maps
  const loadGoogleMaps = () => {
    if (window.google) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement('script');
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => setError('Failed to load Google Maps');
    document.head.appendChild(script);
  };

  // Get directions to hospital
  const getDirections = (hospital: Hospital) => {
    if (!userLocation) return;
    
    const origin = `${userLocation.lat},${userLocation.lng}`;
    const destination = `${hospital.location.lat},${hospital.location.lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    window.open(url, '_blank');
  };

  // Initialize on component mount
  useEffect(() => {
    getUserLocation();
    loadGoogleMaps();
  }, [getUserLocation]);

  // Render Google Map
  const renderMap = () => {
    if (!mapLoaded || !userLocation) return null;

    return (
      <div className="h-96 w-full rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
        <div id="map" className="h-full w-full">
          {/* Google Map will be rendered here */}
          <div className="h-full w-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <p className="text-neutral-700 dark:text-neutral-300">
                Map centered at: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-2">
                {hospitals.length} hospitals found nearby
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => window.open(`https://www.google.com/maps/@${userLocation.lat},${userLocation.lng},15z`, '_blank')}
              >
                Open in Google Maps
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Detecting your location and loading health data...</p>
        </div>
      </div>
    );
  }

  if (error && !userLocation) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
            Location Access Required
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            {error}. This feature needs your location to provide personalized health advisories.
          </p>
          <Button onClick={getUserLocation} leftIcon={<Navigation className="w-5 h-5" />}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
              Health Map & Location Advisory
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Personalized health insights based on your current location
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={getUserLocation}
            leftIcon={<Navigation className="w-4 h-4" />}
          >
            Refresh Location
          </Button>
        </div>

        {/* Current Location */}
        {userLocation && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-white dark:bg-neutral-800">
                <MapPin className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">Current Location</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {userLocation.address}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                  Coordinates: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              ✓ Live Tracking
            </Badge>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Map & Weather */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                Nearby Healthcare Facilities
              </h2>
              <Badge variant="outline">
                {hospitals.length} facilities found
              </Badge>
            </div>
            {renderMap()}
          </GlassCard>

          {/* Weather & Health Advisory */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                Weather & Health Advisory
              </h2>
              <div className="flex items-center space-x-2">
                <Thermometer className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-medium">Real-time Data</span>
              </div>
            </div>

            {weatherData && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                  <Thermometer className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {weatherData.temperature}°C
                  </div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">Temperature</div>
                  <div className="text-xs text-neutral-500">Feels like {weatherData.feelsLike}°C</div>
                </div>

                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                  <Wind className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {weatherData.aqi} AQI
                  </div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">Air Quality</div>
                  <div className={`text-xs font-medium ${weatherData.aqi > 100 ? 'text-red-600' : 'text-green-600'}`}>
                    {weatherData.aqi > 100 ? 'Moderate' : 'Good'}
                  </div>
                </div>

                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                  <Droplets className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {weatherData.humidity}%
                  </div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">Humidity</div>
                  <div className="text-xs text-neutral-500">
                    {weatherData.humidity > 70 ? 'High' : 'Normal'}
                  </div>
                </div>

                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-amber-600" />
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {weatherData.uvIndex}
                  </div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">UV Index</div>
                  <div className="text-xs text-neutral-500">
                    {weatherData.uvIndex > 6 ? 'High Risk' : 'Moderate'}
                  </div>
                </div>
              </div>
            )}

            {/* Health Risks */}
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                Health Risk Assessment
              </h3>
              <div className="space-y-3">
                {healthRisks.map((risk, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border ${
                      risk.level === 'high' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' :
                      risk.level === 'medium' ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20' :
                      'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          risk.level === 'high' ? 'bg-red-100 dark:bg-red-900/30' :
                          risk.level === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                          'bg-green-100 dark:bg-green-900/30'
                        }`}>
                          {risk.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-neutral-900 dark:text-white">
                            {risk.description}
                          </h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                            {risk.advice}
                          </p>
                        </div>
                      </div>
                      <Badge className={
                        risk.level === 'high' ? 'bg-red-500 text-white' :
                        risk.level === 'medium' ? 'bg-yellow-500 text-white' :
                        'bg-green-500 text-white'
                      }>
                        {risk.level.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}

                {healthRisks.length === 0 && (
                  <div className="p-4 rounded-xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <h4 className="font-bold text-neutral-900 dark:text-white">
                          All Clear - Low Health Risks
                        </h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          Current environmental conditions pose minimal health risks
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Column - Hospitals List */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                Nearby Hospitals
              </h2>
              <Badge className="bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                Sorted by Distance
              </Badge>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {hospitals.map((hospital) => (
                <div
                  key={hospital.id}
                  onClick={() => setSelectedHospital(hospital)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedHospital?.id === hospital.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Building className="w-5 h-5 text-primary-600 mr-2" />
                        <h3 className="font-bold text-neutral-900 dark:text-white">
                          {hospital.name}
                        </h3>
                        {hospital.emergency && (
                          <Badge size="sm" className="ml-2 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                            ER
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                        {hospital.address}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center">
                          <Navigation className="w-3 h-3 mr-1 text-neutral-500" />
                          {hospital.distance} miles
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-neutral-500" />
                          {hospital.waitTime}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-3 h-3 mr-1 text-neutral-500" />
                          {hospital.bedsAvailable || 'N/A'} beds
                        </div>
                        <div className="flex items-center">
                          <Shield className="w-3 h-3 mr-1 text-neutral-500" />
                          ⭐ {hospital.rating}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1">
                        {hospital.specialties.slice(0, 3).map((specialty, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    <a
                      href={`tel:${hospital.phone}`}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      Call
                    </a>
                    
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        getDirections(hospital);
                      }}
                      className="text-sm"
                    >
                      <Navigation className="w-4 h-4 mr-1" />
                      Directions
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
              <div className="text-center">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                  Need immediate medical attention?
                </p>
                <Button
                  variant="danger"
                  fullWidth
                  leftIcon={<AlertTriangle className="w-5 h-5" />}
                  onClick={() => window.open('tel:911', '_self')}
                >
                  Call Emergency (911)
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard className="p-6 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Button
                variant="secondary"
                fullWidth
                leftIcon={<Heart className="w-4 h-4" />}
              >
                Find Specialists
              </Button>
              <Button
                variant="secondary"
                fullWidth
                leftIcon={<Clock className="w-4 h-4" />}
              >
                Book Appointment
              </Button>
              <Button
                variant="secondary"
                fullWidth
                leftIcon={<Activity className="w-4 h-4" />}
              >
                Health Assessment
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
