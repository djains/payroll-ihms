import { StyleSheet } from 'react-native';
import { spacing, borderRadius, shadows, fontSizes, ms } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerActionBtn: {
    paddingHorizontal: ms(12),
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

  // Search Section
  searchSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: ms(8),
    backgroundColor: '#F8FAFC',
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    paddingHorizontal: ms(12),
    height: ms(44),
    borderWidth: 1,
    borderColor: '#E2E8F0',
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

  // List Container
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: ms(6),
    paddingBottom: ms(90),
  },

  // Company Card - Exactly Aligned like WorkersListScreen Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: ms(16),
    marginBottom: ms(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(12),
  },
  companyAvatar: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    backgroundColor: '#E0F2FE',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(12),
  },
  companyAvatarText: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: '#0284C7',
  },
  companyMeta: {
    flex: 1,
  },
  companyName: {
    fontSize: fontSizes.sm + 1,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: ms(3),
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
  },
  codeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: ms(8),
    paddingVertical: ms(2),
    borderRadius: borderRadius.sm,
  },
  codeBadgeText: {
    fontSize: fontSizes.xxs + 1,
    fontWeight: '700',
    color: '#334155',
  },
  activePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: ms(6),
    paddingVertical: ms(2),
    borderRadius: borderRadius.sm,
  },
  activePillText: {
    fontSize: fontSizes.xxs,
    fontWeight: '700',
    color: '#15803D',
  },

  // Structured Info Box
  infoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.lg,
    padding: ms(12),
    borderWidth: 1,
    borderColor: '#EDF2F7',
    gap: ms(8),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
  },
  infoLabel: {
    fontSize: fontSizes.xs,
    color: '#64748B',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: fontSizes.xs,
    color: '#0F172A',
    fontWeight: '700',
  },

  // Loading & Empty state
  centerBox: {
    paddingVertical: ms(60),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(14),
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
    paddingHorizontal: ms(30),
    marginBottom: ms(18),
  },
  emptyActionBtn: {
    backgroundColor: '#0F766E',
    paddingHorizontal: ms(18),
    paddingVertical: ms(10),
    borderRadius: ms(12),
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
});
