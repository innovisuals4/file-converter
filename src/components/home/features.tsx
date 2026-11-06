"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Zap, Layers, Image as ImageIcon, ShieldCheck, Command, Rocket } from "lucide-react";
import { buttonClasses } from "@/components/ui";
import { Section } from "@/components/motion-primitives";

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
    icon: Command,
    title: "Simple user experience",
    body: "Drag and drop, pick a format, convert — no installs, no sign-up, no clutter.",
  },
  {
    icon: Rocket,
    title: "Batch & cross-platform",
    body: "Convert up to 10 files at once and download everything as one ZIP — on any device.",
  },
];

export function Features() {
  const reduce = useReducedMotion();
  return (
    <Section>
      <div className="max-w-3xl mx-auto text-center mb-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 px-3 py-1 text-[11px] font-bold text-brand uppercase tracking-[0.18em] bg-brand/5 backdrop-blur-sm mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          Built differently
        </span>
        <h2 className="font-display text-[clamp(2rem,5vw,3rem)] font-black leading-[1.02] tracking-[-0.03em] text-ink mb-3">
          Why choose Transmute?
        </h2>
        <p className="text-[clamp(1.05rem,2vw,1.2rem)] leading-relaxed text-muted">
          Every claim here is genuinely implemented — no marketing filler.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                className="surface-card rounded-[32px] p-8 sm:p-10 card-hover relative overflow-hidden"
              >
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-[20px] bg-surface-2/80 border border-line mb-5">
                  <Icon className="h-6 w-6 text-muted" />
                </div>
                <h3 className="mb-3 text-lg font-bold tracking-[-0.01em] text-ink">{f.title}</h3>
                <p className="text-muted leading-relaxed">{f.body}</p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-20 neon-card rounded-[40px] p-8 sm:p-12 md:flex md:items-center md:gap-10 card-hover">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-[28px] bg-gradient-to-br from-brand to-accent mb-6 md:mb-0 mr-8 md:mr-0">
          <div className="text-white" aria-hidden>
            <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none"><path d="M5 19L19 5M5 5L19 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </div>
        <div className="max-w-md text-center md:text-left flex-1">
          <h3 className="mb-3 text-lg font-bold tracking-[-0.01em] text-ink">No software installation required</h3>
          <p className="text-muted">Everything runs in the browser or on our secure server — nothing to install, nothing to configure.</p>
        </div>
        <Link href="/#convert" className={buttonClasses("primary", "md")}>
          Start Converting
          <span className="ml-2">→</span>
        </Link>
      </div>
    </Section>
  );
}
