"use client";

import { useState } from "react";
import { BarChart2, TrendingUp, Zap, AlertCircle } from "lucide-react";
import ChannelSearch from "./ChannelSearch";
import ChannelResults from "./ChannelResults";
import type { ChannelData } from "./results";

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

/** Shared dark grid + glow background layer */
function Background() {
  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(56,189,248,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(6,182,212,0.08) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-20 left-[20%] w-80 h-80 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(37,99,235,0.07) 0%, transparent 70%)",
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
    setView("leaving");
    setTimeout(() => {
      setView("entering");
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

  //  Hero page
  if (view === "hero" || view === "leaving") {
    return (
      <main className="min-h-screen bg-[#060e1a] text-slate-200 overflow-x-hidden overflow-hidden relative">
        <Background />
        <div
          style={heroSlide}
          className="relative z-10 px-6 pt-20 pb-24 flex flex-col items-center"
        >
          {/* Badge */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/[0.08] mb-10">
            <span
              className="w-2 h-2 rounded-full bg-green-400 inline-block"
              style={{
                boxShadow: "0 0 6px #4ade80",
                animation: "blink 2s infinite",
              }}
            />
            <span className="text-xs text-slate-300 tracking-widest font-medium">
              Competitor Intelligence Platform
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-center font-extrabold leading-none tracking-tight mb-5 mt-0 text-[clamp(2.5rem,8vw,5rem)]">
            <span className="text-white">Analyze </span>
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
          <p className="text-slate-400 text-center text-lg max-w-[480px] leading-relaxed font-light mb-12 mt-0">
            Paste a YouTube channel URL and instantly see which videos are
            crushing it.{" "}
            <span className="text-slate-300">
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
            <div className="mt-4 px-5 py-3 rounded-xl border border-yellow-500/25 bg-yellow-500/[0.08] text-yellow-200 text-sm max-w-[520px] w-full">
              <strong>Setup required:</strong> Copy{" "}
              <code className="bg-white/10 rounded px-1.5 py-0.5">
                .env.local.example
              </code>{" "}
              to{" "}
              <code className="bg-white/10 rounded px-1.5 py-0.5">
                .env.local
              </code>{" "}
              and add your{" "}
              <a
                href="https://console.cloud.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 underline"
              >
                YouTube Data API v3 key
              </a>
              .
            </div>
          )}

          {/* Generic error */}
          {error && !error.includes("NEXT_PUBLIC_YOUTUBE_API_KEY") && (
            <div className="mt-6 flex items-center gap-3 px-5 py-3 rounded-xl border border-red-500/20 bg-red-500/[0.08] text-red-300 text-sm max-w-[520px] w-full">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Loading spinner */}
          {loading && (
            <div className="mt-12 w-full max-w-[640px] flex flex-col items-center gap-4">
              <div
                className="w-12 h-12 rounded-full border-[3px] border-cyan-500/20 border-t-cyan-400"
                style={{ animation: "spin 0.8s linear infinite" }}
              />
              <p className="text-slate-500 text-sm m-0">
                Fetching channel data…
              </p>
            </div>
          )}

          {/* Feature cards */}
          {!loading && (
            <div
              className="mt-20 grid gap-4 w-full max-w-3xl"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              }}
            >
              {FEATURES.map(({ icon: Icon, title, desc, accent }) => (
                <div
                  key={title}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-white/[0.06] bg-[rgba(13,27,46,0.5)] backdrop-blur-sm cursor-default transition-colors duration-200"
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
                    className="p-3 rounded-xl"
                    style={{ background: `${accent}18` }}
                  >
                    <Icon size={20} style={{ color: accent }} />
                  </div>
                  <p className="text-slate-100 font-semibold text-sm m-0">
                    {title}
                  </p>
                  <p className="text-slate-500 text-xs text-center leading-relaxed m-0">
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

  //  Results page
  return (
    <main className="min-h-screen bg-[#060e1a] text-slate-200 overflow-x-hidden overflow-hidden relative">
      <Background />

      {/*  Sticky top nav bar  */}
      <div
        style={resultsSlide}
        className="sticky top-0 z-50 backdrop-blur-2xl bg-[rgba(6,14,26,0.85)] border-b border-white/[0.07] px-6 flex items-center justify-between h-[60px]"
      >
        {/* Back button — hidden on mobile */}
        <button
          onClick={handleBack}
          className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-[10px] px-3.5 py-1.5 text-slate-400 text-sm font-medium cursor-pointer transition-all duration-150 hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/35"
        >
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
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Analyzing</span>
          {results?.avatar && (
            <img
              src={results.avatar}
              alt=""
              className="w-6 h-6 rounded-full border border-cyan-500/40"
            />
          )}
          <span className="text-sm font-semibold text-slate-300">
            {results?.name}
          </span>
        </div>

        {/* New search button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 border border-cyan-500/25 rounded-[10px] px-3.5 py-1.5 text-cyan-400 text-sm font-medium cursor-pointer transition-all duration-150 hover:bg-cyan-500/25"
          style={{
            background:
              "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(59,130,246,0.15))",
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

      {/*  Results body  */}
      <div style={resultsSlide} className="relative z-10 px-6 pt-8 pb-24">
        {results && <ChannelResults data={results} />}
      </div>
    </main>
  );
}
