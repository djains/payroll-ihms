import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Share,
  Modal,
  NativeModules,
} from 'react-native';

const { PrintPdfModule } = NativeModules;
import { WebView } from 'react-native-webview';
const WebViewComponent: any = WebView;
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppScreenContainer,
  AppHeader,
  AppIcon,
  CustomAlertModal,
  CustomAlertButton,
} from '../../../components/common';
import { useNavigation } from '../../../navigation';
import { apiClient } from '../../../api/client';
import { staffApi } from '../../../api/staff.api';
import { API_ENDPOINTS, apiConfig } from '../../../api/config';
import { showToast, hideToast } from '../../../store/toastStore';
import { useAuthStore } from '../../../store/authStore';
import { useSalarySlipStore, PublishedSlipItem } from '../../../store/salarySlipStore';
import { generateCrystalPayslipHtml } from '../../../utils/payslipHtml';
import { styles } from './AdminSalarySlipScreen.styles';

interface UnitOption {
  unit_code: string;
  unit_name: string;
  unit_city?: string;
  client_code?: string;
  state_name?: string;
}

interface CompanyOption {
  comp_code: string;
  company_name: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  pin?: string;
}

interface StaffMember {
  emp_code: string;
  emp_name: string;
  emp_father_name?: string;
  designation_code?: string;
  job_type?: string;
  status?: string;
  department_type?: string;
  joining_date?: string;
  location?: string;
  location_city?: string;
  hasSalary: boolean;
  ctc_amount?: number;
  month_total?: number;
  head1?: number; // Basic
  head2?: number; // HRA
  pf_employee_flag?: string;
  pf_employer_flag?: string;
  esic_employee_flag?: string;
  esic_employer_flag?: string;
  lwf_flag?: string;
  [key: string]: any;
}

interface ProcessedSalaryItem {
  emp_code: string;
  emp_name: string;
  job_type?: string;
  present_days?: number | string;
  tot_days_present?: number | string;
  month_days?: number | string;
  tot_earnings?: number | string;
  tot_deductions?: number | string;
  tot_ehead?: number | string;
  tot_dhead?: number | string;
  ctc_amount?: number | string;
  net_salary?: number | string;
  emp_mobile_no?: string;
  emp_email_id?: string;
  [key: string]: any;
}

const MONTHS_LIST = [
  { num: 1, name: 'Jan' },
  { num: 2, name: 'Feb' },
  { num: 3, name: 'Mar' },
  { num: 4, name: 'Apr' },
  { num: 5, name: 'May' },
  { num: 6, name: 'Jun' },
  { num: 7, name: 'Jul' },
  { num: 8, name: 'Aug' },
  { num: 9, name: 'Sep' },
  { num: 10, name: 'Oct' },
  { num: 11, name: 'Nov' },
  { num: 12, name: 'Dec' },
];

export const AdminSalarySlipScreen: React.FC = () => {
  const { goBack } = useNavigation();
  const { currentUser } = useAuthStore();
  const insets = useSafeAreaInsets();

  // Active Tab: 'staff' for Structure Design, 'process' for Monthly Calculation & Slips
  const [activeTab, setActiveTab] = useState<'staff' | 'process'>('staff');

  // Unit & Company Selector State
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [loadingUnits, setLoadingUnits] = useState<boolean>(true);

  // Month & Year State
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  // Staff List State (Tab 1)
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState<boolean>(false);
  const [searchStaff, setSearchStaff] = useState<string>('');

  // Processed Salary List State (Tab 2)
  const [salaryRows, setSalaryRows] = useState<ProcessedSalaryItem[]>([]);
  const [proLabels, setProLabels] = useState<Record<string, string>>({});
  const [loadingSalary, setLoadingSalary] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [searchWorker, setSearchWorker] = useState<string>('');

  // Refreshing State
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Staff Salary Setup Modal State
  const [salaryModalVisible, setSalaryModalVisible] = useState<boolean>(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [ctcInput, setCtcInput] = useState<string>('');
  const [head1Input, setHead1Input] = useState<string>('');
  const [head2Input, setHead2Input] = useState<string>('');
  const [pfEnabled, setPfEnabled] = useState<boolean>(true);
  const [esicEnabled, setEsicEnabled] = useState<boolean>(true);
  const [lwfEnabled, setLwfEnabled] = useState<boolean>(false);
  const [calculatingHeads, setCalculatingHeads] = useState<boolean>(false);
  const [savingSalary, setSavingSalary] = useState<boolean>(false);

  // Interactive Alert Modal State (Used exclusively for Attendance Muster Approval prompt)
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    type?: 'info' | 'warning' | 'success' | 'danger';
    buttons?: CustomAlertButton[];
    verticalButtons?: boolean;
  }>({
    visible: false,
    title: '',
  });

  // 1. Fetch available site units & companies from backend MySQL
  const fetchUnits = useCallback(async () => {
    setLoadingUnits(true);
    try {
      const [res, compRes] = await Promise.all([
        apiClient.get<any>(`${API_ENDPOINTS.UNITS}?page=1`),
        apiClient.get<any>(`${API_ENDPOINTS.COMPANIES}?page=1`),
      ]);
      if (res.success && res.data) {
        const raw = res.data;
        const list: UnitOption[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw.results)
          ? raw.results
          : [];
        setUnits(list);
        if (list.length > 0 && !selectedUnit) {
          setSelectedUnit(list[0].unit_code);
        }
      }
      if (compRes.success && compRes.data) {
        const cRaw = compRes.data;
        const cList: CompanyOption[] = Array.isArray(cRaw)
          ? cRaw
          : Array.isArray(cRaw.results)
          ? cRaw.results
          : [];
        setCompanies(cList);
      }
    } catch (e) {
      console.warn('[AdminSalarySlipScreen] Error fetching units:', e);
    } finally {
      setLoadingUnits(false);
    }
  }, [selectedUnit]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  // 2. Fetch all Staff members for the selected unit + their salary structures
  const fetchUnitStaff = useCallback(async () => {
    if (!selectedUnit) return;
    setLoadingStaff(true);
    try {
      // A. Fetch active staff employees deployed at this unit
      const empRes = await apiClient.get<any>(
        `${API_ENDPOINTS.EMPLOYEES}?unit_code=${encodeURIComponent(selectedUnit)}&page=1`
      );
      const rawEmps: any[] =
        empRes.success && empRes.data
          ? Array.isArray(empRes.data)
            ? empRes.data
            : empRes.data.results || []
          : [];

      // B. Fetch staff salary configurations already saved under this unit
      const staffSalaryRes = await apiClient.get<any>(
        `/api/payroll/staff-salary-details/?unit_code=${encodeURIComponent(selectedUnit)}`
      );
      const rawSalaryDetails: any[] =
        staffSalaryRes.success && staffSalaryRes.data
          ? Array.isArray(staffSalaryRes.data)
            ? staffSalaryRes.data
            : staffSalaryRes.data.results || []
          : [];

      const salaryMap = new Map<string, any>();
      rawSalaryDetails.forEach((sd) => {
        if (sd.emp_code) {
          salaryMap.set(String(sd.emp_code).trim(), sd);
        }
      });

      const extractHeads = (sd: any) => {
        const out: Record<string, any> = {};
        if (!sd) return out;
        for (let i = 1; i <= 15; i++) {
          if (sd[`head${i}`] !== undefined) out[`head${i}`] = parseFloat(String(sd[`head${i}`] || 0));
        }
        return out;
      };

      // Merge employees + their salary profiles
      const mergedMap = new Map<string, StaffMember>();

      rawEmps.forEach((e) => {
        const code = String(e.emp_code || e.id || '').trim();
        if (!code) return;
        const sd = salaryMap.get(code);
        const ctc = sd ? parseFloat(String(sd.ctc_amount || 0)) : 0;
        mergedMap.set(code, {
          emp_code: code,
          emp_name: e.emp_name || sd?.emp_name || 'Staff Member',
          emp_father_name: e.emp_father_name || '',
          designation_code: e.designation_code || e.designation || 'Staff',
          job_type: e.job_type || sd?.job_type || 'permanent',
          status: e.status || sd?.status || 'monthly',
          department_type: e.department_type || '',
          joining_date: e.joining_date || '',
          location: e.location || '',
          location_city: e.location_city || '',
          hasSalary: ctc > 0,
          ctc_amount: ctc > 0 ? ctc : undefined,
          month_total: sd ? parseFloat(String(sd.month_total || 0)) : undefined,
          ...extractHeads(sd),
          head1: sd ? parseFloat(String(sd.head1 || 0)) : undefined,
          head2: sd ? parseFloat(String(sd.head2 || 0)) : undefined,
          pf_employee_flag: sd?.pf_employee_flag ?? 'yes',
          pf_employer_flag: sd?.pf_employer_flag ?? 'yes',
          esic_employee_flag: sd?.esic_employee_flag ?? 'yes',
          esic_employer_flag: sd?.esic_employer_flag ?? 'yes',
          lwf_flag: sd?.lwf_flag ?? 'no',
        });
      });

      // Also ensure any salary detail rows are visible even if not in rawEmps
      rawSalaryDetails.forEach((sd) => {
        const code = String(sd.emp_code || '').trim();
        if (code && !mergedMap.has(code)) {
          const ctc = parseFloat(String(sd.ctc_amount || 0));
          mergedMap.set(code, {
            emp_code: code,
            emp_name: sd.emp_name || 'Staff Member',
            designation_code: 'Staff',
            job_type: sd.job_type || 'permanent',
            status: sd.status || 'monthly',
            hasSalary: ctc > 0,
            ctc_amount: ctc > 0 ? ctc : undefined,
            month_total: parseFloat(String(sd.month_total || 0)),
            ...extractHeads(sd),
            head1: parseFloat(String(sd.head1 || 0)),
            head2: parseFloat(String(sd.head2 || 0)),
            pf_employee_flag: sd.pf_employee_flag ?? 'yes',
            pf_employer_flag: sd.pf_employer_flag ?? 'yes',
            esic_employee_flag: sd.esic_employee_flag ?? 'yes',
            esic_employer_flag: sd.esic_employer_flag ?? 'yes',
            lwf_flag: sd.lwf_flag ?? 'no',
          });
        }
      });

      setStaffList(Array.from(mergedMap.values()));
    } catch (e) {
      console.warn('[AdminSalarySlipScreen] Error fetching unit staff:', e);
      setStaffList([]);
    } finally {
      setLoadingStaff(false);
      setRefreshing(false);
    }
  }, [selectedUnit]);

  // 3. Fetch processed salary list for the selected unit + month + year
  const fetchSalaryList = useCallback(async () => {
    if (!selectedUnit) return;
    setLoadingSalary(true);
    try {
      const url = `/api/payroll/staff-salary-details/pro_list/?unit_code=${encodeURIComponent(
        selectedUnit
      )}&month=${selectedMonth}&year=${selectedYear}`;
      const res = await apiClient.get<any>(url);

      if (res.success && res.data) {
        const raw = res.data;
        const list: ProcessedSalaryItem[] = Array.isArray(raw.results)
          ? raw.results
          : Array.isArray(raw)
          ? raw
          : [];
        setSalaryRows(list);
        if (raw.labels && typeof raw.labels === 'object') {
          setProLabels(raw.labels);
        }
      } else {
        setSalaryRows([]);
      }
    } catch (e) {
      console.warn('[AdminSalarySlipScreen] Pro list error:', e);
      setSalaryRows([]);
    } finally {
      setLoadingSalary(false);
      setRefreshing(false);
    }
  }, [selectedUnit, selectedMonth, selectedYear]);

  // Trigger loads when Unit changes
  useEffect(() => {
    if (selectedUnit) {
      fetchUnitStaff();
      fetchSalaryList();
    }
  }, [selectedUnit, fetchUnitStaff, fetchSalaryList]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    if (activeTab === 'staff') {
      fetchUnitStaff();
    } else {
      fetchSalaryList();
    }
  }, [activeTab, fetchUnitStaff, fetchSalaryList]);

  // Open Salary Setup Modal for a staff member
  const handleOpenSalaryModal = (staff: StaffMember) => {
    setSelectedStaff(staff);
    const existingCtc = staff.ctc_amount ? String(staff.ctc_amount) : '';
    setCtcInput(existingCtc);
    setHead1Input(staff.head1 ? String(staff.head1) : '');
    setHead2Input(staff.head2 ? String(staff.head2) : '');
    setPfEnabled(
      staff.pf_employee_flag === 'yes' ||
      staff.pf_employee_flag === '1' ||
      staff.pf_employee_flag === 'true'
    );
    setEsicEnabled(
      staff.esic_employee_flag === 'yes' ||
      staff.esic_employee_flag === '1' ||
      staff.esic_employee_flag === 'true'
    );
    setLwfEnabled(
      staff.lwf_flag === 'yes' ||
      staff.lwf_flag === '1' ||
      staff.lwf_flag === 'true'
    );
    setSalaryModalVisible(true);
  };

  // Auto-calculate heads from unit structure
  const handleAutoCalculateHeads = async () => {
    const ctc = parseFloat(ctcInput);
    if (!ctc || ctc <= 0) {
      showToast({
        type: 'warning',
        title: 'Enter CTC Amount',
        message: 'Please enter a valid monthly CTC amount first.',
      });
      return;
    }

    setCalculatingHeads(true);
    try {
      const res = await apiClient.get<any>(
        `/api/payroll/staff-salary-details/calculate/?ctc_amount=${ctc}&unit_code=${encodeURIComponent(
          selectedUnit
        )}`
      );

      if (res.success && res.data && res.data.heads) {
        const heads = res.data.heads;
        const b = heads.head1 || (ctc * 0.5).toFixed(2);
        const h = heads.head2 || (ctc * 0.2).toFixed(2);
        setHead1Input(String(b));
        setHead2Input(String(h));
        showToast({
          type: 'success',
          title: 'Breakup Calculated',
          message: `Basic: ₹${b} • HRA: ₹${h} calculated from Unit structure.`,
        });
      } else {
        // Standard industrial fallback calculation: 50% Basic, 20% HRA
        const b = (ctc * 0.5).toFixed(2);
        const h = (ctc * 0.2).toFixed(2);
        setHead1Input(String(b));
        setHead2Input(String(h));
      }
    } catch (e: any) {
      const b = (ctc * 0.5).toFixed(2);
      const h = (ctc * 0.2).toFixed(2);
      setHead1Input(String(b));
      setHead2Input(String(h));
    } finally {
      setCalculatingHeads(false);
    }
  };

  // Save Salary Structure for the selected employee
  const handleSaveStaffSalary = async () => {
    if (!selectedStaff) return;
    const ctc = parseFloat(ctcInput);
    if (!ctc || ctc <= 0) {
      showToast({
        type: 'error',
        title: 'Invalid CTC',
        message: 'Please enter a valid monthly CTC amount.',
      });
      return;
    }

    const head1 = parseFloat(head1Input) || ctc * 0.5;
    const head2 = parseFloat(head2Input) || ctc * 0.2;

    setSavingSalary(true);
    try {
      const existingHeads: Record<string, number> = {};
      for (let i = 3; i <= 15; i++) {
        existingHeads[`head${i}`] = parseFloat(String((selectedStaff as any)?.[`head${i}`] || 0)) || 0;
      }

      const payload: Record<string, any> = {
        client_code: 'staff',
        unit_code: selectedUnit,
        emp_code: selectedStaff.emp_code,
        emp_name: selectedStaff.emp_name,
        job_type: selectedStaff.job_type || 'permanent',
        status: selectedStaff.status || 'monthly',
        ctc_amount: ctc,
        month_total: ctc,
        head1,
        head2,
        heads: {
          head1,
          head2,
          ...existingHeads,
        },
        pf_employee_flag: pfEnabled ? 'yes' : 'no',
        pf_employer_flag: pfEnabled ? 'yes' : 'no',
        esic_employee_flag: esicEnabled ? 'yes' : 'no',
        esic_employer_flag: esicEnabled ? 'yes' : 'no',
        lwf_flag: lwfEnabled ? 'yes' : 'no',
      };

      // Try update_detail if already configured, otherwise save
      let endpoint = selectedStaff.hasSalary
        ? '/api/payroll/staff-salary-details/update_detail/'
        : '/api/payroll/staff-salary-details/save/';

      let res = await apiClient.post<any>(endpoint, payload);

      // If save says "Employee already add", update it
      if (
        !res.success &&
        String(res.error || '').toLowerCase().includes('already add')
      ) {
        res = await apiClient.post<any>(
          '/api/payroll/staff-salary-details/update_detail/',
          payload
        );
      }

      if (res.success) {
        showToast({
          type: 'success',
          title: 'Salary Structure Saved',
          message: `Structure for ${selectedStaff.emp_name} has been updated (CTC: ₹${ctc.toLocaleString(
            'en-IN'
          )}).`,
        });
        setSalaryModalVisible(false);
        fetchUnitStaff();

        // Only initialize Unit structure if not already configured (preserve existing custom heads/formulas)
        try {
          const structCheck = await apiClient.get<any>(
            `/api/payroll/staff-salary-structure/?unit_code=${encodeURIComponent(selectedUnit)}`
          );
          const hasStruct =
            structCheck.success &&
            structCheck.data &&
            (Array.isArray(structCheck.data)
              ? structCheck.data.length > 0
              : (structCheck.data.results && structCheck.data.results.length > 0) ||
                structCheck.data.count > 0);

          if (!hasStruct) {
            await apiClient.post('/api/payroll/staff-salary-structure/', {
              unit_code: selectedUnit,
              client_code: 'staff',
              head1: 'BASIC',
              head1_per: '50',
              head2: 'HRA',
              head2_per: '20',
              pf_employee: pfEnabled ? '12' : '0.0001',
              pf_employer: pfEnabled ? '12' : '0.0001',
              esic_employee: esicEnabled ? '0.75' : '0.0001',
              esic_employer: esicEnabled ? '3.25' : '0.0001',
            });
          }
        } catch {}

        // Auto re-fetch processed salary rows so any existing calculation updates
        fetchSalaryList();
      } else {
        const errMsg =
          typeof res.error === 'string'
            ? res.error
            : (res.error as any)?.message || 'Failed to save salary structure.';
        showToast({
          type: 'error',
          title: 'Save Failed',
          message: errMsg,
        });
      }
    } catch (e: any) {
      showToast({
        type: 'error',
        title: 'Save Error',
        message: e?.message || 'Unable to update employee salary details.',
      });
    } finally {
      setSavingSalary(false);
    }
  };

  // Process / Calculate Monthly Salary for Unit
  const handleProcessSalary = async () => {
    if (!selectedUnit) {
      showToast({
        type: 'error',
        title: 'Select Unit',
        message: 'Please choose a site unit before processing salary.',
      });
      return;
    }

    setProcessing(true);
    try {
      // 0. Ensure Unit has a modern salary structure so backend avoids falling back to legacy tables
      try {
        const structCheck = await apiClient.get<any>(
          `/api/payroll/staff-salary-structure/?unit_code=${encodeURIComponent(selectedUnit)}`
        );
        const hasStruct =
          structCheck.success &&
          structCheck.data &&
          (Array.isArray(structCheck.data)
            ? structCheck.data.length > 0
            : (structCheck.data.results && structCheck.data.results.length > 0) ||
              structCheck.data.count > 0);

        if (!hasStruct) {
          await apiClient.post('/api/payroll/staff-salary-structure/', {
            unit_code: selectedUnit,
            client_code: 'staff',
            head1: 'BASIC',
            head1_per: '50',
            head2: 'HRA',
            head2_per: '20',
            pf_employee: '12',
            pf_employer: '12',
            esic_employee: '0.75',
            esic_employer: '3.25',
          });
        }
      } catch {}

      // Always sync fresh attendance muster directly from real punch logs before running calculation
      await handleAutoApproveAndProcess();
    } catch (e: any) {
      showToast({
        type: 'error',
        title: 'Error',
        message: e?.message || 'Could not trigger salary calculation.',
      });
      setProcessing(false);
    }
  };

  // Helper: Auto-file and approve attendance muster for the selected unit + month, then process salary
  const handleAutoApproveAndProcess = async () => {
    setProcessing(true);
    try {
      showToast({
        type: 'info',
        title: 'Verifying Attendance',
        message: 'Checking and approving attendance muster for this unit...',
      });

      // 1. Fetch workers deployed at this unit
      const empCandidates: any[] = [];
      try {
        const staffRes = await apiClient.get<any>(
          `/api/payroll/staff-salary-details/?unit_code=${encodeURIComponent(selectedUnit)}`
        );
        if (staffRes.success && staffRes.data) {
          const list = Array.isArray(staffRes.data)
            ? staffRes.data
            : staffRes.data.results || [];
          empCandidates.push(...list);
        }
      } catch {}

      try {
        const empRes = await apiClient.get<any>(
          `${API_ENDPOINTS.EMPLOYEES}?unit_code=${encodeURIComponent(selectedUnit)}&page=1`
        );
        if (empRes.success && empRes.data) {
          const list = Array.isArray(empRes.data)
            ? empRes.data
            : empRes.data.results || [];
          empCandidates.push(...list);
        }
      } catch {}

      const uniqueEmps = Array.from(
        new Map(
          empCandidates
            .filter((e) => e?.emp_code || e?.id)
            .map((e) => [String(e.emp_code || e.id), e])
        ).values()
      );

      if (uniqueEmps.length === 0) {
        showToast({
          type: 'warning',
          title: 'No Staff Enrolled',
          message: `No staff enrolled under Unit ${selectedUnit}. Please add staff first.`,
        });
        return;
      }

      // Upload attendance muster based strictly on real punches / SQL logs
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

      // Fetch real punch logs for all enrolled workers from MySQL (pay_android_attendance_logs)
      const punchLogsByEmp: Record<string, Set<string>> = {};
      await Promise.all(
        uniqueEmps.map(async (emp: any) => {
          const eCode = String(emp.emp_code || emp.id).trim();
          punchLogsByEmp[eCode] = new Set<string>();
          try {
            const pRes = await staffApi.getLivePunchLogs(eCode);
            if (pRes.success && pRes.data) {
              const logs = (pRes.data as any).results || pRes.data;
              if (Array.isArray(logs)) {
                logs.forEach((log: any) => {
                  const rawDt =
                    log.date_time ||
                    log.Date_Time ||
                    log.camera_intime ||
                    log.Camera_intime ||
                    log.attendances_intime ||
                    log.punch_date ||
                    log.date ||
                    '';
                  if (!rawDt) return;
                  const strVal = String(rawDt).trim();
                  let dDay = -1;
                  let dMon = -1;
                  let dYr = -1;
                  if (strVal.includes('/')) {
                    const parts = strVal.split(' ')[0].split('/');
                    if (parts.length >= 3) {
                      dDay = parseInt(parts[0], 10);
                      dMon = parseInt(parts[1], 10);
                      dYr = parseInt(parts[2], 10);
                    }
                  } else if (strVal.includes('-')) {
                    const parts = strVal.split(' ')[0].split('-');
                    if (parts.length >= 3) {
                      dYr = parseInt(parts[0], 10);
                      dMon = parseInt(parts[1], 10);
                      dDay = parseInt(parts[2], 10);
                    }
                  }
                  if (dYr === selectedYear && dMon === selectedMonth && dDay > 0) {
                    punchLogsByEmp[eCode].add(`day${dDay < 10 ? '0' + dDay : dDay}`);
                  }
                });
              }
            }
          } catch {}
        })
      );

      // Fetch real MySQL gazetted holidays for this month
      const holidayDayKeys = new Set<string>();
      try {
        const hRes = await staffApi.getHolidays();
        if (hRes.success && hRes.data) {
          const hList = Array.isArray(hRes.data.results)
            ? hRes.data.results
            : Array.isArray(hRes.data)
            ? hRes.data
            : [];
          hList.forEach((h: any) => {
            if (h.holiday_date) {
              const hParts = String(h.holiday_date).split(' ')[0].split(/[-/]/);
              let hD = -1,
                hM = -1,
                hY = -1;
              if (hParts.length >= 3) {
                if (hParts[0].length === 4) {
                  hY = parseInt(hParts[0], 10);
                  hM = parseInt(hParts[1], 10);
                  hD = parseInt(hParts[2], 10);
                } else {
                  hD = parseInt(hParts[0], 10);
                  hM = parseInt(hParts[1], 10);
                  hY = parseInt(hParts[2], 10);
                }
                if (hY === selectedYear && hM === selectedMonth && hD > 0) {
                  holidayDayKeys.add(`day${hD < 10 ? '0' + hD : hD}`);
                }
              }
            }
          });
        }
      } catch {}

      // Fetch Approved Paid Leaves from SQL (leave_transaction)
      const paidLeaveDaysByEmp: Record<string, Set<string>> = {};
      try {
        const lvRes = await apiClient.get<any>(`${API_ENDPOINTS.LEAVE_APPLICATIONS}?page_size=all`);
        if (lvRes.success && lvRes.data) {
          const lvList: any[] = Array.isArray(lvRes.data) ? lvRes.data : lvRes.data.results || [];
          lvList.forEach((lv: any) => {
            const statusStr = String(lv.leave_status || '').trim().toLowerCase();
            if (statusStr !== 'approved') return;
            const balAtApply = parseFloat(String(lv.max_no_of_leave ?? '0'));
            // Only Paid Leave (balance > 0) is payable; balance <= 0 is Unpaid Leave (LWP -> 'A')
            if (isNaN(balAtApply) || balAtApply <= 0) return;

            const lEmp = String(lv.emp_code || '').trim();
            if (!lEmp || !lv.from_date || !lv.to_date) return;
            const start = new Date(lv.from_date);
            const end = new Date(lv.to_date);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

            if (!paidLeaveDaysByEmp[lEmp]) paidLeaveDaysByEmp[lEmp] = new Set<string>();
            for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
              if (dt.getFullYear() === selectedYear && dt.getMonth() + 1 === selectedMonth) {
                const dNum = dt.getDate();
                paidLeaveDaysByEmp[lEmp].add(`day${dNum < 10 ? '0' + dNum : dNum}`);
              }
            }
          });
        }
      } catch {}

      const rows = uniqueEmps.map((emp: any) => {
        const eCode = String(emp.emp_code || emp.id).trim();
        const empPunches = punchLogsByEmp[eCode] || new Set<string>();
        const empPaidLeaves = paidLeaveDaysByEmp[eCode] || new Set<string>();
        const daysMap: Record<string, string> = {};

        for (let d = 1; d <= daysInMonth; d++) {
          const dayKey = `day${d < 10 ? '0' + d : d}`;
          const dateObj = new Date(selectedYear, selectedMonth - 1, d);
          const isSunday = dateObj.getDay() === 0;

          if (empPunches.has(dayKey)) {
            // Real punch exists in MySQL
            daysMap[dayKey] = 'P';
          } else if (isSunday) {
            // Sunday is Weekly Off
            daysMap[dayKey] = 'W';
          } else if (holidayDayKeys.has(dayKey)) {
            // Paid Gazetted Holiday from MySQL
            daysMap[dayKey] = 'PH';
          } else if (empPaidLeaves.has(dayKey)) {
            // Approved Paid Leave (balance > 0) -> 'PH' so backend counts it in tot_days_present
            daysMap[dayKey] = 'PH';
          } else {
            // No punch & no paid leave (includes Unpaid Leave where balance <= 0) -> STRICT ABSENT ('A')
            daysMap[dayKey] = 'A';
          }
        }
        return {
          emp_code: eCode,
          days: daysMap,
        };
      });

      // If timesheet was previously approved, un-lock / reject it first so fresh real muster can be uploaded
      try {
        await apiClient.post('/api/attendance/branch-approval/reject/', {
          month: selectedMonth,
          year: selectedYear,
          unit_codes: [selectedUnit],
          reject_reason: 'Syncing real punch attendance records',
        });
      } catch {}

      const uploadRes = await apiClient.post<any>(
        '/api/attendance/bulk-attendance/upload/',
        {
          month: selectedMonth,
          year: selectedYear,
          unit_code: selectedUnit,
          rows,
        }
      );

      if (!uploadRes.success) {
        const uErr = String(uploadRes.error || '');
        if (!uErr.toLowerCase().includes('already approved')) {
          showToast({
            type: 'error',
            title: 'Muster Filing Error',
            message: uErr || 'Unable to upload attendance muster for this unit.',
          });
          return;
        }
      }

      // Approve the freshly uploaded muster
      const approveRes = await apiClient.post<any>(
        '/api/attendance/branch-approval/approve/',
        {
          month: selectedMonth,
          year: selectedYear,
          unit_codes: [selectedUnit],
        }
      );

      const isApproved =
        approveRes.success ||
        (approveRes.error &&
          String(approveRes.error).toLowerCase().includes('already approved'));

      if (!isApproved) {
        showToast({
          type: 'error',
          title: 'Approval Error',
          message:
            approveRes.error ||
            'Could not approve attendance muster. Please verify attendance permissions.',
        });
        return;
      }

      showToast({
        type: 'success',
        title: 'Muster Approved',
        message: 'Attendance approved! Generating salary now...',
      });

      // Ensure each enrolled staff in this unit has salary heads populated (Basic 50%, HRA 20%) so calculated heads are never 0.00
      try {
        const staffDetailsRes = await apiClient.get<any>(
          `/api/payroll/staff-salary-details/?unit_code=${encodeURIComponent(selectedUnit)}`
        );
        if (staffDetailsRes.success && staffDetailsRes.data) {
          const sList = Array.isArray(staffDetailsRes.data)
            ? staffDetailsRes.data
            : staffDetailsRes.data.results || [];
          for (const s of sList) {
            const ctc = parseFloat(s.ctc_amount || '0') || 0;
            const h1 = parseFloat(s.head1 || '0');
            if (h1 === 0 && ctc > 0) {
              const cRes = await apiClient.get<any>(
                `/api/payroll/staff-salary-details/calculate/?ctc_amount=${ctc}&unit_code=${encodeURIComponent(
                  selectedUnit
                )}`
              );
              if (cRes.success && cRes.data) {
                const cData = cRes.data;
                const headsMap: Record<string, number> = {};
                const rawHeads = cData.heads || {};
                for (let i = 1; i <= 15; i++) {
                  headsMap[`head${i}`] = parseFloat(rawHeads[`head${i}`] ?? cData[`head${i}`] ?? 0) || 0;
                }
                const normFlag = (val: any, defVal = 'no') => {
                  if (val === undefined || val === null || val === '') return defVal;
                  const sVal = String(val).trim().toLowerCase();
                  return sVal === 'yes' || sVal === '1' || sVal === 'true' ? 'yes' : 'no';
                };
                const updatePayload: Record<string, any> = {
                  client_code: s.client_code || 'staff',
                  unit_code: selectedUnit,
                  emp_code: s.emp_code,
                  emp_name: s.emp_name,
                  job_type: s.job_type || 'permanent',
                  status: s.status || 'monthly',
                  ctc_amount: ctc,
                  month_total: cData.month_total || ctc,
                  heads: headsMap,
                  pf_employee_flag: normFlag(s.pf_employee_flag, 'yes'),
                  pf_employer_flag: normFlag(s.pf_employer_flag, 'yes'),
                  esic_employee_flag: normFlag(s.esic_employee_flag, 'yes'),
                  esic_employer_flag: normFlag(s.esic_employer_flag, 'yes'),
                  lwf_flag: normFlag(s.lwf_flag, 'no'),
                };
                await apiClient.post(
                  '/api/payroll/staff-salary-details/update_detail/',
                  updatePayload
                );
              }
            }
          }
        }
      } catch (errHead) {
        console.warn('[AdminSalarySlipScreen] Auto head calculation sync error:', errHead);
      }

      // Final salary calculation
      const calcRes = await apiClient.post<any>(
        '/api/payroll/staff-salary-details/process/',
        {
          unit_code: selectedUnit,
          month: selectedMonth,
          year: selectedYear,
        }
      );

      if (calcRes.success) {
        showToast({
          type: 'success',
          title: 'Salary Generated!',
          message: `Salaries for Unit ${selectedUnit} (${selectedMonth}/${selectedYear}) have been generated!`,
        });
        setActiveTab('process');
        fetchSalaryList();
      } else {
        const errMsg =
          typeof calcRes.error === 'string'
            ? calcRes.error
            : (calcRes.error as any)?.message || 'Could not finalize salary calculation.';
        showToast({
          type: 'error',
          title: 'Calculation Error',
          message: errMsg,
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Processing Error',
        message:
          err?.message ||
          'Could not complete auto-attendance approval. Please ensure workers are assigned to this unit.',
      });
    } finally {
      setProcessing(false);
    }
  };

  // Download Unit PDF Salary Slip (Direct Native Print / Save as PDF Adapter)
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

  const handleDownloadUnitPdf = async () => {
    if (!selectedUnit) return;
    const url = `${apiConfig.getBaseUrl()}/api/payroll/staff-salary-details/salary_pdf/?unit_code=${encodeURIComponent(
      selectedUnit
    )}&month=${selectedMonth}&year=${selectedYear}`;

    setDownloadingPdf(true);
    showToast({
      type: 'info',
      title: 'Downloading Salary Slip',
      message: 'Fetching official PDF from server...',
    });

    try {
      const headers: Record<string, string> = {};
      const cookie = apiClient.getSessionCookie();
      if (cookie) headers['Cookie'] = cookie;
      const csrf = apiClient.getCsrfToken();
      if (csrf) headers['X-CSRFToken'] = csrf;

      const res = await fetch(url, { method: 'GET', headers });
      if (res.ok) {
        const blob = await res.blob();
        const base64Data: string = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        const jobName = `Salary_Slips_${selectedUnit}_${selectedMonth}_${selectedYear}`;

        if (PrintPdfModule?.printPdfBase64) {
          await PrintPdfModule.printPdfBase64(base64Data, jobName);
          showToast({
            type: 'success',
            title: 'Opening Print / PDF Saver',
            message: 'Choose "Save as PDF" to save slip to device.',
          });
          return;
        }
      }
    } catch (e) {
      console.warn('[AdminSalarySlipScreen] Direct PDF download error:', e);
    } finally {
      setDownloadingPdf(false);
    }

    // Fallback: system browser or native share
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Share.share({ title: 'Salary Slips PDF', url });
      }
    } catch {
      await Share.share({ title: 'Salary Slips PDF', url });
    }
  };

  // View / Print Individual Employee Salary Slip (1:1 Crystal Reports Salary_Slip.rpt Layout matching Image 1)
  const [viewingEmpCode, setViewingEmpCode] = useState<string | null>(null);
  const [slipModalVisible, setSlipModalVisible] = useState<boolean>(false);
  const [slipModalTitle, setSlipModalTitle] = useState<string>('');
  const [slipModalHtml, setSlipModalHtml] = useState<string>('');

  const countMonthSundays = (year: number, month: number) => {
    const days = new Date(year, month, 0).getDate();
    let count = 0;
    for (let d = 1; d <= days; d++) {
      if (new Date(year, month - 1, d).getDay() === 0) count++;
    }
    return count;
  };

  const resolveCompanyMeta = (clientCode?: string) => {
    const compObj =
      companies.find((c) => clientCode && c.comp_code === clientCode) || companies[0];
    if (!compObj) return undefined;
    const addr2 = [compObj.address2, compObj.city, compObj.pin, compObj.state]
      .filter(Boolean)
      .join(', ');
    return {
      companyName: compObj.company_name,
      companyAddress1: compObj.address1 || '',
      companyAddress2: addr2,
    };
  };

  const handleViewIndividualSlip = async (item: ProcessedSalaryItem) => {
    if (!item.emp_code) return;

    setViewingEmpCode(item.emp_code);
    showToast({
      type: 'info',
      title: 'Opening Salary Slip',
      message: `Loading payslip for ${item.emp_name} (${item.emp_code})...`,
    });

    try {
      const monthName =
        MONTHS_LIST.find((m) => m.num === selectedMonth)?.name ||
        `Month ${selectedMonth}`;

      const staffMember = staffList.find((s) => s.emp_code === item.emp_code);
      const unitObj = units.find((u) => u.unit_code === selectedUnit);
      const companyMeta = resolveCompanyMeta(unitObj?.client_code);

      const pDays = parseFloat(String(item.present_days ?? item.tot_days_present ?? '0')) || 0;
      const mDays = parseFloat(String(item.month_days ?? '30')) || 30;
      const sundaysVal =
        item.sundays !== undefined && item.sundays !== null
          ? parseFloat(String(item.sundays)) || 0
          : countMonthSundays(selectedYear, selectedMonth);

      const structureHeads: Record<string, any> = {};
      const earnedHeads: Record<string, any> = {};
      for (let i = 1; i <= 15; i++) {
        const hk = `head${i}`;
        const dhk = `de_head${i}`;
        const hVal = staffMember?.[hk] ?? item[hk];
        if (hVal !== undefined) structureHeads[hk] = hVal;
        if (item[dhk] !== undefined) earnedHeads[dhk] = item[dhk];
      }

      const ctcAmt = parseFloat(String(item.ctc_amount ?? staffMember?.ctc_amount ?? '0')) || 0;
      const totEarn = parseFloat(String(item.tot_de_head ?? item.tot_earnings ?? item.tot_ehead ?? '0')) || 0;
      const totDed = parseFloat(String(item.tot_dd_head ?? item.tot_deductions ?? item.tot_dhead ?? '0')) || 0;

      const html = generateCrystalPayslipHtml(
        {
          emp_code: item.emp_code,
          emp_name: item.emp_name || staffMember?.emp_name,
          emp_father: staffMember?.emp_father_name || item.emp_father_name,
          job_type: staffMember?.designation_code || item.job_type || staffMember?.status || 'Staff',
          designation: staffMember?.designation_code || item.job_type || 'Staff',
          joining_date: staffMember?.joining_date || item.joining_date,
          client: unitObj?.client_code || '—',
          state: unitObj?.state_name || staffMember?.location || 'Maharashtra',
          location: unitObj?.unit_city || staffMember?.location_city || unitObj?.unit_name || selectedUnit,
          payable_days: pDays,
          month_days: mDays,
          sundays: sundaysVal,
          month_label: `${monthName} ${selectedYear}`,
          month: selectedMonth,
          year: selectedYear,
          net_salary: item.net_salary ?? totEarn,
          gross_salary: ctcAmt || totEarn,
          ctc_amount: ctcAmt,
          month_total: staffMember?.month_total ?? ctcAmt,
          tot_earnings: totEarn,
          tot_de_head: item.tot_de_head ?? totEarn,
          tot_lumpsum: item.tot_lumpsum ?? item.tot_dl_head ?? 0,
          tot_dl_head: item.tot_dl_head ?? item.tot_lumpsum ?? 0,
          tot_deductions: totDed,
          tot_dd_head: item.tot_dd_head ?? totDed,
          ...structureHeads,
          ...earnedHeads,
          labels: proLabels,
          pf_employee: item.pf_employee ?? item.dpf_employee ?? 0,
          dpf_employee: item.dpf_employee ?? item.pf_employee ?? 0,
          pf_employer: item.pf_employer ?? item.dpf_employer ?? 0,
          dpf_employer: item.dpf_employer ?? item.pf_employer ?? 0,
          esic_employee: item.esic_employee ?? item.desic_employee ?? 0,
          desic_employee: item.desic_employee ?? item.esic_employee ?? 0,
          esic_employer: item.esic_employer ?? item.desic_employer ?? 0,
          desic_employer: item.desic_employer ?? item.esic_employer ?? 0,
          professional_tax: item.professional_tax ?? item.dptax ?? 0,
          dptax: item.dptax ?? item.professional_tax ?? 0,
          lwf: item.lwf ?? item.dlwf ?? 0,
          dlwf: item.dlwf ?? item.lwf ?? 0,
          advance_payment: item.advance_payment ?? 0,
        },
        companyMeta
      );

      hideToast();
      setSlipModalTitle(`${item.emp_name} - ${monthName} ${selectedYear}`);
      setSlipModalHtml(html);
      setSlipModalVisible(true);
    } catch (e) {
      console.warn('[AdminSalarySlipScreen] Individual slip view error:', e);
      showToast({
        type: 'error',
        title: 'View Slip Failed',
        message: 'Unable to prepare salary slip preview.',
      });
    } finally {
      setViewingEmpCode(null);
    }
  };

  // Dispatch / Notify Salary Slip directly to employee portal
  const [sendingEmpCode, setSendingEmpCode] = useState<string | null>(null);
  const [isSendingAll, setIsSendingAll] = useState<boolean>(false);

  const buildSlipPayload = (item: ProcessedSalaryItem): PublishedSlipItem => {
    const staffMember = staffList.find((s) => s.emp_code === item.emp_code);
    const unitObj = units.find((u) => u.unit_code === selectedUnit);
    const companyMeta = resolveCompanyMeta(unitObj?.client_code);

    const pDays = parseFloat(String(item.present_days ?? item.tot_days_present ?? '0')) || 0;
    const mDays = parseFloat(String(item.month_days ?? '30')) || 30;
    const sundaysVal =
      item.sundays !== undefined && item.sundays !== null
        ? parseFloat(String(item.sundays)) || 0
        : countMonthSundays(selectedYear, selectedMonth);

    const structureHeads: Record<string, any> = {};
    const earnedHeads: Record<string, any> = {};
    for (let i = 1; i <= 15; i++) {
      const hk = `head${i}`;
      const dhk = `de_head${i}`;
      const hVal = staffMember?.[hk] ?? item[hk];
      if (hVal !== undefined) structureHeads[hk] = hVal;
      if (item[dhk] !== undefined) earnedHeads[dhk] = item[dhk];
    }

    const ctcAmt = parseFloat(String(item.ctc_amount ?? staffMember?.ctc_amount ?? '0')) || 0;
    const totEarn = parseFloat(String(item.tot_de_head ?? item.tot_earnings ?? item.tot_ehead ?? '0')) || 0;
    const totDed = parseFloat(String(item.tot_dd_head ?? item.tot_deductions ?? item.tot_dhead ?? '0')) || 0;

    return {
      emp_code: item.emp_code,
      emp_name: item.emp_name || staffMember?.emp_name || 'Employee',
      emp_father: staffMember?.emp_father_name || item.emp_father_name,
      job_type: staffMember?.designation_code || item.job_type,
      designation: staffMember?.designation_code || item.job_type || 'Staff',
      joining_date: staffMember?.joining_date || item.joining_date,
      client: unitObj?.client_code || '',
      state: unitObj?.state_name || staffMember?.location || '',
      location: unitObj?.unit_city || staffMember?.location_city || unitObj?.unit_name || selectedUnit,
      unit_code: selectedUnit,
      month: selectedMonth,
      year: selectedYear,
      present_days: pDays,
      month_days: mDays,
      sundays: sundaysVal,
      tot_earnings: totEarn,
      tot_de_head: item.tot_de_head ?? totEarn,
      tot_lumpsum: item.tot_lumpsum ?? item.tot_dl_head ?? 0,
      tot_deductions: totDed,
      tot_dd_head: item.tot_dd_head ?? totDed,
      net_salary: item.net_salary ?? totEarn,
      ctc_amount: ctcAmt,
      month_total: staffMember?.month_total ?? ctcAmt,
      ...structureHeads,
      ...earnedHeads,
      labels: proLabels,
      pf_employee: item.pf_employee ?? item.dpf_employee ?? 0,
      dpf_employee: item.dpf_employee ?? item.pf_employee ?? 0,
      pf_employer: item.pf_employer ?? item.dpf_employer ?? 0,
      dpf_employer: item.dpf_employer ?? item.pf_employer ?? 0,
      esic_employee: item.esic_employee ?? item.desic_employee ?? 0,
      desic_employee: item.desic_employee ?? item.esic_employee ?? 0,
      esic_employer: item.esic_employer ?? item.desic_employer ?? 0,
      desic_employer: item.desic_employer ?? item.esic_employer ?? 0,
      professional_tax: item.professional_tax ?? item.dptax ?? 0,
      dptax: item.dptax ?? item.professional_tax ?? 0,
      lwf: item.lwf ?? item.dlwf ?? 0,
      dlwf: item.dlwf ?? item.lwf ?? 0,
      advance_payment: item.advance_payment ?? 0,
      company_meta: companyMeta,
      published_at: new Date().toISOString(),
      published_by: currentUser?.username || 'Admin',
    };
  };

  const handleSendSlipDirect = async (item: ProcessedSalaryItem) => {
    const monthName =
      MONTHS_LIST.find((m) => m.num === selectedMonth)?.name ||
      `Month ${selectedMonth}`;
    setSendingEmpCode(item.emp_code);

    try {
      const payload = buildSlipPayload(item);
      useSalarySlipStore.getState().publishSlip(payload);

      showToast({
        type: 'success',
        title: 'Salary Slip Dispatched',
        message: `Official payslip for ${item.emp_name} (${monthName} ${selectedYear}) has been sent and is now published in their Employee Portal.`,
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Publish Error',
        message: 'Could not complete dispatch notification.',
      });
    } finally {
      setSendingEmpCode(null);
    }
  };

  // Share Slip details via native sheet
  const handleShareSlip = async (item: ProcessedSalaryItem) => {
    const monthName =
      MONTHS_LIST.find((m) => m.num === selectedMonth)?.name ||
      `Month ${selectedMonth}`;
    const netAmount =
      item.net_salary || item.tot_earnings || item.tot_ehead || item.ctc_amount || '0';
    const message = `Official Salary Slip - ${monthName} ${selectedYear}\nWorker: ${item.emp_name} (${item.emp_code})\nNet Payable: ₹${netAmount}\nDays: ${
      item.present_days || item.tot_days_present || '—'
    }`;
    try {
      await Share.share({ title: 'Salary Slip', message });
    } catch {}
  };

  // Filter staff list
  const filteredStaff = useMemo(() => {
    if (!searchStaff.trim()) return staffList;
    const q = searchStaff.toLowerCase();
    return staffList.filter(
      (s) =>
        s.emp_name.toLowerCase().includes(q) ||
        s.emp_code.toLowerCase().includes(q) ||
        (s.designation_code && s.designation_code.toLowerCase().includes(q))
    );
  }, [staffList, searchStaff]);

  // Filter processed workers list
  const filteredWorkers = useMemo(() => {
    if (!searchWorker.trim()) return salaryRows;
    const q = searchWorker.toLowerCase();
    return salaryRows.filter(
      (w) =>
        (w.emp_name && w.emp_name.toLowerCase().includes(q)) ||
        (w.emp_code && w.emp_code.toLowerCase().includes(q)) ||
        (w.job_type && w.job_type.toLowerCase().includes(q))
    );
  }, [salaryRows, searchWorker]);

  const publishedCount = useMemo(() => {
    return filteredWorkers.filter((w) =>
      useSalarySlipStore.getState().isSlipPublished(w.emp_code, selectedMonth, selectedYear)
    ).length;
  }, [filteredWorkers, selectedMonth, selectedYear, isSendingAll, sendingEmpCode]);

  const handleConfirmSendAll = () => {
    const targetWorkers = filteredWorkers.length > 0 ? filteredWorkers : salaryRows;
    if (targetWorkers.length === 0) {
      showToast({
        type: 'warning',
        title: 'No Slips Available',
        message: 'Please calculate or process salary slips first before sending.',
      });
      return;
    }

    const monthName =
      MONTHS_LIST.find((m) => m.num === selectedMonth)?.name ||
      `Month ${selectedMonth}`;

    setAlertConfig({
      visible: true,
      title: 'Send All Salary Slips?',
      message: `Do you want to send salary slips for all ${targetWorkers.length} employees in ${selectedUnit || 'selected unit'} for ${monthName} ${selectedYear}?\n\nThis will instantly publish their official payslips to each employee's mobile portal.`,
      type: 'info',
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
        },
        {
          text: `Send All (${targetWorkers.length})`,
          onPress: () => {
            setAlertConfig((prev) => ({ ...prev, visible: false }));
            executeSendAll(targetWorkers);
          },
        },
      ],
    });
  };

  const executeSendAll = async (targetWorkers: ProcessedSalaryItem[]) => {
    const monthName =
      MONTHS_LIST.find((m) => m.num === selectedMonth)?.name ||
      `Month ${selectedMonth}`;

    setIsSendingAll(true);
    try {
      const payloads = targetWorkers.map((item) => buildSlipPayload(item));
      useSalarySlipStore.getState().publishMultipleSlips(payloads);

      showToast({
        type: 'success',
        title: 'All Slips Dispatched ✓',
        message: `Successfully sent ${payloads.length} salary slips for ${monthName} ${selectedYear} to Employee Portals.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Send All Error',
        message: err?.message || 'Could not complete dispatch for all employees.',
      });
    } finally {
      setIsSendingAll(false);
    }
  };

  // Summary Metrics (Tab 2)
  const summaryMetrics = useMemo(() => {
    const totalWorkers = salaryRows.length;
    let totalNet = 0;
    let totalDays = 0;
    salaryRows.forEach((r) => {
      const net = parseFloat(String(r.net_salary || r.tot_earnings || 0));
      const days = parseFloat(String(r.present_days || r.tot_days_present || 0));
      if (!isNaN(net)) totalNet += net;
      if (!isNaN(days)) totalDays += days;
    });
    const avgDays = totalWorkers > 0 ? (totalDays / totalWorkers).toFixed(1) : '0';
    return {
      totalWorkers,
      totalNet: totalNet.toLocaleString('en-IN', { maximumFractionDigits: 0 }),
      avgDays,
    };
  }, [salaryRows]);

  return (
    <AppScreenContainer
      backgroundColor="#F8FAFC"
      header={
        <AppHeader
          title="Generate Salary Slip"
          subtitle="Staff Structure Design & Unit Slips"
          onBack={goBack}
        />
      }
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#0F766E"
            colors={['#0F766E']}
          />
        }
      >
        {/* Step 1: Site Unit Selection Card */}
        <View style={styles.filterCard}>
          <View style={styles.cardTitleRow}>
            <View style={styles.cardTitleLeft}>
              <AppIcon name="map-pin" size={16} color="#0F766E" />
              <Text style={styles.cardTitle} numberOfLines={1}>
                1. Select Deployment Site Unit
              </Text>
            </View>
            <View style={styles.scopeBadge}>
              <Text style={styles.scopeBadgeText}>
                {selectedUnit ? selectedUnit : 'Unit'}
              </Text>
            </View>
          </View>

          {loadingUnits ? (
            <ActivityIndicator size="small" color="#0F766E" style={{ marginVertical: 8 }} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}
            >
              {units.map((u) => {
                const isSelected = selectedUnit === u.unit_code;
                return (
                  <TouchableOpacity
                    key={u.unit_code}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => setSelectedUnit(u.unit_code)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {u.unit_code}
                      {u.unit_name ? ` • ${u.unit_name}` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Step 2 & 3: Segmented Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'staff' && styles.tabItemActive]}
            onPress={() => setActiveTab('staff')}
            activeOpacity={0.75}
          >
            <AppIcon
              name="users"
              size={14}
              color={activeTab === 'staff' ? '#0F766E' : '#64748B'}
            />
            <Text
              style={[styles.tabText, activeTab === 'staff' && styles.tabTextActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              Staff Setup
            </Text>
            <View style={[styles.tabBadge, activeTab === 'staff' && styles.tabBadgeActive]}>
              <Text
                style={[styles.tabBadgeText, activeTab === 'staff' && styles.tabBadgeTextActive]}
                numberOfLines={1}
              >
                {staffList.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'process' && styles.tabItemActive]}
            onPress={() => setActiveTab('process')}
            activeOpacity={0.75}
          >
            <AppIcon
              name="refresh"
              size={14}
              color={activeTab === 'process' ? '#0F766E' : '#64748B'}
            />
            <Text
              style={[styles.tabText, activeTab === 'process' && styles.tabTextActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              Process Slips
            </Text>
            <View style={[styles.tabBadge, activeTab === 'process' && styles.tabBadgeActive]}>
              <Text
                style={[styles.tabBadgeText, activeTab === 'process' && styles.tabBadgeTextActive]}
                numberOfLines={1}
              >
                {salaryRows.length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* TAB 1: STAFF SALARY SETUP & STRUCTURE DESIGN */}
        {activeTab === 'staff' && (
          <View>
            {/* Rule note */}
            <View style={styles.ruleInfoRow}>
              <AppIcon name="shield" size={13} color="#0F766E" />
              <Text style={styles.ruleInfoText}>
                Define each staff member's monthly CTC and wage breakdown before processing.
              </Text>
            </View>

            {/* Search Staff */}
            {staffList.length > 0 && (
              <View style={styles.searchWrap}>
                <AppIcon name="search" size={15} color="#64748B" />
                <TextInput
                  placeholder="Search staff by name, ID or role..."
                  placeholderTextColor="#94A3B8"
                  value={searchStaff}
                  onChangeText={setSearchStaff}
                  style={styles.searchInput}
                />
                {searchStaff ? (
                  <TouchableOpacity onPress={() => setSearchStaff('')}>
                    <AppIcon name="close" size={14} color="#64748B" />
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            {/* Section Header */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                Unit Staff Members ({selectedUnit || 'All'})
              </Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{filteredStaff.length} Staff</Text>
              </View>
            </View>

            {loadingStaff ? (
              <View style={{ paddingVertical: 36, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0F766E" />
                <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 8 }}>
                  Loading staff list for {selectedUnit}...
                </Text>
              </View>
            ) : filteredStaff.length > 0 ? (
              filteredStaff.map((staff) => {
                const initials = (staff.emp_name || staff.emp_code || 'S')
                  .substring(0, 2)
                  .toUpperCase();

                return (
                  <View key={staff.emp_code} style={styles.staffCard}>
                    <View style={styles.staffCardTop}>
                      <View style={styles.staffInfoLeft}>
                        <View style={styles.staffAvatarCircle}>
                          <Text style={styles.staffAvatarText}>{initials}</Text>
                        </View>
                        <View style={styles.staffNameWrap}>
                          <Text style={styles.staffName} numberOfLines={1}>
                            {staff.emp_name}
                          </Text>
                          <Text style={styles.staffMetaText} numberOfLines={1}>
                            ID: {staff.emp_code} • {staff.designation_code || staff.job_type || 'Staff'}
                          </Text>
                        </View>
                      </View>

                      {/* Status Badge */}
                      <View
                        style={[
                          styles.statusPill,
                          staff.hasSalary
                            ? styles.statusPillSuccess
                            : styles.statusPillWarning,
                        ]}
                      >
                        <Text
                          style={
                            staff.hasSalary
                              ? styles.statusPillSuccessText
                              : styles.statusPillWarningText
                          }
                        >
                          {staff.hasSalary
                            ? `✓ ₹${staff.ctc_amount?.toLocaleString('en-IN')}/mo`
                            : '⚠️ Setup Needed'}
                        </Text>
                      </View>
                    </View>

                    {/* Salary Breakup Chips */}
                    {staff.hasSalary && (
                      <View style={styles.salaryBreakupRow}>
                        <View style={styles.breakupChip}>
                          <Text style={styles.breakupChipText}>
                            Basic: ₹{staff.head1?.toLocaleString('en-IN') || '—'}
                          </Text>
                        </View>
                        <View style={styles.breakupChip}>
                          <Text style={styles.breakupChipText}>
                            HRA: ₹{staff.head2?.toLocaleString('en-IN') || '—'}
                          </Text>
                        </View>
                        <View style={styles.breakupChip}>
                          <Text style={styles.breakupChipText}>
                            PF: {['yes', '1', 'true'].includes(String(staff.pf_employee_flag || '').trim().toLowerCase()) ? '12%' : 'No'}
                          </Text>
                        </View>
                        <View style={styles.breakupChip}>
                          <Text style={styles.breakupChipText}>
                            ESIC: {['yes', '1', 'true'].includes(String(staff.esic_employee_flag || '').trim().toLowerCase()) ? '0.75%' : 'No'}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Configure / Edit Action Button */}
                    <View style={styles.staffActionRow}>
                      <TouchableOpacity
                        style={staff.hasSalary ? styles.editBtn : styles.configureBtn}
                        onPress={() => handleOpenSalaryModal(staff)}
                        activeOpacity={0.8}
                      >
                        <AppIcon
                          name={staff.hasSalary ? 'edit' : 'plus'}
                          size={13}
                          color={staff.hasSalary ? '#0F766E' : '#FFFFFF'}
                        />
                        <Text
                          style={
                            staff.hasSalary
                              ? styles.editBtnText
                              : styles.configureBtnText
                          }
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.85}
                        >
                          {staff.hasSalary
                            ? 'Edit Structure'
                            : 'Configure Structure'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyBox}>
                <AppIcon name="users" size={38} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No Staff Registered</Text>
                <Text style={styles.emptySubtitle}>
                  No active staff members found under Unit {selectedUnit}. Register staff
                  from Add Staff Screen to design their salary structures.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* TAB 2: PROCESS & SALARY SLIPS */}
        {activeTab === 'process' && (
          <View>
            {/* Scope Card for Month & Year */}
            <View style={styles.filterCard}>
              <View style={styles.cardTitleRow}>
                <View style={styles.cardTitleLeft}>
                  <AppIcon name="calendar" size={16} color="#0F766E" />
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    Calculation Month & Year
                  </Text>
                </View>
                <View style={styles.scopeBadge}>
                  <Text style={styles.scopeBadgeText}>Unit Payroll</Text>
                </View>
              </View>

              {/* Business Rule Notice */}
              <View style={styles.ruleInfoRow}>
                <AppIcon name="shield" size={13} color="#0F766E" />
                <Text style={styles.ruleInfoText}>
                  Requires approved attendance muster for the selected unit & month.
                </Text>
              </View>

              {/* Month Selector */}
              <Text style={styles.fieldLabel}>Select Month:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipsScroll}
              >
                {MONTHS_LIST.map((m) => {
                  const isSelected = selectedMonth === m.num;
                  return (
                    <TouchableOpacity
                      key={m.num}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setSelectedMonth(m.num)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {m.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Year Selector */}
              <Text style={styles.fieldLabel}>Select Year:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipsScroll}
              >
                {[2024, 2025, 2026, 2027].map((y) => {
                  const isSelected = selectedYear === y;
                  return (
                    <TouchableOpacity
                      key={y}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setSelectedYear(y)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {y}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Action Buttons Row */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.processBtn}
                  onPress={handleProcessSalary}
                  disabled={processing || isSendingAll}
                  activeOpacity={0.85}
                >
                  {processing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <AppIcon name="refresh" size={14} color="#FFFFFF" />
                      <Text
                        style={styles.processBtnText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                      >
                        Process Salary
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {salaryRows.length > 0 && (
                  <TouchableOpacity
                    style={[styles.sendAllMainBtn, isSendingAll && styles.sendAllMainBtnDisabled]}
                    onPress={handleConfirmSendAll}
                    disabled={isSendingAll || processing}
                    activeOpacity={0.85}
                  >
                    {isSendingAll ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <AppIcon name="mail" size={14} color="#FFFFFF" />
                        <Text
                          style={styles.sendAllMainBtnText}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.8}
                        >
                          Send All Slips ({salaryRows.length})
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Executive Summary Metrics */}
            {salaryRows.length > 0 && (
              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>PROCESSED</Text>
                  <Text style={styles.summaryVal}>{summaryMetrics.totalWorkers}</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>TOTAL NET</Text>
                  <Text style={[styles.summaryVal, { color: '#047857' }]}>
                    ₹{summaryMetrics.totalNet}
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>AVG DAYS</Text>
                  <Text style={styles.summaryVal}>{summaryMetrics.avgDays} d</Text>
                </View>
              </View>
            )}

            {/* Search Worker Input */}
            {salaryRows.length > 0 && (
              <View style={styles.searchWrap}>
                <AppIcon name="search" size={15} color="#64748B" />
                <TextInput
                  placeholder="Search processed worker by name, ID or role..."
                  placeholderTextColor="#94A3B8"
                  value={searchWorker}
                  onChangeText={setSearchWorker}
                  style={styles.searchInput}
                />
                {searchWorker ? (
                  <TouchableOpacity onPress={() => setSearchWorker('')}>
                    <AppIcon name="close" size={14} color="#64748B" />
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            {/* Section Header */}
            <View style={styles.sectionHeaderRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.sectionTitle}>
                  Processed Salary Slips ({selectedUnit || 'All'})
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{filteredWorkers.length} Slips</Text>
                  </View>
                  {publishedCount > 0 && (
                    <View style={styles.publishedCountBadge}>
                      <Text style={styles.publishedCountBadgeText}>
                        {publishedCount}/{filteredWorkers.length} Sent ✓
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {filteredWorkers.length > 0 && (
                <TouchableOpacity
                  style={[styles.sendAllHeaderBtn, isSendingAll && styles.sendAllHeaderBtnDisabled]}
                  onPress={handleConfirmSendAll}
                  disabled={isSendingAll}
                  activeOpacity={0.85}
                >
                  {isSendingAll ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <AppIcon name="mail" size={12} color="#FFFFFF" />
                      <Text style={styles.sendAllHeaderBtnText}>
                        {publishedCount === filteredWorkers.length && filteredWorkers.length > 0
                          ? 'Resend All'
                          : 'Send All'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {loadingSalary ? (
              <View style={{ paddingVertical: 36, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0F766E" />
                <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 8 }}>
                  Fetching MySQL payroll calculations...
                </Text>
              </View>
            ) : filteredWorkers.length > 0 ? (
              filteredWorkers.map((item, idx) => {
                const net =
                  item.net_salary ??
                  item.tot_de_head ??
                  item.tot_earnings ??
                  item.tot_ehead ??
                  item.ctc_amount ??
                  '0';
                const gross =
                  item.tot_de_head ?? item.tot_earnings ?? item.tot_ehead ?? item.ctc_amount ?? '0';
                const dedRaw =
                  item.tot_deductions ?? item.tot_dd_head ?? item.tot_dhead;
                const ded =
                  dedRaw !== undefined && dedRaw !== null
                    ? dedRaw
                    : (
                        (parseFloat(String(item.pf_employee ?? item.dpf_employee ?? 0)) || 0) +
                        (parseFloat(String(item.esic_employee ?? item.desic_employee ?? 0)) || 0) +
                        (parseFloat(String(item.professional_tax ?? item.dptax ?? 0)) || 0) +
                        (parseFloat(String(item.lwf ?? item.dlwf ?? 0)) || 0) +
                        (parseFloat(String(item.advance_payment ?? 0)) || 0)
                      ).toFixed(2);
                const daysPresent =
                  item.present_days ?? item.tot_days_present ?? item.month_days ?? '—';
                const sundaysBadge =
                  item.sundays !== undefined && Number(item.sundays) > 0
                    ? `${daysPresent} (+${item.sundays} W/O)`
                    : String(daysPresent);
                const initials = (item.emp_name || item.emp_code || 'W')
                  .substring(0, 2)
                  .toUpperCase();

                return (
                  <View key={item.emp_code || idx} style={styles.workerCard}>
                    <View style={styles.workerTopRow}>
                      <View style={styles.workerInfoLeft}>
                        <View style={styles.avatarCircle}>
                          <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                        <View style={styles.workerNameWrap}>
                          <Text style={styles.workerName} numberOfLines={1}>
                            {item.emp_name}
                          </Text>
                          <Text style={styles.workerCodeBadge} numberOfLines={1}>
                            ID: {item.emp_code} • {item.job_type || 'Staff'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.netPayPill}>
                        <Text style={styles.netPayLabel}>Net Payable</Text>
                        <Text style={styles.netPayAmount}>₹{net}</Text>
                      </View>
                    </View>

                    {/* Stats Grid */}
                    <View style={styles.statsGrid}>
                      <View style={styles.statCol}>
                        <Text style={styles.statColLabel}>Days Present</Text>
                        <Text style={styles.statColVal}>{sundaysBadge}</Text>
                      </View>
                      <View style={styles.statCol}>
                        <Text style={styles.statColLabel}>Earned Gross</Text>
                        <Text style={styles.statColVal}>₹{gross}</Text>
                      </View>
                      <View style={styles.statCol}>
                        <Text style={styles.statColLabel}>Deductions</Text>
                        <Text style={[styles.statColVal, { color: '#DC2626' }]}>₹{ded}</Text>
                      </View>
                    </View>

                    {/* Actions Row */}
                    <View style={styles.workerActionsRow}>
                      <TouchableOpacity
                        style={styles.viewSlipActionBtn}
                        onPress={() => handleViewIndividualSlip(item)}
                        activeOpacity={0.8}
                        disabled={viewingEmpCode === item.emp_code}
                      >
                        {viewingEmpCode === item.emp_code ? (
                          <ActivityIndicator size="small" color="#1D4ED8" />
                        ) : (
                          <>
                            <AppIcon name="eye" size={13} color="#1D4ED8" />
                            <Text
                              style={styles.viewSlipActionBtnText}
                              numberOfLines={1}
                              adjustsFontSizeToFit
                              minimumFontScale={0.85}
                            >
                              View Slip
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.sendSlipActionBtn}
                        onPress={() => handleSendSlipDirect(item)}
                        activeOpacity={0.8}
                        disabled={sendingEmpCode === item.emp_code}
                      >
                        {sendingEmpCode === item.emp_code ? (
                          <ActivityIndicator size="small" color="#0F766E" />
                        ) : (
                          <Text
                            style={[
                              styles.sendSlipActionBtnText,
                              useSalarySlipStore.getState().isSlipPublished(item.emp_code, selectedMonth, selectedYear) && {
                                color: '#047857',
                                fontWeight: '700',
                              },
                            ]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.85}
                          >
                            {useSalarySlipStore.getState().isSlipPublished(item.emp_code, selectedMonth, selectedYear)
                              ? 'Slip Sent ✓'
                              : 'Send Slip'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyBox}>
                <AppIcon name="document" size={38} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No Processed Slips Found</Text>
                <Text style={styles.emptySubtitle}>
                  Click "Calculate / Process Salary" above to generate salary slips for{' '}
                  {MONTHS_LIST.find((m) => m.num === selectedMonth)?.name} {selectedYear} from
                  attendance and wage rate cards.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Salary Structure Configuration Modal */}
      <Modal
        visible={salaryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSalaryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  Salary Structure Design
                </Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {selectedStaff?.emp_name} ({selectedStaff?.emp_code}) • {selectedUnit}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSalaryModalVisible(false)}
                activeOpacity={0.7}
              >
                <AppIcon name="close" size={14} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* CTC Input */}
            <Text style={styles.modalInputLabel}>Monthly CTC Amount (₹):</Text>
            <View style={styles.modalInputWrap}>
              <Text style={styles.modalCurrencyPrefix}>₹</Text>
              <TextInput
                placeholder="Enter CTC (e.g. 25000)"
                placeholderTextColor="#94A3B8"
                value={ctcInput}
                onChangeText={setCtcInput}
                keyboardType="numeric"
                style={styles.modalTextInput}
              />
            </View>

            {/* Auto-calculate Heads Button */}
            <TouchableOpacity
              style={styles.autoCalcActionBtn}
              onPress={handleAutoCalculateHeads}
              disabled={calculatingHeads}
              activeOpacity={0.8}
            >
              {calculatingHeads ? (
                <ActivityIndicator size="small" color="#0F766E" />
              ) : (
                <>
                  <AppIcon name="refresh" size={12} color="#0F766E" />
                  <Text
                    style={styles.autoCalcActionBtnText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    Auto-Calculate (50% Basic • 20% HRA)
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Earning Heads (Editable Inputs) */}
            <View style={styles.headsPreviewBox}>
              <Text style={styles.headsPreviewTitle}>Earning Heads (Editable)</Text>
              <View style={styles.headsPreviewGrid}>
                <View style={styles.headPreviewItem}>
                  <Text style={styles.headPreviewLabel}>Basic Pay (₹)</Text>
                  <View style={styles.headPreviewInputWrap}>
                    <Text style={styles.headPreviewInputPrefix}>₹</Text>
                    <TextInput
                      placeholder="Basic"
                      placeholderTextColor="#94A3B8"
                      value={head1Input}
                      onChangeText={setHead1Input}
                      keyboardType="numeric"
                      style={styles.headPreviewTextInput}
                    />
                  </View>
                </View>
                <View style={styles.headPreviewItem}>
                  <Text style={styles.headPreviewLabel}>HRA (₹)</Text>
                  <View style={styles.headPreviewInputWrap}>
                    <Text style={styles.headPreviewInputPrefix}>₹</Text>
                    <TextInput
                      placeholder="HRA"
                      placeholderTextColor="#94A3B8"
                      value={head2Input}
                      onChangeText={setHead2Input}
                      keyboardType="numeric"
                      style={styles.headPreviewTextInput}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Statutory Checkboxes */}
            <View style={styles.statutoryRow}>
              <TouchableOpacity
                style={styles.checkboxItem}
                onPress={() => setPfEnabled(!pfEnabled)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.checkboxSquare,
                    pfEnabled && styles.checkboxSquareChecked,
                  ]}
                >
                  {pfEnabled && <AppIcon name="check" size={11} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkboxText}>PF (12%)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxItem}
                onPress={() => setEsicEnabled(!esicEnabled)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.checkboxSquare,
                    esicEnabled && styles.checkboxSquareChecked,
                  ]}
                >
                  {esicEnabled && <AppIcon name="check" size={11} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkboxText}>ESIC (0.75%)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxItem}
                onPress={() => setLwfEnabled(!lwfEnabled)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.checkboxSquare,
                    lwfEnabled && styles.checkboxSquareChecked,
                  ]}
                >
                  {lwfEnabled && <AppIcon name="check" size={11} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkboxText}>LWF</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Buttons */}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setSalaryModalVisible(false)}
                disabled={savingSalary}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveStaffSalary}
                disabled={savingSalary}
                activeOpacity={0.85}
              >
                {savingSalary ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <AppIcon name="check" size={14} color="#FFFFFF" />
                    <Text
                      style={styles.modalSaveBtnText}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      Save Structure
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Slip Preview Modal (1:1 Authentic Crystal Reports Layout matching Image 1) ─── */}
      <Modal
        visible={slipModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSlipModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 8,
          }}
        >
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              height: '95%',
              width: '100%',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header matching Employee Salary Slip modal */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 14,
                paddingVertical: 12,
                backgroundColor: '#FFFFFF',
                borderBottomWidth: 1,
                borderBottomColor: '#E2E8F0',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 }}>
                <AppIcon name="file-text" size={18} color="#2563EB" />
                <Text
                  style={{ fontSize: 13, fontWeight: '800', color: '#0F172A', flexShrink: 1 }}
                  numberOfLines={1}
                >
                  {slipModalTitle ? `Payslip (${slipModalTitle})` : 'Salary Slip Preview'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      const jobName = `Salary_Slip_${selectedMonth}_${selectedYear}`;
                      if (PrintPdfModule?.print) {
                        await PrintPdfModule.print(slipModalHtml, jobName);
                      }
                    } catch (e) {
                      console.warn('Print error from modal:', e);
                    }
                  }}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    backgroundColor: '#2563EB',
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 8,
                  }}
                >
                  <AppIcon name="download" size={13} color="#FFFFFF" />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                    Save PDF
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSlipModalVisible(false)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#F1F5F9',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AppIcon name="x" size={16} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
              {slipModalHtml ? (
                <WebViewComponent
                  originWhitelist={['*']}
                  source={{ html: slipModalHtml, baseUrl: 'https://localhost' }}
                  style={{ flex: 1, backgroundColor: '#F1F5F9' }}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  scalesPageToFit={true}
                  mixedContentMode="always"
                  showsVerticalScrollIndicator={true}
                  showsHorizontalScrollIndicator={false}
                  nestedScrollEnabled={true}
                  overScrollMode="never"
                  startInLoadingState={true}
                  renderLoading={() => (
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#F1F5F9',
                      }}
                    >
                      <ActivityIndicator size="large" color="#2563EB" />
                      <Text style={{ marginTop: 10, color: '#475569', fontSize: 13 }}>
                        Rendering Salary Slip...
                      </Text>
                    </View>
                  )}
                  onError={(syntheticEvent: any) => {
                    console.warn('[AdminSalarySlipScreen] WebView error:', syntheticEvent?.nativeEvent);
                  }}
                />
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#2563EB" />
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Interactive Alert Modal for Attendance Muster Gate Confirmation */}
      <CustomAlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        verticalButtons={alertConfig.verticalButtons}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </AppScreenContainer>
  );
};
