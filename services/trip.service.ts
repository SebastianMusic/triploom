import type { TripInsert, TripUpdate } from '@/types';

export async function getTrips() {}
export async function getTripById(id: string) {}
export async function createTrip(data: TripInsert) {}
export async function updateTrip(id: string, data: TripUpdate) {}
export async function deleteTrip(id: string) {}
export async function getTripMembers(tripId: string) {}
