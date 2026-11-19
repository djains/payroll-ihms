import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { styles } from './AppButton.styles';
import { AppIcon } from './AppIcon';
import { colors } from '../../theme/colors';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  iconLeft?: string;
  iconRight?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  customColor?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  iconLeft,
  iconRight,
  style,
  textStyle,
  customColor,
  ...rest
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondary;
      case 'outline':
        return styles.outline;
      case 'danger':
        return styles.danger;
      case 'ghost':
        return styles.ghost;
      case 'accent':
        return styles.accent;
      case 'primary':
      default:
        return customColor ? { backgroundColor: customColor } : styles.primary;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.textSecondary;
      case 'outline':
        return customColor ? { color: customColor } : styles.textOutline;
      case 'danger':
        return styles.textDanger;
      case 'ghost':
        return styles.textGhost;
      case 'accent':
        return styles.textAccent;
      case 'primary':
      default:
        return styles.textPrimary;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return styles.sizeSm;
      case 'lg':
        return styles.sizeLg;
      case 'md':
      default:
        return styles.sizeMd;
    }
  };

  const getTextSizeStyle = () => {
    switch (size) {
      case 'sm':
        return styles.textSm;
      case 'lg':
        return styles.textLg;
      case 'md':
      default:
        return styles.textMd;
    }
  };

  const isInteractive = !disabled && !loading;

  const iconColor = variant === 'outline' || variant === 'secondary' || variant === 'ghost'
    ? (customColor || colors.primary)
    : colors.textInverse;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={!isInteractive}
      style={[
        styles.base,
        getVariantStyle(),
        getSizeStyle(),
        fullWidth && styles.fullWidth,
        (!isInteractive) && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? (customColor || colors.primary) : colors.textInverse}
          style={styles.spinner}
        />
      ) : (
        <>
          {iconLeft && (
            <AppIcon
              name={iconLeft}
              size={size === 'sm' ? 14 : size === 'lg' ? 22 : 18}
              color={iconColor}
              style={styles.iconLeft}
            />
          )}
          <Text
            style={[
              styles.textBase,
              getTextStyle(),
              getTextSizeStyle(),
              textStyle,
            ]}
          >
            {title}
          </Text>
          {iconRight && (
            <AppIcon
              name={iconRight}
              size={size === 'sm' ? 14 : size === 'lg' ? 22 : 18}
              color={iconColor}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};
