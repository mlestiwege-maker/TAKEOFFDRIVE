import { api } from "./api";
import type { Vehicle, VehicleCreate } from "../types/vehicle";

export async function listVehicles() {
  const { data } = await api.get<Vehicle[]>("/api/vehicles");
  return data;
}

export async function addVehicle(payload: VehicleCreate) {
  const { data } = await api.post<Vehicle>("/api/vehicles", payload);
  return data;
}

export async function updateVehicle(id: number, payload: VehicleCreate) {
  const { data } = await api.put<Vehicle>(`/api/vehicles/${id}`, payload);
  return data;
}

export async function deleteVehicle(id: number) {
  await api.delete(`/api/vehicles/${id}`);
}
