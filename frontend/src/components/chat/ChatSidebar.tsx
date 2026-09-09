"use client";

import { useCallback, useEffect, useState } from "react";

import {
  createChatSession,
  deleteChatSession,
  listChatSessions,
  type ChatSession,
} from "@/lib/api/chatSessions";
import ChatSessionItem from "./ChatSessionItem";
import NewChatButton from "./NewChatButton";

interface ChatSidebarProps {
  selectedSessionId: number | null;
  onSelectSession: (sessionId: number | null) => void;
  isAuthenticated: boolean;
  refreshKey?: number;
}

async function fetchChatSessions() {
  return listChatSessions();
}

export default function ChatSidebar({
  selectedSessionId,
  onSelectSession,
  isAuthenticated,
  refreshKey = 0,
}: ChatSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    if (!isAuthenticated) {
      setSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setSessions(await fetchChatSessions());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load chats.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    void fetchChatSessions()
      .then((nextSessions) => {
        if (!cancelled) setSessions(nextSessions);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load chats.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, refreshKey]);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);

    try {
      const session = await createChatSession();
      setSessions((current) => [session, ...current]);
      onSelectSession(session.id);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create a chat.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (sessionId: number) => {
    setDeletingSessionId(sessionId);
    setError(null);

    try {
      await deleteChatSession(sessionId);
      setSessions((current) => current.filter((session) => session.id !== sessionId));
      if (selectedSessionId === sessionId) onSelectSession(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete the chat.");
    } finally {
      setDeletingSessionId(null);
    }
  };

  return (
    <aside className="flex min-h-[16rem] flex-col rounded-xl border border-slate-800 bg-slate-950/80 p-4 shadow-lg lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:min-h-0">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-blue-500 uppercase">01 / History</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-white">Your chats</h2>
        </div>
        <span aria-hidden="true" className="mt-1 text-lg text-slate-700">✦</span>
      </div>

      <NewChatButton creating={creating} onCreate={() => void handleCreate()} />

      {error ? (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
          <p className="text-xs leading-5 text-red-200">{error}</p>
          <button
            type="button"
            onClick={() => void loadSessions()}
            className="mt-2 text-xs font-semibold text-red-300 underline decoration-red-400/50 underline-offset-4 hover:text-red-100"
          >
            Try again
          </button>
        </div>
      ) : null}

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="space-y-2" aria-label="Loading chats">
            {["one", "two", "three"].map((key) => (
              <div key={key} className="h-14 animate-pulse rounded-lg bg-slate-900" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex h-full min-h-28 items-center justify-center rounded-lg border border-dashed border-slate-800 px-4 text-center">
            <p className="text-xs leading-5 text-slate-500">No chats yet. Start a new one to keep your questions together.</p>
          </div>
        ) : (
          <ul className="space-y-1.5" aria-label="Chat sessions">
            {sessions.map((session) => (
              <ChatSessionItem
                key={session.id}
                session={session}
                selected={selectedSessionId === session.id}
                deleting={deletingSessionId === session.id}
                onSelect={onSelectSession}
                onDelete={(id) => void handleDelete(id)}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
