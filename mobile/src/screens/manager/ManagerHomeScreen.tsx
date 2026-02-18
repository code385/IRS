import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { useTimesheetStore } from '../../store/timesheetStore';
import AppLayout from '../../components/AppLayout';
import AppButton from '../../components/AppButton';
import StatCard from '../../components/StatCard';
import ProfileIcon from '../../components/ProfileIcon';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<any>;

const ManagerHomeScreen: React.FC<Props> = ({ navigation }) => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const weeks = useTimesheetStore((s) => s.weeks);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);

  useEffect(() => {
    loadWeeks();
  }, [loadWeeks]);

  const pending = weeks.filter((w) => w.status === 'Submitted').length;
  const approved = weeks.filter((w) => w.status === 'Approved').length;
  const rejected = weeks.filter((w) => w.status === 'Rejected').length;

  return (
    <AppLayout>
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.appTitle}>Timesheet approvals</Text>
          <Text style={styles.appSubtitle}>Approver dashboard</Text>
        </View>

        {/* ✅ ONLY ProfileIcon */}
        <View style={styles.headerRight}>
          <ProfileIcon userName={user?.name ?? 'Manager'} onLogout={logout} />
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard
          title="Pending approval"
          value={String(pending)}
          tone="warning"
          onPress={() =>
            navigation.navigate('ManagerTimesheetList', { status: 'Submitted' })
          }
        />
        <StatCard
          title="Approved"
          value={String(approved)}
          tone="success"
          onPress={() =>
            navigation.navigate('ManagerTimesheetList', { status: 'Approved' })
          }
        />
        <StatCard
          title="Rejected"
          value={String(rejected)}
          tone="default"
          onPress={() =>
            navigation.navigate('ManagerTimesheetList', { status: 'Rejected' })
          }
        />
      </View>

      <Text style={styles.sectionTitle}>Pending timesheets</Text>

      <AppButton
        label="Review pending timesheets"
        onPress={() => navigation.navigate('PendingTimesheets')}
        style={styles.cta}
      />
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
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  cta: {
    marginTop: spacing.sm,
  },
});

export default ManagerHomeScreen;
