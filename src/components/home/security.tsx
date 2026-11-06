"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ShieldCheck, Lock, Clock, UserCheck } from "lucide-react";
import { Section, SectionHeading } from "@/components/motion-primitives";

const POINTS = [
  { icon: Lock, title: "Processing in memory", color: "brand", body: "Uploaded files are never written to permanent disk beyond the brief conversion window." },
  { icon: Clock, title: "Auto-deleted", color: "accent", body: "Temporary buffers are cleared immediately after the response. Nothing is retained overnight." },
  { icon: ShieldCheck, title: "Privacy-first", color: "emerald", body: "Your files aren’t scanned, indexed, trained on, or shared. You own the input and output." },
  { icon: UserCheck, title: "Validated both ends", color: "brand", body: "Client-side checks catch mistakes early; server-side magic-byte sniffing rejects fakes and corrupted files." },
];

export function Security() {
  const reduce = useReducedMotion();
  return (
    <Section className="border-t border-line/40 bg-surface/50">
      <SectionHeading
        eyebrow="Security & privacy"
        title="Your files, your privacy"
        copy="Transparent handling, not marketing promises."
        align="center"
      />

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <AnimatePresence>
          {POINTS.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="surface-card rounded-3xl p-7 card-hover"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2/80 mb-4 border border-line">
                  <Icon className="h-6 w-6 text-brand-strong" />
                </div>
                <h3 className="mb-2 text-lg font-semibold tracking-[-0.01em] text-ink">{p.title}</h3>
                <p className="text-muted leading-relaxed">{p.body}</p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-16 rounded-3xl border border-brand/20 bg-gradient-to-br from-brand-soft to-transparent p-8 sm:p-12">
        <h3 className="mb-4 text-lg font-semibold tracking-[-0.01em] text-ink">Honest limits</h3>
        <ul className="space-y-4 text-muted leading-relaxed">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 mt-1.5 h-3 w-3 rounded-full bg-brand-soft" />
            <span>File size limit is 100 MB per upload (browser memory constraints apply locally).</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 mt-1.5 h-3 w-3 rounded-full bg-brand-soft" />
            <span>Video/audio run on the server via FFmpeg when available, otherwise privately in your browser via ffmpeg.wasm (~32 MB one-time CDN download).</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 mt-1.5 h-3 w-3 rounded-full bg-brand-soft" />
            <span>DRM-protected, password-encrypted, or scanned-image PDFs cannot be meaningfully converted.</span>
          </li>
        </ul>
      </div>
    </Section>
  );
}
