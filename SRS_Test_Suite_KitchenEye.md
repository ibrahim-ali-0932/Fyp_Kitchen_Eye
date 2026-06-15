# KitchenEye Comprehensive Testing Suite (SRS-Ready)

Date: 2026-06-15  
Project: KitchenEye - AI-Powered Kitchen Hygiene Monitoring System

## Requirement Index

| Req ID | Requirement |
|---|---|
| R1 | User Registration |
| R2 | Login |
| R3 | Logout |
| R4 | Password Reset |
| R5 | Role-Based Access (Admin, Manager, Staff) |
| R6 | Add Camera |
| R7 | Edit Camera |
| R8 | Delete Camera |
| R9 | Live Camera Feed |
| R10 | Camera Status Monitoring |
| R11 | Detect PPE Violations |
| R12 | Detect Dirty Surfaces |
| R13 | Detect Spills |
| R14 | Detect Smoke/Fire Hazards |
| R15 | Detect Pests |
| R16 | Generate Violation Alert |
| R17 | Send Real-Time Notifications |
| R18 | Alert History |
| R19 | Violation Statistics |
| R20 | Violation Index |
| R21 | Trends and Reports |
| R22 | Branch-wise Monitoring |
| R23 | View Subscription Plans |
| R24 | Subscribe to Plan |
| R25 | Payment Success |
| R26 | Payment Failure |
| R27 | Subscription Status |
| R28 | Generate Reports |
| R29 | Download Reports |
| R30 | View Historical Violations |

## A) Unit Test Cases

| Test Case ID | Test Case Title | Test Type | Description | Preconditions | Test Steps | Expected Result | Priority |
|---|---|---|---|---|---|---|---|
| UT-AUTH-01 | Validate Registration Input | Unit | Verify registration validator accepts valid name, email, and password. | Validation utility loaded. | 1) Pass valid payload. 2) Execute validation. | Validation passes with no errors. | High |
| UT-AUTH-02 | Reject Weak Password | Unit | Verify weak passwords are rejected by business rules. | Password policy configured. | 1) Pass password below policy threshold. 2) Execute validation. | Validation fails with password policy message. | High |
| UT-AUTH-03 | Enforce Role Permission Mapping | Unit | Verify endpoint access mapping for Admin, Manager, and Staff roles. | Role map function available. | 1) Evaluate route-role matrix. 2) Check each role against protected action. | Only allowed roles return authorized; others return forbidden. | High |
| UT-CAM-01 | Validate Camera URL and Metadata | Unit | Verify camera create/update payload validation. | Camera schema loaded. | 1) Submit valid RTSP/HTTP URL and camera name. 2) Submit invalid URL payload. | Valid payload passes; invalid payload fails with clear error. | High |
| UT-CAM-02 | Compute Camera Online Status | Unit | Verify status logic from last heartbeat timestamp. | Status utility function available. | 1) Pass recent heartbeat timestamp. 2) Pass stale timestamp. | Recent timestamp returns Online; stale returns Offline. | Medium |
| UT-DET-01 | PPE Violation Rule Evaluation | Unit | Verify PPE detector flags violation when required PPE class is missing. | Detection rule engine loaded. | 1) Provide detections with missing hairnet/gloves. 2) Execute rule check. | Violation result is generated with correct violation type. | High |
| UT-DET-02 | Spill Threshold Rule | Unit | Verify spill rule triggers only above confidence threshold. | Spill threshold configured. | 1) Pass detection below threshold. 2) Pass detection above threshold. | Below threshold ignored; above threshold marked violation. | High |
| UT-DET-03 | Smoke/Fire Hazard Rule | Unit | Verify smoke/fire labels map to hazard severity correctly. | Hazard mapping config available. | 1) Pass smoke class detection. 2) Pass fire class detection. | Alert severity and type are correctly assigned. | High |
| UT-ALT-01 | Build Alert Payload | Unit | Verify alert object contains camera, branch, timestamp, and violation metadata. | Alert builder utility available. | 1) Build alert from sample violation event. | Payload includes all required fields and valid format. | High |
| UT-ALT-02 | Alert Deduplication Window | Unit | Verify duplicate alerts are suppressed within configured time window. | Dedup logic configured. | 1) Send same violation twice within window. 2) Send again after window expires. | Second alert in window suppressed; later alert allowed. | Medium |
| UT-DASH-01 | Violation Index Calculation | Unit | Verify violation index computation from weighted violation counts. | Weight configuration available. | 1) Input known sample counts. 2) Run index function. | Returned index matches expected formula output. | High |
| UT-DASH-02 | Trend Aggregation by Date | Unit | Verify trend function groups violations by day correctly. | Aggregation helper available. | 1) Provide multi-day sample records. 2) Run grouping. | Output contains correct daily buckets and totals. | Medium |
| UT-SUB-01 | Plan Eligibility and Billing Rules | Unit | Verify selected plan follows billing rules (monthly/yearly and role constraints). | Plan config loaded. | 1) Evaluate valid plan selection. 2) Evaluate invalid selection. | Valid selection accepted; invalid selection rejected with reason. | High |
| UT-REP-01 | Report Filter Validation | Unit | Verify report date range and branch filters are validated. | Report validator available. | 1) Pass valid date range/branch. 2) Pass end date before start date. | Valid request accepted; invalid request rejected with message. | High |

## B) Integration Test Cases

| Test Case ID | Test Case Title | Test Type | Description | Preconditions | Test Steps | Expected Result | Priority |
|---|---|---|---|---|---|---|---|
| IT-AUTH-01 | Register then Login | Integration | Verify user registration writes to DB and user can log in immediately. | API server and DB running. | 1) Call signup API with new user. 2) Call login API with same credentials. | User row created in DB; login returns token/session. | High |
| IT-AUTH-02 | Password Reset End-to-End | Integration | Verify reset request, token verification, and password update flow. | Mail/mock token service available. | 1) Request password reset. 2) Submit valid reset token + new password. 3) Login with new password. | Password hash updates in DB; old password fails; new password works. | High |
| IT-AUTH-03 | Logout Invalidates Session | Integration | Verify logout revokes active token/session and blocks protected API reuse. | Logged-in session exists. | 1) Call logout endpoint. 2) Reuse old token on protected endpoint. | Request is denied (401/403) after logout. | High |
| IT-CAM-01 | Add Camera Persists and Lists | Integration | Verify add camera API persists camera and appears in camera listing. | Authenticated Admin/Manager user. | 1) Add camera via API/UI. 2) Request camera list. | New camera exists in DB and appears in list response. | High |
| IT-CAM-02 | Edit Camera Updates Feed Config | Integration | Verify camera edit updates stream URL/name and reflects in list/live feed metadata. | Existing camera record. | 1) Edit camera details. 2) Fetch camera details/list. | Updated values returned and persisted in DB. | High |
| IT-CAM-03 | Delete Camera Removes Access | Integration | Verify deleted camera is removed and cannot be opened in live feed. | Existing camera record. | 1) Delete camera. 2) Request camera list and live feed endpoint for that camera. | Camera removed from list; live endpoint returns not found. | High |
| IT-DET-01 | Camera to Detection to Violation Record | Integration | Verify incoming camera frame triggers detection and creates violation record. | Active camera feed and model service available. | 1) Stream sample frame with known PPE violation. 2) Wait for detection pipeline. 3) Query violations API/DB. | Violation entry created with correct type and timestamp. | High |
| IT-DET-02 | Dirty Surface and Spill Event Persistence | Integration | Verify dirty surface and spill detections are persisted as separate violations. | Detection service running with test media. | 1) Send dirty-surface sample. 2) Send spill sample. 3) Query violation history. | Both events are stored with proper categories. | High |
| IT-DET-03 | Smoke/Fire and Pest Detection Routing | Integration | Verify smoke/fire and pest detections route to correct violation categories and severity. | Hazard and pest models active. | 1) Send smoke/fire sample clip. 2) Send pest sample clip. 3) Read saved events. | Records saved with expected category and severity tags. | High |
| IT-ALT-01 | Detection Triggers Real-Time Notification | Integration | Verify detection event generates alert and pushes real-time notification. | Notification channel configured (WebSocket/FCM). | 1) Trigger known violation. 2) Observe notification stream and alert API. | Client receives notification and alert entry is created. | High |
| IT-ALT-02 | Alert History Synchronization | Integration | Verify alert history page API matches alert entries in DB. | Existing alerts generated. | 1) Call alert history API. 2) Compare with DB records for same time range. | API response matches DB count and key fields. | Medium |
| IT-DASH-01 | Dashboard Stats from Violation Data | Integration | Verify dashboard cards/charts consume API and reflect actual stored violations. | Violation records exist for test period. | 1) Open dashboard stats endpoint. 2) Compare totals/index with DB query. | Dashboard metrics align with backend data. | High |
| IT-DASH-02 | Branch-wise Aggregation API | Integration | Verify branch filter returns correct branch-level monitoring statistics. | Multi-branch sample data present. | 1) Request analytics for Branch A and Branch B. 2) Compare totals. | Returned values match branch-specific DB records. | Medium |
| IT-SUB-01 | Plan Listing and Checkout Session Creation | Integration | Verify subscription plans API and checkout session creation with payment gateway. | Payment gateway keys configured in test mode. | 1) Request plans. 2) Start subscription checkout for selected plan. | Plans load successfully; checkout session URL/id created. | High |
| IT-SUB-02 | Payment Success Callback Updates Status | Integration | Verify successful payment callback updates user subscription status. | Test payment success webhook/event available. | 1) Complete successful payment in test mode. 2) Trigger success callback/webhook. 3) Query subscription status. | Status changes to Active with correct plan and dates. | High |
| IT-SUB-03 | Payment Failure Handling | Integration | Verify failed/cancelled payment is recorded and active status is not incorrectly granted. | Test payment failure scenario available. | 1) Trigger payment failure/cancel. 2) Query status and payment logs. | Status remains Pending/Inactive; failure is logged. | High |
| IT-REP-01 | Generate Report from Filtered Data | Integration | Verify generate report API pulls filtered violations and creates report artifact. | Violation data exists in date range. | 1) Submit report generation request (date + branch). 2) Check generated report metadata. | Report generated with expected record count and scope. | High |
| IT-REP-02 | Download Report File | Integration | Verify generated report is downloadable and file format is valid. | Existing generated report id. | 1) Request report download endpoint. 2) Open downloaded file. | File downloads successfully and contains expected columns/data. | High |

## C) System / Manual Test Cases

| Test Case ID | Test Case Title | Test Type | Description | Preconditions | Test Steps | Expected Result | Priority |
|---|---|---|---|---|---|---|---|
| ST-AUTH-01 | Demo Signup to Login Flow | System | Quick demo of complete user onboarding and login. | App running; no existing account with demo email. | 1) Register new user. 2) Login with new credentials. | User enters dashboard successfully. | High |
| ST-AUTH-02 | Demo Role-Based Access | System | Demonstrate Admin can access user/camera management while Staff is restricted. | Two accounts available: Admin and Staff. | 1) Login as Admin and open admin pages. 2) Login as Staff and retry same pages. | Admin access allowed; Staff access denied or hidden. | High |
| ST-AUTH-03 | Demo Password Reset + Logout | System | Demonstrate reset and logout user session behavior. | Existing test account; reset path enabled. | 1) Reset password. 2) Login with new password. 3) Logout and revisit protected page. | New password works; protected page blocked after logout. | Medium |
| ST-CAM-01 | Demo Add/Edit/Delete Camera | System | Demonstrate complete camera CRUD workflow from UI. | Admin/Manager logged in. | 1) Add camera. 2) Edit camera label/URL. 3) Delete camera. | Camera list reflects each operation correctly. | High |
| ST-CAM-02 | Demo Live Feed and Status Monitoring | System | Demonstrate live stream view and online/offline status tile. | At least one reachable camera source configured. | 1) Open live feed. 2) Observe status indicator. 3) Stop source to simulate offline (optional). | Feed displays when online; status updates accordingly. | High |
| ST-DET-01 | Demo PPE Violation Detection | System | Show PPE violation from sample clip/frame and violation entry creation. | Detection service running with test clip. | 1) Play PPE non-compliant clip. 2) Watch detection output. 3) Open violations history. | PPE violation appears in near real time and in history. | High |
| ST-DET-02 | Demo Spill and Dirty Surface Detection | System | Show spill/dirty-surface detection using prepared media. | Test media available. | 1) Run spill sample. 2) Run dirty-surface sample. 3) Check alerts/history. | Both violation categories are shown with timestamps. | High |
| ST-DET-03 | Demo Smoke/Fire and Pest Hazard Detection | System | Show smoke/fire and pest detection using prepared examples. | Hazard/pest model enabled. | 1) Run smoke/fire sample. 2) Run pest sample. 3) Verify logged alerts. | Hazard and pest alerts are visible in UI/history. | High |
| ST-ALT-01 | Demo Real-Time Alerts and Alert History | System | Demonstrate alert popup/notification and later retrieval in alert history page. | Browser open on dashboard with notifications enabled. | 1) Trigger one violation. 2) Observe immediate alert. 3) Open alert history page. | Real-time alert appears; same alert exists in history list. | High |
| ST-DASH-01 | Demo Dashboard Analytics and Branch View | System | Demonstrate violation statistics, index, trends, and branch-wise filter in one flow. | Data loaded for at least two branches. | 1) Open dashboard. 2) Switch branch filter. 3) Observe cards/charts/trends. | Metrics and charts update correctly per selected branch. | High |
| ST-SUB-01 | Demo Subscription and Payment Outcomes | System | Demonstrate viewing plans, successful subscription, and failed/cancelled payment path. | Payment gateway in test mode. | 1) Open plans. 2) Subscribe and complete success test payment. 3) Retry with fail/cancel test card. | Success redirects to success page and activates plan; failure redirects to failure page without activation. | High |
| ST-SUB-02 | Demo Subscription Status Page | System | Demonstrate that current plan and status are visible after transactions. | At least one prior subscription attempt completed. | 1) Open subscription status page. 2) Verify active/inactive state and plan details. | Status and plan information match transaction outcome. | Medium |
| ST-REP-01 | Demo Generate, Download, and Historical Violations | System | Demonstrate report generation, download, and viewing historical violations quickly. | Violation data available in selected date range. | 1) Open reports page. 2) Generate report with filter. 3) Download file. 4) Open historical violations view. | Report generated/downloaded successfully and historical list matches selected range. | High |

## Requirement Coverage Matrix

| Requirement ID | Requirement | Covered Test Cases |
|---|---|---|
| R1 | User Registration | UT-AUTH-01, IT-AUTH-01, ST-AUTH-01 |
| R2 | Login | IT-AUTH-01, ST-AUTH-01 |
| R3 | Logout | IT-AUTH-03, ST-AUTH-03 |
| R4 | Password Reset | IT-AUTH-02, ST-AUTH-03 |
| R5 | Role-Based Access (Admin, Manager, Staff) | UT-AUTH-03, ST-AUTH-02 |
| R6 | Add Camera | UT-CAM-01, IT-CAM-01, ST-CAM-01 |
| R7 | Edit Camera | UT-CAM-01, IT-CAM-02, ST-CAM-01 |
| R8 | Delete Camera | IT-CAM-03, ST-CAM-01 |
| R9 | Live Camera Feed | IT-CAM-02, ST-CAM-02 |
| R10 | Camera Status Monitoring | UT-CAM-02, ST-CAM-02 |
| R11 | Detect PPE Violations | UT-DET-01, IT-DET-01, ST-DET-01 |
| R12 | Detect Dirty Surfaces | IT-DET-02, ST-DET-02 |
| R13 | Detect Spills | UT-DET-02, IT-DET-02, ST-DET-02 |
| R14 | Detect Smoke/Fire Hazards | UT-DET-03, IT-DET-03, ST-DET-03 |
| R15 | Detect Pests | IT-DET-03, ST-DET-03 |
| R16 | Generate Violation Alert | UT-ALT-01, IT-ALT-01, ST-ALT-01 |
| R17 | Send Real-Time Notifications | IT-ALT-01, ST-ALT-01 |
| R18 | Alert History | IT-ALT-02, ST-ALT-01 |
| R19 | Violation Statistics | IT-DASH-01, ST-DASH-01 |
| R20 | Violation Index | UT-DASH-01, IT-DASH-01, ST-DASH-01 |
| R21 | Trends and Reports | UT-DASH-02, IT-DASH-01, ST-DASH-01 |
| R22 | Branch-wise Monitoring | IT-DASH-02, ST-DASH-01 |
| R23 | View Subscription Plans | IT-SUB-01, ST-SUB-01 |
| R24 | Subscribe to Plan | UT-SUB-01, IT-SUB-01, ST-SUB-01 |
| R25 | Payment Success | IT-SUB-02, ST-SUB-01 |
| R26 | Payment Failure | IT-SUB-03, ST-SUB-01 |
| R27 | Subscription Status | IT-SUB-02, IT-SUB-03, ST-SUB-02 |
| R28 | Generate Reports | UT-REP-01, IT-REP-01, ST-REP-01 |
| R29 | Download Reports | IT-REP-02, ST-REP-01 |
| R30 | View Historical Violations | IT-DET-01, IT-DET-02, ST-REP-01 |

## Notes for Demonstration

- Prioritize all High-priority System cases first: ST-AUTH-01, ST-AUTH-02, ST-CAM-01, ST-CAM-02, ST-DET-01, ST-ALT-01, ST-DASH-01, ST-SUB-01, ST-REP-01.
- Keep ready-made media clips for PPE, spill, smoke/fire, and pest events to ensure predictable outcomes in live demo.
- Use test payment mode to safely demonstrate both success and failure flows within minutes.
