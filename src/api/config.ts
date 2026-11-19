
import { Platform } from 'react-native';
/**
 * Global API Network Configuration
 * Your PC's Wi-Fi IP: 192.168.1.45 (allowing physical phone over wireless Wi-Fi to reach backend)
 * Android Emulator fallback: 10.0.2.2
 */
// export const PC_LOCAL_IP = '192.168.1.22';


export const ANDROID_API_KEY = 'c_iwIXRC1zx-ejzyaazVOTWbx8mlCR9fZRdN7gBoAoc';

// Live Render Cloud Backend
// const DEFAULT_HOST = 'https://ihms-backend-2.onrender.com';
const DEFAULT_HOST = 'https://payroll.coreal.in'

class ApiConfig {
  private baseUrl: string = DEFAULT_HOST;

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  public getEndpoint(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${cleanPath}`;
  }
}

export const apiConfig = new ApiConfig();

export const API_ENDPOINTS = {
  // Authentication & Session
  CSRF: '/api/auth/csrf/',
  LOGIN: '/api/auth/login/',
  LOGOUT: '/api/auth/logout/',
  ME: '/api/auth/me/',
  PASSWORD_SETUP: '/api/auth/password/setup/',

  // Masters & Roles
  COMPANIES: '/api/masters/companies/',
  CLIENTS: '/api/masters/clients/',
  STATES: '/api/masters/states/',
  ROLES: '/api/auth/roles/',
  ROLES_LIST: '/api/hr/roles/',
  USERS: '/api/auth/users/',
  MENUS: '/api/auth/menus/',
  MENU_TREE: '/api/menu/',
  UNITS: '/api/masters/units/',
  SHIFTS: '/api/masters/shifts/',

  // Staff / HR / Attendance
  ATTENDANCE_LOGS: '/api/attendance/android-logs/',
  ATTENDANCE_PUNCH: '/api/attendance/android-punch/',
  MOBILE_MONTH_ATTENDANCE: '/api/mobile/Getemployeemonthattendances/',
  MOBILE_INOUT_TIME: '/api/mobile/GETINOUTTIME/',
  MOBILE_UNIT_COORDS: '/api/mobile/Getunit_Lattitude_Longtitude_Distance/',
  MOBILE_ATTENDANCE_DETAILS: '/api/mobile/GetAttendanceDetails/',
  MUSTER_SHEET: '/api/attendance/muster-sheet/',
  BULK_ATTENDANCE: '/api/attendance/bulk-attendance/',
  EMPLOYEE_KYC: '/api/hr/employee-kyc/',
  EMPLOYEE_DOCUMENTS: '/api/hr/employee-documents/',
  ANDROID_DOCUMENTS: '/api/hr/android-documents/',
  PORTAL_ATTENDANCE_LOGS: '/api/attendance/android-logs-portal/attendance-logs/',
  LEAVE_APPLICATIONS: '/api/leave/applications/',
  LEAVE_POLICIES: '/api/leave/policies/',
  PETTY_CASH_SUBMIT: '/api/transactions/petty-cash-android/submit/',
  PETTY_CASH_REQUESTS: '/api/transactions/petty-cash-android/requests/',
  SALARY_SLIP_PDF: '/api/payroll/emp-salary-slip/pdf/',
  STAFF_SALARY_DETAILS: '/api/payroll/staff-salary-details/',
  STAFF_SALARY_PRO_LIST: '/api/payroll/staff-salary-details/pro_list/',
  STAFF_SALARY_PDF: '/api/payroll/staff-salary-details/salary_pdf/',
  EMPLOYEES: '/api/hr/employees/',

  // Supervisor Operations
  SITE_AUDITS: '/api/masters/site-audits/',
  SITE_AUDIT_DETAIL: '/api/masters/site-audit-detail/',
  WORKING_IMAGES: '/api/hr/working-images/',
  FIRE_DETAILS: '/api/attendance/android-logs-portal/fire_details/',
  SPOT_RECRUITMENT: '/api/hr/recruitments/',
  TRAVEL_PLANS: '/api/transactions/travel-plans/',
  CONSUMABLE_MATERIAL: '/api/masters/consumable-material/',
  CONSUMABLE_DISPATCH: '/api/transactions/consumable-dispatch/',
  ITEM_MASTERS: '/api/masters/item-masters/',

  // Relationship Manager (RM / CM)
  RM_SEND_LINK: '/api/hr/resource-recruitment/send_link/',
  RM_SUMMARY: '/api/hr/resource-recruitment/summary/',
  RM_CM_UNDER_RM: '/api/hr/resource-recruitment/cm_under_rm/',

  // VIN Agent / Client Requests
  CLIENT_REQUESTS: '/api/transactions/client-requests/',
} as const;

