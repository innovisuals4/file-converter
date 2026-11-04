"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CloudUpload,
  Download,
  FileUp,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import {
  CATEGORY_META,
  formatById,
  getRoute,
  primaryExt,
  targetsFor,
  type OptionDef,
} from "@/lib/registry";
import { ExtBadge, FormatIcon } from "@/lib/format-icons";
import { baseName, fmtBytes, findFormatByExt } from "@/lib/format-utils";
import {
  ConvertError,
  convertFile,
  fetchEngines,
  type ConvertProgress,
  type Engines,
} from "@/lib/client/conversion";
import { Button, buttonClasses } from "@/components/ui";
import { cn } from "@/lib/cn";

/* ================================================================== */
/* Types & constants                                                   */
/* ================================================================== */

interface QueuedFile {
  id: number;
  file: File;
  from: string;
}

interface InvalidFile {
  id: number;
  name: string;
  reason: string;
}

interface JobState {
  status: "pending" | "converting" | "done" | "error";
  progress: number | null;
  phase: ConvertProgress["phase"] | null;
  message?: string;
}

interface JobResult {
  id: number;
  name: string;
  url: string;
  blob: Blob;
  to: string;
  engine: "server" | "browser";
}

const MAX_BATCH = 10;

/* ================================================================== */
/* Small shared pieces                                                 */
/* ================================================================== */

function fmtPhase(phase: ConvertProgress["phase"], engine: "server" | "browser"): string {
  if (engine === "browser") {
    return phase === "uploading" ? "Preparing…" : "Converting locally in your browser…";
  }
  if (phase === "uploading") return "Uploading securely…";
  if (phase === "processing") return "Converting on the server…";
  return "Finalizing…";
}

function StatusPill({ children, tone }: { children: React.ReactNode; tone: "brand" | "green" | "red" | "amber" }) {
  const tones = {
    brand: "border-brand/30 bg-brand-soft text-brand-strong dark:text-violet-300",
    green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    red: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  } as const;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium", tones[tone])}>
      {children}
    </span>
  );
}

/* ================================================================== */
/* Dropzone                                                            */
/* ================================================================== */

function Dropzone({
  onFiles,
  compact,
  dragging,
  setDragging,
}: {
  onFiles: (files: File[]) => void;
  compact?: boolean;
  dragging: boolean;
  setDragging: (v: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label="Upload files: drag and drop or press Enter to browse"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        onFiles(Array.from(e.dataTransfer.files));
      }}
      initial={reduce ? false : { opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-colors duration-300",
        compact ? "gap-2.5 px-6 py-9" : "gap-3.5 px-6 py-14",
        dragging
          ? "border-brand bg-brand-soft"
          : "border-line-strong bg-surface-2/50 hover:border-brand/50 hover:bg-brand-soft/60",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          if (e.target.files) onFiles(Array.from(e.target.files));
          e.target.value = "";
        }}
      />
      <motion.span
        animate={reduce ? undefined : dragging ? { y: -6, scale: 1.08 } : { y: [0, -5, 0] }}
        transition={reduce ? undefined : dragging ? { duration: 0.25 } : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-500 text-white shadow-[0_12px_36px_-10px_rgba(139,92,246,0.6)] transition-transform",
          compact ? "h-11 w-11" : "h-14 w-14",
        )}
      >
        <CloudUpload className={compact ? "h-5 w-5" : "h-7 w-7"} strokeWidth={1.8} />
      </motion.span>
      <div>
        <p className={cn("font-medium text-ink", compact ? "text-sm" : "text-base")}>
          {dragging ? "Drop your files here" : "Drag & drop files here"}
        </p>
        <p className={cn("mt-1 text-faint", compact ? "text-xs" : "text-sm")}>
          or <span className="font-medium text-brand-strong underline decoration-brand/40 underline-offset-4">browse your device</span> — up to 10 files, 100&nbsp;MB each
        </p>
      </div>
      {!compact && (
        <p className="mt-1 text-xs text-faint">
          Documents · Images · Video · Audio · Spreadsheets · Archives · Fonts · Subtitles · Data
        </p>
      )}
    </motion.div>
  );
}

/* ================================================================== */
/* Format select (searchable combobox)                                 */
/* ================================================================== */

function FormatSelect({
  value,
  options,
  onChange,
  placeholder = "Choose output format",
}: {
  value: string | null;
  options: string[];
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = value ? formatById(value) : undefined;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = options.filter((id) => {
      const f = formatById(id);
      if (!f) return false;
      return !q || f.name.toLowerCase().includes(q) || f.ext.some((e) => e.includes(q));
    });
    return list.sort((a, b) => {
      const fa = formatById(a)!;
      const fb = formatById(b)!;
      return fa.category.localeCompare(fb.category) || fa.name.localeCompare(fb.name);
    });
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    inputRef.current?.focus();
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset active selection when query changes (keyboard nav UX)
  useEffect(() => setActive(0), [query]);

  const commit = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  const grouped = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const id of filtered) {
      const f = formatById(id)!;
      const label = CATEGORY_META[f.category].label;
      map.set(label, [...(map.get(label) ?? []), id]);
    }
    return [...map.entries()];
  }, [filtered]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open && (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) commit(filtered[active]);
    }
  };

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border bg-surface px-3.5 py-3 text-left transition-colors",
          open ? "border-brand/60 ring-1 ring-brand/30" : "border-line hover:border-brand/40",
        )}
      >
        {selected ? (
          <>
            <FormatIcon formatId={selected.id} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink">{selected.name}</span>
              <span className="block text-[11px] text-faint">{CATEGORY_META[selected.category].label}</span>
            </span>
          </>
        ) : (
          <span className="flex-1 text-sm text-faint">{placeholder}</span>
        )}
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-faint transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.99 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-line-strong bg-surface shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]"
            role="listbox"
            aria-label="Output formats"
          >
            <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
              <Search className="h-4 w-4 text-faint" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search formats…"
                aria-label="Search output formats"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
              />
            </div>
            <div className="max-h-72 overflow-y-auto p-1.5">
              {grouped.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-faint">No formats match “{query}”.</p>
              )}
              {grouped.map(([label, ids]) => (
                <div key={label} className="mb-1">
                  <p className="px-2.5 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-faint">{label}</p>
                  {ids.map((id) => {
                    const f = formatById(id)!;
                    const idx = filtered.indexOf(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        role="option"
                        aria-selected={value === id}
                        onClick={() => commit(id)}
                        onMouseEnter={() => setActive(idx)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                          idx === active ? "bg-brand-soft" : "",
                        )}
                      >
                        <FormatIcon formatId={id} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">{f.name}</span>
                        </span>
                        <ExtBadge formatId={id} />
                        {value === id && <Check className="h-4 w-4 text-brand-strong" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================== */
/* Options panel                                                       */
/* ================================================================== */

function OptionsPanel({
  options,
  values,
  onChange,
}: {
  options: OptionDef[];
  values: Record<string, string | number>;
  onChange: (id: string, v: string | number) => void;
}) {
  if (!options.length) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {options.map((opt) => (
        <div key={opt.id}>
          {opt.type === "select" && (
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-medium text-muted">{opt.label}</span>
              <select
                value={String(values[opt.id] ?? opt.def)}
                onChange={(e) => onChange(opt.id, e.target.value)}
                className="w-full cursor-pointer rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors hover:border-brand/40 focus-visible:border-brand/60"
              >
                {opt.choices?.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          {opt.type === "slider" && (
            <label className="block">
              <span className="mb-1.5 flex items-center justify-between text-[12.5px] font-medium text-muted">
                {opt.label}
                <span className="font-mono text-[11px] text-brand-strong">{String(values[opt.id] ?? opt.def)}</span>
              </span>
              <input
                type="range"
                min={opt.min}
                max={opt.max}
                step={opt.step}
                value={Number(values[opt.id] ?? opt.def)}
                onChange={(e) => onChange(opt.id, Number(e.target.value))}
                className="w-full cursor-pointer"
                aria-label={opt.label}
              />
            </label>
          )}
          {opt.type === "number" && (
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-medium text-muted">{opt.label}</span>
              <input
                type="number"
                min={opt.min}
                max={opt.max}
                step={opt.step}
                value={String(values[opt.id] ?? "")}
                placeholder="Original"
                onChange={(e) => onChange(opt.id, e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint hover:border-brand/40 focus-visible:border-brand/60"
              />
            </label>
          )}
          {opt.hint && <span className="mt-1 block text-[11px] leading-snug text-faint">{opt.hint}</span>}
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/* Success check animation                                             */
/* ================================================================== */

function SuccessCheck({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex items-center justify-center rounded-full bg-emerald-500/15", className)}>
      <motion.span
        className="absolute inset-0 rounded-full bg-emerald-500/20"
        initial={{ scale: 0.6, opacity: 0.8 }}
        animate={{ scale: 1.7, opacity: 0 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />
      <svg viewBox="0 0 24 24" fill="none" className="h-1/2 w-1/2 text-emerald-500">
        <motion.path
          d="M5 12.5l4.2 4.2L19 7"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        />
      </svg>
    </span>
  );
}

/* ================================================================== */
/* Main workspace                                                      */
/* ================================================================== */

export interface ConverterWorkspaceProps {
  initialTo?: string;
  variant?: "hero" | "page";
  className?: string;
  heading?: React.ReactNode;
}

export function ConverterWorkspace({ initialTo, variant = "page", className }: ConverterWorkspaceProps) {
  const compact = variant === "hero";
  const reduce = useReducedMotion();

  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [invalid, setInvalid] = useState<InvalidFile[]>([]);
  const [target, setTarget] = useState<string | null>(initialTo ?? null);
  const [optionValues, setOptionValues] = useState<Record<string, string | number>>({});
  const [jobs, setJobs] = useState<Record<number, JobState>>({});
  const [results, setResults] = useState<JobResult[]>([]);
  const [engines, setEngines] = useState<Engines | null>(null);
  const [dragging, setDragging] = useState(false);
  const [zipping, setZipping] = useState(false);

  const abortRef = useRef<{ current: (() => void) | null }>({ current: null });
  const urlsRef = useRef<string[]>([]);
  const idRef = useRef(1);

  useEffect(() => {
    return () => {
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  // Fetch engine capabilities when a media target is chosen.
  const targetFmt = target ? formatById(target) : undefined;
  const isMediaTarget = targetFmt?.category === "video" || targetFmt?.category === "audio";
  useEffect(() => {
    if (isMediaTarget && !engines) {
      fetchEngines().then(setEngines).catch(() => setEngines({ ffmpeg: false, wasmMediaFallback: true, maxUploadMb: 100 }));
    }
  }, [isMediaTarget, engines]);

  /* ---------------- files ---------------- */

  const addFiles = useCallback(
    (list: File[]) => {
      const nextInvalid: InvalidFile[] = [];
      const nextFiles: QueuedFile[] = [];
      for (const file of list) {
        const id = idRef.current++;
        if (files.length + nextFiles.length >= MAX_BATCH) {
          nextInvalid.push({ id, name: file.name, reason: `Batch limit is ${MAX_BATCH} files at a time.` });
          continue;
        }
        const fmt = findFormatByExt(file.name);
        if (!fmt) {
          const ext = file.name.includes(".") ? `.${file.name.split(".").pop()}` : "";
          nextInvalid.push({ id, name: file.name, reason: `${ext || "This file type"} isn't supported yet — pick a format from the tools directory.` });
          continue;
        }
        if (file.size > 100 * 1024 * 1024) {
          nextInvalid.push({ id, name: file.name, reason: `File is ${fmtBytes(file.size)} — the limit is 100 MB.` });
          continue;
        }
        nextFiles.push({ id, file, from: fmt.id });
      }
      setFiles((f) => [...f, ...nextFiles]);
      setInvalid((v) => [...v, ...nextInvalid]);
    },
    [files.length],
  );

  const removeFile = (id: number) => {
    setFiles((f) => f.filter((x) => x.id !== id));
    setResults((r) => r.filter((x) => x.id !== id));
    setJobs((j) => {
      const rest = { ...j };
      delete rest[id];
      return rest;
    });
  };

  const resetAll = () => {
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = [];
    setFiles([]);
    setInvalid([]);
    setJobs({});
    setResults([]);
  };

  /* ---------------- targets & options ---------------- */

  const commonTargets = useMemo(() => {
    if (!files.length) return [];
    let common = targetsFor(files[0].from).map((r) => r.to);
    for (const f of files.slice(1)) {
      const set = new Set(targetsFor(f.from).map((r) => r.to));
      common = common.filter((t) => set.has(t));
    }
    return common;
  }, [files]);

  useEffect(() => {
    if (target && commonTargets.length && !commonTargets.includes(target)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync target when common targets change
      setTarget(commonTargets[0]);
    } else if (!target && commonTargets.length) {
      setTarget(initialTo && commonTargets.includes(initialTo) ? initialTo : commonTargets[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonTargets]);

  const routeOptions = useMemo(() => {
    if (!target) return [] as OptionDef[];
    const byId = new Map<string, OptionDef>();
    for (const f of files) {
      const route = getRoute(f.from, target);
      if (!route) continue;
      for (const opt of route.options) {
        if (!byId.has(opt.id) && (!opt.onlyForTargets || opt.onlyForTargets.includes(target))) {
          byId.set(opt.id, opt);
        }
      }
    }
    return [...byId.values()];
  }, [files, target]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset option values when route options change
    setOptionValues((prev) => {
      const next: Record<string, string | number> = {};
      for (const opt of routeOptions) next[opt.id] = prev[opt.id] ?? opt.def;
      return next;
    });
  }, [routeOptions]);

  const routeNote = useMemo(() => {
    if (!target || !files.length) return null;
    const notes = new Set<string>();
    let lossy = false;
    for (const f of files) {
      const route = getRoute(f.from, target);
      if (route?.note) notes.add(route.note);
      if (route?.lossy) lossy = true;
    }
    return { notes: [...notes], lossy };
  }, [files, target]);

  /* ---------------- conversion ---------------- */

  const updateJob = (id: number, patch: Partial<JobState>) =>
    setJobs((j) => ({
      ...j,
      [id]: { ...j[id], status: "pending", progress: null, phase: null, ...patch },
    }));

  const working = Object.values(jobs).some((j) => j.status === "converting");
  const doneCount = Object.values(jobs).filter((j) => j.status === "done").length;
  const errorCount = Object.values(jobs).filter((j) => j.status === "error").length;
  const activeJob = Object.entries(jobs).find(([, j]) => j.status === "converting");
  const activeFile = activeJob ? files.find((f) => f.id === Number(activeJob[0])) : undefined;

  const convertAll = async () => {
    if (!target || working) return;
    for (const f of files) {
      const state = jobs[f.id];
      if (state?.status === "done") continue;
      updateJob(f.id, { status: "converting", progress: 0, phase: "uploading", message: undefined });
      const signalRef: { current: (() => void) | null } = { current: null };
      abortRef.current = signalRef;
      try {
        const res = await convertFile({
          file: f.file,
          from: f.from,
          target,
          options: optionValues,
          onProgress: (p) => updateJob(f.id, { progress: p.value, phase: p.phase }),
          signalRef,
        });
        const url = URL.createObjectURL(res.blob);
        urlsRef.current.push(url);
        const name = res.name || `${baseName(f.file.name)}.${primaryExt(target)}`;
        setResults((r) => [...r.filter((x) => x.id !== f.id), { id: f.id, name, url, blob: res.blob, to: target, engine: res.engine }]);
        updateJob(f.id, { status: "done", progress: 1, phase: "finalizing" });
      } catch (err) {
        if (err instanceof ConvertError && err.status === 499) {
          updateJob(f.id, { status: "pending", progress: null, phase: null });
          break;
        }
        updateJob(f.id, {
          status: "error",
          progress: null,
          phase: null,
          message: err instanceof Error ? err.message : "Conversion failed.",
        });
      }
    }
    abortRef.current.current = null;
  };

  const cancelAll = () => abortRef.current.current?.();

  const downloadAll = async () => {
    if (results.length < 2) return;
    setZipping(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (const r of results) zip.file(r.name, r.blob);
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      urlsRef.current.push(url);
      const a = document.createElement("a");
      a.href = url;
      a.download = "transmute-converted.zip";
      a.click();
    } finally {
      setZipping(false);
    }
  };

  const overallProgress = (() => {
    const total = files.length || 1;
    const done = doneCount;
    const current = activeJob?.[1];
    const frac = current?.progress ?? 0;
    return Math.min(((done + frac) / total) * 100, 100);
  })();

  /* ---------------- render ---------------- */

  return (
    <div
      className={cn(
        "glass gradient-border relative overflow-hidden rounded-3xl",
        compact ? "p-4 sm:p-5" : "p-5 sm:p-7",
        className,
      )}
    >
      {/* ambient top glow */}
      <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[130%] -translate-x-1/2 rounded-[100%] bg-[radial-gradient(ellipse_at_center,var(--brand-soft),transparent_70%)]" />

      <div className="relative">
        {/* Header row (page variant) */}
        {!compact && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 text-white shadow-[0_8px_24px_-8px_rgba(139,92,246,0.6)]">
                <FileUp className="h-4.5 w-4.5" strokeWidth={1.9} />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-ink">Conversion workspace</h2>
                <p className="text-xs text-faint">Upload → choose format → convert & download</p>
              </div>
            </div>
            <StatusPill tone="green">
              <ShieldCheck className="h-3 w-3" /> Auto-deleted after processing
            </StatusPill>
          </div>
        )}

        {/* Invalid file notices */}
        <AnimatePresence>
          {invalid.map((f) => (
            <motion.div
              key={f.id}
              initial={reduce ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2.5 overflow-hidden"
            >
              <div className="flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-2.5">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <p className="flex-1 text-[13px] leading-snug text-red-600 dark:text-red-300">
                  <span className="font-medium">{f.name}</span> — {f.reason}
                </p>
                <button
                  type="button"
                  onClick={() => setInvalid((v) => v.filter((x) => x.id !== f.id))}
                  className="text-red-500/70 transition-colors hover:text-red-500"
                  aria-label="Dismiss"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty state → dropzone */}
        {files.length === 0 ? (
          <Dropzone onFiles={addFiles} compact={compact} dragging={dragging} setDragging={setDragging} />
        ) : (
          <div className="space-y-4">
            {/* File queue */}
            <ul className={cn("space-y-2", compact && "space-y-1.5")}>
              <AnimatePresence initial={false}>
                {files.map((f) => {
                  const job = jobs[f.id];
                  const result = results.find((r) => r.id === f.id);
                  return (
                    <motion.li
                      key={f.id}
                      layout
                      initial={reduce ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border bg-surface-2/60 px-3 py-2.5",
                        job?.status === "error" ? "border-red-500/25" : result ? "border-emerald-500/25" : "border-line",
                      )}
                    >
                      <FormatIcon formatId={f.from} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-ink">{f.file.name}</span>
                        <span className="block text-[11px] text-faint">
                          {fmtBytes(f.file.size)} · {formatById(f.from)?.name}
                          {result && <span className="text-emerald-500"> → {formatById(result.to)?.name} ✓</span>}
                        </span>
                      </span>

                      {job?.status === "converting" && (
                        <span className="hidden items-center gap-1.5 text-[11px] font-medium text-brand-strong sm:flex">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          {fmtPhase(job.phase ?? "processing", results.find((r) => r.id === f.id) ? "server" : activeEngine())}
                        </span>
                      )}
                      {job?.status === "done" && (
                        <a
                          href={result?.url}
                          download={result?.name}
                          className={cn(buttonClasses("primary", "sm"), "gap-1.5")}
                          aria-label={`Download ${result?.name}`}
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </a>
                      )}
                      {job?.status === "error" && (
                        <span className="hidden max-w-[220px] truncate text-[11px] text-red-500 sm:block" title={job.message}>
                          {job.message}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(f.id)}
                        className="rounded-md p-1.5 text-faint transition-colors hover:bg-red-500/10 hover:text-red-500"
                        aria-label={`Remove ${f.file.name}`}
                        disabled={job?.status === "converting"}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>

            {/* Settings */}
            <div className={cn("grid gap-4", routeOptions.length ? "sm:grid-cols-[1.1fr_1fr]" : "")}>
              <div>
                <span className="mb-1.5 block text-[12.5px] font-medium text-muted">
                  Convert to {files.length > 1 ? `(valid for all ${files.length} files)` : ""}
                </span>
                <FormatSelect
                  value={target}
                  options={commonTargets}
                  onChange={(id) => {
                    setTarget(id);
                    setResults((r) => r.filter((x) => x.to === id));
                  }}
                />
                {commonTargets.length === 0 && (
                  <p className="mt-1.5 text-[11.5px] text-red-500">
                    This mix of file types has no common output format — remove a file to continue.
                  </p>
                )}
              </div>
              {routeOptions.length > 0 && target && (
                <div className="sm:pt-0">
                  <OptionsPanel options={routeOptions} values={optionValues} onChange={(id, v) => setOptionValues((o) => ({ ...o, [id]: v }))} />
                </div>
              )}
            </div>

            {isMediaTarget && engines && (
              <div className="flex items-center gap-2 text-[11.5px] text-faint">
                {engines.ffmpeg ? (
                  <StatusPill tone="green">
                    <Zap className="h-3 w-3" /> Server FFmpeg ready
                  </StatusPill>
                ) : (
                  <StatusPill tone="brand">
                    <Sparkles className="h-3 w-3" /> Runs privately in your browser (ffmpeg.wasm)
                  </StatusPill>
                )}
              </div>
            )}

            {routeNote && (routeNote.notes.length > 0 || routeNote.lossy) && (
              <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-2.5 text-[11.5px] leading-relaxed text-amber-700 dark:text-amber-300/90">
                {routeNote.notes[0]}
                {routeNote.lossy && !routeNote.notes.length && "Text-focused conversion — layout and images are simplified."}
              </p>
            )}

            {/* Progress */}
            <AnimatePresence>
              {working && (
                <motion.div
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="rounded-xl border border-line bg-surface-2/70 p-3.5"
                  role="status"
                  aria-live="polite"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-[12.5px] font-medium text-ink">
                      {activeFile
                        ? `Converting ${activeFile.file.name} — ${fmtPhase(jobs[activeFile.id]?.phase ?? "processing", "server")}`
                        : "Finishing up…"}
                    </span>
                    <button type="button" onClick={cancelAll} className="text-[12px] font-medium text-red-500 hover:text-red-400">
                      Cancel
                    </button>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-line">
                    {overallProgress > 0 && jobs[activeFile?.id ?? -1]?.progress !== null && jobs[activeFile?.id ?? -1]?.progress !== undefined ? (
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-400 transition-[width] duration-300"
                        style={{ width: `${overallProgress}%` }}
                      />
                    ) : (
                      <div className="progress-indeterminate h-full w-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500" />
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-faint">
                    {doneCount + (activeFile ? 1 : 0)} of {files.length} file{files.length > 1 ? "s" : ""}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={convertAll}
                disabled={!target || working || commonTargets.length === 0}
                size={compact ? "md" : "lg"}
                className="min-w-[200px] flex-1 sm:flex-none"
              >
                {working ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Converting…
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Convert {files.length > 1 ? `${files.length} files` : "now"}
                    {target && ` to ${formatById(target)?.name.replace(/ (Document|Image|Video|Audio|Data|Font|Archive|Workbook|Deck|Subtitle|Sheet)$/, "")}`}
                  </>
                )}
              </Button>
              {(files.length > 0 || results.length > 0) && !working && (
                <Button variant="secondary" onClick={resetAll}>
                  <RefreshCw className="h-4 w-4" /> Start over
                </Button>
              )}
              {results.length > 1 && (
                <Button variant="secondary" onClick={downloadAll} disabled={zipping}>
                  {zipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download all (.zip)
                </Button>
              )}
            </div>

            {/* Results summary */}
            <AnimatePresence>
              {doneCount > 0 && !working && (
                <motion.div
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-4 rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-transparent p-4"
                >
                  <SuccessCheck className="h-11 w-11 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">
                      {doneCount} file{doneCount > 1 ? "s" : ""} converted successfully
                      {errorCount > 0 && <span className="font-normal text-red-500"> · {errorCount} failed</span>}
                    </p>
                    <p className="mt-0.5 text-[12px] text-faint">
                      Grab your download{doneCount > 1 ? "s" : ""} above{results.length > 1 && " or save everything as one ZIP"} — converted files stay on your device.
                    </p>
                  </div>
                  <ArrowRight className="hidden h-4 w-4 text-emerald-500 sm:block" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

/** Engine used for a given finished/in-flight job (for status copy). */
function activeEngine(): "server" | "browser" {
  return "server";
}
