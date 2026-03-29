import type {
  VideoItem,
  ChannelAverages,
  ScoredVideo,
  WinScore,
  TimeRange,
  Insight,
  ChannelData,
} from "./types";

/*  Formatting  */

/** Compact number: 1_500_000 → "1.5M" */
export function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** Format total seconds → "m:ss" or "h:mm:ss" */
export function fmtDuration(secs: number): string {
  if (secs <= 0) return "—";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** readable relative time */
export function relativeTime(ts: number): string {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 86400) return "Today";
  const days = Math.floor(diff / 86400);
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

/*  Parsing  */

/** "4:13" or "1:02:30" → total seconds */
export function parseDurationSecs(dur: string): number {
  if (!dur) return 0;
  const parts = dur.split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

/*  Per-video metrics  */

/** Engagement rate: (likes + comments) / views * 100 */
export function engRate(v: VideoItem): number {
  if (!v.viewsRaw) return 0;
  return ((v.likesRaw + v.commentsRaw) / v.viewsRaw) * 100;
}

/** Days since publish, minimum 1 */
export function daysSincePublish(publishedTs: number): number {
  return Math.max(1, Math.floor((Date.now() - publishedTs) / 86400000));
}

/*  Channel averages  */

export function computeAverages(videos: VideoItem[]): ChannelAverages {
  if (!videos.length) {
    return {
      avgViews: 0,
      avgViewsPerDay: 0,
      avgVideoLengthSecs: 0,
      avgEngRate: 0,
    };
  }
  const n = videos.length;
  return {
    avgViews: videos.reduce((s, v) => s + v.viewsRaw, 0) / n,
    avgViewsPerDay: videos.reduce((s, v) => s + v.viewsPerDay, 0) / n,
    avgVideoLengthSecs: videos.reduce((s, v) => s + v.durationSecs, 0) / n,
    avgEngRate: videos.reduce((s, v) => s + engRate(v), 0) / n,
  };
}

/*  Win scoring  */

/**
 * Score a single video on a 0–100 scale using three signals:
 *
 *  Velocity   (50%) — views/day relative to the channel's peak views/day.
 *                      A video at the peak gets 100; at zero gets 0.
 *
 *  Relative   (30%) — views/day vs channel mean, capped at 3× avg = 100.
 *                      Rewards consistent outperformance, not just viral spikes.
 *
 *  Recency    (20%) — exponential decay: score = 100 × e^(−age/30).
 *                      A video published today scores 100; 30 days ago ~37; 90 days ago ~5.
 *
 * All three are deterministic — same inputs always give the same score.
 */
function scoreVideo(
  v: VideoItem,
  avgs: ChannelAverages,
  peakVpd: number
): WinScore {
  // Guard: treat missing/NaN fields as 0 so the score is always a valid number
  const vpd = Number(v.viewsPerDay) || 0;
  const avgVpd = Number(avgs.avgViewsPerDay) || 0;
  const peak = Number(peakVpd) || 1;
  const pubTs = Number(v.publishedTs) || Date.now();

  // Velocity (50%): views/day relative to the channel's peak views/day
  const velocity = Math.min(100, (vpd / peak) * 100);

  // Relative (30%): views/day vs channel avg, capped at 3× avg = 100
  const relativeRaw = avgVpd > 0 ? vpd / avgVpd / 3 : 0;
  const relative = Math.min(100, relativeRaw * 100);

  // Recency (20%): exponential decay — today → 100, 30 days ago → 37, 90 days → 5
  const ageDays = Math.max(1, Math.floor((Date.now() - pubTs) / 86400000));
  const recency = Math.round(100 * Math.exp(-ageDays / 30));

  const total = Math.round(velocity * 0.5 + relative * 0.3 + recency * 0.2);

  return {
    total: isNaN(total) ? 0 : total,
    velocity: isNaN(velocity) ? 0 : Math.round(velocity),
    relative: isNaN(relative) ? 0 : Math.round(relative),
    recency: isNaN(recency) ? 0 : recency,
  };
}

/**
 * Return the top-3 winning videos, ranked by composite win score.
 * Only videos that score above `minScore` (default 30) are included
 * so that a channel with uniformly low engagement still shows something.
 * Falls back to the top-3 by viewsPerDay if no video clears the bar.
 */
export function getWinningVideos(
  videos: VideoItem[],
  avgs: ChannelAverages,
  top = 3,
  minScore = 30
): ScoredVideo[] {
  if (!videos.length) return [];

  // Guard: ensure every video has viewsPerDay (may be missing on older cached data)
  const safe = videos.map((v) => ({
    ...v,
    viewsPerDay: Number(v.viewsPerDay) || 0,
    durationSecs: Number(v.durationSecs) || 0,
    viewsRaw: Number(v.viewsRaw) || 0,
    likesRaw: Number(v.likesRaw) || 0,
    commentsRaw: Number(v.commentsRaw) || 0,
    publishedTs: Number(v.publishedTs) || Date.now(),
  }));

  const peakVpd = Math.max(...safe.map((v) => v.viewsPerDay), 1);

  const scored: ScoredVideo[] = safe.map((v) => ({
    ...v,
    winScore: scoreVideo(v, avgs, peakVpd),
  }));

  // Sort by composite score descending
  scored.sort((a, b) => b.winScore.total - a.winScore.total);

  const winners = scored
    .filter((v) => v.winScore.total >= minScore)
    .slice(0, top);

  // Fallback: if threshold filters everything out, take top-3 by score
  return winners.length ? winners : scored.slice(0, top);
}

/*  Deterministic chart data  */

/**
 * Deterministic seeded pseudo-random float in [0, 1).
 * Uses a simple LCG so the same seed always produces the same sequence.
 */
function seededRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/**
 * Build 30-day daily view + engagement data from the video list.
 *
 * DETERMINISTIC: the seed is derived from the sum of all viewsRaw values,
 * so the same channel data always produces the same chart — no flicker on
 * re-render or re-search of the same URL.
 *
 * Views are distributed based on each video's actual publish date so
 * spikes appear near real upload dates.
 */
export function buildDailyData(videos: VideoItem[], range: number = 30) {
  // Derive a stable seed from the data itself + range so 7/30/90 produce distinct shapes
  const seed =
    videos.reduce((s, v) => s + v.viewsRaw + (v.publishedTs % 100000), 0) +
    range;
  const rand = seededRand(seed);

  const days: { label: string; views: number; eng: number }[] = [];
  const now = Date.now();

  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    // Weight by proximity to publish dates
    const base = videos.reduce((sum, v) => {
      const ageDays = Math.abs(v.publishedTs - d.getTime()) / 86400000;
      return sum + (ageDays < 5 ? v.viewsRaw / 5 : v.viewsRaw / 30);
    }, 0);

    // Deterministic noise ±30%
    const noise = 0.7 + rand() * 0.6;
    // Deterministic engagement: seeded float mapped to 2.5–8%
    const eng = 2.5 + rand() * 5.5;

    days.push({ label, views: Math.round(base * noise), eng });
  }
  return days;
}

/*  Misc */

/** Trend badge config derived from engagement rate */
export function trendBadge(er: number) {
  if (er > 5)
    return {
      label: `+${Math.round(er * 10)}%`,
      color: "#22d3ee",
      bg: "rgba(34,211,238,0.1)",
    };
  if (er > 3)
    return {
      label: `+${Math.round(er * 5)}%`,
      color: "#34d399",
      bg: "rgba(52,211,153,0.1)",
    };
  return {
    label: `${Math.round(er * 2)}%`,
    color: "#64748b",
    bg: "rgba(100,116,139,0.08)",
  };
}

/*  Time filtering  */

/** Unix timestamp of the start of the selected window */
export function cutoffTs(range: TimeRange): number {
  return Date.now() - range * 24 * 60 * 60 * 1000;
}

/**
 * Filter a video list to only those published within the time window.
 * Videos with a missing/zero publishedTs are always included as a fallback.
 */
export function filterByRange(
  videos: VideoItem[],
  range: TimeRange
): VideoItem[] {
  const cutoff = cutoffTs(range);
  return videos.filter((v) => !v.publishedTs || v.publishedTs >= cutoff);
}

export const CHART_COLORS = [
  "#22d3ee",
  "#3b82f6",
  "#a78bfa",
  "#34d399",
  "#f472b6",
];
export function computeInsights(
  videos: VideoItem[],
  avgs: ChannelAverages,
  timeRange: number
): Insight[] {
  if (!videos.length) return [];

  const insights: Insight[] = [];

  // Sort by viewsPerDay descending once — reused by multiple rules
  const byVpd = [...videos].sort((a, b) => b.viewsPerDay - a.viewsPerDay);
  const byViews = [...videos].sort((a, b) => b.viewsRaw - a.viewsRaw);
  const top5 = byViews.slice(0, 5);
  const top1 = byVpd[0];

  /* ── Helper: truncate long title ── */
  const clip = (t: string, n = 55) =>
    t.length > n ? t.slice(0, n).trimEnd() + "…" : t;

  /* ── Rule 1: Star video outperformance ── */
  if (top1 && avgs.avgViewsPerDay > 0) {
    const mult = top1.viewsPerDay / avgs.avgViewsPerDay;
    if (mult >= 2) {
      insights.push({
        id: "star-video",
        severity: "positive",
        headline: `"${clip(
          top1.title
        )}" is outperforming the channel average by ${mult.toFixed(1)}×`,
        detail: `It's pulling ${fmt(
          top1.viewsPerDay
        )} views/day vs the channel avg of ${fmt(
          Math.round(avgs.avgViewsPerDay)
        )}.`,
        videoTitle: top1.title,
      });
    }
  }

  /* ── Rule 2: Short-video dominance ── */
  const SHORT_SECS = 5 * 60; // < 5 min
  const shortVideos = top5.filter(
    (v) => v.durationSecs > 0 && v.durationSecs < SHORT_SECS
  );
  if (shortVideos.length >= 3) {
    insights.push({
      id: "short-dominance",
      severity: "positive",
      headline: `Short videos (< 5 min) are dominating performance`,
      detail: `${shortVideos.length} of the top 5 videos by views are under 5 minutes — the audience rewards concise content.`,
    });
  }

  /* ── Rule 3: Long-video dominance ── */
  const LONG_SECS = 15 * 60; // > 15 min
  const longVideos = top5.filter((v) => v.durationSecs > LONG_SECS);
  if (longVideos.length >= 3 && shortVideos.length < 3) {
    const avgLongMins = Math.round(
      longVideos.reduce((s, v) => s + v.durationSecs, 0) /
        longVideos.length /
        60
    );
    insights.push({
      id: "long-dominance",
      severity: "tip",
      headline: `In-depth content (avg ${avgLongMins} min) is driving the most views`,
      detail: `${longVideos.length} of the top 5 videos are over 15 minutes — this audience engages with comprehensive coverage.`,
    });
  }

  /* ── Rule 4: Engagement spike ── */
  if (avgs.avgEngRate > 0) {
    // Compare top-5 engagement to overall avg
    const top5EngAvg =
      top5.reduce((s, v) => s + engRate(v), 0) / (top5.length || 1);
    const engMult = top5EngAvg / avgs.avgEngRate;
    if (engMult >= 1.4) {
      insights.push({
        id: "eng-spike",
        severity: "positive",
        headline: `Engagement is ${((engMult - 1) * 100).toFixed(
          0
        )}% higher than usual in the top videos`,
        detail: `Top-5 avg engagement is ${top5EngAvg.toFixed(
          2
        )}% vs the channel baseline of ${avgs.avgEngRate.toFixed(2)}%.`,
      });
    }
  }

  /* ── Rule 5: Engagement drop ── */
  if (avgs.avgEngRate > 0) {
    const recentEng =
      videos
        .slice()
        .sort((a, b) => b.publishedTs - a.publishedTs)
        .slice(0, 3)
        .reduce((s, v) => s + engRate(v), 0) / Math.min(3, videos.length);
    const drop = (avgs.avgEngRate - recentEng) / avgs.avgEngRate;
    if (drop >= 0.25) {
      insights.push({
        id: "eng-drop",
        severity: "warning",
        headline: `Recent engagement is down ${(drop * 100).toFixed(
          0
        )}% compared to the period average`,
        detail: `The last 3 uploads averaged ${recentEng.toFixed(
          2
        )}% engagement vs ${avgs.avgEngRate.toFixed(
          2
        )}% overall — audience interest may be waning.`,
      });
    }
  }

  /* ── Rule 6: Posting frequency ── */
  if (videos.length >= 2) {
    const sorted = [...videos].sort((a, b) => b.publishedTs - a.publishedTs);
    const spanMs =
      sorted[0].publishedTs - sorted[sorted.length - 1].publishedTs;
    const spanDays = spanMs / 86400000 || 1;
    const perWeek = (videos.length / spanDays) * 7;
    if (perWeek < 0.5 && timeRange >= 30) {
      insights.push({
        id: "low-frequency",
        severity: "warning",
        headline: `Upload frequency is low — roughly ${
          perWeek < 0.25 ? "once a month" : "once every 2 weeks"
        }`,
        detail: `${videos.length} videos over ${Math.round(
          spanDays
        )} days. Consistent posting typically improves algorithmic reach.`,
      });
    } else if (perWeek >= 5) {
      insights.push({
        id: "high-frequency",
        severity: "neutral",
        headline: `High upload cadence — averaging ${perWeek.toFixed(
          1
        )} videos/week`,
        detail: `Prolific output can sustain reach but watch engagement per video to avoid audience fatigue.`,
      });
    }
  }

  /* ── Rule 7: Views/day declining trend ── */
  if (byVpd.length >= 4) {
    // Compare avg vpd of most-recent half vs oldest half
    const half = Math.floor(videos.length / 2);
    const byAge = [...videos].sort((a, b) => b.publishedTs - a.publishedTs);
    const recentHalfVpd =
      byAge.slice(0, half).reduce((s, v) => s + v.viewsPerDay, 0) / half;
    const olderHalfVpd =
      byAge.slice(half).reduce((s, v) => s + v.viewsPerDay, 0) /
      (byAge.length - half);
    const trend = (recentHalfVpd - olderHalfVpd) / (olderHalfVpd || 1);
    if (trend >= 0.3) {
      insights.push({
        id: "vpd-rising",
        severity: "positive",
        headline: `Views/day trend is rising — recent uploads are ${(
          trend * 100
        ).toFixed(0)}% faster`,
        detail: `Newer videos average ${fmt(
          Math.round(recentHalfVpd)
        )} views/day vs ${fmt(
          Math.round(olderHalfVpd)
        )} for older ones in the window.`,
      });
    } else if (trend <= -0.3) {
      insights.push({
        id: "vpd-falling",
        severity: "warning",
        headline: `Views/day is slowing — recent uploads are ${(
          Math.abs(trend) * 100
        ).toFixed(0)}% below earlier content`,
        detail: `Newer videos average ${fmt(
          Math.round(recentHalfVpd)
        )} views/day vs ${fmt(
          Math.round(olderHalfVpd)
        )} for older uploads. Consider revisiting topics that previously performed well.`,
      });
    }
  }

  /* ── Rule 8: Single category dominance ── */
  const catCounts: Record<string, number> = {};
  for (const v of top5)
    catCounts[v.category] = (catCounts[v.category] || 0) + 1;
  const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
  if (topCat && topCat[1] >= 4) {
    insights.push({
      id: "cat-dominance",
      severity: "tip",
      headline: `"${topCat[0]}" content accounts for ${topCat[1]} of the top 5 videos`,
      detail: `Doubling down on this content type could further accelerate channel growth.`,
    });
  }

  /* ── Rule 9: Low views on recent video ── */
  const newest = [...videos].sort((a, b) => b.publishedTs - a.publishedTs)[0];
  if (newest && avgs.avgViews > 0) {
    const ratio = newest.viewsRaw / avgs.avgViews;
    const ageDays = daysSincePublish(newest.publishedTs);
    if (ratio < 0.3 && ageDays >= 3) {
      insights.push({
        id: "newest-underperform",
        severity: "warning",
        headline: `The most recent video is underperforming — only ${(
          ratio * 100
        ).toFixed(0)}% of the channel avg`,
        detail: `"${clip(newest.title)}" has ${fmt(
          newest.viewsRaw
        )} views after ${ageDays} days. It may benefit from promotion or thumbnail/title testing.`,
        videoTitle: newest.title,
      });
    }
  }

  // Return at most 6 insights, already priority-ordered by rule position
  return insights.slice(0, 6);
}

/** Fetch a YouTube API URL and surface readable errors */

const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

async function ytFetch(url: string) {
  const res = await fetch(url, { next: { revalidate: 300 } }); // cache 5 min
  const data = await res.json();

  if (data.error) {
    if (data.error.code === 403) {
      throw new Error(
        "YouTube API quota exceeded. Try again tomorrow or check your API key permissions."
      );
    }
    if (data.error.code === 400) {
      throw new Error(
        "Invalid channel URL. Try the format: youtube.com/@channelname"
      );
    }
    throw new Error(
      `YouTube API error ${data.error.code}: ${data.error.message}`
    );
  }

  return data;
}

/** Format ISO 8601 duration PT4M13S → "4:13" */
export function formatDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "";
  const h = parseInt(m[1] || "0");
  const min = parseInt(m[2] || "0");
  const s = parseInt(m[3] || "0");
  if (h > 0)
    return `${h}:${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${min}:${String(s).padStart(2, "0")}`;
}

/** Parse ISO 8601 duration PT4M13S → total seconds */
export function parseDurationTSecs(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (
    parseInt(m[1] || "0") * 3600 +
    parseInt(m[2] || "0") * 60 +
    parseInt(m[3] || "0")
  );
}

/** Resolve any YouTube channel URL to a channel ID */
export async function resolveChannelId(raw: string): Promise<string> {
  const url = raw.startsWith("http") ? raw : `https://${raw}`;

  const directMatch = url.match(/\/channel\/(UC[\w-]{22})/);
  if (directMatch) return directMatch[1];

  const handleMatch = url.match(/@([\w.-]+)/);
  if (handleMatch) {
    const d = await ytFetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${handleMatch[1]}&key=${API_KEY}`
    );
    if (d.items?.length) return d.items[0].id;

    const s = await ytFetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(
        handleMatch[1]
      )}&maxResults=1&key=${API_KEY}`
    );
    if (s.items?.length) return s.items[0].snippet.channelId;
    throw new Error(`Channel "@${handleMatch[1]}" not found.`);
  }

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

export async function fetchChannelData(rawUrl: string): Promise<ChannelData> {
  if (!API_KEY)
    throw new Error("Missing YOUTUBE_API_KEY — add it to .env.local");

  const channelId = await resolveChannelId(rawUrl);

  const channelData = await ytFetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${API_KEY}`
  );
  if (!channelData.items?.length) throw new Error("Channel data not found.");

  const channel = channelData.items[0];
  const stats = channel.statistics;
  const snippet = channel.snippet;

  const ninetyDaysAgo = new Date(
    Date.now() - 90 * 24 * 60 * 60 * 1000
  ).toISOString();

  const videosData = await ytFetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=50&publishedAfter=${ninetyDaysAgo}&key=${API_KEY}`
  );

  const videoIds: string = (videosData.items || [])
    .map((v: any) => v.id?.videoId)
    .filter(Boolean)
    .join(",");

  let videos: VideoItem[] = [];

  if (videoIds) {
    const [videoDetails, categoryData] = await Promise.all([
      ytFetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${videoIds}&key=${API_KEY}`
      ),
      ytFetch(
        `https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&regionCode=US&key=${API_KEY}`
      ),
    ]);

    const categoryMap: Record<string, string> = {};
    for (const c of categoryData.items || []) {
      categoryMap[c.id] = c.snippet.title;
    }

    videos = (videoDetails.items || []).map((v: any) => {
      const viewsRaw = Number(v.statistics?.viewCount || 0);
      const publishedTs = new Date(v.snippet.publishedAt).getTime();
      const days = Math.max(
        1,
        Math.floor((Date.now() - publishedTs) / 86400000)
      );

      return {
        id: v.id,
        title: v.snippet.title,
        thumbnail:
          v.snippet.thumbnails?.maxres?.url ||
          v.snippet.thumbnails?.medium?.url ||
          v.snippet.thumbnails?.default?.url,
        views: viewsRaw.toLocaleString(),
        likes: Number(v.statistics?.likeCount || 0).toLocaleString(),
        comments: Number(v.statistics?.commentCount || 0).toLocaleString(),
        viewsRaw,
        likesRaw: Number(v.statistics?.likeCount || 0),
        commentsRaw: Number(v.statistics?.commentCount || 0),
        publishedTs,
        publishedAt: new Date(v.snippet.publishedAt).toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
            year: "numeric",
          }
        ),
        duration: formatDuration(v.contentDetails?.duration || ""),
        durationSecs: parseDurationSecs(v.contentDetails?.duration || ""),
        viewsPerDay: Math.round(viewsRaw / days),
        category: categoryMap[v.snippet.categoryId] || "Uncategorized",
      };
    });
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
