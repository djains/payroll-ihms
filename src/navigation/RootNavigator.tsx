import React, { useState, useEffect, useRef } from 'react';
import { View, BackHandler } from 'react-native';
import { styles } from './RootNavigator.styles';
import { useAuthStore } from '../store/authStore';
import { showToast } from '../store/toastStore';
import { useNavigationState, useNavigation, NavigationProvider } from './navigationContext';
import { DynamicBottomTabs } from './DynamicBottomTabs';

// Splash Screen
import { SplashScreen } from '../screens/common/SplashScreen';

// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

// Super Admin Screens
import { SuperAdminDashboardScreen } from '../screens/features/superadmin/SuperAdminDashboardScreen';
import { CompanyListScreen } from '../screens/features/superadmin/CompanyListScreen';
import { AddCompanyScreen } from '../screens/features/superadmin/AddCompanyScreen';
import { FeatureSwitchboardScreen } from '../screens/features/superadmin/FeatureSwitchboardScreen';
import { ImpersonateUserScreen } from '../screens/features/superadmin/ImpersonateUserScreen';
import { RolePermissionsScreen } from '../screens/features/superadmin/RolePermissionsScreen';
import { CreateRoleScreen } from '../screens/features/superadmin/CreateRoleScreen';
import { UserManagementScreen } from '../screens/features/superadmin/UserManagementScreen';
import { SiteUnitsScreen } from '../screens/features/superadmin/SiteUnitsScreen';
import { ShiftMasterScreen } from '../screens/features/superadmin/ShiftMasterScreen';
import { AddStaffScreen } from '../screens/features/superadmin/AddStaffScreen';
import { WorkersListScreen } from '../screens/features/superadmin/WorkersListScreen';
import { LeavePolicyScreen } from '../screens/features/superadmin/LeavePolicyScreen';
import { AdminSalarySlipScreen } from '../screens/features/superadmin/AdminSalarySlipScreen';
import { DocumentVerifyScreen } from '../screens/features/superadmin/DocumentVerifyScreen';
import { CompanyAttendanceReviewScreen } from '../screens/features/superadmin/CompanyAttendanceReviewScreen';
import { CompanyWorkImagesReviewScreen } from '../screens/features/superadmin/CompanyWorkImagesReviewScreen';
import { AdminComplaintScreen } from '../screens/features/complaints/AdminComplaintScreen';
import { EmployeeComplaintScreen } from '../screens/features/complaints/EmployeeComplaintScreen';

// Common Dashboard Screens
import { ProfileScreen } from '../screens/common/ProfileScreen';
import { UnifiedDashboardScreen } from '../screens/common/UnifiedDashboardScreen';
import { NotificationsScreen } from '../screens/common/NotificationsScreen';

// Feature: Attendance
import { GeofencePunchScreen } from '../screens/features/attendance/GeofencePunchScreen';
import { MonthlyCalendarScreen } from '../screens/features/attendance/MonthlyCalendarScreen';

// Feature: Salary
import { SalarySlipScreen } from '../screens/features/salary/SalarySlipScreen';

// Feature: Leave
import { LeaveApplyScreen } from '../screens/features/leave/LeaveApplyScreen';
import { HKLeaveApplyScreen } from '../screens/features/leave/HKLeaveApplyScreen';
import { LeaveApprovalScreen } from '../screens/features/leave/LeaveApprovalScreen';

// Feature: Audit & Quality
import { SiteAuditScreen } from '../screens/features/audit/SiteAuditScreen';
import { GroomingChecklistScreen } from '../screens/features/audit/GroomingChecklistScreen';
import { ServiceQualityRatingScreen } from '../screens/features/audit/ServiceQualityRatingScreen';

// Feature: Field Operations
import { WorkProofPhotosScreen } from '../screens/features/operations/WorkProofPhotosScreen';
import { MaterialCheckScreen } from '../screens/features/operations/MaterialCheckScreen';
import { MusterRollScreen } from '../screens/features/operations/MusterRollScreen';
import { TravelExpenseScreen } from '../screens/features/operations/TravelExpenseScreen';
import { FireExtinguisherScreen } from '../screens/features/operations/FireExtinguisherScreen';
import { EmergencyDirectoryScreen } from '../screens/features/operations/EmergencyDirectoryScreen';
import { SpotRecruitmentScreen } from '../screens/features/operations/SpotRecruitmentScreen';

// Feature: Documents & KYC
import { DocumentStatusScreen } from '../screens/features/documents/DocumentStatusScreen';
import { AadhaarUploadScreen } from '../screens/features/documents/AadhaarUploadScreen';
import { PanUploadScreen } from '../screens/features/documents/PanUploadScreen';
import { PoliceVerificationScreen } from '../screens/features/documents/PoliceVerificationScreen';
import { JoiningDossierScreen } from '../screens/features/documents/JoiningDossierScreen';

// Feature: Petty Cash
import { PettyCashScreen } from '../screens/features/petty_cash/PettyCashScreen';

type ScreenRenderer = React.FC<any>;
const SCREEN_COMPONENTS: Record<string, ScreenRenderer> = {
  // Auth
  Login: LoginScreen,
  ForgotPassword: ForgotPasswordScreen,

  // Super Admin
  SuperAdminDashboard: SuperAdminDashboardScreen,
  CompanyList: CompanyListScreen,
  CompaniesTab: CompanyListScreen,
  AddCompany: AddCompanyScreen,
  FeatureSwitchboard: FeatureSwitchboardScreen,
  RolePermissions: RolePermissionsScreen,
  CreateRole: CreateRoleScreen,
  ImpersonateUser: ImpersonateUserScreen,
  UserManagement: UserManagementScreen,
  SiteUnits: SiteUnitsScreen,
  ShiftMaster: ShiftMasterScreen,
  AddStaff: AddStaffScreen,
  WorkersList: WorkersListScreen,
  LeavePolicy: LeavePolicyScreen,
  AdminSalarySlip: AdminSalarySlipScreen,
  DocumentVerify: DocumentVerifyScreen,
  CompanyAttendanceReview: CompanyAttendanceReviewScreen,
  CompanyWorkImagesReview: CompanyWorkImagesReviewScreen,
  AdminComplaints: AdminComplaintScreen,
  EmployeeComplaints: EmployeeComplaintScreen,

  // Common Tabs & Dashboards
  UnifiedDashboard: UnifiedDashboardScreen,
  Notifications: NotificationsScreen,
  HomeTab: UnifiedDashboardScreen,
  ProfileTab: ProfileScreen,
  Profile: ProfileScreen,
  AttendanceTab: MonthlyCalendarScreen,
  PunchTab: GeofencePunchScreen,
  SalaryTab: SalarySlipScreen,

  // Role Dashboards (Mapped cleanly to UnifiedDashboardScreen driven by live SQL permissions)
  StaffDashboard: UnifiedDashboardScreen,
  SupervisorDashboard: UnifiedDashboardScreen,
  HousekeepingDashboard: UnifiedDashboardScreen,
  GeofencePunch: GeofencePunchScreen,
  MonthlyCalendar: MonthlyCalendarScreen,
  AadhaarUpload: AadhaarUploadScreen,
  PanUpload: PanUploadScreen,
  PoliceVerification: PoliceVerificationScreen,
  JoiningDossier: JoiningDossierScreen,
  DocumentStatus: DocumentStatusScreen,
  LeaveApply: LeaveApplyScreen,
  LeaveApproval: LeaveApprovalScreen,
  PettyCash: PettyCashScreen,
  SalarySlip: SalarySlipScreen,

  // Supervisor
  MusterRoll: MusterRollScreen,
  GroomingChecklist: GroomingChecklistScreen,
  SiteAudit: SiteAuditScreen,
  ServiceQualityRating: ServiceQualityRatingScreen,
  FireExtinguisher: FireExtinguisherScreen,
  EmergencyDirectory: EmergencyDirectoryScreen,
  SpotRecruitment: SpotRecruitmentScreen,
  TravelExpense: TravelExpenseScreen,

  // Housekeeping
  MaterialCheck: MaterialCheckScreen,
  WorkProofPhotos: WorkProofPhotosScreen,
  WorkingImageProof: WorkProofPhotosScreen,
  HKLeaveApply: HKLeaveApplyScreen,

  Splash: SplashScreen,
};

export const registerScreen = (name: string, component: ScreenRenderer) => {
  SCREEN_COMPONENTS[name] = component;
};

const TAB_SCREEN_NAMES = [
  'HomeTab',
  'AttendanceTab',
  'PunchTab',
  'SalaryTab',
  'ProfileTab',
  'CompaniesTab',
];

const NavigationRouter: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const { isAuthenticated, currentUser, restoreSession, isRestoring } = useAuthStore();
  const { currentRoute, history } = useNavigationState();
  const { reset, goBack } = useNavigation();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const dashboardRoute = currentUser?.role === 'SUPER_ADMIN'
    ? 'SuperAdminDashboard'
    : 'UnifiedDashboard';

  const lastBackPressRef = useRef<number>(0);

  // Hardware Android Back button handler
  useEffect(() => {
    const onBackPress = () => {
      // If user is on dashboard or login, allow default (exit app) only on 2nd tap
      const current = currentRoute.name;
      const isRootScreen =
        current === 'SuperAdminDashboard' ||
        current === 'UnifiedDashboard' ||
        current === 'StaffDashboard' ||
        current === 'SupervisorDashboard' ||
        current === 'HousekeepingDashboard' ||
        current === 'Login';

      if (isRootScreen) {
        if (current === 'Login') {
          return false; // let Android OS exit from login screen directly
        }
        const now = Date.now();
        if (now - lastBackPressRef.current < 2000) {
          return false; // exit app on confirmed 2nd back tap
        }
        lastBackPressRef.current = now;
        showToast({
          type: 'info',
          title: 'Exit App',
          message: 'Press back again to exit',
        });
        return true; // prevent accidental app exit
      }

      // If there is history, navigate back; otherwise go to appropriate dashboard
      if (history.length > 1) {
        goBack();
      } else {
        reset(dashboardRoute as any);
      }
      return true; // prevent app from closing
    };

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSubscription.remove();
  }, [currentRoute.name, history.length, dashboardRoute, goBack, reset]);

  // Show animated splash screen on app launch/reopen while restoring session
  if (showSplash || isRestoring) {
    return (
      <SplashScreen
        minDuration={600}
        onFinish={() => {
          setShowSplash(false);
          const auth = useAuthStore.getState();
          if (auth.isAuthenticated) {
            const u = auth.currentUser;
            if (u?.role === 'SUPER_ADMIN') {
              reset('SuperAdminDashboard');
            } else {
              reset('UnifiedDashboard');
            }
          }
        }}
      />
    );
  }

  // If not authenticated, ensure we show Login or ForgotPassword
  if (!isAuthenticated) {
    if (currentRoute.name === 'ForgotPassword') {
      return <ForgotPasswordScreen />;
    }
    return <LoginScreen />;
  }

  // Route resolution based on role
  let targetScreenName = currentRoute.name;

  if (currentUser?.role === 'SUPER_ADMIN' && (currentRoute.name === 'Login' || currentRoute.name === 'CompaniesTab' || currentRoute.name === 'HomeTab')) {
    targetScreenName = 'SuperAdminDashboard';
  } else if (currentUser?.role !== 'SUPER_ADMIN' && (currentRoute.name === 'Login' || currentRoute.name === 'CompaniesTab' || currentRoute.name === 'HomeTab')) {
    targetScreenName = 'UnifiedDashboard';
  }

  // Active Screen Component
  const ActiveScreen =
    SCREEN_COMPONENTS[targetScreenName] ||
    SCREEN_COMPONENTS.HomeTab ||
    SCREEN_COMPONENTS.CompanyList ||
    LoginScreen;

  const isTabScreen = TAB_SCREEN_NAMES.includes(targetScreenName);

  return (
    <View style={styles.container}>
      <View style={styles.screenContainer}>
        <ActiveScreen />
      </View>

      {/* Render Dynamic Bottom Tabs on main dashboard tabs */}
      {isTabScreen && <DynamicBottomTabs />}
    </View>
  );
};

export const RootNavigator: React.FC = () => {
  return (
    <NavigationProvider initialRoute={{ name: 'Login' }}>
      <NavigationRouter />
    </NavigationProvider>
  );
};
