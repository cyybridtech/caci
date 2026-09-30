import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Printer,
  Calendar,
  TrendingUp,
  X,
  Pencil,
  Trash2,
  ShoppingCart,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Building2,
  Car,
  Wrench,
  Zap,
  Users as UsersIcon,
  Laptop,
  Layers,
  Search,
  User,
  Heart,
  FileText,
  Building,
  Gift,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import {
  FinancialContribution,
  FinancialSummary,
  Member,
  ServiceSession,
  FinancialCategory,
  PaymentMethod,
  ChurchExpense,
  ExpenseCategory,
  ChurchGroup
} from '../types/index.ts';
import { ReceiptModal } from './ReceiptModal.tsx';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface FinancesViewProps {
  contributions: FinancialContribution[];
  summary: FinancialSummary | null;
  members: Member[];
  session: ServiceSession | null;
  onRecordContribution: (data: any) => Promise<void>;
  onUpdateContribution?: (id: string, data: any) => Promise<void>;
  onDeleteContribution?: (id: string) => Promise<void>;
}

type MainTab = 'contributions' | 'expenses' | 'members';

const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  UTILITY: 'Utility Bills',
  MAINTENANCE: 'Maintenance',
  MINISTRY: 'Ministry Activity',
  STAFF: 'Staff & Salary',
  PROGRAM: 'Program / Event',
  EQUIPMENT: 'Equipment',
  TRANSPORT: 'Transport',
  OTHER: 'Other'
};

const EXPENSE_CATEGORY_ICONS: Record<ExpenseCategory, React.ReactNode> = {
  UTILITY: <Zap className="w-3.5 h-3.5" />,
  MAINTENANCE: <Wrench className="w-3.5 h-3.5" />,
  MINISTRY: <Layers className="w-3.5 h-3.5" />,
  STAFF: <UsersIcon className="w-3.5 h-3.5" />,
  PROGRAM: <Calendar className="w-3.5 h-3.5" />,
  EQUIPMENT: <Laptop className="w-3.5 h-3.5" />,
  TRANSPORT: <Car className="w-3.5 h-3.5" />,
  OTHER: <Building2 className="w-3.5 h-3.5" />
};

const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  UTILITY: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  MAINTENANCE: 'bg-orange-100 text-orange-800 border-orange-300',
  MINISTRY: 'bg-blue-100 text-blue-800 border-blue-300',
  STAFF: 'bg-purple-100 text-purple-800 border-purple-300',
  PROGRAM: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  EQUIPMENT: 'bg-sky-100 text-sky-800 border-sky-300',
  TRANSPORT: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  OTHER: 'bg-slate-100 text-slate-700 border-slate-300'
};

export const FinancesView: React.FC<FinancesViewProps> = ({
  contributions,
  summary,
  members,
  session,
  onRecordContribution,
  onUpdateContribution,
  onDeleteContribution
}) => {
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'FINANCE';

  // Main tab: contributions vs expenses vs members
  const [mainTab, setMainTab] = useState<MainTab>('contributions');

  // ─── Contributions ───
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContribution, setEditingContribution] = useState<FinancialContribution | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<FinancialContribution | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const [memberId, setMemberId] = useState<string>('');
  const [category, setCategory] = useState<FinancialCategory>('TITHE');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [transactionDate, setTransactionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [expenseVendor, setExpenseVendor] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Expenses ───
  const [expenses, setExpenses] = useState<ChurchExpense[]>([]);
  const [expenseCatFilter, setExpenseCatFilter] = useState<string>('ALL');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ChurchExpense | null>(null);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);

  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('OTHER');
  const [expAmount, setExpAmount] = useState('');
  const [expPayMethod, setExpPayMethod] = useState<PaymentMethod>('CASH');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expVendor, setExpVendor] = useState('');
  const [expAuthorized, setExpAuthorized] = useState('');
  const [expReceipt, setExpReceipt] = useState('');
  const [expDescription, setExpDescription] = useState('');
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  // ─── Member Financial Statement Modal ───
  const [statementMember, setStatementMember] = useState<Member | null>(null);
  const [statementData, setStatementData] = useState<any>(null);
  const [isLoadingStatement, setIsLoadingStatement] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [memberCellFilter, setMemberCellFilter] = useState<string>('ALL');

  // Load expenses on mount and when tab becomes active
  useEffect(() => {
    api.getExpenses().then(setExpenses).catch(console.error);
  }, []);

  useEffect(() => {
    if (mainTab === 'expenses') {
      setIsLoadingExpenses(true);
      api.getExpenses().then(setExpenses).catch(console.error).finally(() => setIsLoadingExpenses(false));
    }
  }, [mainTab]);

  // Load detailed statement when statementMember is selected
  const loadMemberStatement = async (m: Member) => {
    try {
      setIsLoadingStatement(true);
      setStatementMember(m);
      const [fullMember, stmt] = await Promise.all([
        api.getMember(m.id),
        api.getMemberGivingStatement(m.id).catch(() => null)
      ]);
      setStatementData({
        member: fullMember,
        statement: stmt
      });
    } catch (err) {
      console.error('Failed to load member financial statement:', err);
    } finally {
      setIsLoadingStatement(false);
    }
  };

  // Pre-calculate member financial summary metrics from contributions
  const memberFinancialMap = useMemo(() => {
    const map = new Map<string, { totalGiven: number; tithes: number; welfare: number; offerings: number; count: number }>();
    for (const c of contributions) {
      if (!c.memberId) continue;
      const current = map.get(c.memberId) || { totalGiven: 0, tithes: 0, welfare: 0, offerings: 0, count: 0 };
      const amt = Number(c.amount) || 0;
      current.totalGiven += amt;
      current.count += 1;
      if (c.category === 'TITHE') current.tithes += amt;
      else if (c.category === 'WELFARE') current.welfare += amt;
      else current.offerings += amt;
      map.set(c.memberId, current);
    }
    return map;
  }, [contributions]);

  // Filter members list for the Finance Members tab
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (memberCellFilter !== 'ALL' && m.churchGroup !== memberCellFilter) return false;
      if (memberSearchTerm.trim()) {
        const q = memberSearchTerm.toLowerCase().trim();
        const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
        const phone = (m.phone || '').toLowerCase();
        const code = (m.memberCode || '').toLowerCase();
        return fullName.includes(q) || phone.includes(q) || code.includes(q);
      }
      return true;
    });
  }, [members, memberCellFilter, memberSearchTerm]);

  // Open contribution edit
  const openEditContribution = (c: FinancialContribution) => {
    setEditingContribution(c);
    setMemberId(c.memberId || '');
    setCategory(c.category);
    setAmount(String(Number(c.amount)));
    setPaymentMethod(c.paymentMethod);
    setTransactionDate(c.transactionDate.split('T')[0]);
    setNotes(c.notes || '');
    setExpenseVendor('');
    setShowAddModal(true);
  };

  const openAddContributionForMember = (targetMemberId?: string) => {
    resetContributionForm();
    if (targetMemberId) {
      setMemberId(targetMemberId);
    }
    setShowAddModal(true);
  };

  const resetContributionForm = () => {
    setMemberId('');
    setCategory('TITHE');
    setAmount('');
    setPaymentMethod('CASH');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setExpenseVendor('');
    setEditingContribution(null);
  };

  const handleContributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;

    // Handle "EXPENSE" category selection inside Record Contribution
    if (category === 'EXPENSE') {
      try {
        setIsSubmitting(true);
        const expData = {
          title: notes.trim() || 'Church Expense',
          category: 'OTHER' as ExpenseCategory,
          amount: Number(amount),
          paymentMethod,
          expenseDate: transactionDate || new Date().toISOString(),
          vendorName: expenseVendor.trim() || (memberId ? members.find(m => m.id === memberId)?.firstName : null),
          description: notes.trim() || null
        };
        const createdExp = await api.createExpense(expData);
        setExpenses(prev => [createdExp, ...prev]);
        resetContributionForm();
        setShowAddModal(false);
      } catch (err: any) {
        alert(err.message || 'Failed to record expense');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const data = {
      memberId: memberId || null,
      sessionId: session?.id || null,
      category,
      amount: Number(amount),
      paymentMethod,
      transactionDate: transactionDate || new Date().toISOString(),
      notes: notes.trim() || null
    };

    try {
      setIsSubmitting(true);
      if (editingContribution && onUpdateContribution) {
        await onUpdateContribution(editingContribution.id, data);
      } else {
        await onRecordContribution(data);
      }

      // If statement modal is open, refresh statement
      if (statementMember) {
        await loadMemberStatement(statementMember);
      }

      resetContributionForm();
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContribution = async (c: FinancialContribution) => {
    const memberName = c.member ? `${c.member.firstName} ${c.member.lastName}` : 'Anonymous';
    if (!window.confirm(`Delete this GH₵${Number(c.amount).toFixed(2)} ${c.category} contribution from ${memberName}? This cannot be undone.`)) return;
    try {
      if (onDeleteContribution) {
        await onDeleteContribution(c.id);
        if (statementMember) {
          await loadMemberStatement(statementMember);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete contribution');
    }
  };

  // Expense form helpers
  const openAddExpense = () => {
    setEditingExpense(null);
    setExpTitle(''); setExpCategory('OTHER'); setExpAmount('');
    setExpPayMethod('CASH'); setExpDate(new Date().toISOString().split('T')[0]);
    setExpVendor(''); setExpAuthorized(''); setExpReceipt(''); setExpDescription('');
    setShowExpenseModal(true);
  };

  const openEditExpense = (e: ChurchExpense) => {
    setEditingExpense(e);
    setExpTitle(e.title);
    setExpCategory(e.category);
    setExpAmount(String(Number(e.amount)));
    setExpPayMethod(e.paymentMethod);
    setExpDate(e.expenseDate.split('T')[0]);
    setExpVendor(e.vendorName || '');
    setExpAuthorized(e.authorizedBy || '');
    setExpReceipt(e.receiptNumber || '');
    setExpDescription(e.description || '');
    setShowExpenseModal(true);
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || !expAmount || isNaN(Number(expAmount)) || Number(expAmount) <= 0) return;
    const data = {
      title: expTitle.trim(),
      category: expCategory,
      amount: Number(expAmount),
      paymentMethod: expPayMethod,
      expenseDate: expDate || new Date().toISOString(),
      vendorName: expVendor.trim() || null,
      authorizedBy: expAuthorized.trim() || null,
      receiptNumber: expReceipt.trim() || null,
      description: expDescription.trim() || null
    };
    try {
      setIsSubmittingExpense(true);
      if (editingExpense) {
        const updated = await api.updateExpense(editingExpense.id, data);
        setExpenses(prev => prev.map(ex => ex.id === editingExpense.id ? updated : ex));
      } else {
        const created = await api.createExpense(data);
        setExpenses(prev => [created, ...prev]);
      }
      setShowExpenseModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save expense');
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const handleDeleteExpense = async (exp: ChurchExpense) => {
    if (!window.confirm(`Delete "${exp.title}" expense of GH₵${Number(exp.amount).toFixed(2)}? This cannot be undone.`)) return;
    try {
      await api.deleteExpense(exp.id);
      setExpenses(prev => prev.filter(e => e.id !== exp.id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  const filteredContributions = contributions.filter(c =>
    categoryFilter === 'ALL' || c.category === categoryFilter
  );

  const filteredExpenses = expenses.filter(e =>
    expenseCatFilter === 'ALL' || e.category === expenseCatFilter
  );

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const netBalance = Number(summary?.totalAmount || 0) - totalExpenses;

  return (
    <div className="space-y-6">
      {/* ── Top Banner ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Church Finances & Treasury</h2>
            <p className="text-xs text-slate-500">
              Manage contributions, church expenses, member giving records, and track net cash balance
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {canEdit && (
            <>
              <button
                onClick={() => { resetContributionForm(); setShowAddModal(true); }}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Record Contribution</span>
              </button>
              <button
                onClick={openAddExpense}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold transition shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Record Expense</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-sm">
          <div className="flex items-center space-x-2 mb-1">
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Inflow</span>
          </div>
          <span className="text-3xl font-extrabold text-white block">
            GH₵ {Number(summary?.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-emerald-400 mt-1 block font-semibold">
            {summary?.recordCount || 0} contributions recorded
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-rose-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-1">
            <ArrowDownLeft className="w-4 h-4 text-rose-500" />
            <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider">Total Expenses</span>
          </div>
          <span className="text-3xl font-extrabold text-rose-700 block">
            GH₵ {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">
            {expenses.length} church expense entries
          </span>
        </div>

        <div className={`p-5 rounded-3xl border shadow-sm ${netBalance >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
          <div className="flex items-center space-x-2 mb-1">
            {netBalance >= 0
              ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span className={`text-[11px] font-bold uppercase tracking-wider ${netBalance >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
              Net Balance
            </span>
          </div>
          <span className={`text-3xl font-extrabold block ${netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            GH₵ {Math.abs(netBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className={`text-[11px] mt-1 block font-medium ${netBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {netBalance >= 0 ? 'Net Surplus' : 'Net Deficit'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-blue-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-1">
            <Receipt className="w-4 h-4 text-blue-600" />
            <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">Tithes</span>
          </div>
          <span className="text-3xl font-extrabold text-blue-700 block">
            GH₵ {Number(summary?.categoryTotals?.TITHE || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">Covenant tithes</span>
        </div>
      </div>

      {/* ── Cell Comparison ── */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span>Giving Comparison Across Cells (Joy, Faith, Hope, Love)</span>
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {([['JOY', 'Joy Cell', 'amber'], ['FAITH', 'Faith Cell', 'blue'], ['HOPE', 'Hope Cell', 'emerald'], ['LOVE', 'Love Cell', 'rose']] as const).map(([key, label, color]) => (
            <div key={key} className={`p-4 rounded-2xl bg-${color}-50/70 border border-${color}-200 space-y-1`}>
              <span className={`font-bold text-xs text-${color}-900 uppercase tracking-wider block`}>{label}</span>
              <div className={`text-2xl font-extrabold text-${color}-800`}>
                GH₵ {Number(summary?.cellComparison?.[key] ?? 0).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Tab Switcher ── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center border-b border-slate-200 bg-slate-50 overflow-x-auto">
          <button
            onClick={() => setMainTab('contributions')}
            className={`flex items-center space-x-2 px-6 py-4 text-xs font-bold transition border-b-2 cursor-pointer whitespace-nowrap ${
              mainTab === 'contributions'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Contributions & Income</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${mainTab === 'contributions' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
              {contributions.length}
            </span>
          </button>

          <button
            onClick={() => setMainTab('expenses')}
            className={`flex items-center space-x-2 px-6 py-4 text-xs font-bold transition border-b-2 cursor-pointer whitespace-nowrap ${
              mainTab === 'expenses'
                ? 'border-rose-500 text-rose-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Church Expenses</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${mainTab === 'expenses' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-500'}`}>
              {expenses.length}
            </span>
          </button>

          <button
            onClick={() => setMainTab('members')}
            className={`flex items-center space-x-2 px-6 py-4 text-xs font-bold transition border-b-2 cursor-pointer whitespace-nowrap ${
              mainTab === 'members'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <UsersIcon className="w-4 h-4" />
            <span>Member Financial Records</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${mainTab === 'members' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
              {members.length}
            </span>
          </button>
        </div>

        {/* ──── TAB 1: CONTRIBUTIONS TABLE ──── */}
        {mainTab === 'contributions' && (
          <>
            {/* Category Filters */}
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-1.5 overflow-x-auto">
                {['ALL', 'TITHE', 'OFFERING', 'WELFARE', 'BUILDING_PROJECT', 'THANKSGIVING', 'SPECIAL_SEED'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap cursor-pointer ${
                      categoryFilter === cat ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-500 font-semibold">{filteredContributions.length} record(s)</span>
            </div>

            {filteredContributions.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <DollarSign className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-600">No contributions recorded</p>
                <p className="text-xs">Use "Record Contribution" to add entries.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200 uppercase text-[11px]">
                    <tr>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-4 py-3.5">Contributor</th>
                      <th className="px-4 py-3.5">Cell</th>
                      <th className="px-4 py-3.5">Category</th>
                      <th className="px-4 py-3.5">Mode</th>
                      <th className="px-4 py-3.5 text-right">Amount (GH₵)</th>
                      <th className="px-4 py-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredContributions.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition group">
                        <td className="px-6 py-4 font-semibold text-slate-700">
                          {new Date(c.transactionDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-4 py-4">
                          {c.member ? (
                            <button
                              onClick={() => c.member && loadMemberStatement(c.member as any)}
                              className="flex items-center space-x-2.5 text-left hover:text-blue-600 transition group/btn cursor-pointer"
                            >
                              {c.member.photoUrl
                                ? <img src={c.member.photoUrl} alt="" className="w-7 h-7 rounded-lg object-cover" />
                                : <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white ${
                                    c.member.churchGroup === 'JOY' ? 'bg-amber-500' : c.member.churchGroup === 'FAITH' ? 'bg-blue-600' : c.member.churchGroup === 'HOPE' ? 'bg-emerald-600' : 'bg-rose-600'
                                  }`}>{c.member.firstName[0]}</div>
                              }
                              <span className="font-extrabold text-slate-900 group-hover/btn:underline">{c.member.firstName} {c.member.lastName}</span>
                            </button>
                          ) : (
                            <span className="text-slate-500 italic">General / Anonymous</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {c.member ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              c.member.churchGroup === 'JOY' ? 'bg-amber-100 text-amber-800' :
                              c.member.churchGroup === 'FAITH' ? 'bg-blue-100 text-blue-800' :
                              c.member.churchGroup === 'HOPE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>{c.member.churchGroup}</span>
                          ) : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                            {c.category.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-600 font-medium">
                          {c.paymentMethod.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-4 text-right font-extrabold text-sm text-slate-900">
                          GH₵ {Number(c.amount).toFixed(2)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => setSelectedReceipt(c)}
                              title="Print Receipt"
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            {canEdit && (
                              <>
                                <button
                                  onClick={() => openEditContribution(c)}
                                  title="Edit Contribution"
                                  className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteContribution(c)}
                                  title="Delete Contribution"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ──── TAB 2: CHURCH EXPENSES TABLE ──── */}
        {mainTab === 'expenses' && (
          <>
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-1.5 overflow-x-auto">
                {(['ALL', ...Object.keys(EXPENSE_CATEGORY_LABELS)] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setExpenseCatFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap cursor-pointer ${
                      expenseCatFilter === cat ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'ALL' ? 'All Expenses' : EXPENSE_CATEGORY_LABELS[cat as ExpenseCategory]}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                Total: GH₵ {filteredExpenses.reduce((s, e) => s + Number(e.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            {isLoadingExpenses ? (
              <div className="py-16 text-center text-slate-400 space-y-3">
                <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold">Loading expenses...</p>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <ShoppingCart className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-600">No expenses recorded</p>
                <p className="text-xs">Use "Record Expense" to add church expenditures.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200 uppercase text-[11px]">
                    <tr>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-4 py-3.5">Title / Description</th>
                      <th className="px-4 py-3.5">Category</th>
                      <th className="px-4 py-3.5">Vendor / Payee</th>
                      <th className="px-4 py-3.5">Authorized By</th>
                      <th className="px-4 py-3.5">Mode</th>
                      <th className="px-4 py-3.5 text-right">Amount (GH₵)</th>
                      {canEdit && <th className="px-4 py-3.5 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-rose-50/40 transition group">
                        <td className="px-6 py-4 font-semibold text-slate-700">
                          {new Date(exp.expenseDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-extrabold text-slate-900">{exp.title}</div>
                          {exp.description && <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{exp.description}</div>}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold ${EXPENSE_CATEGORY_COLORS[exp.category]}`}>
                            {EXPENSE_CATEGORY_ICONS[exp.category]}
                            <span>{EXPENSE_CATEGORY_LABELS[exp.category]}</span>
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-600 font-medium">
                          {exp.vendorName || <span className="text-slate-400 italic">—</span>}
                        </td>
                        <td className="px-4 py-4 text-slate-600 font-medium">
                          {exp.authorizedBy || <span className="text-slate-400 italic">—</span>}
                        </td>
                        <td className="px-4 py-4 text-slate-600 font-medium">
                          {exp.paymentMethod.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-4 text-right font-extrabold text-sm text-rose-700">
                          GH₵ {Number(exp.amount).toFixed(2)}
                        </td>
                        {canEdit && (
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => openEditExpense(exp)}
                                title="Edit Expense"
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(exp)}
                                title="Delete Expense"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-rose-200 bg-rose-50/60">
                    <tr>
                      <td colSpan={6} className="px-6 py-3 font-extrabold text-xs text-rose-900 uppercase tracking-wider">Total Expenses</td>
                      <td className="px-4 py-3 text-right font-extrabold text-base text-rose-700">
                        GH₵ {filteredExpenses.reduce((s, e) => s + Number(e.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      {canEdit && <td />}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        )}

        {/* ──── TAB 3: MEMBER FINANCIAL DIRECTORY ──── */}
        {mainTab === 'members' && (
          <>
            {/* Search and Cell Filter */}
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search member by name, phone, code..."
                    value={memberSearchTerm}
                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-1.5 overflow-x-auto">
                {['ALL', 'JOY', 'FAITH', 'HOPE', 'LOVE'].map((cell) => (
                  <button
                    key={cell}
                    onClick={() => setMemberCellFilter(cell)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap cursor-pointer ${
                      memberCellFilter === cell
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cell === 'ALL' ? 'All Cells' : `${cell} Cell`}
                  </button>
                ))}
              </div>
            </div>

            {filteredMembers.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <UsersIcon className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-600">No members found</p>
                <p className="text-xs">Try adjusting your search query or cell filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200 uppercase text-[11px]">
                    <tr>
                      <th className="px-6 py-3.5">Member Details</th>
                      <th className="px-4 py-3.5">Cell</th>
                      <th className="px-4 py-3.5">Phone</th>
                      <th className="px-4 py-3.5 text-right">Total Tithes</th>
                      <th className="px-4 py-3.5 text-right">Total Welfare</th>
                      <th className="px-4 py-3.5 text-right">Total Given</th>
                      <th className="px-6 py-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMembers.map((m) => {
                      const fin = memberFinancialMap.get(m.id) || { totalGiven: 0, tithes: 0, welfare: 0, offerings: 0, count: 0 };
                      return (
                        <tr key={m.id} className="hover:bg-blue-50/30 transition group">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              {m.photoUrl ? (
                                <img src={m.photoUrl} alt="" className="w-9 h-9 rounded-xl object-cover border" />
                              ) : (
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs text-white shadow-sm ${
                                    m.churchGroup === 'JOY'
                                      ? 'bg-amber-500'
                                      : m.churchGroup === 'FAITH'
                                      ? 'bg-blue-600'
                                      : m.churchGroup === 'HOPE'
                                      ? 'bg-emerald-600'
                                      : 'bg-rose-600'
                                  }`}
                                >
                                  {m.firstName[0]}
                                  {m.lastName[0]}
                                </div>
                              )}
                              <div>
                                <span className="font-extrabold text-slate-900 block">
                                  {m.firstName} {m.lastName}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {m.memberCode || 'CACI'} • {m.role}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                m.churchGroup === 'JOY'
                                  ? 'bg-amber-100 text-amber-800'
                                  : m.churchGroup === 'FAITH'
                                  ? 'bg-blue-100 text-blue-800'
                                  : m.churchGroup === 'HOPE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {m.churchGroup} Cell
                            </span>
                          </td>
                          <td className="px-4 py-4 text-slate-600 font-medium font-mono text-[11px]">
                            {m.phone || <span className="text-slate-400 italic font-sans">—</span>}
                          </td>
                          <td className="px-4 py-4 text-right font-extrabold text-blue-700">
                            GH₵ {fin.tithes.toFixed(2)}
                          </td>
                          <td className="px-4 py-4 text-right font-extrabold text-emerald-700">
                            GH₵ {fin.welfare.toFixed(2)}
                          </td>
                          <td className="px-4 py-4 text-right font-black text-sm text-slate-900">
                            GH₵ {fin.totalGiven.toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => loadMemberStatement(m)}
                                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-[11px] transition flex items-center space-x-1 cursor-pointer"
                                title="View Member Financial Statement"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Statement</span>
                              </button>

                              {canEdit && (
                                <button
                                  onClick={() => openAddContributionForMember(m.id)}
                                  className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-[11px] transition cursor-pointer"
                                  title={`Record Payment for ${m.firstName}`}
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Member Financial Statement Modal ── */}
      {statementMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col my-auto border border-slate-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-xl">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">
                    Financial Giving Statement
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {statementMember.firstName} {statementMember.lastName} ({statementMember.memberCode || 'CACI'}) • {statementMember.churchGroup} Cell
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {canEdit && (
                  <button
                    onClick={() => openAddContributionForMember(statementMember.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Payment</span>
                  </button>
                )}
                <button
                  onClick={() => setStatementMember(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {isLoadingStatement ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-semibold">Loading giving records...</p>
                </div>
              ) : (
                <>
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-slate-900 text-white rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Lifetime Given</span>
                      <span className="text-xl font-extrabold mt-0.5 block">
                        GH₵ {Number(statementData?.statement?.totalGiven || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl">
                      <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">Tithes Paid</span>
                      <span className="text-xl font-extrabold text-blue-800 mt-0.5 block">
                        GH₵ {((statementData?.statement?.contributions || []).filter((c: any) => c.category === 'TITHE').reduce((s: number, c: any) => s + Number(c.amount), 0)).toFixed(2)}
                      </span>
                    </div>

                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                      <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">Welfare Paid</span>
                      <span className="text-xl font-extrabold text-emerald-800 mt-0.5 block">
                        GH₵ {((statementData?.statement?.contributions || []).filter((c: any) => c.category === 'WELFARE').reduce((s: number, c: any) => s + Number(c.amount), 0)).toFixed(2)}
                      </span>
                    </div>

                    <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl">
                      <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">Total Contributions</span>
                      <span className="text-xl font-extrabold text-purple-800 mt-0.5 block">
                        {(statementData?.statement?.contributions || []).length} record(s)
                      </span>
                    </div>
                  </div>

                  {/* Contributions History Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                        Giving History & Payments
                      </h4>
                      <span className="text-[11px] text-slate-400 font-semibold">
                        {(statementData?.statement?.contributions || []).length} entries
                      </span>
                    </div>

                    {(statementData?.statement?.contributions || []).length === 0 ? (
                      <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                        <p className="text-xs font-bold">No contributions recorded for this member</p>
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                            <tr>
                              <th className="px-4 py-2.5">Date</th>
                              <th className="px-3 py-2.5">Category</th>
                              <th className="px-3 py-2.5">Payment Mode</th>
                              <th className="px-3 py-2.5">Notes</th>
                              <th className="px-3 py-2.5 text-right">Amount (GH₵)</th>
                              <th className="px-3 py-2.5 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(statementData?.statement?.contributions || []).map((c: any) => (
                              <tr key={c.id} className="hover:bg-slate-50">
                                <td className="px-4 py-2.5 font-medium text-slate-700">
                                  {new Date(c.transactionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[10px]">
                                    {c.category.replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-slate-600 font-medium">
                                  {c.paymentMethod.replace(/_/g, ' ')}
                                </td>
                                <td className="px-3 py-2.5 text-slate-500 text-[11px]">
                                  {c.notes || '—'}
                                </td>
                                <td className="px-3 py-2.5 text-right font-extrabold text-slate-900">
                                  GH₵ {Number(c.amount).toFixed(2)}
                                </td>
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center justify-center space-x-1">
                                    <button
                                      onClick={() => setSelectedReceipt({ ...c, member: statementMember })}
                                      title="Print Receipt"
                                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                    </button>
                                    {canEdit && (
                                      <>
                                        <button
                                          onClick={() => openEditContribution({ ...c, member: statementMember })}
                                          title="Edit"
                                          className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteContribution({ ...c, member: statementMember })}
                                          title="Delete"
                                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Pledges & Campaigns Table */}
                  {(statementData?.member?.pledges || []).length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                        Active Pledges & Harvests
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {statementData.member.pledges.map((p: any) => {
                          const pledged = Number(p.pledgedAmount);
                          const paid = Number(p.amountPaid);
                          const pct = pledged > 0 ? Math.min(100, Math.round((paid / pledged) * 100)) : 0;
                          return (
                            <div key={p.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-xs text-slate-900">{p.campaign?.title || 'Pledge Campaign'}</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border text-slate-700">{p.status}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">Paid: <strong className="text-emerald-700">GH₵ {paid.toFixed(2)}</strong></span>
                                <span className="text-slate-500">Target: <strong className="text-slate-800">GH₵ {pledged.toFixed(2)}</strong></span>
                              </div>
                              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Contribution Modal (Add / Edit) ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-base">
                {editingContribution ? 'Edit Contribution Record' : 'Record Financial Transaction'}
              </h3>
              <button onClick={() => { resetContributionForm(); setShowAddModal(false); }} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleContributionSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Date *</label>
                <input type="date" required value={transactionDate} onChange={e => setTransactionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contributor (Member)</label>
                <select value={memberId} onChange={e => setMemberId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                  <option value="">General Offering / Anonymous</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.churchGroup} Cell)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                <select value={category} onChange={e => setCategory(e.target.value as FinancialCategory)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                  <option value="TITHE">Tithe</option>
                  <option value="OFFERING">Sunday Offering</option>
                  <option value="WELFARE">Welfare Dues / Fund</option>
                  <option value="THANKSGIVING">Thanksgiving Seed</option>
                  <option value="BUILDING_PROJECT">Building & Project Fund</option>
                  <option value="SPECIAL_SEED">Special Seed</option>
                  <option value="EXPENSE">🔴 Church Expense / Outflow</option>
                </select>
              </div>

              {category === 'EXPENSE' && (
                <div>
                  <label className="block text-xs font-bold text-rose-800 mb-1">Paid To / Vendor / Beneficiary</label>
                  <input type="text" placeholder="e.g. ECG Power / Cleaners" value={expenseVendor} onChange={e => setExpenseVendor(e.target.value)}
                    className="w-full px-3 py-2 border border-rose-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount (GH₵) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold text-sm">GH₵</span>
                  <input type="number" step="0.01" min="0.10" required placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)}
                    className="w-full pl-14 pr-3 py-2 border border-slate-300 rounded-xl text-base font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                  <option value="CASH">Cash</option>
                  <option value="MOBILE_MONEY">Mobile Money (MoMo)</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {category === 'EXPENSE' ? 'Expense Purpose / Description' : 'Notes / Purpose'}
                </label>
                <input type="text" placeholder={category === 'EXPENSE' ? 'e.g. Electricity bill September' : 'e.g. March 2026 tithe'} value={notes} onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-3">
                <button type="button" onClick={() => { resetContributionForm(); setShowAddModal(false); }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSubmitting}
                  className={`px-5 py-2 text-white font-extrabold text-xs rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer ${
                    category === 'EXPENSE' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}>
                  {isSubmitting ? 'Saving...' : editingContribution ? 'Update Record' : category === 'EXPENSE' ? 'Record Expense' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Expense Modal (Add / Edit) ── */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="bg-rose-900 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
              <h3 className="font-extrabold text-base flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5" />
                <span>{editingExpense ? 'Edit Church Expense' : 'Record Church Expense'}</span>
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="p-1 rounded-lg hover:bg-rose-800 text-rose-200 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expense Title *</label>
                <input type="text" required placeholder="e.g. PURC Electricity Bill – September 2026" value={expTitle} onChange={e => setExpTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-400 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select value={expCategory} onChange={e => setExpCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-400 focus:outline-none">
                    {Object.entries(EXPENSE_CATEGORY_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expense Date *</label>
                  <input type="date" required value={expDate} onChange={e => setExpDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-rose-400 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount (GH₵) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold text-sm">GH₵</span>
                  <input type="number" step="0.01" min="0.01" required placeholder="0.00" value={expAmount} onChange={e => setExpAmount(e.target.value)}
                    className="w-full pl-14 pr-3 py-2 border border-slate-300 rounded-xl text-base font-extrabold text-slate-900 focus:ring-2 focus:ring-rose-400 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                <select value={expPayMethod} onChange={e => setExpPayMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-400 focus:outline-none">
                  <option value="CASH">Cash</option>
                  <option value="MOBILE_MONEY">Mobile Money (MoMo)</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vendor / Payee</label>
                  <input type="text" placeholder="e.g. Ghana Grid Co." value={expVendor} onChange={e => setExpVendor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Authorized By</label>
                  <input type="text" placeholder="e.g. Pastor / Elder" value={expAuthorized} onChange={e => setExpAuthorized(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-400 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Receipt / Invoice Number</label>
                <input type="text" placeholder="e.g. INV-20260901-004" value={expReceipt} onChange={e => setExpReceipt(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Remarks</label>
                <textarea placeholder="Additional details about this expense..." value={expDescription} onChange={e => setExpDescription(e.target.value)} rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-400 focus:outline-none resize-none" />
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSubmittingExpense}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer">
                  {isSubmittingExpense ? 'Saving...' : editingExpense ? 'Update Expense' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ReceiptModal contribution={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
    </div>
  );
};
