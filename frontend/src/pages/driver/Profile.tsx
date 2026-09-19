import { useNavigate } from "react-router-dom";
import { useApplication } from "../../hooks/useApplication";
import { formatDate, titleCase } from "../../utils/formatters";

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-2 text-sm last:border-0">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-800 dark:text-slate-200">{value ?? "—"}</span>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { application, isLoading } = useApplication();

  if (isLoading || !application) return <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">This is the information attached to your application.</p>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Personal</h3>
          <button onClick={() => navigate("/onboarding/personal")} className="text-xs font-semibold text-brand-600">
            Edit
          </button>
        </div>
        <Row label="Name" value={`${application.driver.first_name ?? ""} ${application.driver.last_name ?? ""}`.trim()} />
        <Row label="Date of birth" value={formatDate(application.driver.date_of_birth)} />
        <Row label="Gender" value={application.driver.gender ? titleCase(application.driver.gender) : null} />
        <Row label="Nationality" value={application.driver.nationality} />
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Contact</h3>
          <button onClick={() => navigate("/onboarding/contact")} className="text-xs font-semibold text-brand-600">
            Edit
          </button>
        </div>
        <Row label="Phone" value={application.driver_contact.phone} />
        <Row label="Email" value={application.driver_contact.email} />
        <Row label="Address" value={application.driver.address} />
        <Row label="City" value={application.driver.city} />
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Identity</h3>
          <button onClick={() => navigate("/onboarding/identity")} className="text-xs font-semibold text-brand-600">
            Edit
          </button>
        </div>
        <Row label="National ID" value={application.driver.national_id_number} />
        <Row label="Driver's licence" value={application.driver.drivers_license_number} />
      </div>

      {application.vehicles.map((vehicle) => (
        <div key={vehicle.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Vehicle</h3>
            <button onClick={() => navigate("/onboarding/vehicle")} className="text-xs font-semibold text-brand-600">
              Edit
            </button>
          </div>
          <Row label="Type" value={titleCase(vehicle.vehicle_type)} />
          <Row label="Make / model" value={`${vehicle.make} ${vehicle.model} (${vehicle.year})`} />
          <Row label="Registration" value={vehicle.registration_number} />
          <Row label="Colour" value={vehicle.colour} />
        </div>
      ))}
    </div>
  );
}
