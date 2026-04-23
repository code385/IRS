import React, { lazy, Suspense, useEffect, useLayoutEffect, useRef } from 'react';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';

/** Tab icons drawn with pure React Native — no @expo/vector-icons needed */
function TabIcon({ type, color, size }: { type: 'employee' | 'manager' | 'admin'; color: string; size: number }) {
  if (type === 'employee') {
    // Clock icon: circle + hour/minute hands
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1.8, borderColor: color, justifyContent: 'center', alignItems: 'center' }}>
          {/* Hour hand */}
          <View style={{ position: 'absolute', bottom: '50%', left: '50%', width: 1.5, height: size * 0.26, backgroundColor: color, borderRadius: 1, marginLeft: -0.75, transformOrigin: 'bottom', transform: [{ rotate: '-20deg' }] }} />
          {/* Minute hand */}
          <View style={{ position: 'absolute', bottom: '50%', left: '50%', width: 1.5, height: size * 0.33, backgroundColor: color, borderRadius: 1, marginLeft: -0.75, transformOrigin: 'bottom', transform: [{ rotate: '80deg' }] }} />
          {/* Center dot */}
          <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
        </View>
      </View>
    );
  }

  if (type === 'manager') {
    // Clipboard with checkmark
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        {/* Clipboard body */}
        <View style={{ width: size * 0.78, height: size * 0.88, borderWidth: 1.8, borderColor: color, borderRadius: 3, justifyContent: 'center', alignItems: 'center' }}>
          {/* Clip at top */}
          <View style={{ position: 'absolute', top: -4, width: size * 0.34, height: 6, borderWidth: 1.8, borderColor: color, borderRadius: 2, backgroundColor: colors.background }} />
          {/* Checkmark lines */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 }}>
            <View style={{ width: size * 0.16, height: 1.5, backgroundColor: color, transform: [{ rotate: '45deg' }], marginRight: 1 }} />
            <View style={{ width: size * 0.3, height: 1.5, backgroundColor: color, transform: [{ rotate: '-50deg' }] }} />
          </View>
        </View>
      </View>
    );
  }

  // Admin: shield
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Shield shape using border + borderRadius trick */}
      <View style={{
        width: size * 0.72,
        height: size * 0.82,
        borderWidth: 1.8,
        borderColor: color,
        borderRadius: 4,
        borderBottomLeftRadius: size * 0.36,
        borderBottomRightRadius: size * 0.36,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {/* Checkmark inside shield */}
        <Text style={{ color, fontSize: size * 0.32, fontWeight: '700', marginTop: 2 }}>✓</Text>
      </View>
    </View>
  );
}

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

const TAB_BAR_STYLE = {
  backgroundColor: colors.surface,
  borderTopWidth: 1,
  borderTopColor: colors.border,
  height: Platform.OS === 'ios' ? 80 : 64,
  paddingBottom: Platform.OS === 'ios' ? 20 : 8,
  paddingTop: 8,
  elevation: 8,
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowOffset: { width: 0, height: -2 },
  shadowRadius: 8,
};

const TAB_LABEL_STYLE = {
  fontSize: 11,
  fontWeight: '600' as const,
  letterSpacing: 0.3,
};

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
      <Tabs.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: TAB_BAR_STYLE,
          tabBarLabelStyle: TAB_LABEL_STYLE,
        }}
      >
        <Tabs.Screen
          name="Admin"
          component={AdminStackNavigator}
          options={{
            tabBarLabel: user.role === 'Super Admin' ? 'Super Admin' : 'Admin',
            tabBarIcon: ({ color, size }) => (
              <TabIcon type="admin" color={color} size={size} />
            ),
          }}
        />
      </Tabs.Navigator>
    );
  }

  if (user.role === 'Manager') {
    return (
      <Tabs.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: TAB_BAR_STYLE,
          tabBarLabelStyle: TAB_LABEL_STYLE,
        }}
      >
        <Tabs.Screen
          name="Manager"
          component={ManagerStackNavigator}
          options={{
            tabBarLabel: 'Manager',
            tabBarIcon: ({ color, size }) => (
              <TabIcon type="manager" color={color} size={size} />
            ),
          }}
        />
      </Tabs.Navigator>
    );
  }

  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: TAB_BAR_STYLE,
        tabBarLabelStyle: TAB_LABEL_STYLE,
      }}
    >
      <Tabs.Screen
        name="Employee"
        component={EmployeeStackNavigator}
        options={{
          tabBarLabel: 'My Timesheets',
          tabBarIcon: ({ color, size }) => (
            <TabIcon type="employee" color={color} size={size} />
          ),
        }}
      />
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
