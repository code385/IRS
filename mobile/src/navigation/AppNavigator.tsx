import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';

import EmployeeHomeScreen from '../screens/employee/EmployeeHomeScreen';
import DailyTimesheetScreen from '../screens/employee/DailyTimesheetScreen';
import DayTimesheetEntryScreen from '../screens/employee/DayTimesheetEntryScreen';
import WeeklySummaryScreen from '../screens/employee/WeeklySummaryScreen';
import SubmittedWeekDetailsScreen from '../screens/employee/SubmittedWeekDetailsScreen';
import MyTimesheetsScreen from '../screens/employee/MyTimesheetsScreen';
import DraftTimesheetsScreen from '../screens/employee/DraftTimesheetsScreen';
import WeekReviewScreen from '../screens/employee/WeekReviewScreen';

import ManagerHomeScreen from '../screens/manager/ManagerHomeScreen';
import PendingTimesheetsScreen from '../screens/manager/PendingTimesheetsScreen';
import TimesheetReviewScreen from '../screens/manager/TimesheetReviewScreen';
import ManagerTimesheetListScreen from '../screens/manager/ManagerTimesheetListScreen';
import ManagerTimesheetDetailScreen from '../screens/manager/ManagerTimesheetDetailScreen';

import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import UserStatsDetailScreen from '../screens/admin/UserStatsDetailScreen';
import OpenTimesheetsDetailScreen from '../screens/admin/OpenTimesheetsDetailScreen';
import TotalHoursDetailScreen from '../screens/admin/TotalHoursDetailScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';
import AdminTimesheetDetailScreen from '../screens/admin/AdminTimesheetDetailScreen';
import AdminRejectedDetailScreen from '../screens/admin/AdminRejectedDetailScreen';
import AdminExportScreen from '../screens/admin/AdminExportScreen';
import UserEditScreen from '../screens/admin/UserEditScreen';

import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';

export type RootStackParamList = {
  Splash: undefined;
  Auth:
    | { mode: 'login' | 'signup'; role?: 'Super Admin' | 'Admin' | 'Manager' | 'Employee' }
    | undefined;
  Main: undefined;
};

const WEB_TITLE = 'IRS Timesheet';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator();
const EmployeeStack = createNativeStackNavigator();
const ManagerStack = createNativeStackNavigator();
const AdminStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function AuthStackNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

function EmployeeStackNavigator() {
  return (
    <EmployeeStack.Navigator>
      <EmployeeStack.Screen
        name="EmployeeHome"
        component={EmployeeHomeScreen}
        options={{ title: 'Employee Dashboard' }}
      />
      <EmployeeStack.Screen name="DailyTimesheet" component={DailyTimesheetScreen} options={{ title: 'Home' }} />
      <EmployeeStack.Screen
        name="DayTimesheetEntry"
        component={DayTimesheetEntryScreen}
        options={{ title: 'Main Page' }}
      />
      <EmployeeStack.Screen name="MyTimesheets" component={MyTimesheetsScreen} options={{ title: 'My Timesheets' }} />
      <EmployeeStack.Screen
        name="DraftTimesheets"
        component={DraftTimesheetsScreen}
        options={{ title: 'Draft Timesheets' }}
      />
      <EmployeeStack.Screen name="WeekReview" component={WeekReviewScreen} options={{ title: 'Review Week' }} />
      <EmployeeStack.Screen
        name="WeeklySummary"
        component={WeeklySummaryScreen}
        options={{ title: 'Weekly Summary' }}
      />
      <EmployeeStack.Screen
        name="SubmittedWeekDetails"
        component={SubmittedWeekDetailsScreen}
        options={{ title: 'Week Details' }}
      />
    </EmployeeStack.Navigator>
  );
}

function ManagerStackNavigator() {
  return (
    <ManagerStack.Navigator>
      <ManagerStack.Screen
        name="ManagerHome"
        component={ManagerHomeScreen}
        options={{ title: 'Manager Dashboard' }}
      />
      <ManagerStack.Screen
        name="PendingTimesheets"
        component={PendingTimesheetsScreen}
        options={{ title: 'Pending Timesheets' }}
      />
      <ManagerStack.Screen
        name="TimesheetReview"
        component={TimesheetReviewScreen}
        options={{ title: 'Review Timesheet' }}
      />
      <ManagerStack.Screen
        name="ManagerTimesheetList"
        component={ManagerTimesheetListScreen}
        options={{ title: 'Timesheets' }}
      />
      <ManagerStack.Screen
        name="ManagerTimesheetDetail"
        component={ManagerTimesheetDetailScreen}
        options={{ title: 'Timesheet detail' }}
      />
      <ManagerStack.Screen
        name="DayTimesheetEntry"
        component={DayTimesheetEntryScreen}
        options={{ title: 'Edit day' }}
      />
      <ManagerStack.Screen name="WeekReview" component={WeekReviewScreen} options={{ title: 'Week Details' }} />
    </ManagerStack.Navigator>
  );
}

function AdminStackNavigator() {
  return (
    <AdminStack.Navigator>
      <AdminStack.Screen name="AdminHome" component={AdminHomeScreen} options={{ title: 'Admin Dashboard' }} />
      <AdminStack.Screen name="UserManagement" component={UserManagementScreen} options={{ title: 'Users' }} />
      <AdminStack.Screen name="UserEdit" component={UserEditScreen} options={{ title: 'User' }} />
      <AdminStack.Screen name="UserStatsDetail" component={UserStatsDetailScreen} options={{ title: 'User status' }} />
      <AdminStack.Screen
        name="OpenTimesheetsDetail"
        component={OpenTimesheetsDetailScreen}
        options={{ title: 'Open timesheets' }}
      />
      <AdminStack.Screen
        name="TotalHoursDetail"
        component={TotalHoursDetailScreen}
        options={{ title: 'Total hours' }}
      />
      <AdminStack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Timesheets' }} />
      <AdminStack.Screen
        name="AdminTimesheetDetail"
        component={AdminTimesheetDetailScreen}
        options={{ title: 'Timesheet detail' }}
      />
      <AdminStack.Screen
        name="AdminRejectedDetail"
        component={AdminRejectedDetailScreen}
        options={{ title: 'Rejected timesheets' }}
      />
      <AdminStack.Screen name="AdminExport" component={AdminExportScreen} options={{ title: 'Export timesheet' }} />
      <AdminStack.Screen
        name="DayTimesheetEntry"
        component={DayTimesheetEntryScreen}
        options={{ title: 'Edit day' }}
      />
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
  signingOut: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

export default function AppNavigator() {
  const user = useAuthStore((s) => s.user);
  const isReauthenticating = useAuthStore((s) => s.isReauthenticating);
  const navigationRef = useRef<any>(null);

  // ✅ Hard-lock browser tab title on WEB (works on Vercel too)
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const setTitle = () => {
      if (document.title !== WEB_TITLE) {
        document.title = WEB_TITLE;
      }
    };

    setTitle(); // initial
    const intervalId = window.setInterval(setTitle, 300); // keep constant even if overwritten
    return () => window.clearInterval(intervalId);
  }, []);

  // Redirect to login when user is null AND not during admin re-login (user creation)
  useLayoutEffect(() => {
    if (!user && !isReauthenticating && navigationRef.current?.isReady()) {
      const state = navigationRef.current.getState();
      const currentRoute = state?.routes[state?.index];

      if (currentRoute?.name === 'Main') {
        navigationRef.current.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'Auth',
                state: {
                  index: 0,
                  routes: [{ name: 'Login' }],
                },
              },
            ],
          })
        );
      }
    }
  }, [user, isReauthenticating]);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        if (Platform.OS === 'web') document.title = WEB_TITLE;
      }}
      onStateChange={() => {
        if (Platform.OS === 'web') document.title = WEB_TITLE;
      }}
    >
      <RootStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
        <RootStack.Screen name="Splash" component={SplashScreen} />
        <RootStack.Screen name="Auth" component={AuthStackNavigator} />
        <RootStack.Screen name="Main" component={MainTabs} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}