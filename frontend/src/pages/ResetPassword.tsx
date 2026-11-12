import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Lock, AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Container } from '../components/layout/Container';
import { GlassCard } from '../components/layout/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/** Same rule as the server: 8+ characters with a letter and a number. */
const passwordProblem = (pw: string) => {
  if (pw.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Use at least one letter and one number.';
  return null;
};

/** Step 2: the link from the email opens this page to choose a new password. */
export const ResetPassword: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const problem = passwordProblem(password);
    if (problem) return setError(problem);
    if (password !== confirm) return setError('The two passwords do not match.');
    setSaving(true);
    try {
      await axios.post(`${API_URL}/auth/reset-password`, { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not change the password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const linkProblem = !token;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-blue-950/30">
      <Container className="py-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 mb-4">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">Choose a new password</h1>
            <p className="text-neutral-600 dark:text-neutral-400">At least 8 characters, with a letter and a number.</p>
          </div>

          <GlassCard className="p-8">
            {done ? (
              <div className="text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
                <p className="text-neutral-700 dark:text-neutral-300">Your password has been changed. Taking you to log in…</p>
                <Link to="/login" className="text-primary-600 hover:text-primary-700 text-sm font-medium">Log in now</Link>
              </div>
            ) : linkProblem ? (
              <div className="text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
                <p className="text-neutral-700 dark:text-neutral-300">This reset link is incomplete. Open the link from the email again, or ask for a new one.</p>
                <Link to="/forgot-password" className="text-primary-600 hover:text-primary-700 text-sm font-medium">Ask for a new link</Link>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-6" noValidate>
                {error && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
                      <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                    </div>
                    {/expired|not valid|already used/i.test(error) && (
                      <Link to="/forgot-password" className="block mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium">Ask for a new link</Link>
                    )}
                  </div>
                )}
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">New password</label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={show ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      leftIcon={<Lock className="w-4 h-4" />}
                      disabled={saving}
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      aria-label={show ? 'Hide password' : 'Show password'}
                    >
                      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Type it again</label>
                  <Input
                    id="confirm-password"
                    type={show ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4" />}
                    disabled={saving}
                  />
                </div>
                <Button type="submit" size="lg" fullWidth disabled={saving}>
                  {saving ? 'Saving…' : 'Change password'}
                </Button>
              </form>
            )}
          </GlassCard>
        </div>
      </Container>
    </div>
  );
};

export default ResetPassword;
