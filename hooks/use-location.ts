import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'Triploom/1.0' } }
    );
    const data = await response.json() as { display_name?: string };
    return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export const ANDROID_MAP_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #e5e0d8; }
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
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    window.setCenter = function(lat, lng) { map.setView([lat, lng], 15); };
    window.getMapCenter = function() {
      var c = map.getCenter();
      window.ReactNativeWebView.postMessage(JSON.stringify({ lat: c.lat, lng: c.lng }));
    };
  </script>
</body>
</html>`;

export type DeviceLocation = {
  latitude: number;
  longitude: number;
};

async function ensurePermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Tilgang nektet',
      'Appen trenger tilgang til posisjonen din for å dele den. Aktiver dette i innstillingene.',
    );
    return false;
  }
  return true;
}

export async function getCurrentLocation(): Promise<DeviceLocation | null> {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    Alert.alert(
      'Posisjonstjenester er av',
      'Slå på posisjonstjenester i innstillingene på telefonen for å dele posisjon.',
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
