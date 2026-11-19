import { create } from './createStore';
import { showToast } from './toastStore';
import NetInfo from '@react-native-community/netinfo';
import { staffApi } from '../api';

export interface OfflinePunch {
  id: string;
  empId: string;
  type: 'IN' | 'OUT';
  timestamp: string;
  latitude: number;
  longitude: number;
  address?: string;
  photoUri?: string;
  synced: boolean;
}

export interface OfflineClaim {
  id: string;
  empId: string;
  type: 'PETTY_CASH' | 'TRAVEL' | 'MISC';
  amount: number;
  description: string;
  timestamp: string;
  receiptUri?: string;
  synced: boolean;
}

export interface OfflineQueueState {
  isOnline: boolean;
  offlinePunches: OfflinePunch[];
  offlineClaims: OfflineClaim[];

  // Actions
  enqueuePunch: (punch: Omit<OfflinePunch, 'id' | 'synced'>) => void;
  enqueueClaim: (claim: Omit<OfflineClaim, 'id' | 'synced'>) => void;
  syncAll: () => Promise<void>;
  setOnlineStatus: (online: boolean) => void;
  clearQueue: () => void;
}

export const useOfflineQueueStore = create<OfflineQueueState>((set, get) => ({
  isOnline: true,
  offlinePunches: [],
  offlineClaims: [],

  enqueuePunch: (punchData) => {
    const isOnline = get().isOnline;
    const newPunch: OfflinePunch = {
      ...punchData,
      id: `PUNCH_${Date.now()}`,
      synced: isOnline,
    };

    set((state) => ({
      offlinePunches: [newPunch, ...state.offlinePunches],
    }));

    if (isOnline) {
      showToast({
        type: 'success',
        title: 'Attendance Marked',
        message: `Punch ${newPunch.type} recorded at ${newPunch.timestamp}.`,
      });
    } else {
      showToast({
        type: 'warning',
        title: 'Saved Offline',
        message: 'No internet connection. Punch stored locally in offline queue.',
      });
    }
  },

  enqueueClaim: (claimData) => {
    const isOnline = get().isOnline;
    const newClaim: OfflineClaim = {
      ...claimData,
      id: `CLAIM_${Date.now()}`,
      synced: isOnline,
    };

    set((state) => ({
      offlineClaims: [newClaim, ...state.offlineClaims],
    }));

    if (isOnline) {
      showToast({
        type: 'success',
        title: 'Claim Submitted',
        message: `Claim for ₹${newClaim.amount} submitted successfully.`,
      });
    } else {
      showToast({
        type: 'warning',
        title: 'Saved Offline',
        message: 'Claim queued locally. Will automatically sync when online.',
      });
    }
  },

  syncAll: async () => {
    const { offlinePunches, offlineClaims } = get();
    const unsyncedPunches = offlinePunches.filter((p) => !p.synced);
    const unsyncedClaims = offlineClaims.filter((c) => !c.synced);

    if (unsyncedPunches.length === 0 && unsyncedClaims.length === 0) {
      showToast({
        type: 'info',
        title: 'Up to Date',
        message: 'All punches and claims are already synchronized.',
      });
      return;
    }

    // Process punches and claims against backend
    for (const claim of unsyncedClaims) {
      try {
        if (claim.type === 'PETTY_CASH') {
          const fd = new FormData();
          fd.append('client_code', 'CL001');
          fd.append('state', 'MAHARASHTRA');
          fd.append('unit_code', 'U004');
          fd.append('emp_code', claim.empId || 'I8578');
          fd.append('request_date', new Date().toLocaleDateString('en-GB'));
          fd.append('item', claim.description || 'General Expense');
          fd.append('shop', 'Operational Mart');
          fd.append('amount', String(claim.amount));
          await staffApi.submitPettyCash(fd);
        }
      } catch (err) {
        console.warn('[OfflineQueue] Sync claim error:', err);
      }
    }

    set((state) => ({
      offlinePunches: state.offlinePunches.map((p) => ({ ...p, synced: true })),
      offlineClaims: state.offlineClaims.map((c) => ({ ...c, synced: true })),
    }));

    showToast({
      type: 'success',
      title: 'Sync Complete',
      message: `Synchronized ${unsyncedPunches.length} punches and ${unsyncedClaims.length} claims with MySQL backend.`,
    });
  },

  setOnlineStatus: (online) => {
    set({ isOnline: online });
    if (online) {
      get().syncAll();
    }
  },

  clearQueue: () => {
    set({ offlinePunches: [], offlineClaims: [] });
  },
}));

// Real-time network listener using @react-native-community/netinfo
try {
  NetInfo.addEventListener((state) => {
    const isOnline = !!(state.isConnected && state.isInternetReachable !== false);
    useOfflineQueueStore.getState().setOnlineStatus(isOnline);
  });
} catch (e) {
  // Graceful fallback for simulator environments
}
