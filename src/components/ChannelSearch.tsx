"use client";
// components/ChannelSearch.tsx

import { useState, useCallback, useRef } from "react";
import { Search, ArrowRight, Loader2 } from "lucide-react";
import { ChannelData } from "./results/types";

interface ChannelSearchProps {
  onResults: (data: ChannelData) => void;
  onLoading: (loading: boolean) => void;
  onError: (error: string | null) => void;
}

const SUGGESTIONS = [
  {
    label: "youtube.com/@Sineadbovell",
    url: "https://www.youtube.com/@Sineadbovell",
  },
  {
    label: "youtube.com/@TheDiaryOfACEO",
    url: "https://www.youtube.com/@TheDiaryOfACEO",
  },
  {
    label: "youtube.com/@carpetmanofficial",
    url: "https://www.youtube.com/@carpetmanofficial",
  },
];

export default function ChannelSearch({
  onResults,
  onLoading,
  onError,
}: ChannelSearchProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Prevents duplicate in-flight requests
  const inFlight = useRef(false);

  const handleAnalyze = useCallback(
    async (inputUrl?: string) => {
      if (inFlight.current) return;

      const target = (inputUrl ?? url).trim();
      if (!target) return;

      inFlight.current = true;
      setIsLoading(true);
      onLoading(true);
      onError(null);

      try {
        // Correct
        const res = await fetch(
          `/api/youtube?url=${encodeURIComponent(target)}`
        );
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Failed to fetch channel data.");
        }

        onResults(json);
      } catch (err: any) {
        onError(
          err.message ||
            "Failed to fetch channel data. Check your API key and try again."
        );
      } finally {
        inFlight.current = false;
        setIsLoading(false);
        onLoading(false);
      }
    },
    [url, onResults, onLoading, onError]
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Search bar */}
      <div
        className={`
          flex items-center gap-2.5
          bg-[rgba(13,27,46,0.85)]
          border rounded-[14px]
          px-4 py-2.5
          shadow-[0_8px_32px_rgba(0,0,0,0.3)]
          transition-all duration-200
          focus-within:border-cyan-500/50
          focus-within:shadow-[0_0_0_3px_rgba(6,182,212,0.1),0_8px_32px_rgba(0,0,0,0.4)]
          border-white/10
        `}
      >
        <Search size={18} className="text-slate-500 shrink-0" />

        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          placeholder="Paste YouTube channel URL..."
          disabled={isLoading}
          className="
            flex-1 bg-transparent border-none outline-none
            text-slate-200 placeholder-slate-500
            text-sm font-light tracking-wide
            disabled:opacity-60
          "
        />

        <button
          onClick={() => handleAnalyze()}
          disabled={isLoading || !url.trim()}
          className="
            flex items-center gap-1.5
            px-5 py-2 rounded-[10px]
            bg-gradient-to-br from-cyan-500 to-blue-600
            text-white font-semibold text-sm
            shadow-[0_4px_16px_rgba(6,182,212,0.25)]
            hover:from-cyan-400 hover:to-blue-500
            disabled:opacity-40 disabled:cursor-not-allowed
            active:scale-[0.97]
            transition-all duration-150
            shrink-0
          "
        >
          {isLoading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Fetching…
            </>
          ) : (
            <>
              Analyze <ArrowRight size={15} />
            </>
          )}
        </button>
      </div>

      {/* Suggestion chips */}
      <div className="mt-3.5 flex flex-wrap justify-center items-center gap-2 text-xs text-slate-500">
        <span>Try:</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s.url}
            onClick={() => {
              setUrl(s.url);
              handleAnalyze(s.url);
            }}
            disabled={isLoading}
            className="
              bg-transparent border-none p-0
              text-slate-500 text-xs
              underline underline-offset-[3px] decoration-slate-500/40
              hover:text-cyan-400 hover:decoration-cyan-400/40
              disabled:cursor-not-allowed
              transition-colors duration-150
            "
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
