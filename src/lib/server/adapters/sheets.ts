import * as XLSX from "xlsx";
import { ConversionError } from "@/lib/server/util";

const SHEET_MIME: Record<string, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  csv: "text/csv",
  tsv: "text/tab-separated-values",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  json: "application/json",
};

function flattenValue(v: unknown): unknown {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") return JSON.stringify(v);
  return v;
}

export async function convertSheet(
  input: Buffer,
  from: string,
  to: string,
): Promise<{ buffer: Buffer; ext: string; mime: string }> {
  let workbook: XLSX.WorkBook;

  if (from === "json") {
    let rows: unknown;
    try {
      rows = JSON.parse(input.toString("utf8"));
    } catch {
      throw new ConversionError(422, "This file is not valid JSON.");
    }
    const arr = Array.isArray(rows)
      ? rows
      : rows && typeof rows === "object"
        ? [rows]
        : [];
    if (!arr.length) throw new ConversionError(422, "JSON must contain an object or a non-empty array of objects.");
    const clean = (arr as unknown[]).map((row) => {
      if (!row || typeof row !== "object") return { value: flattenValue(row) };
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(row as Record<string, unknown>)) out[k] = flattenValue(v);
      return out;
    });
    const ws = XLSX.utils.json_to_sheet(clean);
    workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws, "Data");
  } else {
    try {
      workbook = XLSX.read(input, { type: "buffer", cellDates: true });
    } catch {
      throw new ConversionError(422, `Could not read this ${from.toUpperCase()} file — it may be corrupted or password-protected.`);
    }
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName || !workbook.Sheets[sheetName]) {
    throw new ConversionError(422, "The workbook contains no worksheets.");
  }
  const ws = workbook.Sheets[sheetName];

  let buffer: Buffer;
  let text = "";
  switch (to) {
    case "json": {
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });
      text = JSON.stringify(rows, null, 2);
      buffer = Buffer.from(text, "utf8");
      break;
    }
    case "csv":
      text = XLSX.utils.sheet_to_csv(ws, { FS: "," });
      buffer = Buffer.from(text.replace(/\r?\n$/, ""), "utf8");
      break;
    case "tsv":
      text = XLSX.utils.sheet_to_csv(ws, { FS: "\t" });
      buffer = Buffer.from(text.replace(/\r?\n$/, ""), "utf8");
      break;
    case "xlsx":
      buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
      break;
    case "xls":
      buffer = XLSX.write(workbook, { bookType: "biff8", type: "buffer" }) as Buffer;
      break;
    case "ods":
      buffer = XLSX.write(workbook, { bookType: "ods", type: "buffer" }) as Buffer;
      break;
    default:
      throw new ConversionError(422, `Unsupported spreadsheet output: ${to}`);
  }
  return { buffer, ext: to, mime: SHEET_MIME[to] };
}
