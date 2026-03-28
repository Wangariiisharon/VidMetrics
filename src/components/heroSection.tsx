"use client";

import { useState } from "react";
import { BarChart2, TrendingUp, Zap, AlertCircle } from "lucide-react";
import ChannelSearch from "./ChannelSearch";
import ChannelResults from "./ChannelResults";

interface ChannelData {
  name: string;
  handle: string;
  subscribers: string;
  totalViews: string;
  videoCount: string;
  avatar: string;
  banner: string;
  videos: any[];
}

type View = "hero" | "entering" | "results" | "leaving";

const FEATURES = [
  {
    icon: BarChart2,
    title: "Video Performance",
    desc: "Track views, likes & engagement",
    accent: "#22d3ee",
  },
  {
    icon: TrendingUp,
    title: "Trend Analysis",
    desc: "Spot content that's crushing it",
    accent: "#60a5fa",
  },
  {
    icon: Zap,
    title: "Instant Insights",
    desc: "Real-time competitive intelligence",
    accent: "#a78bfa",
  },
];

const BASE: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#060e1a",
  color: "#e2e8f0",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  overflowX: "hidden",
  position: "relative",
};

/** Shared dark grid + glow background layer */
function Background() {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(rgba(56,189,248,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 800,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(6,182,212,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 80,
          left: "20%",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(37,99,235,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
    </>
  );
}

export default function HeroSection() {
  const [results, setResults] = useState<ChannelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("hero");

  const handleResults = (data: ChannelData) => {
    setResults(data);
    // Trigger slide-out of hero, then swap to results view
    setView("leaving");
    setTimeout(() => {
      setView("entering");
      // Small tick to let "entering" state paint before animating in
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setView("results"))
      );
    }, 380);
  };

  const handleBack = () => {
    setView("leaving");
    setTimeout(() => {
      setResults(null);
      setError(null);
      setView("hero");
    }, 380);
  };

  // ── Slide animation styles ──────────────────────────────
  const heroSlide: React.CSSProperties =
    view === "leaving"
      ? {
          transform: "translateX(-100%)",
          opacity: 0,
          transition:
            "transform 0.38s cubic-bezier(0.4,0,0.2,1), opacity 0.38s ease",
        }
      : {
          transform: "translateX(0)",
          opacity: 1,
          transition:
            "transform 0.38s cubic-bezier(0.4,0,0.2,1), opacity 0.38s ease",
        };

  const resultsSlide: React.CSSProperties =
    view === "entering"
      ? { transform: "translateX(100%)", opacity: 0 }
      : view === "results"
      ? {
          transform: "translateX(0)",
          opacity: 1,
          transition:
            "transform 0.42s cubic-bezier(0.4,0,0.2,1), opacity 0.42s ease",
        }
      : {
          transform: "translateX(100%)",
          opacity: 0,
          transition:
            "transform 0.38s cubic-bezier(0.4,0,0.2,1), opacity 0.38s ease",
        };

  // ── Hero page ───────────────────────────────────────────
  if (view === "hero" || view === "leaving") {
    return (
      <main style={{ ...BASE, overflow: "hidden" }}>
        <Background />
        <div
          style={{
            ...heroSlide,
            position: "relative",
            zIndex: 10,
            padding: "80px 24px 96px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: 9999,
              border: "1px solid rgba(6,182,212,0.25)",
              background: "rgba(6,182,212,0.08)",
              marginBottom: 40,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#4ade80",
                boxShadow: "0 0 6px #4ade80",
                display: "inline-block",
                animation: "blink 2s infinite",
              }}
            />
            <span
              style={{
                fontSize: 12,
                color: "#cbd5e1",
                letterSpacing: "0.05em",
                fontWeight: 500,
              }}
            >
              Competitor Intelligence Platform
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              textAlign: "center",
              fontSize: "clamp(2.5rem, 8vw, 5rem)",
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-0.03em",
              marginBottom: 20,
              marginTop: 0,
            }}
          >
            <span style={{ color: "#fff" }}>Analyze </span>
            <span
              style={{
                background: "linear-gradient(90deg, #22d3ee, #3b82f6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Any Channel
            </span>
          </h1>

          {/* Sub */}
          <p
            style={{
              color: "#94a3b8",
              textAlign: "center",
              fontSize: "1.1rem",
              maxWidth: 480,
              lineHeight: 1.7,
              fontWeight: 300,
              marginBottom: 48,
              marginTop: 0,
            }}
          >
            Paste a YouTube channel URL and instantly see which videos are
            crushing it.{" "}
            <span style={{ color: "#cbd5e1" }}>
              Competitive analysis in seconds.
            </span>
          </p>

          <ChannelSearch
            onResults={handleResults}
            onLoading={setLoading}
            onError={setError}
          />

          {/* API key warning */}
          {error?.includes("NEXT_PUBLIC_YOUTUBE_API_KEY") && (
            <div
              style={{
                marginTop: 16,
                padding: "12px 20px",
                borderRadius: 12,
                background: "rgba(234,179,8,0.08)",
                border: "1px solid rgba(234,179,8,0.25)",
                color: "#fde68a",
                fontSize: 13,
                maxWidth: 520,
                width: "100%",
              }}
            >
              <strong>Setup required:</strong> Copy{" "}
              <code
                style={{
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: 4,
                  padding: "1px 6px",
                }}
              >
                .env.local.example
              </code>{" "}
              to{" "}
              <code
                style={{
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: 4,
                  padding: "1px 6px",
                }}
              >
                .env.local
              </code>{" "}
              and add your{" "}
              <a
                href="https://console.cloud.google.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#38bdf8", textDecoration: "underline" }}
              >
                YouTube Data API v3 key
              </a>
              .
            </div>
          )}

          {/* Generic error */}
          {error && !error.includes("NEXT_PUBLIC_YOUTUBE_API_KEY") && (
            <div
              style={{
                marginTop: 24,
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 20px",
                borderRadius: 12,
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#fca5a5",
                fontSize: 14,
                maxWidth: 520,
                width: "100%",
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div
              style={{
                marginTop: 48,
                width: "100%",
                maxWidth: 640,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  border: "3px solid rgba(6,182,212,0.2)",
                  borderTopColor: "#22d3ee",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <p style={{ color: "#475569", fontSize: 14, margin: 0 }}>
                Fetching channel data…
              </p>
            </div>
          )}

          {/* Feature cards */}
          {!loading && (
            <div
              style={{
                marginTop: 80,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
                width: "100%",
                maxWidth: 768,
              }}
            >
              {FEATURES.map(({ icon: Icon, title, desc, accent }) => (
                <div
                  key={title}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                    padding: "24px 20px",
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(13,27,46,0.5)",
                    backdropFilter: "blur(8px)",
                    transition: "border-color 0.2s",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => {
                    (
                      e.currentTarget as HTMLElement
                    ).style.borderColor = `${accent}44`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "rgba(255,255,255,0.06)";
                  }}
                >
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      background: `${accent}18`,
                    }}
                  >
                    <Icon size={20} style={{ color: accent }} />
                  </div>
                  <p
                    style={{
                      color: "#f1f5f9",
                      fontWeight: 600,
                      fontSize: 14,
                      margin: 0,
                    }}
                  >
                    {title}
                  </p>
                  <p
                    style={{
                      color: "#64748b",
                      fontSize: 12,
                      textAlign: "center",
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        <style>{`
          @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
          @keyframes spin { to{transform:rotate(360deg)} }
        `}</style>
      </main>
    );
  }

  // ── Results page ────────────────────────────────────────
  return (
    <main style={{ ...BASE, overflow: "hidden" }}>
      <Background />

      {/* ── Sticky top nav bar ── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(16px)",
          background: "rgba(6,14,26,0.85)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 60,
          ...resultsSlide,
        }}
      >
        {/* Back button */}
        <button
          onClick={handleBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            padding: "7px 14px",
            color: "#94a3b8",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            transition: "background 0.15s, color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = "rgba(6,182,212,0.1)";
            el.style.color = "#22d3ee";
            el.style.borderColor = "rgba(6,182,212,0.35)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = "rgba(255,255,255,0.05)";
            el.style.color = "#94a3b8";
            el.style.borderColor = "rgba(255,255,255,0.1)";
          }}
        >
          {/* Arrow SVG */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to Search
        </button>

        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "#475569" }}>Analyzing</span>
          {results?.avatar && (
            <img
              src={results.avatar}
              alt=""
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                border: "1px solid rgba(6,182,212,0.4)",
              }}
            />
          )}
          <span style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>
            {results?.name}
          </span>
        </div>

        {/* New search button */}
        <button
          onClick={handleBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background:
              "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(59,130,246,0.15))",
            border: "1px solid rgba(6,182,212,0.25)",
            borderRadius: 10,
            padding: "7px 14px",
            color: "#22d3ee",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "linear-gradient(135deg, rgba(6,182,212,0.25), rgba(59,130,246,0.25))";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(59,130,246,0.15))";
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          New Search
        </button>
      </div>

      {/* ── Results body ── */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          padding: "32px 24px 96px",
          ...resultsSlide,
        }}
      >
        {results && <ChannelResults data={results} />}
      </div>
    </main>
  );
}
