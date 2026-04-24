import React, { useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
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

const TITLE_MAP: Record<string, string> = {
  Submitted: 'Pending Approval',
  Approved:  'Approved',
  Rejected:  'Rejected',
  Draft:     'Drafts',
};

const ManagerTimesheetListScreen: React.FC<Props> = ({ route, navigation }) => {
  const { status } = route.params ?? { status: 'Submitted' as TimesheetStatus };
  const weeks = useTimesheetStore((s) => s.weeks);
  const isLoading = useTimesheetStore((s) => s.isLoading);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);

  useFocusEffect(useCallback(() => { loadWeeks(); }, [loadWeeks]));

  const filtered = weeks.filter((w) => w.status === status);
  const cfg = STATUS_CONFIG[status as TimesheetStatus] ?? STATUS_CONFIG.Submitted;

  const renderCard = useCallback(
    ({ item }: { item: WeekTimesheet }) => {
      const totalHours = item.days.reduce((s, d) => s + d.hours, 0);
      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('ManagerTimesheetDetail', { weekId: item.id })}
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
            <Text style={[styles.hours, { color: cfg.color }]}>{totalHours.toFixed(1)} hrs total</Text>
            {item.rejectionComment && (
              <View style={styles.rejectNote}>
                <Text style={styles.rejectNoteText} numberOfLines={2}>{item.rejectionComment}</Text>
              </View>
            )}
          </View>
          <View style={styles.arrow}>
            <View style={styles.arrowLine} />
            <View style={styles.arrowHead} />
          </View>
        </TouchableOpacity>
      );
    },
    [navigation, cfg],
  );

  return (
    <AppLayout>
      <Text style={styles.pageTitle}>{TITLE_MAP[status] ?? status}</Text>
      <Text style={styles.pageSubtitle}>{filtered.length} timesheet{filtered.length !== 1 ? 's' : ''}</Text>

      {isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderCard}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No timesheets</Text>
              <Text style={styles.emptySubtitle}>Nothing to show here yet.</Text>
            </View>
          ) : null
        }
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
  },
  pageSubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    marginBottom: spacing.md,
    marginTop: 2,
  },
  loading: { paddingVertical: spacing.sm, alignItems: 'center' },
  list: { paddingBottom: spacing.xl },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  cardAccent: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  employeeName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
  },
  weekRange: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
    marginBottom: 4,
  },
  hours: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
  },
  rejectNote: {
    marginTop: 6,
    padding: 8,
    backgroundColor: colors.errorSurface,
    borderRadius: 8,
  },
  rejectNoteText: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: colors.error,
  },
  arrow: {
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowLine: {
    width: 10,
    height: 1.5,
    backgroundColor: colors.textMuted,
    borderRadius: 1,
  },
  arrowHead: {
    width: 5,
    height: 5,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: colors.textMuted,
    transform: [{ rotate: '45deg' }, { translateX: -2.5 }],
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
  },
});

export default ManagerTimesheetListScreen;
