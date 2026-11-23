import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { styles } from './AppHeader.styles';
import { AppIcon } from './AppIcon';
import { useNotificationStore } from '../../store/notificationStore';
import { useNavigation } from '../../navigation';
import { colors } from '../../theme/colors';

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightActionIcon?: string;
  onRightAction?: () => void;
  rightComponent?: React.ReactNode;
  showNotificationBell?: boolean;
  showTermsIcon?: boolean;
  style?: ViewStyle;
  transparent?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightActionIcon,
  onRightAction,
  rightComponent,
  showNotificationBell = false,
  showTermsIcon = false,
  style,
  transparent = false,
}) => {
  const { unreadCount } = useNotificationStore();
  const { navigate } = useNavigation();

  return (
    <View
      style={[
        styles.container,
        transparent && { backgroundColor: 'transparent', borderBottomWidth: 0 },
        style,
      ]}
    >
      <View style={styles.leftSection}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <AppIcon name="arrowLeft" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        )}

        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rightSection}>
        {showTermsIcon && (
          <TouchableOpacity
            onPress={() => navigate('TermsAndConditions')}
            style={styles.bellButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Terms and Conditions"
          >
            <AppIcon name="file-text" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        {showNotificationBell && (
          <TouchableOpacity
            onPress={() => navigate('Notifications')}
            style={styles.bellButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Notifications"
          >
            <AppIcon name="bell" size={19} color={colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        {rightComponent}
        {rightActionIcon && onRightAction && (
          <TouchableOpacity
            onPress={onRightAction}
            style={styles.actionButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <AppIcon name={rightActionIcon} size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
