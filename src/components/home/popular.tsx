"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FormatIcon } from "@/lib/format-icons";
import { POPULAR, formatById } from "@/lib/registry";
import { cn } from "@/lib/cn";

export function PopularConverters() {
  return (
    <section className="py-16 lg:pt-20 lg:pb-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[12px] font-medium uppercase tracking-[0.14em] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet-500 to-sky-400" />
            Hand-picked
          </span>
          <h2 className="font-display text-[clamp(1.75rem,3vw,2.2rem)] font-semibold leading-[1.12] tracking-[-0.025em] text-ink">Start with a popular conversion</h2>
          <p className="mt-4 text-muted">The most common format pairs, ready in one click.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {POPULAR.map((p) => {
            const fromFmt = formatById(p.from);
            const toFmt = formatById(p.to);
            return (
              <Link
                key={p.title}
                href={`/convert/${p.from}-to-${p.to}`}
                className={cn(
                  "group block rounded-2xl border border-line bg-surface p-5 sm:p-6 card-hover hover:border-brand/50 transition-all duration-300",
                )}
              >
                <div className="flex items-center gap-3 mb-4">
                  <FormatIcon formatId={fromFmt?.id ?? p.from} size="md" />
                  <ArrowRight className="h-4 w-4 shrink-0 text-brand-strong" />
                  <FormatIcon formatId={toFmt?.id ?? p.to} size="md" />
                </div>
                <h3 className="mb-1 text-[16px] font-semibold tracking-[-0.01em] text-ink">{p.title}</h3>
                <p className="text-sm leading-snug text-muted">{p.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-muted">
                  Instant output
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
