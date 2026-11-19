import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows, fontSizes, ms } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl + ms(20),
  },

  // Assigned Site Scope Card (Exact match to Dashboard Scope Card)
  scopeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    ...shadows.sm,
  },
  scopeIconWrap: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeTitle: {
    fontSize: fontSizes.xs + 0.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  scopeSubtitle: {
    fontSize: fontSizes.xxs,
    fontWeight: '600',
    color: '#64748B',
    marginTop: ms(2),
  },

  // Section Header Title
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(8),
    paddingHorizontal: ms(4),
    gap: ms(6),
  },
  sectionTitle: {
    fontSize: fontSizes.xxs + 0.5,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  // Directory Card Container
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },

  // Contact Row Item
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ms(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  contactItemLast: {
    borderBottomWidth: 0,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(12),
  },
  contactName: {
    fontSize: fontSizes.xs + 0.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  contactRole: {
    fontSize: fontSizes.xxs,
    fontWeight: '600',
    color: '#64748B',
    marginTop: ms(2),
  },
  phoneText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#0D9488',
    marginTop: ms(2),
  },
});
