import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows, typography, fontSizes, ms } from '../../theme';

export const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: ms(13),
    ...shadows.sm,
  },
  fullWidth: {
    width: '100%',
  },
  // Variant styles
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
    elevation: 0,
    shadowOpacity: 0,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  ghost: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  accent: {
    backgroundColor: colors.accent,
  },
  // Sizes
  sizeSm: {
    paddingVertical: ms(8),
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  sizeMd: {
    paddingVertical: ms(13),
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  sizeLg: {
    paddingVertical: ms(16),
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
  },
  // States
  disabled: {
    opacity: 0.5,
  },
  // Typography
  textBase: {
    ...typography.button,
    textAlign: 'center',
    includeFontPadding: false,
  },
  textPrimary: {
    color: colors.textInverse,
  },
  textSecondary: {
    color: colors.textPrimary,
  },
  textOutline: {
    color: colors.primary,
  },
  textDanger: {
    color: colors.textInverse,
  },
  textGhost: {
    color: colors.textSecondary,
  },
  textAccent: {
    color: colors.textPrimary,
  },
  textSm: {
    fontSize: fontSizes.xs,
  },
  textMd: {
    fontSize: fontSizes.md,
  },
  textLg: {
    fontSize: fontSizes.lg,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
  spinner: {
    marginRight: spacing.xs,
  },
});
