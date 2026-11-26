import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import { styles } from './TravelExpenseScreen.styles';
import {
  AppScreenContainer,
  AppHeader,
  AppButton,
  AppTextInput,
  AppIcon,
  CustomAlertModal,
} from '../../../components/common';
import { useNavigation } from '../../../navigation/navigationContext';
import { useTenantStore } from '../../../store/tenantStore';
import { useAuthStore } from '../../../store/authStore';
import { showToast } from '../../../store/toastStore';
import { colors } from '../../../theme/colors';
import { supervisorApi, apiClient } from '../../../api';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

type TravelMode = 'Bike' | 'Auto' | 'Bus' | 'Train';

interface TravelModeConfig {
  key: TravelMode;
  label: string;
  icon: 'location' | 'car' | 'navigation' | 'document';
}

const MODES: TravelModeConfig[] = [
  { key: 'Bike', label: 'Bike', icon: 'navigation' },
  { key: 'Auto', label: 'Auto', icon: 'car' },
  { key: 'Bus', label: 'Bus', icon: 'location' },
  { key: 'Train', label: 'Train', icon: 'document' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface PastClaim {
  id: string | number;
  date: string;
  origin: string;
  destination: string;
  mode: string;
  amount: number;
  status: string;
}

export const TravelExpenseScreen: React.FC = () => {
  const { currentCompany } = useTenantStore();
  const { currentUser } = useAuthStore();
  const { goBack } = useNavigation();

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'NEW_CLAIM' | 'HISTORY'>('NEW_CLAIM');

  // Today's formatted default date (YYYY-MM-DD)
  const today = useMemo(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }, []);

  // Form State
  const [travelDate, setTravelDate] = useState<string>(today);
  const [selectedMode, setSelectedMode] = useState<TravelMode>('Bike');
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [distanceKm, setDistanceKm] = useState<string>('');
  const [ratePerKm, setRatePerKm] = useState<string>('3.50');
  const [fareAmount, setFareAmount] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');

  // Photo receipt state
  const [receiptImage, setReceiptImage] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);

  // Calendar Date Picker Modal State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(() => new Date().getMonth());
  const [pickerDay, setPickerDay] = useState(() => new Date().getDate());

  // Submitting & History State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pastClaims, setPastClaims] = useState<PastClaim[]>([]);

  // Organization & Context Info
  const brandColor = currentCompany?.brandColor || colors.primary;
  const supervisorCode = currentUser?.username || currentUser?.empCode || 'sup_demo';
  const unitCode = currentUser?.branchOrUnit || 'U2256';

  // Live Unit Master Details fetched from SQL (pay_unit_master / master_unit)
  const [unitCity, setUnitCity] = useState<string>('');
  const [unitName, setUnitName] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const fetchUnitFromSQL = async () => {
      try {
        const res = await apiClient.get<any>(`/api/masters/units/?search=${encodeURIComponent(unitCode)}`);
        if (res.success && res.data) {
          const raw = res.data;
          const list = Array.isArray(raw) ? raw : raw.results || [raw];
          const match = list.find((item: any) => String(item.unit_code || '').trim() === unitCode);
          if (match && isMounted) {
            if (match.unit_city) setUnitCity(match.unit_city.trim());
            if (match.unit_name) setUnitName(match.unit_name.trim());
            if (!destination) {
              setDestination(match.unit_name ? `${match.unit_name} (${unitCode})` : unitCode);
            }
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

  // Auto-calculate Bike Fare when KM or Rate changes
  useEffect(() => {
    if (selectedMode === 'Bike') {
      const km = parseFloat(distanceKm);
      const rate = parseFloat(ratePerKm);
      if (!isNaN(km) && km > 0 && !isNaN(rate) && rate > 0) {
        setFareAmount(String(Math.round(km * rate)));
      }
    }
  }, [distanceKm, ratePerKm, selectedMode]);

  // Load Past Claims from Backend
  useEffect(() => {
    if (activeTab === 'HISTORY') {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const now = new Date();
      const m = now.getMonth() + 1;
      const y = now.getFullYear();

      // Query live attendance conveyance bills endpoint
      const res = await apiClient.get<any>(
        `/api/attendance/conveyance-bills/?unit_code=${encodeURIComponent(unitCode)}&month=${m}&year=${y}`
      );
      if (res.success && res.data && Array.isArray(res.data.results) && res.data.results.length > 0) {
        const mapped: PastClaim[] = res.data.results.map((item: any) => ({
          id: item.id,
          date: item.uploaded_at ? item.uploaded_at.split('T')[0] : `${y}-${String(m).padStart(2, '0')}-01`,
          origin: 'Site Duty',
          destination: item.emp_name ? `${item.emp_name} (${item.emp_code})` : unitCode,
          mode: 'Employee Conveyance',
          amount: parseFloat(item.amount) || 0,
          status: item.status || 'Pending',
        }));
        setPastClaims(mapped);
      } else {
        // Check Travel Plans
        const tRes = await apiClient.get<any>('/api/transactions/travel-plans/');
        if (tRes.success && tRes.data) {
          const list = Array.isArray(tRes.data) ? tRes.data : tRes.data.results || [];
          if (list.length > 0) {
            const mapped: PastClaim[] = list.map((item: any) => ({
              id: item.id || item.expenses_id,
              date: item.from_date || today,
              origin: item.from_designation || 'Origin',
              destination: item.to_designation || 'Destination',
              mode: item.travel_mode || 'Local Travel',
              amount: parseFloat(item.adv_amount) || 0,
              status: item.expense_status || 'Submitted',
            }));
            setPastClaims(mapped);
            return;
          }
        }
        setPastClaims([]);
      }
    } catch {
      setPastClaims([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Camera Picker
  const handleOpenReceiptPicker = () => {
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
            if (asset.uri) {
              setReceiptImage({
                uri: asset.uri,
                name: asset.fileName || `conveyance_${Date.now()}.jpg`,
                type: asset.type || 'image/jpeg',
              });
              showToast({
                type: 'success',
                title: 'Receipt Captured',
                message: 'Conveyance proof photo attached.',
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
          if (asset.uri) {
            setReceiptImage({
              uri: asset.uri,
              name: asset.fileName || `conveyance_${Date.now()}.jpg`,
              type: asset.type || 'image/jpeg',
            });
            showToast({
              type: 'success',
              title: 'Receipt Selected',
              message: 'Bill attached from gallery.',
            });
          }
        }
      });
    }, 250);
  };

  // Calendar Day Click
  const handleSelectDay = (day: number) => {
    setPickerDay(day);
    const mm = String(pickerMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    setTravelDate(`${pickerYear}-${mm}-${dd}`);
    setShowDatePicker(false);
  };

  // Calendar Matrix Generator
  const daysInMonth = useMemo(() => {
    return new Date(pickerYear, pickerMonth + 1, 0).getDate();
  }, [pickerYear, pickerMonth]);

  const firstDayOfMonth = useMemo(() => {
    return new Date(pickerYear, pickerMonth, 1).getDay();
  }, [pickerYear, pickerMonth]);

  // Form Submit
  const handleSubmitClaim = async () => {
    if (!origin.trim()) {
      showToast({ type: 'warning', title: 'Origin Required', message: 'Please enter starting point/location.' });
      return;
    }
    if (!destination.trim()) {
      showToast({ type: 'warning', title: 'Destination Required', message: 'Please enter destination unit.' });
      return;
    }
    const amountVal = parseFloat(fareAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      showToast({ type: 'warning', title: 'Invalid Amount', message: 'Please enter a valid fare/claim amount.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const travelPlanPayload = {
        travel_mode: (selectedMode === 'Bike' ? 'Auto' : selectedMode) as any,
        from_designation: origin.trim(),
        to_designation: destination.trim(),
        from_date: travelDate,
        to_date: travelDate,
        adv_amount: String(amountVal),
        total_km: selectedMode === 'Bike' ? parseFloat(distanceKm) || 10 : 10,
        add_description: `${purpose} (${selectedMode} - ₹${amountVal})`,
      };

      await supervisorApi.submitTravelPlan(travelPlanPayload);

      // Also upload file receipt to conveyance-bills endpoint if photo was attached
      if (receiptImage) {
        try {
          const now = new Date(travelDate);
          const formData = new FormData();
          formData.append('emp_code', supervisorCode);
          formData.append('unit_code', unitCode);
          formData.append('month', String(now.getMonth() + 1));
          formData.append('year', String(now.getFullYear()));
          formData.append('amount', String(amountVal));
          formData.append('bill_file', {
            uri: receiptImage.uri,
            name: receiptImage.name,
            type: receiptImage.type,
          } as any);

          await apiClient.upload('/api/attendance/conveyance-bills/upload/', formData);
        } catch {
          // Travel plan was already saved
        }
      }

      showToast({
        type: 'success',
        title: 'Claim Submitted Successfully',
        message: `Conveyance claim for ₹${amountVal} forwarded for Admin & Finance approval.`,
      });

      // Reset and switch to history
      setOrigin('');
      setDistanceKm('');
      setFareAmount('');
      setReceiptImage(null);
      setActiveTab('HISTORY');
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Submission Failed',
        message: err?.message || 'Could not record claim. Check network.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppScreenContainer
      scrollable
      contentContainerStyle={styles.container}
      header={<AppHeader title="Conveyance & Travel" onBack={goBack} />}
    >
      {/* ── Tab Switcher ── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab('NEW_CLAIM')}
          style={[styles.tabBtn, activeTab === 'NEW_CLAIM' && styles.tabBtnActive]}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'NEW_CLAIM' && styles.tabTextActive]}>
            New Travel Claim
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('HISTORY')}
          style={[styles.tabBtn, activeTab === 'HISTORY' && styles.tabBtnActive]}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'HISTORY' && styles.tabTextActive]}>
            Past Claims & History
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'NEW_CLAIM' ? (
        <>
          {/* Form Card */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <AppIcon name="calendar" size={18} color={brandColor} />
              <Text style={styles.cardTitle}>Journey Details</Text>
            </View>

            {/* Allocated Unit info pill from SQL */}
            <View style={styles.unitChipRow}>
              <AppIcon name="building" size={15} color="#64748B" />
              <Text style={styles.unitChipText} numberOfLines={1}>
                {unitName ? `${unitName} (${unitCode})` : `Unit Code: ${unitCode}`}
              </Text>
              {unitCity ? <Text style={styles.unitChipCity}>{unitCity}</Text> : null}
            </View>

            {/* Travel Date Input (Opens Custom Calendar Modal) */}
            <TouchableOpacity activeOpacity={0.8} onPress={() => setShowDatePicker(true)}>
              <View pointerEvents="none">
                <AppTextInput
                  label="Travel Date *"
                  value={travelDate}
                  onChangeText={() => {}}
                  iconLeft="calendar"
                  editable={false}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </TouchableOpacity>

            {/* Travel Mode Selector */}
            <Text style={styles.inputLabel}>
              Mode of Travel <Text style={styles.inputRequired}>*</Text>
            </Text>
            <View style={styles.modeGrid}>
              {MODES.map((m) => {
                const isSelected = selectedMode === m.key;
                return (
                  <TouchableOpacity
                    key={m.key}
                    onPress={() => setSelectedMode(m.key)}
                    style={[styles.modeCard, isSelected && styles.modeCardActive]}
                    activeOpacity={0.7}
                  >
                    <AppIcon
                      name={m.icon}
                      size={20}
                      color={isSelected ? '#4F46E5' : '#64748B'}
                    />
                    <Text style={[styles.modeLabel, isSelected && styles.modeLabelActive]}>
                      {m.key}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Origin & Destination */}
            <AppTextInput
              label="Starting Location (From) *"
              value={origin}
              onChangeText={setOrigin}
              iconLeft="location"
              placeholder="e.g. Branch Office / Home"
            />

            <AppTextInput
              label="Destination Site (To) *"
              value={destination}
              onChangeText={setDestination}
              iconLeft="location"
              placeholder="e.g. Unit 402 Nesco Tech Park"
            />

            {/* Bike Distance + Rate per KM Auto Calculator */}
            {selectedMode === 'Bike' && (
              <>
                <View style={styles.bikeCalcRow}>
                  <View style={styles.bikeInputWrap}>
                    <AppTextInput
                      label="Total KM *"
                      value={distanceKm}
                      onChangeText={setDistanceKm}
                      keyboardType="numeric"
                      placeholder="e.g. 24"
                      iconLeft="navigation"
                    />
                  </View>
                  <View style={styles.bikeInputWrap}>
                    <AppTextInput
                      label="Rate / KM (₹)"
                      value={ratePerKm}
                      onChangeText={setRatePerKm}
                      keyboardType="numeric"
                      placeholder="3.50"
                      iconLeft="money"
                    />
                  </View>
                </View>

                <View style={styles.calcHintBox}>
                  <AppIcon name="check" size={14} color="#166534" />
                  <Text style={styles.calcHintText}>
                    Formula: {distanceKm || '0'} KM × ₹{ratePerKm || '3.50'} = ₹{fareAmount || '0'}
                  </Text>
                </View>
              </>
            )}

            {/* Fare Amount (Editable for Auto/Bus/Train, Auto-computed for Bike) */}
            <AppTextInput
              label="Claim Amount in Rupees (₹) *"
              value={fareAmount}
              onChangeText={setFareAmount}
              keyboardType="numeric"
              iconLeft="money"
              placeholder="Total expense amount"
            />

            {/* Purpose */}
            <AppTextInput
              label="Purpose / Remarks *"
              value={purpose}
              onChangeText={setPurpose}
              iconLeft="document"
              placeholder="e.g. Surprise night audit & guard muster verification"
            />

            {/* Receipt Proof Photo Capture */}
            <Text style={styles.inputLabel}>Fuel Bill / Travel Ticket Photo</Text>
            <TouchableOpacity
              onPress={handleOpenReceiptPicker}
              style={[styles.receiptUploadBox, receiptImage ? styles.receiptAttachedBox : null]}
              activeOpacity={0.75}
            >
              {receiptImage ? (
                <>
                  <View style={styles.receiptThumbWrap}>
                    <Image source={{ uri: receiptImage.uri }} style={styles.receiptThumb} />
                  </View>
                  <Text style={styles.receiptTextTitle}>Receipt Attached ✓</Text>
                  <Text style={styles.receiptTextSub} numberOfLines={1}>{receiptImage.name}</Text>
                  <View style={styles.receiptActionRow}>
                    <View style={styles.receiptActionBtn}>
                      <Text style={styles.receiptActionText}>Retake Photo</Text>
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        setReceiptImage(null);
                      }}
                      style={[styles.receiptActionBtn, { backgroundColor: '#FEE2E2' }]}
                    >
                      <Text style={[styles.receiptActionText, { color: '#B91C1C' }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <AppIcon name="camera" size={26} color={brandColor} />
                  <Text style={styles.receiptTextTitle}>Tap to Photograph Receipt / Ticket</Text>
                  <Text style={styles.receiptTextSub}>
                    Capture fuel bill, toll voucher, or travel ticket
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Total Highlight */}
            {fareAmount ? (
              <View style={styles.totalBanner}>
                <Text style={styles.totalBannerLabel}>Total Conveyance Claim</Text>
                <Text style={styles.totalBannerValue}>₹{fareAmount}</Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <View style={styles.submitBtnWrap}>
              <AppButton
                title={isSubmitting ? 'Submitting Claim...' : 'Submit Conveyance Claim'}
                onPress={handleSubmitClaim}
                iconLeft="check"
                loading={isSubmitting}
                customColor={brandColor}
              />
            </View>
          </View>
        </>
      ) : (
        /* ── Past Claims History Tab ── */
        <View>
          {historyLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="small" color={brandColor} />
              <Text style={styles.emptyStateSub}>Loading your travel claims...</Text>
            </View>
          ) : pastClaims.length === 0 ? (
            <View style={[styles.card, styles.emptyState]}>
              <AppIcon name="document" size={36} color="#94A3B8" />
              <Text style={styles.emptyStateText}>No Claims Found</Text>
              <Text style={styles.emptyStateSub}>You haven't submitted any travel claims this month.</Text>
            </View>
          ) : (
            pastClaims.map((claim) => (
              <View key={claim.id} style={styles.claimHistoryItem}>
                <View style={styles.claimItemHeader}>
                  <Text style={styles.claimDateText}>{claim.date}</Text>
                  <Text style={styles.claimAmountBadge}>₹{claim.amount}</Text>
                </View>

                <View style={styles.claimRouteRow}>
                  <AppIcon name="location" size={14} color="#64748B" />
                  <Text style={styles.claimRouteText} numberOfLines={1}>
                    {claim.origin} → {claim.destination}
                  </Text>
                </View>

                <View style={styles.claimMetaRow}>
                  <View style={styles.claimModeBadge}>
                    <Text style={styles.claimModeText}>{claim.mode}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      claim.status.includes('Approved')
                        ? styles.statusApproved
                        : claim.status.includes('Rejected')
                        ? styles.statusRejected
                        : styles.statusPending,
                    ]}
                  >
                    <Text
                      style={
                        claim.status.includes('Approved')
                          ? styles.statusApprovedText
                          : claim.status.includes('Rejected')
                          ? styles.statusRejectedText
                          : styles.statusPendingText
                      }
                    >
                      {claim.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select Travel Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <AppIcon name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Month & Year Navigation */}
            <View style={styles.monthNavRow}>
              <TouchableOpacity
                onPress={() => {
                  if (pickerMonth === 0) {
                    setPickerMonth(11);
                    setPickerYear((y) => y - 1);
                  } else {
                    setPickerMonth((m) => m - 1);
                  }
                }}
                style={styles.monthNavBtn}
              >
                <AppIcon name="chevron-left" size={16} color="#0F172A" />
              </TouchableOpacity>
              <Text style={styles.monthNavText}>
                {MONTH_NAMES[pickerMonth]} {pickerYear}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (pickerMonth === 11) {
                    setPickerMonth(0);
                    setPickerYear((y) => y + 1);
                  } else {
                    setPickerMonth((m) => m + 1);
                  }
                }}
                style={styles.monthNavBtn}
              >
                <AppIcon name="chevron-right" size={16} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {/* Weekday Row */}
            <View style={styles.weekDaysRow}>
              {WEEK_DAYS.map((wd) => (
                <Text key={wd} style={styles.weekDayText}>{wd}</Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.calendarGrid}>
              {Array.from({ length: firstDayOfMonth }, (_, i) => (
                <View key={`empty-${i}`} style={styles.calendarDayCell} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const dayNum = i + 1;
                const isSelected = dayNum === pickerDay;
                return (
                  <TouchableOpacity
                    key={`day-${dayNum}`}
                    style={styles.calendarDayCell}
                    onPress={() => handleSelectDay(dayNum)}
                  >
                    <View style={[styles.calendarDayInner, isSelected && styles.calendarDayInnerSelected]}>
                      <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected]}>
                        {dayNum}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={() => setShowDatePicker(false)}
              style={styles.calendarCancelBtn}
            >
              <Text style={styles.calendarCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Camera / Gallery Selection Modal */}
      <CustomAlertModal
        visible={isPhotoPickerOpen}
        type="choose"
        title="Upload Receipt Proof"
        message="Take a live photo of your petrol bill, toll slip, or ticket, or pick from gallery."
        buttons={[
          {
            text: 'Take Live Photo (Camera)',
            style: 'default',
            onPress: openCameraPicker,
          },
          {
            text: 'Choose from Gallery',
            style: 'default',
            onPress: openGalleryPicker,
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setIsPhotoPickerOpen(false),
          },
        ]}
        onClose={() => setIsPhotoPickerOpen(false)}
      />
    </AppScreenContainer>
  );
};
