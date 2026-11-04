"use client";

import { buildFFmpegArgs, MEDIA_MIME } from "@/lib/media-args";
import { formatById, primaryExt } from "@/lib/registry";

/* ------------------------------------------------------------------ */
/* Server capabilities                                                 */
/* ------------------------------------------------------------------ */

export interface Engines {
  ffmpeg: boolean;
  wasmMediaFallback: boolean;
  maxUploadMb: number;
}

let enginesCache: Engines | null = null;

export async function fetchEngines(): Promise<Engines> {
  if (enginesCache) return enginesCache;
  try {
    const res = await fetch("/api/engines", { cache: "no-store" });
    if (res.ok) {
      enginesCache = (await res.json()) as Engines;
      return enginesCache;
    }
  } catch {
    /* offline — fall through */
  }
  enginesCache = { ffmpeg: false, wasmMediaFallback: true, maxUploadMb: 100 };
  return enginesCache;
}

/* ------------------------------------------------------------------ */
/* Server conversion (XHR for real upload progress + abort)            */
/* ------------------------------------------------------------------ */

export interface ServerResultMeta {
  from: string;
  to: string;
  name: string;
  size: number;
  ms: number;
  engine: string;
}

export interface ConvertProgress {
  /** 0..1, or null during the server-processing phase (indeterminate). */
  value: number | null;
  phase: "uploading" | "processing" | "finalizing";
}

export class ConvertError extends Error {
  status: number;
  validTargets?: string[];
  constructor(status: number, message: string, validTargets?: string[]) {
    super(message);
    this.status = status;
    this.validTargets = validTargets;
  }
}

export function convertOnServer(opts: {
  file: File;
  target: string;
  options: Record<string, string | number>;
  onProgress?: (p: ConvertProgress) => void;
  signalRef?: { current: (() => void) | null };
}): Promise<{ blob: Blob; meta: ServerResultMeta }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/convert");
    xhr.responseType = "blob";

    if (opts.signalRef) {
      opts.signalRef.current = () => xhr.abort();
    }

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        opts.onProgress?.({ value: Math.min(e.loaded / e.total, 1) * 0.65, phase: "uploading" });
      }
    };
    xhr.upload.onload = () => {
      opts.onProgress?.({ value: 0.7, phase: "processing" });
    };

    xhr.onerror = () => reject(new ConvertError(0, "Network error — check your connection and try again."));
    xhr.onabort = () => reject(new ConvertError(499, "Conversion cancelled."));

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        opts.onProgress?.({ value: 1, phase: "finalizing" });
        const blob = xhr.response as Blob;
        let meta: ServerResultMeta | undefined;
        try {
          const raw = xhr.getResponseHeader("X-Transmute-Result");
          if (raw) meta = JSON.parse(atob(raw.replace(/-/g, "+").replace(/_/g, "/")));
        } catch {
          /* header optional */
        }
        const ext = primaryExt(opts.target);
        const name = meta?.name ?? `${opts.file.name.replace(/\.[^.]+$/, "")}.${ext}`;
        resolve({ blob, meta: meta ?? { from: "", to: opts.target, name, size: blob.size, ms: 0, engine: "server" } });
        return;
      }
      // Error responses are JSON
      try {
        const text = await (xhr.response as Blob).text();
        const data = JSON.parse(text) as { error?: string; validTargets?: string[] };
        reject(new ConvertError(xhr.status, data.error ?? "Conversion failed.", data.validTargets));
      } catch {
        reject(new ConvertError(xhr.status, `Conversion failed (HTTP ${xhr.status}).`));
      }
    };

    const form = new FormData();
    form.append("file", opts.file);
    form.append("target", opts.target);
    form.append("options", JSON.stringify(opts.options));
    xhr.send(form);
  });
}

/* ------------------------------------------------------------------ */
/* Browser media engine (ffmpeg.wasm, loaded on demand)                */
/* ------------------------------------------------------------------ */

const FFMPEG_VERSION = "0.12.10";
const CORE_VERSION = "0.12.6";
const FFMPEG_CDN = `https://unpkg.com/@ffmpeg/ffmpeg@${FFMPEG_VERSION}/dist/umd`;
const CORE_CDN = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic WASM lib has no types
let ffmpegInstance: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ffmpegLoading: Promise<any> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(el);
  });
}

async function toBlobURL(url: string, type: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  const buf = await res.arrayBuffer();
  return URL.createObjectURL(new Blob([buf], { type }));
}

async function loadFFmpeg(): Promise<NonNullable<typeof ffmpegInstance> | null> {
  if (ffmpegInstance) return ffmpegInstance;
  if (!ffmpegLoading) {
    ffmpegLoading = (async () => {
      await loadScript(`${FFMPEG_CDN}/ffmpeg.js`);
      const FFmpegWASM = (window as unknown as {
        FFmpegWASM?: { FFmpeg: new () => NonNullable<typeof ffmpegInstance> };
      }).FFmpegWASM;
      if (!FFmpegWASM) throw new Error("ffmpeg.wasm could not be initialised.");
      const ffmpeg = new FFmpegWASM.FFmpeg();

      const [coreURL, wasmURL, workerURL] = await Promise.all([
        toBlobURL(`${CORE_CDN}/ffmpeg-core.js`, "text/javascript"),
        toBlobURL(`${CORE_CDN}/ffmpeg-core.wasm`, "application/wasm"),
        toBlobURL(`${FFMPEG_CDN}/814.ffmpeg.js`, "text/javascript"),
      ]);
      await ffmpeg.load({ coreURL, wasmURL, classWorkerURL: workerURL });
      ffmpegInstance = ffmpeg;
      return ffmpeg;
    })().catch((err) => {
      ffmpegLoading = null;
      throw err;
    });
  }
  return ffmpegLoading;
}

export interface WasmProgressHandlers {
  onProgress?: (p: ConvertProgress) => void;
  signalRef?: { current: (() => void) | null };
}

export async function convertInBrowser(opts: {
  file: File;
  from: string;
  target: string;
  options: Record<string, string | number>;
  handlers?: WasmProgressHandlers;
}): Promise<{ blob: Blob; name: string }> {
  const { handlers } = opts;
  handlers?.onProgress?.({ value: 0.02, phase: "processing" });

  let ffmpeg: NonNullable<typeof ffmpegInstance>;
  try {
    ffmpeg = await loadFFmpeg();
    if (!ffmpeg) {
      throw new ConvertError(
        503,
        "The in-browser media engine could not be initialised.",
      );
    }
  } catch {
    throw new ConvertError(
      503,
      "The in-browser media engine could not be loaded (it downloads ~32 MB once from a CDN). Check your connection or ask your administrator to deploy FFmpeg on the server.",
    );
  }

  const inputName = `input.${opts.from}`;
  const outputExt = primaryExt(opts.target);
  const outputName = `output.${outputExt}`;
  let cancelled = false;

  const progressHandler = (e: unknown) => {
    const p = e as { progress?: number };
    if (typeof p.progress === "number" && Number.isFinite(p.progress)) {
      const clamped = Math.max(0, Math.min(p.progress, 1));
      handlers?.onProgress?.({ value: 0.05 + clamped * 0.9, phase: "processing" });
    }
  };
  ffmpeg.on("progress", progressHandler);

  if (handlers?.signalRef) {
    handlers.signalRef.current = () => {
      cancelled = true;
      ffmpeg.terminate();
      ffmpegInstance = null;
      ffmpegLoading = null;
    };
  }

  try {
    const data = new Uint8Array(await opts.file.arrayBuffer());
    await ffmpeg.writeFile(inputName, data);
    const { args } = buildFFmpegArgs(opts.from, opts.target, opts.options);
    const code = await ffmpeg.exec([...args, "-i", inputName, outputName], 60_000 * 15);
    if (cancelled) throw new ConvertError(499, "Conversion cancelled.");
    if (code !== 0) {
      throw new ConvertError(
        422,
        `The browser media engine could not convert this file (code ${code}). The codec may be unsupported or the file corrupted.`,
      );
    }
    const out = await ffmpeg.readFile(outputName);
    handlers?.onProgress?.({ value: 1, phase: "finalizing" });
    const mime = MEDIA_MIME[opts.target] ?? "application/octet-stream";
    const name = `${opts.file.name.replace(/\.[^.]+$/, "")}.${outputExt}`;
    return { blob: new Blob([out.slice().buffer as ArrayBuffer], { type: mime }), name };
  } finally {
    try {
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch {
      /* best effort */
    }
  }
}

/* ------------------------------------------------------------------ */
/* Unified conversion entry point                                      */
/* ------------------------------------------------------------------ */

export async function convertFile(opts: {
  file: File;
  from: string;
  target: string;
  options: Record<string, string | number>;
  onProgress?: (p: ConvertProgress) => void;
  signalRef?: { current: (() => void) | null };
}): Promise<{ blob: Blob; name: string; meta: ServerResultMeta | null; engine: "server" | "browser" }> {
  const route = formatById(opts.target);
  if (!route) throw new ConvertError(400, "Unknown output format.");

  const isMedia = route.category === "video" || route.category === "audio";

  if (isMedia) {
    const engines = await fetchEngines();
    if (!engines.ffmpeg && engines.wasmMediaFallback) {
      const result = await convertInBrowser({
        file: opts.file,
        from: opts.from,
        target: opts.target,
        options: opts.options,
        handlers: { onProgress: opts.onProgress, signalRef: opts.signalRef },
      });
      return { ...result, meta: null, engine: "browser" };
    }
  }

  const { blob, meta } = await convertOnServer({
    file: opts.file,
    target: opts.target,
    options: opts.options,
    onProgress: opts.onProgress,
    signalRef: opts.signalRef,
  });
  return { blob, name: meta?.name ?? "", meta, engine: "server" };
}
