import zlib from "node:zlib";
import JSZip from "jszip";
import { ConversionError, sanitizeFilename } from "@/lib/server/util";

/**
 * Archive engine: ZIP / TAR / GZIP repackaging.
 * Entries are repackaged in memory — nothing is ever extracted to disk,
 * which neutralizes path-traversal ("zip slip") attacks by construction.
 */

export interface ArchiveEntry {
  name: string;
  data: Buffer;
}

const MAX_ENTRIES = 20_000;
const MAX_TOTAL_UNCOMPRESSED = 1.5 * 1024 * 1024 * 1024; // 1.5 GB

/* ------------------------------------------------------------------ */
/* ZIP                                                                 */
/* ------------------------------------------------------------------ */

async function zipRead(buf: Buffer): Promise<ArchiveEntry[]> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buf);
  } catch {
    throw new ConversionError(422, "This file is not a valid ZIP archive.");
  }
  const entries: ArchiveEntry[] = [];
  let total = 0;
  for (const file of Object.values(zip.files)) {
    if (file.dir) continue;
    if (entries.length >= MAX_ENTRIES) throw new ConversionError(413, "Archive contains too many entries.");
    const data = await file.async("nodebuffer");
    total += data.length;
    if (total > MAX_TOTAL_UNCOMPRESSED) throw new ConversionError(413, "Archive decompresses to an unreasonably large size.");
    entries.push({ name: sanitizeFilename(file.name, "entry"), data });
  }
  if (!entries.length) throw new ConversionError(422, "Archive contains no files.");
  return entries;
}

export async function zipWrite(entries: ArchiveEntry[]): Promise<Buffer> {
  const zip = new JSZip();
  for (const e of entries) zip.file(e.name, e.data);
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
}

/* ------------------------------------------------------------------ */
/* TAR (ustar + GNU long names)                                        */
/* ------------------------------------------------------------------ */

function octal(value: number, len: number): string {
  return value.toString(8).padStart(len - 1, "0") + "\0";
}

function tarHeader(name: string, size: number, type: string, prefix = ""): Buffer {
  const h = Buffer.alloc(512, 0);
  h.write(name.slice(0, 100), 0, 100, "utf8");
  h.write(octal(0o644, 8), 100, 8, "latin1");
  h.write(octal(0, 8), 108, 8, "latin1");
  h.write(octal(0, 8), 116, 8, "latin1");
  h.write(octal(size, 12), 124, 12, "latin1");
  h.write(octal(Math.floor(Date.now() / 1000), 12), 136, 12, "latin1");
  h.write("        ", 148, 8, "latin1"); // checksum placeholder (spaces)
  h.write(type, 156, 1, "latin1");
  h.write("ustar\0", 257, 6, "latin1");
  h.write("00", 263, 2, "latin1");
  h.write(prefix.slice(0, 155), 345, 155, "utf8");
  let sum = 0;
  for (let i = 0; i < 512; i++) sum += h[i];
  h.write(sum.toString(8).padStart(6, "0") + "\0 ", 148, 8, "latin1");
  return h;
}

function pad512(n: number): Buffer {
  return Buffer.alloc((512 - (n % 512)) % 512, 0);
}

export function tarWrite(entries: ArchiveEntry[]): Buffer {
  const chunks: Buffer[] = [];
  for (const entry of entries) {
    let name = entry.name.replace(/\\/g, "/").replace(/^\/+/, "");
    let prefix = "";
    let longName: string | null = null;

    if (Buffer.byteLength(name, "utf8") > 100) {
      const slash = name.lastIndexOf("/", 155);
      const candidatePrefix = slash > 0 ? name.slice(0, slash) : "";
      const candidateName = slash > 0 ? name.slice(slash + 1) : name;
      if (candidatePrefix.length <= 155 && Buffer.byteLength(candidateName, "utf8") <= 100) {
        prefix = candidatePrefix;
        name = candidateName;
      } else {
        longName = name;
        name = longName.slice(0, 100);
      }
    }

    if (longName) {
      const content = Buffer.from(longName + "\0", "utf8");
      chunks.push(tarHeader("././@LongLink", content.length, "L"));
      chunks.push(content, pad512(content.length));
    }
    chunks.push(tarHeader(name, entry.data.length, "0", prefix));
    chunks.push(entry.data, pad512(entry.data.length));
  }
  chunks.push(Buffer.alloc(1024, 0)); // end-of-archive
  return Buffer.concat(chunks);
}

export function tarRead(buf: Buffer): ArchiveEntry[] {
  const entries: ArchiveEntry[] = [];
  let off = 0;
  let pendingLongName: string | null = null;
  let total = 0;

  while (off + 512 <= buf.length) {
    const header = buf.subarray(off, off + 512);
    if (header.every((b) => b === 0)) break;
    const shortName = header.toString("utf8", 0, 100).replace(/\0[\s\S]*$/, "");
    const prefix = header.toString("utf8", 345, 500).replace(/\0[\s\S]*$/, "");
    const size = parseInt(header.toString("latin1", 124, 136).replace(/[\0 ]/g, ""), 8) || 0;
    const type = header.toString("latin1", 156, 157);
    off += 512;
    const data = buf.subarray(off, off + size);
    off += size + ((512 - (size % 512)) % 512);

    if (type === "L") {
      pendingLongName = data.toString("utf8").replace(/\0[\s\S]*$/, "");
      continue;
    }
    if (type === "0" || type === "\0" || type === "") {
      const name = pendingLongName ?? (prefix ? `${prefix}/${shortName}` : shortName);
      pendingLongName = null;
      if (!name || name.endsWith("/")) continue;
      entries.push({ name: sanitizeFilename(name, "entry"), data: Buffer.from(data) });
      total += size;
      if (entries.length >= MAX_ENTRIES) throw new ConversionError(413, "Archive contains too many entries.");
      if (total > MAX_TOTAL_UNCOMPRESSED) throw new ConversionError(413, "Archive is unreasonably large.");
    } else {
      pendingLongName = null;
    }
  }
  if (!entries.length) throw new ConversionError(422, "This TAR archive contains no files.");
  return entries;
}

/* ------------------------------------------------------------------ */
/* GZIP                                                                */
/* ------------------------------------------------------------------ */

function gunzip(buf: Buffer): Buffer {
  try {
    return zlib.gunzipSync(buf);
  } catch {
    throw new ConversionError(422, "This file is not a valid gzip stream.");
  }
}

/** Decompress a .gz and produce archive entries (tar → entries, else single file). */
function gunzipToEntries(buf: Buffer, filename: string): ArchiveEntry[] {
  const raw = gunzip(buf);
  const stripped = filename.replace(/\.t?gz$/i, "").replace(/\.gz$/i, "") || "decompressed";
  const innerIsTar = looksLikeTar(raw);
  if (innerIsTar) return tarRead(raw);
  const innerExtMatch = /\.[a-z0-9]+$/i.exec(stripped);
  const name = innerExtMatch ? stripped : `${stripped}.bin`;
  return [{ name: sanitizeFilename(name, "decompressed.bin"), data: raw }];
}

function looksLikeTar(buf: Buffer): boolean {
  if (buf.length < 512) return false;
  if (buf.toString("latin1", 257, 262) === "ustar") return true;
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

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export async function convertArchive(
  input: Buffer,
  from: string,
  to: string,
  filename: string,
): Promise<{ buffer: Buffer; ext: string; mime: string }> {
  const MIME: Record<string, string> = {
    zip: "application/zip",
    tar: "application/x-tar",
    gz: "application/gzip",
  };

  let entries: ArchiveEntry[];
  if (from === "zip") entries = await zipRead(input);
  else if (from === "tar") entries = tarRead(input);
  else if (from === "gz") entries = gunzipToEntries(input, filename);
  else throw new ConversionError(422, `Unsupported archive input: ${from}`);

  switch (to) {
    case "zip":
      return { buffer: await zipWrite(entries), ext: "zip", mime: MIME.zip };
    case "tar":
      return { buffer: tarWrite(entries), ext: "tar", mime: MIME.tar };
    case "gz": {
      const raw = from === "tar" ? input : tarWrite(entries);
      return { buffer: zlib.gzipSync(raw, { level: 6 }), ext: "gz", mime: MIME.gz };
    }
    default:
      throw new ConversionError(422, `Unsupported archive output: ${to}`);
  }
}

/** Package any single file into a ZIP ("compress" route). */
export async function packageToZip(input: Buffer, filename: string): Promise<{ buffer: Buffer; ext: string; mime: string }> {
  const zip = new JSZip();
  zip.file(sanitizeFilename(filename, "file"), input);
  return {
    buffer: await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } }),
    ext: "zip",
    mime: "application/zip",
  };
}
