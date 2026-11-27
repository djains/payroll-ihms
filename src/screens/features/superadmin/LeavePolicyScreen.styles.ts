import { StyleSheet } from 'react-native';
import { spacing, borderRadius, shadows, fontSizes, ms } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerActionBtn: {
    paddingHorizontal: ms(10),
    paddingVertical: ms(6),
    backgroundColor: '#0F766E',
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
  },
  headerActionText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Top Summary Banner
  topSummaryBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: ms(8),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
  },
  companyBadge: {
    paddingHorizontal: ms(8),
    paddingVertical: ms(3),
    backgroundColor: '#E0F2FE',
    borderRadius: borderRadius.sm,
  },
  companyBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    color: '#0369A1',
  },
  countBadge: {
    paddingHorizontal: ms(8),
    paddingVertical: ms(3),
    backgroundColor: '#F1F5F9',
    borderRadius: borderRadius.full,
  },
  countBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#475569',
  },

  // Unit Filter Chips Row
  unitFilterScroll: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: ms(8),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  unitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(12),
    paddingVertical: ms(6),
    borderRadius: borderRadius.full,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: ms(8),
    gap: ms(4),
  },
  unitChipActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  unitChipText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: '#475569',
  },
  unitChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Main List Content
  listContent: {
    padding: spacing.md,
    paddingBottom: ms(90),
  },
  policyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: ms(14),
    marginBottom: ms(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
  },
  cardIconBox: {
    width: ms(42),
    height: ms(42),
    borderRadius: ms(12),
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyTitleWrap: {
    flex: 1,
  },
  policyName: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: ms(22),
  },
  policyDatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    marginTop: ms(2),
  },
  policyDates: {
    fontSize: fontSizes.xs - 1,
    fontWeight: '600',
    color: '#64748B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    paddingHorizontal: ms(8),
    paddingVertical: ms(4),
    borderRadius: borderRadius.full,
  },
  statusDot: {
    width: ms(6),
    height: ms(6),
    borderRadius: ms(3),
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusDraft: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextActive: {
    color: '#15803D',
  },
  statusTextDraft: {
    color: '#B45309',
  },

  // Scope & Total Quota Info Strip
  cardScopeBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: ms(8),
    paddingHorizontal: ms(10),
    paddingVertical: ms(6),
    marginTop: ms(10),
    marginBottom: ms(10),
  },
  scopeLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(5),
    marginRight: ms(8),
  },
  unitScopeText: {
    fontSize: fontSizes.xs - 1,
    fontWeight: '700',
    color: '#0F766E',
  },
  totalDaysBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(3),
    backgroundColor: '#CCFBF1',
    paddingHorizontal: ms(7),
    paddingVertical: ms(2),
    borderRadius: borderRadius.full,
  },
  totalDaysText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
  },

  // Quota section header
  quotaSectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(8),
  },
  quotaSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  quotaCountText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },

  // Leave Quotas List (Full Width Cards)
  leaveTypesList: {
    gap: ms(8),
    marginBottom: ms(12),
  },
  leaveTypeCardFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: ms(10),
    paddingHorizontal: ms(12),
    paddingVertical: ms(10),
    borderWidth: 1,
  },
  leaveCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    marginRight: ms(8),
  },
  leaveCardAbbrPill: {
    paddingHorizontal: ms(8),
    paddingVertical: ms(4),
    borderRadius: ms(6),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: ms(36),
  },
  leaveCardAbbrText: {
    fontSize: fontSizes.xs,
    fontWeight: '900',
  },
  leaveCardInfo: {
    flex: 1,
  },
  leaveCardName: {
    fontSize: fontSizes.xs + 1,
    fontWeight: '800',
    color: '#0F172A',
  },
  leaveCardSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: ms(1),
  },
  leaveCardRight: {
    alignItems: 'flex-end',
    gap: ms(3),
  },
  leaveCardMid: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: ms(3),
  },
  leaveDaysNum: {
    fontSize: fontSizes.md + 1,
    fontWeight: '900',
  },
  leaveDaysUnit: {
    fontSize: fontSizes.xs - 1,
    fontWeight: '700',
    color: '#64748B',
  },
  leaveTypeMeta: {
    fontSize: fontSizes.xs - 1,
    color: '#64748B',
    marginTop: ms(2),
  },
  cfChip: {
    paddingHorizontal: ms(6),
    paddingVertical: ms(2),
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-end',
  },
  cfChipActive: {
    backgroundColor: '#DCFCE7',
  },
  cfChipInactive: {
    backgroundColor: '#F1F5F9',
  },
  cfChipText: {
    fontSize: 9,
    fontWeight: '800',
  },
  cfChipTextActive: {
    color: '#15803D',
  },
  cfChipTextInactive: {
    color: '#64748B',
  },

  // Card Action Buttons (Spacious 2-Row Full-Width Grid)
  cardActionGrid: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: ms(10),
    gap: ms(8),
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(6),
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingVertical: ms(9),
    paddingHorizontal: ms(8),
    borderRadius: ms(8),
  },
  editBtnText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#4338CA',
  },
  unitAssignBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(6),
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingVertical: ms(9),
    paddingHorizontal: ms(8),
    borderRadius: ms(8),
  },
  unitAssignBtnText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#0369A1',
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(6),
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: ms(9),
    paddingHorizontal: ms(8),
    borderRadius: ms(8),
  },
  deleteBtnText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#DC2626',
  },
  activateBtn: {
    flex: 1.15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(6),
    backgroundColor: '#0F766E',
    paddingVertical: ms(9),
    paddingHorizontal: ms(8),
    borderRadius: ms(8),
  },
  activateBtnText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(40),
    paddingHorizontal: spacing.lg,
  },
  emptyIconWrap: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(12),
  },
  emptyTitle: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: ms(4),
  },
  emptySubtitle: {
    fontSize: fontSizes.xs,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: ms(18),
    marginBottom: ms(16),
  },
  emptyCtaBtn: {
    backgroundColor: '#0F766E',
    paddingHorizontal: ms(16),
    paddingVertical: ms(10),
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    ...shadows.sm,
  },
  emptyCtaText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Modal / Bottom Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: ms(24),
    borderTopRightRadius: ms(24),
    maxHeight: '92%',
    minHeight: '65%',
    paddingTop: ms(12),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: ms(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderLeft: {
    flex: 1,
    marginRight: ms(10),
  },
  modalTitle: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: fontSizes.xs - 1,
    color: '#64748B',
    marginTop: ms(1),
  },
  modalCloseBtn: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formScroll: {
    paddingHorizontal: spacing.md,
  },
  formScrollContent: {
    paddingTop: ms(8),
    paddingBottom: ms(140),
  },
  fieldLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#334155',
    marginBottom: ms(4),
    marginTop: ms(6),
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: borderRadius.md,
    paddingHorizontal: ms(10),
    paddingVertical: ms(8),
    fontSize: fontSizes.xs,
    color: '#0F172A',
    marginBottom: ms(8),
  },
  dateRow: {
    flexDirection: 'row',
    gap: ms(10),
  },
  dateCol: {
    flex: 1,
  },

  // Modal Unit Selector Chips
  modalUnitRow: {
    flexDirection: 'row',
    marginBottom: ms(8),
  },
  modalUnitChip: {
    paddingHorizontal: ms(10),
    paddingVertical: ms(5),
    borderRadius: borderRadius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: ms(6),
  },
  modalUnitChipActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  modalUnitChipText: {
    fontSize: fontSizes.xs - 1,
    fontWeight: '600',
    color: '#475569',
  },
  modalUnitChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  sectionDivider: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: ms(8),
    marginBottom: ms(10),
    paddingTop: ms(8),
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(8),
  },
  sectionTitle: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
  },
  addTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(3),
    paddingHorizontal: ms(8),
    paddingVertical: ms(4),
    borderRadius: borderRadius.sm,
    backgroundColor: '#E0F2FE',
  },
  addTypeText: {
    fontSize: fontSizes.xs - 1,
    fontWeight: '700',
    color: '#0369A1',
  },

  // Leave Type Row in Modal
  leaveTypeRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    padding: ms(10),
    marginBottom: ms(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  leaveTypeRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(6),
  },
  leaveTypeRowTitle: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    color: '#0F172A',
  },
  typeNameInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: borderRadius.sm,
    paddingHorizontal: ms(8),
    paddingVertical: ms(4),
    fontSize: fontSizes.xs,
    color: '#0F172A',
    fontWeight: '700',
    marginRight: ms(8),
  },
  removeTypeBtn: {
    padding: ms(2),
  },
  typeInputsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: ms(8),
  },
  typeInputWrap: {
    flex: 1,
  },
  typeInputLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: ms(2),
  },
  typeInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: borderRadius.sm,
    paddingHorizontal: ms(8),
    paddingVertical: ms(6),
    fontSize: fontSizes.xs,
    color: '#0F172A',
  },
  toggleCfBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: borderRadius.sm,
    paddingVertical: ms(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleCfBtnActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  toggleCfText: {
    fontSize: fontSizes.xs - 1,
    fontWeight: '800',
    color: '#64748B',
  },
  toggleCfTextActive: {
    color: '#15803D',
  },

  modalFooter: {
    marginTop: ms(12),
  },
  footerButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    marginTop: ms(12),
  },
  saveBtn: {
    flex: 1.4,
    backgroundColor: '#0F766E',
    paddingVertical: ms(12),
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  draftBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: ms(12),
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftBtnText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#475569',
  },
});
