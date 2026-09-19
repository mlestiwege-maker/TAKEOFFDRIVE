import { api } from "./api";
import type { DocumentType, DriverDocument } from "../types/document";

export async function listDocuments() {
  const { data } = await api.get<DriverDocument[]>("/api/documents");
  return data;
}

export async function uploadDocument(documentType: DocumentType, file: File) {
  const formData = new FormData();
  formData.append("document_type", documentType);
  formData.append("file", file);
  const { data } = await api.post<DriverDocument>("/api/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteDocument(id: number) {
  await api.delete(`/api/documents/${id}`);
}

// Document endpoints require a bearer token, so a plain <a href> won't work;
// fetch as a blob and open it via an object URL instead.
export async function openDocument(id: number, adminView = false) {
  const path = adminView ? `/api/admin/documents/${id}/file` : `/api/documents/${id}/file`;
  const { data } = await api.get(path, { responseType: "blob" });
  const url = window.URL.createObjectURL(data);
  window.open(url, "_blank");
  setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
}
