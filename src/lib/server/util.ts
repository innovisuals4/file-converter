import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import JSZip from "jszip";
import { FORMATS, FORMATS_BY_ID, type OptionDef } from "@/lib/registry";

/* ------------------------------------------------------------------ */
/* Errors                                                              */
/* ------------------------------------------------------------------ */

export class ConversionError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = "ConversionError";
  }
}

/* ------------------------------------------------------------------ */
/* Filename helpers                                                    */
/* ------------------------------------------------------------------ */

export function extOf(filename: string): string {
  const base = filename.split(/[\\/]/).pop() ?? filename;
  const parts = base.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

/** Format whose extension list contains the given ext. */
export function formatByExt(ext: string) {
  if (!ext) return undefined;
  return FORMATS.find((f) => f.ext.includes(ext));
}

export function sanitizeFilename(name: string, fallback = "file"): string {
  const base = (name.split(/[\\/]/).pop() ?? "")
    .replace(/[\u0000-\u001f\u007f"<>|:*?]/g, "")
    .trim();
  return (base || fallback).slice(0, 180);
}

export function baseName(filename: string): string {
  const base = sanitizeFilename(filename);
  const parts = base.split(".");
  return parts.length > 1 ? parts.slice(0, -1).join(".") : base;
}

export function contentDispositionValue(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "'");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

/* ------------------------------------------------------------------ */
/* Magic-byte format detection (server-side validation)                */
/* ------------------------------------------------------------------ */

const TEXTISH = new Set(["txt", "md", "csv", "tsv", "json", "yaml"]);

/** Formats we can verify with binary magic — everything else is text-heuristic. */
function claimedHasBinaryMagic(id: string | undefined): boolean {
  if (!id) return false;
  return !TEXTISH.has(id) && id !== "html" && id !== "xml" && id !== "vtt" && id !== "srt";
}

function startsWith(buf: Buffer, s: string, offset = 0): boolean {
  if (buf.length < offset + s.length) return false;
  return buf.toString("latin1", offset, offset + s.length) === s;
}

function looksLikeTar(buf: Buffer): boolean {
  if (buf.length < 512) return false;
  if (startsWith(buf, "ustar", 257)) return true;
  // Pre-POSIX tar: verify the header checksum.
  let stored = 0;
  try {
    stored = parseInt(buf.toString("latin1", 148, 156).replace(/[\0 ]/g, ""), 8);
  } catch {
    return false;
  }
  if (!Number.isFinite(stored)) return false;
  let sum = 0;
  for (let i = 0; i < 512; i++) sum += i >= 148 && i < 156 ? 32 : buf[i];
  return sum === stored;
}

async function detectZipFamily(buf: Buffer): Promise<string | null> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buf);
  } catch {
    return "zip";
  }
  const names = Object.keys(zip.files);
  if (names.includes("word/document.xml")) return "docx";
  if (names.includes("xl/workbook.xml")) return "xlsx";
  if (names.includes("ppt/presentation.xml")) return "pptx";
  if (names.includes("mimetype")) {
    try {
      const m = await zip.file("mimetype")!.async("string");
      if (m.includes("epub+zip")) return "epub";
      if (m.includes("opendocument.text")) return "odt";
      if (m.includes("opendocument.spreadsheet")) return "ods";
      if (m.includes("opendocument.presentation")) return "odp";
    } catch {
      /* fall through to zip */
    }
    return "zip";
  }
  if (names.includes("content.xml")) return "odt";
  return "zip";
}

async function detectMagic(buf: Buffer): Promise<string | null> {
  if (!buf || buf.length < 12) return null;

  if (startsWith(buf, "%PDF")) return "pdf";
  if (buf[0] === 0x89 && startsWith(buf, "PNG", 1)) return "png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (startsWith(buf, "GIF8")) return "gif";
  if (startsWith(buf, "BM") && buf.length > 26) {
    const bpp = buf.readUInt16LE(28);
    if (bpp === 24 || bpp === 32) return "bmp";
  }
  if ((startsWith(buf, "II") && buf[2] === 0x2a) || (startsWith(buf, "MM") && buf[2] === 0x00)) return "tif";

  if (startsWith(buf, "RIFF")) {
    const kind = buf.toString("latin1", 8, 12);
    if (kind === "WEBP") return "webp";
    if (kind === "WAVE") return "wav";
    if (kind === "AVI ") return "avi";
  }

  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    const head = buf.toString("latin1", 0, Math.min(64, buf.length));
    return head.includes("webm") ? "webm" : "mkv";
  }

  if (buf.toString("latin1", 4, 8) === "ftyp") {
    const brand = buf.toString("latin1", 8, 12);
    if (brand === "avif" || brand === "avis") return "avif";
    if (brand.startsWith("hei") || brand === "mif1" || brand === "msf1") return "heic";
    if (brand === "M4A " || brand === "M4B ") return "m4a";
    if (brand.startsWith("qt")) return "mov";
    return "mp4";
  }

  if (startsWith(buf, "OggS")) return "ogg";
  if (startsWith(buf, "fLaC")) return "flac";

  if (startsWith(buf, "ID3")) return "mp3";
  if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) {
    if (buf[1] === 0xf1 || buf[1] === 0xf9) return "aac";
    return "mp3";
  }

  if (buf[0] === 0x1f && buf[1] === 0x8b) return "gz";
  if (looksLikeTar(buf)) return "tar";

  if (buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00 && buf[4] > 0 && buf[4] < 64) return "ico";
  if ((buf[0] === 0x00 && buf[1] === 0x01 && buf[2] === 0x00 && buf[3] === 0x00) || startsWith(buf, "true")) return "ttf";
  if (startsWith(buf, "OTTO")) return "otf";
  if (startsWith(buf, "wOFF")) return "woff";
  if (startsWith(buf, "wOF2")) return "woff2";
  if (buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0) return "doc";
  if (startsWith(buf, "{\\rtf")) return "rtf";

  if (buf[0] === 0x50 && buf[1] === 0x4b) return await detectZipFamily(buf);

  return null;
}

function detectTextSignature(buf: Buffer): string | null {
  try {
    const head = buf.subarray(0, 4096).toString("utf8").trimStart();
    if (!head) return null;
    if (/^<svg[\s>]/i.test(head) || (/^<\?xml/i.test(head) && /<svg[\s>]/i.test(head))) return "svg";
    if (/^<\?xml/i.test(head)) return "xml";
    if (/^<(!doctype\s+html|html[\s>])/i.test(head)) return "html";
    if (head.startsWith("WEBVTT")) return "vtt";
    return null;
  } catch {
    return null;
  }
}

export interface ResolvedInput {
  from: string;
  /** True when detection disagreed with the claimed extension but was accepted. */
  retargeted?: boolean;
}

/**
 * Resolve the true input format from the file's bytes, cross-checked against
 * the claimed extension. Throws a 415 ConversionError on obvious mismatches.
 */
export async function resolveInputFormat(buf: Buffer, filename: string): Promise<ResolvedInput> {
  const claimed = formatByExt(extOf(filename));
  const magic = await detectMagic(buf);

  if (magic) {
    if (claimed && claimed.id !== magic && claimedHasBinaryMagic(claimed.id)) {
      throw new ConversionError(
        415,
        `This file doesn't look like a ${claimed.name} — its contents appear to be ${FORMATS_BY_ID[magic]?.name ?? magic}. Upload the correct file or pick the matching format.`,
      );
    }
    return { from: magic, retargeted: claimed ? claimed.id !== magic : false };
  }

  const text = detectTextSignature(buf);
  if (text) {
    // Accept a text signature when there is no conflicting binary claim.
    if (!claimed || !claimedHasBinaryMagic(claimed.id)) return { from: text, retargeted: claimed?.id !== text };
  }

  if (claimed) return { from: claimed.id };
  throw new ConversionError(415, "Unknown or unsupported file type. Check the list of supported formats.");
}

/* ------------------------------------------------------------------ */
/* Option validation                                                   */
/* ------------------------------------------------------------------ */

export function parseOptions(
  defs: OptionDef[],
  raw: unknown,
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  for (const def of defs) {
    const provided = input[def.id];
    if (def.type === "select") {
      const allowed = def.choices?.map((c) => c.value) ?? [];
      out[def.id] = allowed.includes(String(provided)) ? String(provided) : String(def.def);
    } else if (def.type === "pages") {
      // Pages type: accept string like "1,3,5-10"
      out[def.id] = provided === "" || provided === undefined || provided === null ? "" : String(provided);
    } else {
      if (provided === "" || provided === undefined || provided === null) continue;
      const n = typeof provided === "number" ? provided : Number(String(provided).trim());
      if (!Number.isFinite(n)) continue;
      const clamped = Math.min(Math.max(n, def.min ?? 0), def.max ?? Number.MAX_SAFE_INTEGER);
      if (def.step && def.step >= 1) out[def.id] = Math.round(clamped);
      else out[def.id] = clamped;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Rate limiting (per-IP sliding window, in-process)                   */
/* ------------------------------------------------------------------ */

const buckets = new Map<string, number[]>();
let lastSweep = Date.now();

export function rateLimit(ip: string, limit = 30, windowMs = 5 * 60_000): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  if (now - lastSweep > 60_000) {
    lastSweep = now;
    for (const [key, hits] of buckets) {
      const alive = hits.filter((t) => now - t < windowMs);
      if (alive.length === 0) buckets.delete(key);
      else buckets.set(key, alive);
    }
  }
  const hits = (buckets.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    const retryAfter = Math.ceil((windowMs - (now - hits[0])) / 1000);
    return { ok: false, retryAfter: Math.max(retryAfter, 1) };
  }
  hits.push(now);
  buckets.set(ip, hits);
  return { ok: true, retryAfter: 0 };
}

export function requestIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "local";
}

/* ------------------------------------------------------------------ */
/* Concurrency gate for heavy jobs (ffmpeg etc.)                       */
/* ------------------------------------------------------------------ */

export class Semaphore {
  private active = 0;
  private waiters: Array<() => void> = [];
  constructor(private readonly max: number) {}
  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active >= this.max) {
      await new Promise<void>((resolve) => this.waiters.push(resolve));
    }
    this.active++;
    try {
      return await fn();
    } finally {
      this.active--;
      const next = this.waiters.shift();
      if (next) next();
    }
  }
}

/* ------------------------------------------------------------------ */
/* Temporary files — always cleaned up                                 */
/* ------------------------------------------------------------------ */

export async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "transmute-"));
  try {
    return await fn(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
