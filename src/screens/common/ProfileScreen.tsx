import React, { useState, useEffect } from 'react';
import { View, Text, Image, RefreshControl, TouchableOpacity, LayoutAnimation, Platform, UIManager, Modal, TouchableWithoutFeedback, ScrollView, Keyboard, useWindowDimensions } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './ProfileScreen.styles';
import { AppScreenContainer, AppIcon, AppTextInput, AppButton, PasswordStrengthMeter } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import { useTenantStore } from '../../store/tenantStore';
import { useNavigation } from '../../navigation/navigationContext';
import { staffApi, apiClient, authApi } from '../../api';
import { ANDROID_API_KEY } from '../../api/config';
import { showToast } from '../../store/toastStore';
import { colors } from '../../theme/colors';
import { ms } from '../../theme/responsive';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// In-memory persistent cache for instant loading without flicker
let cachedProfileData: {
  empCode: string;
  salaryInfo: any;
  profileData: any;
  profileScope: any;
  avatarSource?: any;
} | null = null;

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { currentUser, logout, updateCurrentUser } = useAuthStore();
  const { currentCompany } = useTenantStore();
  const { goBack } = useNavigation();

  const isCompanyAdmin =
    String(currentUser?.role || '').toUpperCase() === 'COMPANY_ADMIN' ||
    String(currentUser?.role || '').toUpperCase() === 'SUPERADMIN' ||
    String(currentUser?.backendRole || '').toLowerCase().includes('company');

  const empCode = currentUser?.empCode || currentUser?.username || '';
  const brandColor = currentCompany?.brandColor || colors.primary;

  // Strictly match cache to current empCode so previous user's data NEVER leaks
  const validCache = cachedProfileData && cachedProfileData.empCode === empCode ? cachedProfileData : null;

  const [salaryInfo, setSalaryInfo] = useState<any | null>(validCache?.salaryInfo ?? null);
  const [profileData, setProfileData] = useState<any | null>(validCache?.profileData ?? null);
  const [profileScope, setProfileScope] = useState<any | null>(
    (currentUser as any)?.scope || validCache?.profileScope || null
  );
  const [avatarSource, setAvatarSource] = useState<any | null>(
    validCache?.avatarSource ?? (currentUser?.avatarUrl ? { uri: currentUser.avatarUrl } : null)
  );
  const [avatarError, setAvatarError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isPhotoModalVisible, setIsPhotoModalVisible] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // ─── Photo Picker Handlers ──────────────────────────────────────────
  const handleTakePhoto = () => {
    setIsPhotoModalVisible(false);
    setTimeout(() => {
      launchCamera(
        {
          mediaType: 'photo',
          cameraType: 'front',
          quality: 0.6,
          maxWidth: 1024,
          maxHeight: 1024,
          includeBase64: true,
          saveToPhotos: false,
        },
        async (response) => {
          if (response.assets && response.assets.length > 0) {
            const asset = response.assets[0];
            if (asset.uri) {
              await processNewAvatar(asset.uri, asset.base64);
            }
          }
        }
      );
    }, 250);
  };

  const handleChooseFromGallery = () => {
    setIsPhotoModalVisible(false);
    setTimeout(() => {
      launchImageLibrary(
        {
          mediaType: 'photo',
          quality: 0.6,
          maxWidth: 1024,
          maxHeight: 1024,
          includeBase64: true,
        },
        async (response) => {
          if (response.assets && response.assets.length > 0) {
            const asset = response.assets[0];
            if (asset.uri) {
              await processNewAvatar(asset.uri, asset.base64);
            }
          }
        }
      );
    }, 250);
  };

  const handleRemovePhoto = () => {
    setIsPhotoModalVisible(false);
    setAvatarSource(null);
    setAvatarError(false);
    updateCurrentUser({ avatarUrl: undefined });
    if (cachedProfileData) {
      cachedProfileData.avatarSource = null;
    }
    showToast({
      type: 'info',
      title: 'Photo Reset',
      message: 'Profile photo has been reset to default initials.',
    });
  };

  const processNewAvatar = async (uri: string, base64?: string) => {
    setUploadingPhoto(true);
    const newSrc = { uri };
    setAvatarSource(newSrc);
    setAvatarError(false);
    updateCurrentUser({ avatarUrl: uri });
    if (cachedProfileData) {
      cachedProfileData.avatarSource = newSrc;
    }

    showToast({
      type: 'success',
      title: 'Profile Photo Updated',
      message: 'Photo updated and syncing with web portal...',
    });

    // Dual-sync to backend database so photo saves in Web Portal (Employee Master & Docs)
    try {
      if (empCode) {
        const uploadPromises: Promise<any>[] = [];

        // 1. Upload via modern EmployeeDocument API (for Web Employee Master Documents tab)
        uploadPromises.push(
          staffApi
            .uploadEmployeeDoc(
              empCode,
              'Original Photo(Passport Size)',
              uri,
              `photo_${empCode}.jpg`
            )
            .catch((err) => console.warn('[ProfileScreen] Employee doc upload note:', err))
        );

        // 2. Upload via Mobile Service API (for Web Android Document Verification queue)
        if (base64) {
          uploadPromises.push(
            staffApi
              .uploadMobilePhoto(empCode, base64)
              .catch((err) => console.warn('[ProfileScreen] Mobile photo upload note:', err))
          );
        }

        await Promise.allSettled(uploadPromises);
      }
    } catch (e) {
      console.warn('Background avatar upload note:', e);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Accordion Dropdown toggles
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    identity: true,
    site: true,
    personal: false,
    kyc: false,
    salary: false,
    security: false,
  });

  // Change Password States
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      if (Platform.OS === 'android') {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      if (Platform.OS === 'android') {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleChangePassword = async () => {
    setPasswordError(null);
    const cleanOld = oldPassword.trim();
    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanOld) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (!cleanNew) {
      setPasswordError('Please enter a new password.');
      return;
    }

    if (cleanNew.length < 9) {
      setPasswordError('New password must be at least 9 characters (e.g. Staff@1234).');
      return;
    }

    if (cleanNew === cleanOld) {
      setPasswordError('New password cannot be the same as your current password.');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setPasswordError('New password and Confirm password do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await authApi.changePassword(cleanOld, cleanNew);
      setIsChangingPassword(false);

      if (res.success) {
        setIsPasswordModalVisible(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError(null);

        showToast({
          type: 'success',
          title: 'Password Changed Successfully',
          message: 'Your password has been updated. Please log in with your new password.',
        });

        // Backend terminates session on password change; log out on client
        setTimeout(() => {
          logout();
        }, 1200);
      } else {
        let errMessage = 'Failed to change password. Please check your current password.';
        const raw = res.error || (res.data as any)?.detail;
        if (typeof raw === 'string') {
          errMessage = raw;
        } else if (Array.isArray(raw)) {
          errMessage = raw.join(' ');
        } else if (typeof raw === 'object' && raw !== null) {
          errMessage = Object.values(raw).flat().join(' ');
        }
        setPasswordError(errMessage);
        showToast({
          type: 'error',
          title: 'Password Change Failed',
          message: errMessage,
        });
      }
    } catch (err: any) {
      setIsChangingPassword(false);
      const msg = err?.message || 'Network error while changing password.';
      setPasswordError(msg);
      showToast({
        type: 'error',
        title: 'Error',
        message: msg,
      });
    }
  };

  const toggleSection = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const loadProfileData = async () => {
    try {
      if (empCode) {
        console.log(`[API CALL] 🌐 Profile Sync for emp_code=${empCode}`);
        const [salRes, meRes, userDetailsRes, hrEmployeesRes, kycRes, docsRes, modernDocsRes] = await Promise.allSettled([
          staffApi.getSalaryDetails(empCode),
          apiClient.request('/api/auth/me/'),
          apiClient.get<any>(`/api/mobile/GetUserDetails/?userName=${encodeURIComponent(empCode)}`, {
            'X-API-Key': ANDROID_API_KEY,
          }),
          apiClient.get<any>(`/api/hr/employees/?search=${encodeURIComponent(empCode)}`),
          staffApi.getEmployeeKyc(empCode),
          staffApi.getDocumentsStatus(empCode),
          staffApi.getEmployeeDocuments(empCode),
        ]);

        // Always start fresh for the current empCode so previous user's state never leaks
        let newSal: any = null;
        let newScope: any = (currentUser as any)?.scope || null;
        let newProf: any = null;
        let newAvatar: any = currentUser?.avatarUrl ? { uri: currentUser.avatarUrl } : null;
        let resolvedPhotoPath: string | null = null;

        // 1. Process HR Employees Master record from SQL (pay_employee_master)
        if (hrEmployeesRes.status === 'fulfilled' && hrEmployeesRes.value.success && hrEmployeesRes.value.data) {
          const raw = hrEmployeesRes.value.data;
          const list = Array.isArray(raw) ? raw : raw.results || [raw];
          const cleanEmp = empCode.trim().toLowerCase();
          const match = list.find((e: any) => String(e.emp_code || '').trim().toLowerCase() === cleanEmp);
          console.log(`[API RESPONSE] 📥 GET /api/hr/employees/?search=${empCode} -> Match: ${match ? match.emp_code : 'None'}`);
          if (match) {
            resolvedPhotoPath = match.photo || match.emp_photo || match.image || match.profile_image || null;
            newProf = {
              ...newProf,
              emp_name: match.emp_name || newProf?.emp_name,
              emp_code: match.emp_code || empCode,
              father_name: match.emp_father_name || newProf?.father_name,
              designation: match.designation_code || match.grade_code || newProf?.designation,
              unit_name: match.unit_name || newProf?.unit_name,
              unit_code: match.unit_code || newProf?.unit_code,
              client_code: match.client_code || newProf?.client_code,
              client_name: match.client_name || newProf?.client_name,
              emp_mobile_no: match.emp_mobile_no || newProf?.emp_mobile_no,
              emp_email_id: match.emp_email_id || newProf?.emp_email_id,
              emp_current_address: match.emp_current_address || newProf?.emp_current_address,
              emp_current_city: match.emp_current_city || newProf?.emp_current_city,
              emp_current_state: match.emp_current_state || newProf?.emp_current_state,
              emp_current_pin: match.emp_current_pin || newProf?.emp_current_pin,
              joining_date: match.joining_date || newProf?.joining_date,
              birth_date: match.birth_date || newProf?.birth_date,
              confirmation_date: match.confirmation_date || newProf?.confirmation_date,
              gender: match.gender || newProf?.gender,
              bank_branch: match.bank_branch || newProf?.bank_branch,
              shift_time: match.in_time || newProf?.shift_time,
            };
          }
        }

        // 2. Process Mobile GetUserDetails from SQL
        if (userDetailsRes.status === 'fulfilled' && userDetailsRes.value.success && userDetailsRes.value.data) {
          const uList = userDetailsRes.value.data;
          const uData = Array.isArray(uList) ? uList[0] : uList;
          if (uData && uData.EMP_NAME && uData.EMP_NAME.trim()) {
            const resolvedName = uData.EMP_NAME.trim();
            newProf = {
              ...newProf,
              emp_name: resolvedName,
              emp_code: uData.EMP_CODE || empCode,
              unit_name: uData.UNIT_NAME || newProf?.unit_name,
              joining_date: uData.JOINING_DATE || newProf?.joining_date,
              birth_date: uData.BIRTH_DATE || newProf?.birth_date,
              gender: uData.GENDER || newProf?.gender,
              company_name: uData.COMP_NAME || newProf?.company_name,
              shift_time: uData.SHIFT_TIME || newProf?.shift_time,
              emp_mobile_no: uData.EMP_MOBILE_NO || newProf?.emp_mobile_no,
              unit_code: uData.UNIT_CODE || newProf?.unit_code,
              client_code: uData.CLIENT_CODE || newProf?.client_code,
              designation: newProf?.designation || uData.GRADE_CODE || 'Staff',
            };
            if (!isCompanyAdmin && currentUser && currentUser.name !== resolvedName) {
              useAuthStore.getState().updateCurrentUser({ name: resolvedName });
            }
            if (uData.JOINING_DATE && currentUser && currentUser.joiningDate !== uData.JOINING_DATE) {
              useAuthStore.getState().updateCurrentUser({ joiningDate: uData.JOINING_DATE });
            }
          }
        }

        // 3. Process Modern hr_employee_kyc record from SQL
        if (kycRes.status === 'fulfilled' && kycRes.value.success && kycRes.value.data) {
          const kRaw = kycRes.value.data;
          const kList = Array.isArray(kRaw) ? kRaw : (kRaw as any).results || [kRaw];
          const cleanEmp = empCode.trim().toLowerCase();
          const kMatch = kList.find((k: any) => String(k.emp_code || '').trim().toLowerCase() === cleanEmp);
          if (kMatch) {
            newProf = {
              ...newProf,
              bank_account_no: kMatch.bank_account_masked || newProf?.bank_account_no,
              ifsc_code: kMatch.ifsc || newProf?.ifsc_code,
              bank_branch: kMatch.bank_name || newProf?.bank_branch,
              pan_number: kMatch.pan_masked || newProf?.pan_number,
              aadhaar_number: kMatch.aadhaar_masked || (newProf as any)?.aadhaar_number,
              bank_status: kMatch.bank_status || (newProf as any)?.bank_status,
              bank_approve: kMatch.bank_approve,
            };
          }
        }

        // 4. Resolve Employee Photo from modern employee documents (hr_employee_document / employee_documents)
        if (!resolvedPhotoPath && modernDocsRes.status === 'fulfilled' && modernDocsRes.value.success && modernDocsRes.value.data) {
          const mRaw = modernDocsRes.value.data;
          const mList: any[] = Array.isArray(mRaw) ? mRaw : (mRaw as any).results || [];
          const mPhoto = mList.find((d: any) => {
            const key = String(d.document_type || d.image_name || '').toLowerCase();
            return (key.includes('photo') || key.includes('passport')) && (d.file || d.file_url || d.image_path || d.image_url);
          });
          if (mPhoto) {
            resolvedPhotoPath = mPhoto.file || mPhoto.file_url || mPhoto.image_path || mPhoto.image_url;
          }
        }

        // 4b. Fallback to legacy verification documents (hr_document_verification)
        if (!resolvedPhotoPath && docsRes.status === 'fulfilled' && docsRes.value.success && docsRes.value.data) {
          const dRaw = docsRes.value.data;
          const dList: any[] = Array.isArray(dRaw) ? dRaw : (dRaw as any).results || [];
          const photoDoc = dList.find((d: any) => {
            const key = String(d.image_name || d.document_type || d.image_raw || '').toLowerCase();
            return (
              key.includes('photo') ||
              key.includes('passport') ||
              key === 'passprt_size_photo' ||
              key === 'employee_photo_upload'
            ) && (d.file_url || d.image_path || d.image_url || d.file);
          });
          if (photoDoc) {
            resolvedPhotoPath = photoDoc.file_url || photoDoc.image_path || photoDoc.image_url || photoDoc.file;
          }
        }

        // 5. Fallback from Mobile GetUserDetails for photo
        if (!resolvedPhotoPath && userDetailsRes.status === 'fulfilled' && userDetailsRes.value.success && userDetailsRes.value.data) {
          const uList = userDetailsRes.value.data;
          const uData = Array.isArray(uList) ? uList[0] : uList;
          if (uData) {
            const rawDept = String(uData.DEPT_CODE || '').trim();
            const looksLikeImg =
              rawDept.toLowerCase().endsWith('.jpg') ||
              rawDept.toLowerCase().endsWith('.png') ||
              rawDept.toLowerCase().endsWith('.jpeg') ||
              rawDept.includes('/') ||
              rawDept.toLowerCase().includes('photo') ||
              rawDept.toLowerCase().includes('emp_images') ||
              rawDept.toLowerCase().includes('temp_images');
            const candidate =
              uData.EMP_PHOTO ||
              uData.PHOTO ||
              uData.IMAGE_PATH ||
              (looksLikeImg ? rawDept : null);
            if (candidate) {
              resolvedPhotoPath = candidate;
            }
          }
        }

        // 6. Direct deterministic fallback for verified web portal uploads:
        // /media/employee_documents/<comp_code>/<emp_code>/photo.jpg
        if (!resolvedPhotoPath && empCode) {
          const compCode = (currentUser as any)?.scope?.comp_code || (currentUser as any)?.companyId || 'C15';
          resolvedPhotoPath = `/media/employee_documents/${compCode}/${empCode}/photo.jpg`;
        }

        if (resolvedPhotoPath) {
          const imgSource = apiClient.getImageSource(resolvedPhotoPath);
          if (imgSource) {
            newAvatar = imgSource;
            setAvatarSource(imgSource);
            setAvatarError(false);
            if (!currentUser?.avatarUrl) {
              updateCurrentUser({ avatarUrl: imgSource.uri });
            }
          }
        }

        // 4. Fallback for Employee Name & Shift from Attendance Logs & Policies
        if (!newProf?.emp_name) {
          try {
            const logRes = await apiClient.get<any>(
              `/api/attendance/android-logs/?emp_code=${encodeURIComponent(empCode)}`
            );
            if (logRes.success && logRes.data) {
              const lList = Array.isArray(logRes.data) ? logRes.data : (logRes.data as any).results || [];
              const cleanEmp = empCode.trim().toLowerCase();
              const lMatch = lList.find((l: any) => String(l.emp_code || '').trim().toLowerCase() === cleanEmp);
              if (lMatch?.emp_name && lMatch.emp_name.trim()) {
                const resolvedLogName = lMatch.emp_name.trim();
                newProf = {
                  ...newProf,
                  emp_name: resolvedLogName,
                  emp_code: empCode,
                };
                if (!isCompanyAdmin && currentUser && currentUser.name !== resolvedLogName) {
                  useAuthStore.getState().updateCurrentUser({ name: resolvedLogName });
                }
              }
            }
          } catch {}
        }

        if (!newProf?.shift_time || newProf.shift_time.toLowerCase().includes('flexible')) {
          try {
            const assignRes = await apiClient.get<any>(
              `/api/attendance/assignments/?emp_code=${encodeURIComponent(empCode)}`
            );
            if (assignRes.success && assignRes.data) {
              const aList = Array.isArray(assignRes.data) ? assignRes.data : (assignRes.data as any).results || [];
              const myAssign = aList.find((a: any) => String(a.emp_code).toLowerCase() === empCode.toLowerCase()) || aList[0];
              if (myAssign?.policy_id) {
                const polRes = await apiClient.get<any>(
                  `/api/attendance/policies/?policy_id=${encodeURIComponent(myAssign.policy_id)}`
                );
                if (polRes.success && polRes.data) {
                  const pList = Array.isArray(polRes.data) ? polRes.data : (polRes.data as any).results || [];
                  const pol = pList.find((p: any) => String(p.policy_id).trim() === String(myAssign.policy_id).trim()) || pList[0];
                  if (pol?.shifts?.length > 0) {
                    const s0 = pol.shifts[0];
                    const formatH = (hVal: any) => {
                      const h = parseInt(String(hVal || '0'), 10);
                      if (isNaN(h)) return String(hVal);
                      const period = h >= 12 ? 'PM' : 'AM';
                      const h12 = h % 12 === 0 ? 12 : h % 12;
                      return `${String(h12).padStart(2, '0')}:00 ${period}`;
                    };
                    if (s0.in_time && s0.out_time) {
                      newProf = {
                        ...newProf,
                        shift_time: pol.policy_name
                          ? `${formatH(s0.in_time)} - ${formatH(s0.out_time)} (${pol.policy_name})`
                          : `${formatH(s0.in_time)} - ${formatH(s0.out_time)}`,
                      };
                    } else if (s0.in_time) {
                      newProf = {
                        ...newProf,
                        shift_time: pol.policy_name
                          ? `${formatH(s0.in_time)} (${pol.policy_name})`
                          : formatH(s0.in_time),
                      };
                    }
                  }
                }
              }
            }
          } catch {}
        }

        setProfileData(newProf);

        if (salRes.status === 'fulfilled' && salRes.value.success && salRes.value.data) {
          const list = (salRes.value.data as any).results || salRes.value.data;
          if (Array.isArray(list) && list.length > 0) {
            const cleanEmp = empCode.trim().toLowerCase();
            const salMatch = list.find((s: any) => !s.emp_code || String(s.emp_code).trim().toLowerCase() === cleanEmp);
            if (salMatch) {
              newSal = salMatch;
              setSalaryInfo(newSal);
            }
          }
        }

        if (meRes.status === 'fulfilled' && meRes.value.success && meRes.value.data) {
          const meData = meRes.value.data;
          if (meData.scope) {
            newScope = { ...newScope, ...meData.scope };
            setProfileScope(newScope);
          }
          if (meData.profile) {
            newProf = {
              ...newProf,
              ...meData.profile,
              emp_name: newProf?.emp_name || meData.profile?.emp_name,
            };
            setProfileData(newProf);
          }
        } else if (meRes.status === 'rejected' || (meRes.status === 'fulfilled' && !meRes.value.success)) {
          console.warn('[ProfileScreen] /api/auth/me/ sync skipped or pending');
        }

        // 4. Fetch real Unit Master from SQL /api/masters/units/ for real City, State, and Region
        const targetUnit = newScope?.unit_code || (currentUser as any)?.scope?.unit_code || currentUser?.branchOrUnit || '';
        const tLower = String(targetUnit).trim().toLowerCase();
        let matched: any = null;

        try {
          const unitsRes = await apiClient.get<any>(`/api/masters/units/`);
          if (unitsRes.success && unitsRes.data) {
            const uList = Array.isArray(unitsRes.data) ? unitsRes.data : (unitsRes.data as any).results || [];
            matched = uList.find(
              (u: any) =>
                String(u.unit_code || '').trim().toLowerCase() === tLower ||
                String(u.unit_name || '').trim().toLowerCase() === tLower
            ) || (uList.length === 1 ? uList[0] : null);
          }
        } catch (uErr) {
          console.warn('[ProfileScreen] Error fetching unit master:', uErr);
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

        if (!matched && KNOWN_UNITS_MAP[tLower]) {
          matched = KNOWN_UNITS_MAP[tLower];
        }

        if (matched) {
          newScope = {
            ...newScope,
            unit_code: matched.unit_code || newScope?.unit_code,
            unit_name: matched.unit_name || newScope?.unit_name,
            client_code: matched.client_code || newScope?.client_code,
            city: matched.unit_city || newScope?.city,
            state: matched.state_name || newScope?.state,
            region: matched.region || matched.state_name || newScope?.region,
            zone: matched.zone || newScope?.zone,
            location: matched.unit_add1 || matched.unit_add2 || matched.unit_city || newScope?.location,
          };
          newProf = {
            ...newProf,
            unit_name: matched.unit_name || newProf?.unit_name,
            unit_code: matched.unit_code || newProf?.unit_code,
            client_code: matched.client_code || newProf?.client_code,
            emp_current_city: matched.unit_city || newProf?.emp_current_city,
            emp_current_state: matched.state_name || newProf?.emp_current_state,
            address: matched.unit_add1 || matched.unit_add2 || newProf?.address,
          };
          setProfileScope(newScope);
          setProfileData(newProf);
        }

        cachedProfileData = {
          empCode,
          salaryInfo: newSal,
          profileData: newProf,
          profileScope: newScope,
          avatarSource: newAvatar,
        };
      }
    } catch (e) {
      console.warn('Could not refresh profile details:', e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (cachedProfileData && cachedProfileData.empCode !== empCode) {
      cachedProfileData = null;
      setSalaryInfo(null);
      setProfileData(null);
      setProfileScope((currentUser as any)?.scope || null);
      setAvatarSource(currentUser?.avatarUrl ? { uri: currentUser.avatarUrl } : null);
      setAvatarError(false);
    }
    loadProfileData();
  }, [empCode]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfileData();
  };

  if (!currentUser) {
    return null;
  }

  const employeeName = isCompanyAdmin
    ? (currentUser.name || currentUser.username)
    : (profileData?.emp_name && profileData.emp_name.trim())
    ? profileData.emp_name.trim()
    : (salaryInfo?.emp_name && salaryInfo.emp_name.trim())
    ? salaryInfo.emp_name.trim()
    : (currentUser.name && currentUser.name !== currentUser.username && currentUser.name !== 'Company Admin'
        ? currentUser.name
        : currentUser.username);

  const initials = employeeName
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const unitName = profileScope?.unit_name || profileData?.unit_name || currentUser.branchOrUnit || 'Not Assigned';
  const unitCode = profileScope?.unit_code || profileData?.unit_code || (currentUser as any)?.scope?.unit_code || 'N/A';
  const clientCode = profileScope?.client_code || profileData?.client_code || (currentUser as any)?.scope?.client_code || 'N/A';
  const companyCode = profileScope?.comp_code || currentUser.companyId || '—';

  const grossNum = parseFloat(salaryInfo?.month_total || '0');
  const grossSalary = salaryInfo?.month_total && !isNaN(grossNum) && grossNum > 0
    ? `₹${grossNum.toLocaleString('en-IN')}`
    : 'Not Configured';

  const ctcNum = parseFloat(salaryInfo?.ctc_amount || '0');
  const ctcSalary = salaryInfo?.ctc_amount && !isNaN(ctcNum) && ctcNum > 0
    ? `₹${ctcNum.toLocaleString('en-IN')}`
    : 'Not Configured';

  const d1 = parseFloat(salaryInfo?.dhead1 || '0') || 0;
  const d2 = parseFloat(salaryInfo?.dhead2 || '0') || 0;
  const d3 = parseFloat(salaryInfo?.dhead3 || '0') || 0;
  const netTakeHome = salaryInfo?.month_total && !isNaN(grossNum) && grossNum > 0
    ? `₹${Math.max(0, grossNum - (d1 + d2 + d3)).toLocaleString('en-IN')}`
    : 'Not Configured';

  return (
    <AppScreenContainer
      scrollable
      contentContainerStyle={styles.container}
      edges={['top', 'bottom']}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* ── Flush Edge-to-Edge Custom Header Exactly Matching Attendance Punch Header ── */}
      <View style={styles.customHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={goBack}
            style={styles.headerBackButton}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <AppIcon name="arrowLeft" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitleText}>My Profile</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={logout}
          style={styles.headerLogoutBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <AppIcon name="logout" size={17} color="#DC2626" />
        </TouchableOpacity>
      </View>

      {/* 1. HERO PROFILE CARD */}
      <View style={styles.heroCard}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setIsPhotoModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Edit profile photo"
          >
            <View style={[styles.avatarBadge, { backgroundColor: brandColor }]}>
              {avatarSource && !avatarError ? (
                <Image
                  source={avatarSource}
                  style={styles.avatarImage}
                  resizeMode="cover"
                  onError={() => {
                    if (currentUser?.avatarUrl && avatarSource?.uri !== currentUser.avatarUrl) {
                      setAvatarSource({ uri: currentUser.avatarUrl });
                    } else {
                      setAvatarError(true);
                    }
                  }}
                />
              ) : (
                <Text style={styles.avatarText}>{initials || currentUser.username?.substring(0, 2).toUpperCase() || 'U'}</Text>
              )}
            </View>
            <View style={styles.cameraBadgeOverlay}>
              <AppIcon name="camera" size={13} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <View style={styles.activeStatusPill} />
        </View>

        <Text style={styles.profileName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
          {employeeName}
        </Text>
        <Text style={styles.profileDesignation}>
          {profileData?.designation || currentUser.designation || 'Staff'}
        </Text>

        <View style={styles.badgeRow}>
          <View style={styles.companyTag}>
            <Text style={styles.companyTagText}>
              Branch: {unitCode} • Client: {clientCode}
            </Text>
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.heroActionRow}>
          <TouchableOpacity
            style={styles.heroActionBtn}
            onPress={() => setIsPhotoModalVisible(true)}
            activeOpacity={0.75}
          >
            <AppIcon name="camera" size={14} color="#334155" />
            <Text style={styles.heroActionText}>Update Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.heroActionBtn, styles.heroActionBtnPrimary]}
            onPress={() => {
              setPasswordError(null);
              setOldPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setIsPasswordModalVisible(true);
            }}
            activeOpacity={0.75}
          >
            <AppIcon name="lock" size={14} color="#4F46E5" />
            <Text style={[styles.heroActionText, styles.heroActionTextPrimary]}>Change Password</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. ACCORDION: EMPLOYMENT & JOB PROFILE */}
      <View style={styles.accordionCard}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleSection('identity')}
          activeOpacity={0.7}
        >
          <View style={styles.accordionTitleLeft}>
            <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <AppIcon name="briefcase" size={16} color="#2563EB" />
            </View>
            <View style={styles.accordionTitleCol}>
              <Text style={styles.accordionTitle}>Employee Identity & Job Profile</Text>
              <Text style={styles.accordionSummary}>Code: {empCode} • {profileData?.status || 'Active'}</Text>
            </View>
          </View>
          <View style={styles.chevronBox}>
            <AppIcon
              name={expandedSections.identity ? 'chevronUp' : 'chevronDown'}
              size={18}
              color="#64748B"
            />
          </View>
        </TouchableOpacity>

        {expandedSections.identity && (
          <View style={styles.accordionBody}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Employee Code</Text>
              <Text style={styles.infoValueHighlight}>{empCode}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Alternate NG GLOBAL Code</Text>
              <Text style={styles.infoValue}>{profileData?.ihmscode || profileData?.ihms_code || '-'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{employeeName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Designation</Text>
              <Text style={styles.infoValue}>{profileData?.designation || currentUser.designation || '-'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Security / Staff Grade</Text>
              <Text style={styles.infoValue}>{profileData?.grade_code || '-'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Employment Type</Text>
              <Text style={styles.infoValue}>{salaryInfo?.job_type || profileData?.employee_type || 'Regular'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Current Status</Text>
              <View style={styles.statusChipActive}>
                <View style={styles.statusDotActive} />
                <Text style={styles.statusChipActiveText}>{profileData?.status || 'Active'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Joining Date</Text>
              <Text style={styles.infoValue}>{profileData?.joining_date || '-'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Reporting Officer</Text>
              <Text style={styles.infoValue}>{profileData?.reporting_to || '-'}</Text>
            </View>
          </View>
        )}
      </View>

      {/* 3. ACCORDION: SITE, UNIT & SHIFT DEPLOYMENT */}
      <View style={styles.accordionCard}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleSection('site')}
          activeOpacity={0.7}
        >
          <View style={styles.accordionTitleLeft}>
            <View style={[styles.iconBox, { backgroundColor: '#F0FDFA' }]}>
              <AppIcon name="location" size={16} color="#0D9488" />
            </View>
            <View style={styles.accordionTitleCol}>
              <Text style={styles.accordionTitle}>Site, Branch & Shift Allocation</Text>
              <Text style={styles.accordionSummary}>{unitName} • {unitCode}</Text>
            </View>
          </View>
          <View style={styles.chevronBox}>
            <AppIcon
              name={expandedSections.site ? 'chevronUp' : 'chevronDown'}
              size={18}
              color="#64748B"
            />
          </View>
        </TouchableOpacity>

        {expandedSections.site && (
          <View style={styles.accordionBody}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Assigned Branch / Unit Code</Text>
              <Text style={styles.infoValueHighlight}>{unitCode}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Site / Branch Name</Text>
              <Text style={styles.infoValue}>{unitName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Client Reference Code</Text>
              <Text style={styles.infoValue}>{clientCode}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Site Location Area</Text>
              <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                {profileScope?.location || '-'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>City</Text>
              <Text style={styles.infoValue}>
                {profileScope?.city || profileData?.emp_current_city || '—'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Region / State</Text>
              <Text style={styles.infoValue}>
                {profileScope?.region || profileScope?.state || profileData?.emp_current_state || '—'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoValue}>{profileScope?.department || '—'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Shift Schedule Type</Text>
              <Text style={styles.infoValue}>
                {profileData?.shift_time?.includes('(')
                  ? profileData.shift_time.split('(')[1].replace(')', '').trim()
                  : (profileScope?.shift_type && !profileScope.shift_type.toLowerCase().includes('flexible') ? profileScope.shift_type : '—')}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Shift Timings (IN - OUT)</Text>
              <Text style={styles.infoValue}>
                {profileData?.shift_time
                  ? profileData.shift_time.split('(')[0].trim()
                  : (profileScope?.in_time && !profileScope.in_time.toLowerCase().includes('flexible') ? profileScope.in_time : '—')}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Standard Duty Hours</Text>
              <Text style={styles.infoValue}>{profileScope?.working_hours || '—'}</Text>
            </View>
          </View>
        )}
      </View>

      {/* 4. ACCORDION: PERSONAL & CONTACT DETAILS */}
      <View style={styles.accordionCard}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleSection('personal')}
          activeOpacity={0.7}
        >
          <View style={styles.accordionTitleLeft}>
            <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <AppIcon name="person" size={16} color="#3B82F6" />
            </View>
            <View style={styles.accordionTitleCol}>
              <Text style={styles.accordionTitle}>Personal & Contact Details</Text>
              <Text style={styles.accordionSummary}>Mobile: {profileData?.emp_mobile_no ? `+91 ${profileData.emp_mobile_no}` : '-'}</Text>
            </View>
          </View>
          <View style={styles.chevronBox}>
            <AppIcon
              name={expandedSections.personal ? 'chevronUp' : 'chevronDown'}
              size={18}
              color="#64748B"
            />
          </View>
        </TouchableOpacity>

        {expandedSections.personal && (
          <View style={styles.accordionBody}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Primary Mobile</Text>
              <Text style={styles.infoValueHighlight}>{profileData?.emp_mobile_no ? `+91 ${profileData.emp_mobile_no}` : 'Not Provided'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Alternate Mobile</Text>
              <Text style={styles.infoValue}>
                {profileData?.emp_mobile_no2 ? `+91 ${profileData.emp_mobile_no2}` : 'Not Provided'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Father / Spouse Name</Text>
              <Text style={styles.infoValue}>
                {profileData?.father_name || profileData?.emp_father_name || '-'}
                {profileData?.father_relation ? ` (${profileData.father_relation})` : ''}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date of Birth (DOB)</Text>
              <Text style={styles.infoValue}>{profileData?.birth_date || '-'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{profileData?.gender || '-'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Blood Group</Text>
              <View style={styles.bloodGroupBadge}>
                <Text style={styles.bloodGroupText}>{profileData?.emp_blood_group || '-'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Educational Qualification</Text>
              <Text style={styles.infoValue}>{profileData?.emp_qualification || '-'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Residential Address</Text>
              <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                {profileData?.address || profileData?.emp_current_address || '-'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* 5. ACCORDION: BANK & STATUTORY KYC DETAILS */}
      <View style={styles.accordionCard}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleSection('kyc')}
          activeOpacity={0.7}
        >
          <View style={styles.accordionTitleLeft}>
            <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
              <AppIcon name="shield" size={16} color="#D97706" />
            </View>
            <View style={styles.accordionTitleCol}>
              <Text style={styles.accordionTitle}>Bank Account & KYC Details</Text>
              <Text style={styles.accordionSummary}>PAN: {profileData?.pan_number || '-'}</Text>
            </View>
          </View>
          <View style={styles.chevronBox}>
            <AppIcon
              name={expandedSections.kyc ? 'chevronUp' : 'chevronDown'}
              size={18}
              color="#64748B"
            />
          </View>
        </TouchableOpacity>

        {expandedSections.kyc && (
          <View style={styles.accordionBody}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bank & Branch</Text>
              <Text style={styles.infoValue}>{profileData?.bank_branch || '-'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bank Account No.</Text>
              <Text style={styles.infoValueHighlight}>{profileData?.bank_account_no || '-'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>IFSC Code</Text>
              <Text style={styles.infoValue}>{profileData?.ifsc_code || '-'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Aadhaar Number</Text>
              <Text style={styles.infoValue}>{(profileData as any)?.aadhaar_number || '-'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>PAN Card Number</Text>
              <Text style={styles.infoValue}>{profileData?.pan_number || '-'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>KYC Approval Status</Text>
              <Text style={[styles.infoValueHighlight, { color: (profileData as any)?.bank_approve === 1 || (profileData as any)?.bank_approve === 3 ? '#16A34A' : '#D97706' }]}>
                {(profileData as any)?.bank_status || 'Pending'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>PF / UAN Number</Text>
              <Text style={styles.infoValue}>{profileData?.pf_number || '-'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ESIC IP Number</Text>
              <Text style={styles.infoValue}>{profileData?.esic_number || '-'}</Text>
            </View>
          </View>
        )}
      </View>

      {/* 6. ACCORDION: SALARY & EARNINGS OVERVIEW */}
      <View style={styles.accordionCard}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleSection('salary')}
          activeOpacity={0.7}
        >
          <View style={styles.accordionTitleLeft}>
            <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
              <AppIcon name="document" size={16} color="#15803D" />
            </View>
            <View style={styles.accordionTitleCol}>
              <Text style={styles.accordionTitle}>Salary & Compensation</Text>
              <Text style={styles.accordionSummary}>Net Pay: {netTakeHome} • Gross: {grossSalary}</Text>
            </View>
          </View>
          <View style={styles.chevronBox}>
            <AppIcon
              name={expandedSections.salary ? 'chevronUp' : 'chevronDown'}
              size={18}
              color="#64748B"
            />
          </View>
        </TouchableOpacity>

        {expandedSections.salary && (
          <View style={styles.accordionBody}>
            <View style={styles.payrollGrid}>
              <View style={styles.payrollBox}>
                <Text style={styles.payrollLabel}>GROSS MONTHLY</Text>
                <Text style={styles.payrollAmount}>{grossSalary}</Text>
              </View>
              <View style={styles.payrollBox}>
                <Text style={styles.payrollLabel}>NET TAKE HOME</Text>
                <Text style={[styles.payrollAmount, { color: '#15803D' }]}>{netTakeHome}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Annual CTC</Text>
              <Text style={styles.infoValue}>{ctcSalary}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Basic Pay</Text>
              <Text style={styles.infoValue}>
                {salaryInfo?.head1 && !isNaN(parseFloat(salaryInfo.head1)) && parseFloat(salaryInfo.head1) > 0
                  ? `₹${parseFloat(salaryInfo.head1).toLocaleString('en-IN')}`
                  : 'Not Configured'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>HRA Allowance</Text>
              <Text style={styles.infoValue}>
                {salaryInfo?.head2 && !isNaN(parseFloat(salaryInfo.head2)) && parseFloat(salaryInfo.head2) > 0
                  ? `₹${parseFloat(salaryInfo.head2).toLocaleString('en-IN')}`
                  : 'Not Configured'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Conveyance & Special</Text>
              <Text style={styles.infoValue}>
                {salaryInfo && (salaryInfo.head3 || salaryInfo.head4) ? (
                  `₹${(parseFloat(salaryInfo.head3 || '0') + parseFloat(salaryInfo.head4 || '0')).toLocaleString('en-IN')}`
                ) : 'Not Configured'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Statutory Deductions (PF/ESIC/PT)</Text>
              <Text style={[styles.infoValue, { color: '#B91C1C' }]}>
                {salaryInfo && (salaryInfo.dhead1 || salaryInfo.dhead2 || salaryInfo.dhead3) ? (
                  `- ₹${(
                    parseFloat(salaryInfo.dhead1 || '0') +
                    parseFloat(salaryInfo.dhead2 || '0') +
                    parseFloat(salaryInfo.dhead3 || '0')
                  ).toLocaleString('en-IN')}`
                ) : 'Not Applicable'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* 7. ACCORDION: ACCOUNT SECURITY & PASSWORD */}
      <View style={styles.accordionCard}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleSection('security')}
          activeOpacity={0.7}
        >
          <View style={styles.accordionTitleLeft}>
            <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
              <AppIcon name="lock" size={16} color="#4F46E5" />
            </View>
            <View style={styles.accordionTitleCol}>
              <Text style={styles.accordionTitle}>Account Security & Password</Text>
              <Text style={styles.accordionSummary}>Manage your login password</Text>
            </View>
          </View>
          <View style={styles.chevronBox}>
            <AppIcon
              name={expandedSections.security ? 'chevronUp' : 'chevronDown'}
              size={18}
              color="#64748B"
            />
          </View>
        </TouchableOpacity>

        {expandedSections.security && (
          <View style={styles.accordionBody}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Username / Emp ID</Text>
              <Text style={styles.infoValueHighlight}>{empCode}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account Status</Text>
              <View style={styles.statusChipActive}>
                <View style={styles.statusDotActive} />
                <Text style={styles.statusChipActiveText}>Password Protected</Text>
              </View>
            </View>

            <Text style={styles.securityNote}>
              Keep your account secure by choosing a strong password of at least 9 characters. Do not share your login credentials with anyone.
            </Text>

            <TouchableOpacity
              style={styles.changePasswordBtn}
              onPress={() => {
                setPasswordError(null);
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setIsPasswordModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.changePasswordBtnContent}>
                <View style={styles.changePasswordIconCircle}>
                  <AppIcon name="lock" size={16} color="#4F46E5" />
                </View>
                <View>
                  <Text style={styles.changePasswordBtnTitle}>Change Login Password</Text>
                  <Text style={styles.changePasswordBtnSubtitle}>Directly update your account password</Text>
                </View>
              </View>
              <AppIcon name="chevronRight" size={16} color="#6366F1" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* PHOTO ACTION SHEET MODAL */}
      <Modal
        visible={isPhotoModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setIsPhotoModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsPhotoModalVisible(false)}>
          <View style={styles.photoModalBackdrop}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.photoModalCard,
                  { paddingBottom: Math.max(insets.bottom + ms(16), ms(24)) },
                ]}
              >
                <View style={styles.photoModalHandle} />
                <Text style={styles.photoModalTitle}>Profile Photo</Text>
                <Text style={styles.photoModalSubtitle}>
                  Choose a clear front-facing photo for your employee profile
                </Text>

                <TouchableOpacity
                  style={styles.photoOptionItem}
                  onPress={handleTakePhoto}
                  activeOpacity={0.7}
                >
                  <View style={[styles.photoOptionIconBox, { backgroundColor: '#F3E8FF' }]}>
                    <AppIcon name="camera" size={20} color="#9333EA" />
                  </View>
                  <Text style={styles.photoOptionText}>Take New Photo (Camera)</Text>
                  <AppIcon name="chevronRight" size={16} color="#94A3B8" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.photoOptionItem}
                  onPress={handleChooseFromGallery}
                  activeOpacity={0.7}
                >
                  <View style={[styles.photoOptionIconBox, { backgroundColor: '#E0F2FE' }]}>
                    <AppIcon name="image" size={20} color="#0284C7" />
                  </View>
                  <Text style={styles.photoOptionText}>Choose from Gallery</Text>
                  <AppIcon name="chevronRight" size={16} color="#94A3B8" />
                </TouchableOpacity>

                {avatarSource && !avatarError && (
                  <TouchableOpacity
                    style={styles.photoOptionItem}
                    onPress={handleRemovePhoto}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.photoOptionIconBox, { backgroundColor: '#FEE2E2' }]}>
                      <AppIcon name="trash" size={18} color="#EF4444" />
                    </View>
                    <Text style={[styles.photoOptionText, { color: '#EF4444' }]}>
                      Remove Current Photo
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.photoCancelButton}
                  onPress={() => setIsPhotoModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.photoCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* CHANGE PASSWORD MODAL */}
      <Modal
        visible={isPasswordModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => {
          if (!isChangingPassword) {
            Keyboard.dismiss();
            setIsPasswordModalVisible(false);
          }
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            if (!isChangingPassword) {
              Keyboard.dismiss();
              setIsPasswordModalVisible(false);
            }
          }}
        >
          <View
            style={[
              styles.passwordModalBackdrop,
              {
                paddingBottom:
                  keyboardHeight > 0
                    ? keyboardHeight + (Platform.OS === 'android' ? ms(12) : ms(16))
                    : Math.max(insets.bottom + ms(16), ms(24)),
              },
            ]}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View
                style={[
                  styles.passwordModalCard,
                  {
                    maxHeight: Math.min(
                      ms(560),
                      windowHeight - (keyboardHeight > 0 ? keyboardHeight + ms(50) : ms(100))
                    ),
                    borderBottomLeftRadius: keyboardHeight > 0 ? ms(24) : 0,
                    borderBottomRightRadius: keyboardHeight > 0 ? ms(24) : 0,
                  },
                ]}
              >
                <View style={styles.photoModalHandle} />

                <View style={styles.passwordModalHeader}>
                  <View style={styles.passwordModalIconWrap}>
                    <AppIcon name="lock" size={20} color="#4F46E5" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.photoModalTitle}>Change Password</Text>
                    <Text style={styles.photoModalSubtitle}>
                      Enter current password and choose a new password
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      Keyboard.dismiss();
                      setIsPasswordModalVisible(false);
                    }}
                    style={styles.modalCloseBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    disabled={isChangingPassword}
                  >
                    <AppIcon name="close" size={16} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {passwordError && (
                  <View style={styles.passwordErrorBox}>
                    <AppIcon name="warning" size={16} color="#DC2626" />
                    <Text style={styles.passwordErrorText}>{passwordError}</Text>
                  </View>
                )}

                <ScrollView
                  bounces={false}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ gap: ms(12), paddingTop: ms(4), paddingBottom: ms(12) }}
                >
                  <AppTextInput
                    label="Current Password"
                    placeholder="Enter existing password"
                    value={oldPassword}
                    onChangeText={(t) => {
                      setOldPassword(t);
                      if (passwordError) setPasswordError(null);
                    }}
                    isPassword
                    iconLeft="lock"
                  />

                  <View>
                    <AppTextInput
                      label="New Password"
                      placeholder="Min 9 chars (e.g. Staff@1234)"
                      value={newPassword}
                      onChangeText={(t) => {
                        setNewPassword(t);
                        if (passwordError) setPasswordError(null);
                      }}
                      isPassword
                      iconLeft="lock"
                      helperText="Must be >= 9 characters"
                    />
                    <PasswordStrengthMeter password={newPassword} minChars={9} />
                  </View>

                  <View>
                    <AppTextInput
                      label="Confirm New Password"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChangeText={(t) => {
                        setConfirmPassword(t);
                        if (passwordError) setPasswordError(null);
                      }}
                      isPassword
                      iconLeft="lock"
                    />
                    {confirmPassword.length > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -4 }}>
                        <AppIcon
                          name={newPassword === confirmPassword ? 'checkmark' : 'warning'}
                          size={12}
                          color={newPassword === confirmPassword ? '#15803D' : '#DC2626'}
                        />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: newPassword === confirmPassword ? '#15803D' : '#DC2626' }}>
                          {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.passwordModalActions}>
                    <AppButton
                      title="Cancel"
                      variant="secondary"
                      onPress={() => {
                        Keyboard.dismiss();
                        setIsPasswordModalVisible(false);
                      }}
                      disabled={isChangingPassword}
                      style={{ flex: 1 }}
                    />
                    <AppButton
                      title={isChangingPassword ? 'Updating...' : 'Update Password'}
                      variant="primary"
                      onPress={handleChangePassword}
                      loading={isChangingPassword}
                      disabled={isChangingPassword}
                      style={{ flex: 2 }}
                      customColor="#4F46E5"
                    />
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </AppScreenContainer>
  );
};
