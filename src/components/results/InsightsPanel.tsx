"use client";

import type { Insight, InsightSeverity } from "./types";

interface InsightsPanelProps {
  insights: Insight[];
  /** e.g. "Last 30 Days" */
  windowLabel: string;
}

/*  Per-severity visual config  */
const SEV: Record<
  InsightSeverity,
  {
    icon: string;
    color: string;
    bg: string;
    border: string;
    pill: string;
    pillText: string;
  }
> = {
  positive: {
    icon: "📈",
    color: "#34d399",
    bg: "rgba(52,211,153,0.05)",
    border: "rgba(52,211,153,0.15)",
    pill: "rgba(52,211,153,0.12)",
    pillText: "#34d399",
  },
  warning: {
    icon: "⚠️",
    color: "#fb923c",
    bg: "rgba(251,146,60,0.05)",
    border: "rgba(251,146,60,0.15)",
    pill: "rgba(251,146,60,0.12)",
    pillText: "#fb923c",
  },
  neutral: {
    icon: "💡",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.05)",
    border: "rgba(96,165,250,0.15)",
    pill: "rgba(96,165,250,0.12)",
    pillText: "#60a5fa",
  },
  tip: {
    icon: "🎯",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.05)",
    border: "rgba(167,139,250,0.15)",
    pill: "rgba(167,139,250,0.12)",
    pillText: "#a78bfa",
  },
};

const SEV_LABELS: Record<InsightSeverity, string> = {
  positive: "Opportunity",
  warning: "Watch Out",
  neutral: "Note",
  tip: "Strategy",
};

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const cfg = SEV[insight.severity];

  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        padding: "16px 18px",
        borderRadius: 12,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        animation: `fadeSlideIn 0.35s ease ${index * 0.07}s both`,
        transition: "background 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = cfg.bg.replace("0.05", "0.09");
        el.style.borderColor = cfg.border.replace("0.15", "0.28");
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = cfg.bg;
        el.style.borderColor = cfg.border;
      }}
    >
      {/* Icon */}
      <div
        style={{
          fontSize: 18,
          flexShrink: 0,
          marginTop: 1,
          lineHeight: 1,
          filter: "drop-shadow(0 0 4px currentColor)",
        }}
      >
        {cfg.icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Severity pill + headline on same line */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "2px 7px",
              borderRadius: 99,
              background: cfg.pill,
              color: cfg.pillText,
              border: `1px solid ${cfg.border}`,
              flexShrink: 0,
            }}
          >
            {SEV_LABELS[insight.severity]}
          </span>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 600,
              color: "#f1f5f9",
              lineHeight: 1.4,
            }}
          >
            {insight.headline}
          </p>
        </div>

        {/* Detail */}
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "#64748b",
            lineHeight: 1.55,
          }}
        >
          {insight.detail}
        </p>
      </div>

      {/* Left accent bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "12%",
          height: "76%",
          width: 3,
          borderRadius: "0 3px 3px 0",
          background: cfg.color,
          opacity: 0.6,
        }}
      />
    </div>
  );
}

export default function InsightsPanel({
  insights,
  windowLabel,
}: InsightsPanelProps) {
  if (!insights.length) return null;

  const counts = insights.reduce<Record<InsightSeverity, number>>(
    (acc, ins) => {
      acc[ins.severity] = (acc[ins.severity] || 0) + 1;
      return acc;
    },
    { positive: 0, warning: 0, neutral: 0, tip: 0 }
  );

  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(13,27,46,0.7)",
        backdropFilter: "blur(12px)",
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: "18px 22px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <span style={{ fontSize: 16 }}>📌</span>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 700,
                color: "#f1f5f9",
              }}
            >
              Insights
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: "#475569",
                marginTop: 1,
              }}
            >
              {windowLabel} · {insights.length} finding
              {insights.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Severity summary pills */}
        <div style={{ display: "flex", gap: 6 }}>
          {(["positive", "warning", "tip", "neutral"] as InsightSeverity[])
            .filter((s) => counts[s] > 0)
            .map((s) => {
              const cfg = SEV[s];
              return (
                <span
                  key={s}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: 99,
                    background: cfg.pill,
                    color: cfg.pillText,
                    border: `1px solid ${cfg.border}`,
                  }}
                >
                  {cfg.icon} {counts[s]}
                </span>
              );
            })}
        </div>
      </div>

      {/* ── Insight cards ── */}
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          position: "relative",
        }}
      >
        {insights.map((ins, i) => (
          <InsightCard key={ins.id} insight={ins} index={i} />
        ))}
      </div>
    </div>
  );
}
