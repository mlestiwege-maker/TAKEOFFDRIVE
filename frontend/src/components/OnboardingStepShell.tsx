import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import StepIndicator from "./StepIndicator";

interface Props {
  title: string;
  description?: string;
  children: ReactNode;
  onNext: () => void | Promise<void>;
  onBack?: () => void;
  isSubmitting?: boolean;
  nextLabel?: string;
  error?: string | null;
}

export default function OnboardingStepShell({
  title,
  description,
  children,
  onNext,
  onBack,
  isSubmitting = false,
  nextLabel = "Continue",
  error,
}: Props) {
  const navigate = useNavigate();

  return (
    <div>
      <StepIndicator />
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}
        <div className="mt-6 flex flex-col gap-5">{children}</div>
        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6 dark:border-slate-800">
          <Button variant="ghost" type="button" onClick={onBack ?? (() => navigate(-1))}>
            ← Back
          </Button>
          <Button type="button" onClick={onNext} isLoading={isSubmitting}>
            {nextLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
