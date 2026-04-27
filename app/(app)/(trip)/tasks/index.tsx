import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Modal, Platform, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import { useTripChromeInsets } from '@/components/layout';
import { AppText } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { Row } from '@/components/ui/row';
import { Stack } from '@/components/ui/stack';
import { useAppTheme } from '@/components/ui/theme-provider';
import { TaskCard } from '@/components/tasks/task-card';
import { TaskDetailModal } from '@/components/tasks/task-detail-modal';
import { useTasksStore } from '@/store/tasks.store';
import { useTripStore } from '@/store/trip.store';
import { useProfileStore } from '@/store/profile.store';
import { TaskFieldType, TASK_FIELD_TYPE_LABELS, TASK_FIELD_TYPE_OPTIONS, fieldNeedsOptions, createTaskSchema } from '@/types/tasks.types';
import { TripRole } from '@/types/trip.types';
import type { Task } from '@/types';
import type { CreateTaskDTO, FieldDraft } from '@/types/tasks.types';

export default function TasksScreen() {
	const { theme: { colors, spacing, radius, sizes, stroke } } = useAppTheme();
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
	const { currentParticipant } = useTripStore();
	const { selectedTrip } = useProfileStore();

	const [detailTask, setDetailTask] = useState<Task | null>(null);
	const [adminVisible, setAdminVisible] = useState(false);
	const [editingTask, setEditingTask] = useState<Task | null>(null);
	const [refreshing, setRefreshing] = useState(false);

	// Admin form state
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [draftFields, setDraftFields] = useState<FieldDraft[]>([]);
	const [dueDate, setDueDate] = useState<Date | null>(null);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [tempDate, setTempDate] = useState<Date>(new Date());
	const [saving, setSaving] = useState(false);
	const [titleError, setTitleError] = useState('');
	const nextTempId = useRef(0);

	const isOrganizer =
		currentParticipant?.role === TripRole.Organizer ||
		currentParticipant?.role === TripRole.CoOrganizer;

	useEffect(() => {
		if (selectedTrip) getAllTasks(selectedTrip);
	}, [getAllTasks, selectedTrip]);

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

	const sortedTasks = [...tasks].sort((a, b) => {
		const aCompleted = assignments[a.id]?.is_completed ?? false;
		const bCompleted = assignments[b.id]?.is_completed ?? false;
		if (aCompleted === bCompleted) return 0;
		return aCompleted ? 1 : -1;
	});

	async function handleRefresh() {
		if (!selectedTrip || !currentParticipant) return;
		setRefreshing(true);
		try { await getAllTasks(selectedTrip); }
		finally { setRefreshing(false); }
	}

	function handleToggleComplete(task: Task) {
		if (!currentParticipant) return;
		const current = assignments[task.id];
		void upsertAssignment(task.id, currentParticipant.id, { is_completed: !(current?.is_completed ?? false) });
	}

	function handleToggleCheckbox(fieldId: string, optionId: string, current: boolean) {
		if (!currentParticipant) return;
		void upsertFieldResponse(fieldId, currentParticipant.id, { option_id: optionId, is_checked: !current });
	}

	function handleSelectDropdown(fieldId: string, optionId: string) {
		if (!currentParticipant) return;
		// Remove previous selection then set new one
		void upsertFieldResponse(fieldId, currentParticipant.id, { option_id: optionId, is_checked: null, value: null });
	}

	const handleChangeTextInput = useCallback((fieldId: string, value: string) => {
		if (!currentParticipant) return;
		void upsertFieldResponse(fieldId, currentParticipant.id, { option_id: null, value, is_checked: null });
	}, [currentParticipant, upsertFieldResponse]);

	function resetForm() {
		setEditingTask(null);
		setTitle('');
		setDescription('');
		setDraftFields([]);
		setDueDate(null);
		setShowDatePicker(false);
		setTitleError('');
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
		Alert.alert('Slett oppgave', `Er du sikker på at du vil slette "${task.title}"?`, [
			{ text: 'Avbryt', style: 'cancel' },
			{
				text: 'Slett', style: 'destructive',
				onPress: async () => {
					try { await deleteTask(task.id); }
					catch { Alert.alert('Feil', 'Kunne ikke slette oppgaven.'); }
				},
			},
		]);
	}

	async function handleSave() {
		const dto: CreateTaskDTO = {
			title,
			description: description || null,
			due_time: dueDate ? dueDate.toISOString() : null,
		};

		const result = createTaskSchema.safeParse(dto);
		if (!result.success) {
			setTitleError(result.error.issues[0].message);
			return;
		}

		for (const f of draftFields) {
			if (!f.label.trim()) {
				Alert.alert('Mangler label', 'Alle felt må ha en label.');
				return;
			}
			if (fieldNeedsOptions(f.type) && f.options.length < 2) {
				Alert.alert('For få valg', `"${f.label}" trenger minst 2 valg.`);
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
			Alert.alert('Feil', 'Kunne ikke lagre oppgaven. Prøv igjen.');
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
					<RefreshControl
						refreshing={refreshing}
						onRefresh={handleRefresh}
						tintColor={colors.primary}
						colors={[colors.primary]}
						progressViewOffset={headerContentOffset}
					/>
				}>
				<Container>
					{sortedTasks.length === 0 && !isLoading ? (
						<View style={{ alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.xs }}>
							<AppText variant="subtitle">Ingen oppgaver ennå</AppText>
							{isOrganizer && <AppText tone="muted">Trykk + for å legge til</AppText>}
						</View>
					) : (
						<Stack space="sm">
							{sortedTasks.map((task) => (
								<TaskCard
									key={task.id}
									task={task}
									assignment={assignments[task.id] ?? null}
									isOrganizer={isOrganizer}
									onPress={() => setDetailTask(task)}
									onExportPress={() => handleExport(task)}
								/>
							))}
						</Stack>
					)}
				</Container>
			</ScrollView>

			{isOrganizer && (
				<Pressable
					onPress={() => { resetForm(); setAdminVisible(true); }}
					style={({ pressed }) => ({
						position: 'absolute',
						bottom: bottomOverlayOffset - spacing.xl,
						right: spacing.md,
						width: sizes.iconButton.lg,
						height: sizes.iconButton.lg,
						borderRadius: radius.full,
						backgroundColor: colors.accent,
						alignItems: 'center', justifyContent: 'center',
						opacity: pressed ? 0.8 : 1,
					})}>
					<Ionicons name="add" size={sizes.icon.lg} color={colors.text} />
				</Pressable>
			)}

			{/* Task detail */}
			<TaskDetailModal
				task={detailTask}
				fields={detailTask ? (fields[detailTask.id] ?? []) : []}
				assignment={detailTask ? (assignments[detailTask.id] ?? null) : null}
				allAssignments={isOrganizer && detailTask ? (allAssignments[detailTask.id] ?? []) : undefined}
				myFieldResponses={myFieldResponses}
				allFieldResponses={isOrganizer ? allFieldResponses : undefined}
				onClose={() => setDetailTask(null)}
				onToggleComplete={() => { if (detailTask) handleToggleComplete(detailTask); }}
				onToggleCheckbox={handleToggleCheckbox}
				onSelectDropdown={handleSelectDropdown}
				onChangeTextInput={handleChangeTextInput}
				onEdit={isOrganizer && detailTask ? () => { setDetailTask(null); openEdit(detailTask); } : undefined}
				onDelete={isOrganizer && detailTask ? () => { setDetailTask(null); handleDelete(detailTask); } : undefined}
			/>

			{/* Admin create/edit modal */}
			<Modal
				visible={adminVisible}
				animationType="slide"
				presentationStyle="pageSheet"
				onRequestClose={() => { setAdminVisible(false); resetForm(); }}>
				<View style={{ flex: 1, backgroundColor: colors.background }}>
					<View style={{
						flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
						paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
						backgroundColor: colors.surface,
						borderBottomWidth: stroke.thin, borderBottomColor: colors.border,
					}}>
						<Button label="Avbryt" variant="ghost" size="md" onPress={() => { setAdminVisible(false); resetForm(); }} />
						<AppText variant="body" style={{ fontWeight: '600' }}>
							{editingTask ? 'Rediger oppgave' : 'Ny oppgave'}
						</AppText>
						<Button label={saving ? 'Lagrer...' : 'Lagre'} size="sm" loading={saving} onPress={handleSave} />
					</View>

					<ScrollView keyboardShouldPersistTaps="handled">
						<Container>
							<Stack space="sm">
								<Input
									label="Tittel *"
									placeholder="Hva skal gjøres?"
									value={title}
									onChangeText={(t) => { setTitle(t); setTitleError(''); }}
									error={titleError || undefined}
								/>
								<Input
									label="Beskrivelse"
									placeholder="Valgfri beskrivelse"
									value={description}
									onChangeText={setDescription}
									multiline
								/>

								<Stack space="xs">
									<AppText variant="caption">Frist</AppText>
									<Pressable
										onPress={() => { setTempDate(dueDate ?? new Date()); setShowDatePicker(true); }}
										style={{
											minHeight: 52, borderRadius: radius.md,
											borderWidth: stroke.thin, borderColor: colors.border,
											backgroundColor: colors.surface,
											paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
											flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
										}}>
										<AppText style={{ color: dueDate ? colors.text : colors.textMuted }}>
											{dueDate
												? `${dueDate.toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })} kl. ${dueDate.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}`
												: 'Velg dato og tid'}
										</AppText>
										<Row gap="xs">
											{dueDate && (
												<Pressable onPress={(e) => { e.stopPropagation(); setDueDate(null); }} hitSlop={8}>
													<Ionicons name="close-circle" size={18} color={colors.textMuted} />
												</Pressable>
											)}
											<Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
										</Row>
									</Pressable>
								</Stack>

								{draftFields.length > 0 && (
									<Stack space="sm">
										<AppText variant="caption">Felt</AppText>
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
									<AppText variant="caption">Legg til felt</AppText>
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

								{isOrganizer && editingTask && (
									<Button
										label="Slett oppgave"
										variant="ghost"
										fullWidth
										onPress={() => { setAdminVisible(false); handleDelete(editingTask); resetForm(); }}
									/>
								)}
							</Stack>
						</Container>
					</ScrollView>

					{Platform.OS === 'android' && showDatePicker && (
						<DateTimePicker
							value={tempDate} mode="datetime" display="default" minimumDate={new Date()}
							onChange={(_: DateTimePickerEvent, date?: Date) => {
								setShowDatePicker(false);
								if (date) setDueDate(date);
							}}
						/>
					)}

					<Modal
						visible={Platform.OS === 'ios' && showDatePicker}
						transparent animationType="slide"
						onRequestClose={() => setShowDatePicker(false)}>
						<View style={{ flex: 1 }} />
						<View style={{
							backgroundColor: colors.surface,
							borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
							paddingBottom: insets.bottom,
						}}>
							<View style={{
								flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
								paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs,
							}}>
								<Pressable onPress={() => setShowDatePicker(false)}>
									<AppText tone="primary">Avbryt</AppText>
								</Pressable>
								<AppText variant="subtitle">Velg dato og tid</AppText>
								<Pressable onPress={() => { setDueDate(tempDate); setShowDatePicker(false); }}>
									<AppText tone="primary">Ferdig</AppText>
								</Pressable>
							</View>
							<DateTimePicker
								value={tempDate} mode="datetime" display="spinner" minimumDate={new Date()}
								onChange={(_: DateTimePickerEvent, date?: Date) => { if (date) setTempDate(date); }}
								style={{ height: 200 }}
							/>
						</View>
					</Modal>
				</View>
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
							placeholder="Legg til valg..."
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
