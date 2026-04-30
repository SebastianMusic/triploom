import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';

type AppDateTimePickerMode = 'date' | 'datetime';
type NativePickerStep = 'date' | 'time';

type AppDateTimePickerProps = {
  visible: boolean;
  value: Date;
  mode?: AppDateTimePickerMode;
  minimumDate?: Date;
  title?: string;
  onConfirm: (value: Date) => void;
  onClose: () => void;
};

type DateTimeFieldProps = {
  label?: string;
  value: string;
  placeholder: string;
  active: boolean;
  error?: string;
  onPress: () => void;
  onClear?: () => void;
};

export function DateTimeField({
  label,
  value,
  placeholder,
  active,
  error,
  onPress,
  onClear,
}: DateTimeFieldProps) {
  const {
    theme: { colors, opacity, radius, sizes, spacing },
  } = useAppTheme();

  return (
    <View style={{ gap: spacing.xs }}>
      {label ? <AppText variant="caption">{label}</AppText> : null}
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => ({
          minHeight: sizes.input.md,
          borderRadius: radius.md,
          backgroundColor: colors.surfaceMuted,
          paddingHorizontal: spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: pressed ? opacity.pressed : 1,
        })}>
        <AppText
          numberOfLines={1}
          style={{ flex: 1, color: active ? colors.text : colors.textMuted }}>
          {active ? value : placeholder}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          {active && onClear ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={(event) => {
                event.stopPropagation();
                onClear();
              }}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
          <Ionicons name="calendar-outline" size={18} color={colors.icon} />
        </View>
      </Pressable>
      {error ? (
        <AppText variant="caption" tone="error">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

export function AppDateTimePicker({
  visible,
  value,
  mode = 'date',
  minimumDate,
  title,
  onConfirm,
  onClose,
}: AppDateTimePickerProps) {
  const [tempDate, setTempDate] = useState(value);
  const [step, setStep] = useState<NativePickerStep>('date');
  const {
    theme: { colors, radius, shadows, spacing },
  } = useAppTheme();

  useEffect(() => {
    if (!visible) return;
    setTempDate(value);
    setStep('date');
  }, [value, visible]);

  function commitDate(nextValue: Date) {
    onConfirm(nextValue);
    onClose();
  }

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    if (event.type === 'dismissed' || !selected) {
      onClose();
      return;
    }

    if (Platform.OS === 'android') {
      if (mode === 'date') {
        commitDate(selected);
        return;
      }

      if (step === 'date') {
        setTempDate(selected);
        setStep('time');
        return;
      }

      const combined = new Date(tempDate);
      combined.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      commitDate(combined);
      return;
    }

    setTempDate(selected);
  }

  function handleIosConfirm() {
    if (mode === 'date') {
      commitDate(tempDate);
      return;
    }

    if (step === 'date') {
      setStep('time');
      return;
    }

    commitDate(tempDate);
  }

  if (!visible) return null;

  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        value={tempDate}
        mode={mode === 'date' ? 'date' : step}
        display="default"
        minimumDate={minimumDate}
        onChange={handleChange}
      />
    );
  }

  const isDateStep = mode === 'date' || step === 'date';

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: colors.overlayStrong, justifyContent: 'flex-end' }}
        onPress={onClose}>
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={[
            {
              borderTopLeftRadius: radius.lg,
              borderTopRightRadius: radius.lg,
              backgroundColor: colors.surface,
              paddingTop: spacing.sm,
              paddingBottom: spacing.sm,
            },
            shadows.lg,
          ]}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: spacing.md,
              paddingBottom: spacing.xs,
            }}>
            <Pressable onPress={onClose}>
              <AppText tone="primary">Cancel</AppText>
            </Pressable>
            <AppText variant="subtitle">
              {title ?? (isDateStep ? 'Select date' : 'Select time')}
            </AppText>
            <Pressable onPress={handleIosConfirm}>
              <AppText tone="primary">{mode === 'datetime' && step === 'date' ? 'Next' : 'Done'}</AppText>
            </Pressable>
          </View>
          <DateTimePicker
            value={tempDate}
            mode={mode === 'date' ? 'date' : step}
            display="spinner"
            minimumDate={minimumDate}
            onChange={handleChange}
            style={{ height: 200 }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
