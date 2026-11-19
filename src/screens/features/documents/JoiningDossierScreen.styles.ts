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
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: ms(1),
    borderBottomColor: colors.borderLight,
  },
  docLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  stepCircleDone: {
    backgroundColor: colors.successLight,
  },
  stepNum: {
    ...typography.caption,
    fontSize: fontSizes.xxs,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  docName: {
    ...typography.subtitle2,
    color: colors.textPrimary,
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
  docDesc: {
    ...typography.caption,
    fontSize: fontSizes.xxs,
    color: colors.textSecondary,
  },
  uploadActionBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: ms(4),
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceVariant,
  },
  uploadActionDone: {
    backgroundColor: colors.successLight,
  },
  uploadActionText: {
    ...typography.caption,
    fontSize: fontSizes.xxs,
    fontWeight: '700',
    color: colors.primary,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
});
