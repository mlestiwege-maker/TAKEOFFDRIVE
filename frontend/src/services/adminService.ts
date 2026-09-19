import { api } from "./api";
import type { ApplicationDetail, ApplicationListItem, ApplicationStatus, ReviewDecision } from "../types/application";

export interface AnalyticsSummary {
  status_counts: Record<string, number>;
  approval_rate: number | null;
  avg_turnaround_hours: number | null;
  submissions_by_day: { date: string; count: number }[];
}

export async function getAnalyticsSummary() {
  const { data } = await api.get<AnalyticsSummary>("/api/admin/analytics/summary");
  return data;
}

export async function listApplications(params?: { status?: ApplicationStatus; search?: string }) {
  const { data } = await api.get<ApplicationListItem[]>("/api/admin/applications", { params });
  return data;
}

export async function getApplicationDetail(id: number) {
  const { data } = await api.get<ApplicationDetail>(`/api/admin/applications/${id}`);
  return data;
}

export async function approveApplication(id: number, notes?: string) {
  const { data } = await api.post(`/api/admin/applications/${id}/approve`, { decision: "APPROVED", notes });
  return data;
}

export async function rejectApplication(id: number, notes: string) {
  const { data } = await api.post(`/api/admin/applications/${id}/reject`, { decision: "REJECTED", notes });
  return data;
}

export async function requestCorrection(id: number, notes: string) {
  const { data } = await api.post(`/api/admin/applications/${id}/request-correction`, {
    decision: "CORRECTION_REQUIRED",
    notes,
  });
  return data;
}

export async function reviewApplication(id: number, decision: ReviewDecision, notes?: string) {
  if (decision === "APPROVED") return approveApplication(id, notes);
  if (decision === "REJECTED") return rejectApplication(id, notes ?? "");
  return requestCorrection(id, notes ?? "");
}
