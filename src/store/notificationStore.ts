import { create } from './createStore';
import { apiClient, staffApi } from '../api';
import { ANDROID_API_KEY, API_ENDPOINTS } from '../api/config';

function formatHour12(hStr: string): string {
  if (!hStr) return '';
  const clean = hStr.split(':')[0].trim();
  const num = parseInt(clean, 10);
  if (isNaN(num)) return hStr;
  const period = num >= 12 ? 'PM' : 'AM';
  const h12 = num % 12 || 12;
  const mins = hStr.includes(':') ? hStr.split(':')[1].substring(0, 2) : '00';
  return `${String(h12).padStart(2, '0')}:${mins} ${period}`;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success' | 'danger';
  createdAt: string; // ISO string
  read: boolean;
  targetScreen?: string;
  targetParams?: any;
  category: 'GEOFENCE' | 'PUNCH_IN' | 'PUNCH_OUT' | 'SALARY' | 'LEAVE' | 'NOTICE';
  empCode?: string;
  empName?: string;
  unitCode?: string;
  distanceInfo?: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  addNotification: (item: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  syncNotifications: (currentUser: any) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,

  setOpen: (open: boolean) => {
    set({ isOpen: open });
  },

  addNotification: (item) => {
    const currentList = get().notifications;
    // Prevent spamming exact duplicate unread notifications within 5 minutes
    const isDuplicate = currentList.some(
      (n) =>
        !n.read &&
        n.category === item.category &&
        n.title === item.title &&
        n.message === item.message &&
        Date.now() - new Date(n.createdAt).getTime() < 5 * 60 * 1000
    );

    if (isDuplicate) return;

    const newNotif: NotificationItem = {
      ...item,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };

    const updated = [newNotif, ...currentList].slice(0, 50); // Keep latest 50
    const unread = updated.filter((n) => !n.read).length;
    set({ notifications: updated, unreadCount: unread });
  },

  markAsRead: (id: string) => {
    const updated = get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    const unread = updated.filter((n) => !n.read).length;
    set({ notifications: updated, unreadCount: unread });
  },

  markAllAsRead: () => {
    const updated = get().notifications.map((n) => ({ ...n, read: true }));
    set({ notifications: updated, unreadCount: 0 });
  },

  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
  },

  /**
   * Sync and generate relevant notifications for Staff or Company Admin
   */
  syncNotifications: async (currentUser: any) => {
    if (!currentUser) return;

    const role = currentUser.role;
    const isCompanyAdmin =
      role === 'COMPANY_ADMIN' ||
      role === 'ADMIN' ||
      role === 'SUPER_ADMIN' ||
      Boolean(currentUser.isCompanyAdmin);

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // -------------------------------------------------------------
    // A. STAFF NOTIFICATIONS
    // -------------------------------------------------------------
    if (!isCompanyAdmin) {
      const empCode = currentUser.empCode || currentUser.username || '';

      // 1. Fetch employee's assigned policy & shift timing dynamically
      let shiftInHour = 9; // Default 09:00 AM
      let shiftOutHour = 18; // Default 06:00 PM
      let shiftInLabel = '09:00 AM';
      let shiftOutLabel = '06:00 PM';
      let workingHours = 8;

      try {
        const assignRes = await apiClient.get<any>(
          `/api/attendance/assignments/?emp_code=${encodeURIComponent(empCode)}`
        );
        if (assignRes.success && assignRes.data) {
          const aList = Array.isArray(assignRes.data) ? assignRes.data : (assignRes.data as any).results || [];
          if (aList.length > 0 && aList[0]?.policy_id) {
            const pid = aList[0].policy_id;
            const polRes = await apiClient.get<any>(
              `/api/attendance/policies/?policy_id=${encodeURIComponent(pid)}`
            );
            if (polRes.success && polRes.data) {
              const pList = Array.isArray(polRes.data) ? polRes.data : (polRes.data as any).results || [];
              const pol = pList.find((p: any) => String(p.policy_id).trim() === String(pid).trim()) || pList[0];
              if (pol) {
                if (pol.working_hours) workingHours = Number(pol.working_hours) || 8;
                if (Array.isArray(pol.shifts) && pol.shifts.length > 0) {
                  const s = pol.shifts[0];
                  if (s.in_time) {
                    const parsedIn = parseInt(String(s.in_time), 10);
                    if (!isNaN(parsedIn)) {
                      shiftInHour = parsedIn;
                      shiftInLabel = formatHour12(String(s.in_time));
                    }
                  }
                  if (s.out_time) {
                    const parsedOut = parseInt(String(s.out_time), 10);
                    if (!isNaN(parsedOut)) {
                      shiftOutHour = parsedOut;
                      shiftOutLabel = formatHour12(String(s.out_time));
                    }
                  }
                }
              }
            }
          }
        }
      } catch {}

      // 2. Fetch today's punch status from MySQL
      let hasPunchedInToday = false;
      let hasPunchedOutToday = false;
      let punchInTimestamp: Date | null = null;

      try {
        const logsRes = await staffApi.getLivePunchLogs(empCode);
        if (logsRes.success && logsRes.data) {
          const logsList = Array.isArray(logsRes.data) ? logsRes.data : (logsRes.data as any).results || [];
          const todayDash = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const todaySlash = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

          const todayLog = logsList.find((log: any) => {
            const raw = String(log.date_time || log.Date_Time || log.camera_intime || log.attendances_intime || '').trim();
            return raw.startsWith(todayDash) || raw.includes(todaySlash);
          });

          if (todayLog) {
            const rawIn = todayLog.camera_intime || todayLog.Camera_intime || todayLog.attendances_intime;
            const rawOut = todayLog.camera_outtime || todayLog.Camera_outtime || todayLog.attendances_outtime;
            if (rawIn && rawIn !== '--:--') {
              hasPunchedInToday = true;
              const parsedIn = new Date(String(rawIn).replace(' ', 'T'));
              if (!isNaN(parsedIn.getTime())) punchInTimestamp = parsedIn;
            }
            if (rawOut && rawOut !== '--:--') {
              hasPunchedOutToday = true;
            }
          }
        }
      } catch {}

      // 3. PUNCH IN REMINDER (Shift-aware)
      // Check if employee has NOT punched in, and current time is around shift start
      const isShiftInWindow = currentHour >= (shiftInHour - 1) && currentHour <= (shiftInHour + 2);
      if (!hasPunchedInToday && isShiftInWindow) {
        const hasPunchInNotif = get().notifications.some(
          (n) => n.category === 'PUNCH_IN' && new Date(n.createdAt).toDateString() === now.toDateString()
        );
        if (!hasPunchInNotif) {
          get().addNotification({
            title: 'Duty Shift Reminder',
            message: `Your scheduled shift begins at ${shiftInLabel}. Please open the app and perform Camera Punch IN.`,
            type: 'info',
            category: 'PUNCH_IN',
            targetScreen: 'UnifiedDashboard',
          });
        }
      }

      // 4. PUNCH OUT REMINDER (Shift-aware)
      // Triggers if worker has punched IN, NOT punched OUT yet, and
      // EITHER current time >= shiftOutHour, OR worked hours >= policy workingHours
      let isShiftOutDue = false;
      if (hasPunchedInToday && !hasPunchedOutToday) {
        if (currentHour >= shiftOutHour) {
          isShiftOutDue = true;
        } else if (punchInTimestamp) {
          const hoursElapsed = (now.getTime() - punchInTimestamp.getTime()) / (1000 * 60 * 60);
          if (hoursElapsed >= workingHours) {
            isShiftOutDue = true;
          }
        }
      }

      if (isShiftOutDue) {
        const hasPunchOutNotif = get().notifications.some(
          (n) => n.category === 'PUNCH_OUT' && new Date(n.createdAt).toDateString() === now.toDateString()
        );
        if (!hasPunchOutNotif) {
          get().addNotification({
            title: 'Shift Complete Reminder',
            message: `Your scheduled shift (${shiftInLabel} - ${shiftOutLabel} • ${workingHours}h) is complete. Please perform Camera Punch OUT before leaving site.`,
            type: 'info',
            category: 'PUNCH_OUT',
            targetScreen: 'UnifiedDashboard',
          });
        }
      }

      // 3. SALARY SLIP READY NOTIFICATION
      // Check if user has an approved salary slip in current or previous month
      try {
        const salRes = await apiClient.get<any>(
          `${API_ENDPOINTS.STAFF_SALARY_PRO_LIST}?emp_code=${encodeURIComponent(empCode)}&month=${now.getMonth() + 1}&year=${now.getFullYear()}`
        );
        if (salRes.success && salRes.data) {
          const list = Array.isArray(salRes.data) ? salRes.data : (salRes.data as any).results || [];
          if (list.length > 0) {
            const hasSalaryNotif = get().notifications.some(
              (n) => n.category === 'SALARY' && n.title.includes(String(now.getFullYear()))
            );
            if (!hasSalaryNotif) {
              get().addNotification({
                title: 'Salary Slip Available',
                message: `Your official salary slip for ${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()} is ready. Tap to view and download.`,
                type: 'success',
                category: 'SALARY',
                targetScreen: 'SalarySlip',
              });
            }
          }
        }
      } catch {}
    }

    // -------------------------------------------------------------
    // B. COMPANY ADMIN NOTIFICATIONS (Live Geofence Breaches)
    // -------------------------------------------------------------
    if (isCompanyAdmin) {
      try {
        // Query recent live GPS tracking logs to detect guards who moved outside site boundary
        const geoRes = await apiClient.get<any>(
          `/api/mobile/Employee_geolocation_lat_long/?limit=20`
        );
        if (geoRes.success && geoRes.data) {
          const list = Array.isArray(geoRes.data) ? geoRes.data : (geoRes.data as any).results || [];
          list.forEach((log: any) => {
            const addr = String(log.current_address || log.address || '');
            const emp = String(log.emp_code || log.EMP_CODE || '');
            const distMatch = addr.match(/(\d+m\s+from\s+site|Moved\s+\+\d+m)/i);

            if (emp && distMatch) {
              const notifIdKey = `breach_${emp}_${log.date_time || log.Date_Time || ''}`;
              const exists = get().notifications.some((n) => n.id === notifIdKey);
              if (!exists) {
                get().addNotification({
                  title: 'Security Guard Out of Range',
                  message: `Guard ${emp} has moved outside the designated site perimeter (${distMatch[0]}).`,
                  type: 'danger',
                  category: 'GEOFENCE',
                  empCode: emp,
                  distanceInfo: distMatch[0],
                  targetScreen: 'WorkersList',
                });
              }
            }
          });
        }
      } catch {}
    }
  },
}));
