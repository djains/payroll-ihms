import { create } from './createStore';
import { apiClient, staffApi } from '../api';
import { ANDROID_API_KEY, API_ENDPOINTS } from '../api/config';

function parseShiftTime(
  timeStr?: string,
  defaultPeriod?: 'AM' | 'PM'
): { hour: number; label: string; mins: string } | null {
  if (!timeStr || !timeStr.trim()) return null;
  const clean = timeStr.trim().toUpperCase();
  if (clean === 'FLEXIBLE' || clean === 'NOT SET' || clean === '0' || clean === '--:--') {
    return null;
  }

  const hasPM = clean.includes('PM');
  const hasAM = clean.includes('AM');

  const m = clean.match(/(\d{1,2})(?:[:.](\d{2}))?/);
  if (!m) return null;

  let hour = parseInt(m[1], 10);
  const mins = m[2] || '00';

  if (hasPM && hour < 12) hour += 12;
  else if (hasAM && hour === 12) hour = 0;
  else if (!hasPM && !hasAM) {
    if (hour >= 13 && hour <= 23) {
      // 24h format PM
    } else if (defaultPeriod === 'PM' && hour < 12) {
      hour += 12;
    } else if (defaultPeriod === 'AM' && hour === 12) {
      hour = 0;
    } else if (!defaultPeriod) {
      // Heuristic: hours 1..5 without AM are afternoon shifts (1 PM to 5 PM)
      if (hour >= 1 && hour <= 5) hour += 12;
    }
  }

  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const label = `${String(displayHour).padStart(2, '0')}:${mins} ${period}`;
  return { hour, label, mins };
}

function parseShiftRange(
  rangeStr?: string
): { inHour: number; inLabel: string; outHour: number; outLabel: string; workingHours: number } | null {
  if (!rangeStr || !rangeStr.trim()) return null;
  const clean = rangeStr.trim();
  if (clean.toLowerCase() === 'flexible' || clean.toLowerCase() === 'not set') return null;

  // Split by "to", "se", "-", or "–"
  const parts = clean.split(/\s*(?:to|se|-|–)\s*/i);
  if (parts.length >= 2) {
    const fromP = parseShiftTime(parts[0]);
    const toP = parseShiftTime(parts[1], fromP && fromP.hour >= 12 ? 'PM' : undefined);
    if (fromP && toP) {
      let outHour = toP.hour;
      if (outHour <= fromP.hour && outHour <= 12) outHour += 12;
      let diff = outHour - fromP.hour;
      if (diff <= 0) diff += 24;
      const displayHour = outHour % 12 || 12;
      const period = outHour >= 12 ? 'PM' : 'AM';
      const outLabel = `${String(displayHour).padStart(2, '0')}:${toP.mins} ${period}`;
      return {
        inHour: fromP.hour,
        inLabel: fromP.label,
        outHour,
        outLabel,
        workingHours: diff,
      };
    }
  }
  return null;
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
        (n.empCode || '').toLowerCase() === (item.empCode || '').toLowerCase() &&
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
      const empCode = String(currentUser.empCode || currentUser.username || '').trim();
      if (!empCode) return;

      // Ensure notifications only contain items for THIS logged in employee
      const currentNotifications = get().notifications;
      const sanitized = currentNotifications.filter(
        (n) => !n.empCode || n.empCode.toLowerCase() === empCode.toLowerCase()
      );
      if (sanitized.length !== currentNotifications.length) {
        set({ notifications: sanitized, unreadCount: sanitized.filter((n) => !n.read).length });
      }

      // 1. Fetch employee's assigned shift timing dynamically (Priority: Employee Master -> Policy -> UserDetails)
      let shiftInHour = 9; // Default 09:00 AM
      let shiftOutHour = 18; // Default 06:00 PM
      let shiftInLabel = '09:00 AM';
      let shiftOutLabel = '06:00 PM';
      let workingHours = 8;
      let shiftFound = false;

      // Priority 1: HR Employee Record (/api/hr/employees/?search=...)
      try {
        const hrRes = await apiClient.get<any>(`/api/hr/employees/?search=${encodeURIComponent(empCode)}`);
        if (hrRes.success && hrRes.data) {
          const list = Array.isArray(hrRes.data) ? hrRes.data : hrRes.data.results || [];
          const empRec = list.find((e: any) => String(e.emp_code).toLowerCase() === empCode.toLowerCase()) || list[0];
          if (empRec) {
            if (empRec.working_hours && !isNaN(parseFloat(empRec.working_hours))) {
              workingHours = parseFloat(empRec.working_hours) || 8;
            }
            const rawIn = String(empRec.in_time || empRec.shift_type || '').trim();
            const rangeParsed = parseShiftRange(rawIn);
            if (rangeParsed) {
              shiftInHour = rangeParsed.inHour;
              shiftInLabel = rangeParsed.inLabel;
              shiftOutHour = rangeParsed.outHour;
              shiftOutLabel = rangeParsed.outLabel;
              workingHours = rangeParsed.workingHours;
              shiftFound = true;
            } else {
              const singleParsed = parseShiftTime(rawIn);
              if (singleParsed) {
                shiftInHour = singleParsed.hour;
                shiftInLabel = singleParsed.label;
                shiftOutHour = (shiftInHour + workingHours) % 24;
                const outP = parseShiftTime(String(shiftOutHour));
                shiftOutLabel = outP ? outP.label : `${shiftOutHour}:00`;
                shiftFound = true;
              }
            }
          }
        }
      } catch { }

      // Priority 2: Attendance Policy Assignments (/api/attendance/assignments/ & /api/attendance/policies/)
      if (!shiftFound) {
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
                  if (pol.working_hours && !isNaN(parseFloat(pol.working_hours))) {
                    workingHours = Number(pol.working_hours) || 8;
                  }
                  if (Array.isArray(pol.shifts) && pol.shifts.length > 0) {
                    const s = pol.shifts[0];
                    const rangeParsed = parseShiftRange(`${s.in_time} to ${s.out_time}`);
                    if (rangeParsed) {
                      shiftInHour = rangeParsed.inHour;
                      shiftInLabel = rangeParsed.inLabel;
                      shiftOutHour = rangeParsed.outHour;
                      shiftOutLabel = rangeParsed.outLabel;
                      workingHours = rangeParsed.workingHours;
                      shiftFound = true;
                    } else {
                      const inParsed = parseShiftTime(s.in_time);
                      if (inParsed) {
                        shiftInHour = inParsed.hour;
                        shiftInLabel = inParsed.label;
                        shiftFound = true;
                      }
                      const outParsed = parseShiftTime(s.out_time);
                      if (outParsed) {
                        shiftOutHour = outParsed.hour;
                        shiftOutLabel = outParsed.label;
                      }
                    }
                  }
                }
              }
            }
          }
        } catch { }
      }

      // Priority 3: Fallback to SQL pay_employee_master in_time via GetUserDetails
      if (!shiftFound) {
        try {
          const udRes = await apiClient.get<any>(
            `/api/mobile/GetUserDetails/?userName=${encodeURIComponent(empCode)}`,
            { 'X-API-Key': ANDROID_API_KEY }
          );
          if (udRes.success && udRes.data) {
            const uList = Array.isArray(udRes.data) ? udRes.data : [udRes.data];
            const rawShift = String(uList[0]?.SHIFT_TIME || '').trim();
            const rangeParsed = parseShiftRange(rawShift);
            if (rangeParsed) {
              shiftInHour = rangeParsed.inHour;
              shiftInLabel = rangeParsed.inLabel;
              shiftOutHour = rangeParsed.outHour;
              shiftOutLabel = rangeParsed.outLabel;
              workingHours = rangeParsed.workingHours;
              shiftFound = true;
            } else {
              const parsed = parseShiftTime(rawShift);
              if (parsed) {
                shiftInHour = parsed.hour;
                shiftInLabel = parsed.label;
                shiftOutHour = (shiftInHour + workingHours) % 24;
                const outP = parseShiftTime(String(shiftOutHour));
                shiftOutLabel = outP ? outP.label : `${shiftOutHour}:00`;
                shiftFound = true;
              }
            }
          }
        } catch { }
      }

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
      } catch { }

      // 3. PUNCH IN REMINDER (Shift-aware & scoped strictly to this employee)
      // Check if employee has NOT punched in, and current time is around shift start
      const isShiftInWindow = currentHour >= (shiftInHour - 1) && currentHour <= (shiftInHour + 2);
      if (!hasPunchedInToday && isShiftInWindow) {
        const hasPunchInNotif = get().notifications.some(
          (n) =>
            n.category === 'PUNCH_IN' &&
            (n.empCode || '').toLowerCase() === empCode.toLowerCase() &&
            new Date(n.createdAt).toDateString() === now.toDateString()
        );
        if (!hasPunchInNotif) {
          get().addNotification({
            title: 'Duty Shift Reminder',
            message: `Your scheduled shift begins at ${shiftInLabel}. Please open the app and perform Camera Punch IN.`,
            type: 'info',
            category: 'PUNCH_IN',
            empCode: empCode,
            targetScreen: 'UnifiedDashboard',
          });
        }
      }

      // 4. PUNCH OUT REMINDER (Shift-aware & scoped strictly to this employee)
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
          (n) =>
            n.category === 'PUNCH_OUT' &&
            (n.empCode || '').toLowerCase() === empCode.toLowerCase() &&
            new Date(n.createdAt).toDateString() === now.toDateString()
        );
        if (!hasPunchOutNotif) {
          get().addNotification({
            title: 'Shift Complete Reminder',
            message: `Your scheduled shift (${shiftInLabel} - ${shiftOutLabel} • ${workingHours}h) is complete. Please perform Camera Punch OUT before leaving site.`,
            type: 'info',
            category: 'PUNCH_OUT',
            empCode: empCode,
            targetScreen: 'UnifiedDashboard',
          });
        }
      }

      // 5. SALARY SLIP READY NOTIFICATION (Scoped to this employee)
      // Check if user has an approved salary slip in current or previous month
      try {
        const salRes = await apiClient.get<any>(
          `${API_ENDPOINTS.STAFF_SALARY_PRO_LIST}?emp_code=${encodeURIComponent(empCode)}&month=${now.getMonth() + 1}&year=${now.getFullYear()}`
        );
        if (salRes.success && salRes.data) {
          const list = Array.isArray(salRes.data) ? salRes.data : (salRes.data as any).results || [];
          if (list.length > 0) {
            const hasSalaryNotif = get().notifications.some(
              (n) =>
                n.category === 'SALARY' &&
                (n.empCode || '').toLowerCase() === empCode.toLowerCase() &&
                n.title.includes(String(now.getFullYear()))
            );
            if (!hasSalaryNotif) {
              get().addNotification({
                title: 'Salary Slip Available',
                message: `Your official salary slip for ${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()} is ready. Tap to view and download.`,
                type: 'success',
                category: 'SALARY',
                empCode: empCode,
                targetScreen: 'SalarySlip',
              });
            }
          }
        }
      } catch { }
    }

    // Company Admin notifications: currently disabled to eliminate unnecessary / failing network calls
  },
}));
