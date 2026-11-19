import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { typography, fontSizes } from '../../theme/typography';
import { ms } from '../../theme/responsive';

export const styles = StyleSheet.create({
  // Horizontal row card (for 1-column layouts)
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  iconBox: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    ...typography.subtitle2,
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: fontSizes.sm,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    marginTop: ms(2),
  },
  arrowContainer: {
    padding: spacing.xs,
  },

  // Responsive Grid Tile (for multi-column layouts)
  gridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: ms(12),
    borderWidth: 1,
    borderColor: '#EFECE4',
    minHeight: ms(116),
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  gridTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  gridIconBox: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF8F2',
  },
  gridChevron: {
    opacity: 0.4,
  },
  gridTitle: {
    ...typography.subtitle2,
    color: '#111827',
    fontWeight: '700',
    fontSize: fontSizes.xs,
    lineHeight: ms(17),
    marginBottom: ms(2),
  },
  gridDescription: {
    ...typography.caption,
    color: '#6B7280',
    fontSize: fontSizes.xxs,
    lineHeight: ms(14),
  },
});
