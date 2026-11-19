import { StyleSheet } from 'react-native';
import { spacing, borderRadius, shadows, fontSizes, ms } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    flex: 1,
  },
  backButton: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSizes.md + 1,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: fontSizes.xxs,
    color: '#64748B',
    fontWeight: '600',
  },
  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: ms(14),
    marginBottom: ms(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(8),
  },
  shiftIconWrap: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(10),
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  shiftTitle: {
    fontSize: fontSizes.sm + 1,
    fontWeight: '800',
    color: '#0F172A',
  },
  shiftCodeText: {
    fontSize: fontSizes.xxs,
    color: '#64748B',
    fontWeight: '600',
  },
  hoursBadge: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: ms(8),
    paddingVertical: ms(3),
    borderRadius: borderRadius.full,
  },
  hoursBadgeText: {
    fontSize: fontSizes.xxs,
    fontWeight: '800',
    color: '#0D9488',
  },
  timingsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    padding: ms(10),
    gap: ms(12),
  },
  timeCol: {
    flex: 1,
  },
  timeLabel: {
    fontSize: fontSizes.xxs,
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  timeValue: {
    fontSize: fontSizes.sm,
    color: '#0F172A',
    fontWeight: '800',
    marginTop: ms(2),
  },
  emptyWrap: {
    paddingVertical: ms(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: fontSizes.sm,
    color: '#64748B',
    fontWeight: '600',
    marginTop: ms(8),
  },
});

