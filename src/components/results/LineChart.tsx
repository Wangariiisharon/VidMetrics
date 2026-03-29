"use client";

import { useState, useRef, useCallback } from "react";
import { fmt } from "./utils";

interface DataPoint {
  label: string;
  [key: string]: number | string;
}

interface LineChartProps {
  data: DataPoint[];
  color: string;
  yKey: string;
  title: string;
  suffix?: string;
}

/* ── Layout constants ─────────────────────────────────────────── */
const W = 580;
const H = 200;
const PAD = { t: 24, r: 20, b: 44, l: 68 };
const TICK_COUNT = 5;
/** A point is a "viral spike" if it's this many std-devs above the mean */
const SPIKE_THRESHOLD = 1.6;

/* ── Maths helpers ────────────────────────────────────────────── */
function mean(arr: number[]) {
  return arr.reduce((s, v) => s + v, 0) / (arr.length || 1);
}
function stddev(arr: number[], avg: number) {
  return Math.sqrt(
    arr.reduce((s, v) => s + (v - avg) ** 2, 0) / (arr.length || 1)
  );
}

export default function LineChart({
  data,
  color,
  yKey,
  title,
  suffix = "",
}: LineChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const vals = data.map((d) => d[yKey] as number);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const avg = mean(vals);
  const sd = stddev(vals, avg);

  const iW = W - PAD.l - PAD.r;
  const iH = H - PAD.t - PAD.b;

  const xPos = (i: number) => PAD.l + (i / Math.max(vals.length - 1, 1)) * iW;
  const yPos = (v: number) => PAD.t + iH - ((v - min) / (max - min || 1)) * iH;
  const avgY = yPos(avg);

  /* Smooth cubic bezier path */
  const smoothPath = (() => {
    if (vals.length < 2) return "";
    const pts = vals.map((v, i) => [xPos(i), yPos(v)] as [number, number]);
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const cpx = (x0 + x1) / 2;
      d += ` C${cpx},${y0} ${cpx},${y1} ${x1},${y1}`;
    }
    return d;
  })();

  const areaPath =
    smoothPath +
    ` L${xPos(vals.length - 1)},${PAD.t + iH} L${xPos(0)},${PAD.t + iH} Z`;

  /* Viral spikes: points > mean + threshold×sd */
  const spikes = vals
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => v > avg + SPIKE_THRESHOLD * sd);

  /* Y-axis ticks */
  const yTicks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const v = min + ((max - min) / (TICK_COUNT - 1)) * i;
    return { v, py: yPos(v) };
  });

  /* X-axis labels: ~6 evenly spaced */
  const xStep = Math.max(1, Math.floor(data.length / 6));
  const xLabels = data
    .map((d, i) => ({ d, i }))
    .filter(({ i }) => i % xStep === 0 || i === data.length - 1);

  /* Mouse → nearest data index */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const svgX = ((e.clientX - rect.left) / rect.width) * W;
      const rel = (svgX - PAD.l) / iW;
      const idx = Math.round(rel * (vals.length - 1));
      setHoverIdx(Math.max(0, Math.min(vals.length - 1, idx)));
    },
    [vals.length, iW]
  );

  const gradId = `grad-${yKey}-${color.replace("#", "")}`;
  const clipId = `clip-${yKey}`;

  const hVal = hoverIdx !== null ? vals[hoverIdx] : null;
  const hLabel = hoverIdx !== null ? data[hoverIdx].label : null;
  const hX = hoverIdx !== null ? xPos(hoverIdx) : null;
  const hY = hoverIdx !== null ? yPos(vals[hoverIdx]) : null;
  const tooltipW = 110;
  const tooltipX =
    hX !== null
      ? Math.min(Math.max(hX - tooltipW / 2, PAD.l), W - PAD.r - tooltipW)
      : 0;

  /* Avg delta for tooltip */
  const delta = hVal !== null ? hVal - avg : 0;
  const deltaSign = delta >= 0 ? "+" : "";
  const deltaTxt =
    suffix === "%"
      ? `${deltaSign}${delta.toFixed(2)}%`
      : `${deltaSign}${fmt(Math.round(delta))}`;

  return (
    <div
      style={{
        background: "rgba(13,27,46,0.75)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.07)",
        padding: "18px 18px 10px",
        flex: 1,
        minWidth: 0,
        position: "relative",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <p
          style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#94a3b8" }}
        >
          {title}
        </p>
        {/* Avg legend pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 10,
            color: "#475569",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 20,
              height: 1.5,
              background: "rgba(255,255,255,0.25)",
              borderTop: "2px dashed rgba(255,255,255,0.22)",
              verticalAlign: "middle",
            }}
          />
          avg {suffix === "%" ? `${avg.toFixed(2)}%` : fmt(Math.round(avg))}
          {spikes.length > 0 && (
            <span
              style={{
                marginLeft: 8,
                display: "flex",
                alignItems: "center",
                gap: 3,
                padding: "1px 6px",
                borderRadius: 99,
                background: "rgba(251,191,36,0.1)",
                border: "1px solid rgba(251,191,36,0.25)",
                color: "#fbbf24",
              }}
            >
              ⚡ {spikes.length} spike{spikes.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          height: "auto",
          overflow: "visible",
          cursor: "crosshair",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
          <clipPath id={clipId}>
            <rect x={PAD.l} y={PAD.t} width={iW} height={iH} />
          </clipPath>
        </defs>

        {/* Horizontal grid lines */}
        {yTicks.map(({ py }, i) => (
          <line
            key={i}
            x1={PAD.l}
            y1={py}
            x2={W - PAD.r}
            y2={py}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map(({ v, py }, i) => (
          <text
            key={i}
            x={PAD.l - 8}
            y={py + 4}
            textAnchor="end"
            fill="#475569"
            fontSize="10"
          >
            {suffix === "%" ? `${v.toFixed(1)}%` : fmt(Math.round(v))}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map(({ d, i }) => (
          <text
            key={i}
            x={xPos(i)}
            y={H - 10}
            textAnchor="middle"
            fill="#475569"
            fontSize="9.5"
          >
            {d.label}
          </text>
        ))}

        {/* ── Average reference line ── */}
        <line
          x1={PAD.l}
          y1={avgY}
          x2={W - PAD.r}
          y2={avgY}
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="1.2"
          strokeDasharray="6,4"
        />
        <text
          x={W - PAD.r + 4}
          y={avgY + 4}
          fill="rgba(255,255,255,0.3)"
          fontSize="9"
          textAnchor="start"
        >
          avg
        </text>

        {/* ── Area fill ── */}
        <path
          d={areaPath}
          fill={`url(#${gradId})`}
          clipPath={`url(#${clipId})`}
        />

        {/* ── Main line ── */}
        <path
          d={smoothPath}
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
          clipPath={`url(#${clipId})`}
        />

        {/* ── Viral spike markers ── */}
        {spikes.map(({ v, i }) => {
          const sx = xPos(i);
          const sy = yPos(v);
          return (
            <g key={i}>
              {/* Glow ring */}
              <circle cx={sx} cy={sy} r="9" fill="rgba(251,191,36,0.12)" />
              <circle cx={sx} cy={sy} r="5" fill="rgba(251,191,36,0.25)" />
              <circle cx={sx} cy={sy} r="3" fill="#fbbf24" />
              {/* Label above */}
              <rect
                x={sx - 22}
                y={sy - 26}
                width={44}
                height={16}
                rx="4"
                fill="rgba(251,191,36,0.15)"
                stroke="rgba(251,191,36,0.35)"
                strokeWidth="0.8"
              />
              <text
                x={sx}
                y={sy - 15}
                textAnchor="middle"
                fill="#fbbf24"
                fontSize="8.5"
                fontWeight="700"
              >
                ⚡ spike
              </text>
            </g>
          );
        })}

        {/* ── Hover crosshair + dot ── */}
        {hoverIdx !== null && hX !== null && hY !== null && (
          <g>
            {/* Vertical rule */}
            <line
              x1={hX}
              y1={PAD.t}
              x2={hX}
              y2={PAD.t + iH}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
            {/* Dot */}
            <circle cx={hX} cy={hY} r="5" fill={color} opacity="0.25" />
            <circle cx={hX} cy={hY} r="3.5" fill={color} />
            <circle cx={hX} cy={hY} r="1.5" fill="#fff" />

            {/* ── Tooltip box ── */}
            <g
              transform={`translate(${tooltipX}, ${Math.max(PAD.t, hY - 68)})`}
            >
              <rect
                width={tooltipW}
                height={56}
                rx="7"
                fill="rgba(10,20,38,0.96)"
                stroke={`${color}55`}
                strokeWidth="1"
              />
              {/* Date */}
              <text
                x={tooltipW / 2}
                y={16}
                textAnchor="middle"
                fill="#64748b"
                fontSize="9.5"
              >
                {hLabel}
              </text>
              {/* Value */}
              <text
                x={tooltipW / 2}
                y={33}
                textAnchor="middle"
                fill={color}
                fontSize="14"
                fontWeight="700"
              >
                {suffix === "%"
                  ? `${(hVal as number).toFixed(2)}%`
                  : fmt(hVal as number)}
              </text>
              {/* Delta vs avg */}
              <text
                x={tooltipW / 2}
                y={50}
                textAnchor="middle"
                fill={delta >= 0 ? "#34d399" : "#f87171"}
                fontSize="9.5"
              >
                {deltaTxt} vs avg
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
