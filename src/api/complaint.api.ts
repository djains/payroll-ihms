import { apiClient } from './client';
import { API_ENDPOINTS } from './config';

export interface ComplaintItem {
  Id: number;
  complaint_name: string;
  priority: 'TOP' | 'MEDIUM' | 'LOW' | string;
  date: string;
  resole_date?: string;
  status: 'In Process' | 'Resolve' | 'Complete' | string;
  Remark: string;
  comment?: string;
}

export interface AdminComplaintItem {
  Id: number;
  complaint_name: string;
  priority: 'TOP' | 'MEDIUM' | 'LOW' | string;
  date: string;
  resole_date?: string;
  status: string;
  Remark: string;
  comment?: string;
  state_name?: string;
  client_name?: string;
  unit_name?: string;
  ZONE?: string;
}

export interface SendComplaintPayload {
  priority: 'TOP' | 'MEDIUM' | 'LOW' | string;
  category: string;
  names: string[];
  remark: string;
  unitCode?: string;
}

export const complaintApi = {
  /**
   * Fetch all distinct complaint categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const res = await apiClient.get<{ results: Array<{ name: string }> }>(
        API_ENDPOINTS.COMPLAINT_CATEGORIES
      );
      if (res.success && res.data?.results) {
        return res.data.results.map((r) => String(r.name || '')).filter(Boolean);
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Fetch complaint categories filtered by priority
   */
  async getCategoriesByPriority(priority: string): Promise<string[]> {
    try {
      const endpoint = `${API_ENDPOINTS.COMPLAINT_CATEGORIES_BY_PRIORITY}?priority=${encodeURIComponent(priority)}`;
      const res = await apiClient.get<{ results: Array<{ name: string }> }>(endpoint);
      if (res.success && res.data?.results) {
        return res.data.results.map((r) => String(r.name || '')).filter(Boolean);
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Fetch complaint sub-types for selected priority and category
   */
  async getComplaintTypes(priority: string, category: string): Promise<string[]> {
    try {
      const endpoint = `${API_ENDPOINTS.COMPLAINT_TYPES}?priority=${encodeURIComponent(priority)}&category=${encodeURIComponent(category)}`;
      const res = await apiClient.get<{ results: Array<{ name: string }> }>(endpoint);
      if (res.success && res.data?.results) {
        return res.data.results.map((r) => String(r.name || '')).filter(Boolean);
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Submit new complaint / query (Unit / Employee side)
   */
  async sendComplaint(payload: SendComplaintPayload): Promise<{ success: boolean; message: string }> {
    try {
      const safeNames = (payload.names && payload.names.length > 0)
        ? payload.names
        : [payload.category || 'General Query'];

      const body = {
        priority: payload.priority,
        category: payload.category,
        names: safeNames,
        remark: payload.remark,
      };

      // 1. Resolve active valid branch/unit for this company
      // Legacy Unit_Login.aspx.cs / portal_dashboard.py allows unit-less logins (e.g. admin/staff or employee whose unit_code is different)
      // to resolve active branches from header endpoint:
      let effectiveUnit = (payload.unitCode || '').trim();
      try {
        const headerRes = await apiClient.get<any>('/api/masters/portal/unit/header/');
        if (headerRes.success && headerRes.data) {
          const headerData = headerRes.data;
          const userUnit = (headerData.unit_code || headerData.login_unit || '').trim();
          const branches = Array.isArray(headerData.branches) ? headerData.branches : [];
          
          if (userUnit) {
            effectiveUnit = userUnit;
          } else if (branches.length > 0) {
            // Check if current effectiveUnit matches any branch code
            const found = branches.find((b: any) => String(b.code || '').trim() === effectiveUnit);
            if (!found && branches[0]?.code) {
              // Automatically bind to the first valid company branch so SQL client_code is not NULL
              console.log('[COMPLAINT] Binding to company active branch:', branches[0].code);
              effectiveUnit = String(branches[0].code).trim();
            }
          }
        }
      } catch (err) {
        console.warn('[COMPLAINT] Could not resolve portal/unit/header:', err);
      }

      // Try with resolved effectiveUnit
      let unitQuery = effectiveUnit ? `?unit_code=${encodeURIComponent(effectiveUnit)}` : '';
      let endpoint = `${API_ENDPOINTS.COMPLAINT_SEND}${unitQuery}`;
      console.log('[COMPLAINT SUBMIT] Calling Unit endpoint:', endpoint, 'Payload:', JSON.stringify(body));
      let res = await apiClient.post<{ message?: string }>(endpoint, body);

      // If failed and we passed a unit_code, also try without unit_code (in case backend resolves user session directly)
      if (!res.success && unitQuery) {
        console.log('[COMPLAINT SUBMIT] Retrying without unit_code query param...');
        const plainRes = await apiClient.post<{ message?: string }>(API_ENDPOINTS.COMPLAINT_SEND, body);
        if (plainRes.success) {
          res = plainRes;
        }
      }

      if (!res.success) {
        console.warn('[COMPLAINT SUBMIT] Unit endpoint failed:', {
          error: res.error,
          data: res.data,
          effectiveUnit,
        });
      }

      // Fallback to HO complaint endpoint if unit endpoint fails
      if (!res.success && effectiveUnit) {
        const hoEndpoint = `/api/masters/portal/ho/ho-complaint-send/?unit_code=${encodeURIComponent(effectiveUnit)}`;
        console.log('[COMPLAINT SUBMIT] Trying HO fallback endpoint:', hoEndpoint);
        const hoRes = await apiClient.post<{ message?: string }>(hoEndpoint, body);
        if (hoRes.success) {
          res = hoRes;
        } else {
          console.warn('[COMPLAINT SUBMIT] HO fallback also failed:', {
            error: hoRes.error,
            data: hoRes.data,
          });
        }
      }

      if (res.success) {
        return {
          success: true,
          message: res.data?.message || 'Complaint submitted successfully.',
        };
      }

      // Clean user-friendly message if backend returns raw HTML 500 page
      const rawErr = res.error || '';
      const isHtmlError = rawErr.includes('<!doctype html>') || rawErr.includes('<html') || rawErr.includes('Server Error (500)');
      return {
        success: false,
        message: isHtmlError
          ? 'Server could not register this query right now. Please verify your assigned unit or try again later.'
          : rawErr || 'Failed to submit complaint.',
      };
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || 'Network error occurred while submitting complaint.',
      };
    }
  },

  /**
   * Get employee/unit submitted complaints history & live status
   */
  async getMyComplaints(unitCode?: string): Promise<{ success: boolean; data: ComplaintItem[]; error?: string }> {
    try {
      const unitQuery = unitCode ? `?unit_code=${encodeURIComponent(unitCode)}` : '';
      const endpoint = `${API_ENDPOINTS.COMPLAINT_GRID}${unitQuery}`;
      const res = await apiClient.get<{ results: ComplaintItem[]; count?: number }>(endpoint);

      if (res.success && res.data?.results) {
        return {
          success: true,
          data: res.data.results || [],
        };
      }
      return {
        success: false,
        data: [],
        error: res.error || 'Failed to load complaints.',
      };
    } catch (e: any) {
      return {
        success: false,
        data: [],
        error: e?.message || 'Network error occurred.',
      };
    }
  },

  /**
   * Company Admin / Head Office: Fetch all complaints across all branches/units
   */
  async getAdminComplaints(scope?: {
    unit?: string;
    zone?: string;
    region?: string;
    client?: string;
  }): Promise<{ success: boolean; data: AdminComplaintItem[]; error?: string }> {
    try {
      const unit = scope?.unit && scope.unit !== 'ALL' ? scope.unit : 'ALL';
      const zone = scope?.zone && scope.zone !== 'ALL' ? scope.zone : 'ALL';
      const region = scope?.region && scope.region !== 'ALL' ? scope.region : 'ALL';
      const client = scope?.client || '';

      const query = `?unit=${encodeURIComponent(unit)}&zone=${encodeURIComponent(zone)}&region=${encodeURIComponent(region)}&client=${encodeURIComponent(client)}`;
      const endpoint = `${API_ENDPOINTS.HO_COMPLAINT_GRID}${query}`;

      const res = await apiClient.get<{ results: AdminComplaintItem[]; count?: number }>(endpoint);
      if (res.success && res.data?.results) {
        return {
          success: true,
          data: res.data.results || [],
        };
      }
      return {
        success: false,
        data: [],
        error: res.error || 'Failed to fetch complaints.',
      };
    } catch (e: any) {
      return {
        success: false,
        data: [],
        error: e?.message || 'Network error occurred.',
      };
    }
  },

  /**
   * Company Admin: Resolve complaint and add admin reply comment
   */
  async resolveComplaint(id: number | string, comment: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await apiClient.post<{ message?: string }>(API_ENDPOINTS.COMPLAINT_RESOLVE, {
        id: String(id),
        comment: comment.trim(),
      });
      if (res.success) {
        return {
          success: true,
          message: res.data?.message || 'Complaint resolved successfully.',
        };
      }
      return {
        success: false,
        message: res.error || 'Failed to resolve complaint.',
      };
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || 'Network error occurred.',
      };
    }
  },

  /**
   * Unit Supervisor / Worker: Mark complaint complete after confirmation
   */
  async completeComplaint(id: number | string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await apiClient.post<{ message?: string }>(API_ENDPOINTS.COMPLAINT_COMPLETE, {
        id: String(id),
      });
      if (res.success) {
        return {
          success: true,
          message: res.data?.message || 'Complaint marked complete.',
        };
      }
      return {
        success: false,
        message: res.error || 'Failed to mark complete.',
      };
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || 'Network error occurred.',
      };
    }
  },
};
