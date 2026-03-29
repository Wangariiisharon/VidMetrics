"use client";

import type { VideoItem } from "./types";
import { CHART_COLORS } from "./utils";

interface CategoryChartProps {
  videos: VideoItem[];
}

export default function CategoryChart({ videos }: CategoryChartProps) {
  // Aggregate view counts per category
  const cats: Record<string, number> = {};
  for (const v of videos) {
    cats[v.category] = (cats[v.category] || 0) + 1;
  }

  const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const maxCount = sorted[0]?.[1] || 1;

  const xAxisTicks = [
    0,
    Math.ceil(maxCount * 0.25),
    Math.ceil(maxCount * 0.5),
    Math.ceil(maxCount * 0.75),
    maxCount,
  ];

  return (
    <div
      style={{
        background: "rgba(13,27,46,0.7)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.07)",
        padding: "20px 24px",
      }}
    >
      <p
        style={{
          margin: "0 0 20px",
          fontSize: 13,
          fontWeight: 600,
          color: "#94a3b8",
        }}
      >
        Content Category Breakdown
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {sorted.map(([cat, count], i) => (
          <div
            key={cat}
            style={{ display: "flex", alignItems: "center", gap: 16 }}
          >
            {/* Label */}
            <span
              style={{
                width: 140,
                fontSize: 12,
                color: "#64748b",
                textAlign: "right",
                flexShrink: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {cat}
            </span>

            {/* Bar track */}
            <div
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.04)",
                borderRadius: 4,
                height: 28,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(count / maxCount) * 100}%`,
                  background: `linear-gradient(90deg, ${
                    CHART_COLORS[i % CHART_COLORS.length]
                  }cc, ${CHART_COLORS[i % CHART_COLORS.length]})`,
                  borderRadius: 4,
                  transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                }}
              />
            </div>

            {/* Count label */}
            <span
              style={{
                width: 72,
                fontSize: 12,
                color: "#94a3b8",
                flexShrink: 0,
                fontWeight: 500,
              }}
            >
              {count} video{count !== 1 ? "s" : ""}
            </span>
          </div>
        ))}
      </div>

      {/* X-axis tick labels */}
      <div
        style={{
          marginTop: 8,
          paddingLeft: 156,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          color: "#334155",
        }}
      >
        {xAxisTicks.map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
    </div>
  );
}
