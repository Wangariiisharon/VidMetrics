"use client";

import { Calendar } from "lucide-react";
import type { TimeRange, TimeOption } from "./types";
import { TIME_OPTIONS } from "./types";

interface TimeFilterProps {
  value: TimeRange;
  onChange: (v: TimeRange) => void;
  /** how many videos fall inside the active window */
  count: number;
}

export default function TimeFilter({
  value,
  onChange,
  count,
}: TimeFilterProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      {/* Label */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Calendar size={14} style={{ color: "#475569" }} />
        <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>
          Time range
        </span>
      </div>

      {/* Pill group */}
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: 4,
          borderRadius: 12,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {TIME_OPTIONS.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: active
                  ? "1px solid rgba(34,211,238,0.4)"
                  : "1px solid transparent",
                background: active
                  ? "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(59,130,246,0.15))"
                  : "transparent",
                color: active ? "#22d3ee" : "#64748b",
                fontSize: 12,
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
                letterSpacing: active ? "0.01em" : "0",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = "#94a3b8";
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(255,255,255,0.04)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = "#64748b";
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
                }
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Video count badge */}
      <span
        style={{
          fontSize: 11,
          color: "#334155",
          padding: "3px 8px",
          borderRadius: 6,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {count} video{count !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
