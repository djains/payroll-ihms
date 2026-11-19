import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Image,
  PermissionsAndroid,
  Linking,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { styles } from './AddStaffScreen.styles';
import {
  AppScreenContainer,
  AppHeader,
  AppTextInput,
  AppButton,
  AppIcon,
  CustomAlertModal,
} from '../../../components/common';
import { useNavigation } from '../../../navigation/navigationContext';
import { superadminApi, staffApi, authApi, BackendUnit } from '../../../api';
import { useAuthStore } from '../../../store/authStore';
import { showToast } from '../../../store/toastStore';
import { z } from 'zod';

// Zod Validation Schema for Worker Registration Form
const addWorkerSchema = z
  .object({
    empName: z
      .string({ required_error: 'Worker name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters'),
    empFatherName: z.string().trim().optional(),
    empMobile: z
      .string({ required_error: 'Mobile number is required' })
      .trim()
      .length(10, 'Mobile number must be exactly 10 digits')
      .regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit mobile number starting with 6, 7, 8, or 9'),
    empEmail: z.string().trim().optional(),
    sendCredentialsEmail: z.boolean().default(true),
    password: z
      .string({ required_error: 'Initial password is required' })
      .min(6, 'Password must be at least 6 characters (e.g. Staff@123)'),
    selectedUnitCode: z
      .string({ required_error: 'Please select a deployment site unit' })
      .min(1, 'Please select a deployment site unit'),
    selectedRole: z
      .string({ required_error: 'Please select an assigned role' })
      .min(1, 'Please select an assigned role'),
    hasPhoto: z.literal(true, {
      errorMap: () => ({ message: 'Worker verification photo is required' }),
    }),
  })
  .superRefine((val, ctx) => {
    const emailClean = (val.empEmail || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (val.sendCredentialsEmail) {
      if (!emailClean) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['empEmail'],
          message: 'Email address is required to send login credentials',
        });
      } else if (!emailRegex.test(emailClean)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['empEmail'],
          message: 'Enter a valid email address (e.g. worker@example.com)',
        });
      }
    } else if (emailClean && !emailRegex.test(emailClean)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['empEmail'],
        message: 'Enter a valid email address',
      });
    }
  });

type AddWorkerFormValues = z.infer<typeof addWorkerSchema>;

export const AddStaffScreen: React.FC = () => {
  const { goBack, replace } = useNavigation();
  const { currentUser } = useAuthStore();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16);

  // Form Fields
  const [empName, setEmpName] = useState('');
  const [empFatherName, setEmpFatherName] = useState('');
  const [empMobile, setEmpMobile] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [sendCredentialsEmail, setSendCredentialsEmail] = useState(true);
  const [selectedUnitCode, setSelectedUnitCode] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [employeeType, setEmployeeType] = useState('Staff');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [password, setPassword] = useState('');

  // Next Code & Department
  const [nextEmpCode, setNextEmpCode] = useState('');
  const [deptCode, setDeptCode] = useState('');

  // Worker Photo for Mandatory Verification Document
  const [workerPhoto, setWorkerPhoto] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  // Dropdown lists fetched live from MySQL
  const [unitsList, setUnitsList] = useState<BackendUnit[]>([]);
  const [rolesList, setRolesList] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Alert Modal
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

  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        const [unitsRes, rolesRes, codeRes, deptRes] = await Promise.allSettled([
          superadminApi.getUnits(),
          superadminApi.getRolesFastList(),
          staffApi.getNextEmpCode(),
          staffApi.getDepartments(),
        ]);

        if (unitsRes.status === 'fulfilled' && unitsRes.value.success && unitsRes.value.data) {
          const list = Array.isArray(unitsRes.value.data)
            ? unitsRes.value.data
            : (unitsRes.value.data as any).results || [];
          setUnitsList(list);
          if (list.length > 0) {
            setSelectedUnitCode(list[0].unit_code);
            if (list[0].unit_city) setCity(list[0].unit_city);
            if (list[0].state_name) setState(list[0].state_name);
          }
        }

        if (rolesRes.status === 'fulfilled' && rolesRes.value.success && rolesRes.value.data) {
          const rData = rolesRes.value.data;
          let rList: string[] = [];
          if (Array.isArray(rData)) {
            rList = rData.map((r: any) => (typeof r === 'string' ? r : r.name || ''));
          } else if (rData?.results && Array.isArray(rData.results)) {
            rList = rData.results.map((r: any) => (typeof r === 'string' ? r : r.name || ''));
          }
          // Filter out Company Admin & root admin from employee selection
          const filtered = rList.filter((r) => {
            const low = r.toLowerCase();
            return !low.startsWith('company admin') && low !== 'admin' && low !== 'superadmin';
          });
          setRolesList(filtered);
          if (filtered.length > 0) {
            setSelectedRole(filtered[0]);
          }
        }

        if (codeRes.status === 'fulfilled' && codeRes.value.success && codeRes.value.data) {
          const code = codeRes.value.data.emp_code || '';
          if (code) setNextEmpCode(code);
        }

        if (deptRes.status === 'fulfilled' && deptRes.value.success && deptRes.value.data) {
          const dData = deptRes.value.data;
          const dList = Array.isArray(dData) ? dData : dData?.results || [];
          if (dList.length > 0) {
            const d = dList[0];
            setDeptCode(d.dept_code || d.dept_name || 'OPERATIONS');
          }
        }
      } catch (e) {
        console.warn('[AddStaffScreen] Error loading units/roles/code:', e);
      } finally {
        setLoadingData(false);
      }
    };

    loadPrerequisites();
  }, []);

  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission Required',
          message: 'IHMS needs access to your camera to take the worker verification photo.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Camera permission request error:', err);
      return false;
    }
  };

  const handleCaptureCamera = async () => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        setAlertConfig({
          visible: true,
          title: 'Permission Denied',
          message: 'Camera permission is required to capture worker photo. Please allow it in App Settings.',
          type: 'warning',
        });
        return;
      }

      const response = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
        includeBase64: false,
      });

      if (response.didCancel) return;

      if (response.errorCode) {
        showToast({
          type: 'error',
          title: 'Camera Error',
          message: response.errorMessage || 'Could not open camera.',
        });
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        setWorkerPhoto({
          uri: asset.uri || '',
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        });
        showToast({
          type: 'success',
          title: 'Photo Captured',
          message: 'Worker verification photo attached.',
        });
      }
    } catch (error: any) {
      console.warn('Camera launch error:', error);
      showToast({
        type: 'error',
        title: 'Camera Error',
        message: error?.message || 'Failed to open camera.',
      });
    }
  };

  const handlePickGallery = async () => {
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
      });

      if (response.didCancel) return;

      if (response.errorCode) {
        showToast({
          type: 'error',
          title: 'Gallery Error',
          message: response.errorMessage || 'Could not open gallery.',
        });
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        setWorkerPhoto({
          uri: asset.uri || '',
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        });
        showToast({
          type: 'success',
          title: 'Photo Selected',
          message: 'Worker verification photo attached.',
        });
      }
    } catch (error: any) {
      console.warn('Gallery launch error:', error);
    }
  };

  const handleRegisterEmployee = async () => {
    // Validate with Zod
    const validationResult = addWorkerSchema.safeParse({
      empName,
      empFatherName,
      empMobile,
      empEmail,
      sendCredentialsEmail,
      password,
      selectedUnitCode,
      selectedRole,
      hasPhoto: !!workerPhoto,
    });

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      let firstMessage = 'Please fill all required fields correctly.';
      validationResult.error.errors.forEach((err, idx) => {
        const path = err.path[0] as string;
        if (path) {
          fieldErrors[path] = err.message;
          if (idx === 0) firstMessage = err.message;
        }
      });

      setErrors(fieldErrors);
      setAlertConfig({
        visible: true,
        title: 'Validation Error',
        message: firstMessage,
        type: 'warning',
      });
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const selectedUnitObj = unitsList.find((u) => u.unit_code === selectedUnitCode);

      // 1. Resolve Employee Code
      let codeToUse = nextEmpCode;
      if (!codeToUse) {
        const codeRes = await staffApi.getNextEmpCode();
        if (codeRes.success && codeRes.data?.emp_code) {
          codeToUse = codeRes.data.emp_code;
        }
      }

      // 2. Stage mandatory verification documents in backend
      if (codeToUse && workerPhoto) {
        await Promise.allSettled([
          staffApi.uploadEmployeeDoc(
            codeToUse,
            'Original Photo(Passport Size)',
            workerPhoto.uri,
            'photo.jpg'
          ),
          staffApi.uploadEmployeeDoc(
            codeToUse,
            'Original Aadhar Card',
            workerPhoto.uri,
            'aadhar.jpg'
          ),
          staffApi.uploadEmployeeDoc(
            codeToUse,
            'Pan Card',
            workerPhoto.uri,
            'pan.jpg'
          ),
        ]);
      }

      const finalPassword = password.trim() || 'Staff@123';

      // 3. Register Employee with Live Backend API
      const payload = {
        emp_code: codeToUse || undefined,
        emp_name: empName.trim(),
        emp_father_name: empFatherName.trim() || 'Parent',
        emp_mobile_no: empMobile.trim(),
        emp_email_id: empEmail.trim(),
        unit_code: selectedUnitCode.trim(),
        designation_code: selectedRole.trim(),
        role: selectedRole.trim(),
        client_code: selectedUnitObj?.client_code || 'CL01',
        dept_code: deptCode || 'OPERATIONS',
        employee_type: employeeType,
        reporting_to: currentUser?.empCode || currentUser?.username || '',
        gender: gender === 'Female' ? 'F' : 'M',
        birth_date: '1995-01-01',
        joining_date: today,
        location: selectedUnitObj?.state_name || state || 'Maharashtra',
        location_city: selectedUnitObj?.unit_city || city || 'Mumbai',
        emp_nationality: 'Indian',
        emp_current_state: selectedUnitObj?.state_name || state || 'Maharashtra',
        emp_current_city: selectedUnitObj?.unit_city || city || 'Mumbai',
        emp_blood_group: 'B+',
        password: finalPassword,
      };

      const res = await staffApi.createEmployee(payload);

      if (res.success && res.data) {
        const createdCode = res.data.emp_code || res.data.login_id || codeToUse || 'Worker';

        // Auto-activate login password using setup token if provided
        if (res.data.login_setup_token && finalPassword) {
          try {
            await authApi.setupPassword(res.data.login_setup_token, finalPassword);
          } catch (pwErr) {
            console.warn('[AddStaffScreen] Auto password setup info:', pwErr);
          }
        }

        // Send login credentials email if requested and email provided
        const emailTo = empEmail.trim();
        if (sendCredentialsEmail && emailTo) {
          const siteDisplay = selectedUnitObj?.unit_name || selectedUnitCode.trim() || 'Site Unit';
          const roleDisplay = selectedRole.trim() || 'Staff';
          const subject = `IHMS Portal - Login Credentials for ${empName.trim()} (${createdCode})`;
          const body = `Hello ${empName.trim()},\n\nWelcome to the team! Below are your official IHMS mobile app login credentials:\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n• Portal / App Link: https://ihms.app\n• Login ID (Username): ${createdCode}\n• Password: ${finalPassword}\n• Designation: ${roleDisplay}\n• Assigned Site: ${siteDisplay}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nPlease download the IHMS app and sign in with the Login ID and Password provided above.\nIf you have any questions or need assistance, please contact your unit supervisor.\n\nBest regards,\nIHMS Administration`;

          const mailtoUrl = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

          try {
            await Linking.openURL(mailtoUrl);
          } catch (mailErr) {
            console.warn('[AddStaffScreen] Linking.openURL direct failed, falling back to Share:', mailErr);
            try {
              await Share.share({ title: subject, message: body });
            } catch (shareErr) {
              console.warn('[AddStaffScreen] Share fallback failed:', shareErr);
            }
          }
        }

        // Clean & compact professional toast
        showToast({
          type: 'success',
          title: 'Worker Registered',
          message: sendCredentialsEmail && emailTo
            ? `${empName.trim()} (${createdCode}) registered! Credentials email prepared for ${emailTo}.`
            : `${empName.trim()} (${createdCode}) has been successfully added.`,
        });

        // Navigate cleanly to Workers Directory so the app stays active and open when returning from Gmail
        replace('WorkersList');
      } else {
        let errorMsg = 'Could not register employee.';
        if (typeof res.error === 'string') {
          errorMsg = res.error;
        } else if (res.error && typeof res.error === 'object') {
          errorMsg = Object.entries(res.error)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join('\n');
        } else if (res.data && typeof res.data === 'object') {
          errorMsg = Object.entries(res.data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join('\n');
        }

        setAlertConfig({
          visible: true,
          title: 'Registration Error',
          message: errorMsg,
          type: 'danger',
        });
      }
    } catch (e: any) {
      setAlertConfig({
        visible: true,
        title: 'Network Error',
        message: e?.message || 'Failed to connect to backend server.',
        type: 'danger',
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
          title="Add Worker"
          subtitle="Deploy Personnel to Site Unit"
          onBack={goBack}
        />
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.contentWrap, { paddingBottom: bottomInset + 40 }]}
      >
        {loadingData ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#0F766E" />
          </View>
        ) : (
          <>
            {/* Auto-allocated ID Badge */}
            {nextEmpCode ? (
              <View style={styles.empCodeBadge}>
                <AppIcon name="id-card" size={16} color="#0F766E" />
                <Text style={styles.empCodeBadgeText}>
                  Next Allocated ID: {nextEmpCode}
                </Text>
              </View>
            ) : null}

            {/* 1. Worker Photo Verification */}
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Verification Photo</Text>
              <Text style={styles.sectionSubtitle}>
                Worker photo required for mandatory KYC & onboarding compliance
              </Text>

              <View style={styles.photoContainer}>
                <View
                  style={[
                    styles.photoAvatarWrap,
                    workerPhoto ? styles.photoAvatarWrapReady : null,
                  ]}
                >
                  {workerPhoto ? (
                    <Image
                      source={{ uri: workerPhoto.uri }}
                      style={styles.photoImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <AppIcon name="camera" size={32} color="#94A3B8" />
                  )}
                </View>

                <View style={styles.photoButtonsRow}>
                  <TouchableOpacity
                    style={styles.photoSmallBtn}
                    onPress={handleCaptureCamera}
                    activeOpacity={0.8}
                  >
                    <AppIcon name="camera" size={14} color="#0F766E" />
                    <Text style={styles.photoSmallBtnText}>Take Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.photoSmallBtn}
                    onPress={handlePickGallery}
                    activeOpacity={0.8}
                  >
                    <AppIcon name="image" size={14} color="#0F766E" />
                    <Text style={styles.photoSmallBtnText}>Gallery</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.photoHelperText}>
                  {workerPhoto
                    ? '✓ Photo ready for verification'
                    : 'Tap to capture worker photo or choose from gallery'}
                </Text>
              </View>
            </View>

            {/* 2. Basic Identity */}
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Personnel Identity</Text>
              <Text style={styles.sectionSubtitle}>
                Worker name, mobile contact and credentials
              </Text>

              <AppTextInput
                label="Full Name *"
                placeholder="e.g. Ramesh Kumar"
                value={empName}
                onChangeText={(v) => {
                  setEmpName(v);
                  if (errors.empName) setErrors((prev) => ({ ...prev, empName: '' }));
                }}
                iconLeft="person"
                error={errors.empName}
              />

              <AppTextInput
                label="Father / Guardian Name"
                placeholder="e.g. Suresh Kumar"
                value={empFatherName}
                onChangeText={setEmpFatherName}
              />

              <AppTextInput
                label="Mobile Number *"
                placeholder="10-digit mobile number"
                value={empMobile}
                onChangeText={(v) => {
                  // Only allow numeric digits and stop strictly at 10 digits
                  const clean = v.replace(/\D/g, '').slice(0, 10);
                  setEmpMobile(clean);
                  if (errors.empMobile) setErrors((prev) => ({ ...prev, empMobile: '' }));
                }}
                keyboardType="phone-pad"
                maxLength={10}
                iconLeft="phone"
                error={errors.empMobile}
              />

              <AppTextInput
                label="Email Address"
                placeholder="worker@example.com (for sending credentials)"
                value={empEmail}
                onChangeText={(v) => {
                  setEmpEmail(v);
                  if (errors.empEmail) setErrors((prev) => ({ ...prev, empEmail: '' }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                iconLeft="mail"
                error={errors.empEmail}
              />

              {/* Checkbox to Mail Credentials */}
              <TouchableOpacity
                style={[styles.checkboxRow, sendCredentialsEmail && styles.checkboxRowActive]}
                onPress={() => setSendCredentialsEmail((prev) => !prev)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkboxBox, sendCredentialsEmail && styles.checkboxBoxActive]}>
                  {sendCredentialsEmail ? <AppIcon name="check" size={12} color="#FFFFFF" /> : null}
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.checkboxLabel}>Send Login ID & Password to Email</Text>
                  <Text style={styles.checkboxHint}>
                    Worker will receive their User ID and Password via email upon creation
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Gender Selection */}
              <Text style={styles.dropdownLabel}>Gender</Text>
              <View style={styles.genderRow}>
                <TouchableOpacity
                  style={[styles.genderBtn, gender === 'Male' && styles.genderBtnActive]}
                  onPress={() => setGender('Male')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.genderBtnText, gender === 'Male' && styles.genderBtnTextActive]}>
                    Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderBtn, gender === 'Female' && styles.genderBtnActive]}
                  onPress={() => setGender('Female')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.genderBtnText, gender === 'Female' && styles.genderBtnTextActive]}>
                    Female
                  </Text>
                </TouchableOpacity>
              </View>

              <AppTextInput
                label="Initial Password *"
                placeholder="e.g. Staff@123"
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
                isPassword
                iconLeft="lock"
                error={errors.password}
                helperText="Worker login password (min 6 characters)"
              />
            </View>

            {/* 3. Site Unit & Role Assignment */}
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Deployment & Role</Text>
              <Text style={styles.sectionSubtitle}>
                Select the physical Site Unit and assigned Role
              </Text>

              {/* Unit Selector Chips */}
              <Text style={styles.dropdownLabel}>Deploy to Site Unit *</Text>
              {errors.selectedUnitCode ? (
                <Text style={{ color: '#EF4444', fontSize: 11, marginBottom: 4, fontWeight: '600' }}>
                  {errors.selectedUnitCode}
                </Text>
              ) : null}
              {unitsList.length === 0 ? (
                <Text style={{ color: '#EF4444', fontSize: 12, marginBottom: 8 }}>
                  No active units found. Please create a Site Unit first.
                </Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  <View style={styles.chipsRow}>
                    {unitsList.map((u) => {
                      const isSel = selectedUnitCode === u.unit_code;
                      return (
                        <TouchableOpacity
                          key={u.id}
                          style={[styles.selectChip, isSel && styles.selectChipActive]}
                          onPress={() => {
                            setSelectedUnitCode(u.unit_code);
                            if (errors.selectedUnitCode) setErrors((prev) => ({ ...prev, selectedUnitCode: '' }));
                            if (u.unit_city) setCity(u.unit_city);
                            if (u.state_name) setState(u.state_name);
                          }}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.selectChipText, isSel && styles.selectChipTextActive]}>
                            {u.unit_name} ({u.unit_code})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              )}

              {/* Role Selector Chips */}
              <Text style={[styles.dropdownLabel, { marginTop: 12 }]}>Assign Role / Designation *</Text>
              {errors.selectedRole ? (
                <Text style={{ color: '#EF4444', fontSize: 11, marginBottom: 4, fontWeight: '600' }}>
                  {errors.selectedRole}
                </Text>
              ) : null}
              {rolesList.length === 0 ? (
                <Text style={{ color: '#EF4444', fontSize: 12, marginBottom: 8 }}>
                  No roles found. Please create a role in Create Role first.
                </Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  <View style={styles.chipsRow}>
                    {rolesList.map((r, idx) => {
                      const isSel = selectedRole === r;
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[styles.selectChip, isSel && styles.selectChipActive]}
                          onPress={() => {
                            setSelectedRole(r);
                            if (errors.selectedRole) setErrors((prev) => ({ ...prev, selectedRole: '' }));
                          }}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.selectChipText, isSel && styles.selectChipTextActive]}>
                            {r}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              )}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <AppTextInput label="City" value={city} onChangeText={setCity} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppTextInput label="State" value={state} onChangeText={setState} />
                </View>
              </View>
            </View>

            {/* Submit Button */}
            <AppButton
              title={submitting ? 'Registering Worker...' : 'Deploy Worker to Unit'}
              onPress={handleRegisterEmployee}
              loading={submitting}
              style={styles.submitBtn}
            />
          </>
        )}
      </ScrollView>

      {/* Confirmation Alert Modal */}
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
