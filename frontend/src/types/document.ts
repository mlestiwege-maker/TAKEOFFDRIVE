export type DocumentType =
  | "DRIVERS_LICENSE"
  | "NATIONAL_ID"
  | "PROOF_OF_ADDRESS"
  | "VEHICLE_REGISTRATION"
  | "VEHICLE_INSURANCE"
  | "VEHICLE_INSPECTION";

export type DocumentStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface DriverDocument {
  id: number;
  driver_id: number;
  document_type: DocumentType;
  file_name: string;
  file_url: string;
  content_type: string;
  size_bytes: number;
  status: DocumentStatus;
  uploaded_at: string;
}

export const REQUIRED_DOCUMENT_TYPES: DocumentType[] = [
  "NATIONAL_ID",
  "DRIVERS_LICENSE",
  "VEHICLE_REGISTRATION",
  "VEHICLE_INSURANCE",
];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  DRIVERS_LICENSE: "Driver's Licence",
  NATIONAL_ID: "National ID",
  PROOF_OF_ADDRESS: "Proof of Address",
  VEHICLE_REGISTRATION: "Vehicle Registration",
  VEHICLE_INSURANCE: "Vehicle Insurance",
  VEHICLE_INSPECTION: "Vehicle Inspection",
};
