import React, { useState } from 'react';
import { Church, LogIn, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';

export const LoginPage: React.FC = () => {
  const auth = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await api.login(username.trim(), password);
      auth.login(result.token, result.user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-tr from-blue-700 to-amber-500 rounded-3xl shadow-xl shadow-blue-950/50 mb-4 border border-blue-400/20">
            <Church className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">CACI PORTAL</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
            Christ Apostolic Church International
          </p>
          <div className="flex items-center justify-center space-x-2 mt-2">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Church Management System
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-500/30">
              Cyybrid Technology
            </span>
          </div>
        </div>

        {/* Login form card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/60">
          <div className="flex items-center space-x-2 mb-6 pb-4 border-b border-slate-800">
            <Shield className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Authorized Sign In</h2>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-2xl bg-red-950/60 border border-red-600/40 text-red-300 text-xs font-medium animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter assigned username"
                autoFocus
                className="w-full bg-slate-950/80 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-2xl px-4 py-3 pr-11 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                First time logging in? Use your <span className="text-amber-400 font-semibold">username</span> as your temporary password.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:scale-[0.99] disabled:opacity-50 text-white font-bold py-3 px-4 rounded-2xl text-sm flex items-center justify-center space-x-2 transition shadow-lg shadow-blue-900/40"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
