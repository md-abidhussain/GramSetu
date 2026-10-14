import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Button } from '../components/ui/Button.jsx';
import IdentityBand from '../components/layout/IdentityBand.jsx';
import SiteFooter from '../components/layout/SiteFooter.jsx';
import { AlertCircle, Info, Lock } from 'lucide-react';

// Public sample accounts so anyone reviewing the project can look around
// without signing up. They only ever see seeded demonstration data.
const DEMO_ACCOUNTS = {
  citizen: { identifier: 'citizen@gmail.com', password: 'citizen123', landingPage: '/verify' },
  authority: { identifier: 'authority@gramsetu.gov', password: 'authority123', landingPage: '/dashboard' }
};

const fieldStyle =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 placeholder-slate-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 disabled:bg-slate-50';

const labelStyle = 'block text-sm font-medium text-slate-800';

export const LoginPage = () => {
  const { loginCitizen, registerCitizen, loginAuthority, user } = useAuth();
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

  const openDemo = async (accountType) => {
    const account = DEMO_ACCOUNTS[accountType];
    setError(null);
    setLoading(true);
    try {
      const signIn = accountType === 'citizen' ? loginCitizen : loginAuthority;
      await signIn(account.identifier, account.password);
      navigate(account.landingPage);
    } catch (err) {
      setError(`Could not open the demo account: ${err.message}`);
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
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              GramSetu
            </h1>
            <p className="mx-auto mt-2 max-w-md text-base text-slate-600">
              Report problems with public infrastructure work, follow what
              happens to each report, and check completed projects.
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            {/* Two audiences, two different jobs: the public files and follows
                reports, officials review them. */}
            <div role="tablist" aria-label="Who is signing in" className="flex border-b border-slate-200">
              {[
                { id: 'citizen', label: 'Public' },
                { id: 'authority', label: 'Government official' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={audience === tab.id}
                  onClick={() => switchAudience(tab.id)}
                  className={`flex-1 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    audience === tab.id
                      ? 'border-brand-600 bg-white text-brand-800'
                      : 'border-transparent bg-slate-50 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="px-5 py-6 sm:px-6">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                {audience === 'authority'
                  ? 'Sign in with your official account'
                  : registering
                    ? 'Create an account'
                    : 'Sign in'}
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
                      <p className="text-sm text-slate-600">Give an email address or a mobile number. Either one works.</p>
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
                    <p className="text-sm text-slate-600">At least 8 characters.</p>
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
                    className="w-full text-sm font-medium text-brand-700 underline underline-offset-4 hover:text-brand-800"
                  >
                    {mode === 'login' ? 'Create an account' : 'I already have an account'}
                  </button>
                )}
              </form>

              {audience === 'authority' && (
                // Officials no longer sign themselves up. The registration
                // endpoint used to be open and accepted any role in the body,
                // Admin included, so anyone could make themselves an
                // administrator. Accounts are issued by an administrator now.
                <div className="mt-5 flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
                  <span>
                    Official accounts are issued by your department
                    administrator. There is no sign-up here.
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-5 py-5 sm:px-6">
              <p className="text-sm font-medium text-slate-800">Look around without an account</p>
              <p className="mt-1 text-sm text-slate-600">
                These are public sample accounts holding demonstration data only.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={() => openDemo('citizen')} disabled={loading}
                  className="flex-1 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:bg-slate-100 disabled:opacity-60">
                  Open as a member of the public
                </button>
                <button type="button" onClick={() => openDemo('authority')} disabled={loading}
                  className="flex-1 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:bg-slate-100 disabled:opacity-60">
                  Open as an official
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default LoginPage;
