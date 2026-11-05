"use client";

import { SectionHeading } from "@/components/motion-primitives";
import { ConverterWorkspace } from "@/components/workspace/converter";
import { LinkButton } from "@/components/ui";

interface RouteNote {
  note?: string;
}

interface ConverterPageClientProps {
  from: string;
  to: string;
  initialTo?: string;
  route?: RouteNote | null;
}

export default function ConverterPageClient({
  from,
  to,
  initialTo,
  route,
}: ConverterPageClientProps) {
  return (
    <>
      <SectionHeading
        eyebrow="Conversion workspace"
        title={from && to ? `Convert ${from.toUpperCase()} → ${to.toUpperCase()}` : "Convert your files"}
        copy={
          from && to
            ? (route?.note
                ? `${route.note} Upload a ${from.toUpperCase()} file and we'll convert it to ${to.toUpperCase()}.`
                : `Upload a ${from.toUpperCase()} file and we'll convert it to ${to.toUpperCase()}.`)
            : "Drag and drop a file, pick your output format, and convert — all in one workspace."
        }
        align="left"
      />
      <div className="max-w-4xl mx-auto">
        <ConverterWorkspace variant="page" initialTo={initialTo ?? to} />
      </div>
      <div className="mt-12 flex items-center justify-between gap-3">
        <a
          href="/tools"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:border-brand/40 hover:text-ink"
        >
          ↲ Browse all conversions
        </a>
      </div>
    </>
  );
}