import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import ApplicationStatusBadge from "../../components/ApplicationStatus";
import { useAuth } from "../../hooks/useAuth";
import { useApplication } from "../../hooks/useApplication";
import { formatDateTime } from "../../utils/formatters";

const NEXT_STEP_BY_STATUS: Record<string, { label: string; path: string } | null> = {
  DRAFT: { label: "Continue application", path: "/onboarding/personal" },
  CORRECTION_REQUIRED: { label: "Fix and resubmit", path: "/onboarding/personal" },
  SUBMITTED: null,
  UNDER_REVIEW: null,
  APPROVED: null,
  REJECTED: null,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { application, isLoading } = useApplication();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Welcome, {application?.driver.first_name ?? user?.phone}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Here's where your application stands.</p>
      </div>

      {isLoading || !application ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500 dark:text-slate-400 shadow-sm">
          Loading…
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Application status</p>
              <div className="mt-2">
                <ApplicationStatusBadge status={application.status} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Application number</p>
              <p className="mt-1 font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">
                {application.application_number}
              </p>
            </div>
          </div>

          {application.submitted_at && (
            <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">Submitted {formatDateTime(application.submitted_at)}</p>
          )}

          {application.reviews.length > 0 && application.reviews[0].notes && (
            <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-900/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-400">
              <span className="font-semibold">Admin note:</span> {application.reviews[0].notes}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {NEXT_STEP_BY_STATUS[application.status] && (
              <Button
                className="w-full sm:w-auto"
                onClick={() => navigate(NEXT_STEP_BY_STATUS[application.status]!.path)}
              >
                {NEXT_STEP_BY_STATUS[application.status]!.label}
              </Button>
            )}
            <Button variant="secondary" className="w-full sm:w-auto" onClick={() => navigate("/onboarding/review")}>
              View application
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p className="text-xs text-slate-400 dark:text-slate-500">Vehicles</p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{application?.vehicles.length ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p className="text-xs text-slate-400 dark:text-slate-500">Documents uploaded</p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{application?.documents.length ?? 0} / 4</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p className="text-xs text-slate-400 dark:text-slate-500">Review notes</p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{application?.reviews.length ?? 0}</p>
        </div>
      </div>
    </div>
  );
}
