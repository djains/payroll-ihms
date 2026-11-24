export type RoleCode =
  | 'SUPER_ADMIN'
  | 'COMPANY_ADMIN'
  | 'SUPERVISOR'
  | 'STAFF'
  | 'HOUSEKEEPING'
  | 'RM_MANAGER'
  | 'VIN_AGENT'
  | (string & {});

export interface UserPermission {
  menu: string;
  menuId?: number;
  permission: string;
  needsReview?: boolean;
}

export interface User {
  id: string;
  username: string;
  empCode: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  branchOrUnit: string;
  role: RoleCode;
  companyId: string | null;
  avatarUrl?: string;
  joiningDate?: string;
  assignedUnitLatitude?: number;
  assignedUnitLongitude?: number;
  assignedUnitRadiusMeters?: number;
  backendRole?: string;
  permissions?: UserPermission[];
  scope?: {
    comp_code?: string;
    client_code?: string;
    unit_code?: string;
    unit_name?: string;
    city?: string;
    state?: string;
    region?: string;
    address?: string;
  };
}

export interface Company {
  id: string;
  code: string;
  name: string;
  legalEntityName?: string;
  industry?: string;
  brandColor: string;
  accentColor: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  unitsCount?: number;
  activeGuardsCount?: number;
  enabledFeatureIds?: string[];
  enabledRoleCodes?: string[];
  createdAt?: string;
}

export type FeatureCategory =
  | 'AUTH'
  | 'ATTENDANCE'
  | 'PAYROLL'
  | 'KYC'
  | 'LEAVE_CLAIMS'
  | 'SECURITY'
  | 'HOUSEKEEPING'
  | 'RECRUITMENT'
  | 'INSURANCE';

export interface FeatureDefinition {
  id: string;
  code?: string;
  key?: string;
  name: string;
  title?: string;
  category: FeatureCategory;
  description: string;
  icon: string;
  screenName: string;
  defaultRoles?: string[];
  defaultEnabled?: boolean;
}

export interface TabConfig {
  id: string;
  name: string;
  label: string;
  icon: string;
}

export interface RoleDefinition {
  code: RoleCode;
  name: string;
  shortName?: string;
  description: string;
  icon?: string;
  color?: string;
  allowedTabs: TabConfig[];
  defaultFeatureIds: string[];
}

