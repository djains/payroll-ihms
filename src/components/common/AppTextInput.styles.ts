import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography, fontSizes } from '../../theme/typography';
import { ms } from '../../theme/responsive';

export const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    color: '#374151',
    fontWeight: '700',
    fontSize: fontSizes.xs,
    marginBottom: ms(6),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F2', // Soft warm field background
    borderWidth: 1.5,
    borderColor: '#EFEBE0',
    borderRadius: ms(14),
    paddingHorizontal: spacing.md,
    minHeight: ms(50),
  },
  inputFocused: {
    borderColor: '#111827',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputDisabled: {
    backgroundColor: '#F3EFE6',
    opacity: 0.7,
  },
  input: {
    flex: 1,
    ...typography.body1,
    color: '#111827',
    paddingVertical: spacing.sm,
    fontSize: fontSizes.sm,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRightButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: '#EF4444',
    marginTop: ms(4),
  },
  helperText: {
    ...typography.caption,
    color: '#9CA3AF',
    marginTop: ms(4),
  },
});
