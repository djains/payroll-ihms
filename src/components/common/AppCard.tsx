import React from 'react';
import { View, TouchableOpacity, ViewStyle, TouchableOpacityProps } from 'react-native';
import { styles } from './AppCard.styles';

export type CardVariant = 'default' | 'flat' | 'outlined' | 'elevated';

export interface AppCardProps extends TouchableOpacityProps {
  variant?: CardVariant;
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export const AppCard: React.FC<AppCardProps> = ({
  variant = 'default',
  children,
  style,
  onPress,
  ...rest
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'flat':
        return styles.flat;
      case 'outlined':
        return styles.outlined;
      case 'elevated':
        return styles.elevated;
      case 'default':
      default:
        return null;
    }
  };

  const combinedStyles = [styles.card, getVariantStyle(), style];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={combinedStyles}
        {...rest}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={combinedStyles}>{children}</View>;
};
