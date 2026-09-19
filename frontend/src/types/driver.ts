export type Gender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";

export interface DriverProfile {
  id: number;
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  address: string | null;
  city: string | null;
  nationality: string | null;
  national_id_number: string | null;
  drivers_license_number: string | null;
  created_at: string;
  updated_at: string;
}

export type DriverProfileUpdate = Partial<
  Omit<DriverProfile, "id" | "user_id" | "created_at" | "updated_at">
>;
