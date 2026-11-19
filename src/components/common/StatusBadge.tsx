import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { styles } from './StatusBadge.styles';
import { colors } from '../../theme/colors';

export type BadgeStatus =
  | 'approved'
  | 'pending'
  | 'rejected'
  | 'present'
  | 'absent'
  | 'leave'
  | 'weekly_off'
  | 'active'
  | 'inactive';

export interface StatusBadgeProps {
  status: BadgeStatus;
  label?: string;
  withDot?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  withDot = true,
  style,
  textStyle,
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'approved':
      case 'present':
      case 'active':
        return {
          bgStyle: styles.success,
          textStyleInternal: styles.textSuccess,
          dotColor: colors.success,
          defaultLabel: status === 'present' ? 'Present' : status === 'active' ? 'Active' : 'Approved',
        };
      case 'rejected':
      case 'absent':
      case 'inactive':
        return {
          bgStyle: styles.danger,
          textStyleInternal: styles.textDanger,
          dotColor: colors.danger,
          defaultLabel: status === 'absent' ? 'Absent' : status === 'inactive' ? 'Inactive' : 'Rejected',
        };
      case 'pending':
      case 'leave':
        return {
          bgStyle: styles.warning,
          textStyleInternal: styles.textWarning,
          dotColor: colors.warning,
          defaultLabel: status === 'leave' ? 'Leave' : 'Pending',
        };
      case 'weekly_off':
        return {
          bgStyle: styles.info,
          textStyleInternal: styles.textInfo,
          dotColor: colors.statusWeeklyOff,
          defaultLabel: 'Weekly Off',
        };
      default:
        return {
          bgStyle: styles.neutral,
          textStyleInternal: styles.textNeutral,
          dotColor: colors.textSecondary,
          defaultLabel: status,
        };
    }
  };

  const { bgStyle, textStyleInternal, dotColor, defaultLabel } = getBadgeConfig();

  return (
    <View style={[styles.badge, bgStyle, style]}>
      {withDot && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
      <Text style={[styles.text, textStyleInternal, textStyle]}>
        {label || defaultLabel}
      </Text>
    </View>
  );
};
