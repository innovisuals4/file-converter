import JSZip from "jszip";
import { ConversionError } from "@/lib/server/util";

/**
 * Document engine.
 *
 * Sources are first extracted into a "blocks" IR (headings, paragraphs,
 * lists, preformatted text — with bold/italic runs), which is then rendered
 * into the target format. This keeps every converter honest and testable.
 */

export type BlockType = "h1" | "h2" | "h3" | "p" | "li" | "pre" | "pagebreak";

export interface Run {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
}

export interface Block {
  type: BlockType;
  runs: Run[];
  text: string;
}

function mk(type: BlockType, text: string): Block {
  return { type, runs: [{ text }], text };
}

const DOC_MIME: Record<string, string> = {
  txt: "text/plain",
  md: "text/markdown",
  html: "text/html",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  rtf: "application/rtf",
  odt: "application/vnd.oasis.opendocument.text",
  epub: "application/epub+zip",
};

/* ------------------------------------------------------------------ */
/* Shared text helpers                                                 */
/* ------------------------------------------------------------------ */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—",
  hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", bull: "•", middot: "·",
  copy: "©", reg: "®", trade: "™", deg: "°", eacute: "é", egrave: "è", agrave: "à",
  ccedil: "ç", uuml: "ü", ouml: "ö", auml: "ä", szlig: "ß", euro: "€", pound: "£", yen: "¥",
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, body: string) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return NAMED_ENTITIES[body] ?? whole;
  });
}

export function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
  );
}

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "");
}

/* ------------------------------------------------------------------ */
/* HTML → blocks (also used for DOCX via mammoth and EPUB)              */
/* ------------------------------------------------------------------ */

export function inlineHtmlToRuns(html: string): Run[] {
  const runs: Run[] = [];
  let bold = 0;
  let italic = 0;
  const re = /<(\/?)(strong|b|em|i|code|kbd|br)\b[^>]*>|([^<]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (m[2]) {
      const tag = m[2].toLowerCase();
      if (tag === "br") {
        runs.push({ text: "\n" });
        continue;
      }
      const delta = m[1] === "/" ? -1 : 1;
      if (tag === "strong" || tag === "b") bold = Math.max(0, bold + delta);
      else if (tag === "em" || tag === "i") italic = Math.max(0, italic + delta);
      else if (tag === "code" || tag === "kbd") {
        if (m[1] !== "/") continue; // opening code: following text flagged via stack-less heuristic
      }
      continue;
    }
    const text = decodeEntities(m[3] ?? "");
    if (text) runs.push({ text, bold: bold > 0, italic: italic > 0 });
  }
  return runs.length ? runs : [{ text: decodeEntities(stripTags(html)) }];
}

export function htmlToBlocks(html: string): Block[] {
  const body = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html)?.[1] ?? html;
  const cleaned = body
    .replace(/<(script|style|head|nav|footer|aside|svg|form)[\s\S]*?<\/\1>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  const tokens = cleaned.split(/(<\/?(?:h[1-6]|p|li|ul|ol|blockquote|pre|hr|br)\b[^>]*\/?>)/i);
  const blocks: Block[] = [];
  let cur: { type: string; runs: Run[] } | null = null;

  const close = () => {
    if (!cur) return;
    const runs = cur.runs.map((r) => ({ ...r, text: r.text.replace(/[ \t]+/g, " ") }));
    const text = runs.map((r) => r.text).join("").trim();
    if (text) {
      const t = cur.type;
      blocks.push({
        type: t === "h4" || t === "h5" || t === "h6" ? "h3" : (t as BlockType),
        runs,
        text,
      });
    }
    cur = null;
  };

  for (const tok of tokens) {
    if (!tok) continue;
    const m = /^<(\/?)(h[1-6]|p|li|ul|ol|blockquote|pre|hr|br)\b/i.exec(tok);
    if (m) {
      const closing = m[1] === "/";
      const tag = m[2].toLowerCase();
      if (tag === "ul" || tag === "ol" || tag === "hr") continue;
      if (tag === "br") {
        cur?.runs.push({ text: "\n" });
        continue;
      }
      if (!closing) {
        close();
        cur = { type: tag, runs: [] };
      } else {
        close();
      }
      continue;
    }
    if (cur) cur.runs.push(...inlineHtmlToRuns(tok));
    else if (tok.trim()) {
      cur = { type: "p", runs: inlineHtmlToRuns(tok) };
    }
  }
  close();
  return blocks;
}

function plainTextToBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  for (const line of text.replace(/\r\n?/g, "\n").split("\n")) {
    const t = line.trim();
    if (t) blocks.push(mk("p", t));
  }
  return blocks;
}

/* ------------------------------------------------------------------ */
/* Extractors                                                          */
/* ------------------------------------------------------------------ */

async function extractDocx(input: Buffer): Promise<Block[]> {
  const mammoth = await import("mammoth");
  const { value: html } = await mammoth.convertToHtml({ buffer: input });
  return htmlToBlocks(html);
}

async function extractDoc(input: Buffer): Promise<Block[]> {
  const WordExtractor =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- third-party lib ships no types
    (await import("word-extractor")).default as any;
  const extractor = new WordExtractor();
  const doc = await extractor.extract(input);
  return plainTextToBlocks(doc.getBody());
}

async function extractPdf(input: Buffer): Promise<Block[]> {
  const pdfjs: typeof import("pdfjs-dist/legacy/build/pdf.mjs") = await import(
    "pdfjs-dist/legacy/build/pdf.mjs"
  );
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(input),
    useSystemFonts: true,
    verbosity: 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pdfjs legacy build types are incomplete
  } as any).promise;
  const blocks: Block[] = [];
  try {
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      let text = "";
      for (const item of content.items) {
        if ("str" in item && typeof item.str === "string") {
          text += item.str;
          if (item.hasEOL) text += "\n";
        }
      }
      page.cleanup();
      if (p > 1) blocks.push({ type: "pagebreak", runs: [], text: "" });
      for (const para of text.replace(/\r\n?/g, "\n").split(/\n{2,}/)) {
        const trimmed = para.replace(/[ \t]+\n/g, "\n").trim();
        if (trimmed) blocks.push(mk("p", trimmed));
      }
    }
  } finally {
    // pdfjs legacy proxy has no destroy in this build; GC handles it.
  }
  return blocks.length ? blocks : [{ type: "p", runs: [{ text: "(No extractable text — this PDF may be scanned images or fully vector-based.)" }], text: "" }];
}

/** Minimal, dependency-free RTF → text. Handles unicode, hex escapes, destinations. */
export function rtfToText(input: string): string {
  const CP1252: Record<number, string> = {
    0x80: "€", 0x82: "‚", 0x83: "ƒ", 0x84: "„", 0x85: "…", 0x86: "†", 0x87: "‡", 0x88: "ˆ",
    0x89: "‰", 0x8a: "Š", 0x8b: "‹", 0x8c: "Œ", 0x91: "‘", 0x92: "’", 0x93: "“", 0x94: "”",
    0x95: "•", 0x96: "–", 0x97: "—", 0x98: "˜", 0x99: "™", 0x9a: "š", 0x9b: "›", 0x9c: "œ",
    0x9e: "ž", 0x9f: "Ÿ",
  };
  const out: string[] = [];
  const stack: number[] = [];
  let skip = 0;
  let starSkip = false;
  let ucSkip = 1;
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === "{") {
      stack.push(skip);
      if (starSkip) {
        skip = 1;
        starSkip = false;
      }
      i++;
      continue;
    }
    if (ch === "}") {
      skip = stack.pop() ?? 0;
      i++;
      continue;
    }
    if (ch === "\\") {
      if (input[i + 1] === "*") {
        starSkip = true;
        i += 2;
        continue;
      }
      const m = /^\\([a-zA-Z]+)(-?\d+)? ?/.exec(input.slice(i, i + 40));
      if (m) {
        const word = m[1];
        const param = m[2] !== undefined ? parseInt(m[2], 10) : undefined;
        i += m[0].length;
        if (skip) continue;
        switch (word) {
          case "par":
          case "line":
            out.push("\n");
            break;
          case "tab":
            out.push("\t");
            break;
          case "uc":
            ucSkip = param ?? 1;
            break;
          case "u": {
            if (param !== undefined) {
              let code = param;
              if (code < 0) code += 65536;
              out.push(String.fromCharCode(code));
            }
            i += ucSkip || 1;
            ucSkip = 1;
            break;
          }
          case "fonttbl":
          case "colortbl":
          case "stylesheet":
          case "info":
          case "pict":
          case "object":
          case "header":
          case "footer":
          case "xmlnstbl":
          case "generator":
            skip = 1;
            break;
          case "bin":
            if (param) i += param;
            break;
          default:
            break;
        }
        continue;
      }
      if (input[i + 1] === "'") {
        const code = parseInt(input.slice(i + 2, i + 4), 16);
        if (Number.isFinite(code)) out.push(CP1252[code] ?? String.fromCharCode(code));
        i += 4;
        continue;
      }
      const sym = input[i + 1];
      if (sym === "\\" || sym === "{" || sym === "}") out.push(sym);
      else if (sym === "~") out.push(" ");
      i += 2;
      continue;
    }
    if (!skip && ch !== "\r" && ch !== "\n") out.push(ch);
    i++;
  }
  return out.join("");
}

function textFromXmlMarkup(s: string): string {
  return decodeEntities(
    stripTags(
      s
        .replace(/<text:s(?:\s+text:c="(\d+)")?\s*\/?>/g, (_m, c) => " ".repeat(Number(c ?? 1)))
        .replace(/<text:tab\s*\/?>/g, "\t")
        .replace(/<text:line-break\s*\/?>/g, "\n"),
    ),
  );
}

async function extractOpenDocument(input: Buffer, kind: "odt" | "odp"): Promise<Block[]> {
  const zip = await JSZip.loadAsync(input).catch(() => {
    throw new ConversionError(422, "This file is not a valid OpenDocument package.");
  });
  const content = await zip.file("content.xml")?.async("string");
  if (!content) throw new ConversionError(422, "Corrupted OpenDocument file (missing content.xml).");

  if (kind === "odt") {
    const blocks: Block[] = [];
    const re = /<text:(h|p)\b([^>]*)>([\s\S]*?)<\/text:\1>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content))) {
      const level = /text:outline-level="(\d+)"/.exec(m[2])?.[1];
      const text = textFromXmlMarkup(m[3]).trim();
      if (!text) continue;
      if (m[1] === "h") blocks.push(mk(level === "1" ? "h1" : level === "2" ? "h2" : "h3", text));
      else blocks.push(mk("p", text));
    }
    return blocks.length ? blocks : plainTextToBlocks(textFromXmlMarkup(content));
  }

  // ODP: one page per slide
  const blocks: Block[] = [];
  const pages = content.match(/<draw:page\b[\s\S]*?<\/draw:page>/g) ?? [];
  pages.forEach((pageXml, idx) => {
    if (idx > 0) blocks.push({ type: "pagebreak", runs: [], text: "" });
    const lines: string[] = [];
    const re = /<text:(h|p)\b[^>]*>([\s\S]*?)<\/text:\1>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(pageXml))) {
      const text = textFromXmlMarkup(m[2]).trim();
      if (text) lines.push(text);
    }
    if (!lines.length) return;
    blocks.push(mk("h2", lines[0]));
    for (const line of lines.slice(1)) blocks.push(mk("p", line));
  });
  return blocks;
}

async function extractEpub(input: Buffer): Promise<Block[]> {
  const zip = await JSZip.loadAsync(input).catch(() => {
    throw new ConversionError(422, "This file is not a valid EPUB package.");
  });
  let opfPath: string | undefined;
  const container = await zip.file("META-INF/container.xml")?.async("string");
  if (container) opfPath = /full-path="([^"]+)"/.exec(container)?.[1];
  if (!opfPath) opfPath = Object.keys(zip.files).find((n) => n.endsWith(".opf"));

  let order: string[] = [];
  if (opfPath && zip.file(opfPath)) {
    const opf = await zip.file(opfPath)!.async("string");
    const opfDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";
    const manifest = new Map<string, string>();
    for (const item of opf.match(/<item\b[^>]*>/g) ?? []) {
      const id = /id="([^"]+)"/.exec(item)?.[1];
      const href = /href="([^"]+)"/.exec(item)?.[1];
      if (id && href) manifest.set(id, href);
    }
    for (const ref of opf.match(/<itemref\b[^>]*>/g) ?? []) {
      const idref = /idref="([^"]+)"/.exec(ref)?.[1];
      const href = idref ? manifest.get(idref) : undefined;
      if (href && /\.x?html?(\?|#|$)/i.test(href)) order.push(opfDir + decodeURIComponent(href));
    }
  }
  if (!order.length) {
    order = Object.keys(zip.files)
      .filter((n) => /\.x?html?$/i.test(n) && !n.startsWith("META-INF"))
      .sort();
  }

  const blocks: Block[] = [];
  let first = true;
  for (const name of order) {
    const file = zip.file(name) ?? zip.file(name.replace(/^\//, ""));
    if (!file) continue;
    const html = await file.async("string");
    const pageBlocks = htmlToBlocks(html);
    if (!pageBlocks.length) continue;
    if (!first) blocks.push({ type: "pagebreak", runs: [], text: "" });
    first = false;
    blocks.push(...pageBlocks);
  }
  return blocks;
}

async function extractPptx(input: Buffer): Promise<Block[]> {
  const zip = await JSZip.loadAsync(input).catch(() => {
    throw new ConversionError(422, "This file is not a valid PPTX package.");
  });
  const slideNames = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => Number(/slide(\d+)\.xml/.exec(a)?.[1]) - Number(/slide(\d+)\.xml/.exec(b)?.[1]));
  if (!slideNames.length) throw new ConversionError(422, "No slides found in this PPTX file.");

  const blocks: Block[] = [];
  for (let i = 0; i < slideNames.length; i++) {
    const xml = await zip.file(slideNames[i])!.async("string");
    if (i > 0) blocks.push({ type: "pagebreak", runs: [], text: "" });
    const paragraphs = xml.match(/<a:p>[\s\S]*?<\/a:p>/g) ?? [];
    const lines: string[] = [];
    for (const para of paragraphs) {
      const text = decodeEntities(
        (para.match(/<a:t>([\s\S]*?)<\/a:t>/g) ?? []).map((t) => t.slice(4, -4)).join(""),
      ).trim();
      if (text) lines.push(text);
    }
    if (!lines.length) continue;
    blocks.push(mk("h2", lines[0].length <= 90 ? lines[0] : `Slide ${i + 1}`));
    if (lines[0].length > 90) blocks.push(mk("p", lines[0]));
    for (const line of lines.slice(1)) blocks.push(mk("p", line));
  }
  return blocks;
}

async function extractMd(input: Buffer): Promise<Block[]> {
  const { marked } = await import("marked");
  const tokens = marked.lexer(input.toString("utf8"));
  const blocks: Block[] = [];

  const inline = (tokens: unknown[] | undefined): Run[] =>
    mdInline(tokens ?? [], false, false);

  function mdInline(tokens: unknown[], bold: boolean, italic: boolean): Run[] {
    const runs: Run[] = [];
    for (const t of tokens as Array<Record<string, unknown>>) {
      switch (t.type) {
        case "strong":
          runs.push(...mdInline(t.tokens as unknown[], true, italic));
          break;
        case "em":
          runs.push(...mdInline(t.tokens as unknown[], bold, true));
          break;
        case "codespan":
          runs.push({ text: String(t.text), code: true });
          break;
        case "link":
        case "image":
          runs.push(...mdInline((t.tokens as unknown[]) ?? [], bold, italic));
          break;
        case "br":
          runs.push({ text: "\n" });
          break;
        case "text":
          if (t.tokens) runs.push(...mdInline(t.tokens as unknown[], bold, italic));
          else runs.push({ text: String(t.text), bold, italic });
          break;
        default: {
          const raw = (t.raw as string) ?? (t.text as string) ?? "";
          if (raw) runs.push({ text: raw, bold, italic });
        }
      }
    }
    return runs;
  }

  const walk =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- marked token union is not expressible cleanly
    (tokens: any[]) => {
    for (const token of tokens) {
      switch (token.type) {
        case "heading": {
          const depth = Number(token.depth ?? 1);
          blocks.push({
            type: depth === 1 ? "h1" : depth === 2 ? "h2" : "h3",
            runs: inline(token.tokens as unknown[]),
            text: String(token.text ?? ""),
          });
          break;
        }
        case "paragraph":
          blocks.push({ type: "p", runs: inline(token.tokens as unknown[]), text: String(token.text ?? "") });
          break;
        case "list": {
          for (const item of (token.items ?? []) as Array<Record<string, unknown>>) {
            blocks.push({ type: "li", runs: inline(item.tokens as unknown[]), text: String(item.text ?? "") });
          }
          break;
        }
        case "code":
          blocks.push(mk("pre", String(token.text ?? "")));
          break;
        case "blockquote":
          walk([token]);
          break;
        case "space":
        case "hr":
        case "html":
          break;
        default:
          if (Array.isArray(token.tokens)) walk(token.tokens);
      }
    }
  };
    walk(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tokens as any[],
    );
  return blocks;
}

/* ------------------------------------------------------------------ */
/* Renderers                                                           */
/* ------------------------------------------------------------------ */

async function renderTxt(blocks: Block[]): Promise<Buffer> {
  const parts: string[] = [];
  for (const b of blocks) {
    if (b.type === "pagebreak") continue;
    if (b.type === "li") parts.push(`• ${b.text}`);
    else if (b.type !== "pre") parts.push(b.text);
    else parts.push(b.text);
  }
  return Buffer.from(parts.join("\n\n"), "utf8");
}

async function renderMd(blocks: Block[]): Promise<Buffer> {
  const parts: string[] = [];
  for (const b of blocks) {
    if (b.type === "pagebreak") continue;
    if (b.type === "h1") parts.push(`# ${b.text}`);
    else if (b.type === "h2") parts.push(`## ${b.text}`);
    else if (b.type === "h3") parts.push(`### ${b.text}`);
    else if (b.type === "li") parts.push(`- ${b.text}`);
    else if (b.type === "pre") parts.push("```\n" + b.text + "\n```");
    else parts.push(b.text);
  }
  return Buffer.from(parts.join("\n\n"), "utf8");
}

async function renderHtml(blocks: Block[], title: string): Promise<Buffer> {
  const esc = (s: string) => escapeXml(s).replace(/\n/g, "<br />");
  const body: string[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case "h1": body.push(`<h1>${esc(b.text)}</h1>`); break;
      case "h2": body.push(`<h2>${esc(b.text)}</h2>`); break;
      case "h3": body.push(`<h3>${esc(b.text)}</h3>`); break;
      case "li": body.push(`<li>${esc(b.text)}</li>`); break;
      case "pre": body.push(`<pre>${escapeXml(b.text)}</pre>`); break;
      case "pagebreak": body.push(`<hr />`); break;
      default: body.push(`<p>${esc(b.text)}</p>`);
    }
  }
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeXml(title)}</title>
<style>
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 46rem; margin: 3rem auto; padding: 0 1.5rem; line-height: 1.65; color: #1a1b25; }
  h1, h2, h3 { line-height: 1.25; }
  pre { background: #f4f4f8; padding: 1rem; border-radius: 8px; overflow-x: auto; font-size: 0.875rem; }
  hr { border: none; border-top: 1px solid #e4e5ec; margin: 2.5rem 0; }
</style>
</head>
<body>
${body.join("\n")}
</body>
</html>`;
  return Buffer.from(html, "utf8");
}

async function renderRtf(blocks: Block[]): Promise<Buffer> {
  const rtfEscape = (text: string): string => {
    let s = "";
    for (const ch of text) {
      const code = ch.codePointAt(0)!;
      if (ch === "\\" || ch === "{" || ch === "}") s += "\\" + ch;
      else if (code >= 32 && code < 127) s += ch;
      else if (code === 10) s += "\\line ";
      else if (code === 9) s += "\\tab ";
      else if (code < 256) s += "\\'" + code.toString(16).padStart(2, "0");
      else s += `\\u${code > 32767 ? code - 65536 : code}?`;
    }
    return s;
  };
  const parts: string[] = [];
  for (const b of blocks) {
    if (b.type === "pagebreak") {
      parts.push("\\pard\\pagebb\\par");
      continue;
    }
    const text = rtfEscape(b.text);
    if (b.type === "h1") parts.push(`\\pard\\sa120\\sb240\\fs36\\b ${text}\\b0\\fs22\\par`);
    else if (b.type === "h2") parts.push(`\\pard\\sa120\\sb200\\fs30\\b ${text}\\b0\\fs22\\par`);
    else if (b.type === "h3") parts.push(`\\pard\\sa100\\sb160\\fs26\\b ${text}\\b0\\fs22\\par`);
    else if (b.type === "li") parts.push(`\\pard\\fi-360\\li720\\sa60 ${text}\\par`);
    else if (b.type === "pre") parts.push(`\\pard\\f1\\fs20 ${text}\\f0\\fs22\\par`);
    else parts.push(`\\pard\\sa120 ${text}\\par`);
  }
  const rtf = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0\\fswiss Helvetica;}{\\f1\\fmodern Courier New;}}\\fs22\n${parts.join("\n")}\n}`;
  return Buffer.from(rtf, "utf8");
}

function odtParagraph(b: Block): string {
  const text = escapeXml(b.text).replace(/\n/g, "<text:line-break/>");
  if (b.type === "h1") return `<text:h text:outline-level="1">${text}</text:h>`;
  if (b.type === "h2") return `<text:h text:outline-level="2">${text}</text:h>`;
  if (b.type === "h3") return `<text:h text:outline-level="3">${text}</text:h>`;
  if (b.type === "pre") return `<text:p>${text}</text:p>`;
  return `<text:p>${text}</text:p>`;
}

async function renderOdt(blocks: Block[]): Promise<Buffer> {
  const zip = new JSZip();
  zip.file("mimetype", "application/vnd.oasis.opendocument.text", { compression: "STORE" });
  zip.file(
    "META-INF/manifest.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
 <manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.text"/>
 <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
 <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`,
  );
  const body = blocks
    .filter((b) => b.type !== "pagebreak")
    .map(odtParagraph)
    .join("\n");
  zip.file(
    "content.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" office:version="1.2">
 <office:body>
  <office:text>
${body}
  </office:text>
 </office:body>
</office:document-content>`,
  );
  zip.file(
    "styles.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" office:version="1.2">
 <office:styles/>
</office:document-styles>`,
  );
  const out = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", mimeType: "application/vnd.oasis.opendocument.text" });
  return out;
}

async function renderEpub(blocks: Block[], title: string): Promise<Buffer> {
  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
 <rootfiles>
  <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
 </rootfiles>
</container>`,
  );

  const esc = (s: string) => escapeXml(s).replace(/\n/g, "<br />");
  const body: string[] = [];
  let inList = false;
  const closeList = () => {
    if (inList) {
      body.push("</ul>");
      inList = false;
    }
  };
  for (const b of blocks) {
    switch (b.type) {
      case "h1": closeList(); body.push(`<h1>${esc(b.text)}</h1>`); break;
      case "h2": closeList(); body.push(`<h2>${esc(b.text)}</h2>`); break;
      case "h3": closeList(); body.push(`<h3>${esc(b.text)}</h3>`); break;
      case "li":
        if (!inList) {
          body.push("<ul>");
          inList = true;
        }
        body.push(`<li>${esc(b.text)}</li>`);
        break;
      case "pre": closeList(); body.push(`<pre>${escapeXml(b.text)}</pre>`); break;
      case "pagebreak": closeList(); body.push("<hr />"); break;
      default: closeList(); body.push(`<p>${esc(b.text)}</p>`);
    }
  }
  closeList();

  const safeTitle = escapeXml(title);
  zip.file(
    "OEBPS/chapter-1.xhtml",
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${safeTitle}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>
${body.join("\n")}
</body>
</html>`,
  );
  zip.file(
    "OEBPS/toc.xhtml",
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Contents</title></head>
<body>
 <nav epub:type="toc" id="toc">
  <h1>Contents</h1>
  <ol><li><a href="chapter-1.xhtml">${safeTitle}</a></li></ol>
 </nav>
</body>
</html>`,
  );
  zip.file(
    "OEBPS/style.css",
    `body { font-family: serif; line-height: 1.6; margin: 1.5em; }
h1, h2, h3 { font-family: sans-serif; line-height: 1.3; }
pre { background: #f4f4f8; padding: 0.8em; overflow-x: auto; font-size: 0.85em; }`,
  );
  const uuid = crypto.randomUUID();
  zip.file(
    "OEBPS/content.opf",
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="en">
 <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
  <dc:identifier id="bookid">urn:uuid:${uuid}</dc:identifier>
  <dc:title>${safeTitle}</dc:title>
  <dc:language>en</dc:language>
  <dc:creator>Transmute</dc:creator>
  <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, "Z")}</meta>
 </metadata>
 <manifest>
  <item id="nav" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>
  <item id="css" href="style.css" media-type="text/css"/>
  <item id="ch1" href="chapter-1.xhtml" media-type="application/xhtml+xml"/>
 </manifest>
 <spine>
  <itemref idref="nav" linear="no"/>
  <itemref idref="ch1"/>
 </spine>
</package>`,
  );
  const out = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", mimeType: "application/epub+zip" });
  return out;
}

/* --------------------------- PDF --------------------------------- */

const WINANSI_EXTRA = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039,
  0x0152, 0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122,
  0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
]);

function sanitizePdfText(s: string): string {
  let out = "";
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    if (c === 9 || c === 10 || c === 13) out += " ";
    else if ((c >= 0x20 && c <= 0x7e) || (c >= 0xa0 && c <= 0xff) || WINANSI_EXTRA.has(c)) out += ch;
    else out += "?";
  }
  return out;
}

async function renderPdf(blocks: Block[], filename: string, options: Record<string, string | number>): Promise<Buffer> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  pdf.setTitle(filename.replace(/\.[^.]+$/, ""));
  pdf.setProducer("Transmute");
  pdf.setCreator("Transmute");

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await pdf.embedFont(StandardFonts.Courier);

  const isLetter = options.pageSize === "letter";
  const W = isLetter ? 612 : 595.28;
  const H = isLetter ? 792 : 841.89;
  const margin = 56;
  const maxW = W - margin * 2;

  const STYLES: Record<Exclude<BlockType, "pagebreak">, { size: number; bold?: boolean; mono?: boolean; before: number; after: number }> = {
    h1: { size: 22, bold: true, before: 18, after: 10 },
    h2: { size: 17, bold: true, before: 14, after: 8 },
    h3: { size: 14, bold: true, before: 12, after: 6 },
    p: { size: 11, before: 0, after: 8 },
    li: { size: 11, before: 0, after: 4 },
    pre: { size: 9.5, mono: true, before: 4, after: 10 },
  };

  interface Segment { text: string; font: import("pdf-lib").PDFFont }
  const wrap = (runs: Run[], size: number, bold: boolean, mono: boolean, width: number): Segment[][] => {
    const pick = (r: Run) => (r.bold || bold ? fontBold : r.code || mono ? fontMono : font);
    const words: Array<{ text: string; font: import("pdf-lib").PDFFont; w: number }> = [];
    for (const r of runs) {
      const f = pick(r);
      const parts = sanitizePdfText(r.text).split("\n");
      parts.forEach((part, pi) => {
        if (pi > 0) words.push({ text: "\n", font: f, w: 0 });
        for (const chunk of part.split(/(?<= )/)) {
          if (!chunk) continue;
          words.push({ text: chunk, font: f, w: f.widthOfTextAtSize(chunk, size) });
        }
      });
    }
    const lines: Segment[][] = [];
    let cur: Segment[] = [];
    let curW = 0;
    for (const word of words) {
      if (word.text === "\n") {
        lines.push(cur);
        cur = [];
        curW = 0;
        continue;
      }
      if (curW + word.w > width && cur.length) {
        const last = cur[cur.length - 1];
        last.text = last.text.replace(/\s+$/, "");
        lines.push(cur);
        cur = [];
        curW = 0;
        if (/^\s+$/.test(word.text)) continue;
      }
      const lastSeg = cur[cur.length - 1];
      if (lastSeg && lastSeg.font === word.font) lastSeg.text += word.text;
      else cur.push({ text: word.text, font: word.font });
      curW += word.w;
    }
    lines.push(cur);
    return lines;
  };

  let page = pdf.addPage([W, H]);
  let y = H - margin;

  const newPage = () => {
    page = pdf.addPage([W, H]);
    y = H - margin;
  };

  for (const b of blocks) {
    if (b.type === "pagebreak") {
      newPage();
      continue;
    }
    const st = STYLES[b.type];
    const indent = b.type === "li" ? 16 : 0;
    const lineHeight = st.size * 1.45;
    const lines = wrap(b.runs, st.size, !!st.bold, !!st.mono, maxW - indent);
    y -= st.before;
    for (const line of lines) {
      if (y - lineHeight < margin) newPage();
      let x = margin + indent;
      if (b.type === "li" && line === lines[0]) {
        page.drawText("•", { x: margin, y: y - st.size, size: st.size, font, color: rgb(0.25, 0.25, 0.35) });
      }
      for (const seg of line) {
        if (!seg.text) continue;
        page.drawText(seg.text, { x, y: y - st.size, size: st.size, font: seg.font, color: rgb(0.12, 0.13, 0.2) });
        x += seg.font.widthOfTextAtSize(seg.text, st.size);
      }
      y -= lineHeight;
    }
    y -= st.after;
  }

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}

/* --------------------------- DOCX -------------------------------- */

async function renderDocx(blocks: Block[], filename: string): Promise<Buffer> {
  const docx = await import("docx");
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak } = docx;

  const toRuns = (runs: Run[]): InstanceType<typeof TextRun>[] => {
    const out: InstanceType<typeof TextRun>[] = [];
    for (const r of runs) {
      const parts = r.text.split("\n");
      parts.forEach((part, i) => {
        out.push(
          new TextRun({
            text: part,
            bold: r.bold,
            italics: r.italic,
            font: r.code ? "Courier New" : undefined,
            break: i > 0 ? 1 : undefined,
          }),
        );
      });
    }
    return out.length ? out : [new TextRun({ text: "" })];
  };

  const children: Array<InstanceType<typeof Paragraph>> = [];
  for (const b of blocks) {
    switch (b.type) {
      case "h1":
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: toRuns(b.runs) }));
        break;
      case "h2":
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: toRuns(b.runs) }));
        break;
      case "h3":
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: toRuns(b.runs) }));
        break;
      case "li":
        children.push(new Paragraph({ bullet: { level: 0 }, children: toRuns(b.runs) }));
        break;
      case "pre":
        children.push(
          new Paragraph({
            children: b.text.split("\n").map(
              (line, i) =>
                new TextRun({
                  text: line,
                  font: "Courier New",
                  size: 18,
                  break: i > 0 ? 1 : undefined,
                }),
            ),
          }),
        );
        break;
      case "pagebreak":
        children.push(new Paragraph({ children: [new PageBreak()] }));
        break;
      default:
        children.push(new Paragraph({ children: toRuns(b.runs) }));
    }
  }

  const doc = new Document({
    creator: "Transmute",
    title: filename.replace(/\.[^.]+$/, ""),
    sections: [{ properties: {}, children }],
  });
  return Packer.toBuffer(doc);
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export async function convertDoc(
  input: Buffer,
  from: string,
  to: string,
  filename: string,
  options: Record<string, string | number>,
): Promise<{ buffer: Buffer; ext: string; mime: string }> {
  let blocks: Block[];
  try {
    switch (from) {
      case "txt": blocks = plainTextToBlocks(input.toString("utf8")); break;
      case "md": blocks = await extractMd(input); break;
      case "html": blocks = htmlToBlocks(input.toString("utf8")); break;
      case "rtf": blocks = plainTextToBlocks(rtfToText(input.toString("latin1"))); break;
      case "pdf": blocks = await extractPdf(input); break;
      case "docx": blocks = await extractDocx(input); break;
      case "doc": blocks = await extractDoc(input); break;
      case "odt": blocks = await extractOpenDocument(input, "odt"); break;
      case "odp": blocks = await extractOpenDocument(input, "odp"); break;
      case "epub": blocks = await extractEpub(input); break;
      case "pptx": blocks = await extractPptx(input); break;
      default: throw new ConversionError(422, `Reading .${from} files is not supported.`);
    }
  } catch (err) {
    if (err instanceof ConversionError) throw err;
    throw new ConversionError(422, `Could not read this ${from.toUpperCase()} file — it may be corrupted or use an unsupported variant.`);
  }

  if (!blocks.some((b) => b.type !== "pagebreak")) {
    throw new ConversionError(422, "No text content could be extracted from this file.");
  }

  const title = filename.replace(/\.[^.]+$/, "");
  let buffer: Buffer;
  switch (to) {
    case "txt": buffer = await renderTxt(blocks); break;
    case "md": buffer = await renderMd(blocks); break;
    case "html": buffer = await renderHtml(blocks, title); break;
    case "rtf": buffer = await renderRtf(blocks); break;
    case "odt": buffer = await renderOdt(blocks); break;
    case "epub": buffer = await renderEpub(blocks, title); break;
    case "pdf": buffer = await renderPdf(blocks, filename, options); break;
    case "docx": buffer = await renderDocx(blocks, filename); break;
    default: throw new ConversionError(422, `Writing .${to} files is not supported.`);
  }
  return { buffer, ext: to, mime: DOC_MIME[to] ?? "application/octet-stream" };
}
