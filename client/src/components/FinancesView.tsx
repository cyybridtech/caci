import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Printer,
  Calendar,
  CreditCard,
  TrendingUp,
  X,
  Check
} from 'lucide-react';
import {
  FinancialContribution,
  FinancialSummary,
  Member,
  ServiceSession,
  FinancialCategory,
  PaymentMethod
} from '../types/index.ts';
import { ReceiptModal } from './ReceiptModal.tsx';

interface FinancesViewProps {
  contributions: FinancialContribution[];
  summary: FinancialSummary | null;
  members: Member[];
  session: ServiceSession | null;
  onRecordContribution: (data: any) => Promise<void>;
}

export const FinancesView: React.FC<FinancesViewProps> = ({
  contributions,
  summary,
  members,
  session,
  onRecordContribution
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<FinancialContribution | null>(null);

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Form states
  const [memberId, setMemberId] = useState<string>('');
  const [category, setCategory] = useState<FinancialCategory>('TITHE');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;

    try {
      setIsSubmitting(true);
      await onRecordContribution({
        memberId: memberId || null,
        sessionId: session?.id || null,
        category,
        amount: Number(amount),
        paymentMethod,
        transactionDate: transactionDate || new Date().toISOString(),
        notes: notes.trim() || null
      });

      // Reset
      setMemberId('');
      setAmount('');
      setNotes('');
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredContributions = contributions.filter((c) => {
    if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Church Finances & Tithes</h2>
            <p className="text-xs text-slate-500">
              Record tithes, sunday offerings, welfare dues, and compare giving across Group 1 & Group 2
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Record Contribution</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inflow */}
        <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Church Inflow
          </span>
          <span className="text-3xl font-extrabold text-white mt-1 block">
            GH₵ {Number(summary?.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-emerald-400 mt-2 block font-semibold">
            {summary?.recordCount || 0} contributions recorded
          </span>
        </div>

        {/* Tithes Total */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
            Tithes Total
          </span>
          <span className="text-2xl font-extrabold text-blue-700 mt-1 block">
            GH₵ {Number(summary?.categoryTotals.TITHE || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 mt-2 block font-medium">Covenant tithes</span>
        </div>

        {/* Sunday Offerings Total */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
            Sunday Offerings
          </span>
          <span className="text-2xl font-extrabold text-amber-700 mt-1 block">
            GH₵ {Number(summary?.categoryTotals.OFFERING || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 mt-2 block font-medium">Basket collections</span>
        </div>

        {/* Welfare & Projects */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider block">
            Welfare & Projects
          </span>
          <span className="text-2xl font-extrabold text-purple-700 mt-1 block">
            GH₵ {Number(
              (summary?.categoryTotals.WELFARE || 0) + (summary?.categoryTotals.BUILDING_PROJECT || 0)
            ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 mt-2 block font-medium">Benevolence & Building</span>
        </div>
      </div>

      {/* Giving Comparison: Group 1 vs Group 2 */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span>Giving Comparison: Group 1 vs Group 2</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-blue-900 uppercase tracking-wider">
                Group 1 Total Giving
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-600 text-white">
                Group 1
              </span>
            </div>
            <div className="text-2xl font-extrabold text-blue-800">
              GH₵ {Number(summary?.groupComparison.group1 || 0).toFixed(2)}
            </div>
            <p className="text-[11px] text-blue-700">Contributions from registered Group 1 members</p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-purple-900 uppercase tracking-wider">
                Group 2 Total Giving
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-600 text-white">
                Group 2
              </span>
            </div>
            <div className="text-2xl font-extrabold text-purple-800">
              GH₵ {Number(summary?.groupComparison.group2 || 0).toFixed(2)}
            </div>
            <p className="text-[11px] text-purple-700">Contributions from registered Group 2 members</p>
          </div>
        </div>
      </div>

      {/* Contributions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Category Filters */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            {['ALL', 'TITHE', 'OFFERING', 'WELFARE', 'BUILDING_PROJECT', 'THANKSGIVING'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 font-semibold">
            {filteredContributions.length} contribution(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200 uppercase text-[11px]">
              <tr>
                <th className="px-6 py-3.5">Transaction Date</th>
                <th className="px-4 py-3.5">Contributor</th>
                <th className="px-4 py-3.5">Group</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Payment Mode</th>
                <th className="px-4 py-3.5 text-right">Amount (GH₵)</th>
                <th className="px-6 py-3.5 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContributions.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-4 font-semibold text-slate-700">
                    {new Date(c.transactionDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>

                  <td className="px-4 py-4">
                    {c.member ? (
                      <div className="flex items-center space-x-2.5">
                        {c.member.photoUrl ? (
                          <img
                            src={c.member.photoUrl}
                            alt=""
                            className="w-7 h-7 rounded-lg object-cover"
                          />
                        ) : (
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white ${
                              c.member.churchGroup === 'GROUP_1' ? 'bg-blue-600' : 'bg-purple-600'
                            }`}
                          >
                            {c.member.firstName[0]}
                          </div>
                        )}
                        <span className="font-extrabold text-slate-900">
                          {c.member.firstName} {c.member.lastName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">General Offering (Anonymous)</span>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    {c.member ? (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          c.member.churchGroup === 'GROUP_1'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {c.member.churchGroup === 'GROUP_1' ? 'Group 1' : 'Group 2'}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                      {c.category.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-slate-600 font-medium">
                    {c.paymentMethod.replace('_', ' ')}
                  </td>

                  <td className="px-4 py-4 text-right font-extrabold text-sm text-slate-900">
                    GH₵ {Number(c.amount).toFixed(2)}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedReceipt(c)}
                      title="Print Official Receipt"
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Contribution Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-base">Record Financial Contribution</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Transaction Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Transaction Date *
                </label>
                <input
                  type="date"
                  required
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Member Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contributor (Member)
                </label>
                <select
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">General Offering / Anonymous</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName} ({m.churchGroup === 'GROUP_1' ? 'Group 1' : 'Group 2'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FinancialCategory)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="TITHE">Tithe</option>
                  <option value="OFFERING">Sunday Offering</option>
                  <option value="WELFARE">Welfare Dues / Fund</option>
                  <option value="THANKSGIVING">Thanksgiving Seed</option>
                  <option value="BUILDING_PROJECT">Building & Project Fund</option>
                  <option value="SPECIAL_SEED">Special Seed</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amount in Ghana Cedis (GH₵) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold text-sm">GH₵</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.10"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-14 pr-3 py-2 border border-slate-300 rounded-xl text-base font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="CASH">Cash</option>
                  <option value="MOBILE_MONEY">Mobile Money (MoMo)</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. March 2026 tithe"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ReceiptModal
        contribution={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
};
