import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Input } from '@/components/ui/input';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { LocationMapPicker } from '@/components/events/location-map-picker';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
}

export function EventLocationInput({ value, onChangeText, error }: Props) {
  const { theme: { colors, radius, spacing, stroke } } = useAppTheme();
  const [mapVisible, setMapVisible] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  function handleChangeText(text: string) {
    onChangeText(text);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 3) { setSuggestions([]); return; }

    debounceRef.current = setTimeout(() => {
      void (async () => {
        setIsFetching(true);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=5`,
            { headers: { 'Accept-Language': 'en', 'User-Agent': 'Triploom/1.0' } }
          );
          const data = await res.json() as { display_name: string }[];
          setSuggestions(data.map((item) => item.display_name));
        } catch {
          // silently ignore network errors for suggestions
        } finally {
          setIsFetching(false);
        }
      })();
    }, 400);
  }

  function handleSelect(address: string) {
    onChangeText(address);
    setSuggestions([]);
  }

  return (
    <>
      <Input
        label="Location *"
        placeholder="Where is it?"
        value={value}
        onChangeText={handleChangeText}
        error={error}
        rightElement={
          <Pressable
            onPress={() => setMapVisible(true)}
            style={{ paddingHorizontal: spacing.sm }}
            accessibilityLabel="Pick location on map">
            <Ionicons
              name={isFetching ? 'reload-outline' : 'map-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        }
      />

      {suggestions.length > 0 && (
        <View
          style={{
            borderRadius: radius.md,
            borderWidth: stroke.thin,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            overflow: 'hidden',
            marginTop: -spacing.xs,
          }}>
          {suggestions.map((suggestion, index) => (
            <Pressable
              key={index}
              onPress={() => handleSelect(suggestion)}
              style={{
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.sm,
                borderTopWidth: index > 0 ? stroke.thin : 0,
                borderTopColor: colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
              }}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <AppText numberOfLines={2} style={{ flex: 1, fontSize: 13 }}>
                {suggestion}
              </AppText>
            </Pressable>
          ))}
        </View>
      )}

      <LocationMapPicker
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        onSelectLocation={handleSelect}
      />
    </>
  );
}
