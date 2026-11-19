import { StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing, borderRadius, shadows } from '../../../theme/spacing';
import { typography, fontSizes } from '../../../theme/typography';
import { ms } from '../../../theme/responsive';

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: ms(60),
    backgroundColor: '#F8FAFC',
  },

  // ── Assigned Unit Scope Card (Enterprise Standard) ──
  scopeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  scopeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  scopeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  scopeIconWrap: {
    width: ms(34),
    height: ms(34),
    borderRadius: borderRadius.sm,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  scopeHeaderTitle: {
    ...typography.body2,
    fontWeight: '700',
    color: '#0F172A',
  },
  scopeHeaderSubtitle: {
    ...typography.caption,
    color: '#64748B',
    marginTop: 1,
  },
  scoreBadgeWrap: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  scoreBadgeText: {
    ...typography.body2,
    fontWeight: '800',
    color: '#B45309',
  },
  scopeGrid: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scopeGridRow: {
    flexDirection: 'row',
  },
  scopeGridCell: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  scopeGridLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scopeGridValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },

  // ── Form Cards ──
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionBadge: {
    width: ms(22),
    height: ms(22),
    borderRadius: ms(11),
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  sectionBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionTitle: {
    ...typography.body1,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubtitle: {
    ...typography.caption,
    color: '#64748B',
    marginTop: 1,
  },

  // ── Criteria Rows ──
  criteriaRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  criteriaTextWrap: {
    marginBottom: 6,
  },
  criteriaName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  criteriaSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starBtn: {
    paddingVertical: 2,
    paddingHorizontal: 3,
  },
  starScoreNumber: {
    marginLeft: 8,
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  // ── Inputs & Signature Card ──
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: spacing.sm,
    marginBottom: 6,
  },
  inputRequired: {
    color: '#EF4444',
  },
  signCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.md,
  },
  signCardActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  signCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  signIconCircle: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  signIconCircleActive: {
    backgroundColor: '#DCFCE7',
  },
  signCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  signCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  signatureBox: {
    minHeight: ms(95),
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  signatureBoxActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#22C55E',
    borderStyle: 'solid',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  signatureInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  signPenCircle: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  signaturePlaceholder: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  signatureSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
  },
  signedContentWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  signatureScriptBox: {
    alignItems: 'center',
    marginBottom: 6,
  },
  signatureScriptText: {
    fontSize: 22,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#15803D',
    letterSpacing: 1,
  },
  signatureUnderline: {
    width: ms(120),
    height: 2,
    backgroundColor: '#22C55E',
    marginTop: 2,
    borderRadius: 1,
  },
  signedBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  signedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  signatureClearHint: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 6,
  },

  // ── Signer Details Pill ──
  signerPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.sm,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  signerPillRepCol: {
    flex: 1.6,
  },
  signerPillFixedCol: {
    flex: 1,
  },
  signerPillLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  signerPillValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  signerPillDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },

  submitBtn: {
    marginTop: spacing.xs,
  },
});
