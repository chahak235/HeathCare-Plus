import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { Container } from '../components/layout/Container';
import { GlassCard } from '../components/layout/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import {
  User,
  Mail,
  Lock,
  Phone,
  Shield,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Heart,
  Building2,
  Search,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://healthcare-backend-tylz.onrender.com/api';

interface UnclaimedDoctor {
  id: number;
  name: string;
  specialty: string;
  hospital_name?: string | null;
}

interface SignUpForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  role: 'patient' | 'doctor' | 'hospital';
  specialty: string;
  claimDoctorId: number | null;
  hospitalName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  hospitalType: 'government' | 'private' | 'trust';
  totalBeds: string;
  icuBeds: string;
  operationTheatres: string;
  ambulancesTotal: string;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  agreeToTerms?: string;
  hospitalName?: string;
}

export const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState<SignUpForm>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    role: 'patient',
    specialty: '',
    claimDoctorId: null,
    hospitalName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    hospitalType: 'private',
    totalBeds: '',
    icuBeds: '',
    operationTheatres: '',
    ambulancesTotal: '',
  });

  const [unclaimedDoctors, setUnclaimedDoctors] = useState<UnclaimedDoctor[]>([]);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  useEffect(() => {
    if (formData.role !== 'doctor') return;
    setLoadingDoctors(true);
    axios
      .get(`${API_URL}/doctors/unclaimed`)
      .then((res) => setUnclaimedDoctors(res.data?.data || []))
      .catch(() => setUnclaimedDoctors([]))
      .finally(() => setLoadingDoctors(false));
  }, [formData.role]);

  const filteredUnclaimedDoctors = unclaimedDoctors.filter((d) =>
    d.name.toLowerCase().includes(doctorSearch.toLowerCase())
  );

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (exactly 10 digits)
    const cleanedPhone = formData.phone.replace(/\D/g, '');
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (cleanedPhone.length !== 10) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and numbers';
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms agreement validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    if (formData.role === 'hospital' && !formData.hospitalName.trim()) {
      newErrors.hospitalName = 'Hospital name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Use the AuthContext signup so the app's auth state updates immediately
      // (previously this called the API directly and wrote localStorage by hand,
      // which left the rest of the app thinking the user was still logged out).
      const result = await signup({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        claimDoctorId: formData.role === 'doctor' ? formData.claimDoctorId ?? undefined : undefined,
        specialty: formData.role === 'doctor' && !formData.claimDoctorId ? formData.specialty : undefined,
        hospitalName: formData.role === 'hospital' ? formData.hospitalName : undefined,
        address: formData.role === 'hospital' ? formData.address : undefined,
        city: formData.role === 'hospital' ? formData.city : undefined,
        state: formData.role === 'hospital' ? formData.state : undefined,
        pincode: formData.role === 'hospital' ? formData.pincode : undefined,
        hospitalType: formData.role === 'hospital' ? formData.hospitalType : undefined,
        totalBeds: formData.role === 'hospital' ? parseInt(formData.totalBeds) || 0 : undefined,
        icuBeds: formData.role === 'hospital' ? parseInt(formData.icuBeds) || 0 : undefined,
        operationTheatres: formData.role === 'hospital' ? parseInt(formData.operationTheatres) || 0 : undefined,
        ambulancesTotal: formData.role === 'hospital' ? parseInt(formData.ambulancesTotal) || 0 : undefined,
      });

      if (result.success) {
        setSignUpSuccess(true);

        // Redirect after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setErrors({ email: result.error || 'Unable to create account. This email may already be registered.' });
      }
    } catch (error) {
      console.error('Sign up error:', error);
      // Handle backend errors
      let errorMessage = 'Unable to connect to the server. Please check if the backend server is running.';
      
      if (error instanceof AxiosError) {
        // Check for connection refused errors
        if (error.code === 'ECONNREFUSED' || error.message.includes('ERR_CONNECTION_REFUSED') || error.message.includes('Failed to fetch')) {
          errorMessage = 'Cannot connect to the server. Please ensure the backend server is running on port 3001.';
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'Cannot connect to the server. Please ensure the backend server is running on port 3001.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setErrors({
        email: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePhoneChange = (value: string) => {
    // Restrict phone number to exactly 10 digits
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, phone: cleaned }));
    
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: undefined }));
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: 'Empty', color: 'bg-neutral-200' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    const strengths = [
      { label: 'Very Weak', color: 'bg-red-500' },
      { label: 'Weak', color: 'bg-orange-500' },
      { label: 'Fair', color: 'bg-yellow-500' },
      { label: 'Good', color: 'bg-blue-500' },
      { label: 'Strong', color: 'bg-green-500' },
    ];
    
    return strengths[strength] || strengths[0];
  };

  if (signUpSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-blue-950/30">
        <Container className="py-20">
          <div className="max-w-md mx-auto text-center">
            <GlassCard className="p-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
                Account Created Successfully!
              </h1>
              
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                Welcome to Healthcare AI Platform, {formData.name}! 
                Your account has been created and you'll be redirected shortly.
              </p>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                  <div className="text-sm text-primary-700 dark:text-primary-300">
                    Check your email at <strong>{formData.email}</strong> for verification.
                  </div>
                </div>
                
                <div className="text-sm text-neutral-500">
                  <div className="flex items-center justify-center space-x-2 animate-pulse">
                    <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                    <div>Redirecting to home page...</div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </Container>
      </div>
    );
  }

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-blue-950/30">
      <Container className="py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 mb-4">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-medium">Join Our Healthcare Community</span>
            </div>
            <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
              Create Your Account
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Join thousands of users managing their health with AI-powered tools
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form */}
            <div>
              <GlassCard className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Account Type */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      I am signing up as a
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['patient', 'doctor', 'hospital'] as const).map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, role }))}
                          disabled={isLoading}
                          className={`p-3 rounded-lg border text-sm font-medium transition-colors capitalize ${
                            formData.role === role
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                              : 'border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:border-primary-300'
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Doctor: claim an existing profile or create a new one */}
                  {formData.role === 'doctor' && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Are you one of our listed doctors?
                      </label>

                      <Input
                        type="text"
                        placeholder="Search doctors by name..."
                        leftIcon={<Search className="w-4 h-4" />}
                        value={doctorSearch}
                        onChange={(e) => setDoctorSearch(e.target.value)}
                        disabled={isLoading}
                      />

                      <div className="max-h-52 overflow-y-auto border border-neutral-200 dark:border-neutral-700 rounded-lg divide-y divide-neutral-100 dark:divide-neutral-800">
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, claimDoctorId: null }))}
                          className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                            formData.claimDoctorId === null
                              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                              : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          None of these — create a new profile for me
                        </button>

                        {loadingDoctors && (
                          <div className="px-3 py-2.5 text-sm text-neutral-400">Loading doctors...</div>
                        )}

                        {!loadingDoctors && filteredUnclaimedDoctors.map((doc) => (
                          <button
                            type="button"
                            key={doc.id}
                            onClick={() => setFormData((prev) => ({ ...prev, claimDoctorId: doc.id }))}
                            className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                              formData.claimDoctorId === doc.id
                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                            }`}
                          >
                            <div className="font-medium">{doc.name}</div>
                            <div className="text-xs text-neutral-500">
                              {doc.specialty}{doc.hospital_name ? ` · ${doc.hospital_name}` : ''}
                            </div>
                          </button>
                        ))}

                        {!loadingDoctors && filteredUnclaimedDoctors.length === 0 && doctorSearch && (
                          <div className="px-3 py-2.5 text-sm text-neutral-400">No matching doctors found</div>
                        )}
                      </div>

                      {formData.claimDoctorId === null && (
                        <Input
                          type="text"
                          name="specialty"
                          value={formData.specialty}
                          onChange={handleChange}
                          placeholder="Your specialty, e.g. Cardiology"
                          disabled={isLoading}
                        />
                      )}
                    </div>
                  )}

                  {/* Hospital onboarding */}
                  {formData.role === 'hospital' && (
                    <div className="space-y-4 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
                      <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        <Building2 className="w-4 h-4" /> Hospital Details
                      </div>
                      <Input
                        type="text"
                        placeholder="Hospital name"
                        value={formData.hospitalName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, hospitalName: e.target.value }))}
                        error={errors.hospitalName}
                        disabled={isLoading}
                      />
                      <Input
                        type="text"
                        placeholder="Address"
                        value={formData.address}
                        onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                        disabled={isLoading}
                      />
                      <div className="grid grid-cols-3 gap-3">
                        <Input type="text" placeholder="City" value={formData.city} onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))} disabled={isLoading} />
                        <Input type="text" placeholder="State" value={formData.state} onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))} disabled={isLoading} />
                        <Input type="text" placeholder="Pincode" value={formData.pincode} onChange={(e) => setFormData((prev) => ({ ...prev, pincode: e.target.value }))} disabled={isLoading} />
                      </div>
                      <select
                        value={formData.hospitalType}
                        onChange={(e) => setFormData((prev) => ({ ...prev, hospitalType: e.target.value as any }))}
                        disabled={isLoading}
                        className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-700 dark:text-neutral-300"
                      >
                        <option value="private">Private</option>
                        <option value="government">Government</option>
                        <option value="trust">Trust</option>
                      </select>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-neutral-500 mb-1">Total Beds</label>
                          <Input type="number" min="0" value={formData.totalBeds} onChange={(e) => setFormData((prev) => ({ ...prev, totalBeds: e.target.value }))} disabled={isLoading} />
                        </div>
                        <div>
                          <label className="block text-xs text-neutral-500 mb-1">ICU Beds</label>
                          <Input type="number" min="0" value={formData.icuBeds} onChange={(e) => setFormData((prev) => ({ ...prev, icuBeds: e.target.value }))} disabled={isLoading} />
                        </div>
                        <div>
                          <label className="block text-xs text-neutral-500 mb-1">Operation Theatres</label>
                          <Input type="number" min="0" value={formData.operationTheatres} onChange={(e) => setFormData((prev) => ({ ...prev, operationTheatres: e.target.value }))} disabled={isLoading} />
                        </div>
                        <div>
                          <label className="block text-xs text-neutral-500 mb-1">Ambulances</label>
                          <Input type="number" min="0" value={formData.ambulancesTotal} onChange={(e) => setFormData((prev) => ({ ...prev, ambulancesTotal: e.target.value }))} disabled={isLoading} />
                        </div>
                      </div>
                      <p className="text-xs text-neutral-500">
                        You can add individual beds (with ward, floor, and equipment) from your dashboard after signing up — these counts are just your starting headline numbers.
                      </p>
                    </div>
                  )}

                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Full Name
                    </label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Smith"
                      leftIcon={<User className="w-4 h-4" />}
                      error={errors.name}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      leftIcon={<Mail className="w-4 h-4" />}
                      error={errors.email}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Phone Field */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Phone Number
                    </label>
                    <Input
                      type="tel"
                      name="phone"
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="10-digit mobile number"
                      leftIcon={<Phone className="w-4 h-4" />}
                      error={errors.phone}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Password
                    </label>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      leftIcon={<Lock className="w-4 h-4" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-neutral-400 hover:text-neutral-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                      error={errors.password}
                      disabled={isLoading}
                    />
                    
                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-neutral-600 dark:text-neutral-400">
                            Password strength: {passwordStrength.label}
                          </span>
                          <span className="font-medium">{formData.password.length}/20</span>
                        </div>
                        <div className="h-1 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${passwordStrength.color} transition-all duration-300`}
                            style={{ width: `${(formData.password.length / 20) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Confirm Password
                    </label>
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      leftIcon={<Lock className="w-4 h-4" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="text-neutral-400 hover:text-neutral-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                      error={errors.confirmPassword}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Terms Agreement */}
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="agreeToTerms"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="mt-1 mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                      />
                      <label htmlFor="agreeToTerms" className="text-sm text-neutral-700 dark:text-neutral-300">
                        I agree to the{' '}
                        <a href="/terms" className="text-primary-600 hover:text-primary-700 font-medium">
                          Terms of Service
                        </a>
                        {' '}and{' '}
                        <a href="/privacy" className="text-primary-600 hover:text-primary-700 font-medium">
                          Privacy Policy
                        </a>
                        . I understand that my data will be used to provide personalized healthcare services.
                      </label>
                    </div>
                    {errors.agreeToTerms && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.agreeToTerms}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    size="lg"
                    fullWidth
                    disabled={isLoading}
                    leftIcon={isLoading ? undefined : <Shield className="w-5 h-5" />}
                    className="mt-6"
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Creating Account...
                      </span>
                    ) : (
                      'Create Account'
                    )}
                  </Button>

                  {/* Login Link */}
                  <div className="text-center pt-4">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Already have an account?{' '}
                      <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                        Sign in here
                      </Link>
                    </p>
                  </div>
                </form>
              </GlassCard>
            </div>

            {/* Right Column - Benefits */}
            <div className="space-y-6">
              <GlassCard className="p-6 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
                  Why Join Healthcare AI?
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                      <Heart className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-neutral-900 dark:text-white">Personalized Health Insights</h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Get AI-powered recommendations based on your health data
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                      <Shield className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-neutral-900 dark:text-white">Secure & Private</h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        HIPAA-compliant data storage with end-to-end encryption
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                      <CheckCircle className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-neutral-900 dark:text-white">24/7 AI Assistant</h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Get instant answers to health questions anytime
                      </p>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Security Badges */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-center">
                  <div className="text-2xl font-bold text-primary-600">256-bit</div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400">Encryption</div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-center">
                  <div className="text-2xl font-bold text-primary-600">HIPAA</div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400">Compliant</div>
                </div>
              </div>

              {/* Stats */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                  Join Our Community
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary-600">10K+</div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">Active Users</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary-600">500+</div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">Doctors</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary-600">98%</div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">Satisfaction</div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};