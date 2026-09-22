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
import { Member } from '../types/index.ts';

interface AttendanceAuditViewProps {
  members: Member[];
  onInspectMemberHistory: (member: Member) => void;
}

export const AttendanceAuditView: React.FC<AttendanceAuditViewProps> = ({
  members,
  onInspectMemberHistory
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState<'ALL' | 'GROUP_1' | 'GROUP_2'>('ALL');

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
              Search any congregant to inspect their attendance percentage, attended dates, and history
            </p>
          </div>
        </div>
      </div>

      {/* Search & Group Filter Bar */}
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

        {/* Group Filter */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setGroupFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              groupFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            All Groups ({members.length})
          </button>
          <button
            onClick={() => setGroupFilter('GROUP_1')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              groupFilter === 'GROUP_1' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-700'
            }`}
          >
            Group 1 ({members.filter((m) => m.churchGroup === 'GROUP_1').length})
          </button>
          <button
            onClick={() => setGroupFilter('GROUP_2')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              groupFilter === 'GROUP_2' ? 'bg-purple-600 text-white shadow-sm' : 'text-purple-700'
            }`}
          >
            Group 2 ({members.filter((m) => m.churchGroup === 'GROUP_2').length})
          </button>
        </div>
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
                          member.churchGroup === 'GROUP_1' ? 'bg-blue-600' : 'bg-purple-600'
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
                          className={`px-2 py-0.2 rounded text-[10px] font-extrabold uppercase ${
                            member.churchGroup === 'GROUP_1'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {member.churchGroup === 'GROUP_1' ? 'Group 1' : 'Group 2'}
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
