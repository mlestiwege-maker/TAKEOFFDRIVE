import { useRef, useState } from "react";

interface FileUploadProps {
  label: string;
  accept?: string;
  onFileSelected: (file: File) => Promise<void> | void;
  currentFileName?: string | null;
  status?: "PENDING" | "ACCEPTED" | "REJECTED";
  onView?: () => void;
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  ACCEPTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

export default function FileUpload({
  label,
  accept = ".pdf,.png,.jpg,.jpeg",
  onFileSelected,
  currentFileName,
  status,
  onView,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      await onFileSelected(file);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        {currentFileName ? (
          <div className="mt-1 flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-xs text-slate-500 dark:text-slate-400">{currentFileName}</p>
            {status && (
              <span
                className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[status]}`}
              >
                {status === "ACCEPTED" ? "✓ Uploaded" : status === "REJECTED" ? "Rejected" : "Pending review"}
              </span>
            )}
          </div>
        ) : (
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">No file uploaded yet</p>
        )}
        {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {currentFileName && onView && (
          <button
            type="button"
            onClick={onView}
            className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            View
          </button>
        )}
        <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
          {isUploading ? "Uploading…" : currentFileName ? "Replace" : "Upload"}
          <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} disabled={isUploading} />
        </label>
      </div>
    </div>
  );
}
