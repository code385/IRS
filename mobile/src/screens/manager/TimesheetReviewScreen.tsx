import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppLayout from '../../components/AppLayout';
import AppTextInput from '../../components/AppTextInput';
import AppButton from '../../components/AppButton';
import { useTimesheetStore } from '../../store/timesheetStore';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<any>;

const TimesheetReviewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { weekId } = route.params ?? {};
  const weeks = useTimesheetStore((s) => s.weeks);
  const setWeekStatus = useTimesheetStore((s) => s.setWeekStatus);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);
  const [comment, setComment] = useState('');

  const week = weeks.find((w) => w.id === weekId);

  useEffect(() => {
    loadWeeks();
  }, [loadWeeks]);

  if (!week) {
    return (
      <AppLayout>
        <Text style={styles.title}>Timesheet not found</Text>
      </AppLayout>
    );
  }

  const totalHours = week.days.reduce((sum, d) => sum + d.hours, 0);

  const handleApprove = async () => {
    try {
      await setWeekStatus(week.id, 'Approved');
      await loadWeeks();
      Alert.alert('Approved', 'Timesheet approved successfully.');
      navigation.navigate('ManagerHome');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to approve timesheet.');
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      Alert.alert('Comment required', 'Rejection comment is mandatory. Please explain why this timesheet is rejected.');
      return;
    }

    try {
      await setWeekStatus(week.id, 'Rejected', comment.trim());
      await loadWeeks();
      Alert.alert('Rejected', 'Timesheet rejected successfully.');
      navigation.navigate('ManagerHome');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to reject timesheet.');
    }
  };

  return (
    <AppLayout>
      <ScrollView>
        <Text style={styles.title}>Review Timesheet</Text>
        <Text style={styles.meta}>Employee: {week.employeeName || 'Unknown'}</Text>
        <Text style={styles.meta}> Week End: {week.label} – Week Start: {week.weekStart}</Text>
        <Text style={styles.meta}>Total Hours: {totalHours.toFixed(2)}</Text>
        <Text style={styles.meta}>Status: {week.status}</Text>

        <Text style={styles.sectionTitle}>Daily Entries</Text>
        <FlatList
          data={week.days}
          keyExtractor={(d) => d.id}
          scrollEnabled={false}
          renderItem={({ item: d }) => (
            <View style={styles.dayRow}>
              <View>
                <View style={styles.dayMain}>
                  <Text style={styles.dayLabel}>{d.label}</Text>
                  <Text style={styles.dayHours}>{d.hours.toFixed(2)} h</Text>
                </View>
                {(d.jobNo || d.location || d.shiftType || d.startTime || d.finishTime) && (
                  <View style={styles.dayMeta}>
                    {d.jobNo && <Text style={styles.dayMetaText}>Job: {d.jobNo}</Text>}
                    {d.location && <Text style={styles.dayMetaText}>Location: {d.location}</Text>}
                    {d.shiftType && <Text style={styles.dayMetaText}>Shift: {d.shiftType}</Text>}
                    {(d.startTime || d.finishTime) && (
                      <Text style={styles.dayMetaText}>{d.startTime || '–'} – {d.finishTime || '–'}</Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          )}
        />

        <Text style={styles.sectionTitle}>Comment</Text>
        <AppTextInput
          label="Add comment (required for rejection)"
          placeholder="Explain why you are rejecting this timesheet"
          multiline
          style={styles.commentInput}
          value={comment}
          onChangeText={setComment}
        />

        <View style={styles.buttons}>
          <AppButton label="✓ Approve" onPress={handleApprove} />
          <AppButton label="✗ Reject" variant="secondary" onPress={handleReject} />
        </View>
      </ScrollView>
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
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  dayRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayMeta: { marginTop: 4 },
  dayMetaText: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  dayLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  dayHours: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  commentInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  buttons: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
});

export default TimesheetReviewScreen;

