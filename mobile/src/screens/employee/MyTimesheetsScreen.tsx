import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import AppLayout from '../../components/AppLayout';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import { useTimesheetStore } from '../../store/timesheetStore';
import { useAuthStore } from '../../store/authStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any>;

type StatusType = 'All' | 'Draft' | 'Submitted' | 'Approved' | 'Rejected';

const STATUS_FILTERS: StatusType[] = ['All', 'Submitted', 'Approved', 'Rejected', 'Draft'];

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  Approved:  { bg: colors.successSurface, color: colors.success,  label: 'Approved'  },
  Submitted: { bg: colors.infoSurface,    color: colors.info,     label: 'Submitted' },
  Rejected:  { bg: colors.errorSurface,   color: colors.error,    label: 'Rejected'  },
  Draft:     { bg: colors.warningSurface, color: colors.warning,  label: 'Draft'     },
};

const formatFullWeekRange = (weekStartString: string) => {
  const [dd, mm, yyyy] = weekStartString.split('/').map(Number);
  const startDate = new Date(yyyy, mm - 1, dd);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const fmt = (d: Date) => `${days[d.getDay()]} ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  return `${fmt(startDate)} – ${fmt(endDate)}`;
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { bg: colors.background, color: colors.textMuted, label: status };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const MyTimesheetsScreen: React.FC<Props> = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const user = useAuthStore((s) => s.user);
  const weeks = useTimesheetStore((s) => s.weeks);
  const isLoading = useTimesheetStore((s) => s.isLoading);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);
  const [statusFilter, setStatusFilter] = useState<StatusType>('All');
  const isCompact = width < 390;

  useEffect(() => {
    if (user?.id) loadWeeks(user.id);
  }, [user?.id, loadWeeks]);

  const filtered = useMemo(() => {
    if (statusFilter === 'All') return weeks;
    return weeks.filter((w) => w.status === statusFilter);
  }, [weeks, statusFilter]);

  const mapped = filtered.map((w) => {
    const totalHours = w.days.reduce((sum, d) => sum + d.hours, 0);
    const reviewerLabel =
      (w.status === 'Approved' || w.status === 'Rejected') && (w.reviewedByName || w.reviewedByRole)
        ? `${w.reviewedByName || 'Unknown'} (${w.reviewedByRole || 'Manager'})`
        : '-';
    return {
      id: w.id,
      weekRange: formatFullWeekRange(w.weekStart),
      totalHours,
      status: w.status,
      onStandby: w.onStandby ?? '-',
      reviewerLabel,
    };
  });

  const filterCounts = useMemo(
    () => ({
      All: weeks.length,
      Draft: weeks.filter((w) => w.status === 'Draft').length,
      Submitted: weeks.filter((w) => w.status === 'Submitted').length,
      Approved: weeks.filter((w) => w.status === 'Approved').length,
      Rejected: weeks.filter((w) => w.status === 'Rejected').length,
    }),
    [weeks]
  );

  return (
    <AppLayout>
      <Text style={styles.pageTitle}>My Timesheets</Text>

      <View style={[styles.filterRow, isCompact && styles.filterRowCompact]}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              isCompact && styles.filterChipCompact,
              statusFilter === f && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter(f)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterChipText, statusFilter === f && styles.filterChipTextActive]}>{f}</Text>
            <View style={[styles.filterCountBadge, statusFilter === f && styles.filterCountBadgeActive]}>
              <Text style={[styles.filterCountText, statusFilter === f && styles.filterCountTextActive]}>
                {filterCounts[f]}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      {!isLoading && mapped.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No timesheets found</Text>
          <Text style={styles.emptySubtitle}>
            {statusFilter === 'All' ? 'Start by creating a new timesheet.' : `No ${statusFilter.toLowerCase()} timesheets.`}
          </Text>
        </View>
      )}

      <FlatList
        data={mapped}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.weekRange} numberOfLines={1}>{item.weekRange}</Text>
              <StatusBadge status={item.status} />
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{item.totalHours.toFixed(2)}</Text>
                <Text style={styles.statLabel}>Total Hours</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{item.onStandby}</Text>
                <Text style={styles.statLabel}>On Standby</Text>
              </View>
              {item.reviewerLabel !== '-' && (
                <>
                  <View style={styles.statDivider} />
                  <View style={[styles.statItem, { flex: 2 }]}>
                    <Text style={styles.statValue} numberOfLines={1}>{item.reviewerLabel}</Text>
                    <Text style={styles.statLabel}>
                      {item.status === 'Approved' ? 'Approved By' : 'Rejected By'}
                    </Text>
                  </View>
                </>
              )}
            </View>

            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() => navigation.navigate('WeekReview', { weekId: item.id, canEdit: false })}
              activeOpacity={0.75}
            >
              <Text style={styles.viewBtnText}>View Details</Text>
            </TouchableOpacity>
          </View>
        )}
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
    marginBottom: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: spacing.md,
  },
  filterRowCompact: {
    gap: 8,
  },
  filterChip: {
    minWidth: 102,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  filterChipCompact: {
    minWidth: '48%',
    flexGrow: 1,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.16,
    elevation: 3,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterCountBadge: {
    minWidth: 24,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  filterCountBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  filterCountText: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterCountTextActive: {
    color: '#FFFFFF',
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    paddingBottom: 10,
  },
  weekRange: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    paddingRight: 8,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 0,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  viewBtn: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  viewBtnText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.2,
  },
  loading: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 17,
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

export default MyTimesheetsScreen;
