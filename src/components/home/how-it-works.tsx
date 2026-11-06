"use client";

import { motion, useReducedMotion } from "motion/react";

const STEPS = [
  {
    num: "01",
    icon: FileUp2,
    title: "Upload your file",
    body: "Drag and drop or browse your device — we detect the format automatically.",
  },
  {
    num: "02",
    icon: FormatSelector,
    title: "Choose your format",
    body: "Pick any supported output format. We'll only show valid conversions.",
  },
  {
    num: "03",
    icon: DownloadIcon,
    title: "Convert & download",
    body: "Run the conversion and grab your file — no waiting, no accounts.",
  },
];

function FileUp2({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" className={className}><path d="M4 16v1a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1M7 20l5-5 5 5M12 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function FormatSelector({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" className={className}><path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function DownloadIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function HowItWorks() {
  const reduce = useReducedMotion();
  return (
    <section className="py-16 lg:pt-20 lg:pb-28 border-t border-line/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[12px] font-medium uppercase tracking-[0.14em] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet-500 to-sky-400" />
            Three steps
          </span>
          <h2 className="font-display text-[clamp(1.75rem,3vw,2.2rem)] font-semibold leading-[1.12] tracking-[-0.025em] text-ink">How Transmute works</h2>
          <p className="mt-4 text-muted">From upload to download in under a minute.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border border-line bg-surface p-8 sm:p-10 card-hover hover:border-brand/50"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft mb-5">
                  <Icon className="h-6 w-6 text-brand-strong" />
                </div>
                <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">{step.num}</span>
                <h3 className="mb-2 text-lg font-semibold tracking-[-0.01em] text-ink">{step.title}</h3>
                <p className="text-muted leading-relaxed">{step.body}</p>
                <div className="mt-6 h-[1px] w-12 bg-gradient-to-r from-brand to-transparent" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
