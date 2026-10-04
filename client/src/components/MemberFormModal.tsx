import React, { useState, useEffect } from 'react';
import { X, User, UserPlus, Edit2, Camera, Image, CheckCircle, AlertCircle, Loader2, Building2 } from 'lucide-react';
import { Member, ChurchGroup, Gender, MemberStatus, MaritalStatus, Department } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';

interface MemberFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialMember?: Member | null;
  departments?: Department[];
  onClose: () => void;
  onSubmit: (memberData: any) => Promise<void>;
}

const formatDateForInput = (val?: string | Date | null): string => {
  if (!val) return '';
  try {
    const s = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      return s.substring(0, 10);
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return '';
  }
};

export const MemberFormModal: React.FC<MemberFormModalProps> = ({
  isOpen,
  mode,
  initialMember,
  departments,
  onClose,
  onSubmit
}) => {
  const { user } = useAuth();
  const isCellLeader = user?.role === 'CELL_LEADER';
  const assignedCell = isCellLeader ? user?.cell : null;

  const [availableDepartments, setAvailableDepartments] = useState<Department[]>(departments || []);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);

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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (departments && departments.length > 0) {
      setAvailableDepartments(departments);
    } else if (isOpen) {
      api.getDepartments().then(setAvailableDepartments).catch(() => {});
    }
  }, [departments, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    setErrorMessage(null);
    if (mode === 'edit' && initialMember) {
      setFirstName(initialMember.firstName || '');
      setLastName(initialMember.lastName || '');
      setPhotoUrl(initialMember.photoUrl || '');
      setPhone(initialMember.phone || '');
      setEmail(initialMember.email || '');
      setGender(initialMember.gender || 'MALE');
      setMaritalStatus(initialMember.maritalStatus || 'SINGLE');
      setChurchGroup(initialMember.churchGroup || assignedCell || 'JOY');
      setRole(initialMember.role || 'Member');
      setStatus(initialMember.status || 'ACTIVE');
      setDateOfBirth(formatDateForInput(initialMember.dateOfBirth));
      setWeddingAnniversary(formatDateForInput(initialMember.weddingAnniversary));
      setHometown(initialMember.hometown || '');
      setAddress(initialMember.address || '');
      setOccupation(initialMember.occupation || '');
      setEmergencyContactName(initialMember.emergencyContactName || '');
      setEmergencyContactPhone(initialMember.emergencyContactPhone || '');
      setIsWaterBaptized(Boolean(initialMember.isWaterBaptized));
      setIsHolyGhostBaptized(Boolean(initialMember.isHolyGhostBaptized));
      setNotes(initialMember.notes || '');

      const deptIds = (initialMember.departments || [])
        .map((d: any) => d.departmentId || d.department?.id || d.id)
        .filter(Boolean);
      setSelectedDepartmentIds(deptIds);
    } else {
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
      setSelectedDepartmentIds([]);
    }
  }, [isOpen, mode, initialMember, assignedCell]);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('Image file is too large (max 2MB).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('First name and last name are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        photoUrl: photoUrl.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        gender,
        maritalStatus,
        churchGroup: isCellLeader && assignedCell ? assignedCell : churchGroup,
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
        notes: notes.trim() || null,
        departmentIds: selectedDepartmentIds,
        // Auto-enter pipeline when role is First-Timer
        assimilationStage: role === 'First-Timer' ? 'FIRST_VISIT' : undefined,
      };

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col my-auto border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            {mode === 'edit' ? (
              <div className="p-1.5 rounded-xl bg-blue-600/30 text-blue-400">
                <Edit2 className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-1.5 rounded-xl bg-emerald-600/30 text-emerald-400">
                <UserPlus className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="font-extrabold text-base">
                {mode === 'edit' ? 'Edit Member Information' : 'Add New Church Member'}
              </h3>
              {mode === 'edit' && initialMember && (
                <p className="text-[11px] text-slate-400">
                  Editing: {initialMember.firstName} {initialMember.lastName} ({initialMember.memberCode || 'CACI'})
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="px-6 py-3 bg-rose-50 border-b border-rose-200 flex items-center space-x-2 text-rose-800 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Photo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Member Picture (Upload or URL)
            </label>
            <div className="flex items-center space-x-4">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Member Preview"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500 shadow-sm shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex flex-col items-center justify-center text-slate-400 border border-slate-200 shrink-0">
                  <Camera className="w-6 h-6" />
                  <span className="text-[9px] font-bold mt-0.5">Photo</span>
                </div>
              )}

              <div className="flex-1 space-y-1.5">
                <input
                  type="url"
                  placeholder="Paste online image link (or upload file below)..."
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="text-[11px] text-slate-400 hover:text-rose-600 font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* First & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Kwame"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Contact (Phone & Email) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="e.g. +233 24 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
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

          {/* Cell, Gender, Marital, Role */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Cell *</label>
              <select
                value={churchGroup}
                disabled={isCellLeader}
                onChange={(e) => setChurchGroup(e.target.value as ChurchGroup)}
                className={`w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  isCellLeader ? 'bg-slate-100 cursor-not-allowed text-slate-600' : 'text-slate-900'
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Church Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="First-Timer">First-Timer (Visitor)</option>
                <option value="Member">Member</option>
                <option value="Elder">Elder</option>
                <option value="Deacon">Deacon</option>
                <option value="Deaconess">Deaconess</option>
                <option value="Usher">Usher</option>
                <option value="Choir">Choir</option>
                <option value="Pastor">Pastor</option>
              </select>
            </div>
          </div>

          {/* Auxiliaries / Departments Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-purple-600" />
                <span>Auxiliaries & Church Departments</span>
              </label>
              <span className="text-[11px] text-slate-400 font-semibold">
                {selectedDepartmentIds.length} auxiliary{selectedDepartmentIds.length !== 1 ? 'ies' : ''} assigned
              </span>
            </div>

            {availableDepartments.length > 0 ? (
              <div className="flex flex-wrap gap-2 p-3 bg-purple-50/40 border border-purple-200/60 rounded-2xl">
                {availableDepartments.map((dept) => {
                  const isSelected = selectedDepartmentIds.includes(dept.id);
                  return (
                    <button
                      type="button"
                      key={dept.id}
                      onClick={() => {
                        setSelectedDepartmentIds((prev) =>
                          isSelected ? prev.filter((id) => id !== dept.id) : [...prev, dept.id]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                          : 'bg-white border border-slate-200 text-slate-700 hover:border-purple-300 hover:bg-white'
                      }`}
                    >
                      <CheckCircle className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-300'}`} />
                      <span>{dept.name}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-400 italic">
                No auxiliaries available. You can add auxiliaries under the Auxiliaries tab.
              </div>
            )}
          </div>

          {/* Dates & Demographics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Date of Birth</label>
                {dateOfBirth && (
                  <button
                    type="button"
                    onClick={() => setDateOfBirth('')}
                    className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Wedding Anniv.</label>
                {weddingAnniversary && (
                  <button
                    type="button"
                    onClick={() => setWeddingAnniversary('')}
                    className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={weddingAnniversary}
                onChange={(e) => {
                  setWeddingAnniversary(e.target.value);
                  if (e.target.value && maritalStatus === 'SINGLE') {
                    setMaritalStatus('MARRIED');
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hometown</label>
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
              placeholder="e.g. Hse No. 14, Ring Road Central, Accra"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Emergency Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Name</label>
              <input
                type="text"
                placeholder="e.g. Sarah Mensah (Spouse)"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Phone</label>
              <input
                type="tel"
                placeholder="e.g. +233 24 999 8888"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Spiritual Status */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-6">
            <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isWaterBaptized}
                onChange={(e) => setIsWaterBaptized(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Water Baptized</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isHolyGhostBaptized}
                onChange={(e) => setIsHolyGhostBaptized(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
              />
              <span>Holy Ghost Baptized</span>
            </label>

            <div className="flex items-center space-x-2 ml-auto">
              <span className="text-xs font-bold text-slate-600">Member Status:</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MemberStatus)}
                className="px-2.5 py-1 rounded-xl text-xs font-bold border border-slate-300 bg-white"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Pastoral Comments</label>
            <textarea
              rows={2}
              placeholder="Any additional details or comments..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            ></textarea>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Member' : 'Register Member'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
