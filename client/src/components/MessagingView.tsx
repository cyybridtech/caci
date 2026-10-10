import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Users,
  CheckCircle2,
  Clock,
  HeartHandshake,
  Share2,
  Sparkles,
  ExternalLink,
  Phone,
  Search,
  CheckSquare,
  Square,
  ShieldCheck,
  Zap,
  Info,
  UserCheck,
  Building,
  RefreshCw,
  Copy,
  Check,
  Filter,
  AlertCircle
} from 'lucide-react';
import { ServiceSession, Department, MessageLog, AttendanceRecord, Member, ChurchGroup } from '../types/index.ts';
import { api } from '../services/api.ts';

interface MessagingViewProps {
  session: ServiceSession | null;
  departments: Department[];
  messageLogs: MessageLog[];
  attendanceRecords: AttendanceRecord[];
  members: Member[];
  onBroadcast: (data: {
    targetType: string;
    memberIds?: string[];
    sessionId?: string;
    departmentId?: string;
    channel: 'SMS' | 'WHATSAPP';
    customMessage?: string;
    senderId?: string;
  }) => Promise<{ success: boolean; sentCount: number; whatsappLinks?: { name: string; phone: string; url: string }[]; message: string; gateway?: any }>;
  initialTarget?: string;
  initialDeptId?: string;
}

export const MessagingView: React.FC<MessagingViewProps> = ({
  session,
  departments,
  messageLogs: initialLogs,
  attendanceRecords,
  members,
  onBroadcast,
  initialTarget = 'ATTENDEES_TODAY',
  initialDeptId
}) => {
  const [targetType, setTargetType] = useState<string>(initialTarget);
  const [selectedDeptId, setSelectedDeptId] = useState<string>(initialDeptId || departments[0]?.id || '');
  const [channel, setChannel] = useState<'SMS' | 'WHATSAPP'>('SMS');
  const [senderId, setSenderId] = useState<string>('CACI');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [gatewayResult, setGatewayResult] = useState<any>(null);
  const [whatsappLinks, setWhatsappLinks] = useState<{ name: string; phone: string; url: string }[]>([]);
  const [clickedWhatsAppUrls, setClickedWhatsAppUrls] = useState<Set<string>>(new Set());
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Message Logs management
  const [logs, setLogs] = useState<MessageLog[]>(initialLogs);
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logChannelFilter, setLogChannelFilter] = useState<'ALL' | 'SMS' | 'WHATSAPP'>('ALL');

  useEffect(() => {
    setLogs(initialLogs);
  }, [initialLogs]);

  const refreshLogs = async () => {
    try {
      setIsRefreshingLogs(true);
      const data = await api.getMessageLogs();
      setLogs(data);
    } catch (err: any) {
      console.error('Failed to refresh logs:', err);
    } finally {
      setIsRefreshingLogs(false);
    }
  };

  // Test single number SMS
  const [testPhone, setTestPhone] = useState('');
  const [isTestingSingle, setIsTestingSingle] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Specific member selection state
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberGroupFilter, setMemberGroupFilter] = useState<'ALL' | 'JOY' | 'FAITH' | 'HOPE' | 'LOVE'>('ALL');

  // Sync initialTarget / initialDeptId if changed from parent
  useEffect(() => {
    if (initialTarget) setTargetType(initialTarget);
    if (initialDeptId) setSelectedDeptId(initialDeptId);
  }, [initialTarget, initialDeptId]);

  // Filter members for specific selection
  const selectableMembers = members.filter((m) => {
    if (memberGroupFilter !== 'ALL' && m.churchGroup !== memberGroupFilter) return false;
    if (memberSearchQuery.trim() !== '') {
      const q = memberSearchQuery.toLowerCase().trim();
      const name = `${m.firstName} ${m.lastName}`.toLowerCase();
      const phone = (m.phone || '').toLowerCase();
      const code = (m.memberCode || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || code.includes(q);
    }
    return true;
  });

  const toggleSelectMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    const visibleIdsWithPhone = selectableMembers.filter((m) => !!m.phone).map((m) => m.id);
    const newSet = new Set([...selectedMemberIds, ...visibleIdsWithPhone]);
    setSelectedMemberIds(Array.from(newSet));
  };

  const handleDeselectAll = () => {
    setSelectedMemberIds([]);
  };

  // Default templates based on target
  const getPlaceholderMessage = () => {
    if (targetType === 'ATTENDEES_TODAY') {
      return "Dear {firstName}, thank you for worshipping with us today at CACI! May God's supernatural favor and grace abide with you throughout the week.";
    }
    if (targetType === 'ABSENTEES_TODAY') {
      return "Dear {firstName}, we missed your fellowship at CACI today! We pray God's blessing over your home and look forward to seeing you at our next service.";
    }
    if (targetType === 'JOY') {
      return "Calvary greetings {firstName}! Important announcement for all CACI Joy Cell members: please take note of our upcoming cell fellowship.";
    }
    if (targetType === 'FAITH') {
      return "Calvary greetings {firstName}! Important announcement for all CACI Faith Cell members: please take note of our upcoming cell fellowship.";
    }
    if (targetType === 'HOPE') {
      return "Calvary greetings {firstName}! Important announcement for all CACI Hope Cell members: please take note of our upcoming cell fellowship.";
    }
    if (targetType === 'LOVE') {
      return "Calvary greetings {firstName}! Important announcement for all CACI Love Cell members: please take note of our upcoming cell fellowship.";
    }
    if (targetType === 'DEPARTMENT') {
      const currentDept = departments.find((d) => d.id === selectedDeptId);
      return `Calvary greetings {firstName}! Important update for all ${currentDept ? currentDept.name : 'department'} members at CACI.`;
    }
    if (targetType === 'SPECIFIC_MEMBERS') {
      return "Calvary greetings {firstName}! Please take note of this special church announcement from CACI leadership.";
    }
    return "Calvary greetings {firstName}! Please take note of this special church update from CACI leadership.";
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();

    if (targetType === 'SPECIFIC_MEMBERS' && selectedMemberIds.length === 0) {
      setFeedback('Please select at least one member from the list below.');
      return;
    }

    if ((targetType === 'ATTENDEES_TODAY' || targetType === 'ABSENTEES_TODAY') && !session?.id) {
      setFeedback('Please select or create an active service session from the top header bar before messaging attendees/absentees.');
      return;
    }

    try {
      setIsSending(true);
      setFeedback(null);
      setGatewayResult(null);
      setWhatsappLinks([]);
      setClickedWhatsAppUrls(new Set());

      const res = await onBroadcast({
        targetType,
        memberIds: targetType === 'SPECIFIC_MEMBERS' ? selectedMemberIds : undefined,
        sessionId: session?.id,
        departmentId: targetType === 'DEPARTMENT' ? selectedDeptId : undefined,
        channel,
        senderId: senderId.trim() || undefined,
        customMessage: customMessage.trim() || undefined
      });

      setFeedback(`Dispatched to ${res.sentCount} member(s) successfully.`);
      if (res.gateway) {
        setGatewayResult(res.gateway);
      }
      if (res.whatsappLinks && res.whatsappLinks.length > 0) {
        setWhatsappLinks(res.whatsappLinks);
      }
      await refreshLogs();
    } catch (err: any) {
      setFeedback(err.message || 'Failed to dispatch messages');
    } finally {
      setIsSending(false);
    }
  };

  const handleTestSingleSMS = async () => {
    if (!testPhone.trim()) {
      alert('Please enter a phone number to test (e.g. 024XXXXXXX or 233XXXXXXXXX)');
      return;
    }

    try {
      setIsTestingSingle(true);
      setTestResult(null);
      const res = await api.sendMessage({
        channel: 'SMS',
        recipientPhone: testPhone.trim(),
        recipientName: 'Test Recipient',
        messageContent: customMessage.trim() || 'Test message from CACI Church Management System via Vynfy.',
        category: 'TEST_SMS',
        senderId: senderId.trim() || undefined
      });
      setTestResult(res);
      setFeedback('Test SMS dispatched via Vynfy Gateway');
      await refreshLogs();
    } catch (err: any) {
      setTestResult({ success: false, gateway: { success: false, status: 'FAILED', error: err.message } });
      setFeedback(err.message || 'Failed to send test SMS');
    } finally {
      setIsTestingSingle(false);
    }
  };

  const handleCopyMessage = () => {
    const textToCopy = customMessage.trim() || getPlaceholderMessage();
    navigator.clipboard.writeText(textToCopy);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const activeMessageText = customMessage.trim() || getPlaceholderMessage();
  const charCount = activeMessageText.length;
  const smsPages = Math.ceil(charCount / 160) || 1;

  // Selected Department Info
  const currentSelectedDept = departments.find((d) => d.id === selectedDeptId);

  // Filtered Message Logs
  const filteredLogs = logs.filter((log) => {
    if (logChannelFilter !== 'ALL' && log.channel !== logChannelFilter) return false;
    if (logSearchQuery.trim() !== '') {
      const q = logSearchQuery.toLowerCase().trim();
      const name = (log.recipientName || '').toLowerCase();
      const phone = (log.recipientPhone || '').toLowerCase();
      const content = (log.messageContent || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || content.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-gradient-to-tr from-blue-700 to-indigo-600 text-white rounded-2xl shadow-sm">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-extrabold text-slate-900">Broadcast & SMS Dispatcher</h2>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Vynfy Gateway Connected</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated service follow-ups, cell notices, department updates, and targeted SMS & WhatsApp broadcasts
            </p>
          </div>
        </div>

        {/* Gateway API Badge */}
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-2xl border border-slate-800 flex items-center space-x-3 text-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Provider</span>
            <span className="font-mono font-bold text-amber-300">Vynfy SMS Gateway</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Composer & Delivery Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Broadcast Composer */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center space-x-2">
                <Send className="w-4 h-4 text-blue-600" />
                <span>Message Dispatcher</span>
              </h3>

              <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold">
                <span>SMS Calculation:</span>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold font-mono">
                  {charCount} chars • {smsPages} page{smsPages !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {feedback && (
              <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center space-x-2 ${
                feedback.includes('success') || feedback.includes('Dispatched') || feedback.includes('Sent')
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <Info className="w-4 h-4 shrink-0" />
                <span>{feedback}</span>
              </div>
            )}

            {/* Missing Session Warning */}
            {(targetType === 'ATTENDEES_TODAY' || targetType === 'ABSENTEES_TODAY') && !session && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center space-x-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Active Session Notice:</strong> No service session is currently selected in the top bar. Please choose or create a service session in the header so the system knows which attendance list to query.
                </span>
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="space-y-5">
              {/* Target Audience Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  1. Select Target Audience
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Specific Members Select */}
                  <button
                    type="button"
                    onClick={() => setTargetType('SPECIFIC_MEMBERS')}
                    className={`p-3.5 rounded-2xl border-2 text-left transition flex items-center justify-between col-span-1 sm:col-span-3 ${
                      targetType === 'SPECIFIC_MEMBERS'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold block">Select Specific Members (Individual Pick)</span>
                        <span className="text-[11px] text-slate-500">
                          Choose specific members from directory with search & checkboxes
                          {selectedMemberIds.length > 0 && ` (${selectedMemberIds.length} chosen)`}
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-indigo-600 text-white">
                      {selectedMemberIds.length} Selected
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('ATTENDEES_TODAY')}
                    className={`p-3 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                      targetType === 'ATTENDEES_TODAY'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">Today's Attendees</span>
                      <span className="text-[11px] text-slate-500">
                        {attendanceRecords.length} checked in
                      </span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('ABSENTEES_TODAY')}
                    className={`p-3 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                      targetType === 'ABSENTEES_TODAY'
                        ? 'border-amber-600 bg-amber-50/70 text-amber-950 font-bold'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">Today's Absentees</span>
                      <span className="text-[11px] text-slate-500">
                        {Math.max(0, members.filter(m => m.status === 'ACTIVE').length - attendanceRecords.length)} absent
                      </span>
                    </div>
                    <HeartHandshake className="w-4 h-4 text-amber-600" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('ALL_MEMBERS')}
                    className={`p-3 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                      targetType === 'ALL_MEMBERS'
                        ? 'border-slate-900 bg-slate-100 text-slate-950 font-bold'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">All Active Members</span>
                      <span className="text-[11px] text-slate-500">
                        {members.filter(m => m.status === 'ACTIVE').length} congregants
                      </span>
                    </div>
                    <Users className="w-4 h-4 text-slate-700" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('JOY')}
                    className={`p-3 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                      targetType === 'JOY'
                        ? 'border-amber-600 bg-amber-50/70 text-amber-950 font-bold'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">Joy Cell</span>
                      <span className="text-[11px] text-slate-500">
                        {members.filter((m) => m.churchGroup === 'JOY').length} members
                      </span>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('FAITH')}
                    className={`p-3 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                      targetType === 'FAITH'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">Faith Cell</span>
                      <span className="text-[11px] text-slate-500">
                        {members.filter((m) => m.churchGroup === 'FAITH').length} members
                      </span>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('HOPE')}
                    className={`p-3 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                      targetType === 'HOPE'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">Hope Cell</span>
                      <span className="text-[11px] text-slate-500">
                        {members.filter((m) => m.churchGroup === 'HOPE').length} members
                      </span>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('LOVE')}
                    className={`p-3 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                      targetType === 'LOVE'
                        ? 'border-rose-600 bg-rose-50/70 text-rose-950 font-bold'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">Love Cell</span>
                      <span className="text-[11px] text-slate-500">
                        {members.filter((m) => m.churchGroup === 'LOVE').length} members
                      </span>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                  </button>

                  {/* Department & Auxiliary Target */}
                  <button
                    type="button"
                    onClick={() => setTargetType('DEPARTMENT')}
                    className={`p-3 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                      targetType === 'DEPARTMENT'
                        ? 'border-purple-600 bg-purple-50/70 text-purple-950 font-bold'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">Auxiliary / Dept</span>
                      <span className="text-[11px] text-slate-500">
                        {currentSelectedDept ? currentSelectedDept.name : `${departments.length} Auxiliaries`}
                      </span>
                    </div>
                    <Building className="w-4 h-4 text-purple-600" />
                  </button>
                </div>
              </div>

              {/* Department Selector Box (when DEPARTMENT is active) */}
              {targetType === 'DEPARTMENT' && (
                <div className="p-4 rounded-3xl bg-purple-50/70 border-2 border-purple-200 space-y-3 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <span className="text-xs font-extrabold text-purple-950 uppercase tracking-wider block">
                        Select Department or Auxiliary
                      </span>
                      <span className="text-[11px] text-purple-800">
                        Message will be dispatched to all members enrolled in this ministry.
                      </span>
                    </div>

                    <div className="w-full sm:w-64">
                      {departments.length === 0 ? (
                        <div className="text-xs text-purple-900 italic font-semibold">
                          No departments created yet.
                        </div>
                      ) : (
                        <select
                          value={selectedDeptId}
                          onChange={(e) => setSelectedDeptId(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-xs font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
                        >
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name} ({dept.members?.length || 0} members)
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Specific Members Picker Drawer (when SPECIFIC_MEMBERS is active) */}
              {targetType === 'SPECIFIC_MEMBERS' && (
                <div className="p-4 rounded-3xl bg-indigo-50/60 border-2 border-indigo-200 space-y-3 animate-in fade-in duration-200">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
                      Select Specific Members to Message ({selectedMemberIds.length} selected)
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleSelectAllVisible}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition shadow-sm"
                      >
                        Select All Filtered
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAll}
                        className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-100 font-bold text-[11px] transition"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>

                  {/* Search and Group Filter */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search by name, phone or code..."
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-indigo-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex items-center space-x-1 text-[11px]">
                      {(['ALL', 'JOY', 'FAITH', 'HOPE', 'LOVE'] as const).map((grp) => (
                        <button
                          key={grp}
                          type="button"
                          onClick={() => setMemberGroupFilter(grp)}
                          className={`px-2 py-1 rounded-lg font-bold transition ${
                            memberGroupFilter === grp
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white border border-indigo-200 text-indigo-900 hover:bg-indigo-100'
                          }`}
                        >
                          {grp === 'ALL' ? 'All' : grp}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Member Selection List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {selectableMembers.map((member) => {
                      const isSelected = selectedMemberIds.includes(member.id);
                      return (
                        <div
                          key={member.id}
                          onClick={() => toggleSelectMember(member.id)}
                          className={`p-2.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white border-indigo-100 text-slate-800 hover:border-indigo-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 truncate">
                            <div className="shrink-0">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-white" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </div>

                            {member.photoUrl ? (
                              <img
                                src={member.photoUrl}
                                alt={member.firstName}
                                className="w-7 h-7 rounded-full object-cover shrink-0 border"
                              />
                            ) : (
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-[10px] text-white shrink-0 ${
                                  isSelected
                                    ? 'bg-indigo-800'
                                    : member.churchGroup === 'JOY'
                                    ? 'bg-amber-600'
                                    : member.churchGroup === 'FAITH'
                                    ? 'bg-blue-600'
                                    : member.churchGroup === 'HOPE'
                                    ? 'bg-emerald-600'
                                    : 'bg-rose-600'
                                }`}
                              >
                                {member.firstName[0]}
                                {member.lastName[0]}
                              </div>
                            )}

                            <div className="truncate">
                              <span className={`font-extrabold text-xs block truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                {member.firstName} {member.lastName}
                              </span>
                              <span className={`text-[10px] font-mono ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                                {member.phone || 'No phone'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                                isSelected
                                  ? 'bg-indigo-700 text-white'
                                  : member.churchGroup === 'JOY'
                                  ? 'bg-amber-100 text-amber-800'
                                  : member.churchGroup === 'FAITH'
                                  ? 'bg-blue-100 text-blue-800'
                                  : member.churchGroup === 'HOPE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {member.churchGroup}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Delivery Channel Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  2. Choose Delivery Gateway
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setChannel('SMS')}
                    className={`py-3 px-4 rounded-2xl border-2 flex items-center justify-between font-bold text-xs transition ${
                      channel === 'SMS'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span>Vynfy SMS Direct Broadcast</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      Live Gateway
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannel('WHATSAPP')}
                    className={`py-3 px-4 rounded-2xl border-2 flex items-center justify-between font-bold text-xs transition ${
                      channel === 'WHATSAPP'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Share2 className="w-4 h-4 text-emerald-600" />
                      <span>WhatsApp Direct Links</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      One-Click
                    </span>
                  </button>
                </div>

                {channel === 'SMS' && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-blue-950 block">SMS Sender ID</span>
                      <span className="text-[11px] text-slate-500">
                        Must match an approved Sender ID name registered in your Vynfy portal
                      </span>
                    </div>
                    <div className="w-full sm:w-48">
                      <input
                        type="text"
                        value={senderId}
                        onChange={(e) => setSenderId(e.target.value.toUpperCase().substring(0, 11))}
                        placeholder="e.g. CACI"
                        maxLength={11}
                        className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded-xl font-bold font-mono text-xs text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase text-center tracking-wider"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Church Service & Reminder Message Templates */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>3. Pick a Ready-to-Send Template or Write Custom</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className="text-[11px] text-slate-600 hover:text-slate-900 font-bold flex items-center space-x-1"
                    >
                      {copiedMessage ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                      <span>{copiedMessage ? 'Copied!' : 'Copy Text'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomMessage('')}
                      className="text-[11px] text-slate-400 hover:text-slate-600 font-bold"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Quick Template Presets */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCustomMessage(
                        "Dear {firstName}, reminder that our CACI Youth Meeting is holding this Saturday at 4:00 PM. Come ready to worship, connect, and be empowered! Bring a friend along. See you there! 🔥"
                      )
                    }
                    className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-left transition text-xs flex items-center space-x-2 text-amber-950 font-bold shadow-xs"
                  >
                    <span className="text-base">🔥</span>
                    <div>
                      <div className="text-[11px] font-extrabold">Youth Meeting</div>
                      <div className="text-[9px] text-amber-800 font-normal">Sat 4:00 PM Reminder</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCustomMessage(
                        "Dear {firstName}, we warmly invite you to our Midweek Bible Study & Prayer Service this Wednesday at 6:30 PM at CACI. Come refuel your spirit in the middle of the week! God bless you. 🕊️"
                      )
                    }
                    className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-left transition text-xs flex items-center space-x-2 text-blue-950 font-bold shadow-xs"
                  >
                    <span className="text-base">📖</span>
                    <div>
                      <div className="text-[11px] font-extrabold">Mid-Week Service</div>
                      <div className="text-[9px] text-blue-800 font-normal">Wed 6:30 PM Prayer</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCustomMessage(
                        "Dear {firstName}, warm reminder that our Sunday Divine Service holds this Sunday at 8:30 AM at CACI. Come with expectation — God has a special word for you and your family! 🙏"
                      )
                    }
                    className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/70 text-left transition text-xs flex items-center space-x-2 text-indigo-950 font-bold shadow-xs"
                  >
                    <span className="text-base">🌅</span>
                    <div>
                      <div className="text-[11px] font-extrabold">Sunday Service</div>
                      <div className="text-[9px] text-indigo-800 font-normal">Sun 8:30 AM Worship</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCustomMessage(
                        "Dear {firstName}, thank you so much for worshipping with us today at CACI! Your presence was a true blessing to our church family. May God's supernatural favor and peace abide with you all week. ❤️"
                      )
                    }
                    className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100/70 text-left transition text-xs flex items-center space-x-2 text-rose-950 font-bold shadow-xs"
                  >
                    <span className="text-base">💛</span>
                    <div>
                      <div className="text-[11px] font-extrabold">Thank You (Attendees)</div>
                      <div className="text-[9px] text-rose-800 font-normal">Post-Service Blessing</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCustomMessage(
                        "Calvary greetings {firstName}! It was such a blessing having you worship with us at CACI for the first time. You are always welcome in God's house — this is your spiritual home too! 🌟"
                      )
                    }
                    className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-left transition text-xs flex items-center space-x-2 text-emerald-950 font-bold shadow-xs"
                  >
                    <span className="text-base">🌟</span>
                    <div>
                      <div className="text-[11px] font-extrabold">First-Timer Welcome</div>
                      <div className="text-[9px] text-emerald-800 font-normal">Visitor Assimilation</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCustomMessage(
                        "Calvary greetings {firstName}! Important reminder for all {group} members: join our weekly cell fellowship this week. Together we pray, fellowship, and grow! 💪"
                      )
                    }
                    className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/70 text-left transition text-xs flex items-center space-x-2 text-purple-950 font-bold shadow-xs"
                  >
                    <span className="text-base">🤝</span>
                    <div>
                      <div className="text-[11px] font-extrabold">Cell Fellowship</div>
                      <div className="text-[9px] text-purple-800 font-normal">Weekly Cell Reminder</div>
                    </div>
                  </button>
                </div>

                {/* Tag Helper Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-bold">Insert Dynamic Tag:</span>
                  <button
                    type="button"
                    title="Inserts member's first name (e.g. Kwame)"
                    onClick={() => setCustomMessage((prev) => prev + '{firstName}')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-700 font-mono text-[10px] font-bold border border-slate-200 transition"
                  >
                    {'{firstName}'} → First Name
                  </button>
                  <button
                    type="button"
                    title="Inserts member's last name"
                    onClick={() => setCustomMessage((prev) => prev + '{lastName}')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-700 font-mono text-[10px] font-bold border border-slate-200 transition"
                  >
                    {'{lastName}'} → Last Name
                  </button>
                  <button
                    type="button"
                    title="Inserts member's cell (e.g. Joy Cell)"
                    onClick={() => setCustomMessage((prev) => prev + '{group}')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-700 font-mono text-[10px] font-bold border border-slate-200 transition"
                  >
                    {'{group}'} → Assigned Cell
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder={getPlaceholderMessage()}
                  className="w-full px-4 py-3 border border-slate-300 rounded-2xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                />

                {/* Live Message Preview Box */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-sm border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 flex items-center space-x-1">
                      <span>👁️ Live Preview</span>
                      <span className="text-slate-400 font-normal">
                        (Sample Recipient: {members[0] ? `${members[0].firstName} ${members[0].lastName} • ${members[0].churchGroup} Cell` : 'Kwame Mensah • Joy Cell'})
                      </span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400">
                      Auto-Personalized
                    </span>
                  </div>
                  <p className="text-xs text-slate-100 leading-relaxed font-sans bg-white/10 p-2.5 rounded-xl border border-white/10">
                    {(() => {
                      const sample = members[0] || { firstName: 'Kwame', lastName: 'Mensah', churchGroup: 'JOY' };
                      const raw = customMessage.trim() || getPlaceholderMessage();
                      return raw
                        .replace(/\{firstName\}|\[firstName\]|\{name\}|\[name\]|\{Name\}|\[Name\]/gi, sample.firstName || 'Kwame')
                        .replace(/\{lastName\}|\[lastName\]/gi, sample.lastName || 'Mensah')
                        .replace(/\{fullName\}|\[fullName\]/gi, `${sample.firstName || 'Kwame'} ${sample.lastName || 'Mensah'}`)
                        .replace(/\{group\}|\[group\]|\{cell\}|\[cell\]/gi, sample.churchGroup ? `${sample.churchGroup} Cell` : 'Joy Cell')
                        .replace(/\{churchName\}|\[churchName\]/gi, 'Christ Apostolic Church International (CACI)');
                    })()}
                  </p>
                </div>
              </div>

              {/* Submit Dispatch Action */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-7 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50 flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSending
                      ? 'Dispatching via Gateway...'
                      : `Dispatch ${channel === 'SMS' ? 'Vynfy SMS Broadcast' : 'WhatsApp Notices'}`}
                  </span>
                </button>
              </div>
            </form>

            {/* Live Gateway Diagnostics Result */}
            {gatewayResult && (
              <div className={`p-4 rounded-2xl border text-xs space-y-2 mt-4 ${
                gatewayResult.success
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center space-x-1.5">
                    {gatewayResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Info className="w-4 h-4 text-amber-600" />
                    )}
                    <span>Vynfy Gateway Status: {gatewayResult.status}</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    Recipients: {gatewayResult.recipientCount}
                  </span>
                </div>

                {gatewayResult.error && (
                  <p className="font-semibold text-amber-900 bg-white/70 p-2.5 rounded-xl border border-amber-200">
                    {gatewayResult.error}
                  </p>
                )}

                {gatewayResult.status === 'SENDER_ID_APPROVAL_REQUIRED' && (
                  <div className="text-[11px] text-amber-900 space-y-1 bg-amber-100/70 p-2.5 rounded-xl border border-amber-300">
                    <p className="font-bold">Ghana Telecom / Vynfy Sender ID Notice:</p>
                    <p>
                      Vynfy requires your chosen Sender ID (e.g. <strong>"{senderId}"</strong>) to be submitted and approved in your Vynfy portal dashboard under <strong>Sender IDs</strong> before live carrier delivery is permitted. Once approved in Vynfy, messages to your congregants will immediately deliver!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Single Phone Live Test Tool */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Live Single-Number SMS Gateway Tester
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                Direct Sandbox
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              Send a test SMS to a specific Ghana phone number right now using your authenticated Vynfy SMS Gateway.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative flex-1 w-full">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Enter Ghana phone (e.g. 0244123456 or 233244123456)"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={handleTestSingleSMS}
                disabled={isTestingSingle}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                {isTestingSingle ? (
                  <span>Testing Gateway...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Test SMS</span>
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl border text-[11px] font-mono space-y-1 ${
                testResult.gateway?.success || testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="font-bold flex items-center justify-between">
                  <span>Gateway Response: {testResult.gateway?.status || (testResult.success ? 'SENT' : 'FAILED')}</span>
                  <span>{testResult.gateway?.recipientCount || 1} recipient</span>
                </div>
                {testResult.gateway?.error && (
                  <p className="font-sans font-semibold text-amber-950">
                    {testResult.gateway.error}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Generated WhatsApp Direct Links (if WhatsApp selected) */}
          {whatsappLinks.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-emerald-200 shadow-sm space-y-3 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-sm text-slate-900">
                    Ready-to-Send WhatsApp Chats ({whatsappLinks.length})
                  </h4>
                </div>
                <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                  <span>
                    {clickedWhatsAppUrls.size} of {whatsappLinks.length} opened
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {whatsappLinks.map((item, idx) => {
                  const isOpened = clickedWhatsAppUrls.has(item.url);
                  return (
                    <a
                      key={idx}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setClickedWhatsAppUrls((prev) => new Set([...prev, item.url]))}
                      className={`p-3 rounded-2xl border flex items-center justify-between transition group text-xs ${
                        isOpened
                          ? 'bg-slate-50 border-slate-200 text-slate-500'
                          : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100 text-slate-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold block">{item.name}</span>
                          {isOpened && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-200 text-slate-600">
                              Opened
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">{item.phone}</span>
                      </div>
                      <div className={`flex items-center space-x-1 font-bold group-hover:translate-x-0.5 transition ${
                        isOpened ? 'text-slate-500' : 'text-emerald-700'
                      }`}>
                        <span>Chat</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Sent Message Audit Logs */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">Message Delivery Log</h3>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={refreshLogs}
                disabled={isRefreshingLogs}
                title="Refresh logs"
                className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingLogs ? 'animate-spin text-blue-600' : ''}`} />
              </button>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {filteredLogs.length}
              </span>
            </div>
          </div>

          {/* Search & Channel Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search delivery logs..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-1 text-[10px]">
              {(['ALL', 'SMS', 'WHATSAPP'] as const).map((chan) => (
                <button
                  key={chan}
                  type="button"
                  onClick={() => setLogChannelFilter(chan)}
                  className={`px-2 py-0.5 rounded-lg font-bold transition ${
                    logChannelFilter === chan
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {chan === 'ALL' ? 'All' : chan}
                </button>
              ))}
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              {logs.length === 0 ? 'No messages have been dispatched yet.' : 'No matching logs found.'}
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      {log.recipientName || log.recipientPhone}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${
                        log.channel === 'WHATSAPP'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {log.channel}
                    </span>
                  </div>

                  <p className="text-slate-600 line-clamp-2 italic text-[11px]">
                    "{log.messageContent}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50">
                    <span>{new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</span>
                    <span className="text-emerald-600 font-bold">{log.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
