import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AppLayout from '../../components/AppLayout';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTimesheetStore } from '../../store/timesheetStore';
import { useAuthStore } from '../../store/authStore';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { colors } from '../../theme/colors';

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

const DraftTimesheetsScreen: React.FC<Props> = ({ navigation }) => {
  const weeks = useTimesheetStore((s) => s.weeks);
  const isLoading = useTimesheetStore((s) => s.isLoading);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);
  const user = useAuthStore((s) => s.user);

  const [statusFilter, setStatusFilter] = useState<'Draft' | 'Submitted'>('Draft');
  const [isWeekListOpen, setIsWeekListOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadWeeks(user.id);
    }
  }, [user?.id, loadWeeks]);

  const filteredWeeks = weeks.filter((w) => w.status === statusFilter);

  return (
    <AppLayout>
      <Text style={styles.title}>Draft Timesheets</Text>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : weeks.length === 0 ? (
        <Text style={styles.empty}>
          No drafts yet. Use “+ New timesheet” to create one.
        </Text>
      ) : (
        <>
          {/* Status filter */}
          <Text style={styles.label}>Status</Text>
          <View style={styles.dropdownBox}>
            <TouchableOpacity
              style={styles.dropdownHeader}
              onPress={() =>
                setStatusFilter(statusFilter === 'Draft' ? 'Submitted' : 'Draft')
              }
            >
              <Text style={styles.dropdownText}>{statusFilter}</Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Week dropdown */}
          <Text style={[styles.label, { marginTop: spacing.md }]}>
            Select week
          </Text>
          <View style={styles.dropdownBox}>
            <TouchableOpacity
              style={styles.dropdownHeader}
              onPress={() => setIsWeekListOpen((prev) => !prev)}
            >
              <Text style={styles.dropdownText}>
                {isWeekListOpen ? 'Hide weeks' : 'Choose week'}
              </Text>
              <Text style={styles.dropdownArrow}>
                {isWeekListOpen ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {isWeekListOpen && (
              <View style={styles.weekList}>
                {filteredWeeks.map((w) => (
                  <TouchableOpacity
                    key={w.id}
                    style={styles.weekItem}
                    onPress={() => {
                      navigation.navigate('WeekReview', {
                        weekId: w.id,
                        canEdit: false,
                      });
                      setIsWeekListOpen(false);
                    }}
                  >
                    <Text style={styles.weekItemText}>
                      {formatFullWeekRange(w.weekStart)}
                    </Text>
                    <Text style={styles.statusText}>
                      Status: {w.status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </>
      )}
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  title: {
    ...typography.screenTitle,
    marginBottom: spacing.md,
  },
  empty: {
    ...typography.body,
  },
  label: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  dropdownBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  dropdownArrow: {
    color: colors.textSecondary,
  },
  weekList: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  weekItem: {
    paddingVertical: spacing.sm,
  },
  weekItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  loading: {
    marginTop: spacing.lg,
  },
});

export default DraftTimesheetsScreen;