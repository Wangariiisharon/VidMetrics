"use client";

import {
  Trophy,
  TrendingUp,
  Eye,
  ThumbsUp,
  Zap,
  Flame,
  Star,
} from "lucide-react";
import type { ScoredVideo, ChannelAverages } from "./types";
import { fmt, engRate } from "./utils";

interface WinningVideosProps {
  videos: ScoredVideo[];
  avgs: ChannelAverages;
}

function outperformPct(value: number, avg: number): number {
  if (!avg) return 0;
  return Math.round(((value - avg) / avg) * 100);
}

/** Thin horizontal score bar: label + filled track */
function ScoreBar({
  label,
  score,
  color,
  icon,
  weight,
}: {
  label: string;
  score: number;
  color: string;
  icon: React.ReactNode;
  weight: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10,
            color: "#64748b",
          }}
        >
          {icon} {label}
          <span style={{ color: "#334155", marginLeft: 2 }}>({weight})</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{score}</span>
      </div>
      <div
        style={{
          height: 4,
          borderRadius: 99,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${score}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            borderRadius: 99,
            transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </div>
    </div>
  );
}

/** Insight pill: metric name + delta vs channel avg */
function InsightPill({
  icon,
  label,
  pct,
}: {
  icon: React.ReactNode;
  label: string;
  pct: number;
}) {
  const positive = pct >= 0;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 9px",
        borderRadius: 20,
        background: positive
          ? "rgba(34,211,238,0.07)"
          : "rgba(248,113,113,0.07)",
        border: `1px solid ${
          positive ? "rgba(34,211,238,0.18)" : "rgba(248,113,113,0.18)"
        }`,
        fontSize: 11,
        fontWeight: 600,
        color: positive ? "#22d3ee" : "#f87171",
      }}
    >
      {icon}
      {label} {positive ? "+" : ""}
      {pct}%
    </div>
  );
}

const RANK_CONFIG = [
  {
    badge: "#1 Winner",
    badgeColor: "#fbbf24",
    badgeBg: "rgba(251,191,36,0.12)",
    borderColor: "rgba(251,191,36,0.45)",
    glow: "rgba(251,191,36,0.10)",
    icon: <Trophy size={11} />,
  },
  {
    badge: "#2 Runner-up",
    badgeColor: "#22d3ee",
    badgeBg: "rgba(34,211,238,0.10)",
    borderColor: "rgba(34,211,238,0.30)",
    glow: "rgba(6,182,212,0.07)",
    icon: <Star size={11} />,
  },
  {
    badge: "#3 Top Pick",
    badgeColor: "#a78bfa",
    badgeBg: "rgba(167,139,250,0.10)",
    borderColor: "rgba(167,139,250,0.28)",
    glow: "rgba(139,92,246,0.07)",
    icon: <Flame size={11} />,
  },
];

export default function WinningVideos({ videos, avgs }: WinningVideosProps) {
  // Safety: filter out any video that is missing a valid winScore
  // (can happen if the parent passed un-scored VideoItem objects by mistake)
  const safeVideos = videos.filter(
    (v) =>
      v.winScore != null &&
      typeof v.winScore.total === "number" &&
      !isNaN(v.winScore.total)
  );
  if (!safeVideos.length) return null;

  return (
    <div>
      {/* Section heading */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            padding: "6px 8px",
            borderRadius: 10,
            background: "rgba(251,191,36,0.12)",
            border: "1px solid rgba(251,191,36,0.25)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Trophy size={16} style={{ color: "#fbbf24" }} />
        </div>
        <h2
          style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#f1f5f9" }}
        >
          Winning Videos
        </h2>
        <span
          style={{
            fontSize: 11,
            color: "#64748b",
            padding: "2px 10px",
            borderRadius: 9999,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          Ranked by velocity · relative performance · recency
        </span>
      </div>

      {/* Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 20,
        }}
      >
        {safeVideos.slice(0, 3).map((v, i) => {
          const cfg = RANK_CONFIG[i] ?? RANK_CONFIG[2];
          const er = engRate(v);
          const viewsPct = outperformPct(v.viewsRaw, avgs.avgViews);
          const vpdPct = outperformPct(v.viewsPerDay, avgs.avgViewsPerDay);
          const erPct = outperformPct(er, avgs.avgEngRate);
          const ws = v.winScore;

          return (
            <a
              key={v.id}
              href={`https://youtube.com/watch?v=${v.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                flexDirection: "column",
                borderRadius: 18,
                textDecoration: "none",
                position: "relative",
                overflow: "hidden",
                border: `1px solid ${cfg.borderColor}`,
                background: "rgba(13,27,46,0.85)",
                backdropFilter: "blur(12px)",
                boxShadow: `0 0 0 1px ${cfg.glow}, 0 8px 40px ${cfg.glow}, 0 24px 48px rgba(0,0,0,0.4)`,
                transition: "transform 0.22s ease, box-shadow 0.22s ease",
                animation: `fadeSlideIn 0.45s ease ${i * 0.1}s both`,
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(-5px)";
                el.style.boxShadow = `0 0 0 1px ${cfg.borderColor}, 0 20px 60px ${cfg.glow}, 0 32px 64px rgba(0,0,0,0.5)`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(0)";
                el.style.boxShadow = `0 0 0 1px ${cfg.glow}, 0 8px 40px ${cfg.glow}, 0 24px 48px rgba(0,0,0,0.4)`;
              }}
            >
              {/* Rank badge */}
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  zIndex: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 10px",
                  borderRadius: 9999,
                  background: cfg.badgeBg,
                  border: `1px solid ${cfg.borderColor}`,
                  color: cfg.badgeColor,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {cfg.icon} {cfg.badge}
              </div>

              {/* Win score bubble — top right */}
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  zIndex: 10,
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  background: cfg.badgeBg,
                  border: `1.5px solid ${cfg.borderColor}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 0 12px ${cfg.glow}`,
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: cfg.badgeColor,
                    lineHeight: 1,
                  }}
                >
                  {ws.total}
                </span>
                <span
                  style={{
                    fontSize: 8,
                    color: "#64748b",
                    letterSpacing: "0.04em",
                  }}
                >
                  SCORE
                </span>
              </div>

              {/* Thumbnail */}
              <div
                style={{
                  position: "relative",
                  aspectRatio: "16/9",
                  overflow: "hidden",
                }}
              >
                <img
                  src={v.thumbnail}
                  alt={v.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    transition: "transform 0.4s ease",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(13,27,46,0.95) 0%, rgba(13,27,46,0.25) 55%, transparent 100%)",
                  }}
                />
                {v.duration && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 10,
                      right: 10,
                      background: "rgba(0,0,0,0.85)",
                      color: "#e2e8f0",
                      fontSize: 10,
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontFamily: "monospace",
                      fontWeight: 600,
                    }}
                  >
                    {v.duration}
                  </span>
                )}
              </div>

              {/* Body */}
              <div
                style={{
                  padding: "14px 18px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {/* Title */}
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#f1f5f9",
                    lineHeight: 1.45,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as const,
                    overflow: "hidden",
                  }}
                >
                  {v.title}
                </p>

                {/* Quick stats */}
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  {[
                    {
                      icon: <Eye size={11} style={{ color: "#22d3ee" }} />,
                      value: fmt(v.viewsRaw),
                      label: "views",
                    },
                    {
                      icon: <ThumbsUp size={11} style={{ color: "#60a5fa" }} />,
                      value: fmt(v.likesRaw),
                      label: "likes",
                    },
                    {
                      icon: <Zap size={11} style={{ color: "#fb923c" }} />,
                      value: `${er.toFixed(1)}%`,
                      label: "eng",
                    },
                  ].map(({ icon, value, label }) => (
                    <span
                      key={label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                        color: "#64748b",
                      }}
                    >
                      {icon}
                      <strong style={{ color: "#e2e8f0" }}>{value}</strong>{" "}
                      {label}
                    </span>
                  ))}
                </div>

                {/* Views/day hero callout */}
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: `${cfg.badgeBg}`,
                    border: `1px solid ${cfg.borderColor}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 10,
                        color: "#64748b",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      Views / day
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: 22,
                        fontWeight: 800,
                        color: cfg.badgeColor,
                        letterSpacing: "-0.02em",
                        lineHeight: 1,
                      }}
                    >
                      {fmt(v.viewsPerDay)}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 10,
                        color: "#64748b",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      vs channel avg
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: 16,
                        fontWeight: 700,
                        color: vpdPct >= 0 ? "#22d3ee" : "#f87171",
                        lineHeight: 1,
                      }}
                    >
                      {vpdPct >= 0 ? "+" : ""}
                      {vpdPct}%
                    </p>
                  </div>
                </div>

                {/* Score breakdown bars */}
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <ScoreBar
                    label="Velocity"
                    score={ws.velocity}
                    color="#22d3ee"
                    weight="50%"
                    icon={<TrendingUp size={9} style={{ color: "#22d3ee" }} />}
                  />
                  <ScoreBar
                    label="Relative"
                    score={ws.relative}
                    color="#60a5fa"
                    weight="30%"
                    icon={<Eye size={9} style={{ color: "#60a5fa" }} />}
                  />
                  <ScoreBar
                    label="Recency"
                    score={ws.recency}
                    color="#a78bfa"
                    weight="20%"
                    icon={<Zap size={9} style={{ color: "#a78bfa" }} />}
                  />
                </div>

                {/* Insight pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <InsightPill
                    icon={<Eye size={9} />}
                    label="Views"
                    pct={viewsPct}
                  />
                  <InsightPill
                    icon={<TrendingUp size={9} />}
                    label="Views/day"
                    pct={vpdPct}
                  />
                  <InsightPill
                    icon={<Zap size={9} />}
                    label="Eng. rate"
                    pct={erPct}
                  />
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
