import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AppLayout from '../../components/AppLayout';
import AppTextInput from '../../components/AppTextInput';
import AppButton from '../../components/AppButton';
import AppDropdown from '../../components/AppDropdown';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import { useTimesheetStore } from '../../store/timesheetStore';
import { useAuthStore } from '../../store/authStore';
import { getWeekById } from '../../services/firebaseTimesheets';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any>;

/** Given a date, get the Monday of that week (week = Mon–Sun) */
const getMondayOfWeek = (d: Date): Date => {
  const date = new Date(d);
  const dow = date.getDay();
  const diff = dow === 0 ? 6 : dow - 1;
  date.setDate(date.getDate() - diff);
  return date;
};

/** Format Monday date to DD/MM/YYYY and get week label (Week End – Week Start) */
const formatWeekFromMonday = (monday: Date) => {
  const dd = String(monday.getDate()).padStart(2, '0');
  const mm = String(monday.getMonth() + 1).padStart(2, '0');
  const yyyy = monday.getFullYear();
  const weekStart = `${dd}/${mm}/${yyyy}`;
  const end = new Date(monday);
  end.setDate(end.getDate() + 6);
  const dd2 = String(end.getDate()).padStart(2, '0');
  const mm2 = String(end.getMonth() + 1).padStart(2, '0');
  const yyyy2 = end.getFullYear();
  return { weekStart, label: `${dd2}/${mm2}/${yyyy2} – ${weekStart}` };
};

const DailyTimesheetScreen: React.FC<Props> = ({ navigation, route }) => {
  const user = useAuthStore((s) => s.user);
  const [companyName, setCompanyName] = useState('Infrastructure Renewal Services');
  const [contractorName, setContractorName] = useState('Infrastructure Renewal Services');
  const [site, setSite] = useState('');
  const [jobTask, setJobTask] = useState('');
  const [reference, setReference] = useState('');
  const [asset, setAsset] = useState('');
  const [onStandby, setOnStandby] = useState<'Yes' | 'No'>('No');
  const [permitRequired, setPermitRequired] = useState<'Yes' | 'No'>('No');
  const defaultWeek = useMemo(() => {
    const monday = getMondayOfWeek(new Date());
    return formatWeekFromMonday(monday);
  }, []);
  const [weekStart, setWeekStart] = useState(defaultWeek.weekStart);
  const [selectedWeekLabel, setSelectedWeekLabel] = useState(defaultWeek.label);
  const [showCalendar, setShowCalendar] = useState(false);
  const saveDayDraft = useTimesheetStore((s) => s.saveDayDraft);
  const submitWeek = useTimesheetStore((s) => s.submitWeek);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);

  const startDate = useMemo(() => {
    const parts = weekStart.split('/');
    if (parts.length !== 3) return new Date(2025, 7, 18);
    const [dd, mm, yyyy] = parts.map((p) => parseInt(p, 10));
    if (!dd || !mm || !yyyy) return new Date(2025, 7, 18);
    return new Date(yyyy, mm - 1, dd);
  }, [weekStart]);

  const weekEndDate = useMemo(() => {
    const d = new Date(startDate.getTime());
    d.setDate(d.getDate() + 6);
    return d;
  }, [startDate]);

  const weekEndId = useMemo(
    () => weekEndDate.toISOString().slice(0, 10),
    [weekEndDate],
  );

  const weekEndLabel = useMemo(() => {
    const dd = String(weekEndDate.getDate()).padStart(2, '0');
    const mm = String(weekEndDate.getMonth() + 1).padStart(2, '0');
    const yyyy = weekEndDate.getFullYear();
    return `Weekend of ${dd}/${mm}/${yyyy}`;
  }, [weekEndDate]);

  // Human‑friendly range label: Week End – Week Start
  const weekRangeLabel = useMemo(() => {
    const endDd = String(weekEndDate.getDate()).padStart(2, '0');
    const endMm = String(weekEndDate.getMonth() + 1).padStart(2, '0');
    const endYyyy = weekEndDate.getFullYear();
    const [dd, mm, yyyy] = weekStart.split('/');
    return `Week ${endDd}/${endMm}/${endYyyy} – ${dd}/${mm}/${yyyy}`;
  }, [weekStart, weekEndDate]);

  const [existingWeek, setExistingWeek] = useState<any>(null);

  // Load existing week data if it exists
  useEffect(() => {
    const loadExistingWeek = async () => {
      if (!user?.id) return;
      try {
        const week = await getWeekById(weekEndId);
        if (week && week.employeeId === user.id) {
          setExistingWeek(week);
        } else {
          setExistingWeek(null);
        }
      } catch (error) {
        setExistingWeek(null);
      }
    };
    loadExistingWeek();
  }, [weekEndId, user?.id]);

  const days = useMemo(() => {
    const labels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const ids = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const base = new Date(startDate.getTime());
    return labels.map((name, index) => {
      const d = new Date(base.getTime());
      d.setDate(base.getDate() + index);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const existingDay = existingWeek?.days?.find((day: any) => day.id === ids[index]);
      return {
        id: ids[index],
        label: `${name}, ${dd}/${mm}/${yyyy}`,
        hours: existingDay ? String(existingDay.hours) : '0.00',
        initialDayData: existingDay ?? undefined,
      };
    });
  }, [startDate, existingWeek]);

  const handleSubmitWeek = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not logged in.');
      return;
    }

    // Check if there are any days with hours
    const hasHours = days.some((d) => {
      // Check if this day exists in Firebase (would need to load week first)
      // For now, just check if hours > 0
      return parseFloat(d.hours) > 0;
    });

    if (!hasHours) {
      Alert.alert('No hours', 'Please add at least one day with hours before submitting.');
      return;
    }

    if (existingWeek && existingWeek.status !== 'Draft') {
      Alert.alert('Cannot submit', 'This timesheet has already been submitted.');
      return;
    }

    try {
      await submitWeek(weekEndId);
      await loadWeeks(user.id);
      Alert.alert('Submitted', 'Timesheet submitted to manager successfully.');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to submit timesheet. Please try again.');
    }
  };

  return (
    <AppLayout>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>New timesheet – {weekRangeLabel}</Text>
        <Text style={styles.caption}>Employee: {user?.name ?? 'Employee'}</Text>

        <Text style={styles.sectionTitle}>General information</Text>
        <View style={styles.grid}>
          <AppTextInput
            label="Company name"
            placeholder="Infrastructure Renewal Services"
            value={companyName}
            onChangeText={setCompanyName}
          />
          <AppTextInput
            label="Site name"
            placeholder="Enter site name"
            value={site}
            onChangeText={setSite}
          />
          <AppTextInput
            label="Contractor"
            placeholder="Infrastructure Renewal Services"
            value={contractorName}
            onChangeText={setContractorName}
          />
          <AppTextInput
            label="Job / task"
            placeholder="Enter job/task"
            value={jobTask}
            onChangeText={setJobTask}
          />
          <View style={styles.calendarField}>
            <Text style={styles.calendarLabel}>Select week</Text>
            <TouchableOpacity
              style={styles.calendarTouch}
              onPress={() => setShowCalendar(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.calendarIcon}>📅</Text>
              <Text style={styles.calendarValue}>
                {selectedWeekLabel}
              </Text>
              <Text style={styles.calendarHint}>Tap to pick date</Text>
            </TouchableOpacity>
          </View>
          {showCalendar && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
              onChange={(_, selectedDate) => {
                setShowCalendar(false);
                if (selectedDate) {
                  const monday = getMondayOfWeek(selectedDate);
                  const { weekStart: ws, label } = formatWeekFromMonday(monday);
                  setWeekStart(ws);
                  setSelectedWeekLabel(label);
                }
              }}
              maximumDate={new Date()}
              minimumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 2))}
            />
          )}
          <AppTextInput
            label="Reference no."
            placeholder="e.g. 1434"
            value={reference}
            onChangeText={setReference}
          />
          <AppTextInput
            label="Asset"
            placeholder="Asset name"
            value={asset}
            onChangeText={setAsset}
          />
          <AppDropdown
            label="On standby this week?"
            value={onStandby}
            options={['Yes', 'No']}
            onSelect={(v) => setOnStandby(v as 'Yes' | 'No')}
          />
          <AppDropdown
            label="Permit to work required?"
            value={permitRequired}
            options={['Yes', 'No']}
            onSelect={(v) => setPermitRequired(v as 'Yes' | 'No')}
          />
        </View>

        <Text style={styles.sectionTitle}>Daily entries</Text>
        {existingWeek && existingWeek.status !== 'Draft' && (
          <View style={styles.statusBanner}>
            <Text style={styles.statusText}>
              Status: {existingWeek.status} {existingWeek.status === 'Submitted' && '(Cannot edit)'}
            </Text>
          </View>
        )}

        {days.map((day) => (
          <TouchableOpacity
            key={day.id}
            style={[
              styles.daySummaryCard,
              parseFloat(day.hours) > 0 && styles.daySummaryCardFilled,
              existingWeek && existingWeek.status !== 'Draft' && styles.daySummaryCardDisabled,
            ]}
            onPress={() => {
              if (!user?.id) {
                Alert.alert('Error', 'User not logged in.');
                return;
              }
              if (existingWeek && existingWeek.status !== 'Draft') {
                Alert.alert('Cannot edit', 'This timesheet has already been submitted.');
                return;
              }
              navigation.navigate('DayTimesheetEntry', {
                dayId: day.id,
                dayLabel: day.label,
                weekEndId,
                weekEndLabel,
                weekStart,
                initialHours: parseFloat(day.hours) || 0,
                initialDayData: day.initialDayData,
              });
            }}
          >
            <Text style={styles.daySummaryTitle}>{day.label}</Text>
            <Text style={styles.daySummaryHours}>{day.hours} hrs</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.buttonsRow}>
          <AppButton
            label="Submit timesheet"
            onPress={handleSubmitWeek}
          />
        </View>
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  title: {
    ...typography.screenTitle,
  },
  caption: {
    ...typography.body,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  dayCard: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  dayHeader: {
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
  daySummaryCard: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  daySummaryCardFilled: {
    backgroundColor: '#e8f5e9',
    borderColor: colors.success,
  },
  daySummaryCardDisabled: {
    opacity: 0.5,
  },
  statusBanner: {
    backgroundColor: '#fff3cd',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  statusText: {
    ...typography.body,
    color: '#856404',
    fontWeight: '600',
  },
  daySummaryTitle: {
    ...typography.body,
    color: colors.textPrimary,
  },
  daySummaryHours: {
    fontWeight: '600',
    color: colors.success,
  },
  buttonsRow: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  calendarField: {
    marginBottom: spacing.md,
    width: '100%',
  },
  calendarLabel: {
    marginBottom: spacing.xs,
    fontWeight: '500',
    color: colors.textSecondary,
    fontSize: 14,
  },
  calendarTouch: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  calendarIcon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  calendarValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  calendarHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

export default DailyTimesheetScreen;

