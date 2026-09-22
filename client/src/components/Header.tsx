import React, { useState } from 'react';
import {
  Church,
  Calendar,
  Users,
  CheckCircle2,
  Building2,
  DollarSign,
  MessageSquare,
  TrendingUp,
  UserCheck,
  Wifi,
  WifiOff,
  RefreshCw,
  Plus,
  Search,
  History,
  HelpCircle,
  X
} from 'lucide-react';
import { ServiceSession } from '../types/index.ts';

interface HeaderProps {
  activeTab:
    | 'checkin'
    | 'members'
    | 'attendance-history'
    | 'analytics'
    | 'pipeline'
    | 'departments'
    | 'finances'
    | 'messaging';
  setActiveTab: (tab: any) => void;
  activeSession: ServiceSession | null;
  sessions: ServiceSession[];
  onSelectSession: (session: ServiceSession) => void;
  onSelectDate: (date: string) => void;
  onCreateSession: (data: { serviceDate?: string; serviceType: string; theme?: string }) => void;
  isOnline: boolean;
  offlineQueueCount: number;
  onSync: () => void;
  isSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeSession,
  sessions,
  onSelectSession,
  onSelectDate,
  onCreateSession,
  isOnline,
  offlineQueueCount,
  onSync,
  isSyncing
}) => {
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showHotkeysModal, setShowHotkeysModal] = useState(false);
  const [newServiceDate, setNewServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [newServiceType, setNewServiceType] = useState('Sunday Divine Worship Service');
  const [newTheme, setNewTheme] = useState('');

  const handleCreateSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceType) return;
    onCreateSession({
      serviceDate: newServiceDate,
      serviceType: newServiceType,
      theme: newTheme
    });
    setShowSessionModal(false);
    setNewTheme('');
  };

  const currentDateValue = activeSession
    ? new Date(activeSession.serviceDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  return (
    <header className="bg-slate-900 text-white shadow-xl sticky top-0 z-30 border-b border-slate-800">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Church Brand */}
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-blue-700 to-amber-500 p-2 rounded-2xl shadow-md text-white">
            <Church className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight text-white">CACI</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Media Desk Kiosk
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Christ Apostolic Church Int. Management System</p>
          </div>
        </div>

        {/* Center: Service Date Picker & Session Switcher */}
        <div className="flex items-center space-x-2 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 shadow-inner">
          <Calendar className="w-4 h-4 text-blue-400" />
          <div className="flex items-center space-x-2">
            {/* Direct Date Picker */}
            <input
              type="date"
              value={currentDateValue}
              onChange={(e) => onSelectDate(e.target.value)}
              title="Select Service Date"
              className="bg-slate-700/80 hover:bg-slate-700 text-white text-xs font-semibold px-2 py-1 rounded border border-slate-600 focus:outline-none cursor-pointer"
            />

            {/* Session Type Dropdown */}
            <select
              className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer pr-2 max-w-[180px] truncate"
              value={activeSession?.id || ''}
              onChange={(e) => {
                const s = sessions.find((sess) => sess.id === e.target.value);
                if (s) onSelectSession(s);
              }}
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-800 text-white">
                  {new Date(s.serviceDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: {s.serviceType}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowSessionModal(true)}
            title="Create/Add New Service Session"
            className="p-1 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Side: Hotkeys & Offline Status */}
        <div className="flex items-center space-x-2.5">
          {/* Hotkey Helper Button */}
          <button
            onClick={() => setShowHotkeysModal(true)}
            title="View Media Desk Keyboard Shortcuts"
            className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition text-xs font-semibold"
          >
            <HelpCircle className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Shortcuts</span>
          </button>

          {/* Online/Offline Status */}
          <div
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              isOnline
                ? 'bg-emerald-950/60 border-emerald-600/40 text-emerald-400'
                : 'bg-amber-950/60 border-amber-600/40 text-amber-400'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
            {offlineQueueCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
                {offlineQueueCount}
              </span>
            )}
          </div>

          {offlineQueueCount > 0 && (
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="flex items-center space-x-1 bg-amber-600 hover:bg-amber-500 text-white text-xs px-2.5 py-1 rounded-lg transition font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto scrollbar-none py-1 space-x-1 border-t border-slate-800">
        <button
          onClick={() => setActiveTab('checkin')}
          className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-t-xl transition border-b-2 whitespace-nowrap ${
            activeTab === 'checkin'
              ? 'border-blue-500 text-blue-400 bg-slate-800/80 shadow-sm'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Check-In Desk</span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-t-xl transition border-b-2 whitespace-nowrap ${
            activeTab === 'members'
              ? 'border-blue-500 text-blue-400 bg-slate-800/80 shadow-sm'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Members</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance-history')}
          className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-t-xl transition border-b-2 whitespace-nowrap ${
            activeTab === 'attendance-history'
              ? 'border-amber-500 text-amber-400 bg-slate-800/80 shadow-sm'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Attendance Audit & History</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-t-xl transition border-b-2 whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'border-blue-500 text-blue-400 bg-slate-800/80 shadow-sm'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Executive Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('pipeline')}
          className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-t-xl transition border-b-2 whitespace-nowrap ${
            activeTab === 'pipeline'
              ? 'border-amber-500 text-amber-400 bg-slate-800/80 shadow-sm'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Visitor Pipeline</span>
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-t-xl transition border-b-2 whitespace-nowrap ${
            activeTab === 'departments'
              ? 'border-purple-500 text-purple-400 bg-slate-800/80 shadow-sm'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Auxiliaries</span>
        </button>

        <button
          onClick={() => setActiveTab('finances')}
          className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-t-xl transition border-b-2 whitespace-nowrap ${
            activeTab === 'finances'
              ? 'border-emerald-500 text-emerald-400 bg-slate-800/80 shadow-sm'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Finances (GH₵)</span>
        </button>

        <button
          onClick={() => setActiveTab('messaging')}
          className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-t-xl transition border-b-2 whitespace-nowrap ${
            activeTab === 'messaging'
              ? 'border-blue-500 text-blue-400 bg-slate-800/80 shadow-sm'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>SMS & WhatsApp</span>
        </button>
      </div>

      {/* New Service Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <span>Create Service Session</span>
              </h3>
              <button
                onClick={() => setShowSessionModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSessionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Service Date</label>
                <input
                  type="date"
                  required
                  value={newServiceDate}
                  onChange={(e) => setNewServiceDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Service Type</label>
                <select
                  value={newServiceType}
                  onChange={(e) => setNewServiceType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Sunday Divine Worship Service">Sunday Divine Worship Service</option>
                  <option value="Midweek Teaching & Prayer Service">Midweek Teaching & Prayer Service</option>
                  <option value="Friday Prayer Night">Friday Prayer Night</option>
                  <option value="Special Convention Service">Special Convention Service</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Sermon Theme (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Walking in Greater Grace"
                  value={newTheme}
                  onChange={(e) => setNewTheme(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
                >
                  Save & Set Active
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hotkeys Modal */}
      {showHotkeysModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-blue-400" />
                <span>Media Desk Keyboard Hotkeys</span>
              </h3>
              <button
                onClick={() => setShowHotkeysModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800">
                <span className="text-slate-300">Focus Search Bar</span>
                <span className="font-mono font-bold bg-blue-600 px-2 py-0.5 rounded text-white">/</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800">
                <span className="text-slate-300">Check In / Toggle Highlighted Congregant</span>
                <span className="font-mono font-bold bg-blue-600 px-2 py-0.5 rounded text-white">Enter</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800">
                <span className="text-slate-300">Filter Group 1</span>
                <span className="font-mono font-bold bg-blue-600 px-2 py-0.5 rounded text-white">1</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800">
                <span className="text-slate-300">Filter Group 2</span>
                <span className="font-mono font-bold bg-purple-600 px-2 py-0.5 rounded text-white">2</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800">
                <span className="text-slate-300">Show All Members</span>
                <span className="font-mono font-bold bg-slate-700 px-2 py-0.5 rounded text-white">A or 0</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHotkeysModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
