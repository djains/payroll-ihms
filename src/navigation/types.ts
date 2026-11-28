/**
 * TypeScript Navigation Parameter Types
 * Covers all Authentication, Super Admin, Bottom Tabs, and PDF Feature Screens.
 */

export type ScreenName =
  // Auth
  | 'Splash'
  | 'Login'
  | 'ForgotPassword'

  // Super Admin
  | 'SuperAdminDashboard'
  | 'CompanyList'
  | 'CompanyDetail'
  | 'AddCompany'
  | 'FeatureSwitchboard'
  | 'RolePermissions'
  | 'CreateRole'
  | 'ImpersonateUser'
  | 'UserManagement'
  | 'SiteUnits'
  | 'ShiftMaster'
  | 'AddStaff'
  | 'WorkersList'
  | 'LeavePolicy'
  | 'AdminSalarySlip'
  | 'DocumentVerify'
  | 'CompanyAttendanceReview'
  | 'CompanyWorkImagesReview'
  | 'AdminComplaints'

  // Main Tabs
  | 'UnifiedDashboard'
  | 'Notifications'
  | 'HomeTab'
  | 'AttendanceTab'
  | 'PunchTab'
  | 'SalaryTab'
  | 'ProfileTab'
  | 'Profile'
  | 'CompaniesTab'

  // Staff & Attendance Features
  | 'StaffDashboard'
  | 'GeofencePunch'
  | 'MonthlyCalendar'
  | 'AadhaarUpload'
  | 'PanUpload'
  | 'PoliceVerification'
  | 'JoiningDossier'
  | 'DocumentStatus'
  | 'LeaveApply'
  | 'EmployeeComplaints'
  | 'PettyCash'
  | 'SalarySlip'

  // Supervisor Features
  | 'SupervisorDashboard'
  | 'MusterRoll'
  | 'GroomingChecklist'
  | 'SiteAudit'
  | 'ServiceQualityRating'
  | 'WorkingImageProof'
  | 'FireExtinguisher'
  | 'EmergencyDirectory'
  | 'SpotRecruitment'
  | 'TravelExpense'
  | 'LeaveApproval'

  // Housekeeping Features
  | 'HousekeepingDashboard'
  | 'MaterialCheck'
  | 'WorkProofPhotos'
  | 'HKLeaveApply';

export interface NavigationRoute {
  name: ScreenName;
  params?: Record<string, any>;
}

export interface NavigationProp {
  navigate: (screen: ScreenName, params?: Record<string, any>) => void;
  goBack: () => void;
  replace: (screen: ScreenName, params?: Record<string, any>) => void;
  reset: (screen: ScreenName, params?: Record<string, any>) => void;
}

export interface RouteProp {
  name: ScreenName;
  params: Record<string, any>;
}
