import { apiRequest } from "./client";

export interface SavedQueryResult {
  id: number;
  natural_language_query: string;
  generated_sql: string;
  result_data: Record<string, unknown>[] | null;
  row_count: number | null;
  execution_status: string | null;
  execution_time_ms: number | null;
  created_at: string;
}

export function listSavedQueryResults(sessionId: number) {
  return apiRequest<SavedQueryResult[]>(`/api/chat/sessions/${sessionId}/queries`);
}

export function getSavedQueryResult(queryId: number) {
  return apiRequest<SavedQueryResult>(`/api/chat/queries/${queryId}`);
}
