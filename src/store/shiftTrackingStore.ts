import { create } from './createStore';
import { apiClient, staffApi } from '../api';
import { ANDROID_API_KEY, API_ENDPOINTS } from '../api/config';

export type WorkMode = 'ONSITE' | 'WFH' | 'OFFSITE';

interface ShiftTrackingState {
  isShiftActive: boolean;
  workMode: WorkMode;
  setShiftActive: (active: boolean) => void;
  setWorkMode: (mode: WorkMode) => void;
  syncTodayShiftStatus: (empCode: string) => Promise<void>;
}

export const useShiftTrackingStore = create<ShiftTrackingState>((set) => ({
  isShiftActive: false,
  workMode: 'ONSITE',

  setShiftActive: (active: boolean) => {
    set({ isShiftActive: active });
  },

  setWorkMode: (mode: WorkMode) => {
    set({ workMode: mode });
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

          // Check for active night shift from yesterday (within last 18 hours)
          let punchToUse = todayPunch;
          if (!todayPunch) {
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const yDash = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
            const ySlash = `${String(yesterday.getDate()).padStart(2, '0')}/${String(yesterday.getMonth() + 1).padStart(2, '0')}/${yesterday.getFullYear()}`;

            const yestPunch = logsList.find((log: any) => {
              const raw = String(
                log.date_time || log.Date_Time || log.attendances_intime || log.camera_intime || ''
              ).trim();
              return raw.startsWith(yDash) || raw.includes(ySlash);
            });

            if (yestPunch) {
              const yIn = yestPunch.camera_intime || yestPunch.Camera_intime || yestPunch.attendances_intime;
              const yOut = yestPunch.camera_outtime || yestPunch.Camera_outtime || yestPunch.attendances_outtime;
              if (yIn && (!yOut || yOut === '--:--')) {
                try {
                  const inD = new Date(String(yIn).replace(' ', 'T'));
                  const diffH = (now.getTime() - inD.getTime()) / (1000 * 60 * 60);
                  if (diffH >= 0 && diffH < 18) {
                    punchToUse = yestPunch;
                  }
                } catch {
                  punchToUse = yestPunch;
                }
              }
            }
          }

          if (punchToUse) {
            const rawIn =
              punchToUse.camera_intime ||
              punchToUse.Camera_intime ||
              punchToUse.attendances_intime;
            const rawOut =
              punchToUse.camera_outtime ||
              punchToUse.Camera_outtime ||
              punchToUse.attendances_outtime;
            const rawAddr = String(punchToUse.address || punchToUse.ADDRESS || '').trim().toUpperCase();
            const inferredMode: WorkMode = rawAddr.startsWith('[WFH]')
              ? 'WFH'
              : rawAddr.startsWith('[OFFSITE]')
              ? 'OFFSITE'
              : 'ONSITE';
            set({ isShiftActive: Boolean(rawIn) && !Boolean(rawOut), workMode: inferredMode });
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

