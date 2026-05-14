import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTripChromeInsets } from '@/components/layout';
import { AppRefreshControl } from '@/components/ui/app-refresh-control';
import { AppText } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { AppDateTimePicker, DateTimeField } from '@/components/ui/date-time-picker';
import { DestructiveFormFooter } from '@/components/ui/destructive-form-footer';
import { EmptyState } from '@/components/ui/empty-state';
import { confirmDestructiveAction } from '@/components/ui/confirm-destructive-action';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { KeyboardScreenView } from '@/components/ui/keyboard-screen-view';
import { Row } from '@/components/ui/row';
import { SectionHeader } from '@/components/ui/section-header';
import { Stack } from '@/components/ui/stack';
import { useAppTheme } from '@/components/ui/theme-provider';
import { TaskCard } from '@/components/tasks/task-card';
import { TaskDetailModal } from '@/components/tasks/task-detail-modal';
import { TaskStatsModal } from '@/components/tasks/task-stats-modal';
import { useTasksStore } from '@/store/tasks.store';
import { useEventsStore } from '@/store/events.store';
import { useTripStore } from '@/store/trip.store';
import { useProfileStore } from '@/store/profile.store';
import { useTripHeaderActionsStore } from '@/store/trip-header-actions.store';
import { TaskFieldType, TASK_FIELD_TYPE_LABELS, TASK_FIELD_TYPE_OPTIONS, fieldNeedsOptions, createTaskSchema } from '@/types/tasks.types';
import { TripRole } from '@/types/trip.types';
import type { Task } from '@/types';
import type { CreateTaskDTO, FieldDraft } from '@/types/tasks.types';

function getTaskTimeValue(task: Task) {
	if (!task.due_time) return Number.MAX_SAFE_INTEGER;
	const value = new Date(task.due_time).getTime();
	return Number.isNaN(value) ? Number.MAX_SAFE_INTEGER : value;
}

function sortTasksByPriority(
	tasks: Task[],
	assignments: Record<string, { is_completed: boolean | null }>,
) {
	return [...tasks].sort((a, b) => {
		const aCompleted = assignments[a.id]?.is_completed ?? false;
		const bCompleted = assignments[b.id]?.is_completed ?? false;
		if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
		const aMandatory = a.is_mandatory ?? false;
		const bMandatory = b.is_mandatory ?? false;
		if (aMandatory !== bMandatory) return aMandatory ? -1 : 1;
		return getTaskTimeValue(a) - getTaskTimeValue(b);
	});
}

function sortPreviousTasks(tasks: Task[]) {
	return [...tasks].sort((a, b) => getTaskTimeValue(b) - getTaskTimeValue(a));
}

export default function TasksScreen() {
			const { theme: { colors, spacing, radius, stroke } } = useAppTheme();
	const insets = useSafeAreaInsets();
	const { headerContentOffset, bottomOverlayOffset } = useTripChromeInsets();
	const {
		tasks, fields, assignments, allAssignments, myFieldResponses, allFieldResponses, isLoading,
		getAllTasks, fetchAssignments, fetchAllAssignments, fetchTaskFields,
		fetchMyFieldResponses, fetchAllFieldResponses,
		createTask, updateTask, deleteTask,
		createTaskField, deleteTaskField,
		upsertAssignment, upsertFieldResponse, deleteMyFieldResponses, sendTaskReminder, exportTask,
	} = useTasksStore();
	const { currentParticipant, participantsWithProfiles } = useTripStore();
	const { selectedTrip } = useProfileStore();
	const { events, fetchEvents } = useEventsStore();
	const setHeaderActions = useTripHeaderActionsStore((state) => state.setActions);

	const [detailTask, setDetailTask] = useState<Task | null>(null);
	const [adminVisible, setAdminVisible] = useState(false);
	const [statsVisible, setStatsVisible] = useState(false);
	const [editingTask, setEditingTask] = useState<Task | null>(null);
	const [refreshing, setRefreshing] = useState(false);
	const [visiblePreviousTaskCount, setVisiblePreviousTaskCount] = useState(0);

	// Admin form state
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [draftFields, setDraftFields] = useState<FieldDraft[]>([]);
	const [dueDate, setDueDate] = useState<Date | null>(null);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [tempDate, setTempDate] = useState<Date>(new Date());
	const [eventId, setEventId] = useState<string | null>(null);
	const [eventPickerVisible, setEventPickerVisible] = useState(false);
	const [isMandatory, setIsMandatory] = useState(false);
	const [saving, setSaving] = useState(false);
	const [titleError, setTitleError] = useState('');
	const nextTempId = useRef(0);

	const resetForm = useCallback(() => {
		setEditingTask(null);
		setTitle('');
		setDescription('');
		setDraftFields([]);
		setDueDate(null);
		setEventId(null);
		setIsMandatory(false);
		setShowDatePicker(false);
		setTitleError('');
	}, []);

	const isOrganizer =
		currentParticipant?.role === TripRole.Organizer ||
		currentParticipant?.role === TripRole.CoOrganizer;

	useFocusEffect(useCallback(() => {
		if (!isOrganizer) {
			setHeaderActions([]);
			return () => setHeaderActions([]);
		}

		setHeaderActions([
			{
				key: 'task-stats',
				accessibilityLabel: 'Open task stats',
				iconName: 'bar-chart-outline',
				onPress: () => setStatsVisible(true),
			},
			{
				key: 'create-task',
				accessibilityLabel: 'Create task',
				iconName: 'add',
				onPress: () => {
					resetForm();
					setAdminVisible(true);
				},
			},
		]);

		return () => setHeaderActions([]);
	}, [isOrganizer, resetForm, setHeaderActions]));

	useEffect(() => {
		if (selectedTrip) {
			getAllTasks(selectedTrip);
			void fetchEvents(selectedTrip);
		}
	}, [getAllTasks, fetchEvents, selectedTrip]);

	useEffect(() => {
		if (!currentParticipant || tasks.length === 0) return;
		const taskIds = tasks.map((t) => t.id);
		fetchAssignments(currentParticipant.id, taskIds);
		fetchTaskFields(taskIds);
		if (isOrganizer) fetchAllAssignments(taskIds);
	}, [currentParticipant, fetchAllAssignments, fetchAssignments, fetchTaskFields, isOrganizer, tasks]);

	useEffect(() => {
		if (!currentParticipant) return;
		const allFieldIds = Object.values(fields).flat().map((f) => f.id);
		if (allFieldIds.length === 0) return;
		fetchMyFieldResponses(currentParticipant.id, allFieldIds);
		if (isOrganizer) fetchAllFieldResponses(allFieldIds);
	}, [currentParticipant, fetchAllFieldResponses, fetchMyFieldResponses, fields, isOrganizer]);

	useEffect(() => {
		if (!statsVisible || !currentParticipant || tasks.length === 0) return;
		const taskIds = tasks.map((t) => t.id);
		const allFieldIds = Object.values(fields).flat().map((f) => f.id);
		void fetchAllAssignments(taskIds);
		if (allFieldIds.length > 0) void fetchAllFieldResponses(allFieldIds);
	}, [currentParticipant, fetchAllAssignments, fetchAllFieldResponses, fields, statsVisible, tasks]);

	const now = Date.now();
	const sortedTasks = useMemo(() => sortTasksByPriority(tasks, assignments), [assignments, tasks]);
	const activeTasks = useMemo(
		() =>
			sortedTasks.filter((task) => {
				if (assignments[task.id]?.is_completed ?? false) return false;
				const dueTime = getTaskTimeValue(task);
				return dueTime === Number.MAX_SAFE_INTEGER || dueTime >= now;
			}),
		[assignments, now, sortedTasks],
	);
	const previousTasks = useMemo(
		() =>
			sortPreviousTasks(
				sortedTasks.filter((task) => {
					if (assignments[task.id]?.is_completed ?? false) return true;
					const dueTime = getTaskTimeValue(task);
					return dueTime !== Number.MAX_SAFE_INTEGER && dueTime < now;
				}),
			),
		[assignments, now, sortedTasks],
	);
	const visiblePreviousTasks = previousTasks.slice(0, visiblePreviousTaskCount);
	const eventTitleById = useMemo(
		() => new Map(events.map((event) => [event.id, event.title ?? 'Untitled event'])),
		[events],
	);

	// Group tasks: event-linked groups first (in event order), then general
	const eventGroups = events
		.map((e) => ({ eventId: e.id, title: e.title ?? 'Untitled event', tasks: activeTasks.filter((t) => t.event_id === e.id) }))
		.filter((g) => g.tasks.length > 0);
	const generalTasks = activeTasks.filter((t) => !t.event_id);

	async function handleRefresh() {
		if (!selectedTrip || !currentParticipant) return;
		setRefreshing(true);
		try { await getAllTasks(selectedTrip); }
		finally { setRefreshing(false); }
	}

	function openEdit(task: Task) {
		setEditingTask(task);
		setTitle(task.title ?? '');
		setDescription(task.description ?? '');
		setDraftFields(
			(fields[task.id] ?? []).map((f) => ({
				tempId: String(nextTempId.current++),
				type: f.type as TaskFieldType,
				label: f.label,
				options: f.options.map((o) => o.label),
			}))
		);
		setDueDate(task.due_time ? new Date(task.due_time) : null);
		setEventId(task.event_id ?? null);
		setIsMandatory(task.is_mandatory ?? false);
		setTitleError('');
		setAdminVisible(true);
	}

	function addField(type: TaskFieldType) {
		setDraftFields((prev) => [
			...prev,
			{ tempId: String(nextTempId.current++), type, label: '', options: [] },
		]);
	}

	function updateFieldLabel(tempId: string, label: string) {
		setDraftFields((prev) => prev.map((f) => f.tempId === tempId ? { ...f, label } : f));
	}

	function addFieldOption(tempId: string, option: string) {
		setDraftFields((prev) =>
			prev.map((f) => f.tempId === tempId ? { ...f, options: [...f.options, option] } : f)
		);
	}

	function removeFieldOption(tempId: string, index: number) {
		setDraftFields((prev) =>
			prev.map((f) => f.tempId === tempId ? { ...f, options: f.options.filter((_, i) => i !== index) } : f)
		);
	}

	function removeField(tempId: string) {
		setDraftFields((prev) => prev.filter((f) => f.tempId !== tempId));
	}

	function handleExport(task: Task) {
		Alert.alert(
			'Export to spreadsheet',
			`Export all responses for "${task.title}" to a spreadsheet? It will be sent to your email.`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Export',
					onPress: async () => {
						try {
							await exportTask(task.id);
							Alert.alert('Sent', 'The spreadsheet is on its way to your email.');
						} catch (err: any) {
							Alert.alert('Error', err?.message ?? 'Could not export the task. Try again.');
						}
					},
				},
			],
		);
	}

	function handleDelete(task: Task) {
    confirmDestructiveAction({
      title: 'Delete task',
      message: `Delete "${task.title}"? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteTask(task.id);
        } catch {
          Alert.alert('Error', 'Could not delete the task.');
        }
      },
    });
	}

	async function handleSave() {
		const dto: CreateTaskDTO = {
			title,
			description: description || null,
			due_time: dueDate ? dueDate.toISOString() : null,
			event_id: eventId,
			is_mandatory: isMandatory,
		};

		const result = createTaskSchema.safeParse(dto);
		if (!result.success) {
			setTitleError(result.error.issues[0].message);
			return;
		}

		for (const f of draftFields) {
			if (!f.label.trim()) {
				Alert.alert('Missing label', 'All fields must have a label.');
				return;
			}
			if (fieldNeedsOptions(f.type) && f.options.length < 2) {
				Alert.alert('Too few options', `"${f.label}" needs at least 2 options.`);
				return;
			}
		}

		if (!selectedTrip) return;
		setSaving(true);
		try {
			let taskId: string;
			if (editingTask) {
				await updateTask(editingTask.id, result.data);
				taskId = editingTask.id;
				for (const old of fields[taskId] ?? []) {
					await deleteTaskField(taskId, old.id);
				}
			} else {
				const task = await createTask(selectedTrip, result.data);
				taskId = task.id;
			}
			for (let i = 0; i < draftFields.length; i++) {
				const f = draftFields[i];
				await createTaskField(taskId, { type: f.type, label: f.label, sort_order: i }, f.options);
			}
			setAdminVisible(false);
			resetForm();
		} catch {
			Alert.alert('Error', 'Could not save the task. Please try again.');
		} finally {
			setSaving(false);
		}
	}

	return (
		<View style={{ flex: 1, backgroundColor: colors.background }}>
			<ScrollView
				contentContainerStyle={{
					paddingTop: headerContentOffset,
					paddingBottom: Math.max(spacing.xxxl, bottomOverlayOffset),
				}}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<AppRefreshControl
						refreshing={refreshing}
						onRefresh={handleRefresh}
						progressViewOffset={headerContentOffset}
					/>
				}>
				<Container>
					<Stack space="sm">
						<SectionHeader
							title="Upcoming tasks"
							count={activeTasks.length}
						/>
						{isLoading ? (
							<ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
						) : tasks.length === 0 ? (
							<EmptyState
								title="No tasks yet"
								description={
									isOrganizer
										? 'Create the first task to make responsibilities clearer for the group.'
										: 'Tasks will appear here when the organizers add them.'
								}
							/>
						) : (
							<Stack space="sm">
								{activeTasks.length === 0 ? (
									<EmptyState
										title="No active tasks"
										description="Completed and expired tasks are available below."
									/>
								) : null}
								{generalTasks.length > 0 && (
									<View style={{ gap: spacing.xs }}>
										{generalTasks.map((task) => (
											<TaskCard
												key={task.id}
												task={task}
												assignment={assignments[task.id] ?? null}
												eventName={task.event_id ? eventTitleById.get(task.event_id) : null}
												isOrganizer={isOrganizer}
												onPress={() => setDetailTask(task)}
											/>
										))}
									</View>
								)}
								{eventGroups.map((group) => (
									<View key={group.eventId} style={{ gap: spacing.xs }}>
										{group.tasks.map((task) => (
											<TaskCard
												key={task.id}
												task={task}
												assignment={assignments[task.id] ?? null}
												eventName={group.title}
												isOrganizer={isOrganizer}
												onPress={() => setDetailTask(task)}
											/>
										))}
									</View>
								))}
								{previousTasks.length > 0 ? (
									<Stack space="sm" style={{ marginTop: spacing.sm }}>
										<SectionHeader title="Previous tasks" count={previousTasks.length} />
										<Button
											label={
												visiblePreviousTaskCount === 0
													? `Show previous tasks (${previousTasks.length})`
													: 'Hide previous tasks'
											}
											variant="secondary"
											fullWidth
											onPress={() => {
												setVisiblePreviousTaskCount((count) => (count === 0 ? Math.min(6, previousTasks.length) : 0));
											}}
										/>
										{visiblePreviousTasks.length > 0 ? (
											<Stack space="sm">
												{visiblePreviousTasks.map((task) => (
													<TaskCard
														key={task.id}
														task={task}
														assignment={assignments[task.id] ?? null}
														eventName={task.event_id ? eventTitleById.get(task.event_id) : null}
														isOrganizer={isOrganizer}
														compact
														onPress={() => setDetailTask(task)}
													/>
												))}
												{visiblePreviousTaskCount < previousTasks.length ? (
													<Button
														label="Load more previous tasks"
														variant="secondary"
														fullWidth
														onPress={() => {
															setVisiblePreviousTaskCount((count) => Math.min(count + 6, previousTasks.length));
														}}
													/>
												) : null}
											</Stack>
										) : null}
									</Stack>
								) : null}
							</Stack>
						)}
					</Stack>
				</Container>
			</ScrollView>

			<TaskStatsModal
				visible={statsVisible}
				tasks={tasks}
				fields={fields}
				allAssignments={allAssignments}
				allFieldResponses={allFieldResponses}
				participants={participantsWithProfiles}
				onSendReminder={sendTaskReminder}
				onExport={handleExport}
				onClose={() => setStatsVisible(false)}
			/>

			{/* Task detail */}
			<TaskDetailModal
				task={detailTask}
				fields={detailTask ? (fields[detailTask.id] ?? []) : []}
				assignment={detailTask ? (assignments[detailTask.id] ?? null) : null}
				myFieldResponses={myFieldResponses}
				relatedEventName={detailTask?.event_id ? eventTitleById.get(detailTask.event_id) : null}
				onClose={() => setDetailTask(null)}
				onMarkComplete={async (pending) => {
					if (!currentParticipant || !detailTask) return;
					const taskFields = fields[detailTask.id] ?? [];
					const allFieldIds = taskFields.map((f) => f.id);

					// Wipe all existing responses first — guarantees no stale rows survive,
					// including old single choice option rows that differ from the current selection.
					if (allFieldIds.length > 0) {
						await deleteMyFieldResponses(currentParticipant.id, allFieldIds);
					}

					// Save only what the user currently has in pending
					for (const field of taskFields) {
						const fieldPending = pending[field.id];
						if (!fieldPending) continue;
						for (const resp of fieldPending) {
							await upsertFieldResponse(field.id, currentParticipant.id, resp);
						}
					}

					await upsertAssignment(detailTask.id, currentParticipant.id, { is_completed: true });
				}}
				onUndoComplete={() => {
					if (!currentParticipant || !detailTask) return;
					void upsertAssignment(detailTask.id, currentParticipant.id, { is_completed: false });
				}}
				onEdit={isOrganizer && detailTask ? () => { setDetailTask(null); openEdit(detailTask); } : undefined}
				onDelete={isOrganizer && detailTask ? () => { setDetailTask(null); handleDelete(detailTask); } : undefined}
			/>

			{/* Admin create/edit modal */}
			<Modal
				visible={adminVisible}
				animationType="slide"
				presentationStyle="pageSheet"
				onRequestClose={() => { setAdminVisible(false); resetForm(); }}>
					<KeyboardScreenView style={{ backgroundColor: colors.background }} scrollEnabled={false}>
						<View style={{
							flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
							paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
						backgroundColor: colors.surface,
						borderBottomWidth: stroke.thin, borderBottomColor: colors.border,
					}}>
						<Button label="Cancel" variant="ghost" size="md" onPress={() => { setAdminVisible(false); resetForm(); }} />
						<AppText variant="body" style={{ fontWeight: '600' }}>
							{editingTask ? 'Edit task' : 'New task'}
						</AppText>
						<Button label={saving ? 'Saving...' : 'Save'} size="sm" loading={saving} onPress={handleSave} />
					</View>

					<ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
						<Container>
							<Stack space="sm">
								<Input
									label="Title *"
									placeholder="What needs to be done?"
									value={title}
									onChangeText={(t) => { setTitle(t); setTitleError(''); }}
									error={titleError || undefined}
								/>
								<Input
									label="Description"
									placeholder="Optional description"
									value={description}
									onChangeText={setDescription}
									multiline
								/>

								<Pressable
									onPress={() => setIsMandatory((v) => !v)}
									style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
									<View style={{
										width: 22, height: 22, borderRadius: 6,
										borderWidth: 2,
										borderColor: isMandatory ? colors.warning : colors.border,
										backgroundColor: isMandatory ? colors.warning : 'transparent',
										alignItems: 'center', justifyContent: 'center',
									}}>
										{isMandatory ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
									</View>
									<AppText>Mandatory</AppText>
								</Pressable>

								{events.length > 0 && (
									<Stack space="xs">
										<AppText variant="caption">Event</AppText>
										<Pressable
											onPress={() => setEventPickerVisible(true)}
											style={{
												minHeight: 52, borderRadius: radius.md,
												borderWidth: stroke.thin, borderColor: colors.border,
												backgroundColor: colors.surface,
												paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
												flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
											}}>
											<AppText style={{ color: eventId ? colors.text : colors.textMuted }}>
												{eventId ? (events.find((e) => e.id === eventId)?.title ?? 'Unknown event') : 'None'}
											</AppText>
											<Ionicons name="chevron-down" size={16} color={colors.textMuted} />
										</Pressable>
									</Stack>
								)}

								<DateTimeField
                  label="Due date"
                  value={
                    dueDate
                      ? `${dueDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })} at ${dueDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                      : ''
                  }
                  placeholder="Select date and time"
                  active={!!dueDate}
                  onPress={() => { setTempDate(dueDate ?? new Date()); setShowDatePicker(true); }}
                  onClear={dueDate ? () => setDueDate(null) : undefined}
                />

								{draftFields.length > 0 && (
									<Stack space="sm">
										<AppText variant="caption">Fields</AppText>
										{draftFields.map((field) => (
											<FieldEditor
												key={field.tempId}
												field={field}
												onLabelChange={(label) => updateFieldLabel(field.tempId, label)}
												onAddOption={(opt) => addFieldOption(field.tempId, opt)}
												onRemoveOption={(i) => removeFieldOption(field.tempId, i)}
												onRemove={() => removeField(field.tempId)}
											/>
										))}
									</Stack>
								)}

								<Stack space="xs">
									<AppText variant="caption">Add field</AppText>
									<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
										{TASK_FIELD_TYPE_OPTIONS.map((type) => (
											<Pressable
												key={type}
												onPress={() => addField(type)}
												style={{
													borderRadius: radius.full, borderWidth: 1.5,
													borderColor: colors.border, backgroundColor: colors.surface,
													paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
													flexDirection: 'row', alignItems: 'center', gap: 6,
												}}>
												<Ionicons name="add" size={14} color={colors.accent} />
												<AppText variant="caption" tone="accent">{TASK_FIELD_TYPE_LABELS[type]}</AppText>
											</Pressable>
										))}
									</ScrollView>
								</Stack>

								{isOrganizer && editingTask ? (
									<DestructiveFormFooter
										label="Delete task"
										onPress={() => { setAdminVisible(false); handleDelete(editingTask); resetForm(); }}
									/>
								) : null}
							</Stack>
						</Container>
					</ScrollView>

					{/* Event picker bottom sheet */}
					<Modal
						visible={eventPickerVisible}
						transparent
						animationType="slide"
						onRequestClose={() => setEventPickerVisible(false)}>
						<Pressable style={{ flex: 1 }} onPress={() => setEventPickerVisible(false)} />
						<View style={{
							backgroundColor: colors.surface,
							borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
							paddingBottom: insets.bottom + spacing.sm,
							maxHeight: '60%',
						}}>
							<View style={{
								flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
								paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs,
								borderBottomWidth: stroke.thin, borderBottomColor: colors.border,
							}}>
								<AppText variant="body" style={{ fontWeight: '600' }}>Link to event</AppText>
								<Pressable onPress={() => setEventPickerVisible(false)}>
									<Ionicons name="close" size={22} color={colors.textMuted} />
								</Pressable>
							</View>
							<ScrollView keyboardShouldPersistTaps="handled">
								{[{ id: null, title: 'None' }, ...events].map((e) => {
									const selected = e.id === eventId;
									return (
										<Pressable
											key={e.id ?? '__general'}
											onPress={() => { setEventId(e.id); setEventPickerVisible(false); }}
											style={({ pressed }) => ({
												flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
												paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
												opacity: pressed ? 0.7 : 1,
											})}>
											<AppText style={{ color: selected ? colors.primary : colors.text, fontWeight: selected ? '600' : '400' }}>
												{e.title}
											</AppText>
											{selected && <Ionicons name="checkmark" size={18} color={colors.primary} />}
										</Pressable>
									);
								})}
							</ScrollView>
						</View>
					</Modal>

            <AppDateTimePicker
              visible={showDatePicker}
              value={tempDate}
              mode="datetime"
              minimumDate={new Date()}
              onConfirm={(date) => {
                setDueDate(date);
                setShowDatePicker(false);
              }}
              onClose={() => setShowDatePicker(false)}
            />
					</KeyboardScreenView>
			</Modal>
		</View>
	);
}

function FieldEditor({
	field,
	onLabelChange,
	onAddOption,
	onRemoveOption,
	onRemove,
}: {
	field: FieldDraft;
	onLabelChange: (label: string) => void;
	onAddOption: (opt: string) => void;
	onRemoveOption: (index: number) => void;
	onRemove: () => void;
}) {
	const { theme: { colors, spacing, radius, sizes, stroke } } = useAppTheme();
	const [optionInput, setOptionInput] = useState('');

	function submitOption() {
		if (!optionInput.trim()) return;
		onAddOption(optionInput.trim());
		setOptionInput('');
	}

	return (
		<View style={{
			borderRadius: radius.md, borderWidth: stroke.thin, borderColor: colors.border,
			backgroundColor: colors.surface, padding: spacing.sm, gap: spacing.xs,
		}}>
			<Row justify="space-between" align="center">
				<AppText variant="caption" tone="primary">{TASK_FIELD_TYPE_LABELS[field.type]}</AppText>
				<IconButton
					variant="ghost" size="md"
					icon={<Ionicons name="close" size={sizes.icon.sm} color={colors.textMuted} />}
					onPress={onRemove}
				/>
			</Row>

			<Input
				placeholder="Label for dette feltet..."
				value={field.label}
				onChangeText={onLabelChange}
			/>

			{fieldNeedsOptions(field.type) && (
				<Stack space="xs">
					{field.options.map((opt, i) => (
						<Row key={i} justify="space-between" style={{
							backgroundColor: colors.surfaceMuted, borderRadius: radius.sm,
							paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
						}}>
							<AppText style={{ flex: 1 }}>{opt}</AppText>
							<IconButton
								variant="ghost" size="md"
								icon={<Ionicons name="close" size={sizes.icon.sm} color={colors.textMuted} />}
								onPress={() => onRemoveOption(i)}
							/>
						</Row>
					))}
					<Row gap="xs">
						<Input
							placeholder="Add option..."
							value={optionInput}
							onChangeText={setOptionInput}
							onSubmitEditing={submitOption}
							returnKeyType="done"
							containerStyle={{ flex: 1 }}
						/>
						<Pressable
							onPress={submitOption}
							style={{
								width: sizes.iconButton.md, height: sizes.iconButton.md,
								borderRadius: radius.full, backgroundColor: colors.accent,
								alignItems: 'center', justifyContent: 'center',
							}}>
							<Ionicons name="add" size={sizes.icon.md} color={colors.text} />
						</Pressable>
					</Row>
				</Stack>
			)}
		</View>
	);
}
