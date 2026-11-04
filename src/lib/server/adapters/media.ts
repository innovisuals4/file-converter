import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { buildFFmpegArgs, MEDIA_MIME } from "@/lib/media-args";
import { ConversionError, Semaphore, withTempDir } from "@/lib/server/util";

/**
 * Server-side media engine (system FFmpeg).
 *
 * FFmpeg is a large optional dependency, so it is detected at runtime:
 * set FFMPEG_PATH to a specific binary, or have `ffmpeg` on PATH.
 * When it is unavailable, the client automatically falls back to
 * ffmpeg.wasm and processes audio/video locally in the browser.
 */

const TIMEOUT_MS = 4 * 60_000;
const gate = new Semaphore(1); // one heavy media job at a time

function ffmpegBin(): string {
  return process.env.FFMPEG_PATH || "ffmpeg";
}

let cachedAvailable: boolean | null = null;

export async function detectFfmpeg(): Promise<boolean> {
  if (cachedAvailable !== null) return cachedAvailable;
  try {
    const res = spawnSync(ffmpegBin(), ["-version"], { timeout: 8000, windowsHide: true });
    cachedAvailable = res.status === 0;
  } catch {
    cachedAvailable = false;
  }
  return cachedAvailable;
}

function ffmpegMime(ext: string): string {
  return MEDIA_MIME[ext] ?? "application/octet-stream";
}

export async function convertMedia(
  input: Buffer,
  from: string,
  to: string,
  options: Record<string, string | number>,
): Promise<{ buffer: Buffer; ext: string; mime: string }> {
  const available = await detectFfmpeg();
  if (!available) {
    throw new ConversionError(
      503,
      "Server-side media conversion needs FFmpeg, which is not installed on this deployment. Audio & video conversions automatically run in your browser instead — try again in the app.",
    );
  }

  return gate.run(async () =>
    withTempDir(async (dir) => {
      const inPath = path.join(dir, `input.${from}`);
      const outPath = path.join(dir, `output.${to}`);
      await fs.writeFile(inPath, input);

      const { args } = buildFFmpegArgs(from, to, options);
      const argv = [...args, "-i", inPath, outPath];

      await new Promise<void>((resolve, reject) => {
        const proc = spawn(ffmpegBin(), argv, { windowsHide: true });
        let stderr = "";
        const timer = setTimeout(() => {
          proc.kill("SIGKILL");
          reject(new ConversionError(504, "Conversion timed out — try a smaller file or lower quality."));
        }, TIMEOUT_MS);

        proc.stderr.on("data", (d: Buffer) => {
          stderr = (stderr + d.toString()).slice(-4000);
        });
        proc.on("error", (err) => {
          clearTimeout(timer);
          reject(new ConversionError(500, `FFmpeg failed to start: ${err.message}`));
        });
        proc.on("close", (code) => {
          clearTimeout(timer);
          if (code === 0) resolve();
          else {
            const tail = stderr.trim().split("\n").slice(-2).join(" ").slice(0, 300);
            reject(
              new ConversionError(
                422,
                tail
                  ? `FFmpeg could not process this file: ${tail}`
                  : `FFmpeg could not process this file (exit code ${code}). The codec may be unsupported or the file corrupted.`,
              ),
            );
          }
        });
      });

      let out: Buffer;
      try {
        out = await fs.readFile(outPath);
      } catch {
        throw new ConversionError(422, "FFmpeg produced no output for this file.");
      }
      if (out.length === 0) throw new ConversionError(422, "FFmpeg produced an empty output — try a different format.");
      return { buffer: out, ext: to, mime: ffmpegMime(to) };
    }),
  );
}
