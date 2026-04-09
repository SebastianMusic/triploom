import type { MessageInsert } from '@/types';

export async function getGroupChats(tripId: string) {}
export async function getMessages(groupChatId: string) {}
export async function sendMessage(data: MessageInsert) {}
export function subscribeToMessages(groupChatId: string, onMessage: (payload: unknown) => void) {}
