import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Image,
  Linking,
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
import { useNavigation, useNavigationState } from '../../navigation/navigationContext';
import { ScreenName } from '../../navigation/types';
import { staffApi, authApi, apiClient, API_ENDPOINTS, ANDROID_API_KEY, BreakPunchItem } from '../../api';
import { checkForInAppUpdate } from '../../services/inAppUpdate.service';
import { companyAttendanceReviewCache } from '../features/superadmin/CompanyAttendanceReviewScreen';
import { companyWorkImagesReviewCache } from '../features/superadmin/CompanyWorkImagesReviewScreen';
import { documentVerifyCache } from '../features/superadmin/DocumentVerifyScreen';
import { colors } from '../../theme';
import { ms } from '../../theme/responsive';

// Central In-Memory Cache with TTL for fast, zero-flicker transitions & lazy loading
interface DashboardCacheRecord {
  timestamp: number;
  attendanceCount: number;
  latestPunch: any;
  salaryData: any;
  leaveCount: number;
  remainingLeaveBalance: number;
  kycStatus: string;
  pettyCashCount: number;
  deployedGuardsCount: number;
  latestSalaryMonthLabel: string;
  liveCompany: any;
  profileName: string;
  totalApis?: number;
  durationMs?: number;
  adminUnitsCount?: number;
  adminWorkersCount?: number;
  adminTodayPunchedCount?: number;
  adminTodayWorkPhotosCount?: number;
}

const DASHBOARD_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL
const dashboardMemoryCache: Record<string, DashboardCacheRecord> = {};
let cachedHolidaysList: any[] | null = null;
const cachedPolicyThresholds: Record<string, { working: number; short: number }> = {};

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

function parseDojDate(rawStr?: string | null): Date | null {
  if (!rawStr) return null;
  const s = String(rawStr).trim();
  if (!s || s === '—' || s === '-' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return null;

  if (s.includes('/') || (s.includes('-') && s.split('-')[0].length <= 2)) {
    const delimiter = s.includes('/') ? '/' : '-';
    const datePart = s.split(' ')[0].split('T')[0];
    const parts = datePart.split(delimiter);
    if (parts.length >= 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y) && y > 1900 && m >= 0 && m <= 11 && d >= 1 && d <= 31) {
        return new Date(y, m, d);
      }
    }
  }

  if (s.includes('-')) {
    const datePart = s.split(/[ T]/)[0];
    const parts = datePart.split('-');
    if (parts.length >= 3 && parts[0].length === 4) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y) && y > 1900 && m >= 0 && m <= 11 && d >= 1 && d <= 31) {
        return new Date(y, m, d);
      }
    }
  }

  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? null : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

/**
 * Performance Profiler: Logs exact API endpoint name and duration in ms to console
 */
async function timedApi<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const t0 = Date.now();
  try {
    const res: any = await fn();
    const cost = Date.now() - t0;
    let detail = '';
    if (res?.success && res?.data) {
      const list = Array.isArray(res.data) ? res.data : res.data?.results;
      if (Array.isArray(list)) {
        const countStr = typeof res.data?.count === 'number' ? ` (Total: ${res.data.count})` : '';
        detail = ` | Fetched ${list.length} records${countStr}`;
      } else if (typeof res.data === 'object') {
        detail = ' | OK';
      }
    } else if (res && !res.success) {
      detail = ` | Failed: ${res.error || 'Unknown error'}`;
    }
    console.log(`[Dashboard API] ⏱️ ${name} -> ${cost}ms${detail}`);
    return res;
  } catch (err) {
    const cost = Date.now() - t0;
    console.warn(`[Dashboard API] ❌ ${name} failed after ${cost}ms:`, err);
    throw err;
  }
}

export const UnifiedDashboardScreen: React.FC = () => {
  const { currentUser, logout, hasMenuAccess } = useAuthStore();
  const { currentCompany } = useTenantStore();
  const { navigate } = useNavigation();
  const { currentRoute } = useNavigationState();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16);

  const empCode = currentUser?.empCode || currentUser?.username || '';
  const initialCache = empCode ? dashboardMemoryCache[empCode] : undefined;

  // Loading & Refreshing States
  const [loading, setLoading] = useState<boolean>(!initialCache);
  const [refreshing, setRefreshing] = useState(false);

  // Live real data initialized from cache
  const [attendanceCount, setAttendanceCount] = useState<number>(
    initialCache?.attendanceCount ?? 0
  );
  const [attendanceRatio, setAttendanceRatio] = useState<string>(() => {
    const n = new Date();
    const dInM = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate();
    return initialCache ? `${initialCache.attendanceCount}/${dInM}` : `0/${dInM}`;
  });
  const [latestPunch, setLatestPunch] = useState<any | null>(
    initialCache?.latestPunch ?? null
  );
  const [salaryData, setSalaryData] = useState<any | null>(
    initialCache?.salaryData ?? null
  );
  const [profileName, setProfileName] = useState<string>(
    initialCache?.profileName || (currentUser?.name && currentUser.name !== currentUser?.username ? currentUser.name : '')
  );
  const [remainingLeaveBalance, setRemainingLeaveBalance] = useState<number>(
    initialCache?.remainingLeaveBalance ?? 0
  );
  const [kycStatus, setKycStatus] = useState<string>(
    initialCache?.kycStatus ?? 'Not Submitted'
  );
  const [pettyCashCount, setPettyCashCount] = useState<number>(
    initialCache?.pettyCashCount ?? 0
  );
  const [deployedGuardsCount, setDeployedGuardsCount] = useState<number>(
    initialCache?.deployedGuardsCount ?? 0
  );
  // Company Admin Live Counts
  const [adminUnitsCount, setAdminUnitsCount] = useState<number>(
    initialCache?.adminUnitsCount ?? 0
  );
  const [adminWorkersCount, setAdminWorkersCount] = useState<number>(
    initialCache?.adminWorkersCount ?? 0
  );
  const [adminTodayPunchedCount, setAdminTodayPunchedCount] = useState<number | null>(
    companyAttendanceReviewCache.records.length > 0
      ? companyAttendanceReviewCache.records.length
      : typeof initialCache?.adminTodayPunchedCount === 'number'
      ? initialCache.adminTodayPunchedCount
      : null
  );
  const [adminTodayWorkPhotosCount, setAdminTodayWorkPhotosCount] = useState<number | null>(
    companyWorkImagesReviewCache.records.length > 0
      ? companyWorkImagesReviewCache.records.length
      : typeof initialCache?.adminTodayWorkPhotosCount === 'number'
      ? initialCache.adminTodayWorkPhotosCount
      : null
  );
  const [latestSalaryMonthLabel, setLatestSalaryMonthLabel] = useState<string>(
    initialCache?.latestSalaryMonthLabel ?? ''
  );
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
  } | null>(initialCache?.liveCompany ?? null);

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

  const brandColor = currentCompany?.brandColor || colors.primary;
  const userRole = String(currentUser?.role || '').toUpperCase();
  const isCompanyAdmin =
    userRole === 'COMPANY_ADMIN' ||
    String(currentUser?.backendRole || '').toLowerCase().includes('company admin');
  const isSuperAdmin =
    userRole === 'SUPER_ADMIN' ||
    String(currentUser?.role || '').toUpperCase() === 'SUPER_ADMIN';

  // Live Total Working Hours Count Timer
  const [workingHoursTimer, setWorkingHoursTimer] = useState<string>('0h 00m');

  // Break Punch State
  const [breakStatus, setBreakStatus] = useState<{
    isOnBreak: boolean;
    currentBreakNo: number | null;
    currentBreakStart: string | null;
    breakStarts: BreakPunchItem[];
    breakEnds: BreakPunchItem[];
  }>({
    isOnBreak: false,
    currentBreakNo: null,
    currentBreakStart: null,
    breakStarts: [],
    breakEnds: [],
  });
  const [breakLoading, setBreakLoading] = useState<boolean>(false);
  const [breakElapsedTimer, setBreakElapsedTimer] = useState<string>('00:00:00');

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
   * Fetch Live Break Status from /api/attendance/break-punch/
   */
  const fetchLiveBreakStatus = async () => {
    if (!empCode) return null;
    try {
      const targetCompCode = String(currentUser?.companyId || (currentUser as any)?.scope?.comp_code || '').trim();
      const bRes = await timedApi('Break Status (GET /api/attendance/break-punch/)', () =>
        staffApi.getBreakStatus(empCode, targetCompCode)
      );
      if (bRes.success && bRes.data && bRes.data.status === 'ok') {
        const bd = bRes.data;
        const isBreakActive =
          bd.is_on_break === true ||
          (bd.is_on_break as any) === 1 ||
          String(bd.is_on_break).trim().toLowerCase() === 'true' ||
          String(bd.is_on_break).trim() === '1';

        const rawStart =
          bd.current_break_start ||
          (bd.break_start && bd.break_start.length > 0
            ? bd.break_start[bd.break_start.length - 1]?.start_time
            : null);

        const newStatus = {
          isOnBreak: isBreakActive,
          currentBreakNo: bd.current_break_no ?? (bd.break_start ? bd.break_start.length : null),
          currentBreakStart: rawStart ?? null,
          breakStarts: bd.break_start || [],
          breakEnds: bd.break_end || [],
        };
        setBreakStatus(newStatus);
        return newStatus;
      }
    } catch (bErr) {
      console.warn('[Dashboard] Failed to fetch break status:', bErr);
    }
    return null;
  };

  /**
   * Fetch Live Data from Real MySQL Backend APIs (Cached & Lazy-loaded)
   */
  const fetchDashboardData = async (isForce: boolean = false) => {
    if (!empCode) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const fetchStartTime = Date.now();
    const isSupervisor = userRole.includes('SUPERVISOR') || Boolean(hasMenuAccess && hasMenuAccess('GUARD_DEPLOYMENT'));

    try {
      syncNotifications(currentUser);

      // Check In-Memory Cache (Instant zero-flicker render)
      const cached = dashboardMemoryCache[empCode];
      if (cached) {
        // Sync with freshest review screen caches if user navigated back
        if (companyAttendanceReviewCache.records.length > 0) {
          cached.adminTodayPunchedCount = companyAttendanceReviewCache.records.length;
        }
        if (companyWorkImagesReviewCache.records.length > 0) {
          cached.adminTodayWorkPhotosCount = companyWorkImagesReviewCache.records.length;
        }

        setAttendanceCount(cached.attendanceCount);
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        setAttendanceRatio(`${cached.attendanceCount}/${daysInMonth}`);
        if (cached.latestPunch) setLatestPunch(cached.latestPunch);
        if (cached.salaryData) setSalaryData(cached.salaryData);
        setRemainingLeaveBalance(cached.remainingLeaveBalance);
        setKycStatus(cached.kycStatus);
        setPettyCashCount(cached.pettyCashCount);
        setDeployedGuardsCount(cached.deployedGuardsCount);
        if (cached.latestSalaryMonthLabel) setLatestSalaryMonthLabel(cached.latestSalaryMonthLabel);
        if (cached.liveCompany) setLiveCompany(cached.liveCompany);
        if (cached.profileName) setProfileName(cached.profileName);
        if (typeof cached.adminUnitsCount === 'number') setAdminUnitsCount(cached.adminUnitsCount);
        if (typeof cached.adminWorkersCount === 'number') setAdminWorkersCount(cached.adminWorkersCount);
        if (typeof cached.adminTodayPunchedCount === 'number') setAdminTodayPunchedCount(cached.adminTodayPunchedCount);
        if (typeof cached.adminTodayWorkPhotosCount === 'number') setAdminTodayWorkPhotosCount(cached.adminTodayWorkPhotosCount);

        // Instant Cache Hit: Return without network calls (unless forced pull-to-refresh)
        if (!isForce) {
          setLoading(false);
          setRefreshing(false);
          console.log(`[Dashboard] ⚡ Instant Cache Hit: 0 APIs called (0ms) | Punched Today: ${cached.adminTodayPunchedCount ?? 0} | Work Photos Today: ${cached.adminTodayWorkPhotosCount ?? 0} | Workers: ${cached.adminWorkersCount ?? 0} | Units: ${cached.adminUnitsCount ?? 0}`);
          return;
        }
      }

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

      // Populate live company & unit details from currentUser.scope, currentUser.companyName, or tenant store immediately
      const scope = (currentUser as any)?.scope;
      const resolvedScopeCompName =
        scope?.comp_name ||
        scope?.company_name ||
        (currentUser as any)?.companyName ||
        currentCompany?.name ||
        '';

      if (scope || resolvedScopeCompName) {
        setLiveCompany((prev) => ({
          name: resolvedScopeCompName || prev?.name || '',
          code: scope?.comp_code || currentUser?.companyId || prev?.code || targetCompCode,
          location: scope?.location || prev?.location || '',
          city: scope?.city || prev?.city || '',
          state: scope?.state || scope?.region || prev?.state || '',
          panNo: scope?.pan_no || prev?.panNo,
          pfNo: scope?.pf_no || prev?.pfNo,
          pin: scope?.pin || prev?.pin || '',
          phone: scope?.phone || prev?.phone || '',
          unitName: scope?.unit_name || currentUser?.branchOrUnit || prev?.unitName || '',
          unitCode: scope?.unit_code || prev?.unitCode || rawUnitCode || '',
          unitCity: scope?.city || prev?.unitCity || '',
          unitState: scope?.state || scope?.region || prev?.unitState || '',
        }));
      }

      // If Company Admin, fetch company's live total units, total workers, and real company details!
      if (isCompanyAdmin) {
        useSuperAdminStore.getState().fetchLiveCompanies().catch(() => {});
        const compUrl = targetCompCode
          ? `${API_ENDPOINTS.COMPANIES}?search=${encodeURIComponent(targetCompCode)}`
          : `${API_ENDPOINTS.COMPANIES}?page=1&page_size=50`;

        // Also pre-fetch today's punch logs and work photos for instant 0ms Company Review loading & live counts
        const today = new Date();
        const dStr = String(today.getDate()).padStart(2, '0');
        const mStr = String(today.getMonth() + 1).padStart(2, '0');
        const yStr = String(today.getFullYear());
        const dateFormatted = `${dStr}/${mStr}/${yStr}`;
        const dateIso = `${yStr}-${mStr}-${dStr}`;
        const attLogsUrl = `/api/attendance/android-logs-portal/attendance-logs/?from_date=${dateFormatted}&to_date=${dateFormatted}&state_name=ALL&unit_code=ALL&client_code=ALL`;
        const workImagesUrl = `/api/attendance/android-logs-portal/work-images/?from_date=${dateFormatted}&to_date=${dateFormatted}&state_name=ALL&unit_code=ALL&client_code=ALL`;

        const [uRes, eRes, compRes, attRes, workRes, hrWorkRes] = await Promise.allSettled([
          timedApi('Units Count (GET /api/masters/units/)', () => apiClient.get<any>(`${API_ENDPOINTS.UNITS}?page=1&page_size=1`)),
          timedApi('Workers Count (GET /api/hr/employees/)', () => apiClient.get<any>(`${API_ENDPOINTS.EMPLOYEES}?page=1&page_size=1`)),
          timedApi('Company Details (GET /api/masters/companies/)', () => apiClient.get<any>(compUrl)),
          timedApi('Today Attendance Pre-fetch (GET .../attendance-logs/)', () => apiClient.get<any>(attLogsUrl)),
          timedApi('Today Portal Work Photos (GET .../work-images/)', () => apiClient.get<any>(workImagesUrl)),
          timedApi('Today HR Working Images (GET /api/hr/working-images/)', () => apiClient.get<any>(API_ENDPOINTS.WORKING_IMAGES)),
        ]);

        let uTotal = 0;
        let eTotal = 0;
        let compObj: any = null;

        if (uRes.status === 'fulfilled' && uRes.value.success && uRes.value.data) {
          const ud = uRes.value.data;
          uTotal = typeof ud.count === 'number' ? ud.count : Array.isArray(ud) ? ud.length : Array.isArray(ud.results) ? ud.results.length : 0;
          setAdminUnitsCount(uTotal);
        }

        if (eRes.status === 'fulfilled' && eRes.value.success && eRes.value.data) {
          const ed = eRes.value.data;
          eTotal = typeof ed.count === 'number' ? ed.count : Array.isArray(ed) ? ed.length : Array.isArray(ed.results) ? ed.results.length : 0;
          setAdminWorkersCount(eTotal);
        }

        if (compRes.status === 'fulfilled' && compRes.value.success && compRes.value.data) {
          const cData = compRes.value.data;
          const list = Array.isArray(cData.results) ? cData.results : Array.isArray(cData) ? cData : [];
          compObj = parseCompanyFromList(list);
          if (compObj) setLiveCompany(compObj);
        }

        let todayPunched = 0;
        if (attRes.status === 'fulfilled' && attRes.value.success && attRes.value.data) {
          const aData = attRes.value.data;
          const list: any[] = Array.isArray(aData) ? aData : aData.results || [];
          companyAttendanceReviewCache.dateFormatted = dateFormatted;
          companyAttendanceReviewCache.records = list;
          companyAttendanceReviewCache.timestamp = Date.now();
          todayPunched = list.length;
          setAdminTodayPunchedCount(todayPunched);
        }

        let todayWorkPhotos = 0;
        const mergedWorkList: any[] = [];
        const seenWorkImages = new Set<string>();

        // 1. Android logs portal work-images
        let portalCount = 0;
        if (workRes.status === 'fulfilled' && workRes.value.success && workRes.value.data) {
          const wData = workRes.value.data;
          const wList: any[] = Array.isArray(wData) ? wData : wData.results || [];
          portalCount = wList.length;
          wList.forEach((r: any, idx: number) => {
            const rawImg = r.image_name || '';
            const key = rawImg || `portal-${idx}`;
            if (!seenWorkImages.has(key)) {
              seenWorkImages.add(key);
              mergedWorkList.push({
                id: r.id || `pre-portal-${idx}`,
                emp_code: r.emp_code || r.EMP_CODE || '',
                EMP_NAME: r.EMP_NAME || r.emp_name || 'Staff Member',
                unit_name: r.unit_name || r.unit_code || 'Site Unit',
                category_name: r.category_name || r.image_type || '',
                image_name: rawImg,
                image_url: r.image_url,
                datecurrent: r.datecurrent,
              });
            }
          });
        }

        // 2. HR Working Images (/api/hr/working-images/)
        let hrCount = 0;
        if (hrWorkRes.status === 'fulfilled' && hrWorkRes.value.success && hrWorkRes.value.data) {
          const hrData = hrWorkRes.value.data;
          const hrList: any[] = Array.isArray(hrData) ? hrData : hrData.results || [];
          hrList.forEach((wr: any, idx: number) => {
            const dtRaw = wr.datecurrent || '';
            if (dtRaw.includes(dateFormatted) || dtRaw.includes(dateIso)) {
              hrCount++;
              const rawImg = wr.image_name || '';
              const key = rawImg || `hr-${idx}`;
              if (!seenWorkImages.has(key)) {
                seenWorkImages.add(key);
                mergedWorkList.push({
                  id: wr.id || `pre-hr-${idx}`,
                  emp_code: wr.emp_code || wr.EMP_CODE || '',
                  EMP_NAME: wr.emp_name || wr.EMP_NAME || 'Staff Member',
                  unit_name: wr.unit_name || wr.unit_code || 'Site Unit',
                  category_name: wr.category_name || wr.image_type || '',
                  image_name: rawImg,
                  image_url: wr.image_url,
                  datecurrent: wr.datecurrent,
                });
              }
            }
          });
        }

        todayWorkPhotos = mergedWorkList.length;
        companyWorkImagesReviewCache.dateFormatted = dateFormatted;
        companyWorkImagesReviewCache.records = mergedWorkList;
        companyWorkImagesReviewCache.timestamp = Date.now();
        setAdminTodayWorkPhotosCount(todayWorkPhotos);
        console.log(`[Dashboard API] 📸 Work Proof Fetch: Portal=${portalCount} | HR API=${hrCount} | Merged Total Today=${todayWorkPhotos}`);

        // Save into dashboard memory cache with full telemetry
        dashboardMemoryCache[empCode] = {
          timestamp: Date.now(),
          attendanceCount: 0,
          latestPunch: null,
          salaryData: null,
          leaveCount: 0,
          remainingLeaveBalance: 0,
          kycStatus: 'Verified',
          pettyCashCount: 0,
          deployedGuardsCount: 0,
          latestSalaryMonthLabel: '',
          liveCompany: compObj || liveCompany,
          profileName: currentUser?.name || 'Admin',
          adminUnitsCount: uTotal,
          adminWorkersCount: eTotal,
          adminTodayPunchedCount: todayPunched,
          adminTodayWorkPhotosCount: todayWorkPhotos,
        };

        const durationMs = Date.now() - fetchStartTime;
        console.log(`[Dashboard] Company Admin Sync: 5 APIs in ~${durationMs}ms | Cached -> Punched Today: ${todayPunched} | Work Photos Today: ${todayWorkPhotos} | Workers: ${eTotal} | Units: ${uTotal}`);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // If company name is STILL not resolved and we have a company code, fetch company master from backend
      if (!resolvedScopeCompName && !liveCompany?.name && targetCompCode) {
        try {
          const compUrl = `${API_ENDPOINTS.COMPANIES}?search=${encodeURIComponent(targetCompCode)}`;
          const compRes = await timedApi('Company Master (GET /api/masters/companies/)', () => apiClient.get<any>(compUrl));
          if (compRes.success && compRes.data) {
            const list = Array.isArray(compRes.data.results) ? compRes.data.results : Array.isArray(compRes.data) ? compRes.data : [];
            const compObj = parseCompanyFromList(list);
            if (compObj) {
              setLiveCompany((prev) => ({
                ...prev,
                ...compObj,
              }));
            }
          } else if (currentCompany?.name) {
            // Permission restricted for workers (403): fallback gracefully to selected company in store
            setLiveCompany((prev) => ({
              location: prev?.location || '',
              city: prev?.city || '',
              ...prev,
              name: prev?.name || currentCompany.name,
              code: prev?.code || targetCompCode,
            }));
          }
        } catch {
          if (currentCompany?.name) {
            setLiveCompany((prev) => ({
              location: prev?.location || '',
              city: prev?.city || '',
              ...prev,
              name: prev?.name || currentCompany.name,
              code: prev?.code || targetCompCode,
            }));
          }
        }
      }

      const canViewWorkProof = Boolean(
        hasMenuAccess &&
        (hasMenuAccess('Branchwise image upload') || hasMenuAccess('Working Images Upload'))
      );

      // Lazy load petty cash, guard deployment and work proof for staff/supervisors
      const results = await Promise.allSettled([
        timedApi('Punch Logs (GET /api/attendance/android-logs/)', () => staffApi.getLivePunchLogs(empCode)),
        timedApi('Salary Details (GET /api/payroll/staff-salaries/)', () => staffApi.getSalaryDetails(empCode)),
        timedApi('Leave Applications (GET /api/leaves/applications/)', () => staffApi.getLeaveApplications()),
        timedApi('Documents & KYC (GET /api/hr/android-documents/)', () => staffApi.getDocumentsStatus(empCode)),
        isSupervisor
          ? timedApi('Petty Cash (GET /api/petty-cash/requests/)', () => staffApi.getPettyCashRequests())
          : Promise.resolve({ success: true, data: [] } as any),
        isSupervisor
          ? timedApi('Deployed Guards (GET /api/hr/employees/)', () => apiClient.get<any>(`${API_ENDPOINTS.EMPLOYEES}?unit_code=${encodeURIComponent(unitCode)}&active=1`))
          : Promise.resolve({ success: true, data: [] } as any),
        canViewWorkProof
          ? timedApi('Staff Work Proof (GET /api/hr/working-images/)', () => apiClient.get<any>(`${API_ENDPOINTS.WORKING_IMAGES}${unitCode ? `?unit_code=${encodeURIComponent(unitCode)}` : ''}`))
          : Promise.resolve({ success: true, data: [] } as any),
      ]);

      const [attRes, salRes, leaveRes, docRes, pettyRes, guardsRes, workProofRes] = results;

      // Resolve latest Salary Slip month strictly from SQL
      let resolvedLabel = '';
      const MONTHS_SHORT = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (salRes.status === 'fulfilled' && salRes.value.success && salRes.value.data) {
        const sList = (salRes.value.data as any).results || salRes.value.data;
        if (Array.isArray(sList) && sList.length > 0) {
          const mNum = parseInt(sList[0].month || sList[0].salary_month, 10);
          const yNum = parseInt(sList[0].year || sList[0].salary_year, 10);
          if (mNum >= 1 && mNum <= 12 && yNum) {
            resolvedLabel = `${MONTHS_SHORT[mNum]} ${yNum}`;
          }
        }
      }
      if (!resolvedLabel) {
        try {
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
        } catch {}
      }
      if (resolvedLabel) {
        setLatestSalaryMonthLabel(resolvedLabel);
      }

      let newAttCount = attendanceCount;
      let newLatestPunch = latestPunch;
      let newSalary = salaryData;
      let newLeaveBal = remainingLeaveBalance;
      let newKyc = kycStatus;
      let newPettyCount = pettyCashCount;
      let newGuardsCount = deployedGuardsCount;
      let liveJoiningDate: string = currentUser?.joiningDate || '';

      // 0. Process Profile User Details from MySQL GetUserDetails only if not yet loaded
      if (!profileName || !currentUser?.joiningDate) {
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
            if (item?.JOINING_DATE) {
              liveJoiningDate = item.JOINING_DATE;
              if (currentUser && currentUser.joiningDate !== item.JOINING_DATE) {
                useAuthStore.getState().updateCurrentUser({ joiningDate: item.JOINING_DATE });
              }
            }
            if (item?.DEPT_CODE && (String(item.DEPT_CODE).includes('.') || String(item.DEPT_CODE).startsWith('http'))) {
              const pStr = String(item.DEPT_CODE).trim();
              const avatarUri = pStr.startsWith('http') ? pStr : `/media/documents/${pStr.replace(/^\/+/, '')}`;
              if (currentUser && currentUser.avatarUrl !== avatarUri) {
                useAuthStore.getState().updateCurrentUser({ avatarUrl: avatarUri });
              }
            } else if (currentUser && !currentUser.avatarUrl) {
              // Modern Web Portal photo fallback (/api/hr/employee-documents/)
              staffApi.getEmployeeDocuments(currentUser.username || empCode).then((mDocRes) => {
                if (mDocRes.success && mDocRes.data) {
                  const mList = Array.isArray(mDocRes.data.results) ? mDocRes.data.results : (Array.isArray(mDocRes.data) ? mDocRes.data : []);
                  const photoItem = mList.find((d: any) => {
                    const key = String(d.document_type || '').toLowerCase();
                    return (key.includes('photo') || key.includes('passport')) && (d.file || d.file_url);
                  });
                  if (photoItem) {
                    const rawP = photoItem.file || photoItem.file_url;
                    const src = apiClient.getImageSource(rawP);
                    if (src?.uri) {
                      useAuthStore.getState().updateCurrentUser({ avatarUrl: src.uri });
                    }
                  }
                }
              }).catch(() => {});
            }

            // Fallback: If GetUserDetails didn't return employee name, fetch from attendance logs
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
      }

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
          if (cachedPolicyThresholds[empCode]) {
            workingThreshold = cachedPolicyThresholds[empCode].working;
            shortThreshold = cachedPolicyThresholds[empCode].short;
          } else {
            try {
              const pRes = await staffApi.getPolicyThresholds(empCode);
              if (pRes.success && pRes.data) {
                const pData = pRes.data as any;
                workingThreshold = Number(pData.working_hours) || 8.0;
                shortThreshold = Number(pData.short_hours) || 4.0;
                cachedPolicyThresholds[empCode] = { working: workingThreshold, short: shortThreshold };
              }
            } catch {}
          }

          const activeDoj = liveJoiningDate || currentUser?.joiningDate || '';
          const dojDate = parseDojDate(activeDoj);
          const dojMidnight = dojDate ? new Date(dojDate.getFullYear(), dojDate.getMonth(), dojDate.getDate(), 0, 0, 0).getTime() : null;

          const punchedDates = new Set<string>();
          let totalPresentCredits = 0;

          Object.entries(dayPunches).forEach(([dateStr, group]) => {
            if (dojMidnight) {
              const pD = new Date(dateStr + 'T00:00:00').getTime();
              if (!isNaN(pD) && pD < dojMidnight) return;
            }
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
            const checkDate = new Date(currentYear, currentMonth, d, 12, 0, 0);
            if (dojMidnight && checkDate.getTime() < dojMidnight) {
              // Before joining date: DO NOT credit Sunday weekly off!
              continue;
            }
            const isSunday = checkDate.getDay() === 0;
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            if (isSunday && !punchedDates.has(dateStr)) {
              totalPayableDays += 1.0;
            }
          }

          // 2. Add dynamic MySQL holidays up to today if configured and not punched
          const countedExtraDates = new Set<string>();
          try {
            let hList = cachedHolidaysList;
            if (!hList) {
              const hRes = await staffApi.getHolidays();
              if (hRes.success && hRes.data) {
                hList = Array.isArray(hRes.data.results) ? hRes.data.results : (Array.isArray(hRes.data) ? hRes.data : []);
                cachedHolidaysList = hList;
              } else {
                hList = [];
              }
            }
            if (hList && hList.length > 0) {
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
                    const hCheckDate = new Date(currentYear, currentMonth, hDay, 12, 0, 0);
                    if (dojMidnight && hCheckDate.getTime() < dojMidnight) {
                      // Before joining date: DO NOT credit holiday!
                      return;
                    }
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
                  const lCheckDate = new Date(currentYear, currentMonth, lDay, 12, 0, 0);
                  if (dojMidnight && lCheckDate.getTime() < dojMidnight) {
                    // Before joining date: DO NOT credit leave!
                    return;
                  }
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

          const isPriorToJoining = Boolean(dojMidnight && now.getTime() < dojMidnight);
          if (isPriorToJoining) {
            newAttCount = 0;
            setAttendanceCount(0);
            setAttendanceRatio(`0/${daysInMonth}`);
          } else {
            newAttCount = totalPayableDays;
            setAttendanceCount(totalPayableDays);
            setAttendanceRatio(`${totalPayableDays}/${daysInMonth}`);
          }

          const currentPunch = evaluateCurrentShiftPunch(logs, now);
          newLatestPunch = currentPunch;
          setLatestPunch(currentPunch);
        }
      }

      // 1b. Process Live Break Status from /api/attendance/break-punch/
      await fetchLiveBreakStatus();

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
        const balRes = await timedApi('Leave Balances (GET /api/leaves/balances/)', () =>
          staffApi.getLeaveBalances()
        );
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

      // 7. Process Staff Work Proof
      let staffWorkProofToday = 0;
      if (workProofRes.status === 'fulfilled' && workProofRes.value.success && workProofRes.value.data) {
        const wpData = workProofRes.value.data;
        const wpList: any[] = Array.isArray(wpData) ? wpData : wpData.results || [];
        const today = new Date();
        const dStr = String(today.getDate()).padStart(2, '0');
        const mStr = String(today.getMonth() + 1).padStart(2, '0');
        const yStr = String(today.getFullYear());
        const dateFormatted = `${dStr}/${mStr}/${yStr}`;
        const dateIso = `${yStr}-${mStr}-${dStr}`;
        wpList.forEach((wr: any) => {
          const dtRaw = wr.datecurrent || '';
          if (dtRaw.includes(dateFormatted) || dtRaw.includes(dateIso)) {
            staffWorkProofToday++;
          }
        });
        setAdminTodayWorkPhotosCount(staffWorkProofToday);
      }

      // Update in-memory cache with measured performance
      const durationMs = Date.now() - fetchStartTime;
      const apiCallCount = isSupervisor ? 7 : 5;
      console.log(`[Dashboard] Sync: ${apiCallCount} APIs in ~${durationMs}ms | Work Proofs Today: ${staffWorkProofToday}`);

      dashboardMemoryCache[empCode] = {
        timestamp: Date.now(),
        attendanceCount: newAttCount,
        latestPunch: newLatestPunch,
        salaryData: newSalary,
        leaveCount: 0,
        remainingLeaveBalance: newLeaveBal,
        kycStatus: newKyc,
        pettyCashCount: newPettyCount,
        deployedGuardsCount: newGuardsCount,
        latestSalaryMonthLabel: resolvedLabel,
        liveCompany: liveCompany,
        profileName: profileName || currentUser?.name || '',
        adminTodayWorkPhotosCount: staffWorkProofToday,
        totalApis: apiCallCount,
        durationMs,
      };
    } catch (e) {
      console.warn('[UnifiedDashboard] API fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // If returning from review screens, update count states immediately
    if (companyAttendanceReviewCache.records.length > 0) {
      setAdminTodayPunchedCount(companyAttendanceReviewCache.records.length);
      if (empCode && dashboardMemoryCache[empCode]) {
        dashboardMemoryCache[empCode].adminTodayPunchedCount = companyAttendanceReviewCache.records.length;
      }
    }
    if (companyWorkImagesReviewCache.records.length > 0) {
      setAdminTodayWorkPhotosCount(companyWorkImagesReviewCache.records.length);
      if (empCode && dashboardMemoryCache[empCode]) {
        dashboardMemoryCache[empCode].adminTodayWorkPhotosCount = companyWorkImagesReviewCache.records.length;
      }
    }
    fetchDashboardData(false);
    checkForInAppUpdate();
  }, [empCode, currentRoute.name]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh live permissions and scope in background
      const meRes = await timedApi('User Permissions & Me (GET /api/auth/me/)', () => authApi.getMe());
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
    await fetchDashboardData(true);
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

  // Live Working Hours Elapsed Count Timer: Dynamically counts up every second when shift is active
  useEffect(() => {
    const updateWorkingTimer = () => {
      const pInfo = evaluateShiftAttendance(latestPunch);

      // Case 1: Shift is Active (Punched IN, still working) -> Live elapsed count-up timer
      if (pInfo.isDutyActive && pInfo.inTime !== '--:--') {
        const parseSecs = (str: string): number | null => {
          if (!str || str === '--:--') return null;
          const s = String(str).trim();
          const hasPM = /\bPM\b/i.test(s);
          const hasAM = /\bAM\b/i.test(s);
          const m = s.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
          if (!m) return null;
          let hh = parseInt(m[1], 10);
          const mm = parseInt(m[2], 10);
          const ss = m[3] ? parseInt(m[3], 10) : 0;
          if (hasPM && hh < 12) hh += 12;
          if (hasAM && hh === 12) hh = 0;
          return hh * 3600 + mm * 60 + ss;
        };

        const inSecs = parseSecs(pInfo.inTime);
        if (inSecs !== null) {
          const now = new Date();
          const curSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
          let diff = curSecs - inSecs;
          if (diff < 0) diff += 24 * 3600; // Night shift crossing midnight
          const h = Math.floor(diff / 3600);
          const m = Math.floor((diff % 3600) / 60);
          const s = diff % 60;
          setWorkingHoursTimer(`${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
          return;
        }
      }

      // Case 2: Already punched OUT -> Finished total worked hours
      if (pInfo.isPunchedOut && pInfo.durationText) {
        setWorkingHoursTimer(pInfo.durationText);
        return;
      }

      // Case 3: Not marked yet
      setWorkingHoursTimer('0h 00m');
    };

    updateWorkingTimer();
    const interval = setInterval(updateWorkingTimer, 1000);
    return () => clearInterval(interval);
  }, [latestPunch]);

  /**
   * Safe parser for break/punch timestamps (handles ISO, 24h, 12h AM/PM)
   */
  const parseTimeToDate = (timeStr?: string | null): Date | null => {
    if (!timeStr) return null;
    const str = String(timeStr).trim();
    if (!str || str === '--:--') return null;

    // 1. Full date/time: e.g. "2026-11-24T18:05:22" or "2026-11-24 18:05:22"
    if (str.includes('-') || str.includes('/')) {
      const d = new Date(str.replace(' ', 'T'));
      if (!isNaN(d.getTime())) return d;
    }

    // 2. Time string: "18:05:22" or "06:05:22 PM" or "6:05 PM"
    const isPM = /pm/i.test(str);
    const isAM = /am/i.test(str);
    const cleanStr = str.replace(/[^\d:]/g, '');
    const parts = cleanStr.split(':');
    if (parts.length >= 2) {
      let h = parseInt(parts[0], 10) || 0;
      const m = parseInt(parts[1], 10) || 0;
      const s = parseInt(parts[2] || '0', 10) || 0;
      if (isPM && h < 12) h += 12;
      if (isAM && h === 12) h = 0;
      const d = new Date();
      d.setHours(h, m, s, 0);
      return d;
    }
    return null;
  };

  // Live Break Elapsed Count Timer: Dynamically counts up every second when employee is on break
  useEffect(() => {
    let interval: any = null;
    if (breakStatus.isOnBreak) {
      const updateBreakTimer = () => {
        try {
          const startStr =
            breakStatus.currentBreakStart ||
            (breakStatus.breakStarts && breakStatus.breakStarts.length > 0
              ? breakStatus.breakStarts[breakStatus.breakStarts.length - 1]?.start_time
              : null);

          const startDate = parseTimeToDate(startStr);
          if (startDate) {
            const now = new Date();
            let diffSec = Math.floor((now.getTime() - startDate.getTime()) / 1000);
            if (diffSec < 0) diffSec += 24 * 3600;
            const h = Math.floor(diffSec / 3600);
            const m = Math.floor((diffSec % 3600) / 60);
            const s = diffSec % 60;
            if (h > 0) {
              setBreakElapsedTimer(`${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
            } else {
              setBreakElapsedTimer(`${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
            }
          } else {
            setBreakElapsedTimer('00m 01s');
          }
        } catch {
          setBreakElapsedTimer('On Break');
        }
      };

      updateBreakTimer();
      interval = setInterval(updateBreakTimer, 1000);
    } else {
      setBreakElapsedTimer('00:00:00');
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [breakStatus.isOnBreak, breakStatus.currentBreakStart, breakStatus.breakStarts]);

  const handleBreakAction = async () => {
    if (!empCode) return;
    const isStarting = !breakStatus.isOnBreak;
    const targetAction = isStarting ? 'BREAK_START' : 'BREAK_END';
    const actionTitle = isStarting ? 'Start Break' : 'End Break';
    const actionPrompt = isStarting
      ? 'Do you want to start your break now?'
      : 'Do you want to end your break and resume work?';

    setAlertConfig({
      visible: true,
      type: 'info',
      title: actionTitle,
      message: actionPrompt,
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
        },
        {
          text: isStarting ? 'Start Break' : 'End Break',
          style: 'default',
          onPress: async () => {
            setAlertConfig((prev) => ({ ...prev, visible: false }));
            setBreakLoading(true);
            try {
              const targetCompCode = String(currentUser?.companyId || (currentUser as any)?.scope?.comp_code || '').trim();
              const res = await staffApi.recordBreak(empCode, targetAction, targetCompCode);
              if (res.success && res.data && res.data.status === 'ok') {
                const bData = res.data;
                const now = new Date();
                const nowTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

                // Instant Optimistic State: Guarantee immediate UI render without waiting or refreshing
                const newIsOnBreak = isStarting;
                const newStartTime = isStarting
                  ? (bData.current_break_start || (bData as any).start_time || (bData as any).break_start_time || (bData as any).time || nowTimeStr)
                  : null;
                const newBreakNo = isStarting
                  ? (bData.current_break_no || (bData as any).break_no || ((breakStatus.currentBreakNo || 0) + 1))
                  : null;

                setBreakStatus((prev) => ({
                  isOnBreak: newIsOnBreak,
                  currentBreakNo: newBreakNo,
                  currentBreakStart: newStartTime,
                  breakStarts: Array.isArray(bData.break_start) && bData.break_start.length > 0
                    ? bData.break_start
                    : isStarting
                    ? [...prev.breakStarts, { break_no: newBreakNo || 1, start_time: newStartTime || nowTimeStr }]
                    : prev.breakStarts,
                  breakEnds: Array.isArray(bData.break_end) && bData.break_end.length > 0
                    ? bData.break_end
                    : !isStarting
                    ? [...prev.breakEnds, { break_no: prev.currentBreakNo || 1, end_time: nowTimeStr }]
                    : prev.breakEnds,
                }));

                // Immediately sync live database status in background without blocking UI
                fetchLiveBreakStatus().catch(() => {});
                fetchDashboardData().catch(() => {});

                setAlertConfig({
                  visible: true,
                  type: 'success',
                  title: isStarting ? 'Break Started' : 'Break Ended',
                  message: bData.message || (isStarting ? 'Your break has started.' : 'Your break has ended.'),
                  buttons: [
                    {
                      text: 'OK',
                      style: 'default',
                      onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
                    },
                  ],
                });
              } else {
                setAlertConfig({
                  visible: true,
                  type: 'danger',
                  title: 'Break Action Failed',
                  message: res.data?.message || res.error || 'Unable to update break status.',
                  buttons: [
                    {
                      text: 'OK',
                      style: 'default',
                      onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
                    },
                  ],
                });
              }
            } catch (err: any) {
              setAlertConfig({
                visible: true,
                type: 'danger',
                title: 'Error',
                message: err.message || 'Network error while recording break.',
                buttons: [
                  {
                    text: 'OK',
                    style: 'default',
                    onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
                  },
                ],
              });
            } finally {
              setBreakLoading(false);
            }
          },
        },
      ],
    });
  };

  const formatTime12h = (timeStr?: string) => {
    if (!timeStr) return '--:--';
    const parts = String(timeStr).trim().split(':');
    if (parts.length < 2) return timeStr;
    let hh = parseInt(parts[0], 10);
    const mm = parts[1];
    const ampm = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12 || 12;
    return `${String(hh).padStart(2, '0')}:${mm} ${ampm}`;
  };

  const formatBreakDuration = (startStr?: string, endStr?: string) => {
    if (!startStr || !endStr) return '';
    try {
      const [sH, sM, sS] = startStr.split(':').map((x) => parseInt(x, 10) || 0);
      const [eH, eM, eS] = endStr.split(':').map((x) => parseInt(x, 10) || 0);
      let diffSec = (eH * 3600 + eM * 60 + eS) - (sH * 3600 + sM * 60 + sS);
      if (diffSec < 0) diffSec += 24 * 3600;
      const m = Math.floor(diffSec / 60);
      const s = diffSec % 60;
      if (m >= 60) {
        const h = Math.floor(m / 60);
        const remM = m % 60;
        return `${h}h ${remM}m`;
      }
      if (m > 0) return `${m}m ${s > 0 ? `${s}s` : ''}`.trim();
      return `${s}s`;
    } catch {
      return '';
    }
  };

  const completedBreaks = useMemo(() => {
    const ends = breakStatus.breakEnds || [];
    const starts = breakStatus.breakStarts || [];
    return ends.map((endItem) => {
      const startItem = starts.find((s) => s.break_no === endItem.break_no);
      const durationText = formatBreakDuration(startItem?.start_time, endItem.end_time);
      return {
        break_no: endItem.break_no,
        startTime: startItem?.start_time,
        endTime: endItem.end_time,
        formattedStart: formatTime12h(startItem?.start_time),
        formattedEnd: formatTime12h(endItem.end_time),
        durationText,
      };
    });
  }, [breakStatus.breakStarts, breakStatus.breakEnds]);

  const totalBreakDurationMinutes = useMemo(() => {
    let totalSec = 0;
    const ends = breakStatus.breakEnds || [];
    const starts = breakStatus.breakStarts || [];
    ends.forEach((endItem) => {
      const startItem = starts.find((s) => s.break_no === endItem.break_no);
      if (startItem?.start_time && endItem?.end_time) {
        try {
          const [sH, sM, sS] = startItem.start_time.split(':').map((x) => parseInt(x, 10) || 0);
          const [eH, eM, eS] = endItem.end_time.split(':').map((x) => parseInt(x, 10) || 0);
          let diff = (eH * 3600 + eM * 60 + eS) - (sH * 3600 + sM * 60 + sS);
          if (diff < 0) diff += 24 * 3600;
          totalSec += diff;
        } catch {}
      }
    });
    return Math.round(totalSec / 60);
  }, [breakStatus.breakStarts, breakStatus.breakEnds]);

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
    currentUser?.companyName ||
    (currentUser as any)?.scope?.company_name ||
    (currentUser as any)?.scope?.comp_name ||
    currentCompany?.name ||
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
      getSubtitle: () => {
        if (adminTodayWorkPhotosCount !== null && adminTodayWorkPhotosCount > 0) {
          return `${adminTodayWorkPhotosCount} Today`;
        }
        return 'Upload';
      },
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
      getSubtitle: () => {
        const cached = documentVerifyCache.records;
        if (cached && cached.length > 0) {
          const pending = cached.filter((d: any) => (d.reject ?? 0) === 0).length;
          return pending > 0 ? `${pending} Pending KYC` : `${cached.length} Docs Total`;
        }
        return 'Review KYC Docs';
      },
      icon: 'id-card',
      bgColor: '#FEF3C7',
      iconColor: '#D97706',
      badgeColor: '#B45309',
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
      getSubtitle: (d) => {
        if (adminTodayPunchedCount !== null) {
          return `${adminTodayPunchedCount} Punched Today`;
        }
        return 'Today Live Punches';
      },
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
      getSubtitle: () => {
        if (adminTodayWorkPhotosCount !== null) {
          return `${adminTodayWorkPhotosCount} Proofs Today`;
        }
        return 'Daily Proofs';
      },
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
            <View style={[styles.avatarCircle, { backgroundColor: brandColor, overflow: 'hidden' }]}>
              {currentUser?.avatarUrl && apiClient.getImageSource(currentUser.avatarUrl) ? (
                <Image
                  source={apiClient.getImageSource(currentUser.avatarUrl)!}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarInitials}>
                  {employeeName.substring(0, 2).toUpperCase()}
                </Text>
              )}
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
                onPress={() => {
                  console.log('[Dashboard] 🔘 KPI Tile Clicked: "Total Units" -> Navigating to: SiteUnits');
                  navigate('SiteUnits');
                }}
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
          <View style={styles.compactPunchCard}>
            <TouchableOpacity
              style={styles.punchCardHeaderRow}
              activeOpacity={0.8}
              onPress={() => navigate('GeofencePunch')}
            >
              <View style={styles.punchHeaderLeft}>
                <View style={styles.punchIconCircle}>
                  <AppIcon name="fingerprint" size={20} color="#0D9488" />
                </View>
                <View style={{ flex: 1, marginRight: ms(6) }}>
                  <View style={styles.punchCardTitleRow}>
                    <Text
                      style={styles.punchCardTitle}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      Shift Attendance
                    </Text>
                  </View>
                  <Text
                    style={styles.punchCardSubtitle}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    {punchInfo.distanceText}
                  </Text>
                </View>
              </View>

              <View style={styles.punchHeaderRight}>
                <View
                  style={[
                    styles.punchStatusPill,
                    {
                      backgroundColor: breakStatus.isOnBreak ? '#FEF3C7' : punchInfo.statusBg,
                      borderColor: breakStatus.isOnBreak ? '#FDE68A' : punchInfo.statusBorder,
                    },
                  ]}
                >
                  <AppIcon
                    name={breakStatus.isOnBreak ? 'coffee' : (punchInfo.statusIcon as any)}
                    size={11}
                    color={breakStatus.isOnBreak ? '#D97706' : punchInfo.statusColor}
                  />
                  <Text
                    style={[
                      styles.punchStatusPillText,
                      { color: breakStatus.isOnBreak ? '#D97706' : punchInfo.statusColor },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    {breakStatus.isOnBreak ? 'ON BREAK' : punchInfo.statusLabel}
                  </Text>
                </View>

                <View style={styles.liveClockBadge}>
                  <AppIcon name="clock" size={10} color={breakStatus.isOnBreak ? '#D97706' : '#0D9488'} />
                  <Text
                    style={[styles.liveClockText, breakStatus.isOnBreak && { color: '#D97706' }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    {breakStatus.isOnBreak ? breakElapsedTimer : workingHoursTimer}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Active Break Banner */}
            {breakStatus.isOnBreak && (
              <View style={styles.breakActiveBanner}>
                <View style={styles.breakBannerLeft}>
                  <View style={styles.breakCupCircle}>
                    <AppIcon name="coffee" size={14} color="#D97706" />
                  </View>
                  <View style={{ flex: 1, marginRight: ms(6) }}>
                    <Text
                      style={styles.breakBannerTitle}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      Break #{breakStatus.currentBreakNo || 1} in Progress
                    </Text>
                    <Text
                      style={styles.breakBannerSub}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      Started at {breakStatus.currentBreakStart ? formatTime12h(breakStatus.currentBreakStart) : 'Recently'} • {breakElapsedTimer}
                    </Text>
                  </View>
                </View>
                <View style={styles.breakPulsePill}>
                  <View style={styles.breakPulseDot} />
                  <Text
                    style={styles.breakPulseText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    ACTIVE
                  </Text>
                </View>
              </View>
            )}

            {/* Timings */}
            <View style={styles.timingSection}>
              <View style={styles.timeRecordRow}>
                <View style={styles.timeRecordLabelWrap}>
                  <View style={[styles.timeDot, { backgroundColor: '#10B981' }]} />
                  <Text
                    style={styles.timeRecordLabel}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    IN TIME
                  </Text>
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
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    {punchInfo.inTime}
                  </Text>
                </View>
              </View>

              <View style={styles.timeDivider} />

              <View style={styles.timeRecordRow}>
                <View style={styles.timeRecordLabelWrap}>
                  <View style={[styles.timeDot, { backgroundColor: '#EF4444' }]} />
                  <Text
                    style={styles.timeRecordLabel}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    OUT TIME
                  </Text>
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
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    {punchInfo.outTime}
                  </Text>
                </View>
              </View>

              {/* Total Breaks Row in Timing Section */}
              {completedBreaks.length > 0 && (
                <>
                  <View style={styles.timeDivider} />
                  <View style={styles.timeRecordRow}>
                    <View style={styles.timeRecordLabelWrap}>
                      <View style={[styles.timeDot, { backgroundColor: '#F59E0B' }]} />
                      <Text
                        style={styles.timeRecordLabel}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                      >
                        TOTAL BREAKS
                      </Text>
                    </View>
                    <View style={styles.timeValueWrap}>
                      <View
                        style={[styles.timeBadgeIcon, { backgroundColor: '#FEF3C7' }]}
                      >
                        <AppIcon name="coffee" size={13} color="#D97706" />
                      </View>
                      <Text
                        style={[
                          styles.timeRecordValue,
                          styles.timeRecordValueActive,
                          { color: '#B45309' },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                      >
                        {completedBreaks.length} {completedBreaks.length === 1 ? 'Break' : 'Breaks'}
                        {totalBreakDurationMinutes > 0 ? ` (${totalBreakDurationMinutes}m)` : ''}
                      </Text>
                    </View>
                  </View>
                </>
              )}

              {punchInfo.isPunchedOut && (
                <>
                  <View style={styles.timeDivider} />
                  <View style={styles.timeRecordRow}>
                    <View style={styles.timeRecordLabelWrap}>
                      <View style={[styles.timeDot, { backgroundColor: punchInfo.statusColor }]} />
                      <Text
                        style={styles.timeRecordLabel}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                      >
                        TOTAL WORKED
                      </Text>
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
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                      >
                        {punchInfo.durationText}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Completed Breaks Detailed Breakdown (Visible after break ends) */}
            {completedBreaks.length > 0 && (
              <View style={styles.completedBreaksContainer}>
                <View style={styles.completedBreaksHeader}>
                  <View style={styles.completedBreaksHeaderLeft}>
                    <View style={styles.breakHistoryIconCircle}>
                      <AppIcon name="coffee" size={13} color="#D97706" />
                    </View>
                    <Text
                      style={styles.completedBreaksTitle}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      Total Break Count: {completedBreaks.length}
                    </Text>
                  </View>
                  {totalBreakDurationMinutes > 0 && (
                    <View style={styles.totalBreakDurationBadge}>
                      <Text
                        style={styles.totalBreakDurationText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                      >
                        {totalBreakDurationMinutes}m total
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.breaksList}>
                  {completedBreaks.map((b) => (
                    <View key={b.break_no} style={styles.breakRowItem}>
                      <View style={styles.breakItemLeft}>
                        <View style={styles.breakItemDot} />
                        <Text
                          style={styles.breakItemLabel}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.85}
                        >
                          Break #{b.break_no}
                        </Text>
                      </View>
                      <View style={styles.breakItemRight}>
                        <Text
                          style={styles.breakItemTime}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.85}
                        >
                          {b.formattedStart} - {b.formattedEnd}
                        </Text>
                        {b.durationText ? (
                          <Text
                            style={styles.breakItemDuration}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.85}
                          >
                            {b.durationText}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Action Buttons: Dual Action when Duty is Active, Single Action otherwise */}
            {punchInfo.isDutyActive ? (
              <View style={styles.punchActionBtnRow}>
                {/* Break Start / End Button */}
                <TouchableOpacity
                  style={[
                    styles.breakActionBtn,
                    breakStatus.isOnBreak ? styles.breakEndBtn : styles.breakStartBtn,
                  ]}
                  activeOpacity={0.85}
                  onPress={handleBreakAction}
                  disabled={breakLoading}
                >
                  {breakLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <View style={styles.breakActionIconWrap}>
                        <AppIcon
                          name={breakStatus.isOnBreak ? 'play' : 'coffee'}
                          size={13}
                          color="#FFFFFF"
                        />
                      </View>
                      <Text
                        style={styles.breakActionBtnText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                      >
                        {breakStatus.isOnBreak ? 'End Break' : 'Start Break'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Mark Shift OUT Button */}
                <TouchableOpacity
                  style={[styles.shiftPunchBtn, { backgroundColor: '#EF4444' }]}
                  activeOpacity={0.88}
                  onPress={() => {
                    if (breakStatus.isOnBreak) {
                      setAlertConfig({
                        visible: true,
                        type: 'warning',
                        title: 'Active Break in Progress',
                        message: 'You are currently on break. Please end your break before punching out.',
                        buttons: [
                          {
                            text: 'End Break Now',
                            style: 'default',
                            onPress: () => {
                              setAlertConfig((prev) => ({ ...prev, visible: false }));
                              handleBreakAction();
                            },
                          },
                          {
                            text: 'Cancel',
                            style: 'cancel',
                            onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
                          },
                        ],
                      });
                      return;
                    }
                    navigate('GeofencePunch');
                  }}
                >
                  <View style={styles.shiftPunchIconWrap}>
                    <AppIcon name="fingerprint" size={14} color="#FFFFFF" />
                  </View>
                  <Text
                    style={styles.shiftPunchBtnText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    Shift OUT
                  </Text>
                </TouchableOpacity>
              </View>
            ) : punchInfo.isPunchedOut ? (
              <TouchableOpacity
                style={[styles.heroPunchBtn, { backgroundColor: '#64748B' }]}
                activeOpacity={0.88}
                onPress={() => navigate('GeofencePunch')}
              >
                <View style={styles.heroPunchBtnInner}>
                  <View style={styles.heroPunchIconCircle}>
                    <AppIcon name="fingerprint" size={18} color="#FFFFFF" />
                  </View>
                  <Text
                    style={styles.heroPunchBtnText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    View / Re-punch
                  </Text>
                </View>
                <View style={styles.heroPunchArrowCircle}>
                  <AppIcon name="chevronRight" size={14} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.heroPunchBtn, { backgroundColor: brandColor }]}
                activeOpacity={0.88}
                onPress={() => navigate('GeofencePunch')}
              >
                <View style={styles.heroPunchBtnInner}>
                  <View style={styles.heroPunchIconCircle}>
                    <AppIcon name="fingerprint" size={18} color="#FFFFFF" />
                  </View>
                  <Text
                    style={styles.heroPunchBtnText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    Mark Shift IN
                  </Text>
                </View>
                <View style={styles.heroPunchArrowCircle}>
                  <AppIcon name="chevronRight" size={14} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            )}
          </View>
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
                onPress={() => {
                  console.log(`[Dashboard] 🔘 Feature Card Clicked: "${card.title}" (${card.id}) -> Navigating to: ${card.targetScreen}`);
                  navigate(card.targetScreen);
                }}
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
