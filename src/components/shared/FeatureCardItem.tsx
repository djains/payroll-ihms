import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './FeatureCardItem.styles';
import { AppIcon } from '../common/AppIcon';
import { FeatureDefinition } from '../../types/models';
import { colors } from '../../theme/colors';

export interface FeatureCardItemProps {
  feature: FeatureDefinition;
  onPress: () => void;
  brandColor?: string;
  isGrid?: boolean;
}

export const FeatureCardItem: React.FC<FeatureCardItemProps> = ({
  feature,
  onPress,
  brandColor = colors.primary,
  isGrid = false,
}) => {
  if (isGrid) {
    return (
      <TouchableOpacity
        activeOpacity={0.72}
        onPress={onPress}
        style={[styles.gridCard, { borderTopColor: brandColor }]}
      >
        <View style={styles.gridTopRow}>
          <View style={[styles.gridIconBox, { backgroundColor: colors.surfaceVariant }]}>
            <AppIcon name={feature.icon} size={22} color={brandColor} />
          </View>
          <View style={styles.gridChevron}>
            <AppIcon name="chevronRight" size={14} color={colors.textMuted} />
          </View>
        </View>

        <Text style={styles.gridTitle} numberOfLines={2}>
          {feature.name}
        </Text>

        <Text style={styles.gridDescription} numberOfLines={2}>
          {feature.description}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.72}
      onPress={onPress}
      style={styles.card}
    >
      <View style={[styles.iconBox, { backgroundColor: colors.surfaceVariant }]}>
        <AppIcon name={feature.icon} size={22} color={brandColor} />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {feature.name}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {feature.description}
        </Text>
      </View>

      <View style={styles.arrowContainer}>
        <AppIcon name="chevronRight" size={16} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
};
