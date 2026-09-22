import React, { useState, useEffect, useCallback } from 'react';
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
import { MemberAttendanceHistoryModal } from './components/MemberAttendanceHistoryModal.tsx';
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
  ChurchGroup
} from './types/index.ts';

export const App: React.FC = () => {
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
  >('checkin');

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

  // UI & Sync states
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(offlineSync.getOnlineStatus());
  const [offlineQueueCount, setOfflineQueueCount] = useState(offlineSync.getTotalQueueCount());
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Messaging navigation params
  const [messagingTarget, setMessagingTarget] = useState<string>('ATTENDEES_TODAY');
  const [messagingDeptId, setMessagingDeptId] = useState<string | undefined>(undefined);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  useEffect(() => {
    const unsubscribe = offlineSync.subscribe((online, queueCount) => {
      setIsOnline(online);
      setOfflineQueueCount(queueCount);
    });
    return unsubscribe;
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [fetchedSessions, fetchedActive, fetchedMembers, fetchedDepts] = await Promise.all([
        api.getSessions(),
        api.getActiveSession(),
        api.getMembers(),
        api.getDepartments()
      ]);

      setSessions(fetchedSessions);
      setActiveSession(fetchedActive);
      setMembers(fetchedMembers);
      setDepartments(fetchedDepts);

      if (fetchedActive) {
        const [attRecords, attStats, fetchedFinances, finSummary, msgs, celData] = await Promise.all([
          api.getSessionAttendance(fetchedActive.id),
          api.getAttendanceStats(fetchedActive.id),
          api.getFinances(),
          api.getFinancialSummary(),
          api.getMessageLogs(),
          api.getTodayCelebrants().catch(() => [])
        ]);

        setAttendanceRecords(attRecords);
        setStats(attStats);
        setContributions(fetchedFinances);
        setFinancialSummary(finSummary);
        setMessageLogs(msgs);
        setTodayCelebrantsCount(Array.isArray(celData) ? celData.length : 0);
      } else {
        const celData = await api.getTodayCelebrants().catch(() => []);
        setTodayCelebrantsCount(Array.isArray(celData) ? celData.length : 0);
      }
    } catch (err) {
      console.error('Failed loading church data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Session selection handler
  const handleSelectSession = async (session: ServiceSession) => {
    setActiveSession(session);
    try {
      const [attRecords, attStats] = await Promise.all([
        api.getSessionAttendance(session.id),
        api.getAttendanceStats(session.id)
      ]);
      setAttendanceRecords(attRecords);
      setStats(attStats);
    } catch (err) {
      console.error(err);
    }
  };

  // Date selection handler: picks or creates a session for the chosen date!
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

      // Update sessions list if new
      setSessions((prev) => {
        if (session && !prev.some((s) => s.id === session.id)) {
          return [session, ...prev];
        }
        return prev;
      });

      setActiveSession(session);

      const [attRecords, attStats] = await Promise.all([
        api.getSessionAttendance(session.id),
        api.getAttendanceStats(session.id)
      ]);
      setAttendanceRecords(attRecords);
      setStats(attStats);
      showToast(`Switched to service date: ${new Date(session.serviceDate).toLocaleDateString()}`);
    } catch (err: any) {
      console.error('Error switching date:', err);
    }
  };

  // Create session handler
  const handleCreateSession = async (data: { serviceDate?: string; serviceType: string; theme?: string }) => {
    try {
      const newSession = await api.createSession(data);
      setSessions((prev) => [newSession, ...prev]);
      setActiveSession(newSession);
      setAttendanceRecords([]);
      setStats({
        totalMembers: members.length,
        totalPresent: 0,
        totalAbsent: members.length,
        overallPercentage: 0,
        group1: {
          total: members.filter((m) => m.churchGroup === 'GROUP_1').length,
          present: 0,
          absent: members.filter((m) => m.churchGroup === 'GROUP_1').length,
          percentage: 0
        },
        group2: {
          total: members.filter((m) => m.churchGroup === 'GROUP_2').length,
          present: 0,
          absent: members.filter((m) => m.churchGroup === 'GROUP_2').length,
          percentage: 0
        }
      });
      showToast(`Created service session: ${newSession.serviceType}`);
    } catch (err: any) {
      alert(err.message || 'Failed to create session');
    }
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
      markedBy: 'Media Desk',
      member
    };

    setAttendanceRecords((prev) => [optimisticRecord, ...prev]);

    if (stats) {
      const isGroup1 = member.churchGroup === 'GROUP_1';
      const newPresent = stats.totalPresent + 1;
      setStats({
        ...stats,
        totalPresent: newPresent,
        totalAbsent: Math.max(0, stats.totalMembers - newPresent),
        overallPercentage: Math.round((newPresent / (stats.totalMembers || 1)) * 100),
        group1: {
          ...stats.group1,
          present: isGroup1 ? stats.group1.present + 1 : stats.group1.present,
          percentage: isGroup1
            ? Math.round(((stats.group1.present + 1) / (stats.group1.total || 1)) * 100)
            : stats.group1.percentage
        },
        group2: {
          ...stats.group2,
          present: !isGroup1 ? stats.group2.present + 1 : stats.group2.present,
          percentage: !isGroup1
            ? Math.round(((stats.group2.present + 1) / (stats.group2.total || 1)) * 100)
            : stats.group2.percentage
        }
      });
    }

    showToast(`Checked in: ${member.firstName} ${member.lastName} (${member.churchGroup === 'GROUP_1' ? 'Group 1' : 'Group 2'})`);

    if (!isOnline) {
      offlineSync.queueAttendance({
        sessionId: activeSession.id,
        memberId,
        memberName: `${member.firstName} ${member.lastName}`,
        churchGroup: member.churchGroup,
        markedBy: 'Media Desk (Offline)',
        checkInTime: new Date().toISOString()
      });
      return;
    }

    try {
      const res = await api.checkIn(activeSession.id, memberId);
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
        markedBy: 'Media Desk (Offline Fallback)',
        checkInTime: new Date().toISOString()
      });
      showToast(`Saved to offline queue: ${member.firstName} ${member.lastName}`);
    }
  };

  // Undo Check-In handler
  const handleUndoCheckIn = async (memberId: string) => {
    if (!activeSession) return;
    const member = members.find((m) => m.id === memberId);

    setAttendanceRecords((prev) => prev.filter((r) => r.memberId !== memberId));

    if (stats && member) {
      const isGroup1 = member.churchGroup === 'GROUP_1';
      const newPresent = Math.max(0, stats.totalPresent - 1);
      setStats({
        ...stats,
        totalPresent: newPresent,
        totalAbsent: Math.min(stats.totalMembers, stats.totalAbsent + 1),
        overallPercentage: Math.round((newPresent / (stats.totalMembers || 1)) * 100),
        group1: {
          ...stats.group1,
          present: isGroup1 ? Math.max(0, stats.group1.present - 1) : stats.group1.present,
          percentage: isGroup1
            ? Math.round((Math.max(0, stats.group1.present - 1) / (stats.group1.total || 1)) * 100)
            : stats.group1.percentage
        },
        group2: {
          ...stats.group2,
          present: !isGroup1 ? Math.max(0, stats.group2.present - 1) : stats.group2.present,
          percentage: !isGroup1
            ? Math.round((Math.max(0, stats.group2.present - 1) / (stats.group2.total || 1)) * 100)
            : stats.group2.percentage
        }
      });
    }

    if (isOnline) {
      try {
        await api.undoCheckIn(activeSession.id, memberId);
      } catch (err) {
        console.error(err);
      }
    }
    showToast(`Undone check-in for ${member?.firstName || 'member'}`);
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
      alert(err.message || 'Sync failed');
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
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 font-bold text-xs animate-in slide-in-from-bottom-4 duration-300 flex items-center space-x-2">
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
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="py-24 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold">Loading CACI Church Platform...</p>
          </div>
        ) : (
          <>
            {activeTab === 'checkin' && (
              <CheckInDesk
                session={activeSession}
                members={members}
                attendanceRecords={attendanceRecords}
                stats={stats}
                departments={departments}
                onCheckIn={handleCheckIn}
                onUndoCheckIn={handleUndoCheckIn}
                onViewMemberHistory={(m) => setInspectingHistoryMember(m)}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'members' && (
              <MembersDirectory
                members={members}
                onAddMember={handleAddMember}
                onUpdateMember={handleUpdateMember}
                onDeleteMember={handleDeleteMember}
              />
            )}

            {activeTab === 'attendance-history' && (
              <AttendanceAuditView
                members={members}
                onInspectMemberHistory={(m) => setInspectingHistoryMember(m)}
              />
            )}

            {activeTab === 'analytics' && <ExecutiveDashboard />}

            {activeTab === 'pipeline' && (
              <AssimilationPipeline
                members={members}
                onUpdateStage={handleUpdateAssimilationStage}
              />
            )}

            {activeTab === 'departments' && (
              <DepartmentsView
                departments={departments}
                onCreateDepartment={handleCreateDepartment}
                onNavigateToMessaging={handleNavigateToMessaging}
              />
            )}

            {activeTab === 'finances' && (
              <FinancesView
                contributions={contributions}
                summary={financialSummary}
                members={members}
                session={activeSession}
                onRecordContribution={handleRecordContribution}
              />
            )}

            {activeTab === 'campaigns' && (
              <CampaignsView
                members={members}
              />
            )}

            {activeTab === 'celebrations' && (
              <CelebrationsView
              />
            )}

            {activeTab === 'messaging' && (
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
          </>
        )}
      </main>

      {/* Member Attendance History Audit Modal */}
      <MemberAttendanceHistoryModal
        member={inspectingHistoryMember}
        allMembers={members}
        onSelectAnotherMember={(m) => setInspectingHistoryMember(m)}
        onClose={() => setInspectingHistoryMember(null)}
      />
    </div>
  );
};
export default App;
