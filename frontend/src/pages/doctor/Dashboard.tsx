import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Container } from '../../components/layout/Container';
import { GlassCard } from '../../components/layout/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Calendar, Clock, Video, Phone, Mail, MapPin, Users, AlertTriangle, Check, X, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useRealtime } from '../../contexts/RealtimeContext';
import realtimeService from '../../services/realtime.service';

const API_URL = import.meta.env.VITE_API_URL || 'https://healthcare-backend-tylz.onrender.com/api';

interface Appointment {
  id: number;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  scheduledTime: string;
  appointmentType: string;
  status: string;
  meetingLink?: string;
  symptoms?: string[];
}

const STATUS_BADGE: Record<string, { variant: 'success' | 'warning' | 'error' | 'default'; label: string }> = {
  pending_confirmation: { variant: 'warning', label: 'Needs your response' },
  confirmed: { variant: 'success', label: 'Confirmed' },
  scheduled: { variant: 'success', label: 'Confirmed' },
  cancelled: { variant: 'error', label: 'Cancelled' },
  completed: { variant: 'default', label: 'Completed' },
};

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { emergencies } = useRealtime();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'past'>('today');
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [contactOpenId, setContactOpenId] = useState<number | null>(null);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [acknowledgedAlertIds, setAcknowledgedAlertIds] = useState<string[]>([]);

  // The logged-in User's id and the Doctor profile's id are different rows —
  // resolve the real one before fetching anything appointment-related.
  useEffect(() => {
    if (!user?.id) return;
    axios
      .get(`${API_URL}/doctors/doctor-for-user/${user.id}`)
      .then((res) => setDoctorId(res.data?.data?.doctorId ?? null))
      .catch(() => setProfileError('No doctor profile is linked to this account yet.'));
  }, [user?.id]);

  const [isAcceptingPatients, setIsAcceptingPatients] = useState(true);
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarBanner, setCalendarBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Settings modal states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [doctorSettings, setDoctorSettings] = useState({
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    availableHours: '09:00-17:00',
    consultationDuration: 30
  });

  const refetchDoctorProfile = useCallback(() => {
    if (!doctorId) return;
    axios
      .get(`${API_URL}/doctors/${doctorId}`)
      .then((res) => {
        const d = res.data?.data;
        if (d && typeof d.isAcceptingPatients === 'boolean') {
          setIsAcceptingPatients(d.isAcceptingPatients);
        }
        if (d) {
          setCalendarConnected(!!d.googleCalendarConnected);
          setDoctorSettings({
            availableDays: d.availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            availableHours: d.availableHours || '09:00-17:00',
            consultationDuration: d.consultationDuration || 30
          });
        }
      })
      .catch(() => {});
  }, [doctorId]);

  useEffect(() => {
    refetchDoctorProfile();
  }, [refetchDoctorProfile]);

  // The OAuth callback (backend) redirects back here with ?calendar=... —
  // there was previously no button to even start this flow AND the
  // redirect target was wrong ('/doctor/dashboard' vs the real
  // '/doctor-dashboard' route), so a doctor could never actually connect
  // their calendar at all. Both are fixed; this surfaces the result.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get('calendar');
    if (!result) return;

    if (result === 'connected') {
      setCalendarBanner({ type: 'success', message: 'Google Calendar connected — video appointments will now get a real Meet link when you confirm them.' });
      refetchDoctorProfile();
    } else if (result === 'no_refresh_token') {
      setCalendarBanner({ type: 'error', message: "Google didn't grant a reusable connection this time. Revoke Healthcare+'s access at myaccount.google.com/permissions and try connecting again." });
    } else if (result === 'error') {
      setCalendarBanner({ type: 'error', message: "Couldn't connect Google Calendar — please try again." });
    }

    // Clean the query param out of the URL without a full reload.
    window.history.replaceState({}, '', window.location.pathname);
  }, [refetchDoctorProfile]);

  const connectGoogleCalendar = () => {
    if (!doctorId) return;
    window.location.href = `${API_URL}/auth/google/connect/${doctorId}`;
  };

  const toggleAvailability = async () => {
    if (!doctorId) return;
    setTogglingAvailability(true);
    const next = !isAcceptingPatients;
    try {
      await axios.patch(`${API_URL}/doctors/${doctorId}/availability`, { isAcceptingPatients: next });
      setIsAcceptingPatients(next);
    } catch (error) {
      console.error('Failed to update availability:', error);
      alert("Couldn't update your availability — please try again.");
    } finally {
      setTogglingAvailability(false);
    }
  };

  const saveSettings = async () => {
    if (!doctorId) return;
    setSavingSettings(true);
    try {
      await axios.patch(`${API_URL}/doctors/${doctorId}/availability`, doctorSettings);
      setShowSettingsModal(false);
      alert('Settings updated successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert("Couldn't save settings — please try again.");
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchAppointments = useCallback(async () => {
    if (!doctorId) return;
    try {
      const response = await axios.get(`${API_URL}/appointments/doctor/${doctorId}`);
      if (response.data.success) {
        setAppointments(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    if (doctorId) fetchAppointments();
    else if (profileError) setLoading(false);
  }, [fetchAppointments, doctorId, profileError]);

  // Live-refresh when a new booking request comes in or another session
  // (e.g. this doctor logged in on another tab) changes an appointment's
  // status, instead of requiring a manual page reload.
  useEffect(() => {
    const onTransition = () => fetchAppointments();
    const onNotification = () => fetchAppointments();
    realtimeService.on('patient:transition', onTransition);
    realtimeService.on('notification:new', onNotification);
    return () => {
      realtimeService.off('patient:transition', onTransition);
      realtimeService.off('notification:new', onNotification);
    };
  }, [fetchAppointments]);

  const handleStartMeeting = (meetingLink: string) => {
    window.open(meetingLink, '_blank');
  };

  const respondToAppointment = async (id: number, status: 'confirmed' | 'cancelled') => {
    setRespondingId(id);
    try {
      const reason = status === 'cancelled' ? window.prompt('Reason for declining (optional):') || undefined : undefined;
      await axios.patch(`${API_URL}/appointments/${id}/status`, { status, reason });
      await fetchAppointments();
    } catch (error) {
      console.error('Failed to update appointment:', error);
      alert("Couldn't update this appointment — please try again.");
    } finally {
      setRespondingId(null);
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.scheduledTime).toDateString();
    const today = new Date().toDateString();

    if (activeTab === 'today') return aptDate === today;
    if (activeTab === 'upcoming') return new Date(apt.scheduledTime) > new Date();
    return new Date(apt.scheduledTime) < new Date();
  });

  const pendingCount = appointments.filter((a) => a.status === 'pending_confirmation').length;

  const visibleEmergencies = emergencies.filter((e: any) => !acknowledgedAlertIds.includes(e.alertId));

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-blue-950/30 py-8">
      {/* Animated background blobs */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/50 to-transparent dark:from-neutral-900/50 pointer-events-none z-0"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob pointer-events-none z-0"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000 pointer-events-none z-0"></div>
      
      <div className="relative z-10">
        <Container>
        {/* Emergency Alerts */}
        {visibleEmergencies.length > 0 && (
          <div className="mb-6 space-y-2">
            {visibleEmergencies.map((emergency: any) => (
              <div key={emergency.alertId} className="p-4 bg-red-50 border border-red-200 rounded-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <div>
                    <h3 className="font-bold text-red-800">Emergency Alert</h3>
                    <p className="text-sm text-red-600">{emergency.message}</p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    className="ml-auto"
                    onClick={() => setAcknowledgedAlertIds((prev) => [...prev, emergency.alertId])}
                  >
                    Acknowledge
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-1">
              Doctor Dashboard
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400">Welcome back, Dr. {user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={calendarConnected ? 'success' : 'default'}>
              {calendarConnected ? 'Google Calendar Connected' : 'Calendar Not Connected'}
            </Badge>
            {!calendarConnected && (
              <Button variant="secondary" size="sm" disabled={!doctorId} onClick={connectGoogleCalendar} leftIcon={<Calendar className="w-4 h-4" />}>
                Connect Google Calendar
              </Button>
            )}
            <Badge variant={isAcceptingPatients ? 'success' : 'default'}>
              {isAcceptingPatients ? 'Accepting Patients' : 'Unavailable'}
            </Badge>
            <Button
              variant="secondary"
              size="sm"
              disabled={togglingAvailability || !doctorId}
              onClick={toggleAvailability}
              leftIcon={togglingAvailability ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
            >
              {isAcceptingPatients ? 'Mark Unavailable' : 'Mark Available'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!doctorId}
              onClick={() => setShowSettingsModal(true)}
            >
              Settings
            </Button>
          </div>
        </div>

        {calendarBanner && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            calendarBanner.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            {calendarBanner.type === 'success' ? (
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={`text-sm ${calendarBanner.type === 'success' ? 'text-green-800 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              {calendarBanner.message}
            </p>
          </div>
        )}

        {profileError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{profileError}</p>
          </div>
        )}

        {/* Pending Requests Banner */}
        {pendingCount > 0 && (
          <div className="mb-8 p-5 bg-amber-50/50 dark:bg-amber-900/20 backdrop-blur-md border border-amber-200/50 dark:border-amber-700/50 rounded-[2rem] flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-amber-800 dark:text-amber-300 font-medium">
              You have <span className="font-bold text-amber-900 dark:text-amber-200 text-lg">{pendingCount}</span> appointment request{pendingCount > 1 ? 's' : ''} waiting for your response.
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 p-6 group hover:-translate-y-1">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mb-1">{appointments.filter(a => new Date(a.scheduledTime).toDateString() === new Date().toDateString()).length}</p>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Today's Appointments</p>
              </div>
            </div>
          </div>

          <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 p-6 group hover:-translate-y-1">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/40 dark:to-emerald-800/40 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <Video className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mb-1">{appointments.filter(a => a.appointmentType === 'online').length}</p>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Online Consultations</p>
              </div>
            </div>
          </div>

          <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 p-6 group hover:-translate-y-1">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-gradient-to-br from-purple-100 to-fuchsia-200 dark:from-purple-900/40 dark:to-fuchsia-800/40 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mb-1">{appointments.length}</p>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Patients</p>
              </div>
            </div>
          </div>

          <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 p-6 group hover:-translate-y-1">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-gradient-to-br from-yellow-100 to-amber-200 dark:from-yellow-900/40 dark:to-amber-800/40 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mb-1">4.5</p>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Avg. Rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Section */}
        <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-[2rem] shadow-xl p-8 md:p-10 mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Your Appointments</h2>
            <div className="flex bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-white/30 dark:border-slate-700/30">
              <Button variant={activeTab === 'today' ? 'primary' : 'ghost'} size="sm" onClick={() => setActiveTab('today')} className={`rounded-[1.2rem] px-6 ${activeTab === 'today' ? 'shadow-md' : ''}`}>
                Today
              </Button>
              <Button variant={activeTab === 'upcoming' ? 'primary' : 'ghost'} size="sm" onClick={() => setActiveTab('upcoming')} className={`rounded-[1.2rem] px-6 ${activeTab === 'upcoming' ? 'shadow-md' : ''}`}>
                Upcoming
              </Button>
              <Button variant={activeTab === 'past' ? 'primary' : 'ghost'} size="sm" onClick={() => setActiveTab('past')} className={`rounded-[1.2rem] px-6 ${activeTab === 'past' ? 'shadow-md' : ''}`}>
                Past
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-cyan"></div>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              No appointments found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((apt) => {
                const statusInfo = STATUS_BADGE[apt.status] || { variant: 'default' as const, label: apt.status };
                const isPending = apt.status === 'pending_confirmation';
                const isResponding = respondingId === apt.id;

                return (
                  <div
                    key={apt.id}
                    className={`p-6 border rounded-[1.5rem] hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                      isPending 
                        ? 'border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-900/20 backdrop-blur-md' 
                        : 'border-white/50 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl'
                    }`}
                  >
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-xl text-slate-900 dark:text-white">{apt.patientName}</h3>
                          <Badge variant={statusInfo.variant} size="sm" className="rounded-full shadow-sm">{statusInfo.label}</Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-sm text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50 p-2.5 rounded-xl w-fit border border-white/20 dark:border-slate-700/30">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Clock className="w-4 h-4 text-primary-500" />
                            {new Date(apt.scheduledTime).toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1.5 font-medium">
                            {apt.appointmentType === 'online' ? <Video className="w-4 h-4 text-emerald-500" /> : <MapPin className="w-4 h-4 text-primary-500" />}
                            {apt.appointmentType}
                          </div>
                        </div>
                        {apt.symptoms && apt.symptoms.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {apt.symptoms.map((s, i) => (
                              <Badge key={i} variant="outline" size="sm">{s}</Badge>
                            ))}
                          </div>
                        )}

                        {contactOpenId === apt.id && (
                          <div className="mt-3 flex flex-col gap-1 text-sm">
                            {apt.patientPhone && (
                              <a href={`tel:${apt.patientPhone}`} className="text-primary-600 hover:underline flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5" /> {apt.patientPhone}
                              </a>
                            )}
                            {apt.patientEmail && (
                              <a href={`mailto:${apt.patientEmail}`} className="text-primary-600 hover:underline flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5" /> {apt.patientEmail}
                              </a>
                            )}
                            {!apt.patientPhone && !apt.patientEmail && (
                              <span className="text-neutral-400">No contact details on file</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {isPending && (
                          <>
                            <Button
                              size="sm"
                              variant="clinical"
                              className="rounded-xl shadow-md bg-primary-600 hover:bg-primary-700 text-white border-0"
                              leftIcon={isResponding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              disabled={isResponding}
                              onClick={() => respondToAppointment(apt.id, 'confirmed')}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              className="rounded-xl shadow-md border-0"
                              leftIcon={<X className="w-4 h-4" />}
                              disabled={isResponding}
                              onClick={() => respondToAppointment(apt.id, 'cancelled')}
                            >
                              Decline
                            </Button>
                          </>
                        )}
                        {apt.appointmentType === 'online' && apt.meetingLink && (
                          <Button size="sm" leftIcon={<Video className="w-4 h-4" />} className="rounded-xl shadow-md bg-emerald-600 hover:bg-emerald-700 text-white border-0" onClick={() => handleStartMeeting(apt.meetingLink!)}>
                            Join Meeting
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          className="rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-sm border border-slate-200 dark:border-slate-700"
                          leftIcon={<Phone className="w-4 h-4" />}
                          onClick={() => setContactOpenId(contactOpenId === apt.id ? null : apt.id)}
                        >
                          Contact
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Container>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Doctor Settings</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-neutral-500 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Available Days</label>
                <div className="flex flex-wrap gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <label key={day} className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={doctorSettings.availableDays.includes(day)}
                        onChange={(e) => {
                          const newDays = e.target.checked 
                            ? [...doctorSettings.availableDays, day]
                            : doctorSettings.availableDays.filter(d => d !== day);
                          setDoctorSettings({...doctorSettings, availableDays: newDays});
                        }}
                      />
                      <span className="text-sm">{day.slice(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Available Hours (e.g. 09:00-17:00)</label>
                <input 
                  type="text" 
                  value={doctorSettings.availableHours}
                  onChange={(e) => setDoctorSettings({...doctorSettings, availableHours: e.target.value})}
                  className="w-full p-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Slot Duration (minutes)</label>
                <select 
                  value={doctorSettings.consultationDuration}
                  onChange={(e) => setDoctorSettings({...doctorSettings, consultationDuration: Number(e.target.value)})}
                  className="w-full p-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Button variant="secondary" onClick={() => setShowSettingsModal(false)}>Cancel</Button>
              <Button onClick={saveSettings} disabled={savingSettings}>
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
