import { parse as yamlParse, stringify as yamlStringify } from "yaml";
import { XMLParser } from "fast-xml-parser";
import { ConversionError } from "@/lib/server/util";

/* ================================================================== */
/* Subtitles: SRT ⇄ VTT ⇄ TXT                                          */
/* ================================================================== */

interface Cue {
  startMs: number;
  endMs: number;
  text: string;
}

const TIME_RE = /(\d{1,2}:)?(\d{1,2}):(\d{2})[.,](\d{1,3})/;

function parseTime(s: string): number {
  const m = TIME_RE.exec(s);
  if (!m) return NaN;
  const h = m[1] ? parseInt(m[1]) : 0;
  const min = parseInt(m[2]);
  const sec = parseInt(m[3]);
  const ms = parseInt(m[4].padEnd(3, "0"));
  return ((h * 60 + min) * 60 + sec) * 1000 + ms;
}

function formatTime(ms: number, decimal: "," | "."): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const milli = ms % 1000;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}${decimal}${String(milli).padStart(3, "0")}`;
}

function parseCues(text: string, allowHeader: boolean): Cue[] {
  const cleaned = text.replace(/\r\n?/g, "\n").replace(/^\uFEFF/, "");
  const blocks = cleaned.split(/\n{2,}/);
  const cues: Cue[] = [];
  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.trim().length > 0);
    if (!lines.length) continue;
    if (allowHeader && /^(WEBVTT|NOTE|STYLE|REGION)\b/.test(lines[0])) continue;
    const timeIdx = lines.findIndex((l) => /\s*-->\s*/.test(l));
    if (timeIdx === -1) continue;
    const [rawStart, rawEnd] = lines[timeIdx].split("-->");
    const startMs = parseTime(rawStart ?? "");
    const endMs = parseTime((rawEnd ?? "").split(/\s+/).filter(Boolean)[0] ?? "");
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) continue;
    const body = lines.slice(timeIdx + 1).join("\n").trim();
    if (body) cues.push({ startMs, endMs, text: body });
  }
  if (!cues.length) throw new ConversionError(422, "No subtitle cues could be parsed from this file.");
  return cues;
}

export function convertSubtitle(input: Buffer, to: string): { buffer: Buffer; ext: string; mime: string } {
  const text = input.toString("utf8");
  const cues = parseCues(text, true);

  if (to === "txt") {
    return { buffer: Buffer.from(cues.map((c) => c.text).join("\n\n"), "utf8"), ext: "txt", mime: "text/plain" };
  }
  if (to === "vtt") {
    const body = cues
      .map((c) => `${formatTime(c.startMs, ".")} --> ${formatTime(c.endMs, ".")}\n${c.text}`)
      .join("\n\n");
    return { buffer: Buffer.from(`WEBVTT\n\n${body}\n`, "utf8"), ext: "vtt", mime: "text/vtt" };
  }
  if (to === "srt") {
    const body = cues
      .map((c, i) => `${i + 1}\n${formatTime(c.startMs, ",")} --> ${formatTime(c.endMs, ",")}\n${c.text}`)
      .join("\n\n");
    return { buffer: Buffer.from(`${body}\n`, "utf8"), ext: "srt", mime: "application/x-subrip" };
  }
  throw new ConversionError(422, `Unsupported subtitle output: ${to}`);
}

/* ================================================================== */
/* Structured data: JSON ⇄ YAML ⇄ XML                                  */
/* ================================================================== */

export async function convertData(
  input: Buffer,
  from: string,
  to: string,
): Promise<{ buffer: Buffer; ext: string; mime: string }> {
  const text = input.toString("utf8");
  const MIME: Record<string, string> = {
    json: "application/json",
    yaml: "application/yaml",
    xml: "application/xml",
  };

  const toJsonValue = (): unknown => {
    try {
      if (from === "json") return JSON.parse(text);
      if (from === "yaml") return yamlParse(text);
      if (from === "xml") {
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", parseTagValue: true, trimValues: true });
        return parser.parse(text);
      }
    } catch (err) {
      if (err instanceof ConversionError) throw err;
      throw new ConversionError(422, `This file is not valid ${from.toUpperCase()}.`);
    }
    throw new ConversionError(422, `Unsupported data input: ${from}`);
  };

  let buffer: Buffer;
  if (to === "json") {
    buffer = Buffer.from(JSON.stringify(toJsonValue(), null, 2), "utf8");
  } else if (to === "yaml") {
    buffer = Buffer.from(yamlStringify(toJsonValue()), "utf8");
  } else if (to === "xml") {
    const { XMLBuilder } = await import("fast-xml-parser");
    const value = toJsonValue();
    const wrapped = Array.isArray(value)
      ? { items: { item: value } }
      : value && typeof value === "object" && Object.keys(value).length === 1 && typeof Object.keys(value)[0] === "string"
        ? value
        : { root: value };
    try {
      const builder = new XMLBuilder({ ignoreAttributes: false, attributeNamePrefix: "@_", format: true, indentBy: "  ", suppressEmptyNode: true });
      buffer = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>\n${builder.build(wrapped)}`, "utf8");
    } catch {
      throw new ConversionError(422, "This data structure cannot be represented as XML.");
    }
  } else {
    throw new ConversionError(422, `Unsupported data output: ${to}`);
  }
  return { buffer, ext: to, mime: MIME[to] };
}
