/**
 * Transmute conversion registry.
 *
 * Single source of truth for every supported format and conversion path.
 * Imported by BOTH the client (format selector, tools directory) and the
 * server (request validation, dispatch). Must stay dependency-free.
 */

export type Category =
  | "documents"
  | "images"
  | "video"
  | "audio"
  | "spreadsheets"
  | "presentations"
  | "archives"
  | "fonts"
  | "subtitles"
  | "data";

export type Glyph =
  | "pdf"
  | "doc"
  | "image"
  | "video"
  | "audio"
  | "sheet"
  | "slide"
  | "archive"
  | "font"
  | "subtitle"
  | "data"
  | "code";

export type Engine =
  | "image"
  | "doc"
  | "sheet"
  | "archive"
  | "font"
  | "subtitle"
  | "data"
  | "ffmpeg"
  | "package"
  | "pdf-pages";

export interface FormatDef {
  id: string;
  name: string;
  /** Accepted file extensions (first one is the canonical output ext). */
  ext: string[];
  category: Category;
  mime: string;
  glyph: Glyph;
  tint: string;
  blurb?: string;
}

export interface OptionChoice {
  value: string;
  label: string;
}

export interface OptionDef {
  id: string;
  label: string;
  type: "select" | "slider" | "number" | "pages";
  choices?: OptionChoice[];
  min?: number;
  max?: number;
  step?: number;
  def: string | number;
  hint?: string;
  /** Show only when target format id is in this list (image quality etc.). */
  onlyForTargets?: string[];
}

export interface RouteDef {
  from: string;
  to: string;
  engine: Engine;
  options: OptionDef[];
  /** Honest note about limitations shown in the UI. */
  note?: string;
  /** True when fidelity is intentionally text-focused. */
  lossy?: boolean;
}

/* ------------------------------------------------------------------ */
/* Formats                                                             */
/* ------------------------------------------------------------------ */

const F = (
  id: string,
  name: string,
  ext: string[],
  category: Category,
  mime: string,
  glyph: Glyph,
  tint: string,
  blurb?: string,
): FormatDef => ({ id, name, ext, category, mime, glyph, tint, blurb });

export const FORMATS: FormatDef[] = [
  // Documents
  F("pdf", "PDF Document", ["pdf"], "documents", "application/pdf", "pdf", "rose", "Portable, pixel-perfect documents"),
  F("docx", "Word Document", ["docx"], "documents", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "doc", "blue", "Modern Microsoft Word format"),
  F("doc", "Word 97–2003", ["doc"], "documents", "application/msword", "doc", "blue", "Legacy Microsoft Word format"),
  F("txt", "Plain Text", ["txt"], "documents", "text/plain", "doc", "slate", "Universal unformatted text"),
  F("rtf", "Rich Text Format", ["rtf"], "documents", "application/rtf", "doc", "slate", "Portable rich text"),
  F("odt", "OpenDocument Text", ["odt"], "documents", "application/vnd.oasis.opendocument.text", "doc", "indigo", "Open standard word processing"),
  F("html", "HTML Document", ["html", "htm"], "documents", "text/html", "code", "orange", "Web page markup"),
  F("epub", "EPUB eBook", ["epub"], "documents", "application/epub+zip", "doc", "amber", "Reflowable digital book"),
  F("md", "Markdown", ["md", "markdown"], "documents", "text/markdown", "code", "sky", "Lightweight formatted text"),

  // Images
  F("png", "PNG Image", ["png"], "images", "image/png", "image", "violet", "Lossless raster with transparency"),
  F("jpg", "JPEG Image", ["jpg", "jpeg"], "images", "image/jpeg", "image", "sky", "Compact photo format"),
  F("webp", "WebP Image", ["webp"], "images", "image/webp", "image", "emerald", "Modern web-optimized raster"),
  F("svg", "SVG Vector", ["svg"], "images", "image/svg+xml", "image", "amber", "Resolution-independent vector graphics"),
  F("gif", "GIF Image", ["gif"], "images", "image/gif", "image", "fuchsia", "Indexed raster, supports animation"),
  F("bmp", "Bitmap Image", ["bmp"], "images", "image/bmp", "image", "slate", "Uncompressed Windows bitmap"),
  F("tif", "TIFF Image", ["tif", "tiff"], "images", "image/tiff", "image", "cyan", "High-fidelity print raster"),
  F("ico", "Icon File", ["ico"], "images", "image/x-icon", "image", "yellow", "Windows/app favicon format"),
  F("avif", "AVIF Image", ["avif"], "images", "image/avif", "image", "lime", "Next-gen compression, HDR-ready"),
  F("heic", "HEIC Photo", ["heic", "heif"], "images", "image/heic", "image", "rose", "iPhone / high-efficiency photo"),

  // Video
  F("mp4", "MP4 Video", ["mp4"], "video", "video/mp4", "video", "sky", "Universal video container (H.264)"),
  F("webm", "WebM Video", ["webm"], "video", "video/webm", "video", "emerald", "Open web video (VP8/VP9)"),
  F("mov", "QuickTime Video", ["mov"], "video", "video/quicktime", "video", "violet", "Apple video container"),
  F("avi", "AVI Video", ["avi"], "video", "video/x-msvideo", "video", "amber", "Legacy Windows video"),
  F("mkv", "MKV Video", ["mkv"], "video", "video/x-matroska", "video", "rose", "Flexible open container"),

  // Audio
  F("mp3", "MP3 Audio", ["mp3"], "audio", "audio/mpeg", "audio", "emerald", "Universal compressed audio"),
  F("wav", "WAV Audio", ["wav"], "audio", "audio/wav", "audio", "sky", "Uncompressed PCM audio"),
  F("aac", "AAC Audio", ["aac"], "audio", "audio/aac", "audio", "violet", "Efficient modern audio"),
  F("ogg", "OGG Audio", ["ogg"], "audio", "audio/ogg", "audio", "amber", "Open container (Vorbis)"),
  F("m4a", "M4A Audio", ["m4a"], "audio", "audio/mp4", "audio", "rose", "iTunes / AAC audio"),
  F("opus", "Opus Audio", ["opus"], "audio", "audio/opus", "audio", "cyan", "Low-latency speech & music"),
  F("flac", "FLAC Audio", ["flac"], "audio", "audio/flac", "audio", "indigo", "Lossless compressed audio"),

  // Spreadsheets
  F("xlsx", "Excel Workbook", ["xlsx"], "spreadsheets", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "sheet", "emerald", "Modern Excel workbooks"),
  F("xls", "Excel 97–2003", ["xls"], "spreadsheets", "application/vnd.ms-excel", "sheet", "emerald", "Legacy Excel workbooks"),
  F("csv", "CSV Data", ["csv"], "spreadsheets", "text/csv", "sheet", "amber", "Comma-separated values"),
  F("tsv", "TSV Data", ["tsv"], "spreadsheets", "text/tab-separated-values", "sheet", "sky", "Tab-separated values"),
  F("ods", "OpenDocument Sheet", ["ods"], "spreadsheets", "application/vnd.oasis.opendocument.spreadsheet", "sheet", "indigo", "Open standard spreadsheet"),

  // Presentations
  F("pptx", "PowerPoint Deck", ["pptx"], "presentations", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "slide", "orange", "Modern PowerPoint presentations"),
  F("odp", "OpenDocument Slides", ["odp"], "presentations", "application/vnd.oasis.opendocument.presentation", "slide", "amber", "Open standard presentations"),

  // Archives
  F("zip", "ZIP Archive", ["zip"], "archives", "application/zip", "archive", "yellow", "Universal compressed archive"),
  F("tar", "TAR Archive", ["tar"], "archives", "application/x-tar", "archive", "stone", "Unix tape archive"),
  F("gz", "Gzip Compressed", ["gz"], "archives", "application/gzip", "archive", "stone", "Single-file gzip stream"),

  // Fonts
  F("ttf", "TrueType Font", ["ttf"], "fonts", "font/ttf", "font", "cyan", "Classic desktop font"),
  F("otf", "OpenType Font", ["otf"], "fonts", "font/otf", "font", "cyan", "PostScript-outline font"),
  F("woff", "WOFF Font", ["woff"], "fonts", "font/woff", "font", "teal", "Compressed web font (v1)"),
  F("woff2", "WOFF2 Font", ["woff2"], "fonts", "font/woff2", "font", "teal", "Next-gen compressed web font"),

  // Subtitles
  F("srt", "SubRip Subtitle", ["srt"], "subtitles", "application/x-subrip", "subtitle", "slate", "Most common subtitle format"),
  F("vtt", "WebVTT Subtitle", ["vtt"], "subtitles", "text/vtt", "subtitle", "slate", "HTML5 video subtitle track"),

  // Data
  F("json", "JSON Data", ["json"], "data", "application/json", "data", "lime", "Structured JavaScript data"),
  F("yaml", "YAML Data", ["yaml", "yml"], "data", "application/yaml", "data", "teal", "Human-friendly config format"),
  F("xml", "XML Data", ["xml"], "data", "application/xml", "data", "orange", "Extensible markup data"),
];

export const FORMATS_BY_ID: Record<string, FormatDef> = Object.fromEntries(
  FORMATS.map((f) => [f.id, f]),
);

export function formatById(id: string): FormatDef | undefined {
  return FORMATS_BY_ID[id];
}

export function primaryExt(id: string): string {
  return FORMATS_BY_ID[id]?.ext[0] ?? id;
}

/* ------------------------------------------------------------------ */
/* Option templates                                                    */
/* ------------------------------------------------------------------ */

const OPT_QUALITY = (targets: string[]): OptionDef => ({
  id: "quality",
  label: "Quality",
  type: "slider",
  min: 1,
  max: 100,
  step: 1,
  def: 85,
  onlyForTargets: targets,
  hint: "Higher quality produces larger files",
});

const OPT_MAX_WIDTH: OptionDef = {
  id: "maxWidth",
  label: "Max width (px)",
  type: "number",
  min: 16,
  max: 12000,
  step: 1,
  def: "",
  hint: "Optional — leave empty to keep original size",
};

const OPT_PAGE_SIZE: OptionDef = {
  id: "pageSize",
  label: "Page size",
  type: "select",
  choices: [
    { value: "a4", label: "A4" },
    { value: "letter", label: "US Letter" },
  ],
  def: "a4",
};

const OPT_VIDEO_QUALITY: OptionDef = {
  id: "quality",
  label: "Video quality",
  type: "select",
  choices: [
    { value: "high", label: "High (larger file)" },
    { value: "balanced", label: "Balanced (recommended)" },
    { value: "compact", label: "Compact (smaller file)" },
  ],
  def: "balanced",
};

const OPT_AUDIO_BITRATE: OptionDef = {
  id: "audioBitrate",
  label: "Audio bitrate",
  type: "select",
  choices: [
    { value: "320", label: "320 kbps (best)" },
    { value: "192", label: "192 kbps (recommended)" },
    { value: "128", label: "128 kbps" },
    { value: "96", label: "96 kbps (smallest)" },
  ],
  def: "192",
};

/* PDF manipulation options */
const OPT_PDF_OPERATION: OptionDef = {
  id: "operation",
  label: "Operation",
  type: "select",
  choices: [
    { value: "rotate", label: "Rotate pages" },
    { value: "delete", label: "Delete pages" },
    { value: "reorder", label: "Reorder pages" },
    { value: "extract", label: "Extract pages" },
    { value: "pagenumbers", label: "Add page numbers" },
    { value: "watermark", label: "Add text watermark" },
    { value: "bates", label: "Add Bates numbering" },
  ],
  def: "rotate",
};

const OPT_PDF_ANGLE: OptionDef = {
  id: "angle",
  label: "Rotation angle",
  type: "select",
  choices: [
    { value: "90", label: "90° clockwise" },
    { value: "180", label: "180°" },
    { value: "270", label: "270° clockwise (90° counter-clockwise)" },
  ],
  def: "90",
  onlyForTargets: ["pdf"],
};

const OPT_PDF_PAGES: OptionDef = {
  id: "pages",
  label: "Page numbers (e.g. 1,3,5-10)",
  type: "pages", // Custom type: comma-separated page numbers/ranges
  def: "",
  hint: "Comma-separated page numbers or ranges (1-5, 7, 10-15). 1-based indexing.",
  onlyForTargets: ["pdf"],
};

const OPT_PDF_PAGE_FORMAT: OptionDef = {
  id: "format",
  label: "Format",
  type: "select",
  choices: [
    { value: "1", label: "1" },
    { value: "1/10", label: "1/10" },
    { value: "Page 1", label: "Page 1" },
    { value: "Page 1 of 10", label: "Page 1 of 10" },
  ],
  def: "1",
  onlyForTargets: ["pdf"],
};

const OPT_PDF_POSITION: OptionDef = {
  id: "position",
  label: "Position",
  type: "select",
  choices: [
    { value: "bottom-center", label: "Bottom center" },
    { value: "bottom-right", label: "Bottom right" },
    { value: "bottom-left", label: "Bottom left" },
    { value: "top-center", label: "Top center" },
    { value: "top-right", label: "Top right" },
    { value: "top-left", label: "Top left" },
  ],
  def: "bottom-center",
  onlyForTargets: ["pdf"],
};

const OPT_PDF_FONT_SIZE: OptionDef = {
  id: "fontSize",
  label: "Font size",
  type: "number",
  min: 6,
  max: 72,
  step: 1,
  def: 10,
  onlyForTargets: ["pdf"],
};

const OPT_PDF_OPACITY: OptionDef = {
  id: "opacity",
  label: "Opacity",
  type: "slider",
  min: 0,
  max: 100,
  step: 5,
  def: 15,
  hint: "0 = invisible, 100 = opaque",
  onlyForTargets: ["pdf"],
};

const OPT_PDF_ROTATION: OptionDef = {
  id: "rotation",
  label: "Rotation",
  type: "number",
  min: -180,
  max: 180,
  step: 15,
  def: -45,
  onlyForTargets: ["pdf"],
};

const OPT_PDF_WATERMARK_TYPE: OptionDef = {
  id: "watermarkType",
  label: "Watermark type",
  type: "select",
  choices: [
    { value: "text", label: "Text" },
    { value: "tile", label: "Tiled text (full page)" },
  ],
  def: "text",
  onlyForTargets: ["pdf"],
};

const OPT_PDF_BATES_PREFIX: OptionDef = {
  id: "prefix",
  label: "Prefix",
  type: "select",
  choices: [{ value: "", label: "(none)" }],
  def: "",
  hint: "Text before the number (e.g. 'CONF-') — free text",
  onlyForTargets: ["pdf"],
};

const OPT_PDF_BATES_SUFFIX: OptionDef = {
  id: "suffix",
  label: "Suffix",
  type: "select",
  choices: [{ value: "", label: "(none)" }],
  def: "",
  hint: "Text after the number (e.g. '-001') — free text",
  onlyForTargets: ["pdf"],
};

const OPT_PDF_BATES_DIGITS: OptionDef = {
  id: "digits",
  label: "Number of digits",
  type: "number",
  min: 1,
  max: 10,
  step: 1,
  def: 6,
  onlyForTargets: ["pdf"],
};

const OPT_PDF_BATES_START: OptionDef = {
  id: "start",
  label: "Starting number",
  type: "number",
  min: 1,
  max: 1000000,
  step: 1,
  def: 1,
  onlyForTargets: ["pdf"],
};

const OPT_PDF_SKIP_FIRST: OptionDef = {
  id: "skipFirst",
  label: "Skip first N pages",
  type: "number",
  min: 0,
  max: 1000,
  step: 1,
  def: 0,
  onlyForTargets: ["pdf"],
};

const OPT_COMPRESS_LEVEL: OptionDef = {
  id: "compressLevel",
  label: "Compression level",
  type: "select",
  choices: [
    { value: "low", label: "Low (smallest file, lower quality)" },
    { value: "medium", label: "Medium (recommended)" },
    { value: "high", label: "High (best quality, larger file)" },
  ],
  def: "medium",
  onlyForTargets: ["pdf"],
};

/* ------------------------------------------------------------------ */
/* Route construction                                                  */
/* ------------------------------------------------------------------ */

const LOSSY_DOC_SOURCES = new Set(["pdf", "docx", "doc", "odt", "epub"]);
const LOSSY_DOC_TARGETS = new Set(["pdf", "docx", "epub"]);
const DOC_TEXT_NOTE =
  "Text-focused conversion — paragraphs, headings and lists are preserved; complex layout, images and styling are simplified.";

function buildRoutes(): RouteDef[] {
  const routes: RouteDef[] = [];
  const add = (r: RouteDef) => routes.push(r);

  /* Documents: text extraction + generation -------------------------------- */
  const docSources = ["pdf", "docx", "doc", "rtf", "odt", "epub", "html", "md", "txt"];
  const docTargets = ["txt", "md", "html", "pdf", "docx", "rtf", "odt", "epub"];
  for (const from of docSources) {
    for (const to of docTargets) {
      if (from === to) continue;
      const lossy = LOSSY_DOC_SOURCES.has(from) && LOSSY_DOC_TARGETS.has(to);
      add({
        from,
        to,
        engine: "doc",
        lossy,
        note: lossy ? DOC_TEXT_NOTE : undefined,
        options: to === "pdf" ? [OPT_PAGE_SIZE] : [],
      });
    }
  }

  /* Images (sharp + custom BMP/ICO codecs) ---------------------------------- */
  const imgIn = ["png", "jpg", "webp", "gif", "tif", "svg", "avif", "ico", "bmp", "heic"];
  const imgOut = ["png", "jpg", "webp", "avif", "tif", "gif", "ico", "bmp"];
  for (const from of imgIn) {
    for (const to of imgOut) {
      if (from === to) continue;
      add({
        from,
        to,
        engine: "image",
        options: [
          ...(["jpg", "webp", "avif"].includes(to) ? [OPT_QUALITY([to])] : []),
          OPT_MAX_WIDTH,
        ],
        note:
          from === "heic"
            ? "HEIC decoding depends on the server's native image library — some HEVC variants may fail."
            : from === "svg"
              ? "Vectors are rasterized at high density; SVG output is not offered for raster sources."
              : undefined,
      });
    }
  }

  /* Video & audio (FFmpeg) --------------------------------------------------- */
  const video = ["mp4", "webm", "mov", "avi", "mkv"];
  const audio = ["mp3", "wav", "aac", "ogg", "m4a", "opus", "flac"];
  for (const from of video) {
    for (const to of video) {
      if (from === to) continue;
      add({
        from,
        to,
        engine: "ffmpeg",
        lossy: true,
        options: [OPT_VIDEO_QUALITY, OPT_AUDIO_BITRATE],
        note: "Video is re-encoded with FFmpeg. DRM-protected or unusual codecs may not convert.",
      });
    }
    for (const to of audio) {
      add({
        from,
        to,
        engine: "ffmpeg",
        lossy: true,
        options: [OPT_AUDIO_BITRATE],
        note: "Audio is extracted from the video track with FFmpeg.",
      });
    }
  }
  for (const from of audio) {
    for (const to of audio) {
      if (from === to) continue;
      add({
        from,
        to,
        engine: "ffmpeg",
        lossy: true,
        options: [OPT_AUDIO_BITRATE],
        note: "Audio is transcoded with FFmpeg.",
      });
    }
  }

  /* Spreadsheets (SheetJS) ---------------------------------------------------- */
  const sheetIn = ["xlsx", "xls", "csv", "tsv", "ods", "json"];
  const sheetOut = ["xlsx", "csv", "tsv", "ods", "json"];
  for (const from of sheetIn) {
    for (const to of sheetOut) {
      if (from === to) continue;
      add({
        from,
        to,
        engine: "sheet",
        options: [],
        note:
          to === "json"
            ? "The first worksheet becomes an array of row objects."
            : to === "csv" || to === "tsv"
              ? "The first worksheet is exported; formulas are evaluated to their cached values."
              : to === "ods"
                ? "Cell values are preserved; charts and macros are not."
                : undefined,
      });
    }
  }

  /* Presentations -------------------------------------------------------------- */
  for (const from of ["pptx", "odp"]) {
    for (const to of ["pdf", "txt", "md"]) {
      add({
        from,
        to,
        engine: "doc",
        lossy: true,
        options: to === "pdf" ? [OPT_PAGE_SIZE] : [],
        note: "Slide text is extracted — one PDF page per slide. Graphics and transitions are not preserved.",
      });
    }
  }

  /* Archives --------------------------------------------------------------------- */
  add({ from: "zip", to: "tar", engine: "archive", options: [], note: "Contents are repackaged; folder structure is preserved." });
  add({ from: "tar", to: "zip", engine: "archive", options: [], note: "Contents are repackaged with DEFLATE compression." });
  add({ from: "tar", to: "gz", engine: "archive", options: [], note: "The TAR archive is gzip-compressed." });
  add({ from: "gz", to: "zip", engine: "archive", options: [], note: "Decompresses the gzip stream and repackages it as ZIP." });
  add({ from: "gz", to: "tar", engine: "archive", options: [], note: "Decompresses the gzip stream (tar.gz becomes a plain TAR)." });

  // Package any single file into a ZIP — kept only for archive-native formats.
  // Removed auto-generated "Format → ZIP" routes for every format to reduce
  // directory clutter; these are not real format conversions.
  const archiveIds = new Set(["zip", "tar", "gz"]);
  for (const f of FORMATS) {
    if (!archiveIds.has(f.id)) continue;
    // archive-to-zip routes are already added explicitly above
  }

  /* PDF Manipulation ----------------------------------------------------------------- */
  // Single-file PDF operations (pdf -> pdf with operation)
  // All operations share the same route; the 'operation' option selects behavior.
  add({
    from: "pdf",
    to: "pdf",
    engine: "pdf-pages",
    options: [
      OPT_PDF_OPERATION,
      OPT_PDF_ANGLE,
      OPT_PDF_PAGES,
      OPT_PDF_PAGE_FORMAT,
      OPT_PDF_POSITION,
      OPT_PDF_FONT_SIZE,
      OPT_PDF_OPACITY,
      OPT_PDF_ROTATION,
      OPT_PDF_WATERMARK_TYPE,
      OPT_PDF_BATES_PREFIX,
      OPT_PDF_BATES_SUFFIX,
      OPT_PDF_BATES_DIGITS,
      OPT_PDF_BATES_START,
      OPT_PDF_SKIP_FIRST,
      OPT_COMPRESS_LEVEL,
    ],
    note:
      "Manipulate PDF pages: rotate, delete, reorder, extract, add page numbers, watermark, Bates numbering, or compress.",
  });

  /* OCR ------------------------------------------------------------------------------- */
  // TODO: OCR routes disabled due to tesseract.js path resolution issues in Next.js server context
  // Image -> Text (OCR)
  // const imageFormats = ["png", "jpg", "webp", "tif", "gif", "bmp", "heic"];
  // for (const from of imageFormats) {
  //   add({
  //     from,
  //     to: "txt",
  //     engine: "ocr",
  //     options: [OPT_OCR_LANG, OPT_OCR_DPI],
  //     note: "Extract text from image using OCR (Tesseract).",
  //   });
  // }
  // // PDF -> Text (OCR)
  // add({
  //   from: "pdf",
  //   to: "txt",
  //   engine: "ocr",
  //   options: [OPT_OCR_LANG, OPT_OCR_DPI],
  //   note: "Extract text from scanned PDF using OCR.",
  // });
  // // PDF -> Searchable PDF (OCR with text layer)
  // add({
  //   from: "pdf",
  //   to: "pdf",
  //   engine: "ocr",
  //   options: [OPT_OCR_LANG, OPT_OCR_DPI],
  //   note: "Make scanned PDF searchable by adding invisible OCR text layer.",
  // });

  /* Fonts --------------------------------------------------------------------------- */
  add({ from: "ttf", to: "woff", engine: "font", options: [] });
  add({ from: "ttf", to: "woff2", engine: "font", options: [] });
  add({ from: "otf", to: "woff", engine: "font", options: [] });
  add({ from: "otf", to: "woff2", engine: "font", options: [] });
  add({ from: "woff", to: "ttf", engine: "font", options: [] });
  add({ from: "woff", to: "woff2", engine: "font", options: [] });
  add({ from: "woff2", to: "ttf", engine: "font", options: [], note: "TTF output keeps OpenType/CFF outlines when present (saved as .otf)." });
  add({ from: "woff2", to: "woff", engine: "font", options: [] });

  /* Subtitles ------------------------------------------------------------------------ */
  for (const from of ["srt", "vtt"]) {
    for (const to of ["srt", "vtt", "txt"]) {
      if (from === to) continue;
      add({ from, to, engine: "subtitle", options: [], note: to === "txt" ? "Timestamps are stripped; spoken text remains." : undefined });
    }
  }

  /* Structured data -------------------------------------------------------------------- */
  const dataF = ["json", "yaml", "xml"];
  for (const from of dataF) {
    for (const to of dataF) {
      if (from === to) continue;
      add({ from, to, engine: "data", options: [] });
    }
  }

  return routes;
}

export const ROUTES: RouteDef[] = buildRoutes();

/* ------------------------------------------------------------------ */
/* Lookup helpers                                                      */
/* ------------------------------------------------------------------ */

const ROUTE_MAP = new Map<string, RouteDef>(
  ROUTES.map((r) => [`${r.from}>${r.to}`, r]),
);

export function getRoute(from: string, to: string): RouteDef | undefined {
  return ROUTE_MAP.get(`${from}>${to}`);
}

/** All valid conversions FROM a given format. */
export function targetsFor(from: string): RouteDef[] {
  return ROUTES.filter((r) => r.from === from);
}

/** Routes grouped by input format — powers the tools directory. */
export function routesGroupedByFrom(): Array<{ from: string; routes: RouteDef[] }> {
  const groups = new Map<string, RouteDef[]>();
  for (const r of ROUTES) {
    const list = groups.get(r.from) ?? [];
    list.push(r);
    groups.set(r.from, list);
  }
  return [...groups.entries()]
    .map(([from, routes]) => ({ from, routes }))
    .sort((a, b) => a.from.localeCompare(b.from));
}

/* ------------------------------------------------------------------ */
/* Slugs                                                               */
/* ------------------------------------------------------------------ */

export function pairSlug(from: string, to: string): string {
  return `${from}-to-${to}`;
}

export function parsePairSlug(slug: string): { from: string; to: string } | null {
  const m = /^([a-z0-9]+)-to-([a-z0-9]+)$/.exec(slug);
  if (!m) return null;
  const { from, to } = { from: m[1], to: m[2] };
  return getRoute(from, to) ? { from, to } : null;
}

/* ------------------------------------------------------------------ */
/* Categories & directory                                              */
/* ------------------------------------------------------------------ */

export const CATEGORY_META: Record<Category, { label: string; blurb: string }> = {
  documents: { label: "Documents", blurb: "PDF, Word, eBooks, Markdown & more" },
  images: { label: "Images", blurb: "PNG, JPG, WebP, AVIF, vectors & more" },
  video: { label: "Video", blurb: "MP4, WebM, MOV, MKV & more" },
  audio: { label: "Audio", blurb: "MP3, WAV, FLAC, Opus & more" },
  spreadsheets: { label: "Spreadsheets", blurb: "Excel, CSV, ODS & data exports" },
  presentations: { label: "Presentations", blurb: "PowerPoint & OpenDocument decks" },
  archives: { label: "Archives", blurb: "ZIP, TAR, GZIP packaging" },
  fonts: { label: "Fonts", blurb: "TTF, OTF, WOFF & WOFF2" },
  subtitles: { label: "Subtitles", blurb: "SRT & WebVTT caption tracks" },
  data: { label: "Structured Data", blurb: "JSON, YAML & XML" },
};

/** Tab bucket used by the tools directory ("Other" merges niche categories). */
export type ToolTab =
  | "all"
  | "documents"
  | "images"
  | "video"
  | "audio"
  | "spreadsheets"
  | "presentations"
  | "archives"
  | "other";

export const TOOL_TABS: Array<{ id: ToolTab; label: string }> = [
  { id: "all", label: "All Tools" },
  { id: "documents", label: "Documents" },
  { id: "images", label: "Images" },
  { id: "video", label: "Video" },
  { id: "audio", label: "Audio" },
  { id: "spreadsheets", label: "Spreadsheets" },
  { id: "presentations", label: "Presentations" },
  { id: "archives", label: "Archives" },
  { id: "other", label: "Other" },
];

export function tabForCategory(cat: Category): Exclude<ToolTab, "all"> {
  if (cat === "fonts" || cat === "subtitles" || cat === "data") return "other";
  return cat;
}

/* ------------------------------------------------------------------ */
/* Popular conversions                                                 */
/* ------------------------------------------------------------------ */

export interface PopularDef {
  from: string;
  to: string;
  title: string;
  desc: string;
}

export const POPULAR: PopularDef[] = [
  { from: "pdf", to: "docx", title: "PDF to Word", desc: "Turn PDFs into editable Word documents" },
  { from: "docx", to: "pdf", title: "Word to PDF", desc: "Share documents that look right everywhere" },
  { from: "jpg", to: "png", title: "JPG to PNG", desc: "Lossless quality with transparency support" },
  { from: "png", to: "webp", title: "PNG to WebP", desc: "Shrink images up to 30% for the web" },
  { from: "mp4", to: "mp3", title: "MP4 to MP3", desc: "Extract audio from any video track" },
  { from: "webp", to: "jpg", title: "WebP to JPG", desc: "Open modern images in any app" },
  { from: "xlsx", to: "csv", title: "Excel to CSV", desc: "Clean data exports for any tool" },
  { from: "pptx", to: "pdf", title: "PowerPoint to PDF", desc: "Handouts that open anywhere" },
];

/* ------------------------------------------------------------------ */
/* Stats (derived from the registry — always truthful)                  */
/* ------------------------------------------------------------------ */

export const STATS = {
  formats: FORMATS.length,
  conversions: ROUTES.length,
  categories: TOOL_TABS.length - 1,
};

/** Rotating hero ticker examples (all real routes). */
export const HERO_PAIRS: Array<[string, string]> = [
  ["png", "webp"],
  ["pdf", "docx"],
  ["mp4", "mp3"],
  ["docx", "pdf"],
  ["heic", "jpg"],
  ["xlsx", "csv"],
  ["wav", "flac"],
  ["pptx", "pdf"],
];
