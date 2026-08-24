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
    <div className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm transition-all duration-300 hover:border-slate-700 sm:p-7">
      <div className="mb-5 flex items-center justify-between sm:mb-6">
        <div>
          <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase sm:text-xs">01 / Dataset</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-white sm:mt-1.5 sm:text-xl">Bring your CSV</h2>
        </div>
        <span className="text-xl text-slate-600 transition-all duration-300 sm:text-2xl">↗</span>
      </div>
      
      <label
        htmlFor="file-upload"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`flex min-h-[12rem] flex-1 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 text-center transition-all duration-200 sm:min-h-[14rem] sm:px-6 ${isDragging ? "border-blue-500 bg-blue-900/20" : "border-slate-700 bg-slate-950/50 hover:border-blue-500/50 hover:bg-slate-900"}`}
      >
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-xl text-blue-500 shadow-sm sm:mb-4 sm:h-12 sm:w-12 sm:text-2xl">
          ↑
        </span>
        <span className="text-sm font-semibold text-slate-200 sm:text-base">
          {file ? file.name : "Drop your file here"}
        </span>
        <span className="mt-2 text-xs text-slate-500 sm:text-sm">
          {file ? `${tableName} · ready to query` : "or click to browse · CSV only"}
        </span>
        <input id="file-upload" type="file" accept=".csv,text/csv" onChange={onFileChange} className="sr-only" />
      </label>
      
      {uploading && <p className="mt-4 text-xs font-medium text-blue-400 sm:text-sm">Loading your dataset...</p>}
      {file && !uploading && <p className="mt-4 text-xs font-medium text-emerald-400 sm:text-sm">{tableName} is ready to query.</p>}
    </div>
  );
}