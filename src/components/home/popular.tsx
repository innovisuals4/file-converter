"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FormatIcon } from "@/lib/format-icons";
import { POPULAR, formatById } from "@/lib/registry";
import { Section } from "@/components/motion-primitives";
import { Card } from "@/components/ui";

export function PopularConverters() {
  return (
    <Section>
      <div className="max-w-3xl mx-auto text-center mb-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 px-3 py-1 text-[11px] font-bold text-brand uppercase tracking-[0.18em] bg-brand/5 backdrop-blur-sm mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          Hand-picked
        </span>
        <h2 className="font-display text-[clamp(2rem,5vw,3rem)] font-black leading-[1.02] tracking-[-0.03em] text-ink mb-3">
          Start with a popular conversion
        </h2>
        <p className="text-[clamp(1.05rem,2vw,1.2rem)] leading-relaxed text-muted">
          The most common format pairs, ready in one click.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {POPULAR.map((p) => {
          const fromFmt = formatById(p.from);
          const toFmt = formatById(p.to);
          return (
            <Card
              key={p.title}
              className="group block card-hover hover:border-brand/50 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <Link href={`/convert/${p.from}-to-${p.to}`} className="block h-full relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-[20px] bg-surface-2/80 border border-line flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all duration-300">
                    <FormatIcon formatId={fromFmt?.id ?? p.from} size="md" />
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-brand-strong group-hover:text-accent transition-colors" />
                  <div className="h-12 w-12 rounded-[20px] bg-surface-2/80 border border-line flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all duration-300">
                    <FormatIcon formatId={toFmt?.id ?? p.to} size="md" />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-black tracking-[-0.01em] text-ink group-hover:text-brand transition-colors">{p.title}</h3>
                <p className="text-sm leading-snug text-muted">{p.desc}</p>
                <span className="mt-auto inline-flex items-center gap-1 text-[11px] font-bold text-muted uppercase tracking-wider mt-6">
                  Instant output
                  <ArrowRight className="h-3 w-3 text-brand" />
                </span>
              </Link>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
