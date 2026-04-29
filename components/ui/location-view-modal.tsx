import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, Linking, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';

import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { reverseGeocode } from '@/hooks/use-location';

type Props = {
  visible: boolean;
  onClose: () => void;
  latitude?: number;
  longitude?: number;
  label?: string | null;
  address?: string | null;
};

type Coords = { lat: number; lng: number };

function buildMapHtml(lat: number, lng: number, isDark: boolean): string {
  const bg = isDark ? '#1a1a2e' : '#e5e0d8';
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const attribution = isDark ? '&copy; OpenStreetMap &copy; CARTO' : '&copy; OpenStreetMap';
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: ${bg}; }
    #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: true }).setView([${lat}, ${lng}], 15);
    L.tileLayer('${tileUrl}', {
      maxZoom: 19, attribution: '${attribution}'
    }).addTo(map);
    L.marker([${lat}, ${lng}]).addTo(map);
  </script>
</body>
</html>`;
}

async function openInMaps(lat: number, lng: number, displayLabel?: string | null) {
  const label = encodeURIComponent(displayLabel ?? `${lat},${lng}`);
  const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  const primary = Platform.OS === 'ios'
    ? `maps://?ll=${lat},${lng}&q=${label}`
    : `geo:0,0?q=${lat},${lng}(${label})`;

  try {
    await Linking.openURL(primary);
  } catch {
    try {
      await Linking.openURL(webUrl);
    } catch {
      Alert.alert('Kunne ikke åpne kart', 'Ingen kart-app ble funnet på enheten.');
    }
  }
}

async function geocodeAddress(addr: string): Promise<Coords | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`,
      { headers: { 'Accept-Language': 'no', 'User-Agent': 'Triploom/1.0' } }
    );
    const results = await response.json() as Array<{ lat: string; lon: string }>;
    if (!results.length) return null;
    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
  } catch {
    return null;
  }
}

export function LocationViewModal({ visible, onClose, latitude, longitude, label, address }: Props) {
  const insets = useSafeAreaInsets();
  const { theme: { colors, spacing, radius }, mode } = useAppTheme();
  const isDark = mode === 'dark';

  const hasCoords = latitude !== undefined && longitude !== undefined;
  const [resolvedCoords, setResolvedCoords] = useState<Coords | null>(
    hasCoords ? { lat: latitude, lng: longitude } : null
  );
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [resolvedLabel, setResolvedLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    if (hasCoords) {
      setResolvedCoords({ lat: latitude, lng: longitude });
      if (label === null && !address) {
        reverseGeocode(latitude, longitude).then((addr) => setResolvedLabel(addr));
      }
      return;
    }
    if (!address) return;
    setIsGeocoding(true);
    geocodeAddress(address).then((coords) => {
      setResolvedCoords(coords);
      setIsGeocoding(false);
    });
  }, [visible, address, hasCoords, label, latitude, longitude]);

  const displayLabel = label ?? resolvedLabel ?? address ?? null;

  function renderMap() {
    if (isGeocoding || !resolvedCoords) {
      return (
        <View style={styles.centered}>
          {isGeocoding
            ? <ActivityIndicator color={colors.primary} />
            : <AppText tone="muted">Kunne ikke vise kartet.</AppText>}
        </View>
      );
    }

    if (Platform.OS === 'ios') {
      return (
        <MapView
          style={{ flex: 1 }}
          userInterfaceStyle={isDark ? 'dark' : 'light'}
          initialRegion={{
            latitude: resolvedCoords.lat,
            longitude: resolvedCoords.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          pitchEnabled={false}
          rotateEnabled={false}>
          <Marker coordinate={{ latitude: resolvedCoords.lat, longitude: resolvedCoords.lng }} />
        </MapView>
      );
    }

    return (
      <WebView
        source={{ html: buildMapHtml(resolvedCoords.lat, resolvedCoords.lng, isDark) }}
        style={{ flex: 1 }}
        originWhitelist={['*']}
        javaScriptEnabled
      />
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + spacing.sm,
              paddingBottom: spacing.sm,
              paddingHorizontal: spacing.md,
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}>
          <Pressable onPress={onClose} style={{ padding: spacing.xs / 2 }} accessibilityLabel="Lukk">
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <AppText variant="subtitle">Location</AppText>
          <View style={{ width: 32 }} />
        </View>

        {renderMap()}

        <View
          style={[
            styles.footer,
            {
              paddingBottom: insets.bottom + spacing.md,
              paddingTop: spacing.md,
              paddingHorizontal: spacing.md,
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              gap: spacing.sm,
            },
          ]}>
          {displayLabel ? (
            <View style={styles.labelRow}>
              <Ionicons name="location" size={16} color={colors.primary} />
              <AppText variant="caption" tone="muted" style={{ flex: 1 }}>
                {displayLabel}
              </AppText>
            </View>
          ) : null}

          <Pressable
            onPress={() => resolvedCoords && openInMaps(resolvedCoords.lat, resolvedCoords.lng, displayLabel)}
            disabled={!resolvedCoords}
            style={[
              styles.mapsButton,
              {
                backgroundColor: resolvedCoords ? colors.primary : colors.textMuted,
                borderRadius: radius.md,
                paddingVertical: spacing.sm,
              },
            ]}>
            <Ionicons name="navigate" size={18} color="#fff" />
            <AppText style={{ color: '#fff', fontWeight: '600' }}>Åpne i kart</AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
