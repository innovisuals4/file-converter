"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Search } from "lucide-react";
import {
  CATEGORY_META,
  formatById,
  routesGroupedByFrom,
  tabForCategory,
  TOOL_TABS,
  STATS,
  type FormatDef,
} from "@/lib/registry";
import { ExtBadge, FormatIcon } from "@/lib/format-icons";
import { buttonClasses } from "@/components/ui";
import { cn } from "@/lib/cn";

export interface ToolDirItem {
  from: FormatDef;
  to: FormatDef;
  route: string;
}

export interface ToolGroup {
  label: string;
  items: ToolDirItem[];
}

/**
 * Build the full conversion directory from the registry: one item per
 * supported route, bucketed by input format.
 */
export function buildToolGroups(): ToolGroup[] {
  const map = new Map<string, ToolDirItem[]>();
  for (const g of routesGroupedByFrom()) {
    const fromFmt = formatById(g.from);
    if (!fromFmt) continue;
    const items: Array<ToolDirItem | null> = g.routes.map((r) => {
      const toFmt = formatById(r.to);
      if (!toFmt) return null;
      return { from: fromFmt, to: toFmt, route: `/convert/${r.from}-to-${r.to}` };
    });
    map.set(fromFmt.id, items.filter((x): x is ToolDirItem => x !== null));
  }
  const groups: ToolGroup[] = [];
  for (const [fromId, items] of map.entries()) {
    const f = formatById(fromId)!;
    groups.push({ label: CATEGORY_META[f.category].label, items });
  }
  groups.sort((a, b) => a.label.localeCompare(b.label));
  return groups;
}

/** Tab bucket for a category id. */
export function tabForFormatId(formatId: string | undefined): string {
  const f = formatId ? formatById(formatId) : null;
  if (!f) return "other";
  return tabForCategory(f.category);
}

/* ------------------------------------------------------------------ */
/* UI pieces                                                           */
/* ------------------------------------------------------------------ */

export function ToolTab({ id, label, active, onSelect }: { id: string; label: string; active: boolean; onSelect: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      aria-pressed={active}
      className={cn(
        "h-10 px-3 rounded-xl flex items-center gap-2 text-[12px] font-medium transition-all duration-300",
        active
          ? "bg-gradient-to-br from-violet-600 to-indigo-500 text-white shadow-[0_10px_28px_-8px_rgba(139,92,246,0.55)]"
          : "text-muted hover:text-ink hover:bg-surface-2/60 hover:border-brand/20",
      )}
    >
      <span className={`h-2 w-2 rounded-full ${active ? "bg-white" : "transparent"}`} />
      {label}
    </button>
  );
}

export function ToolCard({ from, to }: { from: string; to: string }) {
  const f = formatById(from);
  const t = formatById(to);
  if (!f || !t) return null;
  return (
    <a
      href={`/convert/${from}-to-${to}`}
      className={cn(
        "block rounded-xl border border-line bg-surface p-4 hover:border-brand/40 hover:shadow-[0_14px_38px_-14px_rgba(139,92,246,0.35)] transition-all duration-300",
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <FormatIcon formatId={f.id} size="sm" className="shrink-0" />
        <ArrowRightMini className="h-3.5 w-3.5 shrink-0 text-brand-strong" />
        <FormatIcon formatId={t.id} size="sm" className="shrink-0" />
      </div>
      <h3 className="mb-1 text-sm font-semibold tracking-[-0.01em] text-ink">{`${f.name} → ${t.name}`}</h3>
      <div className="flex gap-1.5 text-[10px] uppercase tracking-wider font-semibold">
        <ExtBadge formatId={from} />
        <ExtBadge formatId={to} />
      </div>
    </a>
  );
}

function ArrowRightMini({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(className)}>
      <path d="m5 12 7-7 7 7M12 5v14M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Full tools directory (page-level)                                   */
/* ------------------------------------------------------------------ */

export function ToolsDirectory({ initialCategory }: { initialCategory?: string }) {
  const [tab, setTab] = useState<string>(initialCategory ?? "all");
  const [query, setQuery] = useState("");

  const allGroups = buildToolGroups();

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const groups: ToolGroup[] = [];
    for (const g of allGroups) {
      let items = g.items;
      if (tab !== "all") {
        items = items.filter((i) => tabForFormatId(i.from.id) === tab);
      }
      if (q) {
        items = items.filter(
          (i): i is ToolDirItem =>
            !!(
              i.from.name.toLowerCase().includes(q) ||
              i.to.name.toLowerCase().includes(q) ||
              i.from.ext.some((e) => e.includes(q)) ||
              i.to.ext.some((e) => e.includes(q))
            ),
        );
      }
      if (items.length) groups.push({ ...g, items });
    }
    return groups;
  }, [allGroups, tab, query]);

  const reduce = useReducedMotion();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex max-w-[420px] items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search formats or conversions…"
            aria-label="Search conversions"
            className="w-full bg-transparent outline-none placeholder:text-faint text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {TOOL_TABS.map((t) => (
            <ToolTab
              key={t.id}
              id={t.id}
              label={t.label}
              active={tab === t.id}
              onSelect={setTab}
            />
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filteredGroups.length === 0 && (
        <div className="glass rounded-3xl p-12 text-center border border-line">
          <div className="inline-flex items-center justify-center rounded-full h-14 w-14 bg-brand-soft mb-4">
            <Search className="h-7 w-7 text-brand-strong" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-ink">No results</h3>
          <p className="text-muted">
            {query ? `“{query}”` : ""} didn’t match any supported conversion.
          </p>
          <button onClick={() => setQuery("")} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-strong hover:underline">
            Clear search
          </button>
        </div>
      )}

      {/* Groups */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {filteredGroups.map((g) => (
            <motion.div
              key={g.label}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="rounded-xl border border-line bg-surface p-5 sm:p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-gradient-to-r from-violet-500 to-sky-400" />
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">{g.label}</h3>
                <span className="ml-auto text-[11px] font-medium text-faint">{g.items.length} conversions</span>
              </div>
              <div className="grid gap-2">
                {g.items.map((item) => (
                  <ToolCard key={`${item.from.id}-to-${item.to.id}`} from={item.from.id} to={item.to.id} />
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Homepage-lite: category shortcut grid                              */
/* ------------------------------------------------------------------ */

export function ToolsCategoryShortcuts() {
  return (
    <section className="py-16 lg:pt-20 lg:pb-28 border-t border-line/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[12px] font-medium uppercase tracking-[0.14em] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet-500 to-sky-400" />
            Browse all tools
          </span>
          <h2 className="font-display text-[clamp(1.75rem,3vw,2.2rem)] font-semibold leading-[1.12] tracking-[-0.025em] text-ink">Browse every conversion</h2>
          <p className="mt-4 text-muted">
            Searchable directory of {STATS.conversions} supported format paths across {STATS.categories} categories.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          {[...TOOL_TABS].slice(1).map((t) => (
            <Link
              key={t.id}
              href={`/tools?category=${t.id}`}
              className={buttonClasses("secondary", "md")}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
