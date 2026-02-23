import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any>;

const getMondayOfWeek = (d: Date): Date => {
  const date = new Date(d);
  const dow = date.getDay();
  const diff = dow === 0 ? 6 : dow - 1;
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const formatDayWithDate = (date: Date) => {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const dayName = days[date.getDay()];
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dayName} ${dd}/${mm}/${yyyy}`;
};

const toYYYYMMDD = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const DailyTimesheetScreen: React.FC<Props> = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const modalMaxWidth = Math.min(520, width - 32);

  const user = useAuthStore((s) => s.user);
  const submitWeek = useTimesheetStore((s) => s.submitWeek);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);

  const defaultMonday = useMemo(() => getMondayOfWeek(new Date()), []);
  const [startDate, setStartDate] = useState(defaultMonday);

  const [companyName, setCompanyName] = useState('Infrastructure Renewal Services');
  const [onStandby, setOnStandby] = useState<'Yes' | 'No'>('No');

  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(defaultMonday);
  const [webDateValue, setWebDateValue] = useState(toYYYYMMDD(defaultMonday));

  const weekEndDate = useMemo(() => {
    const end = new Date(startDate);
    end.setDate(end.getDate() + 6);
    return end;
  }, [startDate]);

  const titleLabel = useMemo(() => {
    return `Timesheet ${formatDayWithDate(startDate)} to ${formatDayWithDate(weekEndDate)}`;
  }, [startDate, weekEndDate]);

  const applySelectedDate = (selectedDate: Date) => {
    const monday = getMondayOfWeek(selectedDate);
    setStartDate(monday);
  };

  const days = useMemo(() => {
    const labels = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    const base = new Date(startDate);

    return labels.map((name, index) => {
      const d = new Date(base);
      d.setDate(base.getDate() + index);
      return {
        id: index,
        label: `${name} ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`,
        hours: '0.00',
      };
    });
  }, [startDate]);

  const handleSubmitWeek = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not logged in.');
      return;
    }

    try {
      await submitWeek('temp');
      await loadWeeks(user.id);
      Alert.alert('Submitted', 'Timesheet submitted successfully.');
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to submit timesheet.');
    }
  };

  return (
    <AppLayout>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <Text style={styles.title}>Home</Text>
        <Text style={styles.timesheetTitle}>{titleLabel}</Text>
        <Text style={styles.caption}>Employee: {user?.name ?? 'Employee'}</Text>

        <Text style={styles.sectionTitle}>General information</Text>

        <View style={styles.field}>
          <AppTextInput
            label="Company name"
            value={companyName}
            onChangeText={setCompanyName}
          />
        </View>

        {/* ✅ Calendar Inside Input Box */}
        <View style={styles.field}>
          <Text style={styles.calendarLabel}>Select Week</Text>

          <TouchableOpacity
            style={styles.calendarTouch}
            onPress={() => setShowPicker(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.calendarValue}>
              {formatDayWithDate(startDate)}
            </Text>

            <Text style={styles.calendarIcon}>📅</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <AppDropdown
            label="On standby this week?"
            value={onStandby}
            options={['Yes', 'No']}
            onSelect={(v) => setOnStandby(v as 'Yes' | 'No')}
          />
        </View>

        <Text style={styles.sectionTitle}>Daily Entries</Text>

        {days.map((day) => (
          <TouchableOpacity
            key={day.id}
            style={styles.dayCard}
            onPress={() =>
              navigation.navigate('DayTimesheetEntry', {
                dayLabel: day.label,
              })
            }
          >
            <Text>{day.label}</Text>
            <Text>{day.hours} hrs</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.buttonsRow}>
          <AppButton label="Submit timesheet" onPress={handleSubmitWeek} />
        </View>

        {/* Date Picker Modal */}
        <Modal transparent visible={showPicker} animationType="fade">
          <Pressable style={styles.modalBackdrop} onPress={() => setShowPicker(false)} />
          <View style={[styles.modalCard, { width: modalMaxWidth }]}>

            {Platform.OS === 'web' ? (
              <>
                <input
                  type="date"
                  value={webDateValue}
                  onChange={(e) => setWebDateValue(e.target.value)}
                  style={{ width: '100%', padding: 10 }}
                />
                <AppButton
                  label="Done"
                  onPress={() => {
                    setShowPicker(false);
                    applySelectedDate(new Date(webDateValue + 'T00:00:00'));
                  }}
                />
              </>
            ) : (
              <DateTimePicker
                value={tempDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                onChange={(event, date) => {
                  if (Platform.OS === 'android') {
                    setShowPicker(false);
                    if (date) applySelectedDate(date);
                  } else {
                    if (date) setTempDate(date);
                  }
                }}
              />
            )}

            {Platform.OS === 'ios' && (
              <AppButton
                label="Done"
                onPress={() => {
                  setShowPicker(false);
                  applySelectedDate(tempDate);
                }}
              />
            )}
          </View>
        </Modal>

      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: spacing.xl },
  title: { ...typography.screenTitle },
  timesheetTitle: { fontSize: 16, fontWeight: '700', marginTop: spacing.sm },
  caption: { ...typography.body, marginBottom: spacing.lg },
  sectionTitle: { ...typography.sectionTitle, marginTop: spacing.lg },
  field: { marginBottom: spacing.md },

  calendarLabel: { fontWeight: '600', marginBottom: spacing.xs },

  calendarTouch: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  calendarValue: { fontWeight: '600' },
  calendarIcon: { fontSize: 18 },

  dayCard: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  buttonsRow: { marginTop: spacing.lg },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalCard: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderRadius: 16,
  },
});

export default DailyTimesheetScreen;