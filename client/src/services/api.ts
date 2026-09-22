import {
  Member,
  Department,
  ServiceSession,
  AttendanceRecord,
  AttendanceStats,
  MemberAttendanceHistory,
  AnalyticsData,
  FinancialContribution,
  FinancialSummary,
  MessageLog,
  Celebrant,
  PledgeCampaign,
  MemberPledge,
  PledgePayment
} from '../types/index.ts';

const BASE_URL = (import.meta.env.VITE_API_URL as string) || '/api';

export const api = {
  // Members
  async getMembers(params?: { search?: string; group?: string; departmentId?: string; status?: string; stage?: string }): Promise<Member[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.group && params.group !== 'ALL') query.append('group', params.group);
    if (params?.departmentId && params.departmentId !== 'ALL') query.append('departmentId', params.departmentId);
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    if (params?.stage && params.stage !== 'ALL') query.append('stage', params.stage);

    const res = await fetch(`${BASE_URL}/members?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch members');
    return res.json();
  },

  async getMember(id: string): Promise<Member> {
    const res = await fetch(`${BASE_URL}/members/${id}`);
    if (!res.ok) throw new Error('Failed to fetch member details');
    return res.json();
  },

  async lookupMemberByQr(qrCode: string): Promise<Member> {
    const res = await fetch(`${BASE_URL}/members/qr/${encodeURIComponent(qrCode)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Member not found' }));
      throw new Error(err.error || 'Member not found');
    }
    return res.json();
  },

  async getMemberAttendanceHistory(memberId: string): Promise<MemberAttendanceHistory> {
    const res = await fetch(`${BASE_URL}/members/${memberId}/attendance-history`);
    if (!res.ok) throw new Error('Failed to fetch member attendance records');
    return res.json();
  },

  async updateAssimilationStage(memberId: string, stage: string, group?: string): Promise<Member> {
    const res = await fetch(`${BASE_URL}/members/${memberId}/assimilation`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assimilationStage: stage, churchGroup: group })
    });
    if (!res.ok) throw new Error('Failed to update assimilation stage');
    return res.json();
  },

  async createMember(data: any): Promise<Member> {
    const res = await fetch(`${BASE_URL}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create member');
    return res.json();
  },

  async updateMember(id: string, data: any): Promise<Member> {
    const res = await fetch(`${BASE_URL}/members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update member');
    return res.json();
  },

  async deleteMember(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/members/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete member');
    return res.json();
  },

  // Departments
  async getDepartments(): Promise<Department[]> {
    const res = await fetch(`${BASE_URL}/departments`);
    if (!res.ok) throw new Error('Failed to fetch departments');
    return res.json();
  },

  async createDepartment(data: { name: string; description?: string; leaderName?: string }): Promise<Department> {
    const res = await fetch(`${BASE_URL}/departments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create department');
    return res.json();
  },

  // Sessions & Date Selection
  async getActiveSession(): Promise<ServiceSession> {
    const res = await fetch(`${BASE_URL}/sessions/active`);
    if (!res.ok) throw new Error('Failed to fetch active session');
    return res.json();
  },

  async getSessionByDate(date: string, createIfNotFound?: boolean, serviceType?: string): Promise<ServiceSession | null> {
    const query = new URLSearchParams({ date });
    if (createIfNotFound) query.append('createIfNotFound', 'true');
    if (serviceType) query.append('serviceType', serviceType);

    const res = await fetch(`${BASE_URL}/sessions/by-date?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch session for chosen date');
    return res.json();
  },

  async getSessions(): Promise<ServiceSession[]> {
    const res = await fetch(`${BASE_URL}/sessions`);
    if (!res.ok) throw new Error('Failed to fetch sessions');
    return res.json();
  },

  async createSession(data: { serviceDate?: string; serviceType: string; theme?: string; notes?: string }): Promise<ServiceSession> {
    const res = await fetch(`${BASE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create session');
    return res.json();
  },

  // Attendance & Analytics
  async getSessionAttendance(sessionId: string): Promise<AttendanceRecord[]> {
    const res = await fetch(`${BASE_URL}/attendance/session/${sessionId}`);
    if (!res.ok) throw new Error('Failed to fetch session attendance');
    return res.json();
  },

  async checkIn(sessionId: string, memberId: string, markedBy?: string): Promise<{ message: string; record: AttendanceRecord; alreadyCheckedIn: boolean }> {
    const res = await fetch(`${BASE_URL}/attendance/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, memberId, markedBy })
    });
    if (!res.ok) throw new Error('Failed to record attendance');
    return res.json();
  },

  async undoCheckIn(sessionId: string, memberId: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/attendance/undo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, memberId })
    });
    if (!res.ok) throw new Error('Failed to undo attendance');
    return res.json();
  },

  async getAttendanceStats(sessionId: string): Promise<AttendanceStats> {
    const res = await fetch(`${BASE_URL}/attendance/stats/${sessionId}`);
    if (!res.ok) throw new Error('Failed to fetch attendance stats');
    return res.json();
  },

  async getAnalytics(): Promise<AnalyticsData> {
    const res = await fetch(`${BASE_URL}/attendance/analytics`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  // Finances
  async getFinances(params?: { category?: string; sessionId?: string; memberId?: string }): Promise<FinancialContribution[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'ALL') query.append('category', params.category);
    if (params?.sessionId) query.append('sessionId', params.sessionId);
    if (params?.memberId) query.append('memberId', params.memberId);

    const res = await fetch(`${BASE_URL}/finances?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch finances');
    return res.json();
  },

  async recordContribution(data: any): Promise<FinancialContribution> {
    const res = await fetch(`${BASE_URL}/finances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to record contribution');
    return res.json();
  },

  async getFinancialSummary(): Promise<FinancialSummary> {
    const res = await fetch(`${BASE_URL}/finances/summary`);
    if (!res.ok) throw new Error('Failed to fetch financial summary');
    return res.json();
  },

  async getMemberGivingStatement(memberId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/finances/member/${memberId}`);
    if (!res.ok) throw new Error('Failed to fetch member giving statement');
    return res.json();
  },

  // Messaging
  async getMessageLogs(): Promise<MessageLog[]> {
    const res = await fetch(`${BASE_URL}/messages`);
    if (!res.ok) throw new Error('Failed to fetch message logs');
    return res.json();
  },

  async broadcastMessage(data: {
    targetType: string;
    memberIds?: string[];
    sessionId?: string;
    departmentId?: string;
    channel: 'SMS' | 'WHATSAPP';
    customMessage?: string;
    senderId?: string;
  }): Promise<{ success: boolean; sentCount: number; whatsappLinks?: { name: string; phone: string; url: string }[]; message: string; gateway?: any }> {
    const res = await fetch(`${BASE_URL}/messages/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to broadcast' }));
      throw new Error(err.error || 'Failed to broadcast message');
    }
    return res.json();
  },

  async sendMessage(data: {
    channel: 'SMS' | 'WHATSAPP';
    recipientPhone: string;
    recipientName?: string;
    messageContent: string;
    category?: string;
    senderId?: string;
  }): Promise<{ success: boolean; log: MessageLog; whatsappUrl: string; gateway?: any }> {
    const res = await fetch(`${BASE_URL}/messages/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  // Celebrations & Automated SMS
  async getTodayCelebrants(): Promise<Celebrant[]> {
    const res = await fetch(`${BASE_URL}/celebrations/today`);
    if (!res.ok) throw new Error('Failed to fetch today celebrants');
    return res.json();
  },

  async getUpcomingCelebrants(days = 7): Promise<Celebrant[]> {
    const res = await fetch(`${BASE_URL}/celebrations/upcoming?days=${days}`);
    if (!res.ok) throw new Error('Failed to fetch upcoming celebrants');
    return res.json();
  },

  async dispatchCelebrationBlessings(data: {
    memberIds?: string[];
    customBirthdayTemplate?: string;
    customAnniversaryTemplate?: string;
    senderId?: string;
  }): Promise<{ success: boolean; message: string; result: any }> {
    const res = await fetch(`${BASE_URL}/celebrations/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to dispatch celebration blessings');
    return res.json();
  },

  // Campaigns & Pledges
  async getCampaigns(): Promise<PledgeCampaign[]> {
    const res = await fetch(`${BASE_URL}/campaigns`);
    if (!res.ok) throw new Error('Failed to fetch campaigns');
    return res.json();
  },

  async getCampaign(id: string): Promise<PledgeCampaign> {
    const res = await fetch(`${BASE_URL}/campaigns/${id}`);
    if (!res.ok) throw new Error('Failed to fetch campaign details');
    return res.json();
  },

  async createCampaign(data: {
    title: string;
    description?: string;
    targetAmount: number;
    category?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PledgeCampaign> {
    const res = await fetch(`${BASE_URL}/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create campaign');
    return res.json();
  },

  async createPledge(campaignId: string, data: {
    memberId?: string;
    donorName?: string;
    donorPhone?: string;
    pledgedAmount: number;
    dueDate?: string;
    notes?: string;
  }): Promise<MemberPledge> {
    const res = await fetch(`${BASE_URL}/campaigns/${campaignId}/pledges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to record pledge');
    return res.json();
  },

  async recordPledgePayment(pledgeId: string, data: {
    amount: number;
    paymentMethod?: string;
    notes?: string;
    transactionDate?: string;
  }): Promise<{ success: boolean; payment: PledgePayment; updatedPledge: MemberPledge; receiptNumber: string }> {
    const res = await fetch(`${BASE_URL}/campaigns/pledges/${pledgeId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to record pledge payment');
    return res.json();
  },

  async sendPledgeReminders(campaignId: string, data: {
    customMessage?: string;
    senderId?: string;
  }): Promise<{ success: boolean; remindedCount: number; message: string; results: any[] }> {
    const res = await fetch(`${BASE_URL}/campaigns/${campaignId}/remind-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to dispatch pledge reminders');
    return res.json();
  },

  // Batch Sync (Offline PWA)
  async syncOfflineData(data: {
    attendanceQueue: any[];
    contributionQueue: any[];
  }): Promise<{ success: boolean; syncedAttendanceCount: number; syncedContributionCount: number; message: string }> {
    const res = await fetch(`${BASE_URL}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to sync offline data');
    return res.json();
  }
};
