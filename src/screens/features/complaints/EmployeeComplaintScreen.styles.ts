import { StyleSheet } from 'react-native';
import { spacing, borderRadius, shadows, fontSizes, ms } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // 1. Pinned Top Tabs Bar (Spacious, 100% full width, zero distortion)
  topTabsWrapper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingTop: ms(10),
    paddingBottom: ms(10),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...shadows.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    height: ms(44),
    backgroundColor: '#F1F5F9',
    borderRadius: borderRadius.lg,
    padding: ms(3),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtn: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(6),
    borderRadius: borderRadius.md,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  tabBtnText: {
    fontSize: ms(12.5),
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#0F766E',
    fontWeight: '800',
  },
  tabCountBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: ms(7),
    paddingVertical: ms(2),
    borderRadius: borderRadius.full,
  },
  tabCountBadgeActive: {
    backgroundColor: '#CCFBF1',
  },
  tabCountText: {
    fontSize: ms(10.5),
    fontWeight: '800',
    color: '#475569',
  },
  tabCountTextActive: {
    color: '#0F766E',
  },

  // Scrollview Container (Spacious padding, no cramping)
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: ms(16),
    paddingBottom: ms(120),
  },

  // 2. Form Container Card
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(20),
    padding: ms(20),
    marginBottom: ms(24),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    marginBottom: ms(20),
    paddingBottom: ms(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  formHeaderIconWrap: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formHeaderTitle: {
    fontSize: ms(15),
    fontWeight: '800',
    color: '#0F172A',
  },
  formHeaderSubtitle: {
    fontSize: ms(12),
    color: '#64748B',
    marginTop: ms(2),
    lineHeight: ms(16),
  },

  // Form Field Groups (Clear 20px vertical breathing space between sections)
  fieldGroup: {
    marginBottom: ms(20),
  },
  fieldLabel: {
    fontSize: ms(11.5),
    fontWeight: '800',
    color: '#334155',
    marginBottom: ms(8),
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // Priority Level Chips (Identical look & feel to Complaint Category chips)
  priorityScroll: {
    paddingVertical: ms(4),
  },
  priorityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    paddingHorizontal: ms(16),
    paddingVertical: ms(9),
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginRight: ms(10),
  },
  priorityChipTopActive: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  priorityChipMedActive: {
    borderColor: '#D97706',
    backgroundColor: '#FFFBEB',
  },
  priorityChipLowActive: {
    borderColor: '#0F766E',
    backgroundColor: '#F0FDFA',
  },
  priorityDot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
  },
  priorityChipText: {
    fontSize: ms(12),
    fontWeight: '600',
    color: '#475569',
  },
  priorityChipTextTopActive: {
    color: '#DC2626',
    fontWeight: '800',
  },
  priorityChipTextMedActive: {
    color: '#D97706',
    fontWeight: '800',
  },
  priorityChipTextLowActive: {
    color: '#0F766E',
    fontWeight: '800',
  },

  // Category Selector Chips (Spacious, easy to tap)
  categoryScroll: {
    paddingVertical: ms(4),
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    paddingHorizontal: ms(16),
    paddingVertical: ms(9),
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginRight: ms(8),
  },
  categoryChipActive: {
    borderColor: '#0F766E',
    backgroundColor: '#0F766E',
  },
  categoryChipText: {
    fontSize: ms(12),
    fontWeight: '600',
    color: '#475569',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Custom Category Text Input
  inputWrap: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: borderRadius.lg,
    paddingHorizontal: ms(14),
    height: ms(48),
    justifyContent: 'center',
  },
  textInput: {
    fontSize: ms(13),
    color: '#0F172A',
    paddingVertical: 0,
  },

  // Issue Types Checklist
  typesWrapper: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: ms(10),
    maxHeight: ms(190),
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ms(10),
    paddingHorizontal: ms(6),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  checkbox: {
    width: ms(20),
    height: ms(20),
    borderRadius: ms(5),
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(10),
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    borderColor: '#0F766E',
    backgroundColor: '#0F766E',
  },
  typeItemText: {
    fontSize: ms(12),
    color: '#1E293B',
    fontWeight: '600',
    flex: 1,
  },

  // Textarea with Embedded 0/50 words Pill
  textAreaWrap: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: borderRadius.lg,
    padding: ms(14),
    paddingBottom: ms(32),
    position: 'relative',
  },
  textArea: {
    fontSize: ms(13),
    color: '#0F172A',
    minHeight: ms(95),
    textAlignVertical: 'top',
    padding: 0,
    lineHeight: ms(20),
  },
  textAreaCounterPill: {
    position: 'absolute',
    bottom: ms(8),
    right: ms(10),
    backgroundColor: '#E2E8F0',
    paddingHorizontal: ms(8),
    paddingVertical: ms(3),
    borderRadius: borderRadius.full,
  },
  textAreaCounterPillActive: {
    backgroundColor: '#FEE2E2',
  },
  textAreaCounterText: {
    fontSize: ms(10.5),
    fontWeight: '800',
    color: '#475569',
  },
  textAreaCounterTextActive: {
    color: '#DC2626',
  },

  // Submit Button (High-end primary CTA)
  submitBtn: {
    height: ms(48),
    backgroundColor: '#0F766E',
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: ms(8),
    marginTop: ms(6),
    ...shadows.sm,
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: ms(14),
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ----------------------------------------------------
  // TICKET CARDS UI (Spacious, Clean Hierarchy)
  // ----------------------------------------------------
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: ms(18),
    marginBottom: ms(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  cardTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(12),
  },
  ticketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(5),
    backgroundColor: '#F0FDFA',
    paddingHorizontal: ms(9),
    paddingVertical: ms(4),
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  ticketBadgeText: {
    fontSize: ms(12),
    fontWeight: '800',
    color: '#0F766E',
  },
  ticketDateText: {
    fontSize: ms(11),
    color: '#64748B',
    fontWeight: '500',
  },

  // Status Chips
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    paddingHorizontal: ms(10),
    paddingVertical: ms(4),
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  statusPillInProcess: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  statusPillResolved: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  statusPillComplete: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  statusPillTextInProcess: {
    color: '#B45309',
    fontSize: ms(11),
    fontWeight: '800',
  },
  statusPillTextResolved: {
    color: '#15803D',
    fontSize: ms(11),
    fontWeight: '800',
  },
  statusPillTextComplete: {
    color: '#475569',
    fontSize: ms(11),
    fontWeight: '800',
  },

  // Priority Chips
  priorityTag: {
    paddingHorizontal: ms(8),
    paddingVertical: ms(3),
    borderRadius: borderRadius.xs,
    alignSelf: 'flex-start',
  },
  priorityTagTop: {
    backgroundColor: '#FEE2E2',
  },
  priorityTagMed: {
    backgroundColor: '#FEF3C7',
  },
  priorityTagLow: {
    backgroundColor: '#E0F2FE',
  },
  priorityTagTextTop: {
    color: '#DC2626',
    fontSize: ms(10),
    fontWeight: '800',
  },
  priorityTagTextMed: {
    color: '#D97706',
    fontSize: ms(10),
    fontWeight: '800',
  },
  priorityTagTextLow: {
    color: '#0284C7',
    fontSize: ms(10),
    fontWeight: '800',
  },

  ticketTitle: {
    fontSize: ms(14),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: ms(8),
    marginBottom: ms(6),
  },

  // Description / User Remarks
  userQueryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    padding: ms(12),
    marginVertical: ms(10),
    borderLeftWidth: 3,
    borderLeftColor: '#94A3B8',
  },
  userQueryLabel: {
    fontSize: ms(10),
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: ms(4),
  },
  userQueryText: {
    fontSize: ms(12),
    color: '#334155',
    lineHeight: ms(18),
  },

  // Admin Response Box (Crucial Highlight)
  adminReplyCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: borderRadius.md,
    padding: ms(14),
    marginTop: ms(10),
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderLeftWidth: 4,
    borderLeftColor: '#16A34A',
  },
  adminReplyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    marginBottom: ms(6),
  },
  adminReplyTitle: {
    fontSize: ms(12),
    fontWeight: '800',
    color: '#15803D',
  },
  adminReplyText: {
    fontSize: ms(12),
    color: '#14532D',
    fontWeight: '600',
    lineHeight: ms(18),
  },
  adminReplyFooter: {
    fontSize: ms(10),
    color: '#16A34A',
    fontWeight: '600',
    marginTop: ms(6),
  },

  // Awaiting reply note
  awaitingNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    marginTop: ms(8),
    paddingVertical: ms(4),
  },
  awaitingText: {
    fontSize: ms(11),
    color: '#94A3B8',
    fontStyle: 'italic',
  },

  // Close ticket button
  completeBtn: {
    marginTop: ms(12),
    backgroundColor: '#0F766E',
    paddingVertical: ms(9),
    paddingHorizontal: ms(16),
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    ...shadows.sm,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: ms(11),
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
    marginBottom: ms(14),
  },
  emptyTitle: {
    fontSize: ms(15),
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: ms(6),
  },
  emptySubtitle: {
    fontSize: ms(12),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: ms(18),
  },
});
