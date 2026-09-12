import { apiRequest } from "./client";

export type ChatMessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: number;
  session_id: number;
  user_id: number;
  role: ChatMessageRole;
  content: string;
  created_at: string;
}

export interface CreateChatMessageInput {
  role: ChatMessageRole;
  content: string;
}

export function createChatMessage(
  sessionId: number,
  input: CreateChatMessageInput
) {
  return apiRequest<ChatMessage>(
    `/api/chat/sessions/${sessionId}/messages`,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}

export function listChatMessages(sessionId: number) {
  return apiRequest<ChatMessage[]>(
    `/api/chat/sessions/${sessionId}/messages`
  );
}