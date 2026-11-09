
import { useNavigate } from 'react-router-dom';
import { medicalInsights, type MedicalInsight } from '../mocks/medicalInsights';
import { Container } from '../components/layout/Container';
import { GlassCard } from '../components/layout/GlassCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { MedicalDisclaimer } from '../components/shared/MedicalDisclaimer';
import { WeatherNotifications } from '../components/features/home/WeatherNotifications';
import AppointmentBookingModal from '../components/features/appointment/AppointmentBookingModal';
import { useAuth } from '../contexts/AuthContext';
import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import VoiceAnalyzer from "../components/features/home/VoiceAnalyzer";


import {
  Users,
  Activity,
  Clock,
  Award,
  ChevronRight,
  Stethoscope,
  Shield,
  Brain,
  Zap,
  TrendingUp,
  Star,
  Calendar,
  Phone,
  Video,
  MapPin,
  AlertTriangle,
  Heart,
  MessageSquare,
  ThumbsUp,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Thermometer,
  Wind,
  Cloud,
  Bell,
  Mic,
  Play,
  Pause,
  Download,
  User,
  CheckCircle,
  AlertCircle,
  Plus,
  LogIn,
  LogOut,
  Share2
} from 'lucide-react';

const generateRandomStories = () => {
  const firstNamesM = ['James', 'Robert', 'John', 'Michael', 'David', 'William', 'Richard', 'Joseph', 'Thomas', 'Charles'];
  const firstNamesF = ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const cities = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA'];
  const conditions = ['Cardiac Arrhythmia', 'Asthma Management', 'Diabetes Management', 'Mental Wellness', 'Post-Op Recovery', 'Hypertension', 'Sleep Apnea'];
  const doctors = ['Dr. Sarah Chen', 'Dr. James Wilson', 'Dr. Emma Johnson', 'Dr. Lisa Wang', 'Dr. Michael Rodriguez', 'Dr. Alan Grant', 'Dr. Emily Stone'];
  const hospitals = ['Mayo Clinic', 'Johns Hopkins', 'Cleveland Clinic', 'Massachusetts General', 'Stanford Health', 'Mount Sinai', 'UCSF Medical Center'];
  const quotes = [
    "Early detection through AI analysis saved my life. The continuous monitoring helped me regain control of my heart health.",
    "The voice analysis detected subtle changes in my breathing. Early treatment made all the difference in managing my respiratory condition.",
    "Continuous glucose monitoring and AI insights transformed how I manage my diabetes. My A1C is the best it has been in years.",
    "The mental health tracking helped me understand my anxiety patterns. Combined with therapy, I am living more peacefully.",
    "Post-surgery recovery was smooth with remote monitoring. My doctor knew exactly when I needed adjustments in medication.",
    "The instant video consultation feature connected me with a specialist in minutes. Incredible service and care.",
    "Having my medical history and AI analysis in one place made my emergency room visit so much more efficient."
  ];

  const stories = [];
  for (let i = 0; i < 5; i++) {
    const isMale = Math.random() > 0.5;
    const firstName = isMale ? firstNamesM[Math.floor(Math.random() * firstNamesM.length)] : firstNamesF[Math.floor(Math.random() * firstNamesF.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    const imageId = Math.floor(Math.random() * 90) + 1;
    const gender = isMale ? 'men' : 'women';
    const image = `https://randomuser.me/api/portraits/${gender}/${imageId}.jpg`;

    stories.push({
      id: i + 1,
      name: `${firstName} ${lastName}`,
      city: cities[Math.floor(Math.random() * cities.length)],
      quote: quotes[Math.floor(Math.random() * quotes.length)],
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      image,
      avatarInitials: `${firstName[0]}${lastName[0]}`,
      doctor: doctors[Math.floor(Math.random() * doctors.length)],
      hospital: hospitals[Math.floor(Math.random() * hospitals.length)],
      rating: Math.random() > 0.8 ? 4 : 5,
      age: Math.floor(Math.random() * 50) + 20
    });
  }
  return stories;
};

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [successStories] = useState(() => generateRandomStories());
  const [weatherData, setWeatherData] = useState<any>(null);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<MedicalInsight | null>(null);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [insightCategory, setInsightCategory] = useState<string | null>(null);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('daily_reminders_enabled') === 'true'
  );
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterState, setNewsletterState] = useState<'idle' | 'saved'>('idle');

  const [newsData, setNewsData] = useState<(MedicalInsight & { url?: string })[]>([]);

  useEffect(() => {
    const getCategory = (title: string, desc: string) => {
      const text = (title + " " + desc).toLowerCase();
      if (text.match(/heart|blood|cardiac|stroke|artery|vein|cardio/)) return 'Cardiology';
      if (text.match(/asthma|lung|breath|air|pollution|covid|flu|respiratory/)) return 'Respiratory';
      if (text.match(/mental|brain|stress|anxiety|depression|autism|adhd|alzheimer|dementia|sleep/)) return 'Mental Health';
      if (text.match(/diet|food|eat|weight|nutrition|obesity|sugar|vitamin/)) return 'Nutrition';
      if (text.match(/child|kid|baby|pediatric|infant|maternity|boy|girl/)) return 'Pediatrics';
      return 'Preventive Care';
    };

    fetch('https://api.rss2json.com/v1/api.json?rss_url=http://feeds.bbci.co.uk/news/health/rss.xml')
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          const formatted = data.items
            .filter((item: any) => item.title && item.enclosure?.thumbnail)
            .map((item: any, index: number) => ({
              id: index + 100,
              title: item.title,
              author: 'BBC Health',
              date: new Date(item.pubDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
              readTime: '5 min read',
              category: getCategory(item.title, item.description || ''),
              excerpt: item.description?.replace(/<[^>]+>/g, '').substring(0, 100) + '...',
              fullContent: item.content || '',
              imageUrl: item.enclosure.thumbnail,
              authorAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=BBC`,
              tags: ['News', 'Health'],
              url: item.link
            }));
          setNewsData(formatted);
        }
      })
      .catch(err => console.error("Failed to load news:", err));
  }, []);

  useEffect(() => {
    if (isCarouselPaused) return;

    const interval = setInterval(() => {
      setCurrentStoryIndex((prev) => (prev + 1) % successStories.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isCarouselPaused]);

  const nextStory = () => {
    setCurrentStoryIndex((prev) => (prev + 1) % successStories.length);
  };

  const prevStory = () => {
    setCurrentStoryIndex((prev) => (prev - 1 + successStories.length) % successStories.length);
  };

  const goToStory = (index: number) => {
    setCurrentStoryIndex(index);
  };


  const stats = [
    {
      label: t('home.stats.activeDoctors'),
      value: '500+',
      change: '+12%',
      icon: <Users className="w-6 h-6 text-primary-600" />,
      description: t('home.stats.verifiedPros')
    },
    {
      label: t('home.stats.successRate'),
      value: '98.2%',
      change: '+0.8%',
      icon: <Award className="w-6 h-6 text-primary-600" />,
      description: t('home.stats.patientSatisfaction')
    },
    {
      label: t('home.stats.responseTime'),
      value: '2.4s',
      change: '-15%',
      icon: <Clock className="w-6 h-6 text-primary-600" />,
      description: t('home.stats.aiSpeed')
    },
    {
      label: t('home.stats.emergencyCases'),
      value: '1.2K',
      change: '-8%',
      icon: <Activity className="w-6 h-6 text-primary-600" />,
      description: t('home.stats.handledMonth')
    },
  ];

  const features = [
    {
      title: t('home.features.aiDiag'),
      description: t('home.features.aiDiagDesc'),
      icon: <Brain className="w-8 h-8 text-primary-600" />,
      onClick: () => navigate('/analysis')
    },
    {
      title: t('home.features.voiceHealth'),
      description: t('home.features.voiceHealthDesc'),
      icon: <Mic className="w-8 h-8 text-primary-600" />,
      onClick: () => document.getElementById('voice-analyzer')?.scrollIntoView({ behavior: 'smooth' })
    },
    {
      title: t('home.features.realtimeAppt'),
      description: t('home.features.realtimeApptDesc'),
      icon: <Calendar className="w-8 h-8 text-primary-600" />,
      onClick: () => setShowAppointmentModal(true)
    },
    {
      title: t('home.features.emergencyResp'),
      description: t('home.features.emergencyRespDesc'),
      icon: <AlertTriangle className="w-8 h-8 text-primary-600" />,
      onClick: () => navigate('/map-prediction')
    },
  ];



  const dailyTips = [
    'Stay hydrated - Drink at least 8 glasses of water daily',
    'Get 7-8 hours of quality sleep each night',
    'Include 30 minutes of moderate exercise in your daily routine',
    'Practice mindfulness meditation for 10 minutes daily',
    'Schedule regular health check-ups, even when feeling well'
  ];

  // Add these components inside your Home component:

  // Auth Toggle Button Component
  const AuthToggleButton: React.FC = () => {
    const { isAuthenticated, logout } = useAuth();
    const { t } = useTranslation();

    return (
      <Button
        variant="secondary"
        size="sm"
        leftIcon={isAuthenticated ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
        onClick={() => {
          if (isAuthenticated) {
            logout();
          } else {
            navigate('/login');
          }
        }}
        className="border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300"
      >
        {isAuthenticated ? 'Logout' : 'Login'}
      </Button>
    );
  };

  // Conditional Content Component
  const AuthConditionalContent: React.FC = () => {
    const { isAuthenticated, user } = useAuth();
    const { t } = useTranslation();
    const [appointments, setAppointments] = useState<Array<{
      id: string | number;
      type: string;
      status: string;
      doctor: string;
      specialization: string;
      date: string;
      time: string;
      duration: string;
    }>>([]);
    const [notifications, setNotifications] = useState<Array<{
      id: string | number;
      type: string;
      title: string;
      message: string;
      timestamp: string;
      read: boolean;
      priority: string;
    }>>([]);
    const [loadingAppointments, setLoadingAppointments] = useState(false);

    // Pull this user's real upcoming appointments from the backend, then
    // derive a lightweight notification feed from them (reminders/status
    // updates) rather than depending on the SMS/emergency notification
    // system, which tracks a different kind of record.
    useEffect(() => {
      if (!isAuthenticated || !user) return;

      const API_URL = import.meta.env.VITE_API_URL || 'https://healthcare-backend-tylz.onrender.com/api';

      const load = async () => {
        setLoadingAppointments(true);
        try {
          const patientRes = await fetch(`${API_URL}/appointments/patient-for-user/${user.id}`);
          if (!patientRes.ok) return;
          const patientJson = await patientRes.json();
          const patientId = patientJson?.data?.patientId ?? patientJson?.data?.id;
          if (!patientId) return;

          const apptRes = await fetch(`${API_URL}/appointments/patient/${patientId}`);
          const apptJson = await apptRes.json();
          const raw: any[] = apptJson?.data || [];

          const STATUS_LABEL: Record<string, string> = {
            pending_confirmation: 'Awaiting Confirmation',
            confirmed: 'Confirmed',
            scheduled: 'Confirmed',
            completed: 'Completed',
            cancelled: 'Cancelled',
          };

          const upcoming = raw
            .filter((a) => a.status !== 'cancelled' && new Date(a.scheduledTime).getTime() >= Date.now() - 60 * 60 * 1000)
            .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

          setAppointments(
            upcoming.map((a) => ({
              id: a.id,
              type: a.appointmentType === 'online' ? 'Video Consultation' : 'In-person',
              status: STATUS_LABEL[a.status] || a.status,
              doctor: a.doctorName ? `Dr. ${a.doctorName}` : 'Doctor',
              specialization: a.doctorSpecialty || '',
              date: new Date(a.scheduledTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
              time: new Date(a.scheduledTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
              duration: `${a.duration || 30} min`,
            }))
          );

          setNotifications(
            upcoming.slice(0, 5).map((a) => ({
              id: `apt-${a.id}`,
              type: 'Appointment',
              title:
                a.status === 'pending_confirmation'
                  ? 'Awaiting doctor confirmation'
                  : a.status === 'scheduled'
                  ? 'Appointment confirmed'
                  : 'Appointment update',
              message: `${a.doctorName ? `Dr. ${a.doctorName}` : 'Your doctor'} — ${new Date(a.scheduledTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at ${new Date(a.scheduledTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`,
              timestamp: a.createdAt || a.scheduledTime,
              read: true,
              priority: 'normal',
            }))
          );
        } catch (err) {
          console.error('Failed to load appointments for dashboard:', err);
        } finally {
          setLoadingAppointments(false);
        }
      };

      load();
    }, [isAuthenticated, user?.id]);

    if (!isAuthenticated || !user) {
      return (
        <div className="max-w-2xl mx-auto text-center">
          <div className="p-8 rounded-2xl bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <LogIn className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              Sign in to View Your Health Dashboard
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-md mx-auto">
              Access personalized appointments, health notifications, and your complete medical history.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-xl mx-auto mb-8">
              <button
                onClick={() => navigate('/login')}
                className="p-4 rounded-xl bg-white dark:bg-neutral-800 hover:ring-2 hover:ring-primary-400 transition-shadow text-center"
              >
                <Calendar className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Appointments</p>
                <p className="text-xs text-neutral-500 mt-1">Sign in to view</p>
              </button>
              <button
                onClick={() => navigate('/login')}
                className="p-4 rounded-xl bg-white dark:bg-neutral-800 hover:ring-2 hover:ring-primary-400 transition-shadow text-center"
              >
                <Bell className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Notifications</p>
                <p className="text-xs text-neutral-500 mt-1">Sign in to view</p>
              </button>
              <button
                onClick={() => navigate('/login')}
                className="p-4 rounded-xl bg-white dark:bg-neutral-800 hover:ring-2 hover:ring-primary-400 transition-shadow text-center"
              >
                <User className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Personalized Data</p>
                <p className="text-xs text-neutral-500 mt-1">Sign in to view</p>
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                leftIcon={<LogIn className="w-5 h-5" />}
                onClick={() => navigate('/login')}
              >
                Sign In to Continue
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/signup')}
              >
                Create Account
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* Personalized Greeting */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-full border-4 border-white dark:border-neutral-800 shadow-lg"
              />
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  Welcome back, {user.name.split(' ')[0]}!
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Here's your health overview for today
                </p>
              </div>
            </div>
            <Badge className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
              {user.location}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Appointments */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                Upcoming Appointments
              </h3>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setShowAppointmentModal(true)}
              >
                New Appointment
              </Button>
            </div>

            <div className="space-y-4">
              {appointments.map((apt: any) => (
                <GlassCard key={apt.id} className="p-6 hover-lift">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className={
                          apt.type === 'Video Consultation' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                            apt.type === 'In-person' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                              'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        }>
                          {apt.type}
                        </Badge>
                        <Badge variant="outline" className={
                          apt.status === 'Confirmed' ? 'border-green-200 text-green-700 dark:border-green-800 dark:text-green-300' :
                            apt.status === 'Awaiting Confirmation' ? 'border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300' :
                              apt.status === 'Completed' ? 'border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400' :
                                'border-red-200 text-red-700 dark:border-red-800 dark:text-red-300'
                        }>
                          {apt.status}
                        </Badge>
                      </div>

                      <h4 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                        {apt.doctor}
                      </h4>
                      <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                        {apt.specialization}
                      </p>

                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-neutral-500" />
                          <span className="text-sm text-neutral-700 dark:text-neutral-300">{apt.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-neutral-500" />
                          <span className="text-sm text-neutral-700 dark:text-neutral-300">{apt.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-neutral-500" />
                          <span className="text-sm text-neutral-700 dark:text-neutral-300">{apt.duration}</span>
                        </div>
                      </div>
                    </div>

                    <Button variant="ghost" size="sm" onClick={() => navigate('/patient-portal')}>
                      Details
                    </Button>
                  </div>
                </GlassCard>
              ))}
            </div>

            {loadingAppointments && appointments.length === 0 && (
              <GlassCard className="p-8 text-center">
                <Calendar className="w-8 h-8 text-neutral-400 mx-auto animate-pulse" />
              </GlassCard>
            )}

            {!loadingAppointments && appointments.length === 0 && (
              <GlassCard className="p-8 text-center">
                <Calendar className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                  No Upcoming Appointments
                </h4>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  Schedule your next appointment to continue your health journey
                </p>
                <Button
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => navigate('/patient-portal')}
                >
                  Book Appointment
                </Button>
              </GlassCard>
            )}
          </div>

          {/* Health Notifications */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary-600" />
                Health Notifications
              </h3>
              <Badge variant="outline">
                {notifications.filter((n: any) => !n.read).length} New
              </Badge>
            </div>

            <div className="space-y-4">
              {notifications.map((notification: any) => (
                <GlassCard
                  key={notification.id}
                  className={`p-4 ${!notification.read ? 'bg-primary-50/50 dark:bg-primary-900/20' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${notification.type === 'Appointment' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      notification.type === 'Assessment' ? 'bg-green-100 dark:bg-green-900/30' :
                        notification.type === 'Voice Analysis' ? 'bg-purple-100 dark:bg-purple-900/30' :
                          'bg-amber-100 dark:bg-amber-900/30'
                      }`}>
                      {notification.type === 'Appointment' ? <Calendar className="w-4 h-4 text-blue-600" /> :
                        notification.type === 'Assessment' ? <Stethoscope className="w-4 h-4 text-green-600" /> :
                          notification.type === 'Voice Analysis' ? <User className="w-4 h-4 text-purple-600" /> :
                            <Bell className="w-4 h-4 text-amber-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-neutral-900 dark:text-white text-sm">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-primary-600"></div>
                        )}
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500 dark:text-neutral-500">
                          {notification.timestamp}
                        </span>
                        <Badge size="sm" className={
                          notification.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                            notification.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                              'bg-neutral-100 text-neutral-700 dark:bg-neutral-900/30 dark:text-neutral-300'
                        }>
                          {notification.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>

            {/* Health Status Summary */}
            <GlassCard className="p-6 mt-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h4 className="font-bold text-neutral-900 dark:text-white">Health Status</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Last updated today
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">Appointments</span>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    {appointments.filter((a: any) => a.status === 'Confirmed' || a.status === 'Awaiting Confirmation').length} Upcoming
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">Assessments</span>
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    2 Completed
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">Medication</span>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    On Track
                  </Badge>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </>
    );
  };

  const baseInsights = newsData.length > 0 ? newsData : medicalInsights;
  const filteredInsights = insightCategory
    ? baseInsights.filter((a) => a.category === insightCategory)
    : baseInsights;
  const visibleInsights = showAllInsights ? filteredInsights : filteredInsights.slice(0, 4);

  const toggleDailyReminders = async () => {
    if (remindersEnabled) {
      setRemindersEnabled(false);
      localStorage.setItem('daily_reminders_enabled', 'false');
      return;
    }
    if (typeof Notification === 'undefined') {
      alert("Your browser doesn't support notifications.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setRemindersEnabled(true);
      localStorage.setItem('daily_reminders_enabled', 'true');
      new Notification('Daily reminders enabled', {
        body: "We'll remind you here each day to check in on your wellness goals.",
      });
    } else {
      alert('Notification permission was denied. Enable it in your browser settings to receive daily reminders.');
    }
  };

  const handleNewsletterSubmit = async () => {
    if (!newsletterEmail || !newsletterEmail.includes('@')) return;
    const API_URL = import.meta.env.VITE_API_URL || 'https://healthcare-backend-tylz.onrender.com/api';
    try {
      const res = await fetch(`${API_URL}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      if (!res.ok) throw new Error('Subscribe failed');
      setNewsletterState('saved');
      setNewsletterEmail('');
    } catch (err) {
      console.error('Newsletter subscribe failed:', err);
      alert("Couldn't subscribe right now — please try again shortly.");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section - Enhanced */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-primary-50/30 dark:from-[#0B1221] dark:via-[#0F172A] dark:to-[#1E293B] py-24 md:py-32">
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-primary-100/40 to-transparent dark:from-primary-900/20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/30 to-transparent dark:from-[#0B1221]/30"></div>

        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center fade-in-up">
            <div className="space-y-8">
              <div className="space-y-6">
                <Badge variant="outline" className="px-5 py-2.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-primary-200/50 dark:border-primary-800/50 rounded-full shadow-sm w-max">
                  <TrendingUp className="w-4 h-4 mr-2 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium tracking-wide text-slate-800 dark:text-slate-200">{t('home.hero.trustedBy')}</span>
                </Badge>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                  {t('home.hero.titlePart1')}
                  <span className="bg-gradient-to-r from-primary-600 to-blue-600 dark:from-primary-400 dark:to-blue-400 bg-clip-text text-transparent block mt-2 pb-2">{t('home.hero.titlePart2')}</span>
                </h1>

                <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl font-light">
                  {t('home.hero.subtitle')}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  leftIcon={<Calendar className="w-5 h-5" />}
                  onClick={() => setShowAppointmentModal(true)}
                  className="bg-primary-600 hover:bg-primary-700 text-white shadow-[0_8px_30px_rgb(0,194,203,0.3)] dark:shadow-[0_8px_30px_rgb(0,194,203,0.2)] rounded-xl px-8 py-4 text-lg font-medium transition-all hover:-translate-y-1"
                >
                  {t('home.hero.bookAppointment')}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  leftIcon={<Video className="w-5 h-5" />}
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 shadow-sm rounded-xl px-8 py-4 text-lg font-medium transition-all hover:-translate-y-1 text-slate-700 dark:text-slate-200"
                  onClick={() => setShowAppointmentModal(true)}
                >
                  {t('home.hero.videoConsultation')}
                </Button>
              </div>

              {/* Quick Stats - Enhanced */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10">
                <div className="flex flex-col text-left p-5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-2xl shadow-sm hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors">
                  <div className="text-3xl font-extrabold text-primary-600 dark:text-primary-400 tracking-tight">24/7</div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wider">{t('home.hero.stats.aiSupport')}</div>
                </div>
                <div className="flex flex-col text-left p-5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-2xl shadow-sm hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors">
                  <div className="text-3xl font-extrabold text-primary-600 dark:text-primary-400 tracking-tight">500+</div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wider">{t('home.hero.stats.doctors')}</div>
                </div>
                <div className="flex flex-col text-left p-5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-2xl shadow-sm hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors">
                  <div className="text-3xl font-extrabold text-primary-600 dark:text-primary-400 tracking-tight">98.2%</div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wider">{t('home.hero.stats.successRate')}</div>
                </div>
                <div className="flex flex-col text-left p-5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-2xl shadow-sm hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors">
                  <div className="text-3xl font-extrabold text-primary-600 dark:text-primary-400 tracking-tight">2.4s</div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wider">{t('home.hero.stats.responseTime')}</div>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* Animated background blobs with wider spread and softer blur */}
              <div className="absolute -top-10 -right-10 w-[28rem] h-[28rem] bg-primary-400/20 dark:bg-primary-500/10 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-[100px] animate-blob"></div>
              <div className="absolute -bottom-10 -left-10 w-[28rem] h-[28rem] bg-blue-400/20 dark:bg-blue-500/10 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-[100px] animate-blob animation-delay-2000"></div>
              
              <div className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-3xl p-2 border border-white/40 dark:border-slate-700/50 rounded-[2.5rem] shadow-2xl relative">
                <div className="bg-white/70 dark:bg-slate-900/70 rounded-[2rem] p-8 md:p-12 h-full relative overflow-hidden shadow-inner">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary-400/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>

                  <div className="text-center space-y-10 relative z-10">
                    <div className="w-24 h-24 mx-auto rounded-[2rem] bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center shadow-lg shadow-primary-500/30 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                      <Heart className="w-12 h-12 text-white transform -rotate-3 hover:rotate-0 transition-transform duration-300" />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {t('home.hero.startJourney')}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-lg">
                        {t('home.hero.healthInsights')}
                      </p>
                    </div>

                    <div className="space-y-4 pt-4">
                      <button
                        className="w-full group flex items-center p-5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-lg transition-all text-left"
                        onClick={() => navigate('/health-assessment')}
                      >
                        <div className="w-14 h-14 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mr-5 group-hover:scale-110 transition-transform shadow-sm">
                          <Stethoscope className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{t('home.hero.healthAssessment')}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">{t('home.hero.assessmentDesc')}</div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                      </button>

                      <button
                        className="w-full group flex items-center p-5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-lg transition-all text-left"
                        onClick={() => navigate('/chat')}
                      >
                        <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mr-5 group-hover:scale-110 transition-transform shadow-sm">
                          <MessageSquare className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{t('home.hero.chatAssistant')}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">{t('home.hero.chatDesc')}</div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                      </button>

                      <button
                        className="w-full group flex items-center p-5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-teal-200 dark:hover:border-teal-800 hover:shadow-lg transition-all text-left"
                        onClick={() => navigate('/map-prediction')}
                      >
                        <div className="w-14 h-14 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mr-5 group-hover:scale-110 transition-transform shadow-sm">
                          <MapPin className="w-7 h-7 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{t('home.hero.findHospitals')}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">{t('home.hero.findDesc')}</div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Voice Analyzer Section */}
      <section id="voice-analyzer" className="py-12">
        <Container>
          <VoiceAnalyzer />
        </Container>
      </section>

      {/* Stats Section */}
      {/* Stats Section - Enhanced */}
      <section className="py-16">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4 clinical-heading">
              {t('home.stats.trustedPlatform')}
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              {t('home.stats.trustedSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="fade-in-up h-full"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <GlassCard
                  hoverable
                  className="p-6 border-0 hover-lift h-full flex flex-col justify-between"
                >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                      {stat.label}
                    </p>
                    <p className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
                      {stat.value}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${parseInt(stat.change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change}
                      </span>
                      <span className="text-sm text-neutral-500 clinical-subtle">
                        {stat.description}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-xl">
                    {stat.icon}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-6">
                  <div className="h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${parseInt(stat.change) >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: '85%' }}
                    ></div>
                  </div>
                </div>
              </GlassCard>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Features */}
      {/* Features - Enhanced */}
      <section className="py-20 bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-800/50">
        <Container>
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
              <Zap className="w-4 h-4 mr-2" />
              {t('home.features.badge')}
            </Badge>

            <h2 className="text-4xl font-bold text-neutral-900 dark:text-white mb-6 clinical-heading">
              {t('home.features.title')}
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto leading-relaxed">
              {t('home.features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Card className="h-full p-8 hover-lift border-0 overflow-hidden">
                  {/* Gradient border effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="relative z-10">
                    <div className="p-4 inline-flex rounded-xl bg-gradient-to-br from-primary-100 to-blue-100 dark:from-primary-900/30 dark:to-blue-900/30 mb-6 group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>

                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4 leading-tight">
                      {feature.title}
                    </h3>

                    <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
                      {feature.description}
                    </p>

                    <button 
                      onClick={feature.onClick}
                      className="flex items-center text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline focus:outline-none"
                    >
                      {t('home.features.learnMore')}
                      <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          {/* Feature highlight bar */}
          <div className="mt-16 p-6 rounded-2xl bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white dark:bg-neutral-800">
                  <Shield className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 dark:text-white">{t('home.features.hipaa')}</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{t('home.features.hipaaDesc')}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white dark:bg-neutral-800">
                  <Clock className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 dark:text-white">{t('home.features.support')}</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{t('home.features.supportDesc')}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white dark:bg-neutral-800">
                  <Award className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 dark:text-white">{t('home.features.verified')}</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{t('home.features.verifiedDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Success Stories */}
      {/* Success Stories - Enhanced Interactive Carousel */}
      <section
        className="py-16"
        onMouseEnter={() => setIsCarouselPaused(true)}
        onMouseLeave={() => setIsCarouselPaused(false)}
      >
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">
              {t('home.stories.title')}
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              {t('home.stories.subtitle')}
            </p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            {/* Navigation Arrows */}
            <button
              onClick={prevStory}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/90 dark:bg-neutral-800/90 shadow-lg hover:bg-white dark:hover:bg-neutral-800 transition-all hover:scale-110 -translate-x-4"
              aria-label="Previous story"
            >
              <ChevronLeft className="w-6 h-6 text-primary-600" />
            </button>

            <button
              onClick={nextStory}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/90 dark:bg-neutral-800/90 shadow-lg hover:bg-white dark:hover:bg-neutral-800 transition-all hover:scale-110 translate-x-4"
              aria-label="Next story"
            >
              <ChevronRightIcon className="w-6 h-6 text-primary-600" />
            </button>

            {/* Carousel Content */}
            <GlassCard className="p-0 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Patient Image */}
                <div className="relative h-64 lg:h-auto min-h-[300px]">
                  <img
                    src={successStories[currentStoryIndex].image}
                    alt={successStories[currentStoryIndex].name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent lg:bg-gradient-to-r lg:from-black/40 lg:to-transparent" />

                  {/* Avatar Badge */}
                  <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {successStories[currentStoryIndex].avatarInitials}
                  </div>

                  {/* City Badge */}
                  <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-primary-600" />
                      <span className="text-sm font-medium">{successStories[currentStoryIndex].city}</span>
                    </div>
                  </div>
                </div>

                {/* Story Details */}
                <div className="p-8 lg:p-10">
                  {/* Quote Icon */}
                  <div className="mb-4">
                    <svg className="w-8 h-8 text-primary-300" fill="currentColor" viewBox="0 0 32 32">
                      <path d="M10 8v8c0 2.21-1.79 4-4 4H4v-4h2c1.1 0 2-.9 2-2V8c0-2.21 1.79-4 4-4h2v4h-2c-1.1 0-2 .9-2 2zm14 0v8c0 2.21-1.79 4-4 4h-2v-4h2c1.1 0 2-.9 2-2V8c0-2.21 1.79-4 4-4h2v4h-2c-1.1 0-2 .9-2 2z" />
                    </svg>
                  </div>

                  {/* Quote */}
                  <blockquote className="text-xl lg:text-2xl text-neutral-700 dark:text-neutral-300 mb-6 leading-relaxed">
                    "{successStories[currentStoryIndex].quote}"
                  </blockquote>

                  {/* Patient Info */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-xl text-neutral-900 dark:text-white">
                        {successStories[currentStoryIndex].name}
                      </h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {t('home.stories.age')} {successStories[currentStoryIndex].age}
                      </p>
                    </div>

                    {/* Condition Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium">
                      <Activity className="w-3 h-3" />
                      {successStories[currentStoryIndex].condition}
                    </div>

                    {/* Doctor and Hospital */}
                    <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                      <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                        <Users className="w-3 h-3" />
                        <span className="font-medium">{t('home.stories.treatedBy')}</span> {successStories[currentStoryIndex].doctor}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-500">
                        <Shield className="w-3 h-3" />
                        {successStories[currentStoryIndex].hospital}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < successStories[currentStoryIndex].rating ? 'text-yellow-500 fill-current' : 'text-neutral-300 dark:text-neutral-700'}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        {successStories[currentStoryIndex].rating}.0/5.0
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-8">
              {successStories.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToStory(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentStoryIndex
                    ? 'w-8 bg-primary-600'
                    : 'bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400 dark:hover:bg-neutral-600'
                    }`}
                  aria-label={`Go to story ${index + 1}`}
                />
              ))}
            </div>

            {/* Auto-slide indicator */}
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                <Clock className="w-3 h-3" />
                {t('home.stories.autoRotates')}
                {isCarouselPaused && (
                  <span className="text-xs text-primary-600 ml-2">{t('home.stories.paused')}</span>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Weather & Notifications */}
      <section className="py-20 bg-gradient-to-r from-blue-50/80 to-cyan-50/80 dark:from-blue-900/20 dark:to-cyan-900/20">
        <Container>
          <WeatherNotifications />
        </Container>
      </section>

      {/* Upcoming Appointments & Notifications - Conditionally shown based on auth */}
      <section className="py-16">
        <Container>
          {/* Auth Toggle Button for Demo */}
          <div className="flex justify-end mb-6">
            <AuthToggleButton />
          </div>

          {/* Conditionally render based on authentication */}
          <AuthConditionalContent />
        </Container>
      </section>

      {/* Blog & Daily Tips */}
      {/* Medical Insights & Blog - Enhanced */}
      <section className="py-20 bg-gradient-to-b from-white to-neutral-50/50 dark:from-neutral-900 dark:to-neutral-800/50">
        <Container>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 mb-4">
              <Brain className="w-4 h-4" />
              <span className="text-sm font-medium">{t('home.insights.badge')}</span>
            </div>
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
              {t('home.insights.title')}
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              {t('home.insights.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Featured Articles - Main Content */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {visibleInsights.map((article) => (
                  <article
                    key={article.id}
                    className="group cursor-pointer"
                    onClick={() => {
                      if ((article as any).url) {
                        window.open((article as any).url, '_blank');
                      } else {
                        setSelectedArticle(article as MedicalInsight);
                        setShowArticleModal(true);
                      }
                    }}
                  >
                    <Card className="h-full overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      {/* Article Image */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm">
                            {article.category}
                          </Badge>
                        </div>
                        <div className="absolute bottom-4 right-4">
                          <Badge variant="outline" className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm">
                            {article.readTime}
                          </Badge>
                        </div>
                      </div>

                      {/* Article Content */}
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <img
                            src={article.authorAvatar}
                            alt={article.author}
                            className="w-8 h-8 rounded-full"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                              {article.author}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              {article.date}
                            </p>
                          </div>
                        </div>

                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3 line-clamp-2">
                          {article.title}
                        </h3>

                        <p className="text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-3">
                          {article.excerpt}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {article.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Read More */}
                        <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
                          <span className="text-primary-600 dark:text-primary-400 text-sm font-medium group-hover:underline">
                            {t('home.insights.readFull')}
                          </span>
                          <ChevronRight className="w-4 h-4 text-primary-600 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Card>
                  </article>
                ))}
              </div>

              {/* View All / Show Fewer */}
              {filteredInsights.length > 4 && (
                <div className="mt-8 text-center">
                  <Button
                    variant="secondary"
                    leftIcon={<TrendingUp className="w-4 h-4" />}
                    className="border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/30"
                    onClick={() => setShowAllInsights((v) => !v)}
                  >
                    {showAllInsights ? t('home.insights.showFewer') : t('home.insights.viewAll', { count: filteredInsights.length })}
                  </Button>
                </div>
              )}
            </div>

            {/* Sidebar - Daily Tips & Categories */}
            <div className="space-y-6">
              {/* Categories */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary-600" />
                  {t('home.insights.browseCategory')}
                </h3>
                <div className="space-y-3">
                  {insightCategory && (
                    <button
                      onClick={() => { setInsightCategory(null); setShowAllInsights(false); }}
                      className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline mb-1"
                    >
                      <ChevronLeft className="w-4 h-4" /> {t('home.insights.allCategories')}
                    </button>
                  )}
                  {['Cardiology', 'Respiratory', 'Mental Health', 'Nutrition', 'Preventive Care', 'Pediatrics'].map((category) => (
                    <button
                      key={category}
                      onClick={() => { setInsightCategory(category); setShowAllInsights(false); }}
                      className={`flex items-center justify-between w-full p-3 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group ${
                        insightCategory === category ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                      }`}
                    >
                      <span className="text-neutral-700 dark:text-neutral-300">{category}</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              </Card>

              {/* Daily Health Tips - Keep your existing but enhanced */}
              <Card className="p-6">
                <div className="flex items-center mb-6">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 mr-4">
                    <Heart className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white">
                      {t('home.insights.wellnessFocus')}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {dailyTips.map((tip, index) => (
                    <div key={index} className="flex items-start p-4 bg-gradient-to-r from-white to-green-50 dark:from-neutral-800 dark:to-green-900/10 rounded-xl border border-green-100 dark:border-green-800/30">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">{tip}</span>
                    </div>
                  ))}
                </div>

                <Button
                  variant={remindersEnabled ? 'secondary' : 'ghost'}
                  className="w-full mt-6"
                  leftIcon={<Bell className="w-4 h-4" />}
                  onClick={toggleDailyReminders}
                >
                  {remindersEnabled ? t('home.insights.remindersEnabled') : t('home.insights.enableReminders')}
                </Button>
              </Card>

              {/* Newsletter Signup */}
              <Card className="p-6 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="font-bold text-neutral-900 dark:text-white mb-2">
                    {t('home.insights.newsletterTitle')}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                    {t('home.insights.newsletterDesc')}
                  </p>

                  {newsletterState === 'saved' ? (
                    <p className="text-sm text-primary-700 dark:text-primary-300 font-medium">
                      {t('home.insights.subscribed')}
                    </p>
                  ) : (
                  <div className="space-y-3">
                    <Input
                      type="email"
                      placeholder={t('home.insights.emailPlaceholder')}
                      className="bg-white dark:bg-neutral-800"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleNewsletterSubmit(); }}
                    />
                    <Button className="w-full" onClick={handleNewsletterSubmit} disabled={!newsletterEmail.includes('@')}>
                      {t('home.insights.subscribe')}
                    </Button>
                  </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* Article Detail Modal */}
      {showArticleModal && selectedArticle && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div
              className="fixed inset-0 transition-opacity bg-black bg-opacity-50"
              onClick={() => setShowArticleModal(false)}
            />

            {/* Modal */}
            <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-neutral-900 rounded-2xl shadow-xl">
              {/* Modal Header */}
              <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between p-6">
                  <div>
                    <Badge className="mb-2">{selectedArticle.category}</Badge>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
                      {selectedArticle.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowArticleModal(false)}
                    className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <ChevronRight className="w-5 h-5 rotate-90" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                {/* Article Header */}
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={selectedArticle.authorAvatar}
                    alt={selectedArticle.author}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {selectedArticle.author}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                      <span>{selectedArticle.date}</span>
                      <span>•</span>
                      <span>{selectedArticle.readTime}</span>
                    </div>
                  </div>
                </div>

                {/* Featured Image */}
                <div className="relative h-64 md:h-80 rounded-xl overflow-hidden mb-8">
                  <img
                    src={selectedArticle.imageUrl}
                    alt={selectedArticle.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Article Content */}
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: selectedArticle.fullContent.replace(/\n/g, '<br/>') }} />
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-800">
                  {selectedArticle.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Related Articles */}
                {selectedArticle.relatedArticles && selectedArticle.relatedArticles.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-800">
                    <h4 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                      Related Insights
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {medicalInsights
                        .filter(article => selectedArticle.relatedArticles?.includes(article.id))
                        .map(article => (
                          <div
                            key={article.id}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                            onClick={() => setSelectedArticle(article)}
                          >
                            <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden">
                              <img
                                src={article.imageUrl}
                                alt={article.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                                {article.title}
                              </p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                {article.category} • {article.readTime}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" leftIcon={<Share2 className="w-4 h-4" />}>
                      Share
                    </Button>
                    <Button variant="ghost" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                      Save
                    </Button>
                  </div>
                  <Button onClick={() => setShowArticleModal(false)}>
                    Close Article
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medical Disclaimer */}
      <section className="py-12">
        <Container>
          <div className="max-w-4xl mx-auto">
            <MedicalDisclaimer variant="critical" />
          </div>
        </Container>
      </section>

      {/* Appointment Booking Modal */}
      <AppointmentBookingModal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
      />
    </div>
  );
};