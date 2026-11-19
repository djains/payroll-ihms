# IHMS-M Mobile App API Integration & Gap Analysis Report

> **Location:** `C:\ng global\IHMS-M\docs\API_INTEGRATION_STATUS.md`  
> **Status Date:** October 2026  
> **Target Database:** MySQL `ihms_18_02_2026` via Django 5.1.4 Backend

---

## 🟢 Part 1: Working APIs (Already Integrated in React Native)

The following APIs exist in the backend and are now wired into the mobile application (`src/services/`):

| # | Mobile Feature / Action | Integrated API Endpoint | Method | Backend App & File | Data Stored In MySQL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **User Login & Session** | `/api/auth/login/` | `POST` | `apps.accounts.views` | Validates user in `accounts_user`, creates Django session in `django_session` |
| 2 | **CSRF Security Token** | `/api/auth/csrf/` | `GET` | `apps.accounts.views` | Issues security token for authenticated state changes |
| 3 | **Current Profile & Role Scope** | `/api/auth/me/` | `GET` | `apps.accounts.views` | Resolves active permissions, role, and company scope |
| 4 | **User Logout** | `/api/auth/logout/` | `POST` | `apps.accounts.views` | Flushes session record from `django_session` |
| 5 | **Leave Application** | `/api/leave/applications/` | `POST` | `apps.leave.leave_apply` | Inserts new leave into `leave_transaction` |
| 6 | **Leave History & Balances** | `/api/leave/applications/` | `GET` | `apps.leave.leave_apply` | Reads approved/pending records from `leave_transaction` |
| 7 | **Petty Cash Claim & Receipt** | `/api/transactions/petty-cash-android/submit/` | `POST` | `apps.transactions.petty_cash_android` | Saves expense claim into `petty_cash` with receipt |
| 8 | **Petty Cash Requests Review** | `/api/transactions/petty-cash-android/requests/` | `GET` | `apps.transactions.petty_cash_android` | Fetches status from `petty_cash` table |
| 9 | **Aadhaar / PAN / Bank KYC** | `/api/hr/employee-kyc/` | `POST` | `apps.employees.kyc` | Encrypts at rest (Fernet + blind hash) into `hr_employee_kyc` |
| 10 | **Dossier & Police Verification** | `/api/hr/android-documents/` | `POST` | `apps.employees.crud` | Saves uploaded documents into `pay_document_verification` |
| 11 | **Document Verification Status** | `/api/hr/android-documents/` | `GET` | `apps.employees.crud` | Retrieves approval lifecycle from `pay_document_verification` |
| 12 | **Monthly Salary Slip PDF** | `/api/payroll/emp-salary-slip/pdf/` | `GET` | `apps.payroll.payslip` | Generates ReportLab PDF computed from attendance muster |
| 13 | **Guard Shift Bulk Attendance** | `/api/attendance/bulk-attendance/` | `POST` | `apps.attendance.muster_write` | Writes guard statuses and relievers into `attendance_muster` |
| 14 | **Shift Muster Roll Sheet** | `/api/attendance/muster-sheet/` | `GET` | `apps.attendance.muster_sheet` | Reads monthly unit shift muster from `attendance_muster` |
| 15 | **Site Visit Audit (6 Qs + 6 Proofs)** | `/api/masters/site-audits/` | `POST` | `apps.masters.site_audit_detail` | Inserts inspection into `pay_site_audit` |
| 16 | **Service Quality Rating (10-Criteria)** | `/api/masters/site-audit-detail/` | `POST` | `apps.masters.site_audit_detail` | Records scorecard and client signature into `pay_service_rating` |
| 17 | **Working Duty Photos** | `/api/hr/working-images/` | `POST` | `apps.employees.working_image` | Inserts patrolling/cleaning proof into `pay_android_working_image` |
| 18 | **Direct Spot Hiring** | `/api/hr/recruitments/` | `POST` | `apps.employees.recruitment` | Saves field candidate details into `pay_new_employee_requirement` |
| 19 | **Supervisor Travel Expense Plan** | `/api/transactions/travel-plans/` | `POST` | `apps.transactions.travel_plan` | Stores travel itinerary into `transactions_travelplan` |
| 20 | **Send Onboarding Link (SMS/WA)** | `/api/hr/resource-recruitment/send_link/` | `POST` | `apps.employees.resource_recruitment` | Records token & sends link via `pay_rm_emp_details` |
| 21 | **RM Recruitment Pipeline Stats** | `/api/hr/resource-recruitment/summary/` | `GET` | `apps.employees.resource_recruitment` | Aggregates candidate counts from `pay_rm_emp_details` |
| 22 | **Team Hierarchy (CMs under RM)** | `/api/hr/resource-recruitment/cm_under_rm/` | `GET` | `apps.employees.resource_recruitment` | Hierarchical subordinate list from `pay_rm_emp_details` |
| 23 | **Company Master List & Create** | `/api/masters/companies/` | `GET`, `POST` | `apps.masters.crud` | Reads/writes master companies in `master_company` |
| 24 | **Roles & Menu Permissions** | `/api/accounts/roles/` & `/api/menu/` | `GET`, `PUT` | `apps.accounts.crud` | Controls dynamic bottom tabs and role privileges |

---

## 🟡 Part 2: New Backend APIs Needed for Future Sprints

The following mobile app screens currently use offline-first stores or mock fallback engines and will need dedicated new endpoints added to the Django backend in a future sprint:

| # | Mobile Screen & Feature Flag | Missing / Needed Backend Endpoint | Proposed Method | Description & Database Action Required |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Geofence Punch IN/OUT**<br>`FT_GEO_PUNCH`<br>`FT_FACE_VERIFICATION` | `/api/attendance/android-logs/punch/` | `POST` | Dedicated write action on `pay_android_attendance_logs` table (currently `AndroidAttendanceLogViewSet` is read-only). Accepts GPS coordinates, selfie photo, distance, and geofence verification flag. |
| 2 | **3-Point Credential Recovery**<br>`FT_PASSWORD_RECOVERY` | `/api/auth/password/recover-3point/` | `POST` | Verify candidate using 3 identity factors: Employee Code + Date of Birth + Aadhaar Number (matching `pay_employee_master` / `hr_employee_kyc`) before generating a reset token. |
| 3 | **Grooming Inspection Checklist**<br>`FT_GROOMING_10_POINT` | `/api/attendance/grooming-check/` | `POST` | Dedicated inspection table for the 10-point daily pre-shift uniform and grooming checklist before authorizing duty. |
| 4 | **Housekeeping Material Stock Count**<br>`FT_HK_MATERIAL_CHECK` | `/api/masters/consumables/stock-audit/` | `POST` | Periodic on-site chemical and vacuum machine count submission by the HK supervisor. |
| 5 | **VIN Insurance Policy Entry**<br>`FT_INSURANCE_BUSINESS_FORM` | `/api/transactions/insurance-policies/` | `POST` | Capture policy details (Motor, Health, Fire), premium calculation, and policy PDF attachment for VIN / BAGIC agents. |
| 6 | **Vehicle RC & Doc Collection**<br>`FT_VEHICLE_DOC_COLLECTION` | `/api/transactions/insurance-documents/` | `POST` | Dedicated endpoint for uploading customer Vehicle RC book, previous policy copy, and vehicle inspection photos. |
| 7 | **Emergency Directory Master**<br>`FT_EMERGENCY_DIRECTORY` | `/api/masters/emergency-contacts/` | `GET` | Return site emergency phone numbers (Fire, Police, Ambulance, Unit Officer) dynamically per unit. |

---

## 🏗️ Architecture Summary

```
   [ React Native Mobile App (c:\ng global\IHMS-M) ]
                           │
       Native fetch via src/services/apiClient.ts
         (Session Cookies + CSRF Token + JSON/FormData)
                           │
                           ▼
          [ Django REST Framework Backend ]
              (http://127.0.0.1:8000/api/)
                           │
       Reads & writes via Django Models & Raw SQL
                           │
                           ▼
     [ Local MySQL Database: ihms_18_02_2026 ]
                 (441 Tables Populated)
```

