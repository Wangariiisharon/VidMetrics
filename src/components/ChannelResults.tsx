"use client";

import { useState, useMemo } from "react";
import {
  ChannelHeader,
  LineChart,
  CategoryChart,
  VideoTable,
  WinningVideos,
  TimeFilter,
  buildDailyData,
  computeAverages,
  getWinningVideos,
  filterByRange,
  InsightsPanel,
  computeInsights,
} from "./results";
import type { ChannelData, TimeRange } from "./results";

interface ChannelResultsProps {
  data: ChannelData;
}

export default function ChannelResults({ data }: ChannelResultsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(30);

  //  Filtered video slice for the active window
  const filtered = useMemo(
    () => filterByRange(data.videos, timeRange),
    [data.videos, timeRange]
  );

  //  All derived data re-computes when the window changes
  const avgs = useMemo(() => computeAverages(filtered), [filtered]);
  const winners = useMemo(
    () => getWinningVideos(filtered, avgs),
    [filtered, avgs]
  );
  // Charts use the filtered slice; window label passed as title suffix
  const daily = useMemo(
    () => buildDailyData(filtered, timeRange),
    [filtered, timeRange]
  );
  const insights = useMemo(
    () => computeInsights(filtered, avgs, timeRange),
    [filtered, avgs, timeRange]
  );
  const windowLabel = `Last ${timeRange} Days`;

  const chartTitle = (base: string) => `${base} (${timeRange} Days)`;

  const emptyWindow = filtered.length === 0;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1152,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 24,
        animation: "fadeSlideIn 0.5s ease both",
      }}
    >
      {/*  Time filter bar  */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          padding: "14px 20px",
          borderRadius: 14,
          background: "rgba(13,27,46,0.6)",
          border: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(8px)",
        }}
      >
        <p
          style={{ margin: 0, fontSize: 13, color: "#475569", fontWeight: 500 }}
        >
          Showing data for
        </p>
        <TimeFilter
          value={timeRange}
          onChange={setTimeRange}
          count={filtered.length}
        />
      </div>

      {/*  Empty state  */}
      {emptyWindow ? (
        <div
          style={{
            textAlign: "center",
            padding: "64px 24px",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            color: "#475569",
            fontSize: 14,
            background: "rgba(13,27,46,0.4)",
          }}
        >
          No videos published in the last {timeRange} days.
          <br />
          <span
            style={{
              fontSize: 12,
              color: "#334155",
              marginTop: 6,
              display: "block",
            }}
          >
            Try selecting a wider time range above.
          </span>
        </div>
      ) : (
        <>
          {/* 2 — Channel overview (always full-channel stats) */}
          <ChannelHeader data={data} />

          {/* 3 — Trend charts */}
          <div className="flex flex-cols gap-y-8 md:flex md:gap-x-5 md:flex-row">
            <LineChart
              data={daily}
              color="#22d3ee"
              yKey="views"
              title={chartTitle("Views Trend")}
            />
            <LineChart
              data={daily}
              color="#34d399"
              yKey="eng"
              title={chartTitle("Engagement Rate")}
              suffix="%"
            />
          </div>

          {/* 4 — Category breakdown */}
          <CategoryChart videos={filtered} />

          {/* 2 — Insights */}
          {insights.length > 0 && (
            <InsightsPanel insights={insights} windowLabel={windowLabel} />
          )}

          {/* 1 — Winning videos */}
          {winners.length > 0 && <WinningVideos videos={winners} avgs={avgs} />}

          {/* 5 — Video table */}
          <VideoTable videos={filtered} avgs={avgs} timeRange={timeRange} />
        </>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
