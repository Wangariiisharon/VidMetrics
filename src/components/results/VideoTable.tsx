"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { VideoItem, SortKey, SortDir, ChannelAverages } from "./types";
import { engRate, fmt } from "./utils";
import VideoRow from "./VideoRow";

interface VideoTableProps {
  videos: VideoItem[];
  avgs: ChannelAverages;
  timeRange?: number;
}

const COLUMNS: { label: string; key: SortKey; tooltip?: string }[] = [
  { label: "VIEWS", key: "viewsRaw" },
  {
    label: "VIEWS/DAY",
    key: "viewsPerDay",
    tooltip: "Average views per day since publish",
  },
  { label: "LIKES", key: "likesRaw" },
  { label: "COMMENTS", key: "commentsRaw" },
  { label: "ENG. RATE", key: "engRate" },
  { label: "TREND", key: "publishedTs" },
];

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  const s = { marginLeft: 4 };
  if (!active)
    return <ArrowUpDown size={12} style={{ ...s, color: "#334155" }} />;
  return dir === "desc" ? (
    <ArrowDown size={12} style={{ ...s, color: "#22d3ee" }} />
  ) : (
    <ArrowUp size={12} style={{ ...s, color: "#22d3ee" }} />
  );
}

export default function VideoTable({
  videos,
  avgs,
  timeRange = 30,
}: VideoTableProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("viewsPerDay");
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
    const header = [
      "Title",
      "Views",
      "Views/Day",
      "Likes",
      "Comments",
      "Eng Rate %",
      "Published",
    ];
    const rows = sorted.map((v) => [
      `"${v.title.replace(/"/g, '""')}"`,
      v.viewsRaw,
      fmt(v.viewsPerDay),
      v.likesRaw,
      v.commentsRaw,
      engRate(v).toFixed(2),
      v.publishedAt,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "videos.csv";
    a.click();
  };

  const thBase: React.CSSProperties = {
    padding: "14px 16px",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "#475569",
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
      {/* ── Toolbar ── */}
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
        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 600,
              color: "#f1f5f9",
            }}
          >
            Videos This Month
          </p>
          {/* Channel averages summary */}
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#475569" }}>
            Channel avg: {fmt(avgs.avgViews)} views · {fmt(avgs.avgViewsPerDay)}{" "}
            views/day · {avgs.avgEngRate.toFixed(2)}% eng rate
          </p>
        </div>

        {/* Filter input */}
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

        {/* Export CSV */}
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

      {/* ── Table ── */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <th
                style={{
                  ...thBase,
                  textAlign: "left",
                  width: "35%",
                  cursor: "default",
                }}
              >
                VIDEO
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  style={{ ...thBase, cursor: "pointer" }}
                  onClick={() => handleSort(col.key)}
                  title={col.tooltip}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                    }}
                  >
                    {/* Underline VIEWS/DAY to hint it's special */}
                    {col.key === "viewsPerDay" ? (
                      <span
                        style={{
                          borderBottom: "1px dashed rgba(34,211,238,0.4)",
                          color: "#22d3ee",
                        }}
                      >
                        {col.label}
                      </span>
                    ) : (
                      col.label
                    )}
                    <SortIcon active={sortKey === col.key} dir={sortDir} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
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
              sorted.map((v, i) => (
                <VideoRow key={v.id} video={v} index={i} avgs={avgs} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
