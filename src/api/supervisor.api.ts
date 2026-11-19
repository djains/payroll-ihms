import { apiClient } from './client';
import { API_ENDPOINTS } from './config';

export interface BulkAttendanceRecord {
  emp_code: string;
  status: 'P' | 'A' | 'L' | 'WO';
  in_time?: string;
  out_time?: string;
  overtime_hours?: number;
  replacement_emp_code?: string | null;
}

export interface BulkAttendancePayload {
  client_code: string;
  unit_code: string;
  date: string; // YYYY-MM-DD
  shift: string;
  records: BulkAttendanceRecord[];
}

export interface SpotRecruitmentPayload {
  client_name: string;
  unit_name: string;
  grade: string;
  supervisor_code?: string;
  new_employee_name: string;
  father_name: string;
  dob: string; // YYYY-MM-DD
  gender: 'Male' | 'Female';
  doj?: string; // YYYY-MM-DD
  blood_group?: string;
  mobile_no: string;
  address?: string;
  uniform_size?: string;
  shoes_size?: string;
  working_hours?: string;
  aadhaar?: string;
  account_no?: string;
  ifsc_code?: string;
  branch_name?: string;
  bank_holder_name?: string;
}

export interface TravelPlanPayload {
  travel_mode: 'Bus' | 'Train' | 'Auto' | 'Flight';
  from_designation: string;
  to_designation: string;
  from_date: string; // YYYY-MM-DD
  to_date: string; // YYYY-MM-DD
  adv_amount?: string;
  total_km?: number;
  add_description?: string;
}

export const supervisorApi = {
  /**
   * Submit Shift Guard Bulk Attendance -> POST /api/attendance/bulk-attendance/
   */
  async submitBulkAttendance(payload: BulkAttendancePayload) {
    return apiClient.post(API_ENDPOINTS.BULK_ATTENDANCE, payload);
  },

  /**
   * Fetch Shift Muster Sheet -> GET /api/attendance/muster-sheet/
   */
  async getMusterSheet(clientCode: string, unitCode: string, month: string, year: string) {
    const q = `client_code=${encodeURIComponent(clientCode)}&unit_code=${encodeURIComponent(
      unitCode
    )}&month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`;
    return apiClient.get(`${API_ENDPOINTS.MUSTER_SHEET}?${q}`);
  },

  /**
   * Submit Site Audit with 6 Photo Proofs -> POST /api/masters/site-audits/
   */
  async submitSiteAudit(formData: FormData) {
    return apiClient.upload(API_ENDPOINTS.SITE_AUDITS, formData);
  },

  /**
   * Submit 10-Criteria Service Quality Rating -> POST /api/masters/site-audit-detail/
   */
  async submitServiceRating(formData: FormData) {
    return apiClient.upload(API_ENDPOINTS.SITE_AUDIT_DETAIL, formData);
  },

  /**
   * Upload Working Image (Duty proof) -> POST /api/hr/working-images/
   */
  async uploadWorkingImage(formData: FormData) {
    return apiClient.upload(API_ENDPOINTS.WORKING_IMAGES, formData);
  },

  /**
   * Direct On-Field Guard Recruitment -> POST /api/hr/recruitments/
   */
  async submitSpotRecruitment(payload: SpotRecruitmentPayload) {
    return apiClient.post(API_ENDPOINTS.SPOT_RECRUITMENT, payload);
  },

  /**
   * Submit Travel Expense Plan -> POST /api/transactions/travel-plans/
   */
  async submitTravelPlan(payload: TravelPlanPayload) {
    return apiClient.post(API_ENDPOINTS.TRAVEL_PLANS, payload);
  },

  /**
   * Fetch Fire Extinguisher Inspection Logs -> GET /api/attendance/android-logs-portal/fire_details/
   */
  async getFireDetails() {
    return apiClient.get(API_ENDPOINTS.FIRE_DETAILS);
  },
};

