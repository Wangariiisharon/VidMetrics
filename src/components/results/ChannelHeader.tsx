"use client";

import {
  Users,
  Eye,
  Video,
  ThumbsUp,
  MessageSquare,
  BarChart2,
  ExternalLink,
} from "lucide-react";
import type { ChannelData, VideoItem } from "./types";
import { fmt, engRate } from "./utils";

interface ChannelHeaderProps {
  data: ChannelData;
}

export default function ChannelHeader({ data }: ChannelHeaderProps) {
  const channelUrl = `https://youtube.com/${data.handle}`;

  const totalLikes = data.videos.reduce((s, v) => s + v.likesRaw, 0);
  const totalComments = data.videos.reduce((s, v) => s + v.commentsRaw, 0);
  const avgEng = data.videos.length
    ? data.videos.reduce((s, v) => s + engRate(v), 0) / data.videos.length
    : 0;

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
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(13,27,46,0.7)",
        backdropFilter: "blur(12px)",
        overflow: "hidden",
        boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
      }}
    >
      {/* Banner */}
      {data.banner && (
        <div style={{ position: "relative", height: 110, overflow: "hidden" }}>
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

      {/* Avatar + name row */}
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
            transition: "background 0.15s",
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
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
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
  );
}
