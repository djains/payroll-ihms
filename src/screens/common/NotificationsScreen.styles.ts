import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { fontSizes } from '../../theme/typography';
import { ms } from '../../theme/responsive';

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.md,
    backgroundColor: '#F8FAFC',
  },
  notifCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: ms(14),
    marginBottom: ms(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
    position: 'relative',
  },
  notifCardUnread: {
    backgroundColor: '#F0FDFA',
    borderColor: '#99F6E4',
    borderLeftWidth: ms(4),
    borderLeftColor: '#0F766E',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(6),
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    flex: 1,
    marginRight: ms(8),
  },
  cardIconWrap: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  cardTitleBold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  cardTime: {
    fontSize: fontSizes.xxs,
    color: '#94A3B8',
    fontWeight: '600',
  },
  cardMessage: {
    fontSize: fontSizes.xs,
    color: '#475569',
    lineHeight: ms(18),
    marginLeft: ms(44),
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: ms(10),
    marginLeft: ms(44),
  },
  tagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
  },
  distanceTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: ms(7),
    paddingVertical: ms(2),
    borderRadius: borderRadius.sm,
  },
  distanceTagText: {
    fontSize: ms(10),
    color: '#DC2626',
    fontWeight: '700',
  },
  actionTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(3),
  },
  actionText: {
    fontSize: fontSizes.xs,
    color: '#0F766E',
    fontWeight: '700',
  },
  unreadDot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    backgroundColor: '#0F766E',
    position: 'absolute',
    top: ms(14),
    right: ms(14),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(80),
    paddingHorizontal: ms(24),
  },
  emptyIconWrap: {
    width: ms(72),
    height: ms(72),
    borderRadius: ms(36),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(16),
  },
  emptyTitle: {
    fontSize: fontSizes.md + 1,
    fontWeight: '800',
    color: '#334155',
    marginBottom: ms(6),
  },
  emptySubtitle: {
    fontSize: fontSizes.xs,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: ms(18),
    maxWidth: ms(260),
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(16),
    gap: ms(12),
  },
  clearBtn: {
    paddingVertical: ms(8),
    paddingHorizontal: ms(18),
    borderRadius: borderRadius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  clearBtnText: {
    fontSize: fontSizes.xs,
    color: '#64748B',
    fontWeight: '700',
  },
  markReadBtn: {
    paddingVertical: ms(8),
    paddingHorizontal: ms(18),
    borderRadius: borderRadius.md,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  markReadBtnText: {
    fontSize: fontSizes.xs,
    color: '#0F766E',
    fontWeight: '700',
  },
});
