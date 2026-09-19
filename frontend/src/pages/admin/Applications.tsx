import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ApplicationStatusBadge from "../../components/ApplicationStatus";
import Input from "../../components/Input";
import Select from "../../components/Select";
import * as adminService from "../../services/adminService";
import type { ApplicationListItem, ApplicationStatus } from "../../types/application";
import { STATUS_LABELS } from "../../types/application";
import { formatDateTime, titleCase } from "../../utils/formatters";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  ...Object.entries(STATUS_LABELS)
    .filter(([value]) => value !== "DRAFT")
    .map(([value, label]) => ({ value, label })),
];

export default function Applications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    setIsLoading(true);
    const params: { status?: ApplicationStatus; search?: string } = {};
    if (status) params.status = status as ApplicationStatus;
    if (search) params.search = search;
    const handle = setTimeout(() => {
      adminService.listApplications(params).then(setApplications).finally(() => setIsLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [search, status]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Applications</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Search, filter, and review driver applications.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search by name, phone, or application number"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:flex-1"
        />
        <Select
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="sm:w-56"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {isLoading ? (
          <p className="p-6 text-sm text-slate-500 dark:text-slate-400">Loading…</p>
        ) : applications.length === 0 ? (
          <p className="p-6 text-sm text-slate-400 dark:text-slate-500">No applications match your filters.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {applications.map((app) => (
              <li
                key={app.id}
                onClick={() => navigate(`/admin/applications/${app.id}`)}
                className="flex cursor-pointer flex-col gap-2 px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-50 dark:active:bg-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {app.driver.first_name} {app.driver.last_name}
                  </p>
                  <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                    {app.application_number} · {app.driver.phone}
                    {app.vehicle_type ? ` · ${titleCase(app.vehicle_type)}` : ""}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <ApplicationStatusBadge status={app.status} />
                  <span className="text-xs text-slate-400 dark:text-slate-500">{formatDateTime(app.submitted_at)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
