import React, { useState } from 'react';
import { Building2, Users, Plus, Shield, MessageSquare, Phone, X, Check } from 'lucide-react';
import { Department } from '../types/index.ts';

interface DepartmentsViewProps {
  departments: Department[];
  onCreateDepartment: (data: { name: string; description?: string; leaderName?: string }) => Promise<void>;
  onNavigateToMessaging: (targetType: string, departmentId?: string) => void;
}

export const DepartmentsView: React.FC<DepartmentsViewProps> = ({
  departments,
  onCreateDepartment,
  onNavigateToMessaging
}) => {
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptLeader, setDeptLeader] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) return;

    await onCreateDepartment({
      name: deptName.trim(),
      leaderName: deptLeader.trim() || undefined,
      description: deptDesc.trim() || undefined
    });

    setDeptName('');
    setDeptLeader('');
    setDeptDesc('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Church Auxiliaries & Departments</h2>
            <p className="text-xs text-slate-500">
              Manage ministries, department rosters, leaders, and auxiliary communication
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Department</span>
        </button>
      </div>

      {/* Grid of Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  {dept.members?.length || dept._count?.members || 0} members
                </span>
              </div>

              <h3 className="font-bold text-base text-slate-900 mt-3">{dept.name}</h3>

              {dept.description && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{dept.description}</p>
              )}

              {dept.leaderName && (
                <div className="mt-3 flex items-center space-x-2 text-xs font-semibold text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <Shield className="w-3.5 h-3.5 text-purple-600" />
                  <span>Leader: {dept.leaderName}</span>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => setSelectedDept(dept)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition"
              >
                View Roster & Members →
              </button>

              <button
                onClick={() => onNavigateToMessaging('DEPARTMENT', dept.id)}
                title="Send SMS / WhatsApp to this department"
                className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Department Roster Modal */}
      {selectedDept && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">{selectedDept.name}</h3>
                <p className="text-xs text-slate-400">
                  {selectedDept.leaderName ? `Leader: ${selectedDept.leaderName} • ` : ''}
                  {selectedDept.members?.length || 0} member(s)
                </p>
              </div>
              <button
                onClick={() => setSelectedDept(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {(!selectedDept.members || selectedDept.members.length === 0) ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No members are currently assigned to this department.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDept.members.map(({ member }) => (
                    <div
                      key={member.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs ${
                            member.churchGroup === 'GROUP_1' ? 'bg-blue-600' : 'bg-purple-600'
                          }`}
                        >
                          {member.firstName[0]}
                          {member.lastName[0]}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-sm block">
                            {member.firstName} {member.lastName}
                          </span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            {member.phone || 'No phone'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            member.churchGroup === 'GROUP_1'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {member.churchGroup === 'GROUP_1' ? 'Group 1' : 'Group 2'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium text-[10px]">
                          {member.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    const deptId = selectedDept.id;
                    setSelectedDept(null);
                    onNavigateToMessaging('DEPARTMENT', deptId);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold rounded-lg text-xs transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send Notice to This Department</span>
                </button>

                <button
                  onClick={() => setSelectedDept(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Create New Department / Auxiliary</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Welfare & Benevolence Team"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department Leader / President
                </label>
                <input
                  type="text"
                  placeholder="e.g. Brother John Mensah"
                  value={deptLeader}
                  onChange={(e) => setDeptLeader(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief description of ministry role..."
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl shadow-sm transition"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
