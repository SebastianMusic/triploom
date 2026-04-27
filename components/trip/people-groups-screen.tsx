import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';

import { useTripChromeInsets } from '@/components/layout/use-trip-chrome';
import { CreateGroupsModal } from '@/components/trip/create-groups-modal';
import { EditGroupModal } from '@/components/trip/edit-group-modal';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useGroupStore } from '@/store/group.store';
import type { TripParticipantWithProfile } from '@/services/trip.service';
import type { GroupWithMembers } from '@/services/group.service';
import { TripRole } from '@/types';

type Tab = 'people' | 'groups';

type Props = {
  tripId: string | null;
  currentParticipantId: string | null;
  participants: TripParticipantWithProfile[];
  canManage: boolean;
};

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

export function PeopleGroupsScreen({
  tripId,
  currentParticipantId,
  participants,
  canManage,
}: Props) {
  const { headerContentOffset, safeAreaInsets } = useTripChromeInsets();
  const {
    theme: { colors, layout, opacity, radius, shadows, spacing, stroke, typography },
  } = useAppTheme();
  const groups = useGroupStore((state) => state.groups);
  const isLoadingGroups = useGroupStore((state) => state.isLoading);
  const isMutatingGroup = useGroupStore((state) => state.isMutating);
  const fetchGroups = useGroupStore((state) => state.fetchGroups);
  const clearGroups = useGroupStore((state) => state.clearGroups);
  const joinTripGroup = useGroupStore((state) => state.joinGroup);
  const leaveTripGroup = useGroupStore((state) => state.leaveGroup);
  const deleteTripGroup = useGroupStore((state) => state.deleteGroup);

  const [tab, setTab] = useState<Tab>('people');
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [pendingGroupId, setPendingGroupId] = useState<string | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupWithMembers | null>(null);

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
  const assignedParticipants = new Set(
    groups.flatMap((group) => group.group_membership.map((membership) => membership.participant_id)),
  );

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
          paddingBottom: safeAreaInsets.bottom + spacing.xl,
          paddingHorizontal: layout.screenPadding,
          gap: spacing.md,
        }}>
        <Card
          variant="elevated"
          style={{
            gap: spacing.md,
            backgroundColor: colors.surface,
            borderWidth: stroke.thin,
            borderColor: colors.border,
          }}>
          <View style={{ gap: spacing.xs }}>
            <AppText style={typography.subtitle}>People & groups</AppText>
            <AppText variant="caption" tone="muted">
              Keep an overview of participants, contact details, and group assignments for this trip.
            </AppText>
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <StatPill label="People" value={participants.length} />
            <StatPill label="Groups" value={groups.length} />
            <StatPill label="Assigned" value={assignedParticipants.size} />
          </View>
        </Card>

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
                  minHeight: 44,
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

        {tab === 'people' ? (
          <>
            <Card
              style={{
                gap: spacing.xs,
                backgroundColor: colors.surfaceMuted,
              }}>
              <AppText style={typography.label}>Trip roster</AppText>
              <AppText variant="caption" tone="muted">
                {participants.length} participants, {organizerCount} organizer roles.
              </AppText>
            </Card>

            {sortedParticipants.length === 0 ? (
              <EmptyState
                title="No participants yet"
                description="People will show up here as soon as they join the trip."
              />
            ) : (
              sortedParticipants.map((participant) => {
                const name = participant.profile?.user_name ?? 'Unknown';
                const roleLabel = participant.role
                  ? (ROLE_LABELS[participant.role] ?? participant.role)
                  : 'Participant';
                const avatarSource = participant.profile?.profile_picture_url
                  ? { uri: participant.profile.profile_picture_url }
                  : undefined;
                const details = [
                  canManage ? participant.profile?.email : null,
                  canManage ? participant.profile?.phonenumber : null,
                ].filter(Boolean);

                return (
                  <Card
                    key={participant.id}
                    style={{
                      gap: spacing.sm,
                      borderWidth: stroke.thin,
                      borderColor: colors.border,
                    }}>
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
                          <AppText variant="caption" style={{ color: colors.secondary }}>
                            {roleLabel}
                          </AppText>
                        </View>
                      </View>
                    </View>

                    {details.length > 0 ? (
                      <View style={{ gap: spacing.xs / 2 }}>
                        {details.map((detail) => (
                          <View
                            key={detail}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                            <Ionicons name="ellipse" size={8} color={colors.textMuted} />
                            <AppText variant="caption" tone="muted">
                              {detail}
                            </AppText>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </Card>
                );
              })
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
                    ? 'Create the first group to start organizing people.'
                    : 'Groups created by trip organizers will show up here.'
                }
              />
            ) : (
              groups.map((group) => {
                const expanded = expandedGroupId === group.id;
                const joined = isMember(group);
                const full = isFull(group);
                const loading = pendingGroupId === group.id && isMutatingGroup;

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
                        padding: spacing.md,
                        gap: spacing.sm,
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
                                width: 48,
                                height: 48,
                                borderRadius: radius.full,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: colors.primarySoft,
                              },
                              shadows.sm,
                            ]}>
                            <Ionicons name="people-outline" size={22} color={colors.primary} />
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
                          variant={joined ? 'accent' : full ? 'muted' : 'default'}
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
                                : 'Participant';
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
                                    paddingHorizontal: spacing.sm,
                                    paddingVertical: spacing.sm - spacing.xs / 2,
                                  }}>
                                  <Avatar name={name} size="sm" source={avatarSource} />
                                  <View style={{ flex: 1 }}>
                                    <AppText>{name}</AppText>
                                    <AppText variant="caption" tone="muted">
                                      {roleLabel}
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
    </>
  );

  function StatPill({ label, value }: { label: string; value: number }) {
    return (
      <View
        style={{
          flex: 1,
          borderRadius: radius.lg,
          backgroundColor: colors.surfaceMuted,
          paddingVertical: spacing.sm,
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
    variant: 'default' | 'accent' | 'muted';
  }) {
    const backgroundColor =
      variant === 'accent'
        ? colors.primarySoft
        : variant === 'muted'
          ? colors.surfaceMuted
          : colors.secondarySoft;
    const textColor =
      variant === 'accent'
        ? colors.primary
        : variant === 'muted'
          ? colors.textMuted
          : colors.secondary;

    return (
      <View
        style={{
          borderRadius: radius.full,
          backgroundColor,
          paddingHorizontal: spacing.xs,
          paddingVertical: 4,
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
