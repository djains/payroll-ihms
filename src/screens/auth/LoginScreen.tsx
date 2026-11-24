import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Linking } from 'react-native';
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

  const handleOpenUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.warn('[LoginScreen] Error opening legal link:', url, err);
    }
  };

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
        
        {/* Centered App Branding */}
        <View style={styles.brandingHeader}>
          <Text style={styles.heroTitle}>NG GLOBAL</Text>
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

          {/* Forgot Password Link */}
          <TouchableOpacity
            style={styles.forgotLink}
            onPress={() => navigate('ForgotPassword')}
            accessibilityRole="button"
            accessibilityLabel="Forgot Password"
            activeOpacity={0.7}
          >
            <Text style={styles.forgotLinkText}>Forgot Password?</Text>
            <AppIcon name="chevronRight" size={13} color="#6B7280" />
          </TouchableOpacity>

          {/* Primary Action Button */}
          <AppButton
            title="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.signInButton}
          />

          {/* Legal Links: Privacy Policy & Terms and Conditions */}
          <View style={styles.legalSection}>
            <View style={styles.legalDividerRow}>
              <View style={styles.legalDividerLine} />
              <Text style={styles.legalDividerLabel}>LEGAL & POLICIES</Text>
              <View style={styles.legalDividerLine} />
            </View>

            <View style={styles.legalCardsContainer}>
              <TouchableOpacity
                style={styles.legalCard}
                onPress={() => handleOpenUrl('https://payroll.coreal.in/login/privacy-policy')}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Privacy Policy"
              >
                <View style={styles.privacyIconBadge}>
                  <AppIcon name="privacy-policy" size={24} color="#1D4ED8" />
                </View>
                <View style={styles.legalCardContent}>
                  <Text style={styles.legalCardTitle}>Privacy Policy</Text>
                  <Text style={styles.legalCardSubtitle}>Data protection & privacy guidelines</Text>
                </View>
                <View style={styles.legalArrowBadge}>
                  <AppIcon name="arrow-right" size={15} color="#475569" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.legalCard}
                onPress={() => handleOpenUrl('https://payroll.coreal.in/login/terms-and-conditions')}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Terms and Conditions"
              >
                <View style={styles.termsIconBadge}>
                  <AppIcon name="terms-conditions" size={24} color="#0D9488" />
                </View>
                <View style={styles.legalCardContent}>
                  <Text style={styles.legalCardTitle}>Terms & Conditions</Text>
                  <Text style={styles.legalCardSubtitle}>Service agreement & usage rules</Text>
                </View>
                <View style={styles.legalArrowBadge}>
                  <AppIcon name="arrow-right" size={15} color="#475569" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </AppScreenContainer>
  );
};
