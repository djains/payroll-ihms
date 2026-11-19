import { StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing, borderRadius, shadows } from '../../../theme/spacing';
import { typography, fontSizes } from '../../../theme/typography';
import { ms } from '../../../theme/responsive';

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingBottom: ms(100),
    backgroundColor: colors.background,
  },

  // Month Navigation Bar
  monthNavCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: ms(1),
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navArrowBtn: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: ms(1),
    borderColor: colors.borderLight,
  },
  navArrowText: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: ms(22),
  },
  monthTitleText: {
    ...typography.h3,
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  monthSubText: {
    ...typography.caption,
    fontSize: fontSizes.xxs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: ms(2),
  },

  // Quick Month Switcher Pills
  pillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: ms(6),
    marginTop: ms(8),
    paddingTop: ms(6),
    borderTopWidth: ms(1),
    borderTopColor: colors.borderLight,
  },
  pillBtn: {
    paddingHorizontal: ms(10),
    paddingVertical: ms(4),
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceVariant,
    borderWidth: ms(1),
    borderColor: colors.borderLight,
  },
  pillBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  pillText: {
    fontSize: fontSizes.xxs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: '#2563EB',
    fontWeight: '800',
  },

  // Attendance Ratio Hero Card
  ratioCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: ms(1),
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  ratioTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(8),
  },
  ratioLabel: {
    ...typography.caption,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flexShrink: 1,
    marginRight: ms(8),
  },
  ratioBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: ms(10),
    paddingVertical: ms(4),
    borderRadius: borderRadius.full,
    borderWidth: ms(1),
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ratioBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    color: '#15803D',
    textAlign: 'center',
  },
  ratioScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: ms(8),
  },
  ratioScoreMain: {
    fontSize: fontSizes.xxl,
    fontWeight: '900',
    color: '#15803D',
  },
  ratioScoreTotal: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.textSecondary,
    marginLeft: ms(4),
  },
  ratioScoreUnit: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: ms(6),
  },
  // Progress Bar
  progressBarTrack: {
    height: ms(8),
    borderRadius: ms(4),
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: ms(8),
  },
  progressBarFill: {
    height: '100%',
    borderRadius: ms(4),
    backgroundColor: '#10B981',
  },
  ratioFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratioFooterText: {
    fontSize: fontSizes.xxs,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // Policy Badge
  policyBanner: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    paddingVertical: ms(5),
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: ms(1),
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyBannerText: {
    fontSize: fontSizes.xxs,
    fontWeight: '600',
    color: '#475569',
  },

  // 6-Grid Summary Metrics
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ms(6),
    marginBottom: spacing.sm,
  },
  metricCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    borderWidth: ms(1),
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  metricVal: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    lineHeight: ms(20),
  },
  metricLabel: {
    fontSize: fontSizes.xxs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: ms(2),
    fontWeight: '600',
  },

  // Calendar Card
  calendarCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: ms(1),
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  // Legend
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: ms(1),
    borderBottomColor: colors.borderLight,
    marginBottom: spacing.sm,
    gap: ms(4),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
  },
  legendDot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
  },
  legendText: {
    fontSize: fontSizes.xxs,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // Weekday row
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: ms(6),
  },
  weekdayCol: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: fontSizes.xxs,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },

  // Calendar Grid
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCol: {
    width: '14.28%',
    aspectRatio: 1,
    padding: ms(2.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBox: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: ms(1),
    borderColor: 'transparent',
  },
  selectedDayBox: {
    borderWidth: ms(2),
    borderColor: '#1D4ED8',
    transform: [{ scale: 1.05 }],
    ...shadows.sm,
  },
  todayIndicator: {
    position: 'absolute',
    top: ms(2),
    right: ms(2),
    width: ms(5),
    height: ms(5),
    borderRadius: ms(2.5),
    backgroundColor: '#FFFFFF',
  },
  dayNum: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    color: colors.textInverse,
  },
  dayStatusBadge: {
    fontSize: ms(8),
    fontWeight: '800',
    color: colors.textInverse,
    marginTop: ms(1),
    opacity: 0.9,
  },

  // Selected Day Details Panel
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: ms(1),
    borderColor: colors.borderLight,
    ...shadows.sm,
    marginBottom: spacing.md,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: ms(1),
    borderBottomColor: colors.borderLight,
    marginBottom: spacing.sm,
  },
  detailDate: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  detailWeekday: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: ms(1),
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: ms(4),
    borderRadius: borderRadius.full,
  },
  statusBadgeText: {
    fontSize: fontSizes.xxs,
    fontWeight: '800',
    color: colors.textInverse,
    textTransform: 'uppercase',
  },

  // 3-Column Detail Row
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: ms(8),
    marginBottom: spacing.sm,
  },
  detailBox: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
    paddingVertical: spacing.sm,
    paddingHorizontal: ms(4),
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: ms(1),
    borderColor: colors.borderLight,
  },
  detailBoxLabel: {
    fontSize: fontSizes.xxs,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: ms(4),
  },
  detailBoxValue: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  statusNoteCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    paddingVertical: ms(8),
    paddingHorizontal: spacing.sm,
    borderWidth: ms(1),
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: ms(4),
  },
  statusNoteText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },

  // Selfie / Photo container
  photoContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: ms(1),
    borderTopColor: colors.borderLight,
  },
  photoLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  photoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  photoThumb: {
    width: ms(80),
    height: ms(80),
    borderRadius: borderRadius.md,
    borderWidth: ms(1),
    borderColor: colors.borderLight,
    backgroundColor: colors.surfaceVariant,
  },

  // Empty state for off-days / no-punch
  emptyDayNote: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: ms(1),
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginTop: ms(4),
  },
  emptyDayNoteText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
