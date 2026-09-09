"use client";

import { ChangeEvent, DragEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FileUpload from "../components/FileUpload";
import Footer from "../components/Footer";
import Header from "../components/Header";
import QueryForm from "../components/QueryForm";
import ResultsDisplay, { type QueryResponse } from "../components/ResultsDisplay";
import { useAuth } from "@/components/auth/useAuth";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatInput from "@/components/chat/ChatInput";
import ChatMessages from "@/components/chat/ChatMessages";
import QueryHistory from "@/components/chat/QueryHistory";
import MemoryPanel from "@/components/memory/MemoryPanel";
import { createChatSession, listChatSessions } from "@/lib/api/chatSessions";
import { createChatMessage, listChatMessages, type ChatMessage } from "@/lib/api/chatMessages";
import { listSavedQueryResults, type SavedQueryResult } from "@/lib/api/savedQueryResults";

type UploadResponse = {
  dataset_id: number;
  table: string;
  row_count: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function displayValue(value: unknown) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

async function fetchSessionData(activeSessionId: number) {
  const [messages, savedQueries] = await Promise.all([
    listChatMessages(activeSessionId),
    listSavedQueryResults(activeSessionId),
  ]);
  return { messages, savedQueries };
}

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading, logout } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [tableName, setTableName] = useState("");
  const [datasetId, setDatasetId] = useState<number | null>(null);
  const [question, setQuestion] = useState("");
  const [uploading, setUploading] = useState(false);
  const [querying, setQuerying] = useState(false);
  const [query, setQuery] = useState<QueryResponse | null>(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [sessionDataLoading, setSessionDataLoading] = useState(false);
  const [sessionDataError, setSessionDataError] = useState("");
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([]);
  const [savedQueries, setSavedQueries] = useState<SavedQueryResult[]>([]);
  const [messageSending, setMessageSending] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);
  const sessionInitialized = useRef(false);
  const activeSessionIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (!isAuthenticated || sessionInitialized.current) return;

    sessionInitialized.current = true;
    let cancelled = false;

    void listChatSessions()
      .then(async (sessions) => {
        if (cancelled) return;

        const activeSession = sessions[0] ?? (await createChatSession());
        if (cancelled) return;

        if (sessions.length === 0) setSidebarRefreshKey((current) => current + 1);
        setSessionDataLoading(true);
        activeSessionIdRef.current = activeSession.id;
        setSessionId(activeSession.id);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setSessionError(loadError instanceof Error ? loadError.message : "Could not start a chat session.");
        }
      })
      .finally(() => {
        if (!cancelled) setSessionLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;

    void fetchSessionData(sessionId)
      .then(({ messages, savedQueries }) => {
        if (cancelled) return;
        setSessionMessages(messages);
        setSavedQueries(savedQueries);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setSessionDataError(loadError instanceof Error ? loadError.message : "Could not load this chat.");
        }
      })
      .finally(() => {
        if (!cancelled) setSessionDataLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (loading || !isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] font-sans text-slate-300 antialiased">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 sm:px-8 lg:px-10">
          <p className="text-sm text-slate-400">Checking your session...</p>
        </div>
      </main>
    );
  }

  const handleUnauthorized = () => {
    logout();
    router.replace("/login");
  };

  const handleSessionSelect = (nextSessionId: number | null) => {
    activeSessionIdRef.current = nextSessionId;
    setSessionId(nextSessionId);
    setSessionDataError("");
    setSessionDataLoading(nextSessionId !== null);
    setSessionMessages([]);
    setSavedQueries([]);
    if (nextSessionId === null) {
      setMessageError("");
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!sessionId) return false;

    const activeSessionId = sessionId;
    setMessageSending(true);
    setMessageError("");

    try {
      await createChatMessage(activeSessionId, { role: "user", content });
      const { messages, savedQueries } = await fetchSessionData(activeSessionId);
      if (activeSessionIdRef.current === activeSessionId) {
        setSessionMessages(messages);
        setSavedQueries(savedQueries);
      }
      return true;
    } catch (sendError) {
      setMessageError(sendError instanceof Error ? sendError.message : "Could not send that message.");
      return false;
    } finally {
      setMessageSending(false);
    }
  };

  const uploadFile = async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setError("Please choose a CSV file.");
      return;
    }

    setFile(selectedFile);
    setError("");
    setQuery(null);
    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = (await response.json()) as UploadResponse & { detail?: string };
      if (!response.ok) throw new Error(data.detail ?? "Upload failed.");
      setTableName(data.table);
      setDatasetId(data.dataset_id);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) void uploadFile(selectedFile);
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) void uploadFile(droppedFile);
  };

  const submitQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tableName || !question.trim()) return;
    setError("");
    setQuerying(true);

    try {
      const response = await fetch(`${API_URL}/api/query`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table_name: tableName,
          dataset_id: datasetId,
          natural_language_query: question.trim(),
          ...(sessionId ? { session_id: sessionId } : {}),
        }),
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = (await response.json()) as QueryResponse & { detail?: string };
      if (!response.ok) throw new Error(data.detail ?? "Could not answer that question.");
      setQuery(data);
      setHistoryRefreshKey((current) => current + 1);
      if (sessionId) {
        const activeSessionId = sessionId;
        setSessionDataLoading(true);
        setSessionDataError("");
        void fetchSessionData(activeSessionId)
          .then(({ messages, savedQueries }) => {
            if (activeSessionIdRef.current !== activeSessionId) return;
            setSessionMessages(messages);
            setSavedQueries(savedQueries);
          })
          .catch((refreshError: unknown) => {
            setSessionDataError(refreshError instanceof Error ? refreshError.message : "Could not refresh this chat.");
          })
          .finally(() => {
            if (activeSessionIdRef.current === activeSessionId) setSessionDataLoading(false);
          });
      }
    } catch (queryError) {
      setError(queryError instanceof Error ? queryError.message : "Could not answer that question.");
    } finally {
      setQuerying(false);
    }
  };

  const columns = query?.results.length ? Object.keys(query.results[0]) : [];

  return (
    <main className="min-h-screen bg-[#0a0a0a] font-sans text-slate-300 antialiased selection:bg-blue-500/30 selection:text-blue-200">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 pb-20 sm:px-8 sm:py-10 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10 lg:px-10 lg:py-16">
        <ChatSidebar
          selectedSessionId={sessionId}
          onSelectSession={handleSessionSelect}
          isAuthenticated={isAuthenticated}
          refreshKey={sidebarRefreshKey}
        />

        <div className="flex min-w-0 flex-col gap-10 sm:gap-12">
          <Header />

          {sessionLoading ? <p className="text-xs text-slate-500">Starting your chat session...</p> : null}
          {sessionError ? (
            <div role="alert" className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-200">
              {sessionError}
            </div>
          ) : null}
          {sessionDataLoading ? <p className="text-xs text-slate-500">Loading chat history...</p> : null}

          {/* <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70 shadow-lg">
            <ChatMessages
              messages={sessionMessages}
              loading={sessionDataLoading}
              thinking={querying || messageSending}
              error={sessionDataError}
            />
            <ChatInput
              disabled={!sessionId || sessionLoading}
              sending={messageSending}
              error={messageError}
              onSend={handleSendMessage}
            />
          </section> */}

             <section className="grid items-stretch gap-6 lg:grid-cols-[1fr_1.2fr]">
            <FileUpload
              file={file}
              tableName={tableName}
              uploading={uploading}
              isDragging={isDragging}
              onFileChange={handleFileChange}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />

            <QueryForm
              tableName={tableName}
              datasetId={datasetId}
              question={question}
              setQuestion={setQuestion}
              querying={querying}
              submitQuestion={submitQuestion}
              historyRefreshKey={historyRefreshKey}
            />
          </section>

          <ResultsDisplay query={query} error={error} columns={columns} displayValue={displayValue} />

          <QueryHistory queries={savedQueries} loading={sessionDataLoading} />

          <MemoryPanel />

       
          <Footer />
        </div>
      </div>
    </main>
  );
}