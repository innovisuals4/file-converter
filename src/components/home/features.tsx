"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Zap, Layers, Image as ImageIcon, ShieldCheck, Command, Rocket } from "lucide-react";
import { buttonClasses } from "@/components/ui";
import { Section, SectionHeading } from "@/components/motion-primitives";

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
      <SectionHeading
        eyebrow="Built differently"
        title="Why choose Transmute?"
        copy="Every claim here is genuinely implemented — no marketing filler."
        align="center"
      />

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                className="surface-card rounded-3xl p-7 sm:p-9 card-hover"
              >
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2/80 mb-5 border border-line">
                  <Icon className="h-6 w-6 text-muted" />
                </div>
                <h3 className="mb-3 text-lg font-semibold tracking-[-0.01em] text-ink">{f.title}</h3>
                <p className="text-muted leading-relaxed">{f.body}</p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-16 surface-card rounded-3xl p-8 sm:p-10 md:flex md:items-center md:gap-8 card-hover">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand to-brand-strong mb-6 md:mb-0 mr-8 md:mr-0">
          <div className="text-white" aria-hidden>
            <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none"><path d="M5 19L19 5M5 5L19 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </div>
        <div className="max-w-md text-center md:text-left flex-1">
          <h3 className="mb-3 text-lg font-semibold tracking-[-0.01em] text-ink">No software installation required</h3>
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
