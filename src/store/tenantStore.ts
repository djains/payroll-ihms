import { create } from './createStore';
import {
  Company,
  RoleDefinition,
  TabConfig,
  FeatureDefinition,
} from '../types/models';
import { useAuthStore } from './authStore';
import { useSuperAdminStore } from './superAdminStore';
import { colors, createCompanyTheme, ThemeColors } from '../theme/colors';

export interface TenantState {
  currentCompany: Company | null;
  themeColors: ThemeColors;
  enabledFeatureIds: string[];
  activeFeatures: FeatureDefinition[];
  roleDefinition: RoleDefinition | null;
  allowedTabs: TabConfig[];

  // Actions
  refreshTenant: () => void;
  hasFeature: (featureId: string) => boolean;
}

export const useTenantStore = create<TenantState>((set, get) => {
  const computeTenantState = () => {
    const authUser = useAuthStore.getState().currentUser;
    const allCompanies = useSuperAdminStore.getState().companies;
    const allRoles = useSuperAdminStore.getState().roles;

    // Target company from live state
    let targetCompany: Company | null = null;
    if (authUser?.companyId) {
      const matchCode = authUser.companyId.trim().toUpperCase();
      targetCompany =
        allCompanies.find(
          (c) =>
            c.id?.toUpperCase() === matchCode ||
            c.code?.toUpperCase() === matchCode
        ) || null;
    } else if (authUser?.role === 'SUPER_ADMIN') {
      const selectedId = useSuperAdminStore.getState().selectedCompanyId;
      targetCompany = allCompanies.find((c) => c.id === selectedId) || null;
    }

    // Dynamic role definition derived from live user session
    const roleDef: RoleDefinition | null = authUser
      ? allRoles.find((r) => r.code === authUser.role) || {
          code: authUser.role,
          name: authUser.designation || authUser.role,
          description: '',
          allowedTabs: [],
          defaultFeatureIds: [],
        }
      : null;

    // Dynamic brand colors
    const themeColors = targetCompany
      ? createCompanyTheme(targetCompany.brandColor, targetCompany.accentColor)
      : colors;

    // Enabled features for this company (dynamic from database)
    const enabledFeatureIds = targetCompany?.enabledFeatureIds || [];
    const activeFeatures: FeatureDefinition[] = [];
    const allowedTabs: TabConfig[] = roleDef?.allowedTabs || [];

    return {
      currentCompany: targetCompany,
      themeColors,
      enabledFeatureIds,
      activeFeatures,
      roleDefinition: roleDef,
      allowedTabs,
    };
  };

  // Subscribe to auth and super admin changes to keep tenant dynamically in sync
  useAuthStore.subscribe(() => {
    set(computeTenantState());
  });

  useSuperAdminStore.subscribe(() => {
    set(computeTenantState());
  });

  return {
    ...computeTenantState(),

    refreshTenant: () => {
      set(computeTenantState());
    },

    hasFeature: (featureId: string) => {
      return get().enabledFeatureIds.includes(featureId);
    },
  };
});
