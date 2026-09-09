import { apiRequest } from "./client";
import type { ChatMessage } from "./chatMessages";

export interface ChatSession {
  id: number;
  title: string | null;
  created_at: string;
  updated_at: string;
  messages?: ChatMessage[];
}

export interface CreateChatSessionInput {
  title?: string | null;
}

export function createChatSession(input: CreateChatSessionInput = {}) {
  return apiRequest<ChatSession>("/api/chat/sessions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listChatSessions() {
  return apiRequest<ChatSession[]>("/api/chat/sessions");
}

export function getChatSession(sessionId: number) {
  return apiRequest<ChatSession>(`/api/chat/sessions/${sessionId}`);
}

export function deleteChatSession(sessionId: number) {
  return apiRequest<void>(`/api/chat/sessions/${sessionId}`, {
    method: "DELETE",
  });
}
