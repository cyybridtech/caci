import React, { useState } from 'react';
import {
  History,
  Search,
  CheckCircle2,
  Users,
  Award,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Member, ChurchGroup } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface AttendanceAuditViewProps {
  members: Member[];
  onInspectMemberHistory: (member: Member) => void;
}

export const AttendanceAuditView: React.FC<AttendanceAuditViewProps> = ({
  members,
  onInspectMemberHistory
}) => {
  const { user } = useAuth();
  const isCellLeader = user?.role === 'CELL_LEADER';
  const assignedCell = isCellLeader ? user?.cell : null;

  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState<'ALL' | 'JOY' | 'FAITH' | 'HOPE' | 'LOVE'>(
    assignedCell || 'ALL'
  );

  React.useEffect(() => {
    if (assignedCell) {
      setGroupFilter(assignedCell);
    }
  }, [assignedCell]);

  const filteredMembers = members.filter((m) => {
    if (groupFilter !== 'ALL' && m.churchGroup !== groupFilter) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase().trim();
      const name = `${m.firstName} ${m.lastName}`.toLowerCase();
      const phone = (m.phone || '').toLowerCase();
      const code = (m.memberCode || '').toLowerCase();
      const role = (m.role || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || code.includes(q) || role.includes(q);
    }
    return true;
  });

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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Member Attendance Audit & History Search
            </h2>
            <p className="text-xs text-slate-500">
              Search any congregant across Joy, Faith, Hope, and Love cells to inspect attendance records
            </p>
          </div>
        </div>
      </div>

      {/* Search & Cell Filter Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search member attendance by name, phone number, or Member ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
          />
        </div>

        {/* Cell Filter */}
        {!isCellLeader ? (
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setGroupFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                groupFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Cells ({members.length})
            </button>
            <button
              onClick={() => setGroupFilter('JOY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                groupFilter === 'JOY' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-amber-800 hover:bg-amber-100/50'
              }`}
            >
              Joy ({members.filter((m) => m.churchGroup === 'JOY').length})
            </button>
            <button
              onClick={() => setGroupFilter('FAITH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                groupFilter === 'FAITH' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-800 hover:bg-blue-100/50'
              }`}
            >
              Faith ({members.filter((m) => m.churchGroup === 'FAITH').length})
            </button>
            <button
              onClick={() => setGroupFilter('HOPE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                groupFilter === 'HOPE' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-800 hover:bg-emerald-100/50'
              }`}
            >
              Hope ({members.filter((m) => m.churchGroup === 'HOPE').length})
            </button>
            <button
              onClick={() => setGroupFilter('LOVE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                groupFilter === 'LOVE' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-800 hover:bg-rose-100/50'
              }`}
            >
              Love ({members.filter((m) => m.churchGroup === 'LOVE').length})
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-2xl text-xs font-extrabold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span>{assignedCell ? `${assignedCell} Cell (${members.length} members)` : 'Your Cell'}</span>
          </div>
        )}
      </div>

      {/* Members Attendance Audit Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => {
          const attendanceCount = member._count?.attendance || 0;

          return (
            <div
              key={member.id}
              onClick={() => onInspectMemberHistory(member)}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition flex flex-col justify-between space-y-4 cursor-pointer group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {member.photoUrl ? (
                      <img
                        src={member.photoUrl}
                        alt={`${member.firstName} ${member.lastName}`}
                        className="w-11 h-11 rounded-2xl object-cover shrink-0 shadow-sm border border-slate-200"
                      />
                    ) : (
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-sm text-white shadow-sm shrink-0 ${
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
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-amber-700 transition">
                        {member.firstName} {member.lastName}
                      </h4>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${getCellBadge(
                            member.churchGroup
                          )}`}
                        >
                          {getCellLabel(member.churchGroup)}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-slate-400">
                          {member.memberCode || 'CACI-000'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Total Services Attended</span>
                  <span className="inline-flex items-center space-x-1 font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>{attendanceCount} services</span>
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="w-full py-2 rounded-xl bg-slate-900 group-hover:bg-amber-600 text-white font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Inspect Audit & Records</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
