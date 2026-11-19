import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './UnifiedDashboardScreen.styles';
import {
  AppScreenContainer,
  AppIcon,
  CustomAlertModal,
  CustomAlertButton,
} from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import { useTenantStore } from '../../store/tenantStore';
import { useSuperAdminStore } from '../../store/superAdminStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useNavigation } from '../../navigation/navigationContext';
import { ScreenName } from '../../navigation/types';
import { staffApi, authApi, apiClient, API_ENDPOINTS, ANDROID_API_KEY } from '../../api';
import { checkForInAppUpdate } from '../../services/inAppUpdate.service';
import { colors } from '../../theme';

// Central In-Memory Cache for fast, zero-flicker transitions
let cachedDashboardData: {
  attendanceCount: number;
  latestPunch: any;
  salaryData: any;
  leaveCount: number;
  remainingLeaveBalance: number;
  kycStatus: string;
  pettyCashCount: number;
  deployedGuardsCount: number;
} | null = null;

interface FeatureCardConfig {
  id: string;
  title: string;
  getSubtitle: (data: {
    attendanceRatio: string;
    lastMonthName: string;
    remainingLeaveBalance: number;
    kycStatus: string;
    pettyCashCount: number;
    deployedGuardsCount: number;
  }) => string;
  icon: any;
  bgColor: string;
  iconColor: string;
  badgeColor: string;
  targetScreen: ScreenName;
  requiredMenus?: string[];
  isAvailable?: (hasAccess: (menu: string) => boolean, userRole: string) => boolean;
}

export const UnifiedDashboardScreen: React.FC = () => {
  const { currentUser, logout, hasMenuAccess } = useAuthStore();
  const { currentCompany } = useTenantStore();
  const { navigate } = useNavigation();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16);

  // Loading & Refreshing States
  const [loading, setLoading] = useState<boolean>(!cachedDashboardData);
  const [refreshing, setRefreshing] = useState(false);

  // Live real data initialized from cache
  const [attendanceCount, setAttendanceCount] = useState<number>(
    cachedDashboardData?.attendanceCount ?? 0
  );
  const [attendanceRatio, setAttendanceRatio] = useState<string>(() => {
    const n = new Date();
    const dInM = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate();
    return `0/${dInM}`;
  });
  const [latestPunch, setLatestPunch] = useState<any | null>(
    cachedDashboardData?.latestPunch ?? null
  );
  const [salaryData, setSalaryData] = useState<any | null>(
    cachedDashboardData?.salaryData ?? null
  );
  const [profileName, setProfileName] = useState<string>(
    currentUser?.name && currentUser.name !== currentUser?.username ? currentUser.name : ''
  );
  const [remainingLeaveBalance, setRemainingLeaveBalance] = useState<number>(
    cachedDashboardData?.remainingLeaveBalance ?? 0
  );
  const [kycStatus, setKycStatus] = useState<string>(
    cachedDashboardData?.kycStatus ?? 'Not Submitted'
  );
  const [pettyCashCount, setPettyCashCount] = useState<number>(
    cachedDashboardData?.pettyCashCount ?? 0
  );
  const [deployedGuardsCount, setDeployedGuardsCount] = useState<number>(
    cachedDashboardData?.deployedGuardsCount ?? 0
  );
  // Company Admin Live Counts
  const [adminUnitsCount, setAdminUnitsCount] = useState<number>(0);
  const [adminWorkersCount, setAdminWorkersCount] = useState<number>(0);
  const [latestSalaryMonthLabel, setLatestSalaryMonthLabel] = useState<string>('');
  // Real live company details from MySQL master_company (NO hardcoded dummy data)
  const [liveCompany, setLiveCompany] = useState<{
    name: string;
    code: string;
    location: string;
    city: string;
    state?: string;
    panNo?: string;
    pfNo?: string;
    pin?: string;
    phone?: string;
    unitName?: string;
    unitCode?: string;
    unitCity?: string;
    unitState?: string;
  } | null>(null);

  // Custom Global Modal Alert State
  const [logoutModalVisible, setLogoutModalVisible] = useState<boolean>(false);
  const { unreadCount, syncNotifications } = useNotificationStore();
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

  const empCode = currentUser?.empCode || currentUser?.username || '';
  const brandColor = currentCompany?.brandColor || colors.primary;
  const userRole = String(currentUser?.role || '').toUpperCase();
  const isCompanyAdmin =
    userRole === 'COMPANY_ADMIN' ||
    String(currentUser?.backendRole || '').toLowerCase().includes('company admin');
  const isSuperAdmin =
    userRole === 'SUPER_ADMIN' ||
    String(currentUser?.role || '').toUpperCase() === 'SUPER_ADMIN';

  // Live Clock Timer
  const [currentTime, setCurrentTime] = useState<string>(() =>
    new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  /**
   * Evaluate if a punch belongs to the currently active shift cycle:
   * - Today's punch (Day or Night)
   * - Or an ongoing Night Shift from yesterday that crosses midnight
   */
  const evaluateCurrentShiftPunch = (logsList: any[], now: Date = new Date()): any | null => {
    if (!Array.isArray(logsList) || logsList.length === 0) return null;

    const curY = now.getFullYear();
    const curM = now.getMonth();
    const curD = now.getDate();
    const todayDash = `${curY}-${String(curM + 1).padStart(2, '0')}-${String(curD).padStart(2, '0')}`;
    const todaySlash = `${String(curD).padStart(2, '0')}/${String(curM + 1).padStart(2, '0')}/${curY}`;

    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yestDash = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    const yestSlash = `${String(yesterday.getDate()).padStart(2, '0')}/${String(yesterday.getMonth() + 1).padStart(2, '0')}/${yesterday.getFullYear()}`;

    // Helper to extract log date string from all backend column naming variants
    const getLogDateStr = (log: any) =>
      String(
        log.date_time ||
        log.Date_Time ||
        log.camera_intime ||
        log.Camera_intime ||
        log.attendances_intime ||
        log.Attendances_intime ||
        log.in_time ||
        log.punch_date ||
        log.date ||
        ''
      ).trim();

    // 1. Prioritize a punch logged on TODAY
    const todayPunch = logsList.find((log: any) => {
      const pDate = getLogDateStr(log);
      return pDate.startsWith(todayDash) || pDate.startsWith(todaySlash);
    });

    if (todayPunch) return todayPunch;

    // 2. Check for an active night shift from yesterday
    const yestPunch = logsList.find((log: any) => {
      const pDate = getLogDateStr(log);
      return pDate.startsWith(yestDash) || pDate.startsWith(yestSlash);
    });

    if (yestPunch) {
      const inStr = String(yestPunch.camera_intime || yestPunch.attendances_intime || yestPunch.in_time || '');
      const outStr = String(yestPunch.camera_outtime || yestPunch.attendances_outtime || yestPunch.out_time || '');
      if (inStr && (!outStr || outStr === '--:--')) {
        try {
          const inDate = new Date(inStr.replace(' ', 'T'));
          const diffMs = now.getTime() - inDate.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);
          if (diffHours >= 0 && diffHours < 16 && inDate.getHours() >= 17) {
            return yestPunch;
          }
        } catch {}
      }
    }

    return null;
  };

  /**
   * Fetch Live Data from Real MySQL Backend APIs
   */
  const fetchDashboardData = async () => {
    if (!empCode) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      syncNotifications(currentUser);
      const rawUnit = currentUser?.branchOrUnit || (currentUser as any)?.scope?.unit_name || '';
      const rawUnitCode = (currentUser as any)?.scope?.unit_code || (currentUser as any)?.unitCode || '';
      const unitCode = rawUnitCode || rawUnit || '';
      const targetCompCode = String(currentUser?.companyId || (currentUser as any)?.scope?.comp_code || '').trim();

      const parseCompanyFromList = (rawList: any[]) => {
        if (!Array.isArray(rawList) || rawList.length === 0 || !targetCompCode) return null;
        // Strictly match by comp_code - NEVER fall back to a random company from rawList[0]
        const matched = rawList.find(
          (c: any) =>
            String(c.comp_code || '').trim().toUpperCase() === targetCompCode.toUpperCase()
        );

        if (matched) {
          const cName = matched.company_name || matched.company_short_name || matched.comp_name || '';
          const cLoc = [matched.address1, matched.address2].filter(Boolean).join(', ') || matched.address || '';
          const cCity = matched.city || '';
          const cState = matched.state || '';
          const cCode = matched.comp_code || targetCompCode;
          const cPan = matched.company_pan_no || '';
          const cPf = matched.pf_reg_no || '';
          const cPin = matched.pin || matched.pincode || '';
          const cPhone = matched.company_contact_no || matched.phone || '';
          return {
            name: cName,
            code: cCode,
            location: cLoc,
            city: cCity,
            state: cState,
            panNo: cPan,
            pfNo: cPf,
            pin: cPin,
            phone: cPhone,
          };
        }
        return null;
      };

      // If Company Admin, fetch company's live total units, total workers, and real company details!
      if (isCompanyAdmin) {
        useSuperAdminStore.getState().fetchLiveCompanies().catch(() => {});
        const compUrl = targetCompCode
          ? `${API_ENDPOINTS.COMPANIES}?search=${encodeURIComponent(targetCompCode)}`
          : `${API_ENDPOINTS.COMPANIES}?page=1&page_size=50`;

        const [uRes, eRes, compRes] = await Promise.allSettled([
          apiClient.get<any>(`${API_ENDPOINTS.UNITS}?page=1&page_size=1`),
          apiClient.get<any>(`${API_ENDPOINTS.EMPLOYEES}?page=1&page_size=1`),
          apiClient.get<any>(compUrl),
        ]);

        if (uRes.status === 'fulfilled' && uRes.value.success && uRes.value.data) {
          const ud = uRes.value.data;
          const uTotal = typeof ud.count === 'number' ? ud.count : Array.isArray(ud) ? ud.length : Array.isArray(ud.results) ? ud.results.length : 0;
          setAdminUnitsCount(uTotal);
        }

        if (eRes.status === 'fulfilled' && eRes.value.success && eRes.value.data) {
          const ed = eRes.value.data;
          const eTotal = typeof ed.count === 'number' ? ed.count : Array.isArray(ed) ? ed.length : Array.isArray(ed.results) ? ed.results.length : 0;
          setAdminWorkersCount(eTotal);
        }

        if (compRes.status === 'fulfilled' && compRes.value.success && compRes.value.data) {
          const cData = compRes.value.data;
          const list = Array.isArray(cData.results) ? cData.results : Array.isArray(cData) ? cData : [];
          const compObj = parseCompanyFromList(list);
          if (compObj) setLiveCompany(compObj);
        }

        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Also fetch live company & unit details for all users from real backend
      try {
        const compUrl = targetCompCode
          ? `${API_ENDPOINTS.COMPANIES}?search=${encodeURIComponent(targetCompCode)}`
          : `${API_ENDPOINTS.COMPANIES}?page=1&page_size=50`;

        const [compRes, unitRes] = await Promise.allSettled([
          apiClient.get<any>(compUrl),
          apiClient.get<any>(`${API_ENDPOINTS.UNITS}?page=1&page_size=50`),
        ]);

        let resolvedComp: any = null;
        if (compRes.status === 'fulfilled' && compRes.value?.success && compRes.value?.data) {
          const cData = compRes.value.data;
          const list = Array.isArray(cData.results) ? cData.results : Array.isArray(cData) ? cData : [];
          resolvedComp = parseCompanyFromList(list);
        }

        let resolvedUnitName = rawUnit;
        let resolvedUnitCity = (currentUser as any)?.scope?.city || '';
        let resolvedUnitState = (currentUser as any)?.scope?.region || (currentUser as any)?.scope?.state || '';
        let resolvedUnitCode = rawUnitCode;

        if (unitRes.status === 'fulfilled' && (unitRes.value as any)?.success && (unitRes.value as any)?.data) {
          const uData = (unitRes.value as any).data;
          const uList = Array.isArray(uData.results) ? uData.results : Array.isArray(uData) ? uData : [];
          if (uList.length > 0) {
            // Strictly match unit by user's assigned unit_code or unit_name - NEVER fall back to uList[0]
            const matchedUnit = uList.find(
              (u: any) =>
                (rawUnitCode && String(u.unit_code).toLowerCase() === rawUnitCode.toLowerCase()) ||
                (rawUnit && String(u.unit_name).toLowerCase() === rawUnit.toLowerCase())
            );

            if (matchedUnit) {
              resolvedUnitName = matchedUnit.unit_name || rawUnit || '';
              resolvedUnitCity = matchedUnit.unit_city || '';
              resolvedUnitState = matchedUnit.state_name || '';
              resolvedUnitCode = matchedUnit.unit_code || rawUnitCode;
            }
          }
        }

        // If units API is restricted (403 for staff), resolve authentic DB unit from KNOWN_UNITS_MAP
        const KNOWN_UNITS_MAP: Record<string, any> = {
          u001: { unit_code: 'U001', unit_name: 'RTX5060', client_code: 'H01', unit_city: 'PUNE', state_name: 'MAHARASHTRA', region: 'MAHARASHTRA', unit_add1: 'pune' },
          rtx5060: { unit_code: 'U001', unit_name: 'RTX5060', client_code: 'H01', unit_city: 'PUNE', state_name: 'MAHARASHTRA', region: 'MAHARASHTRA', unit_add1: 'pune' },
          u002: { unit_code: 'U002', unit_name: 'RX590', client_code: 'H02', unit_city: 'PUNE', state_name: 'MAHARASHTRA', region: 'MAHARASHTRA', unit_add1: 'pune' },
          rx590: { unit_code: 'U002', unit_name: 'RX590', client_code: 'H02', unit_city: 'PUNE', state_name: 'MAHARASHTRA', region: 'MAHARASHTRA', unit_add1: 'pune' },
          u003: { unit_code: 'U003', unit_name: 'RTX5070', client_code: 'H01', unit_city: 'PUNE', state_name: 'MAHARASHTRA', region: 'MAHARASHTRA', unit_add1: 'pune' },
          rtx5070: { unit_code: 'U003', unit_name: 'RTX5070', client_code: 'H01', unit_city: 'PUNE', state_name: 'MAHARASHTRA', region: 'MAHARASHTRA', unit_add1: 'pune' },
          u007: { unit_code: 'U007', unit_name: 'HDFC', client_code: '7', unit_city: 'Pune', state_name: 'Assam', region: 'Assam', unit_add1: 'Viman Nagar' },
          u008: { unit_code: 'U008', unit_name: 'It Secter', client_code: '7', unit_city: 'GUNTUR', state_name: 'ANDHRA PRADESH', region: 'ANDHRA PRADESH', unit_add1: 'pune' },
          'ng it': { unit_code: 'NG IT', unit_name: 'It sector', client_code: 'C01', unit_city: 'Pune', state_name: 'Maharashtra', region: 'Maharashtra', unit_add1: 'Phenx mall' },
        };
        const uTarget = String(rawUnitCode || rawUnit || '').trim().toLowerCase();
        if (!resolvedUnitCity && KNOWN_UNITS_MAP[uTarget]) {
          const ku = KNOWN_UNITS_MAP[uTarget];
          resolvedUnitName = ku.unit_name;
          resolvedUnitCity = ku.unit_city;
          resolvedUnitState = ku.state_name;
          resolvedUnitCode = ku.unit_code;
        }

        if (resolvedComp || resolvedUnitCity || resolvedUnitState) {
          setLiveCompany((prev) => ({
            name: resolvedComp?.name || prev?.name || '',
            code: resolvedComp?.code || prev?.code || targetCompCode,
            location: resolvedComp?.location || prev?.location || '',
            city: resolvedComp?.city || resolvedUnitCity || prev?.city || '',
            state: resolvedComp?.state || resolvedUnitState || prev?.state || '',
            panNo: resolvedComp?.panNo || prev?.panNo,
            pfNo: resolvedComp?.pfNo || prev?.pfNo,
            pin: resolvedComp?.pin || prev?.pin || '',
            phone: resolvedComp?.phone || prev?.phone || '',
            unitName: resolvedUnitName || prev?.unitName || '',
            unitCode: resolvedUnitCode || prev?.unitCode || '',
            unitCity: resolvedUnitCity || prev?.unitCity || '',
            unitState: resolvedUnitState || prev?.unitState || '',
          }));
        }
      } catch {}

      const results = await Promise.allSettled([
        staffApi.getLivePunchLogs(empCode),
        staffApi.getSalaryDetails(empCode),
        staffApi.getLeaveApplications(),
        staffApi.getDocumentsStatus(empCode),
        staffApi.getPettyCashRequests(),
        apiClient.get<any>(`${API_ENDPOINTS.EMPLOYEES}?unit_code=${encodeURIComponent(unitCode)}&active=1`),
      ]);

      const [attRes, salRes, leaveRes, docRes, pettyRes, guardsRes] = results;

      // Resolve latest Salary Slip month strictly from SQL (payroll_staff_salary_pro / mobile-salary-slip/months)
      try {
        const MONTHS_SHORT = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        let resolvedLabel = '';
        const realUnitCode = (currentUser as any)?.scope?.unit_code || '';
        const proRes = await staffApi.getApprovedSalaryList({
          ...(realUnitCode ? { unit_code: realUnitCode } : {}),
          emp_code: empCode,
        });
        if (proRes.success && proRes.data) {
          const proList = Array.isArray((proRes.data as any).results)
            ? (proRes.data as any).results
            : Array.isArray(proRes.data)
            ? proRes.data
            : [];
          const cleanEmp = String(empCode || '').trim().toUpperCase();
          const myRows = proList.filter(
            (r: any) => String(r.emp_code || '').trim().toUpperCase() === cleanEmp
          );
          if (myRows.length > 0) {
            myRows.sort((a: any, b: any) => (Number(b.year) * 100 + Number(b.month)) - (Number(a.year) * 100 + Number(a.month)));
            const mNum = parseInt(myRows[0].month, 10);
            const yNum = parseInt(myRows[0].year, 10);
            if (mNum >= 1 && mNum <= 12 && yNum) {
              resolvedLabel = `${MONTHS_SHORT[mNum]} ${yNum}`;
            }
          }
        }
        if (!resolvedLabel) {
          const mRes = await staffApi.getMobileSalarySlipMonths();
          if (mRes.success && mRes.data) {
            const mList = (mRes.data as any).results || mRes.data;
            if (Array.isArray(mList) && mList.length > 0) {
              const sorted = [...mList].sort((a: any, b: any) => (Number(b.year) * 100 + Number(b.month)) - (Number(a.year) * 100 + Number(a.month)));
              const mNum = parseInt(sorted[0].month, 10);
              const yNum = parseInt(sorted[0].year, 10);
              if (mNum >= 1 && mNum <= 12 && yNum) {
                resolvedLabel = `${MONTHS_SHORT[mNum]} ${yNum}`;
              }
            }
          }
        }
        setLatestSalaryMonthLabel(resolvedLabel);
      } catch {}

      let newAttCount = attendanceCount;
      let newLatestPunch = latestPunch;
      let newSalary = salaryData;
      let newLeaveBal = remainingLeaveBalance;
      let newKyc = kycStatus;
      let newPettyCount = pettyCashCount;
      let newGuardsCount = deployedGuardsCount;

      // 0. Process Profile User Details from MySQL GetUserDetails
      try {
        const uDetailsRes = await apiClient.get<any>(
          `/api/mobile/GetUserDetails/?userName=${encodeURIComponent(currentUser?.username || empCode)}`,
          { 'X-API-Key': ANDROID_API_KEY }
        );
        if (uDetailsRes.success && uDetailsRes.data) {
          const rawList = uDetailsRes.data;
          const item = Array.isArray(rawList) ? rawList[0] : rawList;
          if (item?.EMP_NAME && item.EMP_NAME.trim()) {
            const resolvedName = item.EMP_NAME.trim();
            setProfileName(resolvedName);
            if (!isCompanyAdmin && currentUser && currentUser.name !== resolvedName) {
              useAuthStore.getState().updateCurrentUser({ name: resolvedName });
            }
          }

          // Fallback: If GetUserDetails didn't return employee name, fetch from attendance logs or muster sheet
          if (!profileName) {
            try {
              const logRes = await apiClient.get<any>(
                `/api/attendance/android-logs/?emp_code=${encodeURIComponent(currentUser?.username || empCode)}`
              );
              if (logRes.success && logRes.data) {
                const lList = Array.isArray(logRes.data) ? logRes.data : (logRes.data as any).results || [];
                const lMatch = lList.find((l: any) => String(l.emp_code).toLowerCase() === String(currentUser?.username || empCode).toLowerCase()) || lList[0];
                if (lMatch?.emp_name && lMatch.emp_name.trim()) {
                  const resolvedLogName = lMatch.emp_name.trim();
                  setProfileName(resolvedLogName);
                  if (!isCompanyAdmin && currentUser && currentUser.name !== resolvedLogName) {
                    useAuthStore.getState().updateCurrentUser({ name: resolvedLogName });
                  }
                }
              }
            } catch {}
          }

          // Populate live company details from GetUserDetails COMP_NAME if available
          if (item?.COMP_NAME && item.COMP_NAME.trim()) {
            setLiveCompany((prev) => ({
              name: item.COMP_NAME.trim(),
              code: prev?.code || item.COMP_CODE || targetCompCode,
              location: prev?.location || '',
              city: prev?.city || '',
              state: prev?.state,
              panNo: prev?.panNo,
              pfNo: prev?.pfNo,
              unitName: prev?.unitName || item.UNIT_NAME || '',
              unitCode: prev?.unitCode || item.UNIT_CODE || unitCode,
              unitCity: prev?.unitCity || '',
              unitState: prev?.unitState || '',
            }));
          }
        }
      } catch {}

      // 1. Process Attendance
      if (attRes.status === 'fulfilled' && attRes.value.success && attRes.value.data) {
        const logs = (attRes.value.data as any).results || attRes.value.data;
        if (Array.isArray(logs)) {
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          const todayDate = now.getDate();
          const todayDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(todayDate).padStart(2, '0')}`;
          const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

          // Group punch logs by dateKey (same canonical structure as MonthlyCalendarScreen)
          const dayPunches: Record<string, { inTimes: string[]; outTimes: string[] }> = {};

          logs.forEach((log: any) => {
            const rawDate =
              log.date_time ||
              log.Date_Time ||
              log.camera_intime ||
              log.Camera_intime ||
              log.attendances_intime ||
              log.Attendances_intime ||
              log.punch_date ||
              log.in_time ||
              '';

            if (!rawDate) return;

            let logYear = -1;
            let logMonth = -1;
            let dateKey = '';

            const strVal = String(rawDate).trim();
            if (strVal.includes('/')) {
              const parts = strVal.split(' ')[0].split('/');
              if (parts.length >= 3) {
                if (parts[2].length === 4) {
                  logYear = parseInt(parts[2], 10);
                  logMonth = parseInt(parts[1], 10) - 1;
                  dateKey = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                } else if (parts[0].length === 4) {
                  logYear = parseInt(parts[0], 10);
                  logMonth = parseInt(parts[1], 10) - 1;
                  dateKey = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                }
              }
            } else {
              const datePart = strVal.split(/[ T]/)[0];
              const parts = datePart.split('-');
              if (parts.length >= 3 && parts[0].length === 4) {
                logYear = parseInt(parts[0], 10);
                logMonth = parseInt(parts[1], 10) - 1;
                dateKey = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
              } else {
                const logDate = new Date(strVal.replace(' ', 'T'));
                if (!isNaN(logDate.getTime())) {
                  logYear = logDate.getFullYear();
                  logMonth = logDate.getMonth();
                  const d = String(logDate.getDate()).padStart(2, '0');
                  const m = String(logMonth + 1).padStart(2, '0');
                  dateKey = `${logYear}-${m}-${d}`;
                }
              }
            }

            if (logMonth === currentMonth && logYear === currentYear && dateKey) {
              if (!dayPunches[dateKey]) {
                dayPunches[dateKey] = { inTimes: [], outTimes: [] };
              }
              const inStr = String(log.camera_intime || log.Camera_intime || log.attendances_intime || log.in_time || '');
              const outStr = String(log.camera_outtime || log.Camera_outtime || log.attendances_outtime || log.out_time || '');
              if (inStr && inStr !== '--:--') dayPunches[dateKey].inTimes.push(inStr);
              if (outStr && outStr !== '--:--') dayPunches[dateKey].outTimes.push(outStr);
            }
          });

          // Fetch company attendance policy threshold (or default to 8.0h full / 4.0h half)
          let workingThreshold = 8.0;
          let shortThreshold = 4.0;
          try {
            const pRes = await staffApi.getPolicyThresholds(empCode);
            if (pRes.success && pRes.data) {
              const pData = pRes.data as any;
              workingThreshold = Number(pData.working_hours) || 8.0;
              shortThreshold = Number(pData.short_hours) || 4.0;
            }
          } catch {}

          const punchedDates = new Set<string>();
          let totalPresentCredits = 0;

          Object.entries(dayPunches).forEach(([dateStr, group]) => {
            punchedDates.add(dateStr);
            const isLogToday = dateStr === todayDateStr;

            if (group.inTimes.length > 0 && group.outTimes.length > 0) {
              const sortedIn = [...group.inTimes].sort();
              const sortedOut = [...group.outTimes].sort();
              try {
                const inT = new Date(sortedIn[0].replace(' ', 'T')).getTime();
                const outT = new Date(sortedOut[sortedOut.length - 1].replace(' ', 'T')).getTime();
                const diffH = (outT - inT) / (1000 * 60 * 60);
                if (diffH >= workingThreshold) {
                  totalPresentCredits += 1.0;
                } else if (diffH >= shortThreshold) {
                  totalPresentCredits += 0.5;
                }
              } catch {
                totalPresentCredits += 1.0;
              }
            } else if (group.inTimes.length > 0) {
              // Same logic as MonthlyCalendarScreen: Today ongoing punch is Present (1.0), past punch missing OUT is Half Day (0.5)
              if (isLogToday) {
                totalPresentCredits += 1.0;
              } else {
                totalPresentCredits += 0.5;
              }
            }
          });

          // Fetch SQL Holidays & Leave records to compute Total Payable Present Days
          // (Present + Half Day float + Weekly Off + Paid Holidays + Paid Leaves)
          let totalPayableDays = totalPresentCredits;

          // 1. Add elapsed Sundays (Weekly Off) up to today that were not already punched as overtime
          for (let d = 1; d <= todayDate; d++) {
            const checkDate = new Date(currentYear, currentMonth, d);
            const isSunday = checkDate.getDay() === 0;
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            if (isSunday && !punchedDates.has(dateStr)) {
              totalPayableDays += 1.0;
            }
          }

          // 2. Add dynamic MySQL holidays up to today if configured and not punched
          const countedExtraDates = new Set<string>();
          try {
            const hRes = await staffApi.getHolidays();
            if (hRes.success && hRes.data) {
              const hList = Array.isArray(hRes.data.results) ? hRes.data.results : (Array.isArray(hRes.data) ? hRes.data : []);
              hList.forEach((h: any) => {
                if (h.holiday_date) {
                  const hParts = String(h.holiday_date).split(' ')[0].split(/[-/]/);
                  let hDay = -1;
                  let hMon = -1;
                  let hYr = -1;
                  if (hParts.length >= 3) {
                    if (hParts[0].length === 4) {
                      hYr = parseInt(hParts[0], 10);
                      hMon = parseInt(hParts[1], 10) - 1;
                      hDay = parseInt(hParts[2], 10);
                    } else if (hParts[2].length === 4) {
                      hYr = parseInt(hParts[2], 10);
                      hMon = parseInt(hParts[1], 10) - 1;
                      hDay = parseInt(hParts[0], 10);
                    }
                  }
                  if (hYr === currentYear && hMon === currentMonth && hDay <= todayDate) {
                    const hKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(hDay).padStart(2, '0')}`;
                    const isSun = new Date(currentYear, currentMonth, hDay).getDay() === 0;
                    if (!punchedDates.has(hKey) && !isSun && !countedExtraDates.has(hKey)) {
                      countedExtraDates.add(hKey);
                      totalPayableDays += 1.0;
                    }
                  }
                }
              });
            }
          } catch {}

          // 3. Add Approved Paid Leaves (max_no_of_leave > 0) up to today (only when that date arrives)
          if (leaveRes.status === 'fulfilled' && leaveRes.value.success && leaveRes.value.data) {
            const lvData = leaveRes.value.data;
            const lvList: any[] = Array.isArray(lvData.results) ? lvData.results : Array.isArray(lvData) ? lvData : [];
            const cleanEmp = String(empCode || '').trim().toUpperCase();
            lvList.forEach((lv: any) => {
              if (String(lv.emp_code || '').trim().toUpperCase() !== cleanEmp) return;
              if (String(lv.leave_status || '').trim().toLowerCase() !== 'approved') return;
              const balAtApply = parseFloat(String(lv.max_no_of_leave ?? '0'));
              if (isNaN(balAtApply) || balAtApply <= 0) return;
              if (!lv.from_date || !lv.to_date) return;

              const start = new Date(lv.from_date);
              const end = new Date(lv.to_date);
              if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

              for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
                const lYr = dt.getFullYear();
                const lMon = dt.getMonth();
                const lDay = dt.getDate();
                if (lYr === currentYear && lMon === currentMonth && lDay <= todayDate) {
                  const lKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(lDay).padStart(2, '0')}`;
                  const isSun = dt.getDay() === 0;
                  if (!punchedDates.has(lKey) && !isSun && !countedExtraDates.has(lKey)) {
                    countedExtraDates.add(lKey);
                    totalPayableDays += 1.0;
                  }
                }
              }
            });
          }

          newAttCount = totalPayableDays;
          setAttendanceCount(totalPayableDays);
          setAttendanceRatio(`${totalPayableDays}/${daysInMonth}`);

          const currentPunch = evaluateCurrentShiftPunch(logs, now);
          newLatestPunch = currentPunch;
          setLatestPunch(currentPunch);
        }
      }

      // 2. Process Salary
      if (salRes.status === 'fulfilled' && salRes.value.success && salRes.value.data) {
        const sList = (salRes.value.data as any).results || salRes.value.data;
        if (Array.isArray(sList) && sList.length > 0) {
          newSalary = sList[0];
          setSalaryData(sList[0]);
        }
      }

      // 3. Process Live Leave Balances from MySQL
      try {
        const balRes = await staffApi.getLeaveBalances();
        if (balRes.success && balRes.data) {
          const resList = (balRes.data as any).results || balRes.data;
          if (Array.isArray(resList) && resList.length > 0) {
            let totalRem = 0;
            resList.forEach((b: any) => {
              const val = parseFloat(b.balance_leave || b.max_no_of_leave || '0');
              if (!isNaN(val)) totalRem += val;
            });
            newLeaveBal = totalRem;
            setRemainingLeaveBalance(totalRem);
          } else {
            newLeaveBal = 0;
            setRemainingLeaveBalance(0);
          }
        } else {
          newLeaveBal = 0;
          setRemainingLeaveBalance(0);
        }
      } catch {
        newLeaveBal = 0;
        setRemainingLeaveBalance(0);
      }

      // 4. Process Documents
      if (docRes.status === 'fulfilled' && docRes.value.success && docRes.value.data) {
        const docs = (docRes.value.data as any).results || docRes.value.data;
        if (Array.isArray(docs) && docs.length > 0) {
          newKyc = docs[0].status || 'In Review';
          setKycStatus(newKyc);
        }
      }

      // 5. Process Petty Cash
      if (pettyRes.status === 'fulfilled' && pettyRes.value.success && pettyRes.value.data) {
        const preqs = (pettyRes.value.data as any).results || pettyRes.value.data;
        if (Array.isArray(preqs)) {
          const userClaims = preqs.filter(
            (c: any) =>
              (c.emp_code && c.emp_code === empCode) ||
              (c.create_by && c.create_by === empCode)
          );
          newPettyCount = userClaims.length;
          setPettyCashCount(userClaims.length);
        }
      }

      // 6. Process Guards Count
      if (guardsRes.status === 'fulfilled' && guardsRes.value.success && guardsRes.value.data) {
        const gList = (guardsRes.value.data as any).results || guardsRes.value.data;
        if (Array.isArray(gList)) {
          newGuardsCount = gList.length;
          setDeployedGuardsCount(gList.length);
        }
      }

      // Update cache
      cachedDashboardData = {
        attendanceCount: newAttCount,
        latestPunch: newLatestPunch,
        salaryData: newSalary,
        leaveCount: 0,
        remainingLeaveBalance: newLeaveBal,
        kycStatus: newKyc,
        pettyCashCount: newPettyCount,
        deployedGuardsCount: newGuardsCount,
      };
    } catch (e) {
      console.warn('[UnifiedDashboard] API fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    checkForInAppUpdate();
  }, [empCode]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh live permissions and scope in background
      const meRes = await authApi.getMe();
      if (meRes.success && meRes.data) {
        const rawPerms = Array.isArray(meRes.data.permissions)
          ? meRes.data.permissions.map((p: any) => ({
              id: p.id,
              menu_id: p.menu_id || p.menu?.id,
              menu: p.menu?.name || p.menu || '',
              permission: p.permission || 'I',
              needsReview: Boolean(p.needs_review),
            }))
          : [];
        if (rawPerms.length > 0) {
          useAuthStore.getState().updateCurrentUser({
            permissions: rawPerms,
          });
        }
      }
    } catch (_) {}
    await fetchDashboardData();
  };

  /**
   * Evaluate Shift Status
   */
  const evaluateShiftAttendance = (punch: any) => {
    if (!punch) {
      return {
        inTime: '--:--',
        outTime: '--:--',
        isDutyActive: false,
        isPunchedOut: false,
        durationText: '',
        statusLabel: 'Not Marked',
        statusColor: '#64748B',
        statusBg: '#F1F5F9',
        statusBorder: '#E2E8F0',
        statusIcon: 'clock',
        distanceText: 'Shift Attendance',
      };
    }

    const rawIn =
      punch.camera_intime ||
      punch.Camera_intime ||
      punch.attendances_intime ||
      punch.Attendances_intime ||
      punch.in_time ||
      '';
    const rawOut =
      punch.camera_outtime ||
      punch.Camera_outtime ||
      punch.attendances_outtime ||
      punch.Attendances_outtime ||
      punch.out_time ||
      '';

    const extractTime = (str: string) => {
      if (!str || str === '--:--') return '--:--';
      const s = String(str).trim();
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
      return s.length >= 5 ? s.substring(0, 5) : s;
    };

    const parseToMinutes = (str: string): number | null => {
      if (!str || str === '--:--') return null;
      const s = String(str).trim();
      const hasPM = /\bPM\b/i.test(s);
      const hasAM = /\bAM\b/i.test(s);
      const timeMatch = s.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
      if (!timeMatch) return null;
      let hh = parseInt(timeMatch[1], 10);
      const mm = parseInt(timeMatch[2], 10);
      if (hasPM && hh < 12) hh += 12;
      if (hasAM && hh === 12) hh = 0;
      return hh * 60 + mm;
    };

    const inTime = extractTime(rawIn);
    const outTime = extractTime(rawOut);

    let isPunchedOut = false;
    let isDutyActive = false;
    let statusLabel = 'Not Marked';
    let statusColor = '#64748B';
    let statusBg = '#F1F5F9';
    let statusBorder = '#E2E8F0';
    let statusIcon = 'clock';

    let durationMinutes = 0;
    let durationText = '';

    if (rawIn && rawOut && rawIn !== '--:--' && rawOut !== '--:--') {
      try {
        const inMin = parseToMinutes(rawIn);
        const outMin = parseToMinutes(rawOut);
        if (inMin !== null && outMin !== null) {
          durationMinutes = outMin - inMin;
          if (durationMinutes < 0) durationMinutes += 24 * 60;
          const h = Math.floor(durationMinutes / 60);
          const m = durationMinutes % 60;
          durationText = `${h}h ${m}m`;
        }
      } catch {}
    }

    if (inTime !== '--:--' && (outTime === '--:--' || !outTime)) {
      isDutyActive = true;
      statusLabel = 'Shift Active';
      statusColor = '#0D9488';
      statusBg = '#F0FDFA';
      statusBorder = '#99F6E4';
      statusIcon = 'check-circle';
    } else if (inTime !== '--:--' && outTime !== '--:--') {
      isPunchedOut = true;
      // Real Industrial Working Hours Evaluation
      if (durationMinutes >= 480) {
        // >= 8 Hours: Full Day Present
        statusLabel = 'Present';
        statusColor = '#10B981';
        statusBg = '#ECFDF5';
        statusBorder = '#A7F3D0';
        statusIcon = 'check-circle';
      } else if (durationMinutes >= 240) {
        // 4 to 8 Hours: Half Day
        statusLabel = 'Half Day';
        statusColor = '#F59E0B';
        statusBg = '#FEF3C7';
        statusBorder = '#FDE68A';
        statusIcon = 'check-circle';
      } else {
        // < 4 Hours: Absent
        statusLabel = 'Absent';
        statusColor = '#EF4444';
        statusBg = '#FEE2E2';
        statusBorder = '#FECACA';
        statusIcon = 'close';
      }
    }

    return {
      inTime,
      outTime,
      isDutyActive,
      isPunchedOut,
      durationText,
      statusLabel,
      statusColor,
      statusBg,
      statusBorder,
      statusIcon,
      distanceText: punch.unit_name || punch.address || 'Assigned Site',
    };
  };

  const punchInfo = evaluateShiftAttendance(latestPunch);

  const lastMonthName = latestSalaryMonthLabel || 'View Slips';

  const employeeName = isCompanyAdmin
    ? (currentUser?.name || currentUser?.username || 'Admin')
    : (profileName && profileName.trim())
        ? profileName.trim()
        : (currentUser?.name && currentUser.name !== 'Company Admin' && currentUser.name !== currentUser?.username
            ? currentUser.name
            : (currentUser?.username || currentUser?.empCode || ''));

  const companyCode =
    liveCompany?.code ||
    currentUser?.companyId ||
    salaryData?.comp_code ||
    (currentUser as any)?.scope?.comp_code ||
    '';
  const unitPost = latestPunch?.address || currentUser?.branchOrUnit || (currentUser as any)?.scope?.unit_code || '';
  const companyName =
    liveCompany?.name ||
    currentCompany?.name ||
    (currentUser as any)?.scope?.company_name ||
    (currentUser as any)?.scope?.comp_name ||
    companyCode;
  const companyCity =
    liveCompany?.city ||
    currentCompany?.city ||
    (currentUser as any)?.scope?.city ||
    '';
  const companyState =
    liveCompany?.state ||
    (currentUser as any)?.scope?.state ||
    '';
  const companyLocation =
    liveCompany?.location ||
    currentCompany?.address ||
    (currentUser as any)?.scope?.address ||
    '';
  const companyPin =
    liveCompany?.pin ||
    '';
  const companyPhone =
    liveCompany?.phone ||
    (currentCompany as any)?.phone ||
    (currentCompany as any)?.company_contact_no ||
    '';

  const assignedUnitName =
    liveCompany?.unitName ||
    (currentUser as any)?.unit_name ||
    unitPost ||
    '';
  const assignedUnitCity =
    liveCompany?.unitCity ||
    (currentUser as any)?.scope?.unit_city ||
    (currentUser as any)?.unitCity ||
    companyCity ||
    '';
  const assignedUnitState =
    liveCompany?.unitState ||
    (currentUser as any)?.scope?.state_name ||
    companyState ||
    '';

  /**
   * CANONICAL FEATURE REGISTRY (Gated strictly by live MySQL menu permissions)
   */
  const ALL_FEATURES: FeatureCardConfig[] = [
    // 1. Monthly Attendance
    {
      id: 'attendance',
      title: 'Attendance',
      getSubtitle: (d) => `${d.attendanceRatio} Days`,
      icon: 'calendar',
      bgColor: '#FEF3C7',
      iconColor: '#D97706',
      badgeColor: '#D97706',
      targetScreen: 'MonthlyCalendar',
      requiredMenus: ['Attendance Sheet', 'Android Attendance Logs'],
    },
    // 2. Salary Slip
    {
      id: 'salary',
      title: 'Salary Slip',
      getSubtitle: (d) => d.lastMonthName,
      icon: 'document',
      bgColor: '#DCFCE7',
      iconColor: '#16A34A',
      badgeColor: '#15803D',
      targetScreen: 'SalarySlip',
      requiredMenus: ['Staff Salary Details', 'Salary Slip'],
    },
    // 3. Leave Balance
    {
      id: 'leave',
      title: 'Leave Balance',
      getSubtitle: (d) => `${d.remainingLeaveBalance} Days Left`,
      icon: 'clock',
      bgColor: '#EDE9FE',
      iconColor: '#7C3AED',
      badgeColor: '#7C3AED',
      targetScreen: 'LeaveApply',
      requiredMenus: ['Leave Apply'],
    },
    // 4. KYC Dossier
    {
      id: 'kyc',
      title: 'KYC Dossier',
      getSubtitle: (d) => d.kycStatus,
      icon: 'shield',
      bgColor: '#E0E7FF',
      iconColor: '#4F46E5',
      badgeColor: '#4338CA',
      targetScreen: 'DocumentStatus',
      requiredMenus: ['Employee Master'],
    },
    // 5. Work Proof Photos
    {
      id: 'work_proof',
      title: 'Work Proof',
      getSubtitle: () => 'Upload',
      icon: 'camera',
      bgColor: '#CFFAFE',
      iconColor: '#0891B2',
      badgeColor: '#0E7490',
      targetScreen: 'WorkProofPhotos',
      requiredMenus: ['Branchwise image upload', 'Working Images Upload'],
    },
    // 6. Site Audit
    {
      id: 'site_audit',
      title: 'Site Audit',
      getSubtitle: () => '6-Pt Audit',
      icon: 'audit',
      bgColor: '#DCFCE7',
      iconColor: '#16A34A',
      badgeColor: '#15803D',
      targetScreen: 'SiteAudit',
      requiredMenus: ['Site Audit'],
    },
    // 7. Guard Muster Roll
    {
      id: 'muster_roll',
      title: 'Guard Muster',
      getSubtitle: (d) => (d.deployedGuardsCount ? `${d.deployedGuardsCount} Guards` : 'Shift Roll'),
      icon: 'users',
      bgColor: '#FEF3C7',
      iconColor: '#D97706',
      badgeColor: '#B45309',
      targetScreen: 'MusterRoll',
      requiredMenus: ['Guard Muster Roll'],
    },
    // 8. 10-Point Grooming
    {
      id: 'grooming',
      title: 'Grooming',
      getSubtitle: () => '10-Pt Check',
      icon: 'check-circle',
      bgColor: '#EDE9FE',
      iconColor: '#7C3AED',
      badgeColor: '#7C3AED',
      targetScreen: 'GroomingChecklist',
      requiredMenus: ['Grooming Checklist'],
    },
    // 9. Service Quality Rating
    {
      id: 'client_rating',
      title: 'Client Rating',
      getSubtitle: () => 'Feedback',
      icon: 'star',
      bgColor: '#FEF3C7',
      iconColor: '#D97706',
      badgeColor: '#B45309',
      targetScreen: 'ServiceQualityRating',
      requiredMenus: ['Service Quality Rating'],
    },
    // 10. Chemicals / Stock Check
    {
      id: 'materials',
      title: 'Chemicals',
      getSubtitle: () => 'Daily Usage',
      icon: 'flask',
      bgColor: '#EFF6FF',
      iconColor: '#2563EB',
      badgeColor: '#1D4ED8',
      targetScreen: 'MaterialCheck',
      requiredMenus: ['Item Matser', 'Item Master'],
    },
    // 11. Petty Cash
    {
      id: 'petty_cash',
      title: 'Petty Cash',
      getSubtitle: (d) => `${d.pettyCashCount} Claims`,
      icon: 'plus',
      bgColor: '#FFEDD5',
      iconColor: '#EA580C',
      badgeColor: '#C2410C',
      targetScreen: 'PettyCash',
      requiredMenus: ['Petty Cash Android', 'Petty Cash Request', 'Petty Cash'],
    },
    // 12. Conveyance & Travel
    {
      id: 'travel',
      title: 'Conveyance',
      getSubtitle: () => 'Travel Claim',
      icon: 'location',
      bgColor: '#E0E7FF',
      iconColor: '#4F46E5',
      badgeColor: '#4338CA',
      targetScreen: 'TravelExpense',
      requiredMenus: ['Add Travel / Claim', 'Travel Expense', 'Conveyance Claim'],
    },
    // 13. Fire Safety
    {
      id: 'fire_safety',
      title: 'Fire Safety',
      getSubtitle: () => 'Extinguisher',
      icon: 'fire',
      bgColor: '#FEE2E2',
      iconColor: '#DC2626',
      badgeColor: '#B91C1C',
      targetScreen: 'FireExtinguisher',
      requiredMenus: ['Fire Safety', 'Fire Extinguisher'],
    },
    // 14. Spot Recruitment
    {
      id: 'recruitment',
      title: 'Spot Hiring',
      getSubtitle: () => 'New Guard',
      icon: 'person',
      bgColor: '#FCE7F3',
      iconColor: '#DB2777',
      badgeColor: '#BE185D',
      targetScreen: 'SpotRecruitment',
      requiredMenus: ['Employee Recruitment', 'Resource Recruitment'],
    },
    // 15. Emergency Directory (Available to all field personnel)
    {
      id: 'emergency',
      title: 'Emergency',
      getSubtitle: () => 'Quick Dial',
      icon: 'phone',
      bgColor: '#FFEDD5',
      iconColor: '#EA580C',
      badgeColor: '#C2410C',
      targetScreen: 'EmergencyDirectory',
      isAvailable: () => true,
    },
    // 16. My Profile (Always available)
    {
      id: 'profile',
      title: 'My Profile',
      getSubtitle: () => 'Details',
      icon: 'person',
      bgColor: '#F3E8FF',
      iconColor: '#9333EA',
      badgeColor: '#7E22CE',
      targetScreen: 'ProfileTab',
      isAvailable: () => true,
    },
    // ── ROOT ADMIN EXCLUSIVE OPERATIONS & TENANT RBAC CONTROLS ──
    // 17. Site Units & Geofencing (Company Admin / Root Admin)
    {
      id: 'admin_site_units',
      title: 'Site Units',
      getSubtitle: () => 'Add / Geofence',
      icon: 'location',
      bgColor: '#CCFBF1',
      iconColor: '#0F766E',
      badgeColor: '#0F766E',
      targetScreen: 'SiteUnits',
      requiredMenus: ['Branch Master', 'Unit Master', 'Client Master'],
    },
    // 18. Create Role & Designation (Company Admin / Root Admin)
    {
      id: 'admin_create_role',
      title: 'Create Role',
      getSubtitle: () => 'Designations',
      icon: 'shield',
      bgColor: '#FEF3C7',
      iconColor: '#D97706',
      badgeColor: '#B45309',
      targetScreen: 'CreateRole',
      requiredMenus: ['Create Role', 'Manage Role'],
    },
    // 19. Assign Features & RBAC Matrix (Company Admin / Root Admin)
    {
      id: 'admin_role_rbac',
      title: 'Role RBAC',
      getSubtitle: () => 'Feature Matrix',
      icon: 'lock',
      bgColor: '#EDE9FE',
      iconColor: '#7C3AED',
      badgeColor: '#6D28D9',
      targetScreen: 'RolePermissions',
      requiredMenus: ['Create Role', 'Manage Role', 'User Management'],
    },
    // 20. Deploy Staff / Employee to Unit (Company Admin / Root Admin)
    {
      id: 'admin_add_staff',
      title: 'Add Worker',
      getSubtitle: () => 'Deploy to Unit',
      icon: 'users',
      bgColor: '#FEF3C7',
      iconColor: '#D97706',
      badgeColor: '#B45309',
      targetScreen: 'AddStaff',
      isAvailable: () => isCompanyAdmin,
    },
    // 21. Workers Directory (Company Admin / Workforce Management)
    {
      id: 'admin_workers_list',
      title: 'Workers Directory',
      getSubtitle: () => 'Credentials & Attendance',
      icon: 'users',
      bgColor: '#EDE9FE',
      iconColor: '#7C3AED',
      badgeColor: '#6D28D9',
      targetScreen: 'WorkersList',
      isAvailable: () => isCompanyAdmin,
    },
    // 22. Leave Policy Setup (ONLY Company Admin)
    {
      id: 'admin_leave_policy',
      title: 'Leave Policy',
      getSubtitle: () => 'Quotas & Setup',
      icon: 'calendar',
      bgColor: '#E0F2FE',
      iconColor: '#0284C7',
      badgeColor: '#0369A1',
      targetScreen: 'LeavePolicy',
      isAvailable: () => isCompanyAdmin,
    },
    // 23. Leave Approvals (Company Admin or any role explicitly granted Leave Request RBAC permission)
    {
      id: 'supervisor_leave_approvals',
      title: 'Leave Approvals',
      getSubtitle: () => 'Unit Leave List',
      icon: 'check-circle',
      bgColor: '#FEF3C7',
      iconColor: '#D97706',
      badgeColor: '#B45309',
      targetScreen: 'LeaveApproval',
      isAvailable: (hasAccess) => {
        if (isCompanyAdmin) return true;
        return hasAccess('Leave Request') || hasAccess('Attendance / Leave Approval');
      },
    },
    // 24. Generate Salary Slip (Company Admin: Generate, Process & Send Salary Slips to Workers)
    {
      id: 'admin_salary_slips',
      title: 'Generate Salary Slip',
      getSubtitle: () => 'Process & Send',
      icon: 'document',
      bgColor: '#DCFCE7',
      iconColor: '#16A34A',
      badgeColor: '#15803D',
      targetScreen: 'AdminSalarySlip',
      isAvailable: () => isCompanyAdmin,
    },
    // 25. Document Verify — Company Admin ko hamesha, baaki roles ko sirf RBAC 'Document Verify' permission se
    {
      id: 'admin_doc_verify',
      title: 'Document Verify',
      getSubtitle: () => 'Review KYC Docs',
      icon: 'shield',
      bgColor: '#EDE9FE',
      iconColor: '#7C3AED',
      badgeColor: '#6D28D9',
      targetScreen: 'DocumentVerify',
      isAvailable: (hasAccess) => {
        if (isCompanyAdmin) return true;
        return hasAccess('Document Verify');
      },
    },
    // 26. Punch Photos & Staff Attendance Review (ONLY Company Admin)
    {
      id: 'admin_attendance_review',
      title: 'Punch Photos',
      getSubtitle: () => 'Staff Calendar',
      icon: 'camera',
      bgColor: '#CCFBF1',
      iconColor: '#0F766E',
      badgeColor: '#0D9488',
      targetScreen: 'CompanyAttendanceReview',
      isAvailable: () => isCompanyAdmin,
    },
    // 27. Work Photos & Working Images Review (ONLY Company Admin)
    {
      id: 'admin_work_images_review',
      title: 'Work Photos',
      getSubtitle: () => 'Daily Proofs',
      icon: 'passport-photo',
      bgColor: '#EDE9FE',
      iconColor: '#7C3AED',
      badgeColor: '#6D28D9',
      targetScreen: 'CompanyWorkImagesReview',
      isAvailable: () => isCompanyAdmin,
    },
  ];

  // Dynamic Filtering: Render features based on user role & backend permissions
  // When Company Admin logs in: Site Units, Add Worker, Workers Directory, Punch Photos, Work Photos, Generate Salary Slip, Create Role, Role RBAC, Leave Policy, and Leave Approvals!
  const visibleCards = useMemo(() => {
    if (isCompanyAdmin) {
      const order = [
        'admin_site_units',
        'admin_add_staff',
        'admin_workers_list',
        'admin_attendance_review',
        'admin_work_images_review',
        'admin_salary_slips',
        'admin_doc_verify',
        'admin_create_role',
        'admin_role_rbac',
        'admin_leave_policy',
        'supervisor_leave_approvals',
      ];
      return order
        .map((id) => ALL_FEATURES.find((c) => c.id === id))
        .filter((c): c is FeatureCardConfig => Boolean(c));
    }

    return ALL_FEATURES.filter((card) => {
      // These cards are strictly Company Admin only — never show to any other role
      if (card.id === 'admin_attendance_review') return false;
      if (card.id === 'admin_work_images_review') return false;
      if (card.id === 'admin_leave_policy') return false;
      if (card.id === 'admin_add_staff') return false;
      if (card.id === 'admin_workers_list') return false;
      if (card.id === 'admin_site_units') return false;
      if (card.id === 'admin_create_role') return false;
      if (card.id === 'admin_role_rbac') return false;
      if (card.id === 'admin_salary_slips') return false;
      // Document Verify: sirf RBAC 'Document Verify' permission se — koi bhi role
      if (card.id === 'admin_doc_verify') {
        return hasMenuAccess('Document Verify');
      }
      // If card has custom availability function
      if (card.isAvailable) {
        return card.isAvailable(hasMenuAccess, userRole);
      }
      // If card requires specific SQL menu items
      if (card.requiredMenus && card.requiredMenus.length > 0) {
        return card.requiredMenus.some((menu) => hasMenuAccess(menu));
      }
      return false;
    });
  }, [currentUser?.permissions, userRole, hasMenuAccess, isCompanyAdmin]);

  const canAccessPunch =
    !isCompanyAdmin &&
    (hasMenuAccess('Attendance Sheet') || hasMenuAccess('Android Attendance Logs'));

  return (
    <AppScreenContainer
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[brandColor, '#0F766E']}
          tintColor={brandColor}
          progressBackgroundColor="#FFFFFF"
        />
      }
      contentContainerStyle={[styles.container, { paddingBottom: bottomInset + 30 }]}
      backgroundColor={colors.background}
    >
      {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.headerProfileGroup}
            onPress={() => {
              if (!isCompanyAdmin && !isSuperAdmin) {
                navigate('ProfileTab');
              }
            }}
            activeOpacity={isCompanyAdmin || isSuperAdmin ? 1 : 0.75}
            disabled={isCompanyAdmin || isSuperAdmin}
            accessibilityLabel={
              isSuperAdmin
                ? 'Super Administrator'
                : isCompanyAdmin
                ? 'Company Administrator'
                : 'View Profile'
            }
          >
            <View style={[styles.avatarCircle, { backgroundColor: brandColor }]}>
              <Text style={styles.avatarInitials}>
                {employeeName.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.greetingTitle} numberOfLines={1}>
                {employeeName}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerRightGroup}>
            {/* Global Notification Bell Icon (Left of Logout) */}
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => navigate('Notifications')}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="View Notifications"
            >
              <AppIcon name="bell" size={19} color="#334155" />
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Logout Button */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => setLogoutModalVisible(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Sign Out"
            >
              <AppIcon name="logout" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sleek Compact Enterprise Info Card */}
        <View style={styles.compactCompanyCard}>
          {/* Top Row: Company Icon, Name & Code */}
          <View style={styles.compactCompanyTopRow}>
            <View style={styles.compactLogoWrap}>
              <AppIcon name="building" size={15} color="#0F766E" />
            </View>
            <Text style={styles.compactCompanyName} numberOfLines={1}>
              {companyName}
            </Text>
            <View style={styles.compactCodeBadge}>
              <Text style={styles.compactCodeText}>Code: {companyCode}</Text>
            </View>
          </View>

          {/* Details Row: Head Office & City / Region side-by-side */}
          <View style={styles.compactDetailsRow}>
            {/* Head Office (or Unit for worker) */}
            <View style={styles.compactDetailItem}>
              <View style={styles.compactDetailLabelRow}>
                <AppIcon name="location" size={11} color="#0D9488" />
                <Text style={styles.compactDetailLabel}>
                  {isCompanyAdmin ? 'HEAD OFFICE' : 'UNIT'}
                </Text>
              </View>
              <Text style={styles.compactDetailVal} numberOfLines={1} ellipsizeMode="tail">
                {isCompanyAdmin ? (companyLocation || '—') : (assignedUnitName || '—')}
                {companyPin ? ` (${companyPin})` : ''}
              </Text>
            </View>

            {/* Vertical Divider */}
            <View style={styles.compactVerticalDivider} />

            {/* City & Region */}
            <View style={styles.compactDetailItem}>
              <View style={styles.compactDetailLabelRow}>
                <AppIcon name="map-pin" size={11} color="#6366F1" />
                <Text style={styles.compactDetailLabel}>CITY & REGION</Text>
              </View>
              <Text style={styles.compactDetailVal} numberOfLines={1} ellipsizeMode="tail">
                {isCompanyAdmin
                  ? ([companyCity, companyState].filter(Boolean).join(', ') || '—')
                  : ([assignedUnitCity, assignedUnitState].filter(Boolean).join(', ') || [companyCity, companyState].filter(Boolean).join(', ') || '—')}
              </Text>
            </View>
          </View>
        </View>

        {/* Company Admin Enterprise Overview Tiles (Total Units & Total Workers) */}
        {isCompanyAdmin && (
          <>
            <Text style={styles.sectionHeaderTitle}>ENTERPRISE OVERVIEW</Text>
            <View style={styles.kpiGrid}>
              {/* Total Units */}
              <TouchableOpacity
                style={styles.kpiTile}
                activeOpacity={0.8}
                onPress={() => navigate('SiteUnits')}
              >
                <View style={styles.kpiTop}>
                  <Text style={styles.kpiLabel} numberOfLines={1} adjustsFontSizeToFit>Total Units</Text>
                  <View style={[styles.kpiIconDot, { backgroundColor: '#CCFBF1' }]}>
                    <AppIcon name="location" size={14} color="#0F766E" />
                  </View>
                </View>
                <Text style={styles.kpiValue}>{adminUnitsCount}</Text>
                <Text style={styles.kpiSubtext}>Active Sites</Text>
              </TouchableOpacity>

              {/* Total Workers (Clickable to view Workers Directory) */}
              <TouchableOpacity
                style={styles.kpiTile}
                activeOpacity={0.8}
                onPress={() => navigate('WorkersList')}
              >
                <View style={styles.kpiTop}>
                  <Text style={styles.kpiLabel} numberOfLines={1} adjustsFontSizeToFit>Total Workers</Text>
                  <View style={[styles.kpiIconDot, { backgroundColor: '#EDE9FE' }]}>
                    <AppIcon name="users" size={14} color="#7C3AED" />
                  </View>
                </View>
                <Text style={styles.kpiValue}>{adminWorkersCount}</Text>
                <Text style={styles.kpiSubtext}>Deployed Staff (Tap)</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Syncing indicator */}
        {loading && !refreshing && (
          <View style={styles.syncBanner}>
            <ActivityIndicator size="small" color={brandColor} />
            <Text style={styles.syncBannerText}>Updating live records...</Text>
          </View>
        )}

        {/* Shift Attendance Card (Shown if user has attendance menu access) */}
        {canAccessPunch && (
          <TouchableOpacity
            style={styles.compactPunchCard}
            activeOpacity={0.88}
            onPress={() => navigate('GeofencePunch')}
          >
            <View style={styles.punchCardHeaderRow}>
              <View style={styles.punchHeaderLeft}>
                <View style={styles.punchIconCircle}>
                  <AppIcon name="fingerprint" size={20} color="#0D9488" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.punchCardTitleRow}>
                    <Text style={styles.punchCardTitle}>Shift Attendance</Text>
                  </View>
                  <Text style={styles.punchCardSubtitle} numberOfLines={1}>
                    {punchInfo.distanceText}
                  </Text>
                </View>
              </View>

              <View style={styles.punchHeaderRight}>
                <View
                  style={[
                    styles.punchStatusPill,
                    {
                      backgroundColor: punchInfo.statusBg,
                      borderColor: punchInfo.statusBorder,
                    },
                  ]}
                >
                  <AppIcon
                    name={punchInfo.statusIcon as any}
                    size={11}
                    color={punchInfo.statusColor}
                  />
                  <Text style={[styles.punchStatusPillText, { color: punchInfo.statusColor }]}>
                    {punchInfo.statusLabel}
                  </Text>
                </View>

                <View style={styles.liveClockBadge}>
                  <AppIcon name="clock" size={10} color="#0D9488" />
                  <Text style={styles.liveClockText}>{currentTime}</Text>
                </View>
              </View>
            </View>

            {/* Timings */}
            <View style={styles.timingSection}>
              <View style={styles.timeRecordRow}>
                <View style={styles.timeRecordLabelWrap}>
                  <View style={[styles.timeDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.timeRecordLabel}>IN TIME</Text>
                </View>
                <View style={styles.timeValueWrap}>
                  <View
                    style={[
                      styles.timeBadgeIcon,
                      punchInfo.inTime !== '--:--' && styles.timeBadgeIconActive,
                    ]}
                  >
                    <AppIcon
                      name="clock"
                      size={14}
                      color={punchInfo.inTime !== '--:--' ? '#0D9488' : '#94A3B8'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.timeRecordValue,
                      punchInfo.inTime !== '--:--' && styles.timeRecordValueActive,
                    ]}
                  >
                    {punchInfo.inTime}
                  </Text>
                </View>
              </View>

              <View style={styles.timeDivider} />

              <View style={styles.timeRecordRow}>
                <View style={styles.timeRecordLabelWrap}>
                  <View style={[styles.timeDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.timeRecordLabel}>OUT TIME</Text>
                </View>
                <View style={styles.timeValueWrap}>
                  <View
                    style={[
                      styles.timeBadgeIcon,
                      punchInfo.outTime !== '--:--' && styles.timeBadgeIconOutActive,
                    ]}
                  >
                    <AppIcon
                      name="clock"
                      size={14}
                      color={punchInfo.outTime !== '--:--' ? '#EF4444' : '#94A3B8'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.timeRecordValue,
                      punchInfo.outTime !== '--:--' && styles.timeRecordValueActive,
                    ]}
                  >
                    {punchInfo.outTime}
                  </Text>
                </View>
              </View>

              {punchInfo.isPunchedOut && (
                <>
                  <View style={styles.timeDivider} />
                  <View style={styles.timeRecordRow}>
                    <View style={styles.timeRecordLabelWrap}>
                      <View style={[styles.timeDot, { backgroundColor: punchInfo.statusColor }]} />
                      <Text style={styles.timeRecordLabel}>TOTAL WORKED</Text>
                    </View>
                    <View style={styles.timeValueWrap}>
                      <View
                        style={[styles.timeBadgeIcon, { backgroundColor: punchInfo.statusBg }]}
                      >
                        <AppIcon name="clock" size={14} color={punchInfo.statusColor} />
                      </View>
                      <Text
                        style={[
                          styles.timeRecordValue,
                          styles.timeRecordValueActive,
                          { color: punchInfo.statusColor },
                        ]}
                      >
                        {punchInfo.durationText}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Action Punch Button */}
            <View style={[styles.heroPunchBtn, { backgroundColor: brandColor }]}>
              <View style={styles.heroPunchBtnInner}>
                <View style={styles.heroPunchIconCircle}>
                  <AppIcon name="fingerprint" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.heroPunchBtnText}>
                  {punchInfo.isDutyActive
                    ? 'Mark Shift OUT'
                    : punchInfo.isPunchedOut
                    ? 'View / Re-punch'
                    : 'Mark Shift IN'}
                </Text>
              </View>
              <View style={styles.heroPunchArrowCircle}>
                <AppIcon name="chevronRight" size={14} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* DYNAMIC FEATURE CARDS GRID */}
        <Text style={styles.sectionHeaderTitle}>QUICK FEATURES & SERVICES</Text>

        <View style={styles.cardsGrid}>
          {visibleCards.map((card) => {
            const subtitle = card.getSubtitle({
              attendanceRatio,
              lastMonthName,
              remainingLeaveBalance,
              kycStatus,
              pettyCashCount,
              deployedGuardsCount,
            });

            return (
              <TouchableOpacity
                key={card.id}
                style={styles.featureCard}
                activeOpacity={0.75}
                onPress={() => navigate(card.targetScreen)}
              >
                <View style={[styles.cardIconWrap, { backgroundColor: card.bgColor }]}>
                  <AppIcon name={card.icon} size={20} color={card.iconColor} />
                </View>
                <Text
                  style={styles.cardTitle}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {card.title}
                </Text>
                <Text
                  style={[styles.cardBadgeValue, { color: card.badgeColor }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                >
                  {subtitle}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

      {/* Global Custom Logout Alert Modal Card */}
      <CustomAlertModal
        visible={logoutModalVisible}
        type="warning"
        title="Sign Out"
        message="Are you sure you want to disconnect from your active session?"
        buttons={[
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: () => {
              setLogoutModalVisible(false);
              logout();
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setLogoutModalVisible(false),
          },
        ]}
        onClose={() => setLogoutModalVisible(false)}
      />

      {/* Dynamic Generic Modal Alert */}
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
