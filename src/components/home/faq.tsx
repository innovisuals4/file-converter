"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/cn";

interface FAQ {
  q: string;
  a: string;
}

const FAQS: FAQ[] = [
  {
    q: "Which file formats are supported?",
    a: "Transmute supports 50+ formats across documents, images, video, audio, spreadsheets, presentations, archives, fonts, subtitles, and structured data — with hundreds of valid conversion paths. Browse the full directory at /tools.",
  },
  {
    q: "Is Transmute free to use?",
    a: "Yes — there's no sign-up, no subscription, and no per-file charge. Convert as many files as you like (one at a time, or up to 10 at once with batch).",
  },
  {
    q: "Are there file-size limits?",
    a: "The limit is 100 MB per uploaded file. Very large video files may take longer, especially when processed in the browser.",
  },
  {
    q: "How long does a conversion take?",
    a: "Most images and documents convert in under a second. Audio and video depend on length and server load — you'll see a real progress bar while it works.",
  },
  {
    q: "Are uploaded files secure?",
    a: "Files are processed in memory and temporary data is cleared right after conversion. Nothing is stored permanently, indexed, or shared. See Security & Privacy.",
  },
  {
    q: "Can I convert multiple files at once?",
    a: "Yes — drag up to 10 files into the workspace, pick their common output format, and convert in one go. Download each result or everything as a single ZIP.",
  },
  {
    q: "Why might a conversion fail?",
    a: "Common causes: the file is corrupted or password-protected, uses an unsupported codec (e.g. HEVC variants), or the requested pair isn't supported. We'll show a clear message and the valid alternatives.",
  },
];

export function FAQ() {
  const reduce = useReducedMotion();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section className="py-16 lg:pt-20 lg:pb-28 border-t border-line/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[12px] font-medium uppercase tracking-[0.14em] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet-500 to-sky-400" />
            Questions?
          </span>
          <h2 className="font-display text-[clamp(1.75rem,3vw,2.2rem)] font-semibold leading-[1.12] tracking-[-0.025em] text-ink">Frequently asked questions</h2>
          <p className="mt-4 text-muted">Everything you need to know before converting.</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          <AnimatePresence>
            {FAQS.map((f) => {
              const isOpen = openId === f.q;
              return (
                <motion.div
                  key={f.q}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-line bg-surface overflow-hidden card-hover"
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : f.q)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between px-6 py-4 text-left text-[14px] font-medium text-ink transition-colors hover:bg-surface-2/60"
                  >
                    <HelpCircle className="h-4 w-4 shrink-0 text-muted mr-3" />
                    <span className="flex-1">{f.q}</span>
                    <ChevronDown className={cn("h-4 w-4 shrink-0 text-faint transition-transform duration-300", isOpen && "rotate-180")} />
                  </button>
                  <AnimatePresence mode="wait">
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-4 pt-2 text-sm leading-relaxed text-muted border-t border-line">
                        {f.a}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
