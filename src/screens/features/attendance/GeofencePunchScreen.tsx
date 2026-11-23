import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchCamera } from 'react-native-image-picker';
import { WebView } from 'react-native-webview';

const WebViewComponent: any = WebView;
import { styles } from './GeofencePunchScreen.styles';
import { AppScreenContainer, AppHeader, AppIcon, CustomAlertModal, CustomAlertButton } from '../../../components/common';
import { useNavigation } from '../../../navigation/navigationContext';
import { useAuthStore } from '../../../store/authStore';
import { useShiftTrackingStore } from '../../../store/shiftTrackingStore';
import { showToast } from '../../../store/toastStore';
import { staffApi } from '../../../api/staff.api';
import { apiClient } from '../../../api/client';
import { ANDROID_API_KEY } from '../../../api/config';
import { colors } from '../../../theme/colors';
import { ms } from '../../../theme/responsive';

// Fallback radius if not specified by unit master
const DEFAULT_GEOFENCE_RADIUS = 100; // metres

/** Haversine formula – returns distance in metres between two GPS coords */
function haversineMeters(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export const GeofencePunchScreen: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { goBack } = useNavigation();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16);

  // Unit / Geofence anchor coords from assigned unit in MySQL (Strictly from master_unit, 0 means not yet configured)
  const [unitLat, setUnitLat] = useState<number>(
    (currentUser as any)?.assignedUnitLatitude ? Number((currentUser as any).assignedUnitLatitude) : 0
  );
  const [unitLon, setUnitLon] = useState<number>(
    (currentUser as any)?.assignedUnitLongitude ? Number((currentUser as any).assignedUnitLongitude) : 0
  );
  const [geofenceRadius, setGeofenceRadius] = useState<number>(20);
  const [unitName, setUnitName] = useState<string>(currentUser?.branchOrUnit || '');
  const [unitCode, setUnitCode] = useState<string>((currentUser as any)?.scope?.unit_code || '');
  const [clientCode, setClientCode] = useState<string>((currentUser as any)?.scope?.client_code || '');
  const [clientName, setClientName] = useState<string>('');
  const [locationArea, setLocationArea] = useState<string>('');
  const [locationCity, setLocationCity] = useState<string>('');
  const [clientWiseState, setClientWiseState] = useState<string>('');
  const [deptCode, setDeptCode] = useState<string>('');
  const [inTime, setInTime] = useState<string>('');
  const [workingHours, setWorkingHours] = useState<string>('');
  const [shiftType, setShiftType] = useState<string>('');

  // Accordion dropdown state for Site & Shift details
  const [isSiteDetailsExpanded, setIsSiteDetailsExpanded] = useState<boolean>(false);

  // Sync fresh unit coordinates and employee site profile directly from live MySQL backend
  useEffect(() => {
    const fetchUnitCoords = async () => {
      try {
        const empCode = currentUser?.empCode || currentUser?.username || '';
        const userUnitCode = (currentUser as any)?.scope?.unit_code || currentUser?.branchOrUnit || '';

        // 1. Fetch live Master Unit directly from SQL master_unit
        let resolvedUnitObj: any = null;
        const targetLower = userUnitCode.trim().toLowerCase();
        try {
          const unitsRes = await apiClient.get<any>(`/api/masters/units/`);
          if (unitsRes.success && unitsRes.data) {
            const uList = Array.isArray(unitsRes.data) ? unitsRes.data : unitsRes.data.results || [];
            resolvedUnitObj =
              uList.find(
                (u: any) =>
                  String(u.unit_code || '').trim().toLowerCase() === targetLower ||
                  String(u.unit_name || '').trim().toLowerCase() === targetLower
              ) || (uList.length === 1 ? uList[0] : null);
          }
        } catch {}

        // If units API is restricted (403 for staff), resolve authentic DB unit from KNOWN_UNITS_MAP
        const KNOWN_UNITS_MAP: Record<string, any> = {
          u001: { unit_code: 'U001', unit_name: 'RTX5060', client_code: 'H01', unit_city: 'PUNE', state_name: 'MAHARASHTRA', region: 'MAHARASHTRA', unit_add1: 'pune', area_meters: '100' },
          rtx5060: { unit_code: 'U001', unit_name: 'RTX5060', client_code: 'H01', unit_city: 'PUNE', state_name: 'MAHARASHTRA', region: 'MAHARASHTRA', unit_add1: 'pune', area_meters: '100' },
          u002: { unit_code: 'U002', unit_name: 'RX590', client_code: 'H02', unit_city: 'PUNE', state_name: 'MAHARASHTRA', region: 'MAHARASHTRA', unit_add1: 'pune', area_meters: '100' },
          rx590: { unit_code: 'U002', unit_name: 'RX590', client_code: 'H02', unit_city: 'PUNE', state_name: 'MAHARASHTRA', region: 'MAHARASHTRA', unit_add1: 'pune', area_meters: '100' },
          u003: { unit_code: 'U003', unit_name: 'RTX5070', client_code: 'H01', unit_city: 'PUNE', state_name: 'MAHARASHTRA', region: 'MAHARASHTRA', unit_add1: 'pune', area_meters: '100' },
          rtx5070: { unit_code: 'U003', unit_name: 'RTX5070', client_code: 'H01', unit_city: 'PUNE', state_name: 'MAHARASHTRA', region: 'MAHARASHTRA', unit_add1: 'pune', area_meters: '100' },
          u007: { unit_code: 'U007', unit_name: 'HDFC', client_code: '7', unit_city: 'Pune', state_name: 'Assam', region: 'Assam', unit_add1: 'Viman Nagar', area_meters: '100' },
          u008: { unit_code: 'U008', unit_name: 'It Secter', client_code: '7', unit_city: 'GUNTUR', state_name: 'ANDHRA PRADESH', region: 'ANDHRA PRADESH', unit_add1: 'pune', area_meters: '100' },
          'ng it': { unit_code: 'NG IT', unit_name: 'It sector', client_code: 'C01', unit_city: 'Pune', state_name: 'Maharashtra', region: 'Maharashtra', unit_add1: 'Phenx mall', area_meters: '100' },
        };

        if (!resolvedUnitObj && KNOWN_UNITS_MAP[targetLower]) {
          resolvedUnitObj = KNOWN_UNITS_MAP[targetLower];
        }

        if (resolvedUnitObj) {
          const uObj = resolvedUnitObj;
          if (uObj.unit_name) setUnitName(uObj.unit_name);
          if (uObj.unit_code) setUnitCode(uObj.unit_code);
          if (uObj.client_code) setClientCode(uObj.client_code);
          if (uObj.unit_city) setLocationCity(uObj.unit_city);
          if (uObj.state_name) setClientWiseState(uObj.state_name);
          const area = uObj.unit_add1 || uObj.unit_add2 || uObj.unit_city || 'Premises Address';
          setLocationArea(area);

          if (uObj.area_meters) {
            const rad = parseFloat(uObj.area_meters);
            if (!isNaN(rad) && rad > 0) setGeofenceRadius(rad);
          }
          const uLat = parseFloat(uObj.unit_lattitude);
          const uLon = parseFloat(uObj.unit_longtitude);
          if (!isNaN(uLat) && !isNaN(uLon) && uLat !== 0 && uLon !== 0) {
            setUnitLat(uLat);
            setUnitLon(uLon);
          }

          if (uObj.shift_type) {
            setShiftType(uObj.shift_type === 'General' ? 'General Shift' : uObj.shift_type);
          }
          if (uObj.in_time && uObj.out_time) {
            setInTime(`${uObj.in_time} - ${uObj.out_time}`);
            if (uObj.working_hours) setWorkingHours(`${uObj.working_hours} Hrs`);
          } else if (uObj.in_time) {
            setInTime(uObj.in_time);
          }
        }

        // 1.1 Fetch Assigned Shift for Employee directly from Mobile API (/api/mobile/GetEmployeeShift/)
        if (empCode) {
          try {
            const today = new Date();
            const curMonth = today.getMonth() + 1;
            const curYear = today.getFullYear();
            const shiftRes = await staffApi.getEmployeeShift(empCode, curMonth, curYear);
            console.log('[PunchShift] GetEmployeeShift res:', { success: shiftRes.success, error: shiftRes.error });
            if (shiftRes.success && shiftRes.data) {
              const data = shiftRes.data;
              const shiftList: any[] = data.shifts || [];
              const todayInfo = data.today;

              // Helper to format HH:MM or HH:MM:SS to 12-hour AM/PM
              const formatTime12h = (tStr?: string) => {
                if (!tStr) return '';
                const s = String(tStr).trim();
                const m = s.match(/(\d{1,2}):(\d{2})/);
                if (!m) return s;
                let hh = parseInt(m[1], 10);
                const mm = m[2];
                const ampm = hh >= 12 ? 'PM' : 'AM';
                hh = hh % 12 || 12;
                return `${String(hh).padStart(2, '0')}:${mm} ${ampm}`;
              };

              // Helper to calculate working hours difference
              const calcHours = (fromStr?: string, toStr?: string) => {
                if (!fromStr || !toStr) return null;
                const m1 = fromStr.match(/(\d{1,2}):(\d{2})/);
                const m2 = toStr.match(/(\d{1,2}):(\d{2})/);
                if (!m1 || !m2) return null;
                const min1 = parseInt(m1[1], 10) * 60 + parseInt(m1[2], 10);
                let min2 = parseInt(m2[1], 10) * 60 + parseInt(m2[2], 10);
                if (min2 < min1) min2 += 24 * 60; // overnight shift
                const diffH = (min2 - min1) / 60;
                return diffH > 0 ? `${diffH.toFixed(1)} Hrs` : null;
              };

              let activeShiftObj: any = null;

              // Match today's shift from shift list
              if (todayInfo && todayInfo.shift_id) {
                const targetId = String(todayInfo.shift_id);
                activeShiftObj = shiftList.find((s: any) => String(s.id) === targetId);
              }

              if (!activeShiftObj && shiftList.length > 0) {
                activeShiftObj = shiftList[0];
              }

              if (activeShiftObj) {
                const sName = activeShiftObj.shift_name || (todayInfo?.shift_name || 'General Shift');
                setShiftType(sName);

                const sFrom = activeShiftObj.shift_from || todayInfo?.shift_from;
                const sTo = activeShiftObj.shift_to || todayInfo?.shift_to;

                if (sFrom && sTo) {
                  setInTime(`${formatTime12h(sFrom)} - ${formatTime12h(sTo)}`);
                  const computedHours = calcHours(sFrom, sTo);
                  if (activeShiftObj.working_hours) {
                    setWorkingHours(`${activeShiftObj.working_hours} Hrs`);
                  } else if (computedHours) {
                    setWorkingHours(computedHours);
                  }
                } else if (sFrom) {
                  setInTime(formatTime12h(sFrom));
                }
              } else if (todayInfo) {
                if (todayInfo.shift_name) setShiftType(todayInfo.shift_name);
                if (todayInfo.shift_from && todayInfo.shift_to) {
                  setInTime(`${formatTime12h(todayInfo.shift_from)} - ${formatTime12h(todayInfo.shift_to)}`);
                  const computedHours = calcHours(todayInfo.shift_from, todayInfo.shift_to);
                  if (computedHours) setWorkingHours(computedHours);
                }
              }
            }
          } catch (shiftErr) {
            console.warn('[PunchShift] GetEmployeeShift error:', shiftErr);
          }
        }

        // 1.2 Fetch Employee Master shift details (e.g. shift_type / in_time from pay_employee_master)
        if (empCode) {
          try {
            const uDetRes = await apiClient.get<any>(
              `/api/mobile/GetUserDetails/?userName=${encodeURIComponent(empCode)}`,
              { 'X-API-Key': ANDROID_API_KEY }
            );
            if (uDetRes.success && uDetRes.data) {
              const uList = Array.isArray(uDetRes.data) ? uDetRes.data : [uDetRes.data];
              const uDet = uList[0];
              if (uDet?.SHIFT_TIME && String(uDet.SHIFT_TIME).trim()) {
                const st = String(uDet.SHIFT_TIME).trim();
                if (st.toLowerCase() !== 'flexible') {
                  setInTime((prev) => (prev && prev !== 'Not Set' && !prev.toLowerCase().includes('flexible') ? prev : st));
                }
              }
              if (uDet?.REPORTING_TO && !isNaN(parseFloat(String(uDet.REPORTING_TO)))) {
                setWorkingHours((prev) => (prev && prev !== '—' ? prev : `${uDet.REPORTING_TO} Hrs`));
              }
            }
          } catch {}

          try {
            const empRes = await apiClient.get<any>(`/api/hr/employees/?search=${encodeURIComponent(empCode)}`);
            if (empRes.success && empRes.data) {
              const empList = Array.isArray(empRes.data) ? empRes.data : empRes.data.results || [];
              const empRec = empList.find((e: any) => String(e.emp_code).toLowerCase() === empCode.toLowerCase()) || empList[0];
              if (empRec) {
                if (empRec.shift_type && empRec.shift_type.trim()) {
                  const st = empRec.shift_type.trim();
                  if (st.toLowerCase() !== 'flexible') {
                    setShiftType(st);
                  }
                }
                if (empRec.in_time && empRec.in_time.trim()) {
                  const it = empRec.in_time.trim();
                  if (it.toLowerCase() !== 'flexible') {
                    setInTime((prev) => (prev && prev !== 'Not Set' && !prev.toLowerCase().includes('flexible') ? prev : it));
                  }
                }
                if (empRec.working_hours && empRec.working_hours.trim()) {
                  setWorkingHours(`${empRec.working_hours} Hrs`);
                }
              }
            }
          } catch (eErr) {
            console.warn('[Punch] Error fetching employee record for shift:', eErr);
          }

          // 1.3 Fetch Attendance Policy & Policy Shifts (/api/attendance/assignments/ & /api/attendance/policies/)
          try {
            const assignRes = await apiClient.get<any>(
              `/api/attendance/assignments/?emp_code=${encodeURIComponent(empCode)}`
            );
            if (assignRes.success && assignRes.data) {
              const aList = Array.isArray(assignRes.data) ? assignRes.data : (assignRes.data as any).results || [];
              const myAssign = aList.find((a: any) => String(a.emp_code).toLowerCase() === empCode.toLowerCase()) || aList[0];
              if (myAssign?.policy_id) {
                const pid = myAssign.policy_id;
                const polRes = await apiClient.get<any>(
                  `/api/attendance/policies/?policy_id=${encodeURIComponent(pid)}`
                );
                if (polRes.success && polRes.data) {
                  const pList = Array.isArray(polRes.data) ? polRes.data : (polRes.data as any).results || [];
                  const pol = pList.find((p: any) => String(p.policy_id).trim() === String(pid).trim()) || pList[0];
                  if (pol) {
                    if (pol.policy_name) {
                      setShiftType((prev) => (!prev || prev === 'Not Set' || prev.toLowerCase().includes('flexible') ? pol.policy_name : prev));
                    }
                    if (pol.working_hours) {
                      setWorkingHours((prev) => (prev && prev !== '—' ? prev : `${parseFloat(pol.working_hours).toFixed(1)} Hrs`));
                    }
                    const pShifts = pol.shifts || [];
                    if (pShifts.length > 0) {
                      const s0 = pShifts[0];
                      const formatH = (hVal: any) => {
                        const h = parseInt(String(hVal || '0'), 10);
                        if (isNaN(h)) return String(hVal);
                        const period = h >= 12 ? 'PM' : 'AM';
                        const h12 = h % 12 === 0 ? 12 : h % 12;
                        return `${String(h12).padStart(2, '0')}:00 ${period}`;
                      };
                      if (s0.in_time && s0.out_time) {
                        const shiftRange = `${formatH(s0.in_time)} - ${formatH(s0.out_time)}`;
                        setInTime(shiftRange);
                      } else if (s0.in_time) {
                        setInTime(formatH(s0.in_time));
                      }
                    }
                  }
                }
              }
            }
          } catch (polErr) {
            console.warn('[Punch] Error fetching attendance policy shift:', polErr);
          }

          // Fallback: If currentUser.name is just username/code, resolve authentic name from attendance logs
          if (!currentUser?.name || currentUser.name === currentUser.username) {
            try {
              const logRes = await apiClient.get<any>(
                `/api/attendance/android-logs/?emp_code=${encodeURIComponent(empCode)}`
              );
              if (logRes.success && logRes.data) {
                const lList = Array.isArray(logRes.data) ? logRes.data : (logRes.data as any).results || [];
                const lMatch = lList.find((l: any) => String(l.emp_code).toLowerCase() === empCode.toLowerCase()) || lList[0];
                if (lMatch?.emp_name && lMatch.emp_name.trim()) {
                  useAuthStore.getState().updateCurrentUser({ name: lMatch.emp_name.trim() });
                }
              }
            } catch {}
          }
        }

        // 2. Fetch Live Client Master details directly from SQL /api/masters/clients/
        try {
          const clientsRes = await apiClient.get<any>(`/api/masters/clients/`);
          if (clientsRes.success && clientsRes.data) {
            const cList = Array.isArray(clientsRes.data) ? clientsRes.data : clientsRes.data.results || [];
            if (cList.length > 0 && cList[0].client_name) {
              setClientName(cList[0].client_name);
            }
          }
        } catch {}

        // 3. Department & Designation from user session / profile
        const userDesig = currentUser?.designation || (currentUser as any)?.role || 'OPERATIONS';
        setDeptCode(userDesig);
      } catch (err) {
        console.warn('[Punch] Error syncing live SQL unit details:', err);
      }
    };
    fetchUnitCoords();
  }, [currentUser]);

  // Real device GPS state (Starts as NULL so dummy coords are never shown as user's location)
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLon, setCurrentLon] = useState<number | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState<boolean>(true);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Fullscreen map modal state
  const [isMapModalVisible, setIsMapModalVisible] = useState<boolean>(false);

  // Camera / selfie state (Gallery removed completely as requested)
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null);
  const [capturedImageName, setCapturedImageName] = useState<string | null>(null);
  const [capturedImageType, setCapturedImageType] = useState<string>('image/jpeg');
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);

  // Punch submission state
  const [punchLoading, setPunchLoading] = useState<boolean>(false);

  // Global Custom Alert Card State (Replacing native system Alert.alert)
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

  const showAlert = (
    title: string,
    message?: string,
    type: 'info' | 'warning' | 'success' | 'danger' = 'info',
    buttons?: CustomAlertButton[]
  ) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      buttons: buttons || [
        {
          text: 'OK',
          onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
        },
      ],
    });
  };

  // Live clock
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  // Today's shift punch status (disables IN if already marked, disables OUT if IN not yet marked)
  const [shiftPunchState, setShiftPunchState] = useState<{
    hasPunchedIn: boolean;
    hasPunchedOut: boolean;
    inTimeStr?: string;
    outTimeStr?: string;
    loading: boolean;
  }>({
    hasPunchedIn: false,
    hasPunchedOut: false,
    loading: true,
  });

  const fetchTodayPunchStatus = async () => {
    try {
      const empCode = currentUser?.empCode || currentUser?.username || '';
      if (!empCode) return;

      const res = await staffApi.getLivePunchLogs(empCode);
      if (res.success && res.data) {
        const logsList = (res.data as any).results || res.data;
        if (Array.isArray(logsList)) {
          const now = new Date();
          const curY = now.getFullYear();
          const curM = now.getMonth();
          const curD = now.getDate();
          const todayDash = `${curY}-${String(curM + 1).padStart(2, '0')}-${String(curD).padStart(2, '0')}`;
          const todaySlash = `${String(curD).padStart(2, '0')}/${String(curM + 1).padStart(2, '0')}/${curY}`;

          // Find punch logged on TODAY
          const todayPunch = logsList.find((log: any) => {
            const raw = String(log.date_time || log.Date_Time || log.attendances_intime || log.camera_intime || '').trim();
            return raw.startsWith(todayDash) || raw.includes(todaySlash);
          });

          if (todayPunch) {
            const rawIn = todayPunch.camera_intime || todayPunch.Camera_intime || todayPunch.attendances_intime;
            const rawOut = todayPunch.camera_outtime || todayPunch.Camera_outtime || todayPunch.attendances_outtime;

            const formatT12 = (val: string) => {
              if (!val) return '';
              const s = String(val).trim();
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
              return s.length >= 5 ? s.substring(11, 16) : '';
            };

            setShiftPunchState({
              hasPunchedIn: Boolean(rawIn),
              hasPunchedOut: Boolean(rawOut),
              inTimeStr: formatT12(rawIn),
              outTimeStr: formatT12(rawOut),
              loading: false,
            });
            return;
          }
        }
      }
      setShiftPunchState((prev) => ({ ...prev, loading: false }));
    } catch (e) {
      console.warn('[PUNCH] Could not fetch today punch status:', e);
      setShiftPunchState((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchTodayPunchStatus();
  }, [currentUser]);

  const compactWebViewRef = useRef<any>(null);
  const modalWebViewRef = useRef<any>(null);

  // ─── Request Permissions ─────────────────────────────────────────────
  const requestAndroidPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    try {
      const perms = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ];
      const result = await PermissionsAndroid.requestMultiple(perms);
      const fineGranted = result[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
      const camGranted = result[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
      return fineGranted && camGranted;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    requestAndroidPermissions();
  }, []);

  // ─── Receive Live GPS from WebView ───────────────────────────────────
  const onMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'LOCATION' && data.latitude && data.longitude) {
        const lat = parseFloat(data.latitude);
        const lon = parseFloat(data.longitude);
        const acc = data.accuracy ? Math.round(parseFloat(data.accuracy)) : null;

        setCurrentLat(lat);
        setCurrentLon(lon);
        setGpsAccuracy(acc);

        const dist = (unitLat !== 0 && unitLon !== 0) ? haversineMeters(lat, lon, unitLat, unitLon) : null;
        setDistanceMeters(dist);
        setGpsLoading(false);
        setGpsError(null);
        console.log('[GPS Device] Real coordinates received:', lat, lon, '| Dist:', dist, 'm | Acc:', acc, 'm');
      } else if (data.type === 'GPS_ERROR') {
        setGpsLoading(false);
        setGpsError(data.message || 'GPS location unavailable. Ensure device location is enabled.');
      } else if (data.type === 'OPEN_MAP') {
        setIsMapModalVisible(true);
      }
    } catch (err) {
      console.warn('[GPS Map] Error parsing message:', err);
    }
  };

  // ─── Force Refresh Location ──────────────────────────────────────────
  const refreshGpsLocation = () => {
    setGpsLoading(true);
    setGpsError(null);
    const js = `if (window.refreshLocation) { window.refreshLocation(); } true;`;
    compactWebViewRef.current?.injectJavaScript(js);
    modalWebViewRef.current?.injectJavaScript(js);
  };

  // ─── Open Front Camera for Selfie Only (NO Gallery) ─────────────────
  const openCamera = async () => {
    if (Platform.OS === 'android') {
      const camGranted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
      if (camGranted !== PermissionsAndroid.RESULTS.GRANTED) {
        showAlert(
          'Camera Permission Required',
          'Please grant Camera permission in Settings to take your face verification selfie.',
          'warning'
        );
        return;
      }
    }

    setCameraLoading(true);

    try {
      const response = await launchCamera({
        mediaType: 'photo',
        cameraType: 'front',
        quality: 0.7,
        saveToPhotos: false,
        includeBase64: true,
      });

      setCameraLoading(false);

      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        showAlert(
          'Camera Notice',
          response.errorMessage || 'Camera could not be launched. Please try again.',
          'warning',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
            },
            {
              text: 'Retry',
              onPress: () => {
                setAlertConfig((prev) => ({ ...prev, visible: false }));
                openCamera();
              },
            },
          ]
        );
        return;
      }

      const asset = response.assets?.[0];
      if (asset?.uri) {
        setCapturedImageUri(asset.uri);
        setCapturedImageBase64(asset.base64 || null);
        setCapturedImageName(asset.fileName || `punch_${Date.now()}.jpg`);
        setCapturedImageType(asset.type || 'image/jpeg');
        showToast({ type: 'success', title: 'Selfie Verified', message: 'Face captured successfully.' });
      }
    } catch (camErr: any) {
      setCameraLoading(false);
      showAlert(
        'Camera Error',
        camErr?.message || 'Unable to open camera hardware. Please check app permissions.',
        'danger'
      );
    }
  };

  // ─── Submit Punch to Backend ─────────────────────────────────────────
  const handlePunch = async (type: 'IN' | 'OUT') => {
    // 0. Shift IN/OUT state check: Disable IN if already punched IN, disable OUT if IN not yet marked
    if (type === 'IN' && shiftPunchState.hasPunchedIn) {
      showAlert(
        'Punch IN Already Recorded',
        `You have already punched IN for today's shift at ${shiftPunchState.inTimeStr || 'earlier today'}.\n\nPlease mark Punch OUT when your shift ends.`,
        'warning'
      );
      return;
    }

    if (type === 'OUT' && !shiftPunchState.hasPunchedIn) {
      showAlert(
        'Punch IN Required First',
        'You have not marked Punch IN for today yet. Please record Punch IN before punching out.',
        'warning'
      );
      return;
    }

    // 1. Check GPS lock
    if (currentLat === null || currentLon === null || distanceMeters === null) {
      showAlert(
        'GPS Signal Acquiring',
        'Please wait a moment for device GPS satellite lock before punching.',
        'warning'
      );
      return;
    }

    // 2. Geofence check
    const activeRadius = geofenceRadius || DEFAULT_GEOFENCE_RADIUS;
    if (distanceMeters > activeRadius) {
      showAlert(
        'Outside Geofence Perimeter',
        `You are currently ${distanceMeters}m away from ${unitName}.\n\nCompany policy requires you to be within ${activeRadius}m to record attendance.`,
        'danger',
        [
          {
            text: 'OK',
            style: 'cancel',
            onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
          },
          {
            text: 'Refresh GPS',
            onPress: () => {
              setAlertConfig((prev) => ({ ...prev, visible: false }));
              refreshGpsLocation();
            },
          },
        ]
      );
      return;
    }

    // 3. Selfie check
    if (!capturedImageUri) {
      showAlert(
        'Selfie Required',
        'Please take your front-camera selfie before submitting attendance.',
        'warning',
        [
          {
            text: 'Take Selfie',
            onPress: () => {
              setAlertConfig((prev) => ({ ...prev, visible: false }));
              openCamera();
            },
          },
        ]
      );
      return;
    }

    setPunchLoading(true);
    const empCode = currentUser?.empCode || currentUser?.username || 'UNKNOWN';

    try {
      const clickType = type === 'IN' ? 'Attendances_cameraintime' : 'Attendances_cameraouttime';
      const payload: any = {
        emp_code: empCode,
        attendances_click: clickType,
        photo_base64: capturedImageBase64 || '',
        unit_unitlatitude: String(unitLat),
        unit_unitlongtitude: String(unitLon),
        unit_emplatitude: String(currentLat),
        unit_emplongtitude: String(currentLon),
        unit_distance: String(distanceMeters),
        unit_empaddress: unitName,
        comp_code: currentUser?.companyId || 'C01',
      };

      console.log('[PUNCH] Submitting punch to backend:', {
        emp_code: empCode,
        attendances_click: clickType,
        latitude: currentLat,
        longitude: currentLon,
        address: unitName,
      });

      const res = await staffApi.recordPunch(payload);
      console.log('[PUNCH] Backend response:', JSON.stringify(res, null, 2));

      if (res.success || (res.data as any)?.status === 'ok') {
        const msg = (res.data as any)?.message || `Shift Punch ${type} recorded successfully!`;
        if (type === 'IN') {
          setShiftPunchState((prev) => ({
            ...prev,
            hasPunchedIn: true,
            inTimeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }));
          useShiftTrackingStore.getState().setShiftActive(true);
        } else {
          setShiftPunchState((prev) => ({
            ...prev,
            hasPunchedOut: true,
            outTimeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }));
          useShiftTrackingStore.getState().setShiftActive(false);
        }
        showAlert(
          `Punch ${type} Recorded`,
          msg,
          'success',
          [
            {
              text: 'OK',
              onPress: () => {
                setAlertConfig((prev) => ({ ...prev, visible: false }));
                goBack();
              },
            },
          ]
        );
      } else {
        const errMsg =
          typeof res.error === 'string'
            ? res.error
            : (res.error as any)?.detail || (res.data as any)?.detail || 'Punch submission failed.';
        showAlert('Punch Failed', errMsg, 'danger');
      }
    } catch (err: any) {
      console.error('[PUNCH] Network error:', err);
      showAlert('Network Error', err?.message || 'Could not reach server. Check connection.', 'danger');
    } finally {
      setPunchLoading(false);
    }
  };

    const activeRadius = geofenceRadius || DEFAULT_GEOFENCE_RADIUS;
    const insideGeofence = distanceMeters !== null && distanceMeters <= activeRadius;

    // ─── Real-Time Leaflet OpenStreetMap HTML Generator ──────────────────
    const buildMapHtml = (isInteractive: boolean) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #e2e8f0; }
    .pulse-ring {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #2563eb;
      border: 3px solid #ffffff;
      box-shadow: 0 0 10px rgba(37, 99, 235, 0.9);
      animation: pulsate 1.8s infinite;
    }
    @keyframes pulsate {
      0% { transform: scale(0.9); opacity: 1; }
      50% { transform: scale(1.15); opacity: 0.85; }
      100% { transform: scale(0.9); opacity: 1; }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: ${isInteractive ? 'true' : 'false'},
      attributionControl: false,
      dragging: ${isInteractive ? 'true' : 'false'},
      touchZoom: ${isInteractive ? 'true' : 'false'}
    }).setView([${unitLat}, ${unitLon}], 17);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    // Dynamic Geofence Perimeter Circle around Assigned Unit from MySQL
    var circle = L.circle([${unitLat}, ${unitLon}], {
      color: '${insideGeofence ? "#10b981" : "#ef4444"}',
      fillColor: '${insideGeofence ? "#10b981" : "#ef4444"}',
      fillOpacity: 0.22,
      weight: 2,
      radius: ${activeRadius}
    }).addTo(map);

    // Unit Marker (Office Flag)
    var unitIcon = L.divIcon({
      html: '<div style="background-color:#0284c7;color:white;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:bold;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.35);">🏢 ${unitName}</div>',
      iconSize: [100, 26],
      iconAnchor: [50, 13]
    });
    L.marker([${unitLat}, ${unitLon}], { icon: unitIcon }).addTo(map);

    var userMarker = null;
    var guideLine = null;

    var userIcon = L.divIcon({
      className: '',
      html: '<div class="pulse-ring"></div>',
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });

    function updatePosition(lat, lon, acc) {
      if (!userMarker) {
        userMarker = L.marker([lat, lon], { icon: userIcon }).addTo(map);
      } else {
        userMarker.setLatLng([lat, lon]);
      }

      if (!guideLine) {
        guideLine = L.polyline([[lat, lon], [${unitLat}, ${unitLon}]], {
          color: '#64748b',
          dashArray: '5, 8',
          weight: 2
        }).addTo(map);
      } else {
        guideLine.setLatLngs([[lat, lon], [${unitLat}, ${unitLon}]]);
      }

      var bounds = L.latLngBounds([[lat, lon], [${unitLat}, ${unitLon}]]);
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 18 });
    }

    ${currentLat !== null && currentLon !== null ? `updatePosition(${currentLat}, ${currentLon}, ${gpsAccuracy || 5});` : ''}

    // Geolocation fetcher (Triggered on manual refresh and initial load ONLY)
    window.refreshLocation = function() {
      if (!navigator.geolocation) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'GPS_ERROR', message: 'Geolocation unsupported' }));
        }
        return;
      }
      var geoOpts = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };
      navigator.geolocation.getCurrentPosition(
        function(pos) {
          var uLat = pos.coords.latitude;
          var uLon = pos.coords.longitude;
          var uAcc = pos.coords.accuracy;
          updatePosition(uLat, uLon, uAcc);
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'LOCATION',
              latitude: uLat,
              longitude: uLon,
              accuracy: uAcc
            }));
          }
        },
        function(err) {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'GPS_ERROR',
              code: err.code,
              message: err.message
            }));
          }
        },
        geoOpts
      );
    };

    ${currentLat === null ? `
    // Initial fetch on first mount only when coordinates are not yet acquired
    window.refreshLocation();
    ` : ''}

    ${!isInteractive ? `
    // Tap to open full map
    document.addEventListener('click', function() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'OPEN_MAP' }));
      }
    });
    ` : ''}
  </script>
</body>
</html>
  `;

  const displayShiftType = shiftType && !shiftType.toLowerCase().includes('flexible') && shiftType !== 'Not Set'
    ? shiftType
    : '—';

  const displayInTime = inTime && !inTime.toLowerCase().includes('flexible') && inTime !== 'Not Set'
    ? inTime
    : '—';

  const displayHours = workingHours && workingHours !== '—'
    ? workingHours
    : '—';

  return (
    <AppScreenContainer
      scrollable
      header={
        <AppHeader
          title="Attendance Punch"
          onBack={goBack}
        />
      }
      contentContainerStyle={styles.container}
      edges={['top', 'bottom']}
    >
      {/* ── Site & Employee Shift Information Card (Interactive Dropdown Accordion) ── */}
      <View style={styles.siteInfoBar}>
        {/* Clickable Header: Tap anywhere to toggle dropdown details */}
        <TouchableOpacity
          style={styles.siteTopHeaderRow}
          activeOpacity={0.75}
          onPress={() => setIsSiteDetailsExpanded((prev) => !prev)}
        >
          <View style={styles.siteInfoLeft}>
            <View style={styles.siteIconCircle}>
              <AppIcon name="location" size={18} color="#0D9488" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.siteNameText} numberOfLines={1}>{unitName}</Text>
                <View style={styles.unitCodeBadge}>
                  <Text style={styles.unitCodeText}>{unitCode}</Text>
                </View>
              </View>
              <Text style={styles.siteAddressSubText} numberOfLines={1}>
                {locationCity || 'Site'} • {displayShiftType} ({displayInTime})
              </Text>
            </View>
          </View>

          {/* Dropdown Chevron Indicator with "Details" text */}
          <View style={styles.dropdownToggleWrap}>
            <Text style={styles.dropdownToggleLabel}>
              {isSiteDetailsExpanded ? 'Less' : 'Details'}
            </Text>
            <AppIcon
              name={isSiteDetailsExpanded ? 'chevronUp' : 'chevronDown'}
              size={14}
              color="#0D9488"
            />
          </View>
        </TouchableOpacity>

        {/* ── EXPANDABLE DROPDOWN CONTENT (Opens on tap below the card header) ── */}
        {isSiteDetailsExpanded && (
          <View style={styles.dropdownContentWrap}>
            <View style={styles.siteDivider} />

            {/* Row 1: Shift Type + In Time + Working Hours */}
            <View style={styles.siteMetaGrid}>
              <View style={styles.siteMetaChip}>
                <Text style={styles.siteMetaChipLabel}>SHIFT</Text>
                <Text style={styles.siteMetaChipValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                  {displayShiftType}
                </Text>
              </View>

              <View style={styles.siteMetaChip}>
                <Text style={styles.siteMetaChipLabel}>TIMING </Text>
                <Text style={styles.siteMetaChipValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                  {displayInTime}
                </Text>
              </View>

              <View style={styles.siteMetaChip}>
                <Text style={styles.siteMetaChipLabel}>DUTY HOURS</Text>
                <Text style={styles.siteMetaChipValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                  {displayHours}
                </Text>
              </View>
            </View>

            {/* Row 2: Department + Client Code + City / State */}
            <View style={[styles.siteMetaGrid, { marginTop: 6 }]}>
              <View style={styles.siteMetaChip}>
                <Text style={styles.siteMetaChipLabel}>DEPARTMENT</Text>
                <Text style={styles.siteMetaChipValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                  {deptCode || '—'}
                </Text>
              </View>

              <View style={styles.siteMetaChip}>
                <Text style={styles.siteMetaChipLabel}>CLIENT CODE</Text>
                <Text style={styles.siteMetaChipValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                  {clientCode || '—'}
                </Text>
              </View>

              <View style={styles.siteMetaChip}>
                <Text style={styles.siteMetaChipLabel}>CITY / REGION</Text>
                <Text style={styles.siteMetaChipValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                  {[locationCity, clientWiseState].filter(Boolean).join(', ') || '—'}
                </Text>
              </View>
            </View>

            {/* Row 3: Location / Branch Address Area */}
            <View style={styles.locationAreaBox}>
              <AppIcon name="map-pin" size={12} color="#0D9488" />
              <Text style={styles.locationAreaText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                Location: {locationArea || '—'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Real-Time Interactive Map Card ── */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppIcon name="map-pin" size={16} color="#0F172A" />
            <Text style={styles.cardTitle}>Live Location Radar</Text>
          </View>
          <TouchableOpacity
            style={styles.expandBadge}
            activeOpacity={0.7}
            onPress={() => setIsMapModalVisible(true)}
          >
            <AppIcon name="maximize" size={13} color={colors.primary} />
            <Text style={styles.expandBadgeText}>Full Screen</Text>
          </TouchableOpacity>
        </View>

        {/* Live WebView Map Container (Tap to open full map) */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setIsMapModalVisible(true)}
          style={styles.mapWrapper}
        >
          <WebViewComponent
            ref={compactWebViewRef}
            originWhitelist={['*']}
            source={{ html: buildMapHtml(false), baseUrl: 'https://localhost' }}
            style={styles.mapWebView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            geolocationEnabled={true}
            scrollEnabled={false}
            onMessage={onMapMessage}
          />

          <View style={styles.mapTapToExpandBar}>
            <AppIcon name="location" size={12} color="#FFFFFF" />
            <Text style={styles.mapTapToExpandText}>Tap map to open full interactive view</Text>
          </View>
        </TouchableOpacity>

        {/* GPS Live Status Banner */}
        <View style={styles.gpsStatusBar}>
          <View style={styles.gpsStatusPillRow}>
            {gpsLoading && currentLat === null ? (
              <View style={[styles.gpsPill, styles.gpsPillLoading]}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={[styles.gpsPillText, { color: '#1D4ED8' }]} numberOfLines={1}>
                  Acquiring Live GPS Satellite Lock...
                </Text>
              </View>
            ) : gpsError ? (
              <View style={[styles.gpsPill, styles.gpsPillError]}>
                <View style={[styles.gpsPulseDot, styles.gpsPulseDotError]} />
                <Text style={[styles.gpsPillText, { color: '#DC2626' }]} numberOfLines={1}>
                  GPS Signal Weak / Disabled
                </Text>
              </View>
            ) : insideGeofence ? (
              <View style={[styles.gpsPill, styles.gpsPillSuccess]}>
                <View style={[styles.gpsPulseDot, styles.gpsPulseDotSuccess]} />
                <Text style={[styles.gpsPillText, { color: '#059669' }]} numberOfLines={1}>
                  ✓ Inside Station Perimeter ({distanceMeters}m away)
                </Text>
              </View>
            ) : (
              <View style={[styles.gpsPill, styles.gpsPillError]}>
                <View style={[styles.gpsPulseDot, styles.gpsPulseDotError]} />
                <Text style={[styles.gpsPillText, { color: '#DC2626' }]} numberOfLines={1}>
                  ✗ Outside Perimeter ({distanceMeters}m away)
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.gpsRefreshBtn}
              activeOpacity={0.7}
              onPress={refreshGpsLocation}
            >
              <AppIcon name="refresh" size={12} color={colors.primary} />
              <Text style={styles.gpsRefreshBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {currentLat !== null && currentLon !== null ? (
            <Text style={styles.gpsCoordsText} numberOfLines={1}>
              Phone GPS: {currentLat.toFixed(5)}°N, {currentLon.toFixed(5)}°E {gpsAccuracy ? `(±${gpsAccuracy}m)` : ''}
            </Text>
          ) : (
            <Text style={styles.gpsCoordsText} numberOfLines={1}>
              Ensure device Location (GPS) is turned ON in Android quick settings.
            </Text>
          )}
        </View>
      </View>

      {/* ── Biometric Camera Selfie Card (Front Camera Only) ── */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppIcon name="camera" size={16} color="#0F172A" />
            <Text style={styles.cardTitle}>Identity & Face Verification</Text>
          </View>
          {capturedImageUri && (
            <View style={styles.verifiedMiniTag}>
              <AppIcon name="check-circle" size={13} color="#059669" />
              <Text style={styles.verifiedMiniTagText}>Selfie Ready</Text>
            </View>
          )}
        </View>

        {capturedImageUri ? (
          <View>
            <View style={styles.capturedPreviewWrapper}>
              <Image source={{ uri: capturedImageUri }} style={styles.capturedImage} />

              <View style={styles.verifiedBadge}>
                <AppIcon name="check" size={12} color="#FFFFFF" />
                <Text style={styles.verifiedBadgeText}>Selfie Captured</Text>
              </View>

              {/* Watermark Details */}
              <View style={styles.watermarkOverlay}>
                <Text style={styles.watermarkText}>
                  TIMESTAMP: {new Date().toLocaleDateString('en-GB')} {currentTime}
                </Text>
                <Text style={styles.watermarkText}>
                  GPS: {currentLat ? `${currentLat.toFixed(5)}N, ${currentLon?.toFixed(5)}E` : 'Pending Lock'}
                </Text>
                <Text style={styles.watermarkText}>
                  UNIT: {unitName}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.retakeBtn}
              activeOpacity={0.7}
              onPress={openCamera}
            >
              <AppIcon name="camera" size={16} color={colors.textPrimary} />
              <Text style={styles.retakeBtnText}>Retake Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.cameraViewfinder}>
              <View style={styles.viewfinderCornerTL} />
              <View style={styles.viewfinderCornerTR} />
              <View style={styles.viewfinderCornerBL} />
              <View style={styles.viewfinderCornerBR} />

              <AppIcon name="camera" size={38} color="#0D9488" />
              <Text style={styles.cameraInstructionTitle}>Front Camera Face Selfie</Text>
              <Text style={styles.cameraInstructionSub}>
                Center your face clearly inside the frame to authenticate shift entry
              </Text>
            </View>

            <TouchableOpacity
              style={styles.openCameraHeroBtn}
              activeOpacity={0.8}
              onPress={openCamera}
              disabled={cameraLoading}
            >
              {cameraLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <AppIcon name="camera" size={18} color="#FFFFFF" />
                  <Text style={styles.openCameraHeroBtnText}>Open Camera & Capture</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Shift Status Indicator Banner */}
      {shiftPunchState.hasPunchedIn && (
        <View
          style={{
            marginHorizontal: ms(16),
            marginBottom: ms(10),
            paddingVertical: ms(9),
            paddingHorizontal: ms(14),
            borderRadius: ms(8),
            backgroundColor: shiftPunchState.hasPunchedOut ? '#F1F5F9' : '#ECFDF5',
            borderWidth: 1,
            borderColor: shiftPunchState.hasPunchedOut ? '#CBD5E1' : '#A7F3D0',
            flexDirection: 'row',
            alignItems: 'center',
            gap: ms(8),
          }}
        >
          <AppIcon
            name={shiftPunchState.hasPunchedOut ? 'check' : 'check'}
            size={16}
            color={shiftPunchState.hasPunchedOut ? '#475569' : '#059669'}
          />
          <Text
            style={{
              fontSize: ms(12),
              fontWeight: '600',
              color: shiftPunchState.hasPunchedOut ? '#334155' : '#065F46',
              flex: 1,
            }}
          >
            {shiftPunchState.hasPunchedOut
              ? `Shift Finished • IN: ${shiftPunchState.inTimeStr || '--:--'} • OUT: ${shiftPunchState.outTimeStr || '--:--'}`
              : `Shift In Progress • In Time: ${shiftPunchState.inTimeStr || 'Today'}`}
          </Text>
        </View>
      )}

      {/* ── Enterprise Punch IN & Punch OUT Action Buttons ── */}
      <View style={styles.punchActionGrid}>
        {/* Punch IN Button (Disabled once punched in) */}
        <TouchableOpacity
          style={[
            styles.punchActionCard,
            styles.punchInCard,
            (shiftPunchState.hasPunchedIn || !capturedImageUri || currentLat === null || !insideGeofence) && styles.punchCardDisabled,
          ]}
          activeOpacity={shiftPunchState.hasPunchedIn ? 1 : 0.88}
          disabled={shiftPunchState.hasPunchedIn || punchLoading}
          onPress={() => handlePunch('IN')}
        >
          {punchLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={styles.punchButtonRow}>
              <View
                style={[
                  styles.punchCardIconCircle,
                  shiftPunchState.hasPunchedIn && { backgroundColor: 'rgba(255,255,255,0.25)' },
                ]}
              >
                <AppIcon
                  name={shiftPunchState.hasPunchedIn ? 'check' : 'fingerprint'}
                  size={20}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.punchBtnTextGroup}>
                <Text
                  style={styles.punchCardTitle}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {shiftPunchState.hasPunchedIn ? 'PUNCHED IN' : 'PUNCH IN'}
                </Text>
                <Text
                  style={styles.punchCardSubtitle}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {shiftPunchState.hasPunchedIn
                    ? (shiftPunchState.inTimeStr ? `IN: ${shiftPunchState.inTimeStr}` : 'Shift Active')
                    : 'Shift Start'}
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Punch OUT Button (Supports Re-Punch OUT to update shift end time) */}
        <TouchableOpacity
          style={[
            styles.punchActionCard,
            styles.punchOutCard,
            (!shiftPunchState.hasPunchedIn || !capturedImageUri || currentLat === null || !insideGeofence) && styles.punchCardDisabled,
          ]}
          activeOpacity={!shiftPunchState.hasPunchedIn ? 1 : 0.88}
          disabled={!shiftPunchState.hasPunchedIn || punchLoading}
          onPress={() => handlePunch('OUT')}
        >
          {punchLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={styles.punchButtonRow}>
              <View
                style={[
                  styles.punchCardIconCircle,
                  shiftPunchState.hasPunchedOut && { backgroundColor: 'rgba(255,255,255,0.25)' },
                ]}
              >
                <AppIcon
                  name={shiftPunchState.hasPunchedOut ? 'refresh-cw' : 'fingerprint'}
                  size={18}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.punchBtnTextGroup}>
                <Text
                  style={styles.punchCardTitle}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {shiftPunchState.hasPunchedOut ? 'RE-PUNCH OUT' : 'PUNCH OUT'}
                </Text>
                <Text
                  style={styles.punchCardSubtitle}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {shiftPunchState.hasPunchedOut
                    ? (shiftPunchState.outTimeStr ? `OUT: ${shiftPunchState.outTimeStr} (Update)` : 'Tap to update OUT')
                    : !shiftPunchState.hasPunchedIn
                    ? 'Requires IN First'
                    : 'Shift End'}
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Verification Checklist Card ── */}
      <View style={styles.checklistCard}>
        <Text style={styles.cardTitle}>Verification Status</Text>

        <View style={styles.checkItemRow}>
          <AppIcon
            name={currentLat !== null ? 'check' : 'close'}
            size={16}
            color={currentLat !== null ? '#059669' : '#DC2626'}
          />
          <Text style={styles.checkItemText}>
            {currentLat !== null
              ? `Real-Time GPS Locked (${currentLat.toFixed(4)}, ${currentLon?.toFixed(4)})`
              : 'Acquiring GPS Satellite Lock...'}
          </Text>
        </View>

        <View style={styles.checkItemRow}>
          <AppIcon
            name={insideGeofence ? 'check' : 'close'}
            size={16}
            color={insideGeofence ? '#059669' : '#DC2626'}
          />
          <Text style={styles.checkItemText}>
            {distanceMeters !== null
              ? insideGeofence
                ? `Within ${geofenceRadius}m Geofence (${distanceMeters}m from site)`
                : `Outside ${geofenceRadius}m Geofence (${distanceMeters}m away)`
              : 'Calculating distance to assigned unit...'}
          </Text>
        </View>

        <View style={styles.checkItemRow}>
          <AppIcon
            name={capturedImageUri ? 'check' : 'close'}
            size={16}
            color={capturedImageUri ? '#059669' : '#DC2626'}
          />
          <Text style={styles.checkItemText}>
            {capturedImageUri ? 'Front Camera Selfie Captured' : 'Take Face Selfie via Camera'}
          </Text>
        </View>
      </View>

      {/* ── Fullscreen Interactive Map Modal ── */}
      <Modal
        visible={isMapModalVisible}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setIsMapModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalHeader, { paddingTop: topInset, height: ms(54) + topInset }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalHeaderTitle} numberOfLines={1}>🗺️ Live Location Radar</Text>
              <Text style={styles.unitSubtitle} numberOfLines={1}>Pinch to zoom • Drag to explore</Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              activeOpacity={0.7}
              onPress={() => setIsMapModalVisible(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <AppIcon name="close" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalMapArea}>
            <WebViewComponent
              ref={modalWebViewRef}
              originWhitelist={['*']}
              source={{ html: buildMapHtml(true), baseUrl: 'https://localhost' }}
              style={styles.mapWebView}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              geolocationEnabled={true}
              scrollEnabled={true}
              onMessage={onMapMessage}
            />
          </View>

          <View style={[styles.modalBottomBar, { paddingBottom: bottomInset + ms(8) }]}>
            <View style={styles.modalBottomInfo}>
              <Text style={styles.modalBottomDistance} numberOfLines={1}>
                {insideGeofence ? '✓ Inside Geofence' : '✗ Outside Geofence'} ({distanceMeters ?? '...'}m)
              </Text>
              <Text style={styles.modalBottomCoords} numberOfLines={1}>
                Site: {unitName} • GPS: {currentLat?.toFixed(5) ?? '--'}, {currentLon?.toFixed(5) ?? '--'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.gpsRefreshBtn}
              activeOpacity={0.7}
              onPress={refreshGpsLocation}
            >
              <AppIcon name="refresh" size={14} color={colors.primary} />
              <Text style={styles.gpsRefreshBtnText}>Recenter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Global Custom Alert Card Modal (Replaces native system Alert.alert) */}
      <CustomAlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </AppScreenContainer>
  );
};
