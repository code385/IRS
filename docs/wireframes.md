Timesheet Mobile App – Wireframes (Text Description)
====================================================

This document describes the key screens and navigation flows for the Timesheet mobile app
for the three roles: Employee, Manager, and Admin.

## 1. Global Flow

- **Splash Screen**
  - Full-screen logo and app name (Infrastructure Renewal Services – Timesheet).
  - Briefly shows while the app checks for a stored JWT token.
  - If a valid session is found, automatically navigates to the appropriate role dashboard.
  - If not authenticated, navigates to the Login screen.

- **Login Screen**
  - Fields:
    - Username / Email
    - Password
  - Buttons:
    - `Login`
  - States:
    - Loading spinner while calling `/auth/login`.
    - Error banner for invalid credentials.

Layout (conceptual):

- Header: App logo and title.
- Middle: Form fields (username, password).
- Bottom: Login button and a subtle footer with version/build info.

## 2. Employee Flow

### 2.1 Employee Home (Dashboard)

- Header:
  - Greeting with employee name.
  - Current week date range (e.g., 18/08/2025 – 24/08/2025).
- Main content:
  - Card showing:
    - Total hours this week.
    - Status pill: Draft / Submitted / Approved / Rejected.
  - Action buttons:
    - `Fill Today`
    - `View Week`
    - `Send Week to Manager` (only when week status is Draft and has data).

### 2.2 Daily Timesheet Screen

Layout sections (similar to the paper/PDF form):

- **Date Row**
  - Date label + date picker (default to today).

- **Job & Site Section**
  - `Job` dropdown/search (job code + description).
  - `Site` dropdown (site name; optionally filtered by job).

- **Time Details**
  - `Start Time` (time picker).
  - `Finish Time` (time picker).
  - `Lunch`:
    - Toggle: Yes / No.
    - If Yes, numeric field for minutes or a dropdown (30 / 45 / 60).

- **Hours & Description**
  - Read-only `Hours Worked` field, auto-calculated from times minus lunch.
  - `Description of Work / Comment` multi-line text input.

- **Navigation / Actions**
  - `Save` button (or autosave on field blur).
  - Previous / Next day arrows within the current week.

### 2.3 Weekly Summary Screen

- Header:
  - Week date range.
  - Status pill.
- Body:
  - 7-row list (Mon–Sun) with:
    - Date
    - Job / Site summary
    - Hours worked
  - Footer showing total weekly hours.
- Actions:
  - `Send report to Admin/Manager` primary button.
  - Confirmation dialog before submission.

### 2.4 Submitted Week Details

- Read-only version of the Weekly Summary.
- Section for manager comments and approval history:
  - Each comment row shows actor (Manager/Admin), action (Approved/Rejected), timestamp, and message.
- If status is Rejected:
  - Visible banner with rejection reason.
  - `Edit & Resubmit` button that re-opens the week for editing (subject to business rules).

## 3. Manager Flow

### 3.1 Manager Home (Dashboard)

- Header:
  - Manager name and company.
- Key metrics cards:
  - `Pending Approvals` (count).
  - `Approved This Week`.
  - `Rejected This Week`.
- Filters row:
  - Week selector.
  - Employee selector (all / individual).

### 3.2 Pending Timesheets List

- List items per employee-week:
  - Employee name.
  - Week date range.
  - Total hours.
  - Status badge (Submitted).
  - Chevron icon to open details.

### 3.3 Timesheet Review Screen

- Header:
  - Employee name.
  - Week range.
  - Total hours.
- Body:
  - Expandable list per day with job, site, times, lunch, and description.
- Actions section:
  - Text area for manager comment.
  - `Approve` button.
  - `Reject` button (comment required).

## 4. Admin Flow

### 4.1 Admin Home (Dashboard)

- KPI cards:
  - Active employees.
  - Open (submitted but not approved) timesheets.
  - Total hours this week.
- Quick action tiles:
  - `Manage Users`
  - `Manage Jobs`
  - `Manage Sites`
  - `Reports`

### 4.2 User Management Screens

- **User List**
  - Table/list with:
    - Name
    - Username
    - Role (Admin / Manager / Employee)
    - Status (Active / Inactive)
  - Filters by role, status, search by name.

- **Create/Edit User**
  - Fields:
    - Name
    - Username
    - Role selector
    - Manager (for Employee role)
    - Initial password or reset password button.
  - Save / Cancel buttons.

### 4.3 Job & Site Management

- **Job List**
  - Job code, description, default site.
- **Site List**
  - Site name, address, optional GPS coordinates.
- Simple dialogs/forms for add/edit/delete with confirmation prompts.

### 4.4 Reports & Export

- Filter bar:
  - Date range.
  - Employee.
  - Job.
  - Site.
  - Status.
- Results table:
  - One row per employee-day or employee-week (configurable).
  - Columns: Employee, Job, Site, Date/Week, Hours, Status.
- Primary actions:
  - `Export CSV/Excel`.

## 5. Navigation Summary

- Unauthenticated stack:
  - `Splash` → `Login`.
- Authenticated stacks (based on role):
  - Employee: `EmployeeHome` ↔ `DailyTimesheet` ↔ `WeeklySummary` ↔ `SubmittedWeekDetails`.
  - Manager: `ManagerHome` ↔ `PendingTimesheets` ↔ `TimesheetReview`.
  - Admin: `AdminHome` ↔ `UserManagement` ↔ `JobManagement` ↔ `SiteManagement` ↔ `Reports`.

