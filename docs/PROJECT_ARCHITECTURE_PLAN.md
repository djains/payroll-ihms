# IHMS-R Mobile Architecture & Implementation Plan
## Multi-Company Workforce Management & Role-Based Control Platform
### (100% Cross-Platform: iOS & Android Compatible with Zustand State Management)

---

## 1. Executive Summary

This plan outlines the complete rewrite of **IHMS-R** (originally an Android Java application: `com.celtsoft_bjh.bjhpayroll`) into a modern, cross-platform **React Native** application targeting both **iOS and Android**.

### Key Architectural Highlights
- **Single Unified Login Screen**: Auto-resolves user identity, role, and company.
- **Super Admin Master Control**: Complete administrative control to create any company, assign roles, and toggle any of the 28 core features from the original PDF on/off per company.
- **Frontend-First Mock Architecture**: Built with a complete mock state engine (preparing for future Python + SQL backend integration). Super Admin can toggle features, add companies, and switch roles live on the device.
- **State Management with Zustand**: Ultra-lightweight, zero-boilerplate state management with MMKV persistence for companies, feature switches, offline queues, and session states.
- **Role-Dedicated Screen Architecture**: Distinct folders for each role (`superadmin`, `staff`, `supervisor`, `housekeeping`, `manager`, `vin_agent`).
- **Zero-SQLite Modern Storage**: Employs **`react-native-keychain`** for hardware-encrypted security (passwords, tokens, device ID) and **`react-native-mmkv`** for high-speed offline caching (punch queues, multilingual strings, and drafts).
- **Design System Standards**: Strict separation of Screen (`.tsx`) and Style (`.styles.ts`) files, global theme tokens, responsive scaling (`ms`, `vs`, `s`, `wp`, `hp`), and a centralized icon system.

---

## 2. Authentication & Auto-Resolution Engine

The mobile application features a single login interface. Upon submitting credentials, the system authenticates the user and returns their authorization envelope:

```
                          [ 🔑 USER ENTERS CREDENTIALS ]
                                        │
                                        ▼
                            POST /api/v1/auth/login
                                        │
                     ┌──────────────────┴──────────────────┐
                     │  Who is authenticating?             │
                     ▼                                     ▼
        [ Role === 'SUPER_ADMIN' ]              [ Regular Company User ]
                     │                                     │
                     │                                     ▼
                     │                       1. Resolve `company_id` (e.g. Company B)
                     │                       2. Verify Company Status (`active`)
                     │                       3. Fetch Company's Enabled Features
                     │                       4. Resolve Role (e.g. Supervisor)
                     │                       5. Intersect Role Permissions with
                     │                          Company Enabled Features
                     │                                     │
                     ▼                                     ▼
      ┌─────────────────────────────┐       ┌─────────────────────────────┐
      │  SUPER ADMIN MASTER CONSOLE │       │ DYNAMIC COMPANY DASHBOARD   │
      │ • View & Add Companies      │       │ • Loads Company Logo/Theme  │
      │ • Toggle any of 28 features │       │ • Configures Bottom Tabs    │
      │   on/off per company        │       │ • Renders ONLY authorized   │
      │ • View all data & audits    │       │   feature cards for that    │
      │ • Impersonate/test any role │       │   role in Company B         │
      └─────────────────────────────┘       └─────────────────────────────┘
```

---

## 3. Zustand Global State Architecture (`src/store/`)

Instead of bloated context providers, the app leverages **Zustand** stores with MMKV persistent storage:

| Zustand Store | File Path | State & Responsibilities |
| :--- | :--- | :--- |
| **`authStore`** | `src/store/authStore.ts` | • Current logged-in user (ID, Name, EmpCode, Role)<br>• Active JWT Token (persisted in Keychain)<br>• Login, Logout, and ForgotPassword actions |
| **`tenantStore`** | `src/store/tenantStore.ts` | • Active company details (ID, Name, Logo, Brand colors)<br>• List of enabled features for the current user's role<br>• Dynamic Bottom Tab bar configuration |
| **`superAdminStore`** | `src/store/superAdminStore.ts` | • Master companies list (add/edit/delete companies)<br>• Live feature toggle switchboard (28 PDF features)<br>• Role permissions matrix per company<br>• Impersonation / View-As mode switcher |
| **`offlineQueueStore`** | `src/store/offlineQueueStore.ts` | • Queue of offline attendance punches waiting for internet<br>• Queue of offline supervisor travel and petty cash claims<br>• Network status listener & auto-flush actions |

---

## 4. Master Feature Catalog (All 28 Features from PDF)

All features from the original 35-page PDF specification are modularized into controllable feature flags:

### Module 1: Core Authentication & Device Security
- `FT_DEVICE_BINDING`: Unique hardware ID binding (iOS IDFV stored in Keychain / Android Hardware ID).
- `FT_MULTI_LANGUAGE`: Trilingual offline UI support (English, Hindi, Marathi) stored in local MMKV cache.
- `FT_PASSWORD_RECOVERY`: 3-point credential recovery (Employee Code + Date of Birth + Aadhaar Number).

### Module 2: Geofence Attendance & Facial Verification
- `FT_GEO_PUNCH`: Geofenced punch IN/OUT with interactive Map ($\le 100\text{ m}$ threshold calculation via Haversine formula).
- `FT_FACE_VERIFICATION`: Live front-camera human facial detection before allowing a punch.
- `FT_CANVAS_WATERMARK`: Real-time timestamp, latitude, and longitude canvas overlay stamped directly onto selfie photos.
- `FT_OFFLINE_PUNCH_SYNC`: Queues attendance punches when offline in MMKV; auto-syncs on reconnect.
- `FT_BREADCRUMB_TRACKING`: Background periodic GPS breadcrumb pings (CoreLocation on iOS, Foreground Service on Android).

### Module 3: Attendance Calendar & Payroll Slips
- `FT_ATTENDANCE_CALENDAR`: Interactive monthly calendar with 4-color status codes:
  - 🟢 **Present** (Green)
  - 🔴 **Absent** (Red)
  - 🟡 **Leave** (Yellow)
  - 🔵 **Weekly Off** (Blue)
- `FT_ATTENDANCE_METRICS`: Monthly metrics summary: Present days, Overtime hours, Loss of Pay (LOP), and Approved leave balances.
- `FT_SALARY_SLIP_PDF`: Month and Year picker dialog; fetches salary breakdown, renders in-app PDF, and allows download.
- `FT_PROFILE_DOCS_DOWNLOAD`: Digital Employee ID Card and Official Joining Letter PDF downloads (`VinEmployeeProfile`).

### Module 4: KYC & Document Compliance
- `FT_AADHAAR_QR_SCAN`: Integrated QR scanner; parses UIDAI XML to extract UID, Name, Gender, DOB, Village, District, State, and Pincode.
- `FT_PAN_VERIFICATION`: 10-digit PAN format validation with automated regex matching and photo upload.
- `FT_POLICE_VERIFICATION`: Police clearance certificate upload, token number entry, and expiration date tracking (`GetPoliceValidDate`).
- `FT_7_STAGE_JOINING_DOSSIER`: 7 mandatory document uploads:
  1. Passport size photo
  2. Aadhaar card
  3. PAN card
  4. Bank passbook / cancelled cheque
  5. Permanent address proof
  6. Educational marksheet / certificate
  7. Police clearance certificate
- `FT_DOC_APPROVAL_STATUS`: Real-time lifecycle badges (`Pending`, `Approved`, `Rejected`) with administrative rejection feedback notes.

### Module 5: Leave Management & Claims
- `FT_GENERAL_LEAVE`: Leave application with type selection (Casual, Sick, Paid), reporting officer display, balance counters, and date pickers.
- `FT_PETTY_CASH`: Daily operational expense claim with merchant name, item description, amount in ₹, and receipt camera scan.
- `FT_TRAVEL_CLAIMS`: Supervisor travel claims (Date, origin, destination, mode: Bus/Train/Auto/Flight, fare, and ticket upload).
- `FT_MISC_CLAIMS`: Operational reimbursement claims (Food, Stay, Conveyance, Accommodation) with bill receipt attachment.

### Module 6: Supervisor Field Operations (Security Module)
- `FT_GUARD_MUSTER_ROLL`: Unit guard shift muster roll with client and unit selectors, shift types (Morning, General, Afternoon, Evening), and guard photos.
- `FT_REPLACEMENT_GUARD`: On-spot reliever / replacement guard allocation when assigned guard is absent.
- `FT_GROOMING_10_POINT`: Mandatory 10-point checklist before shift authorization:
  1. Punctual arrival | 2. Full clean uniform | 3. Company cap | 4. Polished black shoes | 5. Uniform belt
  6. Displayed ID card | 7. Clean shaved | 8. Proper haircut | 9. Trimmed nails | 10. Shift briefing completed
- `FT_SITE_VISIT_AUDIT`: Client, unit, and security grade audit with 6 compliance Yes/No questions and 6 individual watermarked photo proofs.
- `FT_SERVICE_QUALITY_RATING`: 10-point scorecard rated 1 to 5 stars across categories with client signature capture and feedback remarks.
- `FT_WORKING_IMAGE_PROOF`: Task category selection (Gate Duty, Sanitization, Night Patrolling) with timestamped work-in-progress photo.
- `FT_FIRE_EXTINGUISHER_AUDIT`: Inspection by type (CO2, Foam, Water, Dry Powder), pressure gauge check, tag validity, and photo proof.
- `FT_EMERGENCY_DIRECTORY`: Directory of client contacts, site emergency numbers, and operations desk.
- `FT_SPOT_RECRUITMENT`: On-field direct hiring form (Client/Unit/Grade, candidate bio, uniform size S–XXL, shoe size 6–11, bank details, and KYC captures).

### Module 7: Housekeeping Operations
- `FT_HK_MATERIAL_CHECK`: Checklist of cleaning chemicals, mop buckets, vacuum machinery, consumable stock levels, and depleted stock requests.
- `FT_HK_BEFORE_AFTER_PHOTOS`: Task picker (Washroom Cleaning, Floor Scrubbing, Waste Disposal, Glass Cleaning) with before-and-after photos.
- `FT_HK_DEDICATED_LEAVE`: Streamlined leave application routed directly to the HK Facility Supervisor.

### Module 8: Relationship / Cluster Manager (RM / CM Module)
- `FT_ONBOARDING_LINK_SMS_WA`: Generates and dispatches digital self-onboarding link via SMS / WhatsApp with designation & level selectors.
- `FT_DIRECT_36_FIELD_FORM`: 36-field comprehensive onboarding form inserting directly into payroll (Personal, nominee, education, addresses with state/city dropdowns, bank, and KYC).
- `FT_RECRUITMENT_PIPELINE`: Summary report tracking links sent, pending candidate submissions, documents under review, and approved joined employees.
- `FT_TEAM_HIERARCHY_VIEW`: Subordinate Cluster Managers list (`GetCMUnderRMList`) and field staff status tracker.

### Module 9: VIN / BAGIC Insurance Agent Module
- `FT_PROSPECT_MEET_LOGGER`: Meeting date/time, visitor type (Dealer, Corporate, Individual), prospect contact details, auto GPS log, and face-verified selfie with client.
- `FT_INSURANCE_BUSINESS_FORM`: Agent code/name selector, product lines (Motor, Health, Other), policy number, coverage, and premium calculation.
- `FT_VEHICLE_DOC_COLLECTION`: Upload module for Vehicle Registration Certificates (RC), previous policy copies, and customer KYC proofs.
- `FT_AGENT_LICENSE_CREATION`: Pipeline tracking for IRDAI examination clearance, agent code generation, and licensing documentation.

---

## 5. Storage & Security Architecture (iOS & Android Parity)

| Storage Layer | Technology | iOS Implementation | Android Implementation | Data Stored |
| :--- | :--- | :--- | :--- | :--- |
| **Hardware-Encrypted Secure Vault** | **`react-native-keychain`** | **Apple Keychain Services** (Secure Enclave) | **Android Keystore Provider** (Hardware TEE) | • JWT Access & Refresh Tokens<br>• User login credentials & PIN<br>• Unique Hardware UUID (persistent in Keychain)<br>• Biometric authentication keys |
| **High-Speed Local Cache** | **`react-native-mmkv`** | MMKV C++ engine on iOS | MMKV C++ engine on Android (NDK) | • Active Company Profile & theme colors<br>• Enabled feature flags & role permissions<br>• Offline punch queue (JSON array)<br>• Multilingual UI strings (EN / HI / MR)<br>• Expense drafts awaiting sync |

---

## 6. Complete Cross-Platform Library Stack (Verified for iOS & Android)

| Category | Recommended Library | iOS Implementation (CocoaPods) | Android Implementation (Gradle) | Features Powered |
| :--- | :--- | :--- | :--- | :--- |
| **Core Framework** | `react-native` (0.74+) | Objective-C / Swift runtime | Java / Kotlin runtime | Base application |
| **State Management** | **`zustand`** | Pure JavaScript runtime | Pure JavaScript runtime | Fast, unopinionated global state management |
| **Navigation** | `@react-navigation/native`<br>`@react-navigation/native-stack`<br>`@react-navigation/bottom-tabs`<br>`react-native-screens`<br>`react-native-safe-area-context` | Native `UINavigationController` & `UITabBarController` | Native Android `Fragment` & Activity transitions | Dynamic Bottom Tabs, Role-based route stacks |
| **Secure Token Storage** | **`react-native-keychain`** | **iOS Keychain Services** | **Android Keystore System** | JWT Tokens, User credentials, Biometric keys |
| **Fast Local Storage** | **`react-native-mmkv`** | C++ core, zero-delay memory mapping | C++ core via Android NDK | Active company data, feature flags, offline JSON queue |
| **Camera & Preview** | **`react-native-vision-camera`** (v4+) | **AVFoundation** Camera engine | **CameraX** Android engine | Selfie capture, document capture, guard inspection |
| **Facial Detection** | **`@react-native-ml-kit/face-detection`** | Google ML Kit iOS CocoaPod | Google Play Services ML Kit | Live face verification on attendance punch & meetings |
| **QR & Barcode Scanner** | **`react-native-vision-camera` (built-in `codeScanner`)** | iOS Native **AVCaptureMetadataOutput** | Android Native Google ML Kit Barcode | Aadhaar QR code scanning & extraction |
| **XML Parser** | **`fast-xml-parser`** | Pure JavaScript / TypeScript | Pure JavaScript / TypeScript | Parses Aadhaar QR XML payload into candidate info |
| **Interactive Maps** | **`react-native-maps`** | Apple Maps (default) or Google Maps via Podfile | Google Maps SDK for Android | Unit geofence circles (<100m) and live user pins |
| **GPS Geolocation** | **`react-native-geolocation-service`** | iOS **CoreLocation** framework | Google Play Location Services API | High-accuracy foreground GPS coordinates |
| **Geofence Math** | **`@turf/distance`** | Pure JavaScript (Haversine math) | Pure JavaScript (Haversine math) | Validates user distance to unit coordinates ($\le 100\text{ m}$) |
| **Canvas Watermarking** | **`react-native-image-marker`** | iOS **CoreGraphics / UIKit** bitmap rendering | Android **Android.graphics.Canvas** | Stamps Date, Time, Latitude & Longitude directly on photos |
| **Digital Signature** | **`react-native-signature-canvas`** | iOS `WKWebView` HTML5 canvas | Android `WebView` HTML5 canvas | Captures client signature for service quality rating |
| **PDF Viewer & Download** | **`react-native-pdf`**<br>`react-native-blob-util` | iOS Native **PDFKit** | Android Native `PdfRenderer` | In-app view & download of Payslips, Join Letters, ID Cards |
| **Internationalization** | **`i18next`**<br>`react-i18next` | Pure JavaScript / TypeScript | Pure JavaScript / TypeScript | Offline English, Hindi, and Marathi translations |
| **Network & Connectivity** | **`axios`**<br>`@react-native-community/netinfo` | iOS **Network.framework** (`NWPathMonitor`) | Android `ConnectivityManager` | REST APIs & network reconnect auto-sync listener |
| **Device Identification** | **`react-native-device-info`** | iOS **IDFV (Identifier for Vendor)** stored securely in Keychain | Android **Hardware ID / Android ID** | Hardware device binding (`GetImeiDevice.java`) |
| **Background GPS** | **`@transistorsoft/react-native-background-geolocation`** | iOS Background Location Updates mode | Android Foreground Location Service with notification | Periodic background GPS breadcrumb logging |
| **Forms & Validation** | **`react-hook-form`**<br>`zod` | Pure JavaScript / TypeScript | Pure JavaScript / TypeScript | 36-field candidate onboarding form, audit validation |
| **Icons & SVGs** | **`react-native-vector-icons`**<br>`react-native-svg` | iOS TTF font bundling & CoreGraphics SVG | Android asset font loader & VectorDrawable | Icons (Feather, MaterialIcons) & vector assets |

---

## 7. Final Comprehensive Project Folder Structure

```text
c:\ng global\IH&MS-M\
├── android/                            # Native Android project (Gradle, Keystore)
├── ios/                                # Native iOS project (CocoaPods, Keychain, Info.plist)
│
└── src/
    │
    ├── theme/                          # 🎨 Global Design System & Responsive Scale
    │   ├── index.ts                    # Unified theme export
    │   ├── colors.ts                   # Enterprise palette + Dynamic Company branding
    │   ├── typography.ts               # Scaled font sizes (xs to xxl) & weights
    │   ├── spacing.ts                  # Scaled margins & paddings
    │   └── responsive.ts               # Responsive scaling utilities (ms, vs, s, wp, hp)
    │
    ├── store/                          # ⚡ Zustand Global Stores (with MMKV Persistence)
    │   ├── authStore.ts                # Session state, login, logout, credentials
    │   ├── tenantStore.ts              # Active company details, theme, and enabled features
    │   ├── superAdminStore.ts          # Companies list, live feature toggles, role permissions
    │   └── offlineQueueStore.ts        # Enqueues & flushes offline punches & claims
    │
    ├── mock/                           # 🧪 Local Mock Data & State (Python/SQL Simulator)
    │   ├── companies.mock.ts           # Mock companies (BJH Security, CleanCare HK, VIN Insurance)
    │   ├── features.mock.ts            # Master catalog of all 28 PDF features & default configs
    │   ├── roles.mock.ts               # Role definitions & default feature bindings
    │   ├── users.mock.ts               # Mock users (Super Admin, Company B Supervisor, Staff, etc.)
    │   ├── attendance.mock.ts          # Mock monthly attendance, geofences & punch records
    │   ├── payroll.mock.ts             # Mock salary slips, join letters & ID cards
    │   ├── audits.mock.ts              # Mock site audits, grooming checklists, extinguishers
    │   └── index.ts
    │
    ├── components/                     # 🧱 Global Reusable UI Atoms (Separate Styles)
    │   ├── common/
    │   │   ├── AppIcon.tsx             # Unified icon wrapper (Feather/Material) with ms() sizing
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
    │   ├── auth/                       # 🔐 Common Authentication Screens
    │   │   ├── SplashScreen.tsx
    │   │   ├── SplashScreen.styles.ts
    │   │   ├── LoginScreen.tsx          # Single unified login (Detects Super Admin / Company / Role)
    │   │   ├── LoginScreen.styles.ts
    │   │   ├── ForgotPasswordScreen.tsx # 3-point reset (Emp Code + DOB + Aadhaar)
    │   │   └── ForgotPasswordScreen.styles.ts
    │   │
    │   ├── common/                     # 🌐 Common Screens (Home, Profile, Notifications)
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

## 8. Next Steps & Development Roadmap

1. **Phase 1: Project Setup & Core Infrastructure**
   - Install cross-platform dependencies (`zustand`, navigation, keychain, mmkv, vector icons, safe area).
   - Configure iOS CocoaPods (`cd ios && pod install`) and Android Gradle.
   - Set up `src/theme/` (colors, typography, spacing, responsive `ms`/`wp`/`hp`).
   - Build `AppIcon` and core UI component primitives (`AppButton`, `AppTextInput`, `AppCard`, `SwitchRow`).
2. **Phase 2: Zustand Stores & Mock Data Engine**
   - Implement `authStore.ts`, `tenantStore.ts`, and `superAdminStore.ts`.
   - Populate `src/mock/` with companies, all 28 features, role permissions, and mock users.
   - Verify Super Admin feature toggling in frontend state.
3. **Phase 3: Dynamic Navigation & Authentication**
   - Implement single login screen (`LoginScreen.tsx` & `LoginScreen.styles.ts`).
   - Build dynamic Bottom Tab navigator based on active company role permissions.
   - Build dynamic Home Screen feature card grid based on `enabled_features`.
4. **Phase 4: Role Modules Implementation**
   - Staff module (Geo-punch, Calendar, KYC, Dossier, Salary slip).
   - Supervisor module (Muster roll, 10-point grooming, Site audit, Quality score, Fire extinguisher, Spot hiring).
   - Housekeeping module (Material check, Work proof photos, HK leave).
   - Manager module (Onboarding link, 36-field form, Pipeline).
   - VIN Agent module (Prospect meet, Business entry, Document collection).
