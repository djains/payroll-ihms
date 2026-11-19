import { create } from './createStore';
import { Company, RoleDefinition, User } from '../types/models';
import { showToast } from './toastStore';
import { companyApi } from '../api';

export interface SuperAdminState {
  companies: Company[];
  roles: RoleDefinition[];
  selectedCompanyId: string | null;
  impersonatedUser: User | null;

  // Actions
  fetchLiveCompanies: () => Promise<void>;
  addCompany: (data: {
    code: string;
    name: string;
    brandColor?: string;
    accentColor?: string;
    contactEmail: string;
    contactPhone: string;
    enabledFeatureIds?: string[];
  }) => Company;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  deleteCompany: (id: string) => void;
  toggleCompanyStatus: (companyId: string) => void;
  toggleCompanyFeature: (companyId: string, featureId: string, enabled: boolean) => void;
  setAllCompanyFeatures: (companyId: string, featureIds: string[]) => void;
  toggleCompanyRole: (companyId: string, roleCode: string, enabled: boolean) => void;
  addRoleToCompany: (companyId: string, roleCode: string) => void;
  removeRoleFromCompany: (companyId: string, roleCode: string) => void;
  addCustomRole: (data: {
    code: string;
    name: string;
    shortName?: string;
    description: string;
    icon?: string;
    color?: string;
    featureIds: string[];
    assignToCompanyId?: string;
  }) => RoleDefinition;
  setSelectedCompanyId: (id: string | null) => void;
  setImpersonatedUser: (user: User | null) => void;
  getCompany: (id: string) => Company | undefined;
}

export const useSuperAdminStore = create<SuperAdminState>((set, get) => ({
  companies: [],
  roles: [],
  selectedCompanyId: null,
  impersonatedUser: null,

  fetchLiveCompanies: async () => {
    try {
      const res = await companyApi.getCompanies();
      if (res.success && res.data) {
        const results = (res.data as any).results || res.data;
        if (Array.isArray(results) && results.length > 0) {
          const palettes = ['#0EA5E9', '#10B981', '#0F172A', '#6366F1', '#8B5CF6', '#EC4899'];
          const mapped: Company[] = results.map((c: any, index: number) => ({
            id: c.comp_code,
            code: c.comp_code,
            name: c.company_name || c.comp_name || c.comp_code,
            brandColor: palettes[index % palettes.length],
            accentColor: '#F59E0B',
            contactEmail: c.email || '',
            contactPhone: c.company_contact_no || c.tel1 || '',
            address: [c.address1, c.address2].filter(Boolean).join(', ') || c.address || '',
            city: c.city || '',
            status: 'ACTIVE',
            enabledRoleCodes: ['SUPERVISOR', 'STAFF', 'HOUSEKEEPING', 'RM_MANAGER'],
            enabledFeatureIds: [
              'FT_DEVICE_BINDING',
              'FT_MULTI_LANGUAGE',
              'FT_PASSWORD_RECOVERY',
              'FT_GEO_PUNCH',
              'FT_ATTENDANCE_CALENDAR',
              'FT_SALARY_SLIP_PDF',
              'FT_LEAVE_APPLY',
              'FT_PETTY_CASH',
              'FT_SITE_AUDIT_CHECKLIST',
              'FT_SHIFT_GUARD_MUSTER',
            ],
            createdAt: new Date().toISOString(),
          }));
          set({ companies: mapped });
        }
      }
    } catch (e) {
      console.warn('[SuperAdminStore] Error fetching live companies:', e);
    }
  },

  addCompany: (data) => {
    const newCompany: Company = {
      id: `COMP_${Date.now()}`,
      code: data.code.toUpperCase().trim(),
      name: data.name.trim(),
      brandColor: data.brandColor || '#0F172A',
      accentColor: data.accentColor || '#F59E0B',
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      status: 'ACTIVE',
      enabledRoleCodes: ['SUPERVISOR', 'STAFF'],
      enabledFeatureIds: data.enabledFeatureIds || [
        'FT_DEVICE_BINDING',
        'FT_MULTI_LANGUAGE',
        'FT_PASSWORD_RECOVERY',
        'FT_GEO_PUNCH',
        'FT_ATTENDANCE_CALENDAR',
        'FT_SALARY_SLIP_PDF',
        'FT_PROFILE_DOCS_DOWNLOAD',
      ],
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      companies: [newCompany, ...state.companies],
      selectedCompanyId: newCompany.id,
    }));

    showToast({
      type: 'success',
      title: 'Company Created',
      message: `${newCompany.name} registered successfully.`,
    });

    return newCompany;
  },

  updateCompany: (id, updates) => {
    set((state) => ({
      companies: state.companies.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));

    showToast({
      type: 'info',
      title: 'Company Updated',
      message: 'Company configuration saved.',
    });
  },

  deleteCompany: (id) => {
    set((state) => ({
      companies: state.companies.filter((c) => c.id !== id),
      selectedCompanyId: state.selectedCompanyId === id ? null : state.selectedCompanyId,
    }));

    showToast({
      type: 'warning',
      title: 'Company Removed',
      message: 'Company record has been deleted.',
    });
  },

  toggleCompanyStatus: (companyId) => {
    set((state) => ({
      companies: state.companies.map((c) => {
        if (c.id !== companyId) return c;
        const newStatus = c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        return { ...c, status: newStatus };
      }),
    }));

    const updated = get().companies.find((c) => c.id === companyId);
    showToast({
      type: updated?.status === 'ACTIVE' ? 'success' : 'warning',
      title: 'Status Updated',
      message: `${updated?.name} is now ${updated?.status}.`,
    });
  },

  toggleCompanyFeature: (companyId, featureId, enabled) => {
    set((state) => ({
      companies: state.companies.map((company) => {
        if (company.id !== companyId) {
          return company;
        }

        const currentFeatures = new Set(company.enabledFeatureIds);
        if (enabled) {
          currentFeatures.add(featureId);
        } else {
          currentFeatures.delete(featureId);
        }

        return {
          ...company,
          enabledFeatureIds: Array.from(currentFeatures),
        };
      }),
    }));
  },

  setAllCompanyFeatures: (companyId, featureIds) => {
    set((state) => ({
      companies: state.companies.map((c) =>
        c.id === companyId ? { ...c, enabledFeatureIds: featureIds } : c
      ),
    }));

    showToast({
      type: 'success',
      title: 'Switches Saved',
      message: 'Features configuration updated for this company.',
    });
  },

  toggleCompanyRole: (companyId, roleCode, enabled) => {
    set((state) => ({
      companies: state.companies.map((company) => {
        if (company.id !== companyId) return company;

        const currentRoles = new Set(company.enabledRoleCodes || []);
        if (enabled) {
          currentRoles.add(roleCode);
        } else {
          currentRoles.delete(roleCode);
        }

        return {
          ...company,
          enabledRoleCodes: Array.from(currentRoles),
        };
      }),
    }));
  },

  addRoleToCompany: (companyId, roleCode) => {
    set((state) => ({
      companies: state.companies.map((company) => {
        if (company.id !== companyId) return company;
        const currentRoles = new Set(company.enabledRoleCodes || []);
        currentRoles.add(roleCode);
        return {
          ...company,
          enabledRoleCodes: Array.from(currentRoles),
        };
      }),
    }));

    showToast({
      type: 'success',
      title: 'Role Added',
      message: `Role ${roleCode} added to company.`,
    });
  },

  removeRoleFromCompany: (companyId, roleCode) => {
    set((state) => ({
      companies: state.companies.map((company) => {
        if (company.id !== companyId) return company;
        const currentRoles = (company.enabledRoleCodes || []).filter((r) => r !== roleCode);
        return {
          ...company,
          enabledRoleCodes: currentRoles,
        };
      }),
    }));

    showToast({
      type: 'warning',
      title: 'Role Removed',
      message: `Role ${roleCode} deactivated for this company.`,
    });
  },

  addCustomRole: (data) => {
    const cleanCode = data.code.toUpperCase().trim().replace(/[^A-Z0-9_]/g, '_');
    const newRole: RoleDefinition = {
      code: cleanCode,
      name: data.name.trim(),
      shortName: data.shortName?.trim() || data.name.trim(),
      description: data.description.trim(),
      icon: data.icon || 'shield',
      color: data.color || '#CEECE6',
      allowedTabs: [],
      defaultFeatureIds: data.featureIds || [],
    };

    set((state) => {
      let updatedCompanies = state.companies;
      if (data.assignToCompanyId) {
        updatedCompanies = state.companies.map((c) => {
          if (c.id === data.assignToCompanyId) {
            const currentRoles = new Set(c.enabledRoleCodes || []);
            currentRoles.add(cleanCode);
            const currentFeatures = new Set(c.enabledFeatureIds || []);
            (data.featureIds || []).forEach((fId) => currentFeatures.add(fId));
            return {
              ...c,
              enabledRoleCodes: Array.from(currentRoles),
              enabledFeatureIds: Array.from(currentFeatures),
            };
          }
          return c;
        });
      }

      return {
        roles: [...state.roles, newRole],
        companies: updatedCompanies,
      };
    });

    showToast({
      type: 'success',
      title: 'New Role Created',
      message: `${newRole.name} created with ${newRole.defaultFeatureIds.length} features mapped.`,
    });

    return newRole;
  },

  setSelectedCompanyId: (id) => set({ selectedCompanyId: id }),

  setImpersonatedUser: (user) => set({ impersonatedUser: user }),

  getCompany: (id) => {
    return get().companies.find((c) => c.id === id);
  },
}));
