import { create } from './createStore';
import { apiClient, staffApi } from '../api';
import { ANDROID_API_KEY, API_ENDPOINTS } from '../api/config';

interface ShiftTrackingState {
  isShiftActive: boolean;
  setShiftActive: (active: boolean) => void;
  syncTodayShiftStatus: (empCode: string) => Promise<void>;
}

export const useShiftTrackingStore = create<ShiftTrackingState>((set) => ({
  isShiftActive: false,

  setShiftActive: (active: boolean) => {
    set({ isShiftActive: active });
  },

  syncTodayShiftStatus: async (empCode: string) => {
    if (!empCode) {
      set({ isShiftActive: false });
      return;
    }
    try {
      // Primary: /api/mobile/GETINOUTTIME/ (works for every employee with X-API-Key, no RBAC 403)
      const inOutRes = await apiClient.get<any>(
        `${API_ENDPOINTS.MOBILE_INOUT_TIME}?EMP_CODE=${encodeURIComponent(empCode)}`,
        { 'X-API-Key': ANDROID_API_KEY }
      );
      if (inOutRes.success && inOutRes.data) {
        const list = Array.isArray(inOutRes.data) ? inOutRes.data : [inOutRes.data];
        if (list.length > 0 && list[0]?.Status !== undefined) {
          const st = String(list[0].Status || '').trim().toUpperCase();
          set({ isShiftActive: st === 'IN' });
          return;
        }
      }

      // Fallback: /api/attendance/android-logs/
      const res = await staffApi.getLivePunchLogs(empCode);
      if (res.success && res.data) {
        const logsList = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
        if (Array.isArray(logsList)) {
          const now = new Date();
          const yyyy = now.getFullYear();
          const mm = String(now.getMonth() + 1).padStart(2, '0');
          const dd = String(now.getDate()).padStart(2, '0');
          const todayDash = `${yyyy}-${mm}-${dd}`;
          const todaySlash = `${dd}/${mm}/${yyyy}`;

          const todayPunch = logsList.find((log: any) => {
            const raw = String(
              log.date_time || log.Date_Time || log.attendances_intime || log.camera_intime || ''
            ).trim();
            return raw.startsWith(todayDash) || raw.includes(todaySlash);
          });

          if (todayPunch) {
            const rawIn =
              todayPunch.camera_intime ||
              todayPunch.Camera_intime ||
              todayPunch.attendances_intime;
            const rawOut =
              todayPunch.camera_outtime ||
              todayPunch.Camera_outtime ||
              todayPunch.attendances_outtime;
            set({ isShiftActive: Boolean(rawIn) && !Boolean(rawOut) });
            return;
          }
        }
      }
      set({ isShiftActive: false });
    } catch {
      // Keep current state on transient network failure
    }
  },
}));

