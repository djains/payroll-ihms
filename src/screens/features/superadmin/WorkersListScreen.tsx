import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Share,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './WorkersListScreen.styles';
import {
  AppScreenContainer,
  AppHeader,
  AppIcon,
  AppButton,
  CustomAlertModal,
  CustomAlertButton,
} from '../../../components/common';
import { useNavigation } from '../../../navigation/navigationContext';
import { apiClient, staffApi, superadminApi, API_ENDPOINTS } from '../../../api';
import { showToast } from '../../../store/toastStore';

interface WorkerItem {
  id?: number;
  emp_code: string;
  emp_name: string;
  emp_mobile_no?: string;
  emp_email_id?: string;
  unit_code?: string;
  client_code?: string;
  designation_code?: string;
  role?: string;
  employee_type?: string;
  joining_date?: string;
  location_city?: string;
  location?: string;
  status?: string;
}


const formatJoiningDate = (rawDate?: string): string => {
  if (!rawDate) return '—';
  try {
    const clean = rawDate.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parts[2];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (monthIdx >= 0 && monthIdx < 12) {
        return day + ' ' + months[monthIdx] + ' ' + year;
      }
    }
    return clean;
  } catch {
    return rawDate;
  }
};

const formatPunchTime = (rawStr: any): string => {
  if (!rawStr) return '';
  const s = String(rawStr).trim();
  if (!s || s === '--:--' || s.toLowerCase() === 'recorded' || s.toLowerCase() === 'null') return '';
  if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(s)) return s.toUpperCase();
  const timePart = s.includes(' ') || s.includes('T') ? s.split(/[ T]/)[1] : s;
  if (timePart) {
    const parts = timePart.split(':');
    const hh = parseInt(parts[0], 10);
    const mm = parseInt(parts[1], 10);
    if (!isNaN(hh) && !isNaN(mm)) {
      const ampm = hh >= 12 ? 'PM' : 'AM';
      const h12 = hh % 12 || 12;
      return `${String(h12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ampm}`;
    }
  }
  return s.length >= 5 ? s.substring(0, 5) : s;
};

const resolveWorkerPunchInfo = (logs: any[]) => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayDash = `${yyyy}-${mm}-${dd}`;
  const todaySlash = `${dd}/${mm}/${yyyy}`;

  if (!Array.isArray(logs) || logs.length === 0) {
    return { isPresent: false, inTime: '', outTime: '', punchDate: todaySlash, dateStr: todaySlash };
  }

  // Filter logs strictly for TODAY'S punches only
  const isFromToday = (l: any) => {
    const raw = String(
      l.date_time || l.Date_Time || l.camera_intime || l.Camera_intime || l.attendances_intime || l.datecurrent || l.offline_date || ''
    ).trim();
    return raw.startsWith(todayDash) || raw.includes(todaySlash);
  };

  const todayLogs = logs.filter(isFromToday);

  // If worker has no punches for today, reset completely to Not Present / Absent
  if (todayLogs.length === 0) {
    return {
      isPresent: false,
      inTime: '',
      outTime: '',
      punchDate: todaySlash,
      dateStr: todaySlash,
    };
  }

  const activeLog = todayLogs[0];
  let inTime = '';
  let outTime = '';

  const rawIn =
    activeLog.camera_intime ||
    activeLog.Camera_intime ||
    activeLog.attendances_intime ||
    activeLog.Attendances_intime ||
    activeLog.in_time ||
    (activeLog.punch_type?.toLowerCase() === 'in' ? activeLog.punch_time : null) ||
    activeLog.date_time;

  const rawOut =
    activeLog.camera_outtime ||
    activeLog.Camera_outtime ||
    activeLog.attendances_outtime ||
    activeLog.Attendances_outtime ||
    activeLog.out_time ||
    (activeLog.punch_type?.toLowerCase() === 'out' ? activeLog.punch_time : null);

  inTime = formatPunchTime(rawIn);
  outTime = formatPunchTime(rawOut);

  // Fallback: check other logs for today if punches were saved as separate rows
  if (!inTime) {
    for (const l of todayLogs) {
      if (String(l.attendances_click || l.punch_type || '').toLowerCase().includes('in')) {
        inTime = formatPunchTime(l.punch_time || l.datecurrent || l.date_time);
        if (inTime) break;
      }
    }
  }
  if (!outTime) {
    for (const l of todayLogs) {
      const rOut =
        l.camera_outtime ||
        l.Camera_outtime ||
        l.attendances_outtime ||
        l.Attendances_outtime ||
        l.out_time;
      if (rOut) {
        outTime = formatPunchTime(rOut);
        if (outTime) break;
      }
      if (String(l.attendances_click || l.punch_type || '').toLowerCase().includes('out')) {
        outTime = formatPunchTime(l.punch_time || l.datecurrent || l.date_time);
        if (outTime) break;
      }
    }
  }

  return {
    isPresent: !!inTime,
    inTime,
    outTime,
    punchDate: todaySlash,
    dateStr: todaySlash,
  };
};

export const WorkersListScreen: React.FC = () => {
  const { goBack, navigate } = useNavigation();
  const insets = useSafeAreaInsets();

  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('ALL');

  // Expandable live attendance logs per worker
  const [attendanceData, setAttendanceData] = useState<
    Record<string, { loading: boolean; logs: any[]; fetched: boolean }>
  >({});

  // Collapsible dropdown worker cards state
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleCardExpand = (empCode: string) => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCards((prev) => ({
      ...prev,
      [empCode]: !prev[empCode],
    }));
  };

  // Assign Shift Modal State
  const [assignShiftModalVisible, setAssignShiftModalVisible] = useState(false);
  const [selectedWorkerForShift, setSelectedWorkerForShift] = useState<WorkerItem | null>(null);
  const [availableShifts, setAvailableShifts] = useState<any[]>([]);
  const [loadingAvailableShifts, setLoadingAvailableShifts] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
  const [savingShiftAssignment, setSavingShiftAssignment] = useState(false);
  const [assignedShiftsMap, setAssignedShiftsMap] = useState<Record<string, string>>({});
  const [promotingEmpCode, setPromotingEmpCode] = useState<string | null>(null);

  // Send Credentials Modal State
  const [sendCredsModalVisible, setSendCredsModalVisible] = useState(false);
  const [selectedWorkerForCreds, setSelectedWorkerForCreds] = useState<WorkerItem | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('Staff@123');

  // Send Salary Slip Modal State
  const [sendSlipModalVisible, setSendSlipModalVisible] = useState(false);
  const [selectedWorkerForSlip, setSelectedWorkerForSlip] = useState<WorkerItem | null>(null);
  const [slipMonth, setSlipMonth] = useState<number>(new Date().getMonth() + 1);
  const [slipYear, setSlipYear] = useState<number>(new Date().getFullYear());
  const [slipRecipientEmail, setSlipRecipientEmail] = useState('');
  const [fetchingSlipData, setFetchingSlipData] = useState(false);
  const [workerSlipData, setWorkerSlipData] = useState<any | null>(null);

  // Live Tracking Modal State (strictly SQL-backed via /api/attendance/android-logs-portal/current-location/)
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [selectedWorkerForTracking, setSelectedWorkerForTracking] = useState<WorkerItem | null>(null);
  const [trackingLogs, setTrackingLogs] = useState<any[]>([]);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [trackingDaysRange, setTrackingDaysRange] = useState<1 | 7 | 30>(7);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [todayPunchStatus, setTodayPunchStatus] = useState<'not_punched' | 'active' | 'ended' | null>(null);
  const [todayPunchLabel, setTodayPunchLabel] = useState<string>('');
  const [resolvedAddressesMap, setResolvedAddressesMap] = useState<Record<string, string>>({});

  // Custom Global Alert State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    type?: 'info' | 'warning' | 'success' | 'danger';
    buttons?: CustomAlertButton[];
  }>({
    visible: false,
    title: '',
  });

  const fetchWorkers = async () => {
    try {
      const res = await apiClient.get<any>(`${API_ENDPOINTS.EMPLOYEES}?page=1`);
      if (res.success && res.data) {
        const raw = res.data;
        const list: WorkerItem[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw.results)
            ? raw.results
            : [];
        setWorkers(list);
      }
    } catch (e) {
      console.warn('[WorkersListScreen] Error fetching employees:', e);
      showToast({
        type: 'error',
        title: 'Network Error',
        message: 'Could not load workers list from backend.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWorkers();
  };

  const handleToggleAttendance = async (empCode: string) => {
    const existing = attendanceData[empCode];
    if (existing && existing.fetched) {
      // Toggle visibility off by removing or collapsing
      setAttendanceData((prev) => ({
        ...prev,
        [empCode]: { ...existing, fetched: !existing.fetched },
      }));
      return;
    }

    setAttendanceData((prev) => ({
      ...prev,
      [empCode]: { loading: true, logs: [], fetched: true },
    }));

    try {
      const res = await staffApi.getLivePunchLogs(empCode);
      let logs: any[] = [];
      if (res.success && res.data) {
        const d = res.data;
        logs = Array.isArray(d) ? d : Array.isArray(d.results) ? d.results : [];
      }
      setAttendanceData((prev) => ({
        ...prev,
        [empCode]: { loading: false, logs, fetched: true },
      }));
    } catch (err) {
      console.warn('[WorkersList] Error fetching attendance for', empCode, err);
      setAttendanceData((prev) => ({
        ...prev,
        [empCode]: { loading: false, logs: [], fetched: true },
      }));
    }
  };

  const handleOpenAssignShift = async (worker: WorkerItem) => {
    setSelectedWorkerForShift(worker);
    setSelectedShiftId(null);
    setAssignShiftModalVisible(true);
    setLoadingAvailableShifts(true);
    try {
      const res = await superadminApi.getShifts(worker.unit_code);
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
        setAvailableShifts(list);
        if (list.length > 0) {
          setSelectedShiftId(list[0].id);
        }
      } else {
        setAvailableShifts([]);
      }
    } catch {
      setAvailableShifts([]);
    } finally {
      setLoadingAvailableShifts(false);
    }
  };

  const handleSaveShiftAssignment = async () => {
    if (!selectedWorkerForShift || !selectedShiftId) {
      showToast({ type: 'error', title: 'Selection Missing', message: 'Please select a shift.' });
      return;
    }

    const chosenShift = availableShifts.find((s) => s.id === selectedShiftId);
    setSavingShiftAssignment(true);

    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      const monthDays = new Date(year, month, 0).getDate();

      // Populate full month with this shift
      const daysPayload: Record<string, number> = {};
      for (let d = 1; d <= monthDays; d++) {
        daysPayload[`day${String(d).padStart(2, '0')}`] = selectedShiftId;
      }

      const res = await apiClient.post<any>('/api/masters/shift-calendar/update_row/', {
        emp_code: selectedWorkerForShift.emp_code,
        unit_code: selectedWorkerForShift.unit_code || '',
        month,
        year,
        days: daysPayload,
      });

      // Also persist assigned shift_type and timings directly to Employee Master so Attendance Punch & Profile reflect it immediately
      if (chosenShift) {
        try {
          await apiClient.patch<any>(`/api/hr/employees/${encodeURIComponent(selectedWorkerForShift.emp_code)}/`, {
            shift_type: chosenShift.shift_name,
            in_time: chosenShift.shift_from || '09:00',
            working_hours: '8.0',
          });
        } catch (ePatch) {
          console.warn('[WorkersList] could not patch employee master shift_type:', ePatch);
        }
      }

      if (res.success) {
        setAssignedShiftsMap((prev) => ({
          ...prev,
          [selectedWorkerForShift.emp_code]: chosenShift?.shift_name || 'Assigned',
        }));
        showToast({
          type: 'success',
          title: 'Shift Assigned',
          message: `${chosenShift?.shift_name || 'Shift'} assigned to ${selectedWorkerForShift.emp_name} for current cycle!`,
        });
        setAssignShiftModalVisible(false);
      } else {
        showToast({
          type: 'error',
          title: 'Assignment Failed',
          message: res.error || 'Could not assign shift.',
        });
      }
    } catch (e: any) {
      showToast({
        type: 'error',
        title: 'Error',
        message: e?.message || 'Failed to connect to backend.',
      });
    } finally {
      setSavingShiftAssignment(false);
    }
  };

  const handlePromoteToSupervisor = (worker: WorkerItem) => {
    setAlertConfig({
      visible: true,
      title: 'Promote to Unit Supervisor',
      message: `Do you want to designate ${worker.emp_name} (${worker.emp_code}) as the Unit Supervisor for Unit ${worker.unit_code || 'current site'}?\n\nThis will update their role to Supervisor and set them as the Reporting Officer for all other workers in this unit so leave applications will be routed directly to them for approval.`,
      type: 'warning',
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
        },
        {
          text: 'Promote',
          style: 'default',
          onPress: async () => {
            setAlertConfig((prev) => ({ ...prev, visible: false }));
            setPromotingEmpCode(worker.emp_code);
            try {
              // 1. Promote this employee to Supervisor in backend
              const promoteRes = await apiClient.patch<any>(
                `${API_ENDPOINTS.EMPLOYEES}${worker.emp_code}/`,
                {
                  role: 'Supervisor',
                  designation_code: 'Supervisor',
                  grade_code: 'Supervisor',
                }
              );

              if (!promoteRes.success) {
                setAlertConfig({
                  visible: true,
                  title: 'Promotion Failed',
                  message: promoteRes.error || 'Failed to update employee role on backend.',
                  type: 'danger',
                  buttons: [
                    {
                      text: 'OK',
                      onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
                    },
                  ],
                });
                setPromotingEmpCode(null);
                return;
              }

              // 2. Ensure Supervisor role exists in enterprise roles
              try {
                const rolesRes = await superadminApi.getRoles();
                const existingRoles = Array.isArray(rolesRes.data)
                  ? rolesRes.data
                  : rolesRes.data?.results || [];
                const hasSupRole = existingRoles.some(
                  (r: any) => (r.name || '').toLowerCase() === 'supervisor'
                );
                if (!hasSupRole) {
                  await superadminApi.createRole({
                    name: 'Supervisor',
                    approval_level: '1',
                  });
                }
              } catch (roleErr) {
                console.warn('[WorkersList] Ensure supervisor role error:', roleErr);
              }

              // 3. Set reporting_to on all other workers in the same unit
              if (worker.unit_code) {
                const unitWorkers = workers.filter(
                  (w) => w.unit_code === worker.unit_code && w.emp_code !== worker.emp_code
                );
                if (unitWorkers.length > 0) {
                  await Promise.allSettled(
                    unitWorkers.map((w) =>
                      apiClient.patch(`${API_ENDPOINTS.EMPLOYEES}${w.emp_code}/`, {
                        reporting_to: worker.emp_code,
                      })
                    )
                  );
                }
              }

              setAlertConfig({
                visible: true,
                title: 'Supervisor Appointed',
                message: `${worker.emp_name} is now the Supervisor for Unit ${worker.unit_code || ''}.\n\nAll workers in this unit have been assigned to report to them, and leave applications will now be routed directly to them for review.`,
                type: 'success',
                buttons: [
                  {
                    text: 'Done',
                    onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
                  },
                ],
              });

              // 3. Refresh list from backend
              fetchWorkers();
            } catch (err: any) {
              setAlertConfig({
                visible: true,
                title: 'Error',
                message: err?.message || 'Could not complete promotion.',
                type: 'danger',
                buttons: [
                  {
                    text: 'OK',
                    onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
                  },
                ],
              });
            } finally {
              setPromotingEmpCode(null);
            }
          },
        },
      ],
    });
  };

  const handleOpenSendCredentials = (worker: WorkerItem) => {
    setSelectedWorkerForCreds(worker);
    setRecipientEmail(worker.emp_email_id || '');
    setTempPassword('Staff@123');
    setSendCredsModalVisible(true);
  };

  const formatDdmmyyyy = (dt: Date) => {
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const fetchWorkerLiveTracking = async (worker: WorkerItem, daysRange: 1 | 7 | 30) => {
    setLoadingTracking(true);
    setTrackingError(null);
    try {
      const toDt = new Date();
      const fromDt = new Date();
      fromDt.setDate(toDt.getDate() - (daysRange - 1));

      const unitParam = (worker.unit_code || '').trim();
      const url = `/api/masters/portal/ho/tracking/?unit_code=${encodeURIComponent(
        unitParam
      )}&from=${encodeURIComponent(formatDdmmyyyy(fromDt))}&to=${encodeURIComponent(
        formatDdmmyyyy(toDt)
      )}`;

      const [trackResult, punchResult] = await Promise.allSettled([
        apiClient.get<any>(url),
        staffApi.getLivePunchLogs(worker.emp_code),
      ]);

      // Resolve today's punch-in / punch-out status from SQL punch logs
      if (punchResult.status === 'fulfilled' && punchResult.value.success && punchResult.value.data) {
        const pLogs = Array.isArray(punchResult.value.data)
          ? punchResult.value.data
          : (punchResult.value.data as any).results || [];
        const yyyy = toDt.getFullYear();
        const mm = String(toDt.getMonth() + 1).padStart(2, '0');
        const dd = String(toDt.getDate()).padStart(2, '0');
        const todayDash = `${yyyy}-${mm}-${dd}`;
        const todaySlash = `${dd}/${mm}/${yyyy}`;

        const todayPunch = Array.isArray(pLogs)
          ? pLogs.find((log: any) => {
              const raw = String(
                log.date_time || log.Date_Time || log.attendances_intime || log.camera_intime || ''
              ).trim();
              return raw.startsWith(todayDash) || raw.includes(todaySlash);
            })
          : null;

        if (todayPunch) {
          const rawIn =
            todayPunch.camera_intime || todayPunch.Camera_intime || todayPunch.attendances_intime;
          const rawOut =
            todayPunch.camera_outtime || todayPunch.Camera_outtime || todayPunch.attendances_outtime;
          const formattedIn = formatPunchTime(rawIn);
          const formattedOut = formatPunchTime(rawOut);
          if (formattedIn && formattedOut) {
            setTodayPunchStatus('ended');
            setTodayPunchLabel(`Shift Completed Today • IN: ${formattedIn} • OUT: ${formattedOut}`);
          } else if (formattedIn) {
            setTodayPunchStatus('active');
            setTodayPunchLabel(`Shift Active • Punched In at ${formattedIn}`);
          } else {
            setTodayPunchStatus('not_punched');
            setTodayPunchLabel('Not Punched In Today');
          }
        } else {
          setTodayPunchStatus('not_punched');
          setTodayPunchLabel('Not Punched In Today');
        }
      } else {
        setTodayPunchStatus('not_punched');
        setTodayPunchLabel('Not Punched In Today');
      }

      if (trackResult.status === 'fulfilled' && trackResult.value.success && trackResult.value.data) {
        const resData = trackResult.value.data;
        const list = Array.isArray(resData) ? resData : resData.results || [];
        const targetName = (worker.emp_name || '').trim().toLowerCase();
        const targetCode = (worker.emp_code || '').trim().toLowerCase();
        // Backend aliases emp_name (e.g. "Name" or "Name-Reliever") as `emp_code` in tracking
        const workerRows = list.filter((r: any) => {
          const rEmp = String(r.emp_code || '').trim().toLowerCase();
          return (targetName && rEmp.includes(targetName)) || (targetCode && rEmp === targetCode);
        });
        setTrackingLogs(workerRows);

        // Reverse-geocode any ping whose address is missing or generic (so Admin sees exact street/area address)
        workerRows.slice(0, 10).forEach(async (row: any) => {
          const rLat = String(row.cur_latitude || '').trim();
          const rLon = String(row.cur_longtitude || '').trim();
          const rAddr = String(row.cur_address || '').trim();
          const key = `${rLat},${rLon}`;
          if (!rLat || !rLon) return;
          const isGeneric =
            !rAddr ||
            rAddr.toLowerCase() === 'active shift gps ping' ||
            rAddr.toLowerCase() === 'field gps ping' ||
            rAddr.length < 18;
          if (!isGeneric) return;
          try {
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(rLat)}&lon=${encodeURIComponent(rLon)}&zoom=18&addressdetails=1`,
              { headers: { 'User-Agent': 'IHMS-Mobile-App/1.0' } }
            );
            if (geoRes.ok) {
              const gj: any = await geoRes.json();
              if (gj?.display_name) {
                setResolvedAddressesMap((prev) => ({ ...prev, [key]: String(gj.display_name) }));
              }
            }
          } catch {}
        });
      } else {
        setTrackingLogs([]);
        const errMsg =
          trackResult.status === 'fulfilled'
            ? trackResult.value.error
            : 'Could not fetch live tracking records from SQL.';
        setTrackingError(errMsg || 'Could not fetch live tracking records from SQL.');
      }
    } catch (e: any) {
      setTrackingLogs([]);
      setTrackingError(e?.message || 'Network error while fetching tracking logs.');
    } finally {
      setLoadingTracking(false);
    }
  };

  const handleOpenLiveTracking = (worker: WorkerItem) => {
    setSelectedWorkerForTracking(worker);
    setTrackingDaysRange(1);
    setTrackingLogs([]);
    setTodayPunchStatus(null);
    setTodayPunchLabel('');
    setTrackingModalVisible(true);
    fetchWorkerLiveTracking(worker, 1);
  };

  const handleOpenSendSalarySlip = async (worker: WorkerItem) => {
    setSelectedWorkerForSlip(worker);
    setSlipRecipientEmail(worker.emp_email_id || '');
    const currentM = new Date().getMonth() + 1;
    const currentY = new Date().getFullYear();
    setSlipMonth(currentM);
    setSlipYear(currentY);
    setWorkerSlipData(null);
    setSendSlipModalVisible(true);

    // Fetch live processed salary stats from backend SQL for this worker
    setFetchingSlipData(true);
    try {
      const res = await apiClient.get<any>(
        `/api/payroll/mobile-salary-slip/data/?month=${currentM}&year=${currentY}&emp=${encodeURIComponent(worker.emp_code)}`
      );
      if (res.success && res.data) {
        setWorkerSlipData(res.data);
      }
    } catch (e) {
      console.warn('[WorkersListScreen] Slip data check:', e);
    } finally {
      setFetchingSlipData(false);
    }
  };

  const handleSendSalarySlipEmail = async () => {
    if (!selectedWorkerForSlip) return;
    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const mName = monthNames[slipMonth] || `Month ${slipMonth}`;
    const subject = `Official Salary Slip - ${mName} ${slipYear} | ${selectedWorkerForSlip.emp_name} (${selectedWorkerForSlip.emp_code})`;

    const gross = workerSlipData?.basic_vda ? `₹${workerSlipData.basic_vda}` : 'As per muster';
    const net = workerSlipData?.Payment ? `₹${workerSlipData.Payment}` : 'Calculated';
    const days = workerSlipData?.Total_Days_Present || workerSlipData?.Working_Days || 'Recorded';

    const body = `Dear ${selectedWorkerForSlip.emp_name},

Please find below the summary of your official Salary Slip for ${mName} ${slipYear}:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Employee ID: ${selectedWorkerForSlip.emp_code}
• Designation: ${selectedWorkerForSlip.designation_code || selectedWorkerForSlip.role || 'Staff'}
• Site / Unit: ${selectedWorkerForSlip.unit_code || 'Site Unit'}
• Period: ${mName} ${slipYear}
• Days Present: ${days}
• Net Payable Amount: ${net}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You can also view and download your full printable PDF salary slip anytime by logging into the NG GLOBAL Mobile App:
🔗 Portal: https://ihms.app

For any payroll queries, please reach out to the NG GLOBAL Accounts & HR Department.

Best regards,
Payroll & Accounts Team
NG GLOBAL Integrated Solutions`;

    const emailTo = slipRecipientEmail.trim();
    const mailtoUrl = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      await Linking.openURL(mailtoUrl);
      showToast({
        type: 'success',
        title: 'Gmail / Email Opened',
        message: `Salary slip draft ready for ${selectedWorkerForSlip.emp_name}.`,
      });
      setSendSlipModalVisible(false);
    } catch {
      try {
        await Share.share({ title: subject, message: body });
        setSendSlipModalVisible(false);
      } catch {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Unable to open mail client on this device.',
        });
      }
    }
  };

  const buildCredentialMessage = (worker: WorkerItem, pass: string) => {
    return {
      subject: `NG GLOBAL Portal - Login Credentials for ${worker.emp_name} (${worker.emp_code})`,
      body: `Hello ${worker.emp_name},

Welcome to the team! Below are your official NG GLOBAL mobile app login credentials:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Portal / App Link: https://ihms.app
• Login ID (Username): ${worker.emp_code}
• Password: ${pass}
• Designation: ${worker.designation_code || worker.role || 'Staff'}
• Assigned Site: ${worker.unit_code || 'Site Unit'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please download the NG GLOBAL app and sign in with the Login ID and Password provided above.
If you have any questions or need assistance, please contact your unit supervisor.

Best regards,
NG GLOBAL Administration`,
    };
  };

  const handleSendEmail = async () => {
    if (!selectedWorkerForCreds) return;
    const { subject, body } = buildCredentialMessage(selectedWorkerForCreds, tempPassword);
    const emailTo = recipientEmail.trim();
    const mailtoUrl = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      // Direct open without relying strictly on canOpenURL on Android 11+
      await Linking.openURL(mailtoUrl);
      showToast({
        type: 'success',
        title: 'Gmail / Email Opened',
        message: `Ready to send credentials to ${selectedWorkerForCreds.emp_name}.`,
      });
      setSendCredsModalVisible(false);
    } catch (e) {
      console.warn('[handleSendEmail] openURL direct failed, falling back to Share:', e);
      try {
        await Share.share({ title: subject, message: body });
        setSendCredsModalVisible(false);
      } catch {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Unable to open mail client or share.',
        });
      }
    }
  };

  // Distinct unit codes for quick filter chips
  const unitOptions = useMemo(() => {
    const map = new Map<string, number>();
    workers.forEach((w) => {
      const code = (w.unit_code || '').trim() || 'Unassigned';
      map.set(code, (map.get(code) || 0) + 1);
    });
    const list: Array<{ code: string; label: string; count: number }> = [
      { code: 'ALL', label: 'All Units', count: workers.length },
    ];
    map.forEach((count, code) => {
      list.push({ code, label: code, count });
    });
    return list;
  }, [workers]);

  // Filtered workers list
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        (w.emp_name && w.emp_name.toLowerCase().includes(q)) ||
        (w.emp_code && w.emp_code.toLowerCase().includes(q)) ||
        (w.emp_mobile_no && w.emp_mobile_no.includes(q)) ||
        (w.designation_code && w.designation_code.toLowerCase().includes(q));

      const wUnit = (w.unit_code || '').trim() || 'Unassigned';
      const matchUnit =
        selectedUnitFilter === 'ALL' || wUnit === selectedUnitFilter;

      return matchQuery && matchUnit;
    });
  }, [workers, searchQuery, selectedUnitFilter]);

  const renderWorkerCard = ({ item }: { item: WorkerItem }) => {
    const isExpanded = !!expandedCards[item.emp_code];
    const attInfo = attendanceData[item.emp_code];
    const initial = (item.emp_name || 'W').charAt(0).toUpperCase();
    const isSupervisor =
      (item.role || '').toLowerCase() === 'supervisor' ||
      (item.designation_code || '').toLowerCase().includes('supervisor');

    return (
      <View style={styles.workerCard}>
        {/* Top Header - Tappable Dropdown Header */}
        <TouchableOpacity
          style={styles.cardHeaderPressable}
          onPress={() => toggleCardExpand(item.emp_code)}
          activeOpacity={0.7}
        >
          <View style={[styles.cardTopRow, isExpanded && styles.cardTopRowExpanded]}>
            <View style={styles.workerAvatar}>
              <Text style={styles.workerAvatarText}>{initial}</Text>
            </View>

            <View style={styles.workerMeta}>
              <Text style={styles.workerName}>{item.emp_name}</Text>
              <View style={styles.rolePillWrap}>
                <View style={styles.codeBadge}>
                  <Text style={styles.codeBadgeText}>{item.emp_code}</Text>
                </View>
                {isSupervisor ? (
                  <View style={styles.supervisorActiveBadge}>
                    <Text style={styles.supervisorActiveText}>👑 Unit Supervisor</Text>
                  </View>
                ) : (
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>
                      {item.designation_code || item.role || 'Staff'}
                    </Text>
                  </View>
                )}
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>Active</Text>
                </View>
              </View>
            </View>

            <View style={styles.chevronWrap}>
              <AppIcon
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#0F766E"
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* Collapsible Dropdown Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.cardDivider} />

            {/* Credentials Section */}
            <View style={styles.credsCard}>
              <View style={styles.credsHeader}>
                <View style={styles.credsHeaderLeft}>
                  <AppIcon name="lock" size={13} color="#0F766E" />
                  <Text style={styles.credsHeaderText}>APP LOGIN CREDENTIALS</Text>
                </View>
              </View>

              {/* Username / Login ID */}
              <View style={styles.credRow}>
                <Text style={styles.credLabel}>Login ID (Username):</Text>
                <View style={styles.credValueRow}>
                  <Text style={styles.credValue}>{item.emp_code}</Text>
                </View>
              </View>

              {/* Contact Mobile */}
              {item.emp_mobile_no ? (
                <View style={styles.credRow}>
                  <Text style={styles.credLabel}>Contact Mobile:</Text>
                  <Text style={styles.credValue}>{item.emp_mobile_no}</Text>
                </View>
              ) : null}

              {/* Contact Email */}
              {item.emp_email_id ? (
                <View style={styles.credRow}>
                  <Text style={styles.credLabel}>Email ID:</Text>
                  <Text style={styles.credValue}>{item.emp_email_id}</Text>
                </View>
              ) : null}

              {/* Action Buttons: Credentials & Salary Slip */}
              <View style={styles.credentialsActionsRow}>
                <TouchableOpacity
                  style={styles.sendCredentialsBtn}
                  onPress={() => handleOpenSendCredentials(item)}
                  activeOpacity={0.8}
                >
                  <AppIcon name="lock" size={12} color="#0F766E" />
                  <Text style={styles.sendCredentialsBtnText}>Send Login ID</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sendCredentialsBtn, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
                  onPress={() => handleOpenLiveTracking(item)}
                  activeOpacity={0.8}
                >
                  <AppIcon name="location" size={12} color="#1D4ED8" />
                  <Text style={[styles.sendCredentialsBtnText, { color: '#1D4ED8' }]}>Live Tracking</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Deployment Info Grid */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                  <AppIcon name="home" size={13} color="#0F766E" />
                  <Text style={styles.detailLabel}>Site Unit</Text>
                </View>
                <Text style={styles.detailVal} numberOfLines={1}>
                  {item.unit_code || 'Unassigned'}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                  <AppIcon name="map-pin" size={13} color="#0F766E" />
                  <Text style={styles.detailLabel}>Location</Text>
                </View>
                <Text style={styles.detailVal} numberOfLines={1}>
                  {item.location_city || item.location || 'Site Location'}
                </Text>
              </View>

              <View style={[styles.detailItem, styles.detailItemWide]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                  <AppIcon name="calendar" size={13} color="#0F766E" />
                  <Text style={styles.detailLabel}>Joining Date</Text>
                </View>
                <Text style={styles.detailVal} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                  {formatJoiningDate(item.joining_date)}
                </Text>
              </View>
            </View>

            {/* Attendance Summary & Action */}
            <View style={styles.attendanceRow}>
              <TouchableOpacity
                style={styles.assignShiftBtn}
                onPress={() => handleOpenAssignShift(item)}
                activeOpacity={0.75}
              >
                <AppIcon name="clock" size={12} color="#B45309" />
                <Text style={styles.assignShiftBtnText}>
                  {assignedShiftsMap[item.emp_code] || 'Assign Shift'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.viewAttBtn}
                onPress={() => handleToggleAttendance(item.emp_code)}
                activeOpacity={0.7}
              >
                <AppIcon name="calendar" size={12} color="#0F766E" />
                <Text style={styles.viewAttBtnText}>
                  {attInfo?.fetched ? 'Hide Logs' : 'View Attendance'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 👑 Direct Promote to Unit Supervisor Action */}
            <TouchableOpacity
              style={[
                styles.promoteSupervisorBtn,
                promotingEmpCode === item.emp_code && styles.promoteSupervisorBtnDisabled,
              ]}
              onPress={() => handlePromoteToSupervisor(item)}
              disabled={promotingEmpCode !== null}
              activeOpacity={0.8}
            >
              {promotingEmpCode === item.emp_code ? (
                <ActivityIndicator size="small" color="#92400E" />
              ) : (
                <Text style={styles.promoteSupervisorBtnText}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><AppIcon name="shield" size={13} color={isSupervisor ? "#0F766E" : "#D97706"} /><Text style={[styles.promoteSupervisorBtnText, isSupervisor && { color: '#0F766E' }]}>{isSupervisor ? 'Assigned as Unit Supervisor' : 'Promote to Unit Supervisor'}</Text></View>
                </Text>
              )}
            </TouchableOpacity>

            {/* Live Attendance Drawer */}
            {attInfo?.fetched ? (
              <View style={styles.attendanceLogsDrawer}>
                {attInfo.loading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
                    <ActivityIndicator size="small" color="#0F766E" />
                    <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }}>Checking today's attendance...</Text>
                  </View>
                ) : (() => {
                  const punch = resolveWorkerPunchInfo(attInfo.logs);
                  if (punch.isPresent && punch.inTime) {
                    return (
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' }} />
                            <Text style={{ fontSize: 12, fontWeight: '800', color: '#15803D' }}>
                              PRESENT TODAY
                            </Text>
                          </View>
                          <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '600' }}>
                            {punch.outTime ? 'Shift Completed' : 'Shift Active'}
                          </Text>
                        </View>

                        <View style={styles.logRow}>
                          <Text style={styles.logLabel}>First Punch (In)</Text>
                          <Text style={styles.logVal}>{punch.inTime || '--:--'}</Text>
                        </View>

                        <View style={styles.logRow}>
                          <Text style={styles.logLabel}>First Punch (Out)</Text>
                          <Text style={[styles.logVal, !punch.outTime && { color: '#94A3B8' }]}>
                            {punch.outTime || 'Not Punched Out'}
                          </Text>
                        </View>
                      </View>
                    );
                  }
                  return (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#DC2626' }} />
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#DC2626' }}>NOT PRESENT TODAY</Text>
                    </View>
                  );
                })()}
              </View>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  return (
    <AppScreenContainer
      style={styles.container}
      backgroundColor="#F8FAFC"
      header={
        <AppHeader
          title="Workers Directory"
          subtitle="Credentials, Roles & Attendance"
          onBack={goBack}
          rightComponent={
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={() => navigate('AddStaff')}
              activeOpacity={0.8}
            >
              <AppIcon name="plus" size={14} color="#FFFFFF" />
              <Text style={styles.headerActionText}>Add Staff</Text>
            </TouchableOpacity>
          }
        />
      }
    >
      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputWrap}>
          <AppIcon name="search" size={16} color="#64748B" />
          <TextInput
            placeholder="Search by worker name, ID, mobile or role..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <AppIcon name="close" size={14} color="#64748B" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Unit Filter Tabs */}
      {unitOptions.length > 1 ? (
        <View style={styles.unitTabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.unitFilterScroll}
          >
            {unitOptions.map((opt) => {
              const isSel = selectedUnitFilter === opt.code;
              return (
                <TouchableOpacity
                  key={opt.code}
                  style={[styles.unitChip, isSel && styles.unitChipActive]}
                  onPress={() => setSelectedUnitFilter(opt.code)}
                  activeOpacity={0.75}
                >
                  <AppIcon
                    name={opt.code === 'ALL' ? 'layers' : 'home'}
                    size={14}
                    color={isSel ? '#FFFFFF' : '#0F766E'}
                  />
                  <Text style={[styles.unitChipText, isSel && styles.unitChipTextActive]}>
                    {opt.label}
                  </Text>
                  <View style={[styles.unitCountBadge, isSel && styles.unitCountBadgeActive]}>
                    <Text style={[styles.unitCountBadgeText, isSel && styles.unitCountBadgeTextActive]}>
                      {opt.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {/* Count Banner */}
      <View style={styles.countBanner}>
        <Text style={styles.countBannerText}>
          {loading
            ? 'Loading workforce...'
            : `${filteredWorkers.length} Worker${filteredWorkers.length === 1 ? '' : 's'} Deployed`}
        </Text>
      </View>

      {/* Workers List */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
          <ActivityIndicator size="small" color="#0F766E" />
          <Text style={{ marginTop: 8, color: '#64748B', fontSize: 12 }}>
            Fetching company workers from MySQL...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredWorkers}
          keyExtractor={(item) => item.emp_code}
          renderItem={renderWorkerCard}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 30 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0F766E']}
              tintColor="#0F766E"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AppIcon name="users" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Workers Found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? 'No personnel matching your search query.'
                  : 'No workers have been deployed yet. Deploy your first worker to a site unit.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => navigate('AddStaff')}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyActionBtnText}>+ Deploy First Worker</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Assign Shift Bottom Sheet Modal */}
      <Modal
        visible={assignShiftModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAssignShiftModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Assign Shift</Text>
                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700', marginTop: 2 }}>
                  Worker: {selectedWorkerForShift?.emp_name} ({selectedWorkerForShift?.emp_code}) • Unit: {selectedWorkerForShift?.unit_code}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setAssignShiftModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <AppIcon name="close" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A', marginBottom: 8 }}>
                Select Shift for this Worker:
              </Text>

              {loadingAvailableShifts ? (
                <ActivityIndicator size="small" color="#0F766E" style={{ marginVertical: 20 }} />
              ) : availableShifts.length > 0 ? (
                availableShifts.map((shift: any) => {
                  const isSelected = selectedShiftId === shift.id;
                  return (
                    <TouchableOpacity
                      key={shift.id}
                      style={[styles.shiftOptionCard, isSelected && styles.shiftOptionCardSelected]}
                      onPress={() => setSelectedShiftId(shift.id)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.shiftOptionName}>{shift.shift_name}</Text>
                        <Text style={styles.shiftOptionTime}>
                          Timing: {shift.shift_from} - {shift.shift_to}
                        </Text>
                      </View>
                      <AppIcon
                        name={isSelected ? 'check-circle' : 'clock'}
                        size={18}
                        color={isSelected ? '#0F766E' : '#94A3B8'}
                      />
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={{ padding: 16, backgroundColor: '#FEF2F2', borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', marginBottom: 12 }}>
                  <Text style={{ fontSize: 12, color: '#DC2626', fontWeight: '700', textAlign: 'center' }}>
                    No shifts created for Unit {selectedWorkerForShift?.unit_code} yet!
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748B', textAlign: 'center', marginTop: 4 }}>
                    Please go to Site Units and click "Manage Shifts" to add a shift for this site.
                  </Text>
                </View>
              )}

              {availableShifts.length > 0 && (
                <AppButton
                  title={savingShiftAssignment ? 'Assigning...' : 'Confirm Shift Assignment'}
                  onPress={handleSaveShiftAssignment}
                  loading={savingShiftAssignment}
                  style={{ marginTop: 12, marginBottom: 10 }}
                />
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Send Credentials Modal */}
      <Modal
        visible={sendCredsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSendCredsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Send Credentials</Text>
                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700', marginTop: 2 }}>
                  Worker: {selectedWorkerForCreds?.emp_name} ({selectedWorkerForCreds?.emp_code}) • Unit: {selectedWorkerForCreds?.unit_code || 'Site'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSendCredsModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <AppIcon name="close" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }}>
              {/* Credentials Preview Card */}
              <View style={styles.credsPreviewBox}>
                <View style={styles.credsPreviewRow}>
                  <Text style={styles.credsPreviewLabel}>Portal URL:</Text>
                  <Text style={styles.credsPreviewVal}>https://ihms.app</Text>
                </View>
                <View style={styles.credsPreviewRow}>
                  <Text style={styles.credsPreviewLabel}>Login ID:</Text>
                  <Text style={[styles.credsPreviewVal, { color: '#0F766E', fontWeight: '800' }]}>
                    {selectedWorkerForCreds?.emp_code}
                  </Text>
                </View>
                <View style={styles.credsPreviewRow}>
                  <Text style={styles.credsPreviewLabel}>Password:</Text>
                  <Text style={[styles.credsPreviewVal, { color: '#B45309', fontWeight: '800' }]}>
                    {tempPassword}
                  </Text>
                </View>
              </View>

              {/* Editable Recipient Email Input */}
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.inputFieldLabel}>Recipient Email Address:</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="e.g. worker@example.com"
                  placeholderTextColor="#94A3B8"
                  value={recipientEmail}
                  onChangeText={setRecipientEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Editable Temporary Password Input */}
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.inputFieldLabel}>Temporary Password to Send:</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="Staff@123"
                  placeholderTextColor="#94A3B8"
                  value={tempPassword}
                  onChangeText={setTempPassword}
                  autoCapitalize="none"
                />
              </View>

              {/* Action Button: Send via Gmail */}
              <TouchableOpacity
                style={styles.sendEmailActionBtn}
                onPress={handleSendEmail}
                activeOpacity={0.8}
              >
                <AppIcon name="mail" size={16} color="#FFFFFF" />
                <Text style={styles.sendEmailActionBtnText}>
                  Send via Gmail
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Send Salary Slip Modal */}
      <Modal
        visible={sendSlipModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSendSlipModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Send Salary Slip</Text>
                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700', marginTop: 2 }}>
                  {selectedWorkerForSlip?.emp_name} ({selectedWorkerForSlip?.emp_code}) • Unit: {selectedWorkerForSlip?.unit_code || 'Site Unit'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSendSlipModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <AppIcon name="close" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }}>
              {/* Slip Live Breakdown Card */}
              <View style={[styles.credsPreviewBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                {fetchingSlipData ? (
                  <View style={{ paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="small" color="#059669" />
                    <Text style={{ fontSize: 11, color: '#047857', marginTop: 6, fontWeight: '600' }}>
                      Querying MySQL Payroll Tables...
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.credsPreviewRow}>
                      <Text style={styles.credsPreviewLabel}>Period (Month/Year):</Text>
                      <Text style={[styles.credsPreviewVal, { color: '#047857', fontWeight: '800' }]}>
                        {slipMonth}/{slipYear}
                      </Text>
                    </View>
                    <View style={styles.credsPreviewRow}>
                      <Text style={styles.credsPreviewLabel}>Days Worked / Present:</Text>
                      <Text style={styles.credsPreviewVal}>
                        {workerSlipData?.Total_Days_Present || workerSlipData?.Working_Days || 'Active on Muster'}
                      </Text>
                    </View>
                    <View style={styles.credsPreviewRow}>
                      <Text style={styles.credsPreviewLabel}>Net Payable Salary:</Text>
                      <Text style={[styles.credsPreviewVal, { color: '#059669', fontSize: 14, fontWeight: '800' }]}>
                        {workerSlipData?.Payment ? `₹${workerSlipData.Payment}` : 'Calculated in PayPro'}
                      </Text>
                    </View>
                  </>
                )}
              </View>

              {/* Editable Recipient Email Input */}
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.inputFieldLabel}>Recipient Worker Email:</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="e.g. worker@example.com"
                  placeholderTextColor="#94A3B8"
                  value={slipRecipientEmail}
                  onChangeText={setSlipRecipientEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Action Button: Send Salary Slip via Gmail */}
              <TouchableOpacity
                style={[styles.sendEmailActionBtn, { backgroundColor: '#059669' }]}
                onPress={handleSendSalarySlipEmail}
                activeOpacity={0.8}
              >
                <AppIcon name="mail" size={16} color="#FFFFFF" />
                <Text style={styles.sendEmailActionBtnText}>
                  Send Salary Slip via Gmail
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Live Tracking History Modal (SQL pay_geolocation_address) */}
      <Modal
        visible={trackingModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTrackingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16, maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.modalTitle}>Live Tracking History</Text>
                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700', marginTop: 2 }}>
                  {selectedWorkerForTracking?.emp_name} ({selectedWorkerForTracking?.emp_code}) • Unit: {selectedWorkerForTracking?.unit_code || '—'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setTrackingModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <AppIcon name="close" size={16} color="#0F766E" />
              </TouchableOpacity>
            </View>

            {/* Date Range Filter Chips + Refresh */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: '#1D4ED8',
                    borderWidth: 1,
                    borderColor: '#1D4ED8',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>Today</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (selectedWorkerForTracking) {
                    fetchWorkerLiveTracking(selectedWorkerForTracking, trackingDaysRange);
                  }
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: '#ECFDF5',
                  borderWidth: 1,
                  borderColor: '#A7F3D0',
                }}
              >
                <AppIcon name="refresh" size={12} color="#047857" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#047857' }}>Refresh</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
              {todayPunchStatus && !loadingTracking && (
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    borderRadius: 10,
                    marginBottom: 10,
                    borderWidth: 1,
                    backgroundColor:
                      todayPunchStatus === 'active'
                        ? '#ECFDF5'
                        : todayPunchStatus === 'ended'
                        ? '#F1F5F9'
                        : '#FEF3C7',
                    borderColor:
                      todayPunchStatus === 'active'
                        ? '#A7F3D0'
                        : todayPunchStatus === 'ended'
                        ? '#CBD5E1'
                        : '#FDE68A',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '800',
                      color:
                        todayPunchStatus === 'active'
                          ? '#047857'
                          : todayPunchStatus === 'ended'
                          ? '#334155'
                          : '#B45309',
                    }}
                  >
                    {todayPunchLabel || 'Not Punched In Today'}
                  </Text>
                </View>
              )}

              {loadingTracking ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#1D4ED8" />
                  <Text style={{ marginTop: 10, fontSize: 12, color: '#64748B', fontWeight: '600' }}>
                    Fetching live GPS pings from SQL...
                  </Text>
                </View>
              ) : trackingError ? (
                <View style={{ padding: 16, backgroundColor: '#FEF2F2', borderRadius: 10, borderWidth: 1, borderColor: '#FECACA' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#B91C1C' }}>Error Loading Tracking</Text>
                  <Text style={{ fontSize: 11, color: '#7F1D1D', marginTop: 4 }}>{trackingError}</Text>
                </View>
              ) : trackingLogs.length === 0 ? (
                <View style={{ paddingVertical: 36, alignItems: 'center' }}>
                  <AppIcon name="location" size={32} color="#94A3B8" />
                  <Text style={{ marginTop: 10, fontSize: 14, fontWeight: '700', color: '#334155' }}>
                    {todayPunchStatus === 'not_punched'
                      ? 'Not Punched In Today'
                      : 'No Live Tracking Pings Found'}
                  </Text>
                  <Text style={{ marginTop: 4, fontSize: 11, color: '#64748B', textAlign: 'center', paddingHorizontal: 16 }}>
                    {todayPunchStatus === 'not_punched'
                      ? 'Worker has not punched in today. Live tracking pings will appear once they punch in.'
                      : 'No GPS pings recorded in SQL (pay_geolocation_address) for this worker in the selected period.'}
                  </Text>
                </View>
              ) : (
                trackingLogs.map((log: any, idx: number) => {
                  const latVal = String(log.cur_latitude || '').trim();
                  const lonVal = String(log.cur_longtitude || '').trim();
                  const hasCoords = Boolean(latVal && lonVal);
                  const displayAddress =
                    (hasCoords && resolvedAddressesMap[`${latVal},${lonVal}`]) ||
                    log.cur_address ||
                    'Address not captured';
                  return (
                    <View
                      key={log.id ?? idx}
                      style={{
                        backgroundColor: idx === 0 ? '#EFF6FF' : '#F8FAFC',
                        borderWidth: 1,
                        borderColor: idx === 0 ? '#BFDBFE' : '#E2E8F0',
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 10,
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: idx === 0 ? '#1D4ED8' : '#0F172A' }}>
                          {idx === 0 ? 'LATEST PING • ' : ''}{log.cur_date || '—'}
                        </Text>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B' }}>
                          Unit: {log.unit_code || '—'}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 12, color: '#334155', fontWeight: '600', marginBottom: 6 }}>
                        {displayAddress}
                      </Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, color: '#475569', fontWeight: '700' }}>
                          {hasCoords ? `GPS: ${latVal}, ${lonVal}` : 'GPS: —'}
                        </Text>
                        {hasCoords && (
                          <TouchableOpacity
                            onPress={() => {
                              Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latVal},${lonVal}`)}`);
                            }}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                              backgroundColor: '#1D4ED8',
                              paddingHorizontal: 10,
                              paddingVertical: 5,
                              borderRadius: 8,
                            }}
                          >
                            <AppIcon name="location" size={11} color="#FFFFFF" />
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>Open Map</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Global Custom Alert Modal */}
      <CustomAlertModal
        visible={alertConfig.visible}
        type={alertConfig.type || 'info'}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </AppScreenContainer>
  );
};

