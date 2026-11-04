import { FORMATS, type FormatDef } from "@/lib/registry";

export function fmtBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "—";
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB"];
  let value = n / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value >= 100 ? Math.round(value) : value.toFixed(value >= 10 ? 1 : 2)} ${units[unit]}`;
}

export function findFormatByExt(filename: string): FormatDef | undefined {
  const ext = (filename.split(".").pop() ?? "").toLowerCase();
  if (!ext) return undefined;
  return FORMATS.find((f) => f.ext.includes(ext));
}

export function baseName(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts.slice(0, -1).join(".") : name;
}
