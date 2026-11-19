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
    backgroundColor: '#EDE9FE',
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
    backgroundColor: '#EDE9FE',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  scoreBadgeText: {
    ...typography.body2,
    fontWeight: '800',
    color: '#7C3AED',
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

  // ── 10-Point Checklist Rows ──
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  checkRowActive: {
    backgroundColor: '#FAF5FF',
  },
  checkbox: {
    width: ms(20),
    height: ms(20),
    borderRadius: ms(5),
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  checkTextWrap: {
    flex: 1,
  },
  checkLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  checkLabelChecked: {
    color: '#0F172A',
    fontWeight: '700',
  },
  checkSubLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  statusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusTagPass: {
    backgroundColor: '#DCFCE7',
  },
  statusTagFail: {
    backgroundColor: '#FEE2E2',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextPass: {
    color: '#15803D',
  },
  statusTextFail: {
    color: '#B91C1C',
  },

  // ── Photo Evidence Box ──
  photoBox: {
    minHeight: ms(95),
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cameraIconCircle: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  photoBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  photoBoxSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  photoPreviewCard: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
    position: 'relative',
    height: ms(160),
    backgroundColor: '#0F172A',
  },
  photoPreviewImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPreviewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  photoAttachedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoAttachedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  retakeBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },

  submitBtn: {
    marginTop: spacing.xs,
  },
});
