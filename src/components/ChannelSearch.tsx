"use client";
// ChannelSearch.tsx — standalone search input + YouTube data fetcher

import { useState } from "react";
import { Search, ArrowRight, Loader2 } from "lucide-react";

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  views: string;
  likes: string;
  comments: string;
  publishedAt: string;
  duration: string;
  viewsRaw: number;
  likesRaw: number;
  commentsRaw: number;
  publishedTs: number;
  category: string;
}

export interface ChannelData {
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

/** Fetch a YouTube API URL and surface readable errors */
async function ytFetch(url: string) {
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) {
    throw new Error(`YouTube API ${data.error.code}: ${data.error.message}`);
  }
  console.log("Data", data);

  return data;
}

/** Format ISO 8601 duration PT4M13S → "4:13" */
function formatDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "";
  const h = parseInt(m[1] || "0");
  const min = parseInt(m[2] || "0");
  const s = parseInt(m[3] || "0");
  if (h > 0)
    return `${h}:${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${min}:${String(s).padStart(2, "0")}`;
}

/** Resolve any YouTube channel URL to a channel ID */
async function resolveChannelId(raw: string): Promise<string> {
  const url = raw.startsWith("http") ? raw : `https://${raw}`;

  // Direct /channel/UC… ID
  const directMatch = url.match(/\/channel\/(UC[\w-]{22})/);
  if (directMatch) return directMatch[1];

  // @handle — use forHandle param (most accurate)
  const handleMatch = url.match(/@([\w.-]+)/);
  if (handleMatch) {
    const d = await ytFetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${handleMatch[1]}&key=${API_KEY}`
    );
    if (d.items?.length) return d.items[0].id;

    // Fallback: search API
    const s = await ytFetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(
        handleMatch[1]
      )}&maxResults=1&key=${API_KEY}`
    );
    if (s.items?.length) return s.items[0].snippet.channelId;
    throw new Error(`Channel "@${handleMatch[1]}" not found.`);
  }

  // /c/name or /user/name
  const nameMatch = url.match(/\/(?:c|user)\/([\w.-]+)/);
  if (nameMatch) {
    const s = await ytFetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(
        nameMatch[1]
      )}&maxResults=1&key=${API_KEY}`
    );
    if (s.items?.length) return s.items[0].snippet.channelId;
    throw new Error(`Channel "${nameMatch[1]}" not found.`);
  }

  throw new Error("Unrecognised URL format. Try youtube.com/@channelname");
}

async function fetchChannelData(rawUrl: string): Promise<ChannelData> {
  if (!API_KEY) throw new Error("Missing NEXT_PUBLIC_YOUTUBE_API_KEY");

  const channelId = await resolveChannelId(rawUrl);

  const channelData = await ytFetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${API_KEY}`
  );
  if (!channelData.items?.length) throw new Error("Channel data not found.");

  const channel = channelData.items[0];
  const stats = channel.statistics;
  const snippet = channel.snippet;

  const videosData = await ytFetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=12&key=${API_KEY}`
  );

  const videoIds: string = (videosData.items || [])
    .map((v: any) => v.id?.videoId)
    .filter(Boolean)
    .join(",");

  let videos: Video[] = [];

  if (videoIds) {
    // Fetch video details + category list in parallel
    const [videoDetails, categoryData] = await Promise.all([
      ytFetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${videoIds}&key=${API_KEY}`
      ),
      ytFetch(
        `https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&regionCode=US&key=${API_KEY}`
      ),
    ]);

    // Build categoryId → label map
    const categoryMap: Record<string, string> = {};
    for (const c of categoryData.items || []) {
      categoryMap[c.id] = c.snippet.title;
    }

    videos = (videoDetails.items || []).map((v: any) => ({
      id: v.id,
      title: v.snippet.title,
      thumbnail:
        v.snippet.thumbnails?.maxres?.url ||
        v.snippet.thumbnails?.medium?.url ||
        v.snippet.thumbnails?.default?.url,
      views: Number(v.statistics?.viewCount || 0).toLocaleString(),
      likes: Number(v.statistics?.likeCount || 0).toLocaleString(),
      comments: Number(v.statistics?.commentCount || 0).toLocaleString(),
      viewsRaw: Number(v.statistics?.viewCount || 0),
      likesRaw: Number(v.statistics?.likeCount || 0),
      commentsRaw: Number(v.statistics?.commentCount || 0),
      publishedTs: new Date(v.snippet.publishedAt).getTime(),
      publishedAt: new Date(v.snippet.publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      duration: formatDuration(v.contentDetails?.duration || ""),
      category: categoryMap[v.snippet.categoryId] || "Uncategorized",
    }));
  }

  return {
    name: snippet.title,
    handle: snippet.customUrl || `@${snippet.title}`,
    subscribers: Number(stats?.subscriberCount || 0).toLocaleString(),
    totalViews: Number(stats?.viewCount || 0).toLocaleString(),
    videoCount: Number(stats?.videoCount || 0).toLocaleString(),
    avatar:
      snippet.thumbnails?.high?.url ||
      snippet.thumbnails?.medium?.url ||
      snippet.thumbnails?.default?.url,
    banner: channel.brandingSettings?.image?.bannerExternalUrl || "",
    videos,
  };
}

const SUGGESTIONS = [
  { label: "youtube.com/@mkbhd", url: "https://youtube.com/@mkbhd" },
  { label: "youtube.com/@veritasium", url: "https://youtube.com/@veritasium" },
  { label: "youtube.com/@fireship", url: "https://youtube.com/@fireship" },
];

export default function ChannelSearch({
  onResults,
  onLoading,
  onError,
}: ChannelSearchProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleAnalyze = async (inputUrl?: string) => {
    const target = (inputUrl ?? url).trim();
    if (!target) return;

    setIsLoading(true);
    onLoading(true);
    onError(null);

    try {
      const data = await fetchChannelData(target);
      onResults(data);
    } catch (err: any) {
      onError(
        err.message ||
          "Failed to fetch channel data. Check your API key and try again."
      );
    } finally {
      setIsLoading(false);
      onLoading(false);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: 600, margin: "0 auto" }}>
      {/* Search bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "rgba(13,27,46,0.85)",
          border: `1px solid ${
            focused ? "rgba(6,182,212,0.5)" : "rgba(255,255,255,0.1)"
          }`,
          borderRadius: 14,
          padding: "10px 10px 10px 16px",
          boxShadow: focused
            ? "0 0 0 3px rgba(6,182,212,0.1), 0 8px 32px rgba(0,0,0,0.4)"
            : "0 8px 32px rgba(0,0,0,0.3)",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
      >
        <Search size={18} style={{ color: "#475569", flexShrink: 0 }} />
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Paste YouTube channel URL..."
          disabled={isLoading}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#e2e8f0",
            fontSize: 14,
            fontWeight: 300,
            letterSpacing: "0.01em",
            opacity: isLoading ? 0.6 : 1,
          }}
        />
        <button
          onClick={() => handleAnalyze()}
          disabled={isLoading || !url.trim()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 20px",
            borderRadius: 10,
            border: "none",
            background:
              isLoading || !url.trim()
                ? "rgba(6,182,212,0.3)"
                : "linear-gradient(135deg, #06b6d4, #3b82f6)",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            cursor: isLoading || !url.trim() ? "not-allowed" : "pointer",
            boxShadow: "0 4px 16px rgba(6,182,212,0.25)",
            transition: "opacity 0.15s, transform 0.1s",
            flexShrink: 0,
          }}
          onMouseDown={(e) => {
            if (!isLoading && url.trim())
              (e.currentTarget as HTMLElement).style.transform = "scale(0.97)";
          }}
          onMouseUp={(e) =>
            ((e.currentTarget as HTMLElement).style.transform = "scale(1)")
          }
        >
          {isLoading ? (
            <>
              <Loader2
                size={15}
                style={{ animation: "spin 1s linear infinite" }}
              />
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
      <div
        style={{
          marginTop: 14,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 8,
          fontSize: 12,
          color: "#475569",
        }}
      >
        <span>Try:</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s.url}
            onClick={() => {
              setUrl(s.url);
              handleAnalyze(s.url);
            }}
            disabled={isLoading}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "#64748b",
              fontSize: 12,
              cursor: isLoading ? "not-allowed" : "pointer",
              textDecoration: "underline",
              textDecorationColor: "rgba(100,116,139,0.4)",
              textUnderlineOffset: 3,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "#22d3ee")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "#64748b")
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
