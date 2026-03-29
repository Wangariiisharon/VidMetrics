export interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  views: string;
  likes: string;
  comments: string;
  publishedAt: string;
  duration: string;
  category: string;
  /** raw numbers for sorting / calculations */
  viewsRaw: number;
  likesRaw: number;
  commentsRaw: number;
  publishedTs: number;
  /** duration in total seconds (parsed from "4:13" or "1:02:30") */
  durationSecs: number;
  /** views per day since publish */
  viewsPerDay: number;
}

export interface ChannelData {
  name: string;
  handle: string;
  subscribers: string;
  totalViews: string;
  videoCount: string;
  avatar: string;
  banner: string;
  videos: VideoItem[];
}

/** Derived channel-wide averages computed once from the video list */
export interface ChannelAverages {
  avgViews: number;
  avgViewsPerDay: number;
  avgVideoLengthSecs: number;
  avgEngRate: number;
}

/**
 * Winning score breakdown for a single video.
 * Total is a 0–100 weighted composite:
 *   velocity (50%) + relative performance (30%) + recency (20%)
 */
export interface WinScore {
  total: number; // 0–100 composite
  velocity: number; // 0–100  views/day vs channel best
  relative: number; // 0–100  views/day vs channel avg
  recency: number; // 0–100  exponential decay on age
}

/** A video with its computed win score — returned by getWinningVideos */
export interface ScoredVideo extends VideoItem {
  winScore: WinScore;
}

export type SortKey =
  | "viewsRaw"
  | "likesRaw"
  | "commentsRaw"
  | "engRate"
  | "viewsPerDay"
  | "publishedTs";

export type SortDir = "asc" | "desc";

/*  Time filter  */

export type TimeRange = 7 | 30 | 90;

export interface TimeOption {
  label: string;
  value: TimeRange;
}

export const TIME_OPTIONS: TimeOption[] = [
  { label: "Last 7 days", value: 7 },
  { label: "Last 30 days", value: 30 },
];

/*  Insights  */

export type InsightSeverity = "positive" | "warning" | "neutral" | "tip";

export interface Insight {
  id: string;
  severity: InsightSeverity;
  /** Short headline shown in bold */
  headline: string;
  /** One-sentence elaboration */
  detail: string;
  /** Optional: the video title this insight is about */
  videoTitle?: string;
}
