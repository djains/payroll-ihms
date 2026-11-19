import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './ShiftMasterScreen.styles';
import {
  AppScreenContainer,
  AppIcon,
} from '../../../components/common';
import { useNavigation } from '../../../navigation/navigationContext';
import { superadminApi, BackendShift } from '../../../api';
import { colors } from '../../../theme';

// Module-level in-memory cache
let cachedShifts: BackendShift[] | null = null;

export const ShiftMasterScreen: React.FC = () => {
  const { goBack } = useNavigation();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16);

  const [shifts, setShifts] = useState<BackendShift[]>(cachedShifts || []);
  const [loading, setLoading] = useState<boolean>(!cachedShifts);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchShifts = async () => {
    try {
      const res = await superadminApi.getShifts();
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
        cachedShifts = list;
        setShifts(list);
      }
    } catch (e) {
      console.warn('[ShiftMaster] fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchShifts();
  };

  const renderShiftItem = ({ item }: { item: BackendShift }) => {
    return (
      <View style={styles.shiftCard}>
        <View style={styles.cardTopRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View style={styles.shiftIconWrap}>
              <AppIcon name="clock" size={18} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.shiftTitle} numberOfLines={1}>
                {item.shift_name}
              </Text>
              <Text style={styles.shiftCodeText}>Code: {item.shift_code}</Text>
            </View>
          </View>

          <View style={styles.hoursBadge}>
            <Text style={styles.hoursBadgeText}>
              {item.working_hours ? `${item.working_hours} Hours` : 'Standard'}
            </Text>
          </View>
        </View>

        <View style={styles.timingsGrid}>
          <View style={styles.timeCol}>
            <Text style={styles.timeLabel}>SHIFT START (IN)</Text>
            <Text style={styles.timeValue}>{item.in_time || '09:00 AM'}</Text>
          </View>
          <View style={styles.timeCol}>
            <Text style={styles.timeLabel}>SHIFT END (OUT)</Text>
            <Text style={styles.timeValue}>{item.out_time || '06:00 PM'}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <AppScreenContainer
      style={styles.container}
      backgroundColor={colors.background}
    >
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={goBack}
            activeOpacity={0.7}
          >
            <AppIcon name="chevronLeft" size={18} color="#0F172A" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Shift Master Policy</Text>
            <Text style={styles.headerSubtitle}>
              Live MySQL Shift Schedules & Rules
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.emptyWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.emptyText}>Loading shift definitions from MySQL...</Text>
        </View>
      ) : (
        <FlatList
          data={shifts}
          keyExtractor={(item) => String(item.id || item.shift_code)}
          renderItem={renderShiftItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomInset + 30 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <AppIcon name="clock" size={32} color="#94A3B8" />
              <Text style={styles.emptyText}>No shifts configured in database.</Text>
            </View>
          }
        />
      )}
    </AppScreenContainer>
  );
};

