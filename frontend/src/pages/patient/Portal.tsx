import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtime } from '../../contexts/RealtimeContext';
import { Container } from '../../components/layout/Container';
import { GlassCard } from '../../components/layout/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Calendar, Clock, Video, Phone, MapPin, FileText, Download, Bell,
  User, Settings, LogOut, Star, Navigation, Filter, X, AlertTriangle,
  MessageSquare, Search, Heart, Shield, Award
} from 'lucide-react';
import axios from 'axios';
import AppointmentBookingModal from '../../components/features/appointment/AppointmentBookingModal';
import { RealTimeNotification } from '../../components/features/notifications/RealTimeNotification';
import realtimeService from '../../services/realtime.service';

const API_URL = import.meta.env.VITE_API_URL || 'https://healthcare-backend-tylz.onrender.com/api';

interface Appointment {
  id: number;
  doctorName: string;
  doctorSpecialty: string;
  scheduledTime: string;
  appointmentType: string;
  status: string;
  meetingLink?: string;
  hospitalName: string;
}

const APPOINTMENT_STATUS_BADGE: Record<string, { variant: 'success' | 'warning' | 'error' | 'default'; label: string }> = {
  pending_confirmation: { variant: 'warning', label: 'Awaiting Confirmation' },
  confirmed: { variant: 'success', label: 'Confirmed' },
  scheduled: { variant: 'success', label: 'Confirmed' },
  cancelled: { variant: 'error', label: 'Cancelled' },
  completed: { variant: 'default', label: 'Completed' },
};

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  consultationFee: number;
  rating: number;
  experienceYears: number;
  languages: string[];
  hospitalName?: string;
  hospitalAddress?: string;
  distance?: number;
  availableToday?: boolean;
  nextSlot?: string;
}

// Location service functions
const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return Math.round(R * c * 10) / 10;
};

// Resolved: Property 'appointments' does not exist on type 'RealtimeContextType'.
// Instead, get appointments only from backend, not realtime state.
export const PatientPortal: React.FC = () => {
  const { user, logout } = useAuth();
  const realtime = useRealtime();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [portalTab, setPortalTab] = useState<'dashboard' | 'find-doctors' | 'appointments' | 'records'>('dashboard');
  const [patientId, setPatientId] = useState<number | null>(null);
  const [medicalProfile, setMedicalProfile] = useState<any>(null);
  const [showMedicalHistory, setShowMedicalHistory] = useState(false);
  
  // Location and filters
  const [userLocation, setUserLocation] = useState<any>(null);
  const [usingFallbackLocation, setUsingFallbackLocation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [maxDistance, setMaxDistance] = useState(10);
  const [maxFee, setMaxFee] = useState(2000);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [locationLoading, setLocationLoading] = useState(true);

  useEffect(() => {
    fetchData();
    initializeLocation();
    fetchSpecialties();
  }, []);

  // Live-refresh when the doctor confirms/declines a pending request, so the
  // status badge updates without the patient needing to reload the page.
  useEffect(() => {
    const onUpdate = () => fetchData();
    realtimeService.on('patient:transition', onUpdate);
    realtimeService.on('notification:new', onUpdate);
    return () => {
      realtimeService.off('patient:transition', onUpdate);
      realtimeService.off('notification:new', onUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Removed useEffect for realtime?.appointments; source of error.
  // useEffect(() => {
  //   if (realtime?.appointments) {
  //     setAppointments(realtime.appointments);
  //   }
  // }, [realtime?.appointments]);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchTerm, selectedSpecialty, maxDistance, maxFee, userLocation]);

  const initializeLocation = async () => {
    try {
      setLocationLoading(true);
      const location = await getCurrentLocation();
      setUserLocation(location);
    } catch (error) {
      // Silently defaulting to Mumbai without telling the patient made
      // "distance to doctor" look wrong/random for anyone not actually in
      // Mumbai — now it's a visible, dismissable notice instead.
      console.log('Location unavailable — defaulting to Mumbai and flagging it in the UI');
      setUserLocation({ lat: 19.0760, lng: 72.8777 });
      setUsingFallbackLocation(true);
    } finally {
      setLocationLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // /appointments/patient/:patientId wants the Patient row's id, which
      // is a different sequence from the logged-in User's id — resolve that
      // first or every appointment lookup silently 404s/returns nothing.
      const patientLookup = user?.id
        ? axios.get(`${API_URL}/appointments/patient-for-user/${user.id}`).catch(() => null)
        : Promise.resolve(null);

      const [patientRes, doctorsRes] = await Promise.all([
        patientLookup,
        axios.get(`${API_URL}/doctors`)
      ]);

      const resolvedPatientId = patientRes?.data?.data?.patientId;
      if (resolvedPatientId) {
        setPatientId(resolvedPatientId);
        const [appointmentsRes, profileRes] = await Promise.all([
          axios.get(`${API_URL}/appointments/patient/${resolvedPatientId}`),
          axios.get(`${API_URL}/appointments/patient-profile/${resolvedPatientId}`).catch(() => null),
        ]);
        if (appointmentsRes.data.success) {
          setAppointments(appointmentsRes.data.data);
        }
        if (profileRes?.data?.success) {
          setMedicalProfile(profileRes.data.data);
        }
      }
      if (doctorsRes.data.success) {
        const rawDoctors: any[] = doctorsRes.data.data?.doctors || [];
        const doctorsWithDistance = rawDoctors.map((doc: any) => {
          // Real distance to THIS doctor's actual hospital — was previously
          // always measured to a hardcoded Mumbai coordinate regardless of
          // the doctor, which is what made "nearby" results feel random.
          const hasRealCoords = userLocation && doc.hospital_latitude != null && doc.hospital_longitude != null;
          return {
            ...doc,
            distance: hasRealCoords
              ? calculateDistance(userLocation.lat, userLocation.lng, doc.hospital_latitude, doc.hospital_longitude)
              : undefined,
            availableToday: false, // filled in below from real slot data
            nextSlot: undefined as string | undefined,
            hospitalName: doc.hospital_name || 'Independent practice',
            hospitalAddress: doc.hospital_address || doc.hospital_city || ''
          };
        });
        setDoctors(doctorsWithDistance);

        // Check each doctor's real availability today instead of guessing —
        // fetched separately (not blocking the initial render) since it's
        // one request per doctor.
        const today = new Date().toISOString().split('T')[0];
        Promise.all(
          rawDoctors.map((doc: any) =>
            axios
              .get(`${API_URL}/appointments/slots`, { params: { doctorId: doc.id, date: today } })
              .then((res) => {
                const slots: any[] = res.data?.data || [];
                const nextOpen = slots.find((s) => s.available);
                return {
                  id: doc.id,
                  availableToday: !!nextOpen,
                  nextSlot: nextOpen
                    ? new Date(nextOpen.startTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
                    : undefined,
                };
              })
              .catch(() => ({ id: doc.id, availableToday: false, nextSlot: undefined }))
          )
        ).then((results) => {
          const byId = new Map(results.map((r) => [r.id, r]));
          setDoctors((prev) =>
            prev.map((d) => {
              const match = byId.get(d.id);
              return match ? { ...d, availableToday: match.availableToday, nextSlot: match.nextSlot } : d;
            })
          );
        });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialties = async () => {
    try {
      const response = await axios.get(`${API_URL}/doctors/specialties`);
      if (response.data.success) {
        setSpecialties(['all', ...(response.data.data || [])]);
      }
    } catch (error) {
      console.error('Failed to fetch specialties:', error);
    }
  };

  const filterDoctors = () => {
    let filtered = [...doctors];

    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.hospitalName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSpecialty !== 'all') {
      filtered = filtered.filter(doc => doc.specialty === selectedSpecialty);
    }

    if (userLocation) {
      filtered = filtered.filter(doc => 
        !doc.distance || doc.distance <= maxDistance
      );
    }

    filtered = filtered.filter(doc => (doc.consultationFee || 0) <= maxFee);

    filtered.sort((a, b) => {
      if (a.distance && b.distance) {
        return a.distance - b.distance;
      }
      return (b.rating || 0) - (a.rating || 0);
    });

    setFilteredDoctors(filtered);
  };

  const handleBookAppointment = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowBookingModal(true);
  };

  const handleModalClose = () => {
    setShowBookingModal(false);
    setSelectedDoctor(null);
  };

  const handleModalBooked = () => {
    fetchData();
    setShowBookingModal(false);
    setSelectedDoctor(null);
    setPortalTab('appointments');
  };

  const filteredAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.scheduledTime);
    const now = new Date();
    if (activeTab === 'upcoming') return aptDate > now;
    return aptDate < now;
  });

  const upcomingCount = appointments.filter(apt => new Date(apt.scheduledTime) > new Date()).length;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-blue-950/30">
      {/* Animated background blobs */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/50 to-transparent dark:from-neutral-900/50 pointer-events-none z-0"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob pointer-events-none z-0"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000 pointer-events-none z-0"></div>

      {/* Header */}
      <header className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md shadow-sm border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-20">
        <Container>
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">Healthcare+</h1>
              <nav className="hidden md:flex gap-2 bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-lg">
                <button
                  onClick={() => setPortalTab('dashboard')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    portalTab === 'dashboard' 
                      ? 'bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-300 shadow-sm' 
                      : 'hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setPortalTab('find-doctors')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    portalTab === 'find-doctors' 
                      ? 'bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-300 shadow-sm' 
                      : 'hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  Find Doctors
                </button>
                <button
                  onClick={() => setPortalTab('appointments')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center ${
                    portalTab === 'appointments' 
                      ? 'bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-300 shadow-sm' 
                      : 'hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  My Appointments
                  {upcomingCount > 0 && (
                    <Badge variant="danger" size="sm" className="ml-2 px-1.5 py-0.5 text-xs">
                      {upcomingCount}
                    </Badge>
                  )}
                </button>
                <button
                  onClick={() => setPortalTab('records')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    portalTab === 'records' 
                      ? 'bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-300 shadow-sm' 
                      : 'hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  Health Records
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <RealTimeNotification />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-medical-cyan/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-medical-cyan" />
                </div>
                <span className="text-sm font-medium hidden md:block">{user?.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Container>
      </header>

      <Container className="py-8 relative z-10">
        {/* Welcome Banner */}
        <div className="p-8 mb-8 bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-2xl shadow-xl relative overflow-hidden border border-white/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
              </h2>
              <p className="opacity-90">
                {upcomingCount > 0 
                  ? `You have ${upcomingCount} upcoming appointment${upcomingCount > 1 ? 's' : ''}`
                  : 'Ready to book your next health checkup?'}
              </p>
            </div>
          {upcomingCount > 0 && (
              <Button 
                variant="secondary" 
                onClick={() => setPortalTab('appointments')}
                className="bg-white text-medical-cyan hover:bg-gray-100"
              >
                View Appointments
              </Button>
            )}
          </div>
        </div>

        {/* Dashboard Tab */}
        {portalTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <GlassCard className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 rounded-xl">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-neutral-900 dark:text-white">{upcomingCount}</p>
                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Upcoming</p>
                  </div>
                </div>
              </GlassCard>
              <GlassCard className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 rounded-xl">
                    <Heart className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-neutral-900 dark:text-white">{doctors.length}+</p>
                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Doctors</p>
                  </div>
                </div>
              </GlassCard>
              <GlassCard className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 rounded-xl">
                    <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-neutral-900 dark:text-white">4.8</p>
                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Rating</p>
                  </div>
                </div>
              </GlassCard>
              <GlassCard className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/40 dark:to-yellow-800/40 rounded-xl">
                    <Shield className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-neutral-900 dark:text-white">100%</p>
                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Secure</p>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 p-8 text-center group hover:-translate-y-1 cursor-pointer" onClick={() => setPortalTab('find-doctors')}>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-100 to-blue-100 dark:from-primary-900/30 dark:to-blue-900/30 flex items-center justify-center border-4 border-white dark:border-neutral-800 shadow-md">
                  <Calendar className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="font-bold text-xl text-neutral-900 dark:text-white mb-2">Book Appointment</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Find and book with nearby doctors</p>
              </div>

              <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 p-8 text-center group hover:-translate-y-1 cursor-pointer" onClick={() => setPortalTab('appointments')}>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center border-4 border-white dark:border-neutral-800 shadow-md">
                  <Clock className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-bold text-xl text-neutral-900 dark:text-white mb-2">My Appointments</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">View and manage your visits</p>
              </div>

              <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 p-8 text-center group hover:-translate-y-1 cursor-pointer" onClick={() => setPortalTab('records')}>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-fuchsia-100 dark:from-purple-900/30 dark:to-fuchsia-900/30 flex items-center justify-center border-4 border-white dark:border-neutral-800 shadow-md">
                  <FileText className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-bold text-xl text-neutral-900 dark:text-white mb-2">Health Records</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Access your medical history</p>
              </div>
            </div>

            {/* Recommended Doctors Preview */}
            <GlassCard className="p-6 md:p-8 bg-white/70 dark:bg-neutral-800/70">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Recommended for You</h2>
                <Button variant="ghost" size="sm" onClick={() => setPortalTab('find-doctors')}>
                  View All
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {doctors.slice(0, 3).map((doctor) => (
                  <div key={doctor.id} className="p-5 border border-neutral-200 dark:border-neutral-700/50 rounded-xl hover:shadow-xl transition-all duration-300 bg-white dark:bg-neutral-800/80 group hover:-translate-y-1">
                    <h3 className="font-bold text-lg text-neutral-900 dark:text-white group-hover:text-primary-600 transition-colors">{doctor.name}</h3>
                    <p className="text-primary-600 dark:text-primary-400 text-sm mb-3">{doctor.specialty}</p>
                    
                    <div className="flex items-center gap-2 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-neutral-900 dark:text-white">{doctor.rating}</span>
                      <span>•</span>
                      <span className="font-medium text-neutral-900 dark:text-white">₹{doctor.consultationFee}</span>
                    </div>
                    {doctor.distance && (
                      <div className="flex items-center gap-1 mt-3 text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 px-2 py-1 rounded-full w-fit">
                        <Navigation className="w-3 h-3" />
                        {doctor.distance} km away
                      </div>
                    )}
                    <Button size="sm" fullWidth className="mt-5 btn-premium" onClick={() => handleBookAppointment(doctor)}>
                      Book Now
                    </Button>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}

        {/* Find Doctors Tab */}
        {portalTab === 'find-doctors' && (
          <div className="space-y-6">
            {/* Search Header */}
            <div className="flex-4">
              <div className="flex-1 relative">
                <Input
                  placeholder="Search doctors, specialties, hospitals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="w-4 h-4 text-gray-400" />}
                />
                {userLocation && !locationLoading && (
                  <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-xs flex items-center gap-1 ${usingFallbackLocation ? 'text-amber-600' : 'text-gray-500'}`}>
                    <Navigation className="w-3 h-3" />
                    {usingFallbackLocation ? "Location unavailable — showing distance from Mumbai" : 'Using your location'}
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
              <div className="p-6 bg-white rounded-xl shadow-sm animate-slideDown">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">Filter Doctors</h3>
                  <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-gray-100 rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Specialty</label>
                    <select
                      value={selectedSpecialty}
                      onChange={(e) => setSelectedSpecialty(e.target.value)}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-medical-cyan"
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
              </div>
            )}

            {/* Results Count */}
            <div className="text-sm text-gray-500">
              Found {filteredDoctors.length} doctors near you
            </div>

            {/* Doctor Cards */}
            {locationLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-cyan"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDoctors.map((doctor) => (
                  <div key={doctor.id} className="p-6 bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Left Column - Basic Info */}
                      <div className="md:w-1/3">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-full bg-medical-cyan/10 flex items-center justify-center">
                            <span className="text-2xl font-bold text-medical-cyan">
                              {doctor.name?.charAt(0) || 'D'}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">{doctor.name}</h3>
                            <p className="text-medical-cyan">{doctor.specialty}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{doctor.rating || 4.5}</span>
                              <span className="text-xs text-gray-500">
                                {doctor.experienceYears || 10}+ years
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
                                <span className="inline-flex items-center px-2 py-1 mt-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                                  <Navigation className="w-3 h-3 mr-1" />
                                  {doctor.distance} km away
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Booking */}
                      <div className="md:w-1/3 flex flex-col items-end justify-between">
                        <div className="text-right mb-4">
                          <p className="text-2xl font-bold text-medical-cyan">
                            ₹{doctor.consultationFee || 500}
                          </p>
                          <p className="text-sm text-gray-500">Consultation fee</p>
                          {doctor.availableToday && (
                            <span className="inline-flex items-center px-2 py-1 mt-2 text-xs bg-green-100 text-green-700 rounded-full">
                              <Clock className="w-3 h-3 mr-1" />
                              Available Today at {doctor.nextSlot}
                            </span>
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
                        <span key={i} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {filteredDoctors.length === 0 && (
                  <div className="p-12 text-center bg-white rounded-xl shadow-sm">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No doctors found</h3>
                    <p className="text-gray-500">Try adjusting your filters</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Appointments Tab */}
        {portalTab === 'appointments' && (
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Your Appointments</h2>
              <div className="flex gap-2">
                <Button 
                  variant={activeTab === 'upcoming' ? 'primary' : 'ghost'} 
                  size="sm" 
                  onClick={() => setActiveTab('upcoming')}
                >
                  Upcoming
                </Button>
                <Button 
                  variant={activeTab === 'past' ? 'primary' : 'ghost'} 
                  size="sm" 
                  onClick={() => setActiveTab('past')}
                >
                  Past
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-cyan"></div>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No {activeTab} appointments</h3>
                <p className="text-gray-500 mb-4">
                  {activeTab === 'upcoming' 
                    ? 'Ready to book your next appointment?' 
                    : 'Your past appointments will appear here'}
                </p>
                {activeTab === 'upcoming' && (
                  <Button onClick={() => setPortalTab('find-doctors')}>
                    Find Doctors
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((apt) => {
                  const statusInfo = APPOINTMENT_STATUS_BADGE[apt.status] || { variant: 'default' as const, label: apt.status };
                  const isConfirmed = apt.status === 'confirmed' || apt.status === 'scheduled';
                  return (
                  <div
                    key={apt.id}
                    className={`p-6 rounded-[2rem] border transition-all duration-300 group hover:shadow-xl hover:-translate-y-1 ${
                      apt.status === 'pending_confirmation' 
                        ? 'border-amber-200/50 bg-amber-50/30 dark:border-amber-700/50 dark:bg-amber-900/20 backdrop-blur-md' 
                        : 'border-white/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-xl text-slate-900 dark:text-white">Dr. {apt.doctorName}</h3>
                          <Badge variant={statusInfo.variant} size="sm" className="rounded-full shadow-sm">{statusInfo.label}</Badge>
                        </div>
                        <p className="text-primary-600 dark:text-primary-400 font-medium mb-3">{apt.doctorSpecialty}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50 p-2 rounded-xl w-fit">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(apt.scheduledTime).toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1">
                            {apt.appointmentType === 'online' ? (
                              <Video className="w-4 h-4" />
                            ) : (
                              <MapPin className="w-4 h-4" />
                            )}
                            {apt.appointmentType}
                          </div>
                        </div>
                        <p className="text-xs text-neutral-400 mt-1">{apt.hospitalName}</p>
                        {apt.status === 'pending_confirmation' && (
                          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                            Waiting for Dr. {apt.doctorName} to confirm — you'll be notified as soon as they respond.
                          </p>
                        )}
                        {apt.status === 'cancelled' && (
                          <p className="text-xs text-error-600 mt-1">This appointment was cancelled or declined.</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {isConfirmed && apt.meetingLink && apt.appointmentType === 'online' && (
                          <Button size="sm" leftIcon={<Video className="w-4 h-4" />} className="rounded-xl shadow-md bg-primary-600 hover:bg-primary-700 text-white">
                            Join Video Call
                          </Button>
                        )}
                        {isConfirmed && apt.appointmentType === 'in_person' && (
                          <Button size="sm" variant="secondary" leftIcon={<Navigation className="w-4 h-4" />} className="rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md">
                            Get Directions
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Health Records Tab */}
        {portalTab === 'records' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => setShowMedicalHistory(true)}
              className="p-6 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-[2rem]"
            >
              <FileText className="w-12 h-12 mx-auto mb-3 text-medical-cyan" />
              <h3 className="font-bold text-lg">Medical History</h3>
              <p className="text-sm text-gray-500">View your allergies, conditions & past appointments</p>
            </button>

            <div className="p-6 text-center bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-[2rem] opacity-60 relative">
              <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Coming soon</span>
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="font-bold text-lg text-gray-600">Prescriptions</h3>
              <p className="text-sm text-gray-500">Doctors don't yet issue digital prescriptions here</p>
            </div>

            <div className="p-6 text-center bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-[2rem] opacity-60 relative">
              <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Coming soon</span>
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="font-bold text-lg text-gray-600">Lab Reports</h3>
              <p className="text-sm text-gray-500">No lab-report upload/sharing exists yet</p>
            </div>
          </div>
        )}

        {/* Medical History Modal — real data (allergies, conditions,
            medications, past appointments), not a placeholder. */}
        {showMedicalHistory && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowMedicalHistory(false)}>
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Medical History</h3>
                <button onClick={() => setShowMedicalHistory(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {!medicalProfile ? (
                <p className="text-gray-500 text-sm">No profile data on file yet.</p>
              ) : (
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="text-gray-500">Blood Group</span>
                    <p className="font-medium">{medicalProfile.bloodGroup || 'Not on file'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Allergies</span>
                    <p className="font-medium">{medicalProfile.allergies?.length ? medicalProfile.allergies.join(', ') : 'None on file'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Chronic Conditions</span>
                    <p className="font-medium">{medicalProfile.chronicConditions?.length ? medicalProfile.chronicConditions.join(', ') : 'None on file'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Current Medications</span>
                    <p className="font-medium">{medicalProfile.currentMedications?.length ? medicalProfile.currentMedications.join(', ') : 'None on file'}</p>
                  </div>
                  <div className="border-t pt-4">
                    <span className="text-gray-500">Past Appointments</span>
                    {appointments.filter((a) => a.status === 'completed').length === 0 ? (
                      <p className="font-medium">No completed appointments yet</p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {appointments.filter((a) => a.status === 'completed').map((a) => (
                          <li key={a.id} className="p-2 bg-gray-50 rounded">
                            <span className="font-medium">Dr. {a.doctorName}</span> ({a.doctorSpecialty}) —{' '}
                            {new Date(a.scheduledTime).toLocaleDateString()}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Booking Modal - Pass only valid props */}
        {showBookingModal && selectedDoctor && (
          <AppointmentBookingModal
            isOpen={showBookingModal}
            onClose={handleModalClose}
            selectedDoctor={selectedDoctor}
          />
        )}
      </Container>
    </div>
  );
};

export default PatientPortal;
