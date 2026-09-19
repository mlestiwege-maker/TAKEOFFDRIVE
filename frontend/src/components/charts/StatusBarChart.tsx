import { useState } from "react";

interface Bar {
  key: string;
  label: string;
  value: number;
  color: string;
}

const WIDTH = 480;
const HEIGHT = 220;
const BASELINE_Y = 172;
const TOP_MARGIN = 24;
const BAR_MAX_WIDTH = 24;

export default function StatusBarChart({ bars }: { bars: Bar[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxValue = Math.max(1, ...bars.map((b) => b.value));
  const bandWidth = WIDTH / bars.length;
  const plotHeight = BASELINE_Y - TOP_MARGIN;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Applications by status">
        {/* baseline */}
        <line
          x1={0}
          y1={BASELINE_Y}
          x2={WIDTH}
          y2={BASELINE_Y}
          className="stroke-slate-200 dark:stroke-slate-700"
          strokeWidth={1}
        />

        {bars.map((bar, i) => {
          const barHeight = maxValue > 0 ? (bar.value / maxValue) * plotHeight : 0;
          const bandCenter = bandWidth * i + bandWidth / 2;
          const barX = bandCenter - BAR_MAX_WIDTH / 2;
          const barY = BASELINE_Y - barHeight;
          const isHovered = hovered === i;

          return (
            <g
              key={bar.key}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              tabIndex={0}
              role="graphics-symbol"
              aria-label={`${bar.label}: ${bar.value}`}
              style={{ cursor: "pointer" }}
            >
              {/* larger transparent hit area */}
              <rect x={bandCenter - bandWidth / 2} y={TOP_MARGIN} width={bandWidth} height={plotHeight} fill="transparent" />
              <rect
                x={barX}
                y={barY}
                width={BAR_MAX_WIDTH}
                height={Math.max(barHeight, 1)}
                rx={4}
                fill={bar.color}
                opacity={isHovered ? 1 : 0.85}
              />
              <text
                x={bandCenter}
                y={barY - 8}
                textAnchor="middle"
                className="fill-slate-700 text-[11px] font-semibold dark:fill-slate-300"
              >
                {bar.value}
              </text>
              <text
                x={bandCenter}
                y={BASELINE_Y + 18}
                textAnchor="middle"
                className="fill-slate-500 text-[10px] dark:fill-slate-400"
              >
                {bar.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hovered !== null && (
        <div
          className="pointer-events-none absolute rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
          style={{
            left: `${((bandWidth * hovered + bandWidth / 2) / WIDTH) * 100}%`,
            top: 0,
            transform: "translate(-50%, -110%)",
          }}
        >
          <span className="font-semibold">{bars[hovered].value}</span>{" "}
          <span className="text-slate-300">{bars[hovered].label}</span>
        </div>
      )}
    </div>
  );
}
