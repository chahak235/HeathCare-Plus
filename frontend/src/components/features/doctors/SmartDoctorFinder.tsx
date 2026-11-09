import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../layout/GlassCard';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Badge } from '../../ui/Badge';
import { MapPin, Navigation, Star, Clock, Filter, X } from 'lucide-react';
import locationService from '../../../services/location.service';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://healthcare-backend-tylz.onrender.com/api';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  consultationFee: number;
  rating: number;
  experienceYears: number;
  languages: string[];
  hospitalName: string;
  hospitalAddress: string;
  distance?: number;
  availableToday?: boolean;
  nextSlot?: string;
}

export const SmartDoctorFinder: React.FC = () => {
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [maxDistance, setMaxDistance] = useState(10);
  const [maxFee, setMaxFee] = useState(2000);
  const [specialties, setSpecialties] = useState<string[]>([]);

  useEffect(() => {
    initializeLocation();
    fetchDoctors();
    fetchSpecialties();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchTerm, selectedSpecialty, maxDistance, maxFee, location]);

  const initializeLocation = async () => {
    try {
      const userLocation = await locationService.getCurrentLocation();
      setLocation(userLocation);
    } catch (error) {
      console.log('Using default location');
      // Default to Mumbai coordinates
      setLocation({ lat: 19.0760, lng: 72.8777 });
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await axios.get(`${API_URL}/doctors`);
      if (response.data.success) {
        const doctorsWithDistance = response.data.data.doctors.map((doc: any) => ({
          ...doc,
          distance: location ? locationService.calculateDistance(
            location.lat, location.lng,
            19.0760, 72.8777 // This should be hospital's actual coordinates
          ) : undefined,
          availableToday: Math.random() > 0.3,
          nextSlot: `${Math.floor(Math.random() * 3 + 1)}:00 PM`
        }));
        setDoctors(doctorsWithDistance);
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    }
  };

  const fetchSpecialties = async () => {
    try {
      const response = await axios.get(`${API_URL}/doctors/specialties`);
      if (response.data.success) {
        setSpecialties(['all', ...response.data.data]);
      }
    } catch (error) {
      console.error('Failed to fetch specialties:', error);
    }
  };

  const filterDoctors = () => {
    let filtered = [...doctors];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.hospitalName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Specialty filter
    if (selectedSpecialty !== 'all') {
      filtered = filtered.filter(doc => doc.specialty === selectedSpecialty);
    }

    // Distance filter
    if (location) {
      filtered = filtered.filter(doc => 
        !doc.distance || doc.distance <= maxDistance
      );
    }

    // Fee filter
    filtered = filtered.filter(doc => doc.consultationFee <= maxFee);

    // Sort by distance + rating
    filtered.sort((a, b) => {
      if (a.distance && b.distance) {
        return a.distance - b.distance;
      }
      return b.rating - a.rating;
    });

    setFilteredDoctors(filtered);
  };

  const handleBookAppointment = (doctor: Doctor) => {
    // Open booking modal
    console.log('Booking with:', doctor);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-cyan"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Input
            placeholder="Search doctors, specialties, hospitals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<MapPin className="w-4 h-4 text-gray-400" />}
          />
          {location && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
              📍 Using your location
            </div>
          )}
        </div>
        <Button
          variant={showFilters ? 'primary' : 'secondary'}
        onClick={() => setShowFilters(!showFilters)}
          leftIcon={<Filter className="w-4 h-4" />}
        >
          Filters
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <GlassCard className="p-6 animate-slideDown">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Filter Doctors</h3>
            <button onClick={() => setShowFilters(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Specialty</label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                {specialties.map(s => (
                  <option key={s} value={s}>
                    {s === 'all' ? 'All Specialties' : s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Max Distance: {maxDistance} km
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={maxDistance}
                onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Max Fee: ₹{maxFee}
              </label>
              <input
                type="range"
                min="0"
                max="5000"
                step="100"
                value={maxFee}
                onChange={(e) => setMaxFee(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </GlassCard>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-500">
        Found {filteredDoctors.length} doctors near you
      </div>

      {/* Doctor Cards */}
      <div className="space-y-4">
        {filteredDoctors.map((doctor) => (
          <GlassCard key={doctor.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left Column - Basic Info */}
              <div className="md:w-1/3">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-medical-cyan/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-medical-cyan">
                      {doctor.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{doctor.name}</h3>
                    <p className="text-medical-cyan">{doctor.specialty}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{doctor.rating}</span>
                      <span className="text-xs text-gray-500">
                        {doctor.experienceYears}+ years
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Column - Location & Availability */}
              <div className="md:w-1/3">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="font-medium">{doctor.hospitalName || 'City Hospital'}</p>
                      <p className="text-sm text-gray-500">{doctor.hospitalAddress || 'Mumbai'}</p>
                      {doctor.distance && (
                        <Badge variant="info" size="sm" className="mt-1">
                          <Navigation className="w-3 h-3 mr-1" />
                          {doctor.distance} km away
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Booking */}
              <div className="md:w-1/3 flex flex-col items-end justify-between">
                <div className="text-right mb-4">
                  <p className="text-2xl font-bold text-medical-cyan">
                    ₹{doctor.consultationFee}
                  </p>
                  <p className="text-sm text-gray-500">Consultation fee</p>
                  {doctor.availableToday && (
                    <Badge variant="success" className="mt-2">
                      <Clock className="w-3 h-3 mr-1" />
                      Available Today at {doctor.nextSlot}
                    </Badge>
                  )}
              </div>
                <Button
                  onClick={() => handleBookAppointment(doctor)}
                  className="w-full md:w-auto"
                >
                  Book Appointment
                </Button>
              </div>
            </div>

            {/* Languages & Additional Info */}
            <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
              {doctor.languages?.map((lang, i) => (
                <Badge key={i} variant="outline" size="sm">{lang}</Badge>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};
