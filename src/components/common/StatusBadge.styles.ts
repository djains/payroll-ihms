import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography, fontSizes } from '../../theme/typography';
import { ms } from '../../theme/responsive';

export const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: ms(3),
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: ms(6),
    height: ms(6),
    borderRadius: borderRadius.full,
    marginRight: ms(4),
  },
  text: {
    ...typography.badge,
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
  // Status Variants
  success: {
    backgroundColor: colors.successLight,
  },
  textSuccess: {
    color: colors.success,
  },
  danger: {
    backgroundColor: colors.dangerLight,
  },
  textDanger: {
    color: colors.danger,
  },
  warning: {
    backgroundColor: colors.warningLight,
  },
  textWarning: {
    color: colors.warning,
  },
  info: {
    backgroundColor: colors.infoLight,
  },
  textInfo: {
    color: colors.info,
  },
  neutral: {
    backgroundColor: colors.surfaceVariant,
  },
  textNeutral: {
    color: colors.textSecondary,
  },
});
