import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { styles } from './MonthlyCalendarScreen.styles';
import { AppScreenContainer, AppHeader } from '../../../components/common';
import { useNavigation, useNavigationState } from '../../../navigation/navigationContext';
import { DayAttendance } from '../../../types/api.types';
import { useAuthStore } from '../../../store/authStore';
import { staffApi, apiConfig, apiClient, API_ENDPOINTS } from '../../../api';
import { colors } from '../../../theme/colors';

const STATUS_COLORS: Record<string, string> = {
  PRESENT: '#10B981',    // Emerald Green
  HALF_DAY: '#F59E0B',   // Amber
  ABSENT: '#EF4444',     // Crimson Red
  LEAVE: '#8B5CF6',      // Purple for Paid Leave
  WEEKLY_OFF: '#3B82F6', // Royal Blue
  HOLIDAY: '#0D9488',    // Deep Teal for Paid Government Holiday (PH)
  UPCOMING: '#94A3B8',   // Slate Gray for Scheduled Future Days
};

const STATUS_CODES: Record<string, string> = {
  PRESENT: 'P',
  HALF_DAY: 'HD',
  ABSENT: 'A',
  LEAVE: 'PL',           // Paid Leave
  WEEKLY_OFF: 'WO',
  HOLIDAY: 'PH',         // Paid Holiday (Govt Gazetted)
  UPCOMING: '—',
};

// No hardcoded holidays: strictly fetched from MySQL (pay_holiday_master / master_holiday)
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Static stable date references to prevent render loops & screen flickering
const CURRENT_DATE = new Date();
const TODAY_YEAR = CURRENT_DATE.getFullYear();
const TODAY_MONTH = CURRENT_DATE.getMonth();
const TODAY_DAY = CURRENT_DATE.getDate();
const TODAY_DATE_STR = `${TODAY_YEAR}-${String(TODAY_MONTH + 1).padStart(2, '0')}-${String(TODAY_DAY).padStart(2, '0')}`;

function parseDateKey(rawStr: string): string {
  if (!rawStr) return '';
  const s = String(rawStr).trim();
  if (s.includes('/')) {
    const parts = s.split(' ')[0].split('/');
    if (parts.length >= 3) {
      if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      } else if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
    }
  }
  if (s.includes('-')) {
    const datePart = s.split(/[ T]/)[0];
    const parts = datePart.split('-');
    if (parts.length >= 3) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
  }
  return s.substring(0, 10);
}

function formatTime12(rawStr: string): string {
  if (!rawStr) return '';
  const s = String(rawStr).trim();
  const hasPM = /\bPM\b/i.test(s);
  const hasAM = /\bAM\b/i.test(s);
  const timeMatch = s.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (timeMatch) {
    let hh = parseInt(timeMatch[1], 10);
    const mm = timeMatch[2];
    let ampm = '';
    if (hasPM) {
      ampm = 'PM';
      hh = hh % 12 || 12;
    } else if (hasAM) {
      ampm = 'AM';
      hh = hh % 12 || 12;
    } else {
      ampm = hh >= 12 ? 'PM' : 'AM';
      hh = hh % 12 || 12;
    }
    return `${String(hh).padStart(2, '0')}:${mm} ${ampm}`;
  }
  return s.substring(0, 5);
}

function parseDateTime(rawStr: string): Date | null {
  if (!rawStr) return null;
  const s = String(rawStr).trim();
  if (s.includes('/')) {
    const parts = s.split(' ');
    const dateParts = parts[0].split('/');
    if (dateParts.length >= 3) {
      let d = parseInt(dateParts[0], 10);
      let m = parseInt(dateParts[1], 10) - 1;
      let y = parseInt(dateParts[2], 10);
      if (dateParts[0].length === 4) {
        y = parseInt(dateParts[0], 10);
        d = parseInt(dateParts[2], 10);
      }
      let hh = 0, mm = 0, ss = 0;
      if (parts.length > 1) {
        const timeMatch = parts.slice(1).join(' ').match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
        if (timeMatch) {
          hh = parseInt(timeMatch[1], 10);
          mm = parseInt(timeMatch[2], 10);
          ss = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
          const hasPM = /\bPM\b/i.test(s);
          const hasAM = /\bAM\b/i.test(s);
          if (hasPM && hh < 12) hh += 12;
          if (hasAM && hh === 12) hh = 0;
        }
      }
      const dt = new Date(y, m, d, hh, mm, ss);
      return isNaN(dt.getTime()) ? null : dt;
    }
  }
  const clean = s.replace(' ', 'T');
  const d = new Date(clean);
  if (!isNaN(d.getTime())) return d;
  return null;
}

interface ApprovedSalaryRecord {
  month: number;
  year: number;
  tot_days_present: number;
  month_days: number;
  tot_absent?: number;
  sundays?: number;
  holidays?: number;
  paid_leaves?: number;
}

export const MonthlyCalendarScreen: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { goBack } = useNavigation();
  const { currentRoute } = useNavigationState();

  // Navigation state for month & year (Defaults to CURRENT live month: November 2026)
  const [selectedYear, setSelectedYear] = useState<number>(TODAY_YEAR);
  const [selectedMonth, setSelectedMonth] = useState<number>(TODAY_MONTH); // Current month (November)

  const [days, setDays] = useState<DayAttendance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedDay, setSelectedDay] = useState<DayAttendance | null>(null);

  const [approvedRecords, setApprovedRecords] = useState<ApprovedSalaryRecord[]>([]);

  const [policyInfo, setPolicyInfo] = useState<{
    policyName: string;
    workingHours: number;
    shortHours: number;
  }>({
    policyName: 'Standard 8-Hour Shift',
    workingHours: 8.0,
    shortHours: 4.0,
  });

  const empCode = currentUser?.empCode || currentUser?.username || '';
  const unitCode = currentUser?.branchOrUnit || (currentUser as any)?.unitCode || (currentUser as any)?.unit_code || (currentUser as any)?.scope?.unit_code || '';

  // Display string for the selected month/year
  const monthDate = useMemo(() => new Date(selectedYear, selectedMonth, 1), [selectedYear, selectedMonth]);
  const monthName = useMemo(() => monthDate.toLocaleString('default', { month: 'long', year: 'numeric' }), [monthDate]);
  const daysInMonth = useMemo(() => new Date(selectedYear, selectedMonth + 1, 0).getDate(), [selectedYear, selectedMonth]);
  const firstDayOfWeek = useMemo(() => new Date(selectedYear, selectedMonth, 1).getDay(), [selectedYear, selectedMonth]);

  // Navigate to previous month
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  // Navigate to next month
  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  // Switch directly to month/year
  const handleSelectMonthPill = (m: number, y: number) => {
    setSelectedMonth(m - 1); // 1-indexed to 0-indexed
    setSelectedYear(y);
  };

  const fetchLiveAttendance = useCallback(async () => {
    setLoading(true);

    let workingThreshold = 8.0;
    let shortThreshold = 4.0;
    let polName = 'Standard 8-Hour Shift';

    // 1. Fetch live policy thresholds from SQL (attendance_policy)
    try {
      const pRes = await staffApi.getPolicyThresholds(empCode);
      if (pRes.success && pRes.data) {
        const pData = pRes.data as any;
        workingThreshold = Number(pData.working_hours) || 8.0;
        shortThreshold = Number(pData.short_hours) || 4.0;
        polName = pData.policy_name || polName;
        setPolicyInfo({
          policyName: polName,
          workingHours: workingThreshold,
          shortHours: shortThreshold,
        });
      }
    } catch (pe) {
      console.warn('Could not fetch SQL policy thresholds:', pe);
    }

    // 2. Fetch approved processed salary records from MySQL (payroll_staff_salary_pro)
    // ONLY used for past completed months for THIS specific employee (strictly matched on emp_code)
    let matchedApproved: ApprovedSalaryRecord | undefined = undefined;
    const isCurrentMonth = selectedYear === TODAY_YEAR && selectedMonth === TODAY_MONTH;
    try {
      const proRes = await staffApi.getApprovedSalaryList({
        unit_code: unitCode,
        emp_code: empCode,
        month: selectedMonth + 1,
        year: selectedYear,
      });
      if (proRes.success && Array.isArray(proRes.data)) {
        const records = proRes.data as any[];
        setApprovedRecords(records);
        matchedApproved = records.find(
          (r: any) =>
            String(r.emp_code || '').trim().toLowerCase() === empCode.trim().toLowerCase() &&
            Number(r.month) === selectedMonth + 1 &&
            Number(r.year) === selectedYear
        );
      }
    } catch (err) {
      console.warn('Could not fetch approved salary muster records:', err);
    }

    // 2b. Fetch dynamic holidays from MySQL (pay_holiday_master / master_holiday)
    const sqlHolidays: Record<string, string> = {};
    try {
      const hRes = await staffApi.getHolidays();
      if (hRes.success && hRes.data) {
        const hList = Array.isArray(hRes.data.results)
          ? hRes.data.results
          : (Array.isArray(hRes.data) ? hRes.data : []);
        hList.forEach((h: any) => {
          const rawDate = h.holiday_date;
          if (rawDate) {
            const parsed = parseDateKey(rawDate);
            if (parsed) {
              sqlHolidays[parsed] = h.occassion || h.holiday_name || 'Paid Holiday';
            }
          }
        });
      }
    } catch (he) {
      console.warn('Could not fetch MySQL holidays:', he);
    }

    // 3. Fetch real-time Android mobile punch logs from MySQL (pay_android_attendance_logs)
    const dayPunches: Record<
      string,
      {
        inTimes: string[];
        outTimes: string[];
        inImages: string[];
        outImages: string[];
        distances: string[];
        addresses: string[];
      }
    > = {};

    try {
      const res = await staffApi.getLivePunchLogs(empCode);
      if (res.success && res.data) {
        const logs = (res.data as any).results || res.data;
        if (Array.isArray(logs)) {
          logs.forEach((log: any) => {
            const rawDt = log.date_time || log.Date_Time || log.attendances_intime || log.attendances_outtime;
            if (rawDt) {
              const dateKey = parseDateKey(rawDt);
              if (dateKey) {
                if (!dayPunches[dateKey]) {
                  dayPunches[dateKey] = {
                    inTimes: [],
                    outTimes: [],
                    inImages: [],
                    outImages: [],
                    distances: [],
                    addresses: [],
                  };
                }
                const p = dayPunches[dateKey];
                const rawIn = log.camera_intime || log.Camera_intime || log.attendances_intime;
                const rawOut = log.camera_outtime || log.Camera_outtime || log.attendances_outtime;
                if (rawIn) p.inTimes.push(String(rawIn));
                if (rawOut) p.outTimes.push(String(rawOut));

                const imgInName = log.Camera_intime_images || log.camera_intime_images || log.attendances_intime_images || log.Attendances_intime_images || '';
                const inImg = log.intime_image_url || (imgInName ? `/media/attendance_images/${imgInName}` : '');
                const imgOutName = log.Camera_outtime_images || log.camera_outtime_images || log.attendances_outtime_images || log.Attendances_outtime_images || '';
                const outImg = log.outtime_image_url || (imgOutName ? `/media/attendance_images/${imgOutName}` : '');
                if (inImg) p.inImages.push(inImg);
                if (outImg) p.outImages.push(outImg);

                if (log.distances) p.distances.push(String(log.distances));
                if (log.address) p.addresses.push(String(log.address));
              }
            }
          });
        }
      }
    } catch (err) {
      console.warn('Could not fetch MySQL Android punch logs:', err);
    }

    // 3b. Fetch rich punch photos from MySQL portal logs (includes Camera_intime_images & Camera_outtime_images)
    try {
      const selMonth = String(selectedMonth + 1).padStart(2, '0');
      const selYear = selectedYear;
      const lastDay = String(new Date(selYear, selectedMonth + 1, 0).getDate()).padStart(2, '0');
      const portalUrl = `/api/attendance/android-logs-portal/attendance-logs/?from_date=01/${selMonth}/${selYear}&to_date=${lastDay}/${selMonth}/${selYear}&state_name=ALL&unit_code=ALL&client_code=ALL`;
      const portalRes = await apiClient.get<any>(portalUrl);
      if (portalRes.success && portalRes.data) {
        const pRows = Array.isArray(portalRes.data) ? portalRes.data : portalRes.data.results || [];
        pRows.forEach((r: any) => {
          if (String(r.emp_code || '').trim().toLowerCase() === empCode.trim().toLowerCase()) {
            const rawDt = r.Date_Time || r.date_time || r.attendances_intime || r.attendances_outtime;
            if (rawDt) {
              const dateKey = parseDateKey(rawDt);
              if (dateKey) {
                if (!dayPunches[dateKey]) {
                  dayPunches[dateKey] = {
                    inTimes: [],
                    outTimes: [],
                    inImages: [],
                    outImages: [],
                    distances: [],
                    addresses: [],
                  };
                }
                const p = dayPunches[dateKey];
                const rawIn = r.camera_intime || r.Camera_intime || r.attendances_intime;
                const rawOut = r.camera_outtime || r.Camera_outtime || r.attendances_outtime;
                if (rawIn && !p.inTimes.includes(String(rawIn))) p.inTimes.push(String(rawIn));
                if (rawOut && !p.outTimes.includes(String(rawOut))) p.outTimes.push(String(rawOut));

                const imgInName = r.Camera_intime_images || r.camera_intime_images || r.attendances_intime_images || r.Attendances_intime_images || '';
                if (imgInName) {
                  const cleanIn = imgInName.startsWith('http') ? imgInName : `/media/attendance_images/${imgInName.replace(/^\/+/, '')}`;
                  if (!p.inImages.includes(cleanIn)) p.inImages.unshift(cleanIn);
                }

                const imgOutName = r.Camera_outtime_images || r.camera_outtime_images || r.attendances_outtime_images || r.Attendances_outtime_images || '';
                if (imgOutName) {
                  const cleanOut = imgOutName.startsWith('http') ? imgOutName : `/media/attendance_images/${imgOutName.replace(/^\/+/, '')}`;
                  if (!p.outImages.includes(cleanOut)) p.outImages.unshift(cleanOut);
                }
              }
            }
          }
        });
      }
    } catch (portalErr) {
      // non-blocking fallback
    }

    // 3b. Fetch Approved Leaves from SQL (leave_transaction) for this employee
    const paidLeaveDates: Record<string, string> = {};
    const unpaidLeaveDates: Record<string, string> = {};
    try {
      const lvRes = await apiClient.get<any>(`${API_ENDPOINTS.LEAVE_APPLICATIONS}?page_size=all`);
      if (lvRes.success && lvRes.data) {
        const lvList: any[] = Array.isArray(lvRes.data) ? lvRes.data : lvRes.data.results || [];
        const cleanEmp = String(empCode || '').trim().toUpperCase();
        lvList.forEach((lv: any) => {
          if (String(lv.emp_code || '').trim().toUpperCase() !== cleanEmp) return;
          if (String(lv.leave_status || '').trim().toLowerCase() !== 'approved') return;
          if (!lv.from_date || !lv.to_date) return;

          const balAtApply = parseFloat(String(lv.max_no_of_leave ?? '0'));
          const isPaid = !isNaN(balAtApply) && balAtApply > 0;
          const lType = String(lv.leave_type || 'Leave').trim();

          const start = new Date(lv.from_date);
          const end = new Date(lv.to_date);
          if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

          for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
            const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
            if (isPaid) {
              paidLeaveDates[key] = lType;
            } else {
              unpaidLeaveDates[key] = lType;
            }
          }
        });
      }
    } catch {}

    // 4. Construct Day-by-Day attendance records for the selected month
    const calculatedDays: DayAttendance[] = [];

    // Fallback/reference for approved months
    const approvedPresent = matchedApproved ? Number(matchedApproved.tot_days_present) : null;
    const approvedHolidays = matchedApproved ? Number(matchedApproved.holidays || 0) : 0;

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(selectedYear, selectedMonth, i);
      const isSunday = d.getDay() === 0;
      const isToday =
        selectedYear === TODAY_YEAR &&
        selectedMonth === TODAY_MONTH &&
        i === TODAY_DAY;
      const isPast =
        selectedYear < TODAY_YEAR ||
        (selectedYear === TODAY_YEAR && selectedMonth < TODAY_MONTH) ||
        (selectedYear === TODAY_YEAR && selectedMonth === TODAY_MONTH && i < TODAY_DAY);

      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const group = dayPunches[dateStr];
      const gazettedName = sqlHolidays[dateStr] || undefined;

      let status: 'PRESENT' | 'HALF_DAY' | 'ABSENT' | 'LEAVE' | 'WEEKLY_OFF' | 'HOLIDAY' | 'UPCOMING' = 'ABSENT';
      let inTime: string | undefined = undefined;
      let outTime: string | undefined = undefined;
      let totalHours: string | undefined = undefined;
      let inImageUrl: string | undefined = undefined;
      let outImageUrl: string | undefined = undefined;
      let distance: string | undefined = undefined;
      let address: string | undefined = undefined;
      let holidayName: string | undefined = gazettedName;

      if (group && (group.inTimes.length > 0 || group.outTimes.length > 0)) {
        let dtIn: Date | null = null;
        let dtOut: Date | null = null;

        if (group.inTimes.length > 0) {
          const sortedIn = [...group.inTimes].sort(
            (a, b) => (parseDateTime(a)?.getTime() || 0) - (parseDateTime(b)?.getTime() || 0)
          );
          inTime = formatTime12(sortedIn[0]);
          dtIn = parseDateTime(sortedIn[0]);
        }
        if (group.outTimes.length > 0) {
          const sortedOut = [...group.outTimes].sort(
            (a, b) => (parseDateTime(a)?.getTime() || 0) - (parseDateTime(b)?.getTime() || 0)
          );
          outTime = formatTime12(sortedOut[sortedOut.length - 1]);
          dtOut = parseDateTime(sortedOut[sortedOut.length - 1]);
        }
        if (group.inImages.length > 0) inImageUrl = group.inImages[0];
        if (group.outImages.length > 0) outImageUrl = group.outImages[0];
        if (group.distances.length > 0) distance = group.distances[0];
        if (group.addresses.length > 0) address = group.addresses[0];

        if (dtIn && dtOut) {
          if (dtIn && dtOut) {
            const diffHours = (dtOut.getTime() - dtIn.getTime()) / (1000 * 60 * 60);
            totalHours = gazettedName
              ? `${Math.max(0, diffHours).toFixed(1)} hrs (Duty on Holiday • Extra PH Credit)`
              : `${Math.max(0, diffHours).toFixed(1)} hrs`;
            if (diffHours >= workingThreshold) {
              status = 'PRESENT';
            } else if (diffHours >= shortThreshold) {
              status = 'HALF_DAY';
            } else {
              status = 'ABSENT';
            }
          } else {
            status = 'PRESENT';
            totalHours = gazettedName ? '8.0 hrs (Duty on Holiday)' : '8.0 hrs';
          }
        } else if (group.inTimes.length > 0) {
          if (isToday) {
            status = 'PRESENT';
            totalHours = 'In Progress';
          } else {
            status = 'HALF_DAY';
            totalHours = 'Missing OUT';
          }
        }
      } else if (!isCurrentMonth && matchedApproved) {
        // Official HR-approved muster record in MySQL (payroll_staff_salary_pro) for past completed month
        if (approvedHolidays > 0 && i > (daysInMonth - approvedHolidays)) {
          // Designated approved Gazetted Government Holiday in official muster
          status = 'HOLIDAY';
          holidayName = gazettedName || 'Company Approved Gazetted Holiday';
          inTime = 'Paid Holiday';
          outTime = 'Paid Holiday';
          totalHours = 'Paid Shift Credit';
        } else if (gazettedName) {
          status = 'HOLIDAY';
          holidayName = gazettedName;
          inTime = 'Paid Holiday';
          outTime = 'Paid Holiday';
          totalHours = 'Paid Shift Credit';
        } else if (approvedPresent !== null && i <= approvedPresent) {
          // Marked Present in approved payroll muster
          status = 'PRESENT';
          inTime = 'Approved Muster';
          outTime = 'Approved Muster';
          totalHours = 'Muster Record';
        } else if (isSunday) {
          status = 'WEEKLY_OFF';
          inTime = 'Weekly Off';
          outTime = 'Weekly Off';
          totalHours = 'Rest Day';
        } else {
          status = 'ABSENT';
          inTime = 'No Punch';
          outTime = 'No Punch';
          totalHours = '0.0 hrs';
        }
      } else if (isToday) {
        // Current ongoing day (Today)
        if (gazettedName) {
          // Today is a gazetted holiday!
          status = 'HOLIDAY';
          holidayName = gazettedName;
          inTime = 'Paid Holiday';
          outTime = 'Paid Holiday';
          totalHours = 'Paid Shift Credit';
        } else if (paidLeaveDates[dateStr]) {
          // Approved Paid Leave whose day has arrived -> PL (Payable)
          status = 'LEAVE';
          inTime = 'Paid Leave';
          outTime = paidLeaveDates[dateStr];
          totalHours = 'Approved Paid Leave';
        } else if (unpaidLeaveDates[dateStr]) {
          status = 'ABSENT';
          inTime = 'Unpaid Leave (LWP)';
          outTime = unpaidLeaveDates[dateStr];
          totalHours = '0.0 hrs (Salary Cut)';
        } else {
          status = 'UPCOMING';
          inTime = 'Pending Shift IN';
          outTime = '--:--';
          totalHours = 'Ready to Punch';
        }
      } else if (isPast) {
        // Past day with no punch
        if (gazettedName) {
          // Past gazetted holiday that already occurred
          status = 'HOLIDAY';
          holidayName = gazettedName;
          inTime = 'Paid Holiday';
          outTime = 'Paid Holiday';
          totalHours = 'Paid Shift Credit';
        } else if (isSunday) {
          status = 'WEEKLY_OFF';
          inTime = 'Weekly Off';
          outTime = 'Weekly Off';
          totalHours = 'Rest Day';
        } else if (paidLeaveDates[dateStr]) {
          // Past Approved Paid Leave -> PL (Payable)
          status = 'LEAVE';
          inTime = 'Paid Leave';
          outTime = paidLeaveDates[dateStr];
          totalHours = 'Approved Paid Leave';
        } else if (unpaidLeaveDates[dateStr]) {
          status = 'ABSENT';
          inTime = 'Unpaid Leave (LWP)';
          outTime = unpaidLeaveDates[dateStr];
          totalHours = '0.0 hrs (Salary Cut)';
        } else {
          status = 'ABSENT';
          inTime = 'No Punch';
          outTime = 'No Punch';
          totalHours = '0.0 hrs';
        }
      } else {
        // Future day - STRICT RULE: Never count future days as Present/Paid Leave before the date arrives!
        if (isSunday) {
          status = 'WEEKLY_OFF';
          inTime = 'Weekly Off';
          outTime = 'Weekly Off';
          totalHours = 'Rest Day';
        } else if (gazettedName) {
          // Future gazetted holiday - marked as HOLIDAY (PH) on calendar grid so user sees the date is a Paid Holiday
          status = 'HOLIDAY';
          holidayName = gazettedName;
          inTime = 'Paid Holiday';
          outTime = 'Paid Holiday';
          totalHours = 'Paid Shift Credit';
        } else if (paidLeaveDates[dateStr]) {
          // Future Approved Paid Leave - marked as LEAVE (PL) on calendar grid so user sees it, counted only when date arrives
          status = 'LEAVE';
          inTime = 'Scheduled Paid Leave';
          outTime = paidLeaveDates[dateStr];
          totalHours = 'Starts on Date';
        } else {
          status = 'UPCOMING';
          inTime = 'Scheduled';
          outTime = 'Scheduled';
          totalHours = '8.0h Shift';
        }
      }

      calculatedDays.push({
        date: dateStr,
        status,
        inTime,
        outTime,
        totalHours,
        inImageUrl,
        outImageUrl,
        distance,
        address,
        holidayName,
        shiftName: holidayName ? `${holidayName} (Holiday)` : 'General Shift',
      });
    }

    setDays(calculatedDays);
    setLoading(false);
    setRefreshing(false);

    // Auto-select today if viewing current month, or keep selected, or first/last day
    setSelectedDay((prev) => {
      if (selectedYear === TODAY_YEAR && selectedMonth === TODAY_MONTH) {
        const foundToday = calculatedDays.find((d) => d.date === TODAY_DATE_STR);
        if (foundToday) return foundToday;
      }
      if (prev && calculatedDays.some((d) => d.date === prev.date)) {
        return calculatedDays.find((d) => d.date === prev.date) || prev;
      }
      const foundToday = calculatedDays.find((d) => d.date === TODAY_DATE_STR);
      return foundToday || (calculatedDays.length > 0 ? calculatedDays[calculatedDays.length - 1] : null);
    });
  }, [selectedYear, selectedMonth, empCode, unitCode]);

  useEffect(() => {
    fetchLiveAttendance();
  }, [fetchLiveAttendance, currentRoute?.name]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveAttendance();
  };

  const handleSelectDay = (day: DayAttendance) => {
    setSelectedDay(day);
  };

  // Metrics computation for selected month:
  // Strictly count only days that have arrived (isPast or isToday) to prevent false advance attendance!
  const fullPresentCount = days.filter((d) => d.status === 'PRESENT').length;
  const halfDayCount = days.filter((d) => d.status === 'HALF_DAY').length;
  const absentCount = days.filter((d) => d.status === 'ABSENT').length;
  // Reached paid leaves (only count towards accumulated attendance if the date has arrived <= TODAY)
  const leaveCount = days.filter((d) => {
    if (d.status !== 'LEAVE') return false;
    if (selectedYear === TODAY_YEAR && selectedMonth === TODAY_MONTH) {
      const dayNum = parseInt(d.date.split('-')[2], 10);
      return dayNum <= TODAY_DAY;
    }
    return true;
  }).length;

  // Reached paid holidays (only count towards accumulated attendance if the date has arrived <= TODAY)
  const holidayCount = days.filter((d) => {
    if (d.status !== 'HOLIDAY') return false;
    if (selectedYear === TODAY_YEAR && selectedMonth === TODAY_MONTH) {
      const dayNum = parseInt(d.date.split('-')[2], 10);
      return dayNum <= TODAY_DAY;
    }
    return true;
  }).length;

  const weeklyOffCount = days.filter((d) => {
    if (d.status !== 'WEEKLY_OFF') return false;
    if (selectedYear === TODAY_YEAR && selectedMonth === TODAY_MONTH) {
      const dayNum = parseInt(d.date.split('-')[2], 10);
      return dayNum <= TODAY_DAY;
    }
    return true;
  }).length;

  // Total Payable Present Days = Full Present + (0.5 * Half Day) + Weekly Offs + Paid Holidays + Paid Leaves
  const totalPayablePresent = fullPresentCount + 0.5 * halfDayCount + weeklyOffCount + holidayCount + leaveCount;
  const attendanceRatioText = `${totalPayablePresent} / ${daysInMonth}`;
  const compliancePercent = Math.min(100, Math.round((totalPayablePresent / daysInMonth) * 100));

  // Compute total actual worked hours (strictly from arrived working days where employee was physically present)
  const totalWorkedHours = days.reduce((sum, d) => {
    const dayNum = parseInt(d.date.split('-')[2], 10);
    const hasArrived =
      selectedYear < TODAY_YEAR ||
      (selectedYear === TODAY_YEAR && selectedMonth < TODAY_MONTH) ||
      (selectedYear === TODAY_YEAR && selectedMonth === TODAY_MONTH && dayNum <= TODAY_DAY);

    if (hasArrived && (d.status === 'PRESENT' || d.status === 'HALF_DAY')) {
      if (d.totalHours && d.totalHours.includes('hrs') && !d.totalHours.includes('Credit')) {
        const h = parseFloat(d.totalHours) || 0;
        return sum + h;
      }
    }
    return sum;
  }, 0);

  return (
    <AppScreenContainer
      scrollable
      header={
        <AppHeader
          title="Monthly Attendance"
          subtitle="Duty Shifts & Daily Records"
          onBack={goBack}
        />
      }
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Month Navigation & Switcher Card */}
      <View style={styles.monthNavCard}>
        <View style={styles.monthNavRow}>
          <TouchableOpacity
            style={styles.navArrowBtn}
            onPress={handlePrevMonth}
            activeOpacity={0.7}
            accessibilityLabel="Previous Month"
          >
            <Text style={styles.navArrowText}>‹</Text>
          </TouchableOpacity>

          <View>
            <Text style={styles.monthTitleText}>{monthName}</Text>
            <Text style={styles.monthSubText}>Unit: {unitCode} • Employee: {empCode}</Text>
          </View>

          <TouchableOpacity
            style={styles.navArrowBtn}
            onPress={handleNextMonth}
            activeOpacity={0.7}
            accessibilityLabel="Next Month"
          >
            <Text style={styles.navArrowText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Month Jump Pills */}
        <View style={styles.pillsRow}>
          {/* Live Current Month Pill (Nov 2026) */}
          <TouchableOpacity
            style={[styles.pillBtn, selectedMonth === TODAY_MONTH && selectedYear === TODAY_YEAR && styles.pillBtnActive]}
            onPress={() => {
              setSelectedMonth(TODAY_MONTH);
              setSelectedYear(TODAY_YEAR);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, selectedMonth === TODAY_MONTH && selectedYear === TODAY_YEAR && styles.pillTextActive]}>
              {new Date(TODAY_YEAR, TODAY_MONTH, 1).toLocaleString('default', { month: 'short' })} {TODAY_YEAR} (Live)
            </Text>
          </TouchableOpacity>

          {/* Past Approved Months Pills */}
          {approvedRecords.map((r) => {
            if (r.month - 1 === TODAY_MONTH && r.year === TODAY_YEAR) return null;
            const isPillActive = selectedMonth === r.month - 1 && selectedYear === r.year;
            const mShort = new Date(r.year, r.month - 1, 1).toLocaleString('default', { month: 'short' });
            return (
              <TouchableOpacity
                key={`${r.year}-${r.month}`}
                style={[styles.pillBtn, isPillActive && styles.pillBtnActive]}
                onPress={() => handleSelectMonthPill(r.month, r.year)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, isPillActive && styles.pillTextActive]}>
                  {mShort} {r.year} ({r.tot_days_present}/{r.month_days})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Attendance Ratio Hero Card */}
      <View style={styles.ratioCard}>
        <View style={styles.ratioTopRow}>
          <Text style={styles.ratioLabel} numberOfLines={1}>Monthly Attendance</Text>
          <View style={styles.ratioBadge}>
            <Text style={styles.ratioBadgeText} numberOfLines={1} adjustsFontSizeToFit>
              {compliancePercent}% Compliance
            </Text>
          </View>
        </View>

        <View style={styles.ratioScoreRow}>
          <Text style={styles.ratioScoreMain}>{totalPayablePresent}</Text>
          <Text style={styles.ratioScoreTotal}>/ {daysInMonth}</Text>
          <Text style={styles.ratioScoreUnit}>Total Paid Days</Text>
        </View>

        {/* Visual Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${compliancePercent}%` }]} />
        </View>

        <View style={styles.ratioFooterRow}>
          <Text style={styles.ratioFooterText}>
            Physical Worked: {fullPresentCount + 0.5 * halfDayCount} Days
          </Text>
          <Text style={styles.ratioFooterText}>
            Total Worked: {totalWorkedHours.toFixed(1)} hrs
          </Text>
        </View>
      </View>

      {/* Policy Rule Banner */}
      <View style={styles.policyBanner}>
        <Text style={styles.policyBannerText} numberOfLines={1} adjustsFontSizeToFit>
          📋 Policy: {policyInfo.policyName} • Full Day: ≥{policyInfo.workingHours}h • Half Day: ≥{policyInfo.shortHours}h
        </Text>
      </View>

      {/* 6-Grid Executive Summary Counters */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={[styles.metricVal, { color: STATUS_COLORS.PRESENT }]}>
            {fullPresentCount}
          </Text>
          <Text style={styles.metricLabel}>Full Days</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={[styles.metricVal, { color: STATUS_COLORS.HALF_DAY }]}>
            {halfDayCount}
          </Text>
          <Text style={styles.metricLabel}>Half Days</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={[styles.metricVal, { color: STATUS_COLORS.ABSENT }]}>
            {absentCount}
          </Text>
          <Text style={styles.metricLabel}>Absent Days</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={[styles.metricVal, { color: STATUS_COLORS.HOLIDAY }]}>
            {holidayCount}
          </Text>
          <Text style={styles.metricLabel}>Paid Holidays</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={[styles.metricVal, { color: STATUS_COLORS.LEAVE }]}>
            {leaveCount}
          </Text>
          <Text style={styles.metricLabel}>Paid Leaves</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={[styles.metricVal, { color: STATUS_COLORS.WEEKLY_OFF }]}>
            {weeklyOffCount}
          </Text>
          <Text style={styles.metricLabel}>Weekly Offs</Text>
        </View>
      </View>

      {/* Calendar Card */}
      <View style={styles.calendarCard}>
        {/* Status Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.PRESENT }]} />
            <Text style={styles.legendText}>Present (P)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.HALF_DAY }]} />
            <Text style={styles.legendText}>Half Day (HD)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.ABSENT }]} />
            <Text style={styles.legendText}>Absent (A)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.HOLIDAY }]} />
            <Text style={styles.legendText}>Paid Holiday (PH)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.LEAVE }]} />
            <Text style={styles.legendText}>Paid Leave (PL)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.WEEKLY_OFF }]} />
            <Text style={styles.legendText}>Weekly Off (WO)</Text>
          </View>
        </View>

        {/* Weekday Row (Sun - Sat) */}
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((w) => (
            <View key={w} style={styles.weekdayCol}>
              <Text style={styles.weekdayText}>{w}</Text>
            </View>
          ))}
        </View>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{ marginTop: 8, fontSize: 12, color: colors.textSecondary }}>
              Loading records for {monthName}...
            </Text>
          </View>
        ) : (
          <View style={styles.calendarGrid}>
            {/* Blank offset cells for starting day */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <View key={`empty-${idx}`} style={styles.dayCol} />
            ))}

            {days.map((day: DayAttendance, index: number) => {
              const dayNum = index + 1;
              const isToday =
                selectedYear === TODAY_YEAR &&
                selectedMonth === TODAY_MONTH &&
                dayNum === TODAY_DAY;
              const isSelected = selectedDay?.date === day.date;
              const bg = STATUS_COLORS[day.status] || colors.statusWeeklyOff;
              const statusCode = STATUS_CODES[day.status] || 'P';

              return (
                <View key={day.date} style={styles.dayCol}>
                  <TouchableOpacity
                    onPress={() => handleSelectDay(day)}
                    style={[
                      styles.dayBox,
                      { backgroundColor: bg },
                      isSelected && styles.selectedDayBox,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dayNum}>{dayNum}</Text>
                    <Text style={styles.dayStatusBadge}>{statusCode}</Text>
                    {isToday && <View style={styles.todayIndicator} />}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Selected Day Details Panel */}
      {selectedDay && (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View>
              <Text style={styles.detailDate}>{selectedDay.date}</Text>
              <Text style={styles.detailWeekday}>
                {new Date(selectedDay.date + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    selectedDay.status === 'UPCOMING' && selectedDay.holidayName
                      ? '#0D9488'
                      : STATUS_COLORS[selectedDay.status] || colors.primary,
                },
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {selectedDay.status === 'HOLIDAY'
                  ? 'PAID HOLIDAY (PH)'
                  : selectedDay.status === 'UPCOMING' && selectedDay.holidayName
                  ? 'UPCOMING HOLIDAY'
                  : selectedDay.status === 'LEAVE'
                  ? 'PAID LEAVE'
                  : selectedDay.status.replace('_', ' ')}
              </Text>
            </View>
          </View>

          {/* 3-Column Timing Breakdown with Large, Bold Values */}
          <View style={styles.detailRow}>
            <View style={styles.detailBox}>
              <Text style={styles.detailBoxLabel}>PUNCH IN</Text>
              <Text
                style={[
                  styles.detailBoxValue,
                  {
                    color:
                      selectedDay.status === 'HOLIDAY'
                        ? STATUS_COLORS.HOLIDAY
                        : STATUS_COLORS.PRESENT,
                  },
                ]}
              >
                {selectedDay.inTime || 'No Punch'}
              </Text>
            </View>

            <View style={styles.detailBox}>
              <Text style={styles.detailBoxLabel}>PUNCH OUT</Text>
              <Text
                style={[
                  styles.detailBoxValue,
                  { color: selectedDay.outTime && selectedDay.outTime !== 'No Punch' ? '#2563EB' : colors.textSecondary },
                ]}
              >
                {selectedDay.outTime || 'No Punch'}
              </Text>
            </View>

            <View style={styles.detailBox}>
              <Text style={styles.detailBoxLabel}>TOTAL HOURS</Text>
              <Text style={[styles.detailBoxValue, { color: colors.textPrimary }]}>
                {selectedDay.totalHours || '0.0 hrs'}
              </Text>
            </View>
          </View>

          {/* Clean Status Note */}
          <View style={styles.statusNoteCard}>
            <Text style={styles.statusNoteText}>
              {selectedDay.status === 'HOLIDAY'
                ? `🎉 ${selectedDay.holidayName || 'Gazetted Government Holiday'} • 100% Paid Shift Credit`
                : selectedDay.status === 'UPCOMING' && selectedDay.holidayName
                ? `📅 Upcoming Gazetted Holiday: ${selectedDay.holidayName} • Will be credited on that date`
                : selectedDay.status === 'PRESENT'
                ? `✓ Full Day Shift Completed (${selectedDay.totalHours || '8.0h'})`
                : selectedDay.status === 'HALF_DAY'
                ? `⚠ Half Day Shift Logged (${selectedDay.totalHours})`
                : selectedDay.status === 'LEAVE'
                ? '📋 Approved Paid Leave (From Quota)'
                : selectedDay.status === 'WEEKLY_OFF'
                ? '🏖️ Scheduled Weekly Rest Day'
                : selectedDay.status === 'UPCOMING'
                ? '📅 Scheduled Duty Day'
                : '⚠️ No Punch Recorded for this Date'}
            </Text>
          </View>

          {/* Selfie Proof Image preview */}
          {selectedDay.inImageUrl || selectedDay.outImageUrl ? (
            <View style={styles.photoContainer}>
              <Text style={styles.photoLabel}>📷 Selfie Verification Proof</Text>
              <View style={[styles.photoRow, { gap: 14 }]}>
                {selectedDay.inImageUrl ? (
                  <View style={{ alignItems: 'center' }}>
                    <Image
                      source={{ uri: apiConfig.getEndpoint(selectedDay.inImageUrl) }}
                      style={styles.photoThumb}
                      resizeMode="cover"
                    />
                    <Text style={{ fontSize: 11, color: '#059669', marginTop: 4, fontWeight: '700' }}>Punch IN</Text>
                  </View>
                ) : null}
                {selectedDay.outImageUrl ? (
                  <View style={{ alignItems: 'center' }}>
                    <Image
                      source={{ uri: apiConfig.getEndpoint(selectedDay.outImageUrl) }}
                      style={styles.photoThumb}
                      resizeMode="cover"
                    />
                    <Text style={{ fontSize: 11, color: '#2563EB', marginTop: 4, fontWeight: '700' }}>Punch OUT</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>
      )}
    </AppScreenContainer>
  );
};
