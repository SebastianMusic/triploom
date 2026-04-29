export const TripRole = {
	Organizer: 'organizer',
	CoOrganizer: 'coOrganizer',
	Participant: 'participant',
} as const;
export const ORGANIZER_ROLES = [TripRole.Organizer, TripRole.CoOrganizer];
