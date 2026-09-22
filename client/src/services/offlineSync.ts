import { api } from './api.ts';

const ATTENDANCE_QUEUE_KEY = 'caci_offline_attendance';
const CONTRIBUTION_QUEUE_KEY = 'caci_offline_contributions';

export interface QueuedAttendance {
  id: string;
  sessionId: string;
  memberId: string;
  memberName: string;
  churchGroup: string;
  markedBy: string;
  checkInTime: string;
}

export interface QueuedContribution {
  id: string;
  memberId: string | null;
  memberName?: string;
  sessionId: string | null;
  category: string;
  amount: number;
  paymentMethod: string;
  referenceCode?: string;
  notes?: string;
  transactionDate: string;
}

class OfflineSyncManager {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: ((online: boolean, queueCount: number) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifyListeners();
        // Auto-sync when coming back online
        this.syncQueuedData().catch(console.error);
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyListeners();
      });
    }
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  public subscribe(cb: (online: boolean, queueCount: number) => void) {
    this.listeners.push(cb);
    cb(this.isOnline, this.getTotalQueueCount());
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notifyListeners() {
    const count = this.getTotalQueueCount();
    this.listeners.forEach(cb => cb(this.isOnline, count));
  }

  // Attendance Queue
  public getAttendanceQueue(): QueuedAttendance[] {
    try {
      const data = localStorage.getItem(ATTENDANCE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public queueAttendance(item: Omit<QueuedAttendance, 'id'>) {
    const queue = this.getAttendanceQueue();
    const newItem = { ...item, id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` };
    queue.push(newItem);
    localStorage.setItem(ATTENDANCE_QUEUE_KEY, JSON.stringify(queue));
    this.notifyListeners();
    return newItem;
  }

  // Contribution Queue
  public getContributionQueue(): QueuedContribution[] {
    try {
      const data = localStorage.getItem(CONTRIBUTION_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public queueContribution(item: Omit<QueuedContribution, 'id'>) {
    const queue = this.getContributionQueue();
    const newItem = { ...item, id: `offline-fin-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` };
    queue.push(newItem);
    localStorage.setItem(CONTRIBUTION_QUEUE_KEY, JSON.stringify(queue));
    this.notifyListeners();
    return newItem;
  }

  public getTotalQueueCount(): number {
    return this.getAttendanceQueue().length + this.getContributionQueue().length;
  }

  // Batch Sync execution
  public async syncQueuedData(): Promise<{ success: boolean; syncedAttendance: number; syncedContributions: number }> {
    const attendanceQueue = this.getAttendanceQueue();
    const contributionQueue = this.getContributionQueue();

    if (attendanceQueue.length === 0 && contributionQueue.length === 0) {
      return { success: true, syncedAttendance: 0, syncedContributions: 0 };
    }

    try {
      const result = await api.syncOfflineData({
        attendanceQueue,
        contributionQueue
      });

      // Clear queues upon successful sync
      localStorage.removeItem(ATTENDANCE_QUEUE_KEY);
      localStorage.removeItem(CONTRIBUTION_QUEUE_KEY);
      this.notifyListeners();

      return {
        success: true,
        syncedAttendance: result.syncedAttendanceCount,
        syncedContributions: result.syncedContributionCount
      };
    } catch (err) {
      console.error('Offline sync failed, keeping items in queue:', err);
      throw err;
    }
  }
}

export const offlineSync = new OfflineSyncManager();
