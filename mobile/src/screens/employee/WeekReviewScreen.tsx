import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { exportCsvAsFile } from '../../utils/csvExport';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppLayout from '../../components/AppLayout';
import AppButton from '../../components/AppButton';
import { useTimesheetStore } from '../../store/timesheetStore';
import { useAuthStore } from '../../store/authStore';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<any>;

const WeekReviewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { weekId, canEdit = false, showExport = false } = route.params ?? {};
  const user = useAuthStore((s) => s.user);
  const weeks = useTimesheetStore((s) => s.weeks);
  const submitWeek = useTimesheetStore((s) => s.submitWeek);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);

  useEffect(() => {
    // Reload weeks to ensure we have latest data
    if (user?.id) {
      loadWeeks(user.id);
    } else {
      loadWeeks();
    }
  }, [weekId, user?.id, loadWeeks]);

  const week = weeks.find((w) => w.id === weekId);

  if (!week) {
    return (
      <AppLayout>
        <Text style={styles.title}>Week not found</Text>
      </AppLayout>
    );
  }

  const handleSubmit = async () => {
    if (!week) {
      Alert.alert('Error', 'Week not found.');
      return;
    }

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
      if (user?.id) {
        await loadWeeks(user.id);
      } else {
        await loadWeeks();
      }
      Alert.alert('Submitted', 'Timesheet submitted to manager successfully.');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to submit timesheet. Please try again.');
    }
  };

  const totalHours = week.days.reduce((sum, d) => sum + d.hours, 0);

  const exportSingleWeek = async () => {
    const header = 'Employee,Week End,Week Start,Day,Hours,Status';
    const rows = week.days.map((d) =>
      [
        `"${week.employeeName}"`,
        `"${week.label}"`,
        `"${week.weekStart}"`,
        `"${d.label}"`,
        d.hours.toFixed(2),
        week.status,
      ].join(','),
    );
    const csv = [header, ...rows].join('\n');
    await exportCsvAsFile(csv, `timesheet_${week.employeeName || 'export'}`);
  };

  return (
    <AppLayout>
      <Text style={styles.title}>{week.label}</Text>
      
      <Text style={styles.meta}>Week End: {week.label}</Text>
      <Text style={styles.meta}>Week Start: {week.weekStart}</Text>
      <Text style={styles.meta}>Status: {week.status}</Text>

      <FlatList
        data={week.days}
        keyExtractor={(d) => d.id}
        style={{ marginTop: spacing.md }}
        contentContainerStyle={{ paddingBottom: spacing.lg }}
        renderItem={({ item: d }) => (
          <View style={styles.dayRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.dayLabel}>{d.label}</Text>
                <Text style={styles.dayHours}>{d.hours.toFixed(2)} h</Text>
              </View>
              {(d.jobNo || d.location || d.shiftType || d.startTime || d.finishTime) && (
                <View style={{ marginTop: 4 }}>
                  {d.jobNo && <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>Job: {d.jobNo}</Text>}
                  {d.location && <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>Location: {d.location}</Text>}
                  {d.shiftType && <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>Shift: {d.shiftType}</Text>}
                  {(d.startTime || d.finishTime) && (
                    <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{d.startTime || '–'} – {d.finishTime || '–'}</Text>
                  )}
                </View>
              )}
            </View>
            {canEdit && (
              <AppButton
                label="Edit"
                variant="secondary"
                onPress={() =>
                  navigation.navigate('DayTimesheetEntry', {
                    dayId: d.id,
                    dayLabel: d.label,
                    weekEndId: week.id,
                    weekEndLabel: week.label,
                    weekStart: week.weekStart,
                    initialHours: d.hours,
                    initialDayData: d,
                  })
                }
              />
            )}
          </View>
        )}
      />

      <Text style={styles.total}>Total: {totalHours.toFixed(2)} h</Text>

      {week.status === 'Draft' && (
        <AppButton label="Submit this week" onPress={handleSubmit} />
      )}

      {showExport && (
        <>
          <AppButton
            label="Export timesheet"
            onPress={exportSingleWeek}
          />
          <AppButton
            label="Edit week"
            variant="secondary"
            onPress={() => {
              const firstDay = week.days[0];
              if (!firstDay) return;
              navigation.navigate('DayTimesheetEntry', {
                dayId: firstDay.id,
                dayLabel: firstDay.label,
                weekEndId: week.id,
                weekEndLabel: week.label,
                weekStart: week.weekStart,
              });
            }}
          />
        </>
      )}
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  title: {
    ...typography.screenTitle,
    marginBottom: spacing.sm,
  },
  meta: {
    ...typography.body,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  dayHours: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  total: {
    marginBottom: spacing.lg,
    fontWeight: '600',
  },
});

export default WeekReviewScreen;

