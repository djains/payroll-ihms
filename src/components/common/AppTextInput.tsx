import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { styles } from './AppTextInput.styles';
import { AppIcon } from './AppIcon';
import { colors } from '../../theme/colors';

export interface AppTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  iconLeft?: string;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
}

export const AppTextInput: React.FC<AppTextInputProps> = ({
  label,
  error,
  helperText,
  iconLeft,
  isPassword = false,
  containerStyle,
  editable = true,
  style,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputFocused,
          !!error && styles.inputError,
          !editable && styles.inputDisabled,
        ]}
      >
        {iconLeft && (
          <AppIcon
            name={iconLeft}
            size={18}
            color={error ? colors.danger : isFocused ? colors.primary : colors.textMuted}
            style={styles.iconLeft}
          />
        )}

        <TextInput
          editable={editable}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[styles.input, style]}
          {...rest}
        />

        {isPassword && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowPassword(!showPassword)}
            style={styles.iconRightButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <AppIcon
              name={showPassword ? 'eye' : 'eyeOff'}
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};
