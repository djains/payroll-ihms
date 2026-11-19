import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './FeatureSwitchboardScreen.styles';
import {
  AppScreenContainer,
  AppIcon,
} from '../../../components/common';
import { useSuperAdminStore } from '../../../store/superAdminStore';
import { useTenantStore } from '../../../store/tenantStore';
import { useNavigation, useRoute } from '../../../navigation/navigationContext';
import {
  FeatureCategory,
  FeatureDefinition,
} from '../../../types/models';
import { showToast } from '../../../store/toastStore';

const MASTER_FEATURES_CATALOG: FeatureDefinition[] = [];

const CATEGORY_META: Record<FeatureCategory, { label: string; icon: string; bg: string }> = {
  AUTH: { label: 'Auth & Security', icon: 'lock', bg: '#FCDDC7' },
  ATTENDANCE: { label: 'Attendance', icon: 'fingerprint', bg: '#CEECE6' },
  PAYROLL: { label: 'Payroll & Slips', icon: 'calendar', bg: '#FDF1C8' },
  KYC: { label: 'KYC Dossier', icon: 'audit', bg: '#E0E7FF' },
  LEAVE_CLAIMS: { label: 'Leaves & Claims', icon: 'audit', bg: '#FEE2E2' },
  SECURITY: { label: 'Security & Audits', icon: 'shield', bg: '#D1FAE5' },
  HOUSEKEEPING: { label: 'Housekeeping', icon: 'cleaning', bg: '#E0F2FE' },
  RECRUITMENT: { label: 'Recruitment', icon: 'people', bg: '#FEF3C7' },
  INSURANCE: { label: 'VIN Insurance', icon: 'car', bg: '#CCFBF1' },
};

export const FeatureSwitchboardScreen: React.FC = () => {
  const { params } = useRoute();
  const {
    companies,
    toggleCompanyFeature,
    setAllCompanyFeatures,
    selectedCompanyId,
    setSelectedCompanyId,
  } = useSuperAdminStore();
  const { refreshTenant } = useTenantStore();
  const { goBack } = useNavigation();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16);

  const [selectedCategory, setSelectedCategory] = useState<FeatureCategory | 'ALL'>('ALL');

  const activeCompanyId = params?.companyId || selectedCompanyId || companies[0]?.id;
  const company = companies.find((c) => c.id === activeCompanyId) || companies[0];

  const enabledSet = useMemo(() => {
    return new Set(company?.enabledFeatureIds || []);
  }, [company?.enabledFeatureIds]);

  const filteredFeatures = useMemo(() => {
    if (selectedCategory === 'ALL') return MASTER_FEATURES_CATALOG;
    return MASTER_FEATURES_CATALOG.filter((f) => f.category === selectedCategory);
  }, [selectedCategory]);

  const handleToggle = (featureId: string, enabled: boolean) => {
    if (!company) return;
    toggleCompanyFeature(company.id, featureId, enabled);
    refreshTenant();
  };

  const handleEnableAll = () => {
    if (!company) return;
    const allIds = MASTER_FEATURES_CATALOG.map((f) => f.id);
    setAllCompanyFeatures(company.id, allIds);
    refreshTenant();
  };

  const handleDisableAll = () => {
    if (!company) return;
    // Keep core auth features enabled
    const coreIds = ['FT_DEVICE_BINDING', 'FT_PASSWORD_RECOVERY'];
    setAllCompanyFeatures(company.id, coreIds);
    refreshTenant();
  };

  const handleSave = () => {
    refreshTenant();
    showToast({
      type: 'success',
      title: 'Configuration Saved',
      message: `Updated features for ${company?.name}.`,
    });
    goBack();
  };

  if (!company) {
    return null;
  }

  const enabledCount = enabledSet.size;
  const totalCount = MASTER_FEATURES_CATALOG.length;

  return (
    <AppScreenContainer edges={['top']} style={styles.container} backgroundColor="#FAF8F2">
      {/* Top Header Bar (Matching Dynamic Roles Header) */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={goBack}
        >
          <AppIcon name="chevronLeft" size={18} color="#111827" />
        </TouchableOpacity>

        <View style={styles.headerTitles}>
          <Text style={styles.headerMainTitle}>Dynamic Feature Control</Text>
          <Text style={styles.headerSub}>{company.name}</Text>
        </View>

        <View style={styles.companyBadge}>
          <Text style={styles.companyBadgeText}>{company.code}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Company Selector Horizontal Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.companyTabsScroll}
          contentContainerStyle={styles.companyTabsContainer}
        >
          {companies.map((c) => {
            const isSelected = c.id === company.id;
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => setSelectedCompanyId(c.id)}
                style={[styles.companyTabPill, isSelected && styles.companyTabPillActive]}
                activeOpacity={0.7}
              >
                <View style={[styles.companyTabDot, { backgroundColor: c.brandColor }]} />
                <Text style={[styles.companyTabText, isSelected && styles.companyTabTextActive]}>
                  {c.code}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Hero Feature Summary Card (Identical to Roles Summary Card) */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryDot}>⚡</Text>
            <Text style={styles.summaryLabel}>TENANT MODULES MATRIX</Text>
          </View>

          <Text style={styles.heroAmount}>
            {enabledCount < 10 ? `0${enabledCount}` : enabledCount}{' '}
            <Text style={styles.heroUnit}>/ {totalCount} MODULES ACTIVE</Text>
          </Text>

          <Text style={styles.summaryDesc}>
            Enable or deactivate individual features for this enterprise. Disabled features are instantly hidden from mobile views.
          </Text>

          {/* Quick Batch Actions */}
          <View style={styles.batchActionsRow}>
            <TouchableOpacity
              style={styles.batchBtn}
              activeOpacity={0.75}
              onPress={handleEnableAll}
            >
              <Text style={styles.batchBtnText}>Enable All ({totalCount})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.batchBtn}
              activeOpacity={0.75}
              onPress={handleDisableAll}
            >
              <Text style={styles.batchBtnText}>Reset to Core Only</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Filter Horizontal Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryTabsScroll}
          contentContainerStyle={styles.categoryTabsContainer}
        >
          <TouchableOpacity
            style={[
              styles.categoryFilterPill,
              selectedCategory === 'ALL' && styles.categoryFilterPillActive,
            ]}
            onPress={() => setSelectedCategory('ALL')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.categoryFilterText,
                selectedCategory === 'ALL' && styles.categoryFilterTextActive,
              ]}
            >
              All ({MASTER_FEATURES_CATALOG.length})
            </Text>
          </TouchableOpacity>

          {(Object.keys(CATEGORY_META) as FeatureCategory[]).map((cat) => {
            const isSelected = selectedCategory === cat;
            const meta = CATEGORY_META[cat];
            const catCount = MASTER_FEATURES_CATALOG.filter((f) => f.category === cat).length;

            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryFilterPill, isSelected && styles.categoryFilterPillActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryFilterText,
                    isSelected && styles.categoryFilterTextActive,
                  ]}
                >
                  {meta.label} ({catCount})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'ALL'
              ? 'ALL ENTERPRISE FEATURES'
              : `${CATEGORY_META[selectedCategory]?.label.toUpperCase()} FEATURES`}
          </Text>
          <Text style={styles.sectionMeta}>
            {filteredFeatures.filter((f) => enabledSet.has(f.id)).length} of {filteredFeatures.length} Active
          </Text>
        </View>

        {/* Feature Cards (Identical Structure to Role Cards) */}
        {filteredFeatures.map((feature) => {
          const isEnabled = enabledSet.has(feature.id);
          const meta = CATEGORY_META[feature.category] || {
            label: feature.category,
            icon: 'filter',
            bg: '#CEECE6',
          };

          return (
            <View
              key={feature.id}
              style={[styles.featureCard, isEnabled && styles.featureCardActive]}
            >
              <View style={styles.featureCardTop}>
                {/* Feature Icon Squircle */}
                <View style={[styles.featureIconSquircle, { backgroundColor: meta.bg }]}>
                  <AppIcon name={meta.icon} size={20} color="#111827" />
                </View>

                {/* Feature Info */}
                <View style={styles.featureInfo}>
                  <View style={styles.featureNameRow}>
                    <Text style={styles.featureName} numberOfLines={1}>
                      {feature.name}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        isEnabled ? styles.badgeActive : styles.badgeInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          isEnabled ? styles.statusTextActive : styles.statusTextInactive,
                        ]}
                      >
                        {isEnabled ? 'Active' : 'Disabled'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.featureDesc} numberOfLines={2}>
                    {feature.description}
                  </Text>
                </View>
              </View>

              {/* Bottom Row */}
              <View style={styles.featureCardBottom}>
                <View style={styles.categoryBadgePill}>
                  <Text style={styles.categoryBadgeText}>{meta.label}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    isEnabled ? styles.toggleBtnActive : styles.toggleBtnInactive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleToggle(feature.id, !isEnabled)}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      isEnabled ? styles.toggleTextActive : styles.toggleTextInactive,
                    ]}
                  >
                    {isEnabled ? 'Deactivate Feature' : 'Enable Feature'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Sticky Bottom Save Bar */}
      <View style={[styles.stickySaveBar, { paddingBottom: bottomInset + 8 }]}>
        <TouchableOpacity
          style={styles.saveBtn}
          activeOpacity={0.8}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>
            Save Configuration ({enabledCount} Active)
          </Text>
        </TouchableOpacity>
      </View>
    </AppScreenContainer>
  );
};
