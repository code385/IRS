import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useTimesheetStore } from '../../store/timesheetStore';
import AppLayout from '../../components/AppLayout';
import AppButton from '../../components/AppButton';
import ProfileIcon from '../../components/ProfileIcon';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<any>;

type StatPillProps = {
  label: string;
  value: number;
  color: string;
  bg: string;
  onPress: () => void;
};

function StatPill({ label, value, color, bg, onPress }: StatPillProps) {
  return (
    <TouchableOpacity style={[styles.statPill, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.75}>
      <Text style={[styles.statPillValue, { color }]}>{value}</Text>
      <Text style={[styles.statPillLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const ManagerHomeScreen: React.FC<Props> = ({ navigation }) => {
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

  const firstName = user?.name?.split(' ')[0] ?? 'Manager';

  return (
    <AppLayout>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Hello, {firstName}</Text>
              <Text style={styles.headerSubtitle}>Approver Dashboard</Text>
            </View>
            <ProfileIcon userName={user?.name ?? 'Manager'} onLogout={logout} />
          </View>

          <View style={styles.statsRow}>
            <StatPill
              label="Pending"
              value={pending}
              color={colors.warning}
              bg={colors.warningSurface}
              onPress={() => navigation.navigate('ManagerTimesheetList', { status: 'Submitted' })}
            />
            <StatPill
              label="Approved"
              value={approved}
              color={colors.success}
              bg={colors.successSurface}
              onPress={() => navigation.navigate('ManagerTimesheetList', { status: 'Approved' })}
            />
            <StatPill
              label="Rejected"
              value={rejected}
              color={colors.error}
              bg={colors.errorSurface}
              onPress={() => navigation.navigate('ManagerTimesheetList', { status: 'Rejected' })}
            />
          </View>
        </View>

        {pending > 0 && (
          <View style={styles.alertBanner}>
            <View style={styles.alertDot} />
            <Text style={styles.alertText}>
              {pending} timesheet{pending !== 1 ? 's' : ''} waiting for your review
            </Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>Actions</Text>

        <AppButton
          label="Review Pending Timesheets"
          onPress={() => navigation.navigate('PendingTimesheets')}
          fullWidth
        />
        <AppButton
          label="All Timesheets"
          variant="secondary"
          onPress={() => navigation.navigate('ManagerTimesheetList', { status: 'Submitted' })}
          fullWidth
        />
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
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
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
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statPill: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  statPillValue: {
    fontSize: 22,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statPillLabel: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningSurface,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.warning}40`,
    gap: 8,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warning,
  },
  alertText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.warning,
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
});

export default ManagerHomeScreen;
