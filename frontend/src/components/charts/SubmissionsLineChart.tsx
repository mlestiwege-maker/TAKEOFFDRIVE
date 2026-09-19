import { useState } from "react";
import { useTheme } from "../../hooks/useTheme";

interface Point {
  date: string;
  count: number;
}

const WIDTH = 480;
const HEIGHT = 220;
const TOP_MARGIN = 20;
const BOTTOM_MARGIN = 28;
const LEFT_MARGIN = 8;
const RIGHT_MARGIN = 8;
const LINE_COLOR = "#10b981"; // brand-500 — a step brighter than the light-mode 600 so it still pops on a dark surface

export default function SubmissionsLineChart({ points }: { points: Point[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const { theme } = useTheme();
  const ringColor = theme === "dark" ? "#0f172a" : "#fff"; // matches the card surface so the ring reads as a gap, not a border

  if (points.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">No submissions in the last 30 days.</p>;
  }

  const plotWidth = WIDTH - LEFT_MARGIN - RIGHT_MARGIN;
  const plotHeight = HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;
  const maxValue = Math.max(1, ...points.map((p) => p.count));

  const xFor = (i: number) => LEFT_MARGIN + (points.length === 1 ? plotWidth / 2 : (i / (points.length - 1)) * plotWidth);
  const yFor = (v: number) => TOP_MARGIN + plotHeight - (v / maxValue) * plotHeight;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.count)}`).join(" ");
  const areaPath = `${linePath} L ${xFor(points.length - 1)} ${TOP_MARGIN + plotHeight} L ${xFor(0)} ${TOP_MARGIN + plotHeight} Z`;

  const handleMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const step = plotWidth / Math.max(1, points.length - 1);
    const index = Math.round((relativeX - LEFT_MARGIN) / step);
    setHoverIndex(Math.min(points.length - 1, Math.max(0, index)));
  };

  const showEvery = Math.max(1, Math.ceil(points.length / 6));

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Submissions over the last 30 days">
        <line
          x1={LEFT_MARGIN}
          y1={TOP_MARGIN + plotHeight}
          x2={WIDTH - RIGHT_MARGIN}
          y2={TOP_MARGIN + plotHeight}
          className="stroke-slate-200 dark:stroke-slate-700"
          strokeWidth={1}
        />

        <path d={areaPath} fill={LINE_COLOR} opacity={0.1} />
        <path d={linePath} fill="none" stroke={LINE_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {/* Static end-dot so a single-point (or just-ended) series is never invisible */}
        <circle
          cx={xFor(points.length - 1)}
          cy={yFor(points[points.length - 1].count)}
          r={4}
          fill={LINE_COLOR}
          stroke={ringColor}
          strokeWidth={2}
        />

        {hoverIndex !== null && (
          <>
            <line
              x1={xFor(hoverIndex)}
              y1={TOP_MARGIN}
              x2={xFor(hoverIndex)}
              y2={TOP_MARGIN + plotHeight}
              className="stroke-slate-300 dark:stroke-slate-600"
              strokeWidth={1}
            />
            <circle
              cx={xFor(hoverIndex)}
              cy={yFor(points[hoverIndex].count)}
              r={4}
              fill={LINE_COLOR}
              stroke={ringColor}
              strokeWidth={2}
            />
          </>
        )}

        {points.map((p, i) =>
          i % showEvery === 0 ? (
            <text
              key={p.date}
              x={xFor(i)}
              y={HEIGHT - 8}
              textAnchor="middle"
              className="fill-slate-500 text-[9px] dark:fill-slate-400"
            >
              {p.date.slice(5)}
            </text>
          ) : null
        )}

        <rect
          x={0}
          y={0}
          width={WIDTH}
          height={HEIGHT}
          fill="transparent"
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIndex(null)}
        />
      </svg>

      {hoverIndex !== null && (
        <div
          className="pointer-events-none absolute rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
          style={{
            left: `${(xFor(hoverIndex) / WIDTH) * 100}%`,
            top: `${(yFor(points[hoverIndex].count) / HEIGHT) * 100}%`,
            transform: "translate(-50%, -130%)",
          }}
        >
          <span className="font-semibold">{points[hoverIndex].count}</span>{" "}
          <span className="text-slate-300">on {points[hoverIndex].date}</span>
        </div>
      )}
    </div>
  );
}
