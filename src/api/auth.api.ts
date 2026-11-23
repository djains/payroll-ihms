import { apiClient } from './client';
import { API_ENDPOINTS, ANDROID_API_KEY } from './config';

export interface BackendUserRole {
  id: number;
  name: string;
  approval_level?: number;
}

export interface BackendUserScope {
  comp_code?: string;
  client_code?: string | null;
  unit_code?: string | null;
  unit_name?: string | null;
  unit_latitude?: string | null;
  unit_longitude?: string | null;
  unit_distance?: string | null;
}

export interface BackendUserPermission {
  menu_id: string;
  name: string;
  permission: string;
}

export interface BackendEmployeeProfile {
  emp_name?: string;
  emp_mobile_no?: string;
  emp_email_id?: string;
  unit_name?: string;
  designation?: string;
}

export interface BackendMeResponse {
  username: string;
  legacy_login_id?: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser?: boolean;
  must_change_password: boolean;
  role: BackendUserRole;
  scope: BackendUserScope;
  permissions: BackendUserPermission[];
  profile?: BackendEmployeeProfile;
}

export const authApi = {
  /**
   * Fetch initial anti-CSRF token -> GET /api/auth/csrf/
   */
  async getCsrfToken(): Promise<string | null> {
    return apiClient.ensureCsrfToken();
  },

  /**
   * Authenticate against Django Backend -> POST /api/auth/login/
   */
  async login(username: string, password: string) {
    return apiClient.post<BackendMeResponse>(API_ENDPOINTS.LOGIN, {
      username,
      password,
    });
  },

  /**
   * Fetch current session profile -> GET /api/auth/me/
   */
  async getMe() {
    return apiClient.get<BackendMeResponse>(API_ENDPOINTS.ME);
  },

  /**
   * Terminate active backend session -> POST /api/auth/logout/
   */
  async logout() {
    return apiClient.post(API_ENDPOINTS.LOGOUT);
  },

  /**
   * Set up new password via single-use token -> POST /api/auth/password/setup/
   */
  async setupPassword(token: string, newPassword: string) {
    return apiClient.post(API_ENDPOINTS.PASSWORD_SETUP, {
      token,
      new_password: newPassword,
    });
  },

  /**
   * Change Password for logged-in user in MySQL & Django -> POST /api/auth/me/change-password/
   */
  async changePassword(oldPassword: string, newPassword: string) {
    return apiClient.post('/api/auth/me/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
  },

  /**
   * Verify Employee Identity via live 3-point check (Emp Code + DOB + Aadhaar) -> GET /api/mobile/ForgetPassword/
   */
  async verifyForgetPassword(empCode: string, dob: string, aadhaar: string) {
    const cleanCode = empCode.trim().toUpperCase();
    const cleanDob = dob.trim();
    const cleanAadhaar = aadhaar.trim();

    return apiClient.get<Array<{ emp_name: string; new_password?: string }>>(
      `/api/mobile/ForgetPassword/?emp_code=${encodeURIComponent(cleanCode)}&birth_day=${encodeURIComponent(cleanDob)}&adhar_card=${encodeURIComponent(cleanAadhaar)}`,
      { 'X-API-Key': ANDROID_API_KEY }
    );
  },

  /**
   * Reset Password for unauthenticated Employee via 3-point Identity Verification -> POST /api/mobile/ForgetPassword/
   */
  async resetForgotPassword(payload: {
    empCode: string;
    dob: string;
    aadhaar: string;
    newPassword?: string;
  }) {
    return apiClient.post<Array<{ emp_name: string; new_password?: string; message?: string }>>(
      '/api/mobile/ForgetPassword/',
      {
        emp_code: payload.empCode.trim().toUpperCase(),
        birth_day: payload.dob.trim(),
        adhar_card: payload.aadhaar.trim(),
        new_password: payload.newPassword?.trim(),
      },
      { 'X-API-Key': ANDROID_API_KEY }
    );
  },
};

