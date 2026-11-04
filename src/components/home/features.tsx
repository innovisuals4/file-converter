"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Zap, Layers, Image as ImageIcon, ShieldCheck, Command } from "lucide-react";
import { buttonClasses } from "@/components/ui";

const FEATURES = [
  {
    icon: Zap,
    title: "Fast conversion",
    body: "Server-side FFmpeg, Sharp and SheetJS engines with no per-file overhead.",
  },
  {
    icon: Layers,
    title: "Wide format compatibility",
    body: "50+ formats and hundreds of valid conversion paths — documents, images, media, archives, data.",
  },
  {
    icon: ImageIcon,
    title: "High-quality output",
    body: "Lossless options, quality sliders, and high-density vector rasterization.",
  },
  {
    icon: ShieldCheck,
    title: "Secure file handling",
    body: "Files are processed in memory, never indexed, and temporary files are auto-deleted.",
  },
  {
    icon: Zap,
    title: "Simple user experience",
    body: "Drag and drop, pick a format, convert — no installs, no sign-up, no clutter.",
  },
  {
    icon: Command,
    title: "Batch & cross-platform",
    body: "Convert up to 10 files at once and download everything as one ZIP — on any device.",
  },
];

export function Features() {
  const reduce = useReducedMotion();
  return (
    <section className="py-16 lg:pt-20 lg:pb-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[12px] font-medium uppercase tracking-[0.14em] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet-500 to-sky-400" />
            Built differently
          </span>
          <h2 className="font-display text-[clamp(1.75rem,3vw,2.2rem)] font-semibold leading-[1.12] tracking-[-0.025em] text-ink">Why choose Transmute?</h2>
          <p className="mt-4 text-muted">Every claim here is genuinely implemented — no marketing filler.</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={reduce ? false : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl border border-line bg-surface p-7 sm:p-8 card-hover hover:border-brand/50"
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2/60 mb-5 border border-line">
                    <Icon className="h-6 w-6 text-muted" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold tracking-[-0.01em] text-ink">{f.title}</h3>
                  <p className="text-muted leading-relaxed">{f.body}</p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="mt-12 rounded-2xl border border-line bg-surface p-8 sm:p-10 md:flex md:items-center md:gap-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 mb-5 md:mb-0 mr-6 md:mr-0">
            <div className="text-white" aria-hidden>
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none"><path d="M5 19L19 5M5 5L19 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          </div>
          <div className="max-w-md text-center md:text-left">
            <h3 className="mb-2 text-lg font-semibold tracking-[-0.01em] text-ink">No software installation required</h3>
            <p className="text-muted">Everything runs in the browser or on our secure server — nothing to install, nothing to configure.</p>
          </div>
          <Link href="/#convert" className={buttonClasses("primary", "md")}>
            Start Converting
            <span className="ml-2">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
