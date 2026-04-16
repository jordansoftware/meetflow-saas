import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Loader2, Lock, User, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'client'|'professional'>('client');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin ? { email, password } : { email, password, name, role };
      
      const data = await api.fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex">
      <div className="hidden lg:flex flex-1 bg-white items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600 z-0 pattern-dots opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-900 z-0"></div>
        <div className="z-10 text-white p-16 max-w-2xl relative">
          <Link to="/" className="absolute top-10 left-10 flex items-center gap-3">
             <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
             </div>
             <span className="font-semibold text-xl tracking-tight">MeetFlow</span>
          </Link>
          <h1 className="text-[64px] leading-[1] tracking-tight font-semibold mt-20 mb-8">
            Appointments <br/><span className="text-blue-200">made effortless.</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-md font-light leading-relaxed">
            Whether you're booking a consultation or managing your professional calendar, MeetFlow handles the friction.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-[400px]">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-xl tracking-tight text-gray-900">MeetFlow</span>
          </Link>

          <div className="bg-white p-8 sm:p-10 rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900 mb-2">
              {isLogin ? 'Welcome back' : 'Get started'}
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              {isLogin ? 'Enter your credentials to access your account.' : 'Create an account to manage your time.'}
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                 <>
                   <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all font-medium"
                        placeholder="Jane Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                   </div>
                   <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">I am a...</label>
                    <div className="grid grid-cols-2 gap-3">
                       <button type="button" onClick={() => setRole('client')} className={cn("py-3 rounded-2xl text-sm font-medium border transition-colors", role === 'client' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 text-gray-500 bg-white')}>Client</button>
                       <button type="button" onClick={() => setRole('professional')} className={cn("py-3 rounded-2xl text-sm font-medium border transition-colors", role === 'professional' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 text-gray-500 bg-white')}>Professional</button>
                    </div>
                   </div>
                 </>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">Email</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 font-medium">@</div>
                  <input
                    type="email"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all font-medium"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all font-medium"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full bg-blue-600 text-white rounded-2xl py-4 mt-6 font-semibold tracking-wide transition-all shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/30 flex items-center justify-center",
                  loading && "opacity-70 cursor-not-allowed"
                )}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-gray-500">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 font-semibold hover:underline"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
