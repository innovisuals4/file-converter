"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FormatIcon } from "@/lib/format-icons";
import { POPULAR, formatById } from "@/lib/registry";
import { Section, SectionHeading } from "@/components/motion-primitives";
import { Card } from "@/components/ui";

export function PopularConverters() {
  return (
    <Section>
      <SectionHeading
        eyebrow="Hand-picked"
        title="Start with a popular conversion"
        copy="The most common format pairs, ready in one click."
        align="center"
      />

      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {POPULAR.map((p) => {
          const fromFmt = formatById(p.from);
          const toFmt = formatById(p.to);
          return (
            <Card
              key={p.title}
              className="group block card-hover hover:border-brand/50 transition-all duration-300"
            >
              <Link href={`/convert/${p.from}-to-${p.to}`} className="block h-full">
                <div className="flex items-center gap-3 mb-5">
                  <FormatIcon formatId={fromFmt?.id ?? p.from} size="md" />
                  <ArrowRight className="h-4 w-4 shrink-0 text-brand-strong" />
                  <FormatIcon formatId={toFmt?.id ?? p.to} size="md" />
                </div>
                <h3 className="mb-1 text-lg font-semibold tracking-[-0.01em] text-ink">{p.title}</h3>
                <p className="text-sm leading-snug text-muted">{p.desc}</p>
                <span className="mt-6 inline-flex items-center gap-1 text-[11px] font-medium text-muted uppercase tracking-wider">
                  Instant output
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
