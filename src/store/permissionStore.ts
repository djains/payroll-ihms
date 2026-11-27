import { create } from './createStore';
import * as Keychain from 'react-native-keychain';
import {
  checkAppPermissions,
  requestAppPermissions,
  checkBackgroundLocationPermission,
  requestBackgroundLocationPermission,
  AppPermissionStatus,
} from '../services/permission.service';

const PERMISSION_PROMPT_SEEN_KEY = 'ihms_permission_prompt_seen';

interface PermissionStoreState {
  isModalVisible: boolean;
  status: AppPermissionStatus | null;
  isChecking: boolean;
  hasPromptBeenSeen: boolean;

  // Background Location Specific State
  isBackgroundModalVisible: boolean;
  isBackgroundGranted: boolean;

  // Actions
  checkPermissions: (force?: boolean) => Promise<boolean>;
  requestPermissions: () => Promise<boolean>;
  showModal: () => void;
  hideModal: () => void;
  markAsSeen: () => Promise<void>;
  resetSeenFlag: () => Promise<void>;

  // Background Location Actions (unified with main modal)
  showBackgroundModal: () => void;
  hideBackgroundModal: () => void;
  checkBackgroundPermission: () => Promise<boolean>;
  requestBackgroundPermission: () => Promise<boolean>;
}

export const usePermissionStore = create<PermissionStoreState>((set, get) => ({
  isModalVisible: false,
  status: null,
  isChecking: false,
  hasPromptBeenSeen: false,
  isBackgroundModalVisible: false,
  isBackgroundGranted: false,

  checkPermissions: async (force = false) => {
    set({ isChecking: true });
    try {
      const status = await checkAppPermissions();
      const bgGranted = await checkBackgroundLocationPermission();

      // Compulsory permissions: Location & Camera (strictly mandatory for geofenced attendance & live selfie verification)
      const hasCompulsory = status.location && status.camera;

      if (hasCompulsory) {
        // All compulsory permissions are granted
        set({ status, isBackgroundGranted: bgGranted, isChecking: false, isModalVisible: false });
        return true;
      }

      // If compulsory permissions are NOT granted, ALWAYS show modal until user grants them!
      set({
        status,
        isBackgroundGranted: bgGranted,
        isChecking: false,
        isModalVisible: true,
      });
      return false;
    } catch (e) {
      console.warn('[PermissionStore] checkPermissions error:', e);
      set({ isChecking: false });
      return false;
    }
  },

  requestPermissions: async () => {
    try {
      const updatedStatus = await requestAppPermissions();
      const bgGranted = await checkBackgroundLocationPermission();
      const hasCompulsory = updatedStatus.location && updatedStatus.camera;

      if (hasCompulsory) {
        await get().markAsSeen();
        set({
          status: updatedStatus,
          isBackgroundGranted: bgGranted,
          isModalVisible: false,
        });
        return true;
      } else {
        // Compulsory permissions are still missing -> keep modal open so user can allow or open settings
        set({
          status: updatedStatus,
          isBackgroundGranted: bgGranted,
          isModalVisible: true,
        });
        return false;
      }
    } catch (e) {
      console.warn('[PermissionStore] requestPermissions error:', e);
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

  showModal: () => set({ isModalVisible: true }),

  hideModal: () => {
    const { status } = get();
    // Modal can only be dismissed if compulsory permissions are granted
    if (status?.location && status?.camera) {
      set({ isModalVisible: false });
    }
  },

  // Backward-compatible unified trigger
  showBackgroundModal: () => set({ isModalVisible: true }),
  hideBackgroundModal: () => set({ isModalVisible: false }),

  checkBackgroundPermission: async () => {
    const granted = await checkBackgroundLocationPermission();
    set({ isBackgroundGranted: granted });
    return granted;
  },

  requestBackgroundPermission: async () => {
    const granted = await requestBackgroundLocationPermission();
    set({ isBackgroundGranted: granted });
    return granted;
  },
}));
