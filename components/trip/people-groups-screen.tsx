import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';

import { useTripChromeInsets } from '@/components/layout/use-trip-chrome';
import { ParticipantActionSheet } from '@/components/participant-ui/participant-action-sheet';
import { CreateGroupsModal } from '@/components/trip/create-groups-modal';
import { EditGroupModal } from '@/components/trip/edit-group-modal';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { IconButton } from '@/components/ui/icon-button';
import { Stack } from '@/components/ui/stack';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useGroupStore } from '@/store/group.store';
import type { TripParticipantWithProfile } from '@/services/trip.service';
import type { GroupWithMembers } from '@/services/group.service';
import { TripRole } from '@/types';

type Tab = 'members' | 'groups';

type Props = {
  tripId: string | null;
  currentParticipantId: string | null;
  participants: TripParticipantWithProfile[];
  canManage: boolean;
  actorUserId: string | null;
  actorRole: string | null;
};

const ROLE_LABELS: Record<string, string> = {
  [TripRole.Organizer]: 'Organizer',
  [TripRole.CoOrganizer]: 'Co-organizer',
  [TripRole.Participant]: 'Member',
};

const ROLE_ORDER: Record<string, number> = {
  [TripRole.Organizer]: 0,
  [TripRole.CoOrganizer]: 1,
  [TripRole.Participant]: 2,
};

export function PeopleGroupsScreen({
  tripId,
  currentParticipantId,
  participants,
  canManage,
  actorUserId,
  actorRole,
}: Props) {
  const { headerContentOffset, safeAreaInsets } = useTripChromeInsets();
  const {
    theme: { colors, opacity, radius, shadows, spacing, stroke, typography },
  } = useAppTheme();
  const groups = useGroupStore((state) => state.groups);
  const isLoadingGroups = useGroupStore((state) => state.isLoading);
  const isMutatingGroup = useGroupStore((state) => state.isMutating);
  const fetchGroups = useGroupStore((state) => state.fetchGroups);
  const clearGroups = useGroupStore((state) => state.clearGroups);
  const joinTripGroup = useGroupStore((state) => state.joinGroup);
  const leaveTripGroup = useGroupStore((state) => state.leaveGroup);
  const deleteTripGroup = useGroupStore((state) => state.deleteGroup);

  const [tab, setTab] = useState<Tab>('members');
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [pendingGroupId, setPendingGroupId] = useState<string | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupWithMembers | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<TripParticipantWithProfile | null>(null);
  const [tabWidth, setTabWidth] = useState(0);
  const sliderTranslate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!tripId) {
      clearGroups();
      return;
    }

    fetchGroups(tripId).catch(() => undefined);

    return () => {
      clearGroups();
    };
  }, [clearGroups, fetchGroups, tripId]);

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

  useEffect(() => {
    if (!tabWidth) return;
    Animated.timing(sliderTranslate, {
      toValue: tab === 'members' ? 0 : tabWidth / 2,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [sliderTranslate, tab, tabWidth]);

  async function handleRefresh() {
    if (!tripId) return;
    await fetchGroups(tripId);
  }

  async function handleJoin(groupId: string) {
    if (!currentParticipantId) return;
    setPendingGroupId(groupId);
    try {
      await joinTripGroup(groupId, currentParticipantId);
    } catch (error) {
      Alert.alert(
        'Could not join group',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setPendingGroupId(null);
    }
  }

  async function handleLeave(groupId: string) {
    if (!currentParticipantId) return;
    setPendingGroupId(groupId);
    try {
      await leaveTripGroup(groupId, currentParticipantId);
    } catch {
      Alert.alert('Could not leave group', 'Please try again.');
    } finally {
      setPendingGroupId(null);
    }
  }

  function handleManageGroup(group: GroupWithMembers) {
    Alert.alert(group.name ?? 'Group', 'Choose an action', [
      {
        text: 'Edit',
        onPress: () => setEditingGroup(group),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Delete group', `Delete "${group.name}"? This cannot be undone.`, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                setPendingGroupId(group.id);
                try {
                  await deleteTripGroup(group.id);
                } catch {
                  Alert.alert('Could not delete group', 'Please try again.');
                } finally {
                  setPendingGroupId(null);
                }
              },
            },
          ]);
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  }

  function isMember(group: GroupWithMembers) {
    if (!currentParticipantId) return false;
    return group.group_membership.some((membership) => membership.participant_id === currentParticipantId);
  }

  function isFull(group: GroupWithMembers) {
    if (!group.max_members) return false;
    return group.group_membership.length >= group.max_members;
  }

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            tintColor={colors.primary}
            colors={[colors.primary]}
            refreshing={isLoadingGroups && !groups.length}
            onRefresh={() => {
              void handleRefresh();
            }}
          />
        }
        contentContainerStyle={{
          paddingTop: headerContentOffset,
          paddingBottom: safeAreaInsets.bottom + spacing.lg,
        }}>
        <Container>
        <Stack space="sm">
        <Card
          variant="elevated"
          style={{
            gap: spacing.sm,
            backgroundColor: colors.surface,
            borderWidth: stroke.thin,
            borderColor: colors.border,
          }}>
          <View style={{ gap: spacing.xs }}>
            <AppText style={typography.subtitle}>Members & groups</AppText>
            <AppText variant="caption" tone="muted">
              Keep an overview of members, organizers, and group assignments for this trip.
            </AppText>
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <StatPill label="Members" value={participants.length} />
            <StatPill label="Organizers" value={organizerCount} />
            <StatPill label="Groups" value={groups.length} />
          </View>
        </Card>

        <View
          onLayout={(event) => setTabWidth(event.nativeEvent.layout.width)}
          style={{
            position: 'relative',
            flexDirection: 'row',
            borderRadius: radius.full,
            backgroundColor: colors.surfaceMuted,
            padding: 4,
            overflow: 'hidden',
          }}>
          {tabWidth ? (
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 4,
                bottom: 4,
                left: 4,
                width: Math.max(tabWidth / 2 - 4, 0),
                borderRadius: radius.full,
                backgroundColor: colors.surface,
                transform: [{ translateX: sliderTranslate }],
              }}
            />
          ) : null}
          {(['members', 'groups'] as Tab[]).map((value) => {
            const selected = tab === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setTab(value)}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 44,
                  borderRadius: radius.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.transparent,
                  opacity: pressed ? opacity.pressed : 1,
                })}>
                <AppText
                  variant="caption"
                  style={{ color: selected ? colors.text : colors.textMuted }}>
                  {value === 'members' ? 'Members' : 'Groups'}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {tab === 'members' ? (
          <>
            {sortedParticipants.length === 0 ? (
              <EmptyState
                title="No members yet"
                description="Members will show up here as soon as they join the trip."
              />
            ) : (
              <Card
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  borderWidth: stroke.thin,
                  borderColor: colors.border,
                }}>
                {sortedParticipants.map((participant, index) => {
                  const name = participant.profile?.user_name ?? 'Unknown';
                  const roleLabel = participant.role
                    ? (ROLE_LABELS[participant.role] ?? participant.role)
                    : 'Member';
                  const avatarSource = participant.profile?.profile_picture_url
                    ? { uri: participant.profile.profile_picture_url }
                    : undefined;
                  const phone = canManage ? participant.profile?.phonenumber : null;
                  const email = canManage ? participant.profile?.email : null;
                  const isSelf = participant.id === currentParticipantId;
                  const isOrganizerTarget = participant.role === TripRole.Organizer;
                  const canOpenActions =
                    canManage &&
                    !isSelf &&
                    !(
                      actorRole === TripRole.CoOrganizer &&
                      isOrganizerTarget
                    );

                  return (
                    <Pressable
                      key={participant.id}
                      disabled={!canOpenActions}
                      onPress={() => setSelectedParticipant(participant)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.sm,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: spacing.sm - spacing.xs / 2,
                        borderBottomWidth: index === sortedParticipants.length - 1 ? 0 : stroke.thin,
                        borderBottomColor: colors.border,
                        backgroundColor: pressed && canOpenActions ? colors.surfaceMuted : colors.surface,
                        opacity: !canOpenActions && !canManage ? 1 : !canOpenActions ? opacity.disabled : 1,
                      })}>
                      <Avatar name={name} size="sm" source={avatarSource} />
                      <View style={{ flex: 1, gap: 2 }}>
                            <AppText numberOfLines={1} style={typography.label}>
                              {name}
                            </AppText>
                            <AppText variant="caption" tone="muted" numberOfLines={1}>
                              {roleLabel === 'Participant' ? 'Member' : roleLabel}
                            </AppText>
                          </View>
                      <View style={{ flexShrink: 1, alignItems: 'flex-end', gap: 2, minWidth: '42%' }}>
                        {phone ? (
                          <AppText variant="caption" tone="muted" numberOfLines={1}>
                            {phone}
                          </AppText>
                        ) : null}
                        {email ? (
                          <AppText variant="caption" tone="muted" numberOfLines={1}>
                            {email}
                          </AppText>
                        ) : !phone ? (
                          <AppText variant="caption" tone="muted" numberOfLines={1}>
                            No contact info
                          </AppText>
                        ) : null}
                      </View>
                      {canOpenActions ? (
                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </Card>
            )}
          </>
        ) : (
          <>
            {canManage ? (
              <Card
                variant="elevated"
                style={{
                  gap: spacing.sm,
                  backgroundColor: colors.surface,
                  borderWidth: stroke.thin,
                  borderColor: colors.border,
                }}>
                <View style={{ gap: spacing.xs }}>
                  <AppText style={typography.label}>Create and manage groups</AppText>
                  <AppText variant="caption" tone="muted">
                    Set up cabins, teams, rides, or any other split for the trip.
                  </AppText>
                </View>
                <Button
                  label="Create group"
                  onPress={() => setCreateModalVisible(true)}
                />
              </Card>
            ) : null}

            {isLoadingGroups && groups.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : groups.length === 0 ? (
              <EmptyState
                title="No groups yet"
                description={
                  canManage
                    ? 'Create the first group to start organizing members.'
                    : 'Groups created by trip organizers will show up here.'
                }
              />
            ) : (
              groups.map((group) => {
                const expanded = expandedGroupId === group.id;
                const joined = isMember(group);
                const full = isFull(group);
                const loading = pendingGroupId === group.id && isMutatingGroup;
                const statusTone: 'success' | 'warning' | 'error' = joined
                  ? 'warning'
                  : full
                    ? 'error'
                    : 'success';

                return (
                  <Card
                    key={group.id}
                    style={{
                      padding: 0,
                      overflow: 'hidden',
                      borderWidth: stroke.thin,
                      borderColor: colors.border,
                    }}>
                    <Pressable
                      onPress={() => setExpandedGroupId(expanded ? null : group.id)}
                      style={({ pressed }) => ({
                        padding: spacing.sm,
                        gap: spacing.xs,
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
                            style={[
                              {
                                width: 40,
                                height: 40,
                                borderRadius: radius.full,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: colors.primarySoft,
                              },
                              shadows.sm,
                            ]}>
                            <Ionicons name="people-outline" size={20} color={colors.primary} />
                          </View>
                          <View style={{ flex: 1, gap: 4 }}>
                            <AppText style={typography.label}>{group.name}</AppText>
                            {group.description ? (
                              <AppText variant="caption" tone="muted">
                                {group.description}
                              </AppText>
                            ) : (
                              <AppText variant="caption" tone="muted">
                                {group.group_membership.length} members
                                {group.max_members ? ` of ${group.max_members}` : ''}
                              </AppText>
                            )}
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                          {canManage ? (
                            <IconButton
                              accessibilityLabel={`Manage ${group.name}`}
                              variant="ghost"
                              icon={<Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />}
                              onPress={() => handleManageGroup(group)}
                            />
                          ) : null}
                          <Ionicons
                            name={expanded ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color={colors.textMuted}
                          />
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                        <Chip
                          label={joined ? 'Joined' : full ? 'Full' : 'Open'}
                          variant={statusTone}
                        />
                        <Chip
                          label={`${group.group_membership.length}${group.max_members ? `/${group.max_members}` : ''} members`}
                          variant="muted"
                        />
                      </View>
                    </Pressable>

                    {expanded ? (
                      <View
                        style={{
                          borderTopWidth: stroke.thin,
                          borderTopColor: colors.border,
                          padding: spacing.md,
                          gap: spacing.sm,
                          backgroundColor: colors.surfaceMuted,
                        }}>
                        <View style={{ gap: spacing.xs }}>
                          {group.group_membership.length > 0 ? (
                            group.group_membership.map((membership) => {
                              const name = membership.trip_participant?.profile?.user_name ?? 'Unknown';
                              const roleLabel = membership.trip_participant?.role
                                ? (ROLE_LABELS[membership.trip_participant.role] ?? membership.trip_participant.role)
                                : 'Member';
                              const avatarSource = membership.trip_participant?.profile?.profile_picture_url
                                ? { uri: membership.trip_participant.profile.profile_picture_url }
                                : undefined;

                              return (
                                <View
                                  key={membership.participant_id}
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: spacing.sm,
                                    borderRadius: radius.lg,
                                    backgroundColor: colors.surface,
                                    paddingHorizontal: spacing.md,
                                    paddingVertical: spacing.sm,
                                  }}>
                                  <Avatar name={name} size="sm" source={avatarSource} />
                                  <View style={{ flex: 1 }}>
                                    <AppText>{name}</AppText>
                                    <AppText variant="caption" tone="muted">
                                      {roleLabel === 'Participant' ? 'Member' : roleLabel}
                                    </AppText>
                                  </View>
                                </View>
                              );
                            })
                          ) : (
                            <AppText variant="caption" tone="muted">
                              No members yet.
                            </AppText>
                          )}
                        </View>

                        {loading ? (
                          <View
                            style={{
                              minHeight: 48,
                              borderRadius: radius.full,
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: colors.surface,
                            }}>
                            <ActivityIndicator color={colors.primary} />
                          </View>
                        ) : joined ? (
                          <Button
                            label="Leave group"
                            variant="secondary"
                            onPress={() => {
                              void handleLeave(group.id);
                            }}
                          />
                        ) : (
                          <Button
                            label={full ? 'Group full' : 'Join group'}
                            variant={full ? 'secondary' : 'primary'}
                            disabled={full}
                            onPress={() => {
                              void handleJoin(group.id);
                            }}
                          />
                        )}
                      </View>
                    ) : null}
                  </Card>
                );
              })
            )}
          </>
        )}
        </Stack>
        </Container>
      </ScrollView>

      {tripId ? (
        <CreateGroupsModal
          visible={createModalVisible}
          tripId={tripId}
          onClose={() => setCreateModalVisible(false)}
          onCreated={() => setCreateModalVisible(false)}
        />
      ) : null}

      {editingGroup ? (
        <EditGroupModal
          visible
          group={editingGroup}
          onClose={() => setEditingGroup(null)}
          onUpdated={() => setEditingGroup(null)}
        />
      ) : null}

      {selectedParticipant && tripId && actorUserId && actorRole ? (
        <ParticipantActionSheet
          target={selectedParticipant}
          actorUserId={actorUserId}
          actorRole={actorRole}
          tripId={tripId}
          onClose={() => setSelectedParticipant(null)}
        />
      ) : null}
    </>
  );

  function StatPill({ label, value }: { label: string; value: number }) {
    return (
      <View
        style={{
          flex: 1,
          borderRadius: radius.lg,
          backgroundColor: colors.surfaceMuted,
          paddingVertical: spacing.xs + 2,
          paddingHorizontal: spacing.sm,
          gap: 2,
        }}>
        <AppText style={typography.label}>{value}</AppText>
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
      </View>
    );
  }

  function Chip({
    label,
    variant,
  }: {
    label: string;
    variant: 'muted' | 'success' | 'warning' | 'error';
  }) {
    const backgroundColor =
      variant === 'success'
        ? colors.successSoft
        : variant === 'warning'
          ? colors.warningSoft
          : variant === 'error'
            ? colors.errorSoft
            : colors.surfaceMuted;
    const textColor =
      variant === 'success'
        ? colors.success
        : variant === 'warning'
          ? colors.warning
          : variant === 'error'
            ? colors.error
            : colors.textMuted;

    const borderColor =
      variant === 'success'
        ? colors.primary
        : variant === 'warning'
          ? colors.warning
          : variant === 'error'
            ? colors.error
            : colors.border;
    const borderWidth = variant === 'error' || variant === 'muted' ? stroke.thin : stroke.none;

    return (
      <View
        style={{
          borderRadius: radius.full,
          backgroundColor,
          borderWidth,
          borderColor,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs - 2,
        }}>
        <AppText variant="caption" style={{ color: textColor }}>
          {label}
        </AppText>
      </View>
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
      <Card
        style={{
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: colors.surfaceMuted,
        }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: radius.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.surface,
          }}>
          <Ionicons name="people-outline" size={24} color={colors.icon} />
        </View>
        <View style={{ gap: spacing.xs / 2, alignItems: 'center' }}>
          <AppText style={typography.label}>{title}</AppText>
          <AppText variant="caption" tone="muted" style={{ textAlign: 'center' }}>
            {description}
          </AppText>
        </View>
      </Card>
    );
  }
}
