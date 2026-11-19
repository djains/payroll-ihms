import { StyleSheet, Platform } from 'react-native';
import { colors, spacing, borderRadius, shadows, ms } from '../../theme';

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? ms(54) : ms(20),
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 99999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ms(10),
    paddingHorizontal: ms(14),
    borderRadius: ms(16),
    maxWidth: '96%',
    ...shadows.md,
    elevation: 8,
  },
  iconCircle: {
    width: ms(22),
    height: ms(22),
    borderRadius: ms(11),
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(10),
    alignSelf: 'flex-start',
    marginTop: ms(1),
  },
  iconText: {
    fontSize: ms(12),
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: ms(14),
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: ms(13),
    fontWeight: '600',
    flexShrink: 1,
    lineHeight: ms(18),
    letterSpacing: 0.2,
  },
});
