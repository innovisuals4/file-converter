"use client";

import { useEffect, useState } from "react";
import { SectionHeading } from "@/components/motion-primitives";
import { ConverterWorkspace } from "@/components/workspace/converter";
import { LinkButton } from "@/components/ui";

interface ConverterPageClientProps {
  from: string;
  to: string;
  initialTo?: string;
  route?: { note?: string } | null;
}

export default function ConverterPageClient({
  from,
  to,
  initialTo,
  route,
}: ConverterPageClientProps) {
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydration guard: set mounted after first render to avoid SSR mismatch
  useEffect(() => setMounted(true), []);

  // During SSR, render a minimal placeholder that matches the client structure
  // to avoid hydration mismatch. The actual content renders after mount.
  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto" suppressHydrationWarning>
        <div className="glass gradient-border relative overflow-hidden rounded-3xl p-5 sm:p-7">
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse space-y-4 w-full max-w-md">
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-32 bg-muted rounded" />
              <div className="h-10 bg-muted rounded w-1/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        <LinkButton variant="secondary" href="/tools">
          ↲ Browse all conversions
        </LinkButton>
      </div>
    </>
  );
}
