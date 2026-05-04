import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { MessageContextMenu } from '@/components/chat/message-context-menu';
import { LocationViewModal } from '@/components/ui/location-view-modal';
import { MessageImageGrid } from '@/components/chat/message-image-grid';
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
  onImagePress?: (imageIndex: number) => void;
}

export function MessageBubble({ message, isOwnMessage, onEdit, onDelete, onImagePress }: Props) {
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

  const avatarInitial = (message.senderName?.trim()?.[0] ?? '?').toUpperCase();

  return (
    <View
      style={[
        styles.container,
        { paddingHorizontal: spacing.sm, paddingVertical: 2 },
        isOwnMessage ? styles.containerOwn : styles.containerOther,
      ]}>
      {!isOwnMessage && (
        <AppText variant="caption" tone="muted" style={styles.sender}>
          {message.senderName ?? 'Unknown'}
        </AppText>
      )}
      <View
        style={[
          styles.messageRow,
          isOwnMessage ? styles.messageRowOwn : styles.messageRowOther,
          { gap: spacing.xs },
        ]}>
        <View
          style={[
            styles.avatar,
            {
              borderRadius: radius.full,
              backgroundColor: isOwnMessage ? colors.primarySoft : colors.surfaceMuted,
            },
          ]}>
          {message.senderAvatarUrl ? (
            <Image source={{ uri: message.senderAvatarUrl }} style={styles.avatarImage} />
          ) : (
            <AppText
              variant="caption"
              style={{
                color: isOwnMessage ? colors.primary : colors.textMuted,
                fontWeight: '700',
              }}>
              {avatarInitial}
            </AppText>
          )}
        </View>
        <View style={[styles.messageColumn, isOwnMessage ? styles.columnOwn : styles.columnOther]}>
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
                  name={message.location!.label === null ? 'navigate' : 'location'}
                  size={16}
                  color={isOwnMessage ? colors.textOnPrimary : colors.primary}
                />
                <AppText
                  style={[
                    styles.content,
                    { color: isOwnMessage ? colors.textOnPrimary : colors.text, fontWeight: '600' },
                  ]}>
                  {message.location!.label === null ? 'My location' : 'Location shared'}
                </AppText>
              </View>
              {message.location!.label !== null ? (
                <AppText
                  variant="caption"
                  numberOfLines={2}
                  style={{ color: isOwnMessage ? colors.textOnPrimary : colors.textMuted }}>
                  {message.location!.label}
                </AppText>
              ) : null}
              <AppText
                variant="caption"
                style={{ color: isOwnMessage ? colors.textOnPrimary : colors.primary, marginTop: 2 }}>
                Tap to open map
              </AppText>
            </View>
          ) : (
            <>
              {!isDeleted && message.images.length > 0 && onImagePress && (
                <View style={styles.imageGrid}>
                  <MessageImageGrid images={message.images} onImagePress={onImagePress} />
                </View>
              )}
              {(isDeleted || message.content) && (
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
            </>
          )}
        </View>
          </Pressable>

          <AppText
            variant="caption"
            tone="muted"
            style={[styles.time, isOwnMessage ? styles.timeOwn : styles.timeOther]}>
            {copied ? 'Copied' : `${formatTime(message.created_at)}${isEdited ? ' · edited' : ''}`}
          </AppText>
        </View>
      </View>

      {isLocation && message.location && (
        <LocationViewModal
          visible={locationModalVisible}
          onClose={() => setLocationModalVisible(false)}
          latitude={message.location.latitude}
          longitude={message.location.longitude}
          label={message.location.label}
        />
      )}

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
    width: '100%',
  },
  containerOwn: {
    alignItems: 'flex-end',
  },
  containerOther: {
    alignItems: 'flex-start',
  },
  messageRow: {
    maxWidth: '86%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageRowOwn: {
    flexDirection: 'row-reverse',
  },
  messageRowOther: {
    flexDirection: 'row',
  },
  messageColumn: {
    flexShrink: 1,
  },
  columnOwn: {
    alignItems: 'flex-end',
  },
  columnOther: {
    alignItems: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  sender: {
    marginBottom: 2,
  },
  bubble: {
    overflow: 'hidden',
  },
  imageGrid: {
    marginBottom: 4,
  },
  locationContent: {
    gap: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  content: {
    fontSize: 16,
    lineHeight: 23,
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
