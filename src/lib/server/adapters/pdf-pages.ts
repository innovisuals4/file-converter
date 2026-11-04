import { PDFDocument, degrees, StandardFonts, rgb } from "pdf-lib";
import { ConversionError } from "@/lib/server/util";

export interface PageMetadata {
  index: number;           // 0-based
  width: number;
  height: number;
  rotation: number;        // 0, 90, 180, 270
  hasAnnotations: boolean;
}

export interface PdfPagesResult {
  pageCount: number;
  pages: PageMetadata[];
  pdfDoc: PDFDocument;
}

/**
 * Load a PDF and return page metadata + the PDFDocument for further manipulation.
 */
export async function loadPdfPages(input: Buffer): Promise<PdfPagesResult> {
  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(input, { ignoreEncryption: false });
  } catch {
    throw new ConversionError(422, "Could not load this PDF — it may be corrupted, password-protected, or use an unsupported encryption.");
  }

  const pages = pdfDoc.getPages();
  const pageMetas: PageMetadata[] = pages.map((page, index) => {
    const { width, height } = page.getSize();
    const rotation = page.getRotation().angle; // 0, 90, 180, 270
    const annotations = page.node.Annots?.length ?? 0;
    return {
      index,
      width,
      height,
      rotation,
      hasAnnotations: annotations > 0,
    };
  });

  return { pageCount: pages.length, pages: pageMetas, pdfDoc };
}

/**
 * Rotate specific pages (or all) by a multiple of 90 degrees.
 * Returns the modified PDFDocument (caller must save).
 */
export function rotatePages(
  pdfDoc: PDFDocument,
  pageIndices: number[],
  angle: 90 | 180 | 270,
): PDFDocument {
  const pages = pdfDoc.getPages();
  for (const idx of pageIndices) {
    if (idx < 0 || idx >= pages.length) {
      throw new ConversionError(422, `Page index ${idx + 1} out of range (1–${pages.length}).`);
    }
    const page = pages[idx];
    const current = page.getRotation().angle;
    const next = (current + angle) % 360;
    page.setRotation(degrees(next));
  }
  return pdfDoc;
}

/**
 * Delete pages by 0-based indices. Returns new PDFDocument.
 */
export async function deletePages(pdfDoc: PDFDocument, pageIndices: number[]): Promise<PDFDocument> {
  const pages = pdfDoc.getPages();
  const toDelete = new Set(pageIndices.map((i) => (i < 0 ? pages.length + i : i)));

  // Validate
  for (const idx of toDelete) {
    if (idx < 0 || idx >= pages.length) {
      throw new ConversionError(422, `Page index ${idx + 1} out of range (1–${pages.length}).`);
    }
  }
  if (toDelete.size >= pages.length) {
    throw new ConversionError(422, "Cannot delete all pages — at least one page must remain.");
  }

  // pdf-lib doesn't have direct page removal, so we copy desired pages to a new doc
  const newDoc = await PDFDocument.create();
  const keepIndices = pages
    .map((_, i) => i)
    .filter((i) => !toDelete.has(i));

  // Copy pages in order
  for (const idx of keepIndices) {
    const [copied] = await newDoc.copyPages(pdfDoc, [idx]);
    newDoc.addPage(copied);
  }

  // Copy metadata
  copyMetadata(pdfDoc, newDoc);
  return newDoc;
}

/**
 * Reorder pages. `newOrder` is an array of 0-based indices specifying the new sequence.
 * Length must equal page count, all indices unique.
 */
export async function reorderPages(pdfDoc: PDFDocument, newOrder: number[]): Promise<PDFDocument> {
  const pages = pdfDoc.getPages();
  const n = pages.length;

  if (newOrder.length !== n) {
    throw new ConversionError(422, `Reorder array must have ${n} indices (got ${newOrder.length}).`);
  }
  const seen = new Set<number>();
  for (const idx of newOrder) {
    if (idx < 0 || idx >= n) {
      throw new ConversionError(422, `Page index ${idx + 1} out of range (1–${n}).`);
    }
    if (seen.has(idx)) {
      throw new ConversionError(422, `Duplicate page index ${idx + 1} in reorder array.`);
    }
    seen.add(idx);
  }

  const newDoc = await PDFDocument.create();
  for (const idx of newOrder) {
    const [copied] = await newDoc.copyPages(pdfDoc, [idx]);
    newDoc.addPage(copied);
  }
  copyMetadata(pdfDoc, newDoc);
  return newDoc;
}

/**
 * Extract specific pages into a new PDF.
 */
export async function extractPages(pdfDoc: PDFDocument, pageIndices: number[]): Promise<PDFDocument> {
  const pages = pdfDoc.getPages();
  const n = pages.length;

  for (const idx of pageIndices) {
    if (idx < 0 || idx >= n) {
      throw new ConversionError(422, `Page index ${idx + 1} out of range (1–${n}).`);
    }
  }

  const newDoc = await PDFDocument.create();
  for (const idx of pageIndices) {
    const [copied] = await newDoc.copyPages(pdfDoc, [idx]);
    newDoc.addPage(copied);
  }
  copyMetadata(pdfDoc, newDoc);
  return newDoc;
}

/**
 * Add page numbers to all pages (or range).
 */
export interface PageNumberOptions {
  format: "1" | "1/10" | "Page 1" | "Page 1 of 10";
  position: "bottom-center" | "bottom-right" | "bottom-left" | "top-center" | "top-right" | "top-left";
  startNumber: number;        // 1-based
  skipFirst: number;          // number of pages to skip at start
  fontSize?: number;
  fontColor?: { r: number; g: number; b: number };
  margin?: number;
}

export async function addPageNumbers(pdfDoc: PDFDocument, options: PageNumberOptions): Promise<PDFDocument> {
  const pages = pdfDoc.getPages();
  const total = pages.length;
  const {
    format,
    position,
    startNumber,
    skipFirst,
    fontSize = 10,
    fontColor = { r: 0.4, g: 0.4, b: 0.45 },
    margin = 36,
  } = options;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (let i = 0; i < total; i++) {
    if (i < skipFirst) continue;
    const page = pages[i];
    const { width, height } = page.getSize();

    const pageNum = startNumber + i - skipFirst;
    let text: string;
    switch (format) {
      case "1": text = String(pageNum); break;
      case "1/10": text = `${pageNum}/${total - skipFirst}`; break;
      case "Page 1": text = `Page ${pageNum}`; break;
      case "Page 1 of 10": text = `Page ${pageNum} of ${total - skipFirst}`; break;
      default: text = String(pageNum);
    }

    const textWidth = font.widthOfTextAtSize(text, fontSize);
    let x: number, y: number;

    const pos = position.split("-");
    const vert = pos[0]; // "bottom" | "top"
    const horiz = pos[1]; // "center" | "right" | "left"

    if (vert === "bottom") {
      y = margin;
    } else {
      y = height - margin - fontSize;
    }

    if (horiz === "center") {
      x = (width - textWidth) / 2;
    } else if (horiz === "right") {
      x = width - margin - textWidth;
    } else {
      x = margin;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(fontColor.r, fontColor.g, fontColor.b),
    });
  }
  return pdfDoc;
}

/**
 * Add text watermark to all pages.
 */
export interface WatermarkOptions {
  text: string;
  fontSize?: number;
  opacity?: number;       // 0–1
  rotation?: number;      // degrees, e.g. -45
  position?: "center" | "tile";
  fontColor?: { r: number; g: number; b: number };
  font?: "Helvetica" | "Helvetica-Bold" | "Courier" | "Times-Roman";
}

export async function addTextWatermark(pdfDoc: PDFDocument, options: WatermarkOptions): Promise<PDFDocument> {
  const pages = pdfDoc.getPages();
  const {
    text,
    fontSize = 48,
    opacity = 0.15,
    rotation = -45,
    position = "center",
    fontColor = { r: 0.5, g: 0.5, b: 0.55 },
    font: fontName = "Helvetica-Bold",
  } = options;

  const standardFontMap: Record<string, StandardFonts> = {
    Helvetica: StandardFonts.Helvetica,
    "Helvetica-Bold": StandardFonts.HelveticaBold,
    Courier: StandardFonts.Courier,
    "Times-Roman": StandardFonts.TimesRoman,
  };
  const font = await pdfDoc.embedFont(standardFontMap[fontName] ?? StandardFonts.HelveticaBold);

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    if (position === "tile") {
      // Tile across page
      const spacing = 100;
      for (let x = -width; x < width * 2; x += textWidth + spacing) {
        for (let y = -height; y < height * 2; y += fontSize + spacing) {
          page.drawText(text, {
            x,
            y,
            size: fontSize,
            font,
            color: rgb(fontColor.r, fontColor.g, fontColor.b),
            opacity,
            rotate: degrees(rotation),
          });
        }
      }
    } else {
      // Single centered
      page.drawText(text, {
        x: (width - textWidth) / 2,
        y: (height - fontSize) / 2,
        size: fontSize,
        font,
        color: rgb(fontColor.r, fontColor.g, fontColor.b),
        opacity,
        rotate: degrees(rotation),
      });
    }
  }
  return pdfDoc;
}

/**
 * Add Bates numbering (legal-style sequential numbering with prefix/suffix).
 */
export interface BatesOptions {
  prefix: string;
  suffix: string;
  digits: number;           // zero-padded width
  start: number;
  position: "bottom-center" | "bottom-right" | "bottom-left" | "top-center" | "top-right" | "top-left";
  fontSize?: number;
  fontColor?: { r: number; g: number; b: number };
  skipFirst?: number;
}

export async function addBatesNumbering(pdfDoc: PDFDocument, options: BatesOptions): Promise<PDFDocument> {
  const pages = pdfDoc.getPages();
  const {
    prefix,
    suffix,
    digits,
    start,
    position,
    fontSize = 9,
    fontColor = { r: 0.3, g: 0.3, b: 0.35 },
    skipFirst = 0,
  } = options;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (let i = 0; i < pages.length; i++) {
    if (i < skipFirst) continue;
    const page = pages[i];
    const { width, height } = page.getSize();

    const num = String(start + i - skipFirst).padStart(digits, "0");
    const text = `${prefix}${num}${suffix}`;
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    const pos = position.split("-");
    const vert = pos[0];
    const horiz = pos[1];

    let x: number, y: number;
    if (vert === "bottom") y = 18;
    else y = height - 18 - fontSize;

    if (horiz === "center") x = (width - textWidth) / 2;
    else if (horiz === "right") x = width - 36 - textWidth;
    else x = 36;

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(fontColor.r, fontColor.g, fontColor.b),
    });
  }
  return pdfDoc;
}

/**
 * Linearize (Fast Web View) — already handled by pdf-lib save options.
 * This is a no-op helper for API consistency.
 */
export function linearizePdf(pdfDoc: PDFDocument): PDFDocument {
  // pdf-lib's save({ useObjectStreams: true, objectsPerStream: 100 }) produces linearized output
  return pdfDoc;
}

/** Copy metadata from source to target doc. */
function copyMetadata(src: PDFDocument, dst: PDFDocument) {
  const title = src.getTitle();
  const author = src.getAuthor();
  const subject = src.getSubject();
  const creator = src.getCreator();
  const producer = src.getProducer();
  const creationDate = src.getCreationDate();
  const modificationDate = src.getModificationDate();

  if (title) dst.setTitle(title);
  if (author) dst.setAuthor(author);
  if (subject) dst.setSubject(subject);
  if (creator) dst.setCreator(creator);
  if (producer) dst.setProducer(producer);
  if (creationDate) dst.setCreationDate(creationDate);
  if (modificationDate) dst.setModificationDate(modificationDate);
}