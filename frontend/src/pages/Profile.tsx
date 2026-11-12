import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import HealthProfileForm from '../components/emergency/HealthProfileForm';
import { emergencyService, HealthProfile } from '../services/emergency-service';
import realtimeService from '../services/realtime.service';
import { reviewsService } from '../services/reviews-service';
import RateVisit from '../components/features/reviews/RateVisit';
import JoinCallButton, { canJoin } from '../components/features/appointment/JoinCallButton';
import { Container } from '../components/layout/Container';
import { GlassCard } from '../components/layout/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
    User,
    Mail,
    Phone,
    Calendar,
    Shield,
    Edit,
    LogOut,
    Heart,
    Activity,
    Clock,
    MapPin
} from 'lucide-react';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    is_verified: boolean;
    created_at: string;
    age?: number;
    gender?: string;
    blood_type?: string;
}

export const Profile: React.FC = () => {
    const navigate = useNavigate();
    const { user: authUser, logout, token } = useAuth();
    const user = authUser as unknown as UserProfile | null;
    const loading = false;

    // Real data for the patient: health profile (for BMI) and their bookings
    const [health, setHealth] = useState<HealthProfile | null>(null);
    const [appointments, setAppointments] = useState<any[] | null>(null);
    const [reviewed, setReviewed] = useState<number[]>([]);

    useEffect(() => {
        if (!user || user.role !== 'patient' || !token) return;
        emergencyService.getProfile(token).then(setHealth).catch(() => setHealth(null));
        realtimeService
            .getPatientForUser(user.id)
            .then((r) => (r?.data?.patientId ? realtimeService.getPatientAppointments(r.data.patientId) : { data: [] }))
            .then((r) => setAppointments(Array.isArray(r?.data) ? r.data : []))
            .catch(() => setAppointments([]));
        reviewsService.mine().then(setReviewed).catch(() => setReviewed([]));
    }, [user?.id, user?.role, token]);

    const bmi = health?.heightCm && health?.weightKg
        ? (health.weightKg / Math.pow(health.heightCm / 100, 2)).toFixed(1)
        : null;
    const now = Date.now();
    const sortedAppointments = (appointments || [])
        .slice()
        .sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime());
    const upcomingCount = (appointments || []).filter(
        (a) => new Date(a.scheduledTime).getTime() > now && !['cancelled', 'completed'].includes(a.status)
    ).length;
    const fmtWhen = (iso: string) =>
        new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <Container className="py-12">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            </Container>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <Container className="py-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">My Profile</h1>
                    <p className="text-neutral-600 dark:text-neutral-400">
                        Manage your healthcare profile and preferences
                    </p>
                </div>

                {user.role === 'patient' && (
                    <section id="health-profile" className="mb-8">
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">Health & emergency profile</h2>
                        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                            Used by the emergency button to alert your family and show your medical details to responders.
                        </p>
                        <HealthProfileForm />
                    </section>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Profile Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Personal Information */}
                        <GlassCard className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                                    Personal Information
                                </h2>
                                <Button variant="secondary" size="sm" leftIcon={<Edit className="w-4 h-4" />}>
                                    Edit Profile
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                                            Full Name
                                        </label>
                                        <div className="flex items-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                                            <User className="w-5 h-5 text-neutral-400 mr-3" />
                                            <span className="font-medium">{user.name}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                                            Email Address
                                        </label>
                                        <div className="flex items-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                                            <Mail className="w-5 h-5 text-neutral-400 mr-3" />
                                            <span className="font-medium">{user.email}</span>
                                            {user.is_verified && (
                                                <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                    Verified
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                                            Phone Number
                                        </label>
                                        <div className="flex items-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                                            <Phone className="w-5 h-5 text-neutral-400 mr-3" />
                                            <span className="font-medium">{user.phone}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                                            Account Type
                                        </label>
                                        <div className="flex items-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                                            <Shield className="w-5 h-5 text-neutral-400 mr-3" />
                                            <span className="font-medium capitalize">{user.role}</span>
                                            <Badge className="ml-2 bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                                                Active
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Health Information */}
                            <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-800">
                                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                                    Health Information
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                                            {health?.heightCm ? `${health.heightCm} cm` : '--'}
                                        </div>
                                        <div className="text-sm text-neutral-600 dark:text-neutral-400">Height</div>
                                    </div>

                                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                                            {health?.weightKg ? `${health.weightKg} kg` : '--'}
                                        </div>
                                        <div className="text-sm text-neutral-600 dark:text-neutral-400">Weight</div>
                                    </div>

                                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
                                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                                            {health?.bloodGroup || '--'}
                                        </div>
                                        <div className="text-sm text-neutral-600 dark:text-neutral-400">Blood Type</div>
                                    </div>

                                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20">
                                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                                            {bmi || '--'}
                                        </div>
                                        <div className="text-sm text-neutral-600 dark:text-neutral-400">BMI</div>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Recent Activity: the patient's real bookings */}
                        <GlassCard className="p-6">
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">
                                Your Appointments
                            </h2>
                            <div className="space-y-4">
                                {appointments === null && user.role === 'patient' && (
                                    <p className="text-sm text-neutral-500">Loading…</p>
                                )}
                                {(user.role !== 'patient' || (appointments && appointments.length === 0)) && (
                                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                        No appointments yet.{' '}
                                        <button type="button" onClick={() => navigate('/doctors')} className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
                                            Book one
                                        </button>
                                    </div>
                                )}
                                {sortedAppointments.slice(0, 5).map((a) => {
                                    // Upcoming until the consult has ended (not just started), so Join stays during the call
                                    const endsAt = new Date(a.scheduledTime).getTime() + (a.duration || 30) * 60_000;
                                    const upcoming = endsAt > now && a.status !== 'cancelled';
                                    return (
                                        <div key={a.id} className="flex items-center p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                                            <Calendar className={`w-5 h-5 mr-3 ${upcoming ? 'text-primary-600' : 'text-neutral-400'}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">
                                                    {a.appointmentType === 'online' ? 'Video consult' : 'Clinic visit'} with {a.doctorName || 'doctor'}
                                                </p>
                                                <p className="text-sm text-neutral-600 dark:text-neutral-400">{fmtWhen(a.scheduledTime)} IST</p>
                                                {canJoin(a) && (
                                                    <div className="mt-2">
                                                        <JoinCallButton
                                                            appointment={a}
                                                            onLink={(link) => setAppointments((list) => (list || []).map((x) => (x.id === a.id ? { ...x, meetingLink: link } : x)))}
                                                        />
                                                    </div>
                                                )}
                                                {!upcoming && a.status !== 'cancelled' && !reviewed.includes(a.id) && (
                                                    <RateVisit appointmentId={a.id} doctorName={a.doctorName} onDone={() => setReviewed((r) => [...r, a.id])} />
                                                )}
                                            </div>
                                            <Badge className={a.status === 'cancelled'
                                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                : upcoming
                                                    ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300'
                                                    : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'}>
                                                {a.status === 'cancelled' ? 'Cancelled' : upcoming ? 'Upcoming' : 'Past'}
                                            </Badge>
                                        </div>
                                    );
                                })}
                            </div>
                        </GlassCard>
                    </div>

                    {/* Right Column - Quick Actions & Stats */}
                    <div className="space-y-6">
                        {/* Account Stats */}
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                                Account Overview
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-neutral-600 dark:text-neutral-400">Member Since</span>
                                    <span className="font-medium">
                                        {(user.created_at || (user as any).createdAt) ? new Date(user.created_at || (user as any).createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-neutral-600 dark:text-neutral-400">Total Appointments</span>
                                    <span className="font-medium">{appointments ? appointments.length : '…'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-neutral-600 dark:text-neutral-400">Upcoming</span>
                                    <span className="font-medium">{appointments ? upcomingCount : '…'}</span>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Quick Actions */}
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                                Quick Actions
                            </h3>
                            <div className="space-y-3">
                                <Button variant="secondary" fullWidth leftIcon={<Calendar className="w-4 h-4" />} onClick={() => navigate('/doctors')}>
                                    Book Appointment
                                </Button>
                                <Button variant="secondary" fullWidth leftIcon={<Activity className="w-4 h-4" />} onClick={() => navigate('/analysis')}>
                                    X-ray Analysis
                                </Button>
                                <Button variant="secondary" fullWidth leftIcon={<MapPin className="w-4 h-4" />} onClick={() => navigate('/map-prediction')}>
                                    Find Hospitals
                                </Button>
                            </div>
                        </GlassCard>

                        {/* Security Card */}
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                                Account Security
                            </h3>
                            <div className="space-y-4">
                                <Button variant="secondary" fullWidth leftIcon={<Shield className="w-4 h-4" />}>
                                    Change Password
                                </Button>
                                <Button variant="secondary" fullWidth leftIcon={<Mail className="w-4 h-4" />}>
                                    Two-Factor Auth
                                </Button>
                                <Button
                                    variant="danger"
                                    fullWidth
                                    leftIcon={<LogOut className="w-4 h-4" />}
                                    onClick={handleLogout}
                                >
                                    Log Out
                                </Button>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </Container>
    );
};