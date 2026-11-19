import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows, fontSizes, ms } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: ms(14),
    paddingTop: ms(12),
    paddingBottom: ms(100),
    backgroundColor: '#F8FAFC',
  },

  // ── Tab Navigation ──
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: borderRadius.lg,
    padding: ms(3),
    marginBottom: ms(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: ms(9),
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  tabText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },

  // ── Card Container ──
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: ms(14),
    marginBottom: ms(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    marginBottom: ms(12),
    paddingBottom: ms(8),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },

  // ── Field Labels ──
  inputLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#334155',
    marginBottom: ms(6),
  },
  inputRequired: {
    color: '#DC2626',
    fontWeight: '800',
  },

  // ── Unit Selector Strip ──
  unitChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    backgroundColor: '#F8FAFC',
    paddingHorizontal: ms(10),
    paddingVertical: ms(8),
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: ms(12),
  },
  unitChipText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  unitChipCity: {
    fontSize: fontSizes.xxs,
    fontWeight: '600',
    color: '#64748B',
  },

  // ── Mode Selector Grid ──
  modeGrid: {
    flexDirection: 'row',
    gap: ms(8),
    marginBottom: ms(14),
  },
  modeCard: {
    flex: 1,
    paddingVertical: ms(10),
    paddingHorizontal: ms(4),
    borderRadius: borderRadius.lg,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(4),
  },
  modeCardActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
    ...shadows.sm,
  },
  modeLabel: {
    fontSize: fontSizes.xxs + 0.5,
    fontWeight: '700',
    color: '#475569',
  },
  modeLabelActive: {
    color: '#4F46E5',
    fontWeight: '800',
  },

  // ── Distance & Per KM Strip (Bike) ──
  bikeCalcRow: {
    flexDirection: 'row',
    gap: ms(10),
    marginBottom: ms(10),
  },
  bikeInputWrap: {
    flex: 1,
  },
  calcHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    backgroundColor: '#F0FDF4',
    paddingHorizontal: ms(10),
    paddingVertical: ms(7),
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: ms(12),
  },
  calcHintText: {
    fontSize: fontSizes.xxs + 0.5,
    color: '#166534',
    fontWeight: '600',
    flex: 1,
  },

  // ── Total Summary Callout ──
  totalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: borderRadius.lg,
    paddingHorizontal: ms(14),
    paddingVertical: ms(12),
    marginVertical: ms(8),
    ...shadows.sm,
  },
  totalBannerLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalBannerValue: {
    fontSize: fontSizes.lg,
    fontWeight: '900',
    color: '#38BDF8',
  },

  // ── Real Camera Receipt Box ──
  receiptUploadBox: {
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    padding: ms(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: ms(8),
    gap: ms(6),
  },
  receiptAttachedBox: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
    borderStyle: 'solid',
  },
  receiptThumbWrap: {
    width: ms(60),
    height: ms(60),
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: ms(4),
  },
  receiptThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  receiptTextTitle: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#0F172A',
  },
  receiptTextSub: {
    fontSize: fontSizes.xxs,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
  receiptActionRow: {
    flexDirection: 'row',
    gap: ms(8),
    marginTop: ms(6),
  },
  receiptActionBtn: {
    paddingHorizontal: ms(10),
    paddingVertical: ms(5),
    borderRadius: borderRadius.sm,
    backgroundColor: '#E2E8F0',
  },
  receiptActionText: {
    fontSize: fontSizes.xxs,
    fontWeight: '700',
    color: '#334155',
  },

  // ── Submit Button ──
  submitBtnWrap: {
    marginTop: ms(6),
  },

  // ── Past Claims List ──
  emptyState: {
    paddingVertical: ms(36),
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(8),
  },
  emptyStateText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: '#64748B',
  },
  emptyStateSub: {
    fontSize: fontSizes.xs,
    color: '#94A3B8',
    textAlign: 'center',
  },
  claimHistoryItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: ms(14),
    marginBottom: ms(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  claimItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(8),
    paddingBottom: ms(6),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  claimDateText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#334155',
  },
  claimAmountBadge: {
    fontSize: fontSizes.sm,
    fontWeight: '900',
    color: '#0F172A',
  },
  claimRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    marginBottom: ms(6),
  },
  claimRouteText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  claimMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: ms(4),
  },
  claimModeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: ms(8),
    paddingVertical: ms(3),
    borderRadius: borderRadius.sm,
  },
  claimModeText: {
    fontSize: fontSizes.xxs,
    fontWeight: '700',
    color: '#475569',
  },
  statusBadge: {
    paddingHorizontal: ms(8),
    paddingVertical: ms(3),
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  statusPendingText: {
    color: '#B45309',
    fontSize: fontSizes.xxs,
    fontWeight: '800',
  },
  statusApproved: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  statusApprovedText: {
    color: '#15803D',
    fontSize: fontSizes.xxs,
    fontWeight: '800',
  },
  statusRejected: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  statusRejectedText: {
    color: '#B91C1C',
    fontSize: fontSizes.xxs,
    fontWeight: '800',
  },

  // Date Calendar Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ms(16),
  },
  modalContent: {
    width: '100%',
    maxWidth: ms(360),
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: ms(16),
    ...shadows.lg,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(12),
    paddingBottom: ms(8),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: '#0F172A',
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ms(8),
    marginBottom: ms(8),
  },
  monthNavBtn: {
    padding: ms(6),
    borderRadius: borderRadius.md,
    backgroundColor: '#F1F5F9',
  },
  monthNavText: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    color: '#0F172A',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: ms(6),
  },
  weekDayText: {
    fontSize: fontSizes.xxs,
    fontWeight: '700',
    color: '#94A3B8',
    width: ms(36),
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  calendarDayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: ms(2),
  },
  calendarDayInner: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayInnerSelected: {
    backgroundColor: '#4F46E5',
  },
  calendarDayText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: '#1E293B',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  calendarCancelBtn: {
    marginTop: ms(12),
    paddingVertical: ms(10),
    borderRadius: borderRadius.lg,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  calendarCancelText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#475569',
  },
});
