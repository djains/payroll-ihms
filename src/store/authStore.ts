import { NativeModules, Platform } from 'react-native';
import { create } from './createStore';
import { User, RoleCode } from '../types/models';
import { showToast } from './toastStore';
import * as Keychain from 'react-native-keychain';
import { authApi, apiClient, staffApi } from '../api';
import { ANDROID_API_KEY } from '../api/config';
import { useNotificationStore } from './notificationStore';
import { useSuperAdminStore } from './superAdminStore';
import { useShiftTrackingStore } from './shiftTrackingStore';

export interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  token: string | null;
  isLoading: boolean;
  isRestoring: boolean;

  // Actions
  updateCurrentUser: (updates: Partial<User>) => void;
  login: (companyCode: string, usernameOrCode: string, password?: string) => Promise<boolean>;
  logout: () => void;
  restoreSession: () => Promise<boolean>;
  hasMenuAccess: (menuName: string, minLevel?: 'R' | 'U' | 'C' | 'D') => boolean;
  resetPassword: (
    empCode: string,
    dob: string,
    aadhaar: string,
    newPassword: string
  ) => Promise<boolean>;
}


export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  token: null,
  isLoading: false,
  isRestoring: true,

  updateCurrentUser: (updates: Partial<User>) => {
    const user = get().currentUser;
    if (user) {
      const newUser = { ...user, ...updates };
      set({ currentUser: newUser });
      // Persist to hardware keychain so updates like avatarUrl are never lost across restarts
      Keychain.getGenericPassword()
        .then((credentials) => {
          if (credentials && credentials.password) {
            try {
              const data = JSON.parse(credentials.password);
              data.user = newUser;
              Keychain.setGenericPassword('ihms_auth_session', JSON.stringify(data)).catch(() => {});
            } catch {}
          }
        })
        .catch(() => {});
    }
  },

  restoreSession: async () => {
    set({ isRestoring: true });
    try {
      const credentials = await Keychain.getGenericPassword();
      if (credentials && credentials.password) {
        let sessionData: any = null;
        try {
          sessionData = JSON.parse(credentials.password);
        } catch {
          sessionData = null;
        }

        if (sessionData && sessionData.user) {
          if (sessionData.sessionCookie) {
            apiClient.setSessionCookie(sessionData.sessionCookie);
          }
          if (sessionData.csrfToken) {
            apiClient.setCsrfToken(sessionData.csrfToken);
          }

          if (sessionData.user) {
            if (!sessionData.user.name) {
              sessionData.user.name = sessionData.user.username;
            }
          }

          set({
            currentUser: sessionData.user,
            token: sessionData.token || credentials.username,
            isAuthenticated: true,
            isRestoring: false,
          });

          // In background, refresh permissions & profile from live MySQL
          authApi.getMe().then(async (meRes) => {
            if (meRes.success && meRes.data) {
              const u = meRes.data;
              const cleanUserLower = (u.username || '').toLowerCase();
              const backendRoleName = typeof u.role === 'string' ? u.role : u.role?.name || '';

              let userRole: RoleCode = '';
              let employeeDesignation = '';

              if (u.is_staff || u.is_superuser) {
                userRole = 'SUPER_ADMIN';
                employeeDesignation = 'Super Administrator';
              } else if (
                backendRoleName.toLowerCase().includes('company admin') ||
                backendRoleName.toLowerCase() === 'admin' ||
                (typeof (u as any).comp_code === 'string' && (u as any).comp_code && !(u as any).unit_code)
              ) {
                userRole = 'COMPANY_ADMIN';
                employeeDesignation = backendRoleName || 'Company Administrator';
              } else {
                userRole = (backendRoleName.trim().toUpperCase() as RoleCode) || '';
                employeeDesignation = backendRoleName || '';
              }

              // For Company Admin
              const isCompanyAdmin =
                userRole === 'COMPANY_ADMIN' ||
                backendRoleName.toLowerCase().includes('company');

              let employeeName = isCompanyAdmin
                ? u.username
                : (u.is_staff ? 'Super Administrator' : u.username);
              let employeeUnit = u.scope?.unit_name || u.scope?.unit_code || (u.is_staff ? 'Central Administration' : 'Not Assigned');
              let employeeMobile = '';
              let employeeEmail = `${u.username.toLowerCase()}@ihmsindia.com`;
              let employeeJoiningDate = sessionData.user.joiningDate || '';
              let employeeAvatarUrl = sessionData.user.avatarUrl || '';
              let employeeCompanyName = sessionData.user.companyName || (sessionData.user.scope as any)?.comp_name || '';

              if (!isCompanyAdmin) {
                // 1. Mobile GetUserDetails
                try {
                  const udRes = await apiClient.get<any>(
                    `/api/mobile/GetUserDetails/?userName=${encodeURIComponent(u.username)}`,
                    { 'X-API-Key': ANDROID_API_KEY }
                  );
                  if (udRes.success && udRes.data) {
                    const uList = Array.isArray(udRes.data) ? udRes.data : [udRes.data];
                    const uData = uList[0];
                    if (uData) {
                      if (uData.EMP_NAME && uData.EMP_NAME.trim()) employeeName = uData.EMP_NAME.trim();
                      if (uData.EMP_MOBILE_NO) employeeMobile = uData.EMP_MOBILE_NO;
                      if (uData.UNIT_NAME) employeeUnit = uData.UNIT_NAME;
                      if (uData.JOINING_DATE) employeeJoiningDate = uData.JOINING_DATE;
                      if (uData.COMP_NAME && uData.COMP_NAME.trim()) employeeCompanyName = uData.COMP_NAME.trim();
                      if (!employeeAvatarUrl) {
                        const rawPhoto = (
                          uData.EMP_PHOTO ||
                          uData.PHOTO ||
                          uData.IMAGE ||
                          ((String(uData.DEPT_CODE).includes('.') || String(uData.DEPT_CODE).startsWith('http')) ? uData.DEPT_CODE : '')
                        );
                        if (rawPhoto && String(rawPhoto).trim()) {
                          const src = apiClient.getImageSource(String(rawPhoto).trim());
                          if (src?.uri) employeeAvatarUrl = src.uri;
                        }
                      }
                    }
                  }
                } catch {}

                // 2. HR Employees Master
                try {
                  const hrRes = await apiClient.get<any>(`/api/hr/employees/?search=${encodeURIComponent(u.username)}`);
                  if (hrRes.success && hrRes.data) {
                    const list = hrRes.data.results || hrRes.data;
                    const match = Array.isArray(list)
                      ? list.find((e: any) => String(e.emp_code).toLowerCase() === String(u.username).toLowerCase() || e.login_id === u.username)
                      : list?.emp_code === u.username
                      ? list
                      : null;
                    if (match) {
                      if (match.emp_name && match.emp_name.trim()) employeeName = match.emp_name.trim();
                      if (match.emp_mobile_no) employeeMobile = match.emp_mobile_no;
                      if (match.emp_email_id) employeeEmail = match.emp_email_id;
                      if (match.unit_name) employeeUnit = match.unit_name;
                      if (match.joining_date) employeeJoiningDate = match.joining_date;
                      const desig = (match.designation_code || match.grade_code || '').trim();
                      if (desig) {
                        employeeDesignation = desig;
                      }
                      if (!employeeAvatarUrl) {
                        const hrPhoto = match.photo || match.emp_photo || match.image || match.profile_image || '';
                        if (hrPhoto && String(hrPhoto).trim()) {
                          const src = apiClient.getImageSource(String(hrPhoto).trim());
                          if (src?.uri) employeeAvatarUrl = src.uri;
                        }
                      }
                    }
                  }
                } catch {}

                // 3. Fallback to Documents Status for authentic passport photo
                if (!employeeAvatarUrl) {
                  try {
                    const docRes = await staffApi.getDocumentsStatus(u.username);
                    if (docRes.success && docRes.data) {
                      const dList: any[] = Array.isArray(docRes.data.results)
                        ? docRes.data.results
                        : Array.isArray(docRes.data)
                        ? docRes.data
                        : [];
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
                        const pPath = photoDoc.file_url || photoDoc.image_path || photoDoc.image_url || photoDoc.file;
                        const src = apiClient.getImageSource(pPath);
                        if (src?.uri) employeeAvatarUrl = src.uri;
                      }
                    }
                  } catch {}
                }

                // 3. Attendance Logs / Muster Sheet fallback for authentic employee name
                if (!employeeName || employeeName === u.username) {
                  try {
                    const logRes = await apiClient.get<any>(
                      `/api/attendance/android-logs/?emp_code=${encodeURIComponent(u.username)}`
                    );
                    if (logRes.success && logRes.data) {
                      const lList = Array.isArray(logRes.data) ? logRes.data : (logRes.data as any).results || [];
                      const lMatch = lList.find((l: any) => String(l.emp_code).toLowerCase() === String(u.username).toLowerCase()) || lList[0];
                      if (lMatch?.emp_name && lMatch.emp_name.trim()) {
                        employeeName = lMatch.emp_name.trim();
                      }
                    }
                  } catch {}
                }
                if (!employeeName || employeeName === u.username) {
                  try {
                    const now = new Date();
                    const uUnit = u.scope?.unit_code || '';
                    const mUrl = uUnit
                      ? `/api/attendance/muster-sheet/?unit_code=${encodeURIComponent(uUnit)}&month=${now.getMonth() + 1}&year=${now.getFullYear()}`
                      : `/api/attendance/muster-sheet/?month=${now.getMonth() + 1}&year=${now.getFullYear()}`;
                    const mRes = await apiClient.get<any>(mUrl);
                    if (mRes.success && mRes.data) {
                      const mList = Array.isArray(mRes.data) ? mRes.data : (mRes.data as any).results || [];
                      const mMatch = mList.find((m: any) => String(m.emp_code).toLowerCase() === String(u.username).toLowerCase());
                      if (mMatch?.emp_name && mMatch.emp_name.trim()) {
                        employeeName = mMatch.emp_name.trim();
                      }
                    }
                  } catch {}
                }
              }


              // Resolve real Unit Master details from SQL for real City, State, and Region
              let resolvedScope: any = u.scope || {};
              const targetU = String(resolvedScope.unit_code || employeeUnit || '').trim().toLowerCase();
              let matchedUnit: any = null;

              if (targetU) {
                try {
                  const unitsRes = await apiClient.get<any>('/api/masters/units/');
                  if (unitsRes.success && unitsRes.data) {
                    const uList = Array.isArray(unitsRes.data) ? unitsRes.data : unitsRes.data.results || [];
                    matchedUnit = uList.find(
                      (unit: any) =>
                        String(unit.unit_code || '').trim().toLowerCase() === targetU ||
                        String(unit.unit_name || '').trim().toLowerCase() === targetU
                    ) || (uList.length === 1 ? uList[0] : null);
                  }
                } catch {}

                if (matchedUnit) {
                  if (matchedUnit.unit_name) employeeUnit = matchedUnit.unit_name;
                  resolvedScope = {
                    ...resolvedScope,
                    unit_code: matchedUnit.unit_code || resolvedScope.unit_code,
                    unit_name: matchedUnit.unit_name || resolvedScope.unit_name,
                    client_code: matchedUnit.client_code || resolvedScope.client_code,
                    city: matchedUnit.unit_city || '',
                    state: matchedUnit.state_name || '',
                    region: matchedUnit.region || matchedUnit.state_name || '',
                    address: matchedUnit.unit_add1 || matchedUnit.unit_add2 || '',
                  };
                }
              }

              const parsedUnitLat = u.scope?.unit_latitude ? parseFloat(u.scope.unit_latitude) : undefined;
              const parsedUnitLon = u.scope?.unit_longitude ? parseFloat(u.scope.unit_longitude) : undefined;
              const rawPerms = Array.isArray(u.permissions)
                ? u.permissions.map((p: any) => ({
                    menu: p.menu || p.name || '',
                    menuId: p.menu_id,
                    permission: p.permission || 'I',
                    needsReview: p.needs_review,
                  }))
                : [];

              const targetComp = String(u.scope?.comp_code || sessionData.user.companyId || '').trim();
              if (!employeeCompanyName && targetComp) {
                try {
                  // 1. Fetch via authenticated company-logo endpoint (accessible to all active users without 403)
                  const logoRes = await apiClient.get<any>('/api/masters/company-logo/');
                  if (logoRes.success && logoRes.data?.company_name) {
                    employeeCompanyName = logoRes.data.company_name;
                  } else if (u.is_superuser || u.is_staff) {
                    const cRes = await apiClient.get<any>(`/api/masters/companies/?search=${encodeURIComponent(targetComp)}`);
                    if (cRes.success && cRes.data) {
                      const cList = Array.isArray(cRes.data) ? cRes.data : cRes.data.results || [];
                      const matchedComp = cList.find((c: any) => String(c.comp_code || '').trim().toUpperCase() === targetComp.toUpperCase());
                      if (matchedComp) {
                        employeeCompanyName = matchedComp.company_name || matchedComp.company_short_name || matchedComp.comp_name || '';
                      }
                    }
                  }
                } catch {}
              }

              if (employeeCompanyName) {
                resolvedScope = {
                  ...resolvedScope,
                  comp_name: employeeCompanyName,
                  company_name: employeeCompanyName,
                };
              }
              if (u.is_staff || u.is_superuser) {
                useSuperAdminStore.getState().fetchLiveCompanies().catch(() => {});
              }

              const updatedUser: User = {
                ...sessionData.user,
                name: employeeName,
                role: userRole,
                companyId: sessionData.user.companyId || u.scope?.comp_code || null,
                companyName: employeeCompanyName || sessionData.user.companyName,
                designation: employeeDesignation,
                branchOrUnit: employeeUnit,
                joiningDate: employeeJoiningDate || sessionData.user.joiningDate,
                avatarUrl: sessionData.user.avatarUrl || employeeAvatarUrl,
                assignedUnitLatitude: parsedUnitLat ?? sessionData.user.assignedUnitLatitude,
                assignedUnitLongitude: parsedUnitLon ?? sessionData.user.assignedUnitLongitude,
                backendRole: backendRoleName,
                permissions: rawPerms.length > 0 ? rawPerms : sessionData.user.permissions,
                scope: resolvedScope,
              };

              set({ currentUser: updatedUser });
              const updatedSession = {
                user: updatedUser,
                token: sessionData.token,
                sessionCookie: apiClient.getSessionCookie() || sessionData.sessionCookie,
                csrfToken: apiClient.getCsrfToken() || sessionData.csrfToken,
              };
              Keychain.setGenericPassword('ihms_auth_session', JSON.stringify(updatedSession)).catch(() => {});
            }
          }).catch(() => {});

          return true;
        }
      }
    } catch (err) {
      console.warn('[authStore] Failed to restore session:', err);
    } finally {
      set({ isRestoring: false });
    }
    return false;
  },

  login: async (companyCode, usernameOrCode, password) => {
    set({ isLoading: true });

    const cleanUser = (usernameOrCode || '').trim();
    const cleanPass = password || '';

    // Direct live authentication against Django REST Backend (connected to MySQL ihms_18_02_2026)
    try {
      let apiRes = await authApi.login(cleanUser, cleanPass);
      // If login failed and username had lowercase characters, fallback retry with uppercase (e.g. x00005 -> X00005)
      if (!apiRes.success && cleanUser !== cleanUser.toUpperCase()) {
        const retryRes = await authApi.login(cleanUser.toUpperCase(), cleanPass);
        if (retryRes.success && retryRes.data) {
          apiRes = retryRes;
        }
      }
      if (apiRes.success && apiRes.data) {
        const u = apiRes.data;
        
        // Dynamic Role resolution directly from backend
        const cleanUserLower = (u.username || '').toLowerCase();
        const backendRoleName = typeof u.role === 'string' ? u.role : u.role?.name || '';

        let userRole: RoleCode = '';
        let employeeDesignation = '';

        if (u.is_staff || u.is_superuser) {
          userRole = 'SUPER_ADMIN';
          employeeDesignation = 'Super Administrator';
        } else if (
          backendRoleName.toLowerCase().includes('company admin') ||
          backendRoleName.toLowerCase() === 'admin' ||
          (typeof (u as any).comp_code === 'string' && (u as any).comp_code && !(u as any).unit_code)
        ) {
          userRole = 'COMPANY_ADMIN';
          employeeDesignation = backendRoleName || 'Company Administrator';
        } else {
          userRole = (backendRoleName.trim().toUpperCase() as RoleCode) || '';
          employeeDesignation = backendRoleName || '';
        }

        // For Company Admin
        const isCompanyAdmin =
          userRole === 'COMPANY_ADMIN' ||
          backendRoleName.toLowerCase().includes('company');

        let employeeName = isCompanyAdmin
          ? u.username
          : (u.is_staff ? 'Super Administrator' : u.username);
        let employeeMobile = '';
        let employeeEmail = `${u.username.toLowerCase()}@ihmsindia.com`;
        let employeeUnit = u.scope?.unit_name || u.scope?.unit_code || (u.is_staff ? 'Central Administration' : 'Not Assigned');
        let employeeJoiningDate = '';
        let employeeAvatarUrl = '';
        let employeeCompanyName = '';

        if (!isCompanyAdmin) {
          // 1. Mobile GetUserDetails
          try {
            const udRes = await apiClient.get<any>(
              `/api/mobile/GetUserDetails/?userName=${encodeURIComponent(u.username)}`,
              { 'X-API-Key': ANDROID_API_KEY }
            );
            if (udRes.success && udRes.data) {
              const uList = Array.isArray(udRes.data) ? udRes.data : [udRes.data];
              const uData = uList[0];
              if (uData) {
                if (uData.EMP_NAME && uData.EMP_NAME.trim()) employeeName = uData.EMP_NAME.trim();
                if (uData.EMP_MOBILE_NO) employeeMobile = uData.EMP_MOBILE_NO;
                if (uData.UNIT_NAME) employeeUnit = uData.UNIT_NAME;
                if (uData.JOINING_DATE) employeeJoiningDate = uData.JOINING_DATE;
                if (uData.COMP_NAME && uData.COMP_NAME.trim()) employeeCompanyName = uData.COMP_NAME.trim();
                const rawPhoto = (
                  uData.EMP_PHOTO ||
                  uData.PHOTO ||
                  uData.IMAGE ||
                  ((String(uData.DEPT_CODE).includes('.') || String(uData.DEPT_CODE).startsWith('http')) ? uData.DEPT_CODE : '')
                );
                if (rawPhoto && String(rawPhoto).trim()) {
                  const src = apiClient.getImageSource(String(rawPhoto).trim());
                  if (src?.uri) employeeAvatarUrl = src.uri;
                }
              }
            }
          } catch {}

          // 2. HR Employees Master
          try {
            const hrRes = await apiClient.get<any>(`/api/hr/employees/?search=${encodeURIComponent(u.username)}`);
            if (hrRes.success && hrRes.data) {
              const list = hrRes.data.results || hrRes.data;
              const match = Array.isArray(list)
                ? list.find((e: any) => String(e.emp_code).toLowerCase() === String(u.username).toLowerCase() || e.login_id === u.username)
                : list?.emp_code === u.username
                ? list
                : null;
              if (match) {
                if (match.emp_name && match.emp_name.trim()) employeeName = match.emp_name.trim();
                if (match.emp_mobile_no) employeeMobile = match.emp_mobile_no;
                if (match.emp_email_id) employeeEmail = match.emp_email_id;
                if (match.unit_name) employeeUnit = match.unit_name;
                if (match.joining_date) employeeJoiningDate = match.joining_date;
                const desig = (match.designation_code || match.grade_code || '').trim();
                if (desig) {
                  employeeDesignation = desig;
                }
                if (!employeeAvatarUrl) {
                  const hrPhoto = match.photo || match.emp_photo || match.image || match.profile_image || '';
                  if (hrPhoto && String(hrPhoto).trim()) {
                    const src = apiClient.getImageSource(String(hrPhoto).trim());
                    if (src?.uri) employeeAvatarUrl = src.uri;
                  }
                }
              }
            }
          } catch {}

          // 3. Documents Status for authentic passport photo (Check both hr_employee_document & legacy android_documents)
          if (!employeeAvatarUrl) {
            try {
              // 3a. Primary modern endpoint (used by Web Portal: /api/hr/employee-documents/)
              const modernDocRes = await staffApi.getEmployeeDocuments(u.username);
              if (modernDocRes.success && modernDocRes.data) {
                const mList: any[] = Array.isArray(modernDocRes.data.results)
                  ? modernDocRes.data.results
                  : Array.isArray(modernDocRes.data)
                  ? modernDocRes.data
                  : [];
                const photoDoc = mList.find((d: any) => {
                  const key = String(d.document_type || d.image_name || '').toLowerCase();
                  return (
                    key.includes('photo') ||
                    key.includes('passport')
                  ) && (d.file || d.file_url || d.image_path || d.image_url);
                });
                if (photoDoc) {
                  const pPath = photoDoc.file || photoDoc.file_url || photoDoc.image_path || photoDoc.image_url;
                  const src = apiClient.getImageSource(pPath);
                  if (src?.uri) employeeAvatarUrl = src.uri;
                }
              }

              // 3b. Fallback to legacy android documents if modern doc didn't have photo
              if (!employeeAvatarUrl) {
                const docRes = await staffApi.getDocumentsStatus(u.username);
                if (docRes.success && docRes.data) {
                  const dList: any[] = Array.isArray(docRes.data.results)
                    ? docRes.data.results
                    : Array.isArray(docRes.data)
                    ? docRes.data
                    : [];
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
                    const pPath = photoDoc.file_url || photoDoc.image_path || photoDoc.image_url || photoDoc.file;
                    const src = apiClient.getImageSource(pPath);
                    if (src?.uri) employeeAvatarUrl = src.uri;
                  }
                }
              }

              // 3c. Direct deterministic fallback for verified web portal uploads:
              // Modern uploads land in: /media/employee_documents/<comp_code>/<emp_code>/photo.jpg
              if (!employeeAvatarUrl && u.username) {
                const cCode = String(u.scope?.comp_code || (companyCode ? companyCode.trim().toUpperCase() : '') || '').trim();
                if (cCode) {
                  const fallbackPhotoPath = `/media/employee_documents/${cCode}/${u.username}/photo.jpg`;
                  const src = apiClient.getImageSource(fallbackPhotoPath);
                  if (src?.uri) {
                    employeeAvatarUrl = src.uri;
                  }
                }
              }
            } catch {}
          }

          // 3. Attendance Logs / Muster Sheet fallback for authentic employee name
          if (!employeeName || employeeName === u.username) {
            try {
              const logRes = await apiClient.get<any>(
                `/api/attendance/android-logs/?emp_code=${encodeURIComponent(u.username)}`
              );
              if (logRes.success && logRes.data) {
                const lList = Array.isArray(logRes.data) ? logRes.data : (logRes.data as any).results || [];
                const lMatch = lList.find((l: any) => String(l.emp_code).toLowerCase() === String(u.username).toLowerCase()) || lList[0];
                if (lMatch?.emp_name && lMatch.emp_name.trim()) {
                  employeeName = lMatch.emp_name.trim();
                }
              }
            } catch {}
          }
          if (!employeeName || employeeName === u.username) {
            try {
              const now = new Date();
              const uUnit = u.scope?.unit_code || '';
              const mUrl = uUnit
                ? `/api/attendance/muster-sheet/?unit_code=${encodeURIComponent(uUnit)}&month=${now.getMonth() + 1}&year=${now.getFullYear()}`
                : `/api/attendance/muster-sheet/?month=${now.getMonth() + 1}&year=${now.getFullYear()}`;
              const mRes = await apiClient.get<any>(mUrl);
              if (mRes.success && mRes.data) {
                const mList = Array.isArray(mRes.data) ? mRes.data : (mRes.data as any).results || [];
                const mMatch = mList.find((m: any) => String(m.emp_code).toLowerCase() === String(u.username).toLowerCase());
                if (mMatch?.emp_name && mMatch.emp_name.trim()) {
                  employeeName = mMatch.emp_name.trim();
                }
              }
            } catch {}
          }
        }

        // Resolve real Unit Master details from SQL for real City, State, and Region
        let resolvedScope: any = u.scope || {};
        const targetU = String(resolvedScope.unit_code || employeeUnit || '').trim().toLowerCase();
        let matchedUnit: any = null;

        if (targetU) {
          try {
            const unitsRes = await apiClient.get<any>('/api/masters/units/');
            if (unitsRes.success && unitsRes.data) {
              const uList = Array.isArray(unitsRes.data) ? unitsRes.data : unitsRes.data.results || [];
              matchedUnit = uList.find(
                (unit: any) =>
                  String(unit.unit_code || '').trim().toLowerCase() === targetU ||
                  String(unit.unit_name || '').trim().toLowerCase() === targetU
              ) || (uList.length === 1 ? uList[0] : null);
            }
          } catch {}

          if (matchedUnit) {
            if (matchedUnit.unit_name) employeeUnit = matchedUnit.unit_name;
            resolvedScope = {
              ...resolvedScope,
              unit_code: matchedUnit.unit_code || resolvedScope.unit_code,
              unit_name: matchedUnit.unit_name || resolvedScope.unit_name,
              client_code: matchedUnit.client_code || resolvedScope.client_code,
              city: matchedUnit.unit_city || '',
              state: matchedUnit.state_name || '',
              region: matchedUnit.region || matchedUnit.state_name || '',
              address: matchedUnit.unit_add1 || matchedUnit.unit_add2 || '',
            };
          }
        }

        // Extract real Unit coordinates from backend scope (SQL master_unit / pay_unit_master)
        const parsedUnitLat = u.scope?.unit_latitude ? parseFloat(u.scope.unit_latitude) : undefined;
        const parsedUnitLon = u.scope?.unit_longitude ? parseFloat(u.scope.unit_longitude) : undefined;

        // Parse backend RBAC permissions returned by MeSerializer
        const rawPerms = Array.isArray(u.permissions)
          ? u.permissions.map((p: any) => ({
              menu: p.menu || p.name || '',
              menuId: p.menu_id,
              permission: p.permission || 'I',
              needsReview: p.needs_review,
            }))
          : [];

        const targetComp = String(u.scope?.comp_code || (companyCode ? companyCode.trim().toUpperCase() : '') || '').trim();
        if (!employeeCompanyName && targetComp) {
          try {
            // Check superAdminStore company cache first
            const cachedCompany = useSuperAdminStore.getState().companies.find(
              (c) => c.code.toUpperCase() === targetComp.toUpperCase() || c.id.toUpperCase() === targetComp.toUpperCase()
            );
            if (cachedCompany?.name) {
              employeeCompanyName = cachedCompany.name;
            } else {
              // 1. Fetch via authenticated company-logo endpoint (accessible to all active users without 403)
              const logoRes = await apiClient.get<any>('/api/masters/company-logo/');
              if (logoRes.success && logoRes.data?.company_name) {
                employeeCompanyName = logoRes.data.company_name;
              } else if (u.is_superuser || u.is_staff) {
                const cRes = await apiClient.get<any>(`/api/masters/companies/?search=${encodeURIComponent(targetComp)}`);
                if (cRes.success && cRes.data) {
                  const cList = Array.isArray(cRes.data) ? cRes.data : cRes.data.results || [];
                  const matchedComp = cList.find((c: any) => String(c.comp_code || '').trim().toUpperCase() === targetComp.toUpperCase());
                  if (matchedComp) {
                    employeeCompanyName = matchedComp.company_name || matchedComp.company_short_name || matchedComp.comp_name || '';
                  }
                }
              }
            }
          } catch {}
        }

        if (employeeCompanyName) {
          resolvedScope = {
            ...resolvedScope,
            comp_name: employeeCompanyName,
            company_name: employeeCompanyName,
          };
        }
        if (u.is_staff || u.is_superuser) {
          useSuperAdminStore.getState().fetchLiveCompanies().catch(() => {});
        }

        const backendUser: User = {
          id: u.username,
          name: employeeName,
          username: u.username,
          email: employeeEmail,
          empCode: u.legacy_login_id || u.username,
          role: userRole,
          companyId: targetComp || null,
          companyName: employeeCompanyName || undefined,
          designation: employeeDesignation,
          phone: employeeMobile,
          branchOrUnit: employeeUnit,
          joiningDate: employeeJoiningDate || undefined,
          avatarUrl: employeeAvatarUrl || '',
          assignedUnitLatitude: parsedUnitLat,
          assignedUnitLongitude: parsedUnitLon,
          backendRole: backendRoleName,
          permissions: rawPerms,
          scope: resolvedScope,
        };

        const authToken = `session_${Date.now()}`;
        set({
          currentUser: backendUser,
          isAuthenticated: true,
          token: authToken,
          isLoading: false,
        });

        const sessionPayload = {
          user: backendUser,
          token: authToken,
          sessionCookie: apiClient.getSessionCookie(),
          csrfToken: apiClient.getCsrfToken(),
        };
        Keychain.setGenericPassword('ihms_auth_session', JSON.stringify(sessionPayload)).catch(() => { });
        showToast({
          type: 'success',
          title: 'Sign In Successful',
          message: `Logged in as ${backendUser.name}`,
        });
        return true;
      } else {
        set({ isLoading: false });
        const errObj: any = apiRes.error;
        const errMsg = typeof errObj === 'string' ? errObj : errObj?.message || 'Invalid username or password.';
        showToast({
          type: 'error',
          title: 'Authentication Failed',
          message: errMsg,
        });
        return false;
      }
    } catch (netErr: any) {
      set({ isLoading: false });
      showToast({
        type: 'error',
        title: 'Connection Error',
        message: netErr?.message || 'Unable to connect to backend server. Check network.',
      });
      return false;
    }
  },

  logout: () => {
    // Stop background shift GPS tracking immediately on logout
    useShiftTrackingStore.getState().setShiftActive(false);
    if (Platform.OS === 'android') {
      NativeModules.LiveLocationModule?.stopTracking?.().catch?.(() => {});
    }

    // Notify live backend
    authApi.logout().catch(() => { });

    // Clear hardware credentials
    Keychain.resetGenericPassword().catch(() => { });
    apiClient.setSessionCookie('');

    // Clear notifications so next login starts completely clean
    useNotificationStore.getState().clearNotifications();

    set({
      currentUser: null,
      isAuthenticated: false,
      token: null,
      isLoading: false,
    });

    showToast({
      type: 'info',
      title: 'Signed Out',
      message: 'You have been disconnected from the session.',
    });
  },

  hasMenuAccess: (menuName: string, minLevel: 'R' | 'U' | 'C' | 'D' = 'R') => {
    const user = get().currentUser;
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    const perm = user.permissions?.find(
      (p) => p.menu.toLowerCase().trim() === menuName.toLowerCase().trim()
    );
    // If permission not found, or marked Inactive 'I', or marked needsReview
    if (!perm || perm.permission === 'I' || perm.needsReview) return false;
    const levels: Record<string, number> = { I: 0, R: 1, U: 2, C: 3, D: 4 };
    const userLvl = levels[perm.permission] || 0;
    const reqLvl = levels[minLevel] || 1;
    return userLvl >= reqLvl;
  },

  resetPassword: async (empCode, dob, aadhaar, newPassword) => {
    set({ isLoading: true });
    try {
      const res = await authApi.resetForgotPassword({
        empCode,
        dob,
        aadhaar,
        newPassword,
      });
      set({ isLoading: false });
      if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) {
        const emp = res.data[0];
        showToast({
          type: 'success',
          title: 'Password Updated',
          message: `Password updated successfully for ${emp.emp_name || empCode}. Please log in with your new password.`,
        });
        return true;
      }
      const errObj: any = res.error;
      const errMsg =
        typeof errObj === 'string'
          ? errObj
          : errObj?.detail ||
            errObj?.message ||
            'Verification details could not be matched. Please check Employee Code, Date of Birth, and Aadhaar.';
      showToast({
        type: 'error',
        title: 'Reset Failed',
        message: errMsg,
      });
      return false;
    } catch (err: any) {
      set({ isLoading: false });
      showToast({
        type: 'error',
        title: 'Error',
        message: err?.message || 'Network error during password reset.',
      });
      return false;
    }
  },
}));

// Auto-wire ApiClient to trigger clean logout on session expiration (401 / 403)
apiClient.setOnUnauthorized(() => {
  const isAuth = useAuthStore.getState().isAuthenticated;
  if (isAuth) {
    showToast({
      type: 'warning',
      title: 'Session Expired',
      message: 'Your security session has expired. Please log in again.',
    });
    useAuthStore.getState().logout();
  }
});
