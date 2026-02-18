# IRS Timesheet Mobile Application

React Native (Expo) app for Admin, Manager, and Employee timesheet flows.

## Tech Stack

- **Frontend**: React Native (Expo), TypeScript, React Navigation, Zustand (in-memory state).
- **Font**: Lato (via `@expo-google-fonts/lato`).

## Project Structure

- `mobile/`
  - `src/`
    - `navigation/` – React Navigation (Auth, Employee, Manager, Admin).
    - `screens/` – Splash, Login, Signup, dashboards, timesheet entry, drafts, reports.
    - `components/` – AppLayout, AppButton, AppTextInput, StatCard.
    - `store/` – authStore, timesheetStore, userStore (Zustand).
    - `services/` – mock API (login, timesheet).
    - `theme/` – colors, spacing, typography.

## Run

```bash
cd mobile
npm install
npx expo start
```

## Build APK (EAS)

```bash
cd mobile
$env:EAS_NO_VCS="1"
eas build -p android --profile preview
```

Download the APK from the build URL when the build finishes.
