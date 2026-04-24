import React, { useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppLayout from '../../components/AppLayout';
import AppButton from '../../components/AppButton';
import { useTimesheetStore } from '../../store/timesheetStore';
import { useAuthStore } from '../../store/authStore';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<any>;

const WeeklySummaryScreen: React.FC<Props> = ({ route, navigation }) => {
  const { weekId } = (route.params ?? {}) as { weekId?: string };
  const user = useAuthStore((s) => s.user);
  const weeks = useTimesheetStore((s) => s.weeks);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);
  const submitWeek = useTimesheetStore((s) => s.submitWeek);

  useEffect(() => {
    if (user?.id) loadWeeks(user.id);
  }, [user?.id, loadWeeks]);

  const week = weekId ? weeks.find((w) => w.id === weekId) : weeks[0];

  const totalHours = useMemo(
    () => (week ? week.days.reduce((s, d) => s + d.hours, 0) : 0),
    [week],
  );

  const daysWorked = useMemo(
    () => (week ? week.days.filter((d) => d.hours > 0).length : 0),
    [week],
  );

  const handleSubmit = async () => {
    if (!week) return;
    try {
      await submitWeek(week.id);
      Alert.alert('Submitted', 'Your weekly timesheet has been sent to your manager.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not submit timesheet.');
    }
  };

  if (!week) {
    return (
      <AppLayout>
        <Text style={styles.pageTitle}>Weekly Summary</Text>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No timesheet data found.</Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Weekly Summary</Text>
        <Text style={styles.pageSubtitle}>Review before submitting to manager</Text>

        <View style={styles.weekCard}>
          <View style={styles.weekCardHeader}>
            <View>
              <Text style={styles.weekCardTitle}>{week.label}</Text>
              <Text style={styles.weekCardSub}>Week starting {week.weekStart}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: colors.warningSurface }]}>
              <Text style={[styles.statusBadgeText, { color: colors.warning }]}>{week.status}</Text>
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

        <Text style={styles.sectionLabel}>Daily Breakdown</Text>

        <View style={styles.daysCard}>
          {week.days.map((d, index) => {
            const isEmpty = d.hours === 0;
            return (
              <View
                key={d.id}
                style={[
                  styles.dayRow,
                  index === 0 && styles.dayRowFirst,
                  isEmpty && styles.dayRowEmpty,
                ]}
              >
                <View style={styles.dayLeft}>
                  <Text style={[styles.dayLabel, isEmpty && styles.dayLabelEmpty]}>{d.label}</Text>
                  {(d.startTime || d.finishTime) && (
                    <Text style={styles.dayTime}>{d.startTime || '–'} – {d.finishTime || '–'}</Text>
                  )}
                  {(d.jobNo || d.shiftType) && (
                    <Text style={styles.dayMeta}>
                      {[d.jobNo, d.shiftType].filter(Boolean).join('  ·  ')}
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

        {week.status === 'Draft' && (
          <View style={styles.submitSection}>
            <AppButton
              label="Submit to Manager"
              onPress={handleSubmit}
              fullWidth
            />
            <Text style={styles.submitHint}>
              Once submitted, your manager will review and approve or reject this timesheet.
            </Text>
          </View>
        )}

        {week.status !== 'Draft' && (
          <View style={styles.alreadySubmitted}>
            <Text style={styles.alreadySubmittedText}>
              This timesheet has already been {week.status.toLowerCase()}.
            </Text>
          </View>
        )}
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
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  weekCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  weekCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  weekCardTitle: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  weekCardSub: {
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
  statusBadgeText: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
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
  dayRowFirst: {
    borderTopWidth: 0,
  },
  dayRowEmpty: {
    opacity: 0.5,
  },
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
  dayTime: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    marginTop: 2,
  },
  dayMeta: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    marginTop: 1,
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
  submitSection: {
    gap: spacing.sm,
  },
  submitHint: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },
  alreadySubmitted: {
    backgroundColor: colors.infoSurface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.info}30`,
  },
  alreadySubmittedText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: colors.info,
    textAlign: 'center',
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

export default WeeklySummaryScreen;
