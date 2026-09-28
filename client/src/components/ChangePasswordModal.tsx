import React, { useState } from 'react';
import { ShieldAlert, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';

export const ChangePasswordModal: React.FC = () => {
  const auth = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please verify.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('Your new password must be different from your temporary password.');
      return;
    }

    setLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      if (auth.user) {
        auth.updateUser({ ...auth.user, mustChangePassword: false });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to change password. Ensure current password is correct.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-md p-7 text-white shadow-2xl shadow-black/80 relative overflow-hidden">
        {/* Top accent banner */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400"></div>

        <div className="text-center mb-6 pt-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-3">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Security Update Required</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
            You are logging in with a default password. Please create a personalized secure password to proceed.
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-950/60 border border-red-600/40 text-red-300 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Current / Temporary Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your initial password (username)"
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-2.5 pr-11 text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your new password"
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:scale-[0.99] disabled:opacity-50 text-slate-950 font-extrabold py-3 px-4 rounded-2xl text-sm flex items-center justify-center space-x-2 transition shadow-lg shadow-amber-950/40 mt-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? 'Securing Account...' : 'Set Password & Enter'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
