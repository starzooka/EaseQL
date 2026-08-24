"use client";

import { ChangeEvent, DragEvent, FormEvent, useState } from "react";
import FileUpload from "../components/FileUpload";
import Footer from "../components/Footer";
import Header from "../components/Header";
import QueryForm from "../components/QueryForm";
import ResultsDisplay, { type QueryResponse } from "../components/ResultsDisplay";

type UploadResponse = {
  table: string;
  row_count: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function displayValue(value: unknown) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [tableName, setTableName] = useState("");
  const [question, setQuestion] = useState("");
  const [uploading, setUploading] = useState(false);
  const [querying, setQuerying] = useState(false);
  const [query, setQuery] = useState<QueryResponse | null>(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

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
        body: formData,
      });
      const data = (await response.json()) as UploadResponse & { detail?: string };
      if (!response.ok) throw new Error(data.detail ?? "Upload failed.");
      setTableName(data.table);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table_name: tableName, natural_language_query: question.trim() }),
      });
      const data = (await response.json()) as QueryResponse & { detail?: string };
      if (!response.ok) throw new Error(data.detail ?? "Could not answer that question.");
      setQuery(data);
    } catch (queryError) {
      setError(queryError instanceof Error ? queryError.message : "Could not answer that question.");
    } finally {
      setQuerying(false);
    }
  };

  const columns = query?.results.length ? Object.keys(query.results[0]) : [];

  return (
    <main className="min-h-screen bg-[#0a0a0a] font-sans text-slate-300 antialiased selection:bg-blue-500/30 selection:text-blue-200">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-10 pb-20 sm:gap-12 sm:px-8 lg:px-10 lg:py-16">
        <Header />

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
            question={question}
            setQuestion={setQuestion}
            querying={querying}
            submitQuestion={submitQuestion}
          />
        </section>

        <ResultsDisplay query={query} error={error} columns={columns} displayValue={displayValue} />
        <Footer />
      </div>
    </main>
  );
}