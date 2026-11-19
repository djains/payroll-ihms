import { apiClient } from './client';
import { API_ENDPOINTS } from './config';

export interface SendOnboardingLinkPayload {
  mobile_no: string;
  candidate_name: string;
  client_code: string;
  designation: string;
}

export const managerApi = {
  /**
   * Dispatch self-onboarding link via SMS/WA -> POST /api/hr/resource-recruitment/send_link/
   */
  async sendOnboardingLink(payload: SendOnboardingLinkPayload) {
    return apiClient.post(API_ENDPOINTS.RM_SEND_LINK, payload);
  },

  /**
   * Fetch Recruitment Pipeline Statistics -> GET /api/hr/resource-recruitment/summary/
   */
  async getRecruitmentSummary() {
    return apiClient.get(API_ENDPOINTS.RM_SUMMARY);
  },

  /**
   * Fetch Cluster Managers under RM -> GET /api/hr/resource-recruitment/cm_under_rm/
   */
  async getCmUnderRm() {
    return apiClient.get(API_ENDPOINTS.RM_CM_UNDER_RM);
  },

  /**
   * Log Client / Prospect Meet (VIN Agent / Manager) -> POST /api/transactions/client-requests/
   */
  async logProspectMeet(formData: FormData) {
    return apiClient.upload(API_ENDPOINTS.CLIENT_REQUESTS, formData);
  },
};

