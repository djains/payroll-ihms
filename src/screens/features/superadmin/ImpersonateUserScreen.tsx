import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './ImpersonateUserScreen.styles';
import {
  AppScreenContainer,
  AppHeader,
  AppButton,
} from '../../../components/common';
import { useAuthStore } from '../../../store/authStore';
import { useNavigation } from '../../../navigation/navigationContext';

export const ImpersonateUserScreen: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { goBack } = useNavigation();

  return (
    <AppScreenContainer scrollable contentContainerStyle={styles.container}>
      <AppHeader
        title="Active Live Session"
        subtitle="Connected to MySQL Backend"
        onBack={goBack}
        transparent
      />

      <View style={styles.card}>
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            You are authenticated directly against MySQL database `ihms_18_02_2026`. Mock simulation is disabled in live API mode.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Current Authenticated Identity</Text>
        <Text style={styles.sectionSubtitle}>
          User ID: {currentUser?.username || '—'}
        </Text>
        <Text style={styles.sectionSubtitle}>
          Role: {currentUser?.role || '—'}
        </Text>
        <Text style={styles.sectionSubtitle}>
          Company: {currentUser?.companyId || 'Global'}
        </Text>

        <AppButton
          title="Return to Console"
          onPress={goBack}
          style={{ marginTop: 20 }}
        />
      </View>
    </AppScreenContainer>
  );
};
