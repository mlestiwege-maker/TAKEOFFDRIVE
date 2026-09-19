import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/Button";
import ApplicationStatusBadge from "../../components/ApplicationStatus";
import * as adminService from "../../services/adminService";
import * as documentService from "../../services/documentService";
import { extractErrorMessage } from "../../services/api";
import { DOCUMENT_TYPE_LABELS } from "../../types/document";
import type { ApplicationDetail, ReviewDecision } from "../../types/application";
import { formatDate, formatDateTime, titleCase } from "../../utils/formatters";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">{title}</h3>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-800 dark:text-slate-200">{value ?? "—"}</span>
    </div>
  );
}

const DECISION_CONFIG: { decision: ReviewDecision; label: string; variant: "primary" | "secondary" | "danger"; requiresNotes: boolean }[] = [
  { decision: "CORRECTION_REQUIRED", label: "Request Correction", variant: "secondary", requiresNotes: true },
  { decision: "REJECTED", label: "Reject Application", variant: "danger", requiresNotes: true },
  { decision: "APPROVED", label: "Approve Application", variant: "primary", requiresNotes: false },
];

export default function ApplicationDetails() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [pendingDecision, setPendingDecision] = useState<ReviewDecision | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => adminService.getApplicationDetail(Number(applicationId)).then(setApplication);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  const handleDecision = async (decision: ReviewDecision) => {
    const config = DECISION_CONFIG.find((d) => d.decision === decision)!;
    setPendingDecision(decision);
    if (config.requiresNotes && !notes.trim()) {
      setError("Please add a note explaining your decision.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await adminService.reviewApplication(Number(applicationId), decision, notes.trim() || undefined);
      await refresh();
      setNotes("");
      setPendingDecision(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !application) return <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</div>;

  const isFinal = application.status === "APPROVED" || application.status === "REJECTED";

  return (
    <div className="flex flex-col gap-6">
      <button onClick={() => navigate("/admin/applications")} className="w-fit text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
        ← Back to applications
      </button>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div>
          <p className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100">{application.application_number}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {application.driver.first_name} {application.driver.last_name} · Submitted{" "}
            {formatDateTime(application.submitted_at)}
          </p>
        </div>
        <ApplicationStatusBadge status={application.status} />
      </div>

      <Section title="Personal information">
        <Row label="First name" value={application.driver.first_name} />
        <Row label="Last name" value={application.driver.last_name} />
        <Row label="Date of birth" value={formatDate(application.driver.date_of_birth)} />
        <Row label="Gender" value={application.driver.gender ? titleCase(application.driver.gender) : null} />
        <Row label="Nationality" value={application.driver.nationality} />
      </Section>

      <Section title="Contact">
        <Row label="Phone" value={application.driver_contact.phone} />
        <Row label="Email" value={application.driver_contact.email} />
        <Row label="Address" value={application.driver.address} />
        <Row label="City" value={application.driver.city} />
      </Section>

      <Section title="Identity">
        <Row label="National ID" value={application.driver.national_id_number} />
        <Row label="Driver's licence" value={application.driver.drivers_license_number} />
      </Section>

      <Section title={`Vehicle${application.vehicles.length > 1 ? "s" : ""} (${application.vehicles.length})`}>
        {application.vehicles.length === 0 && <p className="py-3 text-sm text-slate-400 dark:text-slate-500">No vehicle added.</p>}
        {application.vehicles.map((vehicle, index) => (
          <div key={vehicle.id} className={index > 0 ? "pt-3" : ""}>
            <Row label="Type" value={titleCase(vehicle.vehicle_type)} />
            <Row label="Make" value={vehicle.make} />
            <Row label="Model" value={vehicle.model} />
            <Row label="Year" value={vehicle.year} />
            <Row label="Registration" value={vehicle.registration_number} />
            <Row label="Colour" value={vehicle.colour} />
          </div>
        ))}
      </Section>

      <Section title="Documents">
        {application.documents.length === 0 && <p className="py-3 text-sm text-slate-400 dark:text-slate-500">No documents uploaded.</p>}
        {application.documents.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between py-2 text-sm">
            <span className="text-slate-600 dark:text-slate-400">{DOCUMENT_TYPE_LABELS[doc.document_type]}</span>
            <button
              onClick={() => documentService.openDocument(doc.id, true)}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              View ✓
            </button>
          </div>
        ))}
      </Section>

      {application.reviews.length > 0 && (
        <Section title="Review history">
          {application.reviews.map((review) => (
            <div key={review.id} className="py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{titleCase(review.decision)}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">{formatDateTime(review.created_at)}</span>
              </div>
              {review.notes && <p className="mt-1 text-slate-500 dark:text-slate-400">{review.notes}</p>}
            </div>
          ))}
        </Section>
      )}

      {!isFinal && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Decision</h3>
          {error && <div className="mb-3 rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note (required for rejection or correction requests)…"
            rows={3}
            className="mb-4 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {DECISION_CONFIG.map((config) => (
              <Button
                key={config.decision}
                variant={config.variant}
                onClick={() => handleDecision(config.decision)}
                isLoading={isSubmitting && pendingDecision === config.decision}
                className="w-full sm:w-auto"
              >
                {config.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
