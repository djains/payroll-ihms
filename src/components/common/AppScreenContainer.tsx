import React from 'react';
import {
  ScrollView,
  View,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  StyleProp,
  StatusBarStyle,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { styles } from './AppScreenContainer.styles';
import { colors } from '../../theme/colors';

export interface AppScreenContainerProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  barStyle?: StatusBarStyle;
  backgroundColor?: string;
  edges?: Edge[];
  withToast?: boolean;
  keyboardVerticalOffset?: number;
  refreshControl?: React.ReactElement;
}

export const AppScreenContainer: React.FC<AppScreenContainerProps> = ({
  children,
  header,
  scrollable = false,
  style,
  contentContainerStyle,
  barStyle = 'dark-content',
  backgroundColor = colors.background,
  edges = ['top', 'left', 'right'],
  withToast = true,
  keyboardVerticalOffset,
  refreshControl,
}) => {
  return (
    <SafeAreaView edges={edges} style={[styles.safeArea, { backgroundColor }, style]}>
      <StatusBar barStyle={barStyle} />

      {/* Flush 100% Full-Width Global Header pinned at top */}
      {header}

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        {scrollable ? (
          <ScrollView
            style={styles.content}
            contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.nonScrollContent, contentContainerStyle]}>
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
