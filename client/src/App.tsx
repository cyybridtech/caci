import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Header } from './components/Header.tsx';
import { CheckInDesk } from './components/CheckInDesk.tsx';
import { MembersDirectory } from './components/MembersDirectory.tsx';
import { AttendanceAuditView } from './components/AttendanceAuditView.tsx';
import { ExecutiveDashboard } from './components/ExecutiveDashboard.tsx';
import { AssimilationPipeline } from './components/AssimilationPipeline.tsx';
import { DepartmentsView } from './components/DepartmentsView.tsx';
import { FinancesView } from './components/FinancesView.tsx';
import { MessagingView } from './components/MessagingView.tsx';
import { CelebrationsView } from './components/CelebrationsView.tsx';
import { CampaignsView } from './components/CampaignsView.tsx';
import { UserManagement } from './components/UserManagement.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { ChangePasswordModal } from './components/ChangePasswordModal.tsx';
import { MemberProfileModal } from './components/MemberProfileModal.tsx';
import { MemberFormModal } from './components/MemberFormModal.tsx';
import { Footer } from './components/Footer.tsx';
import { MemberAttendanceHistoryModal } from './components/MemberAttendanceHistoryModal.tsx';
import { useAuth } from './context/AuthContext.tsx';
import { api } from './services/api.ts';
import { offlineSync } from './services/offlineSync.ts';
import {
  Member,
  Department,
  ServiceSession,
  AttendanceRecord,
  AttendanceStats,
  FinancialContribution,
  FinancialSummary,
  MessageLog,
  AssimilationStage,
  ChurchGroup,
  UserRole
} from './types/index.ts';

const isRoleAuthorizedForTab = (tab: string, role?: UserRole): boolean => {
  if (!role || role === 'ADMIN' || role === 'DEVELOPER') return true;
  if (role === 'CELL_LEADER') {
    return ['checkin', 'members', 'attendance-history', 'pipeline'].includes(tab);
  }
  if (role === 'MEDIA_TEAM') {
    return ['checkin', 'members', 'attendance-history', 'celebrations', 'messaging'].includes(tab);
  }
  if (role === 'FINANCE') {
    return ['finances', 'campaigns'].includes(tab);
  }
  return false;
};

const getDefaultTabForRole = (role?: UserRole): 'checkin' | 'finances' | 'analytics' => {
  if (role === 'FINANCE') return 'finances';
  if (role === 'MEDIA_TEAM') return 'checkin';
  if (role === 'CELL_LEADER') return 'checkin';
  return 'checkin';
};

export const App: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const isDeveloper = user?.role === 'DEVELOPER';

  // Developer role preview / impersonation state
  const [developerPreviewRole, setDeveloperPreviewRole] = useState<UserRole | null>(null);
  const [developerPreviewCell, setDeveloperPreviewCell] = useState<ChurchGroup | null>(null);

  const effectiveUser = useMemo(() => {
    if (!user) return null;
    if (isDeveloper && developerPreviewRole) {
      return {
        ...user,
        role: developerPreviewRole,
        cell: developerPreviewCell || undefined
      };
    }
    return user;
  }, [user, isDeveloper, developerPreviewRole, developerPreviewCell]);

  const effectiveRole = effectiveUser?.role;

  const [activeTab, setActiveTab] = useState<
    | 'checkin'
    | 'members'
    | 'attendance-history'
    | 'analytics'
    | 'pipeline'
    | 'departments'
    | 'finances'
    | 'campaigns'
    | 'celebrations'
    | 'messaging'
    | 'users'
  >(user?.role === 'FINANCE' ? 'finances' : 'checkin');

  // Ensure activeTab matches role permissions whenever user or preview role changes
  useEffect(() => {
    if (effectiveRole && !isRoleAuthorizedForTab(activeTab, effectiveRole)) {
      setActiveTab(getDefaultTabForRole(effectiveRole));
    }
  }, [effectiveRole, activeTab]);

  // Core data states
  const [activeSession, setActiveSession] = useState<ServiceSession | null>(null);
  const [sessions, setSessions] = useState<ServiceSession[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [contributions, setContributions] = useState<FinancialContribution[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [todayCelebrantsCount, setTodayCelebrantsCount] = useState<number>(0);

  // Modals
  const [inspectingHistoryMember, setInspectingHistoryMember] = useState<Member | null>(null);
  const [profileMember, setProfileMember] = useState<Member | null>(null);
  const [profileContext, setProfileContext] = useState<'members' | 'audit'>('members');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  // UI & Sync states
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(offlineSync.getOnlineStatus());
  const [offlineQueueCount, setOfflineQueueCount] = useState(offlineSync.getTotalQueueCount());
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<'success' | 'error' | 'info'>('success');
  const [dataLoadFailures, setDataLoadFailures] = useState<string[]>([]);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Messaging navigation params
  const [messagingTarget, setMessagingTarget] = useState<string>('ATTENDEES_TODAY');
  const [messagingDeptId, setMessagingDeptId] = useState<string | undefined>(undefined);

  const showToast = (msg: string, tone: 'success' | 'error' | 'info' = 'success') => {
    setToastTone(tone);
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3500);
  };

  const handleLogout = () => {
    // Clear state completely on logout to prevent state pollution across users/roles
    setMembers([]);
    setAttendanceRecords([]);
    setStats(null);
    setContributions([]);
    setFinancialSummary(null);
    setDepartments([]);
    setSessions([]);
    setActiveSession(null);
    setMessageLogs([]);
    setTodayCelebrantsCount(0);
    setActiveTab('checkin');
    logout();
  };

  useEffect(() => {
    const unsubscribe = offlineSync.subscribe((online, queueCount) => {
      setIsOnline(online);
      setOfflineQueueCount(queueCount);
    });
    return unsubscribe;
  }, []);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    setDataLoadFailures([]);
    setIsLoading(true);

    const requestOrFallback = async <T,>(label: string, request: Promise<T>, fallback: T): Promise<T> => {
      try {
        return await request;
      } catch (error) {
        console.warn(`Unable to load ${label}:`, error);
        setDataLoadFailures((previous) => previous.includes(label) ? previous : [...previous, label]);
        return fallback;
      }
    };

    try {
      const role = user?.role;

      if (role === 'FINANCE') {
        const [fetchedMembers, fetchedFinances, finSummary, fetchedActive, fetchedSessions] = await Promise.all([
          requestOrFallback('members', api.getMembers(), [] as Member[]),
          requestOrFallback('contributions', api.getFinances(), [] as FinancialContribution[]),
          requestOrFallback('financial summary', api.getFinancialSummary(), null),
          requestOrFallback('active service', api.getActiveSession(), null),
          requestOrFallback('service sessions', api.getSessions(), [] as ServiceSession[])
        ]);

        const savedSessionId = localStorage.getItem('caci_selected_session_id');
        const effectiveActive = fetchedSessions.find((s) => s.id === savedSessionId) || fetchedActive || fetchedSessions[0] || null;
        if (effectiveActive) localStorage.setItem('caci_selected_session_id', effectiveActive.id);

        setMembers(fetchedMembers);
        setContributions(fetchedFinances);
        setFinancialSummary(finSummary);
        setActiveSession(effectiveActive);
        setSessions(fetchedSessions);
        setAttendanceRecords([]);
        setStats(null);
        setDepartments([]);
        setMessageLogs([]);
        return;
      }

      const [fetchedSessions, fetchedActive, fetchedMembers, fetchedDepts] = await Promise.all([
        requestOrFallback('service sessions', api.getSessions(), [] as ServiceSession[]),
        requestOrFallback('active service', api.getActiveSession(), null),
        requestOrFallback('members', api.getMembers(), [] as Member[]),
        requestOrFallback('departments', api.getDepartments(), [] as Department[])
      ]);

      const savedSessionId = localStorage.getItem('caci_selected_session_id');
      const effectiveActive = fetchedSessions.find((s) => s.id === savedSessionId) || fetchedActive || fetchedSessions[0] || null;
      if (effectiveActive) localStorage.setItem('caci_selected_session_id', effectiveActive.id);

      setSessions(fetchedSessions);
      setActiveSession(effectiveActive);
      setMembers(fetchedMembers);
      setDepartments(fetchedDepts);

      if (effectiveActive && role === 'CELL_LEADER') {
        const [attRecords, attStats] = await Promise.all([
          requestOrFallback('attendance records', api.getSessionAttendance(effectiveActive.id), [] as AttendanceRecord[]),
          requestOrFallback('attendance summary', api.getAttendanceStats(effectiveActive.id), null)
        ]);
        setAttendanceRecords(attRecords);
        setStats(attStats);
        setContributions([]);
        setFinancialSummary(null);
        setMessageLogs([]);
        setTodayCelebrantsCount(0);
      } else if (effectiveActive) {
        const [attRecords, attStats, fetchedFinances, finSummary, msgs, celData] = await Promise.all([
          requestOrFallback('attendance records', api.getSessionAttendance(effectiveActive.id), [] as AttendanceRecord[]),
          requestOrFallback('attendance summary', api.getAttendanceStats(effectiveActive.id), null),
          role === 'ADMIN' ? requestOrFallback('contributions', api.getFinances(), [] as FinancialContribution[]) : Promise.resolve([] as FinancialContribution[]),
          role === 'ADMIN' ? requestOrFallback('financial summary', api.getFinancialSummary(), null) : Promise.resolve(null),
          requestOrFallback('message history', api.getMessageLogs(), [] as MessageLog[]),
          requestOrFallback('celebrations', api.getTodayCelebrants(), [] as any[])
        ]);

        setAttendanceRecords(attRecords);
        setStats(attStats);
        setContributions(fetchedFinances);
        setFinancialSummary(finSummary);
        setMessageLogs(msgs);
        setTodayCelebrantsCount(Array.isArray(celData) ? celData.length : 0);
      } else {
        setAttendanceRecords([]);
        setStats(null);
        if (role === 'ADMIN' || role === 'MEDIA_TEAM') {
          const celData = await requestOrFallback('celebrations', api.getTodayCelebrants(), [] as any[]);
          setTodayCelebrantsCount(Array.isArray(celData) ? celData.length : 0);
        }
      }
    } catch (error) {
      console.error('Failed loading church data:', error);
      setDataLoadFailures((previous) => previous.includes('workspace data') ? previous : [...previous, 'workspace data']);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // If not logged in, render the login page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Session selection handler
  const handleSelectSession = async (session: ServiceSession) => {
    try {
      const [attRecords, attStats] = await Promise.all([
        api.getSessionAttendance(session.id),
        api.getAttendanceStats(session.id)
      ]);
      setActiveSession(session);
      localStorage.setItem('caci_selected_session_id', session.id);
      setAttendanceRecords(attRecords);
      setStats(attStats);
      showToast(`Active: ${session.serviceType} (${new Date(session.serviceDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})`);
    } catch (err) {
      console.error(err);
      showToast('Could not load this service’s attendance. Please try again.', 'error');
    }
  };

  // Date selection handler
  const handleSelectDate = async (dateStr: string) => {
    try {
      let session = await api.getSessionByDate(dateStr, true);
      if (!session) {
        session = await api.createSession({
          serviceDate: dateStr,
          serviceType: 'Sunday Divine Worship Service',
          theme: 'Walking in God\'s Power'
        });
      }

      const [attRecords, attStats] = await Promise.all([
        api.getSessionAttendance(session.id),
        api.getAttendanceStats(session.id)
      ]);
      setSessions((prev) => {
        if (!prev.some((s) => s.id === session.id)) return [session, ...prev];
        return prev;
      });
      setActiveSession(session);
      localStorage.setItem('caci_selected_session_id', session.id);
      setAttendanceRecords(attRecords);
      setStats(attStats);
      showToast(`Switched to: ${session.serviceType} (${new Date(session.serviceDate).toLocaleDateString()})`);
    } catch (err: any) {
      console.error('Error switching date:', err);
      showToast(err.message || 'Could not switch to that service date. Please try again.', 'error');
    }
  };

  // Create session handler
  const handleCreateSession = async (data: { serviceDate?: string; serviceType: string; theme?: string }) => {
    try {
      const newSession = await api.createSession(data);
      setSessions((prev) => [newSession, ...prev.filter((s) => s.id !== newSession.id)]);
      setActiveSession(newSession);
      localStorage.setItem('caci_selected_session_id', newSession.id);
      setAttendanceRecords([]);
      setStats({
        totalMembers: members.length,
        totalPresent: 0,
        totalAbsent: members.length,
        overallPercentage: 0,
        cells: {
          JOY: { total: members.filter(m => m.churchGroup === 'JOY').length, present: 0, absent: members.filter(m => m.churchGroup === 'JOY').length, percentage: 0 },
          FAITH: { total: members.filter(m => m.churchGroup === 'FAITH').length, present: 0, absent: members.filter(m => m.churchGroup === 'FAITH').length, percentage: 0 },
          HOPE: { total: members.filter(m => m.churchGroup === 'HOPE').length, present: 0, absent: members.filter(m => m.churchGroup === 'HOPE').length, percentage: 0 },
          LOVE: { total: members.filter(m => m.churchGroup === 'LOVE').length, present: 0, absent: members.filter(m => m.churchGroup === 'LOVE').length, percentage: 0 },
        }
      });
      showToast(`Created & selected: ${newSession.serviceType}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to create service session.', 'error');
    }
  };

  // Delete session handler
  const handleDeleteSession = (sessionId: string) => {
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== sessionId);
      if (activeSession?.id === sessionId) {
        const nextActive = remaining[0] || null;
        setActiveSession(nextActive);
        if (nextActive) {
          localStorage.setItem('caci_selected_session_id', nextActive.id);
          api.getSessionAttendance(nextActive.id).then(setAttendanceRecords).catch(() => setAttendanceRecords([]));
          api.getAttendanceStats(nextActive.id).then(setStats).catch(() => setStats(null));
        } else {
          localStorage.removeItem('caci_selected_session_id');
          setAttendanceRecords([]);
          setStats(null);
        }
      }
      return remaining;
    });
    showToast('Service session removed');
  };

  // Check-In handler
  const handleCheckIn = async (memberId: string) => {
    if (!activeSession) return;
    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    // Optimistic update
    const optimisticRecord: AttendanceRecord = {
      id: `temp-${Date.now()}`,
      sessionId: activeSession.id,
      memberId,
      checkInTime: new Date().toISOString(),
      markedBy: user?.username || 'Media Desk',
      member
    };

    setAttendanceRecords((prev) => [optimisticRecord, ...prev]);

    if (stats) {
      const cellKey = member.churchGroup;
      const newPresent = stats.totalPresent + 1;
      const currentCell = stats.cells?.[cellKey] || { total: 0, present: 0, absent: 0, percentage: 0 };
      const newCellPresent = currentCell.present + 1;

      setStats({
        ...stats,
        totalPresent: newPresent,
        totalAbsent: Math.max(0, stats.totalMembers - newPresent),
        overallPercentage: Math.round((newPresent / (stats.totalMembers || 1)) * 100),
        cells: {
          ...stats.cells,
          [cellKey]: {
            ...currentCell,
            present: newCellPresent,
            absent: Math.max(0, currentCell.total - newCellPresent),
            percentage: currentCell.total > 0 ? Math.round((newCellPresent / currentCell.total) * 100) : 0
          }
        }
      });
    }

    const cellName = member.churchGroup === 'JOY' ? 'Joy Cell' : member.churchGroup === 'FAITH' ? 'Faith Cell' : member.churchGroup === 'HOPE' ? 'Hope Cell' : 'Love Cell';
    showToast(`Checked in: ${member.firstName} ${member.lastName} (${cellName})`);

    if (!isOnline) {
      offlineSync.queueAttendance({
        sessionId: activeSession.id,
        memberId,
        memberName: `${member.firstName} ${member.lastName}`,
        churchGroup: member.churchGroup,
        markedBy: `${user?.username || 'Media Desk'} (Offline)`,
        checkInTime: new Date().toISOString()
      });
      return;
    }

    try {
      const res = await api.checkIn(activeSession.id, memberId, user?.username);
      setAttendanceRecords((prev) =>
        prev.map((r) => (r.memberId === memberId ? res.record : r))
      );
    } catch (err) {
      console.warn('Network check-in failed, queueing offline:', err);
      offlineSync.queueAttendance({
        sessionId: activeSession.id,
        memberId,
        memberName: `${member.firstName} ${member.lastName}`,
        churchGroup: member.churchGroup,
        markedBy: `${user?.username || 'Media Desk'} (Offline Fallback)`,
        checkInTime: new Date().toISOString()
      });
      showToast(`Saved to offline queue: ${member.firstName} ${member.lastName}`);
    }
  };

  // Undo Check-In handler
  const handleUndoCheckIn = async (memberId: string) => {
    if (!activeSession) return;
    if (!isOnline) {
      const message = 'Reconnect to the internet before undoing a check-in.';
      showToast(message, 'error');
      throw new Error(message);
    }
    const member = members.find((m) => m.id === memberId);
    const previousRecords = attendanceRecords;
    const previousStats = stats;

    setAttendanceRecords((prev) => prev.filter((r) => r.memberId !== memberId));

    if (stats && member) {
      const cellKey = member.churchGroup;
      const newPresent = Math.max(0, stats.totalPresent - 1);
      const currentCell = stats.cells?.[cellKey] || { total: 0, present: 0, absent: 0, percentage: 0 };
      const newCellPresent = Math.max(0, currentCell.present - 1);

      setStats({
        ...stats,
        totalPresent: newPresent,
        totalAbsent: Math.min(stats.totalMembers, stats.totalAbsent + 1),
        overallPercentage: Math.round((newPresent / (stats.totalMembers || 1)) * 100),
        cells: {
          ...stats.cells,
          [cellKey]: {
            ...currentCell,
            present: newCellPresent,
            absent: Math.max(0, currentCell.total - newCellPresent),
            percentage: currentCell.total > 0 ? Math.round((newCellPresent / currentCell.total) * 100) : 0
          }
        }
      });
    }

    try {
      await api.undoCheckIn(activeSession.id, memberId);
    } catch (err: any) {
      console.error('Could not undo attendance:', err);
      setAttendanceRecords(previousRecords);
      setStats(previousStats);
      const message = err.message || 'Could not undo check-in. Please try again.';
      showToast(message, 'error');
      throw err;
    }
    showToast(`Undone check-in for ${member?.firstName || 'member'}`);
  };

  // Explicit Save Attendance Handler
  const handleSaveAttendance = async () => {
    if (!activeSession) return;
    try {
      if (!isOnline) {
        showToast('Attendance is queued offline and will sync when reconnected.', 'info');
        return;
      }
      await offlineSync.syncQueuedData();
      const [recs, st] = await Promise.all([
        api.getSessionAttendance(activeSession.id),
        api.getAttendanceStats(activeSession.id)
      ]);
      setAttendanceRecords(recs);
      setStats(st);
      showToast(`Attendance for ${activeSession.serviceType} saved permanently!`);
    } catch (err: any) {
      console.error('Error saving attendance:', err);
      showToast(err.message || 'Could not refresh attendance. Your offline queue is unchanged.', 'error');
    }
  };

  // Manual Sync
  const handleManualSync = async () => {
    try {
      setIsSyncing(true);
      const res = await offlineSync.syncQueuedData();
      showToast(`Synced ${res.syncedAttendance} attendance & ${res.syncedContributions} contributions!`);
      if (activeSession) {
        const [recs, st, fins, fsum] = await Promise.all([
          api.getSessionAttendance(activeSession.id),
          api.getAttendanceStats(activeSession.id),
          api.getFinances(),
          api.getFinancialSummary()
        ]);
        setAttendanceRecords(recs);
        setStats(st);
        setContributions(fins);
        setFinancialSummary(fsum);
      }
    } catch (err: any) {
      showToast(err.message || 'Could not complete sync or refresh. Check the queue status before retrying.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Member CRUD
  const handleAddMember = async (memberData: any) => {
    const newMember = await api.createMember(memberData);
    setMembers((prev) => [newMember, ...prev]);
    showToast(`Added member: ${newMember.firstName} ${newMember.lastName}`);
  };

  const handleUpdateMember = async (id: string, memberData: any) => {
    const updated = await api.updateMember(id, memberData);
    setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
    showToast(`Updated member: ${updated.firstName} ${updated.lastName}`);
  };

  const handleDeleteMember = async (id: string) => {
    await api.deleteMember(id);
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setAttendanceRecords((prev) => prev.filter((r) => r.memberId !== id));
    showToast('Member removed');
  };

  // Update Assimilation Stage
  const handleUpdateAssimilationStage = async (memberId: string, stage: AssimilationStage, group?: ChurchGroup) => {
    const updated = await api.updateAssimilationStage(memberId, stage, group);
    setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
    showToast(`Updated visitor stage: ${updated.firstName} ${updated.lastName}`);
  };

  // Department creation
  const handleCreateDepartment = async (data: { name: string; description?: string; leaderName?: string }) => {
    const dept = await api.createDepartment(data);
    setDepartments((prev) => [...prev, dept]);
    showToast(`Created department: ${dept.name}`);
  };

  // Record Contribution
  const handleRecordContribution = async (data: any) => {
    if (!isOnline) {
      offlineSync.queueContribution(data);
      showToast('Offline: Contribution saved to laptop queue.');
      return;
    }

    try {
      const rec = await api.recordContribution(data);
      setContributions((prev) => [rec, ...prev]);
      const summary = await api.getFinancialSummary();
      setFinancialSummary(summary);
      showToast(`Recorded GH₵ ${Number(rec.amount).toFixed(2)} contribution!`);
    } catch (err: any) {
      offlineSync.queueContribution(data);
      showToast('Network error: Contribution saved to offline queue.');
    }
  };

  // Update Contribution
  const handleUpdateContribution = async (id: string, data: any) => {
    try {
      const updated = await api.updateContribution(id, data);
      setContributions((prev) => prev.map((c) => (c.id === id ? updated : c)));
      const summary = await api.getFinancialSummary();
      setFinancialSummary(summary);
      showToast(`Contribution updated successfully!`);
    } catch (err: any) {
      alert(err.message || 'Failed to update contribution');
    }
  };

  // Delete Contribution
  const handleDeleteContribution = async (id: string) => {
    try {
      await api.deleteContribution(id);
      setContributions((prev) => prev.filter((c) => c.id !== id));
      const summary = await api.getFinancialSummary();
      setFinancialSummary(summary);
      showToast('Contribution deleted.');
    } catch (err: any) {
      alert(err.message || 'Failed to delete contribution');
    }
  };

  // Broadcast messaging
  const handleBroadcast = async (data: any) => {
    const res = await api.broadcastMessage(data);
    const logs = await api.getMessageLogs();
    setMessageLogs(logs);
    return res;
  };

  const handleNavigateToMessaging = (targetType: string, departmentId?: string) => {
    setMessagingTarget(targetType);
    setMessagingDeptId(departmentId);
    setActiveTab('messaging');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Forced Password Change Modal for new accounts */}
      {user?.mustChangePassword && <ChangePasswordModal />}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role={toastTone === 'error' ? 'alert' : 'status'}
          aria-live={toastTone === 'error' ? 'assertive' : 'polite'}
          className={`fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-xl px-5 py-3 rounded-2xl shadow-2xl border font-bold text-sm animate-in slide-in-from-bottom-4 duration-300 flex items-center justify-center md:bottom-6 md:left-auto md:right-6 md:mx-0 md:justify-start ${
            toastTone === 'error'
              ? 'bg-rose-950 text-rose-50 border-rose-700'
              : toastTone === 'info'
              ? 'bg-blue-950 text-blue-50 border-blue-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeSession={activeSession}
        sessions={sessions}
        onSelectSession={handleSelectSession}
        onSelectDate={handleSelectDate}
        onCreateSession={handleCreateSession}
        isOnline={isOnline}
        offlineQueueCount={offlineQueueCount}
        onSync={handleManualSync}
        isSyncing={isSyncing}
        todayCelebrantsCount={todayCelebrantsCount}
        currentUser={effectiveUser}
        onLogout={handleLogout}
        isDeveloper={isDeveloper}
        developerPreviewRole={developerPreviewRole}
        developerPreviewCell={developerPreviewCell}
        onSetDeveloperPreview={(r, c) => {
          setDeveloperPreviewRole(r);
          setDeveloperPreviewCell(c);
          if (r) {
            setActiveTab(getDefaultTabForRole(r));
          }
        }}
      />

      {/* Developer Impersonation Active Banner */}
      {isDeveloper && developerPreviewRole && (
        <div role="status" className="bg-gradient-to-r from-amber-700 via-purple-700 to-indigo-700 text-white px-4 sm:px-8 py-2.5 text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-md">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-black/20 text-white">🛠️</span>
            <span className="leading-relaxed">
              Developer Preview (UI only). Your authenticated account remains DEVELOPER; API requests are not made as{' '}
              <strong className="underline uppercase tracking-wide">
                {developerPreviewRole.replace('_', ' ')}
                {developerPreviewCell ? ` (${developerPreviewCell} Cell)` : ''}
              </strong>
            </span>
          </div>
          <button
            onClick={() => {
              setDeveloperPreviewRole(null);
              setDeveloperPreviewCell(null);
            }}
            className="px-3 py-1 bg-white text-slate-900 rounded-xl text-[11px] font-extrabold hover:bg-slate-100 transition shadow-sm cursor-pointer"
          >
            Exit Preview
          </button>
        </div>
      )}

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-6">
        {dataLoadFailures.length > 0 && !isLoading && (
          <div role="alert" className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold">Some information could not be loaded.</p>
              <p className="mt-1 text-sm">Unavailable: {dataLoadFailures.join(', ')}. Other parts of the app are still available.</p>
            </div>
            <button
              type="button"
              onClick={() => void loadData()}
              className="min-h-[44px] shrink-0 rounded-xl bg-amber-900 px-4 py-2 text-sm font-bold text-white hover:bg-amber-800"
            >
              Try again
            </button>
          </div>
        )}
        {isLoading ? (
          <div role="status" aria-live="polite" className="py-24 text-center text-slate-500 space-y-3">
            <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-semibold">Getting your workspace ready…</p>
          </div>
        ) : (
          <>
            {activeTab === 'checkin' && isRoleAuthorizedForTab('checkin', effectiveRole) && (
              <CheckInDesk
                session={activeSession}
                members={members}
                attendanceRecords={attendanceRecords}
                stats={stats}
                departments={departments}
                onCheckIn={handleCheckIn}
                onUndoCheckIn={handleUndoCheckIn}
                onSaveAttendance={handleSaveAttendance}
                onViewMemberHistory={(m) => setInspectingHistoryMember(m)}
                onOpenAddMember={() => setIsAddMemberOpen(true)}
                onOpenEditMember={(m) => setEditingMember(m)}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'members' && isRoleAuthorizedForTab('members', effectiveRole) && (
              <MembersDirectory
                members={members}
                departments={departments}
                onAddMember={handleAddMember}
                onUpdateMember={handleUpdateMember}
                onDeleteMember={handleDeleteMember}
                onInspectMemberProfile={(m) => {
                  setProfileContext('members');
                  setProfileMember(m);
                }}
                onInspectMemberHistory={(m) => setInspectingHistoryMember(m)}
              />
            )}

            {activeTab === 'attendance-history' && isRoleAuthorizedForTab('attendance-history', effectiveRole) && (
              <AttendanceAuditView
                members={members}
                sessions={sessions}
                onInspectMemberProfile={(m) => {
                  setProfileContext('audit');
                  setProfileMember(m);
                }}
                onInspectMemberHistory={(m) => setInspectingHistoryMember(m)}
                onDeleteSession={handleDeleteSession}
              />
            )}

            {activeTab === 'analytics' && isRoleAuthorizedForTab('analytics', effectiveRole) && <ExecutiveDashboard />}

            {activeTab === 'pipeline' && isRoleAuthorizedForTab('pipeline', effectiveRole) && (
              <AssimilationPipeline
                members={members}
                onUpdateStage={handleUpdateAssimilationStage}
              />
            )}

            {activeTab === 'departments' && isRoleAuthorizedForTab('departments', effectiveRole) && (
              <DepartmentsView
                departments={departments}
                members={members}
                onCreateDepartment={handleCreateDepartment}
                onNavigateToMessaging={handleNavigateToMessaging}
                onAddMember={async (deptId, memberId) => {
                  const updated = await api.addMemberToDepartment(deptId, memberId);
                  setDepartments((prev) => prev.map((d) => (d.id === deptId ? updated : d)));
                }}
                onRemoveMember={async (deptId, memberId) => {
                  await api.removeMemberFromDepartment(deptId, memberId);
                  setDepartments((prev) =>
                    prev.map((d) =>
                      d.id === deptId
                        ? { ...d, members: (d.members || []).filter((m) => m.member.id !== memberId) }
                        : d
                    )
                  );
                }}
              />
            )}

            {activeTab === 'finances' && isRoleAuthorizedForTab('finances', effectiveRole) && (
              <FinancesView
                contributions={contributions}
                summary={financialSummary}
                members={members}
                session={activeSession}
                onRecordContribution={handleRecordContribution}
                onUpdateContribution={handleUpdateContribution}
                onDeleteContribution={handleDeleteContribution}
              />
            )}

            {activeTab === 'campaigns' && isRoleAuthorizedForTab('campaigns', effectiveRole) && <CampaignsView members={members} />}

            {activeTab === 'celebrations' && isRoleAuthorizedForTab('celebrations', effectiveRole) && <CelebrationsView />}

            {activeTab === 'messaging' && isRoleAuthorizedForTab('messaging', effectiveRole) && (
              <MessagingView
                session={activeSession}
                departments={departments}
                messageLogs={messageLogs}
                attendanceRecords={attendanceRecords}
                members={members}
                onBroadcast={handleBroadcast}
                initialTarget={messagingTarget}
                initialDeptId={messagingDeptId}
              />
            )}

            {activeTab === 'users' && isRoleAuthorizedForTab('users', effectiveRole) && <UserManagement />}
          </>
        )}
      </main>

      {/* Application Footer */}
      <Footer />

      {/* Member Attendance History Audit Modal */}
      <MemberAttendanceHistoryModal
        member={inspectingHistoryMember}
        allMembers={members}
        onSelectAnotherMember={(m) => setInspectingHistoryMember(m)}
        onClose={() => setInspectingHistoryMember(null)}
      />

      {/* Full Detail Member Profile Modal (Bio, Tithes, Welfare, Pledges, Attendance) */}
      {profileMember && (
        <MemberProfileModal
          member={profileMember}
          onClose={() => setProfileMember(null)}
          allowEdit={profileContext === 'members'}
          allowDelete={profileContext === 'members'}
          onEdit={(m) => {
            setProfileMember(null);
            setEditingMember(m);
          }}
          onDelete={async (id) => {
            await handleDeleteMember(id);
            setProfileMember(null);
          }}
        />
      )}

      {/* Global Add Member Modal */}
      <MemberFormModal
        isOpen={isAddMemberOpen}
        mode="create"
        departments={departments}
        onClose={() => setIsAddMemberOpen(false)}
        onSubmit={async (data) => {
          await handleAddMember(data);
          setIsAddMemberOpen(false);
        }}
      />

      {/* Global Edit Member Modal */}
      <MemberFormModal
        isOpen={Boolean(editingMember)}
        mode="edit"
        initialMember={editingMember}
        departments={departments}
        onClose={() => setEditingMember(null)}
        onSubmit={async (data) => {
          if (editingMember) {
            await handleUpdateMember(editingMember.id, data);
            setEditingMember(null);
          }
        }}
      />
    </div>
  );
};

export default App;
