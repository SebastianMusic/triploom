import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { GroupWithMembers } from '@/services/group.service';
import { deleteGroup, getTripGroupsWithMembers, joinGroup, leaveGroup } from '@/services/group.service';
import type { TripParticipantWithProfile } from '@/services/trip.service';
import { CreateGroupsModal } from '@/components/trip/create-groups-modal';
import { Avatar } from '@/components/ui/avatar';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
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

type Tab = 'persons' | 'groups';

type Props = {
  visible: boolean;
  onClose: () => void;
  participants: TripParticipantWithProfile[];
  isOrganizer: boolean;
  tripId: string | null;
  currentParticipantId: string | null;
};

export function PersonsSheet({ visible, onClose, participants, isOrganizer, tripId, currentParticipantId }: Props) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { theme: { colors, spacing, radius, stroke } } = useAppTheme();
  const [tab, setTab] = useState<Tab>('persons');
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      if (tripId) refreshGroups();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: screenHeight, duration: 250, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  function refreshGroups() {
    if (!tripId) return;
    setLoadingGroups(true);
    getTripGroupsWithMembers(tripId)
      .then(setGroups)
      .catch(() => {})
      .finally(() => setLoadingGroups(false));
  }

  const sortedParticipants = [...participants].sort((a, b) => {
    const roleA = ROLE_ORDER[a.role ?? ''] ?? 2;
    const roleB = ROLE_ORDER[b.role ?? ''] ?? 2;
    if (roleA !== roleB) return roleA - roleB;
    return (a.profile?.user_name ?? '').localeCompare(b.profile?.user_name ?? '');
  });

  function isMember(group: GroupWithMembers): boolean {
    if (!currentParticipantId) return false;
    return group.group_membership.some((m) => m.participant_id === currentParticipantId);
  }

  function isFull(group: GroupWithMembers): boolean {
    const max = group.max_members;
    if (!max) return false;
    return group.group_membership.length >= max;
  }

  async function handleJoin(group: GroupWithMembers) {
    if (!currentParticipantId) return;
    setActionLoading(group.id);
    try {
      await joinGroup(group.id, currentParticipantId);
      refreshGroups();
    } catch (err) {
      const message = err instanceof Error && err.message === 'Group is full'
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
      refreshGroups();
    } catch {
      Alert.alert('Error', 'Could not leave group. Please try again.');
    } finally {
      setActionLoading(null);
    }
  }

  function handleDelete(group: GroupWithMembers) {
    Alert.alert(
      'Delete group',
      `Delete "${group.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(group.id);
            try {
              await deleteGroup(group.id);
              refreshGroups();
            } catch {
              Alert.alert('Error', 'Could not delete group. Please try again.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  }

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
          opacity: backdropAnim,
          zIndex: 10,
        }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          transform: [{ translateY: slideAnim }],
          zIndex: 11,
          backgroundColor: colors.background,
        }}>

        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + spacing.sm,
            paddingBottom: spacing.sm,
            paddingHorizontal: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.surface,
            borderBottomWidth: stroke.thin,
            borderBottomColor: colors.border,
          }}>
          <Pressable onPress={onClose} style={{ padding: spacing.xs / 2 }} accessibilityLabel="Close">
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <AppText variant="subtitle">
            {tab === 'persons' ? `Persons (${participants.length})` : `Groups (${groups.length})`}
          </AppText>
          {tab === 'groups' && isOrganizer ? (
            <Pressable
              onPress={() => setCreateModalVisible(true)}
              style={{ padding: spacing.xs / 2 }}
              accessibilityLabel="Create group">
              <Ionicons name="add" size={26} color={colors.accent} />
            </Pressable>
          ) : (
            <View style={{ width: 32 }} />
          )}
        </View>

        {/* Tab toggle */}
        <View
          style={{
            flexDirection: 'row',
            marginHorizontal: spacing.md,
            marginTop: spacing.sm,
            marginBottom: spacing.xs,
            borderRadius: radius.md,
            borderWidth: stroke.thin,
            borderColor: colors.border,
            backgroundColor: colors.surfaceMuted,
            overflow: 'hidden',
          }}>
          {(['persons', 'groups'] as Tab[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={{
                flex: 1,
                paddingVertical: spacing.sm - 2,
                alignItems: 'center',
                backgroundColor: tab === t ? colors.surface : 'transparent',
                margin: 3,
                borderRadius: radius.sm,
              }}>
              <AppText style={{ fontWeight: tab === t ? '600' : '400', color: tab === t ? colors.text : colors.textMuted }}>
                {t === 'persons' ? 'Persons' : 'Groups'}
              </AppText>
            </Pressable>
          ))}
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={{
            paddingBottom: insets.bottom + spacing.xl,
            paddingHorizontal: spacing.md,
            paddingTop: spacing.xs,
            gap: spacing.xs,
          }}>

          {tab === 'persons' ? (
            sortedParticipants.map((item) => {
              const name = item.profile?.user_name ?? 'Unknown';
              const roleLabel = item.role ? (ROLE_LABELS[item.role] ?? item.role) : 'Participant';
              const email = item.profile?.email ?? null;
              const phone = item.profile?.phonenumber ?? null;

              return (
                <View
                  key={item.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: spacing.sm,
                    paddingVertical: spacing.sm,
                    borderBottomWidth: stroke.thin,
                    borderBottomColor: colors.border,
                  }}>
                  <Avatar name={name} size="md" />
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                      <AppText style={{ fontWeight: '600' }}>{name}</AppText>
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted }}>
                        <AppText variant="caption" tone="muted">{roleLabel}</AppText>
                      </View>
                    </View>
                    {isOrganizer && (
                      <View style={{ gap: 2, marginTop: 2 }}>
                        {email ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                            <Ionicons name="mail-outline" size={13} color={colors.textMuted} />
                            <AppText variant="caption" tone="muted">{email}</AppText>
                          </View>
                        ) : null}
                        {phone ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                            <Ionicons name="call-outline" size={13} color={colors.textMuted} />
                            <AppText variant="caption" tone="muted">{phone}</AppText>
                          </View>
                        ) : null}
                        {!email && !phone ? (
                          <AppText variant="caption" tone="muted">No contact info</AppText>
                        ) : null}
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          ) : loadingGroups ? (
            <View style={{ alignItems: 'center', paddingTop: spacing.xl }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : groups.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: spacing.xl }}>
              <AppText tone="muted">No groups yet.</AppText>
            </View>
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
                  style={{
                    borderRadius: radius.md,
                    borderWidth: stroke.thin,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    overflow: 'hidden',
                    marginBottom: spacing.xs,
                  }}>
                  <Pressable
                    onPress={() => setExpandedGroupId(expanded ? null : group.id)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.sm,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
                    })}>
                    <Ionicons name="people-circle-outline" size={20} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <AppText style={{ fontWeight: '600' }}>{group.name}</AppText>
                      {group.description ? (
                        <AppText variant="caption" tone="muted">{group.description}</AppText>
                      ) : null}
                    </View>
                    <AppText variant="caption" tone="muted">
                      {members.length}{group.max_members ? `/${group.max_members}` : ''} {members.length === 1 ? 'member' : 'members'}
                    </AppText>
                    {full && !joined ? (
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted }}>
                        <AppText variant="caption" tone="muted">Full</AppText>
                      </View>
                    ) : null}
                    <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
                  </Pressable>

                  {expanded ? (
                    <View style={{ borderTopWidth: stroke.thin, borderTopColor: colors.border }}>
                      {members.length === 0 ? (
                        <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
                          <AppText variant="caption" tone="muted">No members yet.</AppText>
                        </View>
                      ) : (
                        members.map((m, index) => {
                          const name = m.trip_participant?.profile?.user_name ?? 'Unknown';
                          return (
                            <View
                              key={m.participant_id}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: spacing.sm,
                                paddingHorizontal: spacing.md,
                                paddingVertical: spacing.sm - 2,
                                borderTopWidth: index > 0 ? stroke.thin : 0,
                                borderTopColor: colors.border,
                              }}>
                              <Avatar name={name} size="sm" />
                              <AppText style={{ flex: 1 }}>{name}</AppText>
                            </View>
                          );
                        })
                      )}

                      <View
                        style={{
                          flexDirection: 'row',
                          gap: spacing.sm,
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm,
                          borderTopWidth: stroke.thin,
                          borderTopColor: colors.border,
                        }}>
                        {loading ? (
                          <ActivityIndicator size="small" color={colors.primary} style={{ flex: 1 }} />
                        ) : (
                          <>
                            {joined ? (
                              <Pressable
                                onPress={() => { void handleLeave(group); }}
                                style={({ pressed }) => ({
                                  flex: 1,
                                  paddingVertical: spacing.xs,
                                  paddingHorizontal: spacing.sm,
                                  borderRadius: radius.sm,
                                  borderWidth: stroke.thin,
                                  borderColor: colors.border,
                                  alignItems: 'center',
                                  opacity: pressed ? 0.7 : 1,
                                })}>
                                <AppText variant="caption" tone="muted">Leave group</AppText>
                              </Pressable>
                            ) : (
                              <Pressable
                                onPress={() => { void handleJoin(group); }}
                                disabled={full}
                                style={({ pressed }) => ({
                                  flex: 1,
                                  paddingVertical: spacing.xs,
                                  paddingHorizontal: spacing.sm,
                                  borderRadius: radius.sm,
                                  backgroundColor: full ? colors.surfaceMuted : colors.primary,
                                  alignItems: 'center',
                                  opacity: pressed ? 0.7 : 1,
                                })}>
                                <AppText variant="caption" style={{ color: full ? colors.textMuted : colors.background }}>
                                  {full ? 'Group full' : 'Join group'}
                                </AppText>
                              </Pressable>
                            )}
                            {isOrganizer ? (
                              <Pressable
                                onPress={() => handleDelete(group)}
                                style={({ pressed }) => ({
                                  paddingVertical: spacing.xs,
                                  paddingHorizontal: spacing.sm,
                                  borderRadius: radius.sm,
                                  borderWidth: stroke.thin,
                                  borderColor: colors.error,
                                  alignItems: 'center',
                                  opacity: pressed ? 0.7 : 1,
                                })}>
                                <AppText variant="caption" style={{ color: colors.error }}>Delete</AppText>
                              </Pressable>
                            ) : null}
                          </>
                        )}
                      </View>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      </Animated.View>

      {createModalVisible && tripId ? (
        <CreateGroupsModal
          visible
          tripId={tripId}
          onClose={() => setCreateModalVisible(false)}
          onCreated={() => {
            setCreateModalVisible(false);
            refreshGroups();
          }}
        />
      ) : null}
    </>
  );
}
