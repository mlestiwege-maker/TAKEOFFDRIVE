export type VehicleType = "MOTORCYCLE" | "BICYCLE" | "CAR" | "VAN" | "TRUCK";

export interface Vehicle {
  id: number;
  driver_id: number;
  vehicle_type: VehicleType;
  registration_number: string;
  make: string;
  model: string;
  year: number;
  colour: string;
  created_at: string;
}

export type VehicleCreate = Omit<Vehicle, "id" | "driver_id" | "created_at">;
