import { apiClient } from './client';
import { API_ENDPOINTS, apiConfig, ANDROID_API_KEY } from './config';

export interface AndroidPunchPayload {
  emp_code: string;
  attendances_click: 'Attendances_cameraintime' | 'Attendances_cameraouttime' | 'Attendances_intime' | 'Attendances_outtime';
  photo_base64: string;
  unit_unitlatitude?: string;
  unit_unitlongtitude?: string;
  unit_emplatitude?: string;
  unit_emplongtitude?: string;
  unit_distance?: string;
  unit_empaddress?: string;
  mobile_imei?: string;
  comp_code?: string;
}

export interface LeaveApplyPayload {
  leave_type: string;
  from_date: string; // YYYY-MM-DD
  to_date: string; // YYYY-MM-DD
  leave_reason: string;
  half_day_type?: string;
}

export interface EmployeeKycPayload {
  emp_code: string;
  aadhaar?: string;
  pan?: string;
  bank_account?: string;
  bank_holder_name?: string;
  bank_name?: string;
  ifsc?: string;
  nominee_name?: string;
  nominee_relation?: string;
}

export interface BreakPunchItem {
  break_no: number;
  start_time?: string;
  end_time?: string;
}

export interface BreakPunchResponse {
  status: 'ok' | 'error';
  message?: string;
  emp_code?: string;
  is_on_break: boolean;
  current_break_no?: number | null;
  current_break_start?: string | null;
  punched_in_today?: boolean;
  punched_out_today?: boolean;
  break_start?: BreakPunchItem[];
  break_end?: BreakPunchItem[];
}

export interface ShiftItem {
  id: number;
  shift_name: string;
  shift_from: string;
  shift_to: string;
  working_hours?: string | number;
}

export interface DayShiftItem {
  day: number;
  date: string;
  dow: string;
  shift_id: string | number;
  shift_name?: string;
  shift_from?: string;
  shift_to?: string;
}

export interface EmployeeShiftResponse {
  emp_code: string;
  comp_code?: string;
  unit_code?: string;
  month?: number;
  year?: number;
  today?: DayShiftItem;
  days?: DayShiftItem[];
  shifts?: ShiftItem[];
}

export const staffApi = {
  /**
   * Submit Leave Application -> POST /api/leave/applications/
   */
  async applyLeave(payload: LeaveApplyPayload) {
    return apiClient.post(API_ENDPOINTS.LEAVE_APPLICATIONS, payload);
  },

  /**
   * Fetch Leave Application History -> GET /api/leave/applications/
   */
  async getLeaveApplications() {
    return apiClient.get(API_ENDPOINTS.LEAVE_APPLICATIONS);
  },

  /**
   * Fetch Leave Applications routed to Manager / Supervisor -> GET /api/leave/applications/?scope=manage
   */
  async getManageLeaveApplications() {
    return apiClient.get(`${API_ENDPOINTS.LEAVE_APPLICATIONS}?scope=manage`);
  },

  /**
   * Approve a Leave Application -> POST /api/leave/applications/{id}/approve/
   */
  async approveLeaveApplication(id: number) {
    return apiClient.post(`${API_ENDPOINTS.LEAVE_APPLICATIONS}${id}/approve/`, {});
  },

  /**
   * Reject a Leave Application -> POST /api/leave/applications/{id}/reject/
   */
  async rejectLeaveApplication(id: number, statusComment: string) {
    return apiClient.post(`${API_ENDPOINTS.LEAVE_APPLICATIONS}${id}/reject/`, {
      status_comment: statusComment,
    });
  },

  /**
   * Fetch Employee Leave Balances & Allowed Quota from SQL -> GET /api/leave/applications/my-balances/
   */
  async getLeaveBalances() {
    return apiClient.get('/api/leave/applications/my-balances/');
  },

  /**
   * Submit Petty Cash Claim (Multipart) -> POST /api/transactions/petty-cash-android/submit/
   */
  async submitPettyCash(formData: FormData) {
    return apiClient.upload(API_ENDPOINTS.PETTY_CASH_SUBMIT, formData);
  },

  /**
   * View Petty Cash Requests -> GET /api/transactions/petty-cash-android/requests/
   */
  async getPettyCashRequests() {
    return apiClient.get(API_ENDPOINTS.PETTY_CASH_REQUESTS);
  },

  /**
   * Submit KYC (Aadhaar / PAN / Bank) -> POST /api/hr/employee-kyc/
   */
  async submitKyc(payload: EmployeeKycPayload) {
    return apiClient.post(API_ENDPOINTS.EMPLOYEE_KYC, payload);
  },

  /**
   * Get Employee KYC from hr_employee_kyc -> GET /api/hr/employee-kyc/?emp_code={code}
   */
  async getEmployeeKyc(empCode: string) {
    return apiClient.get<any>(`${API_ENDPOINTS.EMPLOYEE_KYC}?emp_code=${encodeURIComponent(empCode)}`);
  },

  /**
   * Get Employee Documents from hr_employee_document -> GET /api/hr/employee-documents/?emp_code={code}
   */
  async getEmployeeDocuments(empCode: string) {
    return apiClient.get<any>(`${API_ENDPOINTS.EMPLOYEE_DOCUMENTS}?emp_code=${encodeURIComponent(empCode)}`);
  },

  /**
   * Upload Document to legacy/review android-documents (hr_document_verification)
   * This creates a Pending review row (reject = 0) for HR verification.
   */
  async uploadDocument(formData: FormData) {
    try {
      const res = await apiClient.upload(API_ENDPOINTS.ANDROID_DOCUMENTS, formData);
      if (res.success) return res;
    } catch {}
    return apiClient.upload(API_ENDPOINTS.EMPLOYEE_DOCUMENTS, formData);
  },

  /**
   * Fetch Document Review Status -> Dual lookup from hr_document_verification (live queue) + hr_employee_document + hr_employee_kyc
   */
  async getDocumentsStatus(empCode: string) {
    try {
      const trimmed = (empCode || '').trim();
      const encoded = encodeURIComponent(trimmed);
      const [modernDocsRes, kycRes, legacyRes] = await Promise.allSettled([
        apiClient.get<any>(`${API_ENDPOINTS.EMPLOYEE_DOCUMENTS}?emp_code=${encoded}`),
        apiClient.get<any>(`${API_ENDPOINTS.EMPLOYEE_KYC}?emp_code=${encoded}`),
        apiClient.get<any>(`${API_ENDPOINTS.ANDROID_DOCUMENTS}?emp_code=${encoded}`),
      ]);

      const mergedList: any[] = [];

      // 1. Prioritize live review queue from android-documents (hr_document_verification)
      // Contains the real-time status: reject=0 (Pending), reject=1 (Rejected with reason), reject=2 (Approved)
      if (legacyRes.status === 'fulfilled' && legacyRes.value.success && legacyRes.value.data) {
        const lRaw = legacyRes.value.data;
        const lDocs = Array.isArray(lRaw) ? lRaw : (lRaw as any).results || [];
        lDocs.forEach((ld: any) => {
          if (!mergedList.some((m) => m.image_name === ld.image_name)) {
            mergedList.push({
              ...ld,
              source: 'pay_document_verification',
            });
          }
        });
      }

      // 2. Map modern hr_employee_document rows (Website uploads from Employee Master)
      // If a document was uploaded from the website and has not been overridden by a mobile upload:
      if (modernDocsRes.status === 'fulfilled' && modernDocsRes.value.success && modernDocsRes.value.data) {
        const raw = modernDocsRes.value.data;
        const docs = Array.isArray(raw) ? raw : (raw as any).results || [];
        docs.forEach((doc: any) => {
          const typeName = String(doc.document_type || '').trim();
          const lower = typeName.toLowerCase();
          let imgKey = lower.replace(/\s+/g, '_');
          if (lower.includes('aadhar') || lower.includes('adhar')) imgKey = 'adhar_card_upload';
          else if (lower.includes('pan')) imgKey = 'Pan_card_upload';
          else if (lower.includes('photo')) imgKey = 'passprt_size_photo';
          else if (lower.includes('passbook')) imgKey = 'bank_passbook';
          else if (lower.includes('police')) imgKey = 'police_verification_form';
          else if (lower.includes('address') || lower.includes('proof')) imgKey = 'original_address_proof';
          else if (lower.includes('joining') || lower.includes('kit')) imgKey = 'joining_form';

          if (!mergedList.some((m) => m.image_name === imgKey)) {
            const rawFilePath = doc.file_url || doc.file || '';
            const fileName = rawFilePath ? rawFilePath.split('/').pop() : '';
            const cleanPath = rawFilePath.startsWith('http')
              ? rawFilePath
              : rawFilePath.replace(/^\/?media\/?/, '');

            mergedList.push({
              id: doc.id || Date.now(),
              emp_code: doc.emp_code || trimmed,
              image_name: imgKey,
              document_type: typeName,
              file_name: fileName,
              image_path: cleanPath,
              file_url: doc.file_url || (cleanPath.startsWith('http') ? cleanPath : `/media/${cleanPath}`),
              uploaded_at: doc.uploaded_at,
              android_flag: 1, // present on enterprise website
              reject: 2, // 2 = Approved by default for verified website documents
              source: 'hr_employee_document',
            });
          }
        });
      }

      // 3. Map modern hr_employee_kyc fields (Masked values & Approval status)
      let kycItem: any = null;
      if (kycRes.status === 'fulfilled' && kycRes.value.success && kycRes.value.data) {
        const kRaw = kycRes.value.data;
        const kList = Array.isArray(kRaw) ? kRaw : (kRaw as any).results || [];
        if (kList.length > 0) {
          const k0 = kList[0];
          kycItem = {
            ...k0,
            aadhaar: k0.aadhaar_masked,
            pan: k0.pan_masked,
            bank_account: k0.bank_account_masked,
            ifsc: k0.ifsc,
            bank_name: k0.bank_name,
            bank_status: k0.bank_status || (k0.bank_approve === 1 || k0.bank_approve === 3 ? 'Approved' : 'Pending'),
          };
        }
      }

      return {
        success: true,
        data: {
          results: mergedList,
          kyc: kycItem,
        },
      };
    } catch (err: any) {
      console.warn('getDocumentsStatus error:', err);
      return apiClient.get(`${API_ENDPOINTS.ANDROID_DOCUMENTS}?emp_code=${encodeURIComponent(empCode)}`);
    }
  },

  /**
   * Fetch Salary Details from MySQL -> GET /api/payroll/staff-salary-details/?emp_code={code}
   */
  async getSalaryDetails(empCode: string) {
    const url = `${API_ENDPOINTS.STAFF_SALARY_DETAILS}?emp_code=${encodeURIComponent(empCode)}`;
    const res = await apiClient.get(url);
    return res;
  },

  /**
   * Fetch Dynamic Holidays from MySQL -> GET /api/masters/holidays/?page=1
   */
  async getHolidays() {
    return apiClient.get<any>('/api/masters/holidays/?page=1');
  },

  /**
   * Fetch Approved Processed Salary Records -> GET /api/payroll/staff-salary-details/pro_list/?unit_code={unit}&month={m}&year={y}
   */
  async getApprovedSalaryList(params: { unit_code?: string; month?: number; year?: number; emp_code?: string }) {
    const parts: string[] = [];
    if (params.unit_code) parts.push(`unit_code=${encodeURIComponent(params.unit_code)}`);
    if (params.emp_code) parts.push(`emp_code=${encodeURIComponent(params.emp_code)}`);
    if (params.month) parts.push(`month=${encodeURIComponent(params.month)}`);
    if (params.year) parts.push(`year=${encodeURIComponent(params.year)}`);
    const qs = parts.length > 0 ? `?${parts.join('&')}` : '';
    const url = `${API_ENDPOINTS.STAFF_SALARY_PRO_LIST}${qs}`;
    return apiClient.get(url);
  },

  /**
   * Get direct URL to download approved Staff Salary Slip PDF
   */
  getApprovedSalarySlipPdfUrl(params: { unit_code?: string; month: number; year: number; emp_code?: string }): string {
    const parts: string[] = [];
    if (params.unit_code) parts.push(`unit_code=${encodeURIComponent(params.unit_code)}`);
    parts.push(`month=${encodeURIComponent(params.month)}`);
    parts.push(`year=${encodeURIComponent(params.year)}`);
    if (params.emp_code) parts.push(`emp_code=${encodeURIComponent(params.emp_code)}`);
    return apiConfig.getEndpoint(`${API_ENDPOINTS.STAFF_SALARY_PDF}?${parts.join('&')}`);
  },

  /**
   * Mobile Salary Slip APIs -> /api/payroll/mobile-salary-slip/
   * Serves logged-in employee's own slip directly from backend without menu gate
   */
  async getMobileSalarySlipMonths() {
    return apiClient.get('/api/payroll/mobile-salary-slip/months/');
  },

  async getMobileSalarySlipData(month: number, year: number) {
    return apiClient.get(`/api/payroll/mobile-salary-slip/data/?month=${month}&year=${year}`);
  },

  getMobileSalarySlipPdfUrl(month: number, year: number): string {
    return apiConfig.getEndpoint(`/api/payroll/mobile-salary-slip/pdf/?month=${month}&year=${year}`);
  },

  /**
   * Fetch Original Binary PDF directly from backend /api/payroll/mobile-salary-slip/pdf/
   * and convert to Base64 for native Android Print/PDF saving
   */
  async fetchMobileSalarySlipPdfBase64(month: number, year: number): Promise<string | null> {
    try {
      const url = apiConfig.getEndpoint(`/api/payroll/mobile-salary-slip/pdf/?month=${month}&year=${year}`);
      const headers: Record<string, string> = {};
      const cookie = apiClient.getSessionCookie();
      if (cookie) headers['Cookie'] = cookie;
      const csrf = apiClient.getCsrfToken();
      if (csrf) headers['X-CSRFToken'] = csrf;

      const res = await fetch(url, { method: 'GET', headers });
      if (!res.ok) return null;
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          resolve(base64data);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn('[StaffAPI] Failed to fetch backend PDF blob:', e);
      return null;
    }
  },

  /**
   * Get Download URL for Monthly Salary Slip PDF
   */
  getSalarySlipPdfUrl(month: number, year: number): string {
    return apiConfig.getEndpoint(`${API_ENDPOINTS.SALARY_SLIP_PDF}?month=${month}&year=${year}`);
  },

  /**
   * Get Live MySQL Punch Logs -> GET /api/attendance/android-logs/?emp_code=...
   */
  async getLivePunchLogs(empCode: string) {
    const url = `${API_ENDPOINTS.ATTENDANCE_LOGS}?emp_code=${encodeURIComponent(empCode)}`;
    return apiClient.get(url);
  },

  /**
   * Get Punch Logs / Attendance History -> GET /api/mobile/Getemployeemonthattendances/
   */
  async getAttendanceHistory(empCode: string, month?: string, year?: string) {
    const m = month || String(new Date().getMonth() + 1);
    const y = year || String(new Date().getFullYear());
    const url = `${API_ENDPOINTS.MOBILE_MONTH_ATTENDANCE}?emp_code=${encodeURIComponent(empCode)}&month=${m}&year=${y}`;
    const res = await apiClient.get(url, { 'X-API-Key': ANDROID_API_KEY });
    if (!res.success) {
      // Fallback to legacy endpoint if mobile endpoint fails
      const fallbackUrl = `${API_ENDPOINTS.ATTENDANCE_LOGS}?emp_code=${encodeURIComponent(empCode)}&month=${m}&year=${y}`;
      return apiClient.get(fallbackUrl);
    }
    return res;
  },

  /**
   * Fetch Employee Assigned Shifts & Monthly Shift Calendar -> GET /api/mobile/GetEmployeeShift/?emp_code=...
   */
  async getEmployeeShift(empCode: string, month?: number, year?: number) {
    const today = new Date();
    const m = month || today.getMonth() + 1;
    const y = year || today.getFullYear();
    const url = `${API_ENDPOINTS.MOBILE_EMPLOYEE_SHIFT}?emp_code=${encodeURIComponent(empCode)}&month=${m}&year=${y}`;
    return apiClient.get<EmployeeShiftResponse>(url, { 'X-API-Key': ANDROID_API_KEY });
  },

  /**
   * Fetch Branch Coordinates from Mobile API -> GET /api/mobile/Getunit_Lattitude_Longtitude_Distance/?EMP_CODE=...
   */
  async getUnitCoords(empCode: string) {
    const url = `${API_ENDPOINTS.MOBILE_UNIT_COORDS}?EMP_CODE=${encodeURIComponent(empCode)}`;
    console.log(`[API CALL] 🌐 GET ${url}`);
    const res = await apiClient.get(url, { 'X-API-Key': ANDROID_API_KEY });
    const count = Array.isArray(res.data) ? res.data.length : (res.data ? 1 : 0);
    console.log(`[API RESPONSE] 📥 GET ${url} -> Success: ${res.success}, Records: ${count}`);
    return res;
  },

  /**
   * Get Today's IN/OUT Times -> GET /api/mobile/GETINOUTTIME/?EMP_CODE=...
   */
  async getTodayInOut(empCode: string) {
    const url = `${API_ENDPOINTS.MOBILE_INOUT_TIME}?EMP_CODE=${encodeURIComponent(empCode)}`;
    return apiClient.get(url, { 'X-API-Key': ANDROID_API_KEY });
  },

  /**
   * Get Attendance Policy Thresholds (Working Hours, Half-Day Cutoff) from SQL
   */
  async getPolicyThresholds(empCode: string) {
    const url = `${API_ENDPOINTS.ATTENDANCE_LOGS}policy-thresholds/?emp_code=${encodeURIComponent(empCode)}`;
    return apiClient.get(url);
  },

  /**
   * Fetch Employee Muster History from SQL -> GET /api/attendance/attendance-history/employee/
   */
  async getEmployeeMusterHistory(unitCode: string, year: number, month?: number) {
    let url = `/api/attendance/attendance-history/employee/?unit_code=${encodeURIComponent(unitCode)}&year=${year}`;
    if (month) url += `&month=${month}`;
    return apiClient.get(url);
  },

  /**
   * Record Attendance Punch (Official Android Attendance Punch API)
   */
  async recordPunch(payload: AndroidPunchPayload) {
    const actionLabel = String(payload.attendances_click).toLowerCase().includes('in') ? 'SHIFT_IN' : 'SHIFT_OUT';
    console.log(`[API CALL] 🚀 POST ${API_ENDPOINTS.ATTENDANCE_PUNCH} | Emp: ${payload.emp_code} | Action: ${actionLabel}`);
    const res = await apiClient.post(API_ENDPOINTS.ATTENDANCE_PUNCH, payload, {
      'X-API-Key': ANDROID_API_KEY,
      'Content-Type': 'application/json',
    });
    console.log(`[API RESPONSE] 📥 POST ${API_ENDPOINTS.ATTENDANCE_PUNCH} -> Success: ${res.success}`);
    return res;
  },

  /**
   * Fetch Real-time Break Status -> POST /api/attendance/break-punch/ { emp_code, action: 'STATUS' }
   */
  async getBreakStatus(empCode: string, compCode?: string) {
    const payload: any = { emp_code: empCode, action: 'STATUS' };
    if (compCode) payload.comp_code = compCode;
    return apiClient.post<BreakPunchResponse>(API_ENDPOINTS.ATTENDANCE_BREAK, payload, {
      'X-API-Key': ANDROID_API_KEY,
      'Content-Type': 'application/json',
    });
  },

  /**
   * Record Break Start / End -> POST /api/attendance/break-punch/ { emp_code, action: 'BREAK_START' | 'BREAK_END' }
   */
  async recordBreak(empCode: string, action: 'BREAK_START' | 'BREAK_END', compCode?: string) {
    const payload: any = { emp_code: empCode, action };
    if (compCode) payload.comp_code = compCode;
    return apiClient.post<BreakPunchResponse>(API_ENDPOINTS.ATTENDANCE_BREAK, payload, {
      'X-API-Key': ANDROID_API_KEY,
      'Content-Type': 'application/json',
    });
  },

  /**
   * Fetch Next Auto-Generated Employee Code -> GET /api/hr/employees/next-code/
   */
  async getNextEmpCode() {
    return apiClient.get<{ emp_code: string }>('/api/hr/employees/next-code/');
  },

  /**
   * Fetch Company Departments -> GET /api/masters/departments/ (fallback: /api/hr/departments/)
   */
  async getDepartments() {
    const res = await apiClient.get<any>('/api/masters/departments/?page_size=100');
    const list = res.success && res.data
      ? (Array.isArray(res.data) ? res.data : res.data.results || [])
      : [];
    if (list.length > 0) {
      return res;
    }
    return apiClient.get<any>('/api/hr/departments/?page_size=100');
  },

  /**
   * Upload Employee Verification Document -> POST /api/hr/employee-documents/
   * Validated for Web Portal Employee Master (must end with .jpg).
   */
  async uploadEmployeeDoc(empCode: string, documentType: string, fileUri: string, fileName?: string) {
    const formData = new FormData();
    formData.append('emp_code', empCode);
    formData.append('document_type', documentType);
    const resolvedName = fileName
      ? fileName.toLowerCase().endsWith('.jpg')
        ? fileName
        : `${fileName}.jpg`
      : 'photo.jpg';
    formData.append('file', {
      uri: fileUri,
      name: resolvedName,
      type: 'image/jpeg',
    } as any);
    return apiClient.upload('/api/hr/employee-documents/', formData);
  },

  /**
   * Upload Employee Photo via Mobile Service API -> POST /api/mobile/Employee_photo_image_send/
   * Directly updates MySQL pay_document_verification and displays on Web Portal (Employee Master & Android Docs).
   */
  async uploadMobilePhoto(empCode: string, base64Photo: string) {
    const cleanB64 = base64Photo.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
    return apiClient.post(
      '/api/mobile/Employee_photo_image_send/',
      {
        EMP_CODE: empCode,
        Upload_Image_base64: cleanB64,
      },
      {
        'X-API-Key': ANDROID_API_KEY,
      }
    );
  },

  /**
   * Register/Deploy Employee (Staff / Worker) -> POST /api/hr/employees/
   */
  async createEmployee(payload: {
    emp_code?: string;
    emp_name: string;
    emp_father_name?: string;
    emp_mobile_no?: string;
    emp_email_id?: string;
    send_credentials_email?: boolean;
    unit_code: string;
    client_code?: string;
    dept_code?: string;
    designation_code: string;
    role?: string;
    employee_type?: string;
    birth_date?: string;
    gender?: string;
    joining_date?: string;
    location?: string;
    location_city?: string;
    emp_nationality?: string;
    emp_current_state?: string;
    emp_current_city?: string;
    emp_blood_group?: string;
    password?: string;
  }) {
    return apiClient.post(API_ENDPOINTS.EMPLOYEES, payload);
  },
};

