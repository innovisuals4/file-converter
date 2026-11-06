"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ShieldCheck, Lock, Clock, UserCheck } from "lucide-react";

const POINTS = [
  {
    icon: Lock,
    title: "Processing happens in memory",
    body: "Uploaded files are never written to permanent disk on our side beyond the brief conversion window.",
  },
  {
    icon: Clock,
    title: "Temporary, auto-deleted",
    body: "All temporary buffers are cleared immediately after the response is sent. Nothing is retained overnight.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy-first",
    body: "Your files aren't scanned, indexed, trained on, or shared. You own the input and the output.",
  },
  {
    icon: UserCheck,
    title: "Validated on both ends",
    body: "Client-side checks catch mistakes early; server-side magic-byte sniffing rejects fakes and corrupted files.",
  },
];

export function Security() {
  const reduce = useReducedMotion();
  return (
    <section className="py-16 lg:pt-20 lg:pb-28 border-t border-line/40 bg-bg-elev/50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[12px] font-medium uppercase tracking-[0.14em] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet-500 to-sky-400" />
            Security & privacy
          </span>
          <h2 className="font-display text-[clamp(1.75rem,3vw,2.2rem)] font-semibold leading-[1.12] tracking-[-0.025em] text-ink">Your files, your privacy</h2>
          <p className="mt-4 text-muted">Transparent handling, not marketing promises.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                  className="rounded-2xl border border-line bg-surface p-7 card-hover"
                >
                  <div className="mb-4">
                    <Icon className="h-6 w-6 text-brand-strong" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold tracking-[-0.01em] text-ink">{p.title}</h3>
                  <p className="text-muted leading-relaxed">{p.body}</p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="mt-14 rounded-2xl border border-line bg-gradient-to-br from-violet-900/10 to-transparent p-8 sm:p-12">
          <h3 className="mb-3 text-lg font-semibold tracking-[-0.01em] text-ink">Honest limits</h3>
          <ul className="space-y-3 text-muted leading-relaxed">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 mt-1 h-3 w-3 rounded-full bg-brand-soft" />
              <span>File size limit is 100 MB per upload (browser memory constraints apply locally).</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 mt-1 h-3 w-3 rounded-full bg-brand-soft" />
              <span>Video/audio conversions run on the server via FFmpeg when available, otherwise privately in your browser via ffmpeg.wasm (~32 MB one-time CDN download).</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 mt-1 h-3 w-3 rounded-full bg-brand-soft" />
              <span>DRM-protected, password-encrypted, or scanned-image PDFs cannot be meaningfully converted.</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
