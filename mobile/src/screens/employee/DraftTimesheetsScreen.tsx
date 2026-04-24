import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AppLayout from '../../components/AppLayout';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTimesheetStore } from '../../store/timesheetStore';
import { useAuthStore } from '../../store/authStore';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<any>;

const formatFullWeekRange = (weekStartString: string) => {
  const [dd, mm, yyyy] = weekStartString.split('/').map(Number);
  const startDate = new Date(yyyy, mm - 1, dd);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const fmt = (d: Date) => `${days[d.getDay()]} ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  return `${fmt(startDate)} – ${fmt(endDate)}`;
};

const STATUS_FILTERS = ['Draft', 'Submitted'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const DraftTimesheetsScreen: React.FC<Props> = ({ navigation }) => {
  const weeks = useTimesheetStore((s) => s.weeks);
  const isLoading = useTimesheetStore((s) => s.isLoading);
  const loadWeeks = useTimesheetStore((s) => s.loadWeeks);
  const user = useAuthStore((s) => s.user);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Draft');

  useEffect(() => {
    if (user?.id) loadWeeks(user.id);
  }, [user?.id, loadWeeks]);

  const filteredWeeks = weeks.filter((w) => w.status === statusFilter);

  return (
    <AppLayout>
      <Text style={styles.pageTitle}>Drafts</Text>

      <View style={styles.tabRow}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.tab, statusFilter === f && styles.tabActive]}
            onPress={() => setStatusFilter(f)}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabText, statusFilter === f && styles.tabTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredWeeks.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No {statusFilter.toLowerCase()} timesheets</Text>
          <Text style={styles.emptySubtitle}>
            {statusFilter === 'Draft'
              ? 'Start a new timesheet from the home screen.'
              : 'Submit a draft timesheet to see it here.'}
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {filteredWeeks.map((w) => {
            const totalHours = w.days.reduce((sum, d) => sum + d.hours, 0);
            const daysWithEntries = w.days.filter((d) => d.hours > 0).length;
            return (
              <TouchableOpacity
                key={w.id}
                style={styles.card}
                onPress={() => navigation.navigate('WeekReview', { weekId: w.id, canEdit: false })}
                activeOpacity={0.8}
              >
                <View style={[styles.cardAccent, statusFilter === 'Draft' ? styles.draftAccent : styles.submittedAccent]} />
                <View style={styles.cardContent}>
                  <Text style={styles.weekRange}>{formatFullWeekRange(w.weekStart)}</Text>
                  <View style={styles.cardMeta}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaValue}>{totalHours.toFixed(1)}</Text>
                      <Text style={styles.metaLabel}>hrs</Text>
                    </View>
                    <View style={styles.metaDivider} />
                    <View style={styles.metaItem}>
                      <Text style={styles.metaValue}>{daysWithEntries}</Text>
                      <Text style={styles.metaLabel}>days</Text>
                    </View>
                    <View style={[styles.statusPill, statusFilter === 'Draft' ? styles.draftPill : styles.submittedPill]}>
                      <Text style={[styles.statusPillText, statusFilter === 'Draft' ? styles.draftPillText : styles.submittedPillText]}>
                        {w.status}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.arrow}>
                  <View style={styles.arrowLine} />
                  <View style={styles.arrowHead} />
                </View>
              </TouchableOpacity>
            );
          })}
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
    marginBottom: spacing.md,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  loading: {
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 48,
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
    textAlign: 'center',
  },
  list: {
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  cardAccent: {
    width: 4,
    alignSelf: 'stretch',
  },
  draftAccent: {
    backgroundColor: colors.warning,
  },
  submittedAccent: {
    backgroundColor: colors.info,
  },
  cardContent: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: spacing.sm,
  },
  weekRange: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  metaValue: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
    color: colors.textSecondary,
  },
  metaLabel: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: colors.textMuted,
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.border,
  },
  statusPill: {
    marginLeft: 'auto',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  draftPill: { backgroundColor: colors.warningSurface },
  submittedPill: { backgroundColor: colors.infoSurface },
  statusPillText: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    fontWeight: '700',
  },
  draftPillText: { color: colors.warning },
  submittedPillText: { color: colors.info },
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
});

export default DraftTimesheetsScreen;
