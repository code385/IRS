import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
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

const OpenTimesheetsDetailScreen: React.FC<Props> = ({ navigation }) => {
  const weeks = useTimesheetStore((s) => s.weeks);
  const isLoading = useTimesheetStore((s) => s.isLoading);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);

  useEffect(() => {
    loadWeeks();
  }, [loadWeeks]);

  const submitted = weeks.filter((w) => w.status === 'Submitted');
  const draft = weeks.filter((w) => w.status === 'Draft');
  const approved = weeks.filter((w) => w.status === 'Approved');

  const handleCardPress = useCallback(
    (weekId: string) => {
      navigation.navigate('AdminTimesheetDetail', { weekId });
    },
    [navigation],
  );

  const renderCard = useCallback(
    ({ item }: { item: WeekTimesheet }) => {
      const totalHours = item.days.reduce((s, d) => s + d.hours, 0);
      const statusColor = statusColors[item.status] || colors.textSecondary;

      return (
        <TouchableOpacity
          style={[styles.card, { borderLeftColor: statusColor, borderLeftWidth: 4 }]}
          onPress={() => handleCardPress(item.id)}
          activeOpacity={0.85}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.employee}>{item.employeeName || 'Unknown'}</Text>
            <View style={[styles.badge, { backgroundColor: `${statusColor}22` }]}>
              <Text style={[styles.badgeText, { color: statusColor }]}>{item.status}</Text>
            </View>
          </View>
          <Text style={styles.week}>Week: {item.label} – {item.weekStart}</Text>
          <Text style={styles.hours}>Total: {totalHours.toFixed(1)} h</Text>
          <Text style={styles.tapHint}>Tap to view & edit</Text>
        </TouchableOpacity>
      );
    },
    [handleCardPress],
  );

  const Section = ({
    title,
    count,
    data,
    emptyText,
  }: {
    title: string;
    count: number;
    data: WeekTimesheet[];
    emptyText: string;
  }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {title} ({count})
      </Text>
      {data.length === 0 ? (
        <Text style={styles.emptyText}>{emptyText}</Text>
      ) : (
        data.map((item) => (
          <View key={item.id}>{renderCard({ item })}</View>
        ))
      )}
    </View>
  );

  return (
    <AppLayout>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Timesheets overview</Text>
        <Text style={styles.subtitle}>
          Submitted = pending manager approval | Approved = manager approved
        </Text>

        {isLoading && (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {!isLoading && (
          <>
            <Section
              title="Submitted (pending approval)"
              count={submitted.length}
              data={submitted}
              emptyText="No timesheets pending approval"
            />
            <Section
              title="Approved"
              count={approved.length}
              data={approved}
              emptyText="No approved timesheets"
            />
            <Section
              title="Draft"
              count={draft.length}
              data={draft}
              emptyText="No draft timesheets"
            />
          </>
        )}
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xl },
  title: { ...typography.screenTitle, marginBottom: spacing.xs },
  subtitle: { ...typography.body, marginBottom: spacing.lg, color: colors.textSecondary },
  loading: { paddingVertical: spacing.lg, alignItems: 'center' },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    ...typography.sectionTitle,
    marginBottom: spacing.md,
    color: colors.primary,
  },
  emptyText: { ...typography.body, color: colors.textSecondary, fontStyle: 'italic', marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
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
  employee: { fontWeight: '600', fontSize: 16, color: colors.textPrimary },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 8 },
  badgeText: { fontWeight: '600', fontSize: 12 },
  week: { ...typography.body, marginBottom: spacing.xs },
  hours: { fontWeight: '600', color: colors.primary },
  tapHint: { marginTop: spacing.xs, fontSize: 12, color: colors.textSecondary },
  list: { paddingBottom: spacing.xl },
});

export default OpenTimesheetsDetailScreen;
