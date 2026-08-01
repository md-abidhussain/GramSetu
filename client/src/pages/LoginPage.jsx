import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Card, CardHeader, CardContent } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Shield, AlertCircle, Lock } from 'lucide-react';

export const LoginPage = () => {
  const { loginUser, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginUser('authority@gramsetu.gov', 'authority123');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Demo login failed. Check server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md animate-fadeIn">
        <Card className="border-slate-200 shadow-md bg-white">
          <CardHeader className="border-b-0 pb-0 text-center flex flex-col items-center pt-8">
            <div className="h-12 w-12 bg-brand-50 border border-brand-100 text-brand-600 rounded-md flex items-center justify-center font-bold mb-4 shadow-sm">
              <Shield className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-dark-800 tracking-tight">Official Authority Portal</h2>
            <p className="text-xs text-slate-500 mt-1">Audit verification & tender analysis access</p>
          </CardHeader>

          <CardContent className="pt-6 pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Government Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. authority@gramsetu.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full bg-white border border-slate-200 rounded-md px-3.5 py-2 text-sm text-dark-800 transition-colors focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 placeholder-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Access Security Key
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full bg-white border border-slate-200 rounded-md px-3.5 py-2 text-sm text-dark-800 transition-colors focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 placeholder-slate-400"
                />
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <Button
                  type="submit"
                  className="w-full py-2.5 flex items-center justify-center gap-1.5"
                  loading={loading}
                  disabled={loading}
                >
                  <Lock className="h-4 w-4" />
                  Sign In
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="w-full py-2.5 border-slate-200 hover:border-slate-350 text-slate-700 font-medium"
                >
                  Continue as Demo
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center border-t border-slate-100 pt-5">
              <span className="text-[11px] text-slate-400 leading-normal block">
                Authorized government personnel only. All access events are logged and audited.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
