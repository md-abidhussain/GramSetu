import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Shield, Sparkles, AlertCircle } from 'lucide-react';

export const LoginPage = () => {
  const { loginUser, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If already logged in, redirect
  React.useEffect(() => {
    if (user && user.role !== 'citizen') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await loginUser(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials or connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-dark-950 px-4 py-12 relative overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 bg-brand-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10 animate-fadeIn">
        <Card className="!bg-dark-900 border-dark-800 shadow-2xl">
          <CardHeader className="border-b-0 pb-0 text-center flex flex-col items-center">
            <div className="h-12 w-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/25 mb-4 border border-brand-500/10">
              <Shield className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Official Authority Portal</h2>
            <p className="text-xs text-slate-400 mt-1">Audit verification & tender analysis access</p>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Government Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. authority@gramsetu.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 transition-all focus:outline-none focus:border-brand-500 placeholder-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Access Security Key
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 transition-all focus:outline-none focus:border-brand-500 placeholder-slate-600"
                />
              </div>

              <Button
                type="submit"
                className="w-full py-3 flex items-center justify-center gap-1.5"
                loading={loading}
                disabled={loading}
              >
                <Sparkles className="h-4.5 w-4.5" />
                Authenticate Credential
              </Button>
            </form>

            <div className="mt-6 text-center border-t border-dark-850 pt-5">
              <span className="text-[11px] text-slate-500">
                Authorized personnel only. Submissions and access are monitored on the blockchain.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
