import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Trash2,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  X,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { SystemUser, UserRole, ChurchGroup } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('CELL_LEADER');
  const [newCell, setNewCell] = useState<ChurchGroup>('JOY');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user accounts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const payload: { username: string; role: UserRole; cell?: ChurchGroup } = {
        username: newUsername.trim(),
        role: newRole,
      };

      if (newRole === 'CELL_LEADER') {
        payload.cell = currentUser?.role === 'CELL_LEADER' && currentUser.cell ? currentUser.cell : newCell;
      }

      await api.createUser(payload);
      showNotification(`User account '${newUsername.trim()}' created successfully! Temporary password: ${newUsername.trim()}`);
      setShowAddModal(false);
      setNewUsername('');
      setNewRole(currentUser?.role === 'CELL_LEADER' ? 'CELL_LEADER' : 'CELL_LEADER');
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to create user account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user account '${username}'?`)) {
      return;
    }

    try {
      await api.deleteUser(id);
      showNotification(`User '${username}' deleted successfully.`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    }
  };

  const handleResetPassword = async (id: string, username: string) => {
    if (!window.confirm(`Reset password for '${username}' back to their username?`)) {
      return;
    }

    try {
      await api.resetUserPassword(id);
      showNotification(`Password for '${username}' has been reset to '${username}'.`);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'CELL_LEADER':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'MEDIA_TEAM':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'FINANCE':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'DEVELOPER':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const getCellBadge = (cell?: ChurchGroup) => {
    if (!cell) return null;
    switch (cell) {
      case 'JOY':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'FAITH':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'HOPE':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'LOVE':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const getCellLabel = (cell?: ChurchGroup) => {
    if (!cell) return 'N/A';
    switch (cell) {
      case 'JOY': return 'Joy Cell';
      case 'FAITH': return 'Faith Cell';
      case 'HOPE': return 'Hope Cell';
      case 'LOVE': return 'Love Cell';
      default: return cell;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Shield className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold tracking-tight">System Role Management</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {currentUser?.role === 'ADMIN' || currentUser?.role === 'DEVELOPER'
              ? 'Admins can manage all leadership accounts, assigned cells, and permission levels.'
              : `Managing leadership accounts for ${getCellLabel(currentUser?.cell)}.`}
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-blue-900/30 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 text-xs font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/60 border border-red-600/40 text-red-300 text-xs font-medium flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Role explanation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-red-400">ADMIN</span>
            <Shield className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-[11px] text-slate-400">
            Full system control. Can add users, adjust roles, view full finances and analytics.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-400">CELL LEADER</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-[11px] text-slate-400">
            Monitors members in their assigned Cell (Joy, Faith, Hope, or Love), tracks attendance and follow-ups.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-400">MEDIA TEAM</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-[11px] text-slate-400">
            Responsible for service kiosk check-in desk, marking attendance and broadcasting SMS/WhatsApp.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400">FINANCE</span>
            <KeyRound className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-[11px] text-slate-400">
            Records tithes, offerings, welfare, pledges, and generates financial summaries.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Active System Users ({users.length})</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-6">Username</th>
                <th className="py-3.5 px-6">Role</th>
                <th className="py-3.5 px-6">Assigned Cell</th>
                <th className="py-3.5 px-6">Password Status</th>
                <th className="py-3.5 px-6">Created On</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    {isLoading ? 'Loading system users...' : 'No users found.'}
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-6 font-bold text-white flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                        {u.username.substring(0, 2).toUpperCase()}
                      </div>
                      <span>{u.username}</span>
                      {u.id === currentUser?.id && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          You
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getRoleBadge(u.role)}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      {u.cell ? (
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getCellBadge(u.cell)}`}>
                          {getCellLabel(u.cell)}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      {u.mustChangePassword ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-600/30">
                          <Lock className="w-3 h-3" />
                          <span>Needs First-Login Change</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-600/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Personalized & Active</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleResetPassword(u.id, u.username)}
                          title="Reset password to username"
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-900/40 hover:text-amber-300 border border-slate-700 text-slate-300 text-[11px] font-semibold flex items-center space-x-1 transition"
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>Reset</span>
                        </button>

                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            title="Delete user"
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-900/50 hover:text-red-300 border border-slate-700 text-slate-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 text-white shadow-2xl relative">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Create Leadership User</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. pastor_john, joy_leader"
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  The initial password will match this username. The user will be required to change it on first login.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  disabled={currentUser?.role === 'CELL_LEADER'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  {(currentUser?.role === 'ADMIN' || currentUser?.role === 'DEVELOPER') && <option value="ADMIN">Admin (Full Control)</option>}
                  <option value="CELL_LEADER">Cell Leader (Joy, Faith, Hope, or Love)</option>
                  {(currentUser?.role === 'ADMIN' || currentUser?.role === 'DEVELOPER') && <option value="MEDIA_TEAM">Media Team (Attendance & Messages)</option>}
                  {(currentUser?.role === 'ADMIN' || currentUser?.role === 'DEVELOPER') && <option value="FINANCE">Finance (Tithes & Pledges)</option>}
                </select>
              </div>

              {newRole === 'CELL_LEADER' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Assigned Cell
                  </label>
                  <select
                    value={currentUser?.role === 'CELL_LEADER' && currentUser.cell ? currentUser.cell : newCell}
                    onChange={(e) => setNewCell(e.target.value as ChurchGroup)}
                    disabled={currentUser?.role === 'CELL_LEADER'}
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="JOY">Joy Cell</option>
                    <option value="FAITH">Faith Cell</option>
                    <option value="HOPE">Hope Cell</option>
                    <option value="LOVE">Love Cell</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-blue-900/30"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Creating...' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
