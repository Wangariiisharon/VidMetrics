"use client";

import { TrendingUp } from "lucide-react";
import type { VideoItem, ChannelAverages } from "./types";
import { fmt, engRate, relativeTime, trendBadge } from "./utils";

interface VideoRowProps {
  video: VideoItem;
  index: number;
  avgs: ChannelAverages;
}

const tdStyle: React.CSSProperties = {
  padding: "14px 16px",
  fontSize: 13,
  color: "#94a3b8",
  textAlign: "right",
  whiteSpace: "nowrap",
};

export default function VideoRow({ video: v, index, avgs }: VideoRowProps) {
  const er = engRate(v);
  const trend = trendBadge(er);

  // Highlight views/day cell if above channel average
  const vpdAboveAvg = v.viewsPerDay > avgs.avgViewsPerDay;

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
      {/* Thumbnail + title */}
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
                maxWidth: 260,
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

      {/* Views */}
      <td style={tdStyle}>
        <span style={{ color: "#e2e8f0", fontWeight: 600 }}>
          {fmt(v.viewsRaw)}
        </span>
      </td>

      {/* Views / day — highlighted if above avg */}
      <td style={tdStyle}>
        <span
          style={{
            padding: "3px 8px",
            borderRadius: 6,
            background: vpdAboveAvg ? "rgba(34,211,238,0.08)" : "transparent",
            color: vpdAboveAvg ? "#22d3ee" : "#94a3b8",
            fontWeight: vpdAboveAvg ? 700 : 400,
            fontSize: 13,
          }}
        >
          {fmt(v.viewsPerDay)}
        </span>
      </td>

      {/* Likes */}
      <td style={tdStyle}>{fmt(v.likesRaw)}</td>

      {/* Comments */}
      <td style={tdStyle}>{fmt(v.commentsRaw)}</td>

      {/* Eng. rate */}
      <td style={tdStyle}>
        <span style={{ color: "#cbd5e1" }}>{er.toFixed(2)}%</span>
      </td>

      {/* Trend + published */}
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
