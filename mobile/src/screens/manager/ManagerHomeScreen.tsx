import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
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
  const { width } = useWindowDimensions();
  const isNarrow = width < 400;
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const weeks = useTimesheetStore((s) => s.weeks);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);

  useFocusEffect(
    useCallback(() => {
      loadWeeks();
    }, [loadWeeks])
  );

  const pending = weeks.filter((w) => w.status === 'Submitted').length;
  const approved = weeks.filter((w) => w.status === 'Approved').length;
  const rejected = weeks.filter((w) => w.status === 'Rejected').length;

  return (
    <AppLayout>
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.appTitle}>Timesheet Approvals</Text>
          <Text style={styles.appSubtitle}>Approver Dashboard</Text>
        </View>

        <View style={styles.headerRight}>
          <ProfileIcon userName={user?.name ?? 'Manager'} onLogout={logout} />
        </View>
      </View>

      <View style={[styles.statsRow, isNarrow && styles.statsRowNarrow]}>
        <View style={[styles.statCol, isNarrow && styles.statColHalf]}>
          <StatCard
            title="Pending"
            value={String(pending)}
            tone="warning"
            onPress={() => navigation.navigate('ManagerTimesheetList', { status: 'Submitted' })}
          />
        </View>
        <View style={[styles.statCol, isNarrow && styles.statColHalf]}>
          <StatCard
            title="Approved"
            value={String(approved)}
            tone="success"
            onPress={() => navigation.navigate('ManagerTimesheetList', { status: 'Approved' })}
          />
        </View>
        <View style={[styles.statCol, isNarrow && styles.statColFull]}>
          <StatCard
            title="Rejected"
            value={String(rejected)}
            tone="default"
            onPress={() => navigation.navigate('ManagerTimesheetList', { status: 'Rejected' })}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Pending Timesheets</Text>

      <AppButton
        label="Review Pending Timesheets"
        onPress={() => navigation.navigate('PendingTimesheets')}
        style={styles.cta}
      />
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  appTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  appSubtitle: { color: '#FFEBEE', marginTop: spacing.xs },

  headerRight: { overflow: 'visible' },

  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: -spacing.sm,
    marginRight: -spacing.sm,
    marginBottom: spacing.lg,
  },
  statsRowNarrow: {
    // wrapping enabled via flexWrap already
  },
  statCol: {
    width: '33.333%',
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    marginBottom: spacing.md,
  },
  statColHalf: {
    width: '50%',
  },
  statColFull: {
    width: '100%',
  },

  sectionTitle: { ...typography.sectionTitle, marginTop: spacing.md, marginBottom: spacing.md },
  cta: { marginTop: spacing.sm },
});

export default ManagerHomeScreen;
