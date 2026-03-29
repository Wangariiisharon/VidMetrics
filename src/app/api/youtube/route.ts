// app/api/youtube/route.ts

import { fetchChannelData } from "@/components/results/utils";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "Missing `url` query parameter." },
      { status: 400 }
    );
  }

  try {
    const data = await fetchChannelData(url);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch channel data." },
      { status: 500 }
    );
  }
}
