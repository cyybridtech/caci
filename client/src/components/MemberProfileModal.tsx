import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  Heart,
  Droplets,
  DollarSign,
  Gift,
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  AlertCircle,
  FileText,
  Edit2,
  Trash2
} from 'lucide-react';
import { Member, ChurchGroup, FinancialContribution, MemberPledge } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface MemberProfileModalProps {
  member: Member;
  onClose: () => void;
  onEdit?: (member: Member) => void;
  onDelete?: (id: string) => Promise<void> | void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  member: initialMember,
  onClose,
  onEdit,
  onDelete
}) => {
  const { user } = useAuth();
  const isCellLeader = user?.role === 'CELL_LEADER';
  const [activeTab, setActiveTab] = useState<'profile' | 'tithes' | 'welfare' | 'pledges' | 'attendance' | 'allGiving'>('profile');
  const [fullMember, setFullMember] = useState<Member>(initialMember);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadFullMember = async () => {
      try {
        setIsLoading(true);
        const data = await api.getMember(initialMember.id);
        if (isMounted) {
          setFullMember(data);
        }
      } catch (err) {
        console.error('Failed to load full member details:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadFullMember();
    return () => {
      isMounted = false;
    };
  }, [initialMember.id]);

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
      case 'JOY': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'FAITH': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'HOPE': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'LOVE': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default: return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  // Contributions filtering
  const contributions: FinancialContribution[] = fullMember.contributions || [];
  const tithes = contributions.filter((c) => c.category === 'TITHE');
  const welfare = contributions.filter((c) => c.category === 'WELFARE');
  const otherGiving = contributions.filter((c) => c.category !== 'TITHE' && c.category !== 'WELFARE');
  const pledges: MemberPledge[] = fullMember.pledges || [];

  const totalTithes = tithes.reduce((sum, c) => sum + Number(c.amount), 0);
  const totalWelfare = welfare.reduce((sum, c) => sum + Number(c.amount), 0);
  const totalPledged = pledges.reduce((sum, p) => sum + Number(p.pledgedAmount), 0);
  const totalPledgePaid = pledges.reduce((sum, p) => sum + Number(p.amountPaid), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl text-white shadow-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Profile Summary */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 border-b border-slate-800 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-5">
            {/* Photo / Avatar */}
            {fullMember.photoUrl ? (
              <img
                src={fullMember.photoUrl}
                alt={`${fullMember.firstName} ${fullMember.lastName}`}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500/40 shadow-lg shadow-black/40"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-700 to-amber-500 flex items-center justify-center font-extrabold text-2xl text-white shadow-lg">
                {fullMember.firstName[0]}
                {fullMember.lastName[0]}
              </div>
            )}

            {/* Core Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight text-white">
                  {fullMember.firstName} {fullMember.lastName}
                </h2>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                  {fullMember.memberCode || 'CACI-NEW'}
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getCellBadge(fullMember.churchGroup)}`}>
                  {getCellLabel(fullMember.churchGroup)}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    fullMember.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-700 text-slate-400 border-slate-600'
                  }`}
                >
                  {fullMember.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs text-slate-300">
                <span className="font-semibold text-blue-400">{fullMember.role || 'Member'}</span>
                {fullMember.phone && (
                  <span className="flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{fullMember.phone}</span>
                  </span>
                )}
                {fullMember.email && (
                  <span className="flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{fullMember.email}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-800/80 text-xs">
            {!isCellLeader && (
              <>
                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 font-semibold block">Total Tithes</span>
                  <span className="text-base font-black text-amber-400 mt-0.5 block">
                    GH₵ {totalTithes.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 font-semibold block">Total Welfare</span>
                  <span className="text-base font-black text-emerald-400 mt-0.5 block">
                    GH₵ {totalWelfare.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 font-semibold block">Active Pledges</span>
                  <span className="text-base font-black text-indigo-400 mt-0.5 block">
                    GH₵ {totalPledgePaid.toLocaleString('en-US', { minimumFractionDigits: 2 })} / {totalPledged.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </>
            )}
            <div className={`bg-slate-950/60 p-3 rounded-2xl border border-slate-800 ${isCellLeader ? 'col-span-2 sm:col-span-4' : ''}`}>
              <span className="text-slate-400 font-semibold block">Attendance</span>
              <span className="text-base font-black text-blue-400 mt-0.5 block">
                {fullMember._count?.attendance || 0} Service(s)
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="px-6 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center space-x-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Bio</span>
          </button>

          {!isCellLeader && (
            <>
              <button
                onClick={() => setActiveTab('tithes')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
                  activeTab === 'tithes'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Tithes ({tithes.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('welfare')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
                  activeTab === 'welfare'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Welfare ({welfare.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('pledges')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
                  activeTab === 'pledges'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Pledges ({pledges.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('allGiving')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
                  activeTab === 'allGiving'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Other Offerings ({otherGiving.length})</span>
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'attendance'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Attendance History</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: PROFILE & BIO */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Details */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-3.5 text-xs">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2 pb-2 border-b border-slate-800">
                  <User className="w-4 h-4 text-blue-400" />
                  <span>Personal Demographics</span>
                </h3>

                <div className="flex justify-between">
                  <span className="text-slate-400">Gender:</span>
                  <span className="font-semibold text-white">{fullMember.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Marital Status:</span>
                  <span className="font-semibold text-white">{fullMember.maritalStatus || 'SINGLE'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date of Birth:</span>
                  <span className="font-semibold text-white">
                    {fullMember.dateOfBirth
                      ? new Date(fullMember.dateOfBirth).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Not recorded'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Wedding Anniversary:</span>
                  <span className="font-semibold text-white">
                    {fullMember.weddingAnniversary
                      ? new Date(fullMember.weddingAnniversary).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hometown:</span>
                  <span className="font-semibold text-white">{fullMember.hometown || 'Not recorded'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Residential Address:</span>
                  <span className="font-semibold text-white text-right max-w-[200px]">{fullMember.address || 'Not recorded'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Occupation / Profession:</span>
                  <span className="font-semibold text-white">{fullMember.occupation || 'Not recorded'}</span>
                </div>
              </div>

              {/* Spiritual & Church Journey */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-3.5 text-xs">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2 pb-2 border-b border-slate-800">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  <span>Church & Spiritual Journey</span>
                </h3>

                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Cell:</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full border text-[11px] ${getCellBadge(fullMember.churchGroup)}`}>
                    {getCellLabel(fullMember.churchGroup)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Water Baptized:</span>
                  <span className={`font-semibold ${fullMember.isWaterBaptized ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {fullMember.isWaterBaptized ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Holy Ghost Baptized:</span>
                  <span className={`font-semibold ${fullMember.isHolyGhostBaptized ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {fullMember.isHolyGhostBaptized ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Assimilation Stage:</span>
                  <span className="font-semibold text-amber-300">
                    {(fullMember.assimilationStage || 'REGULAR_MEMBER').replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Invited By:</span>
                  <span className="font-semibold text-white">{fullMember.invitedBy || 'Direct / Walk-in'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Auxiliary Departments:</span>
                  <span className="font-semibold text-white text-right">
                    {fullMember.departments && fullMember.departments.length > 0
                      ? fullMember.departments.map((d) => d.department?.name || 'Department').join(', ')
                      : 'None assigned'}
                  </span>
                </div>
                {fullMember.notes && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-400 block mb-1">Pastoral Notes:</span>
                    <p className="text-slate-300 bg-slate-900 p-2.5 rounded-xl text-xs">{fullMember.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TITHES */}
          {activeTab === 'tithes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-amber-950/40 border border-amber-500/30 rounded-2xl">
                <div>
                  <h4 className="text-sm font-bold text-amber-300">Tithe Record History</h4>
                  <p className="text-xs text-amber-200/70">Cumulative Tithes: GH₵ {totalTithes.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <DollarSign className="w-8 h-8 text-amber-400" />
              </div>

              {tithes.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No tithe contributions recorded for this member yet.
                </div>
              ) : (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-[11px] uppercase text-slate-400">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Service</th>
                        <th className="py-3 px-4">Payment Method</th>
                        <th className="py-3 px-4 text-right">Amount (GH₵)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {tithes.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-900/60">
                          <td className="py-3 px-4 text-slate-300">
                            {new Date(t.transactionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="py-3 px-4 text-slate-400">{t.session?.serviceType || 'Church Service'}</td>
                          <td className="py-3 px-4 text-slate-300 font-medium">{t.paymentMethod.replace('_', ' ')}</td>
                          <td className="py-3 px-4 text-right font-bold text-amber-400">
                            {Number(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WELFARE */}
          {activeTab === 'welfare' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl">
                <div>
                  <h4 className="text-sm font-bold text-emerald-300">Welfare Contributions</h4>
                  <p className="text-xs text-emerald-200/70">Cumulative Welfare: GH₵ {totalWelfare.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <Heart className="w-8 h-8 text-emerald-400" />
              </div>

              {welfare.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No welfare contributions recorded for this member yet.
                </div>
              ) : (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-[11px] uppercase text-slate-400">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Payment Method</th>
                        <th className="py-3 px-4">Notes</th>
                        <th className="py-3 px-4 text-right">Amount (GH₵)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {welfare.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-900/60">
                          <td className="py-3 px-4 text-slate-300">
                            {new Date(w.transactionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="py-3 px-4 text-slate-300 font-medium">{w.paymentMethod.replace('_', ' ')}</td>
                          <td className="py-3 px-4 text-slate-400">{w.notes || '—'}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-400">
                            {Number(w.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PLEDGES */}
          {activeTab === 'pledges' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl">
                <div>
                  <h4 className="text-sm font-bold text-indigo-300">Campaign Pledges & Projects</h4>
                  <p className="text-xs text-indigo-200/70">
                    Paid GH₵ {totalPledgePaid.toLocaleString('en-US', { minimumFractionDigits: 2 })} of GH₵ {totalPledged.toLocaleString('en-US', { minimumFractionDigits: 2 })} total pledged
                  </p>
                </div>
                <Building className="w-8 h-8 text-indigo-400" />
              </div>

              {pledges.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No pledges or special project pledges recorded for this member.
                </div>
              ) : (
                <div className="space-y-3">
                  {pledges.map((p) => (
                    <div key={p.id} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white text-sm">{p.campaign?.title || 'Church Project'}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            p.status === 'FULFILLED'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 my-2">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Pledged</span>
                          <span className="font-bold text-white">GH₵ {Number(p.pledgedAmount).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Paid</span>
                          <span className="font-bold text-emerald-400">GH₵ {Number(p.amountPaid).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Remaining</span>
                          <span className="font-bold text-amber-400">
                            GH₵ {Math.max(0, Number(p.pledgedAmount) - Number(p.amountPaid)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: OTHER OFFERINGS */}
          {activeTab === 'allGiving' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-purple-300">Offerings, Thanksgivings & Special Seeds</h4>

              {otherGiving.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No other giving records found for this member.
                </div>
              ) : (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-[11px] uppercase text-slate-400">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Method</th>
                        <th className="py-3 px-4 text-right">Amount (GH₵)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {otherGiving.map((g) => (
                        <tr key={g.id} className="hover:bg-slate-900/60">
                          <td className="py-3 px-4 text-slate-300">
                            {new Date(g.transactionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="py-3 px-4 font-semibold text-purple-300">{g.category.replace('_', ' ')}</td>
                          <td className="py-3 px-4 text-slate-400">{g.paymentMethod.replace('_', ' ')}</td>
                          <td className="py-3 px-4 text-right font-bold text-white">
                            {Number(g.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: ATTENDANCE HISTORY */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-cyan-300">Attendance Log</h4>

              {fullMember.attendance && fullMember.attendance.length > 0 ? (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-[11px] uppercase text-slate-400">
                        <th className="py-3 px-4">Service Date</th>
                        <th className="py-3 px-4">Service Type</th>
                        <th className="py-3 px-4">Check-In Time</th>
                        <th className="py-3 px-4 text-right">Recorded By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {fullMember.attendance.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-900/60">
                          <td className="py-3 px-4 text-slate-300">
                            {a.session?.serviceDate
                              ? new Date(a.session.serviceDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                              : 'Service'}
                          </td>
                          <td className="py-3 px-4 text-white font-medium">{a.session?.serviceType || 'Divine Service'}</td>
                          <td className="py-3 px-4 text-slate-400">
                            {new Date(a.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-300">{a.markedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No attendance records on file for this member.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between space-x-3 shrink-0">
          <div>
            {onDelete && (user?.role === 'ADMIN' || user?.role === 'CELL_LEADER') && (
              <button
                onClick={() => {
                  if (
                    confirm(
                      `Are you sure you want to delete ${fullMember.firstName} ${fullMember.lastName}? This will permanently remove their records.`
                    )
                  ) {
                    onDelete(fullMember.id);
                    onClose();
                  }
                }}
                className="px-4 py-2.5 rounded-2xl bg-rose-950/70 hover:bg-rose-900 border border-rose-800/60 text-rose-300 text-xs font-bold transition flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Member</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Close
            </button>
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(fullMember);
                }}
                className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-900/30 transition flex items-center space-x-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Member</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
