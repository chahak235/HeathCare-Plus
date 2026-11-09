import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
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
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
        setLoading(false);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('storage'));
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
                                            {user.age || '--'}
                                        </div>
                                        <div className="text-sm text-neutral-600 dark:text-neutral-400">Age</div>
                                    </div>

                                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                                            {user.gender || '--'}
                                        </div>
                                        <div className="text-sm text-neutral-600 dark:text-neutral-400">Gender</div>
                                    </div>

                                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
                                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                                            {user.blood_type || '--'}
                                        </div>
                                        <div className="text-sm text-neutral-600 dark:text-neutral-400">Blood Type</div>
                                    </div>

                                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20">
                                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                                            --
                                        </div>
                                        <div className="text-sm text-neutral-600 dark:text-neutral-400">BMI</div>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Recent Activity */}
                        <GlassCard className="p-6">
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">
                                Recent Activity
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-center p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                                    <Activity className="w-5 h-5 text-primary-600 mr-3" />
                                    <div className="flex-1">
                                        <p className="font-medium">Health Check-up Completed</p>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400">2 days ago</p>
                                    </div>
                                    <Badge>Completed</Badge>
                                </div>

                                <div className="flex items-center p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                                    <Calendar className="w-5 h-5 text-green-600 mr-3" />
                                    <div className="flex-1">
                                        <p className="font-medium">Appointment with Dr. Smith</p>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Tomorrow, 10:00 AM</p>
                                    </div>
                                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                                        Scheduled
                                    </Badge>
                                </div>

                                <div className="flex items-center p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                                    <Heart className="w-5 h-5 text-red-600 mr-3" />
                                    <div className="flex-1">
                                        <p className="font-medium">Prescription Refill</p>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Due in 5 days</p>
                                    </div>
                                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                        Pending
                                    </Badge>
                                </div>
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
                                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-neutral-600 dark:text-neutral-400">Total Appointments</span>
                                    <span className="font-medium">5</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-neutral-600 dark:text-neutral-400">Health Records</span>
                                    <span className="font-medium">12</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-neutral-600 dark:text-neutral-400">Prescriptions</span>
                                    <span className="font-medium">3</span>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Quick Actions */}
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                                Quick Actions
                            </h3>
                            <div className="space-y-3">
                                <Button variant="secondary" fullWidth leftIcon={<Calendar className="w-4 h-4" />}>
                                    Book Appointment
                                </Button>
                                <Button variant="secondary" fullWidth leftIcon={<Activity className="w-4 h-4" />}>
                                    Health Metrics
                                </Button>
                                <Button variant="secondary" fullWidth leftIcon={<MapPin className="w-4 h-4" />}>
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