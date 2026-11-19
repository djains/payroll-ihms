import { NativeModules, NativeEventEmitter, Platform, Linking } from 'react-native';
import { useUpdateStore, UpdateInfo } from '../store/updateStore';
import { showToast } from '../store/toastStore';

const { InAppUpdateModule } = NativeModules;
let eventSubscriptionInitialized = false;

/**
 * Initializes listeners for flexible update progress & completion events.
 */
const initUpdateEventListeners = () => {
  if (eventSubscriptionInitialized || !InAppUpdateModule || Platform.OS !== 'android') {
    return;
  }
  eventSubscriptionInitialized = true;

  try {
    const eventEmitter = new NativeEventEmitter(InAppUpdateModule);

    // Download progress listener
    eventEmitter.addListener('onUpdateProgress', (event: any) => {
      const bytes = event.bytesDownloaded || 0;
      const total = event.totalBytesToDownload || 1;
      const percent = Math.min(100, Math.round((bytes / total) * 100));
      useUpdateStore.getState().setDownloading(true, percent);
    });

    // Download completed listener
    eventEmitter.addListener('onUpdateDownloaded', () => {
      useUpdateStore.getState().setDownloaded(true);
      showToast({
        type: 'info',
        title: 'Update Downloaded',
        message: 'Tap Restart in the update banner to finish installing.',
        duration: 5000,
      });
    });
  } catch (err) {
    console.warn('[InAppUpdates] Event listener initialization notice:', err);
  }
};

/**
 * Checks Google Play Store for an in-app update.
 * If available, pops up the custom in-app update modal.
 */
export const checkForInAppUpdate = async (autoShowModal = true): Promise<UpdateInfo | null> => {
  if (Platform.OS !== 'android' || !InAppUpdateModule) {
    return null;
  }

  initUpdateEventListeners();

  try {
    const result: UpdateInfo = await InAppUpdateModule.checkNeedsUpdate();

    if (result && result.shouldUpdate) {
      console.log(
        `[InAppUpdates] Update available from Play Store. Current: ${result.currentVersionName} (${result.currentVersionCode}) -> Store: ${result.availableVersionCode}`
      );

      if (autoShowModal) {
        useUpdateStore.getState().showModal(result);
      }
      return result;
    } else {
      console.log('[InAppUpdates] App is currently up-to-date.');
      return null;
    }
  } catch (error: any) {
    // Normal in debug mode, emulators without Google Play, or sideloaded builds
    console.log('[InAppUpdates] Check skipped (non-PlayStore install or no connection):', error?.message || error);
    return null;
  }
};

/**
 * Directs user to Google Play Store listing page as a guaranteed fallback.
 */
export const openPlayStore = async (packageName = 'com.ngglobal'): Promise<void> => {
  const marketUrl = `market://details?id=${packageName}`;
  const webUrl = `https://play.google.com/store/apps/details?id=${packageName}`;

  try {
    const canOpen = await Linking.canOpenURL(marketUrl);
    if (canOpen) {
      await Linking.openURL(marketUrl);
    } else {
      await Linking.openURL(webUrl);
    }
  } catch {
    await Linking.openURL(webUrl);
  }
};

/**
 * Starts the official Google Play In-App Update flow.
 * If Play Store rejects the flow (e.g. non-Play Store install), seamlessly redirects to Play Store URL.
 */
export const startInAppUpdate = async (preferImmediate = false): Promise<void> => {
  if (Platform.OS !== 'android' || !InAppUpdateModule) {
    return openPlayStore();
  }

  const { updateInfo, hideModal, setDownloading } = useUpdateStore.getState();
  const pkgName = updateInfo?.packageName || 'com.ngglobal';

  const updateType =
    preferImmediate || (updateInfo && !updateInfo.isFlexibleAllowed)
      ? 'IMMEDIATE'
      : 'FLEXIBLE';

  try {
    if (updateType === 'FLEXIBLE') {
      setDownloading(true, 0);
    }
    hideModal();

    await InAppUpdateModule.startUpdate(updateType);
  } catch (error: any) {
    console.warn('[InAppUpdates] startUpdate in-app flow failed, falling back to Play Store app page:', error?.message || error);
    // Guaranteed fallback: open Play Store directly
    await openPlayStore(pkgName);
  }
};

/**
 * Restarts the app and finishes installing the downloaded flexible update.
 */
export const completeInAppUpdate = async (): Promise<void> => {
  if (Platform.OS !== 'android' || !InAppUpdateModule) return;

  try {
    await InAppUpdateModule.completeUpdate();
  } catch (e: any) {
    console.warn('[InAppUpdates] completeUpdate error:', e?.message || e);
  }
};
