import type { ChangeEvent, DragEvent } from "react";

export type DatasetUploadStatus = "uploading" | "success" | "error";

export interface DatasetUpload {
  id: string;
  file: File | null;
  datasetId: number | null;
  filename: string;
  tableName: string | null;
  rowCount: number | null;
  status: DatasetUploadStatus;
  error: string | null;
}

export interface FileUploadProps {
  datasets: DatasetUpload[];
  uploading: boolean;
  isDragging: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (event: DragEvent<HTMLLabelElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLLabelElement>) => void;
  onRetry: (datasetId: string) => void;
}

export default function FileUpload({
  datasets,
  uploading,
  isDragging,
  onFileChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onRetry,
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
          {datasets.length > 0
            ? "Add another CSV file"
            : "Drop your file here"}
        </span>

        <span className="mt-2 text-xs text-[var(--muted)] sm:text-sm">
          or click to browse · CSV only
        </span>

        <input
          id="file-upload"
          type="file"
          accept=".csv,text/csv"
          onChange={onFileChange}
          disabled={uploading}
          className="sr-only"
        />
      </label>

      {uploading ? (
        <p className="mt-4 text-xs font-medium text-[var(--teal)] sm:text-sm">
          Loading your dataset...
        </p>
      ) : null}

      {datasets.length > 0 ? (
        <div className="mt-5 space-y-2" aria-label="Ingested datasets">
          {datasets.map((dataset) => (
            <div
              key={dataset.id}
              className="border border-[var(--line)] px-3 py-2.5"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-[var(--paper)]">
                    {dataset.filename}
                  </p>

                  <p className="mt-1 truncate text-[10px] text-[var(--muted)]">
                    {dataset.tableName ?? "Preparing dataset..."}
                    {dataset.rowCount !== null
                      ? ` · ${dataset.rowCount} rows`
                      : ""}
                  </p>
                </div>

                <span
                  className={
                    dataset.status === "error"
                      ? "shrink-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--danger)]"
                      : "shrink-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--teal)]"
                  }
                >
                  {dataset.status === "uploading"
                    ? "Ingesting"
                    : dataset.status === "success"
                      ? "Ready"
                      : "Error"}
                </span>
              </div>

              {dataset.error ? (
                <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-[var(--danger)]">
                  <span>{dataset.error}</span>

                  <button
                    type="button"
                    onClick={() => onRetry(dataset.id)}
                    disabled={uploading}
                    className="shrink-0 font-semibold text-[var(--amber)] underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Retry
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
