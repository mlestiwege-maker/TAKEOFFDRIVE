import { Link, useLocation } from "react-router-dom";
import { ONBOARDING_STEPS } from "../utils/constants";
import ProgressBar from "./ProgressBar";

export default function StepIndicator() {
  const location = useLocation();
  const currentIndex = ONBOARDING_STEPS.findIndex((step) => location.pathname.startsWith(step.path));
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / ONBOARDING_STEPS.length) * 100 : 0;

  const currentStep = currentIndex >= 0 ? ONBOARDING_STEPS[currentIndex] : null;

  return (
    <div className="mb-6 sm:mb-8">
      {currentStep && (
        <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:hidden">
          Step {currentIndex + 1} of {ONBOARDING_STEPS.length} · {currentStep.label}
        </p>
      )}
      <div className="mb-3 hidden items-center justify-between sm:flex">
        {ONBOARDING_STEPS.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <div key={step.key} className="flex flex-1 items-center">
              <Link
                to={isDone || isCurrent ? step.path : "#"}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isDone
                    ? "bg-brand-600 text-white"
                    : isCurrent
                      ? "border-2 border-brand-600 text-brand-600 dark:text-brand-400"
                      : "border-2 border-slate-200 text-slate-400 dark:border-slate-700 dark:text-slate-500"
                }`}
              >
                {isDone ? "✓" : index + 1}
              </Link>
              <span
                className={`ml-2 text-xs font-medium ${isCurrent ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}`}
              >
                {step.label}
              </span>
              {index < ONBOARDING_STEPS.length - 1 && (
                <div className="mx-3 h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              )}
            </div>
          );
        })}
      </div>
      <ProgressBar value={progress} />
    </div>
  );
}
