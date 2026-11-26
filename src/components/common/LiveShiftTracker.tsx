import React, { useEffect, useRef, useState } from 'react';
import { View, Platform, PermissionsAndroid, NativeModules } from 'react-native';
import { WebView } from 'react-native-webview';
import { useAuthStore } from '../../store/authStore';
import { useShiftTrackingStore } from '../../store/shiftTrackingStore';
import { useNotificationStore } from '../../store/notificationStore';
import { showToast } from '../../store/toastStore';
import { apiClient, API_ENDPOINTS } from '../../api';
import { ANDROID_API_KEY, apiConfig } from '../../api/config';

const { LiveLocationModule } = NativeModules;
const WebViewComponent: any = WebView;

/**
 * High-accuracy continuous GPS watcher inside WebView.
 * Calls watchPosition so any movement is caught in real-time,
 * plus a fallback interval ping.
 */
const TRACKER_HTML = `
<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body>
<script>
  function postCoords(pos) {
    if (window.ReactNativeWebView && pos && pos.coords) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'LOCATION',
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy || 0,
        timestamp: pos.timestamp || Date.now()
      }));
    }
  }

  function startWatching() {
    if (!navigator.geolocation) return;
    try {
      navigator.geolocation.watchPosition(
        postCoords,
        function(err) {
          navigator.geolocation.getCurrentPosition(postCoords, function(){}, {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 5000
          });
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
      );
    } catch(e) {}
  }

  window.pingGps = function() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(postCoords, function(){}, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 3000
    });
  };

  startWatching();
  window.pingGps();
  setInterval(function() {
    window.pingGps();
  }, 10000); // Check GPS position every 10 seconds
</script>
</body>
</html>
`;

/**
 * Haversine formula to compute distance in meters between two lat/lon coordinates
 */
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 20-Meter Movement Tracker:
 * 1. Base Boundary: Jab tak worker company/assigned unit ke 20 meter ke andar hai,
 *    tab tak koi live tracking record generate nahi hota.
 * 2. Exit Trigger: Jaise hi worker assigned site se > 20 meters bahar nikalta hai,
 *    pehla live tracking record SQL (pay_geolocation_address) me banta hai.
 * 3. Continuous Step Tracking: Uske baad jis jagah pichla record bana tha,
 *    agar worker wahan se aur >= 20 meters dur jata hai, toh agla live track record banta hai.
 */
export const LiveShiftTracker: React.FC = () => {
  const { isAuthenticated, currentUser } = useAuthStore();
  const { isShiftActive, syncTodayShiftStatus, setShiftActive } = useShiftTrackingStore();
  const webViewRef = useRef<any>(null);

  // Unit Center Coordinates state
  const [unitCoords, setUnitCoords] = useState<{ lat: number; lon: number } | null>(null);

  // References to keep tracking state persistent without causing re-renders
  const lastLoggedRef = useRef<{ lat: number; lon: number } | null>(null);
  const isOutsideUnitRef = useRef<boolean>(false);
  const isSendingRef = useRef<boolean>(false);
  const cachedAddrRef = useRef<string>('');
  const lastReverseGeoTimeRef = useRef<number>(0);

  const empCode = currentUser?.empCode || currentUser?.username || '';
  const role = currentUser?.role;
  const isTrackableWorker =
    isAuthenticated &&
    Boolean(empCode) &&
    role !== 'SUPER_ADMIN' &&
    role !== 'ADMIN' &&
    role !== 'CLIENT';

  // 1. Sync Today's Shift Active status
  useEffect(() => {
    if (!isTrackableWorker) {
      setShiftActive(false);
      return;
    }
    syncTodayShiftStatus(empCode);
  }, [isTrackableWorker, empCode, syncTodayShiftStatus, setShiftActive]);

  // 2. Resolve Assigned Unit GPS Coordinates from store or master_unit API
  useEffect(() => {
    if (!isTrackableWorker || !isShiftActive) return;

    let resolvedLat = currentUser?.assignedUnitLatitude;
    let resolvedLon = currentUser?.assignedUnitLongitude;

    if (resolvedLat && resolvedLon && !isNaN(resolvedLat) && !isNaN(resolvedLon)) {
      setUnitCoords({ lat: resolvedLat, lon: resolvedLon });
      return;
    }

    // Fallback: Fetch unit coordinates from master_unit / units API
    const userUnit = currentUser?.branchOrUnit || (currentUser as any)?.scope?.unit_code || '';
    if (userUnit) {
      apiClient.get<any>(`${API_ENDPOINTS.UNITS}?search=${encodeURIComponent(userUnit)}`).then((res) => {
        if (res.success && res.data) {
          const list = Array.isArray(res.data) ? res.data : res.data.results || [];
          const found = list.find(
            (u: any) =>
              String(u.unit_code || '').trim().toLowerCase() === userUnit.trim().toLowerCase() ||
              String(u.unit_name || '').trim().toLowerCase() === userUnit.trim().toLowerCase()
          ) || (list.length === 1 ? list[0] : null);

          if (found) {
            const uLat = parseFloat(found.unit_lattitude);
            const uLon = parseFloat(found.unit_longtitude);
            if (!isNaN(uLat) && !isNaN(uLon) && uLat !== 0 && uLon !== 0) {
              setUnitCoords({ lat: uLat, lon: uLon });
            }
          }
        }
      }).catch(() => {});
    }
  }, [isTrackableWorker, isShiftActive, currentUser]);

  // 3. Android Native Foreground Service & Background Location Permission
  const useNativeAndroidTracker = Platform.OS === 'android' && Boolean(LiveLocationModule);

  useEffect(() => {
    if (!useNativeAndroidTracker) {
      if (isTrackableWorker && isShiftActive && Platform.OS === 'android') {
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).catch(() => {});
      }
      return;
    }

    if (!isTrackableWorker || !isShiftActive) {
      LiveLocationModule.stopTracking?.().catch(() => {});
      return;
    }

    let cancelled = false;
    const ensurePermissionsAndStart = async () => {
      try {
        let fineGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (!fineGranted) {
          const res = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          fineGranted = res === PermissionsAndroid.RESULTS.GRANTED;
        }
        if (!fineGranted || cancelled) return;

        // Android 10+ (API 29+) requires ACCESS_BACKGROUND_LOCATION for tracking after app close
        if (typeof Platform.Version === 'number' && Platform.Version >= 29) {
          const bgPerm = 'android.permission.ACCESS_BACKGROUND_LOCATION' as any;
          const bgGranted = await PermissionsAndroid.check(bgPerm);
          if (!bgGranted) {
            await PermissionsAndroid.request(bgPerm, {
              title: 'Background Location Required',
              message:
                'Allow location access "All the time" so duty shift live tracking continues even when the app is closed.',
              buttonPositive: 'Allow',
              buttonNegative: 'Later',
            });
          }
        }

        if (cancelled) return;
        const unitLabel = currentUser?.branchOrUnit || 'Field Location';
        await LiveLocationModule.startTracking(
          empCode,
          apiConfig.getBaseUrl(),
          ANDROID_API_KEY,
          unitLabel,
          unitCoords?.lat || 0,
          unitCoords?.lon || 0
        );
      } catch (e) {
        console.warn('[LiveShiftTracker] Native tracking start error:', e);
      }
    };

    ensurePermissionsAndStart();

    return () => {
      cancelled = true;
    };
  }, [useNativeAndroidTracker, isTrackableWorker, isShiftActive, empCode, unitCoords, currentUser?.branchOrUnit]);

  if (!isTrackableWorker || !isShiftActive || useNativeAndroidTracker) {
    return null;
  }

  /**
   * Send live GPS ping to MySQL (pay_geolocation_address)
   */
  const sendPingToBackend = async (lat: number, lon: number, distanceInfo: string) => {
    if (isSendingRef.current) return;
    isSendingRef.current = true;
    try {
      let addr = `${currentUser?.branchOrUnit || 'Field Location'} • ${distanceInfo}`;

      // Reverse geocode via OpenStreetMap Nominatim (Throttled to at most once per 5 minutes to prevent spam & save battery)
      const nowTs = Date.now();
      if (!cachedAddrRef.current || nowTs - lastReverseGeoTimeRef.current > 300000) {
        try {
          const controller = new AbortController();
          const tid = setTimeout(() => controller.abort(), 4000);
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
            {
              headers: { 'User-Agent': 'IHMS-Mobile-App/1.0' },
              signal: controller.signal,
            }
          );
          clearTimeout(tid);
          if (geoRes.ok) {
            const geoJson: any = await geoRes.json();
            if (geoJson?.display_name) {
              cachedAddrRef.current = String(geoJson.display_name).trim().slice(0, 200);
              lastReverseGeoTimeRef.current = nowTs;
            }
          }
        } catch {}
      }

      if (cachedAddrRef.current) {
        addr = `${cachedAddrRef.current} (${distanceInfo})`;
      }

      await apiClient.post<any>(
        '/api/mobile/Employee_geolocation_lat_long/',
        {
          emp_code: empCode,
          emp_latitude: lat.toFixed(6),
          emp_longtitude: lon.toFixed(6),
          current_address: String(addr).slice(0, 250),
        },
        { 'X-API-Key': ANDROID_API_KEY }
      );

      // Record this point as the last logged position
      lastLoggedRef.current = { lat, lon };
    } catch {
      // Silent fail so tracking never disrupts UI
    } finally {
      isSendingRef.current = false;
    }
  };

  /**
   * Handle incoming GPS coordinate from WebView
   */
  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type !== 'LOCATION' || !data.latitude || !data.longitude) return;

      const currentLat = parseFloat(data.latitude);
      const currentLon = parseFloat(data.longitude);
      if (isNaN(currentLat) || isNaN(currentLon) || currentLat === 0 || currentLon === 0) return;

      // Filter out low accuracy GPS readings (> 45 meters) to avoid false distance jumps
      if (data.accuracy && data.accuracy > 45) {
        return;
      }

      // Check distance from Assigned Company / Unit location
      if (unitCoords) {
        const distFromUnit = getDistanceInMeters(
          currentLat,
          currentLon,
          unitCoords.lat,
          unitCoords.lon
        );

        // CASE 1: Worker company/unit ke 20 meters ke andar hai -> NO RECORD
        if (distFromUnit <= 20) {
          isOutsideUnitRef.current = false;
          // Reset last logged location so jab woh bahar niklega, turant naya base ban sake
          lastLoggedRef.current = null;
          return;
        }

        // CASE 2: Worker pehli baar unit se 20 meter bahar nikla (> 20 meters)
        if (!isOutsideUnitRef.current || !lastLoggedRef.current) {
          isOutsideUnitRef.current = true;
          const distText = `${Math.round(distFromUnit)}m from site`;
          useNotificationStore.getState().addNotification({
            title: 'Duty Boundary Warning',
            message: `You have moved outside your designated post perimeter (${distText}). Please return to your post immediately.`,
            type: 'warning',
            category: 'GEOFENCE',
            distanceInfo: distText,
            targetScreen: 'UnifiedDashboard',
          });
          showToast({
            type: 'warning',
            title: 'Duty Boundary Warning',
            message: `You are ${distText}. Please return to your duty post immediately.`,
            duration: 4500,
          });
          await sendPingToBackend(currentLat, currentLon, distText);
          return;
        }
      }

      // CASE 3: Worker pehle se bahar hai -> Check if moved >= 20 meters from last logged location
      if (lastLoggedRef.current) {
        const distFromLastPing = getDistanceInMeters(
          currentLat,
          currentLon,
          lastLoggedRef.current.lat,
          lastLoggedRef.current.lon
        );

        if (distFromLastPing >= 20) {
          // Moved >= 20 meters further! Log next record
          await sendPingToBackend(currentLat, currentLon, `Moved +${Math.round(distFromLastPing)}m`);
        }
      } else {
        // Fallback if no unit coordinates were configured: log every 20 meters movement
        await sendPingToBackend(currentLat, currentLon, 'On-field tracking');
      }
    } catch {
      // Ignore
    }
  };

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: -9999, width: 10, height: 10, opacity: 0.01, overflow: 'hidden' }}
    >
      <WebViewComponent
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: TRACKER_HTML, baseUrl: 'https://localhost' }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        geolocationEnabled
      />
    </View>
  );
};
