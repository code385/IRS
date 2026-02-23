import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AppLayout from '../../components/AppLayout';
import AppButton from '../../components/AppButton';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import { useTimesheetStore } from '../../store/timesheetStore';
import { useAuthStore } from '../../store/authStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any>;

const formatFullWeekRange = (weekStartString: string) => {
  const [dd, mm, yyyy] = weekStartString.split('/').map(Number);

  const startDate = new Date(yyyy, mm - 1, dd);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const days = [
    'Sunday','Monday','Tuesday','Wednesday',
    'Thursday','Friday','Saturday'
  ];

  const formatDate = (date: Date) => {
    const dayName = days[date.getDay()];
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${dayName} ${d}/${m}/${y}`;
  };

  return `${formatDate(startDate)} to ${formatDate(endDate)}`;
};

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

const MyTimesheetsScreen: React.FC<Props> = ({ navigation }) => {
  const user = useAuthStore((s) => s.user);
  const weeks = useTimesheetStore((s) => s.weeks);
  const isLoading = useTimesheetStore((s) => s.isLoading);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);

  const [statusFilter, setStatusFilter] = useState<
    'All' | 'Draft' | 'Submitted' | 'Approved' | 'Rejected'
  >('All');

  useEffect(() => {
    if (user?.id) loadWeeks(user.id);
  }, [user?.id, loadWeeks]);

  const filtered = useMemo(() => {
    if (statusFilter === 'All') return weeks;
    return weeks.filter((w) => w.status === statusFilter);
  }, [weeks, statusFilter]);

  const mapped = filtered.map((w) => {
    const totalHours = w.days.reduce((sum, d) => sum + d.hours, 0);

    return {
      id: w.id,
      weekRange: formatFullWeekRange(w.weekStart),
      totalHours,
      status: w.status,
      submitted: w.status === 'Submitted' ? 'Yes' : '-',
      approvedBy: w.status === 'Approved' ? 'Manager' : '-',
    };
  });

  return (
    <AppLayout>
      <Text style={styles.title}>My Timesheets</Text>

      {isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      <FlatList
        data={mapped}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: spacing.lg }}
        renderItem={({ item }) => (
          <View style={styles.card}>

            <View style={styles.cardRow}>
              <Text style={styles.weekRange}>{item.weekRange}</Text>
              <StatusBadge status={item.status} />
            </View>

            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Total hours</Text>
              <Text style={styles.cardValue}>
                {item.totalHours.toFixed(2)}
              </Text>
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
                onPress={() =>
                  navigation.navigate('WeekReview', {
                    weekId: item.id,
                    canEdit: false,
                  })
                }
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
  weekRange: {
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    paddingRight: spacing.sm,
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