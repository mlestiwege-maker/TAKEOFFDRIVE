import { STATUS_COLORS, STATUS_COLORS_DARK } from "../utils/constants";
import { STATUS_LABELS } from "../types/application";
import type { ApplicationStatus as StatusType } from "../types/application";
import { useTheme } from "../hooks/useTheme";

const STATUS_ICON: Record<StatusType, string> = {
  DRAFT: "○",
  SUBMITTED: "→",
  UNDER_REVIEW: "◐",
  CORRECTION_REQUIRED: "!",
  APPROVED: "✓",
  REJECTED: "✕",
};

export default function ApplicationStatusBadge({ status }: { status: StatusType }) {
  const { theme } = useTheme();
  const color = (theme === "dark" ? STATUS_COLORS_DARK : STATUS_COLORS)[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ backgroundColor: `${color}${theme === "dark" ? "33" : "1a"}`, color }}
    >
      <span>{STATUS_ICON[status]}</span>
      {STATUS_LABELS[status]}
    </span>
  );
}
