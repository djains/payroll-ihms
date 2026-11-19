import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './CreateRoleScreen.styles';
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

const APPROVAL_LEVELS = [
  { id: 1, label: 'L1: Field Staff' },
  { id: 2, label: 'L2: Site Supervisor' },
  { id: 3, label: 'L3: Operations Manager' },
  { id: 4, label: 'L4: Director / Admin' },
];

export const CreateRoleScreen: React.FC = () => {
  const { goBack } = useNavigation();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16);

  const [roleName, setRoleName] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [description, setDescription] = useState('');
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

  const handleCreateRole = async () => {
    if (!roleName.trim()) {
      setErrors({ roleName: 'Role title / designation name is required' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await superadminApi.createRole({
        name: roleName.trim(),
        approval_level: '1',
      });

      if (res.success) {
        showToast({
          type: 'success',
          title: 'Role Created',
          message: `Role "${roleName}" created successfully.`,
        });
        goBack();
      } else {
        setAlertConfig({
          visible: true,
          title: 'Failed to Create Role',
          message: res.error || 'Backend could not create role. Please verify name is unique.',
          type: 'danger',
          onConfirm: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
        });
      }
    } catch (e: any) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: e?.message || 'Network connection failed.',
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
          title="Create Role"
          subtitle="Enterprise Designation Master"
          onBack={goBack}
        />
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.contentWrap, { paddingBottom: bottomInset + 40 }]}
      >
        <View style={styles.formCard}>
          <Text style={styles.cardSectionTitle}>Role Definition</Text>
          <Text style={styles.cardSectionSub}>
            Enter the designation title for your company's workforce
          </Text>

          <AppTextInput
            label="Role Name / Designation *"
            placeholder="e.g. Senior Security Guard / Site Supervisor"
            value={roleName}
            onChangeText={(v) => {
              setRoleName(v);
              if (errors.roleName) setErrors((prev) => ({ ...prev, roleName: '' }));
            }}
            iconLeft="shield"
            error={errors.roleName}
          />

          <AppTextInput
            label="Role Description (Optional)"
            placeholder="e.g. In charge of site geofence punches, audits & muster"
            value={description}
            onChangeText={setDescription}
            iconLeft="document"
          />
        </View>

        <View style={styles.buttonWrap}>
          <AppButton
            title={submitting ? 'Registering Role...' : 'Create Role'}
            onPress={handleCreateRole}
            loading={submitting}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>

      {/* Modern Alert Modal with Action on Top, Cancel on Bottom */}
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
