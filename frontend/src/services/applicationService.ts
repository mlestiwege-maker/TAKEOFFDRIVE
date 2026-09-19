import { api } from "./api";
import type { Application, ApplicationDetail } from "../types/application";

export async function getMyApplication() {
  const { data } = await api.get<ApplicationDetail>("/api/applications/me");
  return data;
}

export async function submitMyApplication() {
  const { data } = await api.post<Application>("/api/applications");
  return data;
}
