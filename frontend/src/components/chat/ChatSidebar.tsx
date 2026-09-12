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
  onCreatingChange: (creating: boolean) => void;
  isAuthenticated: boolean;
  refreshKey?: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function ChatSidebar({
  selectedSessionId,
  onSelectSession,
  onCreatingChange,
  isAuthenticated,
  refreshKey = 0,
  collapsed,
  onToggleCollapse,
}: ChatSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingSessionId, setDeletingSessionId] =
    useState<number | null>(null);
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
      const data = await listChatSessions();
      setSessions(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load chats."
      );
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions, refreshKey]);

  const handleCreate = async () => {
    setCreating(true);
    onCreatingChange(true);
    setError(null);

    try {
      const session = await createChatSession();

      setSessions((current) => [session, ...current]);

      onSelectSession(session.id);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Could not create a chat."
      );
    } finally {
      setCreating(false);
      onCreatingChange(false);
    }
  };

  const handleDelete = async (sessionId: number) => {
    setDeletingSessionId(sessionId);
    setError(null);

    try {
      await deleteChatSession(sessionId);

      setSessions((current) =>
        current.filter(
          (session) => session.id !== sessionId
        )
      );

      if (selectedSessionId === sessionId) {
        onSelectSession(null);
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete the chat."
      );
    } finally {
      setDeletingSessionId(null);
    }
  };

  return (
    <aside
      className={`easeql-sidebar${
        collapsed ? " is-collapsed" : ""
      }`}
    >
      {/* Sidebar header */}
      <div className="easeql-sidebar-top">
        <div
          className="easeql-wordmark"
          title={collapsed ? "EaseQL" : undefined}
        >
          <span
            className="easeql-mark"
            aria-hidden="true"
          />

          <span className="easeql-wordmark-text">
            EaseQL
          </span>
        </div>

        <button
          type="button"
          className="easeql-sidebar-toggle"
          onClick={onToggleCollapse}
          aria-label={
            collapsed
              ? "Expand chat history"
              : "Collapse chat history"
          }
          title={
            collapsed
              ? "Expand chat history"
              : "Collapse chat history"
          }
        >
          <span aria-hidden="true">
            {collapsed ? "›" : "‹"}
          </span>
        </button>
      </div>

      {/* History heading */}
      <p className="easeql-sidebar-heading">
        History
      </p>

      {/* New chat */}
      <div
        className={
          collapsed
            ? "easeql-new-chat-slot is-collapsed"
            : "easeql-new-chat-slot"
        }
      >
        <NewChatButton
          creating={creating}
          onCreate={() => void handleCreate()}
          collapsed={collapsed}
        />
      </div>

      {/* Error */}
      {error ? (
        <div
          className="easeql-sidebar-error"
          role="alert"
        >
          <p>{error}</p>

          <button
            type="button"
            onClick={() => void loadSessions()}
          >
            Try again
          </button>
        </div>
      ) : null}

      {/* Chat history */}
      <div className="easeql-chat-list">
        {loading ? (
          <div
            aria-label="Loading chats"
            className="easeql-chat-loading"
          >
            <div />
            <div />
            <div />
          </div>
        ) : sessions.length === 0 ? (
          <div className="easeql-empty-history">
            No chats yet.
            <br />
            Start one when you're ready.
          </div>
        ) : (
          <ul aria-label="Chat sessions">
            {sessions.map((session) => (
              <ChatSessionItem
                key={session.id}
                session={session}
                selected={
                  selectedSessionId === session.id
                }
                collapsed={collapsed}
                deleting={
                  deletingSessionId === session.id
                }
                onSelect={onSelectSession}
                onDelete={(id) =>
                  void handleDelete(id)
                }
              />
            ))}
          </ul>
        )}
      </div>

      {/* Sidebar footer */}
      <div className="easeql-sidebar-footer">
        Local / private / your data
      </div>
    </aside>
  );
}