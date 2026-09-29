import React, { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Download,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle,
  Heart,
  Briefcase,
  Home,
  Shield,
  Edit2,
  Trash2,
  X,
  Camera,
  Image,
  Sparkles
} from 'lucide-react';
import { Member, ChurchGroup, Gender, MemberStatus, MaritalStatus } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

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
  onInspectMemberHistory,
  onInspectMemberProfile
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

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isEditingInProfile, setIsEditingInProfile] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus>('SINGLE');
  const [churchGroup, setChurchGroup] = useState<ChurchGroup>('JOY');
  const [role, setRole] = useState('Member');
  const [status, setStatus] = useState<MemberStatus>('ACTIVE');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [weddingAnniversary, setWeddingAnniversary] = useState('');
  const [hometown, setHometown] = useState('');
  const [address, setAddress] = useState('');
  const [occupation, setOccupation] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [isWaterBaptized, setIsWaterBaptized] = useState(true);
  const [isHolyGhostBaptized, setIsHolyGhostBaptized] = useState(true);
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setFirstName('');
    setLastName('');
    setPhotoUrl('');
    setPhone('');
    setEmail('');
    setGender('MALE');
    setMaritalStatus('SINGLE');
    setChurchGroup(assignedCell || 'JOY');
    setRole('Member');
    setStatus('ACTIVE');
    setDateOfBirth('');
    setWeddingAnniversary('');
    setHometown('');
    setAddress('');
    setOccupation('');
    setEmergencyContactName('');
    setEmergencyContactPhone('');
    setIsWaterBaptized(true);
    setIsHolyGhostBaptized(true);
    setNotes('');
    setShowAddModal(true);
  };

  const populateEditForm = (member: Member) => {
    setFirstName(member.firstName);
    setLastName(member.lastName);
    setPhotoUrl(member.photoUrl || '');
    setPhone(member.phone || '');
    setEmail(member.email || '');
    setGender(member.gender);
    setMaritalStatus(member.maritalStatus || 'SINGLE');
    setChurchGroup(member.churchGroup);
    setRole(member.role);
    setStatus(member.status);
    setDateOfBirth(member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split('T')[0] : '');
    setWeddingAnniversary(member.weddingAnniversary ? new Date(member.weddingAnniversary).toISOString().split('T')[0] : '');
    setHometown(member.hometown || '');
    setAddress(member.address || '');
    setOccupation(member.occupation || '');
    setEmergencyContactName(member.emergencyContactName || '');
    setEmergencyContactPhone(member.emergencyContactPhone || '');
    setIsWaterBaptized(Boolean(member.isWaterBaptized));
    setIsHolyGhostBaptized(Boolean(member.isHolyGhostBaptized));
    setNotes(member.notes || '');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    await onAddMember({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      photoUrl: photoUrl.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      gender,
      maritalStatus,
      churchGroup,
      role,
      status,
      dateOfBirth: dateOfBirth || null,
      weddingAnniversary: weddingAnniversary || null,
      hometown: hometown.trim() || null,
      address: address.trim() || null,
      occupation: occupation.trim() || null,
      emergencyContactName: emergencyContactName.trim() || null,
      emergencyContactPhone: emergencyContactPhone.trim() || null,
      isWaterBaptized,
      isHolyGhostBaptized,
      notes: notes.trim() || null
    });

    setShowAddModal(false);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !firstName.trim() || !lastName.trim()) return;

    const data = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      photoUrl: photoUrl.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      gender,
      maritalStatus,
      churchGroup,
      role,
      status,
      dateOfBirth: dateOfBirth || null,
      weddingAnniversary: weddingAnniversary || null,
      hometown: hometown.trim() || null,
      address: address.trim() || null,
      occupation: occupation.trim() || null,
      emergencyContactName: emergencyContactName.trim() || null,
      emergencyContactPhone: emergencyContactPhone.trim() || null,
      isWaterBaptized,
      isHolyGhostBaptized,
      notes: notes.trim() || null
    };

    await onUpdateMember(selectedMember.id, data);
    setSelectedMember({ ...selectedMember, ...data });
    setIsEditingInProfile(false);
  };

  // Image Upload simulation / helper
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
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
      'Group',
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
              {members.length} registered congregants • Click on any member row to view full details and edit
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Roster</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                groupFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Members ({members.length})
            </button>
            <button
              onClick={() => setGroupFilter('JOY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                groupFilter === 'JOY' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-amber-800 hover:bg-amber-100/50'
              }`}
            >
              Joy Cell ({members.filter((m) => m.churchGroup === 'JOY').length})
            </button>
            <button
              onClick={() => setGroupFilter('FAITH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                groupFilter === 'FAITH' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-800 hover:bg-blue-100/50'
              }`}
            >
              Faith Cell ({members.filter((m) => m.churchGroup === 'FAITH').length})
            </button>
            <button
              onClick={() => setGroupFilter('HOPE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                groupFilter === 'HOPE' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-800 hover:bg-emerald-100/50'
              }`}
            >
              Hope Cell ({members.filter((m) => m.churchGroup === 'HOPE').length})
            </button>
            <button
              onClick={() => setGroupFilter('LOVE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
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
                      setSelectedMember(member);
                      setIsEditingInProfile(false);
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Profile Drawer & Edit Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="font-extrabold text-base">
                  {isEditingInProfile ? 'Edit Member Information' : 'Church Member Profile'}
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                {!isEditingInProfile && (
                  <button
                    onClick={() => {
                      populateEditForm(selectedMember);
                      setIsEditingInProfile(true);
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedMember(null)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {!isEditingInProfile ? (
                /* Profile View */
                <div className="space-y-6">
                  {/* Avatar + Main Info */}
                  <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    {selectedMember.photoUrl ? (
                      <img
                        src={selectedMember.photoUrl}
                        alt={`${selectedMember.firstName} ${selectedMember.lastName}`}
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-20 h-20 rounded-2xl flex items-center justify-center font-extrabold text-2xl text-white shadow-md shrink-0 ${
                          selectedMember.churchGroup === 'JOY'
                            ? 'bg-amber-500'
                            : selectedMember.churchGroup === 'FAITH'
                            ? 'bg-blue-600'
                            : selectedMember.churchGroup === 'HOPE'
                            ? 'bg-emerald-600'
                            : 'bg-rose-600'
                        }`}
                      >
                        {selectedMember.firstName[0]}
                        {selectedMember.lastName[0]}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h2 className="text-xl font-extrabold text-slate-900 truncate">
                          {selectedMember.firstName} {selectedMember.lastName}
                        </h2>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            selectedMember.churchGroup === 'JOY'
                              ? 'bg-amber-100 text-amber-800'
                              : selectedMember.churchGroup === 'FAITH'
                              ? 'bg-blue-100 text-blue-800'
                              : selectedMember.churchGroup === 'HOPE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {selectedMember.churchGroup === 'JOY'
                            ? 'Joy Cell'
                            : selectedMember.churchGroup === 'FAITH'
                            ? 'Faith Cell'
                            : selectedMember.churchGroup === 'HOPE'
                            ? 'Hope Cell'
                            : 'Love Cell'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        {selectedMember.role} • ID: {selectedMember.memberCode || 'CACI-000'}
                      </p>
                    </div>
                  </div>

                  {/* Personal Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">
                        Phone Number
                      </span>
                      <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                        {selectedMember.phone || 'No phone'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">
                        Email Address
                      </span>
                      <span className="font-semibold text-slate-900 mt-0.5 block truncate">
                        {selectedMember.email || 'No email'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">
                        Marital Status
                      </span>
                      <span className="font-bold text-slate-900 mt-0.5 block">
                        {selectedMember.maritalStatus || 'Single'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">
                        Date of Birth
                      </span>
                      <span className="font-semibold text-slate-900 mt-0.5 block">
                        {selectedMember.dateOfBirth
                          ? new Date(selectedMember.dateOfBirth).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'Not set'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">
                        Wedding Anniversary
                      </span>
                      <span className="font-semibold text-purple-900 mt-0.5 block">
                        {selectedMember.weddingAnniversary
                          ? new Date(selectedMember.weddingAnniversary).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'Not set'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">
                        Home Town
                      </span>
                      <span className="font-semibold text-slate-900 mt-0.5 block truncate">
                        {selectedMember.hometown || 'Not set'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">
                        Occupation
                      </span>
                      <span className="font-semibold text-slate-900 mt-0.5 block truncate">
                        {selectedMember.occupation || 'Not set'}
                      </span>
                    </div>
                  </div>

                  {/* Residential Address & Emergency Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">
                        Residential Address
                      </span>
                      <p className="font-semibold text-slate-800 mt-1">
                        {selectedMember.address || 'No residential address recorded.'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">
                        Emergency Contact
                      </span>
                      <p className="font-semibold text-slate-800 mt-1">
                        {selectedMember.emergencyContactName || 'None'}
                        {selectedMember.emergencyContactPhone && (
                          <span className="block font-mono text-[11px] text-slate-500">
                            {selectedMember.emergencyContactPhone}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Spiritual Badges */}
                  <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1.5 font-bold text-blue-900">
                        <CheckCircle className={`w-4 h-4 ${selectedMember.isWaterBaptized ? 'text-blue-600' : 'text-slate-300'}`} />
                        <span>Water Baptized: {selectedMember.isWaterBaptized ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 font-bold text-purple-900">
                        <CheckCircle className={`w-4 h-4 ${selectedMember.isHolyGhostBaptized ? 'text-purple-600' : 'text-slate-300'}`} />
                        <span>Holy Ghost Baptized: {selectedMember.isHolyGhostBaptized ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to remove ${selectedMember.firstName} ${selectedMember.lastName}?`)) {
                          onDeleteMember(selectedMember.id);
                          setSelectedMember(null);
                        }
                      }}
                      className="flex items-center space-x-1.5 text-xs text-red-600 hover:text-red-800 font-bold px-3 py-2 rounded-xl hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Member</span>
                    </button>

                    <button
                      onClick={() => setSelectedMember(null)}
                      className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                    >
                      Close Profile
                    </button>
                  </div>
                </div>
              ) : (
                /* Edit Profile Form */
                <form onSubmit={handleUpdateSubmit} className="space-y-4">
                  {/* Photo Upload / URL */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Member Picture
                    </label>
                    <div className="flex items-center space-x-4">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt="Preview"
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-300"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                          <Image className="w-6 h-6" />
                        </div>
                      )}

                      <div className="flex-1 space-y-1">
                        <input
                          type="url"
                          placeholder="Paste picture URL or upload below..."
                          value={photoUrl}
                          onChange={(e) => setPhotoUrl(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                      />
                    </div>
                  </div>

                  {/* Group, Gender, Marital, Role */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Cell *</label>
                      <select
                        value={churchGroup}
                        disabled={isCellLeader}
                        onChange={(e) => setChurchGroup(e.target.value as ChurchGroup)}
                        className={`w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold ${
                          isCellLeader ? 'bg-slate-100 cursor-not-allowed text-slate-600' : ''
                        }`}
                      >
                        {isCellLeader && assignedCell ? (
                          <option value={assignedCell}>{assignedCell} Cell</option>
                        ) : (
                          <>
                            <option value="JOY">Joy Cell</option>
                            <option value="FAITH">Faith Cell</option>
                            <option value="HOPE">Hope Cell</option>
                            <option value="LOVE">Love Cell</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Gender *</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as Gender)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Marital Status</label>
                      <select
                        value={maritalStatus}
                        onChange={(e) => setMaritalStatus(e.target.value as MaritalStatus)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                      >
                        <option value="SINGLE">Single</option>
                        <option value="MARRIED">Married</option>
                        <option value="WIDOWED">Widowed</option>
                        <option value="DIVORCED">Divorced</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                      >
                        <option value="Member">Member</option>
                        <option value="Elder">Elder</option>
                        <option value="Deacon">Deacon</option>
                        <option value="Deaconess">Deaconess</option>
                        <option value="Usher">Usher</option>
                        <option value="Pastor">Pastor</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">DOB</label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Wedding Anniv.</label>
                      <input
                        type="date"
                        value={weddingAnniversary}
                        onChange={(e) => setWeddingAnniversary(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Home Town</label>
                      <input
                        type="text"
                        value={hometown}
                        onChange={(e) => setHometown(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Occupation</label>
                      <input
                        type="text"
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Name</label>
                      <input
                        type="text"
                        value={emergencyContactName}
                        onChange={(e) => setEmergencyContactName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Phone</label>
                      <input
                        type="tel"
                        value={emergencyContactPhone}
                        onChange={(e) => setEmergencyContactPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsEditingInProfile(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                    >
                      Cancel Edit
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm transition"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add New Church Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-base flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <span>Add New Church Member</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-4">
              {/* Picture Upload / URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Member Picture (Upload or URL)
                </label>
                <div className="flex items-center space-x-4">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Member Preview"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-300 shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex flex-col items-center justify-center text-slate-400 border border-slate-200">
                      <Camera className="w-6 h-6" />
                      <span className="text-[9px] font-bold mt-0.5">Photo</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="url"
                      placeholder="Paste online image link (or upload below)..."
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kwame"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mensah"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +233 24 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. kwame@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Group, Gender, Marital, Role */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Cell *</label>
                  <select
                    value={churchGroup}
                    disabled={isCellLeader}
                    onChange={(e) => setChurchGroup(e.target.value as ChurchGroup)}
                    className={`w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                      isCellLeader ? 'bg-slate-100 cursor-not-allowed text-slate-600' : ''
                    }`}
                  >
                    {isCellLeader && assignedCell ? (
                      <option value={assignedCell}>{assignedCell} Cell</option>
                    ) : (
                      <>
                        <option value="JOY">Joy Cell</option>
                        <option value="FAITH">Faith Cell</option>
                        <option value="HOPE">Hope Cell</option>
                        <option value="LOVE">Love Cell</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Marital Status</label>
                  <select
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value as MaritalStatus)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="SINGLE">Single</option>
                    <option value="MARRIED">Married</option>
                    <option value="WIDOWED">Widowed</option>
                    <option value="DIVORCED">Divorced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Church Role / Title</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Member">Member</option>
                    <option value="Elder">Elder</option>
                    <option value="Deacon">Deacon</option>
                    <option value="Deaconess">Deaconess</option>
                    <option value="Usher">Usher</option>
                    <option value="Pastor">Pastor</option>
                  </select>
                </div>
              </div>

              {/* DOB, Wedding Anniversary, Hometown, Occupation */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Wedding Anniv.</label>
                  <input
                    type="date"
                    value={weddingAnniversary}
                    onChange={(e) => setWeddingAnniversary(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Home Town</label>
                  <input
                    type="text"
                    placeholder="e.g. Kumasi"
                    value={hometown}
                    onChange={(e) => setHometown(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Occupation</label>
                  <input
                    type="text"
                    placeholder="e.g. Teacher"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Residential Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  placeholder="e.g. House 14, Ring Road Central, Accra"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Emergency Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Mary Mensah (Wife)"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. +233 24 999 8877"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Baptism Checkboxes */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-6 text-xs">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isWaterBaptized}
                    onChange={(e) => setIsWaterBaptized(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="font-bold text-slate-800">Water Baptized</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isHolyGhostBaptized}
                    onChange={(e) => setIsHolyGhostBaptized(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="font-bold text-slate-800">Holy Ghost Baptized</span>
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Additional Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional pastoral notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Form Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition"
                >
                  Save Member Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
