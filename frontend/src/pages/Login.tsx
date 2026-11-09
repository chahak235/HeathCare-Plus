import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { GlassCard } from '../components/layout/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { 
  Mail, 
  Lock, 
  LogIn, 
  Eye,
  EyeOff,
  AlertCircle,
  Shield,
  HeartPulse,
  User
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LoginForm {
  email: string;
  password: string;
}

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<Partial<LoginForm>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginForm> = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = t('auth.login.emailRequired');
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = t('auth.login.invalidEmail');
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = t('auth.login.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('auth.login.passwordMinLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    if (!validateForm()) {
      return;
    }

    const success = await login(formData.email, formData.password);
    
    if (success) {
      navigate('/');
    } else {
      setLoginError(t('auth.login.invalidCredentials'));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    if (errors[name as keyof LoginForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (loginError) {
      setLoginError(null);
    }
  };

  const handleDemoLogin = async (role: 'patient' | 'doctor' | 'admin') => {
    const demoCredentials = {
      patient: { email: 'patient@example.com', password: 'Test123!' },
      doctor: { email: 'dr.johnson@healthcare.com', password: 'Doctor123!' },
      admin: { email: 'admin@healthcare.com', password: 'Admin123!' }
    };
    
    setFormData(demoCredentials[role]);
    
    setTimeout(async () => {
      const success = await login(demoCredentials[role].email, demoCredentials[role].password);
      if (success) {
        navigate('/');
      } else {
        setLoginError('Demo login failed. Check if backend is running.');
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-blue-950/30">
      <Container className="py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 mb-4">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">{t('auth.login.secureLogin')}</span>
            </div>
            <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
              {t('auth.login.welcomeBack')}
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              {t('auth.login.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <GlassCard className="p-8">
                {loginError && (
                  <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                      <p className="text-red-700 dark:text-red-300">{loginError}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      {t('auth.login.emailLabel')}
                    </label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t('auth.login.emailPlaceholder')}
                      leftIcon={<Mail className="w-4 h-4" />}
                      error={errors.email}
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {t('auth.login.passwordLabel')}
                      </label>
                      <Link 
                        to="/forgot-password" 
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        {t('auth.login.forgotPassword')}
                      </Link>
                    </div>
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
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                    />
                    <label htmlFor="rememberMe" className="text-sm text-neutral-700 dark:text-neutral-300 ml-2">
                      {t('auth.login.rememberMe')}
                    </label>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    fullWidth
                    disabled={isLoading}
                    leftIcon={isLoading ? undefined : <LogIn className="w-5 h-5" />}
                    className="mt-6"
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        {t('auth.login.signingIn')}
                      </span>
                    ) : (
                      t('auth.login.signIn')
                    )}
                  </Button>

                  <div className="text-center pt-4">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {t('auth.login.noAccount')}{' '}
                      <Link to="/signup" className="text-primary-600 hover:text-primary-700 font-medium">
                        {t('auth.login.createAccount')}
                      </Link>
                    </p>
                  </div>
                </form>

                {import.meta.env.DEV && (
                  <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-800">
                    <p className="text-sm text-neutral-500 dark:text-neutral-500 text-center mb-4">
                      Quick demo login:
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDemoLogin('patient')}
                        className="text-xs"
                        disabled={isLoading}
                      >
                        <User className="w-3 h-3 mr-1" />
                        Patient
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDemoLogin('doctor')}
                        className="text-xs"
                        disabled={isLoading}
                      >
                        <HeartPulse className="w-3 h-3 mr-1" />
                        Doctor
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDemoLogin('admin')}
                        className="text-xs"
                        disabled={isLoading}
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Button>
                    </div>
                  </div>
                )}
              </GlassCard>
            </div>

            <div className="space-y-6">
              <GlassCard className="p-6 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
                  {t('auth.login.whatYouCanAccess')}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                      <HeartPulse className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-neutral-900 dark:text-white">{t('auth.login.healthDashboard')}</h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {t('auth.login.healthDashboardDesc')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                      <Shield className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-neutral-900 dark:text-white">{t('auth.login.securePrivate')}</h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {t('auth.login.securePrivateDesc')}
                      </p>
                    </div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                  {t('auth.login.securityFeatures')}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-center">
                    <div className="text-lg font-bold text-primary-600">256-bit</div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">{t('auth.login.encryption')}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-center">
                    <div className="text-lg font-bold text-primary-600">2FA</div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">{t('auth.login.ready')}</div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                  {t('auth.login.communityTrust')}
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary-600">10K+</div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">{t('auth.login.activePatients')}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary-600">500+</div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">{t('navigation.doctors')}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary-600">99.9%</div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">{t('auth.login.uptime')}</div>
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
