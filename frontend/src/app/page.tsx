"use client";

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";

import FileUpload from "../components/FileUpload";
import Footer from "../components/Footer";
import Header from "../components/Header";
import ResultsDisplay, {
  type QueryResponse,
} from "../components/ResultsDisplay";

import { useAuth } from "@/components/auth/useAuth";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatInput from "@/components/chat/ChatInput";
import ChatMessages from "@/components/chat/ChatMessages";
import QueryHistory from "@/components/chat/QueryHistory";

import MemoryPanel from "@/components/memory/MemoryPanel";
import MemorySuggestion from "@/components/memory/MemorySuggestion";

import {
  createMemory,
  type CreateMemoryInput,
} from "@/lib/api/memories";

import {
  createChatSession,
  getChatSession,
  listChatSessions,
} from "@/lib/api/chatSessions";

import {
  createChatMessage,
  listChatMessages,
  type ChatMessage,
} from "@/lib/api/chatMessages";

import {
  listSavedQueryResults,
  type SavedQueryResult,
} from "@/lib/api/savedQueryResults";

type UploadResponse = {
  dataset_id: number;
  table: string;
  row_count: number;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

function displayValue(value: unknown) {
  if (value === null || value === undefined) {
    return "null";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

async function fetchSessionData(
  activeSessionId: number
) {
  const [messages, savedQueries] =
    await Promise.all([
      listChatMessages(activeSessionId),
      listSavedQueryResults(activeSessionId),
    ]);

  return {
    messages,
    savedQueries,
  };
}

/*
 * Handles simple conversational messages locally.
 * These messages do not go through the SQL/Ollama pipeline.
 */
function getCasualResponse(
  content: string
): string | null {
  const normalized =
    content.trim().toLowerCase();

  if (
    [
      "hi",
      "hello",
      "hey",
      "hi there",
      "hello there",
      "hey there",
    ].includes(normalized)
  ) {
    return "Hi! How can I help you analyze your dataset?";
  }

  if (
    [
      "thanks",
      "thank you",
      "thx",
    ].includes(normalized)
  ) {
    return "You're welcome!";
  }

  if (
    ["bye", "goodbye"].includes(
      normalized
    )
  ) {
    return "Goodbye!";
  }

  return null;
}

/*
 * Display-only welcome message.
 *
 * This message is NOT persisted in the database.
 * It is shown only for a new chat that has:
 * - no real messages
 * - no dataset
 */
const WELCOME_MESSAGE: ChatMessage = {
  id: -1,
  session_id: -1,
  user_id: -1,
  role: "assistant",
  content: `Welcome to EaseQL! 👋

Upload a CSV file to get started. Once your data is loaded, you can ask questions in plain English and EaseQL will analyze it for you.

You can ask things like:
• Show me the first 10 rows
• How many records are in the dataset?
• What is the average Data_value?
• Which group has the highest average value?

Getting started:
1. Upload a CSV file below.
2. Wait for the dataset to load.
3. Ask your question in the chat.`,
  created_at: new Date().toISOString(),
};

function LandingPage() {
  return (
    <main className={styles.landing}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="EaseQL home">
          <span className={styles.brandMark} aria-hidden="true" />
          EaseQL
        </Link>
        <nav className={styles.nav} aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
          <a href="#privacy">Privacy</a>
          <Link href="/login" className={styles.navAction}>Sign in</Link>
        </nav>
      </header>

      <section className={`${styles.hero} ${styles.contentWidth}`}>
        <div className={styles.heroCopy}>
          <h1>Ask your<br />spreadsheet a<br />question.</h1>
          <p>Upload a CSV, type what you want to know in plain English, and EaseQL writes the SQL, runs it against your data, and hands back the answer - no query language required.</p>
          <div className={styles.actions}>
            <Link href="/register" className={styles.primaryButton}>Get started free</Link>
            <a href="#how-it-works" className={styles.secondaryButton}>See how it works</a>
          </div>
        </div>

        <div className={styles.preview} aria-label="Example EaseQL query result">
          <div className={styles.previewLabel}>EASEQL - SALES_IMPORT.CSV</div>
          <div className={styles.question}>which region had the biggest drop in sales last quarter?</div>
          <div className={styles.sqlPanel}>
            <div className={styles.sqlLabel}>GENERATED SQL</div>
            <code>SELECT region,<br />&nbsp;&nbsp;&nbsp;&nbsp;SUM(revenue) AS q_revenue<br />FROM sales_import<br />WHERE quarter = &apos;2025-Q2&apos;<br />GROUP BY region<br />ORDER BY q_revenue ASC<br />LIMIT 3;</code>
            <div className={styles.resultHeader}><span>REGION</span><span>Q REVENUE</span></div>
            <div className={styles.resultRow}><strong>Midwest</strong><strong>$142,300</strong></div>
            <div className={styles.resultRow}><strong>Southeast</strong><strong>$168,900</strong></div>
            <div className={styles.resultRow}><strong>Northeast</strong><strong>$201,450</strong></div>
            <p className={styles.resultNote}>Midwest revenue fell 19% quarter over quarter - the steepest drop of any region.</p>
          </div>
        </div>
      </section>

      <section id="features" className={styles.featureStrip}>
        <div className={styles.contentWidthSmall}>
          <div className={styles.featureGrid}>
            <div><span>RUNS ON YOUR MACHINE</span><p>The language model and the database both run locally. Nothing about your data has to touch a server you don&apos;t control.</p></div>
            <div><span>BUILT ON DUCKDB</span><p>Your upload becomes a real, queryable table. Fast enough for spreadsheets with millions of rows.</p></div>
            <div><span>OPEN SOURCE</span><p>The frontend, backend, and prompts are all inspectable. Nothing about how it answers is hidden from you.</p></div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className={`${styles.section} ${styles.contentWidthSmall}`}>
        <h2>From CSV to answer, in three steps.</h2>
        <p className={styles.sectionIntro}>No schema design, no joins to write by hand - EaseQL figures out the shape of your data and asks you nothing but the question.</p>
        <div className={styles.steps}>
          <div><span>01</span><h3>Upload</h3><p>Drop in a CSV. EaseQL profiles the columns, infers types, and loads it into a private DuckDB table under your account.</p></div>
          <div><span>02</span><h3>Ask</h3><p>Type your question the way you&apos;d ask a coworker - &quot;what were our best sellers in March?&quot; No syntax to remember.</p></div>
          <div><span>03</span><h3>Get answers</h3><p>See the generated SQL alongside the result table, then save it, revisit it, or ask a follow-up in the same thread.</p></div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.memorySection} ${styles.contentWidthSmall}`}>
        <h2>It remembers the conversation, not<br />just the query.</h2>
        <p className={styles.sectionIntro}>EaseQL is built around threads, not one-off lookups - so context you&apos;ve already given it carries forward.</p>
        <div className={styles.memoryRows}>
          <div><h3><i className={styles.amberMarker} />Session history</h3><p>Every conversation is saved on its own thread, so you can pick up where you left off last week without re-explaining your data.</p></div>
          <div><h3><i className={styles.tealMarker} />Memory</h3><p>Tell EaseQL a preference once - &quot;always show revenue in thousands&quot; - and it applies that context to future questions automatically.</p></div>
          <div><h3><i className={styles.amberMarker} />Saved results</h3><p>Pin an answer you&apos;ll need again. It sits alongside your chat history, one click away instead of a query you have to re-run.</p></div>
          <div><h3><i className={styles.tealMarker} />Private accounts</h3><p>Sign in and your uploads, threads, and saved results are scoped to you - nobody else on the deployment can see them.</p></div>
        </div>
      </section>

      <section id="privacy" className={styles.privacySection}>
        <div className={styles.privacyCopy}>
          <h2>Your data doesn&apos;t need to leave the room to<br />be understood.</h2>
          <p>EaseQL pairs a local language model with a local database, so the round trip from question to answer never has to leave your machine. It&apos;s the same reason a lot of teams can&apos;t use a cloud analytics tool on their real numbers in the first place - this one was built to not need them at all.</p>
        </div>
      </section>

      <section className={`${styles.ctaSection} ${styles.contentWidthSmall}`}>
  <h2>Start asking questions.</h2>

  <div className={styles.actions}>
    <Link href="/register" className={styles.primaryButton}>
      Create an account
    </Link>

    <a
      href="https://github.com/starzooka/EaseQL"
      className={styles.secondaryButton}
    >
      Read the docs
    </a>
  </div>

  <p>Free. Open source. Runs on your laptop.</p>
</section>

      <footer className={`${styles.footer} ${styles.contentWidthSmall}`}>
        <span>EaseQL / natural language analytics</span>
        <span>Local and private</span>
      </footer>
    </main>
  );
}

export default function Home() {
  const router = useRouter();

  const {
    isAuthenticated,
    loading,
    logout,
  } = useAuth();

  const [file, setFile] =
    useState<File | null>(null);

  const [tableName, setTableName] =
    useState("");

  const [datasetId, setDatasetId] =
    useState<number | null>(null);

  const [uploading, setUploading] =
    useState(false);

  const [query, setQuery] =
    useState<QueryResponse | null>(null);

  const [memorySuggestion, setMemorySuggestion] =
    useState<
      QueryResponse["memory_suggestion"]
    >();

  const [memorySaving, setMemorySaving] =
    useState(false);

  const [memorySuggestionError, setMemorySuggestionError] =
    useState("");

  const [error, setError] =
    useState("");

  const [isDragging, setIsDragging] =
    useState(false);

  const [sessionId, setSessionId] =
    useState<number | null>(null);

  const [sessionTitle, setSessionTitle] =
    useState("New chat");

  const [sessionLoading, setSessionLoading] =
    useState(true);

  const [sessionError, setSessionError] =
    useState("");

  const [sessionDataLoading, setSessionDataLoading] =
    useState(false);

  const [
    sessionInitializationRetryKey,
    setSessionInitializationRetryKey,
  ] = useState(0);

  const [
    sessionDataRetryKey,
    setSessionDataRetryKey,
  ] = useState(0);

  const [sessionDataError, setSessionDataError] =
    useState("");

  const [sessionMessages, setSessionMessages] =
    useState<ChatMessage[]>([]);

  const [savedQueries, setSavedQueries] =
    useState<SavedQueryResult[]>([]);

  const [queryHistoryRequest, setQueryHistoryRequest] =
    useState<{ queryId: number | null; key: number }>({
      queryId: null,
      key: 0,
    });

  const [messageSending, setMessageSending] =
    useState(false);

  const [sessionCreating, setSessionCreating] =
    useState(false);

  const [messageError, setMessageError] =
    useState("");

  const [preferencesOpen, setPreferencesOpen] =
    useState(false);

  const [sidebarRefreshKey, setSidebarRefreshKey] =
    useState(0);

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  const sessionInitializationPromise =
    useRef<
      Promise<{
        session: Awaited<
          ReturnType<typeof createChatSession>
        >;
        created: boolean;
      }> | null
    >(null);

  const activeSessionIdRef =
    useRef<number | null>(null);

  /*
   * Initialize the active chat session.
   */
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let cancelled = false;

    if (
      !sessionInitializationPromise.current
    ) {
      sessionInitializationPromise.current =
        listChatSessions().then(
          async (sessions) => {
            return {
              session:
                sessions[0] ??
                (await createChatSession()),
              created:
                sessions.length === 0,
            };
          }
        );
    }

    void sessionInitializationPromise.current
      .then(
        ({
          session: activeSession,
          created,
        }) => {
          if (cancelled) {
            return;
          }

          if (created) {
            setSidebarRefreshKey(
              (current) =>
                current + 1
            );
          }

          setSessionDataLoading(true);

          activeSessionIdRef.current =
            activeSession.id;

          setSessionId(
            activeSession.id
          );

          setSessionTitle(
            activeSession.title ??
              "New chat"
          );
        }
      )
      .catch(
        (loadError: unknown) => {
          if (!cancelled) {
            sessionInitializationPromise.current =
              null;

            activeSessionIdRef.current =
              null;

            setSessionId(null);

            setSessionDataLoading(
              false
            );

            setSessionError(
              loadError instanceof Error
                ? loadError.message
                : "Could not start a chat session."
            );
          }
        }
      )
      .finally(() => {
        if (!cancelled) {
          setSessionLoading(
            false
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    isAuthenticated,
    sessionInitializationRetryKey,
  ]);

  /*
   * Load selected session data.
   */
  useEffect(() => {
    if (!sessionId) {
      return;
    }

    let cancelled = false;

    void Promise.all([
      getChatSession(sessionId),
      fetchSessionData(sessionId),
    ])
      .then(
        ([
          session,
          {
            messages,
            savedQueries,
          },
        ]) => {
          if (cancelled) {
            return;
          }

          setSessionTitle(
            session.title ??
              "New chat"
          );

          setDatasetId(
            session.dataset_id
          );

          setTableName(
            session.dataset_table_name ??
              ""
          );

          setFile(null);

          /*
           * Show the welcome message only
           * when this is an empty new chat
           * with no dataset.
           */
          if (
            messages.length === 0 &&
            !session.dataset_id
          ) {
            setSessionMessages([
              {
                ...WELCOME_MESSAGE,
                session_id:
                  session.id,
                created_at:
                  new Date().toISOString(),
              },
            ]);
          } else {
            setSessionMessages(
              messages
            );
          }

          setSavedQueries(
            savedQueries
          );
        }
      )
      .catch(
        (loadError: unknown) => {
          if (!cancelled) {
            setSessionDataError(
              loadError instanceof Error
                ? loadError.message
                : "Could not load this chat."
            );
          }
        }
      )
      .finally(() => {
        if (!cancelled) {
          setSessionDataLoading(
            false
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    sessionId,
    sessionDataRetryKey,
  ]);

  /*
   * Authentication loading state.
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--ink)] font-sans text-[var(--paper)] antialiased">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 sm:px-8 lg:px-10">
          <p className="text-sm text-[var(--muted)]">
            Checking your session...
          </p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  const handleUnauthorized =
    () => {
      logout();
      router.replace("/login");
    };

  /*
   * Switch active chat session.
   */
  const handleSessionSelect = (
    nextSessionId: number | null
  ) => {
    activeSessionIdRef.current =
      nextSessionId;

    setSessionId(
      nextSessionId
    );

    setSessionTitle(
      nextSessionId === null
        ? "No active chat"
        : "Loading chat..."
    );

    /*
     * Clear dataset state while
     * the selected session is loading.
     */
    setDatasetId(null);
    setTableName("");
    setFile(null);

    setSessionError("");
    setSessionDataError("");
    setError("");
    setMessageError("");

    setQuery(null);

    setMemorySuggestion(
      undefined
    );

    setMemorySuggestionError(
      ""
    );

    setMessageSending(false);

    setSessionDataLoading(
      nextSessionId !== null
    );

    setSessionDataRetryKey(
      (current) => current + 1
    );

    setSessionMessages([]);
    setSavedQueries([]);
    setQueryHistoryRequest({ queryId: null, key: 0 });
  };

  const handleViewQuery = (historyId: number) => {
    setQueryHistoryRequest((current) => ({
      queryId: historyId,
      key: current.key + 1,
    }));
  };

  /*
   * Retry loading the active session.
   */
  const retrySessionLoad =
    () => {
      setSessionError("");
      setSessionDataError("");

      setSessionLoading(
        sessionId === null
      );

      setSessionDataLoading(
        sessionId !== null
      );

      if (sessionId === null) {
        sessionInitializationPromise.current =
          null;

        setSessionInitializationRetryKey(
          (current) =>
            current + 1
        );
      } else {
        setSessionDataRetryKey(
          (current) =>
            current + 1
        );
      }
    };

  /*
   * Send a chat message.
   */
  const handleSendMessage =
    async (
      content: string
    ) => {
      if (!sessionId) {
        return false;
      }

      const activeSessionId =
        sessionId;

      const casualResponse =
        getCasualResponse(
          content
        );

      setMessageSending(true);
      setMessageError("");

      try {
        /*
         * Casual conversation does not
         * go through SQL/Ollama.
         */
        if (casualResponse) {
          await createChatMessage(
            activeSessionId,
            {
              role: "user",
              content,
            }
          );

          await createChatMessage(
            activeSessionId,
            {
              role: "assistant",
              content:
                casualResponse,
            }
          );

          if (
            activeSessionIdRef.current !==
            activeSessionId
          ) {
            return false;
          }

          setQuery(null);

          setMemorySuggestion(
            undefined
          );

          setMemorySuggestionError(
            ""
          );

          const [
            session,
            {
              messages,
              savedQueries,
            },
          ] = await Promise.all([
            getChatSession(
              activeSessionId
            ),
            fetchSessionData(
              activeSessionId
            ),
          ]);

          if (
            activeSessionIdRef.current ===
            activeSessionId
          ) {
            setSessionTitle(
              session.title ??
                "New chat"
            );

            setSessionMessages(
              messages
            );

            setSavedQueries(
              savedQueries
            );
          }

          return true;
        }

        /*
         * Data questions require a dataset.
         */
        if (
          !tableName ||
          !datasetId
        ) {
          setMessageError(
            "Please load a dataset before asking a data question."
          );

          return false;
        }

        const response =
          await fetch(
            `${API_URL}/api/query`,
            {
              method: "POST",
              credentials:
                "include",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                table_name:
                  tableName,
                dataset_id:
                  datasetId,
                natural_language_query:
                  content,
                session_id:
                  activeSessionId,
              }),
            }
          );

        if (
          response.status ===
          401
        ) {
          handleUnauthorized();
          return false;
        }

        const data =
          (await response.json()) as QueryResponse & {
            detail?: string;
          };

        if (!response.ok) {
          throw new Error(
            data.detail ??
              "Could not answer that question."
          );
        }

        if (
          activeSessionIdRef.current !==
          activeSessionId
        ) {
          return false;
        }

        setQuery(data);

        setMemorySuggestion(
          data.memory_suggestion
        );

        setMemorySuggestionError(
          ""
        );

        const [
          session,
          {
            messages,
            savedQueries,
          },
        ] = await Promise.all([
          getChatSession(
            activeSessionId
          ),
          fetchSessionData(
            activeSessionId
          ),
        ]);

        if (
          activeSessionIdRef.current ===
          activeSessionId
        ) {
          setSessionTitle(
            session.title ??
              "New chat"
          );

          setSessionMessages(
            messages
          );

          setSavedQueries(
            savedQueries
          );
        }

        return true;
      } catch (
        sendError
      ) {
        if (
          activeSessionIdRef.current ===
          activeSessionId
        ) {
          setMessageError(
            sendError instanceof Error
              ? sendError.message
              : "Could not send that message."
          );
        }

        return false;
      } finally {
        if (
          activeSessionIdRef.current ===
          activeSessionId
        ) {
          setMessageSending(
            false
          );
        }
      }
    };

  /*
   * Upload a CSV file.
   */
  const uploadFile =
    async (
      selectedFile: File
    ) => {
      if (
        !selectedFile.name
          .toLowerCase()
          .endsWith(".csv")
      ) {
        setError(
          "Please choose a CSV file."
        );

        return;
      }

      setFile(
        selectedFile
      );

      setError("");

      setQuery(null);

      setMemorySuggestion(
        undefined
      );

      setMemorySuggestionError(
        ""
      );

      setUploading(true);

      const formData =
        new FormData();

      formData.append(
        "file",
        selectedFile
      );

      try {
        const response =
          await fetch(
            `${API_URL}/api/upload`,
            {
              method: "POST",
              credentials:
                "include",
              body: formData,
            }
          );

        if (
          response.status ===
          401
        ) {
          handleUnauthorized();
          return;
        }

        const data =
          (await response.json()) as UploadResponse & {
            detail?: string;
          };

        if (!response.ok) {
          throw new Error(
            data.detail ??
              "Upload failed."
          );
        }

        setTableName(
          data.table
        );

        setDatasetId(
          data.dataset_id
        );

        /*
         * Remove only the local
         * welcome/onboarding message.
         */
        setSessionMessages(
          (currentMessages) =>
            currentMessages.filter(
              (message) =>
                message.id !== -1
            )
        );
      } catch (
        uploadError
      ) {
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : "Upload failed."
        );

        setFile(null);
      } finally {
        setUploading(false);
      }
    };

  const handleFileChange =
    (
      event: ChangeEvent<HTMLInputElement>
    ) => {
      const selectedFile =
        event.target.files?.[0];

      if (selectedFile) {
        void uploadFile(
          selectedFile
        );
      }
    };

  const handleDragOver =
    (
      event: DragEvent<HTMLLabelElement>
    ) => {
      event.preventDefault();
      setIsDragging(true);
    };

  const handleDragLeave =
    () => {
      setIsDragging(false);
    };

  const handleDrop =
    (
      event: DragEvent<HTMLLabelElement>
    ) => {
      event.preventDefault();

      setIsDragging(false);

      const droppedFile =
        event.dataTransfer
          .files[0];

      if (droppedFile) {
        void uploadFile(
          droppedFile
        );
      }
    };

  /*
   * Save an explicitly accepted memory suggestion.
   */
  const rememberSuggestion =
    async () => {
      if (!memorySuggestion) {
        return;
      }

      setMemorySaving(true);

      setMemorySuggestionError(
        ""
      );

      const memory: CreateMemoryInput =
        {
          memory_type:
            memorySuggestion.memory_type,
          key:
            memorySuggestion.key,
          value:
            memorySuggestion.value,
          source:
            "query_suggestion",
          expires_at:
            memorySuggestion.expires_at,
        };

      try {
        await createMemory(
          memory
        );

        setMemorySuggestion(
          undefined
        );
      } catch (
        saveError
      ) {
        setMemorySuggestionError(
          saveError instanceof Error
            ? saveError.message
            : "Could not save this memory."
        );
      } finally {
        setMemorySaving(
          false
        );
      }
    };

  const columns =
    query?.results.length
      ? Object.keys(
          query.results[0]
        )
      : [];

  return (
    <main className="min-h-screen bg-[var(--ink)] font-sans text-[var(--paper)] antialiased selection:bg-[color-mix(in_srgb,var(--amber)_20%,transparent)] selection:text-[var(--amber)]">
      <div
        className={`easeql-layout grid w-full max-w-none items-start gap-5 px-3 py-4 pb-16 sm:px-6 sm:py-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-7 lg:px-8 lg:py-8${
          sidebarCollapsed
            ? " sidebar-collapsed"
            : ""
        }`}
      >
        <ChatSidebar
          selectedSessionId={
            sessionId
          }
          onSelectSession={
            handleSessionSelect
          }
          onCreatingChange={
            setSessionCreating
          }
          isAuthenticated={
            isAuthenticated
          }
          refreshKey={
            sidebarRefreshKey
          }
          collapsed={
            sidebarCollapsed
          }
          onToggleCollapse={() =>
            setSidebarCollapsed(
              (current) => !current
            )
          }
        />

        <div className="easeql-main flex min-w-0 flex-col gap-5 sm:gap-6">
          <Header
            onOpenPreferences={() =>
              setPreferencesOpen(
                true
              )
            }
            sessionTitle={
              sessionTitle
            }
            datasetLabel={
              tableName ||
              "No dataset loaded"
            }
          />

          {sessionLoading ? (
            <p className="text-xs text-[var(--muted)]">
              Starting your chat
              session...
            </p>
          ) : null}

          {sessionError ? (
            <div
              role="alert"
              className="rounded-lg border border-[color-mix(in_srgb,var(--danger)_25%,transparent)] bg-[color-mix(in_srgb,var(--danger)_6%,transparent)] px-4 py-3 text-xs text-[var(--danger)]"
            >
              <p>
                {sessionError}
              </p>

              <button
                type="button"
                onClick={
                  retrySessionLoad
                }
                className="mt-2 font-semibold text-[var(--amber)] underline underline-offset-4"
              >
                Try again
              </button>
            </div>
          ) : null}

          {sessionDataError ? (
            <div
              role="alert"
              className="rounded-lg border border-[color-mix(in_srgb,var(--danger)_25%,transparent)] bg-[color-mix(in_srgb,var(--danger)_6%,transparent)] px-4 py-3 text-xs text-[var(--danger)]"
            >
              <p>
                {sessionDataError}
              </p>

              <button
                type="button"
                onClick={
                  retrySessionLoad
                }
                className="mt-2 font-semibold text-[var(--amber)] underline underline-offset-4"
              >
                Try again
              </button>
            </div>
          ) : null}

          {sessionDataLoading ? (
            <p className="text-xs text-[var(--muted)]">
              Loading chat history...
            </p>
          ) : null}

          <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(260px,3fr)] lg:gap-6">
            <section className="flex h-full min-h-0 flex-col overflow-hidden border border-[var(--line)] bg-[color-mix(in_srgb,var(--ink)_88%,transparent)] shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
              <ChatMessages
                messages={
                  sessionMessages
                }
                loading={
                  sessionDataLoading
                }
                thinking={
                  messageSending
                }
                error={
                  sessionDataError
                }
                onViewQuery={
                  handleViewQuery
                }
              />

              <ChatInput
                disabled={
                  !sessionId ||
                  sessionLoading ||
                  sessionDataLoading ||
                  sessionCreating
                }
                sending={
                  messageSending
                }
                error={
                  messageError
                }
                onSend={
                  handleSendMessage
                }
              />
            </section>

            <section className="min-h-0">
              <FileUpload
                file={file}
                tableName={
                  tableName
                }
                uploading={
                  uploading
                }
                isDragging={
                  isDragging
                }
                onFileChange={
                  handleFileChange
                }
                onDragOver={
                  handleDragOver
                }
                onDragLeave={
                  handleDragLeave
                }
                onDrop={
                  handleDrop
                }
              />
            </section>
          </div>

          <ResultsDisplay
            query={query}
            error={error}
            columns={
              columns
            }
            displayValue={
              displayValue
            }
          />

          {memorySuggestion ? (
            <MemorySuggestion
              suggestion={
                memorySuggestion
              }
              saving={
                memorySaving
              }
              error={
                memorySuggestionError
              }
              onRemember={() =>
                void rememberSuggestion()
              }
              onDismiss={() =>
                setMemorySuggestion(
                  undefined
                )
              }
            />
          ) : null}

          <QueryHistory
            key={
              sessionId ??
              "no-session"
            }
            queries={
              savedQueries
            }
            loading={
              sessionDataLoading
            }
            requestedQueryId={
              queryHistoryRequest.queryId
            }
            requestKey={
              queryHistoryRequest.key
            }
          />

          <Footer />
        </div>
      </div>

      {preferencesOpen ? (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-[color-mix(in_srgb,var(--ink)_82%,transparent)] px-4 py-8 sm:px-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preferences-title"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setPreferencesOpen(
                false
              );
            }
          }}
        >
          <div className="mx-auto max-w-5xl">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2
                id="preferences-title"
                className="text-sm font-semibold text-[var(--paper)]"
              >
                Preferences
              </h2>

              <button
                type="button"
                onClick={() =>
                  setPreferencesOpen(
                    false
                  )
                }
                className="rounded-md border border-[var(--line)] px-3 py-2 text-xs font-medium text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:bg-[color-mix(in_srgb,var(--paper)_4%,transparent)] hover:text-[var(--paper)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]"
              >
                Close
              </button>
            </div>

            <MemoryPanel />
          </div>
        </div>
      ) : null}
    </main>
  );
}