export const ONBOARDING_STEPS = [
  { key: "personal", label: "Personal", path: "/onboarding/personal" },
  { key: "contact", label: "Contact", path: "/onboarding/contact" },
  { key: "identity", label: "Identity", path: "/onboarding/identity" },
  { key: "vehicle", label: "Vehicle", path: "/onboarding/vehicle" },
  { key: "driver-documents", label: "Driver Docs", path: "/onboarding/driver-documents" },
  { key: "vehicle-documents", label: "Vehicle Docs", path: "/onboarding/vehicle-documents" },
  { key: "review", label: "Review", path: "/onboarding/review" },
] as const;

export const VEHICLE_TYPES = ["MOTORCYCLE", "BICYCLE", "CAR", "VAN", "TRUCK"] as const;

export const GENDERS = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"] as const;

// Validated against scripts/validate_palette.js (dataviz skill) for
// CVD-safe adjacent separation — CORRECTION_REQUIRED uses violet rather
// than orange because orange sat too close to UNDER_REVIEW's amber for
// both normal and deuteranopic vision. Light-mode steps target OKLCH
// L 0.43-0.77 against a light surface.
export const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#94a3b8",
  SUBMITTED: "#3b82f6",
  UNDER_REVIEW: "#f59e0b",
  CORRECTION_REQUIRED: "#a855f7",
  APPROVED: "#22c55e",
  REJECTED: "#ef4444",
};

// Separately validated for the dark surface (L 0.48-0.67 band) — the light
// steps above are too light/low-contrast against a near-black background,
// so this is not just "the same hues, darker," it's its own validated set.
export const STATUS_COLORS_DARK: Record<string, string> = {
  DRAFT: "#64748b",
  SUBMITTED: "#3b82f6",
  UNDER_REVIEW: "#d97706",
  CORRECTION_REQUIRED: "#9333ea",
  APPROVED: "#059669",
  REJECTED: "#dc2626",
};
