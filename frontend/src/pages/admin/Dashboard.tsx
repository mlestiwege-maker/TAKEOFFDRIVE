import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ApplicationStatusBadge from "../../components/ApplicationStatus";
import StatTile from "../../components/StatTile";
import StatusBarChart from "../../components/charts/StatusBarChart";
import SubmissionsLineChart from "../../components/charts/SubmissionsLineChart";
import * as adminService from "../../services/adminService";
import type { AnalyticsSummary } from "../../services/adminService";
import type { ApplicationListItem } from "../../types/application";
import { STATUS_COLORS } from "../../utils/constants";
import { STATUS_LABELS } from "../../types/application";
import { formatDateTime } from "../../utils/formatters";

const CHART_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "CORRECTION_REQUIRED", "APPROVED", "REJECTED"] as const;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminService.listApplications(), adminService.getAnalyticsSummary()])
      .then(([apps, summary]) => {
        setApplications(apps);
        setAnalytics(summary);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const statusCounts = analytics?.status_counts ?? {};
  const totalApplications = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Admin dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Overview of all driver applications.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Total applications" value={isLoading ? "…" : totalApplications} />
        <StatTile
          label="Awaiting review"
          value={isLoading ? "…" : (statusCounts.SUBMITTED ?? 0) + (statusCounts.UNDER_REVIEW ?? 0)}
        />
        <StatTile
          label="Approval rate"
          value={isLoading ? "…" : analytics?.approval_rate != null ? `${analytics.approval_rate}%` : "—"}
          hint="of reviewed applications"
        />
        <StatTile
          label="Avg. turnaround"
          value={isLoading ? "…" : analytics?.avg_turnaround_hours != null ? `${analytics.avg_turnaround_hours}h` : "—"}
          hint="submit → decision"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Applications by status</h2>
          {isLoading ? (
            <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">Loading…</p>
          ) : (
            <StatusBarChart
              bars={CHART_STATUSES.map((status) => ({
                key: status,
                label: STATUS_LABELS[status],
                value: statusCounts[status] ?? 0,
                color: STATUS_COLORS[status],
              }))}
            />
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Submissions (last 30 days)</h2>
          {isLoading ? (
            <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">Loading…</p>
          ) : (
            <SubmissionsLineChart points={analytics?.submissions_by_day ?? []} />
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Recent applications</h2>
          <button onClick={() => navigate("/admin/applications")} className="text-xs font-semibold text-brand-600">
            View all →
          </button>
        </div>
        {isLoading ? (
          <p className="p-6 text-sm text-slate-500 dark:text-slate-400">Loading…</p>
        ) : applications.length === 0 ? (
          <p className="p-6 text-sm text-slate-400 dark:text-slate-500">No applications yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {applications.slice(0, 5).map((app) => (
              <li
                key={app.id}
                onClick={() => navigate(`/admin/applications/${app.id}`)}
                className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-50 dark:active:bg-slate-800 sm:px-6"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {app.driver.first_name} {app.driver.last_name}
                  </p>
                  <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                    {app.application_number} · {formatDateTime(app.submitted_at)}
                  </p>
                </div>
                <div className="shrink-0">
                  <ApplicationStatusBadge status={app.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
