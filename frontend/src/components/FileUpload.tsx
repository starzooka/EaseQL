import type { ChangeEvent, DragEvent } from "react";

export interface FileUploadProps {
  file: File | null;
  tableName: string;
  uploading: boolean;
  isDragging: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (event: DragEvent<HTMLLabelElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLLabelElement>) => void;
}

export default function FileUpload({
  file,
  tableName,
  uploading,
  isDragging,
  onFileChange,
  onDragOver,
  onDragLeave,
  onDrop,
}: FileUploadProps) {
  return (
    <div className="flex h-full flex-col border border-[var(--line)] bg-[var(--ink)] p-5 shadow-none transition-colors duration-200 hover:border-[var(--line-strong)] sm:p-6">
      <div className="mb-5 flex items-center justify-between sm:mb-6">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[var(--muted)] sm:text-xs">
            01 / Dataset
          </p>

          <h2 className="mt-1 text-lg font-semibold tracking-tight text-[var(--paper)] sm:text-xl">
            Bring your CSV
          </h2>
        </div>

        <span
          className="text-xl leading-none text-[var(--muted)] sm:text-2xl"
          aria-hidden="true"
        >
          ↗
        </span>
      </div>

      <label
        htmlFor="file-upload"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={[
          "flex min-h-[10rem] flex-1 cursor-pointer flex-col items-center justify-center",
          "border border-dashed px-4 text-center",
          "transition-colors duration-200 sm:min-h-[11rem] sm:px-6",
          isDragging
            ? "border-[var(--teal)] bg-[rgba(95,168,143,0.07)]"
            : "border-[var(--line-strong)] bg-transparent hover:border-[var(--teal)] hover:bg-[rgba(95,168,143,0.04)]",
        ].join(" ")}
      >
        <span
          className="mb-3 flex h-10 w-10 items-center justify-center border border-[var(--line-strong)] bg-transparent text-xl leading-none text-[var(--teal)] sm:mb-4 sm:h-11 sm:w-11"
          aria-hidden="true"
        >
          ↑
        </span>

        <span className="text-sm font-medium text-[var(--paper)] sm:text-base">
          {file ? file.name : "Drop your file here"}
        </span>

        <span className="mt-2 text-xs text-[var(--muted)] sm:text-sm">
          {file
            ? `${tableName} · ready to query`
            : "or click to browse · CSV only"}
        </span>

        <input
          id="file-upload"
          type="file"
          accept=".csv,text/csv"
          onChange={onFileChange}
          className="sr-only"
        />
      </label>

      {uploading ? (
        <p className="mt-4 text-xs font-medium text-[var(--teal)] sm:text-sm">
          Loading your dataset...
        </p>
      ) : null}

      {file && !uploading ? (
        <p className="mt-4 text-xs font-medium text-[var(--teal)] sm:text-sm">
          {tableName} is ready to query.
        </p>
      ) : null}
    </div>
  );
}
