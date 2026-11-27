import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './DynamicFeatureGrid.styles';
import { FeatureCardItem } from './FeatureCardItem';
import { useTenantStore } from '../../store/tenantStore';
import { useNavigation } from '../../navigation/navigationContext';
import { ScreenName } from '../../navigation/types';
import { FeatureDefinition } from '../../types/models';
import { useResponsive } from '../../theme/responsive';

export const DynamicFeatureGrid: React.FC = () => {
  const { activeFeatures, currentCompany } = useTenantStore();
  const { navigate } = useNavigation();
  const { gridColumns } = useResponsive();

  const handleFeaturePress = (feature: FeatureDefinition) => {
    const screenName = feature.screenName.replace('Screen', '') as ScreenName;
    console.log(`[FEATURE CARD CLICK] 🔘 Tapped: "${feature.name}" (${feature.id}) -> Screen: ${screenName} | API: ${(feature as any).apiEndpoint || 'N/A'}`);
    navigate(screenName);
  };

  if (!activeFeatures || activeFeatures.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No active features configured for your role in this company.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionTitle}>Authorized Operations</Text>
          <Text style={styles.sectionSubtitle}>
            {activeFeatures.length} operational modules enabled for your role
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{activeFeatures.length}</Text>
        </View>
      </View>

      <View style={[styles.gridContainer, gridColumns > 1 && styles.gridMultiColumn]}>
        {activeFeatures.map((feature) => (
          <View
            key={feature.id}
            style={[
              styles.itemWrapper,
              gridColumns === 2 && styles.col2,
              gridColumns === 3 && styles.col3,
              gridColumns >= 4 && styles.col4,
            ]}
          >
            <FeatureCardItem
              feature={feature}
              onPress={() => handleFeaturePress(feature)}
              brandColor={currentCompany?.brandColor}
              isGrid={gridColumns > 1}
            />
          </View>
        ))}
      </View>
    </View>
  );
};
