export default function ProgressBar({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
      <div
        className="h-full rounded-full bg-brand-600 transition-all duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
