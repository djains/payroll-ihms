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
  photoBox: {
    height: ms(140),
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: ms(1),
    borderColor: colors.border,
    marginVertical: spacing.md,
  },
  photoText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
  imagePreviewContainer: {
    marginVertical: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    height: ms(160),
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardPreview: {
    width: '100%',
    height: '100%',
  },
  imageActionOverlay: {
    position: 'absolute',
    bottom: spacing.xs,
    right: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  changeImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.sm,
    paddingVertical: ms(5),
    borderRadius: borderRadius.full,
    gap: ms(4),
  },
  changeImageText: {
    color: '#FFFFFF',
    fontSize: fontSizes.xxs,
    fontWeight: '700',
  },
  removeImageBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
