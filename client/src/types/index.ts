export type ChurchGroup = 'GROUP_1' | 'GROUP_2';
export type MemberStatus = 'ACTIVE' | 'INACTIVE';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'WIDOWED' | 'DIVORCED';

export type FinancialCategory =
  | 'TITHE'
  | 'OFFERING'
  | 'WELFARE'
  | 'THANKSGIVING'
  | 'BUILDING_PROJECT'
  | 'SPECIAL_SEED';

export type PaymentMethod = 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CHEQUE';
export type MessageChannel = 'SMS' | 'WHATSAPP';
export type MessageStatus = 'SENT' | 'PENDING' | 'FAILED';

export type AssimilationStage = 'FIRST_VISIT' | 'WELCOME_CALL' | 'HOME_VISIT' | 'ASSIGNED_GROUP' | 'REGULAR_MEMBER';

export interface Department {
  id: string;
  name: string;
  description: string | null;
  leaderName: string | null;
  createdAt: string;
  members?: { member: Member }[];
  _count?: {
    members: number;
  };
}

export interface Member {
  id: string;
  memberCode?: string | null;
  photoUrl?: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  gender: Gender;
  maritalStatus?: MaritalStatus;
  churchGroup: ChurchGroup;
  role: string;
  status: MemberStatus;
  assimilationStage?: AssimilationStage | null;
  invitedBy?: string | null;
  dateOfBirth?: string | null;
  hometown?: string | null;
  address: string | null;
  occupation?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  isWaterBaptized?: boolean;
  isHolyGhostBaptized?: boolean;
  notes: string | null;
  departments?: { departmentId: string; department?: Department }[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    attendance: number;
    contributions: number;
  };
}

export interface ServiceSession {
  id: string;
  serviceDate: string;
  serviceType: string;
  theme: string | null;
  notes: string | null;
  createdAt: string;
  _count?: {
    attendance: number;
    contributions: number;
  };
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  memberId: string;
  checkInTime: string;
  markedBy: string;
  member: Member;
  session?: ServiceSession;
}

export interface AttendanceStats {
  totalMembers: number;
  totalPresent: number;
  totalAbsent: number;
  overallPercentage: number;
  group1: {
    total: number;
    present: number;
    absent: number;
    percentage: number;
  };
  group2: {
    total: number;
    present: number;
    absent: number;
    percentage: number;
  };
}

export interface MemberAttendanceHistory {
  member: Member;
  summary: {
    totalChurchServices: number;
    servicesAttended: number;
    servicesMissed: number;
    attendancePercentage: number;
  };
  attendedList: {
    sessionId: string;
    serviceDate: string;
    serviceType: string;
    theme: string | null;
    checkInTime: string;
    markedBy: string;
    status: 'PRESENT';
  }[];
  missedList: {
    sessionId: string;
    serviceDate: string;
    serviceType: string;
    theme: string | null;
    status: 'ABSENT';
  }[];
}

export interface AnalyticsData {
  totalMembers: number;
  group1Total: number;
  group2Total: number;
  serviceGrowth?: {
    latestCount: number;
    priorCount: number;
    netChange: number;
    percentChange: number;
    status: 'INCREASED' | 'DROPPED' | 'STABLE';
  };
  weeklyTrends: {
    sessionId: string;
    date: string;
    formattedDate: string;
    serviceType: string;
    totalPresent: number;
    group1Present: number;
    group2Present: number;
    turnoutPercentage: number;
    netChange?: number;
    percentChange?: number;
    trendStatus?: 'INCREASED' | 'DROPPED' | 'STABLE';
  }[];
  monthlyTrends: {
    monthKey: string;
    monthName: string;
    servicesCount: number;
    totalPresent: number;
    avgPresent: number;
    avgGroup1Present: number;
    avgGroup2Present: number;
    uniqueAttendeesCount: number;
    turnoutPercentage: number;
    netChange?: number;
    percentChange?: number;
    trendStatus?: 'INCREASED' | 'DROPPED' | 'STABLE';
  }[];
  absenteeAlerts: {
    id: string;
    photoUrl?: string | null;
    firstName: string;
    lastName: string;
    phone: string | null;
    churchGroup: ChurchGroup;
    role: string;
  }[];
  departmentTurnout: {
    id: string;
    name: string;
    total: number;
    present: number;
    percentage: number;
  }[];
}

export interface FinancialContribution {
  id: string;
  memberId: string | null;
  sessionId: string | null;
  category: FinancialCategory;
  amount: number | string;
  paymentMethod: PaymentMethod;
  transactionDate: string;
  notes: string | null;
  createdAt: string;
  member?: {
    id: string;
    photoUrl?: string | null;
    firstName: string;
    lastName: string;
    phone: string | null;
    churchGroup: ChurchGroup;
  } | null;
  session?: {
    id: string;
    serviceDate: string;
    serviceType: string;
  } | null;
}

export interface FinancialSummary {
  totalAmount: number;
  categoryTotals: Record<FinancialCategory, number>;
  groupComparison: {
    group1: number;
    group2: number;
    generalOfferings: number;
  };
  recordCount: number;
}

export interface MessageLog {
  id: string;
  channel: MessageChannel;
  recipientPhone: string;
  recipientName: string | null;
  messageContent: string;
  category: string | null;
  status: MessageStatus;
  sentAt: string;
}
