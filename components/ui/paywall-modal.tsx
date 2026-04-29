import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useSubscriptionStore } from '@/store/subscription.store';

const FEATURES = [
  { icon: 'globe-outline' as const, text: 'Organiser ubegrenset antall turer' },
  { icon: 'people-outline' as const, text: 'Inviter deltakere til alle turene dine' },
  { icon: 'calendar-outline' as const, text: 'Hendelser, oppgaver og chat per tur' },
  { icon: 'shield-checkmark-outline' as const, text: 'Prioritert support' },
];

interface PaywallModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubscribed: () => void;
}

const POLL_INTERVAL_MS = 1500;
const POLL_MAX_ATTEMPTS = 10;

export function PaywallModal({ visible, onDismiss, onSubscribed }: PaywallModalProps) {
  const insets = useSafeAreaInsets();
  const { theme: { colors, spacing, radius, typography } } = useAppTheme();
  const { createCheckoutSession, fetchSubscription, isLoading } = useSubscriptionStore();
  const [isOpening, setIsOpening] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  async function pollUntilActive(): Promise<boolean> {
    for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
      await fetchSubscription();
      if (useSubscriptionStore.getState().isActive) return true;
      await new Promise<void>((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
    return false;
  }

  async function handleSubscribe() {
    setIsOpening(true);
    try {
      const url = await createCheckoutSession();
      setIsOpening(false);

      await WebBrowser.openBrowserAsync(url);
      setIsVerifying(true);
      const activated = await pollUntilActive();
      if (activated) {
        onSubscribed();
      } else {
        Alert.alert(
          'Betaling behandles',
          'Betalingen din behandles. Prøv igjen om et øyeblikk.',
        );
      }
    } catch (error) {
      Alert.alert(
        'Feil',
        error instanceof Error ? error.message : 'Noe gikk galt. Prøv igjen.',
      );
    } finally {
      setIsOpening(false);
      setIsVerifying(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          paddingBottom: insets.bottom + spacing.sm,
        }}>
        {/* Header */}
        <View
          style={{
            paddingTop: spacing.md,
            paddingHorizontal: spacing.sm,
            paddingBottom: spacing.sm,
            flexDirection: 'row',
            justifyContent: 'flex-end',
          }}>
          <Pressable
            onPress={onDismiss}
            hitSlop={12}
            style={{
              width: 32,
              height: 32,
              borderRadius: radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surfaceMuted,
            }}>
            <Ionicons name="close" size={18} color={colors.icon} />
          </Pressable>
        </View>

        {/* Icon badge */}
        <View style={{ alignItems: 'center', paddingTop: spacing.md, paddingBottom: spacing.sm }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: radius.full,
              backgroundColor: colors.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="globe" size={36} color={colors.primary} />
          </View>
        </View>

        {/* Heading */}
        <View style={{ paddingHorizontal: spacing.sm, alignItems: 'center', gap: spacing.xs }}>
          <AppText style={{ ...typography.title, textAlign: 'center' }}>
            Triploom Pro
          </AppText>
          <AppText variant="body" tone="muted" style={{ textAlign: 'center' }}>
            Du er allerede organizer i en tur. Oppgrader for å opprette flere.
          </AppText>
        </View>

        {/* Feature list */}
        <View
          style={{
            marginHorizontal: spacing.sm,
            marginTop: spacing.md,
            borderRadius: radius.lg,
            backgroundColor: colors.surface,
            padding: spacing.sm,
            gap: spacing.xs,
          }}>
          {FEATURES.map((feature) => (
            <View
              key={feature.text}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 40 }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: radius.full,
                  backgroundColor: colors.primarySoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons name={feature.icon} size={17} color={colors.primary} />
              </View>
              <AppText variant="body" style={{ flex: 1 }}>{feature.text}</AppText>
            </View>
          ))}
        </View>

        {/* Pricing */}
        <View style={{ alignItems: 'center', paddingTop: spacing.md, paddingHorizontal: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
            <AppText style={{ ...typography.title, fontSize: 36 }}>29</AppText>
            <AppText style={{ ...typography.label, marginBottom: 6 }}>NOK / måned</AppText>
          </View>
          <AppText variant="caption" tone="muted">Avslutt når som helst</AppText>
        </View>

        {/* CTA */}
        <View style={{ paddingHorizontal: spacing.sm, paddingTop: spacing.md, gap: spacing.xs }}>
          <Button
            label="Abonner nå"
            fullWidth
            loading={isLoading || isOpening || isVerifying}
            onPress={() => { void handleSubscribe(); }}
          />
          <Pressable onPress={onDismiss} style={{ alignItems: 'center', padding: spacing.xs }}>
            <AppText variant="caption" tone="muted">Ikke nå</AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
