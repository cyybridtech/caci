import React, { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Download,
  Phone,
  CheckCircle,
  Edit2,
  Trash2
} from 'lucide-react';
import { Member, ChurchGroup } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { MemberFormModal } from './MemberFormModal.tsx';
import { MemberProfileModal } from './MemberProfileModal.tsx';

interface MembersDirectoryProps {
  members: Member[];
  onAddMember: (memberData: any) => Promise<void>;
  onUpdateMember: (id: string, memberData: any) => Promise<void>;
  onDeleteMember: (id: string) => Promise<void>;
  onInspectMemberHistory?: (member: Member) => void;
  onInspectMemberProfile?: (member: Member) => void;
}

export const MembersDirectory: React.FC<MembersDirectoryProps> = ({
  members,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onInspectMemberProfile
}) => {
  const { user } = useAuth();
  const isCellLeader = user?.role === 'CELL_LEADER';
  const assignedCell = isCellLeader ? user?.cell : null;
  const canDelete = user?.role === 'ADMIN' || user?.role === 'CELL_LEADER';

  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState<'ALL' | 'JOY' | 'FAITH' | 'HOPE' | 'LOVE'>(
    assignedCell || 'ALL'
  );

  React.useEffect(() => {
    if (assignedCell) {
      setGroupFilter(assignedCell);
    }
  }, [assignedCell]);

  // Form Modal State (Add or Edit)
  const [formModalState, setFormModalState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    member: Member | null;
  }>({
    isOpen: false,
    mode: 'create',
    member: null
  });

  // Fallback profile modal if onInspectMemberProfile not supplied
  const [fallbackProfileMember, setFallbackProfileMember] = useState<Member | null>(null);

  const openAddModal = () => {
    setFormModalState({
      isOpen: true,
      mode: 'create',
      member: null
    });
  };

  const openEditModal = (member: Member) => {
    setFormModalState({
      isOpen: true,
      mode: 'edit',
      member
    });
  };

  const handleDeleteClick = async (member: Member) => {
    if (
      confirm(
        `Are you sure you want to remove ${member.firstName} ${member.lastName}? This will permanently delete their records.`
      )
    ) {
      await onDeleteMember(member.id);
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (formModalState.mode === 'create') {
      await onAddMember(data);
    } else if (formModalState.member) {
      await onUpdateMember(formModalState.member.id, data);
    }
  };

  const filteredMembers = members.filter((m) => {
    if (groupFilter !== 'ALL' && m.churchGroup !== groupFilter) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase().trim();
      const name = `${m.firstName} ${m.lastName}`.toLowerCase();
      const phone = (m.phone || '').toLowerCase();
      const code = (m.memberCode || '').toLowerCase();
      const hometown = (m.hometown || '').toLowerCase();
      const occupation = (m.occupation || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || code.includes(q) || hometown.includes(q) || occupation.includes(q);
    }
    return true;
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Member ID',
      'First Name',
      'Last Name',
      'Phone',
      'Email',
      'Cell',
      'Role',
      'Gender',
      'Marital Status',
      'DOB',
      'Hometown',
      'Occupation',
      'Address',
      'Water Baptized',
      'Holy Ghost Baptized'
    ];
    const rows = filteredMembers.map((m) => [
      m.memberCode || '',
      m.firstName,
      m.lastName,
      m.phone || '',
      m.email || '',
      m.churchGroup === 'JOY' ? 'Joy Cell' : m.churchGroup === 'FAITH' ? 'Faith Cell' : m.churchGroup === 'HOPE' ? 'Hope Cell' : 'Love Cell',
      m.role,
      m.gender,
      m.maritalStatus || 'SINGLE',
      m.dateOfBirth ? new Date(m.dateOfBirth).toLocaleDateString() : '',
      `"${(m.hometown || '').replace(/"/g, '""')}"`,
      `"${(m.occupation || '').replace(/"/g, '""')}"`,
      `"${(m.address || '').replace(/"/g, '""')}"`,
      m.isWaterBaptized ? 'Yes' : 'No',
      m.isHolyGhostBaptized ? 'Yes' : 'No'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CACI_Church_Members_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Church Member Directory</h2>
            <p className="text-xs text-slate-500">
              {members.length} registered congregants • Click on any member row to view full profile, giving, and history
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Roster</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Church Member</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search member by name, phone, hometown, occupation, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        {/* Cell Filter */}
        {!isCellLeader ? (
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setGroupFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                groupFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Members ({members.length})
            </button>
            <button
              onClick={() => setGroupFilter('JOY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                groupFilter === 'JOY' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-amber-800 hover:bg-amber-100/50'
              }`}
            >
              Joy Cell ({members.filter((m) => m.churchGroup === 'JOY').length})
            </button>
            <button
              onClick={() => setGroupFilter('FAITH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                groupFilter === 'FAITH' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-800 hover:bg-blue-100/50'
              }`}
            >
              Faith Cell ({members.filter((m) => m.churchGroup === 'FAITH').length})
            </button>
            <button
              onClick={() => setGroupFilter('HOPE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                groupFilter === 'HOPE' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-800 hover:bg-emerald-100/50'
              }`}
            >
              Hope Cell ({members.filter((m) => m.churchGroup === 'HOPE').length})
            </button>
            <button
              onClick={() => setGroupFilter('LOVE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                groupFilter === 'LOVE' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-800 hover:bg-rose-100/50'
              }`}
            >
              Love Cell ({members.filter((m) => m.churchGroup === 'LOVE').length})
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-2xl text-xs font-extrabold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span>{assignedCell ? `${assignedCell} Cell (${members.length} members)` : 'Your Cell'}</span>
          </div>
        )}
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-3.5">Member Details</th>
                <th className="px-4 py-3.5">Church Group</th>
                <th className="px-4 py-3.5">Phone</th>
                <th className="px-4 py-3.5">Hometown</th>
                <th className="px-4 py-3.5">Marital Status</th>
                <th className="px-4 py-3.5">Occupation</th>
                <th className="px-4 py-3.5">Attendance</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member) => (
                <tr
                  key={member.id}
                  onClick={() => {
                    if (onInspectMemberProfile) {
                      onInspectMemberProfile(member);
                    } else {
                      setFallbackProfileMember(member);
                    }
                  }}
                  className="hover:bg-blue-50/50 cursor-pointer transition select-none group"
                >
                  {/* Photo & Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3.5">
                      {member.photoUrl ? (
                        <img
                          src={member.photoUrl}
                          alt={`${member.firstName} ${member.lastName}`}
                          className="w-11 h-11 rounded-2xl object-cover border-2 border-slate-200 shadow-sm shrink-0"
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

                      <div>
                        <div className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition flex items-center space-x-2">
                          <span>
                            {member.firstName} {member.lastName}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-slate-400">
                            {member.memberCode || ''}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {member.role !== 'Member' ? member.role : 'Church Member'}
                          {member.email && ` • ${member.email}`}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Church Group */}
                  <td className="px-4 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] uppercase tracking-wider inline-block ${
                        member.churchGroup === 'JOY'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : member.churchGroup === 'FAITH'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : member.churchGroup === 'HOPE'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {member.churchGroup === 'JOY'
                        ? 'Joy Cell'
                        : member.churchGroup === 'FAITH'
                        ? 'Faith Cell'
                        : member.churchGroup === 'HOPE'
                        ? 'Hope Cell'
                        : 'Love Cell'}
                    </span>
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-4 font-mono font-semibold text-slate-700">
                    {member.phone || <span className="text-slate-400 italic font-normal">None</span>}
                  </td>

                  {/* Hometown */}
                  <td className="px-4 py-4 font-medium text-slate-700">
                    {member.hometown || <span className="text-slate-400 italic">Not set</span>}
                  </td>

                  {/* Marital Status */}
                  <td className="px-4 py-4 font-medium text-slate-700">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-semibold text-[11px]">
                      {member.maritalStatus || 'Single'}
                    </span>
                  </td>

                  {/* Occupation */}
                  <td className="px-4 py-4 text-slate-600 font-medium">
                    {member.occupation || <span className="text-slate-400 italic">Not set</span>}
                  </td>

                  {/* Attendance */}
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px]">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{member._count?.attendance || 0} services</span>
                    </span>
                  </td>

                  {/* Actions Column */}
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(member)}
                        title="Edit Member Information"
                        className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {canDelete && (
                        <button
                          onClick={() => handleDeleteClick(member)}
                          title="Delete Member"
                          className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Form Modal (Add or Edit) */}
      <MemberFormModal
        isOpen={formModalState.isOpen}
        mode={formModalState.mode}
        initialMember={formModalState.member}
        onClose={() => setFormModalState({ isOpen: false, mode: 'create', member: null })}
        onSubmit={handleFormSubmit}
      />

      {/* Fallback Profile Modal */}
      {fallbackProfileMember && (
        <MemberProfileModal
          member={fallbackProfileMember}
          onClose={() => setFallbackProfileMember(null)}
          onEdit={(m) => {
            setFallbackProfileMember(null);
            openEditModal(m);
          }}
          onDelete={async (id) => {
            await onDeleteMember(id);
            setFallbackProfileMember(null);
          }}
        />
      )}
    </div>
  );
};
