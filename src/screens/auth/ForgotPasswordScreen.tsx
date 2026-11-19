import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './ForgotPasswordScreen.styles';
import {
  AppScreenContainer,
  AppTextInput,
  AppButton,
  AppIcon,
} from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '../../navigation/navigationContext';
import { useResponsive } from '../../theme/responsive';
import { forgotPasswordSchema } from '../../utils/validation';

export const ForgotPasswordScreen: React.FC = () => {
  const [empCode, setEmpCode] = useState('');
  const [dob, setDob] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { resetPassword, isLoading } = useAuthStore();
  const { navigate, goBack } = useNavigation();
  const { maxContentWidth, isTablet } = useResponsive();

  const handleReset = async () => {
    setFieldErrors({});

    const validation = forgotPasswordSchema.safeParse({
      empCode,
      dob,
      aadhaar,
      newPassword,
      confirmPassword,
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

    const success = await resetPassword(empCode, dob, aadhaar, newPassword);
    if (success) {
      navigate('Login');
    }
  };

  return (
    <AppScreenContainer scrollable={false} contentContainerStyle={styles.container} backgroundColor="#FAF8F2">
      <View style={[styles.responsiveWrapper, isTablet && { maxWidth: maxContentWidth }]}>
        
        {/* Compact Branding Header */}
        <View style={styles.headerWrap}>
          <View style={styles.logoBadge}>
            <AppIcon name="lock" size={20} color="#111827" />
          </View>
          <Text style={styles.heroTitle}>Reset Password</Text>
          <Text style={styles.heroSubtitle}>3-POINT IDENTITY VERIFICATION</Text>
        </View>

        {/* Card Centered In Identical Style */}
        <View style={styles.card}>
          <AppTextInput
            label="Employee Code"
            placeholder="e.g. 77777006, I8578"
            value={empCode}
            onChangeText={(val) => {
              setEmpCode(val);
              if (fieldErrors.empCode) {
                setFieldErrors((prev) => ({ ...prev, empCode: '' }));
              }
            }}
            iconLeft="person"
            autoCapitalize="characters"
            error={fieldErrors.empCode}
            containerStyle={styles.inputItem}
          />

          <AppTextInput
            label="Date of Birth"
            placeholder="DD/MM/YYYY"
            value={dob}
            onChangeText={(val) => {
              setDob(val);
              if (fieldErrors.dob) {
                setFieldErrors((prev) => ({ ...prev, dob: '' }));
              }
            }}
            iconLeft="calendar"
            keyboardType="numbers-and-punctuation"
            error={fieldErrors.dob}
            containerStyle={styles.inputItem}
          />

          <AppTextInput
            label="Aadhaar Card Number"
            placeholder="12-digit Aadhaar number"
            value={aadhaar}
            onChangeText={(val) => {
              setAadhaar(val);
              if (fieldErrors.aadhaar) {
                setFieldErrors((prev) => ({ ...prev, aadhaar: '' }));
              }
            }}
            iconLeft="shield"
            keyboardType="number-pad"
            maxLength={12}
            error={fieldErrors.aadhaar}
            containerStyle={styles.inputItem}
          />

          <AppTextInput
            label="New Password"
            placeholder="Min. 6 characters"
            value={newPassword}
            onChangeText={(val) => {
              setNewPassword(val);
              if (fieldErrors.newPassword) {
                setFieldErrors((prev) => ({ ...prev, newPassword: '' }));
              }
            }}
            iconLeft="lock"
            isPassword
            error={fieldErrors.newPassword}
            containerStyle={styles.inputItem}
          />

          <AppTextInput
            label="Confirm Password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChangeText={(val) => {
              setConfirmPassword(val);
              if (fieldErrors.confirmPassword) {
                setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
              }
            }}
            iconLeft="lock"
            isPassword
            error={fieldErrors.confirmPassword}
            containerStyle={styles.inputItem}
          />

          <AppButton
            title="Verify & Reset Password"
            onPress={handleReset}
            loading={isLoading}
            style={styles.submitButton}
          />

          <TouchableOpacity
            onPress={goBack}
            style={styles.cancelButton}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>
          IH&MS-Payroll v2.0 • Secured with Hardware Device Binding
        </Text>
      </View>
    </AppScreenContainer>
  );
};
