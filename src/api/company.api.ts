import { apiClient } from './client';
import { API_ENDPOINTS } from './config';

export interface CreateCompanyPayload {
  comp_code: string;
  comp_name: string;
  comp_type?: string;
  address?: string;
  city?: string;
  state_name?: string;
  panno?: string;
  gst_no?: string;
  email?: string;
  tel1?: string;
}

export const companyApi = {
  /**
   * Fetch all companies -> GET /api/masters/companies/
   */
  async getCompanies(search?: string, page: number = 1) {
    let url = `${API_ENDPOINTS.COMPANIES}?page=${page}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return apiClient.get(url);
  },

  /**
   * Create new company -> POST /api/masters/companies/
   */
  async createCompany(payload: CreateCompanyPayload) {
    return apiClient.post(API_ENDPOINTS.COMPANIES, payload);
  },

  /**
   * Fetch roles registry -> GET /api/accounts/roles/
   */
  async getRoles() {
    return apiClient.get(API_ENDPOINTS.ROLES);
  },

  /**
   * Update role permissions -> PUT /api/accounts/roles/{id}/
   */
  async updateRolePermissions(roleId: number, name: string, permissions: Array<{ menu_id: string | number; permission: string }>) {
    return apiClient.put(`${API_ENDPOINTS.ROLES}${roleId}/`, {
      name,
      permissions,
    });
  },

  /**
   * Fetch master menu tree -> GET /api/menu/
   */
  async getMenuTree() {
    return apiClient.get(API_ENDPOINTS.MENU_TREE);
  },
};

