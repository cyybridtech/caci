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
  ChevronRight,
  History,
  ShieldCheck,
  Award,
  Sparkles,
  Filter,
  Clock,
  Banknote,
  RefreshCw
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
  ChurchGroup,
  ServiceFinancialAuditRecord,
  ServicesFinancialAuditResponse
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

type MainTab = 'contributions' | 'audit' | 'expenses' | 'members';

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
  const [contributorType, setContributorType] = useState<'MEMBER' | 'GENERAL_OFFERING' | 'ANONYMOUS'>('MEMBER');
  const [contributorSearchTerm, setContributorSearchTerm] = useState<string>('');
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

  // ─── Desk View Scope: Active Service Session vs All-Time Treasury ───
  const [deskScope, setDeskScope] = useState<'THIS_SERVICE' | 'ALL_TIME'>('THIS_SERVICE');

  // Filter contributions specifically for the active service session
  const currentServiceContributions = useMemo(() => {
    if (!session?.id) return [];
    return contributions.filter((c) => c.sessionId === session.id);
  }, [contributions, session]);

  const currentServiceTotal = useMemo(() => {
    return currentServiceContributions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }, [currentServiceContributions]);

  const currentServiceTithes = useMemo(() => {
    return currentServiceContributions
      .filter((c) => c.category === 'TITHE')
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }, [currentServiceContributions]);

  const currentServiceOfferings = useMemo(() => {
    return currentServiceContributions
      .filter((c) => c.category === 'OFFERING')
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }, [currentServiceContributions]);

  const currentServiceCellBreakdown = useMemo(() => {
    const cells = { JOY: 0, FAITH: 0, HOPE: 0, LOVE: 0, GENERAL: 0 };
    for (const c of currentServiceContributions) {
      const amt = Number(c.amount) || 0;
      if (c.member && c.member.churchGroup && cells[c.member.churchGroup] !== undefined) {
        cells[c.member.churchGroup] += amt;
      } else {
        cells.GENERAL += amt;
      }
    }
    return cells;
  }, [currentServiceContributions]);

  // ─── Service Financial Audit Tab State ───
  const [auditData, setAuditData] = useState<ServicesFinancialAuditResponse | null>(null);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  const [auditTypeFilter, setAuditTypeFilter] = useState('ALL');
  const [selectedAuditRecord, setSelectedAuditRecord] = useState<ServiceFinancialAuditRecord | null>(null);
  const [isPrintSlipOpen, setIsPrintSlipOpen] = useState(false);

  const loadAuditData = async (searchTerm?: string) => {
    try {
      setIsLoadingAudit(true);
      const res = await api.getServicesFinancialAudit(searchTerm ?? auditSearchTerm);
      setAuditData(res);
    } catch (err) {
      console.error('Failed to load services financial audit:', err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (mainTab === 'audit') {
      loadAuditData();
    }
  }, [mainTab]);

  const [auditLedgerCategoryFilter, setAuditLedgerCategoryFilter] = useState('ALL');
  const [auditLedgerSearchTerm, setAuditLedgerSearchTerm] = useState('');

  const filteredAuditServices = useMemo(() => {
    if (!auditData?.services) return [];
    return auditData.services.filter((s) => {
      if (auditTypeFilter !== 'ALL') {
        const type = s.session.serviceType.toLowerCase();
        if (auditTypeFilter === 'SUNDAY' && !type.includes('sunday')) return false;
        if (auditTypeFilter === 'MIDWEEK' && !type.includes('midweek') && !type.includes('wednesday') && !type.includes('teaching')) return false;
        if (auditTypeFilter === 'ALL_NIGHT' && !type.includes('night') && !type.includes('vigil')) return false;
      }
      if (auditSearchTerm.trim()) {
        const q = auditSearchTerm.toLowerCase().trim();
        const type = (s.session.serviceType || '').toLowerCase();
        const theme = (s.session.theme || '').toLowerCase();
        const date = new Date(s.session.serviceDate).toLocaleDateString().toLowerCase();
        const notes = (s.session.notes || '').toLowerCase();
        return type.includes(q) || theme.includes(q) || date.includes(q) || notes.includes(q);
      }
      return true;
    });
  }, [auditData, auditTypeFilter, auditSearchTerm]);

  const filteredAuditRecordContributions = useMemo(() => {
    if (!selectedAuditRecord?.contributions) return [];
    return selectedAuditRecord.contributions.filter((c) => {
      if (auditLedgerCategoryFilter !== 'ALL' && c.category !== auditLedgerCategoryFilter) return false;
      if (auditLedgerSearchTerm.trim()) {
        const q = auditLedgerSearchTerm.toLowerCase().trim();
        const name = c.member ? `${c.member.firstName} ${c.member.lastName}`.toLowerCase() : 'general anonymous';
        const code = (c.member?.memberCode || '').toLowerCase();
        const notes = (c.notes || '').toLowerCase();
        return name.includes(q) || code.includes(q) || notes.includes(q);
      }
      return true;
    });
  }, [selectedAuditRecord, auditLedgerCategoryFilter, auditLedgerSearchTerm]);

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

  // Filtered members for contribution modal search
  const searchedMembersForContribution = useMemo(() => {
    if (!contributorSearchTerm.trim()) {
      return members.slice(0, 8);
    }
    const q = contributorSearchTerm.toLowerCase().trim();
    return members.filter(
      (m) =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
        (m.phone || '').includes(q) ||
        (m.memberCode || '').toLowerCase().includes(q) ||
        (m.churchGroup || '').toLowerCase().includes(q)
    ).slice(0, 12);
  }, [members, contributorSearchTerm]);

  const selectedContributionMember = useMemo(() => {
    return members.find((m) => m.id === memberId) || null;
  }, [members, memberId]);

  // Open contribution edit
  const openEditContribution = (c: FinancialContribution) => {
    setEditingContribution(c);
    if (c.memberId) {
      setContributorType('MEMBER');
      setMemberId(c.memberId);
    } else if (c.category === 'OFFERING') {
      setContributorType('GENERAL_OFFERING');
      setMemberId('');
    } else {
      setContributorType('ANONYMOUS');
      setMemberId('');
    }
    setContributorSearchTerm('');
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
      setContributorType('MEMBER');
      setMemberId(targetMemberId);
    }
    setShowAddModal(true);
  };

  const resetContributionForm = () => {
    setMemberId('');
    setContributorType('MEMBER');
    setContributorSearchTerm('');
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

    const finalMemberId = contributorType === 'MEMBER' && memberId ? memberId : null;
    let finalNotes = notes.trim() || null;
    if (contributorType === 'GENERAL_OFFERING' && !finalNotes) {
      finalNotes = 'General Congregation Offering';
    } else if (contributorType === 'ANONYMOUS' && !finalNotes) {
      finalNotes = 'Anonymous Giver';
    }

    const data = {
      memberId: finalMemberId,
      sessionId: session?.id || null,
      category,
      amount: Number(amount),
      paymentMethod,
      transactionDate: transactionDate || new Date().toISOString(),
      notes: finalNotes
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

      {/* ── Financial Scope Switcher ── */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setDeskScope('THIS_SERVICE')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
              deskScope === 'THIS_SERVICE'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Active Service Inflow</span>
            {session && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-bold">
                {currentServiceContributions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setDeskScope('ALL_TIME')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
              deskScope === 'ALL_TIME'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>All-Time Treasury</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-semibold flex items-center space-x-2">
          {deskScope === 'THIS_SERVICE' ? (
            session ? (
              <span className="flex items-center space-x-1.5 text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Current Service: {session.serviceType} ({new Date(session.serviceDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })})
                </span>
              </span>
            ) : (
              <span className="text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 font-bold">
                No active service selected. All records shown.
              </span>
            )
          ) : (
            <span className="text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 font-bold">
              Cumulative treasury balance across all church history
            </span>
          )}
        </div>
      </div>

      {/* ── Summary Cards ── */}
      {deskScope === 'THIS_SERVICE' && session ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-emerald-950 text-white p-5 rounded-3xl border border-emerald-800 shadow-sm">
            <div className="flex items-center space-x-2 mb-1">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Today's Service Inflow</span>
            </div>
            <span className="text-3xl font-extrabold text-white block">
              GH₵ {currentServiceTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-emerald-400 mt-1 block font-semibold">
              {currentServiceContributions.length} contributions for this service
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-blue-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-1">
              <Receipt className="w-4 h-4 text-blue-600" />
              <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">Service Tithes</span>
            </div>
            <span className="text-3xl font-extrabold text-blue-700 block">
              GH₵ {currentServiceTithes.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block font-medium">Covenant tithes paid today</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-1">
              <Gift className="w-4 h-4 text-amber-600" />
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Service Offering</span>
            </div>
            <span className="text-3xl font-extrabold text-amber-700 block">
              GH₵ {currentServiceOfferings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block font-medium">General congregation offering</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-purple-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-1">
              <Heart className="w-4 h-4 text-purple-600" />
              <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">Other Collections</span>
            </div>
            <span className="text-3xl font-extrabold text-purple-700 block">
              GH₵ {Math.max(0, currentServiceTotal - currentServiceTithes - currentServiceOfferings).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block font-medium">Welfare, seeds & thanksgiving</span>
          </div>
        </div>
      ) : (
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
      )}

      {/* ── Cell Comparison ── */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span>
            {deskScope === 'THIS_SERVICE' && session
              ? `Service Giving by Cell: ${session.serviceType}`
              : 'All-Time Giving Comparison Across Cells (Joy, Faith, Hope, Love)'}
          </span>
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {([['JOY', 'Joy Cell', 'amber'], ['FAITH', 'Faith Cell', 'blue'], ['HOPE', 'Hope Cell', 'emerald'], ['LOVE', 'Love Cell', 'rose']] as const).map(([key, label, color]) => {
            const val = deskScope === 'THIS_SERVICE' && session
              ? currentServiceCellBreakdown[key]
              : Number(summary?.cellComparison?.[key] ?? 0);
            return (
              <div key={key} className={`p-4 rounded-2xl bg-${color}-50/70 border border-${color}-200 space-y-1`}>
                <span className={`font-bold text-xs text-${color}-900 uppercase tracking-wider block`}>{label}</span>
                <div className={`text-2xl font-extrabold text-${color}-800`}>
                  GH₵ {val.toFixed(2)}
                </div>
              </div>
            );
          })}
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
            <span>Contributions & Inflow</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${mainTab === 'contributions' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
              {contributions.length}
            </span>
          </button>

          <button
            onClick={() => setMainTab('audit')}
            className={`flex items-center space-x-2 px-6 py-4 text-xs font-bold transition border-b-2 cursor-pointer whitespace-nowrap ${
              mainTab === 'audit'
                ? 'border-purple-600 text-purple-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <History className="w-4 h-4 text-purple-600" />
            <span>Service Financial Audit</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${mainTab === 'audit' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-500'}`}>
              {auditData?.services ? auditData.services.length : 'Audits'}
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

        {/* ──── TAB: SERVICE FINANCIAL AUDIT (TRACKING GAINS PER SERVICE ACROSS HISTORY) ──── */}
        {mainTab === 'audit' && (
          <div className="p-6 space-y-6">
            {/* Top KPI Cards for Audit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Services Audited
                  </span>
                </div>
                <span className="text-3xl font-extrabold text-white block">
                  {auditData?.summary?.totalServicesAudited || 0}
                </span>
                <span className="text-[11px] text-purple-300 mt-1 block font-semibold">
                  Historical worship services
                </span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                    Total Gained Across Services
                  </span>
                </div>
                <span className="text-3xl font-extrabold text-emerald-700 block">
                  GH₵ {Number(auditData?.summary?.cumulativeGainedAllServices || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block font-medium">
                  Cumulative collections verified
                </span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-blue-200 shadow-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                    Average Gained / Service
                  </span>
                </div>
                <span className="text-3xl font-extrabold text-blue-700 block">
                  GH₵ {Number(auditData?.summary?.averageGainedPerService || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block font-medium">
                  Typical Sunday / Midweek intake
                </span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                    Highest Single Service
                  </span>
                </div>
                <span className="text-3xl font-extrabold text-amber-700 block">
                  GH₵ {Number(auditData?.summary?.highestSingleServiceGained || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block font-medium truncate" title={auditData?.summary?.highestGainedSessionTitle}>
                  {auditData?.summary?.highestGainedSessionTitle || 'N/A'}
                </span>
              </div>
            </div>

            {/* Audit Toolbar: Search, Filters, Refresh */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search service type, theme, or notes..."
                  value={auditSearchTerm}
                  onChange={(e) => setAuditSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: 'ALL', label: 'All Services' },
                  { key: 'SUNDAY', label: 'Sunday Divine' },
                  { key: 'MIDWEEK', label: 'Midweek' },
                  { key: 'ALL_NIGHT', label: 'All-Night' }
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setAuditTypeFilter(f.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                      auditTypeFilter === f.key
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}

                <button
                  onClick={() => loadAuditData()}
                  disabled={isLoadingAudit}
                  className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition cursor-pointer"
                  title="Refresh Audit Data"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingAudit ? 'animate-spin text-purple-600' : ''}`} />
                </button>
              </div>
            </div>

            {/* Services List */}
            {isLoadingAudit ? (
              <div className="py-24 text-center text-slate-400 space-y-3">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold">Auditing church services and finances...</p>
              </div>
            ) : filteredAuditServices.length === 0 ? (
              <div className="py-20 text-center text-slate-400 space-y-2 bg-white rounded-3xl border border-slate-200">
                <History className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-700">No matching service financial records found</p>
                <p className="text-xs text-slate-400">
                  Services recorded on the top header bar with financial contributions will be audited here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAuditServices.map((record) => {
                  const s = record.session;
                  const dateStr = new Date(s.serviceDate).toLocaleDateString(undefined, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <div
                      key={s.id}
                      className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4"
                    >
                      {/* Card Header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div className="flex items-start space-x-3.5">
                          <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl shrink-0 mt-0.5">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <h4 className="font-extrabold text-base text-slate-900">{s.serviceType}</h4>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 uppercase tracking-wide">
                                {dateStr}
                              </span>
                              {record.attendanceCount > 0 && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 flex items-center space-x-1">
                                  <UsersIcon className="w-3 h-3" />
                                  <span>{record.attendanceCount} Attendees</span>
                                </span>
                              )}
                            </div>
                            {s.theme && (
                              <p className="text-xs text-slate-500 font-medium mt-1">
                                Theme: <span className="font-semibold text-slate-800">"{s.theme}"</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Total Gained Highlight & Action Buttons */}
                        <div className="flex items-center space-x-3 self-end md:self-auto">
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Service Gain
                            </span>
                            <span className="text-2xl font-black text-emerald-700 block">
                              GH₵ {record.totalGained.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            {record.attendanceCount > 0 && (
                              <span className="text-[11px] text-slate-500 font-semibold block">
                                GH₵ {record.averageGivingPerAttendee.toFixed(2)} / attendee
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-200">
                            <button
                              onClick={() => setSelectedAuditRecord(record)}
                              className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                              title="Inspect Itemized Financial Ledger"
                            >
                              <Receipt className="w-4 h-4" />
                              <span>View Ledger</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedAuditRecord(record);
                                setIsPrintSlipOpen(true);
                              }}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                              title="Print Service Audit Slip"
                            >
                              <Printer className="w-4 h-4 text-slate-600" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Financial Category Breakdown Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                        <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl">
                          <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">
                            Tithes
                          </span>
                          <span className="text-base font-extrabold text-blue-800 block mt-0.5">
                            GH₵ {(record.categoryTotals.TITHE || 0).toFixed(2)}
                          </span>
                        </div>

                        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
                          <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                            Offering
                          </span>
                          <span className="text-base font-extrabold text-amber-800 block mt-0.5">
                            GH₵ {(record.categoryTotals.OFFERING || 0).toFixed(2)}
                          </span>
                        </div>

                        <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-2xl">
                          <span className="text-[10px] font-bold text-rose-900 uppercase tracking-wider block">
                            Thanksgiving
                          </span>
                          <span className="text-base font-extrabold text-rose-800 block mt-0.5">
                            GH₵ {(record.categoryTotals.THANKSGIVING || 0).toFixed(2)}
                          </span>
                        </div>

                        <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
                          <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                            Welfare
                          </span>
                          <span className="text-base font-extrabold text-emerald-800 block mt-0.5">
                            GH₵ {(record.categoryTotals.WELFARE || 0).toFixed(2)}
                          </span>
                        </div>

                        <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-2xl">
                          <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">
                            Building Fund
                          </span>
                          <span className="text-base font-extrabold text-purple-800 block mt-0.5">
                            GH₵ {(record.categoryTotals.BUILDING_PROJECT || 0).toFixed(2)}
                          </span>
                        </div>

                        <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl">
                          <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block">
                            Special Seed
                          </span>
                          <span className="text-base font-extrabold text-indigo-800 block mt-0.5">
                            GH₵ {(record.categoryTotals.SPECIAL_SEED || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Cell & Payment Method Summary Tags */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                        {/* Cell Giving */}
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">
                            Cell Giving:
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                            Joy: GH₵ {(record.cellTotals.JOY || 0).toFixed(2)}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                            Faith: GH₵ {(record.cellTotals.FAITH || 0).toFixed(2)}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                            Hope: GH₵ {(record.cellTotals.HOPE || 0).toFixed(2)}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold">
                            Love: GH₵ {(record.cellTotals.LOVE || 0).toFixed(2)}
                          </span>
                          {record.cellTotals.GENERAL > 0 && (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold">
                              General: GH₵ {record.cellTotals.GENERAL.toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* Payment Modes */}
                        <div className="flex items-center space-x-2 text-[11px] font-medium text-slate-500">
                          <span className="flex items-center space-x-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>Cash: GH₵ {(record.paymentMethodTotals.CASH || 0).toFixed(2)}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            <span>MoMo: GH₵ {(record.paymentMethodTotals.MOBILE_MONEY || 0).toFixed(2)}</span>
                          </span>
                          {record.paymentMethodTotals.BANK_TRANSFER > 0 && (
                            <span className="flex items-center space-x-1">
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                              <span>Bank: GH₵ {record.paymentMethodTotals.BANK_TRANSFER.toFixed(2)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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

              {/* Contributor Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Contributor / Source *
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setContributorType('MEMBER');
                      setContributorSearchTerm('');
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
                      contributorType === 'MEMBER'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span className="truncate">Named Member</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setContributorType('GENERAL_OFFERING');
                      setMemberId('');
                      setCategory('OFFERING');
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
                      contributorType === 'GENERAL_OFFERING'
                        ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span className="truncate">General Offering</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setContributorType('ANONYMOUS');
                      setMemberId('');
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
                      contributorType === 'ANONYMOUS'
                        ? 'bg-purple-600 text-white shadow-sm font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span className="truncate">Anonymous Giver</span>
                  </button>
                </div>

                {/* Member Search & Selection Area when MEMBER is selected */}
                {contributorType === 'MEMBER' && (
                  <div className="mt-3 space-y-2">
                    {selectedContributionMember ? (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs text-white shadow-sm ${
                              selectedContributionMember.churchGroup === 'JOY'
                                ? 'bg-amber-500'
                                : selectedContributionMember.churchGroup === 'FAITH'
                                ? 'bg-blue-600'
                                : selectedContributionMember.churchGroup === 'HOPE'
                                ? 'bg-emerald-600'
                                : 'bg-rose-600'
                            }`}
                          >
                            {selectedContributionMember.firstName[0]}
                            {selectedContributionMember.lastName[0]}
                          </div>
                          <div>
                            <span className="font-extrabold text-xs text-slate-900 block">
                              {selectedContributionMember.firstName} {selectedContributionMember.lastName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {selectedContributionMember.memberCode || 'CACI'} • {selectedContributionMember.churchGroup} Cell {selectedContributionMember.phone ? `• ${selectedContributionMember.phone}` : ''}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setMemberId('');
                            setContributorSearchTerm('');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-700 text-[11px] font-bold hover:bg-blue-100 transition cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            placeholder="Type to search member name, phone, or cell..."
                            value={contributorSearchTerm}
                            onChange={(e) => setContributorSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                          />
                        </div>

                        <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-inner">
                          {searchedMembersForContribution.length === 0 ? (
                            <div className="p-3 text-center text-slate-400 text-xs font-medium">
                              No members match "{contributorSearchTerm}"
                            </div>
                          ) : (
                            searchedMembersForContribution.map((m) => (
                              <div
                                key={m.id}
                                onClick={() => {
                                  setMemberId(m.id);
                                  setContributorSearchTerm('');
                                }}
                                className="p-2.5 hover:bg-blue-50/70 transition flex items-center justify-between cursor-pointer group"
                              >
                                <div className="flex items-center space-x-2.5">
                                  <div
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] text-white ${
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
                                  <div>
                                    <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 block">
                                      {m.firstName} {m.lastName}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      {m.churchGroup} Cell {m.phone ? `• ${m.phone}` : ''}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[10px] font-bold text-blue-600 group-hover:underline">
                                  Select →
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {contributorType === 'GENERAL_OFFERING' && (
                  <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-medium flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Recorded as general church offering / loose collection from the congregation.</span>
                  </div>
                )}

                {contributorType === 'ANONYMOUS' && (
                  <div className="mt-2 p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-[11px] text-purple-900 font-medium flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>Recorded as an anonymous / unnamed giver.</span>
                  </div>
                )}
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

      {/* ── Modal 1: Itemized Service Financial Ledger ── */}
      {selectedAuditRecord && !isPrintSlipOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col my-auto border border-slate-200">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-purple-600 rounded-xl text-white">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">
                    Service Financial Ledger
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {selectedAuditRecord.session.serviceType} • {new Date(selectedAuditRecord.session.serviceDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    {selectedAuditRecord.attendanceCount > 0 && ` • ${selectedAuditRecord.attendanceCount} Attendees`}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsPrintSlipOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Audit Slip</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedAuditRecord(null);
                    setAuditLedgerCategoryFilter('ALL');
                    setAuditLedgerSearchTerm('');
                  }}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Financial Gain Highlight Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-emerald-950 text-white rounded-2xl border border-emerald-800">
                  <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Total Gained</span>
                  <span className="text-2xl font-black text-white block mt-0.5">
                    GH₵ {selectedAuditRecord.totalGained.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold block mt-1">
                    {selectedAuditRecord.contributionCount} giving records
                  </span>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                  <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">Covenant Tithes</span>
                  <span className="text-2xl font-black text-blue-800 block mt-0.5">
                    GH₵ {(selectedAuditRecord.categoryTotals.TITHE || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                  <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">General Offering</span>
                  <span className="text-2xl font-black text-amber-800 block mt-0.5">
                    GH₵ {(selectedAuditRecord.categoryTotals.OFFERING || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl">
                  <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">Average / Person</span>
                  <span className="text-2xl font-black text-purple-800 block mt-0.5">
                    GH₵ {selectedAuditRecord.averageGivingPerAttendee.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Filter and Search within this service */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search contributor name or notes..."
                    value={auditLedgerSearchTerm}
                    onChange={(e) => setAuditLedgerSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center space-x-1.5 overflow-x-auto">
                  {['ALL', 'TITHE', 'OFFERING', 'THANKSGIVING', 'WELFARE', 'BUILDING_PROJECT', 'SPECIAL_SEED'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setAuditLedgerCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase transition whitespace-nowrap cursor-pointer ${
                        auditLedgerCategoryFilter === cat
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {cat.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contributions Table */}
              {filteredAuditRecordContributions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-1">
                  <DollarSign className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">No contributions match filter</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200 uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Contributor</th>
                        <th className="px-3 py-3">Cell</th>
                        <th className="px-3 py-3">Category</th>
                        <th className="px-3 py-3">Mode</th>
                        <th className="px-3 py-3">Notes</th>
                        <th className="px-4 py-3 text-right">Amount (GH₵)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAuditRecordContributions.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3">
                            {c.member ? (
                              <div className="flex items-center space-x-2">
                                {c.member.photoUrl ? (
                                  <img src={c.member.photoUrl} alt="" className="w-6 h-6 rounded-md object-cover" />
                                ) : (
                                  <div className="w-6 h-6 rounded-md bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center">
                                    {c.member.firstName[0]}
                                  </div>
                                )}
                                <div>
                                  <span className="font-extrabold text-slate-900 block">
                                    {c.member.firstName} {c.member.lastName}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-mono">
                                    {c.member.memberCode || 'CACI'}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="font-semibold text-slate-500 italic">General / Anonymous</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {c.member ? (
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                c.member.churchGroup === 'JOY'
                                  ? 'bg-amber-100 text-amber-800'
                                  : c.member.churchGroup === 'FAITH'
                                  ? 'bg-blue-100 text-blue-800'
                                  : c.member.churchGroup === 'HOPE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {c.member.churchGroup}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700">
                              {c.category.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-[11px] font-semibold text-slate-600">
                              {c.paymentMethod.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-slate-500 text-[11px] max-w-xs truncate">
                            {c.notes || '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-black text-sm text-slate-900">
                            GH₵ {Number(c.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-semibold">
                Showing {filteredAuditRecordContributions.length} of {selectedAuditRecord.contributionCount} giving records
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsPrintSlipOpen(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Audit Report</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedAuditRecord(null);
                    setAuditLedgerCategoryFilter('ALL');
                    setAuditLedgerSearchTerm('');
                  }}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 2: Printable Official Service Financial Audit Certificate / Slip ── */}
      {isPrintSlipOpen && selectedAuditRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[94vh] flex flex-col my-auto border border-slate-200">
            {/* Top Bar for actions (hidden in print) */}
            <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between shrink-0 print:hidden">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="font-extrabold text-sm">Official Service Financial Audit Slip</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setIsPrintSlipOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="p-8 overflow-y-auto space-y-6 flex-1 text-slate-800 bg-white" id="printable-audit-slip">
              {/* Official CACI Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <h1 className="text-lg font-black tracking-wider uppercase text-slate-950">
                  CHRIST APOSTOLIC CHURCH INTERNATIONAL
                </h1>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-600">
                  Treasury & Financial Audit Board • Local Assembly
                </p>
                <div className="inline-block px-3 py-1 bg-slate-900 text-white text-[11px] font-extrabold uppercase tracking-wider rounded-md mt-1">
                  Official Service Financial Audit Report
                </div>
              </div>

              {/* Service Meta Details */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 font-medium">
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Service Type</span>
                  <span className="font-extrabold text-slate-900 text-sm">{selectedAuditRecord.session.serviceType}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Service Date</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {new Date(selectedAuditRecord.session.serviceDate).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                {selectedAuditRecord.session.theme && (
                  <div>
                    <span className="text-slate-500 font-bold uppercase text-[10px] block">Sermon / Theme</span>
                    <span className="font-bold text-slate-800">"{selectedAuditRecord.session.theme}"</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Audited Attendance</span>
                  <span className="font-bold text-slate-800">{selectedAuditRecord.attendanceCount} Congregants</span>
                </div>
              </div>

              {/* Collections by Category Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                  1. Financial Collections by Category
                </h3>
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-slate-200 font-medium">
                    <tr>
                      <td className="py-1.5 font-bold text-slate-700">Covenant Tithes</td>
                      <td className="py-1.5 text-right font-black text-slate-900">
                        GH₵ {(selectedAuditRecord.categoryTotals.TITHE || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-bold text-slate-700">General Congregation Offering</td>
                      <td className="py-1.5 text-right font-black text-slate-900">
                        GH₵ {(selectedAuditRecord.categoryTotals.OFFERING || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-bold text-slate-700">Thanksgiving Offering</td>
                      <td className="py-1.5 text-right font-black text-slate-900">
                        GH₵ {(selectedAuditRecord.categoryTotals.THANKSGIVING || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-bold text-slate-700">Welfare & Benevolence</td>
                      <td className="py-1.5 text-right font-black text-slate-900">
                        GH₵ {(selectedAuditRecord.categoryTotals.WELFARE || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-bold text-slate-700">Building Fund Project</td>
                      <td className="py-1.5 text-right font-black text-slate-900">
                        GH₵ {(selectedAuditRecord.categoryTotals.BUILDING_PROJECT || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-bold text-slate-700">Special Seeds / Sacrificial Giving</td>
                      <td className="py-1.5 text-right font-black text-slate-900">
                        GH₵ {(selectedAuditRecord.categoryTotals.SPECIAL_SEED || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="bg-slate-100 font-black text-sm text-slate-950 border-t-2 border-slate-900">
                      <td className="py-2.5 px-2 uppercase tracking-wide">Grand Total Gained</td>
                      <td className="py-2.5 px-2 text-right text-emerald-800 text-base">
                        GH₵ {selectedAuditRecord.totalGained.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Cell Contributions Breakdown */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                  2. Giving Performance Across Cells
                </h3>
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                    <span className="text-[10px] text-amber-800 uppercase block">Joy Cell</span>
                    <span className="text-xs text-amber-950 font-black block mt-0.5">
                      GH₵ {(selectedAuditRecord.cellTotals.JOY || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                    <span className="text-[10px] text-blue-800 uppercase block">Faith Cell</span>
                    <span className="text-xs text-blue-950 font-black block mt-0.5">
                      GH₵ {(selectedAuditRecord.cellTotals.FAITH || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 uppercase block">Hope Cell</span>
                    <span className="text-xs text-emerald-950 font-black block mt-0.5">
                      GH₵ {(selectedAuditRecord.cellTotals.HOPE || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200">
                    <span className="text-[10px] text-rose-800 uppercase block">Love Cell</span>
                    <span className="text-xs text-rose-950 font-black block mt-0.5">
                      GH₵ {(selectedAuditRecord.cellTotals.LOVE || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-1 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                  Payment Channels:
                </span>
                <div className="flex items-center justify-between pt-1">
                  <span>Physical Cash: <strong>GH₵ {(selectedAuditRecord.paymentMethodTotals.CASH || 0).toFixed(2)}</strong></span>
                  <span>Mobile Money (MoMo): <strong>GH₵ {(selectedAuditRecord.paymentMethodTotals.MOBILE_MONEY || 0).toFixed(2)}</strong></span>
                  <span>Bank Transfers: <strong>GH₵ {(selectedAuditRecord.paymentMethodTotals.BANK_TRANSFER || 0).toFixed(2)}</strong></span>
                </div>
              </div>

              {/* Official Verification Signatures */}
              <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-center text-xs">
                <div className="space-y-6">
                  <div className="border-b border-slate-400 h-8"></div>
                  <div>
                    <span className="font-extrabold text-slate-900 block text-[11px]">Prepared By</span>
                    <span className="text-[10px] text-slate-500">Usher / Counting Officer</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="border-b border-slate-400 h-8"></div>
                  <div>
                    <span className="font-extrabold text-slate-900 block text-[11px]">Audited & Verified</span>
                    <span className="text-[10px] text-slate-500">Finance Deacon / Treasurer</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="border-b border-slate-400 h-8"></div>
                  <div>
                    <span className="font-extrabold text-slate-900 block text-[11px]">Approved By</span>
                    <span className="text-[10px] text-slate-500">Resident Minister / Pastor</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ReceiptModal contribution={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
    </div>
  );
};
