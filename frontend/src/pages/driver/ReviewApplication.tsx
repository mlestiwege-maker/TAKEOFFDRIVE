import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import StepIndicator from "../../components/StepIndicator";
import { useApplication } from "../../hooks/useApplication";
import * as applicationService from "../../services/applicationService";
import * as documentService from "../../services/documentService";
import { extractErrorMessage } from "../../services/api";
import { DOCUMENT_TYPE_LABELS } from "../../types/document";
import { formatDate, titleCase } from "../../utils/formatters";

function SectionRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-2 text-sm last:border-0">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-800 dark:text-slate-200">{value ?? "—"}</span>
    </div>
  );
}

export default function ReviewApplication() {
  const navigate = useNavigate();
  const { application, isLoading, refetch } = useApplication();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await applicationService.submitMyApplication();
      await refetch();
      navigate("/driver/application-submitted");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !application) return <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</div>;

  return (
    <div>
      <StepIndicator />
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Review your application</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Double-check everything below before submitting. Application {application.application_number}.
        </p>

        {error && <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>}

        <div className="mt-6 space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Personal information</h3>
              <button onClick={() => navigate("/onboarding/personal")} className="text-xs font-semibold text-brand-600">
                Edit
              </button>
            </div>
            <div className="rounded-lg border border-slate-100 dark:border-slate-800 px-4">
              <SectionRow label="Name" value={`${application.driver.first_name} ${application.driver.last_name}`} />
              <SectionRow label="Date of birth" value={formatDate(application.driver.date_of_birth)} />
              <SectionRow label="Gender" value={application.driver.gender ? titleCase(application.driver.gender) : null} />
              <SectionRow label="Nationality" value={application.driver.nationality} />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Contact</h3>
              <button onClick={() => navigate("/onboarding/contact")} className="text-xs font-semibold text-brand-600">
                Edit
              </button>
            </div>
            <div className="rounded-lg border border-slate-100 dark:border-slate-800 px-4">
              <SectionRow label="Phone" value={application.driver_contact.phone} />
              <SectionRow label="Email" value={application.driver_contact.email} />
              <SectionRow label="Address" value={application.driver.address} />
              <SectionRow label="City" value={application.driver.city} />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Identity</h3>
              <button onClick={() => navigate("/onboarding/identity")} className="text-xs font-semibold text-brand-600">
                Edit
              </button>
            </div>
            <div className="rounded-lg border border-slate-100 dark:border-slate-800 px-4">
              <SectionRow label="National ID" value={application.driver.national_id_number} />
              <SectionRow label="Driver's licence" value={application.driver.drivers_license_number} />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Vehicle{application.vehicles.length > 1 ? "s" : ""} ({application.vehicles.length})
              </h3>
              <button onClick={() => navigate("/onboarding/vehicle")} className="text-xs font-semibold text-brand-600">
                Edit
              </button>
            </div>
            {application.vehicles.length === 0 ? (
              <div className="rounded-lg border border-slate-100 dark:border-slate-800 px-4 py-3 text-sm text-slate-400 dark:text-slate-500">No vehicle added.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {application.vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="rounded-lg border border-slate-100 dark:border-slate-800 px-4">
                    <SectionRow label="Type" value={titleCase(vehicle.vehicle_type)} />
                    <SectionRow label="Make / model" value={`${vehicle.make} ${vehicle.model} (${vehicle.year})`} />
                    <SectionRow label="Registration" value={vehicle.registration_number} />
                    <SectionRow label="Colour" value={vehicle.colour} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Documents</h3>
            <div className="rounded-lg border border-slate-100 dark:border-slate-800 px-4">
              {application.documents.length === 0 && (
                <p className="py-3 text-sm text-slate-400 dark:text-slate-500">No documents uploaded.</p>
              )}
              {application.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 py-2 text-sm last:border-0">
                  <span className="text-slate-600 dark:text-slate-400">{DOCUMENT_TYPE_LABELS[doc.document_type]}</span>
                  <button
                    onClick={() => documentService.openDocument(doc.id)}
                    className="text-xs font-semibold text-brand-600 hover:underline"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
          <Button variant="ghost" type="button" onClick={() => navigate("/onboarding/vehicle-documents")}>
            ← Back
          </Button>
          <Button type="button" onClick={handleSubmit} isLoading={isSubmitting}>
            Submit application
          </Button>
        </div>
      </div>
    </div>
  );
}
