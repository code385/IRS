import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { exportCsvAsFile } from '../../utils/csvExport';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppLayout from '../../components/AppLayout';
import AppButton from '../../components/AppButton';
import { useTimesheetStore } from '../../store/timesheetStore';
import { useAuthStore } from '../../store/authStore';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<any>;

const STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  Approved:  { bg: colors.successSurface, color: colors.success },
  Submitted: { bg: colors.infoSurface,    color: colors.info    },
  Rejected:  { bg: colors.errorSurface,   color: colors.error   },
  Draft:     { bg: colors.warningSurface, color: colors.warning },
};

const WeekReviewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { weekId, canEdit = false, showExport = false } = route.params ?? {};
  const user = useAuthStore((s) => s.user);
  const weeks = useTimesheetStore((s) => s.weeks);
  const submitWeek = useTimesheetStore((s) => s.submitWeek);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);

  useEffect(() => {
    if (user?.id) loadWeeks(user.id);
    else loadWeeks();
  }, [weekId, user?.id, loadWeeks]);

  const week = weeks.find((w) => w.id === weekId);

  if (!week) {
    return (
      <AppLayout>
        <Text style={styles.notFound}>Week not found</Text>
      </AppLayout>
    );
  }

  const handleSubmit = async () => {
    if (week.status !== 'Draft') {
      Alert.alert('Already submitted', 'This timesheet has already been submitted.');
      return;
    }
    if (!week.days || week.days.length === 0 || week.days.every((d) => d.hours === 0)) {
      Alert.alert('No hours', 'Please add at least one day with hours before submitting.');
      return;
    }
    try {
      await submitWeek(week.id);
      if (user?.id) await loadWeeks(user.id);
      else await loadWeeks();
      Alert.alert('Submitted', 'Timesheet submitted to manager successfully.');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to submit timesheet. Please try again.');
    }
  };

  const totalHours = week.days.reduce((sum, d) => sum + d.hours, 0);

  const exportSingleWeek = async () => {
    const header = 'Employee,Week End,Week Start,Day,Hours,Shift,LAFHA,Status';
    const rows = week.days.map((d) =>
      [`"${week.employeeName}"`, `"${week.label}"`, `"${week.weekStart}"`, `"${d.label}"`, d.hours.toFixed(2), d.shiftType || '', d.livingAway || '', week.status].join(',')
    );
    const csv = [header, ...rows].join('\n');
    await exportCsvAsFile(csv, `timesheet_${week.employeeName || 'export'}`);
  };

  const statusCfg = STATUS_CONFIG[week.status] ?? { bg: colors.background, color: colors.textMuted };

  return (
    <AppLayout>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.weekCard}>
          <View style={styles.weekCardHeader}>
            <View style={styles.weekCardTitle}>
              <Text style={styles.weekLabel}>{week.label}</Text>
              <Text style={styles.weekStart}>Week starting {week.weekStart}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
              <Text style={[styles.statusText, { color: statusCfg.color }]}>{week.status}</Text>
            </View>
          </View>

          <View style={styles.weekMeta}>
            {week.employeeName && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Employee</Text>
                <Text style={styles.metaValue}>{week.employeeName}</Text>
              </View>
            )}
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>On Standby</Text>
              <Text style={styles.metaValue}>{week.onStandby ?? '-'}</Text>
            </View>
            {(week.status === 'Approved' || week.status === 'Rejected') && (week.reviewedByName || week.reviewedByRole) && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{week.status === 'Approved' ? 'Approved By' : 'Rejected By'}</Text>
                <Text style={styles.metaValue}>{week.reviewedByName || 'Unknown'} ({week.reviewedByRole || 'Manager'})</Text>
              </View>
            )}
          </View>

          {week.status === 'Rejected' && week.rejectionComment && (
            <View style={styles.rejectCard}>
              <Text style={styles.rejectTitle}>Rejection Reason</Text>
              <Text style={styles.rejectText}>{week.rejectionComment}</Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Hours</Text>
            <Text style={styles.totalValue}>{totalHours.toFixed(2)} hrs</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Daily Breakdown</Text>

        {week.days.map((d) => (
          <View key={d.id} style={[styles.dayCard, d.hours === 0 && styles.dayCardEmpty]}>
            <View style={styles.dayCardTop}>
              <Text style={styles.dayCardLabel}>{d.label}</Text>
              <Text style={[styles.dayCardHours, d.hours > 0 ? styles.dayCardHoursActive : styles.dayCardHoursZero]}>
                {d.hours.toFixed(2)} hrs
              </Text>
            </View>
            {d.hours > 0 && (
              <View style={styles.dayCardDetails}>
                {d.jobNo && <Text style={styles.detailText}>Job: {d.jobNo}</Text>}
                {d.location && <Text style={styles.detailText}>Location: {d.location}</Text>}
                {(d.startTime || d.finishTime) && (
                  <Text style={styles.detailText}>{d.startTime || '–'} – {d.finishTime || '–'}</Text>
                )}
                {d.shiftType && <Text style={styles.detailText}>Shift: {d.shiftType}</Text>}
                {d.livingAway && <Text style={styles.detailText}>LAFHA: {d.livingAway}</Text>}
                {d.description && <Text style={styles.detailText} numberOfLines={2}>Note: {d.description}</Text>}
              </View>
            )}
            {canEdit && (
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate('DayTimesheetEntry', {
                  dayId: d.id, dayLabel: d.label, weekEndId: week.id, weekEndLabel: week.label,
                  weekStart: week.weekStart, onStandby: week.onStandby ?? 'No', initialHours: d.hours, initialDayData: d,
                })}
                activeOpacity={0.75}
              >
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <View style={styles.actions}>
          {week.status === 'Draft' && (
            <AppButton label="Submit This Week" onPress={handleSubmit} fullWidth />
          )}
          {showExport && (
            <>
              <AppButton label="Export Timesheet" onPress={exportSingleWeek} variant="secondary" fullWidth />
              <AppButton
                label="Edit Week"
                variant="secondary"
                onPress={() => {
                  const firstDay = week.days[0];
                  if (!firstDay) return;
                  navigation.navigate('DayTimesheetEntry', {
                    dayId: firstDay.id, dayLabel: firstDay.label, weekEndId: week.id,
                    weekEndLabel: week.label, weekStart: week.weekStart, onStandby: week.onStandby ?? 'No',
                  });
                }}
                fullWidth
              />
            </>
          )}
        </View>
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl },
  notFound: {
    fontSize: 17,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  weekCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  weekCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  weekCardTitle: { flex: 1, paddingRight: spacing.sm },
  weekLabel: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  weekStart: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
  },
  weekMeta: { gap: 4, marginBottom: spacing.sm },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
  },
  metaValue: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rejectCard: {
    backgroundColor: colors.errorSurface,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: `${colors.error}30`,
  },
  rejectTitle: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.error,
    marginBottom: 4,
  },
  rejectText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.5,
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
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayCardEmpty: {
    opacity: 0.6,
  },
  dayCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayCardLabel: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    paddingRight: spacing.sm,
  },
  dayCardHours: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
  },
  dayCardHoursActive: { color: colors.success },
  dayCardHoursZero: { color: colors.textMuted },
  dayCardDetails: {
    marginTop: 6,
    gap: 2,
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  editBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  editBtnText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textSecondary,
  },
  actions: { gap: 0, marginTop: spacing.sm },
});

export default WeekReviewScreen;
