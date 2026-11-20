import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Button } from '../components/ui/Button.jsx';
import IdentityBand from '../components/layout/IdentityBand.jsx';
import Logo from '../components/ui/Logo.jsx';
import SiteFooter from '../components/layout/SiteFooter.jsx';
import { AlertCircle, Info, Lock } from 'lucide-react';

const fieldStyle =
  'w-full rounded-md border border-surface-border bg-white px-3.5 py-2.5 text-base text-brand-900 placeholder-stone-400 focus:border-brand-700 focus:outline-none focus:ring-1 focus:ring-brand-700 disabled:bg-stone-50 transition-colors';

const labelStyle = 'block text-sm font-medium text-brand-900';

export const LoginPage = () => {
  const { loginCitizen, registerCitizen, loginAuthority, user, sessionExpired } = useAuth();
  const navigate = useNavigate();

  const [audience, setAudience] = useState('citizen');
  const [mode, setMode] = useState('login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [identifier, setIdentifier] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      navigate(user.role === 'citizen' || user.isCitizen ? '/verify' : '/dashboard');
    }
  }, [user, navigate]);

  const switchAudience = (next) => {
    setAudience(next);
    setMode('login');
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setIdentifier('');
    setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (audience === 'authority') {
        await loginAuthority(identifier, password);
        navigate('/dashboard');
      } else if (mode === 'login') {
        await loginCitizen(identifier, password);
        navigate('/verify');
      } else {
        if (!email && !phone) {
          throw new Error('Enter either an email address or a mobile number.');
        }
        await registerCitizen(name, email, phone, password);
        navigate('/verify');
      }
    } catch (err) {
      setError(err.message || 'Those details were not accepted. Please check them and try again.');
    } finally {
      setLoading(false);
    }
  };

  const registering = audience === 'citizen' && mode === 'register';

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <IdentityBand />

      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-lg">
          <div className="text-center">
            <Logo className="mx-auto h-12 w-12" title="GramSetu" />
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-brand-900">
              GramSetu
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
              Public civil infrastructure transparency, grievance tracking, and project monitoring portal.
            </p>
          </div>

          {sessionExpired && (
            <p role="status" className="mt-6 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              Your session ended. Please sign in again.
            </p>
          )}

          <div className="mt-8 overflow-hidden rounded-lg border border-surface-border bg-white shadow-sm">
            <div role="tablist" aria-label="Audience sign-in selection" className="flex border-b border-surface-border bg-stone-50/70">
              {[
                { id: 'citizen', label: 'Public' },
                { id: 'authority', label: 'Government Official' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={audience === tab.id}
                  onClick={() => switchAudience(tab.id)}
                  className={`flex-1 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    audience === tab.id
                      ? 'border-brand-800 bg-white text-brand-900 font-semibold'
                      : 'border-transparent text-stone-600 hover:text-brand-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="px-5 py-6 sm:px-6">
              <h2 className="text-lg font-semibold tracking-tight text-brand-900">
                {audience === 'authority'
                  ? 'Sign in with your official ID'
                  : registering
                    ? 'Create citizen account'
                    : 'Sign in to report or track'}
              </h2>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {error && (
                  <div role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{error}</span>
                  </div>
                )}

                {registering && (
                  <>
                    <div className="space-y-1.5">
                      <label htmlFor="name" className={labelStyle}>Full name</label>
                      <input id="name" type="text" value={name} required disabled={loading}
                        onChange={(e) => setName(e.target.value)} className={fieldStyle} />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="email" className={labelStyle}>Email address</label>
                      <input id="email" type="email" autoComplete="email" value={email} disabled={loading}
                        onChange={(e) => setEmail(e.target.value)} className={fieldStyle} />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="phone" className={labelStyle}>Mobile number</label>
                      <input id="phone" type="tel" inputMode="numeric" autoComplete="tel" value={phone} disabled={loading}
                        onChange={(e) => setPhone(e.target.value)} className={fieldStyle} />
                      <p className="text-xs text-stone-500">Provide an email address or mobile number.</p>
                    </div>
                  </>
                )}

                {!registering && (
                  <div className="space-y-1.5">
                    <label htmlFor="identifier" className={labelStyle}>
                      {audience === 'citizen' ? 'Email address or mobile number' : 'Official email or user ID'}
                    </label>
                    <input id="identifier" type="text" autoComplete="username" value={identifier} required disabled={loading}
                      onChange={(e) => setIdentifier(e.target.value)} className={fieldStyle} />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="password" className={labelStyle}>Password</label>
                  <input id="password" type="password" value={password} required disabled={loading}
                    autoComplete={registering ? 'new-password' : 'current-password'}
                    onChange={(e) => setPassword(e.target.value)} className={fieldStyle} />
                  {registering && (
                    <p className="text-xs text-stone-500">Must be at least 8 characters.</p>
                  )}
                </div>

                <Button type="submit" loading={loading} disabled={loading} className="w-full py-2.5 text-base">
                  <Lock className="mr-2 h-4 w-4" aria-hidden="true" />
                  {registering ? 'Create account' : 'Sign in'}
                </Button>

                {audience === 'citizen' && (
                  <button
                    type="button"
                    onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
                    className="w-full text-sm font-medium text-brand-700 underline underline-offset-4 hover:text-brand-900 transition-colors"
                  >
                    {mode === 'login' ? 'Need an account? Register here' : 'Already registered? Sign in'}
                  </button>
                )}
              </form>

              {audience === 'authority' && (
                <div className="mt-5 flex items-start gap-2 rounded-md border border-surface-border bg-surface-subtle p-3 text-xs text-stone-700">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
                  <span>
                    Official authority credentials are created and managed by department administrators.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default LoginPage;
