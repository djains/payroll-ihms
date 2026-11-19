import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { ms } from '../../theme/responsive';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: ms(1),
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  flat: {
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: ms(1),
    borderColor: colors.border,
  },
  outlined: {
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: ms(1.5),
    borderColor: colors.border,
  },
  elevated: {
    ...shadows.md,
  },
});
