import { StyleSheet } from 'react-native';
import { spacing, borderRadius, shadows, fontSizes, ms } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Unit Filter Tabs at the Top (Matching LeaveApprovalScreen)
  unitFilterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  unitFilterScroll: {
    paddingHorizontal: spacing.md,
    paddingVertical: ms(8),
    gap: ms(8),
  },
  unitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    paddingHorizontal: ms(12),
    paddingVertical: ms(6),
    borderRadius: borderRadius.full,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  unitChipActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  unitChipText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: '#475569',
    maxWidth: ms(160),
  },
  unitChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  unitBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: ms(6),
    paddingVertical: ms(1),
    borderRadius: borderRadius.full,
  },
  unitBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  unitBadgeText: {
    fontSize: fontSizes.xxs,
    fontWeight: '800',
    color: '#334155',
  },
  unitBadgeTextActive: {
    color: '#FFFFFF',
  },

  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: ms(100),
  },

  // KPI Overview Row
  kpiRow: {
    flexDirection: 'row',
    gap: ms(8),
    marginBottom: ms(12),
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    paddingVertical: ms(10),
    paddingHorizontal: ms(6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontSize: fontSizes.lg,
    fontWeight: '900',
    color: '#0F172A',
  },
  kpiLabel: {
    fontSize: ms(10),
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    marginTop: ms(2),
    letterSpacing: 0.3,
  },

  // Search Input Wrap (Matching LeaveApprovalScreen)
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    paddingHorizontal: ms(12),
    height: ms(44),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: ms(10),
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: '#0F172A',
    marginLeft: ms(8),
    paddingVertical: 0,
  },
  clearBtn: {
    padding: ms(4),
  },

  // Status Filter Tabs Bar (Matching LeaveApprovalScreen tabChip)
  statusScroll: {
    paddingVertical: ms(2),
    marginBottom: ms(8),
  },
  statusTabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    paddingHorizontal: ms(14),
    paddingVertical: ms(8),
    borderRadius: borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: ms(8),
  },
  statusTabChipActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  statusTabChipText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: '#475569',
  },
  statusTabChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  statusTabBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: ms(7),
    paddingVertical: ms(1.5),
    borderRadius: borderRadius.full,
  },
  statusTabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  statusTabBadgeText: {
    fontSize: ms(10),
    fontWeight: '800',
    color: '#475569',
  },
  statusTabBadgeTextActive: {
    color: '#FFFFFF',
  },

  // Priority Filter Pills Row
  priorityScroll: {
    paddingVertical: ms(2),
    marginBottom: ms(12),
  },
  priorityChip: {
    paddingHorizontal: ms(12),
    paddingVertical: ms(6),
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginRight: ms(6),
  },
  priorityChipActive: {
    borderColor: '#0F766E',
    backgroundColor: '#F0FDFA',
  },
  priorityChipText: {
    fontSize: ms(11),
    fontWeight: '600',
    color: '#64748B',
  },
  priorityChipTextActive: {
    color: '#0F766E',
    fontWeight: '800',
  },

  // Complaint Card (Matching LeaveApprovalScreen & WorkersList card)
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: ms(16),
    marginBottom: ms(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  cardTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(8),
  },
  ticketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    backgroundColor: '#F0FDFA',
    paddingHorizontal: ms(8),
    paddingVertical: ms(3),
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  ticketBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    color: '#0F766E',
  },
  ticketDate: {
    fontSize: ms(11),
    color: '#64748B',
    fontWeight: '500',
  },

  // Unit & Client Tag
  unitTagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    paddingHorizontal: ms(10),
    paddingVertical: ms(6),
    marginBottom: ms(8),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: ms(6),
  },
  unitTagText: {
    fontSize: ms(11),
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },

  // Issue Title
  issueTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: ms(6),
  },

  // Meta Row (Priority + Status)
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    marginBottom: ms(6),
  },

  // Priority Badges
  priBadgeTop: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: ms(7),
    paddingVertical: ms(2),
    borderRadius: borderRadius.xs,
  },
  priBadgeMed: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: ms(7),
    paddingVertical: ms(2),
    borderRadius: borderRadius.xs,
  },
  priBadgeLow: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: ms(7),
    paddingVertical: ms(2),
    borderRadius: borderRadius.xs,
  },
  priTextTop: {
    color: '#DC2626',
    fontSize: ms(10),
    fontWeight: '800',
  },
  priTextMed: {
    color: '#D97706',
    fontSize: ms(10),
    fontWeight: '800',
  },
  priTextLow: {
    color: '#0284C7',
    fontSize: ms(10),
    fontWeight: '800',
  },

  // Status Badges
  statusChip: {
    paddingHorizontal: ms(9),
    paddingVertical: ms(3),
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  statusChipInProcess: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  statusChipResolved: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  statusChipComplete: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  statusTextInProcess: {
    color: '#B45309',
    fontSize: ms(10),
    fontWeight: '800',
  },
  statusTextResolved: {
    color: '#15803D',
    fontSize: ms(10),
    fontWeight: '800',
  },
  statusTextComplete: {
    color: '#475569',
    fontSize: ms(10),
    fontWeight: '800',
  },

  // Worker Remark Box
  remarkBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    padding: ms(10),
    marginVertical: ms(6),
    borderLeftWidth: 3,
    borderLeftColor: '#94A3B8',
  },
  remarkLabel: {
    fontSize: ms(10),
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: ms(2),
  },
  remarkText: {
    fontSize: fontSizes.xs,
    color: '#334155',
    lineHeight: ms(17),
  },

  // Admin Reply Box
  adminBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: borderRadius.md,
    padding: ms(10),
    marginTop: ms(6),
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderLeftWidth: 3,
    borderLeftColor: '#16A34A',
  },
  adminLabel: {
    fontSize: ms(10),
    fontWeight: '800',
    color: '#15803D',
    marginBottom: ms(2),
  },
  adminText: {
    fontSize: fontSizes.xs,
    color: '#166534',
    fontWeight: '600',
    lineHeight: ms(17),
  },

  // Resolve Action Button
  resolveBtn: {
    marginTop: ms(10),
    backgroundColor: '#0F766E',
    paddingVertical: ms(9),
    paddingHorizontal: ms(16),
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: ms(6),
    alignSelf: 'flex-end',
    ...shadows.sm,
  },
  resolveBtnText: {
    color: '#FFFFFF',
    fontSize: fontSizes.xs,
    fontWeight: '800',
  },

  // Modal Dialog
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: ms(20),
    paddingBottom: ms(36),
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(4),
  },
  modalTitle: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: fontSizes.xs,
    color: '#64748B',
    marginBottom: ms(14),
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: borderRadius.lg,
    backgroundColor: '#F8FAFC',
    padding: ms(12),
    fontSize: fontSizes.sm,
    color: '#0F172A',
    minHeight: ms(90),
    textAlignVertical: 'top',
    marginBottom: ms(16),
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: ms(10),
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: ms(12),
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    color: '#475569',
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
  modalSubmitBtn: {
    flex: 1.5,
    paddingVertical: ms(12),
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F766E',
    ...shadows.sm,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: fontSizes.xs,
    fontWeight: '800',
  },

  // Empty State
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(60),
    paddingHorizontal: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: ms(10),
  },
  emptyIconWrap: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(12),
  },
  emptyTitle: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: ms(4),
  },
  emptySubtitle: {
    fontSize: fontSizes.xs,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: ms(18),
  },
});
