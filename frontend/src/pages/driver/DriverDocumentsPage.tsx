import { useEffect, useState } from "react";
import FileUpload from "../../components/FileUpload";
import * as documentService from "../../services/documentService";
import { DOCUMENT_TYPE_LABELS, REQUIRED_DOCUMENT_TYPES } from "../../types/document";
import type { DocumentType, DriverDocument } from "../../types/document";

export default function DriverDocumentsPage() {
  const [documents, setDocuments] = useState<DriverDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = () => documentService.listDocuments().then(setDocuments);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
  }, []);

  const handleUpload = async (documentType: DocumentType, file: File) => {
    await documentService.uploadDocument(documentType, file);
    await refresh();
  };

  if (isLoading) return <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Documents</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage the documents attached to your application.</p>
      </div>
      <div className="flex flex-col gap-3">
        {REQUIRED_DOCUMENT_TYPES.map((type) => {
          const doc = documents.find((d) => d.document_type === type);
          return (
            <FileUpload
              key={type}
              label={DOCUMENT_TYPE_LABELS[type]}
              currentFileName={doc?.file_name ?? null}
              status={doc?.status}
              onFileSelected={(file) => handleUpload(type, file)}
              onView={doc ? () => documentService.openDocument(doc.id) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
