"use client";

import { motion, useReducedMotion } from "motion/react";
import { Section, SectionHeading } from "@/components/motion-primitives";

const STEPS = [
  {
    num: "01",
    title: "Upload your file",
    body: "Drag and drop or browse your device — we detect the format automatically.",
    color: "brand",
  },
  {
    num: "02",
    title: "Choose your format",
    body: "Pick any supported output format. We’ll only show valid conversions.",
    color: "accent",
  },
  {
    num: "03",
    title: "Convert & download",
    body: "Run the conversion and grab your file — no waiting, no accounts.",
    color: "emerald",
  },
];

function StepIcon({ num, color }: { num: string; color: string }) {
  return (
    <div className="flex items-center justify-center rounded-full border-2 border-line">
      <span className={`text-[13px] font-bold text-${color}-strong`}>{num}</span>
    </div>
  );
}

export function HowItWorks() {
  const reduce = useReducedMotion();
  return (
    <Section className="border-t border-line/40">
      <SectionHeading
        eyebrow="Three steps"
        title="How Transmute works"
        copy="From upload to download in under a minute."
        align="center"
      />

      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {STEPS.map((step, i) => {
          return (
            <motion.div
              key={step.num}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="surface-card rounded-3xl p-8 sm:p-10 card-hover"
            >
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-surface-2/80 mb-6 border border-line">
                <StepIcon num={step.num} color={step.color} />
              </div>
              <h3 className="mb-3 text-lg font-semibold tracking-[-0.01em] text-ink">{step.title}</h3>
              <p className="text-muted leading-relaxed">{step.body}</p>
              <div className="mt-8 h-[2px] w-12 bg-gradient-to-r from-brand to-transparent rounded-full" />
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
