import { NextResponse } from "next/server";
import { detectFfmpeg } from "@/lib/server/adapters/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reports server capabilities so the client can pick the right engine.
 * - ffmpeg: system FFmpeg available for server-side audio/video conversion
 * - wasmMediaFallback: the browser engine is always available for A/V
 */
export async function GET() {
  const ffmpeg = await detectFfmpeg();
  return NextResponse.json(
    {
      ffmpeg,
      wasmMediaFallback: true,
      maxUploadMb: 100,
      rateLimit: { requests: 30, windowMinutes: 5 },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
