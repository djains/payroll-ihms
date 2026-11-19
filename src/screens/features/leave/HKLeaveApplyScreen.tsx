import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  AppScreenContainer,
  AppHeader,
  AppCard,
  AppTextInput,
  AppButton,
} from '../../../components/common';
import { useNavigation } from '../../../navigation';
import { useTenantStore } from '../../../store/tenantStore';
import { staffApi } from '../../../api';
import { showToast } from '../../../store/toastStore';
import { colors } from '../../../theme';
import { styles } from './HKLeaveApplyScreen.styles';

const SHIFT_OPTIONS = ['General (09:00 - 18:00)', 'Morning (07:00 - 15:00)', 'Evening (14:00 - 22:00)'];

export const HKLeaveApplyScreen: React.FC = () => {
  const { goBack } = useNavigation();
  const { currentCompany } = useTenantStore();
  const brandColor = currentCompany?.brandColor || colors.primary;

  const todayStr = new Date().toISOString().substring(0, 10);
  const [selectedShift, setSelectedShift] = useState(SHIFT_OPTIONS[0]);
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      showToast({
        type: 'error',
        title: 'Reason Required',
        message: 'Please mention a brief reason for leave application.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await staffApi.applyLeave({
        leave_type: 'CL',
        from_date: fromDate,
        to_date: toDate,
        leave_reason: `[${selectedShift.split(' ')[0]}] ${reason.trim()}`,
      });

      if (res.success) {
        showToast({
          type: 'success',
          title: 'HK Leave Forwarded',
          message: `Request saved to SQL & sent to Facility Supervisor for ${selectedShift.split(' ')[0]}.`,
        });
        goBack();
      } else {
        showToast({
          type: 'error',
          title: 'Submission Failed',
          message: res.error || 'Failed to submit leave request.',
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Network Error',
        message: err?.message || 'Could not connect to leave service.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreenContainer scrollable>
      <AppHeader
        title="Housekeeping Leave"
        subtitle="Route to Facility Supervisor"
        onBack={goBack}
      />

      <View style={styles.container}>
        <AppCard style={styles.card} variant="elevated">
          <Text style={styles.sectionTitle}>Select Your Shift</Text>
          <View style={styles.shiftRow}>
            {SHIFT_OPTIONS.map((shift) => {
              const active = shift === selectedShift;
              return (
                <TouchableOpacity
                  key={shift}
                  style={[
                    styles.shiftChip,
                    active && [styles.shiftChipActive, { backgroundColor: brandColor }],
                  ]}
                  onPress={() => setSelectedShift(shift)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.shiftChipText,
                      active && styles.shiftChipTextActive,
                    ]}
                  >
                    {shift.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <AppTextInput
            label="From Date (YYYY-MM-DD)"
            value={fromDate}
            onChangeText={setFromDate}
          />

          <AppTextInput
            label="To Date (YYYY-MM-DD)"
            value={toDate}
            onChangeText={setToDate}
          />

          <AppTextInput
            label="Reason for Absence"
            placeholder="e.g. Family function in native place"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
          />
        </AppCard>

        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>
            ℹ️ Facility supervisor will assign an on-call reliever guard/housekeeper during your leave days to ensure contract continuity.
          </Text>
        </View>

        <View style={styles.actionContainer}>
          <AppButton
            title="Submit Leave Application"
            variant="primary"
            loading={submitting}
            onPress={handleSubmit}
            customColor={brandColor}
          />
        </View>
      </View>
    </AppScreenContainer>
  );
};
