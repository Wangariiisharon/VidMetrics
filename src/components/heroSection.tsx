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

const FEATURES = [
  {
    icon: BarChart2,
    title: "Video Performance",
    desc: "Track views, likes & engagement",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: TrendingUp,
    title: "Trend Analysis",
    desc: "Spot content that's crushing it",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Zap,
    title: "Instant Insights",
    desc: "Real-time competitive intelligence",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
];

export default function HeroSection() {
  const [results, setResults] = useState<ChannelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="relative min-h-screen bg-[#060e1a] overflow-x-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(56,189,248,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56,189,248,0.07) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-20 left-1/4 w-[300px] h-[300px] rounded-full bg-blue-600/8 blur-[90px] pointer-events-none" />

      <div className="relative z-10 px-4 pt-20 pb-24 flex flex-col items-center">
        {/* Badge */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/8 backdrop-blur-sm mb-10">
          <span className="w-2 h-2 rounded-full bg-green-400 shadow-sm shadow-green-400/60 animate-pulse" />
          <span className="text-slate-300 text-xs font-medium tracking-wide">
            Competitor Intelligence Platform
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-center text-5xl sm:text-6xl md:text-7xl font-extrabold leading-none tracking-tight mb-5">
          <span className="text-white">Analyze </span>
          <span
            className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
            style={{
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Any Channel
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="text-slate-400 text-center text-lg max-w-xl mb-12 leading-relaxed font-light">
          Paste a YouTube channel URL and instantly see which videos are
          crushing it.{" "}
          <span className="text-slate-300">
            Competitive analysis in seconds.
          </span>
        </p>

        {/* Search */}
        <ChannelSearch
          onResults={setResults}
          onLoading={setLoading}
          onError={setError}
        />

        {/* Error State */}
        {error && (
          <div className="mt-6 flex items-center gap-3 px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm max-w-lg w-full">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="mt-16 w-full max-w-6xl">
            <div className="h-48 rounded-2xl bg-white/5 animate-pulse mb-8" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-video rounded-xl bg-white/5 animate-pulse"
                />
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && results && <ChannelResults data={results} />}

        {/* Feature cards — only shown when no results */}
        {!results && !loading && (
          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
              <div
                key={title}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-white/5 bg-[#0d1b2e]/50 backdrop-blur-sm hover:border-white/10 transition-all duration-200 group"
              >
                <div
                  className={`p-3 rounded-xl ${bg} group-hover:scale-110 transition-transform duration-200`}
                >
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <p className="text-white font-semibold text-sm">{title}</p>
                <p className="text-slate-500 text-xs text-center leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
