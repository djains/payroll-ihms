import { apiClient } from './client';
import { API_ENDPOINTS } from './config';

export interface BackendCompany {
  id: number;
  comp_code: string;
  company_name: string;
  address1?: string;
  city?: string;
  state?: string;
  pin?: string;
  company_pan_no?: string;
  company_contact_no?: string;
  company_website?: string;
  gst_no?: string;
  email?: string;
}

export interface BackendRole {
  id: number;
  name: string;
  approval_level?: string;
  legacy_role_name?: string;
  permissions?: Array<{
    menu_id: number;
    permission: string;
  }>;
}

export interface BackendUserItem {
  id: number;
  username: string;
  legacy_login_id: string;
  login_name: string;
  is_active: boolean;
  current_role: string;
}

export interface BackendUnit {
  id: number;
  unit_code: string;
  unit_name: string;
  unit_add1?: string;
  unit_add2?: string;
  unit_address?: string;
  unit_city?: string;
  state_name?: string;
  pincode?: string;
  unit_lattitude?: string;
  unit_longtitude?: string;
  latitude?: string;
  longitude?: string;
  area_meters?: string;
  comp_code?: string;
  client_code?: string;
  reason_for_updation?: string;
}

export interface BackendClientItem {
  id: number;
  client_code: string;
  client_name: string;
  comp_code?: string;
  city?: string;
  state?: string;
}

export interface BackendStateItem {
  id: number;
  state_code?: string;
  state_name: string;
  city?: string;
}

export interface BackendLeaveTypeItem {
  id?: number;
  leave_name: string;
  abbreviation: string;
  gender: string;
  max_no_of_leave: string | number;
  carry_forward: string | boolean;
  leave_accural?: string;
  advance_request?: string;
  backdated_request?: string;
}

export interface BackendLeavePolicy {
  id: number;
  comp_code: string;
  policy_name: string;
  start_date?: string;
  end_date?: string;
  submitted: boolean;
  leave_types?: BackendLeaveTypeItem[];
  holidays?: any[];
  login_person?: string;
  last_modify_date?: string;
}

export interface CreateLeavePolicyPayload {
  policy_name: string;
  start_date?: string;
  end_date?: string;
  leave_types: BackendLeaveTypeItem[];
  holidays?: any[];
}

export interface BackendShift {
  id: number;
  shift_code: string;
  shift_name: string;
  in_time?: string;
  out_time?: string;
  working_hours?: string;
}

export interface BackendItemMaster {
  id: number;
  item_code: string;
  item_name: string;
  hsn_code?: string;
  gst_rate?: string;
  unit?: string;
}

export const superadminApi = {
  /**
   * Fetch all registered companies -> GET /api/masters/companies/
   */
  async getCompanies(search?: string, page: number = 1, pageSize?: number | 'all') {
    let url = `${API_ENDPOINTS.COMPANIES}?page=${page}`;
    if (pageSize) {
      url += `&page_size=${pageSize}`;
    }
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return apiClient.get<any>(url);
  },

  /**
   * Fetch roles -> GET /api/auth/roles/
   * For count only, pass page=1 & pageSize=1 so backend returns { count: X, results: [...] } fast!
   */
  async getRoles(page?: number, pageSize?: number) {
    const params: string[] = [];
    if (page) params.push(`page=${page}`);
    if (pageSize) params.push(`page_size=${pageSize}`);
    const url = params.length > 0 ? `${API_ENDPOINTS.ROLES}?${params.join('&')}` : API_ENDPOINTS.ROLES;
    return apiClient.get<any>(url);
  },

  /**
   * Ultra-fast Roles list for dashboard counts -> GET /api/hr/roles/
   * Returns flat list of distinct role names without heavy permissions joins (~0.04s)
   */
  async getRolesFastList() {
    return apiClient.get<any>(API_ENDPOINTS.ROLES_LIST);
  },

  /**
   * Fetch system users -> GET /api/auth/users/
   */
  async getUsers(search?: string, limit?: number, pageSize?: number | 'all') {
    let url = API_ENDPOINTS.USERS;
    const params: string[] = [];
    if (limit) {
      params.push(`limit=${limit}`);
    }
    if (pageSize) {
      params.push(`page=1&page_size=${pageSize}`);
    }
    if (search) {
      params.push(`search=${encodeURIComponent(search)}`);
    }
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    return apiClient.get<any>(url);
  },

  /**
   * Update user status or role -> PATCH /api/auth/users/{id}/
   */
  async updateUser(userId: number, data: Partial<{ is_active: boolean; role_name: string; password?: string; confirm_password?: string }>) {
    return apiClient.patch<any>(`${API_ENDPOINTS.USERS}${userId}/`, data);
  },

  /**
   * Fetch Clients -> GET /api/masters/clients/
   */
  async getClients(search?: string, page: number = 1) {
    let url = `${API_ENDPOINTS.CLIENTS}?page=${page}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return apiClient.get<any>(url);
  },

  /**
   * Fetch States -> GET /api/masters/states/
   */
  async getStates(search?: string, pageSize: number = 100, page: number = 1, stateName?: string) {
    let url = `${API_ENDPOINTS.STATES}?page=${page}&page_size=${pageSize}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    if (stateName) {
      url += `&state_name=${encodeURIComponent(stateName)}`;
    }
    return apiClient.get<any>(url);
  },

  /**
   * Fetch Units / Sites with Geofencing Coordinates -> GET /api/masters/units/
   */
  async getUnits(search?: string, page: number = 1, pageSize?: number) {
    let url = `${API_ENDPOINTS.UNITS}?page=${page}`;
    if (pageSize) {
      url += `&page_size=${pageSize}`;
    }
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return apiClient.get<any>(url);
  },

  /**
   * Fetch Shift Master definitions -> GET /api/masters/shifts/
   * Pass unitCode to get shifts specific to a site
   */
  async getShifts(unitCode?: string) {
    const url = unitCode
      ? `${API_ENDPOINTS.SHIFTS}?unit_code=${encodeURIComponent(unitCode)}`
      : API_ENDPOINTS.SHIFTS;
    return apiClient.get<any>(url);
  },

  /**
   * Fetch Consumables & Item Master -> GET /api/masters/item-masters/
   */
  async getItemMasters() {
    return apiClient.get<any>(API_ENDPOINTS.ITEM_MASTERS);
  },

  /**
   * Fetch Master Navigation Tree -> GET /api/menu/
   */
  async getMenuTree() {
    return apiClient.get<any>(API_ENDPOINTS.MENU_TREE);
  },

  /**
   * Create new Company in MySQL -> POST /api/masters/companies/
   */
  async createCompany(payload: {
    company_name: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    pin?: string;
    company_pan_no?: string;
    company_contact_no?: string;
    emp_series_init: string;
    admin_user_id: string;
    admin_password: string;
    file_no?: string;
    e_invoice_applicable?: string;
    ds_applicable_flag?: string;
  }) {
    return apiClient.post<any>(API_ENDPOINTS.COMPANIES, payload);
  },

  /**
   * Create new Site Unit with Geofencing in MySQL -> POST /api/masters/units/
   */
  async createUnit(payload: {
    comp_code: string;
    unit_code: string;
    unit_name: string;
    unit_add1: string;
    unit_add2?: string;
    unit_city: string;
    state_name: string;
    pincode: string;
    file_no?: string;
    area_meters?: string;
    unit_lattitude: string;
    unit_longtitude: string;
    client_code?: string;
  }) {
    return apiClient.post<any>(API_ENDPOINTS.UNITS, payload);
  },

  /**
   * Update existing Site Unit (GPS coords, radius, etc.) in MySQL -> PATCH /api/masters/units/{id}/
   */
  async updateUnit(id: number | string, payload: Partial<BackendUnit>) {
    return apiClient.patch<any>(`${API_ENDPOINTS.UNITS}${id}/`, payload);
  },

  /**
   * Create a new shift for a unit in MySQL -> POST /api/masters/shifts/
   */
  async createShift(payload: {
    shift_name: string;
    shift_from: string;
    shift_to: string;
    unit_code: string;
  }) {
    return apiClient.post<any>(API_ENDPOINTS.SHIFTS, payload);
  },

  /**
   * Create new Role in MySQL -> POST /api/auth/roles/
   */
  async createRole(payload: {
    name: string;
    approval_level?: string;
    permissions?: Array<{ menu_id: number; permission: string }>;
  }) {
    return apiClient.post<any>(API_ENDPOINTS.ROLES, payload);
  },

  /**
   * Assign / Update Role Permissions in MySQL -> PATCH /api/auth/roles/{id}/
   */
  async updateRolePermissions(roleId: number, payload: {
    name: string;
    permissions: Array<{ menu_id: number; permission: string }>;
  }) {
    return apiClient.patch<any>(`${API_ENDPOINTS.ROLES}${roleId}/`, payload);
  },

  /**
   * Fetch Leave Policies for the company -> GET /api/leave/policies/
   */
  async getLeavePolicies(search?: string) {
    const url = search ? `${API_ENDPOINTS.LEAVE_POLICIES}?search=${encodeURIComponent(search)}` : API_ENDPOINTS.LEAVE_POLICIES;
    return apiClient.get<BackendLeavePolicy[] | { results: BackendLeavePolicy[] }>(url);
  },

  /**
   * Create a new Leave Policy with nested Leave Types -> POST /api/leave/policies/
   */
  async createLeavePolicy(payload: CreateLeavePolicyPayload) {
    return apiClient.post<BackendLeavePolicy>(API_ENDPOINTS.LEAVE_POLICIES, payload);
  },

  /**
   * Update an existing Leave Policy with nested Leave Types -> PUT /api/leave/policies/{id}/
   */
  async updateLeavePolicy(policyId: number, payload: Partial<CreateLeavePolicyPayload>) {
    return apiClient.put<BackendLeavePolicy>(`${API_ENDPOINTS.LEAVE_POLICIES}${policyId}/`, payload);
  },

  /**
   * Submit / Activate Policy & Provision Balances to All Company Employees -> POST /api/leave/policies/{id}/submit/
   */
  async submitLeavePolicy(policyId: number) {
    return apiClient.post<{
      detail: string;
      policy_name: string;
      submitted: boolean;
      balances_created: number;
      balances_updated: number;
      employees_considered: number;
      leave_types: number;
    }>(`${API_ENDPOINTS.LEAVE_POLICIES}${policyId}/submit/`);
  },

  /**
   * Delete a Leave Policy -> DELETE /api/leave/policies/{id}/
   */
  async deleteLeavePolicy(policyId: number) {
    return apiClient.delete<any>(`${API_ENDPOINTS.LEAVE_POLICIES}${policyId}/`);
  },

  /**
   * Fetch unit/employee policy assignments -> GET /api/leave/assignments/
   */
  async getLeaveAssignments(params?: { unit_code?: string; emp_code?: string; policy_name?: string }) {
    let url = '/api/leave/assignments/';
    const q: string[] = [];
    if (params?.unit_code) q.push(`unit_code=${encodeURIComponent(params.unit_code)}`);
    if (params?.emp_code) q.push(`emp_code=${encodeURIComponent(params.emp_code)}`);
    if (params?.policy_name) q.push(`policy_name=${encodeURIComponent(params.policy_name)}`);
    if (q.length > 0) url += `?${q.join('&')}`;
    return apiClient.get<any>(url);
  },

  /**
   * Assign a leave policy to specific unit(s) or employees -> POST /api/leave/assignments/assign/
   */
  async assignPolicyToUnits(payload: {
    policy_name: string;
    unit_codes?: string[];
    emp_codes?: string[];
  }) {
    return apiClient.post<{ status: string; assigned: number }>('/api/leave/assignments/assign/', payload);
  },
};

