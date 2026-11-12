import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, AlertCircle, CheckCircle2, ArrowLeft, KeyRound } from 'lucide-react';
import { Container } from '../components/layout/Container';
import { GlassCard } from '../components/layout/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/** Step 1 of resetting a password: ask for the account email and send a link. */
export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setSending(true);
    try {
      const r = await axios.post(`${API_URL}/auth/forgot-password`, { email: email.trim() });
      setSent(r.data?.message || 'If an account exists for that email, we have sent a reset link.');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not send the email right now. Please try again in a minute.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-blue-950/30">
      <Container className="py-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 mb-4">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">Forgot your password?</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Enter the email you signed up with and we'll send you a link to choose a new one.</p>
          </div>

          <GlassCard className="p-8">
            {sent ? (
              <div className="text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
                <p className="text-neutral-700 dark:text-neutral-300">{sent}</p>
                <p className="text-sm text-neutral-500">Didn't get it? Check your spam folder, or wait a minute and try again.</p>
                <Button variant="secondary" onClick={() => setSent(null)}>Send again</Button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-6" noValidate>
                {error && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
                    <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                  </div>
                )}
                <div>
                  <label htmlFor="reset-email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Email address</label>
                  <Input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    leftIcon={<Mail className="w-4 h-4" />}
                    disabled={sending}
                  />
                </div>
                <Button type="submit" size="lg" fullWidth disabled={sending}>
                  {sending ? 'Sending…' : 'Send reset link'}
                </Button>
              </form>
            )}
            <div className="text-center pt-6">
              <Link to="/login" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700">
                <ArrowLeft className="w-4 h-4" /> Back to log in
              </Link>
            </div>
          </GlassCard>
        </div>
      </Container>
    </div>
  );
};

export default ForgotPassword;
