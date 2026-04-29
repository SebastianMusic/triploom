import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CreateGroupsModal } from '@/components/trip/create-groups-modal';
import { Avatar } from '@/components/ui/avatar';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import type { GroupWithMembers } from '@/services/group.service';
import type { TripParticipantWithProfile } from '@/services/trip.service';
import { useGroupStore } from '@/store/group.store';
import { TripRole } from '@/types';

const ROLE_LABELS: Record<string, string> = {
  [TripRole.Organizer]: 'Organizer',
  [TripRole.CoOrganizer]: 'Co-organizer',
  [TripRole.Participant]: 'Participant',
};

const ROLE_ORDER: Record<string, number> = {
  [TripRole.Organizer]: 0,
  [TripRole.CoOrganizer]: 1,
  [TripRole.Participant]: 2,
};

type Tab = 'people' | 'groups';

type Props = {
  visible: boolean;
  onClose: () => void;
  participants: TripParticipantWithProfile[];
  isOrganizer: boolean;
  tripId: string | null;
  currentParticipantId: string | null;
};

export function PersonsSheet({
  visible,
  onClose,
  participants,
  isOrganizer,
  tripId,
  currentParticipantId,
}: Props) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const {
    theme: { colors, opacity, radius, shadows, spacing, stroke, typography },
  } = useAppTheme();
  const { groups, isLoading: loadingGroups, fetchGroups, joinGroup, leaveGroup, deleteGroup } = useGroupStore();
  const [tab, setTab] = useState<Tab>('people');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const sheetMaxHeight = Math.max(screenHeight - insets.top - spacing.xl, 420);

  useEffect(() => {
    if (!visible) {
      slideAnim.setValue(screenHeight);
      backdropAnim.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    if (tripId) {
      void fetchGroups(tripId);
    }
  }, [backdropAnim, fetchGroups, screenHeight, slideAnim, tripId, visible]);

  const sortedParticipants = useMemo(
    () =>
      [...participants].sort((a, b) => {
        const roleA = ROLE_ORDER[a.role ?? ''] ?? 2;
        const roleB = ROLE_ORDER[b.role ?? ''] ?? 2;
        if (roleA !== roleB) return roleA - roleB;
        return (a.profile?.user_name ?? '').localeCompare(b.profile?.user_name ?? '');
      }),
    [participants],
  );

  const organizerCount = participants.filter((participant) => {
    return participant.role === TripRole.Organizer || participant.role === TripRole.CoOrganizer;
  }).length;

  function isMember(group: GroupWithMembers): boolean {
    if (!currentParticipantId) return false;
    return group.group_membership.some((membership) => membership.participant_id === currentParticipantId);
  }

  function isFull(group: GroupWithMembers): boolean {
    if (!group.max_members) return false;
    return group.group_membership.length >= group.max_members;
  }

  async function handleJoin(group: GroupWithMembers) {
    if (!currentParticipantId) return;
    setActionLoading(group.id);
    try {
      await joinGroup(group.id, currentParticipantId);
    } catch (error) {
      const message =
        error instanceof Error && error.message === 'Group is full'
          ? 'This group is full.'
          : 'Could not join group. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleLeave(group: GroupWithMembers) {
    if (!currentParticipantId) return;
    setActionLoading(group.id);
    try {
      await leaveGroup(group.id, currentParticipantId);
    } catch {
      Alert.alert('Error', 'Could not leave group. Please try again.');
    } finally {
      setActionLoading(null);
    }
  }

  function handleDelete(group: GroupWithMembers) {
    Alert.alert('Delete group', `Delete "${group.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(group.id);
          try {
            await deleteGroup(group.id);
          } catch {
            Alert.alert('Error', 'Could not delete group. Please try again.');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  }

  function closeCreateModal() {
    setCreateModalVisible(false);
  }

  return (
    <>
      <Modal
        transparent
        visible={visible}
        animationType="none"
        onRequestClose={onClose}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Animated.View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              opacity: backdropAnim,
            }}>
            <Pressable
              onPress={onClose}
              style={{
                flex: 1,
                backgroundColor: colors.overlayStrong,
              }}
            />
          </Animated.View>

          <Animated.View
            style={[
              {
                maxHeight: sheetMaxHeight,
                borderTopLeftRadius: radius.xl,
                borderTopRightRadius: radius.xl,
                backgroundColor: colors.background,
                transform: [{ translateY: slideAnim }],
                overflow: 'hidden',
              },
              shadows.lg,
            ]}>
            <View
              style={{
                paddingTop: spacing.sm,
                paddingHorizontal: spacing.md,
                paddingBottom: spacing.md,
                backgroundColor: colors.surface,
                borderBottomWidth: stroke.thin,
                borderBottomColor: colors.border,
                gap: spacing.sm,
              }}>
              <View
                style={{
                  alignSelf: 'center',
                  width: 40,
                  height: 4,
                  borderRadius: radius.full,
                  backgroundColor: colors.borderStrong,
                }}
              />

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: spacing.sm,
                }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText style={typography.subtitle}>People & groups</AppText>
                  <AppText variant="caption" tone="muted">
                    {tab === 'people'
                      ? `${participants.length} participants, ${organizerCount} organizers`
                      : `${groups.length} groups on this trip`}
                  </AppText>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  {tab === 'groups' && isOrganizer ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Create group"
                      onPress={() => setCreateModalVisible(true)}
                      style={({ pressed }) => ({
                        width: 44,
                        height: 44,
                        borderRadius: radius.full,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.primarySoft,
                        opacity: pressed ? opacity.pressed : 1,
                      })}>
                      <Ionicons name="add" size={22} color={colors.primary} />
                    </Pressable>
                  ) : null}

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close people and groups"
                    onPress={onClose}
                    style={({ pressed }) => ({
                      width: 44,
                      height: 44,
                      borderRadius: radius.full,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.surfaceMuted,
                      opacity: pressed ? opacity.pressed : 1,
                    })}>
                    <Ionicons name="close" size={22} color={colors.text} />
                  </Pressable>
                </View>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  borderRadius: radius.full,
                  backgroundColor: colors.surfaceMuted,
                  padding: 4,
                }}>
                {(['people', 'groups'] as Tab[]).map((value) => {
                  const selected = tab === value;
                  return (
                    <Pressable
                      key={value}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setTab(value)}
                      style={({ pressed }) => ({
                        flex: 1,
                        minHeight: 40,
                        borderRadius: radius.full,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: selected ? colors.surface : colors.transparent,
                        opacity: pressed ? opacity.pressed : 1,
                      })}>
                      <AppText
                        variant="caption"
                        style={{ color: selected ? colors.text : colors.textMuted }}>
                        {value === 'people' ? 'People' : 'Groups'}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: spacing.md,
                paddingTop: spacing.md,
                paddingBottom: insets.bottom + spacing.lg,
                gap: spacing.sm,
              }}>
              {tab === 'people' ? (
                <>
                  {sortedParticipants.map((participant) => {
                    const name = participant.profile?.user_name ?? 'Unknown';
                    const roleLabel = participant.role
                      ? (ROLE_LABELS[participant.role] ?? participant.role)
                      : 'Participant';
                    const email = participant.profile?.email ?? null;
                    const phone = participant.profile?.phonenumber ?? null;
                    const avatarSource = participant.profile?.profile_picture_url
                      ? { uri: participant.profile.profile_picture_url }
                      : undefined;

                    return (
                      <View
                        key={participant.id}
                        style={[
                          {
                            borderRadius: radius.lg,
                            backgroundColor: colors.surface,
                            borderWidth: stroke.thin,
                            borderColor: colors.border,
                            padding: spacing.sm,
                            gap: spacing.sm,
                          },
                          shadows.sm,
                        ]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                          <Avatar name={name} size="md" source={avatarSource} />
                          <View style={{ flex: 1, gap: 4 }}>
                            <AppText style={typography.label}>{name}</AppText>
                            <View
                              style={{
                                alignSelf: 'flex-start',
                                paddingHorizontal: spacing.xs,
                                paddingVertical: 4,
                                borderRadius: radius.full,
                                backgroundColor: colors.secondarySoft,
                              }}>
                              <AppText variant="caption" tone="muted">
                                {roleLabel}
                              </AppText>
                            </View>
                          </View>
                        </View>

                        {isOrganizer ? (
                          <View style={{ gap: spacing.xs }}>
                            {email ? (
                              <InfoRow icon="mail-outline" label={email} />
                            ) : null}
                            {phone ? (
                              <InfoRow icon="call-outline" label={phone} />
                            ) : null}
                            {!email && !phone ? (
                              <AppText variant="caption" tone="muted">
                                No contact info available.
                              </AppText>
                            ) : null}
                          </View>
                        ) : null}
                      </View>
                    );
                  })}

                  {sortedParticipants.length === 0 ? (
                    <EmptyState
                      title="No people yet"
                      description="Participants will appear here once they join the trip."
                    />
                  ) : null}
                </>
              ) : loadingGroups ? (
                <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : groups.length === 0 ? (
                <EmptyState
                  title="No groups yet"
                  description={
                    isOrganizer
                      ? 'Create groups to organize rooms, teams, or travel splits.'
                      : 'Groups created by organizers will show up here.'
                  }
                />
              ) : (
                groups.map((group) => {
                  const members = group.group_membership ?? [];
                  const expanded = expandedGroupId === group.id;
                  const joined = isMember(group);
                  const full = isFull(group);
                  const loading = actionLoading === group.id;

                  return (
                    <View
                      key={group.id}
                      style={[
                        {
                          borderRadius: radius.lg,
                          backgroundColor: colors.surface,
                          borderWidth: stroke.thin,
                          borderColor: colors.border,
                          overflow: 'hidden',
                        },
                        shadows.sm,
                      ]}>
                      <Pressable
                        onPress={() => setExpandedGroupId(expanded ? null : group.id)}
                        style={({ pressed }) => ({
                          padding: spacing.sm,
                          gap: spacing.sm,
                          backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
                          opacity: pressed ? opacity.pressed : 1,
                        })}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: spacing.sm,
                          }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                            <View
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: radius.full,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: colors.primarySoft,
                              }}>
                              <Ionicons name="people-outline" size={20} color={colors.primary} />
                            </View>
                            <View style={{ flex: 1, gap: 2 }}>
                              <AppText style={typography.label}>{group.name}</AppText>
                              {group.description ? (
                                <AppText variant="caption" tone="muted">
                                  {group.description}
                                </AppText>
                              ) : null}
                            </View>
                          </View>

                          <View style={{ alignItems: 'flex-end', gap: 2 }}>
                            <AppText variant="caption" tone="muted">
                              {members.length}
                              {group.max_members ? `/${group.max_members}` : ''}
                            </AppText>
                            <Ionicons
                              name={expanded ? 'chevron-up' : 'chevron-down'}
                              size={16}
                              color={colors.textMuted}
                            />
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                          <StatusChip
                            label={joined ? 'You joined' : full ? 'Full' : 'Open'}
                            tone={joined ? 'accent' : full ? 'muted' : 'default'}
                          />
                          <StatusChip
                            label={`${members.length} ${members.length === 1 ? 'member' : 'members'}`}
                            tone="muted"
                          />
                        </View>
                      </Pressable>

                      {expanded ? (
                        <View
                          style={{
                            borderTopWidth: stroke.thin,
                            borderTopColor: colors.border,
                            padding: spacing.sm,
                            gap: spacing.sm,
                          }}>
                          <View style={{ gap: spacing.xs }}>
                            {members.length > 0 ? (
                              members.map((membership) => {
                                const name = membership.trip_participant?.profile?.user_name ?? 'Unknown';
                                return (
                                  <View
                                    key={membership.participant_id}
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      gap: spacing.sm,
                                    }}>
                                    <Avatar name={name} size="sm" />
                                    <AppText style={{ flex: 1 }}>{name}</AppText>
                                  </View>
                                );
                              })
                            ) : (
                              <AppText variant="caption" tone="muted">
                                No members yet.
                              </AppText>
                            )}
                          </View>

                          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                            {loading ? (
                              <View
                                style={{
                                  flex: 1,
                                  minHeight: 44,
                                  borderRadius: radius.full,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: colors.surfaceMuted,
                                }}>
                                <ActivityIndicator size="small" color={colors.primary} />
                              </View>
                            ) : joined ? (
                              <ActionButton
                                label="Leave group"
                                variant="secondary"
                                onPress={() => {
                                  void handleLeave(group);
                                }}
                              />
                            ) : (
                              <ActionButton
                                label={full ? 'Group full' : 'Join group'}
                                variant={full ? 'muted' : 'primary'}
                                disabled={full}
                                onPress={() => {
                                  void handleJoin(group);
                                }}
                              />
                            )}

                            {isOrganizer ? (
                              <ActionButton
                                label="Delete"
                                variant="destructive"
                                onPress={() => handleDelete(group)}
                              />
                            ) : null}
                          </View>
                        </View>
                      ) : null}
                    </View>
                  );
                })
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {createModalVisible && tripId ? (
        <CreateGroupsModal
          visible
          tripId={tripId}
          onClose={closeCreateModal}
          onCreated={() => {
            closeCreateModal();
          }}
        />
      ) : null}
    </>
  );

  function InfoRow({
    icon,
    label,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
  }) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Ionicons name={icon} size={14} color={colors.textMuted} />
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
      </View>
    );
  }

  function StatusChip({
    label,
    tone,
  }: {
    label: string;
    tone: 'default' | 'accent' | 'muted';
  }) {
    const backgroundColor =
      tone === 'accent'
        ? colors.primarySoft
        : tone === 'muted'
          ? colors.surfaceMuted
          : colors.secondarySoft;
    const textColor =
      tone === 'accent'
        ? colors.primary
        : tone === 'muted'
          ? colors.textMuted
          : colors.secondary;

    return (
      <View
        style={{
          paddingHorizontal: spacing.xs,
          paddingVertical: 4,
          borderRadius: radius.full,
          backgroundColor,
        }}>
        <AppText variant="caption" style={{ color: textColor }}>
          {label}
        </AppText>
      </View>
    );
  }

  function ActionButton({
    label,
    variant,
    disabled = false,
    onPress,
  }: {
    label: string;
    variant: 'primary' | 'secondary' | 'muted' | 'destructive';
    disabled?: boolean;
    onPress: () => void;
  }) {
    const backgroundColor =
      variant === 'primary'
        ? colors.primary
        : variant === 'secondary'
          ? colors.surface
          : variant === 'destructive'
            ? colors.surface
            : colors.surfaceMuted;
    const borderColor =
      variant === 'secondary'
        ? colors.border
        : variant === 'destructive'
          ? colors.error
          : colors.transparent;
    const textColor =
      variant === 'primary'
        ? colors.textOnPrimary
        : variant === 'destructive'
          ? colors.error
          : variant === 'muted'
            ? colors.textMuted
            : colors.text;

    return (
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => ({
          flex: 1,
          minHeight: 44,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.sm,
          backgroundColor,
          borderWidth: variant === 'secondary' || variant === 'destructive' ? stroke.thin : 0,
          borderColor,
          opacity: disabled ? opacity.disabled : pressed ? opacity.pressed : 1,
        })}>
        <AppText variant="caption" style={{ color: textColor }}>
          {label}
        </AppText>
      </Pressable>
    );
  }

  function EmptyState({
    title,
    description,
  }: {
    title: string;
    description: string;
  }) {
    return (
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.xl,
          paddingHorizontal: spacing.md,
          gap: spacing.xs,
        }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: radius.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.surfaceMuted,
          }}>
          <Ionicons name="people-outline" size={24} color={colors.icon} />
        </View>
        <AppText style={typography.label}>{title}</AppText>
        <AppText variant="caption" tone="muted" style={{ textAlign: 'center' }}>
          {description}
        </AppText>
      </View>
    );
  }
}
