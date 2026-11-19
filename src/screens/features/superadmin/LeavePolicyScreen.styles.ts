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
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  policyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ms(8),
  },
  policyTitleWrap: {
    flex: 1,
    marginRight: ms(8),
  },
  policyName: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: '#0F172A',
  },
  policyDates: {
    fontSize: fontSizes.xs - 1,
    fontWeight: '600',
    color: '#64748B',
    marginTop: ms(2),
  },
  statusBadge: {
    paddingHorizontal: ms(8),
    paddingVertical: ms(4),
    borderRadius: borderRadius.full,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusDraft: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: fontSizes.xs - 1,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#15803D',
  },
  statusTextDraft: {
    color: '#B45309',
  },

  // Unit Scope Badge on Card
  unitScopeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: borderRadius.sm,
    paddingHorizontal: ms(8),
    paddingVertical: ms(4),
    marginBottom: ms(10),
    alignSelf: 'flex-start',
  },
  unitScopeText: {
    fontSize: fontSizes.xs - 1,
    fontWeight: '700',
    color: '#0F766E',
  },

  quotaSectionTitle: {
    fontSize: fontSizes.xs - 1,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: ms(6),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Leave Quotas 3-Column Equal Grid
  leaveTypesGrid: {
    flexDirection: 'row',
    gap: ms(8),
    marginBottom: ms(12),
  },
  leaveTypePill: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    paddingHorizontal: ms(8),
    paddingVertical: ms(6),
    borderLeftWidth: 3,
    borderLeftColor: '#0F766E',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  leaveTypeAbbr: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    color: '#0F172A',
  },
  leaveTypeDays: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: '#0F766E',
    marginTop: ms(1),
  },
  leaveTypeMeta: {
    fontSize: 9,
    color: '#64748B',
    marginTop: ms(1),
  },

  // Card Action Buttons
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: ms(10),
  },
  deleteBtn: {
    padding: ms(8),
    borderRadius: borderRadius.md,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitAssignBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(4),
    backgroundColor: '#E0F2FE',
    paddingVertical: ms(8),
    paddingHorizontal: ms(6),
    borderRadius: borderRadius.md,
  },
  unitAssignBtnText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#0369A1',
  },
  activateBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(4),
    backgroundColor: '#0F766E',
    paddingVertical: ms(8),
    paddingHorizontal: ms(6),
    borderRadius: borderRadius.md,
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
