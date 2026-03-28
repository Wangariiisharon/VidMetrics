"use client";

import { useState } from "react";
import { Search, ArrowRight, Loader2 } from "lucide-react";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  views: string;
  likes: string;
  publishedAt: string;
  description: string;
}

interface ChannelData {
  name: string;
  handle: string;
  subscribers: string;
  totalViews: string;
  videoCount: string;
  avatar: string;
  banner: string;
  videos: Video[];
}

interface ChannelSearchProps {
  onResults: (data: ChannelData) => void;
  onLoading: (loading: boolean) => void;
  onError: (error: string | null) => void;
}

const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

async function fetchChannelData(url: string): Promise<ChannelData> {
  // Extract handle or channel ID from URL
  const handleMatch = url.match(/@([\w.-]+)/);
  const channelIdMatch = url.match(/channel\/([\w-]+)/);

  let channelId: string | null = null;

  if (handleMatch) {
    // Search by handle
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${handleMatch[1]}&key=${API_KEY}`
    );
    const searchData = await searchRes.json();
    if (!searchData.items?.length) throw new Error("Channel not found");
    channelId = searchData.items[0].snippet.channelId;
  } else if (channelIdMatch) {
    channelId = channelIdMatch[1];
  } else {
    throw new Error("Invalid YouTube channel URL");
  }

  // Fetch channel details
  const channelRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${API_KEY}`
  );
  const channelData = await channelRes.json();
  if (!channelData.items?.length) throw new Error("Channel not found");

  const channel = channelData.items[0];
  const stats = channel.statistics;
  const snippet = channel.snippet;

  // Fetch latest videos
  const videosRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=12&key=${API_KEY}`
  );
  const videosData = await videosRes.json();

  const videoIds =
    videosData.items?.map((v: any) => v.id.videoId).join(",") || "";

  // Fetch video statistics
  const videoStatsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${API_KEY}`
  );
  const videoStatsData = await videoStatsRes.json();

  const videos: Video[] = (videoStatsData.items || []).map((v: any) => ({
    id: v.id,
    title: v.snippet.title,
    thumbnail:
      v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url,
    views: Number(v.statistics.viewCount || 0).toLocaleString(),
    likes: Number(v.statistics.likeCount || 0).toLocaleString(),
    publishedAt: new Date(v.snippet.publishedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    description: v.snippet.description?.slice(0, 120) + "..." || "",
  }));

  return {
    name: snippet.title,
    handle: snippet.customUrl || `@${snippet.title}`,
    subscribers: Number(stats.subscriberCount || 0).toLocaleString(),
    totalViews: Number(stats.viewCount || 0).toLocaleString(),
    videoCount: Number(stats.videoCount || 0).toLocaleString(),
    avatar: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
    banner: channel.brandingSettings?.image?.bannerExternalUrl || "",
    videos,
  };
}

const SUGGESTIONS = [
  "youtube.com/@mkbhd",
  "youtube.com/@veritasium",
  "youtube.com/@fireship",
];

export default function ChannelSearch({
  onResults,
  onLoading,
  onError,
}: ChannelSearchProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async (inputUrl?: string) => {
    const target = inputUrl || url;
    if (!target.trim()) return;

    setIsLoading(true);
    onLoading(true);
    onError(null);

    try {
      const data = await fetchChannelData(target.trim());
      onResults(data);
    } catch (err: any) {
      onError(err.message || "Failed to fetch channel data");
    } finally {
      setIsLoading(false);
      onLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Search Bar */}
      <div className="relative flex items-center gap-2 bg-[#0d1b2e]/80 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-sm shadow-2xl ring-1 ring-white/5 focus-within:ring-cyan-500/40 focus-within:border-cyan-500/40 transition-all duration-300">
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          placeholder="Paste YouTube channel URL..."
          className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 outline-none text-sm font-light tracking-wide"
        />
        <button
          onClick={() => handleAnalyze()}
          disabled={isLoading || !url.trim()}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-cyan-900/40 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Analyze <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Suggestions */}
      <p className="text-center text-slate-500 text-xs">
        Try:{" "}
        {SUGGESTIONS.map((s, i) => (
          <span key={s}>
            <button
              onClick={() => {
                setUrl(`https://${s}`);
                handleAnalyze(`https://${s}`);
              }}
              className="text-slate-400 hover:text-cyan-400 transition-colors duration-150 underline-offset-2 hover:underline"
            >
              {s}
            </button>
            {i < SUGGESTIONS.length - 1 && (
              <span className="mx-1.5 text-slate-600">·</span>
            )}
          </span>
        ))}
      </p>
    </div>
  );
}
