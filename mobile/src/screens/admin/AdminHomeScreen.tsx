import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useTimesheetStore } from '../../store/timesheetStore';
import AppLayout from '../../components/AppLayout';
import AppButton from '../../components/AppButton';
import StatCard from '../../components/StatCard';
import NotificationBell from '../../components/NotificationBell';
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

  const firstName = user?.name?.split(' ')[0] ?? (isSuperAdmin ? 'Super Admin' : 'Admin');

  return (
    <AppLayout>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.greeting}>Hello, {firstName}</Text>
              <Text style={styles.headerSubtitle}>
                {isSuperAdmin ? 'Super Admin' : 'Admin'} Portal
              </Text>
            </View>

            <View style={styles.headerActions} pointerEvents="box-none">
              <View pointerEvents="auto">
                <NotificationBell
                  count={rejectedCount + openCount}
                  onPress={() => navigation.navigate('AdminRejectedDetail')}
                />
              </View>
              <View pointerEvents="auto" style={styles.profileWrap}>
                <ProfileIcon
                  userName={user?.name ?? (isSuperAdmin ? 'Super Admin' : 'Admin')}
                  onLogout={logout}
                />
              </View>
            </View>
          </View>

          <View style={styles.headerMetaRow}>
            <View style={styles.metaBadge}>
              <View style={styles.metaDot} />
              <Text style={styles.metaText}>{filtered.length} team members</Text>
            </View>
            <View style={styles.metaBadge}>
              <Text style={styles.metaText}>{openCount} open timesheets</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Management</Text>
        <View style={styles.buttonGrid}>
          <AppButton
            label="Manage Users"
            variant="secondary"
            onPress={() => navigation.navigate('UserManagement')}
            fullWidth
          />
          <AppButton
            label="View Timesheets"
            variant="secondary"
            onPress={() => navigation.navigate('Reports')}
            fullWidth
          />
          <AppButton
            label="Export CSV"
            variant="secondary"
            onPress={() => navigation.navigate('AdminExport')}
            fullWidth
          />
        </View>

        <Text style={styles.sectionLabel}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Active Users"
            subtitle={`Inactive: ${inactiveCount}  |  Blocked: ${blockedCount}`}
            value={String(activeCount)}
            tone="success"
            onPress={() => navigation.navigate('UserStatsDetail', { hideSuperAdmin })}
            style={styles.statHalf}
          />
          <StatCard
            title="Open Timesheets"
            subtitle="Draft + Submitted"
            value={String(openCount)}
            tone="warning"
            onPress={() => navigation.navigate('OpenTimesheetsDetail')}
            style={styles.statHalf}
          />
          <StatCard
            title="Total Hours"
            subtitle="All employees"
            value={totalHours.toFixed(0)}
            tone="info"
            onPress={() => navigation.navigate('TotalHoursDetail')}
            style={styles.statHalf}
          />
          <StatCard
            title="Rejected"
            subtitle="By manager"
            value={String(rejectedCount)}
            tone="error"
            onPress={() => navigation.navigate('AdminRejectedDetail')}
            style={styles.statHalf}
          />
        </View>
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
  },
  header: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 6,
    overflow: 'visible',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    overflow: 'visible',
  },
  headerTitleWrap: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    overflow: 'visible',
  },
  profileWrap: {
    zIndex: 999999,
    elevation: 999999,
  },
  headerMetaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 5,
  },
  metaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.85)',
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  buttonGrid: {
    gap: 0,
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statHalf: {
    flex: 1,
    minWidth: 140,
  },
});

export default AdminHomeScreen;
