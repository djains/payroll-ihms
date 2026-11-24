import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { styles } from './ForgotPasswordScreen.styles';
import {
  AppScreenContainer,
  AppTextInput,
  AppButton,
  AppIcon,
  DatePickerModal,
} from '../../components/common';
import { showToast } from '../../store/toastStore';
import { authApi } from '../../api';
import { useNavigation } from '../../navigation/navigationContext';
import { useResponsive } from '../../theme/responsive';

export const ForgotPasswordScreen: React.FC = () => {
  const [empCode, setEmpCode] = useState('');
  const [dob, setDob] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Verified record state
  const [verifiedRecord, setVerifiedRecord] = useState<{
    name: string;
    empCode: string;
  } | null>(null);

  const { navigate, goBack } = useNavigation();
  const { maxContentWidth, isTablet } = useResponsive();

  const handleVerify = async () => {
    setFieldErrors({});

    const cleanCode = empCode.trim().toUpperCase();
    const cleanDob = dob.trim();
    const cleanAadhaar = aadhaar.trim().replace(/\s+/g, '');

    const errors: Record<string, string> = {};
    if (!cleanCode) {
      errors.empCode = 'Employee Code is required';
    }
    if (!cleanDob) {
      errors.dob = 'Date of birth is required';
    } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(cleanDob) && !/^\d{4}-\d{2}-\d{2}$/.test(cleanDob)) {
      errors.dob = 'Use format DD/MM/YYYY (e.g. 15/08/1995)';
    }
    if (!cleanAadhaar) {
      errors.aadhaar = 'Aadhaar Number is required';
    } else if (cleanAadhaar.length < 12) {
      errors.aadhaar = 'Aadhaar must be at least 12 digits';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.verifyForgetPassword(cleanCode, cleanDob, cleanAadhaar);
      setIsLoading(false);

      if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) {
        const item = res.data[0];
        setVerifiedRecord({
          name: item.emp_name || 'Staff Member',
          empCode: cleanCode,
        });
        showToast({
          type: 'success',
          title: 'Identity Verified',
          message: `Official record found for ${item.emp_name || cleanCode}.`,
        });
      } else {
        showToast({
          type: 'error',
          title: 'Verification Failed',
          message: 'Details could not be matched with enterprise records. Please verify Employee Code, DOB, and Aadhaar.',
        });
        setFieldErrors({
          empCode: 'Details could not be matched with enterprise database records',
        });
      }
    } catch (err: any) {
      setIsLoading(false);
      showToast({
        type: 'error',
        title: 'Connection Error',
        message: err?.message || 'Unable to reach backend verification service.',
      });
    }
  };

  const handleSendWhatsApp = () => {
    if (!verifiedRecord) return;
    const msg =
      `Hello HR Administrator / Supervisor,\n\n` +
      `My identity has been verified on the NG GLOBAL Workforce App:\n` +
      `• Employee ID: ${verifiedRecord.empCode}\n` +
      `• Name: ${verifiedRecord.name}\n\n` +
      `Please reset my login password in User Management.\n\nThank you.`;

    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {
      showToast({
        type: 'warning',
        title: 'Could Not Open WhatsApp',
        message: 'Please contact HR directly or share your Employee ID.',
      });
    });
  };

  const handleCallHelpdesk = () => {
    // Official Helpdesk / Enterprise Support
    Linking.openURL('tel:1800120000').catch(() => {
      showToast({
        type: 'info',
        title: 'Helpdesk Phone',
        message: 'Please contact your supervisor or company branch office.',
      });
    });
  };

  return (
    <AppScreenContainer scrollable={true} contentContainerStyle={styles.container} backgroundColor="#FAF8F2">
      <View style={[styles.responsiveWrapper, isTablet && { maxWidth: maxContentWidth }]}>
        
        {/* Compact Branding Header */}
        <View style={styles.headerWrap}>
          <View style={styles.logoBadge}>
            <AppIcon name="lock" size={20} color="#111827" />
          </View>
          <Text style={styles.heroTitle}>Forgot Password</Text>
          <Text style={styles.heroSubtitle}>
            {verifiedRecord ? 'IDENTITY VERIFIED • HR HELPDESK' : '3-POINT IDENTITY VERIFICATION'}
          </Text>
        </View>

        {/* Card Centered In Identical Style */}
        <View style={styles.card}>
          {verifiedRecord ? (
            /* VERIFIED SUCCESS & HR RESET REQUEST VIEW */
            <View style={{ alignItems: 'center', width: '100%' }}>
              <View style={styles.verifiedBadge}>
                <AppIcon name="checkmark" size={26} color="#16A34A" />
              </View>

              <Text style={styles.verifiedTitle}>Identity Confirmed!</Text>
              <Text style={styles.verifiedSub}>
                Your employee details matched official records in MySQL database.
              </Text>

              {/* Employee Summary Box */}
              <View style={styles.verifiedDetailsBox}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Employee ID</Text>
                  <Text style={styles.detailValue}>{verifiedRecord.empCode}</Text>
                </View>
                <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 4, paddingTop: 4 }]}>
                  <Text style={styles.detailLabel}>Employee Name</Text>
                  <Text style={styles.detailValue}>{verifiedRecord.name}</Text>
                </View>
                <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 4, paddingTop: 4 }]}>
                  <Text style={styles.detailLabel}>Verification Status</Text>
                  <Text style={[styles.detailValue, { color: '#16A34A' }]}>● Verified</Text>
                </View>
              </View>

              <View style={styles.instructionsBox}>
                <Text style={styles.instructionsText}>
                  As per enterprise data security, password updates are performed via HR Administrator / Supervisor. Tap below to send your pre-verified reset request.
                </Text>
              </View>

              {/* Action 1: WhatsApp Direct Request */}
              <TouchableOpacity
                style={styles.whatsappButton}
                onPress={handleSendWhatsApp}
                activeOpacity={0.8}
              >
                <AppIcon name="chatbubble" size={18} color="#FFFFFF" />
                <Text style={styles.whatsappButtonText}>Send Reset Request via WhatsApp</Text>
              </TouchableOpacity>

              {/* Action 2: Call Helpdesk */}
              <TouchableOpacity
                style={styles.callButton}
                onPress={handleCallHelpdesk}
                activeOpacity={0.8}
              >
                <AppIcon name="call" size={16} color="#334155" />
                <Text style={styles.callButtonText}>Call Company Helpdesk</Text>
              </TouchableOpacity>

              {/* Action 3: Back to Login */}
              <AppButton
                title="Back to Sign In"
                onPress={() => navigate('Login')}
                style={styles.submitButton}
              />
            </View>
          ) : (
            /* INITIAL FORM: 3-POINT IDENTITY VERIFICATION */
            <>
              <View style={styles.instructionsBox}>
                <Text style={styles.instructionsText}>
                  Enter your Employee ID, Date of Birth, and 12-digit Aadhaar Number to verify your identity with backend records.
                </Text>
              </View>

              <AppTextInput
                label="Employee Code"
                placeholder="e.g. Y00002, 77777006"
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

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setShowDatePicker(true)}
              >
                <View pointerEvents="none">
                  <AppTextInput
                    label="Date of Birth"
                    placeholder="Select Date of Birth (DD/MM/YYYY)"
                    value={dob}
                    editable={false}
                    iconLeft="calendar"
                    error={fieldErrors.dob}
                    containerStyle={styles.inputItem}
                  />
                </View>
              </TouchableOpacity>

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
                maxLength={14}
                error={fieldErrors.aadhaar}
                containerStyle={styles.inputItem}
              />

              <AppButton
                title="Verify Identity & Request Reset"
                onPress={handleVerify}
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
            </>
          )}
        </View>

        {/* Date Picker Modal for Date of Birth Selection */}
        <DatePickerModal
          visible={showDatePicker}
          title="Select Date of Birth"
          initialDate={dob}
          onClose={() => setShowDatePicker(false)}
          onSelect={(formatted) => {
            setDob(formatted);
            if (fieldErrors.dob) {
              setFieldErrors((prev) => ({ ...prev, dob: '' }));
            }
          }}
        />
      </View>
    </AppScreenContainer>
  );
};
