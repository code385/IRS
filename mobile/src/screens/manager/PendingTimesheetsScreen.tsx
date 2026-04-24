import React, { useEffect, useMemo, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppLayout from '../../components/AppLayout';
import AppButton from '../../components/AppButton';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import { useTimesheetStore } from '../../store/timesheetStore';

type Props = NativeStackScreenProps<any>;

const PendingTimesheetsScreen: React.FC<Props> = ({ navigation }) => {
  const weeks = useTimesheetStore((s) => s.weeks);
  const isLoading = useTimesheetStore((s) => s.isLoading);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);
  const setWeekStatus = useTimesheetStore((s) => s.setWeekStatus);

  useEffect(() => { loadWeeks(); }, [loadWeeks]);

  const pending = useMemo(() => weeks.filter((w) => w.status === 'Submitted'), [weeks]);

  const handleApprove = useCallback(async (weekId: string) => {
    try {
      await setWeekStatus(weekId, 'Approved');
      await loadWeeks();
      Alert.alert('Approved', 'Timesheet approved successfully.');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to approve timesheet.');
    }
  }, [setWeekStatus, loadWeeks]);

  return (
    <AppLayout>
      <Text style={styles.pageTitle}>Pending Review</Text>
      <Text style={styles.pageSubtitle}>{pending.length} timesheet{pending.length !== 1 ? 's' : ''} awaiting approval</Text>

      {isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      <FlatList
        data={pending}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        removeClippedSubviews
        renderItem={({ item }) => {
          const totalHours = item.days.reduce((sum, d) => sum + d.hours, 0);
          const daysWorked = item.days.filter((d) => d.hours > 0).length;
          return (
            <View style={styles.card}>
              <View style={styles.cardAccent} />
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <Text style={styles.employeeName}>{item.employeeName || 'Unknown'}</Text>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>Pending</Text>
                  </View>
                </View>

                <Text style={styles.weekRange}>{item.label} – {item.weekStart}</Text>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{totalHours.toFixed(1)}</Text>
                    <Text style={styles.statLabel}>Total Hrs</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{daysWorked}</Text>
                    <Text style={styles.statLabel}>Days</Text>
                  </View>
                  {item.onStandby && item.onStandby !== '-' && (
                    <>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{item.onStandby}</Text>
                        <Text style={styles.statLabel}>Standby</Text>
                      </View>
                    </>
                  )}
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleApprove(item.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.reviewBtn}
                    onPress={() => navigation.navigate('ManagerTimesheetDetail', { weekId: item.id })}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.reviewBtnText}>Review / Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySubtitle}>No timesheets pending your review.</Text>
            </View>
          ) : null
        }
      />
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: 24,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    marginBottom: spacing.md,
    marginTop: 2,
  },
  loading: { paddingVertical: spacing.sm, alignItems: 'center' },
  list: { paddingBottom: spacing.xl },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  cardAccent: {
    width: 4,
    backgroundColor: colors.warning,
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  employeeName: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  pendingBadge: {
    backgroundColor: colors.warningSurface,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.warning,
  },
  weekRange: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  statItem: { alignItems: 'center' },
  statValue: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveBtn: {
    flex: 1,
    backgroundColor: colors.success,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  approveBtnText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  reviewBtnText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textSecondary,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default PendingTimesheetsScreen;
