import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { styles } from './LoginScreen.styles';
import {
  AppScreenContainer,
  AppTextInput,
  AppButton,
  AppIcon,
} from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '../../navigation/navigationContext';
import { useResponsive } from '../../theme/responsive';
import { adminLoginSchema } from '../../utils/validation';

export const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { login, isLoading } = useAuthStore();
  const { navigate, reset } = useNavigation();
  const { maxContentWidth, isTablet } = useResponsive();

  const handleLogin = async () => {
    setFieldErrors({});

    const validation = adminLoginSchema.safeParse({
      username,
      password,
    });

    if (!validation.success) {
      const errors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const field = issue.path[0] as string;
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    const success = await login('', username, password);
    if (success) {
      const state = useAuthStore.getState();
      const u = state.currentUser;
      if (u?.role === 'SUPER_ADMIN') {
        reset('SuperAdminDashboard');
      } else {
        reset('UnifiedDashboard');
      }
    }
  };

  return (
    <AppScreenContainer
      scrollable
      contentContainerStyle={styles.container}
      backgroundColor="#FAF8F2"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <View style={[styles.responsiveWrapper, isTablet && { maxWidth: maxContentWidth }]}>
        
        {/* Compact App Branding */}
        <View style={styles.brandingHeader}>
          <View style={styles.logoBadge}>
            <View style={styles.shieldOutline}>
              <View style={styles.shieldCheck} />
            </View>
          </View>

          <Text style={styles.heroTitle}>IH&MS-Payroll</Text>
          <Text style={styles.heroSubtitle}>
            INTEGRATED WORKFORCE PLATFORM
          </Text>
        </View>

        {/* Clean Unified Login Card */}
        <View style={styles.loginCard}>
          {/* Identifier Input */}
          <AppTextInput
            label="ID"
            placeholder="Enter your ID"
            value={username}
            onChangeText={(val) => {
              setUsername(val);
              if (fieldErrors.username) {
                setFieldErrors((prev) => ({ ...prev, username: '' }));
              }
            }}
            iconLeft="person"
            autoCapitalize="none"
            error={fieldErrors.username}
            containerStyle={styles.inputItem}
          />

          {/* Password Input */}
          <AppTextInput
            label="Password"
            placeholder="Enter password"
            value={password}
            onChangeText={(val) => {
              setPassword(val);
              if (fieldErrors.password) {
                setFieldErrors((prev) => ({ ...prev, password: '' }));
              }
            }}
            iconLeft="lock"
            isPassword
            error={fieldErrors.password}
            containerStyle={styles.inputItem}
          />

          {/* Primary Action Button */}
          <AppButton
            title="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.signInButton}
          />
        </View>

        <Text style={styles.footerNote}>
          IH&MS-Payroll v2.0 • Secured with Hardware Device Binding
        </Text>
      </View>
    </AppScreenContainer>
  );
};
