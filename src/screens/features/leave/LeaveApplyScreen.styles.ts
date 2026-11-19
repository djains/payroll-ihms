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

  // Segmented Tabs (Apply vs History)
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    padding: ms(3),
    marginBottom: spacing.md,
    borderWidth: ms(1),
    borderColor: colors.borderLight,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: ms(8),
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  tabText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: '800',
  },

  // Hero Remaining Balance Card
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: ms(1),
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(6),
  },
  heroHeaderLabel: {
    fontSize: ms(10),
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: ms(8),
    paddingVertical: ms(3),
    borderRadius: borderRadius.full,
    borderWidth: ms(1),
    borderColor: '#BFDBFE',
  },
  heroBadgeText: {
    fontSize: ms(10),
    fontWeight: '700',
    color: '#1D4ED8',
  },
  heroMainRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: ms(6),
  },
  heroDaysVal: {
    fontSize: ms(30),
    fontWeight: '900',
    color: colors.textPrimary,
  },
  heroDaysSub: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  // 3-Column Quota Summary Grid (1/2, 2/2, 2/2)
  quotaGrid: {
    flexDirection: 'row',
    gap: ms(8),
    marginBottom: spacing.sm,
  },
  quotaCard: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: ms(10),
    paddingHorizontal: ms(6),
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: ms(1),
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  quotaTitle: {
    fontSize: fontSizes.xxs,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  quotaVal: {
    fontSize: fontSizes.sm,
    fontWeight: '900',
    marginTop: ms(2),
  },
  quotaSub: {
    fontSize: ms(9),
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: ms(1),
  },

  // Main Form Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: ms(1),
    borderColor: colors.borderLight,
    ...shadows.sm,
  },

  // Selected Balance Hero Box
  balanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: ms(1),
    borderColor: '#E2E8F0',
  },
  balanceLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    fontSize: fontSizes.xs,
    fontWeight: '800',
  },
  balanceSub: {
    fontSize: fontSizes.xxs,
    color: colors.textSecondary,
    marginTop: ms(2),
  },
  balanceVal: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontWeight: '900',
  },
  quotaBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: ms(10),
    paddingVertical: ms(5),
    borderRadius: borderRadius.full,
    borderWidth: ms(1),
    borderColor: '#BFDBFE',
  },

  // Leave Type Selection
  sectionTitle: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: ms(8),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: ms(8),
    paddingHorizontal: ms(4),
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceVariant,
    borderWidth: ms(1),
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeText: {
    fontSize: fontSizes.xxs,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  typeTextActive: {
    color: colors.textInverse,
  },
  typePill: {
    marginTop: ms(3),
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: ms(6),
    paddingVertical: ms(1),
    borderRadius: borderRadius.full,
  },
  typePillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  typePillText: {
    fontSize: ms(9),
    fontWeight: '800',
    color: colors.textSecondary,
  },
  typePillTextActive: {
    color: colors.textInverse,
  },

  submitBtn: {
    marginTop: spacing.sm,
  },

  // Leave History Tab Styles
  historyList: {
    gap: spacing.sm,
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: ms(1),
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(6),
  },
  historyTypeBadge: {
    paddingHorizontal: ms(8),
    paddingVertical: ms(3),
    borderRadius: borderRadius.sm,
    backgroundColor: '#EFF6FF',
  },
  historyTypeText: {
    fontSize: fontSizes.xxs,
    fontWeight: '800',
    color: '#2563EB',
  },
  statusBadge: {
    paddingHorizontal: ms(8),
    paddingVertical: ms(3),
    borderRadius: borderRadius.full,
  },
  statusBadgeText: {
    fontSize: fontSizes.xxs,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  historyDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(4),
  },
  historyDatesText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  historyDaysPill: {
    marginLeft: ms(8),
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: ms(6),
    paddingVertical: ms(2),
    borderRadius: borderRadius.sm,
  },
  historyDaysText: {
    fontSize: ms(10),
    fontWeight: '700',
    color: colors.textSecondary,
  },
  historyReasonText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: ms(18),
    marginTop: ms(4),
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: ms(8),
    paddingTop: ms(6),
    borderTopWidth: ms(1),
    borderTopColor: colors.borderLight,
  },
  historyFooterText: {
    fontSize: fontSizes.xxs,
    color: colors.textMuted,
  },

  // Empty State
  emptyBox: {
    paddingVertical: ms(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: ms(36),
    marginBottom: ms(8),
  },
  emptyTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: ms(4),
  },
  emptySubtitle: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
