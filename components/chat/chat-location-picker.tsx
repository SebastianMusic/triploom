import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';

import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { ANDROID_MAP_HTML, getLastKnownLocation, reverseGeocode } from '@/hooks/use-location';

export type PickedLocation = {
  lat: number;
  lng: number;
  label: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: PickedLocation) => void;
};

const OSLO = { latitude: 59.9139, longitude: 10.7522 };

function IOSMapPicker({ onClose, onSelectLocation }: Omit<Props, 'visible'>) {
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
    const label = await reverseGeocode(latitude, longitude);
    setIsGeocoding(false);
    onSelectLocation({ lat: latitude, lng: longitude, label });
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
        <Pressable onPress={onClose} style={{ padding: spacing.xs / 2 }} accessibilityLabel="Lukk kart">
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="subtitle">Velg posisjon</AppText>
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
            {isGeocoding ? 'Henter adresse…' : 'Bekreft posisjon'}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function AndroidMapPicker({ onClose, onSelectLocation }: Omit<Props, 'visible'>) {
  const insets = useSafeAreaInsets();
  const { theme: { colors, spacing, radius } } = useAppTheme();
  const webViewRef = useRef<WebView>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  function handleConfirm() {
    webViewRef.current?.injectJavaScript('window.getMapCenter(); true;');
  }

  async function handleMessage(event: WebViewMessageEvent) {
    try {
      const { lat, lng } = JSON.parse(event.nativeEvent.data) as { lat: number; lng: number };
      setIsGeocoding(true);
      const label = await reverseGeocode(lat, lng);
      onSelectLocation({ lat, lng, label });
    } catch {
      Alert.alert('Feil', 'Kunne ikke hente adresse. Prøv igjen.');
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
        <Pressable onPress={onClose} style={{ padding: spacing.xs / 2 }} accessibilityLabel="Lukk kart">
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="subtitle">Velg posisjon</AppText>
        <View style={{ width: 32 }} />
      </View>

      <WebView
        ref={webViewRef}
        source={{ html: ANDROID_MAP_HTML }}
        style={{ flex: 1 }}
        originWhitelist={['*']}
        javaScriptEnabled
        geolocationEnabled
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
            {isGeocoding ? 'Henter adresse…' : 'Bekreft posisjon'}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

export function ChatLocationMapPicker({ visible, onClose, onSelectLocation }: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {Platform.OS === 'ios'
        ? <IOSMapPicker onClose={onClose} onSelectLocation={onSelectLocation} />
        : <AndroidMapPicker onClose={onClose} onSelectLocation={onSelectLocation} />}
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
