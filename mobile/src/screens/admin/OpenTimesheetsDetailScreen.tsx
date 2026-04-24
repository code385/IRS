import React, { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppLayout from '../../components/AppLayout';
import { useTimesheetStore, WeekTimesheet, TimesheetStatus } from '../../store/timesheetStore';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<any>;

const STATUS_CONFIG: Record<TimesheetStatus, { color: string; bg: string }> = {
  Draft:     { color: colors.warning,  bg: colors.warningSurface  },
  Submitted: { color: colors.info,     bg: colors.infoSurface     },
  Approved:  { color: colors.success,  bg: colors.successSurface  },
  Rejected:  { color: colors.error,    bg: colors.errorSurface    },
};

const OpenTimesheetsDetailScreen: React.FC<Props> = ({ navigation }) => {
  const weeks = useTimesheetStore((s) => s.weeks);
  const isLoading = useTimesheetStore((s) => s.isLoading);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);

  useEffect(() => { loadWeeks(); }, [loadWeeks]);

  const submitted = weeks.filter((w) => w.status === 'Submitted');
  const draft = weeks.filter((w) => w.status === 'Draft');
  const approved = weeks.filter((w) => w.status === 'Approved');

  const renderCard = useCallback(
    (item: WeekTimesheet) => {
      const totalHours = item.days.reduce((s, d) => s + d.hours, 0);
      const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.Submitted;

      return (
        <TouchableOpacity
          key={item.id}
          style={styles.card}
          onPress={() => navigation.navigate('AdminTimesheetDetail', { weekId: item.id })}
          activeOpacity={0.8}
        >
          <View style={[styles.cardAccent, { backgroundColor: cfg.color }]} />
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.employeeName}>{item.employeeName || 'Unknown'}</Text>
              <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.badgeText, { color: cfg.color }]}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.weekRange}>{item.label} – {item.weekStart}</Text>
            <Text style={[styles.hours, { color: cfg.color }]}>{totalHours.toFixed(1)} hrs</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [navigation],
  );

  const Section = ({ title, count, data, emptyText }: {
    title: string; count: number; data: WeekTimesheet[]; emptyText: string;
  }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{count}</Text>
        </View>
      </View>
      {data.length === 0 ? (
        <Text style={styles.emptyText}>{emptyText}</Text>
      ) : (
        data.map((item) => renderCard(item))
      )}
    </View>
  );

  return (
    <AppLayout>
      <Text style={styles.pageTitle}>Timesheets Overview</Text>
      <Text style={styles.pageSubtitle}>Submitted = pending manager approval</Text>

      {isLoading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Section
            title="Submitted"
            count={submitted.length}
            data={submitted}
            emptyText="No timesheets pending approval"
          />
          <Section
            title="Approved"
            count={approved.length}
            data={approved}
            emptyText="No approved timesheets"
          />
          <Section
            title="Draft"
            count={draft.length}
            data={draft}
            emptyText="No draft timesheets"
          />
        </ScrollView>
      )}
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
  },
  pageSubtitle: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    marginBottom: spacing.lg,
    marginTop: 2,
  },
  loading: { paddingTop: spacing.xl, alignItems: 'center' },
  scroll: { paddingBottom: spacing.xl },
  section: { marginBottom: spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  countBadge: {
    backgroundColor: colors.primarySurface,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.primary,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  cardAccent: { width: 4 },
  cardContent: { flex: 1, padding: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  employeeName: { fontSize: 14, fontFamily: 'Lato_700Bold', fontWeight: '700', color: colors.textPrimary, flex: 1 },
  badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontFamily: 'Lato_700Bold', fontWeight: '700' },
  weekRange: { fontSize: 12, fontFamily: 'Lato_400Regular', color: colors.textMuted, marginBottom: 2 },
  hours: { fontSize: 13, fontFamily: 'Lato_700Bold', fontWeight: '700' },
});

export default OpenTimesheetsDetailScreen;
