import { apiRequest } from "./client";

export interface UserMemory {
  id: number;
  memory_type: string;
  key: string;
  value: string;
  source: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

export interface CreateMemoryInput {
  memory_type: string;
  key: string;
  value: string;
  source: string;
  expires_at?: string | null;
}

export type UpdateMemoryInput = Partial<CreateMemoryInput>;

export function listMemories() {
  return apiRequest<UserMemory[]>("/api/memories");
}

export function createMemory(input: CreateMemoryInput) {
  return apiRequest<UserMemory>("/api/memories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateMemory(memoryId: number, input: UpdateMemoryInput) {
  return apiRequest<UserMemory>(`/api/memories/${memoryId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteMemory(memoryId: number) {
  return apiRequest<void>(`/api/memories/${memoryId}`, {
    method: "DELETE",
  });
}
