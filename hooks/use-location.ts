import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';

export type NominatimAddress = {
  tourism?: string;
  amenity?: string;
  leisure?: string;
  building?: string;
  shop?: string;
  house_number?: string;
  road?: string;
  pedestrian?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  country?: string;
};

export function buildShortLabel(address: NominatimAddress | undefined, fallback: string): string {
  if (!address) return fallback;
  const name = address.tourism ?? address.amenity ?? address.leisure ?? address.building ?? address.shop;
  const streetName = address.road ?? address.pedestrian;
  const street = streetName && address.house_number ? `${streetName} ${address.house_number}` : streetName;
  const city = address.city ?? address.town ?? address.village ?? address.municipality ?? address.county;
  const parts = [name, street, city, address.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : fallback;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'Triploom/1.0' } }
    );
    const data = await response.json() as { display_name?: string; address?: NominatimAddress };
    return buildShortLabel(data.address, data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export function buildAndroidMapHtml(isDark: boolean): string {
  const bg = isDark ? '#1a1a2e' : '#e5e0d8';
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const attribution = isDark
    ? '&copy; OpenStreetMap &copy; CARTO'
    : '&copy; OpenStreetMap';
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: ${bg}; }
    #map { width: 100%; height: 100%; }
    #crosshair {
      position: fixed; top: 50%; left: 50%;
      transform: translate(-50%, -100%);
      z-index: 1000; pointer-events: none;
      font-size: 40px; line-height: 1;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="crosshair">📍</div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: true }).setView([59.9139, 10.7522], 13);
    L.tileLayer('${tileUrl}', {
      maxZoom: 19, attribution: '${attribution}'
    }).addTo(map);
    window.setCenter = function(lat, lng) { map.setView([lat, lng], 15); };
    window.getMapCenter = function() {
      var c = map.getCenter();
      window.ReactNativeWebView.postMessage(JSON.stringify({ lat: c.lat, lng: c.lng }));
    };
  </script>
</body>
</html>`;
}

export type DeviceLocation = {
  latitude: number;
  longitude: number;
};

async function ensurePermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission denied',
      'The app needs access to your location to share it. Enable this in your settings.',
    );
    return false;
  }
  return true;
}

export async function getCurrentLocation(): Promise<DeviceLocation | null> {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    Alert.alert(
      'Location services are off',
      'Turn on location services in your phone settings to share your location.',
    );
    return null;
  }

  if (!await ensurePermission()) return null;

  if (Platform.OS === 'ios') {
    const last = await Location.getLastKnownPositionAsync();
    if (last) return { latitude: last.coords.latitude, longitude: last.coords.longitude };
  }

  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
}

// For iOS map picker centering — silent, no alert if permission denied
export async function getLastKnownLocation(): Promise<DeviceLocation | null> {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== 'granted') return null;
  const last = await Location.getLastKnownPositionAsync();
  if (!last) return null;
  return { latitude: last.coords.latitude, longitude: last.coords.longitude };
}

// For Android map picker centering — requests permission, no alert on denial
export async function requestLocationForMap(): Promise<DeviceLocation | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;
  try {
    const last = await Location.getLastKnownPositionAsync();
    if (last) return { latitude: last.coords.latitude, longitude: last.coords.longitude };
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch {
    return null;
  }
}
