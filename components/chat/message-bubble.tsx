import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { MessageContextMenu } from '@/components/chat/message-context-menu';
import { LocationViewModal } from '@/components/ui/location-view-modal';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import type { MessageWithSender } from '@/types';

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

interface Props {
  message: MessageWithSender;
  isOwnMessage: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MessageBubble({ message, isOwnMessage, onEdit, onDelete }: Props) {
  const {
    theme: { colors, radius, spacing },
  } = useAppTheme();
  const [copied, setCopied] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const isDeleted = !!message.deleted_at;
  const isEdited = !isDeleted && !!message.updated_at;
  const isLocation = message.type === 'location' && !!message.location && !isDeleted;

  async function handleCopy() {
    if (!message.content) return;
    await Clipboard.setStringAsync(message.content);
    setCopied(true);
    setMenuVisible(false);
  }

  function handleLongPress() {
    if (isDeleted) return;
    if (isOwnMessage && onEdit && onDelete) {
      setMenuVisible(true);
    } else {
      handleCopy();
    }
  }

  return (
    <View
      style={[
        styles.container,
        { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs / 2 },
        isOwnMessage ? styles.containerOwn : styles.containerOther,
      ]}>
      {!isOwnMessage && (
        <AppText variant="caption" tone="muted" style={styles.sender}>
          {message.senderName ?? 'Unknown'}
        </AppText>
      )}
      <Pressable
        onLongPress={handleLongPress}
        onPress={isLocation ? () => setLocationModalVisible(true) : undefined}
        delayLongPress={400}>
        <View
          style={[
            styles.bubble,
            {
              borderRadius: radius.md,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              backgroundColor: isDeleted
                ? colors.surfaceMuted
                : isLocation
                  ? isOwnMessage ? colors.primary : colors.surface
                  : isOwnMessage ? colors.primary : colors.surfaceMuted,
              borderWidth: isLocation && !isOwnMessage ? StyleSheet.hairlineWidth : 0,
              borderColor: colors.border,
            },
            isOwnMessage ? { borderBottomRightRadius: radius.sm / 2 } : { borderBottomLeftRadius: radius.sm / 2 },
          ]}>
          {isLocation ? (
            <View style={[styles.locationContent, { gap: spacing.xs / 2 }]}>
              <View style={styles.locationRow}>
                <Ionicons
                  name="location"
                  size={16}
                  color={isOwnMessage ? colors.textOnPrimary : colors.primary}
                />
                <AppText
                  style={[
                    styles.content,
                    { color: isOwnMessage ? colors.textOnPrimary : colors.text, fontWeight: '600' },
                  ]}>
                  Posisjon delt
                </AppText>
              </View>
              {message.location?.label ? (
                <AppText
                  variant="caption"
                  numberOfLines={2}
                  style={{ color: isOwnMessage ? colors.textOnPrimary : colors.textMuted }}>
                  {message.location.label}
                </AppText>
              ) : null}
              <AppText
                variant="caption"
                style={{ color: isOwnMessage ? colors.textOnPrimary : colors.primary, marginTop: 2 }}>
                Trykk for å åpne
              </AppText>
            </View>
          ) : (
            <AppText
              style={[
                styles.content,
                isDeleted
                  ? { color: colors.textMuted, fontStyle: 'italic' }
                  : { color: isOwnMessage ? colors.textOnPrimary : colors.text },
              ]}>
              {isDeleted ? 'This message was deleted' : message.content}
            </AppText>
          )}
        </View>
      </Pressable>

      {isLocation && message.location && (
        <LocationViewModal
          visible={locationModalVisible}
          onClose={() => setLocationModalVisible(false)}
          latitude={message.location.latitude}
          longitude={message.location.longitude}
          label={message.location.label}
        />
      )}
      <AppText
        variant="caption"
        tone="muted"
        style={[styles.time, isOwnMessage ? styles.timeOwn : styles.timeOther]}>
        {copied ? 'Copied' : `${formatTime(message.created_at)}${isEdited ? ' · edited' : ''}`}
      </AppText>

      {isOwnMessage && onEdit && onDelete && !isDeleted && (
        <MessageContextMenu
          visible={menuVisible}
          onEdit={() => { setMenuVisible(false); onEdit(); }}
          onDelete={() => { setMenuVisible(false); onDelete(); }}
          onCopy={handleCopy}
          onDismiss={() => setMenuVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '75%',
  },
  containerOwn: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  containerOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  sender: {
    marginBottom: 2,
  },
  bubble: {},
  locationContent: {
    gap: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  content: {
    fontSize: 15,
    lineHeight: 21,
  },
  time: {
    marginTop: 2,
  },
  timeOwn: {
    textAlign: 'right',
  },
  timeOther: {
    textAlign: 'left',
  },
});
