import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  CheckCircle2,
  Users,
  Award,
  ChevronRight,
  Filter,
  ArrowLeft,
  Download,
  Clock,
  UserCheck,
  UserX,
  History,
  Sparkles,
  Layers,
  ChevronLeft
} from 'lucide-react';
import { Member, ChurchGroup, ServiceSession, AttendanceRecord } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';

interface AttendanceAuditViewProps {
  members: Member[];
  sessions?: ServiceSession[];
  onInspectMemberHistory?: (member: Member) => void;
  onInspectMemberProfile?: (member: Member) => void;
}

export const AttendanceAuditView: React.FC<AttendanceAuditViewProps> = ({
  members,
  sessions: initialSessions,
  onInspectMemberHistory,
  onInspectMemberProfile
}) => {
  const { user } = useAuth();
  const isCellLeader = user?.role === 'CELL_LEADER';
  const assignedCell = isCellLeader ? user?.cell : null;

  // View Mode: 'services-grid' or 'member-audit'
  const [viewMode, setViewMode] = useState<'services-grid' | 'member-audit'>('services-grid');

  // Sessions state
  const [sessions, setSessions] = useState<ServiceSession[]>(initialSessions || []);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionSearchTerm, setSessionSearchTerm] = useState('');

  // Selected Service Detail State
  const [selectedSession, setSelectedSession] = useState<ServiceSession | null>(null);
  const [sessionAttendees, setSessionAttendees] = useState<AttendanceRecord[]>([]);
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false);
  const [rosterSearchTerm, setRosterSearchTerm] = useState('');
  const [rosterTab, setRosterTab] = useState<'PRESENT' | 'ABSENT'>('PRESENT');
  const [rosterCellFilter, setRosterCellFilter] = useState<'ALL' | 'JOY' | 'FAITH' | 'HOPE' | 'LOVE'>(
    assignedCell || 'ALL'
  );

  // Member audit tab search state
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [memberCellFilter, setMemberCellFilter] = useState<'ALL' | 'JOY' | 'FAITH' | 'HOPE' | 'LOVE'>(
    assignedCell || 'ALL'
  );

  // Load sessions if not provided
  useEffect(() => {
    if (initialSessions && initialSessions.length > 0) {
      setSessions(initialSessions);
    } else {
      setIsLoadingSessions(true);
      api
        .getSessions()
        .then((data) => setSessions(data))
        .catch((err) => console.error('Failed to load sessions:', err))
        .finally(() => setIsLoadingSessions(false));
    }
  }, [initialSessions]);

  // Load attendees when a session is selected
  useEffect(() => {
    if (!selectedSession) return;

    setIsLoadingAttendees(true);
    setRosterSearchTerm('');
    setRosterTab('PRESENT');
    setRosterCellFilter(assignedCell || 'ALL');

    api
      .getSessionAttendance(selectedSession.id)
      .then((records) => {
        setSessionAttendees(records);
      })
      .catch((err) => {
        console.error('Failed to fetch session attendees:', err);
        setSessionAttendees([]);
      })
      .finally(() => {
        setIsLoadingAttendees(false);
      });
  }, [selectedSession, assignedCell]);

  const getCellLabel = (cell: ChurchGroup) => {
    switch (cell) {
      case 'JOY': return 'Joy Cell';
      case 'FAITH': return 'Faith Cell';
      case 'HOPE': return 'Hope Cell';
      case 'LOVE': return 'Love Cell';
      default: return cell;
    }
  };

  const getCellBadge = (cell: ChurchGroup) => {
    switch (cell) {
      case 'JOY': return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'FAITH': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'HOPE': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'LOVE': return 'bg-rose-100 text-rose-800 border-rose-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  // Filtered Services for the Grid
  const filteredSessions = sessions.filter((s) => {
    if (sessionSearchTerm.trim() === '') return true;
    const q = sessionSearchTerm.toLowerCase().trim();
    const type = (s.serviceType || '').toLowerCase();
    const theme = (s.theme || '').toLowerCase();
    const date = new Date(s.serviceDate).toLocaleDateString().toLowerCase();
    return type.includes(q) || theme.includes(q) || date.includes(q);
  });

  // Calculate attendees & absentees for the selected session
  const attendeeMemberIds = new Set(sessionAttendees.map((r) => r.memberId));

  // Cell scoped members
  const scopedMembers = isCellLeader && assignedCell
    ? members.filter((m) => m.churchGroup === assignedCell)
    : members;

  // Filtered attendees for the selected session
  const filteredAttendees = sessionAttendees.filter((record) => {
    const member = record.member;
    if (!member) return false;
    if (isCellLeader && assignedCell && member.churchGroup !== assignedCell) return false;
    if (rosterCellFilter !== 'ALL' && member.churchGroup !== rosterCellFilter) return false;
    if (rosterSearchTerm.trim() !== '') {
      const q = rosterSearchTerm.toLowerCase().trim();
      const name = `${member.firstName} ${member.lastName}`.toLowerCase();
      const phone = (member.phone || '').toLowerCase();
      const code = (member.memberCode || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || code.includes(q);
    }
    return true;
  });

  // Absent members for this session
  const absentMembers = scopedMembers.filter((m) => {
    if (attendeeMemberIds.has(m.id)) return false;
    if (rosterCellFilter !== 'ALL' && m.churchGroup !== rosterCellFilter) return false;
    if (rosterSearchTerm.trim() !== '') {
      const q = rosterSearchTerm.toLowerCase().trim();
      const name = `${m.firstName} ${m.lastName}`.toLowerCase();
      const phone = (m.phone || '').toLowerCase();
      const code = (m.memberCode || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || code.includes(q);
    }
    return true;
  });

  // Cell metrics for selected session
  const joyPresent = sessionAttendees.filter((r) => r.member?.churchGroup === 'JOY').length;
  const faithPresent = sessionAttendees.filter((r) => r.member?.churchGroup === 'FAITH').length;
  const hopePresent = sessionAttendees.filter((r) => r.member?.churchGroup === 'HOPE').length;
  const lovePresent = sessionAttendees.filter((r) => r.member?.churchGroup === 'LOVE').length;

  // Export CSV for the selected service
  const handleExportSessionCSV = () => {
    if (!selectedSession) return;
    const headers = ['Member ID', 'First Name', 'Last Name', 'Cell', 'Status', 'Check-In Time', 'Marked By', 'Phone'];
    const rows = sessionAttendees.map((r) => [
      r.member?.memberCode || '',
      r.member?.firstName || '',
      r.member?.lastName || '',
      r.member?.churchGroup || '',
      'PRESENT',
      new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      `"${r.markedBy || 'Media Desk'}"`,
      r.member?.phone || ''
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateStr = new Date(selectedSession.serviceDate).toISOString().split('T')[0];
    link.setAttribute('download', `CACI_Attendance_${dateStr}_${selectedSession.serviceType.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered members for Member Individual Audit tab
  const filteredAuditMembers = scopedMembers.filter((m) => {
    if (memberCellFilter !== 'ALL' && m.churchGroup !== memberCellFilter) return false;
    if (memberSearchTerm.trim() !== '') {
      const q = memberSearchTerm.toLowerCase().trim();
      const name = `${m.firstName} ${m.lastName}`.toLowerCase();
      const phone = (m.phone || '').toLowerCase();
      const code = (m.memberCode || '').toLowerCase();
      const role = (m.role || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || code.includes(q) || role.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Service Attendance Audit & Master Roster
            </h2>
            <p className="text-xs text-slate-500">
              Browse any church service session in a grid to inspect exact attendance records with a single click
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => {
              setViewMode('services-grid');
              setSelectedSession(null);
            }}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              viewMode === 'services-grid'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Services Grid</span>
          </button>

          <button
            onClick={() => {
              setViewMode('member-audit');
              setSelectedSession(null);
            }}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              viewMode === 'member-audit'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Member Audit</span>
          </button>
        </div>
      </div>

      {/* MODE 1: SERVICES GRID & SESSION DETAIL */}
      {viewMode === 'services-grid' && (
        <>
          {!selectedSession ? (
            /* ALL SERVICES GRID */
            <div className="space-y-5">
              {/* Search Bar */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search services by name, sermon theme, or date (e.g. Sunday, Divine, 28 Sep)..."
                    value={sessionSearchTerm}
                    onChange={(e) => setSessionSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>

                <div className="text-xs text-slate-500 font-bold px-2">
                  Showing {filteredSessions.length} recorded church service{filteredSessions.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Grid of Service Sessions */}
              {isLoadingSessions ? (
                <div className="p-16 text-center text-slate-400 space-y-3 bg-white rounded-3xl border border-slate-200">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs font-semibold">Loading church service sessions...</p>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="p-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200 space-y-2">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">No service session found</p>
                  <p className="text-xs text-slate-400">Try adjusting your search query.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredSessions.map((session) => {
                    const dateObj = new Date(session.serviceDate);
                    const formattedDate = dateObj.toLocaleDateString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    });
                    const attendanceCount = session._count?.attendance ?? 0;
                    const totalChurchMembers = scopedMembers.length || 1;
                    const attendanceRate = Math.min(100, Math.round((attendanceCount / totalChurchMembers) * 100));

                    return (
                      <div
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between cursor-pointer group space-y-4"
                      >
                        {/* Card Header: Date & Badge */}
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-700 font-extrabold text-[11px] border border-blue-100">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{formattedDate}</span>
                            </span>

                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                              Session ID: {session.id.slice(0, 8)}
                            </span>
                          </div>

                          {/* Service Type Title */}
                          <h3 className="text-base font-black text-slate-900 mt-3 group-hover:text-blue-600 transition leading-snug">
                            {session.serviceType}
                          </h3>

                          {/* Theme */}
                          {session.theme && (
                            <p className="text-xs text-slate-600 font-medium italic mt-1 line-clamp-1">
                              "{session.theme}"
                            </p>
                          )}
                        </div>

                        {/* Attendance Metric Bar */}
                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-bold flex items-center space-x-1">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span>Turnout</span>
                            </span>
                            <span className="font-black text-slate-900">
                              {attendanceCount} Present{' '}
                              <span className="text-slate-400 font-medium">({attendanceRate}%)</span>
                            </span>
                          </div>

                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-600 to-emerald-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${attendanceRate}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Card Action Footer */}
                        <div className="flex items-center justify-between pt-1 text-xs text-blue-600 font-bold group-hover:translate-x-1 transition-transform">
                          <span>Click to view present members</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* DETAILED SERVICE ATTENDEES ROSTER VIEW */
            <div className="space-y-6">
              {/* Back Button & Service Header */}
              <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => setSelectedSession(null)}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to All Services Grid</span>
                  </button>

                  <button
                    onClick={handleExportSessionCSV}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Attendance CSV</span>
                  </button>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-black text-white">{selectedSession.serviceType}</h2>
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-extrabold">
                      {new Date(selectedSession.serviceDate).toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  {selectedSession.theme && (
                    <p className="text-sm text-slate-300 font-semibold mt-1">
                      Theme: <span className="text-amber-400 italic">"{selectedSession.theme}"</span>
                    </p>
                  )}
                </div>

                {/* 4-Cell Live Metrics Bar for this session */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-800 text-xs">
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Total Present</span>
                    <span className="text-xl font-black text-white mt-0.5 block">
                      {sessionAttendees.length}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                    <span className="text-amber-400 font-bold block text-[10px] uppercase">Joy Cell</span>
                    <span className="text-xl font-black text-amber-300 mt-0.5 block">{joyPresent}</span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                    <span className="text-blue-400 font-bold block text-[10px] uppercase">Faith Cell</span>
                    <span className="text-xl font-black text-blue-300 mt-0.5 block">{faithPresent}</span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                    <span className="text-emerald-400 font-bold block text-[10px] uppercase">Hope Cell</span>
                    <span className="text-xl font-black text-emerald-300 mt-0.5 block">{hopePresent}</span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                    <span className="text-rose-400 font-bold block text-[10px] uppercase">Love Cell</span>
                    <span className="text-xl font-black text-rose-300 mt-0.5 block">{lovePresent}</span>
                  </div>
                </div>
              </div>

              {/* Roster Controls & Filter */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
                {/* Search in Roster */}
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search congregants by name, phone, or ID..."
                    value={rosterSearchTerm}
                    onChange={(e) => setRosterSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>

                {/* Present vs Absent Toggle */}
                <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl">
                  <button
                    onClick={() => setRosterTab('PRESENT')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      rosterTab === 'PRESENT'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Present Attendees ({filteredAttendees.length})</span>
                  </button>

                  <button
                    onClick={() => setRosterTab('ABSENT')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      rosterTab === 'ABSENT'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Absent ({absentMembers.length})</span>
                  </button>
                </div>

                {/* Cell Filter (if not cell leader) */}
                {!isCellLeader && (
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
                    <button
                      onClick={() => setRosterCellFilter('ALL')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        rosterCellFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      All Cells
                    </button>
                    <button
                      onClick={() => setRosterCellFilter('JOY')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        rosterCellFilter === 'JOY' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-amber-800'
                      }`}
                    >
                      Joy
                    </button>
                    <button
                      onClick={() => setRosterCellFilter('FAITH')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        rosterCellFilter === 'FAITH' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-800'
                      }`}
                    >
                      Faith
                    </button>
                    <button
                      onClick={() => setRosterCellFilter('HOPE')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        rosterCellFilter === 'HOPE' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-800'
                      }`}
                    >
                      Hope
                    </button>
                    <button
                      onClick={() => setRosterCellFilter('LOVE')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        rosterCellFilter === 'LOVE' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-800'
                      }`}
                    >
                      Love
                    </button>
                  </div>
                )}
              </div>

              {/* Attendees Roster Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                {isLoadingAttendees ? (
                  <div className="py-20 text-center text-slate-400 space-y-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs font-semibold">Loading session attendees...</p>
                  </div>
                ) : rosterTab === 'PRESENT' ? (
                  /* PRESENT LIST */
                  filteredAttendees.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 space-y-2">
                      <Users className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-sm font-bold text-slate-700">No present member matches filter</p>
                      <p className="text-xs text-slate-400">Try changing the cell filter or search query.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="px-6 py-3.5">Present Member</th>
                            <th className="px-4 py-3.5">Church Cell</th>
                            <th className="px-4 py-3.5">Check-In Time</th>
                            <th className="px-4 py-3.5">Marked By</th>
                            <th className="px-4 py-3.5">Phone Number</th>
                            <th className="px-4 py-3.5 text-right">Profile</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredAttendees.map((record) => {
                            const m = record.member;
                            if (!m) return null;

                            return (
                              <tr
                                key={record.id}
                                onClick={() => {
                                  if (onInspectMemberProfile) onInspectMemberProfile(m);
                                  else if (onInspectMemberHistory) onInspectMemberHistory(m);
                                }}
                                className="hover:bg-blue-50/50 cursor-pointer transition select-none group"
                              >
                                {/* Member Info */}
                                <td className="px-6 py-3.5">
                                  <div className="flex items-center space-x-3">
                                    {m.photoUrl ? (
                                      <img
                                        src={m.photoUrl}
                                        alt={`${m.firstName} ${m.lastName}`}
                                        className="w-10 h-10 rounded-2xl object-cover border border-slate-200 shrink-0"
                                      />
                                    ) : (
                                      <div
                                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-xs text-white shrink-0 ${
                                          m.churchGroup === 'JOY'
                                            ? 'bg-amber-500 text-slate-950'
                                            : m.churchGroup === 'FAITH'
                                            ? 'bg-blue-600 text-white'
                                            : m.churchGroup === 'HOPE'
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-rose-600 text-white'
                                        }`}
                                      >
                                        {m.firstName[0]}
                                        {m.lastName[0]}
                                      </div>
                                    )}

                                    <div>
                                      <div className="font-extrabold text-slate-900 text-xs group-hover:text-blue-600 transition flex items-center space-x-1.5">
                                        <span>
                                          {m.firstName} {m.lastName}
                                        </span>
                                        <span className="font-mono text-[10px] text-slate-400">
                                          {m.memberCode || ''}
                                        </span>
                                      </div>
                                      <span className="text-[11px] text-slate-500 font-medium">
                                        {m.role || 'Member'}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Cell */}
                                <td className="px-4 py-3.5">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] uppercase tracking-wider inline-block border ${getCellBadge(
                                      m.churchGroup
                                    )}`}
                                  >
                                    {getCellLabel(m.churchGroup)}
                                  </span>
                                </td>

                                {/* Check-In Time */}
                                <td className="px-4 py-3.5 font-mono font-bold text-slate-700">
                                  <span className="flex items-center space-x-1 text-slate-800">
                                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                                    <span>
                                      {new Date(record.checkInTime).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </span>
                                </td>

                                {/* Marked By */}
                                <td className="px-4 py-3.5 font-medium text-slate-600">
                                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                                    {record.markedBy || 'Media Desk'}
                                  </span>
                                </td>

                                {/* Phone */}
                                <td className="px-4 py-3.5 font-mono text-slate-600">
                                  {m.phone || <span className="text-slate-400 italic font-normal">None</span>}
                                </td>

                                {/* Profile Action */}
                                <td className="px-4 py-3.5 text-right">
                                  <span className="text-blue-600 font-bold hover:underline">View Bio →</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  /* ABSENT LIST */
                  absentMembers.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 space-y-2">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                      <p className="text-sm font-bold text-slate-700">100% Attendance in this selection!</p>
                      <p className="text-xs text-slate-400">All congregants were marked present.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="px-6 py-3.5">Absent Congregant</th>
                            <th className="px-4 py-3.5">Church Cell</th>
                            <th className="px-4 py-3.5">Phone Number</th>
                            <th className="px-4 py-3.5">Hometown</th>
                            <th className="px-4 py-3.5 text-right">Inspect History</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {absentMembers.map((m) => (
                            <tr
                              key={m.id}
                              onClick={() => {
                                if (onInspectMemberProfile) onInspectMemberProfile(m);
                                else if (onInspectMemberHistory) onInspectMemberHistory(m);
                              }}
                              className="hover:bg-rose-50/40 cursor-pointer transition select-none group"
                            >
                              {/* Member */}
                              <td className="px-6 py-3.5">
                                <div className="flex items-center space-x-3">
                                  <div className="w-9 h-9 rounded-2xl bg-slate-200 text-slate-700 flex items-center justify-center font-extrabold text-xs shrink-0">
                                    {m.firstName[0]}
                                    {m.lastName[0]}
                                  </div>
                                  <div>
                                    <div className="font-extrabold text-slate-900 text-xs group-hover:text-rose-600 transition flex items-center space-x-1.5">
                                      <span>
                                        {m.firstName} {m.lastName}
                                      </span>
                                      <span className="font-mono text-[10px] text-slate-400">
                                        {m.memberCode || ''}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-slate-500 font-medium">
                                      {m.role || 'Member'}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Cell */}
                              <td className="px-4 py-3.5">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] uppercase tracking-wider inline-block border ${getCellBadge(
                                    m.churchGroup
                                  )}`}
                                >
                                  {getCellLabel(m.churchGroup)}
                                </span>
                              </td>

                              {/* Phone */}
                              <td className="px-4 py-3.5 font-mono text-slate-600">
                                {m.phone || <span className="text-slate-400 italic">None</span>}
                              </td>

                              {/* Hometown */}
                              <td className="px-4 py-3.5 text-slate-600 font-medium">
                                {m.hometown || <span className="text-slate-400 italic">Not set</span>}
                              </td>

                              {/* Inspect */}
                              <td className="px-4 py-3.5 text-right">
                                <span className="text-amber-700 font-bold hover:underline">Audit History →</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODE 2: MEMBER INDIVIDUAL AUDIT TAB */}
      {viewMode === 'member-audit' && (
        <div className="space-y-5">
          {/* Search & Cell Filter Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search member attendance by name, phone number, or Member ID..."
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            {/* Cell Filter */}
            {!isCellLeader ? (
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
                <button
                  onClick={() => setMemberCellFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    memberCellFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  All Cells ({scopedMembers.length})
                </button>
                <button
                  onClick={() => setMemberCellFilter('JOY')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    memberCellFilter === 'JOY' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-amber-800'
                  }`}
                >
                  Joy ({scopedMembers.filter((m) => m.churchGroup === 'JOY').length})
                </button>
                <button
                  onClick={() => setMemberCellFilter('FAITH')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    memberCellFilter === 'FAITH' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-800'
                  }`}
                >
                  Faith ({scopedMembers.filter((m) => m.churchGroup === 'FAITH').length})
                </button>
                <button
                  onClick={() => setMemberCellFilter('HOPE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    memberCellFilter === 'HOPE' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-800'
                  }`}
                >
                  Hope ({scopedMembers.filter((m) => m.churchGroup === 'HOPE').length})
                </button>
                <button
                  onClick={() => setMemberCellFilter('LOVE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    memberCellFilter === 'LOVE' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-800'
                  }`}
                >
                  Love ({scopedMembers.filter((m) => m.churchGroup === 'LOVE').length})
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-2xl text-xs font-extrabold text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span>{assignedCell ? `${assignedCell} Cell (${scopedMembers.length} members)` : 'Your Cell'}</span>
              </div>
            )}
          </div>

          {/* Members Audit List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {filteredAuditMembers.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <Users className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">No member found</p>
                  <p className="text-xs text-slate-400">Try adjusting your search query.</p>
                </div>
              ) : (
                filteredAuditMembers.map((member) => {
                  const servicesAttended = member._count?.attendance || 0;
                  const totalSessionsCount = sessions.length || 1;
                  const attendanceRate = Math.min(100, Math.round((servicesAttended / totalSessionsCount) * 100));

                  return (
                    <div
                      key={member.id}
                      onClick={() => {
                        if (onInspectMemberHistory) onInspectMemberHistory(member);
                        else if (onInspectMemberProfile) onInspectMemberProfile(member);
                      }}
                      className="p-4 hover:bg-blue-50/40 transition flex items-center justify-between gap-4 cursor-pointer select-none group"
                    >
                      {/* Left: Avatar & Info */}
                      <div className="flex items-center space-x-3.5 min-w-0">
                        {member.photoUrl ? (
                          <img
                            src={member.photoUrl}
                            alt={`${member.firstName} ${member.lastName}`}
                            className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-slate-200"
                          />
                        ) : (
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-sm text-white shrink-0 ${
                              member.churchGroup === 'JOY'
                                ? 'bg-amber-500 text-slate-950'
                                : member.churchGroup === 'FAITH'
                                ? 'bg-blue-600 text-white'
                                : member.churchGroup === 'HOPE'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-rose-600 text-white'
                            }`}
                          >
                            {member.firstName[0]}
                            {member.lastName[0]}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition truncate">
                              {member.firstName} {member.lastName}
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${getCellBadge(
                                member.churchGroup
                              )}`}
                            >
                              {getCellLabel(member.churchGroup)}
                            </span>
                            <span className="font-mono text-[10px] font-bold text-slate-400">
                              {member.memberCode || 'CACI'}
                            </span>
                          </div>

                          <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500">
                            <span>{member.role || 'Member'}</span>
                            {member.phone && (
                              <>
                                <span>•</span>
                                <span className="font-mono">{member.phone}</span>
                              </>
                            )}
                            {member.hometown && (
                              <>
                                <span>•</span>
                                <span>{member.hometown}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Attendance Stats & Action */}
                      <div className="flex items-center space-x-4 shrink-0">
                        <div className="text-right">
                          <div className="text-xs font-black text-slate-900">
                            {servicesAttended} Service{servicesAttended !== 1 ? 's' : ''} Attended
                          </div>
                          <div className="text-[10px] font-bold text-slate-400">
                            Lifetime attendance rate: {attendanceRate}%
                          </div>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-400 transition">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
