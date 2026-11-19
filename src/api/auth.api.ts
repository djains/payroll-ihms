import { apiClient } from './client';
import { API_ENDPOINTS } from './config';

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
};

