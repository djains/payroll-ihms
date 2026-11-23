import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './SuperAdminDashboardScreen.styles';
import {
  AppScreenContainer,
  AppIcon,
  CustomAlertModal,
} from '../../../components/common';
import { useAuthStore } from '../../../store/authStore';
import { useNavigation } from '../../../navigation/navigationContext';
import { superadminApi } from '../../../api';
import { colors } from '../../../theme';

// Module-level in-memory cache for instant zero-flicker reload
let cachedAdminCounts: {
  cacheKey: string;
  companiesCount: number;
  rolesCount: number;
  usersCount: number;
  unitsCount: number;
  timestamp: number;
} | null = null;

export const SuperAdminDashboardScreen: React.FC = () => {
  const { currentUser, logout } = useAuthStore();
  const { navigate } = useNavigation();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16);
  const userCacheKey = `${currentUser?.companyId || ''}_${currentUser?.username || ''}`;
  const hasMatchingCache = Boolean(cachedAdminCounts && cachedAdminCounts.cacheKey === userCacheKey);

  // Initialize with cached counts if available - eliminates blank loading screen
  const [loading, setLoading] = useState<boolean>(!hasMatchingCache);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState<boolean>(false);

  // Live KPI counts from real MySQL backend
  const [companiesCount, setCompaniesCount] = useState<number>(hasMatchingCache ? cachedAdminCounts!.companiesCount : 0);
  const [rolesCount, setRolesCount] = useState<number>(hasMatchingCache ? cachedAdminCounts!.rolesCount : 0);
  const [usersCount, setUsersCount] = useState<number>(hasMatchingCache ? cachedAdminCounts!.usersCount : 0);
  const [unitsCount, setUnitsCount] = useState<number>(hasMatchingCache ? cachedAdminCounts!.unitsCount : 0);

  const fetchLiveCounts = async (isManualRefresh = false) => {
    // If cache is fresh (< 15s) for this user and not a manual pull-to-refresh, skip network call
    if (
      !isManualRefresh &&
      cachedAdminCounts &&
      cachedAdminCounts.cacheKey === userCacheKey &&
      Date.now() - cachedAdminCounts.timestamp < 15000
    ) {
      setLoading(false);
      return;
    }

    try {
      // Fetch lightweight counts in parallel with page_size=1 so backend returns exact SQL `count` fast
      const [compRes, usersRes, unitsRes, rolesRes] = await Promise.allSettled([
        superadminApi.getCompanies(undefined, 1, 1),
        superadminApi.getUsers(undefined, undefined, 1),
        superadminApi.getUnits(undefined, 1, 1),
        superadminApi.getRoles(1, 1),
      ]);

      let cCount = hasMatchingCache ? companiesCount : 0;
      let rCount = hasMatchingCache ? rolesCount : 0;
      let uCount = hasMatchingCache ? usersCount : 0;
      let unCount = hasMatchingCache ? unitsCount : 0;

      if (compRes.status === 'fulfilled' && compRes.value.success && compRes.value.data) {
        const d = compRes.value.data;
        cCount = typeof d.count === 'number' ? d.count : Array.isArray(d) ? d.length : Array.isArray(d.results) ? d.results.length : cCount;
        setCompaniesCount(cCount);
      }

      if (usersRes.status === 'fulfilled' && usersRes.value.success && usersRes.value.data) {
        const d = usersRes.value.data;
        uCount = typeof d.count === 'number' ? d.count : Array.isArray(d) ? d.length : Array.isArray(d.results) ? d.results.length : uCount;
        setUsersCount(uCount);
      }

      if (unitsRes.status === 'fulfilled' && unitsRes.value.success && unitsRes.value.data) {
        const d = unitsRes.value.data;
        unCount = typeof d.count === 'number' ? d.count : Array.isArray(d) ? d.length : Array.isArray(d.results) ? d.results.length : unCount;
        setUnitsCount(unCount);
      }

      if (rolesRes.status === 'fulfilled' && rolesRes.value.success && rolesRes.value.data) {
        const d = rolesRes.value.data;
        rCount = typeof d.count === 'number' ? d.count : Array.isArray(d) ? d.length : Array.isArray(d.results) ? d.results.length : rCount;
        setRolesCount(rCount);
      }

      // Save to memory cache
      cachedAdminCounts = {
        cacheKey: userCacheKey,
        companiesCount: cCount,
        rolesCount: rCount,
        usersCount: uCount,
        unitsCount: unCount,
        timestamp: Date.now(),
      };
    } catch (e) {
      console.warn('[SuperAdminDashboard] count fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveCounts(false);
  }, [userCacheKey]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveCounts(true);
  };

  // Master Feature Cards (Super Admin's primary duty is Company Tenant Provisioning & Management)
  const ADMIN_FEATURES = [
    {
      id: 'company_list',
      title: 'Company Directory',
      subtitle: `${companiesCount} Active`,
      icon: 'briefcase',
      bgColor: '#EDE9FE',
      iconColor: '#7C3AED',
      badgeColor: '#6D28D9',
      screen: 'CompanyList',
    },
    {
      id: 'add_company',
      title: 'Add Company',
      subtitle: '+ New Tenant',
      icon: 'building',
      bgColor: '#E0F2FE',
      iconColor: '#0284C7',
      badgeColor: '#0369A1',
      screen: 'AddCompany',
    },
  ];

  return (
    <AppScreenContainer
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#0F172A', '#0F766E']}
          tintColor="#0F172A"
          progressBackgroundColor="#FFFFFF"
        />
      }
      contentContainerStyle={[styles.container, { paddingBottom: bottomInset + 30 }]}
      backgroundColor={colors.background}
    >
      {/* Header Bar - Exactly same clean UI as Global Unified Dashboard */}
        <View style={styles.headerBar}>
          <View style={styles.headerProfileGroup}>
            <View style={[styles.avatarCircle, { backgroundColor: '#0F172A' }]}>
              <Text style={styles.avatarInitials}>
                {(currentUser?.name || currentUser?.username || 'SA')
                  .trim()
                  .substring(0, 2)
                  .toUpperCase()}
              </Text>
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.greetingTitle} numberOfLines={1}>
                {currentUser?.name || currentUser?.username || 'Super Administrator'}
              </Text>
              <Text style={styles.greetingSubtitle} numberOfLines={1}>
                {currentUser?.username
                  ? `${currentUser.username}${currentUser?.designation ? ` • ${currentUser.designation}` : ''}`
                  : 'NG GLOBAL Enterprise Control'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => setLogoutModalVisible(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AppIcon name="logout" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Live Enterprise Overview (Read-Only Status Cards) */}
        <Text style={styles.sectionHeaderTitle}>ENTERPRISE OVERVIEW</Text>
        <View style={styles.kpiGrid}>
          {/* 1. Total Units */}
          <View style={styles.kpiTile}>
            <View style={styles.kpiTop}>
              <Text style={styles.kpiLabel} numberOfLines={1} adjustsFontSizeToFit>Units</Text>
              <View style={[styles.kpiIconDot, { backgroundColor: '#CCFBF1' }]}>
                <AppIcon name="location" size={14} color="#0F766E" />
              </View>
            </View>
            <Text style={styles.kpiValue}>{loading ? '...' : unitsCount}</Text>
            <Text style={styles.kpiSubtext} numberOfLines={1}>Geofence Units</Text>
          </View>

          {/* 2. Total Staff */}
          <View style={styles.kpiTile}>
            <View style={styles.kpiTop}>
              <Text style={styles.kpiLabel} numberOfLines={1} adjustsFontSizeToFit>Staff</Text>
              <View style={[styles.kpiIconDot, { backgroundColor: '#FCE7F3' }]}>
                <AppIcon name="person" size={14} color="#DB2777" />
              </View>
            </View>
            <Text style={styles.kpiValue}>{loading ? '...' : usersCount}</Text>
            <Text style={styles.kpiSubtext} numberOfLines={1}>Active Workforce</Text>
          </View>

          {/* 3. Total Roles */}
          <View style={styles.kpiTile}>
            <View style={styles.kpiTop}>
              <Text style={styles.kpiLabel} numberOfLines={1} adjustsFontSizeToFit>Roles</Text>
              <View style={[styles.kpiIconDot, { backgroundColor: '#FEF3C7' }]}>
                <AppIcon name="shield" size={14} color="#D97706" />
              </View>
            </View>
            <Text style={styles.kpiValue}>{loading ? '...' : rolesCount}</Text>
            <Text style={styles.kpiSubtext} numberOfLines={1}>Designations</Text>
          </View>

          {/* 4. Total Companies */}
          <View style={styles.kpiTile}>
            <View style={styles.kpiTop}>
              <Text style={styles.kpiLabel} numberOfLines={1} adjustsFontSizeToFit>Companies</Text>
              <View style={[styles.kpiIconDot, { backgroundColor: '#E0F2FE' }]}>
                <AppIcon name="building" size={14} color="#0284C7" />
              </View>
            </View>
            <Text style={styles.kpiValue}>{loading ? '...' : companiesCount}</Text>
            <Text style={styles.kpiSubtext} numberOfLines={1}>Registered Entities</Text>
          </View>
        </View>

        {/* 3-COLUMN FEATURE CARDS GRID (EXACT SAME AS STAFF DASHBOARD) */}
        <Text style={styles.sectionHeaderTitle}>QUICK FEATURES & SERVICES</Text>
        <View style={styles.cardsGrid}>
          {ADMIN_FEATURES.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.featureCard}
              activeOpacity={0.75}
              onPress={() => navigate(item.screen as any)}
            >
              <View style={[styles.cardIconWrap, { backgroundColor: item.bgColor }]}>
                <AppIcon name={item.icon as any} size={20} color={item.iconColor} />
              </View>
              <Text
                style={styles.cardTitle}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {item.title}
              </Text>
              <Text
                style={[styles.cardBadgeValue, { color: item.badgeColor }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {item.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

      {/* Logout Confirmation Alert Modal */}
      <CustomAlertModal
        visible={logoutModalVisible}
        type="warning"
        title="Sign Out"
        message="Are you sure you want to disconnect from your Super Admin session?"
        buttons={[
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: () => {
              setLogoutModalVisible(false);
              logout();
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setLogoutModalVisible(false),
          },
        ]}
        onClose={() => setLogoutModalVisible(false)}
      />
    </AppScreenContainer>
  );
};

