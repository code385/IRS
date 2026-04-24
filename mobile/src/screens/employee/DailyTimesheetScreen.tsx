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

const formatWeekStartLabel = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DailyTimesheetScreen: React.FC<Props> = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const modalMaxWidth = Math.min(520, width - 32);

  const user = useAuthStore((s) => s.user);
  const weeks = useTimesheetStore((s) => s.weeks);
  const submitWeek = useTimesheetStore((s) => s.submitWeek);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);

  const defaultMonday = useMemo(() => getMondayOfWeek(new Date()), []);
  const [startDate, setStartDate] = useState(defaultMonday);
  const [companyName, setCompanyName] = useState('Infrastructure Renewal Services');
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(defaultMonday);
  const [webDateValue, setWebDateValue] = useState(toYYYYMMDD(defaultMonday));

  const weekEndDate = useMemo(() => {
    const end = new Date(startDate);
    end.setDate(end.getDate() + 6);
    return end;
  }, [startDate]);

  const weekStartLabel = useMemo(() => formatWeekStartLabel(startDate), [startDate]);
  const weekEndLabel = useMemo(() => formatDayWithDate(weekEndDate), [weekEndDate]);
  const weekId = useMemo(() => {
    if (!user?.id) return '';
    return `${user.id}_${weekStartLabel.replace(/\//g, '-')}`;
  }, [user?.id, weekStartLabel]);
  const currentWeek = useMemo(() => {
    if (!weekId) return undefined;
    return weeks.find((w) => w.id === weekId);
  }, [weekId, weeks]);

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
      const existingDay = currentWeek?.days?.find((ed) => ed.id === index);
      return {
        id: index,
        label: `${name} ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`,
        shortLabel: SHORT_DAYS[index],
        hours: existingDay?.hours ?? 0,
      };
    });
  }, [startDate, currentWeek]);

  const totalHours = days.reduce((sum, d) => sum + d.hours, 0);

  const handleSubmitWeek = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not logged in.');
      return;
    }
    if (!currentWeek || !currentWeek.days?.some((d) => d.hours > 0)) {
      Alert.alert('No entries', 'Please add at least one daily entry before submitting.');
      return;
    }
    try {
      await submitWeek(currentWeek.id);
      await loadWeeks(user.id);
      Alert.alert('Submitted', 'Timesheet submitted successfully.');
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to submit timesheet.');
    }
  };

  const weekRangeLabel = `${String(startDate.getDate()).padStart(2,'0')}/${String(startDate.getMonth()+1).padStart(2,'0')} – ${String(weekEndDate.getDate()).padStart(2,'0')}/${String(weekEndDate.getMonth()+1).padStart(2,'0')}/${weekEndDate.getFullYear()}`;

  return (
    <AppLayout>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>New Timesheet</Text>
            <Text style={styles.pageSubtitle}>{user?.name ?? 'Employee'}</Text>
          </View>
          {totalHours > 0 && (
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeValue}>{totalHours.toFixed(1)}</Text>
              <Text style={styles.totalBadgeLabel}>hrs total</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>General Information</Text>
          <AppTextInput
            label="Company Name"
            value={companyName}
            onChangeText={setCompanyName}
          />

          <Text style={styles.inputLabel}>Select Week</Text>
          <TouchableOpacity
            style={styles.weekSelector}
            onPress={() => setShowPicker(true)}
            activeOpacity={0.8}
          >
            <View>
              <Text style={styles.weekSelectorValue}>{weekRangeLabel}</Text>
              <Text style={styles.weekSelectorHint}>Tap to change week</Text>
            </View>
            <View style={styles.calendarIconWrap}>
              <Text style={styles.calendarIcon}>📅</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Daily Entries</Text>
          {days.map((day) => (
            <TouchableOpacity
              key={day.id}
              style={styles.dayCard}
              onPress={() => {
                if (!user?.id) {
                  Alert.alert('Error', 'User not logged in.');
                  return;
                }
                const targetWeekId = weekId || `${user.id}_${weekStartLabel.replace(/\//g, '-')}`;
                navigation.navigate('DayTimesheetEntry', {
                  dayId: String(day.id),
                  dayLabel: day.label,
                  weekEndId: targetWeekId,
                  weekEndLabel: weekEndLabel,
                  weekStart: weekStartLabel,
                  onStandby: currentWeek?.onStandby ?? 'No',
                });
              }}
              activeOpacity={0.75}
            >
              <View style={[styles.dayBadge, day.hours > 0 && styles.dayBadgeActive]}>
                <Text style={[styles.dayBadgeText, day.hours > 0 && styles.dayBadgeTextActive]}>
                  {day.shortLabel}
                </Text>
              </View>
              <View style={styles.dayInfo}>
                <Text style={styles.dayLabel}>{day.label}</Text>
                <Text style={[styles.dayHours, day.hours > 0 && styles.dayHoursActive]}>
                  {day.hours > 0 ? `${day.hours.toFixed(2)} hrs` : 'No entry'}
                </Text>
              </View>
              <View style={styles.dayArrow}>
                <View style={styles.dayArrowLine} />
                <View style={styles.dayArrowHead} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <AppButton label="Submit Timesheet" onPress={handleSubmitWeek} fullWidth />

        <Modal transparent visible={showPicker} animationType="fade">
          <Pressable style={styles.modalBackdrop} onPress={() => setShowPicker(false)} />
          <View style={[styles.modalCard, { width: modalMaxWidth }]}>
            <Text style={styles.modalTitle}>Select Week</Text>
            {Platform.OS === 'web' ? (
              <>
                <input
                  type="date"
                  value={webDateValue}
                  onChange={(e) => setWebDateValue(e.target.value)}
                  style={{ width: '100%', padding: 12, fontSize: 15, borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 16 }}
                />
                <AppButton
                  label="Confirm"
                  onPress={() => {
                    setShowPicker(false);
                    applySelectedDate(new Date(webDateValue + 'T00:00:00'));
                  }}
                  fullWidth
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
                label="Confirm"
                onPress={() => {
                  setShowPicker(false);
                  applySelectedDate(tempDate);
                }}
                fullWidth
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
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  pageTitle: {
    fontSize: 24,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    marginTop: 2,
  },
  totalBadge: {
    backgroundColor: colors.primarySurface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  totalBadgeValue: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  totalBadgeLabel: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: colors.primary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  inputLabel: {
    marginBottom: 6,
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  weekSelector: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekSelectorValue: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  weekSelectorHint: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    marginTop: 2,
  },
  calendarIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarIcon: { fontSize: 18 },
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  dayBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dayBadgeActive: {
    backgroundColor: colors.primarySurface,
  },
  dayBadgeText: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  dayBadgeTextActive: {
    color: colors.primary,
  },
  dayInfo: { flex: 1 },
  dayLabel: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dayHours: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    marginTop: 1,
  },
  dayHoursActive: {
    color: colors.success,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
  },
  dayArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  dayArrowLine: {
    width: 10,
    height: 1.5,
    backgroundColor: colors.textMuted,
    borderRadius: 1,
  },
  dayArrowHead: {
    width: 5,
    height: 5,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: colors.textMuted,
    transform: [{ rotate: '45deg' }, { translateX: -2.5 }],
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: {
    position: 'absolute',
    top: '25%',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
});

export default DailyTimesheetScreen;
