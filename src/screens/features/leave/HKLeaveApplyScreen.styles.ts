import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography, fontSizes, ms } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  shiftRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  shiftChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    marginHorizontal: ms(3),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  shiftChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  shiftChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: fontSizes.xs,
  },
  shiftChipTextActive: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  infoBanner: {
    backgroundColor: colors.infoLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  infoText: {
    ...typography.caption,
    color: colors.info,
  },
  actionContainer: {
    marginTop: spacing.md,
  },
});
