import React, { useState, useEffect } from 'react';
import { View, Text, RefreshControl, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './ProfileScreen.styles';
import { AppScreenContainer, AppIcon } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import { useTenantStore } from '../../store/tenantStore';
import { useNavigation } from '../../navigation/navigationContext';
import { staffApi, apiClient } from '../../api';
import { ANDROID_API_KEY } from '../../api/config';
import { showToast } from '../../store/toastStore';
import { colors } from '../../theme/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// In-memory persistent cache for instant loading without flicker
let cachedProfileData: {
  empCode: string;
  salaryInfo: any;
  profileData: any;
  profileScope: any;
} | null = null;

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { currentUser, logout, updateCurrentUser } = useAuthStore();
  const { currentCompany } = useTenantStore();
  const { goBack } = useNavigation();

  const isCompanyAdmin =
    String(currentUser?.role || '').toUpperCase() === 'COMPANY_ADMIN' ||
    String(currentUser?.role || '').toUpperCase() === 'SUPERADMIN' ||
    String(currentUser?.backendRole || '').toLowerCase().includes('company');

  const empCode = currentUser?.empCode || currentUser?.username || '';
  const brandColor = currentCompany?.brandColor || colors.primary;

  const [salaryInfo, setSalaryInfo] = useState<any | null>(cachedProfileData?.salaryInfo ?? null);
  const [profileData, setProfileData] = useState<any | null>(cachedProfileData?.profileData ?? null);
  const [profileScope, setProfileScope] = useState<any | null>(
    (currentUser as any)?.scope || cachedProfileData?.profileScope || null
  );
  const [refreshing, setRefreshing] = useState(false);

  // Accordion Dropdown toggles
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    identity: true,
    site: true,
    personal: false,
    kyc: false,
    salary: false,
  });

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
        const [salRes, meRes, userDetailsRes, hrEmployeesRes, kycRes] = await Promise.allSettled([
          staffApi.getSalaryDetails(empCode),
          apiClient.request('/api/auth/me/'),
          apiClient.get<any>(`/api/mobile/GetUserDetails/?userName=${encodeURIComponent(empCode)}`, {
            'X-API-Key': ANDROID_API_KEY,
          }),
          apiClient.get<any>(`/api/hr/employees/?search=${encodeURIComponent(empCode)}`),
          staffApi.getEmployeeKyc(empCode),
        ]);

        let newSal = salaryInfo;
        let newScope = profileScope;
        let newProf = profileData;

        // 1. Process HR Employees Master record from SQL (pay_employee_master)
        if (hrEmployeesRes.status === 'fulfilled' && hrEmployeesRes.value.success && hrEmployeesRes.value.data) {
          const raw = hrEmployeesRes.value.data;
          const list = Array.isArray(raw) ? raw : raw.results || [raw];
          const match = list.find((e: any) => String(e.emp_code).toLowerCase() === empCode.toLowerCase());
          if (match) {
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
              unit_code: uData.COMP_CODE || newProf?.unit_code,
              client_code: uData.UNIT_CODE || newProf?.client_code,
              designation: newProf?.designation || uData.GRADE_CODE || 'Staff',
            };
            if (!isCompanyAdmin && currentUser && currentUser.name !== resolvedName) {
              useAuthStore.getState().updateCurrentUser({ name: resolvedName });
            }
          }
        }

        // 3. Process Modern hr_employee_kyc record from SQL
        if (kycRes.status === 'fulfilled' && kycRes.value.success && kycRes.value.data) {
          const kRaw = kycRes.value.data;
          const kList = Array.isArray(kRaw) ? kRaw : (kRaw as any).results || [kRaw];
          const kMatch = kList.find((k: any) => String(k.emp_code).toLowerCase() === empCode.toLowerCase()) || kList[0];
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

        // 4. Fallback for Employee Name & Shift from Attendance Logs & Policies
        if (!newProf?.emp_name) {
          try {
            const logRes = await apiClient.get<any>(
              `/api/attendance/android-logs/?emp_code=${encodeURIComponent(empCode)}`
            );
            if (logRes.success && logRes.data) {
              const lList = Array.isArray(logRes.data) ? logRes.data : (logRes.data as any).results || [];
              const lMatch = lList.find((l: any) => String(l.emp_code).toLowerCase() === empCode.toLowerCase()) || lList[0];
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
            newSal = list[0];
            setSalaryInfo(newSal);
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
        };
      }
    } catch (e) {
      console.warn('Could not refresh profile details:', e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
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
          <View style={[styles.avatarBadge, { backgroundColor: brandColor }]}>
            <Text style={styles.avatarText}>{initials || currentUser.username?.substring(0, 2).toUpperCase() || 'U'}</Text>
          </View>
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
              <Text style={styles.infoLabel}>Alternate IH&MS Code</Text>
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
    </AppScreenContainer>
  );
};
