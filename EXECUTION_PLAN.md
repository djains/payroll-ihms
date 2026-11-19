# IHMS-R Implementation & Execution Plan
## Step-by-Step Roadmap with Final Folder Structure & Zustand Mock Architecture

---

## 1. Final Project Folder Structure

```text
c:\ng global\IH&MS-M\
├── android/                            # Native Android project (Gradle, Keystore)
├── ios/                                # Native iOS project (CocoaPods, Keychain)
│
└── src/
    │
    ├── theme/                          # 🎨 Global Design System & Responsive Scale
    │   ├── index.ts                    # Unified theme export
    │   ├── colors.ts                   # Enterprise palette + Dynamic Company branding
    │   ├── typography.ts               # Scaled font sizes (xs to xxl) & font weights
    │   ├── spacing.ts                  # Scaled margin & padding tokens
    │   └── responsive.ts               # Scaling utilities (ms, vs, s, wp, hp)
    │
    ├── store/                          # ⚡ Zustand State Management
    │   ├── authStore.ts                # User session, login, logout, credentials
    │   ├── tenantStore.ts              # Active company profile, theme colors & enabled features
    │   ├── superAdminStore.ts          # Company list, live 28-feature toggles, role permissions
    │   └── offlineQueueStore.ts        # Enqueues & flushes offline punches & expense claims
    │
    ├── mock/                           # 🧪 Local Mock Data (Python/SQL Simulator)
    │   ├── companies.mock.ts           # Mock companies (BJH Security, CleanCare HK, VIN Insurance)
    │   ├── features.mock.ts            # Master catalog of all 28 PDF features
    │   ├── roles.mock.ts               # Role definitions & default feature bindings
    │   ├── users.mock.ts               # Mock users (Super Admin, Supervisor, Staff, HK, RM)
    │   ├── attendance.mock.ts          # Mock monthly attendance, geofences & punch records
    │   ├── payroll.mock.ts             # Mock salary slips, join letters & ID cards
    │   ├── audits.mock.ts              # Mock site audits, grooming checklists, extinguishers
    │   └── index.ts
    │
    ├── components/                     # 🧱 Reusable UI Atoms (Separate .styles.ts)
    │   ├── common/
    │   │   ├── AppIcon.tsx             # Unified icon wrapper (Feather/Material) with ms()
    │   │   ├── AppButton.tsx           # Primary, secondary, outline, danger buttons
    │   │   ├── AppButton.styles.ts
    │   │   ├── AppTextInput.tsx        # Text field with label, error text, icon adornments
    │   │   ├── AppTextInput.styles.ts
    │   │   ├── AppCard.tsx             # Surface card with elevation & borders
    │   │   ├── AppCard.styles.ts
    │   │   ├── AppHeader.tsx           # Standard top app bar with back navigation & actions
    │   │   ├── AppHeader.styles.ts
    │   │   ├── AppScreenContainer.tsx  # SafeArea + KeyboardAvoiding container
    │   │   ├── AppScreenContainer.styles.ts
    │   │   ├── StatusBadge.tsx         # Pill badge (Pending, Approved, Rejected, Present)
    │   │   ├── StatusBadge.styles.ts
    │   │   ├── SwitchRow.tsx           # Toggle switch row for Super Admin feature control
    │   │   └── SwitchRow.styles.ts
    │   │
    │   └── shared/                     # Shared composite cards across roles
    │       ├── EmployeeIdentityCard.tsx # Header profile card (Photo, Name, Role, Branch)
    │       ├── EmployeeIdentityCard.styles.ts
    │       ├── GeoQuickStatusCard.tsx  # GPS Status & quick punch button
    │       ├── GeoQuickStatusCard.styles.ts
    │       ├── DynamicFeatureGrid.tsx  # Grid that renders only allowed cards
    │       ├── DynamicFeatureGrid.styles.ts
    │       ├── FeatureCardItem.tsx     # Single clickable feature card
    │       └── FeatureCardItem.styles.ts
    │
    ├── navigation/                     # 🧭 Navigation Engine
    │   ├── RootNavigator.tsx           # Checks authStore -> routes to Auth, SuperAdmin, or App
    │   ├── AuthNavigator.tsx           # Login, Forgot Password, Splash
    │   ├── SuperAdminNavigator.tsx     # Stack for Super Admin company & feature switchboard
    │   ├── DynamicBottomTabs.tsx       # Bottom bar dynamically rendering role-permitted tabs
    │   └── types.ts                    # Navigation route type definitions
    │
    ├── screens/
    │   │
    │   ├── auth/                       # 🔐 Authentication Screens
    │   │   ├── SplashScreen.tsx
    │   │   ├── SplashScreen.styles.ts
    │   │   ├── LoginScreen.tsx          # Single unified login (Detects Super Admin / Company / Role)
    │   │   ├── LoginScreen.styles.ts
    │   │   ├── ForgotPasswordScreen.tsx # 3-point reset (Emp Code + DOB + Aadhaar)
    │   │   └── ForgotPasswordScreen.styles.ts
    │   │
    │   ├── common/                     # 🌐 Common Screens
    │   │   ├── HomeScreen.tsx          # Dynamic role-based dashboard
    │   │   ├── HomeScreen.styles.ts
    │   │   ├── ProfileScreen.tsx       # Personal profile & document download
    │   │   └── ProfileScreen.styles.ts
    │   │
    │   └── roles/                      # 👥 ROLE-BASED DEDICATED FEATURE FOLDERS
    │       │
    │       ├── superadmin/             # 👑 Super Admin Control Center
    │       │   ├── CompanyListScreen.tsx        # View & search all registered companies
    │       │   ├── CompanyListScreen.styles.ts
    │       │   ├── AddCompanyScreen.tsx         # Register new company
    │       │   ├── AddCompanyScreen.styles.ts
    │       │   ├── FeatureSwitchboardScreen.tsx # Live checkboxes to turn all 28 features ON/OFF
    │       │   ├── FeatureSwitchboardScreen.styles.ts
    │       │   ├── RolePermissionsScreen.tsx   # Control tabs & permissions per role
    │       │   ├── RolePermissionsScreen.styles.ts
    │       │   ├── ImpersonateUserScreen.tsx   # "Test View as Company B Supervisor"
    │       │   └── ImpersonateUserScreen.styles.ts
    │       │
    │       ├── staff/                  # 👷 Role 1: General Field Staff
    │       │   ├── GeofencePunchScreen.tsx      # Map + Camera + Facial detection + Watermark
    │       │   ├── GeofencePunchScreen.styles.ts
    │       │   ├── MonthlyCalendarScreen.tsx    # 4-color attendance calendar & metrics
    │       │   ├── MonthlyCalendarScreen.styles.ts
    │       │   ├── AadhaarUploadScreen.tsx      # Manual + Camera + QR extraction
    │       │   ├── AadhaarUploadScreen.styles.ts
    │       │   ├── PanUploadScreen.tsx          # 10-digit PAN validation & photo
    │       │   ├── PanUploadScreen.styles.ts
    │       │   ├── PoliceVerificationScreen.tsx
    │       │   ├── PoliceVerificationScreen.styles.ts
    │       │   ├── JoiningDossierScreen.tsx     # 7-stage document checklist
    │       │   ├── JoiningDossierScreen.styles.ts
    │       │   ├── DocumentStatusScreen.tsx     # Real-time approval/rejection comments
    │       │   ├── DocumentStatusScreen.styles.ts
    │       │   ├── LeaveApplyScreen.tsx         # Casual, Sick, Paid leave
    │       │   ├── LeaveApplyScreen.styles.ts
    │       │   ├── PettyCashScreen.tsx          # Pocket expense claim + receipt photo
    │       │   ├── PettyCashScreen.styles.ts
    │       │   ├── SalarySlipScreen.tsx         # Payslip month picker + PDF viewer
    │       │   └── SalarySlipScreen.styles.ts
    │       │
    │       ├── supervisor/             # 👮 Role 2: Supervisor / Site Officer (SO/JSO)
    │       │   ├── MusterRollScreen.tsx         # Guard shift attendance & replacement guard
    │       │   ├── MusterRollScreen.styles.ts
    │       │   ├── GroomingChecklistScreen.tsx # Strict 10-point inspection before shift
    │       │   ├── GroomingChecklistScreen.styles.ts
    │       │   ├── SiteAuditScreen.tsx          # 6 Yes/No questions + 6 photo proofs
    │       │   ├── SiteAuditScreen.styles.ts
    │       │   ├── ServiceQualityRatingScreen.tsx # 10 criteria (1-5 stars) + client signature
    │       │   ├── ServiceQualityRatingScreen.styles.ts
    │       │   ├── WorkingImageProofScreen.tsx  # Work photo (Gate duty, Patrolling, Sanitization)
    │       │   ├── WorkingImageProofScreen.styles.ts
    │       │   ├── FireExtinguisherScreen.tsx   # CO2/Foam/Water/Dry Powder gauge & tag audit
    │       │   ├── FireExtinguisherScreen.styles.ts
    │       │   ├── EmergencyDirectoryScreen.tsx # Site & client emergency contacts
    │       │   ├── EmergencyDirectoryScreen.styles.ts
    │       │   ├── SpotRecruitmentScreen.tsx    # On-site guard hiring (Sizes, Bank, KYC)
    │       │   ├── SpotRecruitmentScreen.styles.ts
    │       │   ├── TravelExpenseScreen.tsx      # Travel claim (Bus/Train/Flight/Auto) + tickets
    │       │   └── TravelExpenseScreen.styles.ts
    │       │
    │       ├── housekeeping/           # 🧹 Role 3: Housekeeping Staff
    │       │   ├── MaterialCheckScreen.tsx      # Chemicals & vacuum machinery checklist
    │       │   ├── MaterialCheckScreen.styles.ts
    │       │   ├── WorkProofPhotosScreen.tsx    # Before & After timestamped photos
    │       │   ├── WorkProofPhotosScreen.styles.ts
    │       │   ├── HKLeaveApplyScreen.tsx       # Dedicated leave routed to HK Supervisor
    │       │   └── HKLeaveApplyScreen.styles.ts
    │       │
    │       ├── manager/                # 📊 Role 4: Relationship Manager / Cluster Manager (RM/CM)
    │       │   ├── SendOnboardingLinkScreen.tsx # SMS/WhatsApp candidate link generator
    │       │   ├── SendOnboardingLinkScreen.styles.ts
    │       │   ├── Direct36FieldOnboardingScreen.tsx # 36-field comprehensive onboarding form
    │       │   ├── Direct36FieldOnboardingScreen.styles.ts
    │       │   ├── RecruitmentPipelineScreen.tsx # Onboarding pipeline summary report
    │       │   ├── RecruitmentPipelineScreen.styles.ts
    │       │   ├── TeamHierarchyScreen.tsx      # Cluster managers & subordinate staff view
    │       │   └── TeamHierarchyScreen.styles.ts
    │       │
    │       └── vin_agent/              # 🚗 Role 5: VIN / BAGIC Insurance Agent
    │           ├── ProspectMeetScreen.tsx       # Client meet with GPS & selfie verification
    │           ├── ProspectMeetScreen.styles.ts
    │           ├── InsuranceBusinessFormScreen.tsx # Motor/Health policy entry & premium tally
    │           ├── InsuranceBusinessFormScreen.styles.ts
    │           ├── VehicleDocCollectionScreen.tsx  # RC & Policy document uploads
    │           ├── VehicleDocCollectionScreen.styles.ts
    │           ├── AgentLicenseScreen.tsx       # IRDAI exam clearance & licensing
    │           └── AgentLicenseScreen.styles.ts
    │
    ├── services/                       # 🛡️ Secure Hardware Storage & Utilities
    │   ├── keychain.ts                 # iOS Keychain & Android Keystore wrapper
    │   └── storage.ts                  # MMKV fast local storage client
    │
    ├── locales/                        # 🌐 Multilingual UI (EN, HI, MR)
    │   ├── i18n.ts
    │   ├── en.json
    │   ├── hi.json
    │   └── mr.json
    │
    └── utils/                          # 🧰 Helper Utilities
        ├── geofence.ts                 # Haversine distance calculator (<100m check)
        ├── permissions.ts              # canAccessFeature('FEATURE_KEY') checker
        ├── watermark.ts                # Stamp Lat, Lon & DateTime onto photos
        ├── xmlParser.ts                # Aadhaar QR XML parser
        └── offlineQueue.ts             # MMKV queue manager for offline sync
```

---

## 2. Line-by-Line Execution Steps

### Step 1: Core Dependencies Installation
- Install `zustand` for state management.
- Install `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`, `react-native-screens`.
- Verify TypeScript configurations.

### Step 2: Design System & Responsive Scale Setup
- Create `src/theme/responsive.ts` (`wp`, `hp`, `s`, `vs`, `ms`).
- Create `src/theme/colors.ts` (Dark slate enterprise palette + dynamic company primary/accent colors).
- Create `src/theme/typography.ts` (Font size scale `xs` to `xxl` and weights).
- Create `src/theme/spacing.ts` (Standard margins & paddings).
- Create `src/theme/index.ts` (Unified export).

### Step 3: Reusable UI Component Primitives
- Create `src/components/common/AppIcon.tsx` (Vector icon wrapper with `ms` sizing).
- Create `src/components/common/AppButton.tsx` and `AppButton.styles.ts`.
- Create `src/components/common/AppTextInput.tsx` and `AppTextInput.styles.ts`.
- Create `src/components/common/AppCard.tsx` and `AppCard.styles.ts`.
- Create `src/components/common/AppHeader.tsx` and `AppHeader.styles.ts`.
- Create `src/components/common/AppScreenContainer.tsx` and `AppScreenContainer.styles.ts`.
- Create `src/components/common/StatusBadge.tsx` and `StatusBadge.styles.ts`.
- Create `src/components/common/SwitchRow.tsx` and `SwitchRow.styles.ts`.

### Step 4: Mock Data Engine (Python / SQL Simulator)
- Create `src/mock/features.mock.ts` with all 28 feature definitions from the PDF.
- Create `src/mock/companies.mock.ts` with initial mock companies:
  - `BJH Security Services Ltd` (Security Agency)
  - `CleanCare Facility Care` (Housekeeping Company)
  - `Metro Shield Insurance` (VIN / BAGIC Agency)
- Create `src/mock/roles.mock.ts` with standard roles (`SUPER_ADMIN`, `SUPERVISOR`, `STAFF`, `HOUSEKEEPING`, `RM_MANAGER`, `VIN_AGENT`).
- Create `src/mock/users.mock.ts` with demo login accounts for each persona.
- Create `src/mock/attendance.mock.ts`, `payroll.mock.ts`, `audits.mock.ts`.

### Step 5: Zustand State Stores
- Create `src/store/authStore.ts` (Session, login, logout, quick demo switcher).
- Create `src/store/tenantStore.ts` (Current active company, brand colors, enabled features).
- Create `src/store/superAdminStore.ts` (Add company, live toggle 28 features, save to state).
- Create `src/store/offlineQueueStore.ts` (Offline punch queue simulator).

### Step 6: Navigation Architecture
- Create `src/navigation/types.ts` with route parameters.
- Create `src/navigation/AuthNavigator.tsx`.
- Create `src/navigation/SuperAdminNavigator.tsx`.
- Create `src/navigation/DynamicBottomTabs.tsx` (Renders tabs conditionally based on user role and company features).
- Create `src/navigation/RootNavigator.tsx` (Routes to Auth, SuperAdmin, or Company App based on `authStore`).

### Step 7: Authentication Screens
- Create `src/screens/auth/SplashScreen.tsx` & `.styles.ts`.
- Create `src/screens/auth/LoginScreen.tsx` & `.styles.ts` (Includes single login input + **Quick Demo Account Switcher** for testing Super Admin, Company B Supervisor, Staff, HK).
- Create `src/screens/auth/ForgotPasswordScreen.tsx` & `.styles.ts` (3-point reset: EmpCode + DOB + Aadhaar).

### Step 8: Super Admin Master Console Screens
- Create `src/screens/roles/superadmin/CompanyListScreen.tsx` & `.styles.ts`.
- Create `src/screens/roles/superadmin/AddCompanyScreen.tsx` & `.styles.ts` (Create company with name, code, brand color).
- Create `src/screens/roles/superadmin/FeatureSwitchboardScreen.tsx` & `.styles.ts` (Interactive switches for all 28 features; updates Zustand live).
- Create `src/screens/roles/superadmin/RolePermissionsScreen.tsx` & `.styles.ts`.
- Create `src/screens/roles/superadmin/ImpersonateUserScreen.tsx` & `.styles.ts` ("View as Company B Supervisor").

### Step 9: Dynamic Role Dashboard
- Create `src/components/shared/EmployeeIdentityCard.tsx` & `.styles.ts`.
- Create `src/components/shared/GeoQuickStatusCard.tsx` & `.styles.ts`.
- Create `src/components/shared/DynamicFeatureGrid.tsx` & `.styles.ts`.
- Create `src/components/shared/FeatureCardItem.tsx` & `.styles.ts`.
- Create `src/screens/common/HomeScreen.tsx` & `.styles.ts`.
- Create `src/screens/common/ProfileScreen.tsx` & `.styles.ts`.

### Step 10: Role-Dedicated Feature Screens
- Build **Supervisor Module**: `MusterRollScreen`, `GroomingChecklistScreen` (10-point checklist), `SiteAuditScreen` (6 questions + 6 photos), `ServiceQualityRatingScreen` (1-5 stars + signature), `FireExtinguisherScreen`, `SpotRecruitmentScreen`, `TravelExpenseScreen`.
- Build **Staff Module**: `GeofencePunchScreen` (GPS + Face Preview + Canvas Watermark), `MonthlyCalendarScreen` (4-color status), `AadhaarUploadScreen`, `PanUploadScreen`, `PoliceVerificationScreen`, `JoiningDossierScreen`, `LeaveApplyScreen`, `PettyCashScreen`, `SalarySlipScreen`.
- Build **Housekeeping Module**: `MaterialCheckScreen`, `WorkProofPhotosScreen` (Before/After), `HKLeaveApplyScreen`.
- Build **Manager Module**: `SendOnboardingLinkScreen`, `Direct36FieldOnboardingScreen`, `RecruitmentPipelineScreen`.
- Build **VIN Insurance Module**: `ProspectMeetScreen`, `InsuranceBusinessFormScreen`, `VehicleDocCollectionScreen`.

### Step 11: End-to-End Interactivity & Verification
- Verify that Super Admin can create a new company, toggle features, and save.
- Verify that switching to an employee of that company dynamically changes colors, header, and dashboard feature cards.
- Wire `App.tsx` to `RootNavigator.tsx`.
