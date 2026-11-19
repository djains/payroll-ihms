import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows, typography, fontSizes, ms } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  // Summary Stats Header Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryColBorder: {
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
  },
  summaryNumber: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryLabel: {
    fontSize: fontSizes.xxs,
    fontWeight: '700',
    color: '#64748B',
    marginTop: ms(2),
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Search / Filter Row
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: ms(10),
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: ms(8),
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.xs + 0.5,
    color: '#0F172A',
    fontWeight: '500',
    padding: 0,
  },

  // Material Item Card
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: ms(10),
    marginBottom: ms(10),
  },
  itemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    flex: 1,
  },
  itemIconCircle: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: '#0F172A',
  },
  itemCodeText: {
    fontSize: fontSizes.xxs,
    color: '#64748B',
    fontWeight: '600',
    marginTop: ms(1),
  },
  unitPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: ms(8),
    paddingVertical: ms(3),
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  unitPillText: {
    fontSize: fontSizes.xxs,
    fontWeight: '700',
    color: '#475569',
  },

  // Stock Controls Row
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  stockCol: {
    gap: ms(2),
  },
  stockLabel: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  stockValueWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: ms(3),
  },
  stockValue: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: '#0F172A',
  },
  stockUnitSmall: {
    fontSize: fontSizes.xxs,
    color: '#94A3B8',
    fontWeight: '600',
  },

  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: ms(3),
    gap: ms(6),
  },
  stepperBtn: {
    width: ms(32),
    height: ms(32),
    borderRadius: borderRadius.sm,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: '#0F172A',
  },
  stepperCount: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: '#0F172A',
    minWidth: ms(28),
    textAlign: 'center',
  },

  // Status Badge Row
  statusRow: {
    marginTop: ms(10),
    paddingTop: ms(8),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    paddingHorizontal: ms(8),
    paddingVertical: ms(3),
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: fontSizes.xxs,
    fontWeight: '700',
  },
  stockRateText: {
    fontSize: fontSizes.xxs,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // Empty & Loader
  emptyContainer: {
    paddingVertical: ms(40),
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(8),
  },
  emptyTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: fontSizes.xs,
    color: '#64748B',
  },

  actionContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
});
