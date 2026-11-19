import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './HomeScreen.styles';
import { AppScreenContainer, AppIcon } from '../../components/common';
import { DynamicFeatureGrid } from '../../components/shared/DynamicFeatureGrid';
import { useAuthStore } from '../../store/authStore';
import { useTenantStore } from '../../store/tenantStore';
import { useNavigation } from '../../navigation/navigationContext';
import { useResponsive } from '../../theme/responsive';

export const HomeScreen: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { currentCompany } = useTenantStore();
  const { navigate } = useNavigation();
  const { maxContentWidth, isTablet } = useResponsive();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16);

  return (
    <AppScreenContainer
      scrollable
      contentContainerStyle={[styles.container, { paddingBottom: bottomInset + 100 }]}
      backgroundColor="#FAF8F2"
    >
      <View style={[styles.contentWrapper, isTablet && { maxWidth: maxContentWidth }]}>
        
        {/* Active Tenant & Role Indicator with Instant Admin Console Access */}
        <View style={styles.adminPreviewBanner}>
          <View style={styles.adminPreviewLeft}>
            <Text style={styles.adminPreviewDot}>🏢</Text>
            <Text style={styles.adminPreviewText} numberOfLines={1}>
              <Text style={styles.adminPreviewCompany}>{currentCompany?.name || currentUser?.companyId || ''}</Text> • {currentUser?.designation || ''}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.adminExitBtn}
            activeOpacity={0.8}
            onPress={() => navigate('CompanyList')}
          >
            <Text style={styles.adminExitBtnText}>Admin Console</Text>
          </TouchableOpacity>
        </View>

        {/* Top Bar (Exact Match: Notification Badge on Left, Profile on Right) */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconCircle}
            activeOpacity={0.7}
            onPress={() => navigate('DocumentStatus')}
          >
            <AppIcon name="bell" size={20} color="#111827" />
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconCircle}
            activeOpacity={0.7}
            onPress={() => navigate('ProfileTab')}
          >
            <AppIcon name="person" size={22} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Hero Cash / Balance Section (Exact Match to Screenshot) */}
        <View style={styles.heroSection}>
          <View style={styles.cashPill}>
            <View style={styles.cashDot}>
              <Text style={styles.cashDotText}>₹</Text>
            </View>
            <Text style={styles.cashLabel}>PAYROLL CASH</Text>
          </View>

          <Text style={styles.heroAmount}>₹0.00</Text>

          <TouchableOpacity
            style={styles.accountLink}
            activeOpacity={0.7}
            onPress={() => navigate('SalarySlip')}
          >
            <Text style={styles.accountLinkText}>Salary Slip & Breakdown</Text>
            <AppIcon name="chevronRight" size={14} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* 3 Pastel Squircle Quick Action Cards (Exact Match to Screenshot Row) */}
        <View style={styles.actionRow}>
          {/* Pastel Mint: Punch In */}
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#CEECE6' }]}
            activeOpacity={0.75}
            onPress={() => navigate('GeofencePunch')}
          >
            <View style={styles.actionCardTop}>
              <AppIcon name="arrow-down-left" size={22} color="#111827" />
            </View>
            <Text style={styles.actionCardLabel}>Punch In</Text>
          </TouchableOpacity>

          {/* Pastel Butter Yellow: Punch Out */}
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#FDF1C8' }]}
            activeOpacity={0.75}
            onPress={() => navigate('GeofencePunch')}
          >
            <View style={styles.actionCardTop}>
              <AppIcon name="arrow-up-right" size={22} color="#111827" />
            </View>
            <Text style={styles.actionCardLabel}>Punch Out</Text>
          </TouchableOpacity>

          {/* Pastel Peach: Leave / Swap */}
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#FCDDC7' }]}
            activeOpacity={0.75}
            onPress={() => navigate('LeaveApply')}
          >
            <View style={styles.actionCardTop}>
              <AppIcon name="swap" size={20} color="#111827" />
            </View>
            <Text style={styles.actionCardLabel}>Leave Apply</Text>
          </TouchableOpacity>
        </View>

        {/* Section Header (Exact Match: Icon + Title on Left, Subtext on Right) */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleGroup}>
            <View style={styles.sectionIconBadge}>
              <Text style={styles.sectionIconText}>⚡</Text>
            </View>
            <Text style={styles.sectionTitle}>MY WORKFORCE</Text>
          </View>
          <Text style={styles.sectionRightMeta}>Shift: {(currentUser as any)?.shiftTime || 'Not Set'}</Text>
        </View>

        {/* 2-Column Metric Cards (Exact Match to Wallet & Rewards in Screenshot) */}
        <View style={styles.twoColumnGrid}>
          {/* Card 1: Attendance Days */}
          <TouchableOpacity
            style={styles.metricCard}
            activeOpacity={0.8}
            onPress={() => navigate('MonthlyCalendar')}
          >
            <View style={styles.metricCardHeader}>
              <Text style={styles.metricCardTitle}>Attendance</Text>
              <AppIcon name="calendar" size={18} color="#111827" />
            </View>
            <Text style={styles.metricCardValue}>
              0 <Text style={styles.metricCardUnit}>DAYS</Text>
            </Text>
            <Text style={styles.metricCardSubtext}>Live Monthly Record</Text>
          </TouchableOpacity>

          {/* Card 2: Overtime & Duty */}
          <TouchableOpacity
            style={styles.metricCard}
            activeOpacity={0.8}
            onPress={() => navigate('SalarySlip')}
          >
            <View style={styles.metricCardHeader}>
              <Text style={styles.metricCardTitle}>Overtime</Text>
              <AppIcon name="document" size={18} color="#111827" />
            </View>
            <Text style={styles.metricCardValue}>
              0.0 <Text style={styles.metricCardUnit}>HRS</Text>
            </Text>
            <Text style={styles.metricCardSubtext}>Earned ₹0.00</Text>
          </TouchableOpacity>
        </View>

        {/* Promo / Info Banner (Exact Match to Boosted Gift Cards in Screenshot) */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerHeaderRow}>
              <AppIcon name="location" size={18} color="#111827" />
              <Text style={styles.bannerBadgeText}>{currentUser?.branchOrUnit || 'Unit Not Assigned'}</Text>
            </View>
            <Text style={styles.bannerTitle}>Geo-Attendance Active</Text>
            <Text style={styles.bannerDesc}>
              Location verified within designated radius. Tap to view geofence.
            </Text>
            <TouchableOpacity
              style={styles.bannerLinkRow}
              activeOpacity={0.7}
              onPress={() => navigate('GeofencePunch')}
            >
              <Text style={styles.bannerLinkText}>View Live Geofence</Text>
              <AppIcon name="chevronRight" size={12} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Operations & Modules */}
        <DynamicFeatureGrid />

      </View>
    </AppScreenContainer>
  );
};
