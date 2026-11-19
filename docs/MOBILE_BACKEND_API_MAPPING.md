# IHMS-M Mobile App Backend API Mapping & Integration Guide
## Complete Line-by-Line API Specification: Request Body, Payloads & Responses

> **Base URL:** `http://127.0.0.1:8000` (Local) / `http://<server-ip>:8000` (LAN)  
> **Backend Codebase:** `C:\ng global\backend\backend`  
> **Mobile App Codebase:** `C:\ng global\IHMS-M`  
> **Authentication Method:** Session Cookie (`sessionid`) + CSRF (`csrftoken` / `X-CSRFToken`) via `apps.accounts.authentication.CsrfExemptSessionAuthentication`

---

## 📌 Table of Contents
1. [Core Authentication & Session APIs](#1-core-authentication--session-apis)
2. [Super Admin Master Console APIs](#2-super-admin-master-console-apis)
3. [Field Staff / Security Guard APIs](#3-field-staff--security-guard-apis)
4. [Supervisor & Site Officer (SO/JSO) APIs](#4-supervisor--site-officer-sojso-apis)
5. [Housekeeping Operations APIs](#5-housekeeping-operations-apis)
6. [Relationship Manager & Cluster Manager (RM/CM) APIs](#6-relationship-manager--cluster-manager-rmcm-apis)
7. [VIN / Insurance Agent APIs](#7-vin--insurance-agent-apis)

---

## 1. Core Authentication & Session APIs

### 1.1 Obtain Initial CSRF Token
- **Target Screen:** `SplashScreen.tsx` / App Bootstrap
- **Endpoint:** `GET /api/auth/csrf/`
- **Method:** `GET`
- **Headers:**
  ```http
  Accept: application/json
  ```
- **Request Body:** None
- **Response Status:** `200 OK`
- **Response Body:**
  ```json
  {
    "csrfToken": "wXyZ9876543210tokenStringABCDEF123456"
  }
  ```
- **Response Field Breakdown:**
  - `csrfToken` (string): The anti-CSRF token to be included in the `X-CSRFToken` header for all subsequent write operations (`POST`, `PUT`, `PATCH`, `DELETE`).

---

### 1.2 User Login (Unified Credentials Authentication)
- **Target Screen:** `LoginScreen.tsx`
- **Endpoint:** `POST /api/auth/login/`
- **Method:** `POST`
- **Headers:**
  ```http
  Content-Type: application/json
  X-CSRFToken: <csrf_token>
  ```
- **Request Body Fields:**
  | Field | Type | Required | Description | Example |
  | :--- | :--- | :--- | :--- | :--- |
  | `username` | string | Yes | Username, Login ID or Employee Code | `"admin"` or `"I8578"` |
  | `password` | string | Yes | Plaintext Password | `"Password@123"` |

- **Request Body (JSON):**
  ```json
  {
    "username": "admin",
    "password": "Password@123"
  }
  ```
- **Response Status:** `200 OK` (Sets `Set-Cookie: sessionid=...; HttpOnly; SameSite=Lax`)
- **Response Body:**
  ```json
  {
    "username": "admin",
    "legacy_login_id": "admin",
    "is_active": true,
    "is_staff": true,
    "must_change_password": false,
    "role": {
      "id": 1,
      "name": "Super Admin",
      "approval_level": 3
    },
    "scope": {
      "comp_code": "01",
      "client_code": null,
      "unit_code": null
    },
    "permissions": [
      {
        "menu_id": "1",
        "name": "Company Master",
        "permission": "A"
      },
      {
        "menu_id": "4",
        "name": "Attendance Sheet",
        "permission": "A"
      }
    ]
  }
  ```
- **Response Field Breakdown:**
  - `username` (string): The authenticated user identifier.
  - `legacy_login_id` (string): Associated ID in legacy payroll tables.
  - `is_active` (boolean): Account status. If inactive or left (`flag='L'`), returns `403 Forbidden`.
  - `is_staff` (boolean): Administrative privilege flag.
  - `role.id` (number): Assigned role ID.
  - `role.name` (string): Role name (e.g. `"Super Admin"`, `"Supervisor"`, `"Field Staff"`).
  - `role.approval_level` (number): Level 1, 2, or 3 approval authority in multi-tier workflows.
  - `scope.comp_code` (string): Primary tenant company code.
  - `scope.client_code` (string | null): Scoped client if restricted.
  - `scope.unit_code` (string | null): Scoped branch/unit if restricted.
  - `permissions` (array): List of permitted menu modules with access level (`"A"` = Full, `"R"` = Read Only).

---

### 1.3 Validate Session / Get Current User Profile
- **Target Screen:** `SplashScreen.tsx` / `ProfileScreen.tsx`
- **Endpoint:** `GET /api/auth/me/`
- **Method:** `GET`
- **Headers:**
  ```http
  Cookie: sessionid=<active_session_id>
  Accept: application/json
  ```
- **Request Body:** None
- **Response Status:** `200 OK`
- **Response Body:** Same schema as `POST /api/auth/login/`. If session is expired, returns `401 Unauthorized` with `{"detail": "Session expired. Please log in again."}`.

---

### 1.4 User Logout
- **Target Screen:** `ProfileScreen.tsx` (Logout action)
- **Endpoint:** `POST /api/auth/logout/`
- **Method:** `POST`
- **Headers:**
  ```http
  Cookie: sessionid=<active_session_id>
  X-CSRFToken: <csrf_token>
  ```
- **Request Body:** None
- **Response Status:** `204 No Content`

---

### 1.5 3-Point Password Setup & Recovery
- **Target Screen:** `ForgotPasswordScreen.tsx`
- **Endpoint:** `POST /api/auth/password/setup/`
- **Method:** `POST`
- **Headers:**
  ```http
  Content-Type: application/json
  X-CSRFToken: <csrf_token>
  ```
- **Request Body Fields:**
  | Field | Type | Required | Description | Example |
  | :--- | :--- | :--- | :--- | :--- |
  | `token` | string | Yes | 1-time setup or recovery token | `"setup_9a8b7c6d5e4f"` |
  | `new_password` | string | Yes | New password (validated against Argon2) | `"NewSecure@2026"` |

- **Request Body (JSON):**
  ```json
  {
    "token": "setup_9a8b7c6d5e4f",
    "new_password": "NewSecure@2026"
  }
  ```
- **Response Status:** `200 OK`
- **Response Body:**
  ```json
  {
    "status": "Password updated successfully."
  }
  ```

---

## 2. Super Admin Master Console APIs

### 2.1 List All Companies
- **Target Screen:** `CompanyListScreen.tsx`
- **Endpoint:** `GET /api/masters/companies/`
- **Method:** `GET`
- **Headers:**
  ```http
  Cookie: sessionid=<active_session_id>
  Accept: application/json
  ```
- **Request Query Params:**
  | Param | Type | Required | Description | Example |
  | :--- | :--- | :--- | :--- | :--- |
  | `search` | string | No | Search by company code or name | `"BJH"` |
  | `page` | number | No | Page number (default: 1) | `1` |

- **Response Status:** `200 OK`
- **Response Body:**
  ```json
  {
    "count": 2,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 1,
        "comp_code": "01",
        "comp_name": "BJH SECURITY SERVICES PVT LTD",
        "comp_type": "Private Limited",
        "address": "BJH Tower, S.V. Road, Goregaon West",
        "city": "Mumbai",
        "state_name": "MAHARASHTRA",
        "panno": "AAACB1234D",
        "gst_no": "27AAACB1234D1Z5",
        "email": "contact@bjhsecurity.com",
        "tel1": "022-28765432"
      },
      {
        "id": 2,
        "comp_code": "02",
        "comp_name": "CLEANCARE HOUSEKEEPING SOLUTIONS",
        "comp_type": "Private Limited",
        "address": "Sector 18, Vashi",
        "city": "Navi Mumbai",
        "state_name": "MAHARASHTRA",
        "panno": "BBBCB5678E",
        "gst_no": "27BBBCB5678E1Z8",
        "email": "info@cleancare.com",
        "tel1": "022-27891234"
      }
    ]
  }
  ```

---

### 2.2 Add New Company
- **Target Screen:** `AddCompanyScreen.tsx`
- **Endpoint:** `POST /api/masters/companies/`
- **Method:** `POST`
- **Headers:**
  ```http
  Content-Type: application/json
  Cookie: sessionid=<active_session_id>
  X-CSRFToken: <csrf_token>
  ```
- **Request Body Fields:**
  | Field | Type | Required | Description | Example |
  | :--- | :--- | :--- | :--- | :--- |
  | `comp_code` | string | Yes | Unique 2-6 character code | `"C15"` |
  | `comp_name` | string | Yes | Company Legal Name | `"METRO FACILITY SERVICES"` |
  | `comp_type` | string | No | Business structure | `"Private Limited"` |
  | `address` | string | No | Physical Address | `"Unit 402, Trade Center, BKC"` |
  | `city` | string | No | City | `"Mumbai"` |
  | `state_name` | string | No | State | `"MAHARASHTRA"` |
  | `panno` | string | No | 10-digit PAN | `"METRO1234P"` |
  | `gst_no` | string | No | 15-digit GSTIN | `"27METRO1234P1Z3"` |
  | `email` | string | No | Official contact email | `"ops@metroservices.in"` |

- **Request Body (JSON):**
  ```json
  {
    "comp_code": "C15",
    "comp_name": "METRO FACILITY SERVICES",
    "comp_type": "Private Limited",
    "address": "Unit 402, Trade Center, BKC",
    "city": "Mumbai",
    "state_name": "MAHARASHTRA",
    "panno": "METRO1234P",
    "gst_no": "27METRO1234P1Z3",
    "email": "ops@metroservices.in"
  }
  ```
- **Response Status:** `201 Created`
- **Response Body:** Echoes created record with `id: 3`.

---

### 2.3 Feature Switchboard & Role Permissions
- **Target Screen:** `FeatureSwitchboardScreen.tsx` & `RolePermissionsScreen.tsx`
- **Endpoint:** `PUT /api/accounts/roles/{id}/`
- **Method:** `PUT`
- **Headers:**
  ```http
  Content-Type: application/json
  Cookie: sessionid=<active_session_id>
  X-CSRFToken: <csrf_token>
  ```
- **Request Body Fields:**
  | Field | Type | Required | Description | Example |
  | :--- | :--- | :--- | :--- | :--- |
  | `name` | string | Yes | Role Name | `"Supervisor"` |
  | `approval_level`| number | No | Multi-level tier (1, 2, 3) | `2` |
  | `permissions` | array | Yes | Array of menu objects | `[{"menu_id": 4, "permission": "A"}]` |

- **Request Body (JSON):**
  ```json
  {
    "name": "Supervisor",
    "approval_level": 2,
    "permissions": [
      { "menu_id": 4, "permission": "A" },
      { "menu_id": 12, "permission": "A" },
      { "menu_id": 45, "permission": "R" }
    ]
  }
  ```
- **Response Status:** `200 OK`
- **Response Body:** Updated role object with all granted permissions.

---

## 3. Field Staff / Security Guard APIs

### 3.1 Geofence Punch IN / OUT
- **Target Screen:** `GeofencePunchScreen.tsx`
- **Feature Flag:** `FT_GEO_PUNCH`, `FT_FACE_VERIFICATION`, `FT_CANVAS_WATERMARK`
- **Endpoint:** `POST /api/attendance/android-logs/punch/` *(or legacy direct punch)*
- **Method:** `POST`
- **Headers:**
  ```http
  Content-Type: multipart/form-data
  Cookie: sessionid=<active_session_id>
  X-CSRFToken: <csrf_token>
  ```
- **Request Form-Data Fields:**
  | Field | Type | Required | Description | Example |
  | :--- | :--- | :--- | :--- | :--- |
  | `emp_code` | string | Yes | Employee Code | `"I8578"` |
  | `unit_code` | string | Yes | Assigned Unit Code | `"U004"` |
  | `punch_type` | string | Yes | `"IN"` or `"OUT"` | `"IN"` |
  | `date_time` | string | Yes | Timestamp (`YYYY-MM-DD HH:MM:SS`) | `"2026-10-29 09:05:12"` |
  | `emp_latitude` | string | Yes | GPS Latitude coordinate | `"19.1553"` |
  | `emp_longitude`| string | Yes | GPS Longitude coordinate | `"72.8546"` |
  | `unit_latitude`| string | No | Geofence center Latitude | `"19.1550"` |
  | `unit_longitude`| string| No | Geofence center Longitude | `"72.8540"` |
  | `distances` | string | Yes | Calculated distance in meters | `"18m"` |
  | `address` | string | Yes | Branch address or reverse geocode | `"Unit 4, Andheri Hub, Mumbai"` |
  | `camera_image` | file | Yes | Watermarked selfie file (JPEG/PNG) | `selfie_punch.jpg` |
  | `mobile_imei_no`| string| No | Device UUID / Hardware ID | `"354289091234567"` |
  | `indicate_offline_online` | string | Yes | Status tag: `"ONLINE"` / `"OFFLINE"` | `"ONLINE"` |

- **Response Status:** `201 Created`
- **Response Body:**
  ```json
  {
    "status": "success",
    "message": "Punch recorded successfully",
    "punch_id": 98451,
    "emp_code": "I8578",
    "punch_type": "IN",
    "recorded_time": "2026-10-29 09:05:12",
    "is_within_geofence": true,
    "distance": "18m"
  }
  ```

---

### 3.2 Monthly Attendance Calendar & Status Metrics
- **Target Screen:** `MonthlyCalendarScreen.tsx`
- **Feature Flag:** `FT_ATTENDANCE_CALENDAR`, `FT_ATTENDANCE_METRICS`
- **Endpoint:** `GET /api/attendance/android-logs/?emp_code={code}&month={m}&year={y}`
- **Method:** `GET`
- **Headers:**
  ```http
  Cookie: sessionid=<active_session_id>
  Accept: application/json
  ```
- **Request Query Params:**
  | Param | Type | Required | Description | Example |
  | :--- | :--- | :--- | :--- | :--- |
  | `emp_code` | string | Yes | Employee code | `"I8578"` |
  | `month` | string | Yes | 2-digit month | `"10"` |
  | `year` | string | Yes | 4-digit year | `"2026"` |

- **Response Status:** `200 OK`
- **Response Body:**
  ```json
  {
    "summary": {
      "total_days": 31,
      "present_days": 24,
      "absent_days": 2,
      "leaves": 1,
      "weekly_offs": 4,
      "overtime_hours": 8.5
    },
    "records": [
      {
        "date": "2026-10-01",
        "status": "P",
        "in_time": "08:58 AM",
        "out_time": "06:05 PM",
        "address": "Unit 4, Andheri Hub, Mumbai",
        "distances": "12m"
      },
      {
        "date": "2026-10-02",
        "status": "WO",
        "in_time": null,
        "out_time": null,
        "address": null,
        "distances": null
      }
    ]
  }
  ```

---

### 3.3 Secure KYC Upload (Aadhaar, PAN & Bank Information)
- **Target Screen:** `AadhaarUploadScreen.tsx` & `PanUploadScreen.tsx`
- **Feature Flag:** `FT_AADHAAR_QR_SCAN`, `FT_PAN_VERIFICATION`
- **Endpoint:** `POST /api/hr/employee-kyc/`
- **Method:** `POST`
- **Headers:**
  ```http
  Content-Type: application/json
  Cookie: sessionid=<active_session_id>
  X-CSRFToken: <csrf_token>
  ```
- **Request Body Fields:**
  | Field | Type | Required | Description | Example |
  | :--- | :--- | :--- | :--- | :--- |
  | `emp_code` | string | Yes | Target Employee Code | `"I8578"` |
  | `aadhaar` | string | No | 12-digit Aadhaar Number | `"541278963214"` |
  | `pan` | string | No | 10-digit PAN format | `"ABCDE1234F"` |
  | `bank_account` | string | No | Bank Account Number | `"918020012345678"` |
  | `bank_holder_name` | string | No | Full Name as per Bank Passbook | `"Aman Rajput"` |
  | `bank_name` | string | No | Financial Institution Name | `"HDFC Bank"` |
  | `ifsc` | string | No | 11-digit IFSC code | `"HDFC0001234"` |
  | `nominee_name` | string | No | Nominee Beneficiary Name | `"Sunita Rajput"` |
  | `nominee_relation` | string | No | Beneficiary Relationship | `"Mother"` |

- **Request Body (JSON):**
  ```json
  {
    "emp_code": "I8578",
    "aadhaar": "541278963214",
    "pan": "ABCDE1234F",
    "bank_account": "918020012345678",
    "bank_holder_name": "Aman Rajput",
    "bank_name": "HDFC Bank",
    "ifsc": "HDFC0001234",
    "nominee_name": "Sunita Rajput",
    "nominee_relation": "Mother"
  }
  ```
- **Response Status:** `200 OK`
- **Response Body:**
  ```json
  {
    "emp_code": "I8578",
    "aadhaar_masked": "XXXX-XXXX-3214",
    "pan_masked": "XXXXX1234F",
    "bank_account_masked": "XXXXXXXXXXXX5678",
    "bank_name": "HDFC Bank",
    "ifsc": "HDFC0001234",
    "bank_status": "Pending",
    "bank_approve": 0,
    "bankdetail_reject_reason": ""
  }
  ```

---

### 3.4 7-Stage Joining Dossier & Police Document Upload
- **Target Screen:** `PoliceVerificationScreen.tsx`, `JoiningDossierScreen.tsx`
- **Feature Flag:** `FT_POLICE_VERIFICATION`, `FT_7_STAGE_JOINING_DOSSIER`
- **Endpoint:** `POST /api/hr/android-documents/`
- **Method:** `POST`
- **Headers:**
  ```http
  Content-Type: multipart/form-data
  Cookie: sessionid=<active_session_id>
  X-CSRFToken: <csrf_token>
  ```
- **Allowed `image_name` Categories:**
  - `police_verification_form` (Police Verification clearance)
  - `adhar_card_upload` (Aadhaar Card copy)
  - `Pan_card_upload` (PAN Card copy)
  - `joining_form` (Signed Joining declaration)
  - `form_11` (PF Declaration Form 11)
  - `form_2` (PF/ESIC Nominee Form 2)
  - `bank_passbook` (Bank Passbook / Cheque photo)
  - `passprt_size_photo` (Passport Photo)

- **Request Form-Data Fields:**
  | Field | Type | Required | Description | Example |
  | :--- | :--- | :--- | :--- | :--- |
  | `emp_code` | string | Yes | Employee Code | `"I8578"` |
  | `emp_name` | string | Yes | Full Name | `"Aman Rajput"` |
  | `image_name` | string | Yes | Category tag from allowed list above | `"police_verification_form"` |
  | `cur_date` | string | Yes | Date format `YYYY-MM-DD` | `"2026-10-29"` |
  | `file` | file | Yes | Document Scan (JPG, PNG, PDF) | `police_clearance.pdf` |

- **Response Status:** `201 Created`
- **Response Body:**
  ```json
  {
    "id": 842,
    "comp_code": "01",
    "emp_code": "I8578",
    "emp_name": "Aman Rajput",
    "image_name": "police_verification_form",
    "image_path": "police_verification_form_842.pdf",
    "cur_date": "2026-10-29",
    "comments": "Uploaded via Android",
    "reject": 0,
    "android_flag": 0
  }
  ```

---

### 3.5 Document Verification Lifecycle & Approval Status
- **Target Screen:** `DocumentStatusScreen.tsx`
- **Feature Flag:** `FT_DOC_APPROVAL_STATUS`
- **Endpoint:** `GET /api/hr/android-documents/?emp_code={code}`
- **Method:** `GET`
- **Headers:**
  ```http
  Cookie: sessionid=<active_session_id>
  Accept: application/json
  ```
- **Response Status:** `200 OK`
- **Response Body:**
  ```json
  {
    "count": 3,
    "results": [
      {
        "id": 842,
        "image_name": "police_verification_form",
        "display_name": "Police Verification form",
        "cur_date": "2026-10-29",
        "reject": 2,
        "android_flag": 1,
        "status_badge": "Approved",
        "comments": "Approved Document"
      },
      {
        "id": 840,
        "image_name": "adhar_card_upload",
        "display_name": "Adhar Card",
        "cur_date": "2026-10-27",
        "reject": 1,
        "android_flag": 1,
        "status_badge": "Rejected",
        "comments": "Blurry image. Back side address is not readable."
      },
      {
        "id": 839,
        "image_name": "Pan_card_upload",
        "display_name": "Pan Card",
        "cur_date": "2026-10-27",
        "reject": 0,
        "android_flag": 0,
        "status_badge": "Pending",
        "comments": "Under Review"
      }
    ]
  }
  ```

---

### 3.6 Apply for Leave (Casual / Sick / Paid)
- **Target Screen:** `LeaveApplyScreen.tsx`
- **Feature Flag:** `FT_GENERAL_LEAVE`
- **Endpoint:** `POST /api/leave/applications/`
- **Method:** `POST`
- **Headers:**
  ```http
  Content-Type: application/json
  Cookie: sessionid=<active_session_id>
  X-CSRFToken: <csrf_token>
  ```
- **Request Body Fields:**
  | Field | Type | Required | Description | Example |
  | :--- | :--- | :--- | :--- | :--- |
  | `leave_type` | string | Yes | Code: `"CL"`, `"SL"`, `"PL"` | `"CL"` |
  | `from_date` | string | Yes | Start date (`YYYY-MM-DD`) | `"2026-11-02"` |
  | `to_date` | string | Yes | End date (`YYYY-MM-DD`) | `"2026-11-04"` |
  | `leave_reason` | string | Yes | Explanation | `"Attending sister's wedding"` |
  | `half_day_type`| string | No | `"First Half"`, `"Second Half"`, or `""` | `""` |

- **Request Body (JSON):**
  ```json
  {
    "leave_type": "CL",
    "from_date": "2026-11-02",
    "to_date": "2026-11-04",
    "leave_reason": "Attending sister's wedding",
    "half_day_type": ""
  }
  ```
- **Response Status:** `201 Created`
- **Response Body:**
  ```json
  {
    "leave_id": 312,
    "comp_code": "01",
    "emp_code": "I8578",
    "emp_name": "Aman Rajput",
    "leave_apply_date": "2026-10-29",
    "leave_type": "CL",
    "from_date": "2026-11-02",
    "to_date": "2026-11-04",
    "no_of_days": 3,
    "leave_status": "Pending",
    "status_comment": null
  }
  ```

---

### 3.7 Petty Cash Operational Expense Claim
- **Target Screen:** `PettyCashScreen.tsx`
- **Feature Flag:** `FT_PETTY_CASH`
- **Endpoint:** `POST /api/transactions/petty-cash-android/submit/`
- **Method:** `POST`
- **Headers:**
  ```http
  Content-Type: multipart/form-data
  Cookie: sessionid=<active_session_id>
  X-CSRFToken: <csrf_token>
  ```
- **Request Form-Data Fields:**
  | Field | Type | Required | Description | Example |
  | :--- | :--- | :--- | :--- | :--- |
  | `client_code` | string | Yes | Client Code | `"CL001"` |
  | `state` | string | Yes | State Name | `"MAHARASHTRA"` |
  | `unit_code` | string | Yes | Unit / Branch Code | `"U004"` |
  | `emp_code` | string | Yes | Requester Employee Code | `"I8578"` |
  | `request_date`| string | Yes | Date formatted as `DD/MM/YYYY` | `"29/10/2026"` |
  | `item` | string | Yes | Expense item description | `"Torch cell batteries (Pack of 4)"` |
  | `shop` | string | Yes | Vendor / Shop name | `"National Electronics"` |
  | `amount` | string | Yes | Amount spent in ₹ | `"180.00"` |
  | `qr_image` | file | Yes | Receipt photo (JPG/PNG only) | `battery_bill.jpg` |

- **Response Status:** `200 OK`
- **Response Body:**
  ```json
  {
    "status": "success",
    "message": "Request Send Successfully...!!!"
  }
  ```

---

### 3.8 Download Monthly Salary Slip PDF
- **Target Screen:** `SalarySlipScreen.tsx`
- **Feature Flag:** `FT_SALARY_SLIP_PDF`
- **Endpoint:** `GET /api/payroll/emp-salary-slip/pdf/?month={m}&year={y}`
- **Method:** `GET`
- **Headers:**
  ```http
  Cookie: sessionid=<active_session_id>
  Accept: application/pdf
  ```
- **Request Query Params:**
  | Param | Type | Required | Description | Example |
  | :--- | :--- | :--- | :--- | :--- |
  | `month` | number | Yes | Month number (1 to 12) | `9` |
  | `year` | number | Yes | Year | `2026` |

- **Response Status:** `200 OK`
- **Response Headers:**
  ```http
  Content-Type: application/pdf
  Content-Disposition: attachment; filename="Salary_September_2026.pdf"
  ```
- **Response Body:** Binary PDF payload. Mobile app renders directly via react-native-pdf viewer.

---

## 4. Supervisor & Site Officer (SO/JSO) APIs

### 4.1 Guard Shift Muster Roll & Replacement Guard
- **Target Screen:** `MusterRollScreen.tsx`
- **Feature Flag:** `FT_GUARD_MUSTER_ROLL`, `FT_REPLACEMENT_GUARD`
- **Endpoint:** `POST /api/attendance/bulk-attendance/`
- **Method:** `POST`
- **Headers:**
  ```http
  Content-Type: application/json
  Cookie: sessionid=<active_session_id>
  X-CSRFToken: <csrf_token>
  ```
- **Request Body Fields:**
  | Field | Type | Required | Description | Example |
  | :--- | :--- | :--- | :--- | :--- |
  | `client_code` | string | Yes | Target client | `"CL001"` |
  | `unit_code` | string | Yes | Target unit | `"U004"` |
  | `date` | string | Yes | Attendance date (`YYYY-MM-DD`) | `"2026-10-29"` |
  | `shift` | string | Yes | Shift label (`"Morning"`, `"Night"`) | `"Morning"` |
  | `records` | array | Yes | Array of guard records | See below |

- **Request Body (JSON):**
  ```json
  {
    "client_code": "CL001",
    "unit_code": "U004",
    "date": "2026-10-29",
    "shift": "Morning",
    "records": [
      {
        "emp_code": "I8578",
        "status": "P",
        "in_time": "08:00",
        "out_time": "20:00",
        "overtime_hours": 0.0,
        "replacement_emp_code": null
      },
      {
        "emp_code": "I9201",
        "status": "A",
        "in_time": null,
        "out_time": null,
        "overtime_hours": 0.0,
        "replacement_emp_code": "I9905"
      }
    ]
  }
  ```
- **Response Status:** `200 OK`
- **Response Body:**
  ```json
  {
    "status": "success",
    "processed_count": 2,
    "message": "Shift muster recorded successfully"
  }
  ```

---

### 4.2 Site Visit Audit (6 Questions + 6 Photo Proofs)
- **Target Screen:** `SiteAuditScreen.tsx` & `GroomingChecklistScreen.tsx`
- **Feature Flag:** `FT_SITE_VISIT_AUDIT`, `FT_GROOMING_10_POINT`
- **Endpoint:** `POST /api/masters/site-audits/`
- **Method:** `POST`
- **Headers:**
  ```http
  Content-Type: multipart/form-data
  Cookie: sessionid=<active_session_id>
  X-CSRFToken: <csrf_token>
  ```
- **Request Form-Data Fields:**
  | Field | Type | Required | Description | Example |
  | :--- | :--- | :--- | :--- | :--- |
  | `client_code` | string | Yes | Client Code | `"CL001"` |
  | `unit_code` | string | Yes | Unit Code | `"U004"` |
  | `visit_date` | string | Yes | Date `YYYY-MM-DD` | `"2026-10-29"` |
  | `supervisor_code`| string | Yes | Supervisor Emp Code | `"S102"` |
  | `q1_ans` | string | Yes | `"Y"` or `"N"` (Meet concern person) | `"Y"` |
  | `q1_image` | file | Yes | Watermarked photo 1 | `proof1.jpg` |
  | `q2_ans` | string | Yes | `"Y"` or `"N"` (Meet guard) | `"Y"` |
  | `q2_image` | file | Yes | Watermarked photo 2 | `proof2.jpg` |
  | `q3_ans` | string | Yes | `"Y"` or `"N"` (10-point grooming check) | `"Y"` |
  | `q3_image` | file | Yes | Watermarked photo 3 | `proof3.jpg` |
  | `q4_ans` | string | Yes | `"Y"` or `"N"` (I-card & shoes check) | `"Y"` |
  | `q4_image` | file | Yes | Watermarked photo 4 | `proof4.jpg` |
  | `q5_ans` | string | Yes | `"Y"` or `"N"` (Register maintained) | `"Y"` |
  | `q5_image` | file | Yes | Watermarked photo 5 | `proof5.jpg` |
  | `q6_ans` | string | Yes | `"Y"` or `"N"` (Guard on duty place) | `"Y"` |
  | `q6_image` | file | Yes | Watermarked photo 6 | `proof6.jpg` |
  | `comments` | string | No | Overall remarks | `"Unit running smoothly, all guards in proper uniform"` |

- **Response Status:** `201 Created`
- **Response Body:**
  ```json
  {
    "id": 105,
    "status": "success",
    "android_flag": 0,
    "message": "Site visit audit submitted successfully with 6 photo proofs"
  }
  ```

---

### 4.3 Service Quality Rating (10-Criteria Scorecard + Client Signature)
- **Target Screen:** `ServiceQualityRatingScreen.tsx`
- **Feature Flag:** `FT_SERVICE_QUALITY_RATING`
- **Endpoint:** `POST /api/masters/site-audit-detail/`
- **Method:** `POST`
- **Headers:**
  ```http
  Content-Type: multipart/form-data
  Cookie: sessionid=<active_session_id>
  X-CSRFToken: <csrf_token>
  ```
- **Request Form-Data Fields:**
  | Field | Type | Required | Description | Example |
  | :--- | :--- | :--- | :--- | :--- |
  | `name_type` | number | Yes | Constant `2` for Service Rating | `2` |
  | `client_code` | string | Yes | Client Code | `"CL001"` |
  | `unit_code` | string | Yes | Unit Code | `"U004"` |
  | `rating_month`| string | Yes | `MM/YYYY` | `"10/2026"` |
  | `r1` to `r10` | number | Yes | Star Rating (1 to 5) for 10 criteria | `5`, `4`, `5`... |
  | `client_remarks` | string | No | Feedback written by client | `"Staff is well-mannered"` |
  | `client_signature` | file | Yes | Captured client canvas signature | `client_sign.png` |

- **Response Status:** `201 Created`
- **Response Body:**
  ```json
  {
    "status": "success",
    "message": "Feedback letter and rating saved successfully"
  }
  ```

---

### 4.4 Working Image Proof (Patrolling / Sanitization)
- **Target Screen:** `WorkingImageProofScreen.tsx`
- **Feature Flag:** `FT_WORKING_IMAGE_PROOF`
- **Endpoint:** `POST /api/hr/working-images/`
- **Method:** `POST`
- **Headers:**
  ```http
  Content-Type: multipart/form-data
  Cookie: sessionid=<active_session_id>
  X-CSRFToken: <csrf_token>
  ```
- **Request Form-Data Fields:**
  | Field | Type | Required | Description | Example |
  | :--- | :--- | :--- | :--- | :--- |
  | `unit_code` | string | Yes | Branch / Unit Code | `"U004"` |
  | `image_type` | string | Yes | `"Patrolling Images"`, `"Cleaning Images"`, `"Deep Cleaning Images"`, `"Pest Control Images"` | `"Patrolling Images"` |
  | `datecurrent`| string | Yes | Date `YYYY-MM-DD` | `"2026-10-29"` |
  | `image` | file | Yes | Captured photo (JPG, PNG) | `patrol_01.jpg` |

- **Response Status:** `201 Created`
- **Response Body:**
  ```json
  {
    "id": 512,
    "comp_code": "01",
    "unit_code": "U004",
    "image_type": "Patrolling Images",
    "image_name": "512.jpg",
    "image_url": "/media/working_images/512.jpg",
    "datecurrent": "2026-10-29"
  }
  ```

---

### 4.5 Spot Recruitment (Direct Field Hiring)
- **Target Screen:** `SpotRecruitmentScreen.tsx`
- **Feature Flag:** `FT_SPOT_RECRUITMENT`
- **Endpoint:** `POST /api/hr/recruitments/`
- **Method:** `POST`
- **Headers:**
  ```http
  Content-Type: application/json
  Cookie: sessionid=<active_session_id>
  X-CSRFToken: <csrf_token>
  ```
- **Request Body Fields:**
  | Field | Type | Required | Description | Example |
  | :--- | :--- | :--- | :--- | :--- |
  | `client_name` | string | Yes | Client Name | `"BJH Logistics"` |
  | `unit_name` | string | Yes | Unit Name | `"Andheri Warehouse"` |
  | `grade` | string | Yes | Grade / Designation | `"Security Guard"` |
  | `new_employee_name` | string | Yes | Candidate Full Name | `"Sunil Kadam"` |
  | `father_name` | string | Yes | Father Name | `"Pandurang Kadam"` |
  | `dob` | string | Yes | Date of Birth (`YYYY-MM-DD`, $\ge 18\text{ yrs}$) | `"1997-08-20"` |
  | `gender` | string | Yes | `"Male"` / `"Female"` | `"Male"` |
  | `mobile_no` | string | Yes | 10-digit mobile number | `"9820123456"` |
  | `address` | string | Yes | Current residential address | `"Room 10, Chawl 4, Kurla East"` |
  | `uniform_size` | string | Yes | `"S"`, `"M"`, `"L"`, `"XL"`, `"XXL"` | `"L"` |
  | `shoes_size` | string | Yes | `"6"` to `"11"` | `"8"` |
  | `working_hours`| string | No | Daily shift hours | `"12"` |
  | `aadhaar` | string | Yes | 12-digit Aadhaar (Write-only, Encrypted) | `"451298762314"` |
  | `account_no` | string | Yes | Bank Account Number (Write-only, Encrypted) | `"5010023456789"` |
  | `ifsc_code` | string | Yes | Bank IFSC Code | `"HDFC0000001"` |
  | `bank_holder_name`| string| Yes| Name as per bank record | `"Sunil Pandurang Kadam"` |

- **Request Body (JSON):**
  ```json
  {
    "client_name": "BJH Logistics",
    "unit_name": "Andheri Warehouse",
    "grade": "Security Guard",
    "new_employee_name": "Sunil Kadam",
    "father_name": "Pandurang Kadam",
    "dob": "1997-08-20",
    "gender": "Male",
    "mobile_no": "9820123456",
    "address": "Room 10, Chawl 4, Kurla East",
    "uniform_size": "L",
    "shoes_size": "8",
    "working_hours": "12",
    "aadhaar": "451298762314",
    "account_no": "5010023456789",
    "ifsc_code": "HDFC0000001",
    "bank_holder_name": "Sunil Pandurang Kadam"
  }
  ```
- **Response Status:** `201 Created`
- **Response Body:**
  ```json
  {
    "id": 92,
    "new_employee_name": "Sunil Kadam",
    "moveto_master": 0,
    "aadhaar_masked": "XXXX-XXXX-2314",
    "account_masked": "XXXXXXXXX6789",
    "bank_holder_masked": "Sunil *******",
    "status": "Candidate registered for spot onboarding"
  }
  ```

---

### 4.6 Supervisor Travel Expense Claim
- **Target Screen:** `TravelExpenseScreen.tsx`
- **Feature Flag:** `FT_TRAVEL_CLAIMS`
- **Endpoint:** `POST /api/transactions/travel-plans/`
- **Method:** `POST`
- **Headers:**
  ```http
  Content-Type: application/json
  Cookie: sessionid=<active_session_id>
  X-CSRFToken: <csrf_token>
  ```
- **Request Body Fields:**
  | Field | Type | Required | Description | Example |
  | :--- | :--- | :--- | :--- | :--- |
  | `travel_mode` | string | Yes | `"Train"`, `"Bus"`, `"Auto"`, `"Flight"` | `"Train"` |
  | `from_designation`| string | Yes | Starting Point | `"Mumbai Central"` |
  | `to_designation` | string | Yes | Destination Point | `"Pune Junction"` |
  | `from_date` | string | Yes | Departure Date (`YYYY-MM-DD`) | `"2026-10-30"` |
  | `to_date` | string | Yes | Return Date (`YYYY-MM-DD`) | `"2026-10-31"` |
  | `adv_amount` | string | No | Advance amount claimed in ₹ | `"750.00"` |
  | `total_km` | number | No | Total Distance traveled | `160` |
  | `add_description` | string | No | Purpose of travel | `"Auditing Pune industrial units"` |

- **Request Body (JSON):**
  ```json
  {
    "travel_mode": "Train",
    "from_designation": "Mumbai Central",
    "to_designation": "Pune Junction",
    "from_date": "2026-10-30",
    "to_date": "2026-10-31",
    "adv_amount": "750.00",
    "total_km": 160,
    "add_description": "Auditing Pune industrial units"
  }
  ```
- **Response Status:** `201 Created`
- **Response Body:**
  ```json
  {
    "id": 48,
    "expenses_id": "EXP20261048",
    "expense_status": "Submitted",
    "travel_mode": "Train",
    "from_designation": "Mumbai Central",
    "to_designation": "Pune Junction",
    "adv_amount": "750.00",
    "message": "Travel plan submitted for manager approval"
  }
  ```

---

## 5. Housekeeping Operations APIs

### 5.1 Consumables Stock & Material Check
- **Target Screen:** `MaterialCheckScreen.tsx`
- **Feature Flag:** `FT_HK_MATERIAL_CHECK`
- **Endpoint:** `GET /api/masters/consumable-material/`
- **Method:** `GET`
- **Headers:**
  ```http
  Cookie: sessionid=<active_session_id>
  Accept: application/json
  ```
- **Response Status:** `200 OK`
- **Response Body:**
  ```json
  {
    "count": 4,
    "results": [
      {
        "id": 1,
        "item_name": "Taski R2 (All-Purpose Cleaner)",
        "unit_of_measure": "Liters",
        "stock_quantity": 25,
        "min_required_quantity": 10
      },
      {
        "id": 2,
        "item_name": "Taski R6 (Toilet Cleaner)",
        "unit_of_measure": "Liters",
        "stock_quantity": 8,
        "min_required_quantity": 10
      },
      {
        "id": 3,
        "item_name": "Microfiber Mop Head",
        "unit_of_measure": "Pieces",
        "stock_quantity": 15,
        "min_required_quantity": 5
      }
    ]
  }
  ```

---

### 5.2 Housekeeping Before & After Proof Photos
- **Target Screen:** `WorkProofPhotosScreen.tsx`
- **Feature Flag:** `FT_HK_BEFORE_AFTER_PHOTOS`
- **Endpoint:** `POST /api/hr/working-images/`
- **Method:** `POST`
- **Headers:**
  ```http
  Content-Type: multipart/form-data
  Cookie: sessionid=<active_session_id>
  X-CSRFToken: <csrf_token>
  ```
- **Request Form-Data Fields:**
  | Field | Type | Required | Description | Example |
  | :--- | :--- | :--- | :--- | :--- |
  | `unit_code` | string | Yes | Branch / Unit Code | `"U004"` |
  | `image_type` | string | Yes | `"Cleaning Images"` or `"Deep Cleaning Images"` | `"Deep Cleaning Images"` |
  | `datecurrent`| string | Yes | Date `YYYY-MM-DD` | `"2026-10-29"` |
  | `image` | file | Yes | Before or After photo file | `washroom_cleaned.jpg` |

- **Response Status:** `201 Created`
- **Response Body:** Echoes created photo ID and static URL path.

---

## 6. Relationship Manager & Cluster Manager (RM/CM) APIs

### 6.1 Send Candidate Onboarding Link via SMS / WhatsApp
- **Target Screen:** `SendOnboardingLinkScreen.tsx`
- **Feature Flag:** `FT_ONBOARDING_LINK_SMS_WA`
- **Endpoint:** `POST /api/hr/resource-recruitment/send_link/`
- **Method:** `POST`
- **Headers:**
  ```http
  Content-Type: application/json
  Cookie: sessionid=<active_session_id>
  X-CSRFToken: <csrf_token>
  ```
- **Request Body Fields:**
  | Field | Type | Required | Description | Example |
  | :--- | :--- | :--- | :--- | :--- |
  | `mobile_no` | string | Yes | Candidate 10-digit mobile number | `"9812345678"` |
  | `candidate_name`| string| Yes | Candidate Full Name | `"Vikas Patil"` |
  | `client_code` | string | Yes | Client Code | `"CL001"` |
  | `designation` | string | Yes | Role (`"JSO"`, `"SO"`, `"HA"`) | `"SO"` |

- **Request Body (JSON):**
  ```json
  {
    "mobile_no": "9812345678",
    "candidate_name": "Vikas Patil",
    "client_code": "CL001",
    "designation": "SO"
  }
  ```
- **Response Status:** `200 OK`
- **Response Body:**
  ```json
  {
    "status": "success",
    "message": "Self-onboarding link dispatched via SMS & WhatsApp",
    "onboarding_url": "https://ihmsindia.com/onboard?token=cnd_8a7b6c5d4e",
    "expiry": "2026-11-05 23:59:59"
  }
  ```

---

### 6.2 RM Recruitment Pipeline Statistics
- **Target Screen:** `RecruitmentPipelineScreen.tsx`
- **Feature Flag:** `FT_RECRUITMENT_PIPELINE`
- **Endpoint:** `GET /api/hr/resource-recruitment/summary/`
- **Method:** `GET`
- **Headers:**
  ```http
  Cookie: sessionid=<active_session_id>
  Accept: application/json
  ```
- **Response Status:** `200 OK`
- **Response Body:**
  ```json
  {
    "total_links_sent": 140,
    "candidate_forms_submitted": 98,
    "documents_under_review": 22,
    "ihms_approved": 64,
    "offer_letters_dispatched": 50,
    "joined_employees": 42,
    "rejected_candidates": 12
  }
  ```

---

### 6.3 Team Hierarchy (Cluster Managers under RM)
- **Target Screen:** `TeamHierarchyScreen.tsx`
- **Feature Flag:** `FT_TEAM_HIERARCHY_VIEW`
- **Endpoint:** `GET /api/hr/resource-recruitment/cm_under_rm/`
- **Method:** `GET`
- **Headers:**
  ```http
  Cookie: sessionid=<active_session_id>
  Accept: application/json
  ```
- **Response Status:** `200 OK`
- **Response Body:**
  ```json
  {
    "reporting_rm": "RM001 - Rajesh Deshmukh",
    "cluster_managers": [
      {
        "cm_code": "CM101",
        "cm_name": "Prakash Shinde",
        "assigned_region": "Western Mumbai Suburbs",
        "active_units": 14,
        "total_guards_deployed": 180
      },
      {
        "cm_code": "CM102",
        "cm_name": "Nitin Rane",
        "assigned_region": "Thane & Navi Mumbai",
        "active_units": 18,
        "total_guards_deployed": 240
      }
    ]
  }
  ```

---

## 7. VIN / Insurance Agent APIs

### 7.1 Prospect Meet Logger (GPS & Selfie Verification)
- **Target Screen:** `ProspectMeetScreen.tsx`
- **Feature Flag:** `FT_PROSPECT_MEET_LOGGER`
- **Endpoint:** `POST /api/transactions/client-requests/`
- **Method:** `POST`
- **Headers:**
  ```http
  Content-Type: multipart/form-data
  Cookie: sessionid=<active_session_id>
  X-CSRFToken: <csrf_token>
  ```
- **Request Form-Data Fields:**
  | Field | Type | Required | Description | Example |
  | :--- | :--- | :--- | :--- | :--- |
  | `visitor_type` | string | Yes | `"Corporate"`, `"Dealer"`, `"Individual"` | `"Corporate"` |
  | `contact_person`| string | Yes | Prospect Name | `"Mr. Arvind Sethi"` |
  | `contact_no` | string | Yes | Mobile Number | `"9820011223"` |
  | `location` | string | Yes | Meeting address / Area | `"Kandivali West, Link Road"` |
  | `latitude` | string | Yes | GPS Latitude | `"19.2081"` |
  | `longitude` | string | Yes | GPS Longitude | `"72.8364"` |
  | `notes` | string | No | Meeting discussion summary | `"Discussed commercial fleet insurance"` |
  | `selfie_image` | file | Yes | Face verified photo with prospect | `meet_selfie.jpg` |

- **Response Status:** `201 Created`
- **Response Body:**
  ```json
  {
    "id": 78,
    "status": "Logged",
    "timestamp": "2026-10-29 16:30:00",
    "message": "Prospect meeting recorded with verified GPS coordinates"
  }
  ```

---

### 7.2 Agent Licensing & IRDAI Status
- **Target Screen:** `AgentLicenseScreen.tsx`
- **Feature Flag:** `FT_AGENT_LICENSE_CREATION`
- **Endpoint:** `GET /api/hr/resource-recruitment/?licensing_status=1`
- **Method:** `GET`
- **Headers:**
  ```http
  Cookie: sessionid=<active_session_id>
  Accept: application/json
  ```
- **Response Status:** `200 OK`
- **Response Body:**
  ```json
  {
    "agent_code": "VIN-AG-904",
    "agent_name": "Vikas Patil",
    "irdai_exam_status": "Cleared",
    "license_no": "IRDAI/2026/098452",
    "license_valid_until": "2029-10-28",
    "approval_state": "Approved by Licensing Team"
  }
  ```
