import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Modal,
  Platform,
  Share,
  NativeModules,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const { PrintPdfModule } = NativeModules;
const WebViewComponent: any = WebView;
import {
  AppIcon,
  AppButton,
  CustomAlertModal,
  AppHeader,
} from '../../../components/common';
import { useNavigation } from '../../../navigation';
import { useTenantStore } from '../../../store/tenantStore';
import { useAuthStore } from '../../../store/authStore';
import { showToast } from '../../../store/toastStore';
import { useSalarySlipStore } from '../../../store/salarySlipStore';
import { staffApi, apiClient } from '../../../api';
import { apiConfig, API_ENDPOINTS } from '../../../api/config';
import { generateCrystalPayslipHtml } from '../../../utils/payslipHtml';
import { colors } from '../../../theme';
import { styles } from './SalarySlipScreen.styles';

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function numberToIndianWords(amount: number): string {
  if (isNaN(amount) || amount <= 0) return 'Rupees Zero Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + (n % 10 > 0 ? ' ' + a[n % 10] : '');
    } else if (n > 0) {
      str += a[n];
    }
    return str.trim();
  };

  const whole = Math.floor(amount);
  const paise = Math.round((amount - whole) * 100);

  const crore = Math.floor(whole / 10000000);
  const lakh = Math.floor((whole % 10000000) / 100000);
  const thousand = Math.floor((whole % 100000) / 1000);
  const remainder = whole % 1000;

  let res = '';
  if (crore > 0) res += inWords(crore) + ' Crore ';
  if (lakh > 0) res += inWords(lakh) + ' Lakh ';
  if (thousand > 0) res += inWords(thousand) + ' Thousand ';
  if (remainder > 0) res += inWords(remainder);

  let out = 'Rupees ' + res.trim();
  if (paise > 0) {
    out += ' and ' + inWords(paise) + ' Paise';
  }
  return out + ' Only';
}

interface MonthOption {
  id: string;
  label: string;
  monthNum: number;
  year: number;
  status: string;
}

// ─── Normalize salary record: backend returns CamelCase (Emp_Code, Emp_Name, Joining_Date)
// but frontend reads lowercase (emp_code, emp_name, joining_date). This helper creates
// BOTH forms so all field reads work regardless of which endpoint provided the data.
function normalizeSalaryRecord(r: any): any {
  if (!r) return r;
  const n: any = { ...r };
  // CamelCase -> lowercase aliases (backend mobile-salary-slip/data returns these)
  const aliases: [string, string][] = [
    ['Emp_Code',          'emp_code'],
    ['Emp_Name',          'emp_name'],
    ['Emp_Father',        'emp_father'],
    ['Joining_Date',      'joining_date'],
    ['Client',            'client'],
    ['Unit_City',         'city'],
    ['UnitState',         'state'],
    ['Total_Days_Present','total_days_present'],
    ['Working_Days',      'month_days'],
    ['Basic',             'basic'],
    ['Vda',               'vda'],
    ['basic_vda',         'basic_vda'],
    ['hra',               'hra'],
    ['cca',               'cca'],
    ['PF',                'PF'],
    ['ESIC',              'ESIC'],
    ['pt',                'pt'],
    ['lwf',               'lwf'],
    ['fine',              'fine'],
    ['advance',           'advance'],
    ['Payment',           'Payment'],
    ['grade',             'designation'],
    ['UAN_No',            'uan_no'],
    ['PF_No',             'pf_no'],
    ['PAN_No',            'pan'],
    ['ESI_No',            'esic_no'],
    ['BANK_EMP_AC_CODE',  'bank_account'],
    ['PF_BANK_NAME',      'bank_name'],
    ['BANK_BRANCH',       'bank_branch'],
    ['Bank_holder_name',  'bank_holder_name'],
  ];
  for (const [camel, snake] of aliases) {
    if (n[camel] !== undefined && !n[snake]) n[snake] = n[camel];
    if (n[snake] !== undefined && !n[camel]) n[camel] = n[snake];
  }

  // Staff Payroll Pro statutory & totals aliases (only mirror within pro fields; never inject de_head1 for legacy rows)
  const pfEmp = n.pf_employee ?? n.dpf_employee;
  if (pfEmp !== undefined) {
    n.pf_employee = pfEmp;
    n.dpf_employee = pfEmp;
  }
  const pfEmpr = n.pf_employer ?? n.dpf_employer;
  if (pfEmpr !== undefined) {
    n.pf_employer = pfEmpr;
    n.dpf_employer = pfEmpr;
  }
  const esicEmp = n.esic_employee ?? n.desic_employee;
  if (esicEmp !== undefined) {
    n.esic_employee = esicEmp;
    n.desic_employee = esicEmp;
  }
  const esicEmpr = n.esic_employer ?? n.desic_employer;
  if (esicEmpr !== undefined) {
    n.esic_employer = esicEmpr;
    n.desic_employer = esicEmpr;
  }
  const ptax = n.professional_tax ?? n.dptax ?? n.pt;
  if (ptax !== undefined) {
    n.professional_tax = ptax;
    n.dptax = ptax;
    if (n.pt === undefined) n.pt = ptax;
  }
  const lwfVal = n.lwf ?? n.dlwf ?? n.lwf_salary;
  if (lwfVal !== undefined) {
    n.lwf = lwfVal;
    n.dlwf = lwfVal;
  }
  const earnPro = n.tot_de_head ?? n.tot_earnings ?? n.tot_ehead;
  if (earnPro !== undefined) {
    n.tot_earnings = earnPro;
    if (n.tot_de_head === undefined && n.de_head1 !== undefined) n.tot_de_head = earnPro;
  }
  const dedPro = n.tot_dd_head ?? n.tot_deductions ?? n.tot_dhead;
  if (dedPro !== undefined) {
    n.tot_deductions = dedPro;
  }

  return n;
}

export const SalarySlipScreen: React.FC = () => {
  const { goBack } = useNavigation();
  const { currentCompany } = useTenantStore();
  const { currentUser } = useAuthStore();

  const [availableMonths, setAvailableMonths] = useState<MonthOption[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<MonthOption | null>(null);
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [salaryRecord, setSalaryRecord] = useState<any | null>(null);
  const [proLabels, setProLabels] = useState<Record<string, string>>({});
  const [companyMeta, setCompanyMeta] = useState<{
    companyName?: string;
    companyAddress1?: string;
    companyAddress2?: string;
  } | null>(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [slipHtml, setSlipHtml] = useState<string | null>(null);
  const pdfWebViewRef = useRef<any>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type: 'info' | 'warning' | 'danger' | 'success';
  }>({
    title: '',
    message: '',
    type: 'info',
  });

  const brandColor = currentCompany?.brandColor || '#2563EB';
  const empCode = currentUser?.empCode || currentUser?.username || '';
  const employeeName = currentUser?.name || (currentUser as any)?.empName || (currentUser as any)?.emp_name || currentUser?.username || 'Employee';
  const compName = companyMeta?.companyName || currentCompany?.name || 'NG GLOBAL INTEGRATED SOLUTIONS INDIA PRIVATE LIMITED';
  const unitCode =
    (currentUser as any)?.unitCode ||
    (currentUser as any)?.unit_code ||
    (currentUser as any)?.branchOrUnit ||
    (currentUser as any)?.scope?.unit_code ||
    (currentUser as any)?.branch ||
    '';

  const [employeeProfile, setEmployeeProfile] = useState<any>(null);

  const fetchLiveSalary = useCallback(async () => {
    setLoading(true);
    try {
      if (empCode) {
        let fetchedProfile: any = null;
        // Also fetch employee profile / directory record so metadata (Father Name, Joining Date, Unit, Location) are populated
        try {
          const empDetailRes = await apiClient.get<any>(
            `${API_ENDPOINTS.EMPLOYEES}?emp_code=${encodeURIComponent(empCode)}`
          );
          if (empDetailRes.success && empDetailRes.data) {
            const eData = Array.isArray(empDetailRes.data)
              ? empDetailRes.data[0]
              : empDetailRes.data.results?.[0] || empDetailRes.data;
            if (eData) {
              fetchedProfile = eData;
              setEmployeeProfile(eData);
            }
          }
        } catch {}

        // Fetch company metadata from master_company so payslip header reflects live DB company
        try {
          const compRes = await apiClient.get<any>(`${API_ENDPOINTS.COMPANIES}?page=1`);
          if (compRes.success && compRes.data) {
            const cList = Array.isArray(compRes.data)
              ? compRes.data
              : compRes.data.results || [];
            const targetCompCode = fetchedProfile?.client_code || fetchedProfile?.comp_code;
            const compObj =
              cList.find((c: any) => targetCompCode && c.comp_code === targetCompCode) ||
              cList[0];
            if (compObj) {
              const addr2 = [compObj.address2, compObj.city, compObj.pin, compObj.state]
                .filter(Boolean)
                .join(', ');
              setCompanyMeta({
                companyName: compObj.company_name,
                companyAddress1: compObj.address1 || '',
                companyAddress2: addr2,
              });
            }
          }
        } catch {}

        // Optional: fetch staff-salary-details to enrich base structure heads (head1..head15, ctc_amount, month_total)
        let staffDetailsRow: Record<string, any> | null = null;
        try {
          const sdRes = await apiClient.get<any>(
            `${API_ENDPOINTS.STAFF_SALARY_DETAILS}?emp_code=${encodeURIComponent(empCode)}`
          );
          if (sdRes.success && sdRes.data) {
            const sdList = Array.isArray(sdRes.data)
              ? sdRes.data
              : sdRes.data.results || [];
            const match = sdList.find(
              (r: any) => String(r.emp_code || '').trim().toUpperCase() === String(empCode).trim().toUpperCase()
            );
            if (match) staffDetailsRow = match;
          }
        } catch {}

        // Ensure persistent slips are hydrated from secure storage
        if (!useSalarySlipStore.getState().isHydrated) {
          await useSalarySlipStore.getState().hydrateSlips();
        }

        // 0. Primary priority: Check published / dispatched slips from HR Dispatch Store
        const published = useSalarySlipStore.getState().getPublishedSlipsForEmp(empCode);
        if (published && published.length > 0) {
          const publishedMonths: MonthOption[] = published.map((p) => {
            const mNum = p.month;
            const yNum = p.year;
            return {
              id: `${yNum}_${String(mNum).padStart(2, '0')}`,
              label: `${MONTH_NAMES[mNum] || `Month ${mNum}`} ${yNum}`,
              monthNum: mNum,
              year: yNum,
              status: 'Approved & Dispatched',
            };
          });

          setAllRecords(published);
          setAvailableMonths(publishedMonths);
          const activeSlip = published[published.length - 1];
          if (activeSlip.labels && typeof activeSlip.labels === 'object') {
            setProLabels(activeSlip.labels);
          }
          if (activeSlip.company_meta) {
            setCompanyMeta(activeSlip.company_meta);
          }
          const resolvedNet =
            activeSlip.net_salary !== undefined && activeSlip.net_salary !== null
              ? String(activeSlip.net_salary)
              : activeSlip.tot_earnings !== undefined
              ? String(activeSlip.tot_earnings)
              : '0.00';

          setSelectedMonth(publishedMonths[publishedMonths.length - 1]);
          setSalaryRecord(normalizeSalaryRecord({
            ...(staffDetailsRow ? { ctc_amount: staffDetailsRow.ctc_amount, month_total: staffDetailsRow.month_total } : {}),
            ...activeSlip,
            net_salary: resolvedNet,
            isApprovedPro: true,
            status: 'APPROVED & DISPATCHED BY HR',
          }));
          setLoading(false);
          setRefreshing(false);
          return;
        }

        // 1. Secondary priority: Query approved processed records from real HR table (payroll_staff_salary_pro via pro_list)
        try {
          const resolvedUnit = (currentUser as any)?.scope?.unit_code || fetchedProfile?.unit_code || '';
          const proRes = await staffApi.getApprovedSalaryList({
            ...(resolvedUnit ? { unit_code: resolvedUnit } : {}),
            emp_code: empCode,
          });

          if (proRes.success && proRes.data) {
            const respLabels = (proRes.data as any).labels;
            if (respLabels && typeof respLabels === 'object') {
              setProLabels(respLabels);
            }
            const list = (proRes.data as any).results || proRes.data;
            if (Array.isArray(list) && list.length > 0) {
              const cleanEmp = String(empCode || '').trim().toUpperCase();
              const unpaddedEmp = cleanEmp.replace(/^0+/, '');
              const myRows = list
                .filter((r: any) => {
                  const rCode = String(r.emp_code || '').trim().toUpperCase();
                  return rCode === cleanEmp || rCode.replace(/^0+/, '') === unpaddedEmp;
                })
                .map((r: any) => {
                  const enriched: any = { ...r };
                  if (staffDetailsRow) {
                    for (let i = 1; i <= 15; i++) {
                      const hk = `head${i}`;
                      if (enriched[hk] === undefined && staffDetailsRow[hk] !== undefined) {
                        enriched[hk] = staffDetailsRow[hk];
                      }
                    }
                    if (!enriched.ctc_amount && staffDetailsRow.ctc_amount) {
                      enriched.ctc_amount = staffDetailsRow.ctc_amount;
                    }
                    if (!enriched.month_total && staffDetailsRow.month_total) {
                      enriched.month_total = staffDetailsRow.month_total;
                    }
                  }
                  if (respLabels && typeof respLabels === 'object') {
                    enriched.labels = respLabels;
                  }
                  return enriched;
                });

              if (myRows.length > 0) {
                setAllRecords(myRows);

                // Dynamically build months strictly from records existing in SQL
                const months: MonthOption[] = myRows.map((r: any) => {
                  const mNum = parseInt(r.month, 10);
                  const yNum = parseInt(r.year, 10);
                  const label = `${MONTH_NAMES[mNum] || `Month ${mNum}`} ${yNum}`;
                  return {
                    id: `${yNum}_${String(mNum).padStart(2, '0')}`,
                    label,
                    monthNum: mNum,
                    year: yNum,
                    status: 'Approved',
                  };
                });

                setAvailableMonths(months);

                setSelectedMonth((prev) => {
                  const active = prev ? months.find((m) => m.id === prev.id) || months[0] : months[0];
                  const activeRecord = myRows.find(
                    (r: any) =>
                      parseInt(r.month, 10) === active.monthNum &&
                      parseInt(r.year, 10) === active.year
                  ) || myRows[0];

                  const resolvedNet =
                    activeRecord.net_salary !== undefined && activeRecord.net_salary !== null
                      ? String(activeRecord.net_salary)
                      : activeRecord.tot_de_head !== undefined
                      ? String(activeRecord.tot_de_head)
                      : activeRecord.tot_earnings !== undefined
                      ? String(activeRecord.tot_earnings)
                      : '0.00';

                  setSalaryRecord(normalizeSalaryRecord({
                    ...activeRecord,
                    net_salary: resolvedNet,
                    isApprovedPro: true,
                    status: 'APPROVED BY HR',
                  }));
                  return active;
                });

                setLoading(false);
                setRefreshing(false);
                return;
              }
            }
          }
        } catch (e) {
          console.warn('[SalarySlipScreen] approved salary list error:', e);
        }

        // 2. Secondary fallback: Check mobile salary slip months endpoint (/api/payroll/mobile-salary-slip/months/)
        try {
          const mRes = await staffApi.getMobileSalarySlipMonths();
          if (mRes.success && mRes.data) {
            const mList = (mRes.data as any).results || mRes.data;
            if (Array.isArray(mList) && mList.length > 0) {
              const months: MonthOption[] = mList.map((m: any) => {
                const mNum = parseInt(m.month, 10);
                const yNum = parseInt(m.year, 10);
                return {
                  id: `${yNum}_${String(mNum).padStart(2, '0')}`,
                  label: m.label || `${MONTH_NAMES[mNum] || `Month ${mNum}`} ${yNum}`,
                  monthNum: mNum,
                  year: yNum,
                  status: 'Approved',
                };
              });

              setAvailableMonths(months);
              const active = months[0];
              setSelectedMonth(active);

              // Direct mobile salary slip figures from /api/payroll/mobile-salary-slip/data/
              const dRes = await staffApi.getMobileSalarySlipData(active.monthNum, active.year);
              if (dRes.success && dRes.data) {
                setSalaryRecord(normalizeSalaryRecord({
                  ...dRes.data,
                  isApprovedPro: true,
                  status: 'APPROVED BY HR',
                }));
                setLoading(false);
                setRefreshing(false);
                return;
              }
            }
          }
        } catch (e) {
          console.warn('[SalarySlipScreen] mobile-salary-slip/months fallback:', e);
        }

        // If no records in database for this employee
        setAvailableMonths([]);
        setSelectedMonth(null);
        setSalaryRecord(null);
      }
    } catch {
      setAvailableMonths([]);
      setSelectedMonth(null);
      setSalaryRecord(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [empCode, unitCode]);

  useEffect(() => {
    fetchLiveSalary();
  }, [fetchLiveSalary]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveSalary();
  };

  const handleSelectMonth = async (m: MonthOption) => {
    setSelectedMonth(m);
    // 1. If we already have the approved MySQL record in allRecords, load it immediately
    const row = allRecords.find(
      (r: any) => parseInt(r.month, 10) === m.monthNum && parseInt(r.year, 10) === m.year
    );
    if (row) {
      setSalaryRecord(normalizeSalaryRecord({
        ...row,
        isApprovedPro: true,
        status: 'APPROVED BY HR',
      }));
      return;
    }

    // 1.5. Check published slips
    const pub = useSalarySlipStore.getState().getPublishedSlip(empCode, m.monthNum, m.year);
    if (pub) {
      setSalaryRecord(normalizeSalaryRecord({
        ...pub,
        isApprovedPro: true,
        status: 'APPROVED & DISPATCHED BY HR',
      }));
      return;
    }

    // 2. Otherwise try mobile-salary-slip/data
    try {
      const dRes = await staffApi.getMobileSalarySlipData(m.monthNum, m.year);
      if (dRes.success && dRes.data) {
        setSalaryRecord(normalizeSalaryRecord({
          ...dRes.data,
          isApprovedPro: true,
          status: 'APPROVED BY HR',
        }));
        return;
      }
    } catch (e) {
      console.warn('Fallback on select month:', e);
    }

    setSalaryRecord(null);
  };

  // Calculations from live approved MySQL record (payroll_staff_salary_pro or mobile-salary-slip/data)
  const isApproved = salaryRecord?.isApprovedPro === true;
  const hasStaffPro = Boolean(
    salaryRecord &&
      (salaryRecord.de_head1 !== undefined ||
        salaryRecord.tot_de_head !== undefined ||
        salaryRecord.dpf_employee !== undefined ||
        salaryRecord.labels !== undefined ||
        salaryRecord.head1 !== undefined)
  );

  // Basic salary & allowances (fallback for legacy endpoint)
  const valBasic = parseFloat(salaryRecord?.basic_vda || salaryRecord?.Basic || salaryRecord?.de_head1 || '0') || 0;
  const valHra = parseFloat(salaryRecord?.hra || salaryRecord?.de_head2 || '0') || 0;
  const valSpecial = parseFloat(salaryRecord?.cca || salaryRecord?.other_allo || salaryRecord?.de_head3 || '0') || 0;
  const valConveyance = parseFloat(salaryRecord?.vda || salaryRecord?.de_head4 || '0') || 0;

  // Statutory & other deductions: strictly from SQL (DO NOT invent fake Absent Days cut)
  const d1 = parseFloat(salaryRecord?.pf_employee ?? salaryRecord?.dpf_employee ?? salaryRecord?.PF ?? '0') || 0;
  const d1Er = parseFloat(salaryRecord?.pf_employer ?? salaryRecord?.dpf_employer ?? '0') || 0;
  const d2 = parseFloat(salaryRecord?.esic_employee ?? salaryRecord?.desic_employee ?? salaryRecord?.ESIC ?? '0') || 0;
  const d2Er = parseFloat(salaryRecord?.esic_employer ?? salaryRecord?.desic_employer ?? '0') || 0;
  const d3 = parseFloat(salaryRecord?.professional_tax ?? salaryRecord?.dptax ?? salaryRecord?.pt ?? '0') || 0;
  const d4 = parseFloat(salaryRecord?.lwf ?? salaryRecord?.dlwf ?? '0') || 0;
  const dOther = hasStaffPro
    ? parseFloat(salaryRecord?.tot_dd_head ?? salaryRecord?.tot_deductions ?? '0') || 0
    : 0;
  const dAdv = parseFloat(salaryRecord?.advance_payment ?? salaryRecord?.advance ?? '0') || 0;

  // Attendance Metrics - Strictly Real SQL
  const now = new Date();
  const selYear = selectedMonth?.year || (salaryRecord?.year ? parseInt(String(salaryRecord.year), 10) : now.getFullYear());
  const selMonthNum = selectedMonth?.monthNum || (salaryRecord?.month ? parseInt(String(salaryRecord.month), 10) : now.getMonth() + 1);
  const currentMonthDays = new Date(selYear, selMonthNum, 0).getDate();
  const totalMonthDays = parseInt(salaryRecord?.Working_Days ?? salaryRecord?.month_days ?? String(currentMonthDays), 10) || currentMonthDays;

  let sundaysOff = parseInt(salaryRecord?.sundays ?? '0', 10) || 0;
  if ((salaryRecord?.sundays === undefined || salaryRecord?.sundays === null) && hasStaffPro) {
    let sunCount = 0;
    for (let d = 1; d <= totalMonthDays; d++) {
      if (new Date(selYear, selMonthNum - 1, d).getDay() === 0) sunCount++;
    }
    sundaysOff = sunCount;
  }

  const rawPresentDays = parseFloat(salaryRecord?.Total_Days_Present ?? salaryRecord?.present_days ?? salaryRecord?.tot_days_present ?? '0') || 0;
  const dutyDays = hasStaffPro ? rawPresentDays : Math.max(0, rawPresentDays - sundaysOff);
  const paidDays = hasStaffPro ? Math.min(totalMonthDays, rawPresentDays + sundaysOff) : rawPresentDays;
  const absentDays = Math.max(0, totalMonthDays - paidDays);

  // Sanctioned Monthly Structure vs Prorated Earned Gross from SQL
  const grossEarnings =
    parseFloat(salaryRecord?.tot_de_head ?? salaryRecord?.tot_earnings ?? salaryRecord?.Payment ?? '0') ||
    (valBasic + valHra + valSpecial + valConveyance);
  const earnedGross = grossEarnings;
  const standardMonthlyGross =
    parseFloat(salaryRecord?.ctc_amount ?? salaryRecord?.month_total ?? salaryRecord?.gross_salary ?? '0') ||
    earnedGross;
  const perDaySalaryRate = totalMonthDays > 0 ? standardMonthlyGross / totalMonthDays : 0;

  // Proration / Absent deduction (Sanctioned Monthly CTC - Earned Gross)
  const attendanceProrationCut = Math.max(0, Math.round((standardMonthlyGross - earnedGross) * 100) / 100);

  // Total Deductions on the screen (Sanctioned CTC - Net Salary, or Proration cut + Statutory deductions)
  const statutoryDeductionsTotal =
    Math.round((d1 + d1Er + d2 + d2Er + d3 + d4 + dOther + dAdv) * 100) / 100;
  const totalDeductions =
    standardMonthlyGross > earnedGross
      ? Math.round((attendanceProrationCut + statutoryDeductionsTotal) * 100) / 100
      : statutoryDeductionsTotal;

  // Net Salary strictly from backend SQL (net_salary / Payment)
  const netPayableAmount =
    salaryRecord?.net_salary !== undefined && salaryRecord?.net_salary !== null && String(salaryRecord.net_salary).trim() !== ''
      ? Math.max(0, parseFloat(String(salaryRecord.net_salary)) || 0)
      : salaryRecord?.Payment !== undefined && salaryRecord?.Payment !== null
      ? Math.max(0, parseFloat(String(salaryRecord.Payment)) || 0)
      : Math.max(0, Math.round((earnedGross - statutoryDeductionsTotal) * 100) / 100);

  // Dynamic Earnings Items from SQL
  const activeLabels: Record<string, string> = salaryRecord?.labels || proLabels || {};
  const earningsList = (() => {
    if (!salaryRecord) return [];
    if (hasStaffPro) {
      const items: { label: string; code: string; subtext: string; amount: number; percentage: string }[] = [];
      for (let i = 1; i <= 15; i++) {
        const amt = parseFloat(String(salaryRecord[`de_head${i}`] ?? '0')) || 0;
        const rateAmt = parseFloat(String(salaryRecord[`head${i}`] ?? '0')) || 0;
        const lbl = activeLabels[`head${i}`] || (i === 1 ? 'Basic Pay' : i === 2 ? 'HRA' : `Head ${i}`);
        if (amt > 0 || (activeLabels[`head${i}`] && rateAmt > 0)) {
          items.push({
            label: lbl,
            code: `de_head${i}`,
            subtext: rateAmt > 0 ? `Sanctioned: ₹${rateAmt.toLocaleString('en-IN')}/mo` : 'Attendance prorated head',
            amount: amt,
            percentage: earnedGross > 0 ? ((amt / earnedGross) * 100).toFixed(1) : '0',
          });
        }
      }
      const lumpsumAmt = parseFloat(String(salaryRecord.tot_lumpsum ?? salaryRecord.tot_dl_head ?? '0')) || 0;
      if (lumpsumAmt > 0) {
        items.push({
          label: 'Lumpsum Allowances',
          code: 'tot_lumpsum',
          subtext: 'Fixed allowance component',
          amount: lumpsumAmt,
          percentage: earnedGross > 0 ? ((lumpsumAmt / earnedGross) * 100).toFixed(1) : '0',
        });
      }
      return items;
    }
    return [
      {
        label: 'Basic Pay & DA',
        code: 'basic_vda',
        subtext: 'Attendance prorated base pay',
        amount: valBasic,
        percentage: earnedGross > 0 ? ((valBasic / earnedGross) * 100).toFixed(1) : '0',
      },
      {
        label: 'House Rent Allowance (HRA)',
        code: 'hra',
        subtext: 'Accommodation allowance',
        amount: valHra,
        percentage: earnedGross > 0 ? ((valHra / earnedGross) * 100).toFixed(1) : '0',
      },
      {
        label: 'Special / City Allowance',
        code: 'cca',
        subtext: 'Role & performance supplement',
        amount: valSpecial,
        percentage: earnedGross > 0 ? ((valSpecial / earnedGross) * 100).toFixed(1) : '0',
      },
      {
        label: 'Variable Dearness Allowance (VDA)',
        code: 'vda',
        subtext: 'Cost of living supplement',
        amount: valConveyance,
        percentage: earnedGross > 0 ? ((valConveyance / earnedGross) * 100).toFixed(1) : '0',
      },
    ].filter((e) => e.amount > 0);
  })();

  // Deductions Items strictly from SQL + Proration if applicable
  const deductionsList = salaryRecord
    ? [
        ...(attendanceProrationCut > 0
          ? [
              {
                label: 'Attendance Proration Cut',
                code: 'attendance_proration',
                subtext: `${absentDays} unworked days (₹${perDaySalaryRate.toFixed(2)}/day)`,
                amount: attendanceProrationCut,
              },
            ]
          : []),
        {
          label: 'Provident Fund (Employee)',
          code: 'dpf_employee',
          subtext: '12% Statutory Employee Contribution',
          amount: d1,
        },
        {
          label: 'Provident Fund (Employer)',
          code: 'dpf_employer',
          subtext: 'Employer PF Contribution',
          amount: d1Er,
        },
        {
          label: 'ESIC (Employee)',
          code: 'desic_employee',
          subtext: '0.75% State Health Insurance',
          amount: d2,
        },
        {
          label: 'ESIC (Employer)',
          code: 'desic_employer',
          subtext: '3.25% Employer ESIC Contribution',
          amount: d2Er,
        },
        {
          label: 'Professional Tax (PT)',
          code: 'dptax',
          subtext: 'State Municipal Tax Slab',
          amount: d3,
        },
        {
          label: 'Labour Welfare Fund (LWF)',
          code: 'dlwf',
          subtext: 'Statutory Welfare Contribution',
          amount: d4,
        },
        {
          label: 'Other Deductions',
          code: 'tot_dd_head',
          subtext: 'Custom deduction heads',
          amount: dOther,
        },
        {
          label: 'Advance / Loan Recovery',
          code: 'advance_payment',
          subtext: 'Advance salary deduction',
          amount: dAdv,
        },
      ].filter((d) => d.amount > 0)
    : [];

  // ─── Generate Official Printable PDF Payslip HTML (1:1 Replica of Crystal Reports Salary_Slip.rpt) ───
  const generatePayslipHtml = () => {
    if (!salaryRecord) return '';

    const monthFullLabel = selectedMonth?.label || salaryRecord.month_year || '';
    const resolvedCompName =
      companyMeta?.companyName || salaryRecord.company_meta?.companyName || currentCompany?.name || compName;
    const dynamicAddr1 =
      companyMeta?.companyAddress1 ||
      salaryRecord.company_meta?.companyAddress1 ||
      (currentCompany as any)?.address1 ||
      currentCompany?.address ||
      '';
    const dynamicAddr2 =
      companyMeta?.companyAddress2 ||
      salaryRecord.company_meta?.companyAddress2 ||
      ((currentCompany as any)?.address2
        ? `${(currentCompany as any).address2}, ${currentCompany?.city || ''}`
        : '');

    return generateCrystalPayslipHtml(
      {
        ...salaryRecord,
        emp_father: salaryRecord.emp_father || salaryRecord.Emp_Father || employeeProfile?.emp_father_name || '',
        joining_date: salaryRecord.joining_date || salaryRecord.Joining_Date || employeeProfile?.joining_date || '',
        pan: salaryRecord.pan || salaryRecord.PAN_No || employeeProfile?.pan_number || '',
        pf_no: salaryRecord.pf_no || salaryRecord.PF_No || employeeProfile?.pf_number || '',
        esic_no: salaryRecord.esic_no || salaryRecord.ESI_No || employeeProfile?.esic_number || '',
        uan_no: salaryRecord.uan_no || salaryRecord.UAN_No || employeeProfile?.uan_number || '',
        bank_account: salaryRecord.bank_account || salaryRecord.BANK_EMP_AC_CODE || employeeProfile?.bank_account_number || '',
        bank_name: salaryRecord.bank_name || salaryRecord.PF_BANK_NAME || employeeProfile?.bank_name || '',
        bank_branch: salaryRecord.bank_branch || salaryRecord.BANK_BRANCH || employeeProfile?.bank_branch || '',
        emp_name: salaryRecord.emp_name || salaryRecord.Emp_Name || employeeProfile?.emp_name || employeeName,
        emp_code: salaryRecord.emp_code || salaryRecord.Emp_Code || empCode,
        designation: salaryRecord.grade || salaryRecord.designation || employeeProfile?.designation_code || salaryRecord.job_type || '',
        job_type: salaryRecord.job_type || employeeProfile?.designation_code || '',
        client: salaryRecord.client || salaryRecord.Client || employeeProfile?.client_code || '',
        state: salaryRecord.state || salaryRecord.UnitState || employeeProfile?.location || '',
        location: salaryRecord.location || salaryRecord.city || salaryRecord.Unit_City || employeeProfile?.location_city || '',
        payable_days: salaryRecord.present_days ?? salaryRecord.tot_days_present ?? salaryRecord.total_days_present ?? salaryRecord.Total_Days_Present ?? 0,
        month_days: totalMonthDays,
        sundays: sundaysOff,
        month: selMonthNum,
        year: selYear,
        month_label: monthFullLabel,
        labels: activeLabels,
      },
      {
        companyName: resolvedCompName,
        companyAddress1: dynamicAddr1,
        companyAddress2: dynamicAddr2,
      }
    );
  };


  // ─── Generate Real PDF Document Viewer via Mozilla PDF.js (Exact Vector Replica of Backend ReportLab PDF) ───
  const generatePdfJsViewerHtml = (base64Pdf: string) => {
    const cleanBase64 = base64Pdf.includes(',') ? base64Pdf.split(',')[1] : base64Pdf;
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background-color: #374151;
      width: 100%;
      min-height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 6px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #loading {
      color: #FFFFFF;
      font-size: 13px;
      font-weight: 600;
      margin-top: 40px;
      text-align: center;
    }
    #canvas-container {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
    }
    canvas {
      width: 100% !important;
      max-width: 720px;
      height: auto !important;
      background: #FFFFFF;
      box-shadow: 0 4px 14px rgba(0,0,0,0.35);
      border-radius: 2px;
    }
  </style>
</head>
<body>
  <div id="loading">Rendering Official Payslip Document...</div>
  <div id="canvas-container"></div>
  <script>
    try {
      var raw = window.atob("${cleanBase64}");
      var rawLength = raw.length;
      var array = new Uint8Array(new ArrayBuffer(rawLength));
      for (var i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
      }
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      var loadingTask = pdfjsLib.getDocument({ data: array });
      loadingTask.promise.then(function(pdf) {
        var loader = document.getElementById('loading');
        if (loader) loader.style.display = 'none';
        for (var pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          pdf.getPage(pageNum).then(function(page) {
            var container = document.getElementById('canvas-container');
            var desiredWidth = Math.min(window.innerWidth - 16, 720);
            var viewport = page.getViewport({ scale: 1 });
            var scale = (desiredWidth * 2) / viewport.width;
            var scaledViewport = page.getViewport({ scale: scale });
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            canvas.height = scaledViewport.height;
            canvas.width = scaledViewport.width;
            container.appendChild(canvas);
            page.render({ canvasContext: context, viewport: scaledViewport });
          });
        }
      }).catch(function(err) {
        var loader = document.getElementById('loading');
        if (loader) loader.innerText = 'Failed to render PDF: ' + err.message;
      });
    } catch(err) {
      var loader = document.getElementById('loading');
      if (loader) loader.innerText = 'Failed to decode document: ' + err.message;
    }
  </script>
</body>
</html>`;
  };

  // Action: Open Official Payslip Document — shows HTML payslip in modal via inline WebView HTML (fast, reliable on Android)
  const handleOpenPdf = () => {
    if (!salaryRecord) {
      showToast({ type: 'error', title: 'Slip Not Ready', message: 'No approved salary record found.' });
      return;
    }
    const htmlContent = generatePayslipHtml();
    setSlipHtml(htmlContent);
    setIsSlipModalOpen(true);
  };

  // Action: Trigger Native Print / Save as PDF (Directly prints the 1:1 Authentic Crystal Payslip HTML with Logo)
  const handlePrintPdf = async () => {
    if (!salaryRecord) {
      showToast({
        type: 'error',
        title: 'Slip Not Ready',
        message: 'No approved salary record found for this period.',
      });
      return;
    }

    const monthLabel = selectedMonth?.label || salaryRecord.month_year || 'Salary_Slip';
    const jobName = `Salary_Slip_${String(empCode).trim()}_${monthLabel.replace(/\s+/g, '_')}`;

    const htmlContent = generatePayslipHtml();
    try {
      if (PrintPdfModule?.print) {
        await PrintPdfModule.print(htmlContent, jobName);
        return;
      }
      pdfWebViewRef.current?.injectJavaScript('window.print(); true;');
    } catch (err: any) {
      console.warn('Native print error:', err);
      pdfWebViewRef.current?.injectJavaScript('window.print(); true;');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Global Edge-to-Edge Unified AppHeader */}
      <AppHeader
        title="Salary & Pay Slip"
        subtitle={selectedMonth ? `${selectedMonth.label} • Approved` : 'Approved Salary Slips'}
        onBack={goBack}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[brandColor]} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* ── Horizontal Month Selector (Only Approved Months from Database - NO DUMMY MONTHS) ── */}
          {availableMonths.length > 0 && (
            <View style={styles.monthCarouselSection}>
              <View style={styles.monthCarouselHeader}>
                <Text style={styles.monthCarouselTitle}>Pay Period</Text>
                <Text style={styles.monthCarouselHint}>
                  {availableMonths.length === 1 ? '1 Approved Pay Slip' : 'Select approved month'}
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.monthScroll}
              >
                {availableMonths.map((m) => {
                  const isSelected = selectedMonth?.id === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => handleSelectMonth(m)}
                      style={[
                        styles.monthPill,
                        isSelected && [styles.monthPillActive, { backgroundColor: brandColor, borderColor: brandColor }],
                      ]}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[styles.monthPillText, isSelected && styles.monthPillTextActive]}
                      >
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {loading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator size="large" color={brandColor} />
              <Text style={styles.stateTitle}>Fetching Approved Payslip...</Text>
              <Text style={styles.stateSubtitle}>Loading verified salary record from payroll_staff_salary_pro</Text>
            </View>
          ) : !salaryRecord ? (
            <View style={styles.stateBox}>
              <AppIcon name="file-text" size={40} color="#94A3B8" />
              <Text style={styles.stateTitle}>No Approved Payslips</Text>
              <Text style={styles.stateSubtitle}>
                HR has not approved or released any salary slip for employee "{empCode}" yet. Only officially approved payslips are displayed here.
              </Text>
            </View>
          ) : (
            <>
              {/* ── Executive Hero Net Card (Crisp White Card with Royal Blue & Emerald Accents - NO BLACK) ── */}
              <View style={styles.heroCard}>
                <View style={styles.heroTopRow}>
                  <View style={[styles.verifiedBadge, { backgroundColor: '#DCFCE7' }]}>
                    <AppIcon name="shield-check" size={13} color="#15803D" />
                    <Text style={[styles.verifiedBadgeText, { color: '#15803D' }]}>
                      Approved
                    </Text>
                  </View>
                  <View style={styles.frequencyPill}>
                    <AppIcon name="calendar" size={12} color="#1D4ED8" />
                    <Text style={styles.frequencyPillText}>
                      {paidDays}/{totalMonthDays} Paid Days
                    </Text>
                  </View>
                </View>

                <Text style={styles.heroSubtitle}>Approved Net Take-Home</Text>
                <Text style={styles.heroAmount} numberOfLines={1} adjustsFontSizeToFit>
                  ₹{netPayableAmount.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.heroTagline} numberOfLines={2}>
                  Attendance: {dutyDays} Worked • {sundaysOff} Weekly Offs • Job: {salaryRecord.job_type || 'REGULAR'}
                </Text>

                <View style={styles.breakdownRow}>
                  <View style={[styles.breakdownCol, styles.breakdownColGross]}>
                    <View style={styles.breakdownLabelRow}>
                      <Text style={[styles.breakdownLabel, { color: '#15803D' }]} numberOfLines={1}>Monthly CTC</Text>
                      <AppIcon name="check-circle" size={12} color="#15803D" />
                    </View>
                    <Text style={[styles.breakdownValue, { color: '#15803D' }]} numberOfLines={1} adjustsFontSizeToFit>
                      ₹{standardMonthlyGross.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={[styles.breakdownCol, styles.breakdownColDeduct]}>
                    <View style={styles.breakdownLabelRow}>
                      <Text style={[styles.breakdownLabel, { color: '#DC2626' }]} numberOfLines={1}>Total Deductions</Text>
                      <AppIcon name="shield" size={12} color="#DC2626" />
                    </View>
                    <Text style={[styles.breakdownValue, { color: '#DC2626' }]} numberOfLines={1} adjustsFontSizeToFit>
                      -₹{totalDeductions.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              </View>

              {/* ── Attendance & Days Breakdown Card (Every Field of October) ── */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.sectionTitleLeft}>
                    <View style={[styles.sectionIconBox, { backgroundColor: '#EFF6FF' }]}>
                      <AppIcon name="calendar" size={18} color="#2563EB" />
                    </View>
                    <Text style={styles.sectionTitle}>Attendance & Paid Days</Text>
                  </View>
                  <View style={[styles.sectionBadge, { backgroundColor: '#EFF6FF' }]}>
                    <Text style={[styles.sectionBadgeText, { color: '#1D4ED8' }]}>
                      {selectedMonth?.label || 'Oct 2026'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoCell}>
                    <Text style={styles.infoLabel}>TOTAL MONTH DAYS</Text>
                    <Text style={styles.infoValue}>{totalMonthDays} Days</Text>
                  </View>
                  <View style={styles.infoCell}>
                    <Text style={styles.infoLabel}>PAID ATTENDANCE</Text>
                    <Text style={[styles.infoValue, { color: '#15803D' }]}>{paidDays} Days</Text>
                  </View>
                  <View style={styles.infoCell}>
                    <Text style={styles.infoLabel}>ACTUAL WORKED</Text>
                    <Text style={styles.infoValue}>{dutyDays} Days</Text>
                  </View>
                  <View style={styles.infoCell}>
                    <Text style={styles.infoLabel}>WEEKLY OFFS (PAID)</Text>
                    <Text style={styles.infoValue}>{sundaysOff} Days</Text>
                  </View>
                  <View style={styles.infoCell}>
                    <Text style={styles.infoLabel}>ABSENT DAYS</Text>
                    <Text style={[styles.infoValue, { color: absentDays > 0 ? '#DC2626' : '#64748B' }]}>
                      {absentDays} Days
                    </Text>
                  </View>
                  <View style={styles.infoCell}>
                    <Text style={styles.infoLabel}>PER DAY RATE</Text>
                    <Text style={styles.infoValue}>
                      ₹{perDaySalaryRate.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* ── Salary & Deductions Breakdown Card (Strict SQL Calculation) ── */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.sectionTitleLeft}>
                    <View style={[styles.sectionIconBox, { backgroundColor: '#FEF3C7' }]}>
                      <AppIcon name="credit-card" size={18} color="#D97706" />
                    </View>
                    <Text style={styles.sectionTitle}>Salary & Deduction Breakdown</Text>
                  </View>
                </View>

                {/* Base Monthly CTC / Sanctioned Structure */}
                <View style={styles.summaryRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.summaryLabel}>Sanctioned Monthly CTC</Text>
                    <Text style={styles.summarySubtext}>Full {totalMonthDays}-Day structure rate</Text>
                  </View>
                  <Text style={styles.summaryValue}>₹{standardMonthlyGross.toLocaleString('en-IN')}</Text>
                </View>

                {/* Earned Gross Salary */}
                <View style={styles.summaryRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.summaryLabel}>Earned Gross Total</Text>
                    <Text style={styles.summarySubtext}>
                      Prorated for {paidDays} paid days ({dutyDays} worked + {sundaysOff} W/O)
                    </Text>
                  </View>
                  <Text style={[styles.summaryValue, { color: '#16A34A' }]}>
                    +₹{grossEarnings.toLocaleString('en-IN')}
                  </Text>
                </View>

                {/* Statutory & Other Deductions */}
                <View style={[styles.summaryRow, { borderBottomWidth: 0, paddingTop: 10 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.summaryLabel, { color: '#DC2626' }]}>
                      Total SQL Deductions
                    </Text>
                    <Text style={styles.summarySubtext}>PF + ESIC + PT + LWF + Advance</Text>
                  </View>
                  <Text style={[styles.summaryValue, { color: '#DC2626' }]}>
                    -₹{totalDeductions.toLocaleString('en-IN')}
                  </Text>
                </View>

                {/* Net Bank Transfer Box */}
                <View style={styles.summaryNetBox}>
                  <Text style={styles.summaryNetLabel}>Net Bank Transfer</Text>
                  <Text style={styles.summaryNetValue}>₹{netPayableAmount.toLocaleString('en-IN')}</Text>
                </View>
              </View>

              {/* ── Earnings Breakdown Card ── */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.sectionTitleLeft}>
                    <View style={[styles.sectionIconBox, { backgroundColor: '#DCFCE7' }]}>
                      <AppIcon name="credit-card" size={18} color="#16A34A" />
                    </View>
                    <Text style={styles.sectionTitle}>Earnings Breakdown</Text>
                  </View>
                  <View style={[styles.sectionBadge, { backgroundColor: '#DCFCE7' }]}>
                    <Text style={[styles.sectionBadgeText, { color: '#166534' }]}>
                      +₹{grossEarnings.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                {earningsList.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <View style={styles.itemLeft}>
                      <Text style={styles.itemLabel}>{item.label}</Text>
                      <Text style={styles.itemSubtext}>
                        {item.code} • {item.percentage}% of gross
                      </Text>
                    </View>
                    <Text style={styles.itemAmount}>
                      ₹{item.amount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                ))}

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Gross Total</Text>
                  <Text style={[styles.totalAmount, { color: '#16A34A' }]}>
                    ₹{grossEarnings.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* ── Statutory Deductions Card ── */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.sectionTitleLeft}>
                    <View style={[styles.sectionIconBox, { backgroundColor: '#FEE2E2' }]}>
                      <AppIcon name="shield" size={18} color="#DC2626" />
                    </View>
                    <Text style={styles.sectionTitle}>Statutory Deductions</Text>
                  </View>
                  <View style={[styles.sectionBadge, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={[styles.sectionBadgeText, { color: '#991B1B' }]}>
                      -₹{totalDeductions.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                {deductionsList.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <View style={styles.itemLeft}>
                      <Text style={styles.itemLabel}>{item.label}</Text>
                      <Text style={styles.itemSubtext}>{item.subtext}</Text>
                    </View>
                    <Text style={[styles.itemAmount, { color: '#DC2626' }]}>
                      -₹{item.amount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                ))}

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Deductions</Text>
                  <Text style={[styles.totalAmount, { color: '#DC2626' }]}>
                    -₹{totalDeductions.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* ── Employee Information Card ── */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.sectionTitleLeft}>
                    <View style={[styles.sectionIconBox, { backgroundColor: '#E0F2FE' }]}>
                      <AppIcon name="person" size={18} color="#0284C7" />
                    </View>
                    <Text style={styles.sectionTitle}>Employee Information</Text>
                  </View>
                </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoCell}>
                    <Text style={styles.infoLabel}>EMPLOYEE NAME</Text>
                    <Text style={styles.infoValue}>
                      {salaryRecord.emp_name || salaryRecord.Emp_Name || employeeProfile?.emp_name || employeeName}
                    </Text>
                  </View>
                  <View style={styles.infoCell}>
                    <Text style={styles.infoLabel}>EMPLOYEE CODE</Text>
                    <Text style={styles.infoValue}>
                      {salaryRecord.emp_code || salaryRecord.Emp_Code || empCode}
                    </Text>
                  </View>
                  <View style={styles.infoCell}>
                    <Text style={styles.infoLabel}>DESIGNATION / JOB</Text>
                    <Text style={styles.infoValue}>
                      {salaryRecord.job_type || salaryRecord.grade || salaryRecord.designation || employeeProfile?.designation_code || 'REGULAR'}
                    </Text>
                  </View>
                  <View style={styles.infoCell}>
                    <Text style={styles.infoLabel}>COMPANY / UNIT</Text>
                    <Text style={styles.infoValue}>
                      {salaryRecord.comp_code || 'C01'} • {salaryRecord.unit_code || salaryRecord.Unitcode || unitCode}
                    </Text>
                  </View>
                </View>
              </View>

              {/* ── Actions Row (View Slip) ── */}
              <View style={styles.actionsContainer}>
                <AppButton
                  title="View PDF Slip"
                  variant="primary"
                  iconLeft="file-text"
                  onPress={handleOpenPdf}
                  customColor={brandColor}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* ── Official Full Payslip Voucher Document Modal (PDF View) ── */}
      <Modal
        visible={isSlipModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => { setIsSlipModalOpen(false); setSlipHtml(null); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeaderBar}>
              <View style={styles.modalHeaderLeft}>
                <AppIcon name="file-text" size={18} color="#2563EB" />
                <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                  Payslip ({selectedMonth?.label || 'Salary Slip'})
                </Text>
              </View>
              <View style={styles.modalHeaderRight}>
                <TouchableOpacity
                  style={[styles.modalPrintBtn, { backgroundColor: brandColor }]}
                  onPress={handlePrintPdf}
                  activeOpacity={0.8}
                >
                  <AppIcon name="download" size={13} color="#FFFFFF" />
                  <Text style={styles.modalPrintBtnText}>Save PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => { setIsSlipModalOpen(false); setSlipHtml(null); }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <AppIcon name="x" size={16} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            {/* WebView Payslip Renderer — renders inline HTML with baseUrl */}
            <View style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
              {!slipHtml ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#2563EB" />
                  <Text style={{ marginTop: 14, color: '#475569', fontSize: 13, fontWeight: '600' }}>
                    Preparing Payslip Document...
                  </Text>
                </View>
              ) : (
                <WebViewComponent
                  ref={pdfWebViewRef}
                  originWhitelist={['*']}
                  source={{
                    html: slipHtml,
                    baseUrl: 'https://localhost',
                  }}
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
                      <Text style={{ marginTop: 12, color: '#475569', fontSize: 13 }}>
                        Rendering Payslip...
                      </Text>
                    </View>
                  )}
                  onError={(syntheticEvent: any) => {
                    console.warn('[SalarySlipScreen] WebView error:', syntheticEvent?.nativeEvent);
                  }}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Custom Alert Modal ── */}
      <CustomAlertModal
        visible={isAlertOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setIsAlertOpen(false)}
        buttons={[
          {
            text: 'View PDF Slip',
            icon: 'file-text',
            onPress: () => {
              setIsAlertOpen(false);
              setTimeout(handleOpenPdf, 200);
            },
          },
          {
            text: 'OK',
            style: 'cancel',
            onPress: () => setIsAlertOpen(false),
          },
        ]}
      />
    </SafeAreaView>
  );
};
