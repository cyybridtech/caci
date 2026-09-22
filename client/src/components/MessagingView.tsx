import React, { useState } from 'react';
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
  UserCheck
} from 'lucide-react';
import { ServiceSession, Department, MessageLog, AttendanceRecord, Member, ChurchGroup } from '../types/index.ts';

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
  messageLogs,
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

  // Test single number SMS
  const [testPhone, setTestPhone] = useState('');
  const [isTestingSingle, setIsTestingSingle] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Specific member selection state
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberGroupFilter, setMemberGroupFilter] = useState<'ALL' | 'GROUP_1' | 'GROUP_2'>('ALL');

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
    if (targetType === 'GROUP_1') {
      return "Calvary greetings {firstName}! Important announcement for all CACI Group 1 members: please take note of our upcoming group fellowship.";
    }
    if (targetType === 'GROUP_2') {
      return "Calvary greetings {firstName}! Important announcement for all CACI Group 2 members: please take note of our upcoming group fellowship.";
    }
    if (targetType === 'SPECIFIC_MEMBERS') {
      return "Calvary greetings {firstName}! Please take note of this special church announcement from CACI leadership.";
    }
    return "Calvary greetings {firstName}! Important notification from your department at CACI.";
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();

    if (targetType === 'SPECIFIC_MEMBERS' && selectedMemberIds.length === 0) {
      setFeedback('Please select at least one member from the list below.');
      return;
    }

    try {
      setIsSending(true);
      setFeedback(null);
      setGatewayResult(null);
      setWhatsappLinks([]);

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
      const res = await fetch('http://localhost:5000/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'SMS',
          recipientPhone: testPhone.trim(),
          recipientName: 'Test Recipient',
          messageContent: customMessage.trim() || 'Test message from CACI Church Management System via Vynfy.',
          category: 'TEST_SMS',
          senderId: senderId.trim() || undefined
        })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setIsTestingSingle(false);
    }
  };

  const activeMessageText = customMessage.trim() || getPlaceholderMessage();
  const charCount = activeMessageText.length;
  const smsPages = Math.ceil(charCount / 160) || 1;

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
              Automated service follow-ups, group notices, and custom targeted SMS broadcasts across Ghana
            </p>
          </div>
        </div>

        {/* Gateway API Badge */}
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-2xl border border-slate-800 flex items-center space-x-3 text-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Provider</span>
            <span className="font-mono font-bold text-amber-300">Vynfy SMS Gateway (a5a9ec...)</span>
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
                feedback.includes('success') || feedback.includes('Sent')
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <Info className="w-4 h-4 shrink-0" />
                <span>{feedback}</span>
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
                        {Math.max(0, members.length - attendanceRecords.length)} absent
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
                      <span className="text-[11px] text-slate-500">{members.length} congregants</span>
                    </div>
                    <Users className="w-4 h-4 text-slate-700" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('GROUP_1')}
                    className={`p-3 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                      targetType === 'GROUP_1'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">All Group 1</span>
                      <span className="text-[11px] text-slate-500">
                        {members.filter((m) => m.churchGroup === 'GROUP_1').length} members
                      </span>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('GROUP_2')}
                    className={`p-3 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                      targetType === 'GROUP_2'
                        ? 'border-purple-600 bg-purple-50/70 text-purple-950 font-bold'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">All Group 2</span>
                      <span className="text-[11px] text-slate-500">
                        {members.filter((m) => m.churchGroup === 'GROUP_2').length} members
                      </span>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                  </button>
                </div>
              </div>

              {/* Specific Members Picker Drawer (when SPECIFIC_MEMBERS is active) */}
              {targetType === 'SPECIFIC_MEMBERS' && (
                <div className="p-4 rounded-3xl bg-indigo-50/60 border-2 border-indigo-200 space-y-3">
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
                        placeholder="Search member by name, phone, or ID..."
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-indigo-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-indigo-200">
                      <button
                        type="button"
                        onClick={() => setMemberGroupFilter('ALL')}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                          memberGroupFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                        }`}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setMemberGroupFilter('GROUP_1')}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                          memberGroupFilter === 'GROUP_1' ? 'bg-blue-600 text-white' : 'text-blue-700'
                        }`}
                      >
                        Group 1
                      </button>
                      <button
                        type="button"
                        onClick={() => setMemberGroupFilter('GROUP_2')}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                          memberGroupFilter === 'GROUP_2' ? 'bg-purple-600 text-white' : 'text-purple-700'
                        }`}
                      >
                        Group 2
                      </button>
                    </div>
                  </div>

                  {/* Members Checkbox List */}
                  <div className="max-h-56 overflow-y-auto space-y-1.5 bg-white p-2.5 rounded-2xl border border-indigo-200 divide-y divide-slate-100">
                    {selectableMembers.map((member) => {
                      const isSelected = selectedMemberIds.includes(member.id);
                      const hasPhone = Boolean(member.phone);

                      return (
                        <div
                          key={member.id}
                          onClick={() => hasPhone && toggleSelectMember(member.id)}
                          className={`p-2 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition ${
                            isSelected
                              ? 'bg-indigo-50 border border-indigo-300'
                              : hasPhone
                              ? 'hover:bg-slate-50'
                              : 'opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={!hasPhone}
                              onChange={() => hasPhone && toggleSelectMember(member.id)}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />

                            {member.photoUrl ? (
                              <img
                                src={member.photoUrl}
                                alt=""
                                className="w-7 h-7 rounded-lg object-cover shrink-0"
                              />
                            ) : (
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] text-white shrink-0 ${
                                  member.churchGroup === 'GROUP_1' ? 'bg-blue-600' : 'bg-purple-600'
                                }`}
                              >
                                {member.firstName[0]}
                                {member.lastName[0]}
                              </div>
                            )}

                            <div className="truncate">
                              <span className="font-extrabold text-xs text-slate-900 block truncate">
                                {member.firstName} {member.lastName}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {member.phone || 'No phone registered'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                                member.churchGroup === 'GROUP_1'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {member.churchGroup === 'GROUP_1' ? 'G1' : 'G2'}
                            </span>
                            {member.role !== 'Member' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-700">
                                {member.role}
                              </span>
                            )}
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

              {/* Message Composer & Personalization Tags */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    3. Message Content
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomMessage(getPlaceholderMessage())}
                    className="text-[11px] text-blue-600 font-bold hover:underline"
                  >
                    Insert Recommended Template
                  </button>
                </div>

                {/* Tag Helper Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pb-1">
                  <span className="text-[10px] text-slate-400 font-bold">Dynamic Tags:</span>
                  <button
                    type="button"
                    onClick={() => setCustomMessage((prev) => prev + '{firstName}')}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold"
                  >
                    {'{firstName}'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomMessage((prev) => prev + '{lastName}')}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold"
                  >
                    {'{lastName}'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomMessage((prev) => prev + '{group}')}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold"
                  >
                    {'{group}'}
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder={getPlaceholderMessage()}
                  className="w-full px-4 py-3 border border-slate-300 rounded-2xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                />
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
              Send a test SMS to a specific Ghana phone number right now using your Vynfy API key.
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
                testResult.gateway?.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="font-bold flex items-center justify-between">
                  <span>Gateway Response: {testResult.gateway?.status || 'SENT'}</span>
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
            <div className="bg-white p-6 rounded-3xl border border-emerald-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-sm text-slate-900">
                    Ready-to-Send WhatsApp Chats ({whatsappLinks.length})
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500">
                  Click any member to open WhatsApp
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {whatsappLinks.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 hover:bg-emerald-100 flex items-center justify-between transition group text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{item.name}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{item.phone}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-emerald-700 font-bold group-hover:translate-x-0.5 transition">
                      <span>Chat</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </a>
                ))}
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
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {messageLogs.length} dispatched
            </span>
          </div>

          {messageLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No messages have been dispatched yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {messageLogs.map((log) => (
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
