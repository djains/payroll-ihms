import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './AddCompanyScreen.styles';
import {
  AppScreenContainer,
  AppHeader,
  AppTextInput,
  AppButton,
  AppIcon,
  CustomAlertModal,
} from '../../../components/common';
import { useNavigation } from '../../../navigation/navigationContext';
import { superadminApi } from '../../../api';
import { showToast } from '../../../store/toastStore';
import { companyStep1Schema } from '../../../utils/validation';

export const AddCompanyScreen: React.FC = () => {
  const { goBack } = useNavigation();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16);

  // Multi-step Wizard: 1 = Entity Details, 2 = Address & Compliance, 3 = Root Admin Credentials
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form Fields (Exact Django Backend & MySQL pay_company_master schema)
  const [companyName, setCompanyName] = useState('');
  const [empSeriesInit, setEmpSeriesInit] = useState('');
  const [fileNo, setFileNo] = useState('101');
  const [companyPan, setCompanyPan] = useState('');
  const [companyContact, setCompanyContact] = useState('');

  // Step 2: Address & Location
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [pin, setPin] = useState('');

  // Step 3: Root Admin Credentials (accounts_user)
  const [adminUserId, setAdminUserId] = useState('');
  const [adminPassword, setAdminPassword] = useState('Admin@123');

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'danger';
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'warning',
  });

  // Step 1 Validation with Zod
  const validateStep1 = () => {
    const result = companyStep1Schema.safeParse({
      companyName,
      fileNo,
      companyPan,
      companyContact,
    });

    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!errs[field]) {
          errs[field] = issue.message;
        }
      }
      setErrors(errs);
      return false;
    }

    setErrors({});
    return true;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!address1.trim()) errs.address1 = 'Company address 1 is required';
    if (!city.trim()) errs.city = 'City name is required';
    if (!state.trim() || state === 'Select') errs.state = 'State is required';
    if (!pin.trim() || pin.trim().length !== 6) errs.pin = 'Pin number must be exactly 6 digits';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  };

  // Final Submit Action
  const handleFinalSubmit = async () => {
    const errs: Record<string, string> = {};
    if (!adminUserId.trim()) errs.adminUserId = 'Admin username is required';
    if (!adminPassword.trim()) errs.adminPassword = 'Admin password is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const autoSeries = `C${Date.now().toString().slice(-4)}`;
      const res = await superadminApi.createCompany({
        company_name: companyName.trim(),
        emp_series_init: autoSeries,
        address1: address1.trim(),
        address2: address2.trim(),
        city: city.trim(),
        state: state.trim(),
        pin: pin.trim(),
        file_no: fileNo.trim() || '101',
        company_pan_no: companyPan.trim().toUpperCase() || undefined,
        company_contact_no: companyContact.trim() || undefined,
        e_invoice_applicable: 'NO',
        ds_applicable_flag: '2', // 2 = Not Applicable in legacy code
        admin_user_id: adminUserId.trim(),
        admin_password: adminPassword.trim(),
      });

      if (res.success) {
        showToast({
          type: 'success',
          title: 'Company Created',
          message: `${companyName} has been registered successfully.`,
        });
        setAlertConfig({
          visible: true,
          title: 'Tenant Created',
          message: `Company "${companyName}" created successfully! Root Admin credentials [${adminUserId}] provisioned with full company permissions.`,
          type: 'success',
          onConfirm: () => {
            setAlertConfig((prev) => ({ ...prev, visible: false }));
            goBack();
          },
        });
      } else {
        const errorDetail = typeof res.error === 'object' ? JSON.stringify(res.error) : res.error;
        setAlertConfig({
          visible: true,
          title: 'Creation Failed',
          message: errorDetail || 'Backend rejected payload. Check fields and try again.',
          type: 'danger',
          onConfirm: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
        });
      }
    } catch (e: any) {
      setAlertConfig({
        visible: true,
        title: 'Network Error',
        message: e?.message || 'Failed to connect to backend server.',
        type: 'danger',
        onConfirm: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreenContainer
      style={styles.container}
      backgroundColor="#F8FAFC"
      header={
        <AppHeader
          title="Add Company"
          subtitle={`Step ${currentStep} of 3 • ${
            currentStep === 1
              ? 'Entity Information'
              : currentStep === 2
              ? 'Address & Location'
              : 'Root Admin Credentials'
          }`}
          onBack={() => {
            if (currentStep > 1) {
              setCurrentStep((prev) => (prev - 1) as any);
            } else {
              goBack();
            }
          }}
        />
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.contentWrap, { paddingBottom: bottomInset + 30 }]}
      >
        {/* Step Indicator Progress Bar */}
        <View style={styles.stepIndicatorRow}>
          {/* Step 1 */}
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepBadge,
                currentStep === 1 && styles.stepBadgeActive,
                currentStep > 1 && styles.stepBadgeDone,
              ]}
            >
              {currentStep > 1 ? (
                <AppIcon name="check-circle" size={14} color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.stepBadgeText,
                    currentStep === 1 && styles.stepBadgeTextActive,
                  ]}
                >
                  1
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                currentStep === 1 && styles.stepLabelActive,
              ]}
            >
              Company
            </Text>
          </View>

          <View style={[styles.stepLine, currentStep > 1 && styles.stepLineActive]} />

          {/* Step 2 */}
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepBadge,
                currentStep === 2 && styles.stepBadgeActive,
                currentStep > 2 && styles.stepBadgeDone,
              ]}
            >
              {currentStep > 2 ? (
                <AppIcon name="check-circle" size={14} color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.stepBadgeText,
                    currentStep === 2 && styles.stepBadgeTextActive,
                  ]}
                >
                  2
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                currentStep === 2 && styles.stepLabelActive,
              ]}
            >
              Location
            </Text>
          </View>

          <View style={[styles.stepLine, currentStep > 2 && styles.stepLineActive]} />

          {/* Step 3 */}
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepBadge,
                currentStep === 3 && styles.stepBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.stepBadgeText,
                  currentStep === 3 && styles.stepBadgeTextActive,
                ]}
              >
                3
              </Text>
            </View>
            <Text
              style={[
                styles.stepLabel,
                currentStep === 3 && styles.stepLabelActive,
              ]}
            >
              Root Admin
            </Text>
          </View>
        </View>

        {/* STEP 1: ENTITY INFORMATION */}
        {currentStep === 1 && (
          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconCircle}>
                <AppIcon name="building" size={18} color="#0284C7" />
              </View>
              <View style={styles.cardHeaderTextWrap}>
                <Text style={styles.cardSectionTitle}>Entity Profile</Text>
                <Text style={styles.cardSectionSub}>
                  Enter primary enterprise registration information
                </Text>
              </View>
            </View>

            <AppTextInput
              label="Company Legal Name *"
              placeholder="e.g. Apex Security & Facility Services Pvt Ltd"
              value={companyName}
              onChangeText={(v) => {
                setCompanyName(v);
                if (errors.companyName) setErrors((prev) => ({ ...prev, companyName: '' }));
              }}
              iconLeft="building"
              error={errors.companyName}
            />

            <AppTextInput
              label="File Number *"
              placeholder="e.g. 101"
              value={fileNo}
              onChangeText={(v) => {
                setFileNo(v);
                if (errors.fileNo) setErrors((prev) => ({ ...prev, fileNo: '' }));
              }}
              keyboardType="number-pad"
              iconLeft="folder"
              error={errors.fileNo}
            />

            <AppTextInput
              label="Company PAN"
              placeholder="e.g. ABCDE1234F (10 chars)"
              value={companyPan}
              onChangeText={(v) => {
                const cleaned = v.toUpperCase().trim().slice(0, 10);
                setCompanyPan(cleaned);
                if (errors.companyPan) setErrors((prev) => ({ ...prev, companyPan: '' }));
              }}
              autoCapitalize="characters"
              maxLength={10}
              iconLeft="shield"
              error={errors.companyPan}
            />

            <AppTextInput
              label="Official Contact Number"
              placeholder="e.g. 9820012345 (10 digits)"
              value={companyContact}
              onChangeText={(v) => {
                const digits = v.replace(/\D/g, '').slice(0, 10);
                setCompanyContact(digits);
                if (errors.companyContact) setErrors((prev) => ({ ...prev, companyContact: '' }));
              }}
              keyboardType="phone-pad"
              maxLength={10}
              iconLeft="phone"
              error={errors.companyContact}
            />
          </View>
        )}

        {/* STEP 2: ADDRESS & LOCATION */}
        {currentStep === 2 && (
          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#CCFBF1' }]}>
                <AppIcon name="map-pin" size={18} color="#0F766E" />
              </View>
              <View style={styles.cardHeaderTextWrap}>
                <Text style={styles.cardSectionTitle}>Registered Office Address</Text>
                <Text style={styles.cardSectionSub}>
                  Physical office address and state jurisdiction
                </Text>
              </View>
            </View>

            <AppTextInput
              label="Address Line 1 *"
              placeholder="Building / Floor / Street"
              value={address1}
              onChangeText={(v) => {
                setAddress1(v);
                if (errors.address1) setErrors((prev) => ({ ...prev, address1: '' }));
              }}
              iconLeft="map-pin"
              error={errors.address1}
            />

            <AppTextInput
              label="Address Line 2 (Optional)"
              placeholder="Area / Landmark"
              value={address2}
              onChangeText={setAddress2}
              iconLeft="map-pin"
            />

            <AppTextInput
              label="City *"
              placeholder="e.g. Mumbai"
              value={city}
              onChangeText={(v) => {
                setCity(v);
                if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
              }}
              iconLeft="location"
              error={errors.city}
            />

            <AppTextInput
              label="State *"
              placeholder="e.g. Maharashtra"
              value={state}
              onChangeText={(v) => {
                setState(v);
                if (errors.state) setErrors((prev) => ({ ...prev, state: '' }));
              }}
              iconLeft="map-pin"
              error={errors.state}
            />

            <AppTextInput
              label="Pin Code (6 Digits) *"
              placeholder="e.g. 400001"
              value={pin}
              onChangeText={(v) => {
                setPin(v);
                if (errors.pin) setErrors((prev) => ({ ...prev, pin: '' }));
              }}
              keyboardType="number-pad"
              maxLength={6}
              iconLeft="lock"
              error={errors.pin}
            />
          </View>
        )}

        {/* STEP 3: ROOT ADMIN CREDENTIALS */}
        {currentStep === 3 && (
          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#EDE9FE' }]}>
                <AppIcon name="lock" size={18} color="#7C3AED" />
              </View>
              <View style={styles.cardHeaderTextWrap}>
                <Text style={styles.cardSectionTitle}>Root Admin Credentials</Text>
                <Text style={styles.cardSectionSub}>
                  Set up initial login credentials for the Tenant Operations Head
                </Text>
              </View>
            </View>

            <AppTextInput
              label="Root Admin Username *"
              placeholder="e.g. admin_apex"
              value={adminUserId}
              onChangeText={(v) => {
                setAdminUserId(v);
                if (errors.adminUserId) setErrors((prev) => ({ ...prev, adminUserId: '' }));
              }}
              autoCapitalize="none"
              iconLeft="person"
              error={errors.adminUserId}
            />

            <AppTextInput
              label="Password *"
              placeholder="Enter secure password"
              value={adminPassword}
              onChangeText={(v) => {
                setAdminPassword(v);
                if (errors.adminPassword) setErrors((prev) => ({ ...prev, adminPassword: '' }));
              }}
              isPassword
              iconLeft="lock"
              error={errors.adminPassword}
            />
          </View>
        )}

        {/* Step Navigation Button Row */}
        <View style={styles.buttonRow}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={styles.prevButton}
              activeOpacity={0.8}
              onPress={() => setCurrentStep((prev) => (prev - 1) as any)}
            >
              <Text style={styles.prevButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          {currentStep < 3 ? (
            <TouchableOpacity
              style={styles.nextButton}
              activeOpacity={0.8}
              onPress={() => {
                if (currentStep === 1 && validateStep1()) {
                  setCurrentStep(2);
                } else if (currentStep === 2 && validateStep2()) {
                  setCurrentStep(3);
                }
              }}
            >
              <Text style={styles.nextButtonText}>Next Step →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: '#0284C7' }]}
              activeOpacity={0.8}
              onPress={handleFinalSubmit}
              disabled={submitting}
            >
              <Text style={styles.nextButtonText}>
                {submitting ? 'Registering...' : 'Create Company'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <CustomAlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={[
          {
            text: 'OK',
            style: 'default',
            onPress: () => {
              if (alertConfig.onConfirm) alertConfig.onConfirm();
              else setAlertConfig((prev) => ({ ...prev, visible: false }));
            },
          },
        ]}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </AppScreenContainer>
  );
};
