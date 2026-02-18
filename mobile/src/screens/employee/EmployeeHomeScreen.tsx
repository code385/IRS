import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { useTimesheetStore } from '../../store/timesheetStore';
import AppLayout from '../../components/AppLayout';
import AppButton from '../../components/AppButton';
import StatCard from '../../components/StatCard';
import ProfileIcon from '../../components/ProfileIcon';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<any>;

const EmployeeHomeScreen: React.FC<Props> = ({ navigation }) => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const weeks = useTimesheetStore((s) => s.weeks);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);

  useEffect(() => {
    if (user?.id) loadWeeks(user.id);
  }, [user?.id, loadWeeks]);

  const myWeeks = weeks;
  const hoursThisWeek = myWeeks.reduce(
    (s, w) => s + w.days.reduce((a, d) => a + d.hours, 0),
    0
  );
  const approved = myWeeks.filter((w) => w.status === 'Approved').length;
  const pending = myWeeks.filter((w) => w.status === 'Submitted').length;
  const drafts = myWeeks.filter((w) => w.status === 'Draft').length;

  return (
    <AppLayout>
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.appTitle}>IRS Timesheet Portal</Text>
          <Text style={styles.appSubtitle}>Employee dashboard</Text>
        </View>

        {/* ✅ ONLY ProfileIcon */}
        <View style={styles.headerRight}>
          <ProfileIcon userName={user?.name ?? 'Employee'} onLogout={logout} />
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard title="Total hours" value={hoursThisWeek.toFixed(1)} />
        <StatCard title="Approved" value={String(approved)} tone="success" />
        <StatCard title="Pending approval" value={String(pending)} tone="warning" />
        <StatCard title="Drafts" value={String(drafts)} />
      </View>

      <View style={styles.buttonRow}>
        <AppButton
          label="+ New timesheet"
          onPress={() => navigation.navigate('DailyTimesheet')}
        />
        <AppButton
          label="My timesheets"
          variant="secondary"
          onPress={() => navigation.navigate('MyTimesheets')}
        />
        <AppButton
          label="View drafts"
          variant="secondary"
          onPress={() => navigation.navigate('DraftTimesheets')}
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  buttonRow: {
    marginTop: spacing.lg,
  },
});

export default EmployeeHomeScreen;
