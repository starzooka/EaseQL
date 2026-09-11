"use client";

import { useCallback, useEffect, useState } from "react";

import {
  createMemory,
  deleteMemory,
  listMemories,
  updateMemory,
  type UserMemory,
} from "@/lib/api/memories";
import MemoryForm, { type MemoryFormValues } from "./MemoryForm";
import MemoryItem from "./MemoryItem";

async function fetchMemories() {
  return listMemories();
}

export default function MemoryPanel() {
  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingMemoryId, setDeletingMemoryId] = useState<number | null>(null);
  const [editingMemory, setEditingMemory] = useState<UserMemory | null>(null);
  const [error, setError] = useState("");

  const loadMemories = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setMemories(await fetchMemories());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load memories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void fetchMemories()
      .then((nextMemories) => {
        if (!cancelled) setMemories(nextMemories);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Could not load memories.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (values: MemoryFormValues) => {
    setSubmitting(true);
    setError("");

    try {
      const savedMemory = editingMemory
        ? await updateMemory(editingMemory.id, values)
        : await createMemory(values);
      setMemories((current) => {
        if (!editingMemory) return [savedMemory, ...current];
        return current.map((memory) => (memory.id === savedMemory.id ? savedMemory : memory));
      });
      setEditingMemory(null);
      return true;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save this memory.");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (memoryId: number) => {
    setDeletingMemoryId(memoryId);
    setError("");

    try {
      await deleteMemory(memoryId);
      setMemories((current) => current.filter((memory) => memory.id !== memoryId));
      if (editingMemory?.id === memoryId) setEditingMemory(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete this memory.");
    } finally {
      setDeletingMemoryId(null);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--ink)]/70 shadow-lg">
      <div className="border-b border-[var(--line)] p-4 sm:p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-[var(--amber)] uppercase">05 / Memory</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-[var(--paper)]">Preferences</h2>
          </div>
          <span className="text-xs text-[var(--muted)]">{memories.length} saved</span>
        </div>
        <p className="mt-2 max-w-2xl text-xs leading-5 text-[var(--muted)]">Save useful preferences for future context. Never store passwords, tokens, credentials, or other secrets.</p>
      </div>

      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
        <div>
          {error ? (
            <div role="alert" className="mb-4 rounded-lg border border-[rgba(217,107,95,0.35)] bg-[rgba(217,107,95,0.06)] px-3 py-2.5 text-xs leading-5 text-[var(--danger)]">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => void loadMemories()}
                className="mt-2 font-semibold text-[var(--danger)] underline decoration-red-400/50 underline-offset-4 hover:text-[var(--paper)]"
              >
                Try again
              </button>
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-3" aria-label="Loading memories">
              <div className="h-24 animate-pulse rounded-lg bg-[var(--ink)]" />
              <div className="h-24 animate-pulse rounded-lg bg-[var(--ink)]" />
            </div>
          ) : memories.length === 0 ? (
            <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-[var(--line)] px-4 text-center">
              <p className="text-xs leading-5 text-[var(--muted)]">No saved preferences yet.</p>
            </div>
          ) : (
            <ul className="space-y-3" aria-label="Saved memories">
              {memories.map((memory) => (
                <MemoryItem
                  key={memory.id}
                  memory={memory}
                  deleting={deletingMemoryId === memory.id}
                  onEdit={setEditingMemory}
                  onDelete={(id) => void handleDelete(id)}
                />
              ))}
            </ul>
          )}
        </div>

        <MemoryForm
          key={editingMemory?.id ?? "new"}
          memory={editingMemory}
          submitting={submitting}
          error={error}
          onSubmit={handleSubmit}
          onCancel={() => setEditingMemory(null)}
        />
      </div>
    </section>
  );
}