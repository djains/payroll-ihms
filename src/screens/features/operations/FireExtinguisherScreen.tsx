import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './FireExtinguisherScreen.styles';
import { AppScreenContainer, AppHeader, AppButton, AppTextInput, AppIcon } from '../../../components/common';
import { useNavigation } from '../../../navigation/navigationContext';
import { useTenantStore } from '../../../store/tenantStore';
import { showToast } from '../../../store/toastStore';
import { colors } from '../../../theme/colors';

interface ExtinguisherType {
  id: string;
  label: string;
}

const EXTINGUISHER_TYPES: ExtinguisherType[] = [
  { id: 'ABC_DRY_POWDER', label: 'ABC Dry Powder' },
  { id: 'CO2_CARBON_DIOXIDE', label: 'CO2 (Carbon Dioxide)' },
  { id: 'WATER_TYPE', label: 'Water Type' },
  { id: 'FOAM_TYPE', label: 'Mechanical Foam' },
];

export const FireExtinguisherScreen: React.FC = () => {
  const [selectedType, setSelectedType] = useState('ABC_DRY_POWDER');
  const [pressureGaugeStatus, setPressureGaugeStatus] = useState('');
  const [cylinderNumber, setCylinderNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);

  const { currentCompany } = useTenantStore();
  const { goBack } = useNavigation();

  const handleCapturePhoto = () => {
    setHasPhoto(true);
    showToast({
      type: 'info',
      title: 'Gauge Photo Stamped',
      message: 'Pressure gauge & tag validity photo attached.',
    });
  };

  const handleSubmitAudit = () => {
    showToast({
      type: 'success',
      title: 'Extinguisher Logged',
      message: `${cylinderNumber} inspection report submitted.`,
    });
    goBack();
  };

  const brandColor = currentCompany?.brandColor || colors.primary;

  return (
    <AppScreenContainer scrollable contentContainerStyle={styles.container}>
      <AppHeader
        title="Fire Extinguisher Audit"
        subtitle="Pressure Gauge & Tag Inspection (SO)"
        onBack={goBack}
      />

      <View style={styles.card}>
        <Text style={{ ...styles.typeText, marginBottom: 8 }}>Extinguisher Type</Text>
        <View style={styles.typeRow}>
          {EXTINGUISHER_TYPES.map((t) => {
            const isSelected = selectedType === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => setSelectedType(t.id)}
                style={[styles.typeBtn, isSelected && { backgroundColor: brandColor, borderColor: brandColor }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.typeText, isSelected && styles.typeTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <AppTextInput
          label="Cylinder Serial / Tag Number"
          value={cylinderNumber}
          onChangeText={setCylinderNumber}
          iconLeft="shield"
        />

        <AppTextInput
          label="Pressure Gauge Reading"
          value={pressureGaugeStatus}
          onChangeText={setPressureGaugeStatus}
          iconLeft="audit"
        />

        <AppTextInput
          label="Valid Until Expiry Date"
          value={expiryDate}
          onChangeText={setExpiryDate}
          iconLeft="calendar"
        />

        {/* Photo evidence slot */}
        <TouchableOpacity
          onPress={handleCapturePhoto}
          style={[styles.photoBox, hasPhoto && { backgroundColor: colors.successLight }]}
          activeOpacity={0.7}
        >
          <AppIcon name="camera" size={24} color={hasPhoto ? colors.success : brandColor} />
          <Text style={[styles.photoBoxText, hasPhoto && { color: colors.success, fontWeight: '700' }]}>
            {hasPhoto ? 'Photo Evidence Stamped ✓' : 'Tap to photograph pressure gauge & tag'}
          </Text>
        </TouchableOpacity>

        <AppButton
          title="Submit Extinguisher Inspection"
          onPress={handleSubmitAudit}
          iconLeft="check"
          style={styles.submitBtn}
          customColor={brandColor}
        />
      </View>
    </AppScreenContainer>
  );
};
