import { create } from './createStore';
import * as Keychain from 'react-native-keychain';
import {
  checkAppPermissions,
  requestAppPermissions,
  AppPermissionStatus,
} from '../services/permission.service';

const PERMISSION_PROMPT_SEEN_KEY = 'ihms_permission_prompt_seen';

interface PermissionStoreState {
  isModalVisible: boolean;
  status: AppPermissionStatus | null;
  isChecking: boolean;
  hasPromptBeenSeen: boolean;

  // Actions
  checkPermissions: (force?: boolean) => Promise<boolean>;
  requestPermissions: () => Promise<boolean>;
  hideModal: () => void;
  markAsSeen: () => Promise<void>;
  resetSeenFlag: () => Promise<void>;
}

export const usePermissionStore = create<PermissionStoreState>((set, get) => ({
  isModalVisible: false,
  status: null,
  isChecking: false,
  hasPromptBeenSeen: false,

  checkPermissions: async (force = false) => {
    set({ isChecking: true });
    try {
      const status = await checkAppPermissions();

      // If all permissions are already granted, don't show modal
      if (status.allGranted) {
        set({ status, isChecking: false, isModalVisible: false });
        return true;
      }

      // Check if user has already seen and interacted with the permission prompt
      if (!force) {
        try {
          const creds = await Keychain.getGenericPassword({
            service: PERMISSION_PROMPT_SEEN_KEY,
          });
          if (creds && creds.password === 'true') {
            set({
              status,
              isChecking: false,
              isModalVisible: false,
              hasPromptBeenSeen: true,
            });
            return false;
          }
        } catch (e) {
          console.warn('[PermissionStore] Error reading seen flag:', e);
        }
      }

      // Show modal for the first time after login
      set({
        status,
        isChecking: false,
        isModalVisible: true,
      });
      return false;
    } catch (e) {
      console.warn('[PermissionStore] checkPermissions error:', e);
      set({ isChecking: false, isModalVisible: false });
      return false;
    }
  },

  requestPermissions: async () => {
    try {
      const updatedStatus = await requestAppPermissions();
      // Permanently mark as seen so it never prompts again
      await get().markAsSeen();
      // Automatically dismiss modal so user continues directly to their dashboard
      set({
        status: updatedStatus,
        isModalVisible: false,
      });
      return updatedStatus.allGranted;
    } catch (e) {
      console.warn('[PermissionStore] requestPermissions error:', e);
      set({ isModalVisible: false });
      return false;
    }
  },

  markAsSeen: async () => {
    try {
      await Keychain.setGenericPassword('seen', 'true', {
        service: PERMISSION_PROMPT_SEEN_KEY,
      });
      set({ hasPromptBeenSeen: true });
    } catch (e) {
      console.warn('[PermissionStore] Error saving seen flag:', e);
    }
  },

  resetSeenFlag: async () => {
    try {
      await Keychain.resetGenericPassword({
        service: PERMISSION_PROMPT_SEEN_KEY,
      });
      set({ hasPromptBeenSeen: false });
    } catch (e) {
      console.warn('[PermissionStore] Error resetting seen flag:', e);
    }
  },

  hideModal: () => {
    // When dismissed, also mark as seen so it doesn't prompt again
    get().markAsSeen();
    set({ isModalVisible: false });
  },
}));
