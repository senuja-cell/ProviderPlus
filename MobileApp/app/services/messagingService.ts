import apiClient from './apiClient';

export interface ChatConversation {
  id: string;
  user_id: string;
  provider_id: string;
  service_category: string | null;
  created_at: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  customer_name: string | null;
  unread_count: number;
}

// ── Fetch all conversations for the logged-in provider ──
export async function fetchProviderConversations(): Promise<ChatConversation[]> {
  const response = await apiClient.get('/messaging/conversations');
  return response.data;
}
