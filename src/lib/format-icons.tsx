import {
  FileText,
  Image as ImageIcon,
  Film,
  AudioLines,
  Table2,
  Presentation,
  FolderArchive,
  Type as TypeIcon,
  Captions,
  Braces,
  Code2,
} from "lucide-react";
import { formatById } from "@/lib/registry";

/**
 * Per-tint styling. Static class strings so Tailwind can see them.
 * Tuned to read well on both dark and light surfaces.
 */
const TINTS: Record<string, { tile: string; fg: string }> = {
  rose: { tile: "from-rose-500/20 to-rose-500/5 border-rose-500/25", fg: "text-rose-500 dark:text-rose-300" },
  blue: { tile: "from-blue-500/20 to-blue-500/5 border-blue-500/25", fg: "text-blue-600 dark:text-blue-300" },
  slate: { tile: "from-slate-500/20 to-slate-500/5 border-slate-500/25", fg: "text-slate-600 dark:text-slate-300" },
  indigo: { tile: "from-indigo-500/20 to-indigo-500/5 border-indigo-500/25", fg: "text-indigo-500 dark:text-indigo-300" },
  orange: { tile: "from-orange-500/20 to-orange-500/5 border-orange-500/25", fg: "text-orange-500 dark:text-orange-300" },
  amber: { tile: "from-amber-500/20 to-amber-500/5 border-amber-500/25", fg: "text-amber-600 dark:text-amber-300" },
  violet: { tile: "from-violet-500/20 to-violet-500/5 border-violet-500/25", fg: "text-violet-600 dark:text-violet-300" },
  sky: { tile: "from-sky-500/20 to-sky-500/5 border-sky-500/25", fg: "text-sky-600 dark:text-sky-300" },
  emerald: { tile: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/25", fg: "text-emerald-600 dark:text-emerald-300" },
  fuchsia: { tile: "from-fuchsia-500/20 to-fuchsia-500/5 border-fuchsia-500/25", fg: "text-fuchsia-500 dark:text-fuchsia-300" },
  cyan: { tile: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/25", fg: "text-cyan-600 dark:text-cyan-300" },
  yellow: { tile: "from-yellow-500/20 to-yellow-500/5 border-yellow-500/25", fg: "text-yellow-600 dark:text-yellow-300" },
  lime: { tile: "from-lime-500/20 to-lime-500/5 border-lime-500/25", fg: "text-lime-600 dark:text-lime-300" },
  stone: { tile: "from-stone-500/20 to-stone-500/5 border-stone-500/25", fg: "text-stone-600 dark:text-stone-300" },
  teal: { tile: "from-teal-500/20 to-teal-500/5 border-teal-500/25", fg: "text-teal-600 dark:text-teal-300" },
};

export function tintClasses(tint: string) {
  return TINTS[tint] ?? TINTS.slate;
}

interface FormatIconProps {
  /** A format id (e.g. "png"). Falls back gracefully for unknown ids. */
  formatId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: { box: "h-8 w-8 rounded-[9px]", icon: "h-4 w-4" },
  md: { box: "h-10 w-10 rounded-xl", icon: "h-5 w-5" },
  lg: { box: "h-12 w-12 rounded-[14px]", icon: "h-6 w-6" },
} as const;

export function FormatIcon({ formatId, size = "md", className = "" }: FormatIconProps) {
  const fmt = formatById(formatId);
  const tint = tintClasses(fmt?.tint ?? "slate");
  const s = SIZES[size];
  const glyph = fmt?.glyph ?? "doc";
  // Use conditional rendering to avoid "component created during render" lint false positive
  // Icon components are static references from GLYPH_ICONS, not created per-render
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center border bg-gradient-to-br ${tint.tile} ${s.box} ${className}`}
    >
      {glyph === "pdf" && <FileText className={`${tint.fg} ${s.icon}`} strokeWidth={1.75} />}
      {glyph === "doc" && <FileText className={`${tint.fg} ${s.icon}`} strokeWidth={1.75} />}
      {glyph === "image" && <ImageIcon className={`${tint.fg} ${s.icon}`} strokeWidth={1.75} />}
      {glyph === "video" && <Film className={`${tint.fg} ${s.icon}`} strokeWidth={1.75} />}
      {glyph === "audio" && <AudioLines className={`${tint.fg} ${s.icon}`} strokeWidth={1.75} />}
      {glyph === "sheet" && <Table2 className={`${tint.fg} ${s.icon}`} strokeWidth={1.75} />}
      {glyph === "slide" && <Presentation className={`${tint.fg} ${s.icon}`} strokeWidth={1.75} />}
      {glyph === "archive" && <FolderArchive className={`${tint.fg} ${s.icon}`} strokeWidth={1.75} />}
      {glyph === "font" && <TypeIcon className={`${tint.fg} ${s.icon}`} strokeWidth={1.75} />}
      {glyph === "subtitle" && <Captions className={`${tint.fg} ${s.icon}`} strokeWidth={1.75} />}
      {glyph === "data" && <Braces className={`${tint.fg} ${s.icon}`} strokeWidth={1.75} />}
      {glyph === "code" && <Code2 className={`${tint.fg} ${s.icon}`} strokeWidth={1.75} />}
      {/* Fallback */}
      {!["pdf", "doc", "image", "video", "audio", "sheet", "slide", "archive", "font", "subtitle", "data", "code"].includes(glyph) && (
        <FileText className={`${tint.fg} ${s.icon}`} strokeWidth={1.75} />
      )}
    </span>
  );
}

/** Small monospace extension label, e.g. "PDF". */
export function ExtBadge({ formatId, className = "" }: { formatId: string; className?: string }) {
  const fmt = formatById(formatId);
  const tint = tintClasses(fmt?.tint ?? "slate");
  return (
    <span
      className={`inline-flex items-center rounded-md border bg-gradient-to-br px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${tint.tile} ${tint.fg} ${className}`}
    >
      {fmt?.ext[0] ?? formatId}
    </span>
  );
}
