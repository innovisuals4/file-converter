/**
 * Shared FFmpeg argument builder — used by the server adapter (system FFmpeg)
 * and the browser adapter (ffmpeg.wasm) so both engines behave identically.
 * Pure data, safe to import on the client.
 */

export type MediaQuality = "high" | "balanced" | "compact";

const VIDEO_CRF: Record<MediaQuality, string> = { high: "21", balanced: "26", compact: "31" };
const WEBM_VBR: Record<MediaQuality, string> = { high: "2M", balanced: "1M", compact: "560k" };
const AVI_QSCALE: Record<MediaQuality, string> = { high: "3", balanced: "5", compact: "8" };
const OGG_QSCALE: Record<MediaQuality, string> = { high: "6", balanced: "4", compact: "2" };

function codecArgs(to: string, opts: { quality?: string; audioBitrate?: string }): string[] {
  const q = (["high", "balanced", "compact"].includes(opts.quality ?? "") ? opts.quality : "balanced") as MediaQuality;
  const ab = `${[320, 192, 128, 96].includes(Number(opts.audioBitrate)) ? Number(opts.audioBitrate) : 192}k`;

  switch (to) {
    case "mp4":
      return ["-c:v", "libx264", "-preset", "veryfast", "-crf", VIDEO_CRF[q], "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", ab, "-movflags", "+faststart"];
    case "mov":
      return ["-c:v", "libx264", "-preset", "veryfast", "-crf", VIDEO_CRF[q], "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", ab];
    case "mkv":
      return ["-c:v", "libx264", "-preset", "veryfast", "-crf", VIDEO_CRF[q], "-c:a", "aac", "-b:a", ab];
    case "webm":
      return ["-c:v", "libvpx", "-b:v", WEBM_VBR[q], "-deadline", "realtime", "-cpu-used", "5", "-c:a", "libvorbis", "-qscale:a", OGG_QSCALE[q]];
    case "avi":
      return ["-c:v", "mpeg4", "-qscale:v", AVI_QSCALE[q], "-c:a", "libmp3lame", "-b:a", ab];
    // Audio-only targets
    case "mp3":
      return ["-c:a", "libmp3lame", "-b:a", ab];
    case "wav":
      return ["-c:a", "pcm_s16le"];
    case "aac":
      return ["-c:a", "aac", "-b:a", ab];
    case "m4a":
      return ["-c:a", "aac", "-b:a", ab];
    case "ogg":
      return ["-c:a", "libvorbis", "-qscale:a", OGG_QSCALE[q]];
    case "opus":
      return ["-c:a", "libopus", "-b:a", ab];
    case "flac":
      return ["-c:a", "flac"];
    default:
      return [];
  }
}

export interface FFmpegPlan {
  args: string[];
  outputExt: string;
}

/** MIME types for media outputs — shared by server & browser engines. */
export const MEDIA_MIME: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  mkv: "video/x-matroska",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  aac: "audio/aac",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  opus: "audio/opus",
  flac: "audio/flac",
};

/**
 * Build the full argument list for `ffmpeg <args>`.
 * Caller supplies -i input and output names; this returns everything between.
 */
export function buildFFmpegArgs(
  from: string,
  to: string,
  options: { quality?: string; audioBitrate?: string } = {},
): FFmpegPlan {
  const args: string[] = ["-hide_banner", "-loglevel", "error", "-y"];
  const codec = codecArgs(to, options);
  const audioOnly = ["mp3", "wav", "aac", "ogg", "m4a", "opus", "flac"].includes(to);
  if (audioOnly) args.push("-vn");
  args.push(...codec);
  return { args, outputExt: to };
}
