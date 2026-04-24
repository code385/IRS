import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppLayout from '../../components/AppLayout';
import AppTextInput from '../../components/AppTextInput';
import AppButton from '../../components/AppButton';
import { useTimesheetStore } from '../../store/timesheetStore';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<any>;

const TimesheetReviewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { weekId } = route.params ?? {};
  const weeks = useTimesheetStore((s) => s.weeks);
  const setWeekStatus = useTimesheetStore((s) => s.setWeekStatus);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { loadWeeks(); }, [loadWeeks]);

  const week = weeks.find((w) => w.id === weekId);

  const totalHours = useMemo(
    () => (week ? week.days.reduce((s, d) => s + d.hours, 0) : 0),
    [week],
  );
  const daysWorked = useMemo(
    () => (week ? week.days.filter((d) => d.hours > 0).length : 0),
    [week],
  );

  if (!week) {
    return (
      <AppLayout>
        <Text style={styles.pageTitle}>Review Timesheet</Text>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Timesheet not found.</Text>
        </View>
      </AppLayout>
    );
  }

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await setWeekStatus(week.id, 'Approved');
      await loadWeeks();
      Alert.alert('Approved', 'Timesheet approved successfully.');
      navigation.navigate('ManagerHome');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to approve timesheet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      Alert.alert('Comment required', 'Please explain why you are rejecting this timesheet.');
      return;
    }
    setIsSubmitting(true);
    try {
      await setWeekStatus(week.id, 'Rejected', comment.trim());
      await loadWeeks();
      Alert.alert('Rejected', 'Timesheet rejected.');
      navigation.navigate('ManagerHome');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to reject timesheet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Review Timesheet</Text>

        <View style={styles.summaryCard}>
          <View style={styles.employeeRow}>
            <View style={styles.employeeAvatar}>
              <Text style={styles.employeeAvatarText}>
                {(week.employeeName || 'U').trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
              </Text>
            </View>
            <View style={styles.employeeInfo}>
              <Text style={styles.employeeName}>{week.employeeName || 'Unknown'}</Text>
              <Text style={styles.weekRange}>{week.label} – {week.weekStart}</Text>
            </View>
            <View style={styles.submittedBadge}>
              <Text style={styles.submittedBadgeText}>Submitted</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalHours.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Total Hours</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{daysWorked}</Text>
              <Text style={styles.statLabel}>Days Worked</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{week.onStandby === 'Yes' ? 'Yes' : 'No'}</Text>
              <Text style={styles.statLabel}>On Standby</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Daily Entries</Text>

        <View style={styles.daysCard}>
          {week.days.map((d, index) => {
            const isEmpty = d.hours === 0;
            return (
              <View
                key={d.id}
                style={[styles.dayRow, index === 0 && styles.dayRowFirst, isEmpty && styles.dayRowEmpty]}
              >
                <View style={styles.dayLeft}>
                  <Text style={[styles.dayLabel, isEmpty && styles.dayLabelEmpty]}>{d.label}</Text>
                  {(d.startTime || d.finishTime) && (
                    <Text style={styles.dayMeta}>{d.startTime || '–'} – {d.finishTime || '–'}</Text>
                  )}
                  {(d.jobNo || d.location || d.shiftType || d.livingAway) && (
                    <Text style={styles.dayMeta}>
                      {[d.jobNo && `Job: ${d.jobNo}`, d.location, d.shiftType, d.livingAway && `LAFHA: ${d.livingAway}`]
                        .filter(Boolean).join('  ·  ')}
                    </Text>
                  )}
                </View>
                <Text style={[styles.dayHours, isEmpty && styles.dayHoursEmpty]}>
                  {isEmpty ? '–' : `${d.hours.toFixed(1)} hrs`}
                </Text>
              </View>
            );
          })}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{totalHours.toFixed(1)} hrs</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Decision</Text>

        <View style={styles.commentCard}>
          <AppTextInput
            label="Comment (required for rejection)"
            placeholder="Explain why you are rejecting this timesheet..."
            multiline
            value={comment}
            onChangeText={setComment}
            style={styles.commentInput}
          />
        </View>

        <View style={styles.decisionRow}>
          <AppButton
            label={isSubmitting ? '...' : 'Approve'}
            onPress={handleApprove}
            disabled={isSubmitting}
            style={styles.approveBtn}
          />
          <AppButton
            label={isSubmitting ? '...' : 'Reject'}
            variant="secondary"
            onPress={handleReject}
            disabled={isSubmitting}
            style={styles.rejectBtn}
          />
        </View>
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl },
  pageTitle: {
    fontSize: 24,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  employeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeAvatarText: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.primary,
  },
  employeeInfo: { flex: 1 },
  employeeName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  weekRange: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    marginTop: 2,
  },
  submittedBadge: {
    backgroundColor: colors.infoSurface,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  submittedBadgeText: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.info,
  },
  statsRow: {
    flexDirection: 'row',
    padding: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  daysCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dayRowFirst: { borderTopWidth: 0 },
  dayRowEmpty: { opacity: 0.5 },
  dayLeft: { flex: 1 },
  dayLabel: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dayLabelEmpty: {
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
  },
  dayMeta: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    marginTop: 2,
  },
  dayHours: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.primary,
  },
  dayHoursEmpty: {
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  totalLabel: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.3,
  },
  commentCard: {
    marginBottom: spacing.md,
  },
  commentInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  decisionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  approveBtn: {
    flex: 1,
    backgroundColor: colors.success,
  },
  rejectBtn: {
    flex: 1,
  },
  empty: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
  },
});

export default TimesheetReviewScreen;
