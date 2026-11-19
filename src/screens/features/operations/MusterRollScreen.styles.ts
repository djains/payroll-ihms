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
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  shiftRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  shiftBtn: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftBtnActive: {
    backgroundColor: colors.primary,
  },
  shiftText: {
    ...typography.caption,
    fontSize: fontSizes.xxs,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  shiftTextActive: {
    color: colors.textInverse,
  },
  guardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: ms(1),
    borderBottomColor: colors.borderLight,
  },
  guardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  guardAvatar: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  guardName: {
    ...typography.subtitle2,
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: fontSizes.xs,
  },
  guardMeta: {
    ...typography.caption,
    fontSize: fontSizes.xxs,
    color: colors.textSecondary,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statusMiniBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: ms(4),
    borderRadius: borderRadius.sm,
    borderWidth: ms(1),
    borderColor: colors.border,
  },
  presentActive: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  absentActive: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
  },
  statusMiniText: {
    ...typography.caption,
    fontSize: fontSizes.xxs,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  relieverSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: ms(1),
    borderTopColor: colors.borderLight,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
});
