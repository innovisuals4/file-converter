import zlib from "node:zlib";
import { ConversionError } from "@/lib/server/util";

/**
 * Font engine: lossless TTF/OTF ⇄ WOFF ⇄ WOFF2.
 *
 * WOFF v1 is a per-table zlib container around an sfnt, so the transform is
 * implemented directly (tables + checksums are preserved byte-for-byte).
 * WOFF2 uses the brotli-based `wawoff2` wasm module.
 */

interface SfntTable {
  tag: string;
  checksum: number;
  data: Buffer;
}

function calcChecksum(b: Buffer): number {
  const padded = b.length % 4 ? Buffer.concat([b, Buffer.alloc(4 - (b.length % 4))]) : b;
  let sum = 0;
  for (let i = 0; i < padded.length; i += 4) {
    sum = (sum + padded.readUInt32BE(i)) >>> 0;
  }
  return sum;
}

/* ------------------------------------------------------------------ */
/* WOFF ⇄ sfnt                                                         */
/* ------------------------------------------------------------------ */

function woffToSfnt(buf: Buffer): Buffer {
  if (buf.length < 44 || buf.toString("latin1", 0, 4) !== "wOFF") {
    throw new ConversionError(422, "Not a valid WOFF file.");
  }
  const flavor = buf.readUInt32BE(4);
  const numTables = buf.readUInt16BE(12);

  const tables: SfntTable[] = [];
  for (let i = 0; i < numTables; i++) {
    const at = 44 + i * 20;
    if (at + 20 > buf.length) throw new ConversionError(422, "Corrupted WOFF directory.");
    const tag = buf.toString("latin1", at, at + 4);
    const offset = buf.readUInt32BE(at + 4);
    const compLength = buf.readUInt32BE(at + 8);
    const origLength = buf.readUInt32BE(at + 12);
    const checksum = buf.readUInt32BE(at + 16);
    let data: Buffer;
    if (compLength < origLength) {
      try {
        data = zlib.inflateRawSync(buf.subarray(offset, offset + compLength));
      } catch {
        throw new ConversionError(422, "Corrupted WOFF table data.");
      }
    } else {
      data = Buffer.from(buf.subarray(offset, offset + origLength));
    }
    if (data.length !== origLength) throw new ConversionError(422, "Corrupted WOFF table length.");
    tables.push({ tag, checksum, data });
  }
  return buildSfnt(flavor, tables);
}

function buildSfnt(flavor: number, tables: SfntTable[]): Buffer {
  tables.sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));
  const n = tables.length;
  const entrySelector = Math.floor(Math.log2(n));
  const searchRange = 2 ** entrySelector * 16;
  const rangeShift = n * 16 - searchRange;

  const dirSize = 12 + n * 16;
  const totalSfntSize = dirSize + tables.reduce((acc, t) => acc + (t.data.length + 3) & ~3, 0);

  const out = Buffer.alloc(totalSfntSize);
  out.writeUInt32BE(flavor, 0);
  out.writeUInt16BE(n, 4);
  out.writeUInt16BE(searchRange, 6);
  out.writeUInt16BE(entrySelector, 8);
  out.writeUInt16BE(rangeShift, 10);

  let cursor = dirSize;
  tables.forEach((t, i) => {
    const rec = 12 + i * 16;
    out.write(t.tag, rec, 4, "latin1");
    out.writeUInt32BE(t.checksum, rec + 4);
    out.writeUInt32BE(cursor, rec + 8);
    out.writeUInt32BE(t.data.length, rec + 12);
    t.data.copy(out, cursor);
    cursor += (t.data.length + 3) & ~3;
  });

  // Recompute head.checkSumAdjustment for the whole font.
  const headRec = 12 + tables.findIndex((t) => t.tag === "head") * 16;
  if (headRec >= 12) {
    const headOffset = out.readUInt32BE(headRec + 8);
    out.writeUInt32BE(0, headOffset + 8);
    const sum = calcChecksum(out);
    out.writeUInt32BE((0xb1b0afba - sum) >>> 0, headOffset + 8);
  }
  return out;
}

function sfntToWoff(sfnt: Buffer): Buffer {
  if (sfnt.length < 12) throw new ConversionError(422, "Font file is too small to be valid.");
  const flavor = sfnt.readUInt32BE(0);
  const numTables = sfnt.readUInt16BE(4);

  const tables: SfntTable[] = [];
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    if (rec + 16 > sfnt.length) throw new ConversionError(422, "Corrupted font table directory.");
    const tag = sfnt.toString("latin1", rec, rec + 4);
    const offset = sfnt.readUInt32BE(rec + 8);
    const length = sfnt.readUInt32BE(rec + 12);
    if (offset + length > sfnt.length) throw new ConversionError(422, "Corrupted font table data.");
    tables.push({ tag, checksum: sfnt.readUInt32BE(rec + 4), data: Buffer.from(sfnt.subarray(offset, offset + length)) });
  }

  const n = tables.length;
  const dirSize = 44 + n * 20;
  const totalSfntSize = (12 + n * 16) + tables.reduce((acc, t) => acc + ((t.data.length + 3) & ~3), 0);

  const compressed = tables.map((t) => {
    const def = zlib.deflateRawSync(t.data, { level: 9 });
    return { table: t, comp: def.length < t.data.length ? def : null };
  });

  const headerSize = dirSize + compressed.reduce((acc, c) => acc + ((c.comp?.length ?? c.table.data.length) + 3) & ~3, 0);
  const out = Buffer.alloc(headerSize);
  out.write("wOFF", 0, 4, "latin1");
  out.writeUInt32BE(flavor, 4);
  out.writeUInt32BE(out.length, 8); // patched after we know it (fixed alloc, so it is already right)
  out.writeUInt16BE(n, 12);
  out.writeUInt16BE(0, 14);
  out.writeUInt32BE(totalSfntSize, 16);
  out.writeUInt16BE(1, 20); // major
  out.writeUInt16BE(0, 22); // minor
  // meta/priv offsets & lengths stay zero

  let cursor = dirSize;
  compressed.forEach((c, i) => {
    const rec = 44 + i * 20;
    const data = c.comp ?? c.table.data;
    out.write(c.table.tag, rec, 4, "latin1");
    out.writeUInt32BE(cursor, rec + 4);
    out.writeUInt32BE(data.length, rec + 8);
    out.writeUInt32BE(c.table.data.length, rec + 12);
    out.writeUInt32BE(c.table.checksum, rec + 16);
    data.copy(out, cursor);
    cursor += (data.length + 3) & ~3;
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* WOFF2                                                               */
/* ------------------------------------------------------------------ */

async function woff2Module() {
  const mod = await import("wawoff2");
  return mod;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export async function convertFont(
  input: Buffer,
  from: string,
  to: string,
): Promise<{ buffer: Buffer; ext: string; mime: string }> {
  let sfnt: Buffer;
  if (from === "ttf" || from === "otf") {
    sfnt = input;
  } else if (from === "woff") {
    sfnt = woffToSfnt(input);
  } else if (from === "woff2") {
    try {
      const w2 = await woff2Module();
      sfnt = Buffer.from(await w2.decompress(input));
    } catch {
      throw new ConversionError(422, "Could not decode this WOFF2 font.");
    }
  } else {
    throw new ConversionError(422, `Unsupported font input: ${from}`);
  }

  if (sfnt.length < 12) throw new ConversionError(422, "Font data is truncated or invalid.");
  const flavor = sfnt.toString("latin1", 0, 4);

  if (to === "ttf") {
    const ext = flavor === "OTTO" ? "otf" : "ttf";
    return { buffer: sfnt, ext, mime: ext === "otf" ? "font/otf" : "font/ttf" };
  }
  if (to === "woff") {
    return { buffer: sfntToWoff(sfnt), ext: "woff", mime: "font/woff" };
  }
  if (to === "woff2") {
    try {
      const w2 = await woff2Module();
      const out = Buffer.from(await w2.compress(sfnt));
      return { buffer: out, ext: "woff2", mime: "font/woff2" };
    } catch {
      throw new ConversionError(422, "Could not compress this font to WOFF2 (unsupported table layout).");
    }
  }
  throw new ConversionError(422, `Unsupported font output: ${to}`);
}
