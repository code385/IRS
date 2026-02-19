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
import { useTimesheetStore, WeekTimesheet } from '../../store/timesheetStore';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<any>;

const AdminRejectedDetailScreen: React.FC<Props> = ({ navigation }) => {
  const weeks = useTimesheetStore((s) => s.weeks);
  const isLoading = useTimesheetStore((s) => s.isLoading);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);

  useEffect(() => {
    loadWeeks();
  }, [loadWeeks]);

  const rejected = weeks.filter((w) => w.status === 'Rejected');

  const handleCardPress = useCallback(
    (weekId: string) => {
      navigation.navigate('AdminTimesheetDetail', { weekId });
    },
    [navigation],
  );

  const renderCard = useCallback(
    ({ item }: { item: WeekTimesheet }) => {
      const totalHours = item.days.reduce((s, d) => s + d.hours, 0);

      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleCardPress(item.id)}
          activeOpacity={0.85}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.employee}>{item.employeeName || 'Unknown'}</Text>
            <View style={[styles.badge, { backgroundColor: '#fecaca' }]}>
              <Text style={[styles.badgeText, { color: '#DC2626' }]}>Rejected</Text>
            </View>
          </View>
          <Text style={styles.week}>{item.label} – {item.weekStart}</Text>
          <Text style={styles.hours}>Total: {totalHours.toFixed(1)} h</Text>
          {item.rejectionComment && (
            <View style={styles.rejectReason}>
              <Text style={styles.rejectLabel}>Manager rejection reason:</Text>
              <Text style={styles.rejectText}>{item.rejectionComment}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [handleCardPress],
  );

  return (
    <AppLayout>
      <Text style={styles.title}>Rejected Timesheets</Text>
      <Text style={styles.subtitle}>Manager rejected – see reason below</Text>
      {isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
      <FlatList
        data={rejected}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderCard}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No Rejected Timesheets</Text>
            </View>
          ) : null
        }
      />
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  title: { ...typography.screenTitle, marginBottom: spacing.xs },
  subtitle: { ...typography.body, marginBottom: spacing.md, color: colors.textSecondary },
  loading: { paddingVertical: spacing.sm, alignItems: 'center' },
  list: { paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#fecaca',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
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
  rejectLabel: { ...typography.body, fontWeight: '600', marginBottom: spacing.xs, color: '#DC2626' },
  rejectText: { ...typography.body, color: colors.textPrimary },
  empty: { paddingVertical: spacing.xl, alignItems: 'center' },
  emptyText: { ...typography.body },
});

export default AdminRejectedDetailScreen;
