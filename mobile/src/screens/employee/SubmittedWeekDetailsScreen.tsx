import React, { useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppLayout from '../../components/AppLayout';
import { useTimesheetStore } from '../../store/timesheetStore';
import { useAuthStore } from '../../store/authStore';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<any>;

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  Submitted: { color: colors.info,    bg: colors.infoSurface    },
  Approved:  { color: colors.success, bg: colors.successSurface },
  Rejected:  { color: colors.error,   bg: colors.errorSurface   },
  Draft:     { color: colors.warning, bg: colors.warningSurface },
};

const SubmittedWeekDetailsScreen: React.FC<Props> = ({ route }) => {
  const { weekId } = (route.params ?? {}) as { weekId?: string };
  const user = useAuthStore((s) => s.user);
  const weeks = useTimesheetStore((s) => s.weeks);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);

  useEffect(() => {
    if (user?.id) loadWeeks(user.id);
  }, [user?.id, loadWeeks]);

  const week = weekId ? weeks.find((w) => w.id === weekId) : null;

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
        <Text style={styles.pageTitle}>Timesheet Details</Text>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Timesheet not found.</Text>
        </View>
      </AppLayout>
    );
  }

  const cfg = STATUS_CONFIG[week.status] ?? STATUS_CONFIG.Submitted;

  return (
    <AppLayout>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Timesheet Details</Text>

        <View style={styles.weekCard}>
          <View style={[styles.weekCardAccent, { backgroundColor: cfg.color }]} />
          <View style={styles.weekCardBody}>
            <View style={styles.weekCardHeader}>
              <View>
                <Text style={styles.weekCardTitle}>{week.label}</Text>
                <Text style={styles.weekCardSub}>Week starting {week.weekStart}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{week.status}</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: cfg.color }]}>{totalHours.toFixed(1)}</Text>
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
        </View>

        {week.reviewedByName && (
          <View style={styles.reviewerCard}>
            <Text style={styles.reviewerLabel}>
              {week.status === 'Approved' ? 'Approved' : 'Reviewed'} by
            </Text>
            <Text style={styles.reviewerName}>{week.reviewedByName}</Text>
            {week.reviewedByRole && (
              <Text style={styles.reviewerRole}>{week.reviewedByRole}</Text>
            )}
          </View>
        )}

        {week.status === 'Rejected' && week.rejectionComment && (
          <View style={styles.rejectionCard}>
            <Text style={styles.rejectionLabel}>Rejection Reason</Text>
            <Text style={styles.rejectionText}>{week.rejectionComment}</Text>
          </View>
        )}

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
                    <Text style={styles.dayTime}>{d.startTime || '–'} – {d.finishTime || '–'}</Text>
                  )}
                  {(d.jobNo || d.location || d.shiftType) && (
                    <Text style={styles.dayMeta}>
                      {[d.jobNo, d.location, d.shiftType].filter(Boolean).join('  ·  ')}
                    </Text>
                  )}
                  {d.livingAway && (
                    <Text style={styles.dayMeta}>LAFHA: {d.livingAway}</Text>
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
            <Text style={[styles.totalValue, { color: cfg.color }]}>{totalHours.toFixed(1)} hrs</Text>
          </View>
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
  weekCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  weekCardAccent: { width: 5 },
  weekCardBody: { flex: 1 },
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
  reviewerCard: {
    backgroundColor: colors.successSurface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.success}30`,
    marginBottom: spacing.md,
  },
  reviewerLabel: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.success,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  reviewerName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  reviewerRole: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    marginTop: 1,
  },
  rejectionCard: {
    backgroundColor: colors.errorSurface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.error}30`,
    marginBottom: spacing.md,
  },
  rejectionLabel: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.error,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  rejectionText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: colors.error,
    lineHeight: 20,
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
    letterSpacing: -0.3,
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

export default SubmittedWeekDetailsScreen;
