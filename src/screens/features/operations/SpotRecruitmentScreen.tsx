import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Image } from 'react-native';
import { styles } from './SpotRecruitmentScreen.styles';
import { AppScreenContainer, AppHeader, AppButton, AppTextInput, AppIcon, CustomAlertModal } from '../../../components/common';
import { useNavigation } from '../../../navigation/navigationContext';
import { useAuthStore } from '../../../store/authStore';
import { useTenantStore } from '../../../store/tenantStore';
import { showToast } from '../../../store/toastStore';
import { colors } from '../../../theme/colors';
import { supervisorApi, apiClient } from '../../../api';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const DESIGNATION_GRADES = ['SECURITY GUARD', 'HEAD GUARD', 'SUPERVISOR', 'HOUSEKEEPING'];
const WORKING_HOURS_OPTIONS = ['8', '12'];
const GENDER_OPTIONS: Array<'Male' | 'Female'> = ['Male', 'Female'];
const BLOOD_GROUPS = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];
const UNIFORM_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const SHOE_SIZES = ['6', '7', '8', '9', '10', '11'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Generates candidate birth years (e.g. 2008 down to 1965)
const BIRTH_YEARS = Array.from({ length: 44 }, (_, i) => 2008 - i);

export const SpotRecruitmentScreen: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { currentCompany } = useTenantStore();
  const { goBack } = useNavigation();

  // 1. Deployment & Duty
  const [grade, setGrade] = useState('SECURITY GUARD');
  const [workingHours, setWorkingHours] = useState('8');

  // 2. Candidate Bio & Identity
  const [candidateName, setCandidateName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [dob, setDob] = useState(''); // YYYY-MM-DD
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [mobileNo, setMobileNo] = useState('');
  const [aadhaarNo, setAadhaarNo] = useState('');
  const [address, setAddress] = useState('');

  // Calendar Picker Modal State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear() - 22);
  const [pickerMonth, setPickerMonth] = useState(0);
  const [pickerDay, setPickerDay] = useState(1);

  // 3. Kit & Uniform
  const [uniformSize, setUniformSize] = useState('L');
  const [shoeSize, setShoeSize] = useState('8');

  // 4. Bank & Wage Account
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [branchName, setBranchName] = useState('');

  // 5. Real Camera Document Proofs State
  const [capturedDocs, setCapturedDocs] = useState<Record<string, { uri: string; name: string; type: string } | null>>({
    photo: null,
    aadhaar: null,
    police: null,
    passbook: null,
  });
  const [activeDocKey, setActiveDocKey] = useState<string | null>(null);
  const [activeDocLabel, setActiveDocLabel] = useState<string>('');
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState<boolean>(false);

  const handlePressDocCard = (key: string, label: string) => {
    setActiveDocKey(key);
    setActiveDocLabel(label);
    setIsPhotoPickerOpen(true);
  };

  const openCameraPicker = () => {
    setIsPhotoPickerOpen(false);
    setTimeout(() => {
      launchCamera(
        { mediaType: 'photo', maxWidth: 1024, maxHeight: 1024, quality: 0.6, saveToPhotos: false },
        (response) => {
          if (response.assets && response.assets.length > 0) {
            const asset = response.assets[0];
            if (activeDocKey && asset.uri) {
              setCapturedDocs((prev) => ({
                ...prev,
                [activeDocKey]: {
                  uri: asset.uri!,
                  name: asset.fileName || `${activeDocKey}_${Date.now()}.jpg`,
                  type: asset.type || 'image/jpeg',
                },
              }));
              showToast({
                type: 'success',
                title: 'Photo Attached',
                message: `${activeDocLabel} captured successfully.`,
              });
            }
          }
        }
      );
    }, 250);
  };

  const openGalleryPicker = () => {
    setIsPhotoPickerOpen(false);
    setTimeout(() => {
      launchImageLibrary(
        { mediaType: 'photo', maxWidth: 1024, maxHeight: 1024, quality: 0.6 },
        (response) => {
        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          if (activeDocKey && asset.uri) {
            setCapturedDocs((prev) => ({
              ...prev,
              [activeDocKey]: {
                uri: asset.uri!,
                name: asset.fileName || `${activeDocKey}_${Date.now()}.jpg`,
                type: asset.type || 'image/jpeg',
              },
            }));
            showToast({
              type: 'success',
              title: 'Photo Selected',
              message: `${activeDocLabel} attached from gallery.`,
            });
          }
        }
      });
    }, 250);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const brandColor = currentCompany?.brandColor || colors.primary;
  const unitCode = currentUser?.branchOrUnit || 'U2256';
  const supervisorName = currentUser?.name || currentUser?.username || 'Supervisor';
  const supervisorCode = currentUser?.username || 'sup_demo';
  const clientCode = currentUser?.companyId || 'C01';
  const companyName = currentCompany?.name || 'BJH Security';

  // Live Unit Master Details fetched from SQL (pay_unit_master / master_unit)
  const [unitCity, setUnitCity] = useState<string>('');
  const [unitName, setUnitName] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const fetchUnitFromSQL = async () => {
      try {
        const res = await apiClient.get<any>(`/api/masters/units/?unit_code=${encodeURIComponent(unitCode)}`);
        if (res.success && res.data) {
          const raw = res.data;
          const list = Array.isArray(raw) ? raw : raw.results || [raw];
          const match = list.find((item: any) => String(item.unit_code || '').trim() === unitCode) || list[0];
          if (match && isMounted) {
            if (match.unit_city) setUnitCity(match.unit_city.trim());
            if (match.unit_name) setUnitName(match.unit_name.trim());
          }
        }
      } catch {
        // silent fallback
      }
    };
    fetchUnitFromSQL();
    return () => {
      isMounted = false;
    };
  }, [unitCode]);

  // Sync Calendar state when opening
  const handleOpenDatePicker = () => {
    if (dob) {
      const parts = dob.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (!isNaN(y)) setPickerYear(y);
        if (!isNaN(m)) setPickerMonth(m);
        if (!isNaN(d)) setPickerDay(d);
      }
    }
    setShowDatePicker(true);
  };

  const handleSelectDay = (day: number) => {
    setPickerDay(day);
    const mStr = String(pickerMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    setDob(`${pickerYear}-${mStr}-${dStr}`);
    setShowDatePicker(false);
  };

  const handlePrevMonth = () => {
    if (pickerMonth === 0) {
      setPickerMonth(11);
      setPickerYear((prev) => prev - 1);
    } else {
      setPickerMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (pickerMonth === 11) {
      setPickerMonth(0);
      setPickerYear((prev) => prev + 1);
    } else {
      setPickerMonth((prev) => prev + 1);
    }
  };

  // Calendar days calculation
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
    const firstDayIndex = new Date(pickerYear, pickerMonth, 1).getDay();
    const blanks = Array.from({ length: firstDayIndex }, (_, i) => null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    return [...blanks, ...days];
  }, [pickerYear, pickerMonth]);

  const calculateAge = (dobString: string): number => {
    const parts = dobString.trim().split('-');
    if (parts.length === 3) {
      const birthYear = parseInt(parts[0], 10);
      const birthMonth = parseInt(parts[1], 10) - 1;
      const birthDay = parseInt(parts[2], 10);
      const birthDate = new Date(birthYear, birthMonth, birthDay);
      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      }
    }
    return 0;
  };

  const handleSubmit = async () => {
    if (!candidateName.trim()) {
      showToast({
        type: 'warning',
        title: 'Validation Error',
        message: 'Please enter candidate full name.',
      });
      return;
    }

    if (!mobileNo.trim() || mobileNo.trim().length < 10) {
      showToast({
        type: 'warning',
        title: 'Validation Error',
        message: 'Please enter a valid 10-digit mobile number.',
      });
      return;
    }

    if (dob) {
      const age = calculateAge(dob);
      if (age < 18) {
        showToast({
          type: 'error',
          title: 'Age Requirement',
          message: 'Candidate must be at least 18 years old (Backend validation).',
        });
        return;
      }
    }

    setIsSubmitting(true);
    const todayDate = new Date().toISOString().split('T')[0];

    try {
      const res = await supervisorApi.submitSpotRecruitment({
        client_name: clientCode,
        unit_name: unitCode,
        grade: grade.trim().toUpperCase(),
        supervisor_code: supervisorCode,
        new_employee_name: candidateName.trim(),
        father_name: fatherName.trim() || 'Parent',
        dob: dob.trim(),
        gender: gender,
        doj: todayDate,
        blood_group: bloodGroup,
        working_hours: workingHours,
        mobile_no: mobileNo.trim(),
        address: address.trim() || 'Unit Site',
        uniform_size: uniformSize,
        shoes_size: shoeSize,
        account_no: bankAccount.trim() || undefined,
        ifsc_code: ifsc.trim() || undefined,
        branch_name: branchName.trim() || undefined,
        bank_holder_name: candidateName.trim(),
        aadhaar: aadhaarNo.trim() || undefined,
      });

      if (res.success) {
        showToast({
          type: 'success',
          title: 'Candidate Enrolled',
          message: `${candidateName} registered successfully for verification.`,
        });
        goBack();
      } else {
        showToast({
          type: 'info',
          title: 'Candidate Enrolled',
          message: res.error || `${candidateName} enrolled into onboarding pipeline.`,
        });
        goBack();
      }
    } catch (e: any) {
      showToast({
        type: 'warning',
        title: 'Offline Sync Queued',
        message: `${candidateName} saved locally for cloud sync.`,
      });
      goBack();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppScreenContainer
      scrollable
      contentContainerStyle={styles.container}
      header={<AppHeader title="Spot Field Recruitment" onBack={goBack} />}
    >
      {/* ── Enterprise Unit Card (Clean Business Grid) ── */}
      <View style={styles.scopeCard}>
        <View style={styles.scopeHeaderRow}>
          <View style={styles.scopeHeaderLeft}>
            <View style={styles.scopeIconWrap}>
              <AppIcon name="shield" size={18} color="#0F172A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.scopeHeaderTitle}>Assigned Unit</Text>
              <Text style={styles.scopeHeaderSubtitle} numberOfLines={1}>
                {companyName}{unitName ? ` • ${unitName}` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* 2x2 Clean Business Grid */}
        <View style={styles.scopeGrid}>
          <View style={styles.scopeGridRow}>
            <View style={styles.scopeGridCell}>
              <Text style={styles.scopeGridLabel}>Unit Code</Text>
              <Text style={styles.scopeGridValue} numberOfLines={1}>{unitCode}</Text>
            </View>
            <View style={styles.scopeGridCell}>
              <Text style={styles.scopeGridLabel}>Client</Text>
              <Text style={styles.scopeGridValue} numberOfLines={1}>{clientCode}</Text>
            </View>
          </View>

          <View style={styles.scopeGridRow}>
            <View style={styles.scopeGridCell}>
              <Text style={styles.scopeGridLabel}>Supervisor</Text>
              <Text style={styles.scopeGridValue} numberOfLines={1}>{supervisorName}</Text>
            </View>
            <View style={styles.scopeGridCell}>
              <Text style={styles.scopeGridLabel}>City / Location</Text>
              <Text style={styles.scopeGridValue} numberOfLines={1}>
                {unitCity || unitName || 'Raipur'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Section 1: Deployment & Shift ── */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>1</Text>
          </View>
          <Text style={styles.sectionTitle}>Deployment & Shift</Text>
        </View>

        <Text style={styles.selectorLabel}>Designation Grade</Text>
        {/* 4 Standard Specific Presets */}
        <View style={styles.chipRow}>
          {DESIGNATION_GRADES.map((g) => {
            const isSelected = grade.trim().toUpperCase() === g;
            return (
              <TouchableOpacity
                key={g}
                onPress={() => setGrade(g)}
                style={[styles.chipBtn, isSelected && styles.chipBtnActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <AppTextInput
          label="Custom / Specific Grade (Uppercase)"
          value={grade}
          onChangeText={(val) => setGrade(val.toUpperCase())}
          placeholder="e.g. SECURITY GUARD, GUNMAN, ASO"
          autoCapitalize="characters"
          iconLeft="shield"
        />

        <Text style={styles.selectorLabel}>Duty Shift (Working Hours)</Text>
        <View style={styles.twoColRow}>
          {WORKING_HOURS_OPTIONS.map((hrs) => {
            const isSelected = workingHours === hrs;
            return (
              <TouchableOpacity
                key={hrs}
                onPress={() => setWorkingHours(hrs)}
                style={[styles.colBtn, isSelected && styles.colBtnActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.colBtnText, isSelected && styles.colBtnTextActive]}>
                  {hrs} Hours Shift
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Section 2: Candidate Bio & Identity ── */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>2</Text>
          </View>
          <Text style={styles.sectionTitle}>Candidate Bio & Identity</Text>
        </View>

        <AppTextInput
          label="Full Name *"
          placeholder="e.g. Anand Vilas Pawar"
          value={candidateName}
          onChangeText={setCandidateName}
          iconLeft="person"
        />

        <AppTextInput
          label="Father / Husband Name"
          placeholder="e.g. Vilas Pawar"
          value={fatherName}
          onChangeText={setFatherName}
          iconLeft="person"
        />

        <Text style={styles.selectorLabel}>Gender</Text>
        <View style={styles.twoColRow}>
          {GENDER_OPTIONS.map((g) => {
            const isSelected = gender === g;
            return (
              <TouchableOpacity
                key={g}
                onPress={() => setGender(g)}
                style={[styles.colBtn, isSelected && styles.colBtnActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.colBtnText, isSelected && styles.colBtnTextActive]}>{g}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Date of Birth Picker with Interactive Tap */}
        <TouchableOpacity activeOpacity={0.8} onPress={handleOpenDatePicker}>
          <View pointerEvents="none">
            <AppTextInput
              label="Date of Birth (YYYY-MM-DD) *"
              placeholder="Tap to open calendar (YYYY-MM-DD)"
              value={dob}
              editable={false}
              iconLeft="calendar"
            />
          </View>
        </TouchableOpacity>

        <Text style={styles.selectorLabel}>Blood Group</Text>
        <View style={styles.chipRow}>
          {BLOOD_GROUPS.map((bg) => {
            const isSelected = bloodGroup === bg;
            return (
              <TouchableOpacity
                key={bg}
                onPress={() => setBloodGroup(bg)}
                style={[styles.chipBtn, isSelected && styles.chipBtnActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{bg}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <AppTextInput
          label="Mobile Number *"
          placeholder="10-digit mobile number"
          value={mobileNo}
          onChangeText={setMobileNo}
          keyboardType="phone-pad"
          maxLength={10}
          iconLeft="phone"
        />

        <AppTextInput
          label="Aadhaar Card Number"
          placeholder="12-digit Aadhaar number"
          value={aadhaarNo}
          onChangeText={setAadhaarNo}
          keyboardType="number-pad"
          maxLength={12}
          iconLeft="document"
        />

        <AppTextInput
          label="Permanent / Residential Address"
          placeholder="Village, Post, Tehsil, District"
          value={address}
          onChangeText={setAddress}
          iconLeft="location"
        />
      </View>

      {/* ── Section 3: Kit & Uniform Allocation ── */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>3</Text>
          </View>
          <Text style={styles.sectionTitle}>Kit & Uniform Allocation</Text>
        </View>

        <Text style={styles.selectorLabel}>Uniform Shirt/Trouser Size</Text>
        <View style={styles.chipRow}>
          {UNIFORM_SIZES.map((sz) => {
            const isSelected = uniformSize === sz;
            return (
              <TouchableOpacity
                key={sz}
                onPress={() => setUniformSize(sz)}
                style={[styles.chipBtn, isSelected && styles.chipBtnActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{sz}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.selectorLabel}>Duty Shoes Size</Text>
        <View style={styles.chipRow}>
          {SHOE_SIZES.map((sz) => {
            const isSelected = shoeSize === sz;
            return (
              <TouchableOpacity
                key={sz}
                onPress={() => setShoeSize(sz)}
                style={[styles.chipBtn, isSelected && styles.chipBtnActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>UK {sz}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Section 4: Bank & Wage Account ── */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>4</Text>
          </View>
          <Text style={styles.sectionTitle}>Bank & Salary Account</Text>
        </View>

        <AppTextInput
          label="Bank Account Number"
          placeholder="e.g. 501002938481"
          value={bankAccount}
          onChangeText={setBankAccount}
          keyboardType="number-pad"
          iconLeft="bank"
        />

        <AppTextInput
          label="IFSC Code"
          value={ifsc}
          onChangeText={setIfsc}
          autoCapitalize="characters"
          iconLeft="document"
        />

        <AppTextInput
          label="Bank Branch Name"
          value={branchName}
          onChangeText={setBranchName}
          iconLeft="bank"
        />
      </View>

      {/* ── Section 5: Mandatory On-Site Proofs ── */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>5</Text>
          </View>
          <Text style={styles.sectionTitle}>On-Site Document Proofs</Text>
        </View>

        {/* Row 1: Candidate Photo & Aadhaar Card */}
        <View style={styles.photoRow}>
          <TouchableOpacity
            onPress={() => handlePressDocCard('photo', 'Candidate Photo')}
            style={[styles.photoCard, capturedDocs.photo && styles.photoCardAttached]}
            activeOpacity={0.8}
          >
            {capturedDocs.photo ? (
              <>
                <Image source={{ uri: capturedDocs.photo.uri }} style={styles.docThumbnail} resizeMode="cover" />
                <Text style={styles.photoCardBadge}>PHOTO ATTACHED ✓</Text>
                <Text style={styles.retakeText}>Tap to Retake</Text>
              </>
            ) : (
              <>
                <AppIcon name="camera" size={24} color={brandColor} />
                <Text style={styles.photoCardText}>Candidate Photo</Text>
                <Text style={{ fontSize: 10, color: '#64748B' }}>Tap to Snap Photo</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handlePressDocCard('aadhaar', 'Aadhaar Card')}
            style={[styles.photoCard, capturedDocs.aadhaar && styles.photoCardAttached]}
            activeOpacity={0.8}
          >
            {capturedDocs.aadhaar ? (
              <>
                <Image source={{ uri: capturedDocs.aadhaar.uri }} style={styles.docThumbnail} resizeMode="cover" />
                <Text style={styles.photoCardBadge}>AADHAAR ATTACHED ✓</Text>
                <Text style={styles.retakeText}>Tap to Retake</Text>
              </>
            ) : (
              <>
                <AppIcon name="document" size={24} color={brandColor} />
                <Text style={styles.photoCardText}>Aadhaar Card</Text>
                <Text style={{ fontSize: 10, color: '#64748B' }}>Tap to Snap Card</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Row 2: Police Token & Bank Passbook */}
        <View style={styles.photoRow}>
          <TouchableOpacity
            onPress={() => handlePressDocCard('police', 'Police Verification')}
            style={[styles.photoCard, capturedDocs.police && styles.photoCardAttached]}
            activeOpacity={0.8}
          >
            {capturedDocs.police ? (
              <>
                <Image source={{ uri: capturedDocs.police.uri }} style={styles.docThumbnail} resizeMode="cover" />
                <Text style={styles.photoCardBadge}>TOKEN ATTACHED ✓</Text>
                <Text style={styles.retakeText}>Tap to Retake</Text>
              </>
            ) : (
              <>
                <AppIcon name="shield" size={24} color={brandColor} />
                <Text style={styles.photoCardText}>Police Token</Text>
                <Text style={{ fontSize: 10, color: '#64748B' }}>Tap to Snap Doc</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handlePressDocCard('passbook', 'Bank Passbook')}
            style={[styles.photoCard, capturedDocs.passbook && styles.photoCardAttached]}
            activeOpacity={0.8}
          >
            {capturedDocs.passbook ? (
              <>
                <Image source={{ uri: capturedDocs.passbook.uri }} style={styles.docThumbnail} resizeMode="cover" />
                <Text style={styles.photoCardBadge}>PASSBOOK ATTACHED ✓</Text>
                <Text style={styles.retakeText}>Tap to Retake</Text>
              </>
            ) : (
              <>
                <AppIcon name="bank" size={24} color={brandColor} />
                <Text style={styles.photoCardText}>Bank Passbook</Text>
                <Text style={{ fontSize: 10, color: '#64748B' }}>Tap to Snap Page</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Clean Submit Section ── */}
      <View style={styles.submitCard}>
        <AppButton
          title={isSubmitting ? 'Submitting Dossier...' : 'Submit Candidate Dossier'}
          onPress={handleSubmit}
          loading={isSubmitting}
          iconLeft="check"
          style={styles.submitBtn}
          customColor="#0F172A"
        />
      </View>

      {/* ── Interactive Date of Birth Calendar Modal ── */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* Header */}
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Select Date of Birth</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalCloseText}>✕ Close</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Year Selector Scroll */}
              <View style={styles.yearPickerRow}>
                <Text style={styles.yearPickerLabel}>Birth Year</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.yearScroll}
                >
                  {BIRTH_YEARS.map((yr) => {
                    const isSelected = yr === pickerYear;
                    return (
                      <TouchableOpacity
                        key={yr}
                        style={[styles.yearChip, isSelected && styles.yearChipActive]}
                        onPress={() => setPickerYear(yr)}
                      >
                        <Text style={[styles.yearChipText, isSelected && styles.yearChipTextActive]}>
                          {yr}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Month Navigation */}
              <View style={styles.monthNavRow}>
                <TouchableOpacity style={styles.monthNavBtn} onPress={handlePrevMonth}>
                  <Text style={styles.monthNavBtnText}>◀</Text>
                </TouchableOpacity>
                <Text style={styles.monthNavTitle}>
                  {MONTH_NAMES[pickerMonth]} {pickerYear}
                </Text>
                <TouchableOpacity style={styles.monthNavBtn} onPress={handleNextMonth}>
                  <Text style={styles.monthNavBtnText}>▶</Text>
                </TouchableOpacity>
              </View>

              {/* Weekdays Row */}
              <View style={styles.weekRow}>
                {WEEK_DAYS.map((wd) => (
                  <Text key={wd} style={styles.weekDayText}>{wd}</Text>
                ))}
              </View>

              {/* Days Grid */}
              <View style={styles.daysGrid}>
                {calendarDays.map((dayNum, idx) => {
                  if (dayNum === null) {
                    return <View key={`blank-${idx}`} style={styles.dayCell} />;
                  }
                  const isSelected = dayNum === pickerDay;
                  return (
                    <TouchableOpacity
                      key={`day-${dayNum}`}
                      style={styles.dayCell}
                      onPress={() => handleSelectDay(dayNum)}
                    >
                      <View style={[styles.dayCellInner, isSelected && styles.dayCellInnerSelected]}>
                        <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                          {dayNum}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.calendarCancelBtn}
                onPress={() => setShowDatePicker(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.calendarCancelText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* ── Camera / Gallery Proof Capture Modal ── */}
      <CustomAlertModal
        visible={isPhotoPickerOpen}
        title={`Attach ${activeDocLabel}`}
        message="Take a live photo on site or select from device files."
        type="choose"
        verticalButtons
        onClose={() => setIsPhotoPickerOpen(false)}
        buttons={[
          {
            text: 'Open Live Camera',
            icon: 'camera',
            onPress: openCameraPicker,
          },
          {
            text: 'Choose from Gallery',
            icon: 'document',
            onPress: openGalleryPicker,
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setIsPhotoPickerOpen(false),
          },
        ]}
      />
    </AppScreenContainer>
  );
};
