import { api } from "./api";
import type { DriverProfile, DriverProfileUpdate } from "../types/driver";

export async function getMyProfile() {
  const { data } = await api.get<DriverProfile>("/api/drivers/me");
  return data;
}

export async function updateMyProfile(payload: DriverProfileUpdate) {
  const { data } = await api.put<DriverProfile>("/api/drivers/profile", payload);
  return data;
}
