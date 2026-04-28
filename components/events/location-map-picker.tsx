import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';

import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { ANDROID_MAP_HTML, getLastKnownLocation, requestLocationForMap, reverseGeocode } from '@/hooks/use-location';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (address: string) => void;
};

const OSLO = { latitude: 59.9139, longitude: 10.7522 };

function IOSPicker({ onClose, onSelectLocation }: Omit<Props, 'visible'>) {
  const insets = useSafeAreaInsets();
  const { theme: { colors, spacing, radius } } = useAppTheme();
  const mapRef = useRef<MapView>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const regionRef = useRef<Region>({
    latitude: OSLO.latitude,
    longitude: OSLO.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    getLastKnownLocation().then((coords) => {
      if (!coords) return;
      const region = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      regionRef.current = region;
      mapRef.current?.animateToRegion(region, 300);
    }).catch(() => {});
  }, []);

  async function handleConfirm() {
    const { latitude, longitude } = regionRef.current;
    setIsGeocoding(true);
    const address = await reverseGeocode(latitude, longitude);
    setIsGeocoding(false);
    onSelectLocation(address);
    onClose();
  }

  return (
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
        <Pressable onPress={onClose} style={{ padding: spacing.xs / 2 }} accessibilityLabel="Close map">
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="subtitle">Pick location</AppText>
        <View style={{ width: 32 }} />
      </View>

      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={regionRef.current}
          onRegionChangeComplete={(r) => { regionRef.current = r; }}
          pitchEnabled={false}
          rotateEnabled={false}
        />
        <View style={styles.crosshairContainer} pointerEvents="none">
          <Ionicons name="location" size={40} color={colors.primary} style={styles.crosshairIcon} />
        </View>
      </View>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + spacing.md,
            paddingTop: spacing.md,
            paddingHorizontal: spacing.md,
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}>
        <AppText variant="caption" tone="muted" style={{ textAlign: 'center', marginBottom: spacing.sm }}>
          Flytt kartet for å plassere pinen
        </AppText>
        <Pressable
          onPress={handleConfirm}
          disabled={isGeocoding}
          style={[
            styles.confirmButton,
            {
              backgroundColor: isGeocoding ? colors.textMuted : colors.primary,
              borderRadius: radius.md,
              paddingVertical: spacing.sm,
            },
          ]}>
          {isGeocoding
            ? <ActivityIndicator color="#fff" size="small" />
            : <Ionicons name="checkmark" size={18} color="#fff" />}
          <AppText style={{ color: '#fff', fontWeight: '600' }}>
            {isGeocoding ? 'Fetching address…' : 'Confirm location'}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function AndroidPicker({ onClose, onSelectLocation }: Omit<Props, 'visible'>) {
  const insets = useSafeAreaInsets();
  const { theme: { colors, spacing, radius } } = useAppTheme();
  const webViewRef = useRef<WebView>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  async function handleLoadEnd() {
    const coords = await requestLocationForMap();
    if (coords) {
      webViewRef.current?.injectJavaScript(
        `window.setCenter(${coords.latitude}, ${coords.longitude}); true;`
      );
    }
  }

  function handleConfirm() {
    webViewRef.current?.injectJavaScript('window.getMapCenter(); true;');
  }

  async function handleMessage(event: WebViewMessageEvent) {
    try {
      const { lat, lng } = JSON.parse(event.nativeEvent.data) as { lat: number; lng: number };
      setIsGeocoding(true);
      const address = await reverseGeocode(lat, lng);
      onSelectLocation(address);
      onClose();
    } catch {
      Alert.alert('Error', 'Could not fetch location. Please try again.');
    } finally {
      setIsGeocoding(false);
    }
  }

  return (
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
        <Pressable onPress={onClose} style={{ padding: spacing.xs / 2 }} accessibilityLabel="Close map">
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="subtitle">Pick location</AppText>
        <View style={{ width: 32 }} />
      </View>

      <WebView
        ref={webViewRef}
        source={{ html: ANDROID_MAP_HTML }}
        style={{ flex: 1 }}
        originWhitelist={['*']}
        javaScriptEnabled
        onLoadEnd={handleLoadEnd}
        onMessage={handleMessage}
      />

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + spacing.md,
            paddingTop: spacing.md,
            paddingHorizontal: spacing.md,
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}>
        <AppText variant="caption" tone="muted" style={{ textAlign: 'center', marginBottom: spacing.sm }}>
          Flytt kartet for å plassere pinen
        </AppText>
        <Pressable
          onPress={handleConfirm}
          disabled={isGeocoding}
          style={[
            styles.confirmButton,
            {
              backgroundColor: isGeocoding ? colors.textMuted : colors.primary,
              borderRadius: radius.md,
              paddingVertical: spacing.sm,
            },
          ]}>
          {isGeocoding
            ? <ActivityIndicator color="#fff" size="small" />
            : <Ionicons name="checkmark" size={18} color="#fff" />}
          <AppText style={{ color: '#fff', fontWeight: '600' }}>
            {isGeocoding ? 'Fetching address…' : 'Confirm location'}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

export function LocationMapPicker({ visible, onClose, onSelectLocation }: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {Platform.OS === 'ios'
        ? <IOSPicker onClose={onClose} onSelectLocation={onSelectLocation} />
        : <AndroidPicker onClose={onClose} onSelectLocation={onSelectLocation} />}
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
  crosshairContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshairIcon: {
    marginBottom: 36,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
