import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import AppLayout from '../../components/AppLayout';
import AppButton from '../../components/AppButton';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import { useTimesheetStore } from '../../store/timesheetStore';
import { useAuthStore } from '../../store/authStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

function StatusBadge({ status }: { status: string }) {
  let backgroundColor = colors.background;
  let textColor = colors.textPrimary;

  if (status === 'Approved') {
    backgroundColor = '#dff6dd';
    textColor = colors.success;
  } else if (status === 'Submitted') {
    backgroundColor = '#cfe4ff';
    textColor = '#004578';
  } else if (status === 'Rejected') {
    backgroundColor = '#fde7e9';
    textColor = '#a80000';
  } else if (status === 'Draft') {
    backgroundColor = '#fff4ce';
    textColor = '#8a6d3b';
  }

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.badgeText, { color: textColor }]}>{status}</Text>
    </View>
  );
}

type Props = NativeStackScreenProps<any>;

const MyTimesheetsScreen: React.FC<Props> = ({ navigation }) => {
  const user = useAuthStore((s) => s.user);
  const weeks = useTimesheetStore((s) => s.weeks);
  const isLoading = useTimesheetStore((s) => s.isLoading);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Draft' | 'Submitted' | 'Approved' | 'Rejected'>('All');
  const [dateFilter, setDateFilter] = useState<
    'All' | 'Last7Days' | 'Last30Days' | 'Last90Days' | 'Last180Days' | 'Last365Days'
  >('Last30Days');
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);

  useEffect(() => {
    if (user?.id) loadWeeks(user.id);
  }, [user?.id, loadWeeks]);

  const filtered = useMemo(() => {
    let result = weeks.slice();
    if (statusFilter !== 'All') {
      result = result.filter((w) => w.status === statusFilter);
    }
    if (dateFilter !== 'All') {
      const now = new Date();
      const daysBack =
        dateFilter === 'Last7Days'
          ? 7
          : dateFilter === 'Last30Days'
          ? 30
          : dateFilter === 'Last90Days'
          ? 90
          : dateFilter === 'Last180Days'
          ? 180
          : 365;

      const cutoff = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - daysBack,
      );

      result = result.filter((w) => {
        // weekStart is in DD/MM/YYYY
        const [dd, mm, yyyy] = (w.weekStart || '').split('/');
        if (!dd || !mm || !yyyy) return true;
        const weekDate = new Date(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10));
        return weekDate >= cutoff;
      });
    }
    return result;
  }, [weeks, statusFilter, dateFilter]);

  const mapped = filtered.map((w) => {
    const totalHours = w.days.reduce((sum, d) => sum + d.hours, 0);
    return {
      id: w.id,
      weekLabel: w.label,
      weekStart: w.weekStart,
      weekEnd: w.label,
      totalHours,
      status: w.status,
      submitted: w.status === 'Submitted' ? w.label : '-',
      approvedBy: w.status === 'Approved' ? 'Manager' : '-',
    };
  });

  return (
    <AppLayout>
      <Text style={styles.title}>My timesheets</Text>
      {isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
      <View style={styles.filtersRow}>
        <View style={styles.filter}>
          <Text style={styles.filterLabel}>Filter by status</Text>
          <View style={styles.filterBox}>
            <TouchableOpacity
              style={styles.dropdownHeader}
              onPress={() => setIsStatusOpen((prev) => !prev)}
            >
              <Text style={styles.filterValue}>{statusFilter}</Text>
              <Text style={styles.dropdownArrow}>{isStatusOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {isStatusOpen && (
              <View style={styles.dropdownList}>
                {['All', 'Draft', 'Submitted', 'Approved', 'Rejected'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    onPress={() => {
                      setStatusFilter(status as typeof statusFilter);
                      setIsStatusOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItem}>{status}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
        <View style={styles.filter}>
          <Text style={styles.filterLabel}>Date range</Text>
          <View style={styles.filterBox}>
            <TouchableOpacity
              style={styles.dropdownHeader}
              onPress={() => setIsDateOpen((prev) => !prev)}
            >
              <Text style={styles.filterValue}>
                {dateFilter === 'All'
                  ? 'All time'
                  : dateFilter === 'Last7Days'
                  ? 'Last 7 days'
                  : dateFilter === 'Last30Days'
                  ? 'Last 30 days'
                  : dateFilter === 'Last90Days'
                  ? 'Last 3 months'
                  : dateFilter === 'Last180Days'
                  ? 'Last 6 months'
                  : 'Last 12 months'}
              </Text>
              <Text style={styles.dropdownArrow}>{isDateOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {isDateOpen && (
              <View style={styles.dropdownList}>
                {[
                  { value: 'All', label: 'All time' },
                  { value: 'Last7Days', label: 'Last 7 days' },
                  { value: 'Last30Days', label: 'Last 30 days' },
                  { value: 'Last90Days', label: 'Last 3 months' },
                  { value: 'Last180Days', label: 'Last 6 months' },
                  { value: 'Last365Days', label: 'Last 12 months' },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => {
                      setDateFilter(opt.value as typeof dateFilter);
                      setIsDateOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItem}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>

      <FlatList
        data={mapped}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: spacing.lg }}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardWeek}>{item.weekLabel}</Text>
              <StatusBadge status={item.status} />
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Week range</Text>
              <Text style={styles.cardValue}>
                {item.weekEnd} – {item.weekStart}
              </Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Total hours</Text>
              <Text style={styles.cardValue}>{item.totalHours.toFixed(1)}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Submitted</Text>
              <Text style={styles.cardValue}>{item.submitted}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Approved by</Text>
              <Text style={styles.cardValue}>{item.approvedBy}</Text>
            </View>
            <View style={styles.viewButton}>
              <AppButton
                label="View"
                onPress={() => navigation.navigate('WeekReview', { weekId: item.id, canEdit: false })}
                variant="secondary"
              />
            </View>
          </View>
        )}
      />
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  title: {
    ...typography.screenTitle,
    marginBottom: spacing.md,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  filter: {
    flex: 1,
  },
  filterLabel: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  filterBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  filterValue: {
    color: colors.textPrimary,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownArrow: {
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  dropdownList: {
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dropdownItem: {
    paddingVertical: spacing.xs,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardWeek: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  cardValue: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewButton: {
    marginTop: spacing.sm,
    alignItems: 'flex-start',
  },
  loading: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
});

export default MyTimesheetsScreen;

