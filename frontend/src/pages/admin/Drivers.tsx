import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";

interface DriverRow {
  id: number;
  first_name: string | null;
  last_name: string | null;
  phone: string;
  email: string | null;
  city: string | null;
  created_at: string;
}

export default function Drivers() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<DriverRow[]>("/api/admin/drivers")
      .then((res) => setDrivers(res.data))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Drivers</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Everyone who has started onboarding.</p>
      </div>

      {isLoading ? (
        <p className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500 dark:text-slate-400 shadow-sm">Loading…</p>
      ) : drivers.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-400 dark:text-slate-500 shadow-sm">
          No drivers yet.
        </p>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {drivers.map((d) => (
              <div
                key={d.id}
                onClick={() => navigate(`/admin/drivers/${d.id}`)}
                className="cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm active:bg-slate-50 dark:active:bg-slate-800"
              >
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {d.first_name ?? "—"} {d.last_name ?? ""}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{d.phone}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{d.email ?? "—"}</p>
                {d.city && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{d.city}</p>}
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm sm:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Phone</th>
                  <th className="px-6 py-3 font-semibold">Email</th>
                  <th className="px-6 py-3 font-semibold">City</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {drivers.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => navigate(`/admin/drivers/${d.id}`)}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-200">
                      {d.first_name ?? "—"} {d.last_name ?? ""}
                    </td>
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{d.phone}</td>
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{d.email ?? "—"}</td>
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{d.city ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
