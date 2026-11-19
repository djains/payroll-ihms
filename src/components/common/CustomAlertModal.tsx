import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { AppIcon } from './AppIcon';
import { showToast } from '../../store/toastStore';
import { colors } from '../../theme/colors';
import { ms } from '../../theme/responsive';
import { borderRadius, shadows, spacing } from '../../theme/spacing';
import { fontSizes } from '../../theme/typography';

export interface CustomAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
  icon?: string;
}

export interface CustomAlertModalProps {
  visible: boolean;
  title: string;
  message?: string;
  type?: 'info' | 'warning' | 'success' | 'danger' | 'choose';
  buttons?: CustomAlertButton[];
  onClose?: () => void;
  children?: React.ReactNode;
  verticalButtons?: boolean;
}

export const CustomAlertModal: React.FC<CustomAlertModalProps> = ({
  visible,
  title,
  message,
  type = 'info',
  buttons = [{ text: 'OK' }],
  onClose,
  children,
  verticalButtons,
}) => {
  // If the modal has custom interactive children, a camera/photo picker ('choose'),
  // or is a critical confirmation dialog (e.g. Logout, Delete with 2 buttons where user must confirm/cancel),
  // we render the confirmation Modal.
  // BUT for pure informational / success / warning / error alerts (1 single dismiss button like OK/Done),
  // user explicitly requested: "alert modal mat dikho sirf toast message dikaho".
  // So we trigger a toast and auto-dismiss without showing intrusive modal!
  
  const hasMultipleButtons = buttons && buttons.length > 1;
  const isActionDialog = type === 'choose' || !!children || hasMultipleButtons;
  const hasTriggeredToastRef = useRef<boolean>(false);

  useEffect(() => {
    if (visible && !isActionDialog) {
      if (!hasTriggeredToastRef.current) {
        hasTriggeredToastRef.current = true;
        const toastType =
          type === 'danger' ? 'error' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info';
        
        showToast({
          type: toastType,
          title: title || undefined,
          message: message || title || '',
          duration: 3500,
        });

        // Trigger the confirm/dismiss callback after firing toast
        const dismissBtn = buttons?.[0];
        if (dismissBtn?.onPress) {
          dismissBtn.onPress();
        } else if (onClose) {
          onClose();
        }
      }
    } else if (!visible) {
      hasTriggeredToastRef.current = false;
    }
  }, [visible, isActionDialog, type, title, message, buttons, onClose]);

  // If it's a simple notification alert (not action/interactive dialog), do not render the modal overlay at all!
  if (!isActionDialog) {
    return null;
  }

  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return { name: 'check-circle', color: '#15803D', bg: '#DCFCE7' };
      case 'warning':
        return { name: 'alert-circle', color: '#D97706', bg: '#FEF3C7' };
      case 'danger':
        return { name: 'alert-circle', color: '#DC2626', bg: '#FEE2E2' };
      case 'choose':
        return { name: 'camera', color: '#0F172A', bg: '#F1F5F9' };
      default:
        return { name: 'info', color: '#0F766E', bg: '#F0FDFA' };
    }
  };

  const iconCfg = getIconConfig();
  const isVertical = verticalButtons || type === 'choose' || buttons.length > 2;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.cardContainer}>
              <View style={[styles.iconCircle, { backgroundColor: iconCfg.bg }]}>
                <AppIcon name={iconCfg.name} size={28} color={iconCfg.color} />
              </View>

              <Text style={styles.titleText}>{title}</Text>
              {message ? <Text style={styles.messageText}>{message}</Text> : null}

              {children}

              <View style={[styles.buttonRow, isVertical && styles.buttonColumn]}>
                {buttons.map((btn, idx) => {
                  const isCancel = btn.style === 'cancel';
                  const isDestructive = btn.style === 'destructive';
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.btn,
                        isVertical && styles.btnFullWidth,
                        isCancel && styles.btnCancel,
                        isDestructive && styles.btnDestructive,
                        !isCancel && !isDestructive && styles.btnPrimary,
                      ]}
                      activeOpacity={0.75}
                      onPress={() => {
                        if (btn.onPress) btn.onPress();
                        if (onClose) onClose();
                      }}
                    >
                      {btn.icon ? (
                        <AppIcon
                          name={btn.icon}
                          size={18}
                          color={isCancel ? '#475569' : '#FFFFFF'}
                        />
                      ) : null}
                      <Text
                        style={[
                          styles.btnText,
                          isCancel && styles.btnTextCancel,
                          isDestructive && styles.btnTextDestructive,
                          !isCancel && !isDestructive && styles.btnTextPrimary,
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                      >
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  cardContainer: {
    width: '100%',
    maxWidth: ms(360),
    backgroundColor: '#FFFFFF',
    borderRadius: ms(22),
    paddingHorizontal: spacing.lg,
    paddingTop: ms(24),
    paddingBottom: ms(20),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.lg,
  },
  iconCircle: {
    width: ms(56),
    height: ms(56),
    borderRadius: ms(28),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(14),
  },
  titleText: {
    fontSize: fontSizes.md + 1,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.2,
    marginBottom: ms(6),
  },
  messageText: {
    fontSize: fontSizes.xs + 1,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: ms(19),
    marginBottom: ms(18),
    paddingHorizontal: ms(8),
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    width: '100%',
    marginTop: ms(6),
  },
  buttonColumn: {
    flexDirection: 'column',
    width: '100%',
    gap: ms(10),
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(8),
    paddingVertical: ms(13),
    paddingHorizontal: ms(14),
    borderRadius: ms(12),
  },
  btnFullWidth: {
    flex: 0,
    width: '100%',
  },
  btnPrimary: {
    backgroundColor: '#0F172A',
  },
  btnCancel: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btnDestructive: {
    backgroundColor: '#EF4444',
  },
  btnText: {
    fontSize: fontSizes.xs + 0.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  btnTextPrimary: {
    color: '#FFFFFF',
  },
  btnTextCancel: {
    color: '#475569',
  },
  btnTextDestructive: {
    color: '#FFFFFF',
  },
});

