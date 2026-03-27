"use client";

import {
  Eye,
  ThumbsUp,
  Video,
  Users,
  ExternalLink,
  TrendingUp,
} from "lucide-react";

interface VideoItem {
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
  videos: VideoItem[];
}

export default function ChannelResults({ data }: { data: ChannelData }) {
  const stats = [
    {
      icon: Users,
      label: "Subscribers",
      value: data.subscribers,
      color: "text-cyan-400",
    },
    {
      icon: Eye,
      label: "Total Views",
      value: data.totalViews,
      color: "text-blue-400",
    },
    {
      icon: Video,
      label: "Videos",
      value: data.videoCount,
      color: "text-violet-400",
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto mt-16 space-y-8 animate-fade-in">
      {/* Channel Header */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0d1b2e]/60 backdrop-blur-sm shadow-2xl">
        {/* Banner */}
        {data.banner && (
          <div className="h-28 w-full overflow-hidden">
            <img
              src={data.banner}
              alt="banner"
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 h-28 bg-gradient-to-b from-transparent to-[#0d1b2e]" />
          </div>
        )}

        <div className="px-8 py-6 flex flex-col sm:flex-row gap-5 items-center sm:items-end -mt-4">
          <img
            src={data.avatar}
            alt={data.name}
            className="w-20 h-20 rounded-full border-4 border-cyan-500/40 shadow-lg shadow-cyan-900/30 shrink-0"
          />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {data.name}
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">{data.handle}</p>
          </div>
          <a
            href={`https://youtube.com/${data.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 transition-all duration-150"
          >
            View on YouTube <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 divide-x divide-white/5 border-t border-white/5">
          {stats.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="px-6 py-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-xs text-slate-500 uppercase tracking-widest">
                  {label}
                </span>
              </div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Videos Grid */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white font-semibold text-lg">Latest Videos</h3>
          <span className="ml-auto text-slate-500 text-sm">
            {data.videos.length} videos loaded
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.videos.map((video, i) => (
            <a
              key={video.id}
              href={`https://youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col rounded-xl overflow-hidden border border-white/5 bg-[#0d1b2e]/50 hover:border-cyan-500/30 hover:bg-[#0d1b2e]/80 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-900/20"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-2">
                  <span className="text-white text-xs font-medium">
                    Watch →
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="flex flex-col gap-2 p-3 flex-1">
                <h4 className="text-slate-200 text-sm font-medium leading-snug line-clamp-2 group-hover:text-white transition-colors">
                  {video.title}
                </h4>

                <div className="mt-auto flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3 text-cyan-500" />
                    {video.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3 text-blue-400" />
                    {video.likes}
                  </span>
                  <span className="ml-auto">{video.publishedAt}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
