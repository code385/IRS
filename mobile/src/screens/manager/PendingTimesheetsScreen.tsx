import React, { useEffect, useMemo, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppLayout from '../../components/AppLayout';
import AppButton from '../../components/AppButton';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import { useTimesheetStore } from '../../store/timesheetStore';

type Props = NativeStackScreenProps<any>;

const PendingTimesheetsScreen: React.FC<Props> = ({ navigation }) => {
  const weeks = useTimesheetStore((s) => s.weeks);
  const isLoading = useTimesheetStore((s) => s.isLoading);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);

  useEffect(() => {
    loadWeeks();
  }, [loadWeeks]);

  const pending = useMemo(() => weeks.filter((w) => w.status === 'Submitted'), [weeks]);

  const setWeekStatus = useTimesheetStore((s) => s.setWeekStatus);

  const handleApprove = useCallback(
    async (weekId: string) => {
      try {
        await setWeekStatus(weekId, 'Approved');
        await loadWeeks();
        Alert.alert('Approved', 'Timesheet approved successfully.');
      } catch (error: any) {
        Alert.alert('Error', error?.message || 'Failed to approve timesheet.');
      }
    },
    [setWeekStatus, loadWeeks]
  );

  const handleReject = useCallback(
    (weekId: string) => {
      navigation.navigate('ManagerTimesheetDetail', { weekId });
    },
    [navigation]
  );

  return (
    <AppLayout>
      {isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
      <FlatList
        data={pending}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: spacing.lg }}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
        renderItem={({ item }) => {
          const totalHours = item.days.reduce((sum, d) => sum + d.hours, 0);
          return (
            <View style={[styles.card, styles.highlight]}>
              <View style={styles.row}>
                <Text style={styles.employee}>{item.employeeName}</Text>
                <Text style={styles.week}>{item.label}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Week range</Text>
                <Text style={styles.value}>
                  {item.label} – {item.weekStart}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Total hours</Text>
                <Text style={styles.value}>{totalHours.toFixed(1)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Submitted</Text>
                <Text style={styles.value}>{item.label}</Text>
              </View>
              <View style={styles.buttons}>
                <AppButton
                  label="✓ Approve"
                  onPress={() => handleApprove(item.id)}
                />
                <AppButton
                  label="✗ Reject"
                  variant="secondary"
                  onPress={() => handleReject(item.id)}
                />
                <AppButton
                  label="View / Edit"
                  variant="secondary"
                  onPress={() => navigation.navigate('ManagerTimesheetDetail', { weekId: item.id })}
                />
              </View>
            </View>
          );
        }}
      />
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  highlight: {
    backgroundColor: '#fff9e6',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  employee: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  week: {
    color: colors.textSecondary,
  },
  label: {
    color: colors.textSecondary,
  },
  value: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  buttons: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  loading: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
});

export default PendingTimesheetsScreen;

