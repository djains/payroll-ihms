import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  PermissionsAndroid,
} from 'react-native';
import { WebView } from 'react-native-webview';

const WebViewComponent: any = WebView;
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './SiteUnitsScreen.styles';
import { ms } from '../../../theme';
import {
  AppScreenContainer,
  AppHeader,
  AppIcon,
  AppTextInput,
  AppButton,
  CustomAlertModal,
} from '../../../components/common';
import { useNavigation } from '../../../navigation/navigationContext';
import { superadminApi, BackendUnit, BackendClientItem, BackendStateItem } from '../../../api';
import { showToast } from '../../../store/toastStore';
import { useAuthStore } from '../../../store/authStore';

let cachedUnits: BackendUnit[] | null = null;

export const SiteUnitsScreen: React.FC = () => {
  const { goBack } = useNavigation();
  const { currentUser } = useAuthStore();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16);

  const [units, setUnits] = useState<BackendUnit[]>(cachedUnits || []);
  const [loading, setLoading] = useState<boolean>(!cachedUnits);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add Unit Modal States - Default to current user's company code
  const userCompCode = currentUser?.companyId || '';
  const [modalVisible, setModalVisible] = useState(false);
  const [compCode, setCompCode] = useState(userCompCode);
  const [clientCode, setClientCode] = useState('');
  const [clientName, setClientName] = useState('');
  const [unitCode, setUnitCode] = useState('');
  const [unitName, setUnitName] = useState('');
  const [unitAdd1, setUnitAdd1] = useState('');
  const [unitAdd2, setUnitAdd2] = useState('');
  const [unitCity, setUnitCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [radiusMeters, setRadiusMeters] = useState('100');
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Clients & States dynamic lookup lists
  const [availableClients, setAvailableClients] = useState<BackendClientItem[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientPickerVisible, setClientPickerVisible] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  const [availableStates, setAvailableStates] = useState<BackendStateItem[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [statePickerVisible, setStatePickerVisible] = useState(false);
  const [stateSearch, setStateSearch] = useState('');

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Unit Shifts State & Modal (Option 2)
  const [selectedUnitForShifts, setSelectedUnitForShifts] = useState<BackendUnit | null>(null);
  const [shiftsModalVisible, setShiftsModalVisible] = useState(false);
  const [unitShifts, setUnitShifts] = useState<any[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [newShiftName, setNewShiftName] = useState('General Shift');
  const [newShiftFrom, setNewShiftFrom] = useState('09:00');
  const [newShiftTo, setNewShiftTo] = useState('18:00');
  const [savingShift, setSavingShift] = useState(false);

  // Edit GPS Modal State
  const [editGpsModalVisible, setEditGpsModalVisible] = useState(false);
  const [selectedUnitForGps, setSelectedUnitForGps] = useState<BackendUnit | null>(null);
  const [editLat, setEditLat] = useState('');
  const [editLon, setEditLon] = useState('');
  const [editRadius, setEditRadius] = useState('20');
  const [editReason, setEditReason] = useState('Updated Site Geofencing Coordinates');
  const [updatingGps, setUpdatingGps] = useState(false);

  // Interactive Map Picker Modal State (shared by Add Unit & Edit GPS)
  const [mapPickerVisible, setMapPickerVisible] = useState(false);
  const [mapPickerTarget, setMapPickerTarget] = useState<'add' | 'edit'>('add');
  const [mapTempLat, setMapTempLat] = useState<string>('18.5204');
  const [mapTempLon, setMapTempLon] = useState<string>('73.8567');
  const [mapInitialCenter, setMapInitialCenter] = useState<{ lat: number; lon: number }>({
    lat: 18.5204,
    lon: 73.8567,
  });
  const mapWebViewRef = React.useRef<any>(null);

  const fetchUnits = async () => {
    try {
      const res = await superadminApi.getUnits();
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
        cachedUnits = list;
        setUnits(list);
      }
    } catch (e) {
      console.warn('[SiteUnits] fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const res = await superadminApi.getClients();
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
        setAvailableClients(list);
      }
    } catch (e) {
      console.warn('[SiteUnits] fetch clients error:', e);
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      const res = await superadminApi.getStates();
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
        setAvailableStates(list);
      }
    } catch (e) {
      console.warn('[SiteUnits] fetch states error:', e);
    } finally {
      setLoadingStates(false);
    }
  };

  useEffect(() => {
    fetchUnits();
    fetchClients();
    fetchStates();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUnits();
  };

  const handleOpenShifts = async (unit: BackendUnit) => {
    setSelectedUnitForShifts(unit);
    setShiftsModalVisible(true);
    setLoadingShifts(true);
    try {
      const res = await superadminApi.getShifts(unit.unit_code);
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
        setUnitShifts(list);
      } else {
        setUnitShifts([]);
      }
    } catch {
      setUnitShifts([]);
    } finally {
      setLoadingShifts(false);
    }
  };

  const handleCreateShift = async () => {
    if (!selectedUnitForShifts) return;
    if (!newShiftName.trim()) {
      showToast({ type: 'error', title: 'Shift Name Required', message: 'Please enter shift name.' });
      return;
    }
    if (!newShiftFrom.trim() || !newShiftTo.trim()) {
      showToast({ type: 'error', title: 'Time Required', message: 'Please enter start & end times (HH:MM).' });
      return;
    }

    setSavingShift(true);
    try {
      const res = await superadminApi.createShift({
        unit_code: selectedUnitForShifts.unit_code,
        shift_name: newShiftName.trim(),
        shift_from: newShiftFrom.trim(),
        shift_to: newShiftTo.trim(),
      });

      if (res.success) {
        showToast({
          type: 'success',
          title: 'Shift Added',
          message: `Shift '${newShiftName}' created for unit ${selectedUnitForShifts.unit_code}!`,
        });
        setNewShiftName('');
        // Refresh shift list
        const refreshed = await superadminApi.getShifts(selectedUnitForShifts.unit_code);
        if (refreshed.success && refreshed.data) {
          const list = Array.isArray(refreshed.data) ? refreshed.data : (refreshed.data as any).results || [];
          setUnitShifts(list);
        }
      } else {
        showToast({
          type: 'error',
          title: 'Failed',
          message: res.error || 'Could not save shift.',
        });
      }
    } catch (e: any) {
      showToast({
        type: 'error',
        title: 'Error',
        message: e?.message || 'Failed to connect to backend.',
      });
    } finally {
      setSavingShift(false);
    }
  };

  const handleOpenEditGps = (unit: BackendUnit) => {
    setSelectedUnitForGps(unit);
    const rawLat = unit.unit_lattitude || unit.latitude || '';
    const rawLon = unit.unit_longtitude || unit.longitude || '';
    const rawRadius = unit.area_meters || '20';
    setEditLat(String(rawLat));
    setEditLon(String(rawLon));
    setEditRadius(String(rawRadius));
    setEditReason('Updated Site Geofencing Coordinates');
    setEditGpsModalVisible(true);
  };

  const handleSaveGps = async () => {
    if (!selectedUnitForGps) return;
    const cleanLat = editLat.trim();
    const cleanLon = editLon.trim();
    const cleanRadius = editRadius.trim() || '20';
    const cleanReason = editReason.trim() || 'Updated Site Geofencing Coordinates';

    if (!cleanLat || isNaN(parseFloat(cleanLat))) {
      showToast({ type: 'error', title: 'Invalid Latitude', message: 'Please enter a valid numeric latitude (e.g. 18.5640)' });
      return;
    }
    if (!cleanLon || isNaN(parseFloat(cleanLon))) {
      showToast({ type: 'error', title: 'Invalid Longitude', message: 'Please enter a valid numeric longitude (e.g. 73.9138)' });
      return;
    }

    setUpdatingGps(true);
    try {
      const res = await superadminApi.updateUnit(selectedUnitForGps.id, {
        unit_lattitude: cleanLat,
        unit_longtitude: cleanLon,
        area_meters: cleanRadius,
        reason_for_updation: cleanReason,
      });

      if (res.success) {
        showToast({
          type: 'success',
          title: 'GPS Coordinates Updated',
          message: `${selectedUnitForGps.unit_name} (${selectedUnitForGps.unit_code}) coordinates updated successfully.`,
        });
        setEditGpsModalVisible(false);
        fetchUnits();
      } else {
        showToast({
          type: 'error',
          title: 'Update Failed',
          message: res.error || 'Could not update GPS in backend.',
        });
      }
    } catch (e: any) {
      showToast({
        type: 'error',
        title: 'Error',
        message: e?.message || 'Network error occurred.',
      });
    } finally {
      setUpdatingGps(false);
    }
  };

  const openMapPicker = async (target: 'add' | 'edit') => {
    Keyboard.dismiss();
    if (Platform.OS === 'android') {
      try {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
      } catch {}
    }

    const rawLat = target === 'add' ? parseFloat(lat) : parseFloat(editLat);
    const rawLon = target === 'add' ? parseFloat(lon) : parseFloat(editLon);
    const startLat = !isNaN(rawLat) && rawLat !== 0 ? rawLat : 18.5204;
    const startLon = !isNaN(rawLon) && rawLon !== 0 ? rawLon : 73.8567;

    setMapPickerTarget(target);
    setMapInitialCenter({ lat: startLat, lon: startLon });
    setMapTempLat(startLat.toFixed(6));
    setMapTempLon(startLon.toFixed(6));
    setMapPickerVisible(true);
  };

  const onMapPickerMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'PICKED' && data.latitude && data.longitude) {
        const pLat = parseFloat(data.latitude);
        const pLon = parseFloat(data.longitude);
        if (!isNaN(pLat) && !isNaN(pLon)) {
          setMapTempLat(pLat.toFixed(6));
          setMapTempLon(pLon.toFixed(6));
        }
      } else if (data.type === 'GPS_ERROR') {
        showToast({
          type: 'error',
          title: 'GPS Unavailable',
          message: data.message || 'Please enable Device Location (GPS) & permissions.',
        });
      }
    } catch {}
  };

  const confirmMapPicker = () => {
    if (mapPickerTarget === 'add') {
      setLat(mapTempLat);
      setLon(mapTempLon);
      setErrors((prev) => ({ ...prev, lat: '', lon: '' }));
    } else {
      setEditLat(mapTempLat);
      setEditLon(mapTempLon);
    }
    setMapPickerVisible(false);
    showToast({
      type: 'success',
      title: 'Location Selected',
      message: `Lat: ${mapTempLat}, Lon: ${mapTempLon} auto-filled!`,
    });
  };

  const buildMapPickerHtml = (initLat: number, initLon: number, radiusM: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #e2e8f0; }
    .search-box {
      position: absolute; top: 10px; left: 10px; right: 10px; z-index: 1000;
      display: flex; gap: 6px; background: #fff; padding: 6px; border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.18);
    }
    .search-box input {
      flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 7px 10px; font-size: 13px; outline: none;
    }
    .search-box button {
      background: #0F766E; color: #fff; border: none; border-radius: 8px; padding: 7px 12px; font-size: 12px; font-weight: 700;
    }
    .gps-btn {
      position: absolute; bottom: 18px; right: 12px; z-index: 1000;
      background: #fff; color: #0F766E; border: 1.5px solid #0F766E; border-radius: 22px;
      padding: 8px 14px; font-size: 12px; font-weight: 800; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    .hint-pill {
      position: absolute; bottom: 18px; left: 12px; z-index: 1000;
      background: rgba(15,23,42,0.82); color: #fff; border-radius: 14px;
      padding: 6px 10px; font-size: 11px; font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="search-box">
    <input id="q" type="text" placeholder="Search city, area or landmark..." />
    <button onclick="searchPlace()">Go</button>
  </div>
  <div id="map"></div>
  <div class="hint-pill">Tap map or drag pin</div>
  <button class="gps-btn" onclick="useMyGps()">My GPS</button>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([${initLat}, ${initLon}], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    var marker = L.marker([${initLat}, ${initLon}], { draggable: true }).addTo(map);
    var circle = L.circle([${initLat}, ${initLon}], {
      color: '#0F766E', fillColor: '#14B8A6', fillOpacity: 0.18, radius: ${Math.max(radiusM || 50, 20)}
    }).addTo(map);

    function emit(lat, lon) {
      marker.setLatLng([lat, lon]);
      circle.setLatLng([lat, lon]);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PICKED', latitude: lat, longitude: lon }));
      }
    }

    map.on('click', function(e) {
      emit(e.latlng.lat, e.latlng.lng);
    });

    marker.on('dragend', function() {
      var p = marker.getLatLng();
      emit(p.lat, p.lng);
    });

    function useMyGps() {
      var btn = document.querySelector('.gps-btn');
      if (!navigator.geolocation) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'GPS_ERROR', message: 'Geolocation not supported.' }));
        }
        return;
      }
      if (btn) btn.textContent = 'Locating...';
      function onSuccess(pos) {
        if (btn) btn.textContent = 'My GPS';
        var la = pos.coords.latitude, lo = pos.coords.longitude;
        map.setView([la, lo], 17);
        emit(la, lo);
      }
      function onFallbackError(err) {
        if (btn) btn.textContent = 'My GPS';
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'GPS_ERROR',
            message: err && err.message ? err.message : 'Unable to fetch current GPS location.'
          }));
        }
      }
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        function() {
          // Fallback to network/coarse location if high-accuracy GPS times out indoors
          navigator.geolocation.getCurrentPosition(
            onSuccess,
            onFallbackError,
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
          );
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    function searchPlace() {
      var q = document.getElementById('q').value.trim();
      if (!q) return;
      fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(q))
        .then(function(r) { return r.json(); })
        .then(function(res) {
          if (res && res.length > 0) {
            var la = parseFloat(res[0].lat), lo = parseFloat(res[0].lon);
            map.setView([la, lo], 16);
            emit(la, lo);
          }
        }).catch(function() {});
    }
  </script>
</body>
</html>`;

  const handleCreateUnit = async () => {
    const errs: Record<string, string> = {};
    if (!unitCode.trim()) errs.unitCode = 'Unit code is required (e.g. U105)';
    if (!unitName.trim()) errs.unitName = 'Site name is required';
    if (!stateName.trim()) errs.stateName = 'Please select or enter State.';
    if (!unitCity.trim()) errs.unitCity = 'City is required';
    if (!pincode.trim() || pincode.trim().length !== 6 || isNaN(Number(pincode.trim()))) {
      errs.pincode = 'Valid 6-digit Pincode is required';
    }
    if (!lat.trim()) errs.lat = 'Latitude is required';
    if (!lon.trim()) errs.lon = 'Longitude is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: Object.values(errs)[0],
      });
      return;
    }

    setCreating(true);
    try {
      // Backend client_code check requires non-empty and != 'Select'.
      // If client is not selected, fallback seamlessly to company code or 'GENERAL' so backend doesn't reject.
      const resolvedClientCode = clientCode.trim() || compCode.trim() || 'GENERAL';

      const res = await superadminApi.createUnit({
        comp_code: compCode.trim().toUpperCase(),
        client_code: resolvedClientCode.toUpperCase(),
        unit_code: unitCode.trim().toUpperCase(),
        unit_name: unitName.trim(),
        unit_add1: unitAdd1.trim() || `${unitName.trim()} Premises`,
        unit_add2: unitAdd2.trim() || `${unitCity.trim()} Site Location`,
        unit_city: unitCity.trim(),
        state_name: stateName.trim(),
        pincode: pincode.trim(),
        file_no: '101',
        area_meters: radiusMeters.trim() || '150',
        unit_lattitude: lat.trim(),
        unit_longtitude: lon.trim(),
      });

      if (res.success) {
        showToast({
          type: 'success',
          title: 'Site Added',
          message: `${unitName} (${unitCode.toUpperCase()}) has been successfully created.`,
        });
        setModalVisible(false);
        setUnitCode('');
        setUnitName('');
        setUnitAdd1('');
        setUnitAdd2('');
        setUnitCity('');
        setPincode('');
        setLat('');
        setLon('');
        setErrors({});
        fetchUnits();
      } else {
        showToast({
          type: 'error',
          title: 'Creation Failed',
          message: res.error || 'Could not save unit.',
        });
      }
    } catch (e: any) {
      showToast({
        type: 'error',
        title: 'Error',
        message: e?.message || 'Network error occurred.',
      });
    } finally {
      setCreating(false);
    }
  };

  const filteredUnits = units.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.unit_name && u.unit_name.toLowerCase().includes(q)) ||
      (u.unit_code && u.unit_code.toLowerCase().includes(q)) ||
      (u.comp_code && u.comp_code.toLowerCase().includes(q)) ||
      (u.state_name && u.state_name.toLowerCase().includes(q))
    );
  });

  const renderUnitCard = ({ item }: { item: BackendUnit }) => {
    // Backend Unit model uses unit_lattitude & unit_longtitude
    const rawLat = item.unit_lattitude || item.latitude;
    const rawLon = item.unit_longtitude || item.longitude;
    const numLat = rawLat ? parseFloat(rawLat) : NaN;
    const numLon = rawLon ? parseFloat(rawLon) : NaN;

    const hasGps =
      !isNaN(numLat) &&
      !isNaN(numLon) &&
      numLat !== 0 &&
      numLon !== 0;

    return (
      <View style={styles.unitCard}>
        <View style={styles.unitHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={styles.unitIconWrap}>
              <AppIcon name="location" size={18} color="#0F766E" />
            </View>
            <View style={styles.unitTitleWrap}>
              <Text style={styles.unitTitle} numberOfLines={1}>
                {item.unit_name}
              </Text>
              <Text style={styles.unitCode}>
                Code: {item.unit_code} • Comp: {item.comp_code || '-'}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.gpsBadge,
              hasGps ? styles.gpsBadgeActive : styles.gpsBadgeInactive,
            ]}
          >
            <AppIcon
              name={hasGps ? 'location' : 'alert'}
              size={11}
              color={hasGps ? '#15803D' : '#DC2626'}
            />
            <Text style={hasGps ? styles.gpsBadgeTextActive : styles.gpsBadgeTextInactive}>
              {hasGps ? 'GPS Mapped' : 'GPS Missing'}
            </Text>
          </View>
        </View>

        <View style={styles.coordsRow}>
          <AppIcon name="shield" size={12} color="#0F766E" />
          <Text style={styles.coordsText} numberOfLines={1}>
            {hasGps
              ? `Lat: ${numLat.toFixed(4)}, Lon: ${numLon.toFixed(4)}${item.area_meters ? ` • Radius: ${item.area_meters}m` : ''}`
              : 'Punch requires coordinates registered in Unit master.'}
          </Text>
        </View>

        {/* Manage Shifts & Edit GPS Quick Buttons */}
        <View style={styles.unitCardFooter}>
          <Text style={styles.unitStatusTag}>
            Unit: {item.unit_code}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={[styles.manageShiftsBtn, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
              activeOpacity={0.75}
              onPress={() => handleOpenEditGps(item)}
            >
              <AppIcon name="location" size={12} color="#15803D" />
              <Text style={[styles.manageShiftsBtnText, { color: '#15803D' }]}>Edit GPS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.manageShiftsBtn}
              activeOpacity={0.75}
              onPress={() => handleOpenShifts(item)}
            >
              <AppIcon name="clock" size={12} color="#0F766E" />
              <Text style={styles.manageShiftsBtnText}>Manage Shifts</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <AppScreenContainer
      style={styles.container}
      backgroundColor="#F8FAFC"
      header={
        <AppHeader
          title="Site Units"
          subtitle="Geofence & Location Master"
          onBack={goBack}
          rightComponent={
            <TouchableOpacity
              style={styles.addSiteBtn}
              activeOpacity={0.8}
              onPress={() => setModalVisible(true)}
            >
              <AppIcon name="plus" size={12} color="#FFFFFF" />
              <Text style={styles.addSiteBtnText}>Add Unit</Text>
            </TouchableOpacity>
          }
        />
      }
    >
      <View style={styles.contentWrap}>
        {/* Search */}
        <View style={styles.searchWrap}>
          <AppTextInput
            placeholder="Search sites by unit name, code, state..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            iconLeft="search"
          />
        </View>

        {/* Stats */}
        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            Registered Sites: {units.length} • Filtered: {filteredUnits.length}
          </Text>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#0F766E" />
            <Text style={{ marginTop: 8, color: '#64748B', fontSize: 12 }}>
              Loading units...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredUnits}
            keyExtractor={(item, index) => `${item.unit_code}-${index}`}
            renderItem={renderUnitCard}
            contentContainerStyle={{ paddingBottom: bottomInset + 120 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )}
      </View>

      {/* Add Unit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                paddingBottom: keyboardHeight > 0 ? keyboardHeight + 10 : bottomInset + 10,
                maxHeight: keyboardHeight > 0 ? '95%' : '85%',
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Site Unit</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setModalVisible(false)}
              >
                <AppIcon name="close" size={16} color="#0F766E" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: ms(30) }}
            >
              {/* Client Selection (Optional) */}
              <Text style={styles.pickerLabel}>Client (Optional)</Text>
              <TouchableOpacity
                style={styles.selectorBox}
                onPress={() => {
                  setClientPickerVisible(true);
                  if (availableClients.length === 0) fetchClients();
                }}
              >
                <Text style={clientCode ? styles.selectorBoxText : styles.selectorBoxPlaceholder}>
                  {clientName ? `${clientName} (${clientCode})` : clientCode || 'Select Client (Default: Main Company)'}
                </Text>
                <AppIcon name="chevron-down" size={16} color="#64748B" />
              </TouchableOpacity>

              <AppTextInput
                label="Unit Code *"
                placeholder="e.g. U105"
                value={unitCode}
                onChangeText={(v) => {
                  setUnitCode(v.toUpperCase());
                  if (errors.unitCode) setErrors((prev) => ({ ...prev, unitCode: '' }));
                }}
                autoCapitalize="characters"
                iconLeft="briefcase"
                error={errors.unitCode}
              />
              <AppTextInput
                label="Site / Unit Name *"
                placeholder="e.g. HDFC Bank Corporate Headquarters"
                value={unitName}
                onChangeText={(v) => {
                  setUnitName(v);
                  if (errors.unitName) setErrors((prev) => ({ ...prev, unitName: '' }));
                }}
                iconLeft="map-pin"
                error={errors.unitName}
              />

              {/* State Selection */}
              <AppTextInput
                label="Branch State *"
                placeholder="e.g. Maharashtra"
                value={stateName}
                onChangeText={(v) => {
                  setStateName(v);
                  if (errors.stateName) setErrors((prev) => ({ ...prev, stateName: '' }));
                }}
                iconLeft="map-pin"
                error={errors.stateName}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <AppTextInput
                    label="City *"
                    placeholder="e.g. Pune"
                    value={unitCity}
                    onChangeText={(v) => {
                      setUnitCity(v);
                      if (errors.unitCity) setErrors((prev) => ({ ...prev, unitCity: '' }));
                    }}
                    iconLeft="location"
                    error={errors.unitCity}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppTextInput
                    label="Pincode (6-digit) *"
                    placeholder="e.g. 411001"
                    value={pincode}
                    onChangeText={(v) => {
                      setPincode(v);
                      if (errors.pincode) setErrors((prev) => ({ ...prev, pincode: '' }));
                    }}
                    keyboardType="numeric"
                    maxLength={6}
                    iconLeft="file-text"
                    error={errors.pincode}
                  />
                </View>
              </View>

              <AppTextInput
                label="Location / Address Line 1"
                placeholder="Premises Address"
                value={unitAdd1}
                onChangeText={setUnitAdd1}
                iconLeft="map-pin"
              />

              <AppTextInput
                label="Street / Road / Lane"
                placeholder="Site Location / Street"
                value={unitAdd2}
                onChangeText={setUnitAdd2}
                iconLeft="map-pin"
              />

              <TouchableOpacity
                onPress={() => openMapPicker('add')}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: '#ECFDF5',
                  borderWidth: 1,
                  borderColor: '#6EE7B7',
                  borderRadius: 10,
                  paddingVertical: 11,
                  marginBottom: 12,
                }}
              >
                <AppIcon name="location" size={16} color="#047857" />
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#047857' }}>
                  Pick Location on Map (Auto Lat / Lon)
                </Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <AppTextInput
                    label="Latitude *"
                    placeholder="18.5204"
                    value={lat}
                    onChangeText={(v) => {
                      setLat(v);
                      if (errors.lat) setErrors((prev) => ({ ...prev, lat: '' }));
                    }}
                    keyboardType="numeric"
                    iconLeft="location"
                    error={errors.lat}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppTextInput
                    label="Longitude *"
                    placeholder="73.8567"
                    value={lon}
                    onChangeText={(v) => {
                      setLon(v);
                      if (errors.lon) setErrors((prev) => ({ ...prev, lon: '' }));
                    }}
                    keyboardType="numeric"
                    iconLeft="location"
                    error={errors.lon}
                  />
                </View>
              </View>
              <AppTextInput
                label="Geofence Radius (Meters)"
                value={radiusMeters}
                onChangeText={setRadiusMeters}
                keyboardType="numeric"
                iconLeft="shield"
              />

              <AppButton
                title={creating ? 'Saving Unit...' : 'Create Site Unit'}
                onPress={handleCreateUnit}
                loading={creating}
                style={{ marginTop: 12, marginBottom: 20 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Option 2: Manage Shifts Bottom Sheet Modal */}
      <Modal
        visible={shiftsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setShiftsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                paddingBottom: keyboardHeight > 0 ? keyboardHeight + 10 : bottomInset + 10,
                maxHeight: keyboardHeight > 0 ? '95%' : '85%',
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  {selectedUnitForShifts ? selectedUnitForShifts.unit_name : 'Unit'} Shifts
                </Text>
                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700', marginTop: 2 }}>
                  Unit Code: {selectedUnitForShifts?.unit_code} • Timings & Shift Rules
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShiftsModalVisible(false)}
              >
                <AppIcon name="close" size={16} color="#0F766E" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={{ paddingBottom: ms(30) }}
            >
              {/* Existing Shifts for this Unit */}
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A', marginTop: 8, marginBottom: 6 }}>
                Active Shifts ({unitShifts.length})
              </Text>

              {loadingShifts ? (
                <ActivityIndicator size="small" color="#0F766E" style={{ marginVertical: 14 }} />
              ) : unitShifts.length > 0 ? (
                <View style={styles.shiftListWrap}>
                  {unitShifts.map((s: any, idx: number) => (
                    <View key={s.id || idx} style={styles.shiftItemCard}>
                      <View style={styles.shiftItemLeft}>
                        <AppIcon name="clock" size={14} color="#0F766E" />
                        <Text style={styles.shiftNameText}>{s.shift_name}</Text>
                      </View>
                      <View style={styles.shiftTimeBadge}>
                        <Text style={styles.shiftTimeText}>
                          {s.shift_from} - {s.shift_to}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyShiftsNotice}>
                  <Text style={styles.emptyShiftsText}>
                    No shifts configured for this unit yet.
                  </Text>
                  <Text style={[styles.emptyShiftsText, { fontSize: 10, marginTop: 2 }]}>
                    Add a shift below to enable automatic attendance hours calculation.
                  </Text>
                </View>
              )}

              {/* Add New Shift to this Unit */}
              <View style={styles.addShiftBox}>
                <Text style={styles.addShiftBoxTitle}>+ Add Shift for {selectedUnitForShifts?.unit_code}</Text>

                <AppTextInput
                  label="Shift Name"
                  placeholder="e.g. Day Shift / Night Shift / General"
                  value={newShiftName}
                  onChangeText={setNewShiftName}
                />

                <View style={styles.timeInputsRow}>
                  <View style={{ flex: 1 }}>
                    <AppTextInput
                      label="Start Time (24h)"
                      placeholder="09:00"
                      value={newShiftFrom}
                      onChangeText={setNewShiftFrom}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppTextInput
                      label="End Time (24h)"
                      placeholder="18:00"
                      value={newShiftTo}
                      onChangeText={setNewShiftTo}
                    />
                  </View>
                </View>

                <AppButton
                  title={savingShift ? 'Saving...' : 'Add Shift to Unit'}
                  onPress={handleCreateShift}
                  loading={savingShift}
                  style={{ marginTop: 10 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Edit GPS Coordinates Modal ── */}
      <Modal
        visible={editGpsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditGpsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                paddingBottom: keyboardHeight > 0 ? keyboardHeight + 10 : bottomInset + 10,
                maxHeight: keyboardHeight > 0 ? '95%' : '85%',
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Update GPS Coordinates</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 2 }}>
                  {selectedUnitForGps?.unit_name} ({selectedUnitForGps?.unit_code})
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setEditGpsModalVisible(false)}
              >
                <AppIcon name="close" size={16} color="#0F766E" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
            >
              <View style={{ backgroundColor: '#F0FDFA', padding: 12, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: '#CCFBF1' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#0F766E', marginBottom: 2 }}>
                  Site Geofencing Anchor
                </Text>
                <Text style={{ fontSize: 10, color: '#334155' }}>
                  Workers deployed to this unit must be within the specified radius to punch attendance.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => openMapPicker('edit')}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: '#ECFDF5',
                  borderWidth: 1,
                  borderColor: '#6EE7B7',
                  borderRadius: 10,
                  paddingVertical: 11,
                  marginBottom: 14,
                }}
              >
                <AppIcon name="location" size={16} color="#047857" />
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#047857' }}>
                  Open Map & Select Location
                </Text>
              </TouchableOpacity>

              <AppTextInput
                label="Latitude *"
                placeholder="e.g. 18.5640"
                value={editLat}
                onChangeText={setEditLat}
                keyboardType="numeric"
                helperText="Decimal GPS Latitude coordinate"
              />

              <AppTextInput
                label="Longitude *"
                placeholder="e.g. 73.9138"
                value={editLon}
                onChangeText={setEditLon}
                keyboardType="numeric"
                helperText="Decimal GPS Longitude coordinate"
              />

              <AppTextInput
                label="Geofence Radius (Meters) *"
                placeholder="e.g. 20 / 50 / 100"
                value={editRadius}
                onChangeText={setEditRadius}
                keyboardType="numeric"
                helperText="Punch allowance radius in meters around the unit"
              />

              <AppTextInput
                label="Reason for Updation *"
                placeholder="e.g. Updated Site Geofencing Coordinates"
                value={editReason}
                onChangeText={setEditReason}
                helperText="Required by backend audit log to save changes"
              />

              <AppButton
                title={updatingGps ? 'Saving Changes...' : 'Save GPS Coordinates'}
                onPress={handleSaveGps}
                loading={updatingGps}
                style={{ marginTop: 16 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Interactive Map Picker Modal (Auto-fills Lat & Lon) ── */}
      <Modal
        visible={mapPickerVisible}
        animationType="slide"
        transparent={false}
        statusBarTranslucent={false}
        onRequestClose={() => setMapPickerVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 28 : 0) }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: '#FFFFFF',
              borderBottomWidth: 1,
              borderBottomColor: '#E2E8F0',
            }}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>
                Select Site Location on Map
              </Text>
              <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 2 }}>
                Tap anywhere or drag pin — Lat & Lon update automatically
              </Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setMapPickerVisible(false)}
            >
              <AppIcon name="close" size={16} color="#0F766E" />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            <WebViewComponent
              ref={mapWebViewRef}
              originWhitelist={['*']}
              source={{
                html: buildMapPickerHtml(
                  mapInitialCenter.lat,
                  mapInitialCenter.lon,
                  parseFloat(mapPickerTarget === 'add' ? radiusMeters : editRadius) || 50
                ),
                baseUrl: 'https://localhost',
              }}
              onMessage={onMapPickerMessage}
              javaScriptEnabled
              domStorageEnabled
              geolocationEnabled
              style={{ flex: 1 }}
            />
          </View>

          <View
            style={{
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: bottomInset + 8,
              borderTopWidth: 1,
              borderTopColor: '#E2E8F0',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                backgroundColor: '#F0FDFA',
                borderWidth: 1,
                borderColor: '#CCFBF1',
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 9,
                marginBottom: 10,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F766E' }}>
                Lat: {mapTempLat}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F766E' }}>
                Lon: {mapTempLon}
              </Text>
            </View>
            <AppButton
              title="Confirm Selected Location"
              onPress={confirmMapPicker}
            />
          </View>
        </View>
      </Modal>

    {/* Client Picker Modal */}
    <Modal
      visible={clientPickerVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setClientPickerVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.pickerSheetContent, { paddingBottom: bottomInset + 10 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Client</Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setClientPickerVisible(false)}
            >
              <AppIcon name="close" size={16} color="#0F766E" />
            </TouchableOpacity>
          </View>

          <AppTextInput
            placeholder="Search client name or code..."
            value={clientSearch}
            onChangeText={setClientSearch}
            iconLeft="search"
            containerStyle={{ marginBottom: 10 }}
          />

          {loadingClients ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#0F766E" />
            </View>
          ) : (
            <FlatList
              data={availableClients.filter((c) => {
                const q = clientSearch.toLowerCase().trim();
                if (!q) return true;
                return (
                  c.client_name?.toLowerCase().includes(q) ||
                  c.client_code?.toLowerCase().includes(q)
                );
              })}
              keyExtractor={(item) => item.client_code}
              renderItem={({ item }) => {
                const isSelected = clientCode === item.client_code;
                return (
                  <TouchableOpacity
                    style={[styles.pickerItem, isSelected ? styles.pickerItemActive : null]}
                    onPress={() => {
                      setClientCode(item.client_code);
                      setClientName(item.client_name);
                      if (errors.clientCode) setErrors((prev) => ({ ...prev, clientCode: '' }));
                      setClientPickerVisible(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickerItemText}>{item.client_name}</Text>
                      <Text style={styles.pickerItemSubtext}>Code: {item.client_code}</Text>
                    </View>
                    {isSelected ? <AppIcon name="check" size={16} color="#0F766E" /> : null}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#64748B', fontSize: 12 }}>No clients found.</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>

    {/* State Picker Modal */}
    <Modal
      visible={statePickerVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setStatePickerVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.pickerSheetContent, { paddingBottom: bottomInset + 10 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Branch State</Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setStatePickerVisible(false)}
            >
              <AppIcon name="close" size={16} color="#0F766E" />
            </TouchableOpacity>
          </View>

          <AppTextInput
            placeholder="Search state..."
            value={stateSearch}
            onChangeText={setStateSearch}
            iconLeft="search"
            containerStyle={{ marginBottom: 10 }}
          />

          {loadingStates ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#0F766E" />
            </View>
          ) : (
            <FlatList
              data={(() => {
                // Deduplicate state names
                const map = new Map<string, BackendStateItem>();
                availableStates.forEach((s) => {
                  const name = (s.state_name || '').trim();
                  if (name && !map.has(name.toLowerCase())) {
                    map.set(name.toLowerCase(), s);
                  }
                });
                const uniqueStates = Array.from(map.values());
                const q = stateSearch.toLowerCase().trim();
                return uniqueStates.filter((s) => !q || s.state_name.toLowerCase().includes(q));
              })()}
              keyExtractor={(item, idx) => `${item.state_name}-${idx}`}
              renderItem={({ item }) => {
                const isSelected = stateName.toLowerCase() === item.state_name.toLowerCase();
                return (
                  <TouchableOpacity
                    style={[styles.pickerItem, isSelected ? styles.pickerItemActive : null]}
                    onPress={() => {
                      setStateName(item.state_name);
                      if (errors.stateName) setErrors((prev) => ({ ...prev, stateName: '' }));
                      setStatePickerVisible(false);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{item.state_name}</Text>
                    {isSelected ? <AppIcon name="check" size={16} color="#0F766E" /> : null}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#64748B', fontSize: 12 }}>No states found.</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
    </AppScreenContainer>
  );
};
