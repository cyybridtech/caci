import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  X,
  Search,
  Users,
  Shield,
  Phone,
  Award
} from 'lucide-react';
import { Member, MemberAttendanceHistory } from '../types/index.ts';
import { api } from '../services/api.ts';

interface MemberAttendanceHistoryModalProps {
  member: Member | null;
  allMembers: Member[];
  onSelectAnotherMember: (member: Member) => void;
  onClose: () => void;
}

export const MemberAttendanceHistoryModal: React.FC<MemberAttendanceHistoryModalProps> = ({
  member,
  allMembers,
  onSelectAnotherMember,
  onClose
}) => {
  const [history, setHistory] = useState<MemberAttendanceHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'attended' | 'missed'>('attended');

  useEffect(() => {
    if (member) {
      setIsLoading(true);
      api.getMemberAttendanceHistory(member.id)
        .then((data) => setHistory(data))
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [member]);

  if (!member) return null;

  const handlePrint = () => {
    window.print();
  };

  const filteredMembers = allMembers.filter((m) => {
    if (!searchTerm.trim()) return false;
    const q = searchTerm.toLowerCase();
    return (
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q) ||
      (m.phone || '').includes(q) ||
      (m.memberCode || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden print:m-0 print:w-full print:shadow-none animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Top Control Bar (Hidden in Print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base">Member Attendance Records & Audit</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Attendance Report</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Another Member Bar (Hidden in Print) */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 print:hidden">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search another member by name, phone, or Member ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {filteredMembers.length > 0 && (
            <div className="mt-2 bg-white rounded-lg border border-slate-200 shadow-lg max-h-40 overflow-y-auto divide-y divide-slate-100">
              {filteredMembers.slice(0, 5).map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    onSelectAnotherMember(m);
                    setSearchTerm('');
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 flex items-center justify-between"
                >
                  <span className="font-bold text-slate-900">
                    {m.firstName} {m.lastName}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                      m.churchGroup === 'GROUP_1'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {m.churchGroup === 'GROUP_1' ? 'Group 1' : 'Group 2'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Member Profile Banner */}
        <div className="p-6 bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-900 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl text-white shadow-lg ${
                  member.churchGroup === 'GROUP_1' ? 'bg-blue-600' : 'bg-purple-600'
                }`}
              >
                {member.firstName[0]}
                {member.lastName[0]}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-extrabold text-white">
                    {member.firstName} {member.lastName}
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      member.churchGroup === 'GROUP_1'
                        ? 'bg-blue-500/40 text-blue-200 border border-blue-400/50'
                        : 'bg-purple-500/40 text-purple-200 border border-purple-400/50'
                    }`}
                  >
                    {member.churchGroup === 'GROUP_1' ? 'Group 1' : 'Group 2'}
                  </span>
                </div>
                <div className="flex items-center space-x-3 mt-1 text-xs text-slate-300">
                  <span className="font-mono bg-white/10 px-2 py-0.5 rounded">
                    ID: {member.memberCode || 'CACI-000'}
                  </span>
                  {member.phone && (
                    <span className="flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5 text-blue-300" />
                      <span>{member.phone}</span>
                    </span>
                  )}
                  <span>Role: {member.role}</span>
                </div>
              </div>
            </div>

            {/* Attendance Percentage Badge */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3 rounded-2xl text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-300 font-bold block">
                Attendance Rate
              </span>
              <span className="text-3xl font-extrabold text-emerald-400 block mt-0.5">
                {history?.summary.attendancePercentage || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-3 gap-3 p-6 bg-slate-50 border-b border-slate-200">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Services Held
            </span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              {history?.summary.totalChurchServices || 0}
            </span>
          </div>

          <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 text-center shadow-sm">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              Services Attended
            </span>
            <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">
              {history?.summary.servicesAttended || 0}
            </span>
          </div>

          <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-center shadow-sm">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
              Services Missed
            </span>
            <span className="text-2xl font-extrabold text-amber-700 mt-1 block">
              {history?.summary.servicesMissed || 0}
            </span>
          </div>
        </div>

        {/* Attended vs Missed Tabs (Hidden in Print) */}
        <div className="px-6 pt-4 border-b border-slate-200 flex space-x-2 print:hidden">
          <button
            onClick={() => setActiveTab('attended')}
            className={`px-4 py-2 font-bold text-xs rounded-t-lg border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'attended'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Attended Services ({history?.attendedList.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('missed')}
            className={`px-4 py-2 font-bold text-xs rounded-t-lg border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'missed'
                ? 'border-amber-600 text-amber-700 bg-amber-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <XCircle className="w-4 h-4 text-amber-600" />
            <span>Missed Services ({history?.missedList.length || 0})</span>
          </button>
        </div>

        {/* Timeline Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Loading attendance history...
            </div>
          ) : activeTab === 'attended' ? (
            history?.attendedList.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No attended services recorded yet for this member.
              </div>
            ) : (
              <div className="space-y-3">
                {history?.attendedList.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-emerald-600 text-white">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block text-sm">
                          {item.serviceType}
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          {new Date(item.serviceDate).toLocaleDateString(undefined, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                          {item.theme && ` • Theme: "${item.theme}"`}
                        </span>
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-500">
                      <span className="font-semibold text-emerald-800 block">
                        Checked in at{' '}
                        {new Date(item.checkInTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="text-[10px] text-slate-400">By {item.markedBy}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : history?.missedList.length === 0 ? (
            <div className="text-center py-8 text-emerald-600 font-bold text-xs flex flex-col items-center space-y-2">
              <Award className="w-8 h-8 text-emerald-500" />
              <span>Perfect Attendance! This member has not missed any recorded services.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {history?.missedList.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-amber-600 text-white">
                      <XCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block text-sm">
                        {item.serviceType}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        {new Date(item.serviceDate).toLocaleDateString(undefined, {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                    Absent
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer (Printable Endorsement) */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Christ Apostolic Church International • Official Member Attendance Record
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition print:hidden"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
