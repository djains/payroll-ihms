import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { spacing, shadows, borderRadius } from '../theme/spacing';
import { typography, fontSizes } from '../theme/typography';
import { ms } from '../theme/responsive';

export const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FAF8F2',
    borderTopWidth: 1,
    borderTopColor: '#EFEBE0',
    paddingTop: ms(8),
    minHeight: ms(68),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(2),
  },
  activePill: {
    backgroundColor: colors.accentYellow,
    paddingHorizontal: ms(18),
    paddingVertical: ms(6),
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(2),
  },
  inactiveIconWrap: {
    height: ms(32),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(2),
  },
  tabLabel: {
    ...typography.caption,
    fontSize: fontSizes.xxs,
    marginTop: ms(1),
  },
  tabLabelActive: {
    color: '#111827',
    fontWeight: '800',
  },
  tabLabelInactive: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
