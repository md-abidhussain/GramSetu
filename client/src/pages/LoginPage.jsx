import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Card, CardHeader, CardContent } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Shield, AlertCircle, Lock, User, Phone, Mail } from 'lucide-react';

// Public sample accounts so anyone reviewing the project can look around
// without signing up. They only ever see seeded demonstration data.
const DEMO_ACCOUNTS = {
  citizen: { identifier: 'citizen@gmail.com', password: 'citizen123', landingPage: '/verify' },
  authority: { identifier: 'authority@gramsetu.gov', password: 'authority123', landingPage: '/dashboard' }
};

export const LoginPage = () => {
  const { 
    loginCitizen, 
    registerCitizen, 
    loginAuthority, 
    registerAuthority, 
    user 
  } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('citizen');
  const [mode, setMode] = useState('login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [role, setRole] = useState('Government Officer');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  React.useEffect(() => {
    if (user) {
      if (user.role === 'citizen') {
        navigate('/verify');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setIdentifier('');
    setError(null);
    setSuccessMessage(null);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMode('login');
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (activeTab === 'citizen') {
        if (mode === 'login') {
          if (!identifier || !password) throw new Error('Please fill in email/phone and password');
          await loginCitizen(identifier, password);
          navigate('/verify');
        } else {
          if (!name || !password) throw new Error('Name and password are required');
          if (!email && !phone) throw new Error('Please provide either an email or mobile number');
          await registerCitizen(name, email, phone, password);
          navigate('/verify');
        }
      } else {
        if (mode === 'login') {
          if (!identifier || !password) throw new Error('Please fill in official email/User ID and password');
          await loginAuthority(identifier, password);
          navigate('/dashboard');
        } else {
          if (!name || !email || !password || !role) throw new Error('Please fill in all registration fields');
          const data = await registerAuthority(name, email, password, role);
          setSuccessMessage(`Account created successfully! Your unique Official ID is: ${data.uniqueUserId}`);
          setMode('login');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify entries.');
    } finally {
      setLoading(false);
    }
  };

  const signInToDemo = async (accountType) => {
    const account = DEMO_ACCOUNTS[accountType];
    setError(null);
    setSuccessMessage(null);
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

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md space-y-6">

        <div className="text-center">
          <div className="inline-flex items-center gap-2">
            <Shield className="h-6 w-6 text-brand-600" />
            <span className="text-xl font-semibold tracking-tight text-slate-900">GramSetu</span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Track public infrastructure projects, report problems, and verify
            completed work.
          </p>
        </div>

        <Card className="border border-slate-200 shadow bg-white rounded-md overflow-hidden">
          <div className="flex border-b border-slate-200 bg-slate-50">
            <button
              onClick={() => handleTabChange('citizen')}
              className={`flex-1 text-center py-3 text-xs font-semibold tracking-wider uppercase transition-colors ${
                activeTab === 'citizen'
                  ? 'border-b-2 border-brand-600 text-brand-700 bg-white'
                  : 'text-slate-500 hover:text-slate-700 bg-slate-50'
              }`}
            >
              Citizen Portal
            </button>
            <button
              onClick={() => handleTabChange('authority')}
              className={`flex-1 text-center py-3 text-xs font-semibold tracking-wider uppercase transition-colors ${
                activeTab === 'authority'
                  ? 'border-b-2 border-brand-600 text-brand-700 bg-white'
                  : 'text-slate-500 hover:text-slate-700 bg-slate-50'
              }`}
            >
              Government Official
            </button>
          </div>

          <CardHeader className="border-b-0 pb-0 text-center flex flex-col items-center pt-6">
            <div className="h-12 w-12 bg-slate-100 border border-slate-200 rounded flex items-center justify-center font-bold mb-3">
              {activeTab === 'citizen' ? (
                <User className="h-6 w-6 text-slate-700" />
              ) : (
                <Shield className="h-6 w-6 text-brand-700" />
              )}
            </div>
            <h2 className="text-base font-bold text-dark-800 tracking-tight">
              {activeTab === 'citizen'
                ? mode === 'login' ? 'Sign in as a citizen' : 'Create a citizen account'
                : mode === 'login' ? 'Sign in as an official' : 'Create an official account'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === 'citizen'
                ? 'Report a problem and follow what happens to it'
                : 'Review tenders, projects and citizen reports'}
            </p>
          </CardHeader>

          <CardContent className="pt-5 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-dark-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 placeholder-slate-400"
                  />
                </div>
              )}

              {mode === 'register' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-500">
                      Email Address {activeTab === 'authority' ? '(Govt Only)' : '(Optional)'}
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. user@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required={activeTab === 'authority'}
                      disabled={loading}
                      className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-dark-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 placeholder-slate-400"
                    />
                  </div>
                  {activeTab === 'citizen' && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-500">
                        Mobile Number (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 9999999999"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={loading}
                        className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-dark-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 placeholder-slate-400"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500">
                    {activeTab === 'citizen' 
                      ? 'Email or mobile number' 
                      : 'Government Email or Official ID (AUTH-2026-XXXX)'}
                  </label>
                  <input
                    type="text"
                    placeholder={activeTab === 'citizen' ? 'e.g. citizen@gmail.com / 9999999999' : 'e.g. authority@gramsetu.gov / AUTH-2026-9021'}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-dark-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 placeholder-slate-400"
                  />
                </div>
              )}

              {activeTab === 'authority' && mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500">
                    Government Official Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-dark-800 focus:outline-none focus:border-brand-500"
                  >
                    <option value="Government Officer">Government Officer</option>
                    <option value="Inspector">Inspector</option>
                    <option value="District Authority">District Authority</option>
                    <option value="PWD Engineer">PWD Engineer</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-dark-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 placeholder-slate-400"
                />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  type="submit"
                  className="w-full py-2.5 flex items-center justify-center gap-1.5 font-bold tracking-wider text-xs uppercase"
                  loading={loading}
                  disabled={loading}
                >
                  <Lock className="h-3.5 w-3.5" />
                  {mode === 'login' ? 'Sign in' : 'Create account'}
                </Button>

                <button
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="text-center text-xs text-brand-700 hover:underline font-bold mt-1.5"
                >
                  {mode === 'login' 
                    ? activeTab === 'citizen' ? "New to the platform? Register here" : "Official onboarding: Register account"
                    : 'Already registered? Switch to login'}
                </button>
              </div>
            </form>
          </CardContent>

          <div className="bg-slate-50 border-t border-slate-200 p-4">
            <p className="mb-2 text-center text-xs font-medium text-slate-600">
              Or look around with a demo account
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => signInToDemo('citizen')}
                disabled={loading}
                className="flex-1 rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-100 disabled:opacity-60"
              >
                Citizen
              </button>
              <button
                onClick={() => signInToDemo('authority')}
                disabled={loading}
                className="flex-1 rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-100 disabled:opacity-60"
              >
                Government official
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
