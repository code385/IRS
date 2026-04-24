import React, { useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppLayout from '../../components/AppLayout';
import { useTimesheetStore } from '../../store/timesheetStore';
import { spacing } from '../../theme/spacing';
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

  useEffect(() => { loadWeeks(); }, [loadWeeks]);

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

  const grandTotal = useMemo(() => byEmployee.reduce((s, e) => s + e.total, 0), [byEmployee]);

  return (
    <AppLayout>
      <Text style={styles.pageTitle}>Total Hours</Text>

      <View style={styles.grandTotalCard}>
        <View>
          <Text style={styles.grandTotalLabel}>Grand Total</Text>
          <Text style={styles.grandTotalSubtitle}>{byEmployee.length} employee{byEmployee.length !== 1 ? 's' : ''}</Text>
        </View>
        <Text style={styles.grandTotalValue}>{grandTotal.toFixed(1)}</Text>
      </View>

      <FlatList
        data={byEmployee}
        keyExtractor={(item) => item.employeeId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.employeeName}>{item.employeeName}</Text>
              <View style={styles.totalBadge}>
                <Text style={styles.totalBadgeValue}>{item.total.toFixed(1)}</Text>
                <Text style={styles.totalBadgeLabel}>hrs</Text>
              </View>
            </View>
            <View style={styles.weekList}>
              {item.weeks.map((w, i) => (
                <View key={i} style={styles.weekRow}>
                  <Text style={styles.weekLabel}>{w.weekEnd} – {w.weekStart}</Text>
                  <Text style={styles.weekHours}>{w.hours.toFixed(1)} hrs</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      />
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: 24,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: spacing.md,
  },
  grandTotalCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 5,
  },
  grandTotalLabel: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  grandTotalSubtitle: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  grandTotalValue: {
    fontSize: 36,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  list: { paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  employeeName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  totalBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    backgroundColor: colors.primarySurface,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  totalBadgeValue: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.3,
  },
  totalBadgeLabel: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: colors.primary,
  },
  weekList: { gap: 4 },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  weekLabel: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    flex: 1,
  },
  weekHours: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textSecondary,
  },
});

export default TotalHoursDetailScreen;
