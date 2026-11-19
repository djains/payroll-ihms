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
    paddingBottom: ms(80),
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: ms(1),
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  typeBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: ms(6),
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceVariant,
    borderWidth: ms(1),
    borderColor: colors.border,
  },
  typeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeText: {
    ...typography.caption,
    fontSize: fontSizes.xxs,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  typeTextActive: {
    color: colors.textInverse,
  },
  photoBox: {
    height: ms(100),
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: ms(1),
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  photoBoxText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  submitBtn: {
    marginTop: spacing.xs,
  },
});
