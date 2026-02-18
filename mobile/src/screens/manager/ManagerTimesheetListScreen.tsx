import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppLayout from '../../components/AppLayout';
import { useTimesheetStore, WeekTimesheet, TimesheetStatus } from '../../store/timesheetStore';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<any>;

const statusColors: Record<TimesheetStatus, string> = {
  Draft: colors.textSecondary,
  Submitted: colors.warning,
  Approved: colors.success,
  Rejected: '#DC2626',
};

const ManagerTimesheetListScreen: React.FC<Props> = ({ route, navigation }) => {
  const { status } = route.params ?? { status: 'Submitted' as TimesheetStatus };
  const weeks = useTimesheetStore((s) => s.weeks);
  const isLoading = useTimesheetStore((s) => s.isLoading);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);

  useEffect(() => {
    loadWeeks();
  }, [loadWeeks]);

  const filtered = weeks.filter((w) => w.status === status);

  const handleCardPress = useCallback(
    (weekId: string) => {
      navigation.navigate('ManagerTimesheetDetail', { weekId });
    },
    [navigation],
  );

  const renderCard = useCallback(
    ({ item }: { item: WeekTimesheet }) => {
      const totalHours = item.days.reduce((s, d) => s + d.hours, 0);
      const statusColor = statusColors[item.status] || colors.textSecondary;

      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleCardPress(item.id)}
          activeOpacity={0.85}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.employee}>{item.employeeName || 'Unknown'}</Text>
            <View style={[styles.badge, { backgroundColor: `${statusColor}22` }]}>
              <Text style={[styles.badgeText, { color: statusColor }]}>{item.status}</Text>
            </View>
          </View>
          <Text style={styles.week}>{item.label} – {item.weekStart}</Text>
          <Text style={styles.hours}>Total: {totalHours.toFixed(1)} h</Text>
          {item.rejectionComment && (
            <View style={styles.rejectReason}>
              <Text style={styles.rejectLabel}>Rejection reason:</Text>
              <Text style={styles.rejectText}>{item.rejectionComment}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [handleCardPress],
  );

  const title =
    status === 'Submitted'
      ? 'Pending approval'
      : status === 'Approved'
        ? 'Approved'
        : 'Rejected';

  return (
    <AppLayout>
      <Text style={styles.title}>{title}</Text>
      {isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderCard}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No timesheets</Text>
            </View>
          ) : null
        }
      />
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  title: { ...typography.screenTitle, marginBottom: spacing.md },
  loading: { paddingVertical: spacing.sm, alignItems: 'center' },
  list: { paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  employee: { ...typography.sectionTitle, fontSize: 17 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 8 },
  badgeText: { fontWeight: '600', fontSize: 12 },
  week: { ...typography.body, color: colors.textPrimary, marginBottom: spacing.xs },
  hours: { fontWeight: '600', color: colors.primary },
  rejectReason: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rejectLabel: { ...typography.body, fontWeight: '600', marginBottom: spacing.xs },
  rejectText: { ...typography.body, color: colors.textSecondary },
  empty: { paddingVertical: spacing.xl, alignItems: 'center' },
  emptyText: { ...typography.body },
});

export default ManagerTimesheetListScreen;
