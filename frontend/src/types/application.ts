import type { DriverDocument } from "./document";
import type { DriverProfile } from "./driver";
import type { Vehicle } from "./vehicle";

export type ApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "CORRECTION_REQUIRED"
  | "APPROVED"
  | "REJECTED";

export type ReviewDecision = "APPROVED" | "REJECTED" | "CORRECTION_REQUIRED";

export interface DriverSummary {
  id: number;
  first_name: string | null;
  last_name: string | null;
  phone: string;
  email: string | null;
}

export interface ApplicationReview {
  id: number;
  application_id: number;
  admin_id: number;
  decision: ReviewDecision;
  notes: string | null;
  created_at: string;
}

export interface Application {
  id: number;
  driver_id: number;
  application_number: string;
  status: ApplicationStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationDetail {
  id: number;
  application_number: string;
  status: ApplicationStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  driver: DriverProfile;
  driver_contact: DriverSummary;
  vehicles: Vehicle[];
  documents: DriverDocument[];
  reviews: ApplicationReview[];
}

export interface ApplicationListItem {
  id: number;
  application_number: string;
  status: ApplicationStatus;
  submitted_at: string | null;
  created_at: string;
  driver: DriverSummary;
  vehicle_type: string | null;
}

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  CORRECTION_REQUIRED: "Correction Required",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};
