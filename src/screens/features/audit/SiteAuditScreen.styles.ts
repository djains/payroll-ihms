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

  // ── Enterprise Scope Card ──
  scopeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: ms(1),
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  scopeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: ms(1),
    borderBottomColor: colors.borderLight,
    marginBottom: spacing.sm,
  },
  scopeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  scopeIconWrap: {
    width: ms(36),
    height: ms(36),
    borderRadius: borderRadius.md,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeHeaderTitle: {
    ...typography.subtitle1,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scopeHeaderSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: ms(1),
  },

  // 2x2 Scope Grid
  scopeGrid: {
    gap: spacing.xs,
  },
  scopeGridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  scopeGridCell: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.sm,
    paddingVertical: ms(7),
    borderRadius: borderRadius.sm,
  },
  scopeGridLabel: {
    ...typography.caption,
    fontSize: fontSizes.xxs,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scopeGridValue: {
    ...typography.body2,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: ms(1),
  },

  // ── Main Card ──
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: ms(1),
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  checklistHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.subtitle2,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  badgeWrap: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.sm,
    paddingVertical: ms(3),
    borderRadius: borderRadius.full,
  },
  badgeText: {
    ...typography.caption,
    fontSize: fontSizes.xxs,
    fontWeight: '700',
  },

  // ── Grade / Service Category Tabs ──
  gradeTabContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  gradeTab: {
    flex: 1,
    paddingVertical: ms(7),
    paddingHorizontal: ms(4),
    borderRadius: borderRadius.md,
    borderWidth: ms(1),
    borderColor: colors.borderLight,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeTabText: {
    ...typography.caption,
    fontSize: fontSizes.xxs,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // Question item
  questionCard: {
    paddingVertical: spacing.sm,
    borderBottomWidth: ms(1),
    borderBottomColor: colors.borderLight,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(3),
  },
  categoryBadge: {
    ...typography.caption,
    fontSize: fontSizes.xxs,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  questionText: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    lineHeight: ms(19),
  },

  // Photo preview
  previewContainer: {
    position: 'relative',
    marginVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  previewImage: {
    width: ms(80),
    height: ms(80),
    borderRadius: borderRadius.sm,
    borderWidth: ms(1),
    borderColor: colors.border,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -ms(6),
    right: -ms(6),
    backgroundColor: colors.danger,
    width: ms(20),
    height: ms(20),
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Action Buttons
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  yesNoBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: ms(5),
    borderRadius: borderRadius.sm,
    borderWidth: ms(1),
    borderColor: colors.border,
    minWidth: ms(52),
    alignItems: 'center',
  },
  yesActive: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  noActive: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
  },
  yesNoText: {
    ...typography.caption,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  yesTextActive: {
    color: colors.success,
  },
  noTextActive: {
    color: colors.danger,
  },

  photoEvidenceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: ms(5),
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceVariant,
    gap: spacing.xs,
    borderWidth: ms(1),
    borderColor: 'transparent',
  },
  photoEvidenceBtnActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  photoEvidenceText: {
    ...typography.caption,
    fontSize: fontSizes.xxs,
    fontWeight: '600',
    color: colors.primary,
  },
  photoEvidenceTextActive: {
    color: '#15803D',
  },

  submitBtn: {
    marginTop: spacing.md,
  },
});
