import { getRoute, primaryExt, type Engine } from "@/lib/registry";
import { ConversionError, baseName } from "@/lib/server/util";
import { convertImage } from "@/lib/server/adapters/images";
import { convertDoc } from "@/lib/server/adapters/docs";
import { convertSheet } from "@/lib/server/adapters/sheets";
import { convertArchive, packageToZip } from "@/lib/server/adapters/archives";
import { convertFont } from "@/lib/server/adapters/fonts";
import { convertSubtitle, convertData } from "@/lib/server/adapters/extras";
import { convertMedia } from "@/lib/server/adapters/media";
import {
  loadPdfPages,
  rotatePages,
  deletePages,
  reorderPages,
  extractPages,
  addPageNumbers,
  addTextWatermark,
  addBatesNumbering,
  linearizePdf,
  type PageNumberOptions,
  type BatesOptions,
} from "@/lib/server/adapters/pdf-pages";
import { PDFDocument } from "pdf-lib";

/** Parse "1,3,5-10" into [0,2,4,5,6,7,8,9] (0-based). */
function parsePageSelection(str: string, pageCount: number): number[] {
  const indices: number[] = [];
  const parts = str.split(",").map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map((s) => Number(s.trim()));
      if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
      const s = Math.max(1, Math.min(start, pageCount));
      const e = Math.max(1, Math.min(end, pageCount));
      for (let i = s; i <= e; i++) indices.push(i - 1);
    } else {
      const n = Number(part);
      if (Number.isFinite(n)) {
        const clamped = Math.max(1, Math.min(n, pageCount));
        indices.push(clamped - 1);
      }
    }
  }
  // Deduplicate while preserving order
  return [...new Set(indices)];
}

export interface ConversionOutput {
  buffer: Buffer;
  filename: string;
  mime: string;
  engine: Engine;
  ms: number;
}

export interface ConversionJob {
  input: Buffer;
  filename: string;
  from: string;
  to: string;
  options: Record<string, string | number>;
}

/**
 * Central dispatcher: resolves the registry route, validates the engine,
 * and runs the correct adapter. All adapters throw ConversionError with
 * user-safe messages; anything else becomes a 500.
 */
export async function runConversion(job: ConversionJob): Promise<ConversionOutput> {
  const { input, filename, from, to, options } = job;
  const route = getRoute(from, to);
  if (!route) {
    throw new ConversionError(422, `${from.toUpperCase()} → ${to.toUpperCase()} is not a supported conversion.`);
  }

  const started = Date.now();
  try {
    let result: { buffer: Buffer; ext: string; mime: string };
    switch (route.engine) {
      case "image":
        result = await convertImage(input, from, to, options);
        break;
      case "doc":
        result = await convertDoc(input, from, to, filename, options);
        break;
      case "sheet":
        result = await convertSheet(input, from, to);
        break;
      case "archive":
        result = await convertArchive(input, from, to, filename);
        break;
      case "package":
        result = await packageToZip(input, filename);
        break;
      case "font":
        result = await convertFont(input, from, to);
        break;
      case "subtitle":
        result = convertSubtitle(input, to);
        break;
      case "data":
        result = await convertData(input, from, to);
        break;
      case "ffmpeg":
        result = await convertMedia(input, from, to, options);
        break;
      case "pdf-pages": {
        const operation = String(options.operation ?? "rotate");
        const { pdfDoc } = await loadPdfPages(input);
        let outDoc: PDFDocument;

        switch (operation) {
          case "rotate": {
            const angle = Number(options.angle ?? 90) as 90 | 180 | 270;
            const pageStr = String(options.pages ?? "");
            const indices = pageStr
              ? parsePageSelection(pageStr, pdfDoc.getPageCount())
              : Array.from({ length: pdfDoc.getPageCount() }, (_, i) => i);
            outDoc = rotatePages(pdfDoc, indices, angle);
            break;
          }
          case "delete": {
            const pageStr = String(options.pages ?? "");
            if (!pageStr) throw new ConversionError(422, "No pages specified for deletion.");
            const indices = parsePageSelection(pageStr, pdfDoc.getPageCount());
            outDoc = await deletePages(pdfDoc, indices);
            break;
          }
          case "reorder": {
            const pageStr = String(options.pages ?? "");
            if (!pageStr) throw new ConversionError(422, "No page order specified.");
            const newOrder = parsePageSelection(pageStr, pdfDoc.getPageCount());
            if (newOrder.length !== pdfDoc.getPageCount()) {
              throw new ConversionError(422, `Reorder list must contain exactly ${pdfDoc.getPageCount()} page indices.`);
            }
            outDoc = await reorderPages(pdfDoc, newOrder);
            break;
          }
          case "extract": {
            const pageStr = String(options.pages ?? "");
            if (!pageStr) throw new ConversionError(422, "No pages specified for extraction.");
            const indices = parsePageSelection(pageStr, pdfDoc.getPageCount());
            outDoc = await extractPages(pdfDoc, indices);
            break;
          }
          case "pagenumbers": {
            outDoc = await addPageNumbers(pdfDoc, {
              format: String(options.format ?? "1") as PageNumberOptions["format"],
              position: String(options.position ?? "bottom-center") as PageNumberOptions["position"],
              startNumber: Number(options.startNumber ?? 1),
              skipFirst: Number(options.skipFirst ?? 0),
              fontSize: Number(options.fontSize ?? 10),
            });
            break;
          }
          case "watermark": {
            const watermarkType = String(options.watermarkType ?? "text");
            if (watermarkType === "tile") {
              outDoc = await addTextWatermark(pdfDoc, {
                text: String(options.text ?? "CONFIDENTIAL"),
                fontSize: Number(options.fontSize ?? 48),
                opacity: Number(options.opacity ?? 15) / 100,
                rotation: Number(options.rotation ?? -45),
                position: "tile",
              });
            } else {
              outDoc = await addTextWatermark(pdfDoc, {
                text: String(options.text ?? "CONFIDENTIAL"),
                fontSize: Number(options.fontSize ?? 48),
                opacity: Number(options.opacity ?? 15) / 100,
                rotation: Number(options.rotation ?? -45),
                position: "center",
              });
            }
            break;
          }
          case "bates": {
            outDoc = await addBatesNumbering(pdfDoc, {
              prefix: String(options.prefix ?? ""),
              suffix: String(options.suffix ?? ""),
              digits: Number(options.digits ?? 6),
              start: Number(options.start ?? 1),
              position: String(options.position ?? "bottom-center") as BatesOptions["position"],
              fontSize: Number(options.fontSize ?? 9),
              skipFirst: Number(options.skipFirst ?? 0),
            });
            break;
          }
          case "compress": {
            // Full compression in Step 5; linearize for now
            // const level = String(options.compressLevel ?? "medium");
            outDoc = linearizePdf(pdfDoc);
            break;
          }
          default:
            throw new ConversionError(422, `Unknown PDF operation: ${operation}`);
        }

        const bytes = await outDoc.save({ useObjectStreams: true });
        result = { buffer: Buffer.from(bytes), ext: "pdf", mime: "application/pdf" };
        break;
      }
      default:
        throw new ConversionError(500, "Unknown conversion engine.");
    }

    return {
      buffer: result.buffer,
      filename: `${baseName(filename) || "file"}.${result.ext || primaryExt(to)}`,
      mime: result.mime,
      engine: route.engine,
      ms: Date.now() - started,
    };
  } catch (err) {
    if (err instanceof ConversionError) throw err;
    console.error("[convert] unexpected failure:", from, "→", to, err);
    throw new ConversionError(500, "Conversion failed unexpectedly on the server. Please try again.");
  }
}
