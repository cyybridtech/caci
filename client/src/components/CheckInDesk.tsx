import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  CheckCircle2,
  Undo2,
  Volume2,
  VolumeX,
  Users,
  Clock,
  Sparkles,
  Phone,
  Check,
  ChevronRight,
  Filter,
  History
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Member, ServiceSession, AttendanceRecord, AttendanceStats, Department, ChurchGroup } from '../types/index.ts';
import { playCheckInChime } from '../utils/audio.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface CheckInDeskProps {
  session: ServiceSession | null;
  members: Member[];
  attendanceRecords: AttendanceRecord[];
  stats: AttendanceStats | null;
  departments: Department[];
  onCheckIn: (memberId: string) => Promise<void>;
  onUndoCheckIn: (memberId: string) => Promise<void>;
  onViewMemberHistory: (member: Member) => void;
  isLoading: boolean;
}

export const CheckInDesk: React.FC<CheckInDeskProps> = ({
  session,
  members,
  attendanceRecords,
  stats,
  departments,
  onCheckIn,
  onUndoCheckIn,
  onViewMemberHistory,
  isLoading
}) => {
  const { user } = useAuth();
  const isCellLeader = user?.role === 'CELL_LEADER';
  const assignedCell = isCellLeader ? user?.cell : null;

  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState<'ALL' | 'JOY' | 'FAITH' | 'HOPE' | 'LOVE'>(
    assignedCell || 'ALL'
  );
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT'>('ALL');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync groupFilter if user cell changes
  useEffect(() => {
    if (assignedCell) {
      setGroupFilter(assignedCell);
    }
  }, [assignedCell]);

  // Set of checked-in member IDs
  const checkedInIds = new Set(attendanceRecords.map((r) => r.memberId));

  // Global hotkeys handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputActive =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT';

      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (!isInputActive && !isCellLeader) {
        if (e.key === '1') {
          setGroupFilter('JOY');
        } else if (e.key === '2') {
          setGroupFilter('FAITH');
        } else if (e.key === '3') {
          setGroupFilter('HOPE');
        } else if (e.key === '4') {
          setGroupFilter('LOVE');
        } else if (e.key === '0' || e.key === 'a' || e.key === 'A') {
          setGroupFilter('ALL');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCellLeader]);

  // Filter members
  const filteredMembers = members.filter((member) => {
    if (groupFilter !== 'ALL' && member.churchGroup !== groupFilter) return false;

    const isPresent = checkedInIds.has(member.id);
    if (statusFilter === 'PRESENT' && !isPresent) return false;
    if (statusFilter === 'ABSENT' && isPresent) return false;

    if (selectedDeptId !== 'ALL') {
      const inDept = member.departments?.some((d) => d.departmentId === selectedDeptId);
      if (!inDept) return false;
    }

    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase().trim();
      const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
      const phone = (member.phone || '').toLowerCase();
      const code = (member.memberCode || '').toLowerCase();
      const role = (member.role || '').toLowerCase();
      return fullName.includes(q) || phone.includes(q) || code.includes(q) || role.includes(q);
    }

    return true;
  });

  const handleSearchKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredMembers.length > 0) {
      e.preventDefault();
      const topMember = filteredMembers[selectedIndex] || filteredMembers[0];
      if (topMember) {
        await handleMemberAction(topMember.id);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredMembers.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  const handleMemberAction = async (memberId: string) => {
    const isAlreadyPresent = checkedInIds.has(memberId);
    if (!isAlreadyPresent) {
      if (soundEnabled) playCheckInChime();
      await onCheckIn(memberId);

      if (attendanceRecords.length + 1 === 50 || attendanceRecords.length + 1 === 100) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      }
    } else {
      await onUndoCheckIn(memberId);
    }
  };

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

  const joyStat = stats?.cells?.JOY || stats?.group1 || { total: 0, present: 0, percentage: 0 };
  const faithStat = stats?.cells?.FAITH || stats?.group2 || { total: 0, present: 0, percentage: 0 };
  const hopeStat = stats?.cells?.HOPE || { total: 0, present: 0, percentage: 0 };
  const loveStat = stats?.cells?.LOVE || { total: 0, present: 0, percentage: 0 };

  return (
    <div className="space-y-6">
      {/* 1. Live Headcount & 4 Cells Breakdown */}
      {/* 1. Live Headcount & Cell Breakdown */}
      {isCellLeader && assignedCell ? (
        <div className="max-w-md">
          {assignedCell === 'JOY' && (
            <div className="bg-white p-5 rounded-3xl shadow-sm border-2 border-amber-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span className="text-xs uppercase font-extrabold tracking-wider text-amber-900">
                    Joy Cell Attendance
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                  {joyStat.percentage}% Present
                </span>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-4xl font-extrabold text-amber-700">{joyStat.present}</span>
                <span className="text-sm text-slate-500 font-semibold">/ {joyStat.total} members</span>
              </div>
              <div className="mt-3 w-full bg-amber-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, joyStat.percentage)}%` }}
                ></div>
              </div>
            </div>
          )}

          {assignedCell === 'FAITH' && (
            <div className="bg-white p-5 rounded-3xl shadow-sm border-2 border-blue-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                  <span className="text-xs uppercase font-extrabold tracking-wider text-blue-900">
                    Faith Cell Attendance
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                  {faithStat.percentage}% Present
                </span>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-4xl font-extrabold text-blue-700">{faithStat.present}</span>
                <span className="text-sm text-slate-500 font-semibold">/ {faithStat.total} members</span>
              </div>
              <div className="mt-3 w-full bg-blue-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, faithStat.percentage)}%` }}
                ></div>
              </div>
            </div>
          )}

          {assignedCell === 'HOPE' && (
            <div className="bg-white p-5 rounded-3xl shadow-sm border-2 border-emerald-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                  <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-900">
                    Hope Cell Attendance
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {hopeStat.percentage}% Present
                </span>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-4xl font-extrabold text-emerald-700">{hopeStat.present}</span>
                <span className="text-sm text-slate-500 font-semibold">/ {hopeStat.total} members</span>
              </div>
              <div className="mt-3 w-full bg-emerald-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, hopeStat.percentage)}%` }}
                ></div>
              </div>
            </div>
          )}

          {assignedCell === 'LOVE' && (
            <div className="bg-white p-5 rounded-3xl shadow-sm border-2 border-rose-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-rose-600"></span>
                  <span className="text-xs uppercase font-extrabold tracking-wider text-rose-900">
                    Love Cell Attendance
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-50 text-rose-800 border border-rose-200">
                  {loveStat.percentage}% Present
                </span>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-4xl font-extrabold text-rose-700">{loveStat.present}</span>
                <span className="text-sm text-slate-500 font-semibold">/ {loveStat.total} members</span>
              </div>
              <div className="mt-3 w-full bg-rose-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-rose-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, loveStat.percentage)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Total Attendance Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 rounded-3xl shadow-lg border border-slate-700/60 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-extrabold tracking-wider text-slate-400">
                Total Attendance
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                {stats?.overallPercentage || 0}%
              </span>
            </div>

            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold text-white">
                {stats?.totalPresent || attendanceRecords.length}
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                / {stats?.totalMembers || members.length}
              </span>
            </div>

            <div className="mt-2.5 w-full bg-slate-700/60 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, stats?.overallPercentage || 0)}%` }}
              ></div>
            </div>
          </div>

          {/* Joy Cell Card */}
          <div className="bg-white p-4 rounded-3xl shadow-sm border-2 border-amber-200 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-[11px] uppercase font-extrabold tracking-wider text-amber-900">
                  Joy Cell
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                {joyStat.percentage}%
              </span>
            </div>

            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold text-amber-700">{joyStat.present}</span>
              <span className="text-xs text-slate-500 font-semibold">/ {joyStat.total}</span>
            </div>

            <div className="mt-2.5 w-full bg-amber-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, joyStat.percentage)}%` }}
              ></div>
            </div>
          </div>

          {/* Faith Cell Card */}
          <div className="bg-white p-4 rounded-3xl shadow-sm border-2 border-blue-200 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span className="text-[11px] uppercase font-extrabold tracking-wider text-blue-900">
                  Faith Cell
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                {faithStat.percentage}%
              </span>
            </div>

            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold text-blue-700">{faithStat.present}</span>
              <span className="text-xs text-slate-500 font-semibold">/ {faithStat.total}</span>
            </div>

            <div className="mt-2.5 w-full bg-blue-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, faithStat.percentage)}%` }}
              ></div>
            </div>
          </div>

          {/* Hope Cell Card */}
          <div className="bg-white p-4 rounded-3xl shadow-sm border-2 border-emerald-200 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span className="text-[11px] uppercase font-extrabold tracking-wider text-emerald-900">
                  Hope Cell
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {hopeStat.percentage}%
              </span>
            </div>

            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold text-emerald-700">{hopeStat.present}</span>
              <span className="text-xs text-slate-500 font-semibold">/ {hopeStat.total}</span>
            </div>

            <div className="mt-2.5 w-full bg-emerald-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, hopeStat.percentage)}%` }}
              ></div>
            </div>
          </div>

          {/* Love Cell Card */}
          <div className="bg-white p-4 rounded-3xl shadow-sm border-2 border-rose-200 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                <span className="text-[11px] uppercase font-extrabold tracking-wider text-rose-900">
                  Love Cell
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-800 border border-rose-200">
                {loveStat.percentage}%
              </span>
            </div>

            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold text-rose-700">{loveStat.present}</span>
              <span className="text-xs text-slate-500 font-semibold">/ {loveStat.total}</span>
            </div>

            <div className="mt-2.5 w-full bg-rose-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-rose-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, loveStat.percentage)}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Rapid Check-In Control Bar */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 space-y-4">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-slate-400 absolute left-4" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Type name, phone, or ID (e.g. Kwame, CACI-001)... [Press Enter to check in, '/' to search]"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleSearchKeyDown}
            className="w-full pl-11 pr-28 py-3.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border-2 border-slate-200 focus:border-blue-600 rounded-2xl text-slate-900 text-base font-semibold placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition shadow-inner"
          />

          <div className="absolute right-3 flex items-center space-x-2">
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-1 rounded"
              >
                Clear
              </button>
            )}

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Chime sound enabled' : 'Chime sound muted'}
              className={`p-1.5 rounded-xl border transition ${
                soundEnabled
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Cell Filter Tabs */}
          {!isCellLeader && (
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
              <button
                onClick={() => setGroupFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                  groupFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Cells <span className="text-[10px] text-slate-400 font-mono ml-1">[0]</span>
              </button>
              <button
                onClick={() => setGroupFilter('JOY')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition ${
                  groupFilter === 'JOY'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-amber-800 hover:bg-amber-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Joy</span>
                <span className="text-[10px] font-mono ml-1 text-slate-400">[1]</span>
              </button>
              <button
                onClick={() => setGroupFilter('FAITH')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition ${
                  groupFilter === 'FAITH'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-blue-700 hover:bg-blue-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>Faith</span>
                <span className="text-[10px] font-mono ml-1 text-slate-400">[2]</span>
              </button>
              <button
                onClick={() => setGroupFilter('HOPE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition ${
                  groupFilter === 'HOPE'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>Hope</span>
                <span className="text-[10px] font-mono ml-1 text-slate-400">[3]</span>
              </button>
              <button
                onClick={() => setGroupFilter('LOVE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition ${
                  groupFilter === 'LOVE'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                <span>Love</span>
                <span className="text-[10px] font-mono ml-1 text-slate-400">[4]</span>
              </button>
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('PRESENT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === 'PRESENT'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Present ({attendanceRecords.length})
            </button>
            <button
              onClick={() => setStatusFilter('ABSENT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === 'ABSENT'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Absent ({Math.max(0, members.length - attendanceRecords.length)})
            </button>
          </div>

          {/* Department Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">All Auxiliaries</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Member List (2 Cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
            <span>
              Showing {filteredMembers.length} congregant{filteredMembers.length !== 1 ? 's' : ''}
              {searchTerm && ` matching "${searchTerm}"`}
            </span>
            {searchTerm && filteredMembers.length > 0 && (
              <span className="text-blue-600 font-bold">Press [Enter] to check in highlighted member</span>
            )}
          </div>

          {filteredMembers.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-3 shadow-sm">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-800">No member found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No congregant matches your current search or filter. Try adjusting your query or selecting another cell.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {filteredMembers.map((member, idx) => {
                const isPresent = checkedInIds.has(member.id);
                const isHighlighted = idx === selectedIndex && searchTerm.trim() !== '';

                return (
                  <div
                    key={member.id}
                    onClick={() => handleMemberAction(member.id)}
                    className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 cursor-pointer select-none ${
                      isPresent
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-sm'
                        : isHighlighted
                        ? 'bg-blue-50 border-blue-500 shadow-md ring-2 ring-blue-200'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-sm'
                    }`}
                  >
                    {/* Left: Avatar & Info */}
                    <div className="flex items-center space-x-3.5 min-w-0">
                      {member.photoUrl ? (
                        <img
                          src={member.photoUrl}
                          alt={`${member.firstName} ${member.lastName}`}
                          className="w-11 h-11 rounded-2xl object-cover shrink-0 shadow-sm border border-slate-200"
                        />
                      ) : (
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-sm text-white shrink-0 shadow-sm ${
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
                          <h4 className="text-sm font-extrabold text-slate-900 truncate">
                            {member.firstName} {member.lastName}
                          </h4>

                          {/* Cell Badge */}
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider shrink-0 border ${getCellBadge(
                              member.churchGroup
                            )}`}
                          >
                            {getCellLabel(member.churchGroup)}
                          </span>

                          <span className="font-mono text-[10px] font-bold text-slate-400">
                            {member.memberCode || 'CACI-000'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500">
                          {member.phone ? (
                            <span className="flex items-center space-x-1 font-mono text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{member.phone}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No phone</span>
                          )}

                          <span>•</span>
                          <span className="text-slate-600 font-medium">{member.role}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Check-In Action Button */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewMemberHistory(member);
                        }}
                        title="View Attendance History"
                        className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                      >
                        <History className="w-4 h-4" />
                      </button>

                      {isPresent ? (
                        <div className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-sm">
                          <Check className="w-4 h-4" />
                          <span>Present</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-700 font-extrabold text-xs transition">
                          <span>Check In</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Live Feed of Recent Check-Ins */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Live Feed ({attendanceRecords.length})</span>
              </h3>
            </div>

            {attendanceRecords.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-400">Waiting for congregants to check in...</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto mt-2">
                {attendanceRecords.map((record) => (
                  <div key={record.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                        {record.member.firstName[0]}
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-extrabold text-slate-900 truncate">
                          {record.member.firstName} {record.member.lastName}
                        </h5>
                        <p className="text-[10px] text-slate-400">
                          {new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {getCellLabel(record.member.churchGroup)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onUndoCheckIn(record.member.id)}
                      title="Undo check in"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
