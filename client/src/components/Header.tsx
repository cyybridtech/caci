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
  X,
  Cake,
  Building,
  Shield,
  LogOut,
  User,
  Terminal,
  Eye,
  ChevronDown,
  Check
} from 'lucide-react';
import { ServiceSession, AuthUser, ChurchGroup, UserRole } from '../types/index.ts';

interface HeaderProps {
  activeTab:
    | 'checkin'
    | 'members'
    | 'attendance-history'
    | 'analytics'
    | 'pipeline'
    | 'departments'
    | 'finances'
    | 'campaigns'
    | 'celebrations'
    | 'messaging'
    | 'users';
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
  todayCelebrantsCount?: number;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  isDeveloper?: boolean;
  developerPreviewRole?: UserRole | null;
  developerPreviewCell?: ChurchGroup | null;
  onSetDeveloperPreview?: (role: UserRole | null, cell: ChurchGroup | null) => void;
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
  isSyncing,
  todayCelebrantsCount,
  currentUser,
  onLogout,
  isDeveloper,
  developerPreviewRole,
  developerPreviewCell,
  onSetDeveloperPreview
}) => {
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  const [sessionSearchTerm, setSessionSearchTerm] = useState('');
  const [showHotkeysModal, setShowHotkeysModal] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [newServiceDate, setNewServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [newServiceType, setNewServiceType] = useState('Sunday Divine Worship Service');
  const [newTheme, setNewTheme] = useState('');

  const isSessionToday = (dateStr?: string | Date) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return (
      d.getUTCFullYear() === now.getFullYear() &&
      d.getUTCMonth() === now.getMonth() &&
      d.getUTCDate() === now.getDate()
    ) || (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  const formatSessionDate = (dateStr?: string | Date) => {
    if (!dateStr) return 'Select Service';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredSessionsList = sessions.filter((s) => {
    if (!sessionSearchTerm.trim()) return true;
    const q = sessionSearchTerm.toLowerCase().trim();
    const dateFormatted = new Date(s.serviceDate).toLocaleDateString().toLowerCase();
    const type = (s.serviceType || '').toLowerCase();
    const theme = (s.theme || '').toLowerCase();
    return dateFormatted.includes(q) || type.includes(q) || theme.includes(q);
  });

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

  const getCellLabel = (cell?: ChurchGroup) => {
    if (!cell) return '';
    switch (cell) {
      case 'JOY': return 'Joy Cell';
      case 'FAITH': return 'Faith Cell';
      case 'HOPE': return 'Hope Cell';
      case 'LOVE': return 'Love Cell';
      default: return cell;
    }
  };

  const isRoleAuthorizedForTab = (tab: string) => {
    if (!currentUser) return true;
    const effectiveRole = isDeveloper && developerPreviewRole ? developerPreviewRole : currentUser.role;

    if (effectiveRole === 'ADMIN' || effectiveRole === 'DEVELOPER') return true;

    if (effectiveRole === 'CELL_LEADER') {
      return ['checkin', 'members', 'attendance-history', 'pipeline'].includes(tab);
    }

    if (effectiveRole === 'MEDIA_TEAM') {
      return ['checkin', 'members', 'attendance-history', 'celebrations', 'messaging'].includes(tab);
    }

    if (effectiveRole === 'FINANCE') {
      return ['finances', 'campaigns'].includes(tab);
    }

    return false;
  };

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
                FWC
              </span>
              {currentUser?.cell && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-500/30">
                  {getCellLabel(currentUser.cell)}
                </span>
              )}
              {isDeveloper && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/50 flex items-center space-x-1">
                  <Terminal className="w-3 h-3" />
                  <span>DEV MODE</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">Family Worship Center (Asenua)</p>
          </div>
        </div>

        {/* Center: Unified Service Session Selector & Switcher (HCI Enhanced) */}
        <div className="relative">
          <div className="flex items-center bg-slate-800/90 hover:bg-slate-800 rounded-2xl border border-slate-700 shadow-inner p-1 transition">
            <button
              type="button"
              onClick={() => setShowSessionDropdown((prev) => !prev)}
              className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-700/60 text-left transition cursor-pointer"
              title="Click to switch or browse church services"
            >
              <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="max-w-[210px] sm:max-w-[280px]">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-black text-white truncate">
                    {activeSession ? formatSessionDate(activeSession.serviceDate) : 'Select Service'}
                  </span>
                  {activeSession && isSessionToday(activeSession.serviceDate) && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                      Today
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-medium truncate">
                  {activeSession?.serviceType || 'Click to choose or create service'}
                  {activeSession?.theme ? ` • "${activeSession.theme}"` : ''}
                </p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showSessionDropdown ? 'rotate-180 text-white' : ''}`} />
            </button>

            {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MEDIA_TEAM' || isDeveloper) && (
              <button
                type="button"
                onClick={() => {
                  setShowSessionDropdown(false);
                  setShowSessionModal(true);
                }}
                title="Create New Service Session"
                className="p-2 ml-1 rounded-xl bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Session Dropdown Popover */}
          {showSessionDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowSessionDropdown(false)}
              />
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 text-white">
                {/* Search Bar in Dropdown */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search services by date, type, or theme..."
                    value={sessionSearchTerm}
                    onChange={(e) => setSessionSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Session List */}
                <div className="max-h-60 overflow-y-auto space-y-1 divide-y divide-slate-800/60 pr-1">
                  {filteredSessionsList.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs font-semibold">
                      No service session found
                    </div>
                  ) : (
                    filteredSessionsList.map((s) => {
                      const isSelected = activeSession?.id === s.id;
                      const isToday = isSessionToday(s.serviceDate);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            onSelectSession(s);
                            setShowSessionDropdown(false);
                          }}
                          className={`w-full p-2.5 rounded-2xl text-left transition flex items-center justify-between group cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600/25 border border-blue-500/40 text-white'
                              : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-bold text-white">
                                {formatSessionDate(s.serviceDate)}
                              </span>
                              {isToday && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
                                  TODAY
                                </span>
                              )}
                              {s._count?.attendance !== undefined && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  • {s._count.attendance} present
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                              {s.serviceType}
                              {s.theme ? ` — "${s.theme}"` : ''}
                            </p>
                          </div>

                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 mt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1">
                    <span className="text-[11px] text-slate-400 font-bold">Pick Date:</span>
                    <input
                      type="date"
                      value={currentDateValue}
                      onChange={(e) => {
                        onSelectDate(e.target.value);
                        setShowSessionDropdown(false);
                      }}
                      className="bg-slate-800 text-white text-[11px] font-bold px-2 py-1 rounded-xl border border-slate-700 focus:outline-none cursor-pointer hover:bg-slate-700"
                    />
                  </div>

                  {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MEDIA_TEAM' || isDeveloper) && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowSessionDropdown(false);
                        setShowSessionModal(true);
                      }}
                      className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-extrabold transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Service</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Side: User Profile, Hotkeys & Offline Status */}
        <div className="flex items-center space-x-2.5">
          {/* Developer Role Switcher Dropdown */}
          {isDeveloper && onSetDeveloperPreview && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleSwitcher((prev) => !prev)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition shadow-sm cursor-pointer ${
                  developerPreviewRole
                    ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                    : 'bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 border-purple-500/50'
                }`}
                title="Switch persona view for testing & troubleshooting"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>
                  {developerPreviewRole ? `View: ${developerPreviewRole.replace('_', ' ')}` : 'Switch Persona View'}
                </span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showRoleSwitcher && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 flex items-center justify-between">
                    <span>Developer Impersonation</span>
                    <Terminal className="w-3 h-3 text-purple-400" />
                  </div>

                  <button
                    onClick={() => {
                      onSetDeveloperPreview(null, null);
                      setShowRoleSwitcher(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                      !developerPreviewRole
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>⚡ Full Developer Access</span>
                    {!developerPreviewRole && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => {
                      onSetDeveloperPreview('ADMIN', null);
                      setShowRoleSwitcher(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                      developerPreviewRole === 'ADMIN'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>👑 View as Administrator</span>
                    {developerPreviewRole === 'ADMIN' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => {
                      onSetDeveloperPreview('FINANCE', null);
                      setShowRoleSwitcher(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                      developerPreviewRole === 'FINANCE'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>💰 View as Finance Team</span>
                    {developerPreviewRole === 'FINANCE' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => {
                      onSetDeveloperPreview('MEDIA_TEAM', null);
                      setShowRoleSwitcher(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                      developerPreviewRole === 'MEDIA_TEAM'
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>📹 View as Media Team</span>
                    {developerPreviewRole === 'MEDIA_TEAM' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <div className="pt-1 border-t border-slate-800">
                    <span className="px-3 text-[10px] text-slate-500 font-bold block mb-1">Cell Leaders:</span>
                    {(['JOY', 'FAITH', 'HOPE', 'LOVE'] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          onSetDeveloperPreview('CELL_LEADER', c);
                          setShowRoleSwitcher(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                          developerPreviewRole === 'CELL_LEADER' && developerPreviewCell === c
                            ? 'bg-amber-600 text-white'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span>❤️ {c} Cell Leader</span>
                        {developerPreviewRole === 'CELL_LEADER' && developerPreviewCell === c && (
                          <Check className="w-3.5 h-3.5" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User badge & Logout */}
          {currentUser && (
            <div className="flex items-center space-x-2 bg-slate-850 px-2.5 py-1 rounded-xl border border-slate-700/80">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white flex items-center justify-end space-x-1">
                  <span>{currentUser.username}</span>
                </div>
                <div className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">
                  {developerPreviewRole ? `Preview: ${developerPreviewRole}` : currentUser.role.replace('_', ' ')}
                </div>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-lg hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-transparent hover:border-red-600/30 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

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
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 border-t border-slate-800">
        <nav className="flex overflow-x-auto scrollbar-none gap-1 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner sm:flex-wrap">
          {/* 1. Check-In */}
          {isRoleAuthorizedForTab('checkin') && (
            <button
              onClick={() => setActiveTab('checkin')}
              className={`shrink-0 sm:flex-1 min-w-[80px] sm:min-w-[70px] flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition duration-150 whitespace-nowrap ${
                activeTab === 'checkin'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Check-In</span>
            </button>
          )}

          {/* 2. Members */}
          {isRoleAuthorizedForTab('members') && (
            <button
              onClick={() => setActiveTab('members')}
              className={`shrink-0 sm:flex-1 min-w-[80px] sm:min-w-[70px] flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition duration-150 whitespace-nowrap ${
                activeTab === 'members'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Members</span>
            </button>
          )}

          {/* 3. Audit Log */}
          {isRoleAuthorizedForTab('attendance-history') && (
            <button
              onClick={() => setActiveTab('attendance-history')}
              className={`shrink-0 sm:flex-1 min-w-[80px] sm:min-w-[70px] flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition duration-150 whitespace-nowrap ${
                activeTab === 'attendance-history'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <History className="w-4 h-4 shrink-0" />
              <span>Audit</span>
            </button>
          )}

          {/* 4. Visitors */}
          {isRoleAuthorizedForTab('pipeline') && (
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`shrink-0 sm:flex-1 min-w-[80px] sm:min-w-[70px] flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition duration-150 whitespace-nowrap ${
                activeTab === 'pipeline'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>Visitors</span>
            </button>
          )}

          {/* 5. Auxiliaries */}
          {isRoleAuthorizedForTab('departments') && (
            <button
              onClick={() => setActiveTab('departments')}
              className={`shrink-0 sm:flex-1 min-w-[80px] sm:min-w-[70px] flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition duration-150 whitespace-nowrap ${
                activeTab === 'departments'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span>Auxiliaries</span>
            </button>
          )}

          {/* 6. Finances */}
          {isRoleAuthorizedForTab('finances') && (
            <button
              onClick={() => setActiveTab('finances')}
              className={`shrink-0 sm:flex-1 min-w-[80px] sm:min-w-[70px] flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition duration-150 whitespace-nowrap ${
                activeTab === 'finances'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <DollarSign className="w-4 h-4 shrink-0" />
              <span>Finances</span>
            </button>
          )}

          {/* 7. Pledges */}
          {isRoleAuthorizedForTab('campaigns') && (
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`shrink-0 sm:flex-1 min-w-[80px] sm:min-w-[70px] flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition duration-150 whitespace-nowrap ${
                activeTab === 'campaigns'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Building className="w-4 h-4 shrink-0" />
              <span>Pledges</span>
            </button>
          )}

          {/* 8. Celebrations */}
          {isRoleAuthorizedForTab('celebrations') && (
            <button
              onClick={() => setActiveTab('celebrations')}
              className={`shrink-0 sm:flex-1 min-w-[80px] sm:min-w-[70px] flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition duration-150 whitespace-nowrap relative ${
                activeTab === 'celebrations'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="relative flex items-center">
                <Cake className="w-4 h-4 shrink-0" />
                {typeof todayCelebrantsCount === 'number' && todayCelebrantsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
                )}
              </div>
              <span>Celebrations</span>
            </button>
          )}

          {/* 9. SMS & WhatsApp */}
          {isRoleAuthorizedForTab('messaging') && (
            <button
              onClick={() => setActiveTab('messaging')}
              className={`shrink-0 sm:flex-1 min-w-[80px] sm:min-w-[70px] flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition duration-150 whitespace-nowrap ${
                activeTab === 'messaging'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>SMS Broadcast</span>
            </button>
          )}

          {/* 10. Analytics */}
          {isRoleAuthorizedForTab('analytics') && (
            <button
              onClick={() => setActiveTab('analytics')}
              className={`shrink-0 sm:flex-1 min-w-[80px] sm:min-w-[70px] flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition duration-150 whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-blue-700 text-white shadow-md shadow-blue-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span>Analytics</span>
            </button>
          )}

          {/* 11. Role Users */}
          {isRoleAuthorizedForTab('users') && (
            <button
              onClick={() => setActiveTab('users')}
              className={`shrink-0 sm:flex-1 min-w-[80px] sm:min-w-[70px] flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition duration-150 whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Shield className="w-4 h-4 shrink-0" />
              <span>Users</span>
            </button>
          )}
        </nav>
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Service Date</label>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setNewServiceDate(new Date().toISOString().split('T')[0])}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold cursor-pointer"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        const day = d.getDay();
                        const diff = (7 - day) % 7 || 7;
                        d.setDate(d.getDate() + diff);
                        setNewServiceDate(d.toISOString().split('T')[0]);
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold cursor-pointer"
                    >
                      Next Sun
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        const day = d.getDay();
                        const diff = (3 - day + 7) % 7 || 7;
                        d.setDate(d.getDate() + diff);
                        setNewServiceDate(d.toISOString().split('T')[0]);
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold cursor-pointer"
                    >
                      Wed
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  required
                  value={newServiceDate}
                  onChange={(e) => setNewServiceDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Service Type Preset</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                  {[
                    { type: 'Sunday Divine Worship Service', label: '☀️ Sunday Divine Service' },
                    { type: 'Midweek Teaching & Prayer Service', label: '🕊️ Midweek Teaching (Wed)' },
                    { type: 'Friday Prayer Night', label: '🔥 Friday Prayer Night' },
                    { type: 'All-Night Miracle Vigil', label: '🌟 All-Night Miracle Vigil' },
                    { type: 'Special Convention & Harvest Service', label: '📖 Special Convention' }
                  ].map((preset) => (
                    <button
                      key={preset.type}
                      type="button"
                      onClick={() => setNewServiceType(preset.type)}
                      className={`p-2 rounded-xl text-xs font-bold text-left transition border cursor-pointer ${
                        newServiceType === preset.type
                          ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  placeholder="Or enter custom service type..."
                  value={newServiceType}
                  onChange={(e) => setNewServiceType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Sermon Theme (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Walking in Greater Grace & Victory"
                  value={newTheme}
                  onChange={(e) => setNewTheme(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
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
                <span className="text-slate-300">Filter Joy Cell</span>
                <span className="font-mono font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded">1</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800">
                <span className="text-slate-300">Filter Faith Cell</span>
                <span className="font-mono font-bold bg-blue-600 px-2 py-0.5 rounded text-white">2</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800">
                <span className="text-slate-300">Filter Hope Cell</span>
                <span className="font-mono font-bold bg-emerald-600 px-2 py-0.5 rounded text-white">3</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800">
                <span className="text-slate-300">Filter Love Cell</span>
                <span className="font-mono font-bold bg-rose-600 px-2 py-0.5 rounded text-white">4</span>
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
