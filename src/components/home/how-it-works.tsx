"use client";

import { motion, useReducedMotion } from "motion/react";
import { Section } from "@/components/motion-primitives";

const STEPS = [
  {
    num: "01",
    title: "Upload your file",
    body: "Drag and drop or browse your device — we detect the format automatically.",
  },
  {
    num: "02",
    title: "Choose your format",
    body: "Pick any supported output format. We’ll only show valid conversions.",
  },
  {
    num: "03",
    title: "Convert & download",
    body: "Run the conversion and grab your file — no waiting, no accounts.",
  },
];

function StepIcon({ num }: { num: string }) {
  return (
    <div className="flex items-center justify-center rounded-[20px] border-2 border-brand">
      <span className="text-[14px] font-black text-brand-strong tracking-tight">{num}</span>
    </div>
  );
}

export function HowItWorks() {
  const reduce = useReducedMotion();
  return (
    <Section className="border-t border-line/30 bg-surface/40">
      <div className="max-w-3xl mx-auto text-center mb-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 px-3 py-1 text-[11px] font-bold text-brand uppercase tracking-[0.18em] bg-brand/5 backdrop-blur-sm mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          Three steps
        </span>
        <h2 className="font-display text-[clamp(2rem,5vw,3rem)] font-black leading-[1.02] tracking-[-0.03em] text-ink mb-3">
          How Transmute works
        </h2>
        <p className="text-[clamp(1.05rem,2vw,1.2rem)] leading-relaxed text-muted">
          From upload to download in under a minute.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.num}
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="surface-card rounded-[32px] p-8 sm:p-12 card-hover relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <span className="text-[60px] font-black text-brand">{step.num}</span>
            </div>
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-[20px] bg-surface-2/80 border border-line mb-6">
              <StepIcon num={step.num} />
            </div>
            <h3 className="mb-3 text-lg font-bold tracking-[-0.01em] text-ink">{step.title}</h3>
            <p className="text-muted leading-relaxed">{step.body}</p>
            <div className="mt-8 h-[2px] w-12 bg-gradient-to-r from-brand to-transparent rounded-full" />
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
