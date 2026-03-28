"use client";

import { useState, useMemo } from "react";
import {
  Eye,
  ThumbsUp,
  Users,
  Video,
  ExternalLink,
  MessageSquare,
  TrendingUp,
  BarChart2,
  Download,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
} from "lucide-react";

/* ─────────────────────────── Types ─────────────────────────── */
export interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  views: string;
  likes: string;
  comments: string;
  publishedAt: string;
  duration: string;
  category: string;

  /** raw numbers for sorting / calculations */
  viewsRaw: number;
  likesRaw: number;
  commentsRaw: number;
  publishedTs: number;
}

export interface ChannelData {
  name: string;
  handle: string;
  subscribers: string;
  totalViews: string;
  videoCount: string;
  avatar: string;
  banner: string;
  videos: VideoItem[];
}

type SortKey =
  | "viewsRaw"
  | "likesRaw"
  | "commentsRaw"
  | "engRate"
  | "publishedTs";
type SortDir = "asc" | "desc";

/* ─────────────────────────── Helpers ───────────────────────── */
function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function engRate(v: VideoItem): number {
  if (!v.viewsRaw) return 0;
  return ((v.likesRaw + v.commentsRaw) / v.viewsRaw) * 100;
}

function relativeTime(ts: number): string {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 86400) return "Today";
  const days = Math.floor(diff / 86400);
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

function CategoryChart({ videos }: { videos: VideoItem[] }) {
  // Count videos per category
  const cats: Record<string, number> = {};
  for (const v of videos) {
    cats[v.category] = (cats[v.category] || 0) + 1;
  }
  const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const maxCount = sorted[0]?.[1] || 1;
  const COLORS = ["#22d3ee", "#3b82f6", "#a78bfa", "#34d399", "#f472b6"];

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
                    COLORS[i % COLORS.length]
                  }cc, ${COLORS[i % COLORS.length]})`,
                  borderRadius: 4,
                  transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 8,
                }}
              />
            </div>
            <span
              style={{
                width: 64,
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
        {[
          0,
          Math.ceil(maxCount * 0.25),
          Math.ceil(maxCount * 0.5),
          Math.ceil(maxCount * 0.75),
          maxCount,
        ].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
    </div>
  );
}

/** Generate fake 30-day daily data from video stats */
function buildDailyData(videos: VideoItem[]) {
  const days: { label: string; views: number; eng: number }[] = [];
  const now = Date.now();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    // weight by videos published around that day
    const base = videos.reduce((sum, v) => {
      const age = Math.abs(v.publishedTs - d.getTime()) / 86400000;
      return sum + (age < 5 ? v.viewsRaw / 5 : v.viewsRaw / 30);
    }, 0);
    const noise = 0.7 + Math.random() * 0.6;
    const views = Math.round(base * noise);
    const eng = 2.5 + Math.random() * 5.5;
    days.push({ label, views, eng });
  }
  return days;
}

/* ─────────────────────────── Sparkline SVG ─────────────────── */
function LineChart({
  data,
  color,
  yKey,
  title,
  suffix = "",
}: {
  data: { label: string; [k: string]: number | string }[];
  color: string;
  yKey: string;
  title: string;
  suffix?: string;
}) {
  const vals = data.map((d) => d[yKey] as number);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const W = 560,
    H = 180,
    PAD = { t: 16, r: 16, b: 40, l: 64 };
  const iW = W - PAD.l - PAD.r;
  const iH = H - PAD.t - PAD.b;

  const x = (i: number) => PAD.l + (i / (vals.length - 1)) * iW;
  const y = (v: number) => PAD.t + iH - ((v - min) / (max - min || 1)) * iH;

  const polyline = vals.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const area =
    `M${x(0)},${y(vals[0])} ` +
    vals.map((v, i) => `L${x(i)},${y(v)}`).join(" ") +
    ` L${x(vals.length - 1)},${PAD.t + iH} L${x(0)},${PAD.t + iH} Z`;

  // Y-axis ticks
  const ticks = 5;
  const yTicks = Array.from({ length: ticks }, (_, i) => {
    const v = min + ((max - min) / (ticks - 1)) * i;
    return { v, py: y(v) };
  });

  // X-axis: show ~6 labels
  const xStep = Math.floor(data.length / 6);
  const xLabels = data.filter(
    (_, i) => i % xStep === 0 || i === data.length - 1
  );

  return (
    <div
      style={{
        background: "rgba(13,27,46,0.7)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.07)",
        padding: "20px 20px 8px",
        flex: 1,
        minWidth: 0,
      }}
    >
      <p
        style={{
          margin: "0 0 12px",
          fontSize: 13,
          fontWeight: 600,
          color: "#94a3b8",
        }}
      >
        {title}
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", overflow: "visible" }}
      >
        <defs>
          <linearGradient id={`grad-${yKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
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

        {/* Y labels */}
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

        {/* X labels */}
        {xLabels.map((d) => {
          const idx = data.indexOf(d);
          return (
            <text
              key={idx}
              x={x(idx)}
              y={H - 8}
              textAnchor="middle"
              fill="#475569"
              fontSize="9.5"
            >
              {d.label}
            </text>
          );
        })}

        {/* Area fill */}
        <path d={area} fill={`url(#grad-${yKey})`} />

        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/* ─────────────────────────── Sort icon ──────────────────────── */
function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active)
    return (
      <ArrowUpDown size={12} style={{ color: "#334155", marginLeft: 4 }} />
    );
  return dir === "desc" ? (
    <ArrowDown size={12} style={{ color: "#22d3ee", marginLeft: 4 }} />
  ) : (
    <ArrowUp size={12} style={{ color: "#22d3ee", marginLeft: 4 }} />
  );
}

/* ─────────────────────────── Video Table ───────────────────── */
function VideoTable({ videos }: { videos: VideoItem[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("viewsRaw");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [focused, setFocused] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = useMemo(() => {
    const filtered = videos.filter((v) =>
      v.title.toLowerCase().includes(query.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      const va = sortKey === "engRate" ? engRate(a) : (a[sortKey] as number);
      const vb = sortKey === "engRate" ? engRate(b) : (b[sortKey] as number);
      return sortDir === "desc" ? vb - va : va - vb;
    });
  }, [videos, query, sortKey, sortDir]);

  const exportCSV = () => {
    const rows = [
      ["Title", "Views", "Likes", "Comments", "Eng Rate %", "Published"],
      ...sorted.map((v) => [
        `"${v.title.replace(/"/g, '""')}"`,
        v.viewsRaw,
        v.likesRaw,
        v.commentsRaw,
        engRate(v).toFixed(2),
        v.publishedAt,
      ]),
    ];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], {
      type: "text/csv",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "videos.csv";
    a.click();
  };

  const cols: { label: string; key: SortKey; width?: number }[] = [
    { label: "VIEWS", key: "viewsRaw" },
    { label: "LIKES", key: "likesRaw" },
    { label: "COMMENTS", key: "commentsRaw" },
    { label: "ENG. RATE", key: "engRate" },
    { label: "PUBLISHED", key: "publishedTs" },
  ];

  const thStyle: React.CSSProperties = {
    padding: "14px 16px",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "#475569",
    cursor: "pointer",
    whiteSpace: "nowrap",
    userSelect: "none",
    textAlign: "right",
  };

  return (
    <div
      style={{
        background: "rgba(13,27,46,0.7)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.07)",
        overflow: "hidden",
      }}
    >
      {/* Table header bar */}
      <div
        style={{
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexWrap: "wrap",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: "#f1f5f9",
            flex: 1,
          }}
        >
          Videos This Month
        </p>

        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${
              focused ? "rgba(6,182,212,0.4)" : "rgba(255,255,255,0.08)"
            }`,
            borderRadius: 10,
            padding: "7px 12px",
            transition: "border-color 0.2s",
          }}
        >
          <Search size={13} style={{ color: "#475569" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Filter videos..."
            style={{
              background: "none",
              border: "none",
              outline: "none",
              color: "#e2e8f0",
              fontSize: 13,
              width: 160,
            }}
          />
        </div>

        {/* Export */}
        <button
          onClick={exportCSV}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            padding: "8px 14px",
            color: "#94a3b8",
            fontSize: 13,
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "rgba(255,255,255,0.09)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "rgba(255,255,255,0.05)";
          }}
        >
          <Download size={13} /> Export
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <th
                style={{
                  ...thStyle,
                  textAlign: "left",
                  width: "40%",
                  cursor: "default",
                }}
              >
                VIDEO
              </th>
              {cols.map((c) => (
                <th
                  key={c.key}
                  style={thStyle}
                  onClick={() => handleSort(c.key)}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                    }}
                  >
                    {c.label}
                    <SortIcon active={sortKey === c.key} dir={sortDir} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    padding: "48px 24px",
                    color: "#334155",
                    fontSize: 14,
                  }}
                >
                  No videos match your filter.
                </td>
              </tr>
            ) : (
              sorted.map((v, i) => <VideoRow key={v.id} video={v} index={i} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────── Video Row ──────────────────────── */
function VideoRow({ video: v, index }: { video: VideoItem; index: number }) {
  const er = engRate(v);
  const trend =
    er > 5
      ? {
          label: `+${Math.round(er * 10)}%`,
          color: "#22d3ee",
          bg: "rgba(34,211,238,0.1)",
        }
      : er > 3
      ? {
          label: `+${Math.round(er * 5)}%`,
          color: "#34d399",
          bg: "rgba(52,211,153,0.1)",
        }
      : {
          label: `${Math.round(er * 2)}%`,
          color: "#64748b",
          bg: "rgba(100,116,139,0.08)",
        };

  const tdStyle: React.CSSProperties = {
    padding: "14px 16px",
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "right",
    whiteSpace: "nowrap",
  };

  return (
    <tr
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.03)",
        transition: "background 0.15s",
        animation: `fadeSlideIn 0.3s ease ${index * 0.03}s both`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background =
          "rgba(255,255,255,0.025)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      {/* Video cell */}
      <td style={{ padding: "12px 16px" }}>
        <a
          href={`https://youtube.com/watch?v=${v.id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            textDecoration: "none",
          }}
        >
          <div style={{ position: "relative", flexShrink: 0 }}>
            <img
              src={v.thumbnail}
              alt={v.title}
              style={{
                width: 80,
                height: 45,
                objectFit: "cover",
                borderRadius: 8,
                display: "block",
              }}
            />
            {v.duration && (
              <span
                style={{
                  position: "absolute",
                  bottom: 3,
                  right: 3,
                  background: "rgba(0,0,0,0.85)",
                  color: "#e2e8f0",
                  fontSize: 9,
                  padding: "1px 4px",
                  borderRadius: 3,
                  fontFamily: "monospace",
                }}
              >
                {v.duration}
              </span>
            )}
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 500,
                color: "#e2e8f0",
                maxWidth: 320,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {v.title}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#475569" }}>
              {v.duration}
            </p>
          </div>
        </a>
      </td>

      <td style={tdStyle}>
        <span style={{ color: "#e2e8f0", fontWeight: 600 }}>
          {fmt(v.viewsRaw)}
        </span>
      </td>
      <td style={tdStyle}>{fmt(v.likesRaw)}</td>
      <td style={tdStyle}>{fmt(v.commentsRaw)}</td>
      <td style={tdStyle}>
        <span style={{ color: "#cbd5e1" }}>{er.toFixed(2)}%</span>
      </td>
      <td style={tdStyle}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 4,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 8px",
              borderRadius: 6,
              background: trend.bg,
              color: trend.color,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <TrendingUp size={10} /> {trend.label}
          </span>
          <span style={{ fontSize: 11, color: "#475569" }}>
            {relativeTime(v.publishedTs)}
          </span>
        </div>
      </td>
    </tr>
  );
}

/* ─────────────────────────── Main export ───────────────────── */
export default function ChannelResults({ data }: { data: ChannelData }) {
  const channelUrl = `https://youtube.com/${data.handle}`;

  // Compute aggregates from loaded videos
  const totalLikes = data.videos.reduce((s, v) => s + v.likesRaw, 0);
  const totalComments = data.videos.reduce((s, v) => s + v.commentsRaw, 0);
  const avgEng = data.videos.length
    ? data.videos.reduce((s, v) => s + engRate(v), 0) / data.videos.length
    : 0;

  const dailyData = useMemo(() => buildDailyData(data.videos), [data.videos]);

  const stats = [
    {
      icon: Users,
      label: "Subscribers",
      value: data.subscribers,
      color: "#22d3ee",
    },
    {
      icon: Eye,
      label: "Total Views",
      value: data.totalViews,
      color: "#60a5fa",
    },
    { icon: Video, label: "Videos", value: data.videoCount, color: "#a78bfa" },
    {
      icon: ThumbsUp,
      label: "Total Likes",
      value: fmt(totalLikes),
      color: "#34d399",
    },
    {
      icon: MessageSquare,
      label: "Total Comments",
      value: fmt(totalComments),
      color: "#f472b6",
    },
    {
      icon: BarChart2,
      label: "Avg Engagement",
      value: `${avgEng.toFixed(2)}%`,
      color: "#fb923c",
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1152,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 24,
        animation: "fadeSlideIn 0.5s ease both",
      }}
    >
      {/* ── Channel header card ──────────────────── */}
      <div
        style={{
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(13,27,46,0.7)",
          backdropFilter: "blur(12px)",
          overflow: "hidden",
          boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
        }}
      >
        {data.banner && (
          <div
            style={{ position: "relative", height: 110, overflow: "hidden" }}
          >
            <img
              src={data.banner}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.3,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to bottom, transparent 20%, #0d1b2e)",
              }}
            />
          </div>
        )}

        {/* Avatar row */}
        <div
          style={{
            padding: "20px 28px",
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            alignItems: "center",
          }}
        >
          <img
            src={data.avatar}
            alt={data.name}
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              border: "3px solid rgba(6,182,212,0.5)",
              boxShadow: "0 0 20px rgba(6,182,212,0.2)",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 120 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: "#f8fafc",
                letterSpacing: "-0.02em",
              }}
            >
              {data.name}
            </h2>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: "#64748b" }}>
              {data.handle}
            </p>
          </div>
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#94a3b8",
              fontSize: 13,
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "rgba(255,255,255,0.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "rgba(255,255,255,0.05)";
            }}
          >
            View on YouTube <ExternalLink size={13} />
          </a>
        </div>

        {/* 6-stat bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {stats.map(({ icon: Icon, label, value, color }, i) => (
            <div
              key={label}
              style={{
                padding: "16px 12px",
                textAlign: "center",
                borderLeft:
                  i > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  marginBottom: 5,
                }}
              >
                <Icon size={12} style={{ color }} />
                <span
                  style={{
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.09em",
                    color: "#475569",
                  }}
                >
                  {label}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  color,
                  lineHeight: 1,
                }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Line charts row ──────────────────────── */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <LineChart
          data={dailyData}
          color="#22d3ee"
          yKey="views"
          title="Views Trend (30 Days)"
        />
        <LineChart
          data={dailyData}
          color="#34d399"
          yKey="eng"
          title="Engagement Rate (30 Days)"
          suffix="%"
        />
      </div>

      {/* ── Category bar chart ───────────────────── */}
      {data.videos.length > 0 && <CategoryChart videos={data.videos} />}

      {/* ── Video table ──────────────────────────── */}
      {data.videos.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "64px 24px",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            color: "#475569",
            fontSize: 14,
          }}
        >
          No videos found for this channel.
        </div>
      ) : (
        <VideoTable videos={data.videos} />
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
