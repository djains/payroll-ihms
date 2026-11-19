import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography, fontSizes } from '../../theme/typography';
import { ms } from '../../theme/responsive';

export const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.subtitle1,
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: fontSizes.md,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    marginTop: ms(2),
  },
  countBadge: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.sm,
    paddingVertical: ms(3),
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countText: {
    ...typography.caption,
    fontSize: fontSizes.xxs,
    fontWeight: '700',
    color: colors.primary,
  },
  gridContainer: {
    width: '100%',
  },
  gridMultiColumn: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  itemWrapper: {
    width: '100%',
    marginBottom: spacing.xs,
  },
  col2: {
    width: '50%',
    paddingHorizontal: spacing.xs,
  },
  col3: {
    width: '33.333%',
    paddingHorizontal: spacing.xs,
  },
  col4: {
    width: '25%',
    paddingHorizontal: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginTop: spacing.md,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
