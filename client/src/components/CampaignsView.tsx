import React, { useState, useEffect } from 'react';
import {
  Building,
  Target,
  Plus,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  Receipt,
  User,
  Calendar,
  Layers,
  Phone,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';
import { PledgeCampaign, MemberPledge, Member, PaymentMethod } from '../types/index.ts';
import { api } from '../services/api.ts';

interface CampaignsViewProps {
  members: Member[];
  onOpenReceiptModal?: (receiptData: any) => void;
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({ members, onOpenReceiptModal }) => {
  const [campaigns, setCampaigns] = useState<PledgeCampaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<PledgeCampaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal states
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [isRecordPledgeOpen, setIsRecordPledgeOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isRemindModalOpen, setIsRemindModalOpen] = useState(false);

  // Selected pledge for payment
  const [selectedPledge, setSelectedPledge] = useState<MemberPledge | null>(null);

  // Form states
  const [newCampaignData, setNewCampaignData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    category: 'BUILDING_PROJECT',
    endDate: ''
  });

  const [newPledgeData, setNewPledgeData] = useState({
    memberId: '',
    donorName: '',
    donorPhone: '',
    pledgedAmount: '',
    dueDate: '',
    notes: ''
  });

  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'MOBILE_MONEY' as PaymentMethod,
    notes: ''
  });

  const [reminderMessage, setReminderMessage] = useState(
    "Calvary greetings {name}! Thank you for your commitment to CACI {campaign}. You have currently redeemed GH₵ {paid} of your GH₵ {pledged} pledge (Remaining: GH₵ {balance}). God bless your cheerful giving!"
  );
  const [isSendingReminders, setIsSendingReminders] = useState(false);

  // Pledge filters
  const [pledgeSearchQuery, setPledgeSearchQuery] = useState('');
  const [pledgeStatusFilter, setPledgeStatusFilter] = useState<'ALL' | 'PENDING' | 'PARTIALLY_PAID' | 'FULFILLED'>('ALL');

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const data = await api.getCampaigns();
      setCampaigns(data);
      if (data.length > 0) {
        setSelectedCampaign((prev) => (prev ? data.find((c) => c.id === prev.id) || data[0] : data[0]));
      }
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignData.title || !newCampaignData.targetAmount) return;

    try {
      const created = await api.createCampaign({
        title: newCampaignData.title,
        description: newCampaignData.description || undefined,
        targetAmount: Number(newCampaignData.targetAmount),
        category: newCampaignData.category,
        endDate: newCampaignData.endDate || undefined
      });
      setIsCreateCampaignOpen(false);
      setNewCampaignData({ title: '', description: '', targetAmount: '', category: 'BUILDING_PROJECT', endDate: '' });
      setFeedback(`Created campaign: ${created.title}`);
      await fetchCampaigns();
    } catch (err: any) {
      alert(err.message || 'Failed to create campaign');
    }
  };

  const handleRecordPledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign || !newPledgeData.pledgedAmount) return;

    try {
      await api.createPledge(selectedCampaign.id, {
        memberId: newPledgeData.memberId || undefined,
        donorName: newPledgeData.donorName || undefined,
        donorPhone: newPledgeData.donorPhone || undefined,
        pledgedAmount: Number(newPledgeData.pledgedAmount),
        dueDate: newPledgeData.dueDate || undefined,
        notes: newPledgeData.notes || undefined
      });
      setIsRecordPledgeOpen(false);
      setNewPledgeData({ memberId: '', donorName: '', donorPhone: '', pledgedAmount: '', dueDate: '', notes: '' });
      setFeedback('Pledge recorded successfully!');
      await fetchCampaigns();
    } catch (err: any) {
      alert(err.message || 'Failed to record pledge');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPledge || !paymentData.amount) return;

    try {
      const res = await api.recordPledgePayment(selectedPledge.id, {
        amount: Number(paymentData.amount),
        paymentMethod: paymentData.paymentMethod,
        notes: paymentData.notes || undefined
      });
      setIsRecordPaymentOpen(false);
      setPaymentData({ amount: '', paymentMethod: 'MOBILE_MONEY', notes: '' });
      setFeedback(`Payment recorded! Official Receipt: ${res.receiptNumber}`);
      await fetchCampaigns();
    } catch (err: any) {
      alert(err.message || 'Failed to record payment');
    }
  };

  const handleSendReminders = async () => {
    if (!selectedCampaign) return;

    try {
      setIsSendingReminders(true);
      const res = await api.sendPledgeReminders(selectedCampaign.id, {
        customMessage: reminderMessage
      });
      setIsRemindModalOpen(false);
      setFeedback(res.message);
    } catch (err: any) {
      alert(err.message || 'Failed to send reminders');
    } finally {
      setIsSendingReminders(false);
    }
  };

  // Filtered pledges for selected campaign
  const activePledges = (selectedCampaign?.pledges || []).filter((p) => {
    if (pledgeStatusFilter !== 'ALL' && p.status !== pledgeStatusFilter) return false;
    if (pledgeSearchQuery.trim() !== '') {
      const q = pledgeSearchQuery.toLowerCase().trim();
      const donor = (p.donorName || '').toLowerCase();
      const memberName = p.member ? `${p.member.firstName} ${p.member.lastName}`.toLowerCase() : '';
      const phone = (p.donorPhone || p.member?.phone || '').toLowerCase();
      return donor.includes(q) || memberName.includes(q) || phone.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">
            <Building className="w-4 h-4 text-indigo-400" />
            <span>Church Expansion & Special Projects</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">
            Special Pledges & Harvest Campaign Tracker
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Track building fund targets, pledge commitments, installment redemptions in GH₵, and automated SMS reminders
          </p>
        </div>

        {/* Create Campaign Button */}
        <button
          type="button"
          onClick={() => setIsCreateCampaignOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition flex items-center space-x-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Project Campaign</span>
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-extrabold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Campaigns Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.map((c) => {
          const isSelected = selectedCampaign?.id === c.id;
          return (
            <div
              key={c.id}
              onClick={() => setSelectedCampaign(c)}
              className={`p-5 rounded-3xl border-2 cursor-pointer transition relative space-y-3.5 ${
                isSelected
                  ? 'border-indigo-600 bg-white shadow-md'
                  : 'border-slate-200/90 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase bg-indigo-50 text-indigo-800">
                    {c.category.replace('_', ' ')}
                  </span>
                  <h3 className="font-extrabold text-sm text-slate-900 mt-1.5 line-clamp-1">{c.title}</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {c.percentRaised}% Raised
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-emerald-700">GH₵ {c.totalPaid.toLocaleString()} Raised</span>
                  <span className="text-slate-500">Target: GH₵ {c.targetAmount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-600 to-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, c.percentRaised)}%` }}
                  ></div>
                </div>
              </div>

              {/* Metrics row */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                <div className="p-2 rounded-xl bg-slate-50">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Pledges</span>
                  <span className="text-xs font-extrabold text-slate-800">{c.pledgesCount}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Pledged</span>
                  <span className="text-xs font-extrabold text-indigo-700">GH₵ {c.totalPledged.toLocaleString()}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Remaining</span>
                  <span className="text-xs font-extrabold text-amber-700">GH₵ {c.remainingTarget.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Campaign Details & Pledge Ledger */}
      {selectedCampaign && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-extrabold text-slate-900">{selectedCampaign.title}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  {selectedCampaign.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedCampaign.description || 'Campaign pledge commitments and payment ledger.'}
              </p>
            </div>

            {/* Campaign Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRecordPledgeOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-sm transition flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Pledge</span>
              </button>

              <button
                type="button"
                onClick={() => setIsRemindModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-sm transition flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5 text-amber-300" />
                <span>Send SMS Reminders (Vynfy)</span>
              </button>
            </div>
          </div>

          {/* Filter and Search Bar for Pledges */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search pledger by name or phone number..."
                value={pledgeSearchQuery}
                onChange={(e) => setPledgeSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              {(['ALL', 'PENDING', 'PARTIALLY_PAID', 'FULFILLED'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setPledgeStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    pledgeStatusFilter === st
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Pledges Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Donor / Member</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3 text-right">Pledged (GH₵)</th>
                  <th className="py-2.5 px-3 text-right">Paid (GH₵)</th>
                  <th className="py-2.5 px-3 text-right">Balance (GH₵)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activePledges.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No pledges found matching your filters.
                    </td>
                  </tr>
                ) : (
                  activePledges.map((pledge) => {
                    const donorName = pledge.member
                      ? `${pledge.member.firstName} ${pledge.member.lastName}`
                      : pledge.donorName;
                    const phone = pledge.member?.phone || pledge.donorPhone;
                    const pledged = Number(pledge.pledgedAmount);
                    const paid = Number(pledge.amountPaid);
                    const balance = Math.max(0, pledged - paid);

                    return (
                      <tr key={pledge.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          <div className="flex items-center space-x-2">
                            <span>{donorName}</span>
                            {pledge.member && (
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${
                                  pledge.member.churchGroup === 'GROUP_1'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}
                              >
                                {pledge.member.churchGroup === 'GROUP_1' ? 'G1' : 'G2'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                          {phone || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          GH₵ {pledged.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                          GH₵ {paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-amber-700">
                          GH₵ {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              pledge.status === 'FULFILLED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : pledge.status === 'PARTIALLY_PAID'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {pledge.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {pledge.status !== 'FULFILLED' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPledge(pledge);
                                setIsRecordPaymentOpen(true);
                              }}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs transition"
                            >
                              Pay Installment
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-extrabold">Completed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Campaign */}
      {isCreateCampaignOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-extrabold text-base text-slate-900">Create New Project Campaign</h3>
            <form onSubmit={handleCreateCampaign} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026 Central Auditorium Expansion"
                  value={newCampaignData.title}
                  onChange={(e) => setNewCampaignData({ ...newCampaignData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Amount (GH₵)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 100000"
                    value={newCampaignData.targetAmount}
                    onChange={(e) => setNewCampaignData({ ...newCampaignData, targetAmount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-medium text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                  <select
                    value={newCampaignData.category}
                    onChange={(e) => setNewCampaignData({ ...newCampaignData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-medium text-slate-900 bg-white"
                  >
                    <option value="BUILDING_PROJECT">Building Project</option>
                    <option value="ANNUAL_HARVEST">Annual Harvest</option>
                    <option value="CONVENTION_FUND">Convention Fund</option>
                    <option value="MISSION_OUTREACH">Mission Outreach</option>
                    <option value="SPECIAL_SEED">Special Seed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Purpose of this special church project..."
                  value={newCampaignData.description}
                  onChange={(e) => setNewCampaignData({ ...newCampaignData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-medium text-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateCampaignOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-sm"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Pledge */}
      {isRecordPledgeOpen && selectedCampaign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-extrabold text-base text-slate-900">Record Member Pledge</h3>
            <p className="text-xs text-slate-500">Project: {selectedCampaign.title}</p>

            <form onSubmit={handleRecordPledge} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Church Member</label>
                <select
                  value={newPledgeData.memberId}
                  onChange={(e) => {
                    const mId = e.target.value;
                    const m = members.find((x) => x.id === mId);
                    setNewPledgeData({
                      ...newPledgeData,
                      memberId: mId,
                      donorName: m ? `${m.firstName} ${m.lastName}` : '',
                      donorPhone: m?.phone || ''
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-medium text-slate-900 bg-white"
                >
                  <option value="">-- External Donor / Enter Manually --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName} ({m.churchGroup === 'GROUP_1' ? 'G1' : 'G2'})
                    </option>
                  ))}
                </select>
              </div>

              {!newPledgeData.memberId && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Donor Name</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={newPledgeData.donorName}
                      onChange={(e) => setNewPledgeData({ ...newPledgeData, donorName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-medium text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="024XXXXXXX"
                      value={newPledgeData.donorPhone}
                      onChange={(e) => setNewPledgeData({ ...newPledgeData, donorPhone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-medium text-slate-900 font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pledged Amount (GH₵)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 2000"
                  value={newPledgeData.pledgedAmount}
                  onChange={(e) => setNewPledgeData({ ...newPledgeData, pledgedAmount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-medium text-slate-900 font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRecordPledgeOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-sm"
                >
                  Save Pledge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Pledge Payment */}
      {isRecordPaymentOpen && selectedPledge && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-extrabold text-base text-slate-900">Record Pledge Installment Payment</h3>
            <div className="p-3 bg-slate-50 rounded-2xl border text-xs space-y-1">
              <span className="font-extrabold text-slate-900 block">
                {selectedPledge.member
                  ? `${selectedPledge.member.firstName} ${selectedPledge.member.lastName}`
                  : selectedPledge.donorName}
              </span>
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>Pledged: GH₵ {Number(selectedPledge.pledgedAmount).toLocaleString()}</span>
                <span>Already Paid: GH₵ {Number(selectedPledge.amountPaid).toLocaleString()}</span>
                <span className="font-bold text-amber-700">
                  Remaining: GH₵ {(Number(selectedPledge.pledgedAmount) - Number(selectedPledge.amountPaid)).toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Amount (GH₵)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 500"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-medium text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Method</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value as PaymentMethod })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-medium text-slate-900 bg-white"
                >
                  <option value="MOBILE_MONEY">Mobile Money (MoMo)</option>
                  <option value="CASH">Cash Deposit</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Bank Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. MoMo Transaction ID / Reference"
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-medium text-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRecordPaymentOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-sm"
                >
                  Confirm & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: SMS Pledge Reminders */}
      {isRemindModalOpen && selectedCampaign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2">
              <Send className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-base text-slate-900">Send Gentle SMS Reminders</h3>
            </div>
            <p className="text-xs text-slate-500">
              Dispatches personalized SMS via Vynfy to all members with pending pledge balances for{' '}
              <strong>{selectedCampaign.title}</strong>.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase">Reminder Message Template</label>
              <textarea
                rows={4}
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                className="w-full p-3 border rounded-2xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <div className="text-[10px] text-slate-400 font-mono">
                Tags: {'{name}'}, {'{campaign}'}, {'{pledged}'}, {'{paid}'}, {'{balance}'}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRemindModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSendingReminders}
                onClick={handleSendReminders}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-sm transition disabled:opacity-50"
              >
                {isSendingReminders ? 'Sending Reminders...' : 'Dispatch Vynfy SMS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
