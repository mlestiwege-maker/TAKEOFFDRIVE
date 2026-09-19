import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ApplicationStatusBadge from "../../components/ApplicationStatus";
import { api } from "../../services/api";
import { formatDate, titleCase } from "../../utils/formatters";
import type { ApplicationStatus as StatusType } from "../../types/application";

interface DriverDetail {
  id: number;
  first_name: string | null;
  last_name: string | null;
  phone: string;
  email: string | null;
  city: string | null;
  address: string | null;
  nationality: string | null;
  date_of_birth: string | null;
  national_id_number: string | null;
  drivers_license_number: string | null;
  vehicles: { id: number; vehicle_type: string; make: string; model: string; year: number; registration_number: string }[];
  application: { id: number; application_number: string; status: StatusType } | null;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-800 dark:text-slate-200">{value ?? "—"}</span>
    </div>
  );
}

export default function DriverDetails() {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const [driver, setDriver] = useState<DriverDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<DriverDetail>(`/api/admin/drivers/${driverId}`)
      .then((res) => setDriver(res.data))
      .finally(() => setIsLoading(false));
  }, [driverId]);

  if (isLoading || !driver) return <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</div>;

  return (
    <div className="flex flex-col gap-6">
      <button onClick={() => navigate("/admin/drivers")} className="w-fit text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
        ← Back to drivers
      </button>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm sm:p-6">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-slate-900 dark:text-slate-100">
            {driver.first_name} {driver.last_name}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{driver.phone}</p>
        </div>
        {driver.application && (
          <button
            onClick={() => navigate(`/admin/applications/${driver.application!.id}`)}
            className="flex flex-col items-end gap-1"
          >
            <ApplicationStatusBadge status={driver.application.status} />
            <span className="font-mono text-xs text-slate-400 dark:text-slate-500">{driver.application.application_number}</span>
          </button>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Details</h3>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <Row label="Email" value={driver.email} />
          <Row label="Address" value={driver.address} />
          <Row label="City" value={driver.city} />
          <Row label="Nationality" value={driver.nationality} />
          <Row label="Date of birth" value={formatDate(driver.date_of_birth)} />
          <Row label="National ID" value={driver.national_id_number} />
          <Row label="Driver's licence" value={driver.drivers_license_number} />
        </div>
      </div>

      {driver.vehicles.map((vehicle) => (
        <div key={vehicle.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Vehicle</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <Row label="Type" value={titleCase(vehicle.vehicle_type)} />
            <Row label="Make / model" value={`${vehicle.make} ${vehicle.model} (${vehicle.year})`} />
            <Row label="Registration" value={vehicle.registration_number} />
          </div>
        </div>
      ))}

      {!driver.application && (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-6 text-center text-sm text-slate-400 dark:text-slate-500">
          This driver has not submitted an application yet.
        </div>
      )}
    </div>
  );
}
