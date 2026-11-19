import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows, typography, fontSizes, ms } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginTop: spacing.sm,
    borderWidth: ms(1),
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  noticeBox: {
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: ms(4),
    borderLeftColor: colors.warning,
  },
  noticeText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontSize: fontSizes.xs,
    lineHeight: ms(18),
  },
  sectionTitle: {
    ...typography.subtitle2,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: ms(1.5),
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  userCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceVariant,
  },
  avatarBadge: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.subtitle1,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  userDesignation: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
  },
  companyTag: {
    ...typography.caption,
    fontSize: fontSizes.xxs,
    color: colors.primary,
    fontWeight: '700',
    marginTop: ms(2),
  },
});
