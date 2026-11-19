import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { styles } from './PettyCashScreen.styles';
import { AppScreenContainer, AppButton, AppTextInput, AppIcon, CustomAlertModal } from '../../../components/common';
import { useNavigation } from '../../../navigation/navigationContext';
import { useAuthStore } from '../../../store/authStore';
import { useTenantStore } from '../../../store/tenantStore';
import { showToast } from '../../../store/toastStore';
import { staffApi } from '../../../api/staff.api';
import { colors } from '../../../theme/colors';

export const PettyCashScreen: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { currentCompany } = useTenantStore();
  const { goBack } = useNavigation();

  const [activeTab, setActiveTab] = useState<'NEW_CLAIM' | 'MY_HISTORY'>('NEW_CLAIM');

  // Form Fields
  const [merchant, setMerchant] = useState('');
  const [itemPurchased, setItemPurchased] = useState('');
  const [amount, setAmount] = useState('');
  const [receiptPhoto, setReceiptPhoto] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  // States
  const [submitting, setSubmitting] = useState(false);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [claimsList, setClaimsList] = useState<any[]>([]);

  // Custom Alert Modal State
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);

  const empCode = currentUser?.empCode || currentUser?.username || '';
  const brandColor = currentCompany?.brandColor || colors.primary;

  // Fetch real Petty Cash claims from MySQL via backend
  const fetchMyClaims = async () => {
    setLoadingClaims(true);
    try {
      const res = await staffApi.getPettyCashRequests();
      if (res.success && res.data) {
        const list = res.data.results || (Array.isArray(res.data) ? res.data : []);
        // Strictly filter only for current employee's claims from database - ZERO fallback
        const myFiltered = list.filter(
          (c: any) =>
            (c.emp_code && c.emp_code === empCode) ||
            (c.create_by && c.create_by === empCode)
        );
        setClaimsList(myFiltered);
      } else {
        setClaimsList([]);
      }
    } catch (e) {
      console.warn('[PettyCash] Failed to fetch live claims:', e);
      setClaimsList([]);
    } finally {
      setLoadingClaims(false);
    }
  };

  useEffect(() => {
    fetchMyClaims();
  }, []);

  // Pick receipt using Custom App Modal (NO system Alert.alert)
  const openCameraPicker = () => {
    setIsPhotoPickerOpen(false);
    setTimeout(() => {
      launchCamera({ mediaType: 'photo', quality: 0.8 }, (response) => {
        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          setReceiptPhoto({
            uri: asset.uri || '',
            name: asset.fileName || `receipt_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
          });
          showToast({
            type: 'success',
            title: 'Bill Photo Attached',
            message: 'Preview below before submitting to database.',
          });
        }
      });
    }, 250);
  };

  const openGalleryPicker = () => {
    setIsPhotoPickerOpen(false);
    setTimeout(() => {
      launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          setReceiptPhoto({
            uri: asset.uri || '',
            name: asset.fileName || `receipt_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
          });
          showToast({
            type: 'success',
            title: 'Bill Photo Selected',
            message: 'Preview below before submitting to database.',
          });
        }
      });
    }, 250);
  };

  // Submit live claim to MySQL `petty_cash`
  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);
    if (!merchant.trim()) {
      showToast({ type: 'warning', title: 'Missing Shop', message: 'Please enter shop or vendor name.' });
      return;
    }
    if (!itemPurchased.trim()) {
      showToast({ type: 'warning', title: 'Missing Item', message: 'Please enter items purchased.' });
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast({ type: 'warning', title: 'Invalid Amount', message: 'Please enter a valid expense amount.' });
      return;
    }

    setSubmitting(true);
    try {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      const formattedDate = `${dd}/${mm}/${yyyy}`;

      const formData = new FormData();
      formData.append('client_code', (currentUser as any)?.scope?.client_code || (currentUser as any)?.clientCode || '');
      formData.append('state', (currentUser as any)?.scope?.state_name || (currentUser as any)?.state || '');
      formData.append('unit_code', (currentUser as any)?.scope?.unit_code || currentUser?.branchOrUnit || '');
      formData.append('unit_name', (currentUser as any)?.scope?.unit_name || currentUser?.branchOrUnit || '');
      formData.append('client_name', (currentUser as any)?.scope?.client_name || (currentUser as any)?.scope?.company_name || '');
      formData.append('emp_code', empCode);
      formData.append('request_date', formattedDate);
      formData.append('item', itemPurchased.trim());
      formData.append('shop', merchant.trim());
      formData.append('amount', String(amountNum));

      if (receiptPhoto) {
        formData.append('qr_image', {
          uri: receiptPhoto.uri,
          name: receiptPhoto.name,
          type: receiptPhoto.type,
        } as any);
      } else {
        formData.append('qr_image', {
          uri: 'https://via.placeholder.com/300.png',
          name: 'receipt_placeholder.png',
          type: 'image/png',
        } as any);
      }

      const res = await staffApi.submitPettyCash(formData);

      if (res.success) {
        const backendMsg =
          (res.data && (res.data.status || res.data.message)) ||
          'Request Send Successfully...!!!';
        showToast({
          type: 'success',
          title: 'Success',
          message: backendMsg,
        });
        setMerchant('');
        setItemPurchased('');
        setAmount('');
        setReceiptPhoto(null);
        fetchMyClaims();
        setActiveTab('MY_HISTORY');
      } else {
        const backendErr = res.error || 'Claim could not be processed.';
        showToast({
          type: 'warning',
          title: 'Notice',
          message: backendErr,
        });
        fetchMyClaims();
        setActiveTab('MY_HISTORY');
      }
    } catch (e: any) {
      console.warn('[PettyCash] Submit error:', e);
      showToast({
        type: 'error',
        title: 'Submission Failed',
        message: e?.message || 'Network error while submitting to database.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = claimsList.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0
  );

  return (
    <AppScreenContainer scrollable contentContainerStyle={styles.container} edges={['top', 'bottom']}>
      {/* ── Flush Edge-to-Edge Custom Header Matching Attendance Punch Header ── */}
      <View style={styles.topHeaderBar}>
        <View style={styles.headerLeftWrap}>
          <TouchableOpacity
            onPress={goBack}
            style={styles.backIconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <AppIcon name="arrowLeft" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={styles.headerTitleText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              Petty Cash Claims
            </Text>
          </View>
        </View>

        <View style={styles.headerTotalBadge}>
          <Text style={styles.headerTotalText}>₹{totalAmount.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* ── Navigation Tabs (Segmented Control) ── */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'NEW_CLAIM' && [styles.tabButtonActive, { borderColor: brandColor }]]}
          onPress={() => setActiveTab('NEW_CLAIM')}
          activeOpacity={0.75}
        >
          <AppIcon
            name="plus"
            size={16}
            color={activeTab === 'NEW_CLAIM' ? brandColor : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'NEW_CLAIM' && { color: brandColor, fontWeight: '800' }]}>
            New Claim
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'MY_HISTORY' && [styles.tabButtonActive, { borderColor: brandColor }]]}
          onPress={() => {
            setActiveTab('MY_HISTORY');
            fetchMyClaims();
          }}
          activeOpacity={0.75}
        >
          <AppIcon
            name="file-text"
            size={16}
            color={activeTab === 'MY_HISTORY' ? brandColor : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'MY_HISTORY' && { color: brandColor, fontWeight: '800' }]}>
            My Claims ({claimsList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── TAB 1: NEW CLAIM FORM ── */}
      {activeTab === 'NEW_CLAIM' && (
        <View style={styles.card}>
          <View style={styles.formSectionTitleRow}>
            <AppIcon name="document" size={16} color={brandColor} />
            <Text style={styles.formSectionTitle}>EXPENSE DETAILS</Text>
          </View>

          <AppTextInput
            label="Merchant / Shop Name"
            placeholder="e.g. Metro Stationery Mart"
            value={merchant}
            onChangeText={setMerchant}
            iconLeft="building"
          />

          <AppTextInput
            label="Item Purchased / Description"
            placeholder="e.g. Gate visitor register, cleaning liquid, battery"
            value={itemPurchased}
            onChangeText={setItemPurchased}
            iconLeft="document"
          />

          <AppTextInput
            label="Amount in Rupees (₹)"
            placeholder="e.g. 350"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            iconLeft="money"
          />

          {/* Receipt Attachment & Visual Preview Card */}
          {receiptPhoto ? (
            <View style={styles.previewContainer}>
              <View style={styles.previewImageBox}>
                <Image
                  source={{ uri: receiptPhoto.uri }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setIsPhotoPickerOpen(true)}
                  style={styles.changeFloatingBtn}
                  activeOpacity={0.8}
                >
                  <AppIcon name="rotate-cw" size={13} color="#FFFFFF" />
                  <Text style={styles.changeFloatingText}>Change</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setReceiptPhoto(null)}
                  style={styles.removePhotoBtn}
                  activeOpacity={0.8}
                >
                  <AppIcon name="close" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setIsPhotoPickerOpen(true)}
              style={styles.uploadBox}
              activeOpacity={0.7}
            >
              <View style={styles.uploadPlaceholder}>
                <View style={styles.uploadIconCircle}>
                  <AppIcon name="camera" size={20} color={brandColor} />
                </View>
                <Text style={styles.uploadText}>Attach Bill / Cash Receipt</Text>
                <Text style={styles.uploadSub}>Tap to capture from Camera or select from Gallery</Text>
              </View>
            </TouchableOpacity>
          )}

          <AppButton
            title={submitting ? 'Submitting...' : 'Submit '}
            onPress={handleSubmit}
            disabled={submitting}
            iconLeft={submitting ? undefined : 'check'}
            style={styles.submitBtn}
            customColor={brandColor}
          />
        </View>
      )}

      {/* ── TAB 2: LIVE CLAIMS HISTORY FROM SQL ── */}
      {activeTab === 'MY_HISTORY' && (
        <View style={styles.historyContainer}>
          {loadingClaims ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={brandColor} />
              <Text style={styles.loadingText}>Fetching claims from MySQL database...</Text>
            </View>
          ) : claimsList.length === 0 ? (
            <View style={styles.emptyBox}>
              <AppIcon name="file-text" size={40} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Claims Found</Text>
              <Text style={styles.emptySub}>You haven't submitted any petty cash claims yet.</Text>
            </View>
          ) : (
            claimsList.map((item, index) => {
              const statusRaw = String(item.status || (item.flag === 2 ? 'Approved' : 'Pending Approval'));
              const isApproved = statusRaw.toLowerCase().includes('approved') || item.flag === 2;
              const displayStatus = isApproved ? 'Approved' : 'Pending Approval';

              return (
                <View key={item.id || index} style={styles.claimTile}>
                  <View style={styles.claimTileHeader}>
                    <View style={styles.claimTileLeft}>
                      <View style={[styles.claimIconCircle, { backgroundColor: isApproved ? '#DCFCE7' : '#FEF3C7' }]}>
                        <AppIcon
                          name={isApproved ? 'check-circle' : 'clock'}
                          size={18}
                          color={isApproved ? '#15803D' : '#D97706'}
                        />
                      </View>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.claimItemTitle} numberOfLines={1}>
                          {item.item || 'Operational Expense'}
                        </Text>
                        <Text style={styles.claimShopText} numberOfLines={1}>
                          {item.shop || 'Local Vendor'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.claimAmountText}>
                      ₹{parseFloat(item.amount || '0').toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.claimTileFooter}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: isApproved ? '#DCFCE7' : '#FEF3C7',
                          borderWidth: 1,
                          borderColor: isApproved ? '#BBF7D0' : '#FDE68A',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: isApproved ? '#15803D' : '#B45309' },
                        ]}
                      >
                        {displayStatus}
                      </Text>
                    </View>

                    <Text style={styles.claimDateText}>
                      {item.create_date ? String(item.create_date).substring(0, 10) : 'Recent'}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* ── Premium Custom Modal For Selecting Photo Source ── */}
      <CustomAlertModal
        visible={isPhotoPickerOpen}
        title="Attach Bill Receipt"
        message="Please photograph the physical bill / invoice or choose an existing photo from gallery."
        type="choose"
        onClose={() => setIsPhotoPickerOpen(false)}
        buttons={[
          {
            text: 'Camera',
            icon: 'camera',
            onPress: openCameraPicker,
          },
          {
            text: 'Gallery',
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
