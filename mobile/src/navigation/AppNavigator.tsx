import React, { lazy, Suspense, useEffect, useLayoutEffect, useRef } from 'react';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';

// ─── Eagerly loaded (always needed on startup) ────────────────────────────────
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';

// ─── Lazy loaded (only when user navigates there) ─────────────────────────────
const EmployeeHomeScreen        = lazy(() => import('../screens/employee/EmployeeHomeScreen'));
const DailyTimesheetScreen      = lazy(() => import('../screens/employee/DailyTimesheetScreen'));
const DayTimesheetEntryScreen   = lazy(() => import('../screens/employee/DayTimesheetEntryScreen'));
const WeeklySummaryScreen       = lazy(() => import('../screens/employee/WeeklySummaryScreen'));
const SubmittedWeekDetailsScreen= lazy(() => import('../screens/employee/SubmittedWeekDetailsScreen'));
const MyTimesheetsScreen        = lazy(() => import('../screens/employee/MyTimesheetsScreen'));
const DraftTimesheetsScreen     = lazy(() => import('../screens/employee/DraftTimesheetsScreen'));
const WeekReviewScreen          = lazy(() => import('../screens/employee/WeekReviewScreen'));

const ManagerHomeScreen         = lazy(() => import('../screens/manager/ManagerHomeScreen'));
const PendingTimesheetsScreen   = lazy(() => import('../screens/manager/PendingTimesheetsScreen'));
const TimesheetReviewScreen     = lazy(() => import('../screens/manager/TimesheetReviewScreen'));
const ManagerTimesheetListScreen= lazy(() => import('../screens/manager/ManagerTimesheetListScreen'));
const ManagerTimesheetDetailScreen = lazy(() => import('../screens/manager/ManagerTimesheetDetailScreen'));

const AdminHomeScreen           = lazy(() => import('../screens/admin/AdminHomeScreen'));
const UserManagementScreen      = lazy(() => import('../screens/admin/UserManagementScreen'));
const UserStatsDetailScreen     = lazy(() => import('../screens/admin/UserStatsDetailScreen'));
const OpenTimesheetsDetailScreen= lazy(() => import('../screens/admin/OpenTimesheetsDetailScreen'));
const TotalHoursDetailScreen    = lazy(() => import('../screens/admin/TotalHoursDetailScreen'));
const ReportsScreen             = lazy(() => import('../screens/admin/ReportsScreen'));
const AdminTimesheetDetailScreen= lazy(() => import('../screens/admin/AdminTimesheetDetailScreen'));
const AdminRejectedDetailScreen = lazy(() => import('../screens/admin/AdminRejectedDetailScreen'));
const AdminExportScreen         = lazy(() => import('../screens/admin/AdminExportScreen'));
const UserEditScreen            = lazy(() => import('../screens/admin/UserEditScreen'));

// ─── Fallback shown while a lazy screen loads ─────────────────────────────────
function ScreenLoader() {
  return (
    <View style={navStyles.loader}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

function withSuspense(Component: React.ComponentType<any>) {
  return function WrappedScreen(props: any) {
    return (
      <Suspense fallback={<ScreenLoader />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

export type RootStackParamList = {
  Splash: undefined;
  Auth: { mode: 'login' | 'signup'; role?: 'Super Admin' | 'Admin' | 'Manager' | 'Employee' } | undefined;
  Main: undefined;
};

const WEB_TITLE = 'IRS Timesheet';

const RootStack  = createNativeStackNavigator<RootStackParamList>();
const AuthStack  = createNativeStackNavigator();
const EmployeeStack = createNativeStackNavigator();
const ManagerStack  = createNativeStackNavigator();
const AdminStack    = createNativeStackNavigator();
const Tabs          = createBottomTabNavigator();

function AuthStackNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login"  component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

function EmployeeStackNavigator() {
  return (
    <EmployeeStack.Navigator>
      <EmployeeStack.Screen name="EmployeeHome"        component={withSuspense(EmployeeHomeScreen)}        options={{ title: 'Employee Dashboard' }} />
      <EmployeeStack.Screen name="DailyTimesheet"      component={withSuspense(DailyTimesheetScreen)}      options={{ title: 'Home' }} />
      <EmployeeStack.Screen name="DayTimesheetEntry"   component={withSuspense(DayTimesheetEntryScreen)}   options={{ title: 'Main Page' }} />
      <EmployeeStack.Screen name="MyTimesheets"        component={withSuspense(MyTimesheetsScreen)}        options={{ title: 'My Timesheets' }} />
      <EmployeeStack.Screen name="DraftTimesheets"     component={withSuspense(DraftTimesheetsScreen)}     options={{ title: 'Draft Timesheets' }} />
      <EmployeeStack.Screen name="WeekReview"          component={withSuspense(WeekReviewScreen)}          options={{ title: 'Review Week' }} />
      <EmployeeStack.Screen name="WeeklySummary"       component={withSuspense(WeeklySummaryScreen)}       options={{ title: 'Weekly Summary' }} />
      <EmployeeStack.Screen name="SubmittedWeekDetails"component={withSuspense(SubmittedWeekDetailsScreen)}options={{ title: 'Week Details' }} />
    </EmployeeStack.Navigator>
  );
}

function ManagerStackNavigator() {
  return (
    <ManagerStack.Navigator>
      <ManagerStack.Screen name="ManagerHome"          component={withSuspense(ManagerHomeScreen)}            options={{ title: 'Manager Dashboard' }} />
      <ManagerStack.Screen name="PendingTimesheets"    component={withSuspense(PendingTimesheetsScreen)}      options={{ title: 'Pending Timesheets' }} />
      <ManagerStack.Screen name="TimesheetReview"      component={withSuspense(TimesheetReviewScreen)}        options={{ title: 'Review Timesheet' }} />
      <ManagerStack.Screen name="ManagerTimesheetList" component={withSuspense(ManagerTimesheetListScreen)}   options={{ title: 'Timesheets' }} />
      <ManagerStack.Screen name="ManagerTimesheetDetail" component={withSuspense(ManagerTimesheetDetailScreen)} options={{ title: 'Timesheet detail' }} />
      <ManagerStack.Screen name="DayTimesheetEntry"    component={withSuspense(DayTimesheetEntryScreen)}      options={{ title: 'Edit day' }} />
      <ManagerStack.Screen name="WeekReview"           component={withSuspense(WeekReviewScreen)}             options={{ title: 'Week Details' }} />
    </ManagerStack.Navigator>
  );
}

function AdminStackNavigator() {
  return (
    <AdminStack.Navigator>
      <AdminStack.Screen name="AdminHome"             component={withSuspense(AdminHomeScreen)}             options={{ title: 'Admin Dashboard' }} />
      <AdminStack.Screen name="UserManagement"        component={withSuspense(UserManagementScreen)}        options={{ title: 'Users' }} />
      <AdminStack.Screen name="UserEdit"              component={withSuspense(UserEditScreen)}              options={{ title: 'User' }} />
      <AdminStack.Screen name="UserStatsDetail"       component={withSuspense(UserStatsDetailScreen)}       options={{ title: 'User status' }} />
      <AdminStack.Screen name="OpenTimesheetsDetail"  component={withSuspense(OpenTimesheetsDetailScreen)}  options={{ title: 'Open timesheets' }} />
      <AdminStack.Screen name="TotalHoursDetail"      component={withSuspense(TotalHoursDetailScreen)}      options={{ title: 'Total hours' }} />
      <AdminStack.Screen name="Reports"               component={withSuspense(ReportsScreen)}               options={{ title: 'Timesheets' }} />
      <AdminStack.Screen name="AdminTimesheetDetail"  component={withSuspense(AdminTimesheetDetailScreen)}  options={{ title: 'Timesheet detail' }} />
      <AdminStack.Screen name="AdminRejectedDetail"   component={withSuspense(AdminRejectedDetailScreen)}   options={{ title: 'Rejected timesheets' }} />
      <AdminStack.Screen name="AdminExport"           component={withSuspense(AdminExportScreen)}           options={{ title: 'Export timesheet' }} />
      <AdminStack.Screen name="DayTimesheetEntry"     component={withSuspense(DayTimesheetEntryScreen)}     options={{ title: 'Edit day' }} />
    </AdminStack.Navigator>
  );
}

function MainTabs() {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return (
      <View style={navStyles.signingOut}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (user.role === 'Super Admin' || user.role === 'Admin') {
    return (
      <Tabs.Navigator screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="Admin" component={AdminStackNavigator} />
      </Tabs.Navigator>
    );
  }

  if (user.role === 'Manager') {
    return (
      <Tabs.Navigator screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="Manager" component={ManagerStackNavigator} />
      </Tabs.Navigator>
    );
  }

  return (
    <Tabs.Navigator screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="Employee" component={EmployeeStackNavigator} />
    </Tabs.Navigator>
  );
}

const navStyles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  signingOut: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
});

export default function AppNavigator() {
  const user = useAuthStore((s) => s.user);
  const isReauthenticating = useAuthStore((s) => s.isReauthenticating);
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const setTitle = () => { if (document.title !== WEB_TITLE) document.title = WEB_TITLE; };
    setTitle();
    const id = window.setInterval(setTitle, 300);
    return () => window.clearInterval(id);
  }, []);

  useLayoutEffect(() => {
    if (!user && !isReauthenticating && navigationRef.current?.isReady()) {
      const state = navigationRef.current.getState();
      const currentRoute = state?.routes[state?.index];
      if (currentRoute?.name === 'Main') {
        navigationRef.current.dispatch(
          CommonActions.reset({ index: 0, routes: [{ name: 'Auth', state: { index: 0, routes: [{ name: 'Login' }] } }] })
        );
      }
    }
  }, [user, isReauthenticating]);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => { if (Platform.OS === 'web') document.title = WEB_TITLE; }}
      onStateChange={() => { if (Platform.OS === 'web') document.title = WEB_TITLE; }}
    >
      <RootStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
        <RootStack.Screen name="Splash" component={SplashScreen} />
        <RootStack.Screen name="Auth"   component={AuthStackNavigator} />
        <RootStack.Screen name="Main"   component={MainTabs} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
