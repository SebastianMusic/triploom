import type { MessageInsert } from '@/types';

export async function getMessages(tripId: string) {}
export async function sendMessage(data: MessageInsert) {}
export function subscribeToMessages(tripId: string, onMessage: (payload: unknown) => void) {}
