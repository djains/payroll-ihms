import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Image,
  PermissionsAndroid,
  Linking,
  Share,
  Modal,
  FlatList,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { styles } from './AddStaffScreen.styles';
import {
  AppScreenContainer,
  AppHeader,
  AppTextInput,
  AppButton,
  AppIcon,
  CustomAlertModal,
  DatePickerModal,
  PasswordStrengthMeter,
} from '../../../components/common';
import { useNavigation } from '../../../navigation/navigationContext';
import { superadminApi, staffApi, authApi, BackendUnit, BackendStateItem } from '../../../api';
import { useAuthStore } from '../../../store/authStore';
import { showToast } from '../../../store/toastStore';
import { z } from 'zod';

// Zod Validation Schema for Worker Registration Form
const addWorkerSchema = z
  .object({
    empName: z
      .string({ required_error: 'Worker name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters'),
    empFatherName: z.string().trim().optional(),
    empMobile: z
      .string({ required_error: 'Mobile number is required' })
      .trim()
      .length(10, 'Mobile number must be exactly 10 digits')
      .regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit mobile number starting with 6, 7, 8, or 9'),
    empEmail: z.string().trim().optional(),
    sendCredentialsEmail: z.boolean().default(true),
    password: z
      .string({ required_error: 'Initial password is required' })
      .min(9, 'Password must be at least 9 characters (e.g. Staff@1234)'),
    selectedUnitCode: z
      .string({ required_error: 'Please select a deployment site unit' })
      .min(1, 'Please select a deployment site unit'),
    selectedRole: z
      .string({ required_error: 'Please select an assigned role' })
      .min(1, 'Please select an assigned role'),
    hasPhoto: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    const emailClean = (val.empEmail || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (val.sendCredentialsEmail) {
      if (!emailClean) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['empEmail'],
          message: 'Email address is required to send login credentials',
        });
      } else if (!emailRegex.test(emailClean)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['empEmail'],
          message: 'Enter a valid email address (e.g. worker@example.com)',
        });
      }
    } else if (emailClean && !emailRegex.test(emailClean)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['empEmail'],
        message: 'Enter a valid email address',
      });
    }
  });

type AddWorkerFormValues = z.infer<typeof addWorkerSchema>;

// Module-level in-memory caches for instant zero-flicker Add Worker transitions
let cachedStaffUnits: BackendUnit[] | null = null;
let cachedStaffRoles: string[] | null = null;
let cachedStaffDepts: Array<{ dept_code: string; dept_name: string }> | null = null;
let cachedStaffStates: BackendStateItem[] | null = null;
const cachedStaffCitiesByState: Record<string, string[]> = {};

const ALL_INDIAN_STATES: string[] = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

// Timed API profiler helper function
const timedStaffApi = async <T,>(name: string, fn: () => Promise<T>): Promise<T> => {
  const t0 = Date.now();
  try {
    const res: any = await fn();
    const cost = Date.now() - t0;
    let detail = '';
    if (res?.success && res?.data) {
      const list = Array.isArray(res.data) ? res.data : res.data?.results;
      if (Array.isArray(list)) {
        detail = ` | Fetched ${list.length} records`;
      } else if (typeof res.data === 'object') {
        detail = ' | OK';
      }
    } else if (res && !res.success) {
      detail = ` | Failed (${res.statusCode || ''}): ${res.error || 'Unknown error'}`;
    }
    console.log(`[AddStaff API] ⏱️ ${name} -> ${cost}ms${detail}`);
    return res;
  } catch (err) {
    const cost = Date.now() - t0;
    console.warn(`[AddStaff API] ❌ ${name} failed after ${cost}ms:`, err);
    throw err;
  }
};

export const AddStaffScreen: React.FC = () => {
  const { goBack, replace } = useNavigation();
  const { currentUser } = useAuthStore();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16);

  // Form Fields
  const [empName, setEmpName] = useState('');
  const [empFatherName, setEmpFatherName] = useState('');
  const [empMobile, setEmpMobile] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [sendCredentialsEmail, setSendCredentialsEmail] = useState(true);
  const [selectedUnitCode, setSelectedUnitCode] = useState(cachedStaffUnits?.[0]?.unit_code || '');
  const [selectedRole, setSelectedRole] = useState(cachedStaffRoles?.[0] || '');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [employeeType, setEmployeeType] = useState('Staff');
  const [city, setCity] = useState(cachedStaffUnits?.[0]?.unit_city || '');
  const [state, setState] = useState(cachedStaffUnits?.[0]?.state_name || '');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [backendDob, setBackendDob] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [joiningDate, setJoiningDate] = useState('');
  const [backendJoiningDate, setBackendJoiningDate] = useState('');
  const [showJoiningDatePicker, setShowJoiningDatePicker] = useState(false);

  const [bloodGroup, setBloodGroup] = useState('');

  // Multi-step Wizard: 1 = Basic Info, 2 = Photo & KYC, 3 = Unit Deployment
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Next Code & Department
  const [nextEmpCode, setNextEmpCode] = useState('');
  const [deptCode, setDeptCode] = useState(cachedStaffDepts?.[0]?.dept_code || '');
  const [departmentsList, setDepartmentsList] = useState<Array<{ dept_code: string; dept_name: string }>>(
    cachedStaffDepts || []
  );

  // Worker Photo for Mandatory Verification Document
  const [workerPhoto, setWorkerPhoto] = useState<{
    uri: string;
    name: string;
    type: string;
    base64?: string;
  } | null>(null);

  // Aadhaar Card Document
  const [aadharDoc, setAadharDoc] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  // PAN Card Document
  const [panDoc, setPanDoc] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  // Dropdown lists fetched live from MySQL (initialized from cache)
  const [unitsList, setUnitsList] = useState<BackendUnit[]>(cachedStaffUnits || []);
  const [rolesList, setRolesList] = useState<string[]>(cachedStaffRoles || []);
  const [loadingData, setLoadingData] = useState(!(cachedStaffUnits && cachedStaffRoles && cachedStaffDepts));
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // States & Cities Picker State
  const [availableStates, setAvailableStates] = useState<BackendStateItem[]>(cachedStaffStates || []);
  const [loadingStates, setLoadingStates] = useState(false);
  const [statePickerVisible, setStatePickerVisible] = useState(false);
  const [stateSearch, setStateSearch] = useState('');

  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const inFlightCityRef = useRef<string | null>(null);

  // Alert Modal
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'danger';
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'warning',
  });

  useEffect(() => {
    const timedApi = async <T,>(name: string, fn: () => Promise<T>): Promise<T> => {
      const t0 = Date.now();
      try {
        const res: any = await fn();
        const cost = Date.now() - t0;
        let detail = '';
        if (res?.success && res?.data) {
          const list = Array.isArray(res.data) ? res.data : res.data?.results;
          if (Array.isArray(list)) {
            detail = ` | Fetched ${list.length} records`;
          } else if (typeof res.data === 'object') {
            detail = ' | OK';
          }
        } else if (res && !res.success) {
          detail = ` | Failed (${res.statusCode || ''}): ${res.error || 'Unknown error'}`;
        }
        console.log(`[AddStaff API] ⏱️ ${name} -> ${cost}ms${detail}`);
        return res;
      } catch (err) {
        const cost = Date.now() - t0;
        console.warn(`[AddStaff API] ❌ ${name} failed after ${cost}ms:`, err);
        throw err;
      }
    };

    const loadPrerequisites = async () => {
      const tStart = Date.now();
      const hasAllCaches = Boolean(cachedStaffUnits && cachedStaffRoles && cachedStaffDepts);

      if (hasAllCaches) {
        console.log('[AddStaff] Cache Hit: Units/Roles/Depts loaded (0ms)');
        try {
          const codeRes = await timedApi('Next Emp Code (GET /api/hr/employees/next-code/)', () =>
            staffApi.getNextEmpCode()
          );
          if (codeRes.success && codeRes.data?.emp_code) {
            setNextEmpCode(codeRes.data.emp_code);
          }
        } catch {}
        setLoadingData(false);
        return;
      }

      try {
        const [unitsRes, rolesRes, codeRes, deptRes] = await Promise.allSettled([
          cachedStaffUnits
            ? Promise.resolve({ success: true, data: cachedStaffUnits } as any)
            : timedApi('Units Master (GET /api/masters/units/)', () => superadminApi.getUnits()),
          cachedStaffRoles
            ? Promise.resolve({ success: true, data: cachedStaffRoles } as any)
            : timedApi('Roles List (GET /api/hr/roles/)', () => superadminApi.getRolesFastList()),
          timedApi('Next Emp Code (GET /api/hr/employees/next-code/)', () => staffApi.getNextEmpCode()),
          cachedStaffDepts
            ? Promise.resolve({ success: true, data: cachedStaffDepts } as any)
            : timedApi('Departments (GET /api/masters/departments/)', () => staffApi.getDepartments()),
        ]);

        let uCount = cachedStaffUnits?.length ?? 0;
        let rCount = cachedStaffRoles?.length ?? 0;
        let dCount = cachedStaffDepts?.length ?? 0;

        if (!cachedStaffUnits && unitsRes.status === 'fulfilled' && unitsRes.value.success && unitsRes.value.data) {
          const list = Array.isArray(unitsRes.value.data)
            ? unitsRes.value.data
            : (unitsRes.value.data as any).results || [];
          cachedStaffUnits = list;
          setUnitsList(list);
          uCount = list.length;
          if (list.length > 0) {
            setSelectedUnitCode(list[0].unit_code);
            if (list[0].unit_city) setCity(list[0].unit_city);
            if (list[0].state_name) setState(list[0].state_name);
          }
        }

        if (!cachedStaffRoles && rolesRes.status === 'fulfilled' && rolesRes.value.success && rolesRes.value.data) {
          const rData = rolesRes.value.data;
          let rList: string[] = [];
          if (Array.isArray(rData)) {
            rList = rData.map((r: any) => (typeof r === 'string' ? r : r.name || ''));
          } else if (rData?.results && Array.isArray(rData.results)) {
            rList = rData.results.map((r: any) => (typeof r === 'string' ? r : r.name || ''));
          }
          // Filter out Company Admin & root admin from employee selection
          const filtered = rList.filter((r) => {
            const low = r.toLowerCase();
            return !low.startsWith('company admin') && low !== 'admin' && low !== 'superadmin';
          });
          cachedStaffRoles = filtered;
          setRolesList(filtered);
          rCount = filtered.length;
          if (filtered.length > 0) {
            setSelectedRole(filtered[0]);
          }
        }

        if (codeRes.status === 'fulfilled' && codeRes.value.success && codeRes.value.data) {
          const code = codeRes.value.data.emp_code || '';
          if (code) setNextEmpCode(code);
        }

        if (!cachedStaffDepts) {
          let normalizedDepts: Array<{ dept_code: string; dept_name: string }> = [];
          if (deptRes.status === 'fulfilled' && deptRes.value.success && deptRes.value.data) {
            const dData = deptRes.value.data;
            const dList = Array.isArray(dData) ? dData : dData?.results || [];
            normalizedDepts = dList
              .map((d: any) => ({
                dept_code: String(d.dept_code || d.code || '').trim(),
                dept_name: String(d.dept_name || d.name || d.dept_code || '').trim(),
              }))
              .filter((d: any) => d.dept_code);
          }

          if (normalizedDepts.length === 0) {
            normalizedDepts = [
              { dept_code: 'Operation', dept_name: 'Operation' },
              { dept_code: 'HR Department', dept_name: 'HR Department' },
              { dept_code: 'Admin', dept_name: 'Admin' },
              { dept_code: 'Account', dept_name: 'Account' },
              { dept_code: 'Invoice/Finance', dept_name: 'Invoice/Finance' },
              { dept_code: 'Manager', dept_name: 'Manager' },
              { dept_code: 'Security', dept_name: 'Security' },
              { dept_code: 'Housekeeping', dept_name: 'Housekeeping' },
            ];
          }

          cachedStaffDepts = normalizedDepts;
          setDepartmentsList(normalizedDepts);
          dCount = normalizedDepts.length;
          if (normalizedDepts.length > 0) {
            setDeptCode(normalizedDepts[0].dept_code);
          }
        }

        console.log(`[AddStaff] Sync: 4 APIs in ~${Date.now() - tStart}ms (Units: ${uCount}, Roles: ${rCount}, Depts: ${dCount})`);
      } catch (e) {
        console.warn('[AddStaffScreen] Error loading units/roles/code:', e);
      } finally {
        setLoadingData(false);
      }
    };

    loadPrerequisites();
  }, []);

  // Fetch States API
  const fetchStates = async (isForce: boolean = false) => {
    if (!isForce && cachedStaffStates) {
      console.log(`[AddStaff API] ⚡ States Master -> Cache Hit (${cachedStaffStates.length} records)`);
      setAvailableStates(cachedStaffStates);
      return;
    }
    setLoadingStates(true);
    try {
      const res = await timedStaffApi('States Master (GET /api/masters/states/)', () =>
        superadminApi.getStates()
      );
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
        cachedStaffStates = list;
        setAvailableStates(list);
      }
    } catch (e) {
      console.warn('[AddStaff] fetch states error:', e);
    } finally {
      setLoadingStates(false);
    }
  };

  // Fetch Cities API based on selected state
  const fetchCitiesForState = async (targetState: string, isForce: boolean = false) => {
    const cleanTarget = targetState.trim().toLowerCase();
    if (!cleanTarget) {
      setAvailableCities([]);
      return;
    }

    if (!isForce && cachedStaffCitiesByState[cleanTarget]) {
      console.log(`[AddStaff API] ⚡ Cities for ${targetState} -> Cache Hit (${cachedStaffCitiesByState[cleanTarget].length} cities)`);
      setAvailableCities(cachedStaffCitiesByState[cleanTarget]);
      return;
    }

    if (inFlightCityRef.current === cleanTarget) {
      return;
    }

    const extractCities = (rows: any[]) => {
      const map = new Map<string, string>();
      rows.forEach((r: any) => {
        const rowState = String(
          r.state_name || r.STATE_NAME || r.name || r.state || r.stateName || ''
        ).trim().toLowerCase();
        const rawCity = String(
          r.city || r.CITY || r.city_name || r.CITY_NAME || r.district || r.district_name || r.town || r.location || ''
        ).trim();
        if (
          rawCity &&
          (!rowState || rowState === cleanTarget || rowState.includes(cleanTarget) || cleanTarget.includes(rowState)) &&
          !map.has(rawCity.toLowerCase())
        ) {
          map.set(rawCity.toLowerCase(), rawCity);
        }
      });
      return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
    };

    const initialCities = extractCities(availableStates);
    if (initialCities.length > 0) {
      setAvailableCities(initialCities);
    }

    inFlightCityRef.current = cleanTarget;
    setLoadingCities(true);
    try {
      const res = await timedStaffApi(`Cities for ${targetState} (GET /api/masters/states/)`, () =>
        superadminApi.getStates(targetState, 100, 1)
      );
      if (res.success && res.data) {
        let allRows = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
        const totalCount = typeof (res.data as any)?.count === 'number' ? (res.data as any).count : allRows.length;

        if ((res.data as any)?.next && totalCount > allRows.length && totalCount <= 1000) {
          const totalPages = Math.ceil(totalCount / 100);
          const pagePromises = [];
          for (let p = 2; p <= totalPages; p++) {
            pagePromises.push(superadminApi.getStates(targetState, 100, p));
          }
          const extraResults = await Promise.allSettled(pagePromises);
          extraResults.forEach((r) => {
            if (r.status === 'fulfilled' && r.value.success && r.value.data) {
              const extraList = Array.isArray(r.value.data) ? r.value.data : (r.value.data as any).results || [];
              allRows = [...allRows, ...extraList];
            }
          });
        }

        const merged = extractCities([...availableStates, ...allRows]);
        cachedStaffCitiesByState[cleanTarget] = merged;
        setAvailableCities(merged);
      }
    } catch (e) {
      console.warn('[AddStaff] fetch cities error:', e);
    } finally {
      inFlightCityRef.current = null;
      setLoadingCities(false);
    }
  };

  // State filtering with fallback Indian states
  const filteredStates = useMemo(() => {
    const query = stateSearch.trim().toLowerCase();
    const map = new Map<string, { sName: string; code?: string }>();

    availableStates.forEach((s) => {
      const name = String(s.state_name || '').trim();
      if (name && !map.has(name.toLowerCase())) {
        map.set(name.toLowerCase(), { sName: name, code: s.state_code });
      }
    });

    ALL_INDIAN_STATES.forEach((name) => {
      if (!map.has(name.toLowerCase())) {
        map.set(name.toLowerCase(), { sName: name });
      }
    });

    const all = Array.from(map.values()).sort((a, b) => a.sName.localeCompare(b.sName));
    if (!query) return all;
    return all.filter((s) => s.sName.toLowerCase().includes(query));
  }, [availableStates, stateSearch]);

  // City filtering
  const filteredCities = useMemo(() => {
    const query = citySearch.trim().toLowerCase();
    if (!query) return availableCities;
    return availableCities.filter((c) => c.toLowerCase().includes(query));
  }, [availableCities, citySearch]);

  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission Required',
          message: 'NG GLOBAL needs access to your camera to take the worker verification photo.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Camera permission request error:', err);
      return false;
    }
  };

  type DocTarget = 'photo' | 'aadhar' | 'pan';

  const handleCaptureCamera = async (target: DocTarget = 'photo') => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        setAlertConfig({
          visible: true,
          title: 'Permission Denied',
          message: 'Camera permission is required. Please allow it in App Settings.',
          type: 'warning',
        });
        return;
      }

      const response = await launchCamera({
        mediaType: 'photo',
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.6,
        saveToPhotos: false,
        includeBase64: target === 'photo',
      });

      if (response.didCancel) return;

      if (response.errorCode) {
        showToast({
          type: 'error',
          title: 'Camera Error',
          message: response.errorMessage || 'Could not open camera.',
        });
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        const docObj = {
          uri: asset.uri || '',
          name: asset.fileName || `${target}_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
          base64: asset.base64,
        };

        if (target === 'photo') {
          setWorkerPhoto(docObj);
          showToast({
            type: 'success',
            title: 'Photo Captured',
            message: 'Worker verification photo attached.',
          });
        } else if (target === 'aadhar') {
          setAadharDoc(docObj);
          showToast({
            type: 'success',
            title: 'Aadhaar Attached',
            message: 'Aadhaar card document attached.',
          });
        } else if (target === 'pan') {
          setPanDoc(docObj);
          showToast({
            type: 'success',
            title: 'PAN Attached',
            message: 'PAN card document attached.',
          });
        }
      }
    } catch (error: any) {
      console.warn('Camera launch error:', error);
      showToast({
        type: 'error',
        title: 'Camera Error',
        message: error?.message || 'Failed to open camera.',
      });
    }
  };

  const handlePickGallery = async (target: DocTarget = 'photo') => {
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.6,
        includeBase64: target === 'photo',
      });

      if (response.didCancel) return;

      if (response.errorCode) {
        showToast({
          type: 'error',
          title: 'Gallery Error',
          message: response.errorMessage || 'Could not open gallery.',
        });
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        const docObj = {
          uri: asset.uri || '',
          name: asset.fileName || `${target}_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
          base64: asset.base64,
        };

        if (target === 'photo') {
          setWorkerPhoto(docObj);
          showToast({
            type: 'success',
            title: 'Photo Selected',
            message: 'Worker verification photo attached.',
          });
        } else if (target === 'aadhar') {
          setAadharDoc(docObj);
          showToast({
            type: 'success',
            title: 'Aadhaar Selected',
            message: 'Aadhaar card document attached.',
          });
        } else if (target === 'pan') {
          setPanDoc(docObj);
          showToast({
            type: 'success',
            title: 'PAN Selected',
            message: 'PAN card document attached.',
          });
        }
      }
    } catch (error: any) {
      console.warn('Gallery launch error:', error);
    }
  };

  // Step 1 Validation: Personal & Contact Details
  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!empName.trim() || empName.trim().length < 2) {
      errs.empName = 'Worker full name is required (min 2 chars).';
    }
    const cleanMobile = empMobile.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length !== 10) {
      errs.empMobile = 'Valid 10-digit mobile number is required.';
    }
    if (empEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(empEmail.trim())) {
      errs.empEmail = 'Please enter a valid email address.';
    }
    if (!backendJoiningDate) {
      errs.joiningDate = 'Please select worker Joining Date.';
    }
    if (!bloodGroup) {
      errs.bloodGroup = 'Please select Blood Group.';
    }
    if (!password.trim() || password.trim().length < 9) {
      errs.password = 'Initial password must be at least 9 characters.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setAlertConfig({
        visible: true,
        title: 'Step 1 Incomplete',
        message: Object.values(errs)[0],
        type: 'warning',
      });
      return false;
    }
    setErrors({});
    return true;
  };

  // Step 2 Validation: Photo & KYC Documents
  const validateStep2 = () => {
    // Photos & KYC can be verified or optional, but if validation is needed it can be enforced here
    setErrors({});
    return true;
  };

  // Step 3 Validation & Final Submit: Deployment to Unit
  const handleRegisterEmployee = async () => {
    const errs: Record<string, string> = {};
    if (!selectedUnitCode.trim()) {
      errs.selectedUnitCode = 'Please select a Site Unit for deployment.';
    }
    if (!selectedRole.trim()) {
      errs.selectedRole = 'Please assign a Designation / Role.';
    }
    if (!deptCode.trim()) {
      errs.deptCode = 'Please select a Department.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setAlertConfig({
        visible: true,
        title: 'Step 3 Incomplete',
        message: Object.values(errs)[0],
        type: 'warning',
      });
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const selectedUnitObj = unitsList.find((u) => u.unit_code === selectedUnitCode);

      // 1. Resolve Employee Code
      let codeToUse = nextEmpCode;
      if (!codeToUse) {
        const codeRes = await staffApi.getNextEmpCode();
        if (codeRes.success && codeRes.data?.emp_code) {
          codeToUse = codeRes.data.emp_code;
        }
      }

      // 2. Stage verification documents in backend
      if (codeToUse) {
        const uploadPromises: Promise<any>[] = [];
        if (workerPhoto) {
          uploadPromises.push(
            staffApi.uploadEmployeeDoc(
              codeToUse,
              'Original Photo(Passport Size)',
              workerPhoto.uri,
              'photo.jpg'
            )
          );
        }
        if (aadharDoc) {
          uploadPromises.push(
            staffApi.uploadEmployeeDoc(
              codeToUse,
              'Original Aadhar Card',
              aadharDoc.uri,
              'aadhar.jpg'
            )
          );
        }
        if (panDoc) {
          uploadPromises.push(
            staffApi.uploadEmployeeDoc(
              codeToUse,
              'Pan Card',
              panDoc.uri,
              'pan.jpg'
            )
          );
        }
        if (uploadPromises.length > 0) {
          await Promise.allSettled(uploadPromises);
        }
      }

      const finalPassword = password.trim() || 'Staff@123';

      // 3. Register Employee with Live Backend API
      const payload = {
        emp_code: codeToUse || undefined,
        emp_name: empName.trim(),
        emp_father_name: empFatherName.trim() || 'Parent',
        emp_mobile_no: empMobile.trim(),
        emp_email_id: empEmail.trim(),
        unit_code: selectedUnitCode.trim(),
        designation_code: selectedRole.trim(),
        role: selectedRole.trim(),
        client_code: selectedUnitObj?.client_code || 'CL01',
        dept_code: deptCode.trim(),
        employee_type: employeeType,
        reporting_to: currentUser?.empCode || currentUser?.username || '',
        gender: gender === 'Female' ? 'F' : 'M',
        birth_date: backendDob || '1995-01-01',
        joining_date: backendJoiningDate,
        location: selectedUnitObj?.state_name || state || 'Maharashtra',
        location_city: selectedUnitObj?.unit_city || city || 'Mumbai',
        emp_nationality: 'Indian',
        emp_current_state: selectedUnitObj?.state_name || state || 'Maharashtra',
        emp_current_city: selectedUnitObj?.unit_city || city || 'Mumbai',
        emp_blood_group: bloodGroup,
        password: finalPassword,
      };

      const res = await staffApi.createEmployee(payload);

      if (res.success && res.data) {
        const createdCode = res.data.emp_code || res.data.login_id || codeToUse || 'Worker';

        // Auto-activate login password using setup token if provided
        let pwSetupSuccess = true;
        let pwSetupError = '';
        if (res.data.login_setup_token && finalPassword) {
          try {
            const pwRes = await authApi.setupPassword(res.data.login_setup_token, finalPassword);
            if (!pwRes.success) {
              pwSetupSuccess = false;
              pwSetupError = typeof pwRes.error === 'string' ? pwRes.error : JSON.stringify(pwRes.error || '');
              console.warn('[AddStaffScreen] Auto password setup warning:', pwRes.error);
            }
          } catch (pwErr) {
            pwSetupSuccess = false;
            console.warn('[AddStaffScreen] Auto password setup info:', pwErr);
          }
        } else if (!res.data.login_setup_token) {
          console.warn('[AddStaffScreen] Backend did not issue login_setup_token. User account might already exist.');
        }

        // Dual-sync worker profile photo to mobile verification table so it renders on mobile profile
        if (workerPhoto?.base64 && createdCode) {
          staffApi.uploadMobilePhoto(createdCode, workerPhoto.base64).catch((err) => {
            console.warn('[AddStaffScreen] Mobile photo sync note:', err);
          });
        }

        // Send login credentials email if requested and email provided
        const emailTo = empEmail.trim();
        if (sendCredentialsEmail && emailTo) {
          const siteDisplay = selectedUnitObj?.unit_name || selectedUnitCode.trim() || 'Site Unit';
          const roleDisplay = selectedRole.trim() || 'Staff';
          const subject = `NG GLOBAL Portal - Login Credentials for ${empName.trim()} (${createdCode})`;
          const body = `Hello ${empName.trim()},\n\nWelcome to the team! Below are your official NG GLOBAL mobile app login credentials:\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n• Portal / App Link: https://ihms.app\n• Login ID (Username): ${createdCode}\n• Password: ${finalPassword}\n• Designation: ${roleDisplay}\n• Assigned Site: ${siteDisplay}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nPlease download the NG GLOBAL app and sign in with the Login ID and Password provided above.\nIf you have any questions or need assistance, please contact your unit supervisor.\n\nBest regards,\nNG GLOBAL Administration`;

          const mailtoUrl = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

          try {
            await Linking.openURL(mailtoUrl);
          } catch (mailErr) {
            console.warn('[AddStaffScreen] Linking.openURL direct failed, falling back to Share:', mailErr);
            try {
              await Share.share({ title: subject, message: body });
            } catch (shareErr) {
              console.warn('[AddStaffScreen] Share fallback failed:', shareErr);
            }
          }
        }

        // Clean & compact professional toast
        if (!pwSetupSuccess) {
          showToast({
            type: 'warning',
            title: 'Password Setup Warning',
            message: `${empName.trim()} created, but password could not be activated (${pwSetupError || 'Min 8 characters required'}).`,
          });
        } else {
          showToast({
            type: 'success',
            title: 'Worker Registered',
            message: sendCredentialsEmail && emailTo
              ? `${empName.trim()} (${createdCode}) registered! Credentials email prepared for ${emailTo}.`
              : `${empName.trim()} (${createdCode}) has been successfully added.`,
          });
        }

        // Navigate cleanly to Workers Directory so the app stays active and open when returning from Gmail
        replace('WorkersList');
      } else {
        let errorMsg = 'Could not register employee.';
        if (typeof res.error === 'string') {
          errorMsg = res.error;
        } else if (res.error && typeof res.error === 'object') {
          errorMsg = Object.entries(res.error)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join('\n');
        } else if (res.data && typeof res.data === 'object') {
          errorMsg = Object.entries(res.data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join('\n');
        }

        setAlertConfig({
          visible: true,
          title: 'Registration Error',
          message: errorMsg,
          type: 'danger',
        });
      }
    } catch (e: any) {
      setAlertConfig({
        visible: true,
        title: 'Network Error',
        message: e?.message || 'Failed to connect to backend server.',
        type: 'danger',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreenContainer
      style={styles.container}
      backgroundColor="#F8FAFC"
      header={
        <AppHeader
          title="Add Worker"
          subtitle="Deploy Personnel to Site Unit"
          onBack={goBack}
        />
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.contentWrap, { paddingBottom: bottomInset + 40 }]}
      >
        {loadingData ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#0F766E" />
          </View>
        ) : (
          <>
            {/* Hero Allocated ID Banner */}
            {nextEmpCode ? (
              <View style={styles.heroBanner}>
                <View style={styles.heroLeft}>
                  <Text style={styles.heroSubtitle}>System Allocated Identifier</Text>
                  <View style={styles.heroTitleRow}>
                    <AppIcon name="id-card" size={20} color="#FFFFFF" />
                    <Text style={styles.heroEmpCodeText}>{nextEmpCode}</Text>
                  </View>
                </View>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>Next ID</Text>
                </View>
              </View>
            ) : null}

            {/* Step Indicator Progress Bar (Wizard Style) */}
            <View style={styles.stepIndicatorRow}>
              {/* Step 1: Identity */}
              <TouchableOpacity
                style={styles.stepItem}
                activeOpacity={0.8}
                onPress={() => setCurrentStep(1)}
              >
                <View
                  style={[
                    styles.stepBadge,
                    currentStep === 1 && styles.stepBadgeActive,
                    currentStep > 1 && styles.stepBadgeDone,
                  ]}
                >
                  {currentStep > 1 ? (
                    <AppIcon name="check" size={13} color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.stepBadgeText,
                        currentStep === 1 && styles.stepBadgeTextActive,
                      ]}
                    >
                      1
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    currentStep === 1 && styles.stepLabelActive,
                  ]}
                >
                  Personal
                </Text>
              </TouchableOpacity>

              <View style={[styles.stepLine, currentStep > 1 && styles.stepLineActive]} />

              {/* Step 2: KYC & Photo */}
              <TouchableOpacity
                style={styles.stepItem}
                activeOpacity={0.8}
                onPress={() => {
                  if (validateStep1()) setCurrentStep(2);
                }}
              >
                <View
                  style={[
                    styles.stepBadge,
                    currentStep === 2 && styles.stepBadgeActive,
                    currentStep > 2 && styles.stepBadgeDone,
                  ]}
                >
                  {currentStep > 2 ? (
                    <AppIcon name="check" size={13} color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.stepBadgeText,
                        currentStep === 2 && styles.stepBadgeTextActive,
                      ]}
                    >
                      2
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    currentStep === 2 && styles.stepLabelActive,
                  ]}
                >
                  KYC & Docs
                </Text>
              </TouchableOpacity>

              <View style={[styles.stepLine, currentStep > 2 && styles.stepLineActive]} />

              {/* Step 3: Deployment */}
              <TouchableOpacity
                style={styles.stepItem}
                activeOpacity={0.8}
                onPress={() => {
                  if (validateStep1() && validateStep2()) setCurrentStep(3);
                }}
              >
                <View
                  style={[
                    styles.stepBadge,
                    currentStep === 3 && styles.stepBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepBadgeText,
                      currentStep === 3 && styles.stepBadgeTextActive,
                    ]}
                  >
                    3
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    currentStep === 3 && styles.stepLabelActive,
                  ]}
                >
                  Deploy
                </Text>
              </TouchableOpacity>
            </View>

            {/* STEP 1: PERSONAL & CONTACT INFORMATION */}
            {currentStep === 1 && (
              <View style={styles.formCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconBox}>
                    <AppIcon name="person" size={18} color="#0F766E" />
                  </View>
                  <View style={styles.cardHeaderTextWrap}>
                    <Text style={styles.sectionTitle}>Personnel Identity & Details</Text>
                    <Text style={styles.sectionSubtitle}>
                      Full legal name, contact numbers and credentials
                    </Text>
                  </View>
                </View>

                <AppTextInput
                  label="Full Name *"
                  placeholder="e.g. Ramesh Kumar"
                  value={empName}
                  onChangeText={(v) => {
                    setEmpName(v);
                    if (errors.empName) setErrors((prev) => ({ ...prev, empName: '' }));
                  }}
                  iconLeft="person"
                  error={errors.empName}
                />

                <AppTextInput
                  label="Father / Guardian Name"
                  placeholder="e.g. Suresh Kumar"
                  value={empFatherName}
                  onChangeText={setEmpFatherName}
                />

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setShowDatePicker(true)}
                >
                  <View pointerEvents="none">
                    <AppTextInput
                      label="Date of Birth"
                      placeholder="Select Date of Birth (DD/MM/YYYY)"
                      value={dob}
                      editable={false}
                      iconLeft="calendar"
                      error={errors.dob}
                    />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setShowJoiningDatePicker(true)}
                >
                  <View pointerEvents="none">
                    <AppTextInput
                      label="Joining Date *"
                      placeholder="Select Joining Date (DD/MM/YYYY)"
                      value={joiningDate}
                      editable={false}
                      iconLeft="calendar"
                      error={errors.joiningDate}
                    />
                  </View>
                </TouchableOpacity>

                <AppTextInput
                  label="Mobile Number *"
                  placeholder="10-digit mobile number"
                  value={empMobile}
                  onChangeText={(v) => {
                    const clean = v.replace(/\D/g, '').slice(0, 10);
                    setEmpMobile(clean);
                    if (errors.empMobile) setErrors((prev) => ({ ...prev, empMobile: '' }));
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                  iconLeft="phone"
                  error={errors.empMobile}
                />

                <AppTextInput
                  label="Email Address"
                  placeholder="worker@example.com (for sending credentials)"
                  value={empEmail}
                  onChangeText={(v) => {
                    setEmpEmail(v);
                    if (errors.empEmail) setErrors((prev) => ({ ...prev, empEmail: '' }));
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  iconLeft="mail"
                  error={errors.empEmail}
                />

                {/* Checkbox to Mail Credentials */}
                <TouchableOpacity
                  style={[styles.checkboxRow, sendCredentialsEmail && styles.checkboxRowActive]}
                  onPress={() => setSendCredentialsEmail((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkboxBox, sendCredentialsEmail && styles.checkboxBoxActive]}>
                    {sendCredentialsEmail ? <AppIcon name="check" size={12} color="#FFFFFF" /> : null}
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.checkboxLabel}>Send Login ID & Password to Email</Text>
                    <Text style={styles.checkboxHint}>
                      Worker will receive their User ID and Password via email upon creation
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Gender Segmented Selection */}
                <Text style={styles.inputLabel}>Gender</Text>
                <View style={styles.genderContainer}>
                  <TouchableOpacity
                    style={[styles.genderBtn, gender === 'Male' && styles.genderBtnActive]}
                    onPress={() => setGender('Male')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.genderBtnText, gender === 'Male' && styles.genderBtnTextActive]}>
                      Male
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.genderBtn, gender === 'Female' && styles.genderBtnActive]}
                    onPress={() => setGender('Female')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.genderBtnText, gender === 'Female' && styles.genderBtnTextActive]}>
                      Female
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Blood Group Selection */}
                <Text style={styles.dropdownLabel}>Blood Group *</Text>
                {errors.bloodGroup ? (
                  <Text style={{ color: '#EF4444', fontSize: 11, marginBottom: 4, fontWeight: '600' }}>
                    {errors.bloodGroup}
                  </Text>
                ) : null}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.chipsScroll, { marginBottom: 12 }]}>
                  <View style={styles.chipsRow}>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => {
                      const isSel = bloodGroup === bg;
                      return (
                        <TouchableOpacity
                          key={bg}
                          style={[styles.selectChip, isSel && styles.selectChipActive]}
                          onPress={() => {
                            setBloodGroup(bg);
                            if (errors.bloodGroup) setErrors((prev) => ({ ...prev, bloodGroup: '' }));
                          }}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.selectChipText, isSel && styles.selectChipTextActive]}>
                            {bg}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                <AppTextInput
                  label="Initial Password *"
                  placeholder="Min 9 chars (e.g. Staff@1234)"
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  isPassword
                  iconLeft="lock"
                  error={errors.password}
                  helperText="Worker login password (min 9 characters, e.g. Staff@1234)"
                />
                <PasswordStrengthMeter password={password} minChars={9} />
              </View>
            )}

            {/* STEP 2: WORKER PHOTO & KYC DOCUMENTS */}
            {currentStep === 2 && (
              <View style={styles.formCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconBox}>
                    <AppIcon name="shield" size={18} color="#0F766E" />
                  </View>
                  <View style={styles.cardHeaderTextWrap}>
                    <Text style={styles.sectionTitle}>Verification & KYC Documents</Text>
                    <Text style={styles.sectionSubtitle}>
                      Passport photo and identity credentials
                    </Text>
                  </View>
                </View>

                {/* A. Worker Passport Photo Avatar */}
                <View style={styles.photoSection}>
                  <View
                    style={[
                      styles.photoAvatarWrap,
                      workerPhoto ? styles.photoAvatarWrapReady : null,
                    ]}
                  >
                    {workerPhoto ? (
                      <Image
                        source={{ uri: workerPhoto.uri }}
                        style={styles.photoImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <AppIcon name="camera" size={32} color="#94A3B8" />
                    )}
                  </View>

                  <Text style={styles.photoLabel}>Passport Size Photo</Text>
                  <Text style={styles.photoHelperText}>
                    {workerPhoto
                      ? '✓ Profile photo ready for worker profile'
                      : 'Capture live camera snapshot or upload from gallery'}
                  </Text>

                  <View style={styles.photoButtonsRow}>
                    <TouchableOpacity
                      style={[styles.photoActionBtn, workerPhoto && styles.photoActionBtnActive]}
                      onPress={() => handleCaptureCamera('photo')}
                      activeOpacity={0.8}
                    >
                      <AppIcon name="camera" size={14} color="#0F766E" />
                      <Text style={styles.photoActionBtnText}>Camera</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.photoActionBtn, workerPhoto && styles.photoActionBtnActive]}
                      onPress={() => handlePickGallery('photo')}
                      activeOpacity={0.8}
                    >
                      <AppIcon name="image" size={14} color="#0F766E" />
                      <Text style={styles.photoActionBtnText}>Gallery</Text>
                    </TouchableOpacity>
                  </View>

                  {workerPhoto ? (
                    <TouchableOpacity
                      style={styles.removePhotoBtn}
                      onPress={() => setWorkerPhoto(null)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.removePhotoBtnText}>✕ Remove Photo</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* B. Aadhaar Card Row */}
                <View style={styles.docRowCard}>
                  <View style={[styles.docThumbnailWrap, aadharDoc ? styles.docThumbnailWrapReady : null]}>
                    {aadharDoc ? (
                      <Image source={{ uri: aadharDoc.uri }} style={styles.docThumbImage} resizeMode="cover" />
                    ) : (
                      <AppIcon name="id-card" size={24} color="#94A3B8" />
                    )}
                  </View>
                  <View style={styles.docInfoCol}>
                    <View style={styles.docTitleRow}>
                      <Text style={styles.docTitleText}>Aadhaar Card</Text>
                      {aadharDoc ? (
                        <View style={styles.docBadgeReady}>
                          <Text style={styles.docBadgeReadyText}>✓ Attached</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.docSubtitleText} numberOfLines={1}>
                      {aadharDoc ? aadharDoc.name : 'Upload front/scan of Aadhaar'}
                    </Text>
                    <View style={styles.docActionsRow}>
                      <TouchableOpacity
                        style={[styles.docActionBtn, aadharDoc && styles.docActionBtnActive]}
                        onPress={() => handleCaptureCamera('aadhar')}
                        activeOpacity={0.8}
                      >
                        <AppIcon name="camera" size={11} color="#0F766E" />
                        <Text style={styles.docActionBtnText}>Camera</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.docActionBtn, aadharDoc && styles.docActionBtnActive]}
                        onPress={() => handlePickGallery('aadhar')}
                        activeOpacity={0.8}
                      >
                        <AppIcon name="image" size={11} color="#0F766E" />
                        <Text style={styles.docActionBtnText}>Gallery</Text>
                      </TouchableOpacity>
                      {aadharDoc ? (
                        <TouchableOpacity
                          style={styles.docRemoveBtn}
                          onPress={() => setAadharDoc(null)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.docRemoveBtnText}>Remove</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                </View>

                {/* C. PAN Card Row */}
                <View style={styles.docRowCard}>
                  <View style={[styles.docThumbnailWrap, panDoc ? styles.docThumbnailWrapReady : null]}>
                    {panDoc ? (
                      <Image source={{ uri: panDoc.uri }} style={styles.docThumbImage} resizeMode="cover" />
                    ) : (
                      <AppIcon name="document" size={24} color="#94A3B8" />
                    )}
                  </View>
                  <View style={styles.docInfoCol}>
                    <View style={styles.docTitleRow}>
                      <Text style={styles.docTitleText}>PAN Card</Text>
                      {panDoc ? (
                        <View style={styles.docBadgeReady}>
                          <Text style={styles.docBadgeReadyText}>✓ Attached</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.docSubtitleText} numberOfLines={1}>
                      {panDoc ? panDoc.name : 'Upload front/scan of PAN'}
                    </Text>
                    <View style={styles.docActionsRow}>
                      <TouchableOpacity
                        style={[styles.docActionBtn, panDoc && styles.docActionBtnActive]}
                        onPress={() => handleCaptureCamera('pan')}
                        activeOpacity={0.8}
                      >
                        <AppIcon name="camera" size={11} color="#0F766E" />
                        <Text style={styles.docActionBtnText}>Camera</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.docActionBtn, panDoc && styles.docActionBtnActive]}
                        onPress={() => handlePickGallery('pan')}
                        activeOpacity={0.8}
                      >
                        <AppIcon name="image" size={11} color="#0F766E" />
                        <Text style={styles.docActionBtnText}>Gallery</Text>
                      </TouchableOpacity>
                      {panDoc ? (
                        <TouchableOpacity
                          style={styles.docRemoveBtn}
                          onPress={() => setPanDoc(null)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.docRemoveBtnText}>Remove</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* STEP 3: SITE UNIT & ROLE DEPLOYMENT */}
            {currentStep === 3 && (
              <View style={styles.formCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconBox}>
                    <AppIcon name="pin" size={18} color="#0F766E" />
                  </View>
                  <View style={styles.cardHeaderTextWrap}>
                    <Text style={styles.sectionTitle}>Deployment & Assignment</Text>
                    <Text style={styles.sectionSubtitle}>
                      Site Unit, Designation, Department and Location
                    </Text>
                  </View>
                </View>

                {/* Unit Selector Chips */}
                <Text style={styles.dropdownLabel}>Deploy to Site Unit *</Text>
                {errors.selectedUnitCode ? (
                  <Text style={{ color: '#EF4444', fontSize: 11, marginBottom: 4, fontWeight: '600' }}>
                    {errors.selectedUnitCode}
                  </Text>
                ) : null}
                {unitsList.length === 0 ? (
                  <Text style={{ color: '#EF4444', fontSize: 12, marginBottom: 8 }}>
                    No active units found. Please create a Site Unit first.
                  </Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                    <View style={styles.chipsRow}>
                      {unitsList.map((u) => {
                        const isSel = selectedUnitCode === u.unit_code;
                        return (
                          <TouchableOpacity
                            key={u.id}
                            style={[styles.selectChip, isSel && styles.selectChipActive]}
                            onPress={() => {
                              setSelectedUnitCode(u.unit_code);
                              if (errors.selectedUnitCode) setErrors((prev) => ({ ...prev, selectedUnitCode: '' }));
                              if (u.unit_city) setCity(u.unit_city);
                              if (u.state_name) setState(u.state_name);
                            }}
                            activeOpacity={0.75}
                          >
                            <Text style={[styles.selectChipText, isSel && styles.selectChipTextActive]}>
                              {u.unit_name} ({u.unit_code})
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                )}

                {/* Role Selector Chips */}
                <Text style={[styles.dropdownLabel, { marginTop: 12 }]}>Assign Role / Designation *</Text>
                {errors.selectedRole ? (
                  <Text style={{ color: '#EF4444', fontSize: 11, marginBottom: 4, fontWeight: '600' }}>
                    {errors.selectedRole}
                  </Text>
                ) : null}
                {rolesList.length === 0 ? (
                  <Text style={{ color: '#EF4444', fontSize: 12, marginBottom: 8 }}>
                    No roles found. Please create a role in Create Role first.
                  </Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                    <View style={styles.chipsRow}>
                      {rolesList.map((r, idx) => {
                        const isSel = selectedRole === r;
                        return (
                          <TouchableOpacity
                            key={idx}
                            style={[styles.selectChip, isSel && styles.selectChipActive]}
                            onPress={() => {
                              setSelectedRole(r);
                              if (errors.selectedRole) setErrors((prev) => ({ ...prev, selectedRole: '' }));
                            }}
                            activeOpacity={0.75}
                          >
                            <Text style={[styles.selectChipText, isSel && styles.selectChipTextActive]}>
                              {r}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                )}

                {/* Department Selector Chips */}
                <Text style={[styles.dropdownLabel, { marginTop: 12 }]}>Department *</Text>
                {errors.deptCode ? (
                  <Text style={{ color: '#EF4444', fontSize: 11, marginBottom: 4, fontWeight: '600' }}>
                    {errors.deptCode}
                  </Text>
                ) : null}
                {departmentsList.length === 0 ? (
                  <Text style={{ color: '#EF4444', fontSize: 12, marginBottom: 8 }}>
                    No departments found. Please create a department first.
                  </Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                    <View style={styles.chipsRow}>
                      {departmentsList.map((d, idx) => {
                        const isSel = deptCode === d.dept_code;
                        return (
                          <TouchableOpacity
                            key={`${d.dept_code}-${idx}`}
                            style={[styles.selectChip, isSel && styles.selectChipActive]}
                            onPress={() => {
                              setDeptCode(d.dept_code);
                              if (errors.deptCode) setErrors((prev) => ({ ...prev, deptCode: '' }));
                            }}
                            activeOpacity={0.75}
                          >
                            <Text style={[styles.selectChipText, isSel && styles.selectChipTextActive]}>
                              {d.dept_name === d.dept_code ? d.dept_name : `${d.dept_name} (${d.dept_code})`}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                )}

                {/* State & City Dropdown Selectors */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  {/* State Dropdown Selector */}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.pickerLabel}>State</Text>
                    <TouchableOpacity
                      style={styles.selectorBox}
                      activeOpacity={0.75}
                      onPress={() => {
                        Keyboard.dismiss();
                        setStatePickerVisible(true);
                        if (availableStates.length === 0) fetchStates();
                      }}
                    >
                      <Text
                        style={state ? styles.selectorBoxText : styles.selectorBoxPlaceholder}
                        numberOfLines={1}
                      >
                        {state || 'Select State'}
                      </Text>
                      <AppIcon name="chevron-down" size={14} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  {/* City Dropdown Selector */}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.pickerLabel}>City</Text>
                    <TouchableOpacity
                      style={styles.selectorBox}
                      activeOpacity={0.75}
                      onPress={() => {
                        Keyboard.dismiss();
                        if (!state.trim()) {
                          showToast({
                            type: 'warning',
                            title: 'Select State First',
                            message: 'Please choose a State before selecting City.',
                          });
                          return;
                        }
                        setCitySearch('');
                        setCityPickerVisible(true);
                        fetchCitiesForState(state);
                      }}
                    >
                      <Text
                        style={city ? styles.selectorBoxText : styles.selectorBoxPlaceholder}
                        numberOfLines={1}
                      >
                        {city || 'Select City'}
                      </Text>
                      <AppIcon name="chevron-down" size={14} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Wizard Navigation Button Row (Back & Next / Submit) */}
            <View style={styles.buttonRow}>
              {currentStep > 1 && (
                <TouchableOpacity
                  style={styles.prevButton}
                  activeOpacity={0.8}
                  onPress={() => setCurrentStep((prev) => (prev - 1) as any)}
                >
                  <AppIcon name="arrow-back" size={16} color="#475569" />
                  <Text style={styles.prevButtonText}>Back</Text>
                </TouchableOpacity>
              )}

              {currentStep < 3 ? (
                <TouchableOpacity
                  style={styles.nextButton}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (currentStep === 1 && validateStep1()) {
                      setCurrentStep(2);
                    } else if (currentStep === 2 && validateStep2()) {
                      setCurrentStep(3);
                    }
                  }}
                >
                  <Text style={styles.nextButtonText}>Next Step</Text>
                  <AppIcon name="arrow-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.nextButton, { backgroundColor: '#0F766E' }]}
                  activeOpacity={0.8}
                  onPress={handleRegisterEmployee}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.nextButtonText}>Deploy Worker</Text>
                      <AppIcon name="check" size={16} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Confirmation Alert Modal */}
      <CustomAlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={[
          {
            text: 'OK',
            style: 'default',
            onPress: () => {
              if (alertConfig.onConfirm) alertConfig.onConfirm();
              else setAlertConfig((prev) => ({ ...prev, visible: false }));
            },
          },
        ]}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />

      {/* Date Picker Modal for Date of Birth Selection */}
      <DatePickerModal
        visible={showDatePicker}
        title="Select Date of Birth"
        initialDate={backendDob || '1995-01-01'}
        maxYear={new Date().getFullYear() - 14}
        minYear={1950}
        onClose={() => setShowDatePicker(false)}
        onSelect={(formatted, date) => {
          setDob(formatted);
          const yyyy = date.getFullYear();
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const dd = String(date.getDate()).padStart(2, '0');
          setBackendDob(`${yyyy}-${mm}-${dd}`);
          if (errors.dob) setErrors((prev) => ({ ...prev, dob: '' }));
        }}
      />

      {/* Date Picker Modal for Joining Date Selection */}
      <DatePickerModal
        visible={showJoiningDatePicker}
        title="Select Joining Date"
        initialDate={backendJoiningDate || new Date().toISOString().split('T')[0]}
        maxYear={new Date().getFullYear() + 1}
        minYear={2000}
        onClose={() => setShowJoiningDatePicker(false)}
        onSelect={(formatted, date) => {
          setJoiningDate(formatted);
          const yyyy = date.getFullYear();
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const dd = String(date.getDate()).padStart(2, '0');
          setBackendJoiningDate(`${yyyy}-${mm}-${dd}`);
          if (errors.joiningDate) setErrors((prev) => ({ ...prev, joiningDate: '' }));
        }}
      />

      {/* State Picker Modal */}
      <Modal
        visible={statePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStatePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setStatePickerVisible(false)}
          />
          <View style={[styles.pickerSheetContent, { paddingBottom: bottomInset + 10 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setStatePickerVisible(false)}
              >
                <AppIcon name="close" size={16} color="#0F766E" />
              </TouchableOpacity>
            </View>

            <AppTextInput
              placeholder="Search state..."
              value={stateSearch}
              onChangeText={setStateSearch}
              iconLeft="search"
              containerStyle={{ marginBottom: 10 }}
            />

            {loadingStates ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#0F766E" />
              </View>
            ) : (
              <FlatList
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: bottomInset + 30 }}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                initialNumToRender={15}
                maxToRenderPerBatch={15}
                windowSize={5}
                removeClippedSubviews={Platform.OS === 'android'}
                data={filteredStates}
                keyExtractor={(item, idx) => `${item.sName}-${idx}`}
                renderItem={({ item }) => {
                  const isSelected = state.toLowerCase() === item.sName.toLowerCase();
                  return (
                    <TouchableOpacity
                      style={[styles.pickerItem, isSelected ? styles.pickerItemActive : null]}
                      onPress={() => {
                        if (state.toLowerCase() !== item.sName.toLowerCase()) {
                          setCity('');
                          setAvailableCities([]);
                        }
                        setState(item.sName);
                        setStatePickerVisible(false);
                        fetchCitiesForState(item.sName);
                      }}
                    >
                      <Text style={styles.pickerItemText}>{item.sName}</Text>
                      {isSelected ? <AppIcon name="check" size={16} color="#0F766E" /> : null}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#64748B', fontSize: 12 }}>No states found.</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      {/* City Picker Modal (SQL-driven filtered by selected state) */}
      <Modal
        visible={cityPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCityPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setCityPickerVisible(false)}
          />
          <View style={[styles.pickerSheetContent, { paddingBottom: bottomInset + 10 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select City ({state})</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setCityPickerVisible(false)}
              >
                <AppIcon name="close" size={16} color="#0F766E" />
              </TouchableOpacity>
            </View>

            <AppTextInput
              placeholder="Search city..."
              value={citySearch}
              onChangeText={setCitySearch}
              iconLeft="search"
              containerStyle={{ marginBottom: 10 }}
            />

            {loadingCities && availableCities.length === 0 ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#0F766E" />
              </View>
            ) : (
              <FlatList
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: bottomInset + 30 }}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                initialNumToRender={15}
                maxToRenderPerBatch={15}
                windowSize={5}
                removeClippedSubviews={Platform.OS === 'android'}
                data={filteredCities}
                keyExtractor={(item, idx) => `${item}-${idx}`}
                renderItem={({ item }) => {
                  const isSelected = city.toLowerCase() === item.toLowerCase();
                  return (
                    <TouchableOpacity
                      style={[styles.pickerItem, isSelected ? styles.pickerItemActive : null]}
                      onPress={() => {
                        setCity(item);
                        setCityPickerVisible(false);
                      }}
                    >
                      <Text style={styles.pickerItemText}>{item}</Text>
                      {isSelected ? <AppIcon name="check" size={16} color="#0F766E" /> : null}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={{ padding: 20, alignItems: 'center', gap: 10 }}>
                    <Text style={{ color: '#64748B', fontSize: 12, textAlign: 'center' }}>
                      {citySearch.trim()
                        ? `No city matched "${citySearch.trim()}".`
                        : `No cities found for ${state}.`}
                    </Text>
                    {citySearch.trim() ? (
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#0F766E',
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 8,
                        }}
                        onPress={() => {
                          setCity(citySearch.trim());
                          setCityPickerVisible(false);
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
                          Use "{citySearch.trim()}"
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </AppScreenContainer>
  );
};
