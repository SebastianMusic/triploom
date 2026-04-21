import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';

import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (address: string) => void;
};

const MAP_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #e5e0d8; }
    #map { width: 100%; height: 100%; }
    #crosshair {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -100%);
      z-index: 1000;
      pointer-events: none;
      font-size: 40px;
      line-height: 1;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="crosshair">📍</div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: true, attributionControl: true }).setView([59.9139, 10.7522], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(pos) {
        map.setView([pos.coords.latitude, pos.coords.longitude], 15);
      });
    }

    window.getMapCenter = function() {
      var c = map.getCenter();
      window.ReactNativeWebView.postMessage(JSON.stringify({ lat: c.lat, lng: c.lng }));
    };
  </script>
</body>
</html>`;

export function LocationMapPicker({ visible, onClose, onSelectLocation }: Props) {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const { theme: { colors, spacing, radius, stroke } } = useAppTheme();

  function handleConfirm() {
    webViewRef.current?.injectJavaScript('window.getMapCenter(); true;');
  }

  async function handleMessage(event: WebViewMessageEvent) {
    try {
      const { lat, lng } = JSON.parse(event.nativeEvent.data) as { lat: number; lng: number };
      setIsGeocoding(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'Triploom/1.0' } }
      );
      const data = await response.json() as { display_name?: string };
      onSelectLocation(data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      onClose();
    } catch {
      Alert.alert('Error', 'Could not fetch location. Please try again.');
    } finally {
      setIsGeocoding(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + spacing.sm,
            paddingBottom: spacing.sm,
            paddingHorizontal: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.surface,
            borderBottomWidth: stroke.thin,
            borderBottomColor: colors.border,
          }}>
          <Pressable onPress={onClose} style={{ padding: spacing.xs / 2 }} accessibilityLabel="Close map">
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <AppText variant="subtitle">Pick location</AppText>
          <View style={{ width: 32 }} />
        </View>

        {/* Map */}
        <WebView
          ref={webViewRef}
          source={{ html: MAP_HTML }}
          style={{ flex: 1 }}
          originWhitelist={['*']}
          javaScriptEnabled
          geolocationEnabled
          onMessage={handleMessage}
        />

        {/* Confirm button */}
        <View
          style={{
            paddingBottom: insets.bottom + spacing.md,
            paddingTop: spacing.md,
            paddingHorizontal: spacing.md,
            backgroundColor: colors.surface,
            borderTopWidth: stroke.thin,
            borderTopColor: colors.border,
          }}>
          <AppText variant="caption" tone="muted" style={{ textAlign: 'center', marginBottom: spacing.sm }}>
            Pan the map to position the pin
          </AppText>
          <Pressable
            onPress={handleConfirm}
            disabled={isGeocoding}
            style={{
              backgroundColor: isGeocoding ? colors.textMuted : colors.primary,
              borderRadius: radius.md,
              paddingVertical: spacing.sm,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: spacing.xs,
            }}>
            {isGeocoding ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="checkmark" size={18} color="#fff" />
            )}
            <AppText style={{ color: '#fff', fontWeight: '600' }}>
              {isGeocoding ? 'Getting address…' : 'Confirm location'}
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
