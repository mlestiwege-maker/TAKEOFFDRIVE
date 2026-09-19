import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import { useApplication } from "../../hooks/useApplication";

export default function ApplicationSubmitted() {
  const navigate = useNavigate();
  const { application, isLoading } = useApplication();

  if (isLoading) return <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</div>;

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center shadow-sm">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-3xl text-emerald-600 dark:text-emerald-400">
        ✓
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Application submitted!</h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Thanks for applying to become a TakeOFF driver. Our team will review your application and documents.
      </p>
      {application && (
        <p className="mt-4 rounded-lg bg-slate-100 dark:bg-slate-800 px-4 py-2 font-mono text-sm text-slate-700 dark:text-slate-300">
          {application.application_number}
        </p>
      )}
      <Button className="mt-6" onClick={() => navigate("/driver/dashboard")}>
        Go to dashboard
      </Button>
    </div>
  );
}
