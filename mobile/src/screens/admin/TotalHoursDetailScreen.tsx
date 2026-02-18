import React, { useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppLayout from '../../components/AppLayout';
import { useTimesheetStore, WeekTimesheet } from '../../store/timesheetStore';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<any>;

interface EmployeeHours {
  employeeId: string;
  employeeName: string;
  weeks: { weekStart: string; weekEnd: string; hours: number }[];
  total: number;
}

const TotalHoursDetailScreen: React.FC<Props> = () => {
  const weeks = useTimesheetStore((s) => s.weeks);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);

  useEffect(() => {
    loadWeeks();
  }, [loadWeeks]);

  const byEmployee = useMemo(() => {
    const map = new Map<string, EmployeeHours>();
    for (const w of weeks) {
      const hours = w.days.reduce((s, d) => s + (typeof d.hours === 'number' ? d.hours : 0), 0);
      const weekEntry = { weekStart: w.weekStart, weekEnd: w.label, hours };
      const existing = map.get(w.employeeId);
      if (existing) {
        existing.weeks.push(weekEntry);
        existing.total += hours;
      } else {
        map.set(w.employeeId, {
          employeeId: w.employeeId,
          employeeName: w.employeeName || 'Unknown',
          weeks: [weekEntry],
          total: hours,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [weeks]);

  const grandTotal = useMemo(
    () => byEmployee.reduce((s, e) => s + e.total, 0),
    [byEmployee]
  );

  const renderItem = ({ item }: { item: EmployeeHours }) => (
    <View style={styles.card}>
      <Text style={styles.employee}>{item.employeeName}</Text>
      <Text style={styles.total}>Total: {item.total.toFixed(1)} hrs</Text>
      {item.weeks.map((w, i) => (
        <Text key={i} style={styles.week}>
          Week {w.weekEnd} – {w.weekStart}: {w.hours.toFixed(1)} hrs
        </Text>
      ))}
    </View>
  );

  return (
    <AppLayout>
      <Text style={styles.title}>Total hours by employee</Text>
      <Text style={styles.grandTotal}>Grand total: {grandTotal.toFixed(1)} hrs</Text>

      <FlatList
        data={byEmployee}
        keyExtractor={(item) => item.employeeId}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  title: {
    ...typography.screenTitle,
    marginBottom: spacing.md,
  },
  grandTotal: {
    ...typography.sectionTitle,
    marginBottom: spacing.lg,
    color: colors.primary,
  },
  list: { paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  employee: { fontWeight: '600', fontSize: 16, color: colors.textPrimary },
  total: { marginTop: spacing.xs, fontWeight: '600', color: colors.textSecondary },
  week: { marginTop: 4, fontSize: 13, color: colors.textSecondary },
});

export default TotalHoursDetailScreen;
