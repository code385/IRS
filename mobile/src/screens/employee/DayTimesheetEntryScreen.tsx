import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppLayout from '../../components/AppLayout';
import AppTextInput from '../../components/AppTextInput';
import AppButton from '../../components/AppButton';
import AppDropdown from '../../components/AppDropdown';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import { useTimesheetStore } from '../../store/timesheetStore';
import { useAuthStore } from '../../store/authStore';

type Props = NativeStackScreenProps<any>;

const generateTimeOptions = () => {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      times.push(`${hh}:${mm}`);
    }
  }
  return times;
};

const TIME_OPTIONS = generateTimeOptions();

const timeToMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const DayTimesheetEntryScreen: React.FC<Props> = ({ route, navigation }) => {
  const {
    dayId,
    dayLabel,
    weekEndId,
    weekEndLabel,
    weekStart,
    employeeIdForEdit,
    initialDayData,
  } = route.params ?? {};

  const user = useAuthStore((s) => s.user);
  const effectiveUserId = employeeIdForEdit ?? user?.id;
  const saveDayDraft = useTimesheetStore((s) => s.saveDayDraft);

  const [jobNo, setJobNo] = useState(initialDayData?.jobNo ?? '0479');
  const [location, setLocation] = useState(initialDayData?.location ?? 'Eastwood');

  const [startTime, setStartTime] = useState(initialDayData?.startTime ?? '00:00');
  const [finishTime, setFinishTime] = useState(initialDayData?.finishTime ?? '23:45');

  const [lunchTaken, setLunchTaken] = useState<'Yes' | 'No'>(initialDayData?.lunchTaken ?? 'Yes');
  const [description, setDescription] = useState(initialDayData?.description ?? '');

  const totalHours = useMemo(() => {
    const start = timeToMinutes(startTime);
    const finish = timeToMinutes(finishTime);

    if (finish <= start) return 0;

    let diff = finish - start;

    if (lunchTaken === 'Yes') {
      diff -= 30; // deduct 30 min
    }

    return diff > 0 ? diff / 60 : 0;
  }, [startTime, finishTime, lunchTaken]);

  const handleSaveDraft = async () => {
    if (!effectiveUserId) {
      Alert.alert('Error', 'User not logged in.');
      return;
    }

    if (totalHours <= 0) {
      Alert.alert('Invalid time', 'Finish time must be after start time.');
      return;
    }

    try {
      await saveDayDraft(effectiveUserId, weekEndId, weekEndLabel, weekStart, {
        id: dayId,
        label: dayLabel,
        hours: totalHours,
        jobNo,
        location,
        lunchTaken,
        startTime,
        finishTime,
        description,
      });

      Alert.alert('Draft saved', `${dayLabel} saved successfully.`);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save draft.');
    }
  };

  return (
    <AppLayout>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.dayTitle}>{dayLabel}</Text>
          <Text style={styles.dayHours}>{totalHours.toFixed(2)} hrs</Text>
        </View>

        {/* ✅ RESPONSIVE FORM WRAP */}
        <View style={styles.form}>
          <View style={styles.field}>
            <AppTextInput label="Job no." value={jobNo} onChangeText={setJobNo} />
          </View>

          <View style={styles.field}>
            <AppTextInput label="Location(s)" value={location} onChangeText={setLocation} />
          </View>

          <View style={styles.field}>
            <AppDropdown
              label="Start time"
              value={startTime}
              options={TIME_OPTIONS}
              onSelect={setStartTime}
              fullWidth
            />
          </View>

          <View style={styles.field}>
            <AppDropdown
              label="Finish time"
              value={finishTime}
              options={TIME_OPTIONS}
              onSelect={setFinishTime}
              fullWidth
            />
          </View>

          <View style={styles.field}>
            <AppDropdown
              label="Lunch taken?"
              value={lunchTaken}
              options={['Yes', 'No']}
              onSelect={(v) => setLunchTaken(v as 'Yes' | 'No')}
              fullWidth
            />
          </View>

          {/* ✅ HOURS WORKED FIELD (AUTO UPDATED, NOT EDITABLE) */}
          <View style={styles.field}>
            <AppTextInput
              label="Hours worked"
              value={totalHours.toFixed(2)}
              editable={false}
              style={styles.readonly}
            />
          </View>

          <View style={styles.field}>
            <AppTextInput
              label="Work description / comments"
              placeholder="Describe work performed..."
              multiline
              style={styles.multiline}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={styles.buttonWrap}>
            <AppButton label="Save draft" onPress={handleSaveDraft} />
          </View>
        </View>
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  // ✅ Scroll padding + web responsiveness
  scrollContent: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },

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
    flex: 1,
    paddingRight: spacing.sm,
  },
  dayHours: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success,
  },

  // ✅ Key fix: center + maxWidth on web, normal on mobile
  form: {
    width: '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web'
      ? { maxWidth: 720 } // web pe centered, no huge gaps
      : null),
  },

  // ✅ Consistent spacing between fields
  field: {
    marginBottom: spacing.md,
  },

  readonly: {
    backgroundColor: '#f3f2f1',
  },

  multiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },

  buttonWrap: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
});

export default DayTimesheetEntryScreen;