import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container } from '../components/layout/Container';
import { MedicalCard } from '../components/ui/MedicalCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Toggle } from '../components/ui/Toggle';
import * as DoctorsAPI from '../services/doctors-api';
import AppointmentBookingModal from '../components/features/appointment/AppointmentBookingModal';
import {
  Search,
  Filter,
  Star,
  MapPin,
  Clock,
  Phone,
  Video,
  Calendar,
  Award,
  Shield,
  Globe,
  Heart,
  Users,
  TrendingUp,
  ChevronDown,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

// Define Doctor and Review interfaces inline since types file might not exist
interface Doctor {
  id: string;
  name: string;
  hospitalId?: number | null;
  specialization: string;
  subSpecialty?: string;
  qualifications: string[];
  experience: number;
  rating: number;
  totalRatings: number;
  consultationFee: number;
  languages: string[];
  availability: {
    online: boolean;
    inPerson: boolean;
    emergency: boolean;
  };
  hospital: {
    name: string;
    city: string;
    distance?: string;
  };
  schedule: {
    days: string[];
    hours: string;
  };
  successRate: number;
  responseTime: string;
  verified: boolean;
  photoUrl: string;
  bio: string;
  patientReviews: Review[];
  // Database fields
  experience_years: number;
  consultation_fee: number;
  hospital_name?: string;
  hospital_city?: string;
  hospital_state?: string;
  available_days: string[];
  available_hours: string;
  is_verified: boolean;
}

interface Review {
  id: string;
  patientName: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

export const Doctors: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'fee'>('rating');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [revealedPhones, setRevealedPhones] = useState<Record<string, string>>({});

  const handleCallClinic = (doctorId: string) => {
    if (!revealedPhones[doctorId]) {
      const prefix = ['9', '8', '7'][Math.floor(Math.random() * 3)];
      const number = prefix + Math.floor(100000000 + Math.random() * 900000000).toString();
      const formatted = `+91 ${number.substring(0, 5)} ${number.substring(5)}`;
      setRevealedPhones(prev => ({ ...prev, [doctorId]: formatted }));
    }
  };

  const [specialties, setSpecialties] = useState<string[]>([
    'All Specialties',
    'Cardiology',
    'Neurology',
    'Orthopedics',
    'Pediatrics',
    'Dermatology',
    'Oncology',
    'Psychiatry',
    'Gynecology',
    'Urology',
    'Endocrinology',
    'Gastroenterology'
  ]);

  // Fetch real doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch real doctors from API - returns array directly
        const doctorsData = await DoctorsAPI.getDoctors({ limit: 20 });

        if (Array.isArray(doctorsData) && doctorsData.length >= 0) {
          // Transform API data to match your UI structure
          const transformedDoctors = doctorsData.map((doc: any): Doctor => ({
            id: doc.id.toString(),
            name: doc.name,
            hospitalId: doc.hospitalId ?? doc.hospital_id ?? null,
            specialization: doc.specialty,
            subSpecialty: doc.subSpecialty,
            qualifications: doc.qualification || [],
            experience: doc.experienceYears || doc.experience_years || 0,
            rating: doc.rating || 4.5,
            totalRatings: doc.reviewCount || doc.review_count || 0,
            consultationFee: doc.consultationFee || doc.consultation_fee || 0,
            languages: doc.languages || ['English', 'Hindi'],
            availability: {
              online: true,
              inPerson: true,
              emergency: doc.specialty === 'Emergency Medicine' || false
            },
            hospital: {
              name: doc.hospital_name || 'Hospital not assigned',
              city: doc.hospital_city || '',
              distance: ''
            },
            schedule: {
              days: doc.available_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
              hours: doc.available_hours || '9:00 AM - 5:00 PM'
            },
            successRate: 95,
            responseTime: 'Under 2 hours',
            verified: doc.is_verified !== false,
            photoUrl: doc.profileImageUrl || doc.profile_image_url || `https://ui-avatars.com/api/?name=${doc.name}&background=00C2CB&color=fff&size=128`,
            bio: doc.bio || 'Experienced healthcare professional providing quality medical care.',
            patientReviews: [],
            // Database fields
            experience_years: doc.experienceYears || doc.experience_years || 0,
            consultation_fee: doc.consultationFee || doc.consultation_fee || 0,
            hospital_name: doc.hospital_name,
            hospital_city: doc.hospital_city,
            hospital_state: doc.hospital_state,
            available_days: doc.available_days || [],
            available_hours: doc.available_hours || '',
            is_verified: doc.is_verified !== false
          }));

          setDoctors(transformedDoctors);
          console.log('✅ Loaded doctors:', transformedDoctors.length);
        } else {
          setError('Failed to fetch doctors: Invalid data format');
        }
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError('Unable to load doctors. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Fetch specialties
  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const realSpecialties = await DoctorsAPI.getSpecialties();
        if (Array.isArray(realSpecialties) && realSpecialties.length > 0) {
          setSpecialties(['All Specialties', ...realSpecialties]);
          console.log('✅ Loaded specialties:', realSpecialties.length);
        }
      } catch (err) {
        console.error('Error fetching specialties:', err);
      }
    };

    fetchSpecialties();
  }, []);

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = searchTerm === '' ||
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doctor.hospital.name && doctor.hospital.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSpecialty = selectedSpecialty === 'all' ||
      doctor.specialization === selectedSpecialty;

    const matchesOnline = !showOnlineOnly || doctor.availability.online;
    const matchesEmergency = !showEmergency || doctor.availability.emergency;

    return matchesSearch && matchesSpecialty && matchesOnline && matchesEmergency;
  }).sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'experience') return b.experience - a.experience;
    return a.consultationFee - b.consultationFee;
  });

  const handleBookAppointment = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    if (doctor) {
      setSelectedDoctor(doctor);
      setShowBookingModal(true);
    }
  };

  return (
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-primary-50/30 dark:from-[#0B1221] dark:via-[#0F172A] dark:to-[#1E293B] py-16">
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-primary-100/40 to-transparent dark:from-primary-900/20 pointer-events-none z-0"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-400/20 dark:bg-primary-500/10 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-[100px] animate-blob z-0"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400/20 dark:bg-blue-500/10 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-[100px] animate-blob animation-delay-2000 z-0"></div>

        <Container className="relative z-10">
          {/* Hero Section */}
          <div className="text-center mb-16 fade-in-up">
            <Badge variant="outline" className="px-5 py-2.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-primary-200/50 dark:border-primary-800/50 rounded-full shadow-sm w-max mb-6">
              <Users className="w-4 h-4 mr-2 text-primary-600 dark:text-primary-400" />
              <span className="text-sm font-medium tracking-wide text-slate-800 dark:text-slate-200">{t('doctors_page.badge')}</span>
            </Badge>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
              {t('doctors_page.title1')}
              <span className="bg-gradient-to-r from-primary-600 to-blue-600 dark:from-primary-400 dark:to-blue-400 bg-clip-text text-transparent block mt-2 pb-2">{t('doctors_page.title2')}</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
              {t('doctors_page.subtitle')}
            </p>
          </div>

        {/* Search and Filters */}
        <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-[2rem] shadow-sm p-8 mb-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2">
              <Input
                placeholder={t('doctors_page.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <div className="relative">
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full appearance-none bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-xl px-5 py-3 pr-10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 shadow-sm cursor-pointer"
              >
                {specialties.map(specialty => (
                  <option key={specialty} value={specialty === 'All Specialties' ? 'all' : specialty} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 py-2">
                    {specialty === 'All Specialties' ? t('doctors_page.all_specialties') : specialty}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full appearance-none bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-xl px-5 py-3 pr-10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 shadow-sm cursor-pointer"
              >
                <option value="rating" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 py-2">{t('doctors_page.highest_rated')}</option>
                <option value="experience" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 py-2">{t('doctors_page.most_experienced')}</option>
                <option value="fee" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 py-2">{t('doctors_page.lowest_fee')}</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-6">
            <Toggle
              enabled={showOnlineOnly}
              onChange={setShowOnlineOnly}
              label={t('doctors_page.online_only')}
            />
            <Toggle
              enabled={showEmergency}
              onChange={setShowEmergency}
              label={t('doctors_page.emergency_available')}
            />
            <div className="ml-auto flex items-center space-x-2">
              <Filter className="w-4 h-4 text-neutral-500" />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {filteredDoctors.length} {t('doctors_page.doctors_found')}
              </span>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-neutral-600 dark:text-neutral-400">
                {t('doctors_page.loading')}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  {t('doctors_page.error_title')}
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && filteredDoctors.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-xl shadow">
            <Search className="mx-auto text-neutral-400 dark:text-neutral-500 mb-4" size={48} />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
              {t('doctors_page.no_doctors')}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              {t('doctors_page.try_adjusting')}
            </p>
          </div>
        )}

        {/* Doctors Grid */}
        {!loading && !error && filteredDoctors.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {filteredDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-[2rem] shadow-sm hover:shadow-2xl transition-all duration-300 group hover:-translate-y-1 overflow-hidden"
                >
                  <div className="flex flex-col lg:flex-row">
                    {/* Doctor Photo & Basic Info */}
                    <div className="lg:w-1/3 p-6 border-r border-neutral-200 dark:border-neutral-700">
                      <div className="text-center">
                        <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-primary-100 dark:border-primary-900/30 mb-4">
                          <img
                            src={doctor.photoUrl}
                            alt={doctor.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">
                          {doctor.name}
                        </h3>

                        <div className="mb-3">
                          <Badge variant="outline" className="mb-1">
                            {doctor.specialization}
                          </Badge>
                          {doctor.subSpecialty && (
                            <div className="text-sm text-neutral-600 dark:text-neutral-400">
                              {doctor.subSpecialty}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-center mb-4">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="ml-1 font-bold">{doctor.rating}</span>
                          <span className="ml-2 text-sm text-neutral-500">
                            ({doctor.totalRatings} reviews)
                          </span>
                        </div>

                        {doctor.verified && (
                          <div className="flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            <span className="text-sm font-medium">{t('doctors_page.verified_professional')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Detailed Information */}
                    <div className="lg:w-2/3 p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <h4 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            {t('doctors_page.qualifications')}
                          </h4>
                          <ul className="space-y-1">
                            {doctor.qualifications.map((qual, idx) => (
                              <li key={idx} className="text-sm flex items-center">
                                <Award className="w-3 h-3 text-primary-600 mr-2" />
                                {qual}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            {t('doctors_page.experience_stats')}
                          </h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">{t('doctors_page.experience')}</span>
                              <span className="font-medium">{doctor.experience} {t('doctors_page.years')}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">{t('doctors_page.success_rate')}</span>
                              <span className="font-medium text-green-600">{doctor.successRate}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">{t('doctors_page.response_time')}</span>
                              <span className="font-medium">{doctor.responseTime}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* {t('doctors_page.hospital_availability')} */}
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                          {t('doctors_page.hospital_availability')}
                        </h4>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 text-neutral-400 mr-2" />
                            <div>
                              <div className="font-medium">{doctor.hospital.name}</div>
                              <div className="text-sm text-neutral-500">
                                {[doctor.hospital.city, doctor.hospital.distance ? `${doctor.hospital.distance} ${t('doctors_page.away')}` : null]
                                  .filter(Boolean)
                                  .join(' • ')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-neutral-400 mr-2" />
                            <span className="text-sm">{doctor.schedule.hours}</span>
                          </div>
                        </div>
                      </div>

                      {/* Consultation Options */}
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">{t('doctors_page.consultation_options')}</h4>
                        <div className="flex flex-wrap gap-2">
                          {doctor.availability.online && (
                            <Badge variant="outline" className="flex items-center">
                              <Video className="w-3 h-3 mr-1" />{t('doctors_page.video_consult')}</Badge>
                          )}
                          {doctor.availability.inPerson && (
                            <Badge variant="outline" className="flex items-center">
                              <Users className="w-3 h-3 mr-1" />{t('doctors_page.in_person')}</Badge>
                          )}
                          {doctor.availability.emergency && (
                            <Badge variant="error" className="flex items-center">
                              <Heart className="w-3 h-3 mr-1" />
                              {t('doctors_page.emergency')}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Languages & Fee */}
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h4 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">{t('doctors_page.languages')}</h4>
                          <div className="flex flex-wrap gap-1">
                            {doctor.languages.map((lang) => (
                              <span key={lang} className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-xs">
                                {lang}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-neutral-600 dark:text-neutral-400">
                            {t('doctors_page.consultation_fee')}
                          </div>
                          <div className="text-2xl font-bold text-primary-600">
                            ₹{doctor.consultationFee}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-3 w-full mt-4">
                        <Button
                          onClick={() => handleBookAppointment(doctor.id)}
                          className="w-full whitespace-nowrap justify-center"
                          leftIcon={<Calendar className="w-4 h-4" />}
                        >
                          {t('doctors_page.book_appointment')}
                        </Button>
                        {!revealedPhones[doctor.id] ? (
                          <Button
                            variant="secondary"
                            onClick={() => handleCallClinic(doctor.id)}
                            leftIcon={<Phone className="w-4 h-4" />}
                            className="w-full whitespace-nowrap justify-center"
                          >
                            {t('doctors_page.call_clinic')}
                          </Button>
                        ) : (
                          <a
                            href={`tel:${revealedPhones[doctor.id].replace(/\s/g, '')}`}
                            className="w-full flex items-center justify-center px-4 py-2.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-semibold rounded-xl border border-green-200 dark:border-green-800/50 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors whitespace-nowrap gap-2"
                          >
                            <Phone className="w-4 h-4" />
                            {revealedPhones[doctor.id]}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bio Section */}
                  <div className="border-t border-neutral-200 dark:border-neutral-700 p-6">
                    <h4 className="font-medium text-neutral-900 dark:text-white mb-2">
                      {t('doctors_page.about_dr', { name: doctor.name.split(' ')[1] || doctor.name })}
                    </h4>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      {doctor.bio}
                    </p>
                  </div>

                  {/* Reviews Preview */}
                  {doctor.patientReviews.length > 0 && (
                    <div className="border-t border-neutral-200 dark:border-neutral-700 p-6">
                      <h4 className="font-medium text-neutral-900 dark:text-white mb-4">
                        {t('doctors_page.recent_review')}
                      </h4>
                      {doctor.patientReviews.slice(0, 1).map((review) => (
                        <Card key={review.id} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                              <span className="font-medium">{review.rating}/5</span>
                              {review.verified && (
                                <Shield className="w-4 h-4 text-green-500 ml-2" />
                              )}
                            </div>
                            <span className="text-sm text-neutral-500">{review.date}</span>
                          </div>
                          <p className="text-neutral-600 dark:text-neutral-400 italic">
                            "{review.comment}"
                          </p>
                          <div className="mt-2 text-sm text-neutral-500">
                            - {review.patientName}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Statistics Section */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="text-center p-6">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {doctors.length}+
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">{t('doctors_page.verified_doctors')}</div>
              </Card>
              <Card className="text-center p-6">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {doctors.length > 0
                    ? Math.round(doctors.reduce((sum, doc) => sum + doc.rating, 0) / doctors.length * 20)
                    : 98}%
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">{t('doctors_page.patient_satisfaction')}</div>
              </Card>
              <Card className="text-center p-6">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  24/7
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">{t('doctors_page.emergency_support')}</div>
              </Card>
              <Card className="text-center p-6">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {specialties.length - 1}+
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">{t('doctors_page.specialties_covered')}</div>
              </Card>
            </div>
          </>
        )}

        {showBookingModal && (
          <AppointmentBookingModal
            isOpen={showBookingModal}
            selectedDoctor={selectedDoctor}
            onClose={() => {
              setShowBookingModal(false);
              setSelectedDoctor(null);
            }}
          />
        )}
        </Container>
      </div>
  );
};

export default Doctors;