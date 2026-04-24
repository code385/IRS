import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Alert, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
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
      times.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
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
    dayId, dayLabel, weekEndId, weekEndLabel, weekStart,
    onStandby: initialOnStandby, employeeIdForEdit, initialDayData,
  } = route.params ?? {};

  const user = useAuthStore((s) => s.user);
  const effectiveUserId = employeeIdForEdit ?? user?.id;
  const saveDayDraft = useTimesheetStore((s) => s.saveDayDraft);

  const [jobNo, setJobNo] = useState(initialDayData?.jobNo ?? '');
  const [location, setLocation] = useState(initialDayData?.location ?? '');
  const [startTime, setStartTime] = useState(initialDayData?.startTime ?? '00:00');
  const [finishTime, setFinishTime] = useState(initialDayData?.finishTime ?? '23:45');
  const [lunchTaken, setLunchTaken] = useState<'Yes'|'No'>(initialDayData?.lunchTaken ?? 'Yes');
  const [onStandby, setOnStandby] = useState<'Yes'|'No'>(initialOnStandby === 'Yes' ? 'Yes' : 'No');
  const [shiftType, setShiftType] = useState<'Day'|'Night'>(initialDayData?.shiftType === 'Night' ? 'Night' : 'Day');
  const [lafha, setLafha] = useState<'Yes'|'No'>(initialDayData?.livingAway === 'Yes' ? 'Yes' : 'No');
  const [description, setDescription] = useState(initialDayData?.description ?? '');

  const totalHours = useMemo(() => {
    const start = timeToMinutes(startTime);
    const finish = timeToMinutes(finishTime);
    if (finish <= start) return 0;
    let diff = finish - start;
    if (lunchTaken === 'Yes') diff -= 30;
    return diff > 0 ? diff / 60 : 0;
  }, [startTime, finishTime, lunchTaken]);

  const handleSaveDraft = async () => {
    if (!effectiveUserId) {
      Alert.alert('Error', 'User not logged in.');
      return;
    }
    if (!weekEndId || !weekEndLabel || !weekStart || !dayId || !dayLabel) {
      Alert.alert('Error', 'Week details are missing. Please go back and try again.');
      return;
    }
    if (totalHours <= 0) {
      Alert.alert('Invalid time', 'Finish time must be after start time.');
      return;
    }
    try {
      await saveDayDraft(
        effectiveUserId, weekEndId, weekEndLabel, weekStart,
        { id: dayId, label: dayLabel, hours: totalHours, jobNo, location, lunchTaken, shiftType, livingAway: lafha, startTime, finishTime, description },
        onStandby,
      );
      Alert.alert('Draft saved', `${dayLabel} saved successfully.`);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save draft.');
    }
  };

  return (
    <AppLayout>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={Platform.OS === 'web'}
        >
          <View style={styles.pageHeader}>
            <View style={styles.dayInfo}>
              <Text style={styles.pageTitle} numberOfLines={2}>{dayLabel}</Text>
              <Text style={styles.pageSubtitle}>Daily timesheet entry</Text>
            </View>
            <View style={[styles.hoursBadge, totalHours > 0 ? styles.hoursBadgeActive : styles.hoursBadgeEmpty]}>
              <Text style={[styles.hoursValue, totalHours > 0 && styles.hoursValueActive]}>
                {totalHours.toFixed(2)}
              </Text>
              <Text style={[styles.hoursUnit, totalHours > 0 && styles.hoursUnitActive]}>hrs</Text>
            </View>
          </View>

          <View style={styles.form}>
            <Text style={styles.sectionLabel}>Job Details</Text>
            <AppTextInput label="Job No." value={jobNo} onChangeText={setJobNo} placeholder="e.g. 0479" />
            <AppTextInput label="Location(s)" value={location} onChangeText={setLocation} placeholder="e.g. Eastwood" />

            <Text style={styles.sectionLabel}>Time</Text>
            <AppDropdown label="Start Time" value={startTime} options={TIME_OPTIONS} onSelect={setStartTime} fullWidth />
            <AppDropdown label="Finish Time" value={finishTime} options={TIME_OPTIONS} onSelect={setFinishTime} fullWidth />
            <AppDropdown label="Lunch Taken?" value={lunchTaken} options={['Yes','No']} onSelect={(v) => setLunchTaken(v as 'Yes'|'No')} fullWidth />

            <View style={styles.hoursReadonlyWrap}>
              <Text style={styles.hoursReadonlyLabel}>HOURS WORKED</Text>
              <Text style={styles.hoursReadonlyValue}>{totalHours.toFixed(2)} hrs</Text>
            </View>

            <Text style={styles.sectionLabel}>Options</Text>
            <AppDropdown label="On Standby This Week?" value={onStandby} options={['Yes','No']} onSelect={(v) => setOnStandby(v as 'Yes'|'No')} fullWidth />
            <AppDropdown label="Shift Type" value={shiftType} options={['Day','Night']} onSelect={(v) => setShiftType(v as 'Day'|'Night')} fullWidth />
            <AppDropdown label="LAFHA (Living Away From Home)" value={lafha} options={['Yes','No']} onSelect={(v) => setLafha(v as 'Yes'|'No')} fullWidth />

            <Text style={styles.sectionLabel}>Notes</Text>
            <AppTextInput
              label="Work Description / Comments"
              placeholder="Describe work performed..."
              multiline
              style={styles.multiline}
              value={description}
              onChangeText={setDescription}
            />

            <AppButton label="Save Draft" onPress={handleSaveDraft} fullWidth />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 200,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  dayInfo: { flex: 1, paddingRight: spacing.sm },
  pageTitle: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  pageSubtitle: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    marginTop: 2,
  },
  hoursBadge: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 64,
    backgroundColor: colors.background,
  },
  hoursBadgeActive: {
    backgroundColor: colors.primarySurface,
  },
  hoursBadgeEmpty: {
    backgroundColor: colors.background,
  },
  hoursValue: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: -0.3,
  },
  hoursValueActive: {
    color: colors.primary,
  },
  hoursUnit: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
  },
  hoursUnitActive: {
    color: colors.primary,
  },
  form: {
    width: '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? { maxWidth: 720 } : null),
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  hoursReadonlyWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primarySurface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.md,
  },
  hoursReadonlyLabel: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  hoursReadonlyValue: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.3,
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
});

export default DayTimesheetEntryScreen;
