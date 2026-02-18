import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppLayout from '../../components/AppLayout';
import AppTextInput from '../../components/AppTextInput';
import AppButton from '../../components/AppButton';
import AppDropdown from '../../components/AppDropdown';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { colors } from '../../theme/colors';
import { useTimesheetStore } from '../../store/timesheetStore';
import { useAuthStore } from '../../store/authStore';

type Props = NativeStackScreenProps<any>;

const DayTimesheetEntryScreen: React.FC<Props> = ({ route, navigation }) => {
  const {
    dayId,
    dayLabel,
    weekEndId,
    weekEndLabel,
    weekStart,
    employeeIdForEdit,
    initialHours,
    initialDayData,
  } = route.params ?? {};
  const user = useAuthStore((s) => s.user);
  const effectiveUserId = employeeIdForEdit ?? user?.id;
  const saveDayDraft = useTimesheetStore((s) => s.saveDayDraft);

  const [jobNo, setJobNo] = useState(initialDayData?.jobNo ?? '0479');
  const [location, setLocation] = useState(initialDayData?.location ?? 'Eastwood');
  const SHIFT_TYPES = ['Regular', 'Night', 'Weekend', 'Overtime', 'Other'];
  const [shiftType, setShiftType] = useState(initialDayData?.shiftType ?? 'Regular');
  const [lunchTaken, setLunchTaken] = useState(initialDayData?.lunchTaken ?? 'Yes');
  const [livingAway, setLivingAway] = useState(initialDayData?.livingAway ?? 'No');
  const [startTime, setStartTime] = useState(initialDayData?.startTime ?? '06:45');
  const [finishTime, setFinishTime] = useState(initialDayData?.finishTime ?? '16:30');
  const [hoursWorked, setHoursWorked] = useState(
    typeof initialHours === 'number' ? String(initialHours) : (initialDayData ? String(initialDayData.hours) : '9.25')
  );
  const [description, setDescription] = useState(initialDayData?.description ?? '');

  const handleSaveDraft = async () => {
    if (!effectiveUserId) {
      Alert.alert('Error', 'User not logged in.');
      return;
    }
    
    if (!hoursWorked || parseFloat(hoursWorked) <= 0) {
      Alert.alert('Invalid hours', 'Please enter hours worked (must be greater than 0).');
      return;
    }

    try {
      await saveDayDraft(
        effectiveUserId,
        weekEndId,
        weekEndLabel,
        weekStart,
        {
          id: dayId,
          label: dayLabel,
          hours: parseFloat(hoursWorked || '0'),
          jobNo,
          location,
          shiftType,
          lunchTaken,
          livingAway,
          startTime,
          finishTime,
          description,
        }
      );
      Alert.alert('Draft saved', `${dayLabel} saved as draft for ${weekEndLabel}.`);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save draft. Please try again.');
    }
  };

  return (
    <AppLayout>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.dayTitle}>{dayLabel}</Text>
          <Text style={styles.dayHours}>{hoursWorked} hrs</Text>
        </View>

        <View style={styles.grid}>
          <AppTextInput
            label="Job no."
            placeholder="0479"
            value={jobNo}
            onChangeText={setJobNo}
          />
          <AppTextInput
            label="Location(s)"
            placeholder="Enter location(s)"
            value={location}
            onChangeText={setLocation}
          />
          <AppTextInput
            label="Start time"
            placeholder="06:45"
            value={startTime}
            onChangeText={setStartTime}
          />
          <AppTextInput
            label="Finish time"
            placeholder="16:30"
            value={finishTime}
            onChangeText={setFinishTime}
          />
          <AppDropdown
            label="Shift type"
            value={shiftType}
            options={SHIFT_TYPES}
            onSelect={setShiftType}
            fullWidth
          />
          <AppTextInput
            label="Lunch taken?"
            placeholder="Yes / No"
            value={lunchTaken}
            onChangeText={setLunchTaken}
          />
          <AppTextInput
            label="Living away from home?"
            placeholder="Yes / No"
            value={livingAway}
            onChangeText={setLivingAway}
          />
          <AppTextInput
            label="Hours worked"
            placeholder="0.00"
            value={hoursWorked}
            onChangeText={setHoursWorked}
            style={{ backgroundColor: '#f3f2f1' }}
          />
        </View>

        <AppTextInput
          label="Work description / comments"
          placeholder="Describe work performed..."
          multiline
          style={styles.multiline}
          value={description}
          onChangeText={setDescription}
        />

        <AppButton label="Save draft" onPress={handleSaveDraft} />
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#f3f2f1',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayTitle: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dayHours: {
    fontSize: 14,
    color: colors.success,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
});

export default DayTimesheetEntryScreen;

