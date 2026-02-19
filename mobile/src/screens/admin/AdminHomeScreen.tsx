import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useTimesheetStore } from '../../store/timesheetStore';
import AppLayout from '../../components/AppLayout';
import AppButton from '../../components/AppButton';
import StatCard from '../../components/StatCard';
import ProfileIcon from '../../components/ProfileIcon';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<any>;

const AdminHomeScreen: React.FC<Props> = ({ navigation }) => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const users = useUserStore((s) => s.users);
  const loadUsers = useUserStore((s) => s.loadUsers);
  const weeks = useTimesheetStore((s) => s.weeks);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);
  const isSuperAdmin = user?.role === 'Super Admin';
  const hideSuperAdmin = !isSuperAdmin;

  useEffect(() => {
    loadUsers();
    loadWeeks();
  }, [loadUsers, loadWeeks]);

  const filtered = hideSuperAdmin ? users.filter((u) => u.role !== 'Super Admin') : users;
  const activeCount = filtered.filter((u) => u.status === 'Active').length;
  const inactiveCount = filtered.filter((u) => u.status === 'Inactive').length;
  const blockedCount = filtered.filter((u) => u.status === 'Blocked').length;
  const openCount = weeks.filter((w) => w.status === 'Draft' || w.status === 'Submitted').length;
  const rejectedCount = weeks.filter((w) => w.status === 'Rejected').length;
  const totalHours = weeks.reduce((s, w) => s + w.days.reduce((a, d) => a + d.hours, 0), 0);

  return (
    <AppLayout>
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.appTitle}>
            {isSuperAdmin ? 'Super Admin' : 'Admin'} portal
          </Text>
          <Text style={styles.appSubtitle}>Manage users and timesheets</Text>
        </View>

        {/* ✅ ONLY ProfileIcon now */}
        <View style={styles.headerRight} pointerEvents="auto">
          <ProfileIcon
            userName={user?.name ?? (isSuperAdmin ? 'Super Admin' : 'Admin')}
            onLogout={logout}
          />
        </View>
      </View>

      <View style={styles.buttonRow}>
        <AppButton label="Manage Users" onPress={() => navigation.navigate('UserManagement')} />
        <AppButton
          label="View Timesheets"
          variant="secondary"
          onPress={() => navigation.navigate('Reports')}
        />
        <AppButton
          label="Export Timesheet (CSV)"
          variant="secondary"
          onPress={() => navigation.navigate('AdminExport')}
        />
      </View>

      <View style={styles.statsRow}>
        <StatCard
          title="Active users"
          subtitle={`Active: ${activeCount} | Inactive: ${inactiveCount} | Blocked: ${blockedCount}`}
          value={String(activeCount)}
          tone="success"
          onPress={() => navigation.navigate('UserStatsDetail', { hideSuperAdmin })}
          style={styles.statCard}
        />
        <StatCard
          title="Open Timesheets"
          value={String(openCount)}
          tone="warning"
          onPress={() => navigation.navigate('OpenTimesheetsDetail')}
          style={styles.statCard}
        />
        <StatCard
          title="Total Hours"
          value={totalHours.toFixed(0)}
          onPress={() => navigation.navigate('TotalHoursDetail')}
          style={styles.statCard}
        />
        <StatCard
          title="Rejected (by manager)"
          value={String(rejectedCount)}
          tone="default"
          onPress={() => navigation.navigate('AdminRejectedDetail')}
          style={styles.statCard}
        />
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    overflow: 'visible',
  },
  appTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  appSubtitle: {
    color: '#FFEBEE',
    marginTop: spacing.xs,
  },
  headerRight: {
    overflow: 'visible',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: 100,
  },
});

export default AdminHomeScreen;
