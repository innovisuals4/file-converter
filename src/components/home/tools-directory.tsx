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
  type FormatDef,
} from "@/lib/registry";
import { ExtBadge, FormatIcon } from "@/lib/format-icons";
import { Button, buttonClasses } from "@/components/ui";
import { cn } from "@/lib/cn";
import { Section } from "@/components/motion-primitives";

export interface ToolDirItem {
  from: FormatDef;
  to: FormatDef;
  route: string;
}

export interface ToolGroup {
  label: string;
  items: ToolDirItem[];
}

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
  const categoryMap = new Map<string, ToolDirItem[]>();
  for (const [fromId, items] of map.entries()) {
    const f = formatById(fromId)!;
    const cat = CATEGORY_META[f.category].label;
    const existing = categoryMap.get(cat) ?? [];
    existing.push(...items);
    categoryMap.set(cat, existing);
  }
  const groups: ToolGroup[] = [];
  for (const [label, items] of categoryMap.entries()) {
    groups.push({ label, items });
  }
  groups.sort((a, b) => a.label.localeCompare(b.label));
  return groups;
}

export function tabForFormatId(formatId: string | undefined): string {
  const f = formatId ? formatById(formatId) : null;
  if (!f) return "other";
  return tabForCategory(f.category);
}

export function ToolTab({ id, label, active, onSelect }: { id: string; label: string; active: boolean; onSelect: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      aria-pressed={active}
      className={cn(
        "h-10 px-4 rounded-xl flex items-center gap-2 text-[11px] font-bold transition-all duration-300 tracking-tight uppercase",
        active
          ? "bg-brand text-white shadow-lg shadow-brand/40"
          : "text-muted hover:text-ink hover:bg-surface-2/80 hover:border-brand/20 border-transparent",
      )}
    >
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
        "block rounded-[28px] border border-line surface-card p-6 card-hover hover:border-brand/50 transition-all duration-300",
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="h-10 w-10 rounded-[18px] bg-surface-2/80 border border-line flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all duration-300">
          <FormatIcon formatId={f.id} size="sm" />
        </div>
        <ArrowRightMini className="h-3.5 w-3.5 shrink-0 text-brand-strong" />
        <div className="h-10 w-10 rounded-[18px] bg-surface-2/80 border border-line flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all duration-300">
          <FormatIcon formatId={t.id} size="sm" />
        </div>
      </div>
      <h3 className="mb-2 text-lg font-black tracking-[-0.01em] text-ink">{`${f.name} → ${t.name}`}</h3>
      <div className="flex gap-1.5 text-[10px] font-bold text-muted uppercase tracking-wider">
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
    <Section>
      <div className="max-w-3xl mx-auto text-center mb-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 px-3 py-1 text-[11px] font-bold text-brand uppercase tracking-[0.18em] bg-brand/5 backdrop-blur-sm mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          Conversion directory
        </span>
        <h2 className="font-display text-[clamp(2rem,5vw,3rem)] font-black leading-[1.02] tracking-[-0.03em] text-ink mb-3">
          Browse every conversion
        </h2>
        <p className="text-[clamp(1.05rem,2vw,1.2rem)] leading-relaxed text-muted">
          Searchable directory of every supported format pair. Pick a category, search for your conversion, and go straight to the workspace.
        </p>
      </div>

      <div className="mt-14 flex flex-wrap items-center justify-between gap-4">
        <div className="flex max-w-[420px] items-center gap-2 rounded-[20px] border border-line surface-card px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search formats or conversions…"
            aria-label="Search conversions"
            className="w-full bg-transparent outline-none placeholder:text-faint text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 no-scrollbar">
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

      {filteredGroups.length === 0 && (
        <div className="mt-16 glass rounded-[40px] p-16 text-center border border-line">
          <div className="inline-flex items-center justify-center rounded-full h-20 w-20 bg-brand-soft mb-6">
            <Search className="h-10 w-10 text-brand-strong" />
          </div>
          <h3 className="mb-3 text-xl font-black text-ink">No results</h3>
          <p className="text-muted">
            {query ? `“{query}”` : ""} didn’t match any supported conversion.
          </p>
          <Button variant="ghost" size="sm" onClick={() => setQuery("")} className="mt-6">
            Clear search
          </Button>
        </div>
      )}

      <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {filteredGroups.map((g) => (
            <motion.div
              key={g.label}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="surface-card rounded-[32px] p-7 sm:p-10 card-hover"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-3 w-3 rounded-full bg-gradient-to-r from-brand to-accent" />
                <h3 className="text-sm font-black uppercase tracking-[0.16em] text-muted">{g.label}</h3>
                <span className="ml-auto text-[11px] font-bold text-faint">{g.items.length}</span>
              </div>
              <div className="grid gap-4">
                {g.items.map((item) => (
                  <ToolCard key={`${item.from.id}-to-${item.to.id}`} from={item.from.id} to={item.to.id} />
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Section>
  );
}

export function ToolsCategoryShortcuts() {
  return (
    <Section>
      <div className="max-w-3xl mx-auto text-center mb-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 px-3 py-1 text-[11px] font-bold text-brand uppercase tracking-[0.18em] bg-brand/5 backdrop-blur-sm mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          Browse all tools
        </span>
        <h2 className="font-display text-[clamp(2rem,5vw,3rem)] font-black leading-[1.02] tracking-[-0.03em] text-ink mb-3">
          Browse every conversion
        </h2>
        <p className="text-[clamp(1.05rem,2vw,1.2rem)] leading-relaxed text-muted">
          Searchable directory of supported format paths across categories.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
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
    </Section>
  );
}
