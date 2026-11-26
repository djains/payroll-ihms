import { Platform, PermissionsAndroid, Linking } from 'react-native';

export interface AppPermissionStatus {
  location: boolean;
  camera: boolean;
  notifications: boolean;
  allGranted: boolean;
}

/**
 * Checks all core permissions required by NG GLOBAL.
 */
export async function checkAppPermissions(): Promise<AppPermissionStatus> {
  if (Platform.OS !== 'android') {
    return {
      location: true,
      camera: true,
      notifications: true,
      allGranted: true,
    };
  }

  try {
    const fineLocation = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    const coarseLocation = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
    );
    const camera = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.CAMERA
    );

    let notifications = true;
    if (typeof Platform.Version === 'number' && Platform.Version >= 33) {
      notifications = await PermissionsAndroid.check(
        'android.permission.POST_NOTIFICATIONS' as any
      );
    }

    const locationGranted = fineLocation || coarseLocation;
    const allGranted = locationGranted && camera && notifications;

    return {
      location: locationGranted,
      camera,
      notifications,
      allGranted,
    };
  } catch (error) {
    console.warn('[PermissionService] Error checking permissions:', error);
    return {
      location: false,
      camera: false,
      notifications: false,
      allGranted: false,
    };
  }
}

/**
 * Requests all missing core permissions with system prompt.
 */
export async function requestAppPermissions(): Promise<AppPermissionStatus> {
  if (Platform.OS !== 'android') {
    return {
      location: true,
      camera: true,
      notifications: true,
      allGranted: true,
    };
  }

  try {
    const permsToRequest: any[] = [
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      PermissionsAndroid.PERMISSIONS.CAMERA,
    ];

    if (typeof Platform.Version === 'number' && Platform.Version >= 33) {
      permsToRequest.push('android.permission.POST_NOTIFICATIONS');
    }

    const results = await PermissionsAndroid.requestMultiple(permsToRequest);

    const fineGranted =
      results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
      PermissionsAndroid.RESULTS.GRANTED;
    const coarseGranted =
      results[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
      PermissionsAndroid.RESULTS.GRANTED;
    const cameraGranted =
      results[PermissionsAndroid.PERMISSIONS.CAMERA] ===
      PermissionsAndroid.RESULTS.GRANTED;

    let notifGranted = true;
    if (typeof Platform.Version === 'number' && Platform.Version >= 33) {
      const resRecord = results as Record<string, string>;
      notifGranted =
        resRecord['android.permission.POST_NOTIFICATIONS'] ===
        PermissionsAndroid.RESULTS.GRANTED;
    }

    const locationGranted = fineGranted || coarseGranted;
    const allGranted = locationGranted && cameraGranted && notifGranted;

    return {
      location: locationGranted,
      camera: cameraGranted,
      notifications: notifGranted,
      allGranted,
    };
  } catch (error) {
    console.warn('[PermissionService] Error requesting permissions:', error);
    return {
      location: false,
      camera: false,
      notifications: false,
      allGranted: false,
    };
  }
}

/**
 * Opens OS App Settings in case user selected 'Don't ask again'.
 */
export async function openAppSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch (e) {
    console.warn('[PermissionService] Could not open app settings:', e);
  }
}

/**
 * Checks if ACCESS_BACKGROUND_LOCATION is granted (Android 10+ / API 29+).
 */
export async function checkBackgroundLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  if (typeof Platform.Version === 'number' && Platform.Version >= 29) {
    try {
      const bgPerm = 'android.permission.ACCESS_BACKGROUND_LOCATION' as any;
      return await PermissionsAndroid.check(bgPerm);
    } catch {
      return false;
    }
  }
  return true;
}

/**
 * Requests ACCESS_BACKGROUND_LOCATION (Android 10+ / API 29+).
 */
export async function requestBackgroundLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  if (typeof Platform.Version === 'number' && Platform.Version >= 29) {
    try {
      const bgPerm = 'android.permission.ACCESS_BACKGROUND_LOCATION' as any;
      const res = await PermissionsAndroid.request(bgPerm);
      return res === PermissionsAndroid.RESULTS.GRANTED;
    } catch (e) {
      console.warn('[PermissionService] Background location request error:', e);
      return false;
    }
  }
  return true;
}
