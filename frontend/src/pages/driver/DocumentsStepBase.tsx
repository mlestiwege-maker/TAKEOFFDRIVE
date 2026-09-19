import { useEffect, useState } from "react";
import FileUpload from "../../components/FileUpload";
import OnboardingStepShell from "../../components/OnboardingStepShell";
import * as documentService from "../../services/documentService";
import { extractErrorMessage } from "../../services/api";
import { DOCUMENT_TYPE_LABELS } from "../../types/document";
import type { DocumentType, DriverDocument } from "../../types/document";

interface Props {
  title: string;
  description: string;
  documentTypes: DocumentType[];
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
}

export default function DocumentsStepBase({ title, description, documentTypes, onBack, onNext, nextLabel }: Props) {
  const [documents, setDocuments] = useState<DriverDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => documentService.listDocuments().then(setDocuments);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
  }, []);

  const handleUpload = async (documentType: DocumentType, file: File) => {
    setError(null);
    try {
      await documentService.uploadDocument(documentType, file);
      await refresh();
    } catch (err) {
      setError(extractErrorMessage(err));
      throw err;
    }
  };

  const handleNext = () => {
    const uploadedTypes = new Set(documents.map((d) => d.document_type));
    const missing = documentTypes.filter((t) => !uploadedTypes.has(t));
    if (missing.length > 0) {
      setError(`Please upload: ${missing.map((t) => DOCUMENT_TYPE_LABELS[t]).join(", ")}`);
      return;
    }
    onNext();
  };

  if (isLoading) return <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</div>;

  return (
    <OnboardingStepShell
      title={title}
      description={description}
      onNext={handleNext}
      onBack={onBack}
      nextLabel={nextLabel}
      error={error}
    >
      {documentTypes.map((type) => {
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
    </OnboardingStepShell>
  );
}
