import sharp from "sharp";
import { ConversionError } from "@/lib/server/util";

export interface ImageOutput {
  buffer: Buffer;
  ext: string;
  mime: string;
}

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
  tif: "image/tiff",
  gif: "image/gif",
  ico: "image/x-icon",
  bmp: "image/bmp",
};

type SharpInstance = ReturnType<typeof sharp>;

/* ------------------------------------------------------------------ */
/* Custom BMP codec                                                    */
/* ------------------------------------------------------------------ */

export function decodeBmp(buf: Buffer): { data: Buffer; width: number; height: number } {
  if (buf.length < 54 || buf.toString("latin1", 0, 2) !== "BM") {
    throw new ConversionError(422, "Unsupported or corrupted BMP file.");
  }
  const dataOffset = buf.readUInt32LE(10);
  const dibSize = buf.readUInt32LE(14);
  if (dibSize < 40) throw new ConversionError(422, "Unsupported BMP header (pre-V3 bitmaps are not supported).");
  const width = buf.readInt32LE(18);
  const rawHeight = buf.readInt32LE(22);
  const topDown = rawHeight < 0;
  const height = Math.abs(rawHeight);
  const bpp = buf.readUInt16LE(28);
  const compression = buf.readUInt32LE(30);
  if (!Number.isFinite(width) || width <= 0 || height <= 0 || width * height > 80_000_000) {
    throw new ConversionError(422, "BMP dimensions look invalid.");
  }
  if (compression !== 0 && !(compression === 3 && bpp === 32)) {
    throw new ConversionError(422, "Compressed BMP variants (RLE/fields) are not supported.");
  }
  if (bpp !== 24 && bpp !== 32) {
    throw new ConversionError(422, `Unsupported BMP color depth (${bpp} bpp). Use 24- or 32-bit BMP.`);
  }

  const rowSize = Math.floor((bpp * width + 31) / 32) * 4;
  const out = Buffer.alloc(width * height * 4);
  let sawAlpha = false;
  for (let y = 0; y < height; y++) {
    const srcY = topDown ? y : height - 1 - y;
    let off = dataOffset + srcY * rowSize;
    for (let x = 0; x < width; x++) {
      const di = (y * width + x) * 4;
      if (off + (bpp === 32 ? 4 : 3) > buf.length) throw new ConversionError(422, "BMP pixel data is truncated.");
      const b = buf[off++], g = buf[off++], r = buf[off++];
      let a = 255;
      if (bpp === 32) {
        a = buf[off++];
        if (a !== 0) sawAlpha = true;
      }
      out[di] = r; out[di + 1] = g; out[di + 2] = b; out[di + 3] = a;
    }
  }
  // Many 32-bit BMPs contain a meaningless zero alpha channel.
  if (bpp === 32 && !sawAlpha) out.fill(255, 3, out.length);
  return { data: out, width, height };
}

export function encodeBmp24(rgba: Buffer, width: number, height: number): Buffer {
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelBytes = rowSize * height;
  const fileSize = 54 + pixelBytes;
  const out = Buffer.alloc(fileSize, 0);
  out.write("BM", 0, "latin1");
  out.writeUInt32LE(fileSize, 2);
  out.writeUInt32LE(54, 10);
  out.writeUInt32LE(40, 14); // BITMAPINFOHEADER
  out.writeInt32LE(width, 18);
  out.writeInt32LE(height, 22);
  out.writeUInt16LE(1, 26); // planes
  out.writeUInt16LE(24, 28); // bpp
  out.writeUInt32LE(0, 30); // BI_RGB
  out.writeUInt32LE(pixelBytes, 34);
  for (let y = 0; y < height; y++) {
    const srcY = height - 1 - y; // bottom-up
    let off = 54 + y * rowSize;
    for (let x = 0; x < width; x++) {
      const si = (srcY * width + x) * 4;
      out[off++] = rgba[si + 2];
      out[off++] = rgba[si + 1];
      out[off++] = rgba[si];
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Custom ICO codec                                                    */
/* ------------------------------------------------------------------ */

interface IcoEntry {
  width: number;
  height: number;
  size: number;
  offset: number;
}

function parseIcoDirectory(buf: Buffer): IcoEntry[] {
  if (buf.length < 6 || buf.readUInt16LE(0) !== 0 || buf.readUInt16LE(2) !== 1) {
    throw new ConversionError(422, "Not a valid ICO file.");
  }
  const count = buf.readUInt16LE(4);
  const entries: IcoEntry[] = [];
  for (let i = 0; i < count; i++) {
    const at = 6 + i * 16;
    if (at + 16 > buf.length) break;
    entries.push({
      width: buf[at] === 0 ? 256 : buf[at],
      height: buf[at + 1] === 0 ? 256 : buf[at + 1],
      size: buf.readUInt32LE(at + 8),
      offset: buf.readUInt32LE(at + 12),
    });
  }
  return entries;
}

/** Decode the largest/best frame of an ICO into a sharp instance. */
async function decodeIco(buf: Buffer): Promise<SharpInstance> {
  const entries = parseIcoDirectory(buf).sort((a, b) => b.width * b.height - a.width * a.height);
  if (!entries.length) throw new ConversionError(422, "ICO file contains no images.");
  const entry = entries[0];
  const data = buf.subarray(entry.offset, entry.offset + entry.size);
  if (data.length > 8 && data[0] === 0x89 && data[1] === 0x50) {
    return sharp(data); // Modern ICO frames store PNG.
  }
  // Legacy frames store a BMP with doubled height (XOR + AND mask).
  if (data.length < 40) throw new ConversionError(422, "ICO frame data is truncated.");
  const dibSize = data.readUInt32LE(0);
  const width = data.readUInt32LE(4);
  const doubleHeight = data.readUInt32LE(8);
  const bpp = data.readUInt16LE(14);
  const compression = data.readUInt32LE(16);
  const height = Math.floor(doubleHeight / 2);
  if (compression !== 0 || (bpp !== 32 && bpp !== 24) || !width || !height) {
    throw new ConversionError(422, "Unsupported ICO frame encoding (only PNG and uncompressed BMP frames are supported).");
  }
  const rowSize = Math.floor((bpp * width + 31) / 32) * 4;
  const maskRowSize = Math.floor((width + 31) / 32) * 4;
  const xorStart = dibSize;
  const out = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    const rowOff = xorStart + y * rowSize;
    const maskOff = xorStart + height * rowSize + y * maskRowSize;
    for (let x = 0; x < width; x++) {
      const di = (y * width + x) * 4;
      if (rowOff + (bpp === 32 ? 4 : 3) > data.length) break;
      const b = data[rowOff + x * (bpp / 8)], g = data[rowOff + x * (bpp / 8) + 1], r = data[rowOff + x * (bpp / 8) + 2];
      let a = 255;
      if (bpp === 32) a = data[rowOff + x * 4 + 3];
      else if (maskOff + Math.floor(x / 8) < data.length) {
        const bit = (data[maskOff + Math.floor(x / 8)] >> (7 - (x % 8))) & 1;
        a = bit ? 0 : 255;
      }
      out[di] = r; out[di + 1] = g; out[di + 2] = b; out[di + 3] = a;
    }
  }
  return sharp(out, { raw: { width, height, channels: 4 } });
}

function encodeIco(png: Buffer, width: number, height: number): Buffer {
  const head = Buffer.alloc(22);
  head.writeUInt16LE(0, 0); // reserved
  head.writeUInt16LE(1, 2); // type: icon
  head.writeUInt16LE(1, 4); // count
  head[6] = width >= 256 ? 0 : width;
  head[7] = height >= 256 ? 0 : height;
  head[8] = 0; // palette
  head[9] = 0; // reserved
  head.writeUInt16LE(1, 10); // planes
  head.writeUInt16LE(32, 12); // bpp
  head.writeUInt32LE(png.length, 14);
  head.writeUInt32LE(22, 18); // data offset
  return Buffer.concat([head, png]);
}

/* ------------------------------------------------------------------ */
/* Main conversion                                                     */
/* ------------------------------------------------------------------ */

export async function convertImage(
  input: Buffer,
  from: string,
  to: string,
  options: Record<string, string | number>,
): Promise<ImageOutput> {
  const maxWidth = typeof options.maxWidth === "number" ? Math.round(options.maxWidth) : undefined;

  let img: SharpInstance;

  try {
    switch (from) {
      case "bmp": {
        const { data, width, height } = decodeBmp(input);
        img = sharp(data, { raw: { width, height, channels: 4 } });
        break;
      }
      case "ico": {
        img = await decodeIco(input);
        break;
      }
      case "svg": {
        // Rasterize vectors crisply; scale density with the requested width.
        const density = maxWidth ? Math.min(Math.max(Math.round((72 * maxWidth) / 900), 96), 2400) : 300;
        img = sharp(input, { density });
        break;
      }
      case "gif":
      case "webp": {
        img = sharp(input, { animated: true });
        break;
      }
      default: {
        img = sharp(input, from === "heic" ? { failOn: "warning" } : undefined);
      }
    }
  } catch (err) {
    if (err instanceof ConversionError) throw err;
    throw new ConversionError(
      422,
      from === "heic"
        ? "Could not decode this HEIC file — the server's image library may not support this HEVC variant."
        : "Could not decode this image. The file may be corrupted or use an unsupported variant.",
    );
  }

  if (maxWidth) {
    img = img.resize({ width: maxWidth, withoutEnlargement: true });
  }

  try {
    let buffer: Buffer;
    const ext = to;
    switch (to) {
      case "png":
        buffer = await img.png({ compressionLevel: 9 }).toBuffer();
        break;
      case "jpg":
        buffer = await img.flatten({ background: "#ffffff" }).jpeg({ quality: num(options.quality, 85), mozjpeg: true }).toBuffer();
        break;
      case "webp":
        buffer = await img.webp({ quality: num(options.quality, 85), effort: 4 }).toBuffer();
        break;
      case "avif":
        buffer = await img.avif({ quality: num(options.quality, 85), effort: 4 }).toBuffer();
        break;
      case "tif":
        buffer = await img.tiff({ compression: "lzw" }).toBuffer();
        break;
      case "gif":
        buffer = await img.flatten({ background: "#ffffff" }).gif().toBuffer();
        break;
      case "ico": {
        const meta = await sharp(await img.png().toBuffer()).metadata();
        const png = await img
          .clone()
          .resize(256, 256, { fit: "inside", withoutEnlargement: true })
          .png()
          .toBuffer();
        buffer = encodeIco(png, Math.min(meta.width ?? 256, 256), Math.min(meta.height ?? 256, 256));
        break;
      }
      case "bmp": {
        const { data, info } = await img.flatten({ background: "#ffffff" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
        buffer = encodeBmp24(Buffer.from(data), info.width, info.height);
        break;
      }
      default:
        throw new ConversionError(422, `Unsupported image output: ${to}`);
    }
    return { buffer, ext, mime: MIME_BY_EXT[ext] ?? "application/octet-stream" };
  } catch (err) {
    if (err instanceof ConversionError) throw err;
    throw new ConversionError(422, "Image processing failed — the file may be corrupted, or the requested output is not possible for this image.");
  }
}

function num(v: string | number | undefined, dflt: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n >= 1 && n <= 100 ? n : dflt;
}
